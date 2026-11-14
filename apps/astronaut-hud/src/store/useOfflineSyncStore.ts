import { create } from 'zustand';
import { get, set as idbSet } from 'idb-keyval';
import type { DistanceCommsMode } from '@aura/medical-engine';
import {
  DtnCommsService,
  LIGHT_TIME_DELAY_SECONDS,
  localBus,
  type EarthTransmissionRecord,
} from '@aura/appwrite-client';
import { useAuthStore } from './useAuthStore';

const IDB_KEY = 'aura_dtn_offline_packets';

interface EnqueueDossierPayload {
  alertId: string;
  telemetryJson: string;
  reportBlob?: Blob;
  fileName?: string;
}

export interface OfflineSyncState {
  commsMode: DistanceCommsMode;
  offlineQueue: EarthTransmissionRecord[];
  activeTransmissions: EarthTransmissionRecord[];
  completedTransmissions: EarthTransmissionRecord[];
  isInitialized: boolean;

  // Actions
  initializeQueue: () => Promise<void>;
  setCommsMode: (mode: DistanceCommsMode) => void;
  enqueueMedicalDossier: (payload: EnqueueDossierPayload) => Promise<EarthTransmissionRecord>;
  tickTransmissions: () => void;
  flushOfflineQueue: () => Promise<void>;
  clearCompleted: () => void;
}

export const useOfflineSyncStore = create<OfflineSyncState>((set, get) => ({
  commsMode: 'EARLY_ORBIT_ADAPTATION' as any ? 'ISS_REALTIME' : 'ISS_REALTIME',
  offlineQueue: [],
  activeTransmissions: [],
  completedTransmissions: [],
  isInitialized: false,

  initializeQueue: async () => {
    try {
      const persisted = await get<EarthTransmissionRecord[]>(IDB_KEY);
      if (persisted && Array.isArray(persisted)) {
        const offlineQueue = persisted.filter((p) => p.status === 'queued_offline');
        const activeTransmissions = persisted.filter((p) => p.status === 'transmitting');
        const completedTransmissions = persisted.filter((p) => p.status === 'received_by_earth');

        set({
          offlineQueue,
          activeTransmissions,
          completedTransmissions,
          isInitialized: true,
        });
        return;
      }
    } catch (err) {
      console.warn('idb-keyval reading failed, using in-memory state', err);
    }
    set({ isInitialized: true });
  },

  setCommsMode: (mode: DistanceCommsMode) => {
    set({ commsMode: mode });

    // If switching out of SOLAR_BLACKOUT, activate queued transmissions
    if (mode !== 'SOLAR_BLACKOUT') {
      const delay = LIGHT_TIME_DELAY_SECONDS[mode] ?? 2;
      const { offlineQueue, activeTransmissions } = get();

      if (offlineQueue.length > 0) {
        const newlyActive: EarthTransmissionRecord[] = offlineQueue.map((item) => ({
          ...item,
          distance_mode: mode,
          delay_seconds: delay,
          remaining_seconds: delay,
          status: 'transmitting',
        }));

        const nextActive = [...activeTransmissions, ...newlyActive];
        set({
          offlineQueue: [],
          activeTransmissions: nextActive,
        });

        // Persist to IDB
        const all = [...nextActive, ...get().completedTransmissions];
        idbSet(IDB_KEY, all).catch(() => {});
      }
    }

    if (localBus) {
      localBus.postMessage({
        type: 'COMMS_MODE_UPDATED',
        payload: { distanceMode: mode },
      });
    }
  },

  enqueueMedicalDossier: async ({ alertId, telemetryJson, reportBlob, fileName }) => {
    const commsMode = get().commsMode;
    const astronautId = useAuthStore.getState().profile.astronautId || 'AST-CDR-01';
    const isBlackout = commsMode === 'SOLAR_BLACKOUT';
    const delay = LIGHT_TIME_DELAY_SECONDS[commsMode] ?? 2;

    const id = `dtn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: EarthTransmissionRecord = {
      $id: id,
      astronaut_id: astronautId,
      alert_id: alertId,
      distance_mode: commsMode,
      delay_seconds: isBlackout ? 0 : delay,
      remaining_seconds: isBlackout ? 0 : delay,
      status: isBlackout ? 'queued_offline' : 'transmitting',
      report_file_id: fileName || null,
      telemetry_json: telemetryJson,
      createdAt: new Date().toISOString(),
    };

    if (isBlackout) {
      const updatedQueue = [record, ...get().offlineQueue];
      set({ offlineQueue: updatedQueue });
      const all = [...updatedQueue, ...get().activeTransmissions, ...get().completedTransmissions];
      await idbSet(IDB_KEY, all).catch(() => {});
    } else {
      const updatedActive = [record, ...get().activeTransmissions];
      set({ activeTransmissions: updatedActive });
      const all = [...get().offlineQueue, ...updatedActive, ...get().completedTransmissions];
      await idbSet(IDB_KEY, all).catch(() => {});

      // Attempt Appwrite background upload
      if (reportBlob) {
        DtnCommsService.uploadPdfDossier(reportBlob, fileName || `dossier_${id}.pdf`).catch(() => {});
      }
      DtnCommsService.createEarthTransmission(record).catch(() => {});
    }

    return record;
  },

  tickTransmissions: () => {
    const { commsMode, activeTransmissions, completedTransmissions, offlineQueue } = get();
    if (commsMode === 'SOLAR_BLACKOUT' || activeTransmissions.length === 0) {
      return;
    }

    let changed = false;
    const remainingActive: EarthTransmissionRecord[] = [];
    const newlyCompleted: EarthTransmissionRecord[] = [];

    for (const tx of activeTransmissions) {
      const nextRemaining = tx.remaining_seconds - 1;
      if (nextRemaining <= 0) {
        changed = true;
        const finished: EarthTransmissionRecord = {
          ...tx,
          remaining_seconds: 0,
          status: 'received_by_earth',
        };
        newlyCompleted.push(finished);
        DtnCommsService.markReceivedByEarth(tx.$id).catch(() => {});
      } else {
        remainingActive.push({
          ...tx,
          remaining_seconds: nextRemaining,
        });
      }
    }

    if (changed || remainingActive.length !== activeTransmissions.length) {
      const nextCompleted = [...newlyCompleted, ...completedTransmissions].slice(0, 50);
      set({
        activeTransmissions: remainingActive,
        completedTransmissions: nextCompleted,
      });

      const all = [...offlineQueue, ...remainingActive, ...nextCompleted];
      idbSet(IDB_KEY, all).catch(() => {});
    }
  },

  flushOfflineQueue: async () => {
    const { offlineQueue, commsMode, activeTransmissions, completedTransmissions } = get();
    if (offlineQueue.length === 0 || commsMode === 'SOLAR_BLACKOUT') {
      return;
    }

    const delay = LIGHT_TIME_DELAY_SECONDS[commsMode] ?? 2;
    const movedToActive: EarthTransmissionRecord[] = offlineQueue.map((tx) => ({
      ...tx,
      distance_mode: commsMode,
      delay_seconds: delay,
      remaining_seconds: delay,
      status: 'transmitting',
    }));

    const nextActive = [...activeTransmissions, ...movedToActive];
    set({
      offlineQueue: [],
      activeTransmissions: nextActive,
    });

    const all = [...nextActive, ...completedTransmissions];
    await idbSet(IDB_KEY, all).catch(() => {});
  },

  clearCompleted: () => {
    set({ completedTransmissions: [] });
    const all = [...get().offlineQueue, ...get().activeTransmissions];
    idbSet(IDB_KEY, all).catch(() => {});
  },
}));
