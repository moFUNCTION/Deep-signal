import React from 'react';
import {
  AnatomicalSystem,
  DistanceCommsMode,
  MissionPhase,
  SeverityLevel,
  VitalReadingInput,
} from '@aura/medical-engine';
import { HudCard, StatusBadge } from '@aura/ui-kit';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  Flame,
  Moon,
  Radio,
  Rocket,
  ShieldAlert,
  Wind,
  Zap,
} from 'lucide-react';
import { telemetryBridge } from '../services/telemetryBridge';

export interface ScenarioDefinition {
  id: string;
  number: number;
  isBonus?: boolean;
  title: string;
  tagline: string;
  description: string;
  missionPhase: MissionPhase;
  commsMode: DistanceCommsMode;
  affectedSystem: AnatomicalSystem;
  expectedSeverity: SeverityLevel;
  ruleCode: string;
  vitals: Omit<VitalReadingInput, 'astronaut_id' | 'mission_phase'>;
  countermeasures: {
    hydration: boolean;
    ared: boolean;
    circadian: boolean;
  };
}

export const SCENARIO_PRESETS: ScenarioDefinition[] = [
  {
    id: 'nominal_cruise',
    number: 1,
    title: 'Nominal Deep Space Cruise',
    tagline: 'All Biometric & Environmental Parameters Normal',
    description:
      'Baseline cruise profile. Heart rate (54 bpm), blood pressure (111/67), SpO2 (98%), and environmental sensors are within nominal phase-adjusted limits. Mission Readiness >= 95%.',
    missionPhase: 'DEEP_SPACE_CRUISE',
    commsMode: 'ISS_REALTIME',
    affectedSystem: 'nominal',
    expectedSeverity: 'green',
    ruleCode: 'ALL_SYSTEMS_NOMINAL',
    vitals: {
      heart_rate: 54,
      bp_systolic: 111,
      bp_diastolic: 67,
      blood_glucose: 90,
      body_temp: 36.7,
      spo2: 98,
      sleep_hours: 7.5,
      mood_score: 9,
      cabin_co2_mmhg: 2.2,
      cabin_radiation_msv: 0.3,
    },
    countermeasures: {
      hydration: true,
      ared: true,
      circadian: true,
    },
  },
  {
    id: 'launch_ascent_3g',
    number: 2,
    title: 'Launch Ascent 3G Peak',
    tagline: 'False-Alarm Proof (Phase-Adjusted Baseline Z = 0.0σ)',
    description:
      'Demonstrates Phase-Offset Intelligence: Elevated HR (86 bpm) and BP (132/82) during 3G ascent acceleration are recognized as physiological adaptations (Z = 0.0σ). Zero false alarms.',
    missionPhase: 'LAUNCH_ASCENT',
    commsMode: 'ISS_REALTIME',
    affectedSystem: 'cardiovascular',
    expectedSeverity: 'green',
    ruleCode: 'LAUNCH_ASCENT_ADAPTATION',
    vitals: {
      heart_rate: 86,
      bp_systolic: 132,
      bp_diastolic: 82,
      blood_glucose: 102,
      body_temp: 36.9,
      spo2: 97,
      sleep_hours: 7.0,
      mood_score: 8,
      cabin_co2_mmhg: 2.3,
      cabin_radiation_msv: 0.2,
    },
    countermeasures: {
      hydration: true,
      ared: true,
      circadian: true,
    },
  },
  {
    id: 'dehydration_hypovolemia',
    number: 3,
    title: 'Subclinical Space Dehydration',
    tagline: 'Missed Hydration Countermeasure + Cephalic Fluid Shift',
    description:
      'Astronaut missed the 2500 mL electrolyte target. Elevated HR (75 bpm) with lowered systolic BP (102 mmHg) signals early hypovolemia. Triggers oral rehydration protocol.',
    missionPhase: 'EARLY_ORBIT_ADAPTATION',
    commsMode: 'ISS_REALTIME',
    affectedSystem: 'cardiovascular',
    expectedSeverity: 'yellow',
    ruleCode: 'MICROGRAVITY_HYPOVOLEMIA',
    vitals: {
      heart_rate: 75,
      bp_systolic: 102,
      bp_diastolic: 68,
      blood_glucose: 92,
      body_temp: 36.8,
      spo2: 98,
      sleep_hours: 6.5,
      mood_score: 7,
      cabin_co2_mmhg: 2.4,
      cabin_radiation_msv: 0.3,
    },
    countermeasures: {
      hydration: false,
      ared: true,
      circadian: true,
    },
  },
  {
    id: 'co2_bubble_hypercapnia',
    number: 4,
    title: 'Microgravity CO2 Bubble',
    tagline: 'Localized Stagnant Pocket (Hypercapnia Risk)',
    description:
      'Without convection, exhaled CO2 forms a 5.4 mmHg stagnant bubble around the helmet/sleep station. Triggers headache, SpO2 drop (93%), and elevated HR. Camera focuses on Brain.',
    missionPhase: 'DEEP_SPACE_CRUISE',
    commsMode: 'ISS_REALTIME',
    affectedSystem: 'nervous',
    expectedSeverity: 'red',
    ruleCode: 'HYPERCAPNIA_CO2_POCKET',
    vitals: {
      heart_rate: 104,
      bp_systolic: 124,
      bp_diastolic: 78,
      blood_glucose: 94,
      body_temp: 36.9,
      spo2: 93,
      sleep_hours: 6.0,
      mood_score: 3,
      cabin_co2_mmhg: 5.4,
      cabin_radiation_msv: 0.3,
    },
    countermeasures: {
      hydration: true,
      ared: true,
      circadian: true,
    },
  },
  {
    id: 'solar_storm_blackout',
    number: 5,
    title: 'Solar Particle Storm + Blackout',
    tagline: 'SPE Radiation Spike (3.8 mSv) & DTN Comms Queueing',
    description:
      'Coronal Mass Ejection causes cabin radiation spike (3.8 mSv/day) with hyperthermic reaction (38.1°C) and tachycardia (128 bpm). Solar storm creates RF blackout; DTN queues packets.',
    missionPhase: 'DEEP_SPACE_CRUISE',
    commsMode: 'SOLAR_BLACKOUT',
    affectedSystem: 'cardiovascular',
    expectedSeverity: 'red',
    ruleCode: 'ACUTE_RADIATION_CARDIO_STRESS',
    vitals: {
      heart_rate: 128,
      bp_systolic: 142,
      bp_diastolic: 88,
      blood_glucose: 110,
      body_temp: 38.1,
      spo2: 96,
      sleep_hours: 6.0,
      mood_score: 5,
      cabin_co2_mmhg: 2.5,
      cabin_radiation_msv: 3.8,
    },
    countermeasures: {
      hydration: true,
      ared: true,
      circadian: true,
    },
  },
  {
    id: 'circadian_hypoglycemia',
    number: 6,
    title: 'Circadian Drift & Hypoglycemia',
    tagline: 'NASA Hard Limit Breach (Glucose 63 mg/dL <= 65 mg/dL)',
    description:
      'Astronaut accumulated severe sleep deficit (3.8h) and missed calorie intake. Blood glucose drops to 63 mg/dL, breaching NASA critical safety threshold. Requires immediate carbohydrate gel.',
    missionPhase: 'DEEP_SPACE_CRUISE',
    commsMode: 'ISS_REALTIME',
    affectedSystem: 'metabolic',
    expectedSeverity: 'red',
    ruleCode: 'METABOLIC_CIRCADIAN_DRIFT',
    vitals: {
      heart_rate: 68,
      bp_systolic: 110,
      bp_diastolic: 70,
      blood_glucose: 63,
      body_temp: 36.5,
      spo2: 98,
      sleep_hours: 3.8,
      mood_score: 3,
      cabin_co2_mmhg: 2.3,
      cabin_radiation_msv: 0.3,
    },
    countermeasures: {
      hydration: true,
      ared: true,
      circadian: false,
    },
  },
  {
    id: 'musculoskeletal_unloading',
    number: 7,
    isBonus: true,
    title: 'Bonus: Musculoskeletal Unloading',
    tagline: 'Neglected ARED Resistive Load in Deep Space Cruise',
    description:
      'Verifies the 4th Anatomical Organ System: Astronaut missed daily ARED 60-minute resistive loading workout. Highlights arm/leg musculoskeletal atrophy risk in 3D digital twin.',
    missionPhase: 'DEEP_SPACE_CRUISE',
    commsMode: 'ISS_REALTIME',
    affectedSystem: 'musculoskeletal',
    expectedSeverity: 'yellow',
    ruleCode: 'MUSCULOSKELETAL_UNLOADING_RISK',
    vitals: {
      heart_rate: 55,
      bp_systolic: 112,
      bp_diastolic: 68,
      blood_glucose: 90,
      body_temp: 36.7,
      spo2: 98,
      sleep_hours: 5.2,
      mood_score: 6,
      cabin_co2_mmhg: 2.2,
      cabin_radiation_msv: 0.3,
    },
    countermeasures: {
      hydration: true,
      ared: false,
      circadian: true,
    },
  },
];

interface ScenarioPresetsProps {
  activeScenarioId: string | null;
  onSelectScenario: (scenario: ScenarioDefinition) => void;
  isStreaming: boolean;
}

export const ScenarioPresets: React.FC<ScenarioPresetsProps> = ({
  activeScenarioId,
  onSelectScenario,
  isStreaming,
}) => {
  const getIconForScenario = (id: string) => {
    switch (id) {
      case 'nominal_cruise':
        return <CheckCircle2 className="w-5 h-5 text-leaf" />;
      case 'launch_ascent_3g':
        return <Rocket className="w-5 h-5 text-sky" />;
      case 'dehydration_hypovolemia':
        return <Activity className="w-5 h-5 text-sun-deep" />;
      case 'co2_bubble_hypercapnia':
        return <Wind className="w-5 h-5 text-coral" />;
      case 'solar_storm_blackout':
        return <ShieldAlert className="w-5 h-5 text-coral" />;
      case 'circadian_hypoglycemia':
        return <Moon className="w-5 h-5 text-coral" />;
      case 'musculoskeletal_unloading':
        return <Dumbbell className="w-5 h-5 text-sun-deep" />;
      default:
        return <Zap className="w-5 h-5 text-sky" />;
    }
  };

  const getSystemPillColor = (sys: AnatomicalSystem) => {
    switch (sys) {
      case 'cardiovascular':
        return 'bg-coral-soft/65 text-ink border-coral/40';
      case 'nervous':
        return 'bg-sky-soft text-sky-deep border-sky/30';
      case 'metabolic':
        return 'bg-sun-bright/30 text-sun-deep border-sun/40';
      case 'musculoskeletal':
        return 'bg-berry/10 text-ink border-berry/30';
      default:
        return 'bg-leaf-soft text-leaf-deep border-leaf/30';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline">
        <div>
          <h2 className="text-lg font-display font-bold text-ink">
            Clinical Validation Scenarios
          </h2>
          <p className="text-xs text-ink-muted font-body">
            Inject calibrated telemetry packets into the Astronaut HUD in real time.
          </p>
        </div>
        <span className="text-xs font-mono text-ink-muted">
          7 Scenarios Ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SCENARIO_PRESETS.map((scenario) => {
          const isActive = activeScenarioId === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`rounded-card transition-all duration-150 flex flex-col justify-between p-4 bg-surface-elevated border ${
                isActive
                  ? 'border-sky shadow-cardActive ring-2 ring-sky-soft'
                  : 'border-outline hover:border-sky-bright hover:shadow-card'
              }`}
            >
              <div>
                {/* Header Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-xs font-mono font-bold text-ink-muted">
                    SCENARIO 0{scenario.number}
                    {scenario.isBonus ? ' · BONUS' : ''}
                  </span>
                  <StatusBadge
                    severity={scenario.expectedSeverity}
                    label={
                      scenario.expectedSeverity === 'green'
                        ? 'NOMINAL'
                        : scenario.expectedSeverity === 'yellow'
                        ? 'CAUTION'
                        : 'CRITICAL'
                    }
                    size="sm"
                  />
                </div>

                {/* Title & Icon */}
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="p-2 rounded-btn bg-surface-sunken shrink-0">
                    {getIconForScenario(scenario.id)}
                  </div>
                  <div>
                    <h3 className="text-base font-display font-bold text-ink leading-snug">
                      {scenario.title}
                    </h3>
                    <p className="text-xs text-ink-muted font-body mt-0.5">
                      {scenario.tagline}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-ink-muted font-body leading-relaxed mb-3">
                  {scenario.description}
                </p>

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-1.5 mb-4 text-[11px] font-mono">
                  <span
                    className={`px-2 py-0.5 rounded-pill border ${getSystemPillColor(
                      scenario.affectedSystem,
                    )}`}
                  >
                    {scenario.affectedSystem.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded-pill bg-surface-sunken text-ink-muted border border-outline">
                    {scenario.missionPhase.replace(/_/g, ' ')}
                  </span>
                  {scenario.commsMode === 'SOLAR_BLACKOUT' && (
                    <span className="px-2 py-0.5 rounded-pill bg-coral-soft text-ink border border-coral/40">
                      BLACKOUT
                    </span>
                  )}
                </div>
              </div>

              {/* Inject Action */}
              <button
                type="button"
                onClick={() => onSelectScenario(scenario)}
                disabled={isStreaming}
                className={`w-full py-2.5 px-3 rounded-btn text-xs font-semibold font-body transition-colors flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-sky-deep text-white'
                    : 'bg-sky hover:bg-sky-deep text-white'
                } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isActive ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Active Scenario</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Inject Scenario 0{scenario.number}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
