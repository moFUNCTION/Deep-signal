/**
 * AURA Space Medicine — Disruption-Tolerant Networking (DTN) Comms Service
 * Simulates interplanetary light-time propagation delays and flight surgeon dossier uploads.
 */

import {
  DB_CONFIG,
  DEFAULT_ASTRONAUT_PREFS,
  DistanceCommsMode,
  EarthBaselines,
  LIGHT_TIME_DELAY_SECONDS,
  MissionPhase,
} from '../config';

export const CONTROL_SYNC_ALERT_ID = 'CONTROL_STATE_SYNC';

export interface RemoteControlState {
  kind: 'CONTROL_STATE_SYNC';
  missionPhase?: MissionPhase;
  earthBaselines?: EarthBaselines;
  commsMode?: DistanceCommsMode;
  updatedAt: number;
}
import {
  databases,
  storage,
  broadcastBusMessage,
  localBus,
  safeLocalStorageGet,
  safeLocalStorageSet,
  ID,
  Query,
} from '../client';

export interface EarthTransmissionRecord {
  $id?: string;
  $createdAt?: string;
  astronaut_id: string;
  alert_id: string;
  distance_mode: DistanceCommsMode;
  delay_seconds: number;
  status: 'queued_offline' | 'transmitting' | 'received_by_earth';
  report_file_id?: string | null;
  telemetry_json: string;
}

export class DtnCommsService {
  /**
   * Retrieves active DTN distance communications mode.
   */
  public static getCommsMode(): DistanceCommsMode {
    return safeLocalStorageGet<DistanceCommsMode>(
      DB_CONFIG.STORAGE_KEYS.COMMS_MODE,
      'ISS_REALTIME'
    );
  }

  /**
   * Sets the DTN distance communications mode and notifies all tabs + Appwrite Cloud.
   */
  public static setCommsMode(mode: DistanceCommsMode): void {
    safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.COMMS_MODE, mode);
    broadcastBusMessage({
      type: 'COMMS_MODE_UPDATED',
      payload: { commsMode: mode },
    });

    if (DB_CONFIG.IS_CONFIGURED) {
      const prefs = safeLocalStorageGet(DB_CONFIG.STORAGE_KEYS.PREFS, DEFAULT_ASTRONAUT_PREFS);
      void this.syncRemoteControlState(prefs.astronautCode || 'AST-CDR-01', {
        commsMode: mode,
      });
    }
  }

  private static controlSyncQueue: Promise<void> = Promise.resolve();

  /**
   * Upserts the cross-origin mission control state document in `earth_transmissions`
   * so missionPhase, earthBaselines, and commsMode sync via Appwrite Realtime without requiring login.
   */
  public static async syncRemoteControlState(
    astronautId: string = 'AST-CDR-01',
    partial: {
      missionPhase?: MissionPhase;
      earthBaselines?: EarthBaselines;
      commsMode?: DistanceCommsMode;
    }
  ): Promise<void> {
    if (!DB_CONFIG.IS_CONFIGURED) return;

    this.controlSyncQueue = this.controlSyncQueue
      .catch(() => {})
      .then(async () => {
        const docId = `sync_ctrl_${astronautId}`.slice(0, 36);
        const localPrefs = safeLocalStorageGet(DB_CONFIG.STORAGE_KEYS.PREFS, DEFAULT_ASTRONAUT_PREFS);
        const localComms = this.getCommsMode();

        const statePayload: RemoteControlState = {
          kind: 'CONTROL_STATE_SYNC',
          missionPhase: partial.missionPhase || localPrefs.missionPhase,
          earthBaselines: partial.earthBaselines || localPrefs.earthBaselines,
          commsMode: partial.commsMode || localComms,
          updatedAt: Date.now(),
        };

        const docBody = {
          astronaut_id: astronautId.slice(0, 36),
          alert_id: CONTROL_SYNC_ALERT_ID,
          distance_mode: statePayload.commsMode || 'ISS_REALTIME',
          delay_seconds: 0,
          status: 'received_by_earth',
          report_file_id: null,
          telemetry_json: JSON.stringify(statePayload).slice(0, 5000),
        };

        try {
          await databases.updateDocument(
            DB_CONFIG.DATABASE_ID,
            DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
            docId,
            docBody
          );
        } catch (err: any) {
          if (err?.code === 404) {
            try {
              await databases.createDocument(
                DB_CONFIG.DATABASE_ID,
                DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
                docId,
                docBody
              );
            } catch (createErr: any) {
              if (createErr?.code === 409) {
                await databases.updateDocument(
                  DB_CONFIG.DATABASE_ID,
                  DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
                  docId,
                  docBody
                );
              } else {
                console.warn('[DtnCommsService] Failed to create remote control sync doc:', createErr);
              }
            }
          } else {
            console.warn('[DtnCommsService] Failed to update remote control sync doc:', err);
          }
        }
      });

    return this.controlSyncQueue;
  }

  /**
   * Fetches the latest shared control state from Appwrite Cloud if configured.
   */
  public static async fetchRemoteControlState(
    astronautId: string = 'AST-CDR-01'
  ): Promise<RemoteControlState | null> {
    if (!DB_CONFIG.IS_CONFIGURED) return null;
    const docId = `sync_ctrl_${astronautId}`.slice(0, 36);

    try {
      const doc: any = await databases.getDocument(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
        docId
      );
      if (doc?.telemetry_json) {
        return JSON.parse(doc.telemetry_json) as RemoteControlState;
      }
    } catch {
      // Document may not exist yet before first sync event
    }
    return null;
  }

  /**
   * Calculates the simulated one-way light-time propagation delay in seconds.
   * Returns null during SOLAR_BLACKOUT (infinite delay until conjunction clears).
   */
  public static calculateLightTimeDelay(mode: DistanceCommsMode): number | null {
    return LIGHT_TIME_DELAY_SECONDS[mode];
  }

  /**
   * Uploads clinical flight surgeon PDF dossier to the earth_reports Appwrite bucket.
   * Falls back gracefully if offline.
   */
  public static async uploadPdfDossier(
    pdfBlob: Blob,
    fileName: string = `AURA_Dossier_${Date.now()}.pdf`
  ): Promise<string> {
    const fileId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (DB_CONFIG.IS_CONFIGURED) {
      try {
        if (typeof File !== 'undefined') {
          const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
          const res = await storage.createFile(
            DB_CONFIG.BUCKETS.EARTH_REPORTS,
            fileId,
            file
          );
          return res.$id;
        }
      } catch (err) {
        console.warn('[DtnCommsService] Appwrite storage upload failed, using local identifier:', err);
      }
    }

    return fileId;
  }

  /**
   * Enqueues an Earth transmission packet.
   * Calculates delay countdown and persists to Appwrite or offline storage.
   */
  public static async createEarthTransmission(
    record: Omit<EarthTransmissionRecord, '$id' | '$createdAt'>
  ): Promise<EarthTransmissionRecord> {
    const transmissionId = `dtn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const fullRecord: EarthTransmissionRecord = {
      ...record,
      $id: transmissionId,
      $createdAt: nowIso,
    };

    // Save into LocalStorage DTN queue
    const queue = safeLocalStorageGet<EarthTransmissionRecord[]>(
      DB_CONFIG.STORAGE_KEYS.DTN_QUEUE,
      []
    );
    queue.push(fullRecord);
    safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.DTN_QUEUE, queue);

    // Sync to Appwrite if configured and not in solar blackout
    if (DB_CONFIG.IS_CONFIGURED && record.distance_mode !== 'SOLAR_BLACKOUT') {
      try {
        const payload = {
          astronaut_id: String(fullRecord.astronaut_id || 'AST-CDR-01').slice(0, 36),
          alert_id: String(fullRecord.alert_id).slice(0, 36),
          distance_mode: fullRecord.distance_mode,
          delay_seconds: Math.min(3600, Math.max(0, Math.round(Number(fullRecord.delay_seconds || 0)))),
          status: fullRecord.status,
          report_file_id: fullRecord.report_file_id ? String(fullRecord.report_file_id).slice(0, 64) : null,
          telemetry_json: String(fullRecord.telemetry_json || '{}').slice(0, 5000),
        };
        await databases.createDocument(
          DB_CONFIG.DATABASE_ID,
          DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
          transmissionId.slice(0, 36),
          payload
        );
      } catch (err) {
        console.warn('[DtnCommsService] Failed to persist Earth transmission:', err);
      }
    }

    return fullRecord;
  }

  /**
   * Updates transmission status to 'received_by_earth' once light-time countdown elapses.
   */
  public static async markReceivedByEarth(transmissionId: string): Promise<void> {
    const queue = safeLocalStorageGet<EarthTransmissionRecord[]>(
      DB_CONFIG.STORAGE_KEYS.DTN_QUEUE,
      []
    );
    const item = queue.find((t) => t.$id === transmissionId);
    if (item) {
      item.status = 'received_by_earth';
      safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.DTN_QUEUE, queue);
    }

    if (DB_CONFIG.IS_CONFIGURED) {
      try {
        await databases.updateDocument(
          DB_CONFIG.DATABASE_ID,
          DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
          transmissionId,
          {
            status: 'received_by_earth',
          }
        );
      } catch {
        // Degrades gracefully offline
      }
    }
  }

  /**
   * Retrieves pending or active reports for an astronaut.
   */
  public static async getPendingReports(
    astronautId: string = 'AST-CDR-01'
  ): Promise<EarthTransmissionRecord[]> {
    if (DB_CONFIG.IS_CONFIGURED) {
      try {
        const response = await databases.listDocuments(
          DB_CONFIG.DATABASE_ID,
          DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
          [
            Query.equal('astronaut_id', astronautId),
            Query.notEqual('status', 'received_by_earth'),
            Query.orderDesc('$createdAt'),
          ]
        );

        if (response && response.documents.length > 0) {
          return response.documents
            .filter((doc: any) => doc.alert_id !== CONTROL_SYNC_ALERT_ID)
            .map((doc: any) => ({
            $id: doc.$id,
            $createdAt: doc.$createdAt,
            astronaut_id: doc.astronaut_id,
            alert_id: doc.alert_id,
            distance_mode: doc.distance_mode,
            delay_seconds: doc.delay_seconds,
            status: doc.status,
            report_file_id: doc.report_file_id,
            telemetry_json: doc.telemetry_json,
          })) as EarthTransmissionRecord[];
        }
      } catch {
        // Degrades gracefully offline
      }
    }

    const localQueue = safeLocalStorageGet<EarthTransmissionRecord[]>(
      DB_CONFIG.STORAGE_KEYS.DTN_QUEUE,
      []
    );

    return localQueue.filter(
      (t) => t.astronaut_id === astronautId && t.status !== 'received_by_earth'
    );
  }

  /**
   * Subscribes to comms mode changes across tabs.
   */
  public static subscribeCommsMode(
    callback: (mode: DistanceCommsMode) => void
  ): () => void {
    return localBus.subscribe((msg) => {
      if (msg.type === 'COMMS_MODE_UPDATED') {
        callback(msg.payload.commsMode);
      }
    });
  }
}
