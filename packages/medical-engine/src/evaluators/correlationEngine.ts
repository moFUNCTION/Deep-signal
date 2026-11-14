import type {
  AnatomicalSystem,
  EarthBaselines,
  MetricKey,
  MissionPhase,
  TriageDiagnosisOutput,
  VitalReadingInput,
} from '../types.ts';
import { evaluateAllMetrics } from './zScoreEvaluator.ts';

const SYSTEM_MAP: Record<MetricKey, AnatomicalSystem> = {
  heart_rate: 'cardiovascular',
  bp_systolic: 'cardiovascular',
  bp_diastolic: 'cardiovascular',
  spo2: 'cardiovascular',
  cabin_radiation_msv: 'cardiovascular',
  blood_glucose: 'metabolic',
  body_temp: 'metabolic',
  cabin_co2_mmhg: 'nervous',
};

/**
 * Autonomous Space Medicine Triage Correlation Engine
 * Evaluates telemetry against 8 priority-ordered clinical correlation rules.
 * First matching rule produces the final clinical diagnosis and action protocol.
 */
export function runAutonomousTriage(
  vitalReading: VitalReadingInput,
  userBaselines: EarthBaselines,
  missionPhase?: MissionPhase,
  incompleteTasks: string[] = [],
): TriageDiagnosisOutput {
  const phase = missionPhase || vitalReading.mission_phase || 'DEEP_SPACE_CRUISE';
  const evals = evaluateAllMetrics(vitalReading, userBaselines, phase);

  // -------------------------------------------------------------------------
  // Rule 1: Microgravity Localized CO2 Pocket (HYPERCAPNIA_CO2_POCKET)
  // -------------------------------------------------------------------------
  if (
    vitalReading.cabin_co2_mmhg >= 4.0 &&
    (evals.heart_rate.severity !== 'green' ||
      vitalReading.mood_score <= 4 ||
      vitalReading.spo2 <= 94)
  ) {
    const isCritical =
      vitalReading.cabin_co2_mmhg >= 5.0 || evals.spo2.severity === 'red';
    return {
      affected_system: 'nervous',
      severity: isCritical ? 'red' : 'yellow',
      diagnosis_code: 'HYPERCAPNIA_CO2_POCKET',
      diagnosis_title: 'Localized Microgravity CO2 Pocket (Hypercapnia Risk)',
      simple_explanation:
        'Without gravity-driven convection, warm exhaled air does not rise. A stagnant bubble of CO2 has formed around your head, triggering elevated heart rate, cerebral vasodilation headache, and cognitive/mood decline.',
      action_protocol: [
        'Immediately translate at least 2 meters away from your current station to break the stagnant air pocket.',
        'Direct your Personal Ventilation Fan (PVF) toward your face at maximum RPM.',
        'Perform slow diaphragmatic breathing for 3 minutes and inspect the CDRA CO2 scrubber intake.',
      ],
      guide_file_id: 'guide_co2_airflow_check',
      notify_earth: isCritical,
      metric_evaluations: evals,
    };
  }

  // -------------------------------------------------------------------------
  // Rule 2: Acute Radiation & Cardiovascular Stress (ACUTE_RADIATION_CARDIO_STRESS)
  // -------------------------------------------------------------------------
  if (
    vitalReading.cabin_radiation_msv >= 1.5 &&
    (evals.heart_rate.severity === 'red' || evals.body_temp.severity !== 'green')
  ) {
    return {
      affected_system: 'cardiovascular',
      severity: 'red',
      diagnosis_code: 'ACUTE_RADIATION_CARDIO_STRESS',
      diagnosis_title: 'Acute Solar Radiation & Cardiovascular Stress',
      simple_explanation:
        'A spike in cabin radiation dose is coinciding with elevated core temperature and tachycardia, indicating acute autonomic and hematological stress.',
      action_protocol: [
        'Relocate immediately to the high-shielding polyethylene/water Storm Shelter.',
        'Don the AstroRad selective-shielding vest to protect bone marrow and vital organs.',
        'Consume 500 mL of antioxidant electrolyte solution and perform a confirmatory zero-G blood pressure check.',
      ],
      guide_file_id: 'guide_zero_g_bp_cuff',
      notify_earth: true,
      metric_evaluations: evals,
    };
  }

  // -------------------------------------------------------------------------
  // Rule 3: Subclinical Space Dehydration (MICROGRAVITY_HYPOVOLEMIA)
  // -------------------------------------------------------------------------
  const baselineSystolic = userBaselines.bp_systolic?.mean ?? 114;
  if (
    evals.heart_rate.severity !== 'green' &&
    vitalReading.bp_systolic < baselineSystolic &&
    incompleteTasks.includes('HYDRATION_2500ML')
  ) {
    return {
      affected_system: 'cardiovascular',
      severity: 'yellow',
      diagnosis_code: 'MICROGRAVITY_HYPOVOLEMIA',
      diagnosis_title: 'Subclinical Space Dehydration (Countermeasure Incomplete)',
      simple_explanation:
        'Microgravity suppresses your natural thirst reflex via central fluid shift. Your elevated heart rate and lower systolic pressure correlate directly with an incomplete daily hydration task.',
      action_protocol: [
        'Dispense and drink 400 mL of electrolyte-fortified water from the Potable Water Dispenser immediately.',
        'Avoid rapid head rotations to prevent vestibular orthostatic dizziness.',
        'Mark the HYDRATION_2500ML task complete in Daily Countermeasures to restore Mission Readiness.',
      ],
      guide_file_id: 'guide_hydration_electrolyte',
      notify_earth: false,
      metric_evaluations: evals,
    };
  }

  // -------------------------------------------------------------------------
  // Rule 4: Hypoglycemia & Circadian Drift (METABOLIC_CIRCADIAN_DRIFT)
  // -------------------------------------------------------------------------
  if (
    evals.blood_glucose.severity !== 'green' ||
    (vitalReading.sleep_hours < 5.0 && vitalReading.mood_score <= 4)
  ) {
    const isCriticalGlucose =
      vitalReading.blood_glucose <= 65 || evals.blood_glucose.severity === 'red';
    return {
      affected_system: 'metabolic',
      severity: isCriticalGlucose ? 'red' : 'yellow',
      diagnosis_code: 'METABOLIC_CIRCADIAN_DRIFT',
      diagnosis_title: 'Metabolic Energy Deficit & Circadian Desynchronization',
      simple_explanation:
        'Insufficient sleep duration combined with blood glucose deviation is impairing your metabolic equilibrium and reaction speed for mission-critical tasks.',
      action_protocol: [
        'Consume one 15g fast-acting oral glucose pouch from the Ambulatory Medical Pack.',
        'Re-verify capillary blood glucose in 15 minutes using the zero-G surface-tension glucometer.',
        'Shift cabin solid-state lighting to 2700K amber spectrum 90 minutes prior to scheduled sleep.',
      ],
      guide_file_id: 'guide_space_glucometer',
      notify_earth: isCriticalGlucose,
      metric_evaluations: evals,
    };
  }

  // -------------------------------------------------------------------------
  // Rule 5: Musculoskeletal Deconditioning Risk (MUSCULOSKELETAL_UNLOADING_RISK)
  // -------------------------------------------------------------------------
  if (
    incompleteTasks.includes('ARED_WORKOUT') &&
    vitalReading.sleep_hours < 6.0 &&
    phase === 'DEEP_SPACE_CRUISE'
  ) {
    return {
      affected_system: 'musculoskeletal',
      severity: 'yellow',
      diagnosis_code: 'MUSCULOSKELETAL_UNLOADING_RISK',
      diagnosis_title: 'Microgravity Osteopenia & Muscle Atrophy Risk',
      simple_explanation:
        'Unloaded posture in deep space causes 1.5% monthly bone mineral loss unless countered by resistive loading. Your ARED resistive workout remains incomplete today.',
      action_protocol: [
        'Complete a 30-minute resistive session on the ARED platform at 75% load calibration.',
        'Verify Vitamin D3 and calcium metabolic supplementation intake.',
        'Log the ARED_WORKOUT countermeasure to clear this advisory.',
      ],
      guide_file_id: 'guide_ared_resistive_load',
      notify_earth: false,
      metric_evaluations: evals,
    };
  }

  // -------------------------------------------------------------------------
  // Rule 6: General Single-Metric Anomaly Fallback (BIOMETRIC_DEVIATION_${METRIC_KEY})
  // -------------------------------------------------------------------------
  const evalList = Object.values(evals);
  const worstEval =
    evalList.find((e) => e.severity === 'red') ||
    evalList.find((e) => e.severity === 'yellow');

  if (worstEval) {
    const system = SYSTEM_MAP[worstEval.metricKey] || 'cardiovascular';
    const isCritical = worstEval.severity === 'red';
    const cleanKeyName = worstEval.metricKey.replace(/_/g, ' ').toUpperCase();

    return {
      affected_system: system,
      severity: worstEval.severity,
      diagnosis_code: `BIOMETRIC_DEVIATION_${worstEval.metricKey.toUpperCase()}`,
      diagnosis_title: `Personal Baseline Deviation: ${cleanKeyName}`,
      simple_explanation: worstEval.summary,
      action_protocol: [
        'Suspend strenuous EVA or payload operations for 15 minutes.',
        'Verify biometric sensor skin contact and re-sample telemetry.',
        'If deviation persists above 3 sigma, initiate Earth medical packet transmission.',
      ],
      guide_file_id: 'guide_zero_g_bp_cuff',
      notify_earth: isCritical,
      metric_evaluations: evals,
    };
  }

  // -------------------------------------------------------------------------
  // Rule 7: Launch Ascent G-Force Adaptation (LAUNCH_ASCENT_ADAPTATION)
  // -------------------------------------------------------------------------
  if (phase === 'LAUNCH_ASCENT') {
    return {
      affected_system: 'nominal',
      severity: 'green',
      diagnosis_code: 'LAUNCH_ASCENT_ADAPTATION',
      diagnosis_title: 'Nominal Physiological Response to Launch G-Load',
      simple_explanation:
        'Your elevated heart rate and blood pressure are within expected phase-adjusted parameters for 3G launch acceleration. No pathological anomaly detected.',
      action_protocol: [
        'Maintain Anti-G Straining Maneuver (AGSM) breathing rhythm.',
        'Keep lower extremity and abdominal muscles isometric to support cerebral perfusion.',
      ],
      guide_file_id: null,
      notify_earth: false,
      metric_evaluations: evals,
    };
  }

  // -------------------------------------------------------------------------
  // Rule 8: Default Nominal State (ALL_SYSTEMS_NOMINAL)
  // -------------------------------------------------------------------------
  return {
    affected_system: 'nominal',
    severity: 'green',
    diagnosis_code: 'ALL_SYSTEMS_NOMINAL',
    diagnosis_title: 'All Biological Systems Nominal',
    simple_explanation:
      'Your real-time telemetry matches your personal pre-flight baseline adjusted for the current spaceflight phase.',
    action_protocol: [
      'Continue scheduled orbital operations and daily countermeasure regimen.',
    ],
    guide_file_id: null,
    notify_earth: false,
    metric_evaluations: evals,
  };
}
