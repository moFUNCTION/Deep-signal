/**
 * AURA Space Medicine Clinical Core Engine - Type Definitions
 * Based on NASA Medical Operations & Clinical Decision Support Specifications
 */

export type MissionPhase =
  | 'PRE_FLIGHT_BDC'
  | 'LAUNCH_ASCENT'
  | 'EARLY_ORBIT_ADAPTATION'
  | 'DEEP_SPACE_CRUISE';

export type SeverityLevel = 'green' | 'yellow' | 'red';

export type AnatomicalSystem =
  | 'nominal'
  | 'cardiovascular'
  | 'nervous'
  | 'metabolic'
  | 'musculoskeletal';

export type SystemGroup = AnatomicalSystem;

export type DistanceCommsMode =
  | 'ISS_REALTIME'
  | 'MOON_2S'
  | 'MARS_15M'
  | 'SOLAR_BLACKOUT';

export type BiometricMetricKey =
  | 'heart_rate'
  | 'bp_systolic'
  | 'bp_diastolic'
  | 'blood_glucose'
  | 'body_temp'
  | 'spo2';

export type EnvironmentalMetricKey =
  | 'cabin_co2_mmhg'
  | 'cabin_radiation_msv';

export type MetricKey = BiometricMetricKey | EnvironmentalMetricKey;

export interface BaselineStat {
  mean: number;
  stdDev: number;
}

export type EarthBaselines = Record<BiometricMetricKey, BaselineStat>;

export interface VitalReading {
  $id?: string;
  astronaut_id: string;
  mission_phase: MissionPhase;
  heart_rate: number;
  bp_systolic: number;
  bp_diastolic: number;
  blood_glucose: number;
  body_temp: number;
  spo2: number;
  sleep_hours: number;
  mood_score: number;
  cabin_co2_mmhg: number;
  cabin_radiation_msv: number;
  ingestion_source?: 'LIVE_STREAM' | 'OFFLINE_SYNC_FLUSH';
  edge_alert_id?: string | null;
  $createdAt?: string;
  timestamp?: string | number;
}

export type VitalReadingInput = VitalReading;

export type TriggerType =
  | 'HARD_CLINICAL_LIMIT'
  | 'SEVERE_PERSONAL_DEVIATION'
  | 'MODERATE_PERSONAL_DEVIATION'
  | 'NOMINAL'
  | 'ENVIRONMENTAL_ELEVATED'
  | 'ENVIRONMENTAL_NOMINAL';

export interface MetricEvaluationResult {
  metricKey: MetricKey;
  currentValue: number;
  adjustedMean: number | null;
  effectiveStdDev?: number | null;
  severity: SeverityLevel;
  triggerType: TriggerType;
  zScore: number;
  deviationPercent: number;
  summary: string;
}

export type ZScoreEvaluation = MetricEvaluationResult;

export interface PhaseAdjustedBands {
  adjustedMean: number;
  effectiveStdDev: number;
  upper2Sigma: number;
  lower2Sigma: number;
  upper3Sigma: number;
  lower3Sigma: number;
}

export interface TriageDiagnosisOutput {
  affected_system: AnatomicalSystem;
  severity: SeverityLevel;
  diagnosis_code: string;
  diagnosis_title: string;
  simple_explanation: string;
  action_protocol: string[];
  guide_file_id: string | null;
  notify_earth: boolean;
  metric_evaluations?: Record<MetricKey, MetricEvaluationResult>;
  $id?: string;
  astronaut_id?: string;
  $createdAt?: string;
}

export type TriageAlert = TriageDiagnosisOutput;

export interface ReadinessInput {
  evaluations: Record<MetricKey, MetricEvaluationResult> | MetricEvaluationResult[];
  completedTasksCount?: number;
  totalTasksCount?: number;
  sleepHours: number;
  moodScore: number;
  completedTasks?: string[] | number;
  totalTasks?: string[] | number;
}

export type ReadinessStatus = 'OPTIMAL_FOR_EVA' | 'CAUTION_MONITOR' | 'NO_GO_MEDICAL_HOLD';

export interface ReadinessBreakdown {
  missionReadiness: number;
  vitalsScore: number;
  countermeasuresScore: number;
  sleepMoodScore: number;
  status: ReadinessStatus;
  redCount: number;
  yellowCount: number;
}

export type ReadinessResult = ReadinessBreakdown;

export interface VisualGuideMetadata {
  fileId: string;
  title: string;
  durationSec: number;
  equipmentLocation: string;
  fallbackSteps: [string, string, string];
}

export interface HardLimitDef {
  minCritical: number;
  maxCritical: number;
  unit: string;
  label: string;
  envThreshold?: number;
}

export type HardLimitConfig = HardLimitDef;

export interface PhaseOffsetDef {
  heart_rate: number;
  bp_systolic: number;
  bp_diastolic: number;
  blood_glucose: number;
  body_temp: number;
  spo2: number;
  stdDevMultiplier: number;
}

export type PhaseOffsetConfig = PhaseOffsetDef;

export interface AstronautProfile {
  astronautCode: string;
  fullName: string;
  bloodType: string;
  missionPhase: MissionPhase;
  earthBaselines: EarthBaselines;
}

export interface DailyMissionTask {
  $id: string;
  astronaut_id: string;
  task_code: string;
  task_title: string;
  target_system: AnatomicalSystem;
  points_value: number;
  is_completed: boolean;
  streak_days: number;
}
