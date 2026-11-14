import React from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { useAccessibility } from '../context/AccessibilityContext';

export interface MetricSparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  data: number[];
  metricLabel: string;
  currentValue: number | string;
  unit?: string;
  zScore?: number;
  severity?: 'green' | 'yellow' | 'red' | 'nominal' | 'caution' | 'critical';
  width?: number | string;
  height?: number;
  hideHeader?: boolean;
  className?: string;
}

export const MetricSparkline: React.FC<MetricSparklineProps> = ({
  data = [72, 75, 74, 78, 80, 82, 81],
  metricLabel,
  currentValue,
  unit = '',
  zScore,
  severity = 'green',
  width = '100%',
  height = 54,
  hideHeader = false,
  className = '',
  style,
  ...rest
}) => {
  const { highContrast } = useAccessibility();

  const isCritical = severity === 'red' || severity === 'critical';
  const isCaution = severity === 'yellow' || severity === 'caution';

  const strokeColor = highContrast
    ? SKYLEARN_COLORS.ink
    : isCritical
    ? SKYLEARN_COLORS.coral
    : isCaution
    ? SKYLEARN_COLORS.sun
    : SKYLEARN_COLORS.leaf;

  const fillColor = highContrast
    ? 'none'
    : isCritical
    ? 'rgba(248, 113, 113, 0.15)'
    : isCaution
    ? 'rgba(251, 191, 36, 0.15)'
    : 'rgba(34, 197, 94, 0.15)';

  // Build SVG path
  const svgWidth = 140;
  const svgHeight = height;
  const paddingY = 6;

  const points = data.length > 1 ? data : [0, 0];
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const range = maxVal - minVal || 1;

  const coords = points.map((val, index) => {
    const x = (index / (points.length - 1)) * svgWidth;
    const y = svgHeight - paddingY - ((val - minVal) / range) * (svgHeight - paddingY * 2);
    return { x, y };
  });

  const linePath = coords.reduce(
    (acc, pt, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`,
    ''
  );

  const areaPath = `${linePath} L ${svgWidth},${svgHeight} L 0,${svgHeight} Z`;

  return (
    <div
      role="region"
      aria-label={`${metricLabel} trend: ${currentValue} ${unit}`}
      className={`skylearn-metric-sparkline ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        width: typeof width === 'number' ? `${width}px` : width,
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {!hideHeader && (
        <>
          {/* Header: Label, Value & Z-Score Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: '8px',
            }}
          >
            <span
              style={{
                fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
                fontSize: '13px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: highContrast ? SKYLEARN_COLORS.inkMuted : SKYLEARN_COLORS.inkMuted,
              }}
            >
              {metricLabel}
            </span>

            {typeof zScore === 'number' && (
              <span
                style={{
                  fontFamily: SKYLEARN_TYPOGRAPHY.fonts.mono,
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: SKYLEARN_RADII.full,
                  backgroundColor: isCritical
                    ? SKYLEARN_COLORS.coralSoft
                    : isCaution
                    ? '#FEF3C7'
                    : SKYLEARN_COLORS.leafSoft,
                  color: isCritical
                    ? '#B91C1C'
                    : isCaution
                    ? SKYLEARN_COLORS.sunDeep
                    : SKYLEARN_COLORS.leafDeep,
                  border: `1px solid ${strokeColor}`,
                }}
              >
                {zScore >= 0 ? `+${zScore.toFixed(1)}σ` : `${zScore.toFixed(1)}σ`}
              </span>
            )}
          </div>

          {/* Numerical Readout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '4px',
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.mono,
            }}
          >
            <span
              style={{
                fontSize: '24px',
                lineHeight: '1',
                fontWeight: 700,
                color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.ink,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {currentValue}
            </span>
            {unit && (
              <span
                style={{
                  fontSize: '13px',
                  color: SKYLEARN_COLORS.inkSubtle,
                  fontWeight: 500,
                }}
              >
                {unit}
              </span>
            )}
          </div>
        </>
      )}

      {/* SVG Sparkline Graph */}
      <div
        style={{
          width: '100%',
          height: `${svgHeight}px`,
          marginTop: '2px',
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            overflow: 'visible',
          }}
        >
          {/* Shaded Area */}
          <path d={areaPath} fill={fillColor} />
          {/* Stroke Line */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* End point marker */}
          {coords.length > 0 && (
            <circle
              cx={coords[coords.length - 1].x}
              cy={coords[coords.length - 1].y}
              r={3}
              fill={strokeColor}
            />
          )}
        </svg>
      </div>
    </div>
  );
};

export default MetricSparkline;
