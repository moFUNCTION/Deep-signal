import React from 'react';
import { SKYLEARN_COLORS } from '../tokens/skylearnTokens';

export type IconVariant = 'default' | 'active' | 'achievement' | 'leaf' | 'coral' | 'sun' | 'sky';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  variant?: IconVariant;
  className?: string;
}

function resolveIconColor(color?: string, variant?: IconVariant): string {
  if (color) return color;
  switch (variant) {
    case 'active':
    case 'sky':
      return SKYLEARN_COLORS.sky;
    case 'achievement':
    case 'sun':
      return SKYLEARN_COLORS.sun;
    case 'leaf':
      return SKYLEARN_COLORS.leaf;
    case 'coral':
      return SKYLEARN_COLORS.coral;
    case 'default':
    default:
      return SKYLEARN_COLORS.inkMuted;
  }
}

const baseSvgProps = (
  size: number | string = 24,
  strokeWidth: number = 2,
  strokeColor: string,
  className?: string
) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: strokeColor,
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
});

/* =========================================================================
   12 SKYLEARN ICONOGRAPHY
   ========================================================================= */

// 1. Book (open pages and spine)
export const BookIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <path d="M8 7h8" />
    <path d="M8 11h6" />
  </svg>
);

// 2. Pencil (sharpened tip and eraser)
export const PencilIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    <path d="m15 5 4 4" />
    <path d="m5 16 3 3" />
  </svg>
);

// 3. Calculator
export const CalculatorIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <rect x="4" y="2" width="16" height="20" rx="3" />
    <line x1="8" y1="6" x2="16" y2="6" />
    <circle cx="8" cy="11" r="1" fill="currentColor" />
    <circle cx="12" cy="11" r="1" fill="currentColor" />
    <circle cx="16" cy="11" r="1" fill="currentColor" />
    <circle cx="8" cy="15" r="1" fill="currentColor" />
    <circle cx="12" cy="15" r="1" fill="currentColor" />
    <circle cx="16" cy="15" r="1" fill="currentColor" />
    <circle cx="8" cy="18" r="1" fill="currentColor" />
    <line x1="12" y1="18" x2="16" y2="18" />
  </svg>
);

// 4. Magnifying Glass
export const MagnifyingGlassIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16" y2="16" />
  </svg>
);

// 5. Light Bulb
export const LightBulbIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z" />
  </svg>
);

// 6. Star
export const StarIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

// 7. Rocket
export const RocketIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.5-1.5 2-3l3 3z" />
    <path d="M15 18v5s1.5-.5 3-2l-3-3z" />
    <circle cx="15.5" cy="8.5" r="1.5" />
  </svg>
);

// 8. Leaf
export const LeafIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M11 20A7 7 0 0 1 4 13c0-4.97 4.03-9 9-9 3 0 7 2 7 7 0 4.97-4.03 9-9 9z" />
    <path d="M20 4c-3 1-8 6-9 16" />
  </svg>
);

// 9. Sun
export const SunIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

// 10. Raindrop
export const RaindropIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);

// 11. Paint Palette
export const PaintPaletteIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 5.52 4.48 10 10 10a4 4 0 0 0 4-4c0-1.1-.9-2-2-2h-1a2 2 0 0 1-2-2c0-1.1.9-2 2-2h3c2.76 0 5-2.24 5-5 0-4.97-4.03-7-10-7z" />
    <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
    <circle cx="10.5" cy="6.5" r="1" fill="currentColor" />
    <circle cx="15.5" cy="7.5" r="1" fill="currentColor" />
  </svg>
);

// 12. Alphabet Block
export const AlphabetBlockIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 17l4-10 4 10" />
    <line x1="9.5" y1="13" x2="14.5" y2="13" />
  </svg>
);

/* =========================================================================
   8 SPACE-MEDICAL & CLINICAL ICONS
   ========================================================================= */

// 13. Heart Pulse (ECG trace)
export const HeartPulseIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    <path d="M3.22 12H7l2-4 3 8 2-5 1.5 2.5H21" />
  </svg>
);

// 14. Brain Circuit
export const BrainCircuitIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04" />
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04" />
    <circle cx="8" cy="9" r="1" fill="currentColor" />
    <circle cx="16" cy="9" r="1" fill="currentColor" />
    <line x1="8" y1="9" x2="12" y2="9" />
    <line x1="12" y1="14" x2="16" y2="14" />
    <circle cx="16" cy="14" r="1" fill="currentColor" />
  </svg>
);

// 15. Flame Streak (Streak Counter)
export const FlameStreakIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
  </svg>
);

// 16. Shield Radiation
export const ShieldRadiationIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="11" r="1.5" />
    <path d="M10 9a2.5 2.5 0 0 1 4 0" />
    <path d="M8.5 13a2.5 2.5 0 0 1 1.5-2.5" />
    <path d="M15.5 13a2.5 2.5 0 0 0-1.5-2.5" />
  </svg>
);

// 17. Fan Airflow (Ventilation)
export const FanAirflowIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="2" />
    <path d="M12 10c0-3 2-5 4-5s1 3-1 5" />
    <path d="M14 12c3 0 5 2 5 4s-3 1-5-1" />
    <path d="M12 14c0 3-2 5-4 5s-1-3 1-5" />
    <path d="M10 12c-3 0-5-2-5-4s3-1 5 1" />
  </svg>
);

// 18. Satellite Dish (Comms Delay Queue)
export const SatelliteDishIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M4 10a7.5 7.5 0 0 0 9.5 9.5l6.5-6.5a7.5 7.5 0 0 0-9.5-9.5L4 10z" />
    <line x1="12" y1="12" x2="16.5" y2="7.5" />
    <line x1="8" y1="16" x2="3" y2="21" />
    <line x1="3" y1="16" x2="8" y2="21" />
  </svg>
);

// 19. Droplet (Hydration Countermeasure)
export const DropletIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    <path d="M9 13a3 3 0 0 0 3 3" />
  </svg>
);

// 20. Bone (Musculoskeletal & ARED)
export const BoneIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="M17 10c.7-.7 1.69-.9 2.5-.5a2.12 2.12 0 1 1-1.5 3.5l-8 8a2.12 2.12 0 1 1-3.5-1.5c.4-.81.2-1.8-.5-2.5a2.12 2.12 0 1 1 3-3l8-8a2.12 2.12 0 0 1 .5 2.5z" />
  </svg>
);

/* =========================================================================
   UI STATUS & ACCESSIBILITY HELPER ICONS
   ========================================================================= */

// Check Circle (Nominal / Verified)
export const CheckCircleIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant = 'leaf', className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11.5 14.5 15.5 9.5" />
  </svg>
);

// Alert Triangle (Caution / Yellow)
export const AlertTriangleIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant = 'sun', className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Alert Octagon (Action Required / Coral Anomaly)
export const AlertOctagonIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant = 'coral', className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// Lock (Locked lesson)
export const LockIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant = 'sun', className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

// Speaker Wave (TTS "Read to me")
export const SpeakerWaveIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant = 'sky', className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

// Speaker Off (Mute)
export const SpeakerOffIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

// Sparkle
export const SparkleIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant = 'sun', className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

// Chevron Down / Disclosure
export const ChevronDownIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// Arrow Right
export const ArrowRightIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// Close X
export const XIcon: React.FC<IconProps> = ({ size = 24, strokeWidth = 2, color, variant, className, ...rest }) => (
  <svg {...baseSvgProps(size, strokeWidth, resolveIconColor(color, variant), className)} {...rest}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/* =========================================================================
   GENERIC ICON LOOKUP
   ========================================================================= */

export type SkylearnIconName =
  | 'book'
  | 'pencil'
  | 'calculator'
  | 'magnifying-glass'
  | 'light-bulb'
  | 'star'
  | 'rocket'
  | 'leaf'
  | 'sun'
  | 'raindrop'
  | 'paint-palette'
  | 'alphabet-block'
  | 'heart-pulse'
  | 'brain-circuit'
  | 'brain'
  | 'flame-streak'
  | 'flame'
  | 'shield-radiation'
  | 'shield'
  | 'fan-airflow'
  | 'fan'
  | 'satellite-dish'
  | 'satellite'
  | 'droplet'
  | 'bone'
  | 'bone-muscle'
  | 'check-circle'
  | 'check'
  | 'alert-triangle'
  | 'alert-octagon'
  | 'lock'
  | 'speaker-wave'
  | 'speaker-off'
  | 'sparkle'
  | 'chevron-down'
  | 'arrow-right'
  | 'x';

export interface SkylearnIconProps extends IconProps {
  name: SkylearnIconName;
}

export const SkylearnIcon: React.FC<SkylearnIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'book':
      return <BookIcon {...props} />;
    case 'pencil':
      return <PencilIcon {...props} />;
    case 'calculator':
      return <CalculatorIcon {...props} />;
    case 'magnifying-glass':
      return <MagnifyingGlassIcon {...props} />;
    case 'light-bulb':
      return <LightBulbIcon {...props} />;
    case 'star':
      return <StarIcon {...props} />;
    case 'rocket':
      return <RocketIcon {...props} />;
    case 'leaf':
      return <LeafIcon {...props} />;
    case 'sun':
      return <SunIcon {...props} />;
    case 'raindrop':
      return <RaindropIcon {...props} />;
    case 'paint-palette':
      return <PaintPaletteIcon {...props} />;
    case 'alphabet-block':
      return <AlphabetBlockIcon {...props} />;
    case 'heart-pulse':
      return <HeartPulseIcon {...props} />;
    case 'brain-circuit':
    case 'brain':
      return <BrainCircuitIcon {...props} />;
    case 'flame-streak':
    case 'flame':
      return <FlameStreakIcon {...props} />;
    case 'shield-radiation':
    case 'shield':
      return <ShieldRadiationIcon {...props} />;
    case 'fan-airflow':
    case 'fan':
      return <FanAirflowIcon {...props} />;
    case 'satellite-dish':
    case 'satellite':
      return <SatelliteDishIcon {...props} />;
    case 'droplet':
      return <DropletIcon {...props} />;
    case 'bone':
    case 'bone-muscle':
      return <BoneIcon {...props} />;
    case 'check-circle':
    case 'check':
      return <CheckCircleIcon {...props} />;
    case 'alert-triangle':
      return <AlertTriangleIcon {...props} />;
    case 'alert-octagon':
      return <AlertOctagonIcon {...props} />;
    case 'lock':
      return <LockIcon {...props} />;
    case 'speaker-wave':
      return <SpeakerWaveIcon {...props} />;
    case 'speaker-off':
      return <SpeakerOffIcon {...props} />;
    case 'sparkle':
      return <SparkleIcon {...props} />;
    case 'chevron-down':
      return <ChevronDownIcon {...props} />;
    case 'arrow-right':
      return <ArrowRightIcon {...props} />;
    case 'x':
      return <XIcon {...props} />;
    default:
      return <StarIcon {...props} />;
  }
};

export const SkylearnIcons = {
  Book: BookIcon,
  Pencil: PencilIcon,
  Calculator: CalculatorIcon,
  MagnifyingGlass: MagnifyingGlassIcon,
  LightBulb: LightBulbIcon,
  Star: StarIcon,
  Rocket: RocketIcon,
  Leaf: LeafIcon,
  Sun: SunIcon,
  Raindrop: RaindropIcon,
  PaintPalette: PaintPaletteIcon,
  AlphabetBlock: AlphabetBlockIcon,
  HeartPulse: HeartPulseIcon,
  BrainCircuit: BrainCircuitIcon,
  FlameStreak: FlameStreakIcon,
  ShieldRadiation: ShieldRadiationIcon,
  FanAirflow: FanAirflowIcon,
  SatelliteDish: SatelliteDishIcon,
  Droplet: DropletIcon,
  Bone: BoneIcon,
  CheckCircle: CheckCircleIcon,
  AlertTriangle: AlertTriangleIcon,
  AlertOctagon: AlertOctagonIcon,
  Lock: LockIcon,
  SpeakerWave: SpeakerWaveIcon,
  SpeakerOff: SpeakerOffIcon,
  Sparkle: SparkleIcon,
  ChevronDown: ChevronDownIcon,
  ArrowRight: ArrowRightIcon,
  X: XIcon,
  Icon: SkylearnIcon,
};

export default SkylearnIcon;
