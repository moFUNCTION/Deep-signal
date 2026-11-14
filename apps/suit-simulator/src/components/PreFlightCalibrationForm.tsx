import React, { useState } from 'react';
import {
  BiometricMetricKey,
  DEFAULT_ASTRONAUT_PREFS,
  DistanceCommsMode,
  EarthBaselines,
  LIGHT_TIME_DELAY_SECONDS,
  MISSION_PHASE_OFFSETS,
  MissionPhase,
} from '@aura/medical-engine';
import { BigFriendlyButton, SkylearnInput } from '@aura/ui-kit';
import {
  Activity,
  CheckCircle2,
  Clock,
  Compass,
  Radio,
  RotateCcw,
  Sliders,
  UserCheck,
} from 'lucide-react';
import { telemetryBridge } from '../services/telemetryBridge';

interface PreFlightCalibrationFormProps {
  initialBaselines: EarthBaselines;
  initialPhase: MissionPhase;
  initialCommsMode: DistanceCommsMode;
  onApplyCalibration: (
    baselines: EarthBaselines,
    phase: MissionPhase,
    commsMode: DistanceCommsMode,
  ) => void;
  onClose?: () => void;
}

const BIOMETRIC_FIELDS: Array<{
  key: BiometricMetricKey;
  label: string;
  unit: string;
  step: number;
}> = [
  { key: 'heart_rate', label: 'Heart Rate (Resting)', unit: 'bpm', step: 1 },
  { key: 'bp_systolic', label: 'Systolic Blood Pressure', unit: 'mmHg', step: 1 },
  { key: 'bp_diastolic', label: 'Diastolic Blood Pressure', unit: 'mmHg', step: 1 },
  { key: 'blood_glucose', label: 'Fasting Blood Glucose', unit: 'mg/dL', step: 1 },
  { key: 'body_temp', label: 'Core Body Temperature', unit: '°C', step: 0.1 },
  { key: 'spo2', label: 'Resting SpO2', unit: '%', step: 0.5 },
];

const MISSION_PHASES: Array<{
  phase: MissionPhase;
  label: string;
  description: string;
}> = [
  {
    phase: 'PRE_FLIGHT_BDC',
    label: 'Pre-Flight BDC (Earth)',
    description: '1G Earth Baseline Data Collection before mission launch.',
  },
  {
    phase: 'LAUNCH_ASCENT',
    label: 'Launch Ascent (3G Peak)',
    description: 'Dynamic 3G acceleration phase (+30 HR, +18 BP, κ = 1.8).',
  },
  {
    phase: 'EARLY_ORBIT_ADAPTATION',
    label: 'Early Orbit Adaptation',
    description: 'Cephalic fluid redistribution & neurovestibular transition.',
  },
  {
    phase: 'DEEP_SPACE_CRUISE',
    label: 'Deep Space Cruise',
    description: 'Long-duration transit with autonomic cardiovascular reset.',
  },
];

const COMMS_MODES: Array<{
  mode: DistanceCommsMode;
  label: string;
  delayText: string;
  description: string;
}> = [
  {
    mode: 'ISS_REALTIME',
    label: 'LEO / Space Station',
    delayText: '1s light-time',
    description: 'Near real-time mission control telemetry downlink.',
  },
  {
    mode: 'MOON_2S',
    label: 'Lunar Orbit / Surface',
    delayText: '3s light-time',
    description: 'Artemis lunar mission telemetry with brief round-trip delay.',
  },
  {
    mode: 'MARS_15M',
    label: 'Mars Transit / Deep Space',
    delayText: '25s simulated delay',
    description: 'Deep space mission with store-and-forward DTN packet queueing.',
  },
  {
    mode: 'SOLAR_BLACKOUT',
    label: 'Solar Storm Blackout',
    delayText: 'Total RF Blackout',
    description: 'All Earth links severed; suit stores all data in local DTN queue.',
  },
];

export const PreFlightCalibrationForm: React.FC<PreFlightCalibrationFormProps> = ({
  initialBaselines,
  initialPhase,
  initialCommsMode,
  onApplyCalibration,
  onClose,
}) => {
  const [baselines, setBaselines] = useState<EarthBaselines>(initialBaselines);
  const [phase, setPhase] = useState<MissionPhase>(initialPhase);
  const [commsMode, setCommsMode] = useState<DistanceCommsMode>(initialCommsMode);
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const handleBaselineChange = (
    key: BiometricMetricKey,
    field: 'mean' | 'stdDev',
    val: number,
  ) => {
    setBaselines((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: val,
      },
    }));
    setIsSaved(false);
  };

  const handleResetToDefaults = () => {
    const defaults = DEFAULT_ASTRONAUT_PREFS.earthBaselines;
    setBaselines(defaults);
    setPhase('EARLY_ORBIT_ADAPTATION');
    setCommsMode('ISS_REALTIME');
    setIsSaved(false);
  };

  const handleSaveAndBroadcast = async () => {
    await telemetryBridge.broadcastBaselineChange(baselines, phase);
    telemetryBridge.broadcastCommsMode(commsMode);
    onApplyCalibration(baselines, phase, commsMode);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    if (onClose) {
      setTimeout(() => onClose(), 800);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline">
        <div className="flex items-center gap-2">
          <Sliders className="w-6 h-6 text-sky" />
          <div>
            <h3 className="text-xl font-display font-bold text-ink">
              Pre-Flight BDC Baseline Calibration
            </h3>
            <p className="text-xs text-ink-muted font-body">
              Calibrates personal Earth Baseline Data Collection (μ_earth, σ_earth) used for Z-score clinical evaluations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetToDefaults}
          className="px-3 py-1.5 rounded-btn text-xs font-semibold font-body bg-surface-sunken hover:bg-outline text-ink-muted border border-outline transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to NASA Defaults</span>
        </button>
      </div>

      {/* Biometric Baseline Fields Grid */}
      <div>
        <h4 className="text-sm font-display font-bold text-ink mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-leaf-deep" />
          Astronaut Earth Resting Baselines (Cmdr. Tariq Al-Mansoor)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BIOMETRIC_FIELDS.map((field) => {
            const stat = baselines[field.key] || { mean: 0, stdDev: 1 };
            const offsetDef = MISSION_PHASE_OFFSETS[phase];
            const offset = offsetDef[field.key] ?? 0;
            const kappa = offsetDef.stdDevMultiplier ?? 1.0;
            const adjMean = Math.round((stat.mean + offset) * 100) / 100;
            const effStd = Math.round(stat.stdDev * kappa * 100) / 100;

            return (
              <div
                key={field.key}
                className="p-3.5 rounded-card bg-surface-elevated border border-outline shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-display font-bold text-ink">
                    {field.label}
                  </span>
                  <span className="text-[11px] font-mono text-ink-subtle">
                    {field.unit}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label
                      htmlFor={`baseline-${field.key}-mean`}
                      className="text-[10px] font-mono text-ink-subtle block mb-1"
                    >
                      Earth Mean (μ)
                    </label>
                    <input
                      id={`baseline-${field.key}-mean`}
                      name={`baseline-${field.key}-mean`}
                      type="number"
                      step={field.step}
                      value={stat.mean}
                      onChange={(e) =>
                        handleBaselineChange(
                          field.key,
                          'mean',
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-ink bg-surface-sunken border border-outline rounded-input focus:border-sky focus:ring-1 focus:ring-sky outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor={`baseline-${field.key}-stddev`}
                      className="text-[10px] font-mono text-ink-subtle block mb-1"
                    >
                      StdDev (σ)
                    </label>
                    <input
                      id={`baseline-${field.key}-stddev`}
                      name={`baseline-${field.key}-stddev`}
                      type="number"
                      step={field.step}
                      value={stat.stdDev}
                      onChange={(e) =>
                        handleBaselineChange(
                          field.key,
                          'stdDev',
                          parseFloat(e.target.value) || 0.1,
                        )
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-ink bg-surface-sunken border border-outline rounded-input focus:border-sky focus:ring-1 focus:ring-sky outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-outline flex items-center justify-between text-[10px] font-mono text-ink-subtle">
                  <span>Phase Adjusted:</span>
                  <strong className="text-sky-deep font-bold">
                    μ_adj: {adjMean} | σ_eff: {effStd}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flight Phase Selector */}
      <div>
        <h4 className="text-sm font-display font-bold text-ink mb-2 flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky" />
          Active Mission Phase (Calculates Dynamic Offsets &amp; Tolerance Multipliers)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {MISSION_PHASES.map((p) => {
            const isSelected = phase === p.phase;
            return (
              <button
                key={p.phase}
                type="button"
                onClick={() => {
                  setPhase(p.phase);
                  setIsSaved(false);
                }}
                className={`p-3 rounded-btn text-left border transition-all ${
                  isSelected
                    ? 'bg-sky-soft/40 border-sky ring-1 ring-sky shadow-sm'
                    : 'bg-surface-elevated border-outline hover:border-sky-bright'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-display font-bold text-ink">
                    {p.label}
                  </span>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky" />}
                </div>
                <p className="text-[11px] text-ink-muted font-body leading-tight">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comms Delay Selector */}
      <div>
        <h4 className="text-sm font-display font-bold text-ink mb-2 flex items-center gap-2">
          <Radio className="w-4 h-4 text-coral" />
          Distance Communications Delay &amp; DTN Queueing Mode
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {COMMS_MODES.map((c) => {
            const isSelected = commsMode === c.mode;
            return (
              <button
                key={c.mode}
                type="button"
                onClick={() => {
                  setCommsMode(c.mode);
                  setIsSaved(false);
                }}
                className={`p-3 rounded-btn text-left border transition-all ${
                  isSelected
                    ? 'bg-sky-soft/40 border-sky ring-1 ring-sky shadow-sm'
                    : 'bg-surface-elevated border-outline hover:border-sky-bright'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-display font-bold text-ink">
                    {c.label}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-sunken text-ink-subtle">
                    {c.delayText}
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted font-body leading-tight">
                  {c.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-4 border-t border-outline flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-ink-muted">
          {isSaved ? (
            <span className="text-leaf-deep flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              Baselines &amp; Phase Successfully Broadcasted Across Tabs!
            </span>
          ) : (
            <span>Ready to apply and synchronize baselines to astronaut HUD.</span>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-btn text-xs font-semibold text-ink-muted hover:bg-surface-sunken border border-outline transition-all"
            >
              Cancel
            </button>
          )}

          <BigFriendlyButton
            onClick={handleSaveAndBroadcast}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            <span>Apply &amp; Broadcast Calibration</span>
          </BigFriendlyButton>
        </div>
      </div>
    </div>
  );
};
