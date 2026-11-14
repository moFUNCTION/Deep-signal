import React from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { FlameStreakIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export interface StreakCounterProps extends React.HTMLAttributes<HTMLDivElement> {
  days: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const StreakCounter: React.FC<StreakCounterProps> = ({
  days,
  size = 'md',
  label = 'Day Streak',
  className = '',
  style,
  ...rest
}) => {
  const { highContrast, reducedMotion } = useAccessibility();

  // Subtle visual growth multiplier based on streak length (capped at 1.15)
  const growthScale = reducedMotion ? 1 : Math.min(1.15, 1 + Math.min(days, 30) * 0.005);

  const metrics = {
    sm: {
      padding: '4px 10px',
      iconSize: 16,
      numberSize: '15px',
      labelSize: '12px',
      gap: '6px',
    },
    md: {
      padding: '6px 14px',
      iconSize: 20,
      numberSize: '18px',
      labelSize: '13px',
      gap: '8px',
    },
    lg: {
      padding: '8px 18px',
      iconSize: 26,
      numberSize: '24px',
      labelSize: '15px',
      gap: '10px',
    },
  }[size];

  const getBackground = () => {
    if (highContrast) return SKYLEARN_COLORS.background;
    if (days >= 7) return '#FEF3C7'; // Sun soft
    if (days > 0) return SKYLEARN_COLORS.surface;
    return SKYLEARN_COLORS.surfaceSunken;
  };

  const getBorder = () => {
    if (highContrast) return `2px solid ${SKYLEARN_COLORS.ink}`;
    if (days >= 7) return `1.5px solid ${SKYLEARN_COLORS.sun}`;
    return `1px solid ${SKYLEARN_COLORS.outline}`;
  };

  const getTextColor = () => {
    if (highContrast) return SKYLEARN_COLORS.ink;
    if (days >= 7) return SKYLEARN_COLORS.sunDeep;
    if (days > 0) return SKYLEARN_COLORS.ink;
    return SKYLEARN_COLORS.inkMuted;
  };

  const getFlameColor = () => {
    if (highContrast) return SKYLEARN_COLORS.ink;
    if (days >= 14) return '#EA580C'; // Fire orange
    if (days >= 3) return SKYLEARN_COLORS.sun;
    return SKYLEARN_COLORS.inkSubtle;
  };

  return (
    <div
      role="status"
      aria-label={`${days} ${label}`}
      className={`skylearn-streak-counter ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: metrics.padding,
        borderRadius: SKYLEARN_RADII.full,
        backgroundColor: getBackground(),
        border: getBorder(),
        color: getTextColor(),
        gap: metrics.gap,
        transform: `scale(${growthScale})`,
        transformOrigin: 'center left',
        transition: reducedMotion ? 'none' : 'transform 240ms ease-out, background-color 240ms ease-out',
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: getFlameColor(),
        }}
      >
        <FlameStreakIcon
          size={metrics.iconSize}
          color={getFlameColor()}
          style={{
            fill: days > 0 ? getFlameColor() : 'none',
          }}
        />
      </span>

      <span
        style={{
          fontFamily: SKYLEARN_TYPOGRAPHY.fonts.display,
          fontSize: metrics.numberSize,
          lineHeight: '1',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {days}
      </span>

      {label && (
        <span
          style={{
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
            fontSize: metrics.labelSize,
            lineHeight: '1',
            color: highContrast ? SKYLEARN_COLORS.inkMuted : SKYLEARN_COLORS.inkMuted,
            fontWeight: 500,
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
};

export default StreakCounter;
