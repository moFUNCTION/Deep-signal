import React, { useState, useEffect } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
  SKYLEARN_MOTION,
} from '../tokens/skylearnTokens';
import { SparkleIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 - 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  height?: number | string;
  fillColor?: string;
  trackColor?: string;
  sparkleOnComplete?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = false,
  height = 8,
  fillColor,
  trackColor,
  sparkleOnComplete = true,
  className = '',
  style,
  ...rest
}) => {
  const { highContrast, reducedMotion } = useAccessibility();
  const [showSparkle, setShowSparkle] = useState(false);

  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  useEffect(() => {
    if (percentage >= 100 && sparkleOnComplete && !reducedMotion) {
      setShowSparkle(true);
      const timer = setTimeout(() => setShowSparkle(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [percentage, sparkleOnComplete, reducedMotion]);

  const effectiveTrack = highContrast
    ? SKYLEARN_COLORS.surfaceSunken
    : trackColor || SKYLEARN_COLORS.skySoft;

  const effectiveFill = highContrast
    ? SKYLEARN_COLORS.ink
    : fillColor || SKYLEARN_COLORS.leaf;

  const barHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`skylearn-progress-container ${className}`}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {(label || showPercentage) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
            fontSize: '14px',
            lineHeight: '20px',
            color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.inkMuted,
          }}
        >
          {label && <span style={{ fontWeight: 500 }}>{label}</span>}
          {showPercentage && (
            <span
              style={{
                fontFamily: SKYLEARN_TYPOGRAPHY.fonts.mono,
                fontWeight: 600,
                color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.ink,
              }}
            >
              {percentage}%
            </span>
          )}
        </div>
      )}

      {/* 8px tall, 999px radius track */}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        style={{
          position: 'relative',
          height: barHeight,
          borderRadius: SKYLEARN_RADII.full,
          backgroundColor: effectiveTrack,
          border: highContrast ? `1px solid ${SKYLEARN_COLORS.ink}` : 'none',
          overflow: 'visible',
          width: '100%',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            borderRadius: SKYLEARN_RADII.full,
            backgroundColor: effectiveFill,
            transition: reducedMotion
              ? 'none'
              : `width ${SKYLEARN_MOTION.durations.progress}ms ${SKYLEARN_MOTION.easeOut}`,
            boxShadow:
              percentage >= 100 && !highContrast
                ? '0 0 12px rgba(34, 197, 94, 0.4)'
                : 'none',
          }}
        />

        {/* Milestone sparkle at end of bar */}
        {showSparkle && !reducedMotion && (
          <div
            style={{
              position: 'absolute',
              right: '-6px',
              top: '-10px',
              animation: 'skylearn-sparkle-pulse 1000ms ease-out infinite',
              pointerEvents: 'none',
            }}
            aria-hidden="true"
          >
            <SparkleIcon size={20} color={SKYLEARN_COLORS.sun} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes skylearn-sparkle-pulse {
          0% { transform: scale(0.6) rotate(0deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(45deg); opacity: 1; }
          100% { transform: scale(1) rotate(90deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ProgressBar;
