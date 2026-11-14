/**
 * AURA Space Medicine — Disruption-Tolerant Networking (DTN) Comms Service
 * Simulates interplanetary light-time propagation delays and flight surgeon dossier uploads.
 */

import {
  DB_CONFIG,
  DistanceCommsMode,
  LIGHT_TIME_DELAY_SECONDS,
} from '../config';
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
   * Sets the DTN distance communications mode and notifies all tabs.
   */
  public static setCommsMode(mode: DistanceCommsMode): void {
    safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.COMMS_MODE, mode);
    broadcastBusMessage({
      type: 'COMMS_MODE_UPDATED',
      payload: { commsMode: mode },
    });
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
        const { $id, $createdAt, ...payload } = fullRecord;
        await databases.createDocument(
          DB_CONFIG.DATABASE_ID,
          DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
          transmissionId,
          payload
        );
      } catch {
        // Degrades gracefully offline
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
          return response.documents.map((doc: any) => ({
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
