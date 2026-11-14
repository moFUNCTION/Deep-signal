import React, { useState } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_SHADOWS,
  SKYLEARN_MOTION,
} from '../tokens/skylearnTokens';
import { useAccessibility } from '../context/AccessibilityContext';

export interface HudCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'sunken';
  isActive?: boolean;
  clickable?: boolean;
  padding?: string | number;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export const HudCard: React.FC<HudCardProps> = ({
  variant = 'default',
  isActive = false,
  clickable = false,
  padding = '24px',
  header,
  footer,
  className = '',
  style,
  children,
  onMouseEnter,
  onMouseLeave,
  onClick,
  ...rest
}) => {
  const { highContrast, reducedMotion } = useAccessibility();
  const [isHovered, setIsHovered] = useState(false);

  const getBackground = () => {
    if (highContrast) return SKYLEARN_COLORS.background;
    if (variant === 'elevated') return SKYLEARN_COLORS.surfaceElevated;
    if (variant === 'sunken') return SKYLEARN_COLORS.surfaceSunken;
    return SKYLEARN_COLORS.surface;
  };

  const getBorder = () => {
    if (highContrast) {
      return isActive
        ? `3px solid ${SKYLEARN_COLORS.ink}`
        : `2px solid ${SKYLEARN_COLORS.ink}`;
    }
    if (isActive) {
      return `3px solid ${SKYLEARN_COLORS.sky}`;
    }
    return `1px solid ${SKYLEARN_COLORS.outline}`;
  };

  const getShadow = () => {
    if (highContrast) return 'none';
    if (isActive) return SKYLEARN_SHADOWS.cardActive;
    if (clickable && isHovered) return SKYLEARN_SHADOWS.cardHover;
    if (variant === 'elevated') return SKYLEARN_SHADOWS.subtle;
    return SKYLEARN_SHADOWS.restingCard;
  };

  const getTransform = () => {
    if (reducedMotion || !clickable) return 'none';
    return isHovered ? 'translateY(-2px)' : 'translateY(0)';
  };

  const transitionDuration = reducedMotion
    ? `${SKYLEARN_MOTION.reducedDurations.standard}ms`
    : `${SKYLEARN_MOTION.durations.standard}ms`;

  const cardStyle: React.CSSProperties = {
    position: 'relative',
    borderRadius: SKYLEARN_RADII.card,
    backgroundColor: getBackground(),
    border: getBorder(),
    boxShadow: getShadow(),
    transform: getTransform(),
    transition: `transform ${transitionDuration} ${SKYLEARN_MOTION.spring}, box-shadow ${transitionDuration} ${SKYLEARN_MOTION.spring}, border-color ${transitionDuration} ease-out`,
    cursor: clickable || onClick ? 'pointer' : 'default',
    overflow: 'hidden',
    boxSizing: 'border-box',
    ...style,
  };

  const contentPadding = typeof padding === 'number' ? `${padding}px` : padding;

  return (
    <div
      role={clickable || onClick ? 'button' : 'region'}
      tabIndex={clickable || onClick ? 0 : undefined}
      className={`skylearn-hud-card ${isActive ? 'is-active' : ''} ${className}`}
      style={cardStyle}
      onMouseEnter={(e) => {
        if (clickable || onClick) setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e);
      }}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((clickable || onClick) && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.(e as any);
        }
      }}
      {...rest}
    >
      {header && (
        <div
          className="skylearn-card-header"
          style={{
            padding: `${contentPadding} ${contentPadding} 0 ${contentPadding}`,
            borderBottom: `1px solid ${SKYLEARN_COLORS.outline}`,
            marginBottom: '16px',
            paddingBottom: '16px',
          }}
        >
          {header}
        </div>
      )}

      <div
        className="skylearn-card-body"
        style={{
          padding: header || footer ? `0 ${contentPadding}` : contentPadding,
        }}
      >
        {children}
      </div>

      {footer && (
        <div
          className="skylearn-card-footer"
          style={{
            padding: `16px ${contentPadding} ${contentPadding} ${contentPadding}`,
            borderTop: `1px solid ${SKYLEARN_COLORS.outline}`,
            marginTop: '16px',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default HudCard;
