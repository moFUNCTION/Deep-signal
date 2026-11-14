/**
 * Self-contained Isomorphic Clinical Triage Engine for AURA
 * Implements NASA hard clinical limits, mission phase baseline offsets,
 * dual-filter personal Z-score calculation, and the 8 clinical triage rules.
 */

export const NASA_HARD_LIMITS = {
  heart_rate: { minCritical: 42, maxCritical: 145, unit: 'bpm', label: 'Heart Rate' },
  bp_systolic: { minCritical: 85, maxCritical: 160, unit: 'mmHg', label: 'Systolic BP' },
  bp_diastolic: { minCritical: 50, maxCritical: 100, unit: 'mmHg', label: 'Diastolic BP' },
  blood_glucose: { minCritical: 65, maxCritical: 185, unit: 'mg/dL', label: 'Blood Glucose' },
  body_temp: { minCritical: 35.5, maxCritical: 38.3, unit: 'degC', label: 'Core Temp' },
  spo2: { minCritical: 91, maxCritical: 100, unit: '%', label: 'Oxygen Saturation' },
  cabin_co2_mmhg: { minCritical: 0, maxCritical: 5.0, yellowThreshold: 3.8, unit: 'mmHg', label: 'Cabin CO2' },
  cabin_radiation_msv: { minCritical: 0, maxCritical: 2.0, yellowThreshold: 1.2, unit: 'mSv/day', label: 'Radiation Dose' },
};

export const MISSION_PHASE_OFFSETS = {
  PRE_FLIGHT_BDC: {
    offsets: { heart_rate: 0, bp_systolic: 0, bp_diastolic: 0, blood_glucose: 0, body_temp: 0, spo2: 0 },
    stdDevMultiplier: 1.0,
  },
  LAUNCH_ASCENT: {
    offsets: { heart_rate: 30, bp_systolic: 18, bp_diastolic: 10, blood_glucose: 12, body_temp: 0.2, spo2: -1 },
    stdDevMultiplier: 1.8,
  },
  EARLY_ORBIT_ADAPTATION: {
    offsets: { heart_rate: 6, bp_systolic: 8, bp_diastolic: -4, blood_glucose: 5, body_temp: 0.1, spo2: 0 },
    stdDevMultiplier: 1.25,
  },
  DEEP_SPACE_CRUISE: {
    offsets: { heart_rate: -2, bp_systolic: -3, bp_diastolic: -5, blood_glucose: 0, body_temp: 0, spo2: 0 },
    stdDevMultiplier: 1.0,
  },
};

export const DEFAULT_EARTH_BASELINES = {
  heart_rate: { mean: 56, stdDev: 4 },
  bp_systolic: { mean: 114, stdDev: 7 },
  bp_diastolic: { mean: 72, stdDev: 5 },
  blood_glucose: { mean: 90, stdDev: 8 },
  body_temp: { mean: 36.7, stdDev: 0.25 },
  spo2: { mean: 98, stdDev: 1 },
};

function round2Decimals(val) {
  return Math.round(val * 100) / 100;
}

/**
 * Evaluates a single biometric or environmental metric against NASA hard limits and personal Z-scores.
 */
export function evaluateSingleMetric(metricKey, currentValue, earthBaseline, missionPhase = 'DEEP_SPACE_CRUISE') {
  const hardLimit = NASA_HARD_LIMITS[metricKey];

  // Environmental Metrics (cabin_co2_mmhg, cabin_radiation_msv)
  if (metricKey === 'cabin_co2_mmhg' || metricKey === 'cabin_radiation_msv') {
    if (currentValue >= hardLimit.maxCritical) {
      return {
        metricKey,
        currentValue,
        adjustedMean: null,
        severity: 'red',
        triggerType: 'HARD_CLINICAL_LIMIT',
        zScore: 9.9,
        deviationPercent: 0,
        summary: `${hardLimit.label} (${currentValue} ${hardLimit.unit}) exceeds NASA maximum critical safety ceiling of ${hardLimit.maxCritical} ${hardLimit.unit}.`,
      };
    }
    if (currentValue >= hardLimit.yellowThreshold) {
      return {
        metricKey,
        currentValue,
        adjustedMean: null,
        severity: 'yellow',
        triggerType: 'ENVIRONMENTAL_ELEVATED',
        zScore: 2.5,
        deviationPercent: 0,
        summary: `${hardLimit.label} elevated at ${currentValue} ${hardLimit.unit} (caution threshold ${hardLimit.yellowThreshold} ${hardLimit.unit}).`,
      };
    }
    return {
      metricKey,
      currentValue,
      adjustedMean: null,
      severity: 'green',
      triggerType: 'ENVIRONMENTAL_NOMINAL',
      zScore: 0,
      deviationPercent: 0,
      summary: `${hardLimit.label} nominal at ${currentValue} ${hardLimit.unit}.`,
    };
  }

  // Primary Filter: NASA Clinical Hard Limits
  if (hardLimit && (currentValue <= hardLimit.minCritical || currentValue >= hardLimit.maxCritical)) {
    const isHigh = currentValue >= hardLimit.maxCritical;
    const boundary = isHigh ? hardLimit.maxCritical : hardLimit.minCritical;
    return {
      metricKey,
      currentValue,
      adjustedMean: earthBaseline?.mean ?? null,
      severity: 'red',
      triggerType: 'HARD_CLINICAL_LIMIT',
      zScore: 9.9,
      deviationPercent: earthBaseline ? Math.round(((currentValue - earthBaseline.mean) / earthBaseline.mean) * 100) : 0,
      summary: `CRITICAL: ${hardLimit.label} (${currentValue} ${hardLimit.unit}) violated NASA hard clinical limit (${isHigh ? '>=' : '<='} ${boundary} ${hardLimit.unit}).`,
    };
  }

  // Secondary Filter: Personal Adjusted Z-Score
  const baseline = earthBaseline || DEFAULT_EARTH_BASELINES[metricKey];
  const phaseConfig = MISSION_PHASE_OFFSETS[missionPhase] || MISSION_PHASE_OFFSETS.DEEP_SPACE_CRUISE;
  const offset = phaseConfig.offsets[metricKey] || 0;
  const kappa = phaseConfig.stdDevMultiplier || 1.0;

  const adjustedMean = round2Decimals(baseline.mean + offset);
  const effectiveStdDev = Math.max(0.1, baseline.stdDev * kappa);
  const rawZ = Math.abs(currentValue - adjustedMean) / effectiveStdDev;
  const zScore = round2Decimals(rawZ);
  const deviationPercent = Math.round(((currentValue - adjustedMean) / adjustedMean) * 100);

  let severity = 'green';
  let triggerType = 'NOMINAL';
  let summary = `${hardLimit?.label || metricKey} (${currentValue}) is within expected personal bounds (Z=${zScore}σ).`;

  if (zScore >= 3.0) {
    severity = 'red';
    triggerType = 'SEVERE_PERSONAL_DEVIATION';
    summary = `SEVERE: ${hardLimit?.label || metricKey} has deviated ${zScore}σ from personal adjusted baseline (${adjustedMean}).`;
  } else if (zScore >= 2.0) {
    severity = 'yellow';
    triggerType = 'MODERATE_PERSONAL_DEVIATION';
    summary = `CAUTION: ${hardLimit?.label || metricKey} is ${zScore}σ from adjusted baseline (${adjustedMean}).`;
  }

  return {
    metricKey,
    currentValue,
    adjustedMean,
    severity,
    triggerType,
    zScore,
    deviationPercent,
    summary,
  };
}

/**
 * Runs the deterministic 8-rule clinical triage correlation engine.
 */
export function runAutonomousTriage(vitalReading, userBaselines = DEFAULT_EARTH_BASELINES, missionPhase = 'DEEP_SPACE_CRUISE', incompleteTasks = []) {
  const evals = {
    heart_rate: evaluateSingleMetric('heart_rate', vitalReading.heart_rate, userBaselines.heart_rate, missionPhase),
    bp_systolic: evaluateSingleMetric('bp_systolic', vitalReading.bp_systolic, userBaselines.bp_systolic, missionPhase),
    bp_diastolic: evaluateSingleMetric('bp_diastolic', vitalReading.bp_diastolic, userBaselines.bp_diastolic, missionPhase),
    blood_glucose: evaluateSingleMetric('blood_glucose', vitalReading.blood_glucose, userBaselines.blood_glucose, missionPhase),
    body_temp: evaluateSingleMetric('body_temp', vitalReading.body_temp, userBaselines.body_temp, missionPhase),
    spo2: evaluateSingleMetric('spo2', vitalReading.spo2, userBaselines.spo2, missionPhase),
    cabin_co2_mmhg: evaluateSingleMetric('cabin_co2_mmhg', vitalReading.cabin_co2_mmhg, null, missionPhase),
    cabin_radiation_msv: evaluateSingleMetric('cabin_radiation_msv', vitalReading.cabin_radiation_msv, null, missionPhase),
  };

  // Rule 1: Microgravity Localized CO2 Pocket (Hypercapnia Risk)
  if (
    vitalReading.cabin_co2_mmhg >= 4.0 &&
    (evals.heart_rate.severity !== 'green' || (vitalReading.mood_score !== undefined && vitalReading.mood_score <= 4) || vitalReading.spo2 <= 94)
  ) {
    const isCritical = vitalReading.cabin_co2_mmhg >= 5.0 || evals.spo2.severity === 'red';
    return {
      affected_system: 'nervous',
      severity: isCritical ? 'red' : 'yellow',
      diagnosis_code: 'HYPERCAPNIA_CO2_POCKET',
      diagnosis_title: 'Localized Microgravity CO2 Pocket (Hypercapnia Risk)',
      simple_explanation: 'Without gravity-driven convection, warm exhaled air does not rise. A stagnant bubble of CO2 has formed around your head, triggering elevated heart rate, cerebral vasodilation headache, and cognitive/mood decline.',
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

  // Rule 2: Solar Particle Event & Acute Cardiovascular Radiation Stress
  if (
    vitalReading.cabin_radiation_msv >= 1.5 &&
    (evals.heart_rate.severity === 'red' || evals.body_temp.severity !== 'green')
  ) {
    return {
      affected_system: 'cardiovascular',
      severity: 'red',
      diagnosis_code: 'ACUTE_RADIATION_CARDIO_STRESS',
      diagnosis_title: 'Acute Solar Radiation & Cardiovascular Stress',
      simple_explanation: 'A spike in cabin radiation dose is coinciding with elevated core temperature and tachycardia, indicating acute autonomic and hematological stress.',
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

  // Rule 3: Space Dehydration Linked to Missed Hydration Countermeasure
  if (
    evals.heart_rate.severity !== 'green' &&
    vitalReading.bp_systolic < (userBaselines.bp_systolic?.mean ?? DEFAULT_EARTH_BASELINES.bp_systolic.mean) &&
    incompleteTasks.includes('HYDRATION_2500ML')
  ) {
    return {
      affected_system: 'cardiovascular',
      severity: 'yellow',
      diagnosis_code: 'MICROGRAVITY_HYPOVOLEMIA',
      diagnosis_title: 'Subclinical Space Dehydration (Countermeasure Incomplete)',
      simple_explanation: 'Microgravity suppresses your natural thirst reflex via central fluid shift. Your elevated heart rate and lower systolic pressure correlate directly with an incomplete daily hydration task.',
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

  // Rule 4: Hypoglycemia & Circadian Drift
  const hasGlucoseAnomaly = evals.blood_glucose.severity !== 'green';
  const hasCircadianDepletion = (vitalReading.sleep_hours !== undefined && vitalReading.sleep_hours < 5.0) &&
    (vitalReading.mood_score !== undefined && vitalReading.mood_score <= 4);

  if (hasGlucoseAnomaly || hasCircadianDepletion) {
    const isCriticalGlucose = vitalReading.blood_glucose <= 65 || evals.blood_glucose.severity === 'red';
    return {
      affected_system: 'metabolic',
      severity: isCriticalGlucose ? 'red' : 'yellow',
      diagnosis_code: 'METABOLIC_CIRCADIAN_DRIFT',
      diagnosis_title: 'Metabolic Energy Deficit & Circadian Desynchronization',
      simple_explanation: 'Insufficient sleep duration combined with blood glucose deviation is impairing your metabolic equilibrium and reaction speed for mission-critical tasks.',
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

  // Rule 5: Musculoskeletal Deconditioning Risk
  if (
    incompleteTasks.includes('ARED_WORKOUT') &&
    vitalReading.sleep_hours !== undefined &&
    vitalReading.sleep_hours < 6.0 &&
    missionPhase === 'DEEP_SPACE_CRUISE'
  ) {
    return {
      affected_system: 'musculoskeletal',
      severity: 'yellow',
      diagnosis_code: 'MUSCULOSKELETAL_UNLOADING_RISK',
      diagnosis_title: 'Microgravity Osteopenia & Muscle Atrophy Risk',
      simple_explanation: 'Unloaded posture in deep space causes 1.5% monthly bone mineral loss unless countered by resistive loading. Your ARED resistive workout remains incomplete today.',
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

  // Rule 6: General Single-Metric Anomaly Fallback
  const worstEval =
    Object.values(evals).find((e) => e.severity === 'red') ||
    Object.values(evals).find((e) => e.severity === 'yellow');

  if (worstEval) {
    const systemMap = {
      heart_rate: 'cardiovascular',
      bp_systolic: 'cardiovascular',
      bp_diastolic: 'cardiovascular',
      spo2: 'cardiovascular',
      cabin_radiation_msv: 'cardiovascular',
      blood_glucose: 'metabolic',
      body_temp: 'metabolic',
      cabin_co2_mmhg: 'nervous',
    };

    return {
      affected_system: systemMap[worstEval.metricKey] || 'cardiovascular',
      severity: worstEval.severity,
      diagnosis_code: `BIOMETRIC_DEVIATION_${worstEval.metricKey.toUpperCase()}`,
      diagnosis_title: `Personal Baseline Deviation: ${worstEval.metricKey.replace('_', ' ').toUpperCase()}`,
      simple_explanation: worstEval.summary,
      action_protocol: [
        'Suspend strenuous EVA or payload operations for 15 minutes.',
        'Verify biometric sensor skin contact and re-sample telemetry.',
        'If deviation persists above 3 sigma, initiate Earth medical packet transmission.',
      ],
      guide_file_id: 'guide_zero_g_bp_cuff',
      notify_earth: worstEval.severity === 'red',
      metric_evaluations: evals,
    };
  }

  // Rule 7: Launch Ascent G-Force Adaptation
  if (missionPhase === 'LAUNCH_ASCENT') {
    return {
      affected_system: 'nominal',
      severity: 'green',
      diagnosis_code: 'LAUNCH_ASCENT_ADAPTATION',
      diagnosis_title: 'Nominal Physiological Response to Launch G-Load',
      simple_explanation: 'Your elevated heart rate and blood pressure are within expected phase-adjusted parameters for 3G launch acceleration. No pathological anomaly detected.',
      action_protocol: [
        'Maintain Anti-G Straining Maneuver (AGSM) breathing rhythm.',
        'Keep lower extremity and abdominal muscles isometric to support cerebral perfusion.',
      ],
      guide_file_id: null,
      notify_earth: false,
      metric_evaluations: evals,
    };
  }

  // Rule 8: Default Nominal State
  return {
    affected_system: 'nominal',
    severity: 'green',
    diagnosis_code: 'ALL_SYSTEMS_NOMINAL',
    diagnosis_title: 'All Biological Systems Nominal',
    simple_explanation: 'Your real-time telemetry matches your personal pre-flight baseline adjusted for the current spaceflight phase.',
    action_protocol: [
      'Continue scheduled orbital operations and daily countermeasure regimen.',
    ],
    guide_file_id: null,
    notify_earth: false,
    metric_evaluations: evals,
  };
}
