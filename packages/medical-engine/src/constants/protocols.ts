import type { VisualGuideMetadata } from '../types.ts';

/**
 * Storage Visual Guides & Fallback Procedures
 * Exact 5 visual guides with 3-step actionable protocols for offline spaceflight autonomy.
 */
export const STORAGE_VISUAL_GUIDES: Record<string, VisualGuideMetadata> = {
  guide_co2_airflow_check: {
    fileId: 'guide_co2_airflow_check',
    title: 'Microgravity CO2 Pocket Dispersion & Fan Alignment',
    durationSec: 45,
    equipmentLocation: 'Crew Quarters Port Bulkhead - Rack B2',
    fallbackSteps: [
      'Translate immediately 2 meters away from your current work/sleep station.',
      'Switch Personal Ventilation Fan (PVF) to HIGH (3000 RPM) and angle nozzle 45 degrees across face.',
      'Verify CDRA (Carbon Dioxide Removal Assembly) indicator light is solid green.',
    ],
  },
  guide_zero_g_bp_cuff: {
    fileId: 'guide_zero_g_bp_cuff',
    title: 'Zero-G Sphygmomanometer Calibration & AstroRad Donning',
    durationSec: 60,
    equipmentLocation: 'Crew Medical Restraint System (CMRS) - Locker M1',
    fallbackSteps: [
      'Enter the Crew Storm Shelter lined with polyethylene water bags.',
      'Secure the AstroRad vest around torso and pelvis.',
      'Fasten the automated brachial cuff on left upper arm and keep arm tethered at heart level.',
    ],
  },
  guide_hydration_electrolyte: {
    fileId: 'guide_hydration_electrolyte',
    title: 'Potable Water Dispenser (PWD) Electrolyte Reconstitution',
    durationSec: 30,
    equipmentLocation: 'Galley Node 1 - Ambient Water Port',
    fallbackSteps: [
      'Attach oral rehydration salt (ORS) pouch to the Potable Water Dispenser septum.',
      'Dispense 400 mL of ambient water and massage pouch for 20 seconds to dissolve solutes.',
      'Consume steadily over 10 minutes to restore intravascular plasma volume.',
    ],
  },
  guide_space_glucometer: {
    fileId: 'guide_space_glucometer',
    title: 'Capillary Blood Sampling in Microgravity & Circadian Lighting',
    durationSec: 40,
    equipmentLocation: 'Ambulatory Medical Pack (AMP) - Pouch 3',
    fallbackSteps: [
      'Ingest one 15g fast-acting glucose gel packet immediately.',
      'Wipe ring finger with alcohol swab; allow to air dry completely so droplet remains spherical in 0G.',
      'Touch test strip tip directly to the surface tension bead without smearing.',
    ],
  },
  guide_ared_resistive_load: {
    fileId: 'guide_ared_resistive_load',
    title: 'ARED Vacuum Cylinder Calibration & Lower-Body Negative Pressure',
    durationSec: 50,
    equipmentLocation: 'Tranquility Node 3 - ARED Platform',
    fallbackSteps: [
      'Engage ARED flywheel and vacuum canisters to 75% Earth body-weight equivalent.',
      'Perform 3 sets of heel raises and squats with telemetry harness active.',
      'Log completion in Daily Countermeasures to restore musculoskeletal readiness.',
    ],
  },
};
