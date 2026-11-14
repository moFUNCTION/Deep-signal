import { NASA_HARD_LIMITS } from '../constants/hardLimits.ts';
import { DEFAULT_ASTRONAUT_PREFS, MISSION_PHASE_OFFSETS } from '../constants/phaseOffsets.ts';
import type {
  BaselineStat,
  BiometricMetricKey,
  EarthBaselines,
  MetricEvaluationResult,
  MetricKey,
  MissionPhase,
  PhaseAdjustedBands,
  TriggerType,
  VitalReadingInput,
} from '../types.ts';

/**
 * Rounds a number to exactly two decimal places
 */
export function round2(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Calculate phase-adjusted baselines for all biometric metrics
 */
export function calculateAdjustedBaseline(
  earthBaselines: EarthBaselines,
  missionPhase: MissionPhase,
): Record<BiometricMetricKey, { adjustedMean: number; effectiveStdDev: number }> {
  const phaseOffsets = MISSION_PHASE_OFFSETS[missionPhase] || MISSION_PHASE_OFFSETS.DEEP_SPACE_CRUISE;
  const result = {} as Record<BiometricMetricKey, { adjustedMean: number; effectiveStdDev: number }>;

  const biometricKeys: BiometricMetricKey[] = [
    'heart_rate',
    'bp_systolic',
    'bp_diastolic',
    'blood_glucose',
    'body_temp',
    'spo2',
  ];

  for (const key of biometricKeys) {
    const baseline = earthBaselines[key] || DEFAULT_ASTRONAUT_PREFS.earthBaselines[key];
    const offset = phaseOffsets[key] ?? 0;
    const kappa = phaseOffsets.stdDevMultiplier ?? 1.0;

    const adjustedMean = round2(baseline.mean + offset);
    const effectiveStdDev = Math.max(0.1, round2(baseline.stdDev * kappa));

    result[key] = {
      adjustedMean,
      effectiveStdDev,
    };
  }

  return result;
}

/**
 * Computes phase-adjusted reference bands (+/- 2 sigma, +/- 3 sigma) for charting
 */
export function getPhaseAdjustedBands(
  metricKey: BiometricMetricKey,
  earthBaseline: BaselineStat,
  missionPhase: MissionPhase,
): PhaseAdjustedBands {
  const phaseOffsets = MISSION_PHASE_OFFSETS[missionPhase] || MISSION_PHASE_OFFSETS.DEEP_SPACE_CRUISE;
  const offset = phaseOffsets[metricKey] ?? 0;
  const kappa = phaseOffsets.stdDevMultiplier ?? 1.0;

  const adjustedMean = round2(earthBaseline.mean + offset);
  const effectiveStdDev = Math.max(0.1, round2(earthBaseline.stdDev * kappa));

  return {
    adjustedMean,
    effectiveStdDev,
    upper2Sigma: round2(adjustedMean + 2 * effectiveStdDev),
    lower2Sigma: round2(adjustedMean - 2 * effectiveStdDev),
    upper3Sigma: round2(adjustedMean + 3 * effectiveStdDev),
    lower3Sigma: round2(adjustedMean - 3 * effectiveStdDev),
  };
}

/**
 * Evaluates a single biometric or environmental metric using the Dual-Filter logic:
 * 1. Primary Filter: NASA Clinical Hard Limits
 * 2. Environmental Check: Threshold-based elevation
 * 3. Secondary Filter: Personal Phase-Adjusted Z-Score
 */
export function evaluateSingleMetric(
  metricKey: MetricKey,
  currentValue: number,
  earthBaseline?: BaselineStat,
  missionPhase: MissionPhase = 'DEEP_SPACE_CRUISE',
): MetricEvaluationResult {
  const hardLimit = NASA_HARD_LIMITS[metricKey];

  // 1. Primary Filter: NASA Hard Clinical Limits
  let isHardLimitBreached = false;
  if (metricKey === 'spo2') {
    isHardLimitBreached = currentValue <= hardLimit.minCritical || currentValue > 100;
  } else if (metricKey === 'cabin_co2_mmhg') {
    isHardLimitBreached = currentValue >= hardLimit.maxCritical;
  } else if (metricKey === 'cabin_radiation_msv') {
    isHardLimitBreached = currentValue >= hardLimit.maxCritical;
  } else {
    isHardLimitBreached = currentValue <= hardLimit.minCritical || currentValue >= hardLimit.maxCritical;
  }

  if (isHardLimitBreached) {
    let adjMean: number | null = null;
    let devPct = 0;

    if (metricKey !== 'cabin_co2_mmhg' && metricKey !== 'cabin_radiation_msv') {
      const baseline = earthBaseline || DEFAULT_ASTRONAUT_PREFS.earthBaselines[metricKey as BiometricMetricKey];
      const offset = MISSION_PHASE_OFFSETS[missionPhase]?.[metricKey as BiometricMetricKey] ?? 0;
      adjMean = round2(baseline.mean + offset);
      devPct = adjMean !== 0 ? Math.round(((currentValue - adjMean) / adjMean) * 100) : 0;
    }

    return {
      metricKey,
      currentValue,
      adjustedMean: adjMean,
      severity: 'red',
      triggerType: 'HARD_CLINICAL_LIMIT',
      zScore: 9.9,
      deviationPercent: devPct,
      summary: `${hardLimit.label} (${currentValue} ${hardLimit.unit}) breached NASA critical safety envelope [${hardLimit.minCritical} - ${hardLimit.maxCritical} ${hardLimit.unit}]`,
    };
  }

  // 2. Environmental Metrics Handler
  if (metricKey === 'cabin_co2_mmhg') {
    const isElevated = currentValue >= (hardLimit.envThreshold ?? 3.8);
    return {
      metricKey,
      currentValue,
      adjustedMean: null,
      severity: isElevated ? 'yellow' : 'green',
      triggerType: isElevated ? 'ENVIRONMENTAL_ELEVATED' : 'ENVIRONMENTAL_NOMINAL',
      zScore: 0,
      deviationPercent: 0,
      summary: isElevated
        ? `Elevated cabin CO2 detected (${currentValue} mmHg >= 3.8 mmHg threshold)`
        : `Cabin CO2 nominal (${currentValue} mmHg)`,
    };
  }

  if (metricKey === 'cabin_radiation_msv') {
    const isElevated = currentValue >= (hardLimit.envThreshold ?? 1.2);
    return {
      metricKey,
      currentValue,
      adjustedMean: null,
      severity: isElevated ? 'yellow' : 'green',
      triggerType: isElevated ? 'ENVIRONMENTAL_ELEVATED' : 'ENVIRONMENTAL_NOMINAL',
      zScore: 0,
      deviationPercent: 0,
      summary: isElevated
        ? `Elevated cabin radiation detected (${currentValue} mSv/day >= 1.2 mSv/day threshold)`
        : `Cabin radiation nominal (${currentValue} mSv/day)`,
    };
  }

  // 3. Secondary Filter: Personal Phase-Adjusted Z-Score for Biometrics
  const bioKey = metricKey as BiometricMetricKey;
  const baseline = earthBaseline || DEFAULT_ASTRONAUT_PREFS.earthBaselines[bioKey];
  const phaseOffsets = MISSION_PHASE_OFFSETS[missionPhase] || MISSION_PHASE_OFFSETS.DEEP_SPACE_CRUISE;
  const offset = phaseOffsets[bioKey] ?? 0;
  const kappa = phaseOffsets.stdDevMultiplier ?? 1.0;

  const adjustedMean = round2(baseline.mean + offset);
  const effectiveStdDev = Math.max(0.1, round2(baseline.stdDev * kappa));

  const zScore = round2(Math.abs(currentValue - adjustedMean) / effectiveStdDev);
  const deviationPercent = adjustedMean !== 0 ? Math.round(((currentValue - adjustedMean) / adjustedMean) * 100) : 0;

  let severity: 'green' | 'yellow' | 'red' = 'green';
  let triggerType: TriggerType = 'NOMINAL';

  if (zScore >= 3.0) {
    severity = 'red';
    triggerType = 'SEVERE_PERSONAL_DEVIATION';
  } else if (zScore >= 2.0) {
    severity = 'yellow';
    triggerType = 'MODERATE_PERSONAL_DEVIATION';
  } else {
    severity = 'green';
    triggerType = 'NOMINAL';
  }

  const sign = deviationPercent >= 0 ? '+' : '';
  const summary = severity === 'green'
    ? `${hardLimit.label} nominal (${currentValue} ${hardLimit.unit}, Z = ${zScore}σ)`
    : `${hardLimit.label} deviation: ${currentValue} ${hardLimit.unit} (${sign}${deviationPercent}% vs μ_adj ${adjustedMean}, Z = ${zScore}σ)`;

  return {
    metricKey,
    currentValue,
    adjustedMean,
    effectiveStdDev,
    severity,
    triggerType,
    zScore,
    deviationPercent,
    summary,
  };
}

/**
 * Evaluates all 8 clinical metrics for an astronaut telemetry reading
 */
export function evaluateAllMetrics(
  vitalReading: VitalReadingInput,
  earthBaselines: EarthBaselines,
  missionPhase?: MissionPhase,
): Record<MetricKey, MetricEvaluationResult> {
  const phase = missionPhase || vitalReading.mission_phase || 'DEEP_SPACE_CRUISE';
  const baselines = earthBaselines || DEFAULT_ASTRONAUT_PREFS.earthBaselines;

  const evaluations: Record<MetricKey, MetricEvaluationResult> = {
    heart_rate: evaluateSingleMetric('heart_rate', vitalReading.heart_rate, baselines.heart_rate, phase),
    bp_systolic: evaluateSingleMetric('bp_systolic', vitalReading.bp_systolic, baselines.bp_systolic, phase),
    bp_diastolic: evaluateSingleMetric('bp_diastolic', vitalReading.bp_diastolic, baselines.bp_diastolic, phase),
    blood_glucose: evaluateSingleMetric('blood_glucose', vitalReading.blood_glucose, baselines.blood_glucose, phase),
    body_temp: evaluateSingleMetric('body_temp', vitalReading.body_temp, baselines.body_temp, phase),
    spo2: evaluateSingleMetric('spo2', vitalReading.spo2, baselines.spo2, phase),
    cabin_co2_mmhg: evaluateSingleMetric('cabin_co2_mmhg', vitalReading.cabin_co2_mmhg, undefined, phase),
    cabin_radiation_msv: evaluateSingleMetric('cabin_radiation_msv', vitalReading.cabin_radiation_msv, undefined, phase),
  };

  return evaluations;
}

/**
 * Alias matching PROJECT.md interface contract
 */
export const evaluateZScore = evaluateAllMetrics;
