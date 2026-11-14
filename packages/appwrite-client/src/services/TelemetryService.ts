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
    options?: { isOfflineMode?: boolean; commsMode?: DistanceCommsMode; forceCloudSync?: boolean }
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

    const commsMode = options?.commsMode || safeLocalStorageGet<DistanceCommsMode>(DB_CONFIG.STORAGE_KEYS.COMMS_MODE, 'ISS_REALTIME');
    const isOffline = Boolean(options?.isOfflineMode) || (commsMode === 'SOLAR_BLACKOUT' && !options?.forceCloudSync);

    // 1. Fetch current astronaut profile baselines and incomplete tasks
    const profile = await AuthCalibrationService.getAstronautProfile({ isOfflineMode: isOffline });
    const missions = await CountermeasureService.listDailyMissions(reading.astronaut_id, { isOfflineMode: isOffline });
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

    // 6. Asynchronous Sync to Appwrite Cloud (only when configured and online)
    if (DB_CONFIG.IS_CONFIGURED && !isOffline) {
      try {
        const vitalPayload = {
          astronaut_id: String(vitalDoc.astronaut_id || 'AST-CDR-01').slice(0, 36),
          mission_phase: vitalDoc.mission_phase || 'DEEP_SPACE_CRUISE',
          heart_rate: Math.round(Number(vitalDoc.heart_rate)),
          bp_systolic: Math.round(Number(vitalDoc.bp_systolic)),
          bp_diastolic: Math.round(Number(vitalDoc.bp_diastolic)),
          blood_glucose: Number(Number(vitalDoc.blood_glucose).toFixed(2)),
          body_temp: Number(Number(vitalDoc.body_temp).toFixed(2)),
          spo2: Math.min(100, Math.max(50, Math.round(Number(vitalDoc.spo2)))),
          sleep_hours: Number(Number(vitalDoc.sleep_hours).toFixed(2)),
          mood_score: Math.min(10, Math.max(1, Math.round(Number(vitalDoc.mood_score)))),
          cabin_co2_mmhg: Number(Number(vitalDoc.cabin_co2_mmhg).toFixed(2)),
          cabin_radiation_msv: Number(Number(vitalDoc.cabin_radiation_msv).toFixed(3)),
          ingestion_source: vitalDoc.ingestion_source || 'LIVE_STREAM',
          edge_alert_id: String(edgeAlertId).slice(0, 36),
        };

        await databases.createDocument(
          DB_CONFIG.DATABASE_ID,
          DB_CONFIG.COLLECTIONS.VITALS_LOGS,
          vitalId.slice(0, 36),
          vitalPayload
        );

        const alertPayload = {
          astronaut_id: String(alertDoc.astronaut_id || 'AST-CDR-01').slice(0, 36),
          vital_log_id: String(vitalId).slice(0, 36),
          affected_system: alertDoc.affected_system,
          severity: alertDoc.severity,
          diagnosis_code: String(alertDoc.diagnosis_code).slice(0, 64),
          diagnosis_title: String(alertDoc.diagnosis_title).slice(0, 255),
          simple_explanation: String(alertDoc.simple_explanation).slice(0, 1000),
          action_protocol: (alertDoc.action_protocol || []).map((step) =>
            String(step).slice(0, 500)
          ),
          guide_file_id: alertDoc.guide_file_id ? String(alertDoc.guide_file_id).slice(0, 64) : null,
          notify_earth: Boolean(alertDoc.notify_earth),
          is_resolved: Boolean(alertDoc.is_resolved),
        };

        await databases.createDocument(
          DB_CONFIG.DATABASE_ID,
          DB_CONFIG.COLLECTIONS.TRIAGE_ALERTS,
          edgeAlertId.slice(0, 36),
          alertPayload
        );
      } catch (err) {
        console.warn('[TelemetryService] Appwrite Cloud sync failed, using local buffer:', err);
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
    if (DB_CONFIG.IS_CONFIGURED) {
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
    if (DB_CONFIG.IS_CONFIGURED) {
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
    }

    return () => {
      busUnsub();
      realtimeUnsub();
    };
  }
}
