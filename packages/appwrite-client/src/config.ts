/**
 * AURA Client Configuration & Spaceflight Biological Constants
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

export type DistanceCommsMode =
  | 'ISS_REALTIME'
  | 'MOON_2S'
  | 'MARS_15M'
  | 'SOLAR_BLACKOUT';

export type MetricKey =
  | 'heart_rate'
  | 'bp_systolic'
  | 'bp_diastolic'
  | 'blood_glucose'
  | 'body_temp'
  | 'spo2'
  | 'cabin_co2_mmhg'
  | 'cabin_radiation_msv';

export interface BaselineStat {
  mean: number;
  stdDev: number;
}

export type EarthBaselines = Record<
  'heart_rate' | 'bp_systolic' | 'bp_diastolic' | 'blood_glucose' | 'body_temp' | 'spo2',
  BaselineStat
>;

export interface AstronautProfilePrefs {
  astronautCode: string;
  fullName: string;
  bloodType: string;
  missionPhase: MissionPhase;
  earthBaselines: EarthBaselines;
}

export const DEFAULT_ASTRONAUT_PREFS: AstronautProfilePrefs = {
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
 * Light-Time Propagation Delays in Seconds for DTN Comms Simulation
 * Note: MARS_15M is scaled to 25s for live hackathon judge testing.
 * SOLAR_BLACKOUT is null (infinite delay until conjunction clears).
 */
export const LIGHT_TIME_DELAY_SECONDS: Record<DistanceCommsMode, number | null> = {
  ISS_REALTIME: 1,
  MOON_2S: 3,
  MARS_15M: 25,
  SOLAR_BLACKOUT: null,
};

function readEnv(key: string): string | undefined {
  const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const proc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
  const win = typeof window !== 'undefined' ? (window as any) : undefined;
  return metaEnv?.[key] || proc?.env?.[key] || win?.__ENV__?.[key];
}

export const DB_CONFIG = {
  get ENDPOINT(): string {
    return readEnv('VITE_APPWRITE_ENDPOINT') || 'https://fra.cloud.appwrite.io/v1';
  },
  get PROJECT_ID(): string {
    return readEnv('VITE_APPWRITE_PROJECT_ID') || '6af87b750015891937c0';
  },
  get DATABASE_ID(): string {
    return readEnv('VITE_APPWRITE_DB_ID') || 'AURA_Medical_DB';
  },
  get IS_CONFIGURED(): boolean {
    // Keep Node unit tests deterministic offline unless explicit env var is provided.
    if (typeof window === 'undefined' && !readEnv('VITE_APPWRITE_PROJECT_ID')) {
      return false;
    }
    const pid = this.PROJECT_ID;
    return Boolean(pid && pid !== 'your_project_id' && pid !== 'aura_nasa_2026');
  },
  COLLECTIONS: {
    VITALS_LOGS: 'vitals_logs',
    TRIAGE_ALERTS: 'triage_alerts',
    DAILY_MISSIONS: 'daily_missions',
    EARTH_TRANSMISSIONS: 'earth_transmissions',
  },
  BUCKETS: {
    MEDICAL_GUIDES: 'medical_guides',
    EARTH_REPORTS: 'earth_reports',
  },
  TEAMS: {
    ASTRONAUT_CREW: 'astronaut_crew',
    FLIGHT_SURGEONS: 'flight_surgeons',
  },
  STORAGE_KEYS: {
    PREFS: 'aura_astronaut_prefs',
    MISSIONS: 'aura_daily_missions',
    VITALS_HISTORY: 'aura_vitals_history',
    ACTIVE_ALERT: 'aura_active_alert',
    COMMS_MODE: 'aura_comms_mode',
    DTN_QUEUE: 'aura_dtn_offline_packets',
  },
  BUS_CHANNEL: 'aura_telemetry_bus',
} as const;
