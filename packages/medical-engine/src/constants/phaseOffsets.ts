import type {
  AstronautProfile,
  DailyMissionTask,
  DistanceCommsMode,
  MissionPhase,
  PhaseOffsetDef,
} from '../types.ts';

/**
 * Mission Phase Offsets Table
 * Mathematical adaptations accounting for G-load acceleration, fluid cephalic shifts,
 * and autonomic cardiovascular reset during each distinct flight phase.
 */
export const MISSION_PHASE_OFFSETS: Record<MissionPhase, PhaseOffsetDef> = {
  PRE_FLIGHT_BDC: {
    heart_rate: 0,
    bp_systolic: 0,
    bp_diastolic: 0,
    blood_glucose: 0,
    body_temp: 0,
    spo2: 0,
    stdDevMultiplier: 1.0,
  },
  LAUNCH_ASCENT: {
    heart_rate: 30,
    bp_systolic: 18,
    bp_diastolic: 10,
    blood_glucose: 12,
    body_temp: 0.2,
    spo2: -1,
    stdDevMultiplier: 1.8,
  },
  EARLY_ORBIT_ADAPTATION: {
    heart_rate: 6,
    bp_systolic: 8,
    bp_diastolic: -4,
    blood_glucose: 5,
    body_temp: 0.1,
    spo2: 0,
    stdDevMultiplier: 1.25,
  },
  DEEP_SPACE_CRUISE: {
    heart_rate: -2,
    bp_systolic: -3,
    bp_diastolic: -5,
    blood_glucose: 0,
    body_temp: 0,
    spo2: 0,
    stdDevMultiplier: 1.0,
  },
};

/**
 * Default Astronaut Profile & Pre-Flight BDC Baselines
 * (Cmdr. Tariq Al-Mansoor, AST-CDR-01)
 */
export const DEFAULT_ASTRONAUT_PREFS: AstronautProfile = {
  astronautCode: 'AST-CDR-01',
  fullName: 'Cmdr. Tariq Al-Mansoor',
  bloodType: 'O+',
  missionPhase: 'EARLY_ORBIT_ADAPTATION',
  earthBaselines: {
    heart_rate: { mean: 56, stdDev: 4 },
    bp_systolic: { mean: 114, stdDev: 7 },
    bp_diastolic: { mean: 72, stdDev: 5 },
    blood_glucose: { mean: 90, stdDev: 8 },
    body_temp: { mean: 36.7, stdDev: 0.25 },
    spo2: { mean: 98, stdDev: 1 },
  },
};

/**
 * Default Daily Countermeasure Missions
 */
export const DEFAULT_DAILY_MISSIONS: DailyMissionTask[] = [
  {
    $id: 'task_hydration_01',
    astronaut_id: 'AST-CDR-01',
    task_code: 'HYDRATION_2500ML',
    task_title: 'Electrolyte Hydration Target (2500 mL)',
    target_system: 'cardiovascular',
    points_value: 35,
    is_completed: true,
    streak_days: 14,
  },
  {
    $id: 'task_ared_02',
    astronaut_id: 'AST-CDR-01',
    task_code: 'ARED_WORKOUT',
    task_title: 'ARED Resistive Exercise (60 Min Load)',
    target_system: 'musculoskeletal',
    points_value: 40,
    is_completed: true,
    streak_days: 11,
  },
  {
    $id: 'task_circadian_03',
    astronaut_id: 'AST-CDR-01',
    task_code: 'CIRCADIAN_LIGHT_SYNC',
    task_title: '2700K Amber Circadian Visor Protocol',
    target_system: 'nervous',
    points_value: 25,
    is_completed: true,
    streak_days: 9,
  },
];

/**
 * Delay values for DTN communications
 */
export const LIGHT_TIME_DELAY_SECONDS: Record<DistanceCommsMode, number | null> = {
  ISS_REALTIME: 1,
  MOON_2S: 3,
  MARS_15M: 25,
  SOLAR_BLACKOUT: null,
};
