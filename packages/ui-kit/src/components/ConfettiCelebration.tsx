import React, { useState, useEffect } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_MOTION,
} from '../tokens/skylearnTokens';
import { StarIcon, CheckCircleIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export interface ConfettiCelebrationProps {
  trigger?: boolean;
  duration?: number; // default 1600ms
  onComplete?: () => void;
  title?: string;
  message?: string;
}

interface Particle {
  id: number;
  x: number; // 0 to 100%
  color: string;
  size: number;
  rotation: number;
  drift: number;
  delay: number;
  shape: 'rect' | 'circle' | 'strip';
}

const CONFETTI_COLORS = [
  SKYLEARN_COLORS.sky,    // #3B82F6
  SKYLEARN_COLORS.sun,    // #FBBF24
  SKYLEARN_COLORS.leaf,   // #22C55E
  SKYLEARN_COLORS.berry,  // #A855F7
];

export const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  trigger = false,
  duration = 1600,
  onComplete,
  title = 'Mission Countermeasures Complete!',
  message = 'Intravascular volume and muscular tone stabilized for orbital operations.',
}) => {
  const { reducedMotion, highContrast } = useAccessibility();
  const [isActive, setIsActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (trigger) {
      setIsActive(true);

      // Generate ~40 diverse confetti particles across the top
      const newParticles: Particle[] = Array.from({ length: 42 }).map((_, i) => ({
        id: i,
        x: Math.random() * 96 + 2, // 2% to 98%
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: Math.random() * 8 + 8, // 8px to 16px
        rotation: Math.random() * 360,
        drift: (Math.random() - 0.5) * 80,
        delay: Math.random() * 200,
        shape: i % 3 === 0 ? 'circle' : i % 3 === 1 ? 'strip' : 'rect',
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setIsActive(false);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsActive(false);
    }
  }, [trigger, duration, onComplete]);

  if (!isActive) return null;

  // Reduced motion alternative: Calm static star burst banner
  if (reducedMotion) {
    return (
      <div
        role="alert"
        aria-live="polite"
        style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 24px',
          borderRadius: '16px',
          backgroundColor: highContrast ? '#FFFFFF' : SKYLEARN_COLORS.surfaceElevated,
          border: `2px solid ${highContrast ? '#0F172A' : SKYLEARN_COLORS.leaf}`,
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.15)',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: SKYLEARN_COLORS.leafSoft,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckCircleIcon size={24} color={SKYLEARN_COLORS.leafDeep} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '16px', color: SKYLEARN_COLORS.ink }}>
            {title}
          </div>
          <div style={{ fontSize: '14px', color: SKYLEARN_COLORS.inkMuted }}>
            {message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes skylearn-confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>

      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: `${p.x}%`,
            width: p.shape === 'strip' ? `${p.size * 1.8}px` : `${p.size}px`,
            height: p.shape === 'strip' ? `${p.size * 0.5}px` : `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'strip' ? '2px' : '3px',
            animation: `skylearn-confetti-fall ${duration}ms cubic-bezier(0.25, 1, 0.5, 1) ${p.delay}ms forwards`,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}
        />
      ))}
    </div>
  );
};

export default ConfettiCelebration;
