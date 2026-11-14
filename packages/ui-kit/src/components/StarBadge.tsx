import React, { useState, useEffect } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_SHADOWS,
  SKYLEARN_MOTION,
} from '../tokens/skylearnTokens';
import { StarIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export type StarTier = 'gold' | 'silver' | 'bronze' | 'sun';
export type StarBadgeSize = 'sm' | 'md' | 'lg';

export interface StarBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  tier?: StarTier;
  size?: StarBadgeSize;
  isNewlyEarned?: boolean;
  isUnlocked?: boolean;
  className?: string;
}

const TIER_COLORS: Record<StarTier, { bg: string; border: string; star: string; glow: string }> = {
  gold: {
    bg: SKYLEARN_COLORS.sun,
    border: SKYLEARN_COLORS.sunDeep,
    star: '#FFFFFF',
    glow: SKYLEARN_SHADOWS.rewardGlow,
  },
  sun: {
    bg: SKYLEARN_COLORS.sun,
    border: SKYLEARN_COLORS.sunDeep,
    star: '#FFFFFF',
    glow: SKYLEARN_SHADOWS.rewardGlow,
  },
  silver: {
    bg: '#CBD5E1',
    border: '#94A3B8',
    star: '#FFFFFF',
    glow: '0 0 20px rgba(148, 163, 184, 0.4)',
  },
  bronze: {
    bg: '#D97706',
    border: '#B45309',
    star: '#FFFFFF',
    glow: '0 0 20px rgba(217, 119, 6, 0.4)',
  },
};

export const StarBadge: React.FC<StarBadgeProps> = ({
  tier = 'sun',
  size = 'lg',
  isNewlyEarned = false,
  isUnlocked = true,
  className = '',
  style,
  ...rest
}) => {
  const { highContrast, reducedMotion } = useAccessibility();
  const [hasGlow, setHasGlow] = useState(isNewlyEarned);

  useEffect(() => {
    if (isNewlyEarned) {
      setHasGlow(true);
      const timer = setTimeout(() => {
        setHasGlow(false);
      }, SKYLEARN_MOTION.durations.glow);
      return () => clearTimeout(timer);
    }
  }, [isNewlyEarned]);

  const metrics: Record<StarBadgeSize, { circle: number; star: number; border: number }> = {
    sm: { circle: 32, star: 18, border: 2 },
    md: { circle: 48, star: 26, border: 2 },
    lg: { circle: 64, star: 34, border: 3 },
  };

  const { circle, star, border } = metrics[size];
  const tierConfig = TIER_COLORS[tier];

  const getBackground = () => {
    if (!isUnlocked) return SKYLEARN_COLORS.surfaceSunken;
    if (highContrast) return SKYLEARN_COLORS.background;
    return tierConfig.bg;
  };

  const getBorderColor = () => {
    if (!isUnlocked) return SKYLEARN_COLORS.outline;
    if (highContrast) return SKYLEARN_COLORS.ink;
    return tierConfig.border;
  };

  const getStarColor = () => {
    if (!isUnlocked) return SKYLEARN_COLORS.inkFaint;
    if (highContrast) return SKYLEARN_COLORS.ink;
    return tierConfig.star;
  };

  const shadow =
    hasGlow && !reducedMotion && !highContrast && isUnlocked
      ? tierConfig.glow
      : '0 4px 12px rgba(15, 23, 42, 0.08)';

  return (
    <div
      role="img"
      aria-label={`${tier} star badge${isUnlocked ? '' : ' locked'}`}
      className={`skylearn-star-badge skylearn-star-${tier} ${hasGlow ? 'has-glow' : ''} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${circle}px`,
        height: `${circle}px`,
        borderRadius: SKYLEARN_RADII.full,
        backgroundColor: getBackground(),
        border: `${border}px solid ${getBorderColor()}`,
        boxShadow: shadow,
        transition: reducedMotion
          ? 'none'
          : `box-shadow ${SKYLEARN_MOTION.durations.glow}ms ease-out, transform 480ms ${SKYLEARN_MOTION.spring}`,
        boxSizing: 'border-box',
        flexShrink: 0,
        opacity: isUnlocked ? 1 : 0.4,
        ...style,
      }}
      {...rest}
    >
      <StarIcon
        size={star}
        color={getStarColor()}
        style={{
          fill: isUnlocked ? getStarColor() : 'none',
        }}
      />
    </div>
  );
};

export interface StarBadgeStackProps {
  unlockedStars?: number; // 0 to 3
  size?: StarBadgeSize;
  className?: string;
}

export const StarBadgeStack: React.FC<StarBadgeStackProps> = ({
  unlockedStars = 3,
  size = 'md',
  className = '',
}) => {
  return (
    <div
      role="group"
      aria-label={`${unlockedStars} of 3 stars earned`}
      className={`skylearn-star-stack ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? '6px' : '10px',
      }}
    >
      <StarBadge tier="bronze" size={size} isUnlocked={unlockedStars >= 1} />
      <StarBadge tier="silver" size={size} isUnlocked={unlockedStars >= 2} />
      <StarBadge tier="gold" size={size} isUnlocked={unlockedStars >= 3} />
    </div>
  );
};

export default StarBadge;
