import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  NASA_HARD_LIMITS,
  MISSION_PHASE_OFFSETS,
  DEFAULT_ASTRONAUT_PREFS,
  STORAGE_VISUAL_GUIDES,
  calculateAdjustedBaseline,
  getPhaseAdjustedBands,
  evaluateSingleMetric,
  evaluateAllMetrics,
  evaluateZScore,
  runAutonomousTriage,
  calculateMissionReadiness,
} from '../index.js';
import type { VitalReadingInput, EarthBaselines } from '../types.js';

const mockBaselines: EarthBaselines = DEFAULT_ASTRONAUT_PREFS.earthBaselines;

function createNominalVitalReading(): VitalReadingInput {
  return {
    astronaut_id: 'AST-CDR-01',
    mission_phase: 'DEEP_SPACE_CRUISE',
    heart_rate: 54, // cruise offset is -2, so 56 - 2 = 54 -> Z = 0.0
    bp_systolic: 111, // 114 - 3 = 111 -> Z = 0.0
    bp_diastolic: 67, // 72 - 5 = 67 -> Z = 0.0
    blood_glucose: 90, // offset 0 -> Z = 0.0
    body_temp: 36.7, // offset 0 -> Z = 0.0
    spo2: 98, // offset 0 -> Z = 0.0
    sleep_hours: 8.0,
    mood_score: 9,
    cabin_co2_mmhg: 2.4,
    cabin_radiation_msv: 0.3,
  };
}

describe('NASA Hard Limits & Environmental Thresholds', () => {
  it('correctly identifies heart rate hard limit breaches', () => {
    const low = evaluateSingleMetric('heart_rate', 42, mockBaselines.heart_rate, 'DEEP_SPACE_CRUISE');
    assert.equal(low.severity, 'red');
    assert.equal(low.triggerType, 'HARD_CLINICAL_LIMIT');
    assert.equal(low.zScore, 9.9);

    const high = evaluateSingleMetric('heart_rate', 145, mockBaselines.heart_rate, 'DEEP_SPACE_CRUISE');
    assert.equal(high.severity, 'red');
    assert.equal(high.triggerType, 'HARD_CLINICAL_LIMIT');

    const nominal = evaluateSingleMetric('heart_rate', 54, mockBaselines.heart_rate, 'DEEP_SPACE_CRUISE');
    assert.equal(nominal.severity, 'green');
    assert.equal(nominal.triggerType, 'NOMINAL');
  });

  it('correctly identifies blood glucose hard limit breaches at boundary 65 and 185', () => {
    const criticalLow = evaluateSingleMetric('blood_glucose', 65, mockBaselines.blood_glucose, 'DEEP_SPACE_CRUISE');
    assert.equal(criticalLow.severity, 'red');
    assert.equal(criticalLow.triggerType, 'HARD_CLINICAL_LIMIT');

    const criticalHigh = evaluateSingleMetric('blood_glucose', 185, mockBaselines.blood_glucose, 'DEEP_SPACE_CRUISE');
    assert.equal(criticalHigh.severity, 'red');
    assert.equal(criticalHigh.triggerType, 'HARD_CLINICAL_LIMIT');

    const nominal = evaluateSingleMetric('blood_glucose', 90, mockBaselines.blood_glucose, 'DEEP_SPACE_CRUISE');
    assert.equal(nominal.severity, 'green');
  });

  it('correctly evaluates SpO2 hypoxemia and 100% nominal boundary', () => {
    const hypoxemia = evaluateSingleMetric('spo2', 91, mockBaselines.spo2, 'DEEP_SPACE_CRUISE');
    assert.equal(hypoxemia.severity, 'red');
    assert.equal(hypoxemia.triggerType, 'HARD_CLINICAL_LIMIT');

    // 98% and 100% must be nominal (not red)
    const nominal = evaluateSingleMetric('spo2', 98, mockBaselines.spo2, 'DEEP_SPACE_CRUISE');
    assert.equal(nominal.severity, 'green');

    const hundred = evaluateSingleMetric('spo2', 100, mockBaselines.spo2, 'DEEP_SPACE_CRUISE');
    assert.equal(hundred.severity, 'green');

    // Over 100% is sensor glitch / breached
    const glitch = evaluateSingleMetric('spo2', 101, mockBaselines.spo2, 'DEEP_SPACE_CRUISE');
    assert.equal(glitch.severity, 'red');
  });

  it('evaluates environmental CO2: nominal < 3.8, elevated >= 3.8, critical >= 5.0', () => {
    const nominal = evaluateSingleMetric('cabin_co2_mmhg', 2.5);
    assert.equal(nominal.severity, 'green');
    assert.equal(nominal.triggerType, 'ENVIRONMENTAL_NOMINAL');

    const elevated = evaluateSingleMetric('cabin_co2_mmhg', 3.8);
    assert.equal(elevated.severity, 'yellow');
    assert.equal(elevated.triggerType, 'ENVIRONMENTAL_ELEVATED');

    const critical = evaluateSingleMetric('cabin_co2_mmhg', 5.0);
    assert.equal(critical.severity, 'red');
    assert.equal(critical.triggerType, 'HARD_CLINICAL_LIMIT');
    assert.equal(critical.zScore, 9.9);
  });

  it('evaluates environmental radiation: nominal < 1.2, elevated >= 1.2, critical >= 2.0', () => {
    const nominal = evaluateSingleMetric('cabin_radiation_msv', 0.5);
    assert.equal(nominal.severity, 'green');

    const elevated = evaluateSingleMetric('cabin_radiation_msv', 1.2);
    assert.equal(elevated.severity, 'yellow');
    assert.equal(elevated.triggerType, 'ENVIRONMENTAL_ELEVATED');

    const critical = evaluateSingleMetric('cabin_radiation_msv', 2.0);
    assert.equal(critical.severity, 'red');
    assert.equal(critical.triggerType, 'HARD_CLINICAL_LIMIT');
  });
});

describe('Phase-Adjusted Baselines & Launch Ascent 3G Peak', () => {
  it('correctly computes phase-adjusted baselines across all flight phases', () => {
    const launchAscentBaselines = calculateAdjustedBaseline(mockBaselines, 'LAUNCH_ASCENT');
    // Pre-flight HR mean: 56, Launch Ascent offset: +30 -> 86
    assert.equal(launchAscentBaselines.heart_rate.adjustedMean, 86);
    // Pre-flight HR stdDev: 4, Launch Ascent kappa: 1.8 -> 7.2
    assert.equal(launchAscentBaselines.heart_rate.effectiveStdDev, 7.2);

    const earlyOrbitBaselines = calculateAdjustedBaseline(mockBaselines, 'EARLY_ORBIT_ADAPTATION');
    // HR: 56 + 6 = 62, stdDev: 4 * 1.25 = 5.0
    assert.equal(earlyOrbitBaselines.heart_rate.adjustedMean, 62);
    assert.equal(earlyOrbitBaselines.heart_rate.effectiveStdDev, 5.0);
  });

  it('verifies Launch Ascent 3G peak calculates Z = 0.0 sigma without false alarm', () => {
    // During 3G Launch Ascent, astronaut HR elevates to 86 bpm (nominal for launch acceleration)
    const reading: VitalReadingInput = {
      astronaut_id: 'AST-CDR-01',
      mission_phase: 'LAUNCH_ASCENT',
      heart_rate: 86,
      bp_systolic: 132, // 114 + 18 = 132
      bp_diastolic: 82, // 72 + 10 = 82
      blood_glucose: 102, // 90 + 12 = 102
      body_temp: 36.9, // 36.7 + 0.2 = 36.9
      spo2: 97, // 98 - 1 = 97
      sleep_hours: 7.0,
      mood_score: 8,
      cabin_co2_mmhg: 2.3,
      cabin_radiation_msv: 0.2,
    };

    const evals = evaluateAllMetrics(reading, mockBaselines, 'LAUNCH_ASCENT');
    assert.equal(evals.heart_rate.adjustedMean, 86);
    assert.equal(evals.heart_rate.zScore, 0.0);
    assert.equal(evals.heart_rate.severity, 'green');

    // Run triage engine - must trigger Rule 7 LAUNCH_ASCENT_ADAPTATION (nominal green, not false alarm)
    const triage = runAutonomousTriage(reading, mockBaselines, 'LAUNCH_ASCENT', []);
    assert.equal(triage.diagnosis_code, 'LAUNCH_ASCENT_ADAPTATION');
    assert.equal(triage.severity, 'green');
    assert.equal(triage.affected_system, 'nominal');
    assert.equal(triage.notify_earth, false);
  });

  it('generates phase-adjusted reference bands for charts', () => {
    const bands = getPhaseAdjustedBands('heart_rate', mockBaselines.heart_rate, 'EARLY_ORBIT_ADAPTATION');
    assert.equal(bands.adjustedMean, 62);
    assert.equal(bands.effectiveStdDev, 5.0);
    assert.equal(bands.upper2Sigma, 72);
    assert.equal(bands.lower2Sigma, 52);
    assert.equal(bands.upper3Sigma, 77);
    assert.equal(bands.lower3Sigma, 47);
  });
});

describe('Autonomous Triage Engine - All 8 Rules Verification', () => {
  it('Rule 1: triggers HYPERCAPNIA_CO2_POCKET on elevated CO2 and distress markers', () => {
    const reading = createNominalVitalReading();
    reading.cabin_co2_mmhg = 4.2;
    reading.mood_score = 3; // mood <= 4 triggers Rule 1

    const triageYellow = runAutonomousTriage(reading, mockBaselines, 'DEEP_SPACE_CRUISE', []);
    assert.equal(triageYellow.diagnosis_code, 'HYPERCAPNIA_CO2_POCKET');
    assert.equal(triageYellow.severity, 'yellow');
    assert.equal(triageYellow.affected_system, 'nervous');
    assert.equal(triageYellow.guide_file_id, 'guide_co2_airflow_check');
    assert.equal(triageYellow.notify_earth, false);

    // Critical hypercapnia: CO2 >= 5.0
    reading.cabin_co2_mmhg = 5.4;
    const triageRed = runAutonomousTriage(reading, mockBaselines, 'DEEP_SPACE_CRUISE', []);
    assert.equal(triageRed.diagnosis_code, 'HYPERCAPNIA_CO2_POCKET');
    assert.equal(triageRed.severity, 'red');
    assert.equal(triageRed.notify_earth, true);
  });

  it('Rule 2: triggers ACUTE_RADIATION_CARDIO_STRESS during Solar Particle Event', () => {
    const reading = createNominalVitalReading();
    reading.cabin_radiation_msv = 3.8;
    reading.heart_rate = 128; // tachycardia under radiation stress
    reading.body_temp = 38.1;

    const triage = runAutonomousTriage(reading, mockBaselines, 'DEEP_SPACE_CRUISE', []);
    assert.equal(triage.diagnosis_code, 'ACUTE_RADIATION_CARDIO_STRESS');
    assert.equal(triage.severity, 'red');
    assert.equal(triage.affected_system, 'cardiovascular');
    assert.equal(triage.guide_file_id, 'guide_zero_g_bp_cuff');
    assert.equal(triage.notify_earth, true);
  });

  it('Rule 3: triggers MICROGRAVITY_HYPOVOLEMIA when hydration countermeasure is incomplete', () => {
    const reading = createNominalVitalReading();
    reading.mission_phase = 'EARLY_ORBIT_ADAPTATION';
    // baseline systolic mean is 114
    reading.bp_systolic = 102; // < baseline 114
    reading.heart_rate = 75; // elevated HR (> 62 adjMean + 2*sigma 5.0)

    const triage = runAutonomousTriage(
      reading,
      mockBaselines,
      'EARLY_ORBIT_ADAPTATION',
      ['HYDRATION_2500ML'], // incomplete task
    );
    assert.equal(triage.diagnosis_code, 'MICROGRAVITY_HYPOVOLEMIA');
    assert.equal(triage.severity, 'yellow');
    assert.equal(triage.affected_system, 'cardiovascular');
    assert.equal(triage.guide_file_id, 'guide_hydration_electrolyte');
    assert.equal(triage.notify_earth, false);
  });

  it('Rule 4: triggers METABOLIC_CIRCADIAN_DRIFT on hypoglycemia or sleep/mood desynchronization', () => {
    // Critical hypoglycemia: blood glucose <= 65
    const readingCritical = createNominalVitalReading();
    readingCritical.blood_glucose = 63;
    readingCritical.sleep_hours = 3.8;
    readingCritical.mood_score = 3;

    const triageCritical = runAutonomousTriage(readingCritical, mockBaselines, 'DEEP_SPACE_CRUISE', []);
    assert.equal(triageCritical.diagnosis_code, 'METABOLIC_CIRCADIAN_DRIFT');
    assert.equal(triageCritical.severity, 'red');
    assert.equal(triageCritical.affected_system, 'metabolic');
    assert.equal(triageCritical.guide_file_id, 'guide_space_glucometer');
    assert.equal(triageCritical.notify_earth, true);

    // Moderate circadian drift: sleep < 5 and mood <= 4 without critical glucose
    const readingModerate = createNominalVitalReading();
    readingModerate.sleep_hours = 4.5;
    readingModerate.mood_score = 4;
    readingModerate.blood_glucose = 90;

    const triageModerate = runAutonomousTriage(readingModerate, mockBaselines, 'DEEP_SPACE_CRUISE', []);
    assert.equal(triageModerate.diagnosis_code, 'METABOLIC_CIRCADIAN_DRIFT');
    assert.equal(triageModerate.severity, 'yellow');
    assert.equal(triageModerate.notify_earth, false);
  });

  it('Rule 5: triggers MUSCULOSKELETAL_UNLOADING_RISK on incomplete ARED workout in deep space cruise', () => {
    const reading = createNominalVitalReading();
    reading.mission_phase = 'DEEP_SPACE_CRUISE';
    reading.sleep_hours = 5.2; // < 6.0
    reading.mood_score = 6;

    const triage = runAutonomousTriage(
      reading,
      mockBaselines,
      'DEEP_SPACE_CRUISE',
      ['ARED_WORKOUT'], // incomplete ARED
    );
    assert.equal(triage.diagnosis_code, 'MUSCULOSKELETAL_UNLOADING_RISK');
    assert.equal(triage.severity, 'yellow');
    assert.equal(triage.affected_system, 'musculoskeletal');
    assert.equal(triage.guide_file_id, 'guide_ared_resistive_load');
    assert.equal(triage.notify_earth, false);
  });

  it('Rule 6: triggers BIOMETRIC_DEVIATION fallback when single metric is anomalous', () => {
    const reading = createNominalVitalReading();
    // In deep space cruise, body temp baseline is 36.7, stdDev 0.25
    // Set body temp to 37.8 -> Z = (37.8 - 36.7) / 0.25 = 4.4 sigma (> 3.0 -> red)
    reading.body_temp = 37.8;

    const triage = runAutonomousTriage(reading, mockBaselines, 'DEEP_SPACE_CRUISE', []);
    assert.equal(triage.diagnosis_code, 'BIOMETRIC_DEVIATION_BODY_TEMP');
    assert.equal(triage.severity, 'red');
    assert.equal(triage.affected_system, 'metabolic');
    assert.equal(triage.notify_earth, true);
  });

  it('Rule 7: triggers LAUNCH_ASCENT_ADAPTATION during nominal launch g-force', () => {
    const reading = createNominalVitalReading();
    reading.mission_phase = 'LAUNCH_ASCENT';
    reading.heart_rate = 86; // 56 + 30
    reading.bp_systolic = 132; // 114 + 18
    reading.bp_diastolic = 82; // 72 + 10
    reading.blood_glucose = 102; // 90 + 12
    reading.body_temp = 36.9; // 36.7 + 0.2
    reading.spo2 = 97; // 98 - 1

    const triage = runAutonomousTriage(reading, mockBaselines, 'LAUNCH_ASCENT', []);
    assert.equal(triage.diagnosis_code, 'LAUNCH_ASCENT_ADAPTATION');
    assert.equal(triage.severity, 'green');
    assert.equal(triage.affected_system, 'nominal');
  });

  it('Rule 8: triggers ALL_SYSTEMS_NOMINAL when all vitals match baseline', () => {
    const reading = createNominalVitalReading();
    const triage = runAutonomousTriage(reading, mockBaselines, 'DEEP_SPACE_CRUISE', []);
    assert.equal(triage.diagnosis_code, 'ALL_SYSTEMS_NOMINAL');
    assert.equal(triage.severity, 'green');
    assert.equal(triage.affected_system, 'nominal');
    assert.equal(triage.notify_earth, false);
  });
});

describe('Mission Readiness Score Calculation', () => {
  it('calculates 100% readiness and OPTIMAL_FOR_EVA on perfect metrics', () => {
    const reading = createNominalVitalReading();
    const evals = evaluateAllMetrics(reading, mockBaselines, 'DEEP_SPACE_CRUISE');

    const result = calculateMissionReadiness({
      evaluations: evals,
      completedTasksCount: 3,
      totalTasksCount: 3,
      sleepHours: 8.0,
      moodScore: 10,
    });

    assert.equal(result.vitalsScore, 100);
    assert.equal(result.countermeasuresScore, 100);
    assert.equal(result.sleepMoodScore, 100);
    assert.equal(result.missionReadiness, 100);
    assert.equal(result.status, 'OPTIMAL_FOR_EVA');
  });

  it('triggers CAUTION_MONITOR when a metric is yellow or readiness < 80', () => {
    const reading = createNominalVitalReading();
    reading.cabin_co2_mmhg = 4.0; // yellow environmental
    const evals = evaluateAllMetrics(reading, mockBaselines, 'DEEP_SPACE_CRUISE');

    const result = calculateMissionReadiness({
      evaluations: evals,
      completedTasksCount: 3,
      totalTasksCount: 3,
      sleepHours: 7.5,
      moodScore: 9,
    });

    assert.equal(result.yellowCount, 1);
    assert.equal(result.vitalsScore, 85); // 100 - 15
    assert.equal(result.status, 'CAUTION_MONITOR');
  });

  it('triggers NO_GO_MEDICAL_HOLD when any metric is red', () => {
    const reading = createNominalVitalReading();
    reading.blood_glucose = 62; // red hard limit breach
    const evals = evaluateAllMetrics(reading, mockBaselines, 'DEEP_SPACE_CRUISE');

    const result = calculateMissionReadiness({
      evaluations: evals,
      completedTasksCount: 3,
      totalTasksCount: 3,
      sleepHours: 8.0,
      moodScore: 10,
    });

    assert.equal(result.redCount, 1);
    assert.equal(result.vitalsScore, 60); // 100 - 40
    assert.equal(result.status, 'NO_GO_MEDICAL_HOLD');
  });

  it('dynamically increases readiness when daily countermeasure is completed', () => {
    const reading = createNominalVitalReading();
    const evals = evaluateAllMetrics(reading, mockBaselines, 'DEEP_SPACE_CRUISE');

    // Incomplete countermeasures (0 of 3 completed)
    const beforeResult = calculateMissionReadiness({
      evaluations: evals,
      completedTasksCount: 0,
      totalTasksCount: 3,
      sleepHours: 7.5,
      moodScore: 8,
    });

    // Completed all countermeasures (3 of 3 completed)
    const afterResult = calculateMissionReadiness({
      evaluations: evals,
      completedTasksCount: 3,
      totalTasksCount: 3,
      sleepHours: 7.5,
      moodScore: 8,
    });

    assert.ok(afterResult.missionReadiness > beforeResult.missionReadiness);
    assert.equal(beforeResult.countermeasuresScore, 0);
    assert.equal(afterResult.countermeasuresScore, 100);
  });
});

describe('Protocols and Storage Visual Guides', () => {
  it('verifies all 5 required emergency visual guides exist with 3-step fallbacks', () => {
    const expectedGuides = [
      'guide_co2_airflow_check',
      'guide_zero_g_bp_cuff',
      'guide_hydration_electrolyte',
      'guide_space_glucometer',
      'guide_ared_resistive_load',
    ];

    for (const guideId of expectedGuides) {
      const guide = STORAGE_VISUAL_GUIDES[guideId];
      assert.ok(guide, `Guide ${guideId} must exist`);
      assert.ok(guide.title && guide.title.length > 5);
      assert.ok(guide.durationSec > 0);
      assert.ok(guide.equipmentLocation && guide.equipmentLocation.length > 5);
      assert.equal(guide.fallbackSteps.length, 3, `${guideId} must have exactly 3 fallback steps`);
      for (const step of guide.fallbackSteps) {
        assert.ok(step && step.length > 10, 'Each step must contain descriptive text');
      }
    }
  });
});
