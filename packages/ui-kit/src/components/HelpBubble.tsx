import React from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { LightBulbIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export interface HelpBubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  tailPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'left';
  showIcon?: boolean;
  icon?: React.ReactNode;
  title?: string;
  className?: string;
}

export const HelpBubble: React.FC<HelpBubbleProps> = ({
  tailPosition = 'bottom-left',
  showIcon = true,
  icon,
  title = 'AURA Companion Note',
  children,
  className = '',
  style,
  ...rest
}) => {
  const { highContrast } = useAccessibility();

  const getTailStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    const color = highContrast ? SKYLEARN_COLORS.background : SKYLEARN_COLORS.skySoft;

    switch (tailPosition) {
      case 'bottom-left':
        return {
          ...base,
          bottom: '-10px',
          left: '24px',
          borderWidth: '10px 10px 0 0',
          borderColor: `${color} transparent transparent transparent`,
        };
      case 'bottom-right':
        return {
          ...base,
          bottom: '-10px',
          right: '24px',
          borderWidth: '10px 0 0 10px',
          borderColor: `${color} transparent transparent transparent`,
        };
      case 'top-left':
        return {
          ...base,
          top: '-10px',
          left: '24px',
          borderWidth: '0 10px 10px 0',
          borderColor: `transparent ${color} transparent transparent`,
        };
      case 'left':
        return {
          ...base,
          left: '-10px',
          top: '20px',
          borderWidth: '10px 10px 10px 0',
          borderColor: `transparent ${color} transparent transparent`,
        };
      default:
        return {
          ...base,
          bottom: '-10px',
          left: '24px',
          borderWidth: '10px 10px 0 0',
          borderColor: `${color} transparent transparent transparent`,
        };
    }
  };

  return (
    <div
      role="note"
      aria-label={title}
      className={`skylearn-help-bubble ${className}`}
      style={{
        position: 'relative',
        borderRadius: SKYLEARN_RADII.card,
        backgroundColor: highContrast ? SKYLEARN_COLORS.background : SKYLEARN_COLORS.skySoft,
        border: `1.5px solid ${highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.sky}`,
        padding: '16px 20px',
        color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.skyDeep,
        boxShadow: highContrast ? 'none' : '0 6px 20px rgba(59, 130, 246, 0.12)',
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {/* Speech Bubble Tail */}
      <div style={getTailStyle()} aria-hidden="true" />

      {/* Title & Icon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
          fontWeight: 700,
          fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
          fontSize: '15px',
          color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.skyDeep,
        }}
      >
        {showIcon && (
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {icon || <LightBulbIcon size={18} color={highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.sky} />}
          </span>
        )}
        <span>{title}</span>
      </div>

      {/* Body content */}
      <div
        style={{
          fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
          fontSize: '15px',
          lineHeight: '22px',
          letterSpacing: '0.01em',
          color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.ink,
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default HelpBubble;
