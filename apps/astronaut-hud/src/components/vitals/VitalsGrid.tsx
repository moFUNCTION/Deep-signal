import React from 'react';
import {
  Activity,
  CloudFog,
  Droplet,
  Flame,
  HeartPulse,
  Radiation,
  Thermometer,
  Wind,
} from 'lucide-react';
import type { AnatomicalSystem, MetricKey } from '@aura/medical-engine';
import { evaluateAllMetrics, NASA_HARD_LIMITS } from '@aura/medical-engine';
import {
  HudCard,
  MetricSparkline,
  StatusBadge,
  useAccessibility,
} from '@aura/ui-kit';
import { useAuthStore } from '../../store/useAuthStore';
import { useMedicalStore } from '../../store/useMedicalStore';

interface MetricMeta {
  key: MetricKey;
  label: string;
  unit: string;
  system: Exclude<AnatomicalSystem, 'nominal'>;
  icon: React.FC<{ className?: string }>;
}

const METRICS_META: MetricMeta[] = [
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', system: 'cardiovascular', icon: HeartPulse },
  { key: 'bp_systolic', label: 'Systolic BP', unit: 'mmHg', system: 'cardiovascular', icon: Activity },
  { key: 'bp_diastolic', label: 'Diastolic BP', unit: 'mmHg', system: 'cardiovascular', icon: Droplet },
  { key: 'blood_glucose', label: 'Blood Glucose', unit: 'mg/dL', system: 'metabolic', icon: Flame },
  { key: 'body_temp', label: 'Core Temp', unit: '°C', system: 'metabolic', icon: Thermometer },
  { key: 'spo2', label: 'Pulse Ox (SpO2)', unit: '%', system: 'nervous', icon: Wind },
  { key: 'cabin_co2_mmhg', label: 'Cabin CO2', unit: 'mmHg', system: 'nervous', icon: CloudFog },
  { key: 'cabin_radiation_msv', label: 'Radiation Dose', unit: 'mSv/d', system: 'cardiovascular', icon: Radiation },
];

export const VitalsGrid: React.FC = () => {
  const { isSurgeonMode } = useAccessibility();
  const profile = useAuthStore((s) => s.profile);
  const currentVital = useMedicalStore((s) => s.currentVital);
  const vitalHistory = useMedicalStore((s) => s.vitalHistory);
  const selectedMetric = useMedicalStore((s) => s.selectedMetric);
  const selectedSystem = useMedicalStore((s) => s.selectedSystem);
  const setSelectedMetric = useMedicalStore((s) => s.setSelectedMetric);

  const evals = evaluateAllMetrics(
    currentVital,
    profile.earthBaselines,
    currentVital.mission_phase || profile.missionPhase,
  );

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-ink font-display text-lg font-bold">
            Live Telemetry Deck
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-pill bg-sky-soft text-sky-deep font-mono font-semibold">
            {profile.missionPhase.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-ink-muted text-xs font-body">
          Select any metric card to inspect its μ ± 2σ trend band
        </p>
      </div>

      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
        {METRICS_META.map((meta) => {
          const Icon = meta.icon;
          const evalResult = evals[meta.key];
          const hardLimit = NASA_HARD_LIMITS[meta.key];
          const isSelected = selectedMetric === meta.key;
          const matchesSystem = Boolean(selectedSystem && selectedSystem === meta.system);

          const val = currentVital[meta.key as keyof typeof currentVital];
          const displayVal = typeof val === 'number' ? val : 0;

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
            <HudCard
              key={meta.key}
              isActive={isSelected}
              clickable
              padding="14px"
              onClick={() => setSelectedMetric(meta.key)}
              className={`h-full flex flex-col justify-between border-2 cursor-pointer transition-transform duration-150 active:scale-[0.99] ${
                isSelected
                  ? 'border-sky shadow-cardActive'
                  : matchesSystem
                  ? 'border-sky-bright/70 bg-sky-soft/15'
                  : 'border-outline hover:border-sky-bright'
              }`}
            >
              <div>
                {/* Top Row: Vector Icon + Label + StatusBadge */}
                <div className="flex items-start justify-between gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Icon className="w-4 h-4 text-sky-deep shrink-0" />
                    <span className="text-ink-muted font-body font-semibold text-xs leading-tight">
                      {meta.label}
                    </span>
                  </div>
                  <StatusBadge
                    severity={severity}
                    label={severity === 'green' ? 'OK' : severity === 'yellow' ? 'WARN' : 'CRIT'}
                    size="sm"
                    showIcon={false}
                  />
                </div>

                  {/* Primary Value in JetBrains Mono */}
                  <div className="flex items-baseline gap-1.5 my-1">
                    <span className="font-mono text-xl sm:text-2xl font-bold text-ink tracking-tight tabular-nums">
                      {typeof displayVal === 'number' && displayVal % 1 !== 0
                        ? displayVal.toFixed(displayVal < 10 ? 2 : 1)
                        : displayVal}
                    </span>
                    <span className="font-body text-xs text-ink-muted">{meta.unit}</span>
                  </div>

                  {/* Z-score & Deviation */}
                  <div className="flex items-center gap-1.5 flex-wrap my-1.5">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-pill font-mono font-bold ${
                        severity === 'red'
                          ? 'bg-coral-soft text-ink border border-coral'
                          : severity === 'yellow'
                          ? 'bg-sun-bright/25 text-sun-deep border border-sun'
                          : 'bg-leaf-soft text-leaf-deep border border-leaf/50'
                      }`}
                    >
                      Z: {zScoreStr}
                    </span>
                    <span className="text-[11px] text-ink-subtle font-mono">{devStr}</span>
                  </div>
                </div>

                {/* Sparkline + Surgeon Calibration Detail */}
                <div className="mt-2 pt-2 border-t border-outline/60">
                  <MetricSparkline
                    data={historySeries.length > 0 ? historySeries : [displayVal, displayVal]}
                    metricLabel={meta.label}
                    currentValue={displayVal}
                    unit={meta.unit}
                    zScore={zScoreVal}
                    severity={severity}
                    height={36}
                    hideHeader
                  />

                  {isSurgeonMode && (
                    <div className="mt-1.5 pt-1.5 border-t border-outline/40 flex flex-col gap-0.5 text-[10px] text-ink-muted font-mono">
                      {evalResult?.adjustedMean !== null && (
                        <div className="flex justify-between">
                          <span>μ_adj: {evalResult.adjustedMean}</span>
                          <span>σ_eff: {evalResult.effectiveStdDev ?? 'N/A'}</span>
                        </div>
                      )}
                      {hardLimit && (
                        <div className="text-ink-subtle">
                          Limits: [{hardLimit.minCritical}, {hardLimit.maxCritical}] {hardLimit.unit}
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </HudCard>
          );
        })}
      </div>
    </div>
  );
};
