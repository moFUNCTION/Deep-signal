import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage for Node environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

import {
  AuthCalibrationService,
  CountermeasureService,
  TelemetryService,
  TriageService,
  DtnCommsService,
  DEFAULT_ASTRONAUT_PREFS,
  DEFAULT_DAILY_MISSIONS,
  LIGHT_TIME_DELAY_SECONDS,
  localBus,
} from '../src/index.ts';

test('AuthCalibrationService loads default profile and updates baselines', async () => {
  mockStorage.clear();
  const profile = await AuthCalibrationService.getAstronautProfile();
  assert.equal(profile.astronautCode, 'AST-CDR-01');
  assert.equal(profile.fullName, 'Cmdr. Tariq Al-Mansoor');
  assert.equal(profile.earthBaselines.heart_rate.mean, 56);

  // Update heart rate baseline
  const updated = await AuthCalibrationService.updateEarthBaselines({
    heart_rate: { mean: 58, stdDev: 4 },
  });
  assert.equal(updated.earthBaselines.heart_rate.mean, 58);

  // Reset back to Earth defaults
  const reset = await AuthCalibrationService.resetToEarthDefaults();
  assert.equal(reset.earthBaselines.heart_rate.mean, 56);
});

test('CountermeasureService lists default missions and toggles completion with streak updates', async () => {
  mockStorage.clear();
  const missions = await CountermeasureService.listDailyMissions();
  assert.equal(missions.length, 3);
  assert.equal(missions[0].task_code, 'HYDRATION_2500ML');
  assert.equal(missions[0].is_completed, true);

  const initialStreak = missions[0].streak_days;

  // Toggle to false (streak decrements)
  const toggledFalse = await CountermeasureService.toggleMissionCompletion(
    missions[0].$id,
    false
  );
  assert.equal(toggledFalse.is_completed, false);
  assert.equal(toggledFalse.streak_days, initialStreak - 1);

  // Toggle back to true (streak increments)
  const toggledTrue = await CountermeasureService.toggleMissionCompletion(
    missions[0].$id,
    true
  );
  assert.equal(toggledTrue.is_completed, true);
  assert.equal(toggledTrue.streak_days, initialStreak);
});

test('TelemetryService ingests vitals, assigns edge_alert_id, and limits ring buffer to 30', async () => {
  mockStorage.clear();

  // Ingest nominal reading
  const nominalReading = {
    astronaut_id: 'AST-CDR-01',
    mission_phase: 'DEEP_SPACE_CRUISE',
    heart_rate: 54,
    bp_systolic: 111,
    bp_diastolic: 67,
    blood_glucose: 90,
    body_temp: 36.7,
    spo2: 98,
    sleep_hours: 8.0,
    mood_score: 9,
    cabin_co2_mmhg: 2.0,
    cabin_radiation_msv: 0.3,
  };

  const { vitalDoc, alertDoc } = await TelemetryService.ingestVitalReading(nominalReading, {
    isOfflineMode: true,
  });

  assert.ok(vitalDoc.$id);
  assert.ok(vitalDoc.edge_alert_id);
  assert.equal(vitalDoc.edge_alert_id, alertDoc.$id);
  assert.equal(alertDoc.diagnosis_code, 'ALL_SYSTEMS_NOMINAL');
  assert.equal(alertDoc.severity, 'green');

  // Verify ring buffer limit of 30
  for (let i = 0; i < 35; i++) {
    await TelemetryService.ingestVitalReading({
      ...nominalReading,
      heart_rate: 50 + (i % 10),
    }, { isOfflineMode: true });
  }

  const history = TelemetryService.getLocalHistory();
  assert.equal(history.length, 30);
});

test('TriageService resolves active alerts cleanly', async () => {
  mockStorage.clear();

  // Ingest an alert condition (dehydration)
  // Ensure tasks include uncompleted HYDRATION_2500ML
  await CountermeasureService.toggleMissionCompletion('task_hydration_01', false);

  const dehydrationReading = {
    astronaut_id: 'AST-CDR-01',
    mission_phase: 'DEEP_SPACE_CRUISE',
    heart_rate: 70, // elevated vs 54
    bp_systolic: 102, // lower than baseline 114
    bp_diastolic: 65,
    blood_glucose: 90,
    body_temp: 36.7,
    spo2: 98,
    sleep_hours: 7.0,
    mood_score: 7,
    cabin_co2_mmhg: 2.0,
    cabin_radiation_msv: 0.3,
  };

  const { alertDoc } = await TelemetryService.ingestVitalReading(dehydrationReading, {
    isOfflineMode: true,
  });

  assert.equal(alertDoc.diagnosis_code, 'MICROGRAVITY_HYPOVOLEMIA');
  assert.equal(alertDoc.is_resolved, false);

  // Resolve alert
  await TriageService.resolveAlert(alertDoc.$id);
  const activeAlert = TelemetryService.getActiveAlert();
  assert.equal(activeAlert?.is_resolved, true);
});

test('DtnCommsService manages distance modes and light-time propagation countdowns', async () => {
  mockStorage.clear();

  assert.equal(DtnCommsService.calculateLightTimeDelay('ISS_REALTIME'), 1);
  assert.equal(DtnCommsService.calculateLightTimeDelay('MOON_2S'), 3);
  assert.equal(DtnCommsService.calculateLightTimeDelay('MARS_15M'), 25);
  assert.equal(DtnCommsService.calculateLightTimeDelay('SOLAR_BLACKOUT'), null);

  DtnCommsService.setCommsMode('MOON_2S');
  assert.equal(DtnCommsService.getCommsMode(), 'MOON_2S');

  // Create an Earth transmission packet
  const packet = await DtnCommsService.createEarthTransmission({
    astronaut_id: 'AST-CDR-01',
    alert_id: 'alert_test_123',
    distance_mode: 'MOON_2S',
    delay_seconds: 3,
    status: 'transmitting',
    telemetry_json: JSON.stringify({ hr: 80 }),
  });

  assert.ok(packet.$id);
  assert.equal(packet.status, 'transmitting');

  await DtnCommsService.markReceivedByEarth(packet.$id);
  const pending = await DtnCommsService.getPendingReports('AST-CDR-01');
  assert.equal(pending.length, 0);
});
