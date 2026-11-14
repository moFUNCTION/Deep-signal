import React from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { StarBadgeStack } from './StarBadge';
import { BigFriendlyButton } from './BigFriendlyButton';
import { CheckCircleIcon, AlertTriangleIcon, AlertOctagonIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export interface ReadinessScoreCardProps extends React.HTMLAttributes<HTMLDivElement> {
  score: number; // 0 - 100
  statusClassification?: 'OPTIMAL_FOR_EVA' | 'CAUTION_MONITOR' | 'NO_GO_MEDICAL_HOLD' | string;
  nominalItems?: string[];
  reviewItems?: string[];
  unlockedStars?: number; // 1 to 3
  onContinue?: () => void;
  continueLabel?: string;
  className?: string;
}

export const ReadinessScoreCard: React.FC<ReadinessScoreCardProps> = ({
  score,
  statusClassification = 'OPTIMAL_FOR_EVA',
  nominalItems = [
    'Cardiovascular Z-score within 0.8 sigma baseline band',
    'Hydration countermeasure (2500 mL) verified complete',
    'Cabin CO2 scrubbers maintaining normal 2.1 mmHg partial pressure',
  ],
  reviewItems = [
    'ARED resistive workout scheduled in 90 minutes',
    'Cerebral perfusion check recommended before airlock egress',
  ],
  unlockedStars,
  onContinue,
  continueLabel = 'Keep going — Return to Telemetry',
  className = '',
  style,
  ...rest
}) => {
  const { highContrast } = useAccessibility();

  // Determine star rating based on score if not provided
  const stars = unlockedStars !== undefined ? unlockedStars : score >= 85 ? 3 : score >= 65 ? 2 : 1;

  const isOptimal = score >= 85 || statusClassification.includes('OPTIMAL');
  const isCaution = (score >= 65 && score < 85) || statusClassification.includes('CAUTION');
  const isHold = score < 65 || statusClassification.includes('HOLD');

  const statusLabel = isOptimal
    ? 'OPTIMAL FOR EVA & FLIGHT'
    : isCaution
    ? 'CAUTION — MONITOR VITALS'
    : 'NO-GO // MEDICAL HOLD';

  const statusColor = isOptimal
    ? SKYLEARN_COLORS.leafDeep
    : isCaution
    ? SKYLEARN_COLORS.sunDeep
    : '#B91C1C';

  const statusBg = isOptimal
    ? SKYLEARN_COLORS.leafSoft
    : isCaution
    ? '#FEF3C7'
    : SKYLEARN_COLORS.coralSoft;

  const statusBorder = isOptimal
    ? SKYLEARN_COLORS.leaf
    : isCaution
    ? SKYLEARN_COLORS.sun
    : SKYLEARN_COLORS.coral;

  return (
    <div
      role="region"
      aria-label="Mission Readiness Scorecard"
      className={`skylearn-readiness-scorecard ${className}`}
      style={{
        borderRadius: SKYLEARN_RADII.modal,
        backgroundColor: highContrast ? SKYLEARN_COLORS.background : SKYLEARN_COLORS.surfaceElevated,
        border: `2px solid ${highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.outline}`,
        boxShadow: highContrast ? 'none' : '0 20px 40px rgba(15, 23, 42, 0.08)',
        padding: '32px',
        boxSizing: 'border-box',
        maxWidth: '680px',
        margin: '0 auto',
        ...style,
      }}
      {...rest}
    >
      {/* Top Header: Tabular 56px Score & Stars */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          marginBottom: '28px',
        }}
      >
        <span
          style={{
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
            fontSize: '15px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: SKYLEARN_COLORS.inkMuted,
            marginBottom: '8px',
          }}
        >
          Mission Readiness Assessment
        </span>

        {/* 56px Tabular Score Number */}
        <div
          style={{
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.display,
            fontSize: '64px',
            lineHeight: '64px',
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.ink,
            margin: '4px 0 16px 0',
          }}
        >
          {score}
          <span style={{ fontSize: '28px', color: SKYLEARN_COLORS.inkSubtle, marginLeft: '4px' }}>
            /100
          </span>
        </div>

        {/* 3-Star Stack */}
        <div style={{ marginBottom: '16px' }}>
          <StarBadgeStack unlockedStars={stars} size="md" />
        </div>

        {/* Calm Status Pill (never color alone) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            borderRadius: SKYLEARN_RADII.full,
            backgroundColor: highContrast ? SKYLEARN_COLORS.background : statusBg,
            border: `1.5px solid ${highContrast ? SKYLEARN_COLORS.ink : statusBorder}`,
            color: highContrast ? SKYLEARN_COLORS.ink : statusColor,
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.02em',
          }}
        >
          {isOptimal ? (
            <CheckCircleIcon size={18} color={highContrast ? SKYLEARN_COLORS.ink : statusColor} />
          ) : isCaution ? (
            <AlertTriangleIcon size={18} color={highContrast ? SKYLEARN_COLORS.ink : statusColor} />
          ) : (
            <AlertOctagonIcon size={18} color={highContrast ? SKYLEARN_COLORS.ink : statusColor} />
          )}
          <span>{statusLabel}</span>
        </div>
      </div>

      {/* "What is Nominal & Completed" Leaf Section */}
      {nominalItems.length > 0 && (
        <div
          style={{
            borderRadius: SKYLEARN_RADII.card,
            backgroundColor: highContrast ? SKYLEARN_COLORS.background : SKYLEARN_COLORS.leafSoft,
            border: `1px solid ${highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.leaf}`,
            padding: '20px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '16px',
              fontWeight: 700,
              color: SKYLEARN_COLORS.leafDeep,
              marginBottom: '10px',
            }}
          >
            <CheckCircleIcon size={20} color={SKYLEARN_COLORS.leafDeep} />
            <span>What is Nominal & Completed</span>
          </div>

          <ul
            style={{
              margin: 0,
              paddingLeft: '24px',
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '15px',
              lineHeight: '22px',
              color: SKYLEARN_COLORS.ink,
            }}
          >
            {nominalItems.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* "What We'll Monitor / Review Next" Gentle Coral Section */}
      {reviewItems.length > 0 && (
        <div
          style={{
            borderRadius: SKYLEARN_RADII.card,
            backgroundColor: highContrast ? SKYLEARN_COLORS.background : SKYLEARN_COLORS.coralSoft,
            border: `1px solid ${highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.coral}`,
            padding: '20px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '16px',
              fontWeight: 700,
              color: '#B91C1C',
              marginBottom: '10px',
            }}
          >
            <AlertTriangleIcon size={20} color={SKYLEARN_COLORS.coral} />
            <span>What We'll Monitor & Complete Next</span>
          </div>

          <ul
            style={{
              margin: 0,
              paddingLeft: '24px',
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '15px',
              lineHeight: '22px',
              color: SKYLEARN_COLORS.ink,
            }}
          >
            {reviewItems.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bottom Leaf "Keep going!" Big Friendly Button CTA */}
      <BigFriendlyButton
        variant="leaf"
        fullWidth
        onClick={onContinue}
      >
        {continueLabel}
      </BigFriendlyButton>
    </div>
  );
};

export default ReadinessScoreCard;
