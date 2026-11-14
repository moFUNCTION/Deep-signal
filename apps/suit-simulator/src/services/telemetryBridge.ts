import {
  DEFAULT_ASTRONAUT_PREFS,
  DEFAULT_DAILY_MISSIONS,
  DistanceCommsMode,
  EarthBaselines,
  MissionPhase,
  runAutonomousTriage,
  TriageDiagnosisOutput,
  VitalReadingInput,
} from '@aura/medical-engine';
import {
  AuthCalibrationService,
  CONTROL_SYNC_ALERT_ID,
  CountermeasureService,
  DB_CONFIG,
  DtnCommsService,
  TelemetryService,
  appwriteClient,
  broadcastBusMessage,
  localBus,
  safeLocalStorageSet,
  type BusMessage,
} from '@aura/appwrite-client';

const LOCAL_PREFS_KEY = 'aura_astronaut_prefs';
const LOCAL_MISSIONS_KEY = 'aura_daily_missions';
const LOCAL_VITALS_KEY = 'aura_vitals_history';
const LOCAL_ALERT_KEY = 'aura_active_alert';
const LOCAL_COMMS_KEY = 'aura_comms_mode';

export interface TelemetryBusEvent {
  type:
    | 'TELEMETRY_SAMPLE'
    | 'TELEMETRY_INGESTED'
    | 'TRIAGE_ALERT'
    | 'BASELINE_CHANGE'
    | 'MISSION_PHASE_CHANGE'
    | 'COMMS_MODE_UPDATED'
    | 'MISSIONS_UPDATED'
    | 'TASK_UPDATE'
    | 'PREFS_UPDATED'
    | 'ALERT_RESOLVED';
  payload: any;
}

class TelemetryBridge {
  private messageListeners: Set<(event: TelemetryBusEvent) => void> = new Set();

  constructor() {
    localBus.subscribe((msg: BusMessage) => {
      const event = msg as unknown as TelemetryBusEvent;
      this.notifyListeners(event);
    });

    if (typeof window !== 'undefined' && DB_CONFIG.IS_CONFIGURED && DB_CONFIG.DATABASE_ID) {
      try {
        const channels = [
          `databases.${DB_CONFIG.DATABASE_ID}.collections.${DB_CONFIG.COLLECTIONS.VITALS_LOGS}.documents`,
          `databases.${DB_CONFIG.DATABASE_ID}.collections.${DB_CONFIG.COLLECTIONS.DAILY_MISSIONS}.documents`,
          `databases.${DB_CONFIG.DATABASE_ID}.collections.${DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS}.documents`,
        ];

        appwriteClient.subscribe(channels, (response: any) => {
          const payload = response.payload;
          if (!payload) return;

          if (response.events.some((e: string) => e.includes('.vitals_logs.documents.'))) {
            this.notifyListeners({ type: 'TELEMETRY_SAMPLE', payload });
          } else if (response.events.some((e: string) => e.includes('.daily_missions.documents.'))) {
            const currentMissions = this.getDailyMissions();
            const updated = currentMissions.map((m: any) =>
              m.$id === payload.$id || m.task_code === payload.task_code ? { ...m, ...payload } : m,
            );
            localStorage.setItem(LOCAL_MISSIONS_KEY, JSON.stringify(updated));
            this.notifyListeners({ type: 'MISSIONS_UPDATED', payload: updated });
          } else if (
            response.events.some((e: string) => e.includes('.earth_transmissions.documents.')) &&
            payload.alert_id === CONTROL_SYNC_ALERT_ID &&
            payload.telemetry_json
          ) {
            try {
              const remote = JSON.parse(payload.telemetry_json);
              const currentProfile = this.getProfile();
              const nextProfile = {
                ...currentProfile,
                ...(remote.missionPhase ? { missionPhase: remote.missionPhase } : {}),
                ...(remote.earthBaselines ? { earthBaselines: remote.earthBaselines } : {}),
              };
              localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(nextProfile));
              this.notifyListeners({ type: 'PREFS_UPDATED', payload: nextProfile });

              if (remote.commsMode) {
                safeLocalStorageSet(LOCAL_COMMS_KEY, remote.commsMode);
                this.notifyListeners({
                  type: 'COMMS_MODE_UPDATED',
                  payload: { commsMode: remote.commsMode },
                });
              }
            } catch {
              // ignore malformed control payload
            }
          }
        });
      } catch {
        // Offline / unconfigured fallback handled cleanly
      }
    }
  }

  private notifyListeners(event: TelemetryBusEvent): void {
    this.messageListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in telemetry bus listener:', err);
      }
    });
  }

  public subscribe(listener: (event: TelemetryBusEvent) => void): () => void {
    this.messageListeners.add(listener);
    return () => {
      this.messageListeners.delete(listener);
    };
  }

  public getProfile() {
    if (typeof window === 'undefined') return DEFAULT_ASTRONAUT_PREFS;
    const raw = localStorage.getItem(LOCAL_PREFS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const unwrapped = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
        if (unwrapped && typeof unwrapped === 'object' && !Array.isArray(unwrapped)) {
          if (typeof parsed === 'string') {
            safeLocalStorageSet(LOCAL_PREFS_KEY, unwrapped);
          }
          return unwrapped;
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_ASTRONAUT_PREFS;
  }

  public getDailyMissions() {
    if (typeof window === 'undefined') return DEFAULT_DAILY_MISSIONS;
    const raw = localStorage.getItem(LOCAL_MISSIONS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const unwrapped = typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
        if (Array.isArray(unwrapped)) {
          if (typeof parsed === 'string') {
            safeLocalStorageSet(LOCAL_MISSIONS_KEY, unwrapped);
          }
          return unwrapped;
        }
      } catch {
        // fallback
      }
    }
    return DEFAULT_DAILY_MISSIONS;
  }

  public async broadcastTelemetry(
    reading: VitalReadingInput,
    overrideAlert?: TriageDiagnosisOutput,
  ) {
    const profile = this.getProfile();
    const missions = this.getDailyMissions();
    const incompleteTasks = missions
      .filter((m: any) => !m.is_completed)
      .map((m: any) => m.task_code);

    const alertResult =
      overrideAlert ||
      runAutonomousTriage(
        reading,
        profile.earthBaselines || DEFAULT_ASTRONAUT_PREFS.earthBaselines,
        reading.mission_phase,
        incompleteTasks,
      );

    const vitalId = reading.$id || `vital_${Date.now()}`;
    const alertId = reading.edge_alert_id || `alert_${Date.now()}`;
    const timestamp = reading.$createdAt || new Date().toISOString();

    const vitalDoc: VitalReadingInput = {
      ...reading,
      $id: vitalId,
      edge_alert_id: alertId,
      $createdAt: timestamp,
    };

    const alertDoc = {
      ...alertResult,
      $id: alertId,
      astronaut_id: reading.astronaut_id || profile.astronautCode || 'AST-CDR-01',
      vital_log_id: vitalId,
      is_resolved: false,
      $createdAt: timestamp,
    };

    // Update local ring buffer (max 30 readings)
    if (typeof window !== 'undefined') {
      try {
        const rawHistory = localStorage.getItem(LOCAL_VITALS_KEY);
        const history: VitalReadingInput[] = rawHistory ? JSON.parse(rawHistory) : [];
        const nextHistory = [...history.slice(-29), vitalDoc];
        localStorage.setItem(LOCAL_VITALS_KEY, JSON.stringify(nextHistory));
        localStorage.setItem(LOCAL_ALERT_KEY, JSON.stringify(alertDoc));
      } catch (e) {
        console.warn('LocalStorage vitals update error:', e);
      }
    }

    // Broadcast across all connected tabs (astronaut-hud <-> suit-simulator)
    this.postMessage({
      type: 'TELEMETRY_INGESTED',
      payload: { vitalDoc, alertDoc },
    });

    this.postMessage({
      type: 'TELEMETRY_SAMPLE',
      payload: vitalDoc,
    });

    this.postMessage({
      type: 'TRIAGE_ALERT',
      payload: alertDoc,
    });

    // Always persist suit telemetry to Appwrite Cloud so HUD stays synced even during simulated SOLAR_BLACKOUT
    try {
      await TelemetryService.ingestVitalReading(vitalDoc, { forceCloudSync: true });
    } catch {
      // Offline fallback succeeded
    }

    return { vitalDoc, alertDoc };
  }

  public async broadcastBaselineChange(
    earthBaselines: EarthBaselines,
    missionPhase: MissionPhase,
  ) {
    const currentProfile = this.getProfile();
    const updated = {
      ...currentProfile,
      earthBaselines,
      missionPhase,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(updated));
    }

    this.postMessage({
      type: 'BASELINE_CHANGE',
      payload: { earthBaselines, missionPhase },
    });

    this.postMessage({
      type: 'MISSION_PHASE_CHANGE',
      payload: { missionPhase },
    });

    this.postMessage({
      type: 'PREFS_UPDATED',
      payload: updated,
    });

    try {
      await AuthCalibrationService.updateEarthBaselines(earthBaselines);
      await AuthCalibrationService.setMissionPhase(missionPhase);
    } catch {
      // Offline handled
    }

    return updated;
  }

  public async broadcastMissionPhaseChange(missionPhase: MissionPhase) {
    const currentProfile = this.getProfile();
    const updated = {
      ...currentProfile,
      missionPhase,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(updated));
    }

    this.postMessage({
      type: 'MISSION_PHASE_CHANGE',
      payload: { missionPhase },
    });

    this.postMessage({
      type: 'PREFS_UPDATED',
      payload: updated,
    });

    try {
      await AuthCalibrationService.setMissionPhase(missionPhase);
    } catch {
      // Offline handled
    }

    return updated;
  }

  public broadcastCommsMode(commsMode: DistanceCommsMode) {
    safeLocalStorageSet(LOCAL_COMMS_KEY, commsMode);
    return DtnCommsService.setCommsMode(commsMode);
  }

  public async hydrateFromCloud(): Promise<{
    earthBaselines: EarthBaselines;
    missionPhase: MissionPhase;
    commsMode?: DistanceCommsMode;
    latestVital?: VitalReadingInput;
  } | null> {
    if (typeof window === 'undefined' || !DB_CONFIG.IS_CONFIGURED || !DB_CONFIG.DATABASE_ID) {
      return null;
    }

    const currentProfile = this.getProfile();
    const astronautCode = currentProfile.astronautCode || 'AST-CDR-01';

    try {
      const [missions, remoteControl, recentVitals] = await Promise.all([
        CountermeasureService.listDailyMissions(astronautCode),
        DtnCommsService.fetchRemoteControlState(astronautCode),
        TelemetryService.fetchRecentVitals(astronautCode, 1),
      ]);

      if (missions && missions.length > 0) {
        safeLocalStorageSet(LOCAL_MISSIONS_KEY, missions);
        this.notifyListeners({ type: 'MISSIONS_UPDATED', payload: missions });
      }

      let earthBaselines: EarthBaselines =
        currentProfile.earthBaselines || DEFAULT_ASTRONAUT_PREFS.earthBaselines;
      let missionPhase: MissionPhase =
        currentProfile.missionPhase || DEFAULT_ASTRONAUT_PREFS.missionPhase;
      let commsMode: DistanceCommsMode | undefined;

      if (remoteControl) {
        if (remoteControl.earthBaselines) {
          earthBaselines = remoteControl.earthBaselines;
        }
        if (remoteControl.missionPhase) {
          missionPhase = remoteControl.missionPhase;
        }
        if (remoteControl.commsMode) {
          commsMode = remoteControl.commsMode;
          safeLocalStorageSet(LOCAL_COMMS_KEY, commsMode);
          this.notifyListeners({
            type: 'COMMS_MODE_UPDATED',
            payload: { commsMode },
          });
        }

        const nextProfile = {
          ...currentProfile,
          earthBaselines,
          missionPhase,
        };
        safeLocalStorageSet(LOCAL_PREFS_KEY, nextProfile);
        this.notifyListeners({ type: 'PREFS_UPDATED', payload: nextProfile });
      }

      const latestVital = recentVitals?.[0];
      if (latestVital) {
        this.notifyListeners({ type: 'TELEMETRY_SAMPLE', payload: latestVital });
      }

      return {
        earthBaselines,
        missionPhase,
        commsMode,
        latestVital,
      };
    } catch {
      return null;
    }
  }

  public async broadcastTaskCompletion(taskCode: string, isCompleted: boolean) {
    const missions = this.getDailyMissions();
    const updated = missions.map((m: any) => {
      if (m.task_code === taskCode || m.$id === taskCode) {
        return {
          ...m,
          is_completed: isCompleted,
          streak_days: isCompleted ? (m.streak_days || 0) + 1 : Math.max(0, (m.streak_days || 1) - 1),
        };
      }
      return m;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_MISSIONS_KEY, JSON.stringify(updated));
    }

    this.postMessage({
      type: 'MISSIONS_UPDATED',
      payload: updated,
    });

    this.postMessage({
      type: 'TASK_UPDATE',
      payload: { taskId: taskCode, isCompleted },
    });

    try {
      await CountermeasureService.toggleMissionCompletion(taskCode, isCompleted);
    } catch {
      // Handled
    }

    return updated;
  }

  public async setAllTasks(isCompleted: boolean) {
    const missions = this.getDailyMissions();
    const updated = missions.map((m: any) => ({
      ...m,
      is_completed: isCompleted,
    }));

    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_MISSIONS_KEY, JSON.stringify(updated));
    }

    this.postMessage({
      type: 'MISSIONS_UPDATED',
      payload: updated,
    });

    return updated;
  }

  private postMessage(event: TelemetryBusEvent) {
    try {
      broadcastBusMessage(event as unknown as BusMessage);
    } catch (err) {
      console.warn('Failed to postMessage on telemetry bus:', err);
    }
  }
}

export const telemetryBridge = new TelemetryBridge();
