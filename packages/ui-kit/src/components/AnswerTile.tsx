import React, { useState, useEffect } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_SHADOWS,
  SKYLEARN_TYPOGRAPHY,
  SKYLEARN_MOTION,
} from '../tokens/skylearnTokens';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  SparkleIcon,
  ChevronDownIcon,
} from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export type AnswerState = 'idle' | 'correct' | 'incorrect' | 'selected';

export interface AnswerTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  sublabel?: string;
  shortcutKey?: string;
  state?: AnswerState;
  explanation?: string;
  showWhyByDefault?: boolean;
  onSelect?: () => void;
  className?: string;
}

export const AnswerTile: React.FC<AnswerTileProps> = ({
  label,
  sublabel,
  shortcutKey,
  state = 'idle',
  explanation,
  showWhyByDefault = false,
  onSelect,
  className = '',
  style,
  ...rest
}) => {
  const { highContrast, reducedMotion } = useAccessibility();
  const [isHovered, setIsHovered] = useState(false);
  const [isWhyOpen, setIsWhyOpen] = useState(showWhyByDefault);
  const [isShaking, setIsShaking] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);

  // Trigger shake on incorrect
  useEffect(() => {
    if (state === 'incorrect' && !reducedMotion) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), SKYLEARN_MOTION.durations.standard);
      return () => clearTimeout(timer);
    }
  }, [state, reducedMotion]);

  // Trigger sparkle on correct
  useEffect(() => {
    if (state === 'correct') {
      setShowSparkles(true);
      const timer = setTimeout(() => setShowSparkles(false), SKYLEARN_MOTION.durations.burst * 3);
      return () => clearTimeout(timer);
    }
  }, [state]);

  const getColors = () => {
    if (highContrast) {
      if (state === 'correct') {
        return {
          bg: SKYLEARN_COLORS.background,
          border: SKYLEARN_COLORS.ink,
          text: SKYLEARN_COLORS.ink,
          badgeBg: SKYLEARN_COLORS.ink,
          badgeText: SKYLEARN_COLORS.background,
        };
      }
      if (state === 'incorrect') {
        return {
          bg: SKYLEARN_COLORS.background,
          border: SKYLEARN_COLORS.ink,
          text: SKYLEARN_COLORS.ink,
          badgeBg: SKYLEARN_COLORS.ink,
          badgeText: SKYLEARN_COLORS.background,
        };
      }
      return {
        bg: SKYLEARN_COLORS.background,
        border: isHovered ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.inkMuted,
        text: SKYLEARN_COLORS.ink,
        badgeBg: SKYLEARN_COLORS.surfaceSunken,
        badgeText: SKYLEARN_COLORS.ink,
      };
    }

    switch (state) {
      case 'correct':
        return {
          bg: SKYLEARN_COLORS.leafSoft,
          border: SKYLEARN_COLORS.leaf,
          text: SKYLEARN_COLORS.leafDeep,
          badgeBg: SKYLEARN_COLORS.leaf,
          badgeText: '#FFFFFF',
        };
      case 'incorrect':
        return {
          bg: SKYLEARN_COLORS.coralSoft,
          border: SKYLEARN_COLORS.coral,
          text: '#B91C1C',
          badgeBg: SKYLEARN_COLORS.coral,
          badgeText: '#FFFFFF',
        };
      case 'selected':
        return {
          bg: SKYLEARN_COLORS.skySoft,
          border: SKYLEARN_COLORS.sky,
          text: SKYLEARN_COLORS.skyDeep,
          badgeBg: SKYLEARN_COLORS.sky,
          badgeText: '#FFFFFF',
        };
      case 'idle':
      default:
        return {
          bg: SKYLEARN_COLORS.surface,
          border: isHovered ? SKYLEARN_COLORS.sky : SKYLEARN_COLORS.outline,
          text: SKYLEARN_COLORS.ink,
          badgeBg: SKYLEARN_COLORS.surfaceSunken,
          badgeText: SKYLEARN_COLORS.inkMuted,
        };
    }
  };

  const colors = getColors();

  // Animation CSS for shake (4px horizontal, 2 cycles over 240ms)
  const shakeKeyframeStyle = isShaking
    ? {
        animation: 'skylearn-shake 240ms ease-in-out',
      }
    : {};

  const shadow =
    highContrast || state === 'incorrect'
      ? 'none'
      : state === 'correct'
      ? '0 4px 16px rgba(34, 197, 94, 0.15)'
      : isHovered
      ? '0 8px 24px rgba(59, 130, 246, 0.12)'
      : SKYLEARN_SHADOWS.subtle;

  const transform =
    !reducedMotion && isHovered && state === 'idle'
      ? 'translateY(-2px)'
      : 'none';

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={state === 'selected' || state === 'correct'}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`skylearn-answer-tile skylearn-answer-${state} ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        minHeight: '96px',
        minWidth: '56px',
        padding: '16px 20px',
        borderRadius: SKYLEARN_RADII.button,
        backgroundColor: colors.bg,
        border: `2px solid ${colors.border}`,
        boxShadow: shadow,
        transform,
        cursor: 'pointer',
        boxSizing: 'border-box',
        transition: reducedMotion
          ? 'none'
          : `transform 180ms ${SKYLEARN_MOTION.spring}, box-shadow 180ms ease-out, border-color 180ms ease-out, background-color 180ms ease-out`,
        userSelect: 'none',
        ...shakeKeyframeStyle,
        ...style,
      }}
      {...rest}
    >
      <style>{`
        @keyframes skylearn-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @keyframes skylearn-sparkle-float {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          50% { opacity: 1; transform: translateY(-8px) scale(1.1); }
          100% { transform: translateY(-16px) scale(0.8); opacity: 0; }
        }
      `}</style>

      {/* Sparkle burst (3-4 particles on correct) */}
      {showSparkles && !reducedMotion && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            pointerEvents: 'none',
            display: 'flex',
            gap: '4px',
          }}
          aria-hidden="true"
        >
          <span style={{ animation: 'skylearn-sparkle-float 320ms ease-out 0ms forwards' }}>
            <SparkleIcon size={16} color={SKYLEARN_COLORS.leafDeep} />
          </span>
          <span style={{ animation: 'skylearn-sparkle-float 320ms ease-out 80ms forwards' }}>
            <SparkleIcon size={12} color={SKYLEARN_COLORS.sun} />
          </span>
          <span style={{ animation: 'skylearn-sparkle-float 320ms ease-out 160ms forwards' }}>
            <SparkleIcon size={14} color={SKYLEARN_COLORS.leaf} />
          </span>
        </div>
      )}

      {/* Top row: Shortcut Pill, Label & Status Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {shortcutKey && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: colors.badgeBg,
                color: colors.badgeText,
                fontFamily: SKYLEARN_TYPOGRAPHY.fonts.display,
                fontSize: '14px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {shortcutKey}
            </span>
          )}

          <div>
            <div
              style={{
                fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
                fontSize: '18px',
                lineHeight: '26px',
                fontWeight: 600,
                color: colors.text,
                letterSpacing: '0.01em',
              }}
            >
              {label}
            </div>
            {sublabel && (
              <div
                style={{
                  fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
                  fontSize: '14px',
                  lineHeight: '20px',
                  color: SKYLEARN_COLORS.inkMuted,
                  marginTop: '2px',
                }}
              >
                {sublabel}
              </div>
            )}
          </div>
        </div>

        {/* Status Icon */}
        <div style={{ flexShrink: 0 }}>
          {state === 'correct' && (
            <CheckCircleIcon size={24} color={SKYLEARN_COLORS.leafDeep} />
          )}
          {state === 'incorrect' && (
            <AlertTriangleIcon size={24} color={SKYLEARN_COLORS.coral} />
          )}
        </div>
      </div>

      {/* Incorrect Feedback & "Show me why" Disclosure */}
      {state === 'incorrect' && (
        <div
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: `1px dashed ${SKYLEARN_COLORS.coral}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '14px',
              fontWeight: 600,
              color: '#B91C1C',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>Let's check again — review your telemetry values.</span>
          </div>

          {explanation && (
            <div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWhyOpen((prev) => !prev);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: SKYLEARN_COLORS.skyDeep,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                <span>Show me why</span>
                <ChevronDownIcon
                  size={14}
                  color={SKYLEARN_COLORS.skyDeep}
                  style={{
                    transform: isWhyOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 180ms ease-out',
                  }}
                />
              </button>

              {isWhyOpen && (
                <div
                  style={{
                    marginTop: '6px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#FFFFFF',
                    fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
                    fontSize: '13px',
                    lineHeight: '18px',
                    color: SKYLEARN_COLORS.ink,
                    border: `1px solid ${SKYLEARN_COLORS.outline}`,
                  }}
                >
                  {explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnswerTile;
