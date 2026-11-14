import { create } from 'zustand';
import type {
  AnatomicalSystem,
  MetricKey,
  ReadinessBreakdown,
  TriageDiagnosisOutput,
  VitalReadingInput,
} from '@aura/medical-engine';
import {
  calculateMissionReadiness,
  evaluateAllMetrics,
  runAutonomousTriage,
} from '@aura/medical-engine';
import {
  CountermeasureService,
  DB_CONFIG,
  DEFAULT_DAILY_MISSIONS,
  DtnCommsService,
  broadcastBusMessage,
  TelemetryService,
  TriageService,
  type DailyMissionDocument,
  type PersistedAlertDocument,
} from '@aura/appwrite-client';
import { generateClinicalDossierPdf } from '../services/PdfReportGenerator';
import { useAuthStore } from './useAuthStore';
import { useOfflineSyncStore } from './useOfflineSyncStore';

export interface MedicalState {
  currentVital: VitalReadingInput;
  vitalHistory: VitalReadingInput[];
  activeAlert: PersistedAlertDocument | TriageDiagnosisOutput | null;
  dailyMissions: DailyMissionDocument[];
  readiness: ReadinessBreakdown;
  selectedSystem: AnatomicalSystem | 'all' | null;
  selectedMetric: MetricKey;
  activeGuideId: string | null;
  isExamModalOpen: boolean;
  isInitialized: boolean;

  // Actions
  initializeMedicalState: () => Promise<void>;
  applyIngestedTelemetry: (
    vitalDoc: VitalReadingInput,
    alertDoc?: PersistedAlertDocument | TriageDiagnosisOutput | null,
  ) => void;
  toggleCountermeasure: (taskId: string, isCompleted: boolean) => Promise<void>;
  resolveActiveAlert: () => Promise<void>;
  setSelectedSystem: (sys: AnatomicalSystem | 'all' | null) => void;
  setSelectedMetric: (metric: MetricKey) => void;
  openVisualGuide: (guideId: string) => void;
  closeVisualGuide: () => void;
  setExamModalOpen: (open: boolean) => void;
}

const DEFAULT_VITAL: VitalReadingInput = {
  astronaut_id: 'AST-CDR-01',
  mission_phase: 'EARLY_ORBIT_ADAPTATION',
  heart_rate: 62,
  bp_systolic: 122,
  bp_diastolic: 68,
  blood_glucose: 95,
  body_temp: 36.8,
  spo2: 98,
  sleep_hours: 7.5,
  mood_score: 9,
  cabin_co2_mmhg: 2.4,
  cabin_radiation_msv: 0.3,
  ingestion_source: 'LIVE_STREAM',
  $createdAt: new Date().toISOString(),
};

function generateInitialHistory(current: VitalReadingInput): VitalReadingInput[] {
  const history: VitalReadingInput[] = [];
  const baseTime = Date.now() - 15 * 60 * 1000;

  for (let i = 0; i < 15; i++) {
    const jitter = Math.sin(i * 0.5) * 2;
    history.push({
      ...current,
      $id: `hist_${i}`,
      heart_rate: Math.round(current.heart_rate + jitter),
      bp_systolic: Math.round(current.bp_systolic + jitter),
      bp_diastolic: Math.round(current.bp_diastolic + jitter * 0.5),
      blood_glucose: Math.round((current.blood_glucose + jitter * 0.8) * 10) / 10,
      body_temp: Math.round((current.body_temp + (jitter * 0.05)) * 100) / 100,
      spo2: Math.min(100, Math.max(90, Math.round(current.spo2 + (i % 2 === 0 ? 0 : -1)))),
      cabin_co2_mmhg: Math.round((current.cabin_co2_mmhg + jitter * 0.1) * 10) / 10,
      cabin_radiation_msv: current.cabin_radiation_msv,
      $createdAt: new Date(baseTime + i * 60 * 1000).toISOString(),
    });
  }
  history.push(current);
  return history;
}

export const useMedicalStore = create<MedicalState>((set, get) => {
  // Pre-calculate initial readiness
  const initialProfile = useAuthStore.getState().profile;
  const initialEvals = evaluateAllMetrics(
    DEFAULT_VITAL,
    initialProfile.earthBaselines,
    initialProfile.missionPhase,
  );
  const initialReadiness = calculateMissionReadiness({
    evaluations: initialEvals,
    completedTasksCount: DEFAULT_DAILY_MISSIONS.filter((m) => m.is_completed).length,
    totalTasksCount: DEFAULT_DAILY_MISSIONS.length,
    sleepHours: DEFAULT_VITAL.sleep_hours,
    moodScore: DEFAULT_VITAL.mood_score,
  });

  return {
    currentVital: DEFAULT_VITAL,
    vitalHistory: generateInitialHistory(DEFAULT_VITAL),
    activeAlert: null,
    dailyMissions: [...DEFAULT_DAILY_MISSIONS],
    readiness: initialReadiness,
    selectedSystem: null,
    selectedMetric: 'heart_rate',
    activeGuideId: null,
    isExamModalOpen: false,
    isInitialized: false,

    initializeMedicalState: async () => {
      try {
        const astronautId = useAuthStore.getState().profile.astronautId || 'AST-CDR-01';

        const [missions, remoteControl, remoteVitals, remoteAlerts] = await Promise.all([
          CountermeasureService.listDailyMissions(astronautId),
          DB_CONFIG.IS_CONFIGURED
            ? DtnCommsService.fetchRemoteControlState(astronautId)
            : Promise.resolve(null),
          DB_CONFIG.IS_CONFIGURED
            ? TelemetryService.fetchRecentVitals(astronautId, 20)
            : Promise.resolve([]),
          DB_CONFIG.IS_CONFIGURED
            ? TriageService.getActiveAlerts(astronautId)
            : Promise.resolve([]),
        ]);

        if (remoteControl) {
          if (remoteControl.missionPhase || remoteControl.earthBaselines) {
            useAuthStore.getState().applyRemoteProfile({
              missionPhase: remoteControl.missionPhase,
              earthBaselines: remoteControl.earthBaselines,
            });
          }
          if (remoteControl.commsMode) {
            useOfflineSyncStore.getState().applyRemoteCommsMode(remoteControl.commsMode);
          }
        }

        const storedHistory =
          remoteVitals.length > 0
            ? [...remoteVitals].reverse()
            : TelemetryService.getLocalHistory();
        const activeAlert =
          remoteAlerts.length > 0 ? remoteAlerts[0] : TelemetryService.getActiveAlert();

        const currentVital =
          storedHistory.length > 0
            ? storedHistory[storedHistory.length - 1]
            : get().currentVital;

        const effectiveHistory =
          storedHistory.length > 0 ? (storedHistory as any) : get().vitalHistory;

        const profile = useAuthStore.getState().profile;
        const evals = evaluateAllMetrics(
          currentVital,
          profile.earthBaselines,
          profile.missionPhase,
        );

        const readiness = calculateMissionReadiness({
          evaluations: evals,
          completedTasksCount: missions.filter((m) => m.is_completed).length,
          totalTasksCount: missions.length,
          sleepHours: currentVital.sleep_hours,
          moodScore: currentVital.mood_score,
        });

        const effectiveAlert =
          activeAlert && activeAlert.severity !== 'green' && activeAlert.affected_system !== 'nominal'
            ? activeAlert
            : null;

        set({
          dailyMissions: missions,
          currentVital,
          vitalHistory: effectiveHistory,
          activeAlert: effectiveAlert,
          readiness,
          selectedSystem: effectiveAlert ? effectiveAlert.affected_system : null,
          isInitialized: true,
        });
      } catch (err) {
        console.warn('initializeMedicalState fallback error:', err);
        set({ isInitialized: true });
      }
    },

    applyIngestedTelemetry: (vitalDoc, alertDoc) => {
      const profile = useAuthStore.getState().profile;
      const missions = get().dailyMissions;
      const incompleteCodes = missions
        .filter((m) => !m.is_completed)
        .map((m) => m.task_code);

      // Evaluate alert if not passed directly
      let computedAlert = alertDoc;
      if (!computedAlert) {
        computedAlert = runAutonomousTriage(
          vitalDoc,
          profile.earthBaselines,
          vitalDoc.mission_phase || profile.missionPhase,
          incompleteCodes,
        );
      }

      // Check if alert is nominal / green
      const isNominal = !computedAlert || computedAlert.severity === 'green' || computedAlert.affected_system === 'nominal';
      const effectiveAlert = isNominal ? null : computedAlert;

      // Calculate readiness
      const evals = evaluateAllMetrics(
        vitalDoc,
        profile.earthBaselines,
        vitalDoc.mission_phase || profile.missionPhase,
      );
      const readiness = calculateMissionReadiness({
        evaluations: evals,
        completedTasksCount: missions.filter((m) => m.is_completed).length,
        totalTasksCount: missions.length,
        sleepHours: vitalDoc.sleep_hours,
        moodScore: vitalDoc.mood_score,
      });

      // Update ring buffer (max 30 items, deduplicated by vital $id)
      const prevHistory = get().vitalHistory;
      const alreadyRecorded = Boolean(
        vitalDoc.$id && prevHistory.some((h) => h.$id === vitalDoc.$id),
      );
      const newHistory = alreadyRecorded
        ? prevHistory.map((h) => (h.$id === vitalDoc.$id ? vitalDoc : h))
        : [...prevHistory.slice(-29), vitalDoc];

      set({
        currentVital: vitalDoc,
        vitalHistory: newHistory,
        activeAlert: effectiveAlert,
        readiness,
        selectedSystem: effectiveAlert ? effectiveAlert.affected_system : null,
      });

      // Autonomous Earth DTN / Offline Blackout Queueing when notify_earth is flagged
      const offlineSync = useOfflineSyncStore.getState();
      if (offlineSync.commsMode === 'SOLAR_BLACKOUT') {
        void offlineSync.queueOfflineVital({
          ...vitalDoc,
          edge_alert_id: effectiveAlert?.$id || vitalDoc.edge_alert_id || null,
        });
      }
      if (effectiveAlert?.notify_earth) {
        const alertKey =
          (effectiveAlert as PersistedAlertDocument).$id ||
          `${effectiveAlert.diagnosis_code}_${vitalDoc.$id || Date.now()}`;
        const { blob, fileName } = generateClinicalDossierPdf(
          profile,
          vitalDoc,
          {
            ...effectiveAlert,
            guide_file_id: effectiveAlert.guide_file_id ?? null,
          },
        );
        void offlineSync.enqueueMedicalDossier({
          alertId: alertKey,
          telemetryJson: JSON.stringify({ vital: vitalDoc, alert: effectiveAlert }),
          reportBlob: blob,
          fileName,
        });
      }
    },

    toggleCountermeasure: async (taskId: string, isCompleted: boolean) => {
      const prevMissions = get().dailyMissions;
      const updatedMissions = prevMissions.map((m) => {
        if (m.$id === taskId || m.task_code === taskId) {
          return {
            ...m,
            is_completed: isCompleted,
            streak_days: isCompleted ? m.streak_days + 1 : Math.max(0, m.streak_days - 1),
          };
        }
        return m;
      });

      // Recalculate incomplete tasks
      const incompleteCodes = updatedMissions
        .filter((m) => !m.is_completed)
        .map((m) => m.task_code);

      const currentVital = get().currentVital;
      const profile = useAuthStore.getState().profile;

      // Re-run autonomous triage with updated incomplete tasks
      // Completing HYDRATION_2500ML or ARED_WORKOUT dynamically clears corresponding dehydration/musculoskeletal alert!
      const recomputedAlert = runAutonomousTriage(
        currentVital,
        profile.earthBaselines,
        currentVital.mission_phase || profile.missionPhase,
        incompleteCodes,
      );

      const isNominal =
        !recomputedAlert ||
        recomputedAlert.severity === 'green' ||
        recomputedAlert.affected_system === 'nominal';

      const effectiveAlert = isNominal ? null : recomputedAlert;

      // Recalculate readiness score
      const evals = evaluateAllMetrics(
        currentVital,
        profile.earthBaselines,
        currentVital.mission_phase || profile.missionPhase,
      );
      const recomputedReadiness = calculateMissionReadiness({
        evaluations: evals,
        completedTasksCount: updatedMissions.filter((m) => m.is_completed).length,
        totalTasksCount: updatedMissions.length,
        sleepHours: currentVital.sleep_hours,
        moodScore: currentVital.mood_score,
      });

      set({
        dailyMissions: updatedMissions,
        activeAlert: effectiveAlert,
        readiness: recomputedReadiness,
        selectedSystem: effectiveAlert ? effectiveAlert.affected_system : null,
      });

      try {
        await CountermeasureService.toggleMissionCompletion(taskId, isCompleted);
      } catch (err) {
        console.warn('CountermeasureService.toggleMissionCompletion warning:', err);
      }
    },

    resolveActiveAlert: async () => {
      const activeAlert = get().activeAlert;
      if (activeAlert && (activeAlert as PersistedAlertDocument).$id) {
        try {
          await TriageService.resolveAlert((activeAlert as PersistedAlertDocument).$id);
        } catch {
          // handled offline
        }
      }

      const currentVital = get().currentVital;
      const profile = useAuthStore.getState().profile;
      const missions = get().dailyMissions;
      const evals = evaluateAllMetrics(
        currentVital,
        profile.earthBaselines,
        currentVital.mission_phase || profile.missionPhase,
      );
      const readiness = calculateMissionReadiness({
        evaluations: evals,
        completedTasksCount: missions.filter((m) => m.is_completed).length,
        totalTasksCount: missions.length,
        sleepHours: currentVital.sleep_hours,
        moodScore: currentVital.mood_score,
      });

      set({
        activeAlert: null,
        selectedSystem: null,
        readiness,
      });

      broadcastBusMessage({
        type: 'ALERT_RESOLVED',
        payload: { alertId: activeAlert ? (activeAlert as any).$id || 'local_alert' : 'all' },
      });
    },

    setSelectedSystem: (sys) => set({ selectedSystem: sys }),
    setSelectedMetric: (metric) => set({ selectedMetric: metric }),
    openVisualGuide: (guideId) => set({ activeGuideId: guideId, isExamModalOpen: true }),
    closeVisualGuide: () => set({ activeGuideId: null, isExamModalOpen: false }),
    setExamModalOpen: (open) => set({ isExamModalOpen: open }),
  };
});
