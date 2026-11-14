import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import type { BiometricMetricKey, MetricKey } from '@aura/medical-engine';
import {
  NASA_HARD_LIMITS,
  getPhaseAdjustedBands,
} from '@aura/medical-engine';
import { HudCard } from '@aura/ui-kit';
import { useAuthStore } from '../../store/useAuthStore';
import { useMedicalStore } from '../../store/useMedicalStore';

export const BaselineTrendChart: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const selectedMetric = useMedicalStore((s) => s.selectedMetric);
  const vitalHistory = useMedicalStore((s) => s.vitalHistory);
  const currentVital = useMedicalStore((s) => s.currentVital);

  // Compute Phase-Adjusted Bands if biometric metric
  const isBiometric = selectedMetric in profile.earthBaselines;
  const bands = isBiometric
    ? getPhaseAdjustedBands(
        selectedMetric as BiometricMetricKey,
        profile.earthBaselines[selectedMetric as BiometricMetricKey],
        currentVital.mission_phase || profile.missionPhase,
      )
    : null;

  const hardLimits = NASA_HARD_LIMITS[selectedMetric];

  // Prepare chart series data
  const chartData = vitalHistory.map((item, index) => {
    const rawVal = item[selectedMetric as keyof typeof item];
    const val = typeof rawVal === 'number' ? rawVal : 0;
    const timeLabel = item.$createdAt
      ? new Date(item.$createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : `T-${15 - index}m`;

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

  // Determine chart Y domain
  const values = chartData.map((d) => d.value).filter((v) => typeof v === 'number');
  const minVal = Math.min(...values, bands?.lower2Sigma ?? Infinity, hardLimits?.minCritical ?? Infinity);
  const maxVal = Math.max(...values, bands?.upper2Sigma ?? -Infinity, hardLimits?.maxCritical ?? -Infinity);
  const padding = (maxVal - minVal) * 0.15 || 5;
  const yDomain = [Math.floor(minVal - padding), Math.ceil(maxVal + padding)];

  return (
    <HudCard padding="20px" className="w-full h-full flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-display font-bold text-base text-ink">
              {metricLabel} // Physiological Baseline Bands
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-pill bg-sky-soft text-sky-deep font-mono font-semibold">
              Current: {currentVal} {unit}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            Shaded cyan region indicates flight surgeon personal $\mu \pm 2\sigma$ envelope adjusted for{' '}
            <span className="font-semibold text-ink">{profile.missionPhase}</span>
          </p>
        </div>

        {/* Legend / Stats Badges */}
        {bands && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-sky/30 border border-sky" />
              <span className="text-ink-muted">
                $\mu_{'{'}adj{'}'}$: <strong className="text-ink">{bands.adjustedMean}</strong>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-coral" />
              <span className="text-ink-muted">
                $\pm 2\sigma$: <strong className="text-ink">[{bands.lower2Sigma}, {bands.upper2Sigma}]</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
            <YAxis domain={yDomain} stroke="#94a3b8" fontSize={11} tickLine={false} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-sm p-3 rounded-btn border border-outline shadow-lg text-xs font-body">
                    <p className="font-bold text-ink mb-1">{label}</p>
                    <p className="text-sky-deep font-mono font-bold text-sm">
                      Value: {point.value} {unit}
                    </p>
                    {point.adjMean !== undefined && (
                      <p className="text-ink-muted font-mono">Adjusted Baseline μ: {point.adjMean}</p>
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

            {/* Shaded Phase-Adjusted 2-Sigma Confidence Band */}
            {bands && (
              <ReferenceArea
                y1={bands.lower2Sigma}
                y2={bands.upper2Sigma}
                fill="#38bdf8"
                fillOpacity={0.12}
                stroke="#38bdf8"
                strokeDasharray="2 2"
                strokeOpacity={0.5}
              />
            )}

            {/* Mean Baseline Line */}
            {bands && (
              <ReferenceLine
                y={bands.adjustedMean}
                stroke="#0284c7"
                strokeDasharray="4 4"
                label={{ value: 'μ_adj', fill: '#0284c7', fontSize: 10, position: 'right' }}
              />
            )}

            {/* NASA Hard Critical Limits */}
            {hardLimits?.maxCritical && (
              <ReferenceLine
                y={hardLimits.maxCritical}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: 'MAX CRIT', fill: '#ef4444', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            {hardLimits?.minCritical && (
              <ReferenceLine
                y={hardLimits.minCritical}
                stroke="#ef4444"
                strokeDasharray="3 3"
                label={{ value: 'MIN CRIT', fill: '#ef4444', fontSize: 10, position: 'insideBottomRight' }}
              />
            )}

            {/* Real Telemetry Trend Line */}
            <Area
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="rgba(37, 99, 235, 0.08)"
              dot={{ r: 3, fill: '#2563eb' }}
              activeDot={{ r: 5, fill: '#1d4ed8' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-ink-muted pt-2 border-t border-outline/40 mt-2 font-body">
        <span>Dual-Filter personal Z-Score evaluator active</span>
        <span>Sampling buffer: {chartData.length} records (Ring buffer 30 max)</span>
      </div>
    </HudCard>
  );
};
