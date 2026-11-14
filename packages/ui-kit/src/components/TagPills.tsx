import React from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { useAccessibility } from '../context/AccessibilityContext';

export type TagPillVariant =
  | 'system'
  | 'nominal'
  | 'caution'
  | 'action_required'
  | 'bonus'
  | 'sky'
  | 'leaf'
  | 'sun'
  | 'coral'
  | 'berry'
  | 'neutral';

export interface TagPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagPillVariant;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const TagPill: React.FC<TagPillProps> = ({
  variant = 'system',
  label,
  icon,
  children,
  className = '',
  style,
  ...rest
}) => {
  const { highContrast } = useAccessibility();

  const getColors = () => {
    if (highContrast) {
      return {
        bg: SKYLEARN_COLORS.background,
        text: SKYLEARN_COLORS.ink,
        border: SKYLEARN_COLORS.ink,
      };
    }

    switch (variant) {
      case 'nominal':
      case 'leaf':
        return {
          bg: SKYLEARN_COLORS.leafSoft,
          text: SKYLEARN_COLORS.leafDeep,
          border: SKYLEARN_COLORS.leaf,
        };
      case 'caution':
      case 'sun':
        return {
          bg: '#FEF3C7',
          text: SKYLEARN_COLORS.sunDeep,
          border: SKYLEARN_COLORS.sun,
        };
      case 'action_required':
      case 'coral':
        return {
          bg: SKYLEARN_COLORS.coralSoft,
          text: '#B91C1C',
          border: SKYLEARN_COLORS.coral,
        };
      case 'bonus':
      case 'berry':
        return {
          bg: '#F3E8FF',
          text: '#7E22CE',
          border: SKYLEARN_COLORS.berry,
        };
      case 'neutral':
        return {
          bg: SKYLEARN_COLORS.surfaceSunken,
          text: SKYLEARN_COLORS.inkMuted,
          border: SKYLEARN_COLORS.outline,
        };
      case 'system':
      case 'sky':
      default:
        return {
          bg: SKYLEARN_COLORS.skySoft,
          text: SKYLEARN_COLORS.skyDeep,
          border: SKYLEARN_COLORS.sky,
        };
    }
  };

  const colors = getColors();

  return (
    <span
      className={`skylearn-tag-pill skylearn-pill-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 12px',
        borderRadius: SKYLEARN_RADII.full,
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
        fontSize: '13px',
        lineHeight: '18px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      <span>{label || children}</span>
    </span>
  );
};

export interface TagPillGroupProps {
  children: React.ReactNode;
  gap?: string | number;
  className?: string;
}

export const TagPillGroup: React.FC<TagPillGroupProps> = ({
  children,
  gap = '8px',
  className = '',
}) => {
  return (
    <div
      role="group"
      className={`skylearn-pill-group ${className}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: typeof gap === 'number' ? `${gap}px` : gap,
      }}
    >
      {children}
    </div>
  );
};

export default TagPill;
