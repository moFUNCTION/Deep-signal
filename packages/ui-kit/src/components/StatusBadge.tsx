import React from 'react';
import {
  SKYLEARN_COLORS,
  SEVERITY_THEME_MAP,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import {
  CheckCircleIcon,
  AlertTriangleIcon,
  AlertOctagonIcon,
} from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export type StatusSeverity = 'green' | 'yellow' | 'red' | 'nominal' | 'caution' | 'action_required' | 'critical';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  severity?: StatusSeverity;
  label?: string;
  size?: BadgeSize;
  icon?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

function normalizeSeverity(severity: StatusSeverity = 'green'): 'green' | 'yellow' | 'red' {
  switch (severity) {
    case 'nominal':
    case 'green':
      return 'green';
    case 'caution':
    case 'yellow':
      return 'yellow';
    case 'critical':
    case 'action_required':
    case 'red':
    default:
      return 'red';
  }
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  severity = 'green',
  label,
  size = 'md',
  icon,
  showIcon = true,
  className = '',
  style,
  ...rest
}) => {
  const { highContrast } = useAccessibility();
  const normalizedKey = normalizeSeverity(severity);
  const theme = SEVERITY_THEME_MAP[normalizedKey];

  const displayLabel = label || theme.label;

  const renderIcon = () => {
    if (!showIcon) return null;
    if (icon) return icon;

    const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
    const stroke = highContrast ? '#0F172A' : theme.text;

    switch (theme.iconName) {
      case 'check-circle':
        return <CheckCircleIcon size={iconSize} color={stroke} />;
      case 'alert-triangle':
        return <AlertTriangleIcon size={iconSize} color={stroke} />;
      case 'alert-octagon':
      default:
        return <AlertOctagonIcon size={iconSize} color={stroke} />;
    }
  };

  const sizeStyles: Record<BadgeSize, React.CSSProperties> = {
    sm: {
      padding: '2px 8px',
      fontSize: '12px',
      lineHeight: '16px',
      gap: '4px',
    },
    md: {
      padding: '4px 12px',
      fontSize: '14px',
      lineHeight: '20px',
      gap: '6px',
    },
    lg: {
      padding: '6px 16px',
      fontSize: '16px',
      lineHeight: '24px',
      gap: '8px',
    },
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SKYLEARN_RADII.full,
    fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
    fontWeight: 600,
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    backgroundColor: highContrast ? SKYLEARN_COLORS.background : theme.bg,
    color: highContrast ? SKYLEARN_COLORS.ink : theme.text,
    border: highContrast
      ? `2px solid ${SKYLEARN_COLORS.ink}`
      : `1px solid ${theme.border}`,
    boxSizing: 'border-box',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    ...sizeStyles[size],
    ...style,
  };

  return (
    <span
      role="status"
      aria-label={`${displayLabel} status`}
      className={`skylearn-status-badge skylearn-status-${normalizedKey} ${className}`}
      style={badgeStyle}
      {...rest}
    >
      {renderIcon()}
      <span>{displayLabel}</span>
    </span>
  );
};

export default StatusBadge;
