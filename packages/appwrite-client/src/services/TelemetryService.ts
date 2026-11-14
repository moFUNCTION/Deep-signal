/**
 * AURA Space Medicine — Telemetry Ingestion & Real-Time Sync Service
 * Dual-mode: writes to Appwrite Cloud with automatic fallback to LocalStorage ring buffer
 * and cross-tab BroadcastChannel ('aura_telemetry_bus').
 */

import { DB_CONFIG, DistanceCommsMode } from '../config';
import {
  VitalReadingInput,
  PersistedAlertDocument,
  databases,
  appwriteClient,
  broadcastBusMessage,
  localBus,
  safeLocalStorageGet,
  safeLocalStorageSet,
  ID,
  Query,
} from '../client';
import { runAutonomousTriage } from '../clinicalEngine';
import { AuthCalibrationService } from './AuthCalibrationService';
import { CountermeasureService } from './CountermeasureService';

export class TelemetryService {
  private static readonly MAX_HISTORY_LENGTH = 30;

  /**
   * Ingests a new biometric vital reading.
   * Evaluates the clinical rules, generates an edge alert ID, saves locally,
   * emits across browser tabs via BroadcastChannel, and syncs to Appwrite Cloud.
   */
  public static async ingestVitalReading(
    reading: VitalReadingInput,
    options?: { isOfflineMode?: boolean; commsMode?: DistanceCommsMode }
  ): Promise<{ vitalDoc: VitalReadingInput; alertDoc: PersistedAlertDocument }> {
    const nowIso = new Date().toISOString();
    const vitalId = reading.$id || `vital_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const edgeAlertId = reading.edge_alert_id || `alert_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const vitalDoc: VitalReadingInput = {
      ...reading,
      $id: vitalId,
      $createdAt: reading.$createdAt || nowIso,
      edge_alert_id: edgeAlertId,
      ingestion_source: reading.ingestion_source || 'LIVE_STREAM',
    };

    // 1. Fetch current astronaut profile baselines and incomplete tasks
    const profile = await AuthCalibrationService.getAstronautProfile();
    const missions = await CountermeasureService.listDailyMissions(reading.astronaut_id);
    const incompleteTasks = missions.filter((m) => !m.is_completed).map((m) => m.task_code);

    // 2. Deterministic Isomorphic Triage Evaluation
    const diagnosis = runAutonomousTriage(
      vitalDoc,
      profile.earthBaselines,
      vitalDoc.mission_phase || profile.missionPhase,
      incompleteTasks
    );

    const alertDoc: PersistedAlertDocument = {
      $id: edgeAlertId,
      $createdAt: nowIso,
      astronaut_id: vitalDoc.astronaut_id,
      vital_log_id: vitalId,
      affected_system: diagnosis.affected_system,
      severity: diagnosis.severity,
      diagnosis_code: diagnosis.diagnosis_code,
      diagnosis_title: diagnosis.diagnosis_title,
      simple_explanation: diagnosis.simple_explanation,
      action_protocol: diagnosis.action_protocol,
      guide_file_id: diagnosis.guide_file_id || null,
      notify_earth: diagnosis.notify_earth,
      is_resolved: false,
    };

    // 3. Update LocalStorage Ring Buffer (Max 30 items)
    const history = this.getLocalHistory();
    history.push(vitalDoc);
    if (history.length > this.MAX_HISTORY_LENGTH) {
      history.splice(0, history.length - this.MAX_HISTORY_LENGTH);
    }
    safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.VITALS_HISTORY, history);

    // 4. Update Active Alert in LocalStorage
    safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.ACTIVE_ALERT, alertDoc);

    // 5. Broadcast across tabs via BroadcastChannel ('aura_telemetry_bus')
    broadcastBusMessage({
      type: 'TELEMETRY_INGESTED',
      payload: {
        vitalDoc,
        alertDoc,
      },
    });

    // 6. Asynchronous Sync to Appwrite Cloud (unless offline or SOLAR_BLACKOUT)
    const commsMode = options?.commsMode || safeLocalStorageGet<DistanceCommsMode>(DB_CONFIG.STORAGE_KEYS.COMMS_MODE, 'ISS_REALTIME');
    const isOffline = options?.isOfflineMode || commsMode === 'SOLAR_BLACKOUT';

    if (!isOffline) {
      try {
        const { $id, $createdAt, ...vitalPayload } = vitalDoc;
        await databases.createDocument(
          DB_CONFIG.DATABASE_ID,
          DB_CONFIG.COLLECTIONS.VITALS_LOGS,
          vitalId,
          vitalPayload
        );

        const { $id: aId, $createdAt: aCreated, ...alertPayload } = alertDoc;
        await databases.createDocument(
          DB_CONFIG.DATABASE_ID,
          DB_CONFIG.COLLECTIONS.TRIAGE_ALERTS,
          edgeAlertId,
          alertPayload
        );
      } catch {
        // Degrades gracefully offline
      }
    }

    return { vitalDoc, alertDoc };
  }

  /**
   * Retrieves the local telemetry history ring buffer.
   */
  public static getLocalHistory(): VitalReadingInput[] {
    return safeLocalStorageGet<VitalReadingInput[]>(
      DB_CONFIG.STORAGE_KEYS.VITALS_HISTORY,
      []
    );
  }

  /**
   * Retrieves the currently active triage alert.
   */
  public static getActiveAlert(): PersistedAlertDocument | null {
    return safeLocalStorageGet<PersistedAlertDocument | null>(
      DB_CONFIG.STORAGE_KEYS.ACTIVE_ALERT,
      null
    );
  }

  /**
   * Fetches recent vitals from Appwrite Cloud, falling back to local history.
   */
  public static async fetchRecentVitals(
    astronautId: string = 'AST-CDR-01',
    limit: number = 20
  ): Promise<VitalReadingInput[]> {
    try {
      const response = await databases.listDocuments(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.COLLECTIONS.VITALS_LOGS,
        [
          Query.equal('astronaut_id', astronautId),
          Query.orderDesc('$createdAt'),
          Query.limit(limit),
        ]
      );

      if (response && response.documents.length > 0) {
        return response.documents.map((doc: any) => ({
          $id: doc.$id,
          $createdAt: doc.$createdAt,
          astronaut_id: doc.astronaut_id,
          mission_phase: doc.mission_phase,
          heart_rate: doc.heart_rate,
          bp_systolic: doc.bp_systolic,
          bp_diastolic: doc.bp_diastolic,
          blood_glucose: doc.blood_glucose,
          body_temp: doc.body_temp,
          spo2: doc.spo2,
          sleep_hours: doc.sleep_hours,
          mood_score: doc.mood_score,
          cabin_co2_mmhg: doc.cabin_co2_mmhg,
          cabin_radiation_msv: doc.cabin_radiation_msv,
          ingestion_source: doc.ingestion_source,
          edge_alert_id: doc.edge_alert_id,
        })) as VitalReadingInput[];
      }
    } catch {
      // Degrades gracefully offline
    }

    return this.getLocalHistory();
  }

  /**
   * Subscribes to telemetry events via BroadcastChannel and Appwrite Realtime.
   */
  public static subscribeVitals(
    callback: (vital: VitalReadingInput, alert?: PersistedAlertDocument) => void
  ): () => void {
    const busUnsub = localBus.subscribe((msg) => {
      if (msg.type === 'TELEMETRY_INGESTED') {
        callback(msg.payload.vitalDoc, msg.payload.alertDoc);
      }
    });

    let realtimeUnsub = () => {};
    try {
      const channel = `databases.${DB_CONFIG.DATABASE_ID}.collections.${DB_CONFIG.COLLECTIONS.VITALS_LOGS}.documents`;
      realtimeUnsub = appwriteClient.subscribe(channel, (response: any) => {
        if (response.payload) {
          callback(response.payload as VitalReadingInput);
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
}
