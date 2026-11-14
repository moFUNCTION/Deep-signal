import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { DistanceCommsMode, VitalReadingInput } from '@aura/medical-engine';
import {
  DtnCommsService,
  LIGHT_TIME_DELAY_SECONDS,
  TelemetryService,
  type EarthTransmissionRecord,
} from '@aura/appwrite-client';
import { useAuthStore } from './useAuthStore';

const IDB_KEY = 'aura_dtn_offline_packets';
const IDB_VITALS_KEY = 'aura_dtn_offline_vitals';

export interface LocalDtnRecord extends EarthTransmissionRecord {
  $id: string;
  remaining_seconds: number;
  $createdAt?: string;
}

interface EnqueueDossierPayload {
  alertId: string;
  telemetryJson: string;
  reportBlob?: Blob;
  fileName?: string;
}

export interface OfflineSyncState {
  commsMode: DistanceCommsMode;
  offlineQueue: LocalDtnRecord[];
  offlineVitals: VitalReadingInput[];
  activeTransmissions: LocalDtnRecord[];
  completedTransmissions: LocalDtnRecord[];
  isInitialized: boolean;

  // Actions
  initializeQueue: () => Promise<void>;
  setCommsMode: (mode: DistanceCommsMode) => void;
  applyRemoteCommsMode: (mode: DistanceCommsMode) => void;
  queueOfflineVital: (vital: VitalReadingInput) => Promise<void>;
  enqueueMedicalDossier: (payload: EnqueueDossierPayload) => Promise<LocalDtnRecord>;
  tickTransmissions: () => void;
  flushOfflineQueue: () => Promise<void>;
  clearCompleted: () => void;
}

export const useOfflineSyncStore = create<OfflineSyncState>((set, get) => ({
  commsMode: 'ISS_REALTIME',
  offlineQueue: [],
  offlineVitals: [],
  activeTransmissions: [],
  completedTransmissions: [],
  isInitialized: false,

  initializeQueue: async () => {
    try {
      const [persisted, persistedVitals] = await Promise.all([
        idbGet(IDB_KEY) as Promise<LocalDtnRecord[] | undefined>,
        idbGet(IDB_VITALS_KEY) as Promise<VitalReadingInput[] | undefined>,
      ]);
      if (persisted && Array.isArray(persisted)) {
        const offlineQueue = persisted.filter((p) => p.status === 'queued_offline');
        const activeTransmissions = persisted.filter((p) => p.status === 'transmitting');
        const completedTransmissions = persisted.filter((p) => p.status === 'received_by_earth');

        set({
          offlineQueue,
          offlineVitals: Array.isArray(persistedVitals) ? persistedVitals : [],
          activeTransmissions,
          completedTransmissions,
          isInitialized: true,
        });
        return;
      }
      if (Array.isArray(persistedVitals)) {
        set({ offlineVitals: persistedVitals });
      }
    } catch (err) {
      console.warn('idb-keyval reading failed, using in-memory state', err);
    }
    set({ isInitialized: true });
  },

  setCommsMode: (mode: DistanceCommsMode) => {
    if (get().commsMode === mode) return;
    set({ commsMode: mode });

    // If switching out of SOLAR_BLACKOUT, flush offline dossiers & idempotent edge vitals
    if (mode !== 'SOLAR_BLACKOUT') {
      void get().flushOfflineQueue();
    }

    DtnCommsService.setCommsMode(mode);
  },

  applyRemoteCommsMode: (mode: DistanceCommsMode) => {
    if (get().commsMode === mode) return;
    set({ commsMode: mode });

    if (mode !== 'SOLAR_BLACKOUT') {
      void get().flushOfflineQueue();
    }
  },

  queueOfflineVital: async (vital: VitalReadingInput) => {
    const existing = get().offlineVitals;
    if (vital.$id && existing.some((v) => v.$id === vital.$id)) {
      return;
    }
    const buffered: VitalReadingInput = {
      ...vital,
      ingestion_source: 'OFFLINE_SYNC_FLUSH',
    };
    const nextVitals = [buffered, ...existing].slice(0, 30);
    set({ offlineVitals: nextVitals });
    await idbSet(IDB_VITALS_KEY, nextVitals).catch(() => {});
  },

  enqueueMedicalDossier: async ({ alertId, telemetryJson, reportBlob, fileName }) => {
    const state = get();
    const existing =
      state.offlineQueue.find((q) => q.alert_id === alertId) ||
      state.activeTransmissions.find((q) => q.alert_id === alertId);
    if (existing) {
      return existing;
    }

    const commsMode = state.commsMode;
    const astronautId = useAuthStore.getState().profile.astronautId || 'AST-CDR-01';
    const isBlackout = commsMode === 'SOLAR_BLACKOUT';
    const delay = LIGHT_TIME_DELAY_SECONDS[commsMode] ?? 2;

    const id = `dtn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const record: LocalDtnRecord = {
      $id: id,
      astronaut_id: astronautId,
      alert_id: alertId,
      distance_mode: commsMode,
      delay_seconds: isBlackout ? 0 : delay,
      remaining_seconds: isBlackout ? 0 : delay,
      status: isBlackout ? 'queued_offline' : 'transmitting',
      report_file_id: fileName || null,
      telemetry_json: telemetryJson,
      $createdAt: new Date().toISOString(),
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
    const remainingActive: LocalDtnRecord[] = [];
    const newlyCompleted: LocalDtnRecord[] = [];

    for (const tx of activeTransmissions) {
      const nextRemaining = tx.remaining_seconds - 1;
      if (nextRemaining <= 0) {
        changed = true;
        const finished: LocalDtnRecord = {
          ...tx,
          remaining_seconds: 0,
          status: 'received_by_earth',
        };
        newlyCompleted.push(finished);
        DtnCommsService.markReceivedByEarth(tx.$id || '').catch(() => {});
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
    const { offlineQueue, offlineVitals, commsMode, activeTransmissions, completedTransmissions } = get();
    if ((offlineQueue.length === 0 && offlineVitals.length === 0) || commsMode === 'SOLAR_BLACKOUT') {
      return;
    }

    const delay = LIGHT_TIME_DELAY_SECONDS[commsMode] ?? 2;
    const movedToActive: LocalDtnRecord[] = offlineQueue.map((tx) => ({
      ...tx,
      distance_mode: commsMode,
      delay_seconds: delay,
      remaining_seconds: delay,
      status: 'transmitting',
    }));

    const nextActive = [...activeTransmissions, ...movedToActive];
    set({
      offlineQueue: [],
      offlineVitals: [],
      activeTransmissions: nextActive,
    });

    const all = [...nextActive, ...completedTransmissions];
    await idbSet(IDB_KEY, all).catch(() => {});
    await idbSet(IDB_VITALS_KEY, []).catch(() => {});

    for (const vital of offlineVitals) {
      TelemetryService.ingestVitalReading({
        ...vital,
        ingestion_source: 'OFFLINE_SYNC_FLUSH',
      }).catch(() => {});
    }
    for (const tx of movedToActive) {
      DtnCommsService.createEarthTransmission(tx).catch(() => {});
    }
  },

  clearCompleted: () => {
    set({ completedTransmissions: [] });
    const all = [...get().offlineQueue, ...get().activeTransmissions];
    idbSet(IDB_KEY, all).catch(() => {});
  },
}));
