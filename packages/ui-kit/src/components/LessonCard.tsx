import React, { useState } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_SHADOWS,
  SKYLEARN_TYPOGRAPHY,
  SKYLEARN_MOTION,
} from '../tokens/skylearnTokens';
import { LockIcon, FlameStreakIcon, CheckCircleIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export interface LessonCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  progressPercent?: number; // 0 - 100
  isCompleted?: boolean;
  isLocked?: boolean;
  streakDays?: number;
  categoryTag?: string;
  onToggleComplete?: (e: React.MouseEvent) => void;
  actionLabel?: string;
  className?: string;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  title,
  description,
  icon,
  progressPercent = 0,
  isCompleted = false,
  isLocked = false,
  streakDays,
  categoryTag,
  onToggleComplete,
  actionLabel,
  className = '',
  style,
  onClick,
  ...rest
}) => {
  const { highContrast, reducedMotion } = useAccessibility();
  const [isHovered, setIsHovered] = useState(false);

  const effectiveProgress = isCompleted ? 100 : Math.min(100, Math.max(0, progressPercent));

  const transitionDuration = reducedMotion
    ? `${SKYLEARN_MOTION.reducedDurations.standard}ms`
    : `${SKYLEARN_MOTION.durations.standard}ms`;

  const getBorder = () => {
    if (highContrast) {
      return isCompleted
        ? `2px solid ${SKYLEARN_COLORS.ink}`
        : `1px solid ${SKYLEARN_COLORS.ink}`;
    }
    if (isCompleted) {
      return `2px solid ${SKYLEARN_COLORS.leaf}`;
    }
    return isHovered && !isLocked
      ? `1px solid ${SKYLEARN_COLORS.sky}`
      : `1px solid ${SKYLEARN_COLORS.outline}`;
  };

  const getShadow = () => {
    if (highContrast) return 'none';
    if (isHovered && !isLocked) return SKYLEARN_SHADOWS.cardHover;
    return SKYLEARN_SHADOWS.restingCard;
  };

  const getTransform = () => {
    if (reducedMotion || isLocked) return 'none';
    return isHovered ? 'translateY(-2px)' : 'translateY(0)';
  };

  return (
    <div
      role="article"
      aria-disabled={isLocked}
      className={`skylearn-lesson-card ${isCompleted ? 'is-completed' : ''} ${isLocked ? 'is-locked' : ''} ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: SKYLEARN_RADII.card,
        backgroundColor: highContrast
          ? SKYLEARN_COLORS.background
          : isCompleted
          ? SKYLEARN_COLORS.surface
          : SKYLEARN_COLORS.surface,
        border: getBorder(),
        boxShadow: getShadow(),
        transform: getTransform(),
        transition: `transform ${transitionDuration} ${SKYLEARN_MOTION.spring}, box-shadow ${transitionDuration} ${SKYLEARN_MOTION.spring}, border-color ${transitionDuration} ease-out`,
        padding: '24px',
        opacity: isLocked ? 0.6 : 1,
        cursor: isLocked ? 'not-allowed' : onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
        overflow: 'hidden',
        minHeight: '220px',
        ...style,
      }}
      onMouseEnter={() => !isLocked && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={!isLocked ? onClick : undefined}
      {...rest}
    >
      {/* Top row: Icon (64px) & Badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <div
          className="skylearn-lesson-icon-wrap"
          style={{
            width: '64px',
            height: '64px',
            flexShrink: 0,
            borderRadius: '16px',
            backgroundColor: isCompleted
              ? SKYLEARN_COLORS.leafSoft
              : SKYLEARN_COLORS.skySoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isCompleted ? SKYLEARN_COLORS.leaf : SKYLEARN_COLORS.sky,
          }}
        >
          {isLocked ? (
            <LockIcon size={32} color={SKYLEARN_COLORS.sunDeep} />
          ) : (
            icon || <CheckCircleIcon size={32} color={isCompleted ? SKYLEARN_COLORS.leaf : SKYLEARN_COLORS.sky} />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap',
            gap: '6px',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          {categoryTag && (
            <span
              style={{
                fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
                fontSize: '11px',
                fontWeight: 600,
                color: SKYLEARN_COLORS.inkMuted,
                backgroundColor: SKYLEARN_COLORS.surfaceSunken,
                borderRadius: SKYLEARN_RADII.full,
                padding: '2px 10px',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                maxWidth: '100%',
                whiteSpace: 'nowrap',
              }}
            >
              {categoryTag}
            </span>
          )}

          {typeof streakDays === 'number' && streakDays > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: SKYLEARN_RADII.full,
                backgroundColor: '#FEF3C7',
                color: SKYLEARN_COLORS.sunDeep,
                fontFamily: SKYLEARN_TYPOGRAPHY.fonts.display,
                fontSize: '13px',
                fontWeight: 700,
              }}
              title={`${streakDays} day streak`}
            >
              <FlameStreakIcon size={14} color={SKYLEARN_COLORS.sunDeep} />
              <span>{streakDays}d</span>
            </span>
          )}
        </div>
      </div>

      {/* Center: Title & Description */}
      <div style={{ marginBottom: '20px' }}>
        <h3
          style={{
            margin: '0 0 6px 0',
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.display,
            fontSize: '22px',
            lineHeight: '28px',
            fontWeight: 700,
            color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.ink,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
            fontSize: '15px',
            lineHeight: '22px',
            color: highContrast ? SKYLEARN_COLORS.inkMuted : SKYLEARN_COLORS.inkMuted,
            letterSpacing: '0.01em',
          }}
        >
          {description}
        </p>
      </div>

      {/* Bottom: Progress strip (8px) & Action / Toggle */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '13px',
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
            color: SKYLEARN_COLORS.inkSubtle,
          }}
        >
          <span>Progress</span>
          <span style={{ fontWeight: 600 }}>{effectiveProgress}%</span>
        </div>

        {/* 8px tall, 999px radius progress strip */}
        <div
          role="progressbar"
          aria-valuenow={effectiveProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: '8px',
            borderRadius: SKYLEARN_RADII.full,
            backgroundColor: SKYLEARN_COLORS.skySoft,
            overflow: 'hidden',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${effectiveProgress}%`,
              borderRadius: SKYLEARN_RADII.full,
              backgroundColor: isCompleted ? SKYLEARN_COLORS.leaf : SKYLEARN_COLORS.leaf,
              transition: reducedMotion
                ? 'none'
                : `width ${SKYLEARN_MOTION.durations.progress}ms ease-out`,
            }}
          />
        </div>

        {/* Action button / complete toggle */}
        {onToggleComplete && !isLocked && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(e);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              minHeight: '44px',
              padding: '10px 16px',
              borderRadius: SKYLEARN_RADII.button,
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              border: isCompleted
                ? `1px solid ${SKYLEARN_COLORS.leaf}`
                : `1px solid ${SKYLEARN_COLORS.sky}`,
              backgroundColor: isCompleted
                ? SKYLEARN_COLORS.leafSoft
                : SKYLEARN_COLORS.skySoft,
              color: isCompleted
                ? SKYLEARN_COLORS.leafDeep
                : SKYLEARN_COLORS.skyDeep,
              transition: 'background-color 160ms ease-out',
            }}
          >
            <CheckCircleIcon size={18} color={isCompleted ? SKYLEARN_COLORS.leafDeep : SKYLEARN_COLORS.skyDeep} />
            <span>
              {actionLabel || (isCompleted ? 'Completed — Tap to Undo' : 'Mark as Complete')}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default LessonCard;
