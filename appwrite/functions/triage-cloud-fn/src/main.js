/**
 * AURA Serverless Space Medical Triage Engine — Cloud Function Handler
 * Triggered on databases.AURA_Medical_DB.collections.vitals_logs.documents.*.create
 */

import { Client, Databases, Users, Query, ID } from 'node-appwrite';
import { runAutonomousTriage, DEFAULT_EARTH_BASELINES } from './triageEngine.js';

export default async function ({ req, res, log, error }) {
  const endpoint =
    process.env.APPWRITE_FUNCTION_ENDPOINT ||
    process.env.APPWRITE_ENDPOINT ||
    'https://fra.cloud.appwrite.io/v1';
  const projectId =
    process.env.APPWRITE_FUNCTION_PROJECT_ID ||
    process.env.APPWRITE_PROJECT_ID ||
    '6af87b750015891937c0';
  const apiKey =
    process.env.APPWRITE_FUNCTION_API_KEY ||
    process.env.APPWRITE_API_KEY ||
    req.headers?.['x-appwrite-key'];
  const dbId = process.env.AURA_DB_ID || 'AURA_Medical_DB';

  log(`AURA Triage Function triggered for project ${projectId}`);

  // Parse payload (supports string JSON or direct object)
  let vitalReading = null;
  try {
    const rawBody = req.bodyRaw || req.body || req.payload;
    if (typeof rawBody === 'string') {
      vitalReading = JSON.parse(rawBody);
    } else if (rawBody && typeof rawBody === 'object') {
      vitalReading = rawBody;
    }
  } catch (err) {
    error(`Failed to parse request payload: ${err.message}`);
    return res.json({ success: false, error: 'Invalid JSON payload' }, 400);
  }

  if (!vitalReading || !vitalReading.astronaut_id) {
    log('No valid astronaut vital reading in payload');
    return res.json({ success: false, error: 'Missing vital reading or astronaut_id' }, 400);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

  if (apiKey) {
    client.setKey(apiKey);
  }

  const databases = new Databases(client);
  const users = new Users(client);

  const astronautId = vitalReading.astronaut_id;
  const edgeAlertId = vitalReading.edge_alert_id;
  const isOfflineFlush = vitalReading.ingestion_source === 'OFFLINE_SYNC_FLUSH';

  // --- EDGE-CLOUD IDEMPOTENCY GUARD ---
  if (edgeAlertId) {
    try {
      const existingAlert = await databases.getDocument(dbId, 'triage_alerts', edgeAlertId);
      if (existingAlert) {
        log(`Idempotent skip: Alert '${edgeAlertId}' already recorded in triage_alerts`);
        return res.json({
          success: true,
          deduplicated: true,
          alertId: edgeAlertId,
          message: 'Alert already recorded by edge client',
        });
      }
    } catch (checkErr) {
      // 404 is expected when alert does not yet exist
      if (checkErr.code !== 404) {
        log(`Notice during idempotency check: ${checkErr.message}`);
      }
    }
  }

  // Retrieve user pre-flight BDC baselines from Appwrite user preferences (with fallback)
  let userBaselines = DEFAULT_EARTH_BASELINES;
  try {
    if (apiKey) {
      const prefs = await users.getPrefs(astronautId);
      if (prefs && prefs.earthBaselines) {
        userBaselines = prefs.earthBaselines;
        log(`Loaded customized pre-flight BDC baselines for astronaut ${astronautId}`);
      }
    }
  } catch (prefsErr) {
    log(`Using default Earth baselines (Prefs lookup notice: ${prefsErr.message})`);
  }

  // Retrieve incomplete daily countermeasures to cross-correlate dehydration / musculoskeletal risk
  const incompleteTasks = [];
  try {
    const missionsRes = await databases.listDocuments(dbId, 'daily_missions', [
      Query.equal('astronaut_id', astronautId),
      Query.equal('is_completed', false),
    ]);
    for (const doc of missionsRes.documents) {
      incompleteTasks.push(doc.task_code);
    }
    log(`Found ${incompleteTasks.length} incomplete daily missions: ${incompleteTasks.join(', ')}`);
  } catch (missErr) {
    log(`Could not query daily missions: ${missErr.message}`);
  }

  // Execute the deterministic 8-rule clinical triage engine
  const missionPhase = vitalReading.mission_phase || 'DEEP_SPACE_CRUISE';
  const triageResult = runAutonomousTriage(
    vitalReading,
    userBaselines,
    missionPhase,
    incompleteTasks
  );

  log(`Triage Diagnosis: [${triageResult.severity.toUpperCase()}] ${triageResult.diagnosis_code} (${triageResult.diagnosis_title})`);

  // Persist alert document into triage_alerts collection
  const alertId = edgeAlertId || ID.unique();
  const alertDocument = {
    astronaut_id: astronautId,
    vital_log_id: vitalReading.$id || ID.unique(),
    affected_system: triageResult.affected_system,
    severity: triageResult.severity,
    diagnosis_code: triageResult.diagnosis_code,
    diagnosis_title: triageResult.diagnosis_title,
    simple_explanation: triageResult.simple_explanation,
    action_protocol: triageResult.action_protocol,
    guide_file_id: triageResult.guide_file_id || null,
    notify_earth: triageResult.notify_earth,
    is_resolved: false,
  };

  try {
    const createdAlert = await databases.createDocument(
      dbId,
      'triage_alerts',
      alertId,
      alertDocument
    );
    log(`Successfully persisted alert document: ${createdAlert.$id}`);
    return res.json({
      success: true,
      deduplicated: false,
      alertId: createdAlert.$id,
      diagnosis: triageResult,
    });
  } catch (persistErr) {
    // If concurrent insert created the alert, handle gracefully
    if (persistErr.code === 409) {
      log(`Concurrent duplicate handled for alert ${alertId}`);
      return res.json({
        success: true,
        deduplicated: true,
        alertId,
      });
    }
    error(`Failed to persist triage alert document: ${persistErr.message}`);
    return res.json({ success: false, error: persistErr.message }, 500);
  }
}
