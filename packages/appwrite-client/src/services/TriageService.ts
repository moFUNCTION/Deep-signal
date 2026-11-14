/**
 * AURA Space Medicine — Autonomous Triage & Emergency Protocol Service
 * Handles alert state tracking, protocol resolution, and offline sync replay.
 */

import { DB_CONFIG } from '../config';
import {
  PersistedAlertDocument,
  VitalReadingInput,
  databases,
  appwriteClient,
  broadcastBusMessage,
  localBus,
  safeLocalStorageGet,
  safeLocalStorageSet,
  Query,
} from '../client';

export class TriageService {
  /**
   * Resolves an active medical alert.
   * Marks resolved in LocalStorage, emits via BroadcastChannel, and syncs to Appwrite.
   */
  public static async resolveAlert(alertId: string): Promise<void> {
    // 1. Update LocalStorage active alert
    const active = safeLocalStorageGet<PersistedAlertDocument | null>(
      DB_CONFIG.STORAGE_KEYS.ACTIVE_ALERT,
      null
    );

    if (active && (active.$id === alertId || active.vital_log_id === alertId)) {
      active.is_resolved = true;
      safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.ACTIVE_ALERT, active);
    }

    // 2. Broadcast across tabs
    broadcastBusMessage({
      type: 'ALERT_RESOLVED',
      payload: { alertId },
    });

    // 3. Update Appwrite Cloud
    try {
      await databases.updateDocument(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.COLLECTIONS.TRIAGE_ALERTS,
        alertId,
        {
          is_resolved: true,
        }
      );
    } catch {
      // Degrades gracefully offline
    }
  }

  /**
   * Retrieves active, unresolved alerts for an astronaut.
   */
  public static async getActiveAlerts(
    astronautId: string = 'AST-CDR-01'
  ): Promise<PersistedAlertDocument[]> {
    try {
      const response = await databases.listDocuments(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.COLLECTIONS.TRIAGE_ALERTS,
        [
          Query.equal('astronaut_id', astronautId),
          Query.equal('is_resolved', false),
          Query.orderDesc('$createdAt'),
        ]
      );

      if (response && response.documents.length > 0) {
        return response.documents.map((doc: any) => ({
          $id: doc.$id,
          $createdAt: doc.$createdAt,
          astronaut_id: doc.astronaut_id,
          vital_log_id: doc.vital_log_id,
          affected_system: doc.affected_system,
          severity: doc.severity,
          diagnosis_code: doc.diagnosis_code,
          diagnosis_title: doc.diagnosis_title,
          simple_explanation: doc.simple_explanation,
          action_protocol: doc.action_protocol,
          guide_file_id: doc.guide_file_id,
          notify_earth: doc.notify_earth,
          is_resolved: doc.is_resolved,
        })) as PersistedAlertDocument[];
      }
    } catch {
      // Degrades gracefully offline
    }

    const localAlert = safeLocalStorageGet<PersistedAlertDocument | null>(
      DB_CONFIG.STORAGE_KEYS.ACTIVE_ALERT,
      null
    );

    if (localAlert && !localAlert.is_resolved) {
      return [localAlert];
    }

    return [];
  }

  /**
   * Subscribes to triage alerts via BroadcastChannel and Appwrite Realtime.
   */
  public static subscribeAlerts(
    callback: (alert: PersistedAlertDocument) => void
  ): () => void {
    const busUnsub = localBus.subscribe((msg) => {
      if (msg.type === 'TELEMETRY_INGESTED') {
        callback(msg.payload.alertDoc);
      }
    });

    let realtimeUnsub = () => {};
    try {
      const channel = `databases.${DB_CONFIG.DATABASE_ID}.collections.${DB_CONFIG.COLLECTIONS.TRIAGE_ALERTS}.documents`;
      realtimeUnsub = appwriteClient.subscribe(channel, (response: any) => {
        if (response.payload) {
          callback(response.payload as PersistedAlertDocument);
        }
      });
    } catch {
      // Offline fallback
    }

    return () => {
      busUnsub();
      realtimeUnsub();
    };
  }

  /**
   * Flushes offline-accumulated vitals to Appwrite Cloud.
   * Attaches edge_alert_id and ingestion_source = OFFLINE_SYNC_FLUSH
   * so the cloud function idempotency guard avoids duplicate alert records.
   */
  public static async flushOfflineVitalsAndAlerts(
    queuedVitals: VitalReadingInput[]
  ): Promise<number> {
    let successCount = 0;

    for (const vital of queuedVitals) {
      try {
        const vitalId = vital.$id || `vital_flush_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const { $id, $createdAt, ...payload } = vital;

        await databases.createDocument(
          DB_CONFIG.DATABASE_ID,
          DB_CONFIG.COLLECTIONS.VITALS_LOGS,
          vitalId,
          {
            ...payload,
            ingestion_source: 'OFFLINE_SYNC_FLUSH',
            edge_alert_id: vital.edge_alert_id || null,
          }
        );

        successCount++;
      } catch (err) {
        console.warn(`[TriageService.flushOffline] Skipped item:`, err);
      }
    }

    return successCount;
  }
}
