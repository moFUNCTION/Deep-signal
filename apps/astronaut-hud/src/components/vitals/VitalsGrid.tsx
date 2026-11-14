import React from 'react';
import type { MetricKey } from '@aura/medical-engine';
import { evaluateAllMetrics } from '@aura/medical-engine';
import {
  HudCard,
  StatusBadge,
  MetricSparkline,
  useAccessibility,
} from '@aura/ui-kit';
import { useAuthStore } from '../../store/useAuthStore';
import { useMedicalStore } from '../../store/useMedicalStore';

interface MetricMeta {
  key: MetricKey;
  label: string;
  unit: string;
  icon: string;
  system: string;
}

const METRICS_META: MetricMeta[] = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'BPM', icon: '❤️', system: 'cardiovascular' },
  { key: 'bp_systolic', label: 'Systolic BP', unit: 'mmHg', icon: '🩺', system: 'cardiovascular' },
  { key: 'bp_diastolic', label: 'Diastolic BP', unit: 'mmHg', icon: '🩸', system: 'cardiovascular' },
  { key: 'blood_glucose', label: 'Blood Glucose', unit: 'mg/dL', icon: '🍬', system: 'metabolic' },
  { key: 'body_temp', label: 'Core Temp', unit: '°C', icon: '🌡️', system: 'metabolic' },
  { key: 'spo2', label: 'Pulse Ox (SpO2)', unit: '%', icon: '🫁', system: 'cardiovascular' },
  { key: 'cabin_co2_mmhg', label: 'Cabin CO2', unit: 'mmHg', icon: '💨', system: 'nervous' },
  { key: 'cabin_radiation_msv', label: 'Cabin Radiation', unit: 'mSv/h', icon: '☢️', system: 'cardiovascular' },
];

export const VitalsGrid: React.FC = () => {
  const { viewMode } = useAccessibility();
  const profile = useAuthStore((s) => s.profile);
  const currentVital = useMedicalStore((s) => s.currentVital);
  const vitalHistory = useMedicalStore((s) => s.vitalHistory);
  const selectedMetric = useMedicalStore((s) => s.selectedMetric);
  const setSelectedMetric = useMedicalStore((s) => s.setSelectedMetric);

  const evals = evaluateAllMetrics(
    currentVital,
    profile.earthBaselines,
    currentVital.mission_phase || profile.missionPhase,
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-ink font-display text-lg font-bold">
            Live Telemetry Telemetry Deck
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-pill bg-sky-soft text-sky-deep font-semibold">
            {profile.missionPhase.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-ink-muted text-xs">
          Select metric to inspect $\mu \pm 2\sigma$ reference bands
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {METRICS_META.map((meta) => {
          const evalResult = evals[meta.key];
          const isSelected = selectedMetric === meta.key;
          const val = currentVital[meta.key as keyof typeof currentVital];
          const displayVal = typeof val === 'number' ? val : 0;

          // Extract trend history for sparkline
          const historySeries = vitalHistory
            .map((h) => h[meta.key as keyof typeof h] as number)
            .filter((n) => typeof n === 'number' && !isNaN(n));

          const zScoreVal = evalResult ? evalResult.zScore : 0;
          const zScoreStr =
            evalResult && evalResult.zScore !== null
              ? `${zScoreVal >= 0 ? '+' : ''}${zScoreVal.toFixed(1)}σ`
              : '0.0σ';

          const devPct = evalResult?.deviationPercent ?? 0;
          const devStr = `${devPct >= 0 ? '+' : ''}${devPct.toFixed(1)}%`;

          const severity = evalResult?.severity || 'green';

          return (
            <div
              key={meta.key}
              onClick={() => setSelectedMetric(meta.key)}
              className="cursor-pointer transition-transform duration-200 active:scale-[0.98]"
            >
              <HudCard
                isActive={isSelected}
                clickable
                padding="16px"
                className={`h-full flex flex-col justify-between border-2 ${
                  isSelected ? 'border-sky shadow-cardActive' : 'border-outline hover:border-sky-bright'
                }`}
              >
                <div>
                  {/* Top Row: Icon + Label + StatusBadge */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-lg">{meta.icon}</span>
                      <span className="text-ink-muted font-body font-semibold text-xs truncate">
                        {meta.label}
                      </span>
                    </div>
                    <StatusBadge severity={severity} size="sm" showIcon={false} />
                  </div>

                  {/* Main Value in JetBrains Mono */}
                  <div className="flex items-baseline gap-1 my-1">
                    <span className="font-mono text-2xl font-bold text-ink tracking-tight">
                      {typeof displayVal === 'number' && displayVal % 1 !== 0
                        ? displayVal.toFixed(displayVal < 10 ? 2 : 1)
                        : displayVal}
                    </span>
                    <span className="font-body text-xs text-ink-muted">{meta.unit}</span>
                  </div>

                  {/* Z-score Pill & Deviation */}
                  <div className="flex items-center gap-1.5 flex-wrap my-1.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-pill font-mono font-bold ${
                        severity === 'red'
                          ? 'bg-coral-soft text-coral border border-coral'
                          : severity === 'yellow'
                          ? 'bg-sun-bright/20 text-sun-deep border border-sun'
                          : 'bg-leaf-soft text-leaf-deep border border-leaf'
                      }`}
                    >
                      {zScoreStr}
                    </span>
                    <span className="text-[11px] text-ink-subtle font-mono">{devStr}</span>
                  </div>
                </div>

                {/* Sparkline & Baseline */}
                <div className="mt-2 pt-2 border-t border-outline/50">
                  <MetricSparkline
                    data={historySeries.length > 0 ? historySeries : [displayVal, displayVal]}
                    metricLabel={meta.label}
                    currentValue={displayVal}
                    unit={meta.unit}
                    zScore={zScoreVal}
                    severity={severity}
                    height={40}
                  />

                  {viewMode === 'surgeon' && evalResult?.adjustedMean !== null && (
                    <div className="flex justify-between items-center text-[10px] text-ink-muted font-mono mt-1">
                      <span>Baseline μ: {evalResult.adjustedMean}</span>
                      {evalResult.effectiveStdDev && (
                        <span>σ: {evalResult.effectiveStdDev}</span>
                      )}
                    </div>
                  )}
                </div>
              </HudCard>
            </div>
          );
        })}
      </div>
    </div>
  );
};
