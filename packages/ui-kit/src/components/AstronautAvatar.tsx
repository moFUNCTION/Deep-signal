import React from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { RocketIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export interface AstronautAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  callsign?: string;
  src?: string;
  size?: number | 'sm' | 'md' | 'lg'; // 56px, 72px, 96px
  status?: 'nominal' | 'caution' | 'action_required' | 'green' | 'yellow' | 'red';
  showMascotBadge?: boolean;
  className?: string;
}

export const AstronautAvatar: React.FC<AstronautAvatarProps> = ({
  name = 'Astronaut',
  callsign,
  src,
  size = 'md',
  status,
  showMascotBadge = false,
  className = '',
  style,
  ...rest
}) => {
  const { highContrast } = useAccessibility();

  const dimension =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 56
      : size === 'lg'
      ? 96
      : 72;

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  const statusColor =
    status === 'nominal' || status === 'green'
      ? SKYLEARN_COLORS.leaf
      : status === 'caution' || status === 'yellow'
      ? SKYLEARN_COLORS.sun
      : status === 'action_required' || status === 'red'
      ? SKYLEARN_COLORS.coral
      : undefined;

  return (
    <div
      role="img"
      aria-label={`${name}${callsign ? ` (${callsign})` : ''} profile avatar`}
      className={`skylearn-astronaut-avatar ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${dimension}px`,
        height: `${dimension}px`,
        borderRadius: SKYLEARN_RADII.full,
        backgroundColor: SKYLEARN_COLORS.skySoft,
        // Double-ring: 2px Sky outer ring + 3px white inner ring via outline + box-shadow
        border: highContrast
          ? `2px solid ${SKYLEARN_COLORS.ink}`
          : `2px solid ${SKYLEARN_COLORS.sky}`,
        boxShadow: highContrast
          ? 'none'
          : `inset 0 0 0 3px #FFFFFF, 0 4px 14px rgba(59, 130, 246, 0.18)`,
        boxSizing: 'border-box',
        overflow: 'visible',
        flexShrink: 0,
        ...style,
      }}
      {...rest}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: SKYLEARN_RADII.full,
          }}
        />
      ) : initials ? (
        <span
          style={{
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.display,
            fontSize: `${Math.round(dimension * 0.38)}px`,
            fontWeight: 700,
            color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.skyDeep,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          {initials}
        </span>
      ) : (
        <RocketIcon size={Math.round(dimension * 0.5)} color={SKYLEARN_COLORS.skyDeep} />
      )}

      {/* Optional Companion Mascot Badge */}
      {showMascotBadge && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: '-2px',
            right: '-2px',
            width: `${Math.max(20, Math.round(dimension * 0.32))}px`,
            height: `${Math.max(20, Math.round(dimension * 0.32))}px`,
            borderRadius: '50%',
            backgroundColor: SKYLEARN_COLORS.sun,
            border: '2px solid #FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}
          title="AURA Companion Active"
        >
          <RocketIcon size={12} color="#FFFFFF" />
        </div>
      )}

      {/* Optional Biometric Health Status Dot */}
      {statusColor && !showMascotBadge && (
        <div
          aria-label={`Status: ${status}`}
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '0px',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            border: '2px solid #FFFFFF',
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }}
        />
      )}
    </div>
  );
};

export default AstronautAvatar;
