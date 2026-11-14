import React, { useState } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
  SKYLEARN_MOTION,
} from '../tokens/skylearnTokens';
import { useAccessibility } from '../context/AccessibilityContext';

export type ButtonVariant = 'primary' | 'secondary' | 'sun' | 'leaf' | 'coral' | 'ghost';
export type ButtonSize = 'normal' | 'large' | 'compact';

export interface BigFriendlyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const BigFriendlyButton: React.FC<BigFriendlyButtonProps> = ({
  variant = 'primary',
  size = 'normal',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  isLoading = false,
  disabled = false,
  children,
  className = '',
  style,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  ...rest
}) => {
  const { highContrast, reducedMotion } = useAccessibility();
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // Variant palette resolution
  const getColors = () => {
    if (highContrast) {
      if (disabled) {
        return {
          bg: SKYLEARN_COLORS.background,
          text: SKYLEARN_COLORS.inkFaint,
          border: SKYLEARN_COLORS.inkFaint,
          bottomEdge: 'transparent',
        };
      }
      return {
        bg: variant === 'secondary' || variant === 'ghost' ? SKYLEARN_COLORS.background : SKYLEARN_COLORS.ink,
        text: variant === 'secondary' || variant === 'ghost' ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.background,
        border: SKYLEARN_COLORS.ink,
        bottomEdge: variant === 'secondary' || variant === 'ghost' ? 'transparent' : '#000000',
      };
    }

    if (disabled) {
      return {
        bg: SKYLEARN_COLORS.surfaceSunken,
        text: SKYLEARN_COLORS.inkFaint,
        border: SKYLEARN_COLORS.outline,
        bottomEdge: 'transparent',
      };
    }

    switch (variant) {
      case 'primary':
        return {
          bg: isHovered ? SKYLEARN_COLORS.skyDeep : SKYLEARN_COLORS.sky,
          text: '#FFFFFF',
          border: isHovered ? SKYLEARN_COLORS.skyDeep : SKYLEARN_COLORS.sky,
          bottomEdge: SKYLEARN_COLORS.skyBright,
        };
      case 'sun':
        return {
          bg: isHovered ? SKYLEARN_COLORS.sunDeep : SKYLEARN_COLORS.sun,
          text: '#FFFFFF',
          border: isHovered ? SKYLEARN_COLORS.sunDeep : SKYLEARN_COLORS.sun,
          bottomEdge: SKYLEARN_COLORS.sunBright,
        };
      case 'leaf':
        return {
          bg: isHovered ? SKYLEARN_COLORS.leafDeep : SKYLEARN_COLORS.leaf,
          text: '#FFFFFF',
          border: isHovered ? SKYLEARN_COLORS.leafDeep : SKYLEARN_COLORS.leaf,
          bottomEdge: '#86EFAC',
        };
      case 'coral':
        return {
          bg: isHovered ? '#EF4444' : SKYLEARN_COLORS.coral,
          text: '#FFFFFF',
          border: isHovered ? '#EF4444' : SKYLEARN_COLORS.coral,
          bottomEdge: '#FCA5A5',
        };
      case 'secondary':
        return {
          bg: isHovered ? SKYLEARN_COLORS.skySoft : SKYLEARN_COLORS.surface,
          text: SKYLEARN_COLORS.ink,
          border: isHovered ? SKYLEARN_COLORS.sky : SKYLEARN_COLORS.outline,
          bottomEdge: 'transparent',
        };
      case 'ghost':
        return {
          bg: isHovered ? SKYLEARN_COLORS.surfaceSunken : 'transparent',
          text: SKYLEARN_COLORS.ink,
          border: 'transparent',
          bottomEdge: 'transparent',
        };
      default:
        return {
          bg: SKYLEARN_COLORS.sky,
          text: '#FFFFFF',
          border: SKYLEARN_COLORS.sky,
          bottomEdge: SKYLEARN_COLORS.skyBright,
        };
    }
  };

  const colors = getColors();

  // Size metrics
  const minHeight = size === 'compact' ? '56px' : size === 'large' ? '72px' : '64px';
  const padding =
    size === 'compact'
      ? '16px 28px'
      : size === 'large'
      ? '24px 48px'
      : '20px 40px';
  const fontSize = size === 'compact' ? '18px' : size === 'large' ? '22px' : '20px';

  // Transform and tactile shadow
  const transform =
    !reducedMotion && isActive && !disabled
      ? 'scale(0.97)'
      : !reducedMotion && isHovered && !disabled
      ? 'translateY(-1px)'
      : 'none';

  const transitionDuration = reducedMotion
    ? `${SKYLEARN_MOTION.reducedDurations.snap}ms`
    : `${SKYLEARN_MOTION.durations.snap}ms`;

  const boxShadow =
    !disabled && colors.bottomEdge !== 'transparent'
      ? `0 3px 0 0 ${colors.bottomEdge}, 0 6px 16px rgba(15, 23, 42, 0.08)`
      : !disabled && variant === 'secondary' && isHovered
      ? '0 4px 12px rgba(59, 130, 246, 0.12)'
      : 'none';

  const buttonStyle: React.CSSProperties = {
    display: fullWidth ? 'flex' : 'inline-flex',
    width: fullWidth ? '100%' : 'auto',
    minHeight,
    minWidth: '56px',
    padding,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    borderRadius: SKYLEARN_RADII.button,
    backgroundColor: colors.bg,
    color: colors.text,
    border: `2px solid ${colors.border}`,
    boxShadow,
    transform,
    fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
    fontSize,
    fontWeight: 600,
    lineHeight: '1.2',
    letterSpacing: '0.01em',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    outline: 'none',
    userSelect: 'none',
    boxSizing: 'border-box',
    textDecoration: 'none',
    transition: `transform ${transitionDuration} ${SKYLEARN_MOTION.easeOut}, background-color ${transitionDuration} ease-out, border-color ${transitionDuration} ease-out, box-shadow ${transitionDuration} ease-out`,
    ...style,
  };

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`skylearn-button skylearn-btn-${variant} ${className}`}
      style={buttonStyle}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        setIsActive(false);
        onMouseLeave?.(e);
      }}
      onMouseDown={(e) => {
        setIsActive(true);
        onMouseDown?.(e);
      }}
      onMouseUp={(e) => {
        setIsActive(false);
        onMouseUp?.(e);
      }}
      {...rest}
    >
      {isLoading ? (
        <span
          style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            borderTopColor: '#FFFFFF',
            animation: 'spin 1s ease-in-out infinite',
          }}
          aria-label="Loading..."
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="skylearn-btn-icon">{icon}</span>}
          <span>{children}</span>
          {icon && iconPosition === 'right' && <span className="skylearn-btn-icon">{icon}</span>}
        </>
      )}
    </button>
  );
};

export default BigFriendlyButton;
