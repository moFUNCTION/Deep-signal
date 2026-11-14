import test from 'node:test';
import assert from 'node:assert/strict';
import { runAutonomousTriage, DEFAULT_EARTH_BASELINES } from '../src/triageEngine.js';
import mainHandler from '../src/main.js';

test('Rule 1: Microgravity Localized CO2 Pocket triggers nervous system alert', () => {
  // Moderate yellow case: CO2 >= 4.0, mood <= 4, spo2 nominal (97%)
  const readingYellow = {
    astronaut_id: 'AST-CDR-01',
    heart_rate: 54,
    bp_systolic: 111,
    bp_diastolic: 67,
    blood_glucose: 90,
    body_temp: 36.7,
    spo2: 97,
    cabin_co2_mmhg: 4.2, // >= 4.0 but < 5.0
    cabin_radiation_msv: 0.3,
    sleep_hours: 7.0,
    mood_score: 3, // <= 4
  };

  const resultYellow = runAutonomousTriage(readingYellow, DEFAULT_EARTH_BASELINES, 'DEEP_SPACE_CRUISE', []);
  assert.equal(resultYellow.diagnosis_code, 'HYPERCAPNIA_CO2_POCKET');
  assert.equal(resultYellow.affected_system, 'nervous');
  assert.equal(resultYellow.severity, 'yellow');
  assert.equal(resultYellow.notify_earth, false);
  assert.equal(resultYellow.guide_file_id, 'guide_co2_airflow_check');

  // Critical red case: CO2 >= 5.0
  const readingRed = {
    ...readingYellow,
    cabin_co2_mmhg: 5.2,
  };
  const resultRed = runAutonomousTriage(readingRed, DEFAULT_EARTH_BASELINES, 'DEEP_SPACE_CRUISE', []);
  assert.equal(resultRed.severity, 'red');
  assert.equal(resultRed.notify_earth, true);
});

test('Rule 2: Solar Particle Event & Radiation Stress triggers red cardiovascular alert', () => {
  const reading = {
    astronaut_id: 'AST-CDR-01',
    heart_rate: 110, // severe deviation / red
    bp_systolic: 125,
    bp_diastolic: 80,
    blood_glucose: 90,
    body_temp: 38.0, // elevated
    spo2: 97,
    cabin_co2_mmhg: 2.0,
    cabin_radiation_msv: 1.8, // >= 1.5
    sleep_hours: 7.0,
    mood_score: 8,
  };

  const result = runAutonomousTriage(reading, DEFAULT_EARTH_BASELINES, 'DEEP_SPACE_CRUISE', []);
  assert.equal(result.diagnosis_code, 'ACUTE_RADIATION_CARDIO_STRESS');
  assert.equal(result.affected_system, 'cardiovascular');
  assert.equal(result.severity, 'red');
  assert.equal(result.notify_earth, true);
  assert.equal(result.guide_file_id, 'guide_zero_g_bp_cuff');
});

test('Rule 3: Subclinical Space Dehydration triggers when HYDRATION_2500ML is incomplete', () => {
  const reading = {
    astronaut_id: 'AST-CDR-01',
    heart_rate: 68, // elevated vs baseline 56 -> Z > 2.0
    bp_systolic: 105, // < baseline 114
    bp_diastolic: 70,
    blood_glucose: 90,
    body_temp: 36.7,
    spo2: 98,
    cabin_co2_mmhg: 2.2,
    cabin_radiation_msv: 0.3,
    sleep_hours: 7.0,
    mood_score: 7,
  };

  const result = runAutonomousTriage(
    reading,
    DEFAULT_EARTH_BASELINES,
    'DEEP_SPACE_CRUISE',
    ['HYDRATION_2500ML']
  );
  assert.equal(result.diagnosis_code, 'MICROGRAVITY_HYPOVOLEMIA');
  assert.equal(result.affected_system, 'cardiovascular');
  assert.equal(result.severity, 'yellow');
  assert.equal(result.guide_file_id, 'guide_hydration_electrolyte');
  assert.equal(result.notify_earth, false);
});

test('Rule 4: Hypoglycemia triggers metabolic alert and notifies earth if critical', () => {
  const reading = {
    astronaut_id: 'AST-CDR-01',
    heart_rate: 56,
    bp_systolic: 114,
    bp_diastolic: 72,
    blood_glucose: 60, // critical <= 65
    body_temp: 36.7,
    spo2: 98,
    cabin_co2_mmhg: 2.0,
    cabin_radiation_msv: 0.3,
    sleep_hours: 7.0,
    mood_score: 7,
  };

  const result = runAutonomousTriage(reading, DEFAULT_EARTH_BASELINES, 'DEEP_SPACE_CRUISE', []);
  assert.equal(result.diagnosis_code, 'METABOLIC_CIRCADIAN_DRIFT');
  assert.equal(result.affected_system, 'metabolic');
  assert.equal(result.severity, 'red');
  assert.equal(result.notify_earth, true);
  assert.equal(result.guide_file_id, 'guide_space_glucometer');
});

test('Rule 5: Musculoskeletal Deconditioning Risk triggers when ARED_WORKOUT is incomplete', () => {
  const reading = {
    astronaut_id: 'AST-CDR-01',
    heart_rate: 54, // cruise baseline 54, nominal
    bp_systolic: 111,
    bp_diastolic: 67,
    blood_glucose: 90,
    body_temp: 36.7,
    spo2: 98,
    cabin_co2_mmhg: 2.0,
    cabin_radiation_msv: 0.3,
    sleep_hours: 5.5, // < 6.0
    mood_score: 7,
  };

  const result = runAutonomousTriage(
    reading,
    DEFAULT_EARTH_BASELINES,
    'DEEP_SPACE_CRUISE',
    ['ARED_WORKOUT']
  );
  assert.equal(result.diagnosis_code, 'MUSCULOSKELETAL_UNLOADING_RISK');
  assert.equal(result.affected_system, 'musculoskeletal');
  assert.equal(result.severity, 'yellow');
  assert.equal(result.guide_file_id, 'guide_ared_resistive_load');
});

test('Rule 7: Launch Ascent 3G Peak produces Z=0.0 sigma against phase baseline without false alarm', () => {
  // During LAUNCH_ASCENT: HR offset = +30 -> adjusted mean = 56 + 30 = 86
  // SBP offset = +18 -> adjusted mean = 114 + 18 = 132
  // DBP offset = +10 -> adjusted mean = 72 + 10 = 82
  const reading = {
    astronaut_id: 'AST-CDR-01',
    heart_rate: 86,
    bp_systolic: 132,
    bp_diastolic: 82,
    blood_glucose: 102, // 90 + 12
    body_temp: 36.9, // 36.7 + 0.2
    spo2: 97, // 98 - 1
    cabin_co2_mmhg: 2.0,
    cabin_radiation_msv: 0.3,
    sleep_hours: 8.0,
    mood_score: 9,
  };

  const result = runAutonomousTriage(reading, DEFAULT_EARTH_BASELINES, 'LAUNCH_ASCENT', []);
  assert.equal(result.diagnosis_code, 'LAUNCH_ASCENT_ADAPTATION');
  assert.equal(result.severity, 'green');
  assert.equal(result.affected_system, 'nominal');
  assert.equal(result.metric_evaluations.heart_rate.zScore, 0);
  assert.equal(result.metric_evaluations.bp_systolic.zScore, 0);
});

test('Rule 8: Nominal cruise telemetry returns ALL_SYSTEMS_NOMINAL', () => {
  // During DEEP_SPACE_CRUISE: HR offset = -2 -> 54, SBP = -3 -> 111, DBP = -5 -> 67
  const reading = {
    astronaut_id: 'AST-CDR-01',
    heart_rate: 54,
    bp_systolic: 111,
    bp_diastolic: 67,
    blood_glucose: 90,
    body_temp: 36.7,
    spo2: 98,
    cabin_co2_mmhg: 2.4,
    cabin_radiation_msv: 0.3,
    sleep_hours: 7.5,
    mood_score: 8,
  };

  const result = runAutonomousTriage(reading, DEFAULT_EARTH_BASELINES, 'DEEP_SPACE_CRUISE', []);
  assert.equal(result.diagnosis_code, 'ALL_SYSTEMS_NOMINAL');
  assert.equal(result.severity, 'green');
  assert.equal(result.affected_system, 'nominal');
});

test('Cloud function main handler gracefully parses payload and handles missing astronaut_id', async () => {
  let loggedMsg = '';
  let sentJson = null;
  let sentStatus = 200;

  const mockContext = {
    req: { body: JSON.stringify({}) },
    res: {
      json: (data, status = 200) => {
        sentJson = data;
        sentStatus = status;
        return { data, status };
      },
    },
    log: (msg) => { loggedMsg += msg; },
    error: (err) => { loggedMsg += err; },
  };

  await mainHandler(mockContext);
  assert.equal(sentStatus, 400);
  assert.equal(sentJson.success, false);
});
