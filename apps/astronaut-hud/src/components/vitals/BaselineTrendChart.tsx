import React from 'react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BiometricMetricKey, MetricKey } from '@aura/medical-engine';
import { getPhaseAdjustedBands, NASA_HARD_LIMITS } from '@aura/medical-engine';
import { HudCard, useAccessibility } from '@aura/ui-kit';
import { useAuthStore } from '../../store/useAuthStore';
import { useMedicalStore } from '../../store/useMedicalStore';

const METRIC_OPTIONS: Array<{ key: MetricKey; label: string }> = [
  { key: 'heart_rate', label: 'Heart Rate' },
  { key: 'bp_systolic', label: 'Systolic BP' },
  { key: 'bp_diastolic', label: 'Diastolic BP' },
  { key: 'blood_glucose', label: 'Blood Glucose' },
  { key: 'body_temp', label: 'Core Temp' },
  { key: 'spo2', label: 'SpO2' },
  { key: 'cabin_co2_mmhg', label: 'Cabin CO2' },
  { key: 'cabin_radiation_msv', label: 'Radiation Dose' },
];

export const BaselineTrendChart: React.FC = () => {
  const { isSurgeonMode } = useAccessibility();
  const profile = useAuthStore((s) => s.profile);
  const selectedMetric = useMedicalStore((s) => s.selectedMetric);
  const setSelectedMetric = useMedicalStore((s) => s.setSelectedMetric);
  const vitalHistory = useMedicalStore((s) => s.vitalHistory);
  const currentVital = useMedicalStore((s) => s.currentVital);

  const isBiometric = selectedMetric in profile.earthBaselines;
  const earthStat = isBiometric
    ? profile.earthBaselines[selectedMetric as BiometricMetricKey]
    : null;
  const bands = isBiometric && earthStat
    ? getPhaseAdjustedBands(
        selectedMetric as BiometricMetricKey,
        earthStat,
        currentVital.mission_phase || profile.missionPhase,
      )
    : null;

  const hardLimits = NASA_HARD_LIMITS[selectedMetric];

  const chartData = vitalHistory.map((item, index) => {
    const rawVal = item[selectedMetric as keyof typeof item];
    const val = typeof rawVal === 'number' ? rawVal : 0;
    const timeLabel = item.$createdAt
      ? new Date(item.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : `T-${vitalHistory.length - index}m`;

    return {
      index,
      time: timeLabel,
      value: val,
      adjMean: bands ? bands.adjustedMean : undefined,
      upper2Sigma: bands ? bands.upper2Sigma : undefined,
      lower2Sigma: bands ? bands.lower2Sigma : undefined,
    };
  });

  const currentVal = currentVital[selectedMetric as keyof typeof currentVital];
  const metricLabel = hardLimits ? hardLimits.label : selectedMetric.replace(/_/g, ' ');
  const unit = hardLimits ? hardLimits.unit : '';

  const values = chartData.map((d) => d.value).filter((v) => typeof v === 'number');
  const minVal = Math.min(
    ...values,
    bands?.lower2Sigma ?? Infinity,
    earthStat?.mean ?? Infinity,
    hardLimits?.minCritical ?? Infinity,
  );
  const maxVal = Math.max(
    ...values,
    bands?.upper2Sigma ?? -Infinity,
    earthStat?.mean ?? -Infinity,
    hardLimits?.maxCritical ?? -Infinity,
  );
  const padding = (maxVal - minVal) * 0.15 || 5;
  const yDomain = [Math.floor(minVal - padding), Math.ceil(maxVal + padding)];

  return (
    <HudCard padding="20px" className="w-full h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-base text-ink">
              {metricLabel} · Physiological Envelope
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-pill bg-sky-soft text-sky-deep font-mono font-semibold">
              {currentVal} {unit}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5 font-body">
            Shaded band marks personal μ ± 2σ envelope calibrated for{' '}
            <span className="font-semibold text-ink">
              {profile.missionPhase.replace(/_/g, ' ')}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="trend-metric-select" className="sr-only">
            Select metric to plot
          </label>
          <select
            id="trend-metric-select"
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as MetricKey)}
            className="px-2.5 py-1.5 rounded-input bg-surface-sunken border border-outline text-xs font-body font-semibold text-ink focus:border-sky outline-none"
          >
            {METRIC_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reference Badges */}
      {bands && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono mb-3 px-3 py-2 rounded-btn bg-surface border border-outline">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-sky/25 border border-sky" />
            <span className="text-ink-muted">
              μ<sub>adj</sub>: <strong className="text-ink">{bands.adjustedMean}</strong>
            </span>
          </div>
          {isSurgeonMode && earthStat && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-ink-subtle" />
              <span className="text-ink-muted">
                Earth BDC μ<sub>earth</sub>: <strong className="text-ink">{earthStat.mean}</strong>
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-coral" />
            <span className="text-ink-muted">
              ±2σ Safe Range:{' '}
              <strong className="text-ink">
                [{bands.lower2Sigma}, {bands.upper2Sigma}]
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 44, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
            <YAxis domain={yDomain} stroke="#94A3B8" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload;
                return (
                  <div className="bg-surface-elevated p-3 rounded-btn border border-outline shadow-lg text-xs font-body">
                    <p className="font-bold text-ink mb-1">{label}</p>
                    <p className="text-sky-deep font-mono font-bold text-sm">
                      Reading: {point.value} {unit}
                    </p>
                    {point.adjMean !== undefined && (
                      <p className="text-ink-muted font-mono">Phase μ_adj: {point.adjMean}</p>
                    )}
                    {point.upper2Sigma !== undefined && (
                      <p className="text-ink-muted font-mono">
                        2σ Range: [{point.lower2Sigma}, {point.upper2Sigma}]
                      </p>
                    )}
                  </div>
                );
              }}
            />

            {bands && (
              <ReferenceArea
                y1={bands.lower2Sigma}
                y2={bands.upper2Sigma}
                fill="#3B82F6"
                fillOpacity={0.1}
                stroke="#60A5FA"
                strokeDasharray="2 2"
                strokeOpacity={0.5}
              />
            )}

            {isSurgeonMode && earthStat && (
              <ReferenceLine
                y={earthStat.mean}
                stroke="#64748B"
                strokeDasharray="2 4"
                label={{ value: 'Earth μ', fill: '#64748B', fontSize: 10, position: 'insideTopLeft' }}
              />
            )}

            {bands && (
              <ReferenceLine
                y={bands.adjustedMean}
                stroke="#1D4ED8"
                strokeDasharray="4 4"
                label={{ value: 'μ_adj', fill: '#1D4ED8', fontSize: 10, position: 'right' }}
              />
            )}

            {hardLimits?.maxCritical !== undefined && (
              <ReferenceLine
                y={hardLimits.maxCritical}
                stroke="#EF4444"
                strokeDasharray="3 3"
                label={{ value: 'MAX LIMIT', fill: '#EF4444', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            {hardLimits?.minCritical !== undefined && hardLimits.minCritical > 0 && (
              <ReferenceLine
                y={hardLimits.minCritical}
                stroke="#EF4444"
                strokeDasharray="3 3"
                label={{ value: 'MIN LIMIT', fill: '#EF4444', fontSize: 10, position: 'insideBottomRight' }}
              />
            )}

            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563EB"
              strokeWidth={2.5}
              fill="rgba(59, 130, 246, 0.10)"
              dot={{ r: 3, fill: '#2563EB' }}
              activeDot={{ r: 5, fill: '#1D4ED8' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-ink-muted pt-2 border-t border-outline/60 mt-2 font-body">
        <span>Dual-filter hard limit + Z-score evaluator</span>
        <span className="font-mono">{chartData.length} / 30 buffer samples</span>
      </div>
    </HudCard>
  );
};
