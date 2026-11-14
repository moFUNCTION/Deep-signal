import React, { useEffect, useState } from 'react';
import { Sliders, RotateCcw, Check } from 'lucide-react';
import {
  DEFAULT_ASTRONAUT_PREFS,
  MISSION_PHASE_OFFSETS,
  type BiometricMetricKey,
  type EarthBaselines,
} from '@aura/medical-engine';
import { HudCard } from '@aura/ui-kit';
import { useAuthStore } from '../../store/useAuthStore';

const FIELDS: Array<{ key: BiometricMetricKey; label: string; unit: string; step: number }> = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', step: 1 },
  { key: 'bp_systolic', label: 'Systolic BP', unit: 'mmHg', step: 1 },
  { key: 'bp_diastolic', label: 'Diastolic BP', unit: 'mmHg', step: 1 },
  { key: 'blood_glucose', label: 'Blood Glucose', unit: 'mg/dL', step: 1 },
  { key: 'body_temp', label: 'Core Temp', unit: '°C', step: 0.1 },
  { key: 'spo2', label: 'Resting SpO2', unit: '%', step: 0.5 },
];

export const SurgeonCalibrationPanel: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const updateBaselines = useAuthStore((s) => s.updateBaselines);

  const [draft, setDraft] = useState<EarthBaselines>(profile.earthBaselines);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    setDraft(profile.earthBaselines);
  }, [profile.earthBaselines]);

  const phaseOffset = MISSION_PHASE_OFFSETS[profile.missionPhase];

  const handleChange = (key: BiometricMetricKey, field: 'mean' | 'stdDev', value: number) => {
    setDraft((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
    setSavedNotice(false);
  };

  const handleSave = async () => {
    await updateBaselines(draft);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleReset = async () => {
    const defaults = DEFAULT_ASTRONAUT_PREFS.earthBaselines;
    setDraft(defaults);
    await updateBaselines(defaults);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <HudCard padding="20px" className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-outline">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-btn bg-sky-soft text-sky-deep flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-ink">
              Flight Surgeon BDC Baseline &amp; Phase Offset Matrix
            </h3>
            <p className="text-xs text-ink-muted font-body">
              Active Phase: <strong className="text-ink">{profile.missionPhase.replace(/_/g, ' ')}</strong> · Variance Multiplier κ = {phaseOffset.stdDevMultiplier}x
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-btn border border-outline bg-surface hover:bg-surface-sunken text-xs font-body font-semibold text-ink-muted inline-flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset NASA BDC</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-btn bg-sky hover:bg-sky-deep text-white text-xs font-body font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            {savedNotice ? <Check className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5" />}
            <span>{savedNotice ? 'Synced Across Tabs' : 'Apply & Sync Baselines'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {FIELDS.map((field) => {
          const stat = draft[field.key];
          const delta = phaseOffset[field.key] ?? 0;
          const adjMean = Number((stat.mean + delta).toFixed(2));
          const effStd = Number((stat.stdDev * phaseOffset.stdDevMultiplier).toFixed(2));

          return (
            <div
              key={field.key}
              className="p-3.5 rounded-btn bg-surface border border-outline flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-display font-bold text-ink">
                  {field.label}
                </span>
                <span className="text-[11px] font-mono text-ink-subtle">
                  Δ: {delta >= 0 ? `+${delta}` : delta} {field.unit}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor={`hud-bdc-${field.key}-mean`}
                    className="block text-[10px] font-mono text-ink-muted mb-1"
                  >
                    Earth μ
                  </label>
                  <input
                    id={`hud-bdc-${field.key}-mean`}
                    type="number"
                    step={field.step}
                    value={stat.mean}
                    onChange={(e) =>
                      handleChange(field.key, 'mean', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-2.5 py-1.5 rounded-input bg-surface-elevated border border-outline text-xs font-mono font-bold text-ink focus:border-sky outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor={`hud-bdc-${field.key}-std`}
                    className="block text-[10px] font-mono text-ink-muted mb-1"
                  >
                    Earth σ
                  </label>
                  <input
                    id={`hud-bdc-${field.key}-std`}
                    type="number"
                    step={field.step}
                    value={stat.stdDev}
                    onChange={(e) =>
                      handleChange(field.key, 'stdDev', parseFloat(e.target.value) || 0.1)
                    }
                    className="w-full px-2.5 py-1.5 rounded-input bg-surface-elevated border border-outline text-xs font-mono font-bold text-ink focus:border-sky outline-none"
                  />
                </div>
              </div>

              <div className="pt-1.5 border-t border-outline/60 flex items-center justify-between text-[11px] font-mono text-sky-deep">
                <span>μ_adj: {adjMean}</span>
                <span>σ_eff: {effStd}</span>
              </div>
            </div>
          );
        })}
      </div>
    </HudCard>
  );
};
