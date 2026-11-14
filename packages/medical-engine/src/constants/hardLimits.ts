import type { HardLimitDef, MetricKey } from '../types.js';

/**
 * NASA Clinical Hard Limits Table
 * Authoritative boundaries defining acute pathological breach vs normal spaceflight ranges.
 */
export const NASA_HARD_LIMITS: Record<MetricKey, HardLimitDef> = {
  heart_rate: {
    minCritical: 42,
    maxCritical: 145,
    unit: 'bpm',
    label: 'Heart Rate',
  },
  bp_systolic: {
    minCritical: 85,
    maxCritical: 160,
    unit: 'mmHg',
    label: 'Systolic BP',
  },
  bp_diastolic: {
    minCritical: 50,
    maxCritical: 100,
    unit: 'mmHg',
    label: 'Diastolic BP',
  },
  blood_glucose: {
    minCritical: 65,
    maxCritical: 185,
    unit: 'mg/dL',
    label: 'Blood Glucose',
  },
  body_temp: {
    minCritical: 35.5,
    maxCritical: 38.3,
    unit: 'degC',
    label: 'Core Temp',
  },
  spo2: {
    minCritical: 91,
    maxCritical: 100,
    unit: '%',
    label: 'Oxygen Saturation',
  },
  cabin_co2_mmhg: {
    minCritical: 0,
    maxCritical: 5.0,
    unit: 'mmHg',
    label: 'Cabin CO2',
    envThreshold: 3.8,
  },
  cabin_radiation_msv: {
    minCritical: 0,
    maxCritical: 2.0,
    unit: 'mSv/day',
    label: 'Radiation Dose',
    envThreshold: 1.2,
  },
};
