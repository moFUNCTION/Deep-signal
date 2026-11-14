import { useEffect, useState, useRef } from 'react';
import {
  appwriteClient,
  DB_CONFIG,
  localBus,
} from '@aura/appwrite-client';
import type { DistanceCommsMode, MissionPhase } from '@aura/medical-engine';
import { useAuthStore } from '../store/useAuthStore';
import { useMedicalStore } from '../store/useMedicalStore';
import { useOfflineSyncStore } from '../store/useOfflineSyncStore';

export interface RealtimeStatus {
  isLocalBusConnected: boolean;
  isAppwriteConnected: boolean;
  lastEventTimestamp: string | null;
  commsMode: DistanceCommsMode;
}

export function useAppwriteRealtime(): RealtimeStatus {
  const [isLocalBusConnected, setIsLocalBusConnected] = useState<boolean>(true);
  const [isAppwriteConnected, setIsAppwriteConnected] = useState<boolean>(false);
  const [lastEventTimestamp, setLastEventTimestamp] = useState<string | null>(null);

  const commsMode = useOfflineSyncStore((s) => s.commsMode);
  const tickIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Initialize Stores on mount
    useAuthStore.getState().loadProfile();
    useMedicalStore.getState().initializeMedicalState();
    useOfflineSyncStore.getState().initializeQueue();

    // 2. Start DTN 1-second transmission tick interval
    const interval = window.setInterval(() => {
      useOfflineSyncStore.getState().tickTransmissions();
    }, 1000);
    tickIntervalRef.current = interval;

    // 3. Listen to local SafeBroadcastBus
    const handleBusMessage = (data: any) => {
      if (!data || !data.type) return;

      const now = new Date().toISOString();
      setLastEventTimestamp(now);

      switch (data.type) {
        case 'TELEMETRY_SAMPLE':
        case 'TELEMETRY_INGESTED': {
          const vital = data.payload?.vitalDoc || data.payload?.vital || data.payload?.vitalReading || data.payload;
          const alert = data.payload?.alert || data.payload?.alertDoc || null;
          if (vital) {
            useMedicalStore.getState().applyIngestedTelemetry(vital, alert);
          }
          break;
        }

        case 'TRIAGE_ALERT': {
          const alert = data.payload?.alert || data.payload;
          if (alert) {
            const isNominal =
              alert.severity === 'green' || alert.affected_system === 'nominal';
            useMedicalStore.setState({
              activeAlert: isNominal ? null : alert,
              selectedSystem: isNominal ? null : alert.affected_system,
            });
          }
          break;
        }

        case 'TASK_UPDATE':
        case 'MISSIONS_UPDATED': {
          const missions = data.payload?.missions || data.payload;
          if (Array.isArray(missions)) {
            useMedicalStore.setState({ dailyMissions: missions });
            const vital = useMedicalStore.getState().currentVital;
            useMedicalStore.getState().applyIngestedTelemetry(vital);
          }
          break;
        }

        case 'BASELINE_CHANGE': {
          const baselines = data.payload?.earthBaselines || data.payload;
          if (baselines) {
            useAuthStore.getState().updateBaselines(baselines);
          }
          break;
        }

        case 'MISSION_PHASE_CHANGE': {
          const phase = data.payload?.missionPhase || data.payload?.phase;
          if (phase) {
            useAuthStore.getState().setMissionPhase(phase as MissionPhase);
          }
          break;
        }

        case 'PREFS_UPDATED': {
          const profile = data.payload;
          if (profile) {
            useAuthStore.getState().setProfile(profile);
          }
          break;
        }

        case 'COMMS_MODE_UPDATED': {
          const mode = data.payload?.commsMode || data.payload?.distanceMode || data.payload?.mode;
          if (mode) {
            useOfflineSyncStore.getState().setCommsMode(mode as DistanceCommsMode);
          }
          break;
        }

        case 'ALERT_RESOLVED': {
          useMedicalStore.setState({ activeAlert: null, selectedSystem: null });
          break;
        }

        default:
          break;
      }
    };

    let unsubscribeLocalBus: (() => void) | null = null;
    if (localBus && typeof localBus.subscribe === 'function') {
      unsubscribeLocalBus = localBus.subscribe(handleBusMessage);
      setIsLocalBusConnected(true);
    }

    // 4. Connect to Appwrite Realtime WebSocket (only if cloud project is configured)
    let unsubscribeAppwrite: (() => void) | null = null;
    if (DB_CONFIG.IS_CONFIGURED) {
      try {
        if (appwriteClient && DB_CONFIG.DATABASE_ID) {
          const channels = [
            `databases.${DB_CONFIG.DATABASE_ID}.collections.${DB_CONFIG.COLLECTIONS.VITALS_LOGS}.documents`,
            `databases.${DB_CONFIG.DATABASE_ID}.collections.${DB_CONFIG.COLLECTIONS.TRIAGE_ALERTS}.documents`,
            `databases.${DB_CONFIG.DATABASE_ID}.collections.${DB_CONFIG.COLLECTIONS.DAILY_MISSIONS}.documents`,
          ];

          unsubscribeAppwrite = appwriteClient.subscribe(channels, (response) => {
            setLastEventTimestamp(new Date().toISOString());
            setIsAppwriteConnected(true);

            const payload = response.payload as any;
            if (!payload) return;

            // Vitals document created
            if (response.events.some((e) => e.includes('.vitals_logs.documents.'))) {
              useMedicalStore.getState().applyIngestedTelemetry(payload);
            }
            // Alert created or updated
            else if (response.events.some((e) => e.includes('.triage_alerts.documents.'))) {
              if (payload.is_resolved) {
                useMedicalStore.setState({ activeAlert: null, selectedSystem: null });
              } else {
                useMedicalStore.setState({
                  activeAlert: payload,
                  selectedSystem: payload.affected_system,
                });
              }
            }
            // Mission updated
            else if (response.events.some((e) => e.includes('.daily_missions.documents.'))) {
              const currentMissions = useMedicalStore.getState().dailyMissions;
              const updated = currentMissions.map((m) => (m.$id === payload.$id ? payload : m));
              useMedicalStore.setState({ dailyMissions: updated });
            }
          });
        }
      } catch (err) {
        console.info('Appwrite Realtime WebSocket offline or unconfigured, utilizing local bus.', err);
      }
    }

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
      if (unsubscribeLocalBus) {
        unsubscribeLocalBus();
      }
      if (unsubscribeAppwrite) {
        unsubscribeAppwrite();
      }
    };
  }, []);

  return {
    isLocalBusConnected,
    isAppwriteConnected,
    lastEventTimestamp,
    commsMode,
  };
}
