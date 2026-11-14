import React, { useState, useRef } from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { SpeakerWaveIcon, SpeakerOffIcon } from '../icons/SkylearnIcons';
import { useAccessibility } from '../context/AccessibilityContext';

export interface ReadingPassageProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  title?: string;
  showReadToMe?: boolean;
  showReadingRuler?: boolean;
  className?: string;
}

export const ReadingPassage: React.FC<ReadingPassageProps> = ({
  text,
  title,
  showReadToMe = true,
  showReadingRuler = true,
  className = '',
  style,
  ...rest
}) => {
  const {
    highContrast,
    readingRuler,
    readingRulerY,
    speakText,
    stopSpeaking,
    isSpeaking,
  } = useAccessibility();

  const containerRef = useRef<HTMLDivElement>(null);
  const [localRulerY, setLocalRulerY] = useState<number | null>(null);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!readingRuler && !showReadingRuler) return;
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const relativeY = e.clientY - rect.top;
      setLocalRulerY(relativeY);
    }
  };

  const handlePointerLeave = () => {
    setLocalRulerY(null);
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const fullSpeech = title ? `${title}. ${text}` : text;
      speakText(fullSpeech);
    }
  };

  const effectiveRulerY = localRulerY !== null ? localRulerY : (readingRuler ? 60 : null);

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`skylearn-reading-passage ${className}`}
      style={{
        position: 'relative',
        borderRadius: SKYLEARN_RADII.card,
        backgroundColor: highContrast ? SKYLEARN_COLORS.background : SKYLEARN_COLORS.surface,
        border: `1px solid ${highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.outline}`,
        padding: '28px',
        boxSizing: 'border-box',
        overflow: 'hidden',
        ...style,
      }}
      {...rest}
    >
      {/* Reading Ruler translucent Sky bar overlay */}
      {(readingRuler || (showReadingRuler && localRulerY !== null)) && effectiveRulerY !== null && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${effectiveRulerY - 18}px`,
            height: '36px',
            backgroundColor: 'rgba(59, 130, 246, 0.16)',
            borderTop: `1px solid ${SKYLEARN_COLORS.skyBright}`,
            borderBottom: `1px solid ${SKYLEARN_COLORS.skyBright}`,
            pointerEvents: 'none',
            zIndex: 1,
            transition: 'top 60ms linear',
          }}
        />
      )}

      {/* Header with Title and "Read to me" CTA */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
          gap: '16px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {title ? (
          <h4
            style={{
              margin: 0,
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.display,
              fontSize: '20px',
              fontWeight: 700,
              color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.ink,
            }}
          >
            {title}
          </h4>
        ) : (
          <span />
        )}

        {showReadToMe && (
          <button
            type="button"
            onClick={handleToggleSpeak}
            aria-pressed={isSpeaking}
            aria-label={isSpeaking ? 'Stop speech playback' : 'Read passage to me'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minHeight: '56px', // 56px minimum tap target
              padding: '0 20px',
              borderRadius: SKYLEARN_RADII.button,
              backgroundColor: isSpeaking
                ? SKYLEARN_COLORS.sun
                : highContrast
                ? SKYLEARN_COLORS.ink
                : SKYLEARN_COLORS.sky,
              color: isSpeaking
                ? SKYLEARN_COLORS.ink
                : highContrast
                ? SKYLEARN_COLORS.background
                : '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '16px',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
              transition: 'background-color 160ms ease-out',
            }}
          >
            {isSpeaking ? (
              <>
                <SpeakerOffIcon size={20} color={isSpeaking ? SKYLEARN_COLORS.ink : '#FFFFFF'} />
                <span>Stop Reading</span>
              </>
            ) : (
              <>
                <SpeakerWaveIcon size={20} color="#FFFFFF" />
                <span>Read to me</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Main Atkinson Hyperlegible Reading Body */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
          fontSize: '19px',
          lineHeight: '32px', // Generous 32px leading
          letterSpacing: SKYLEARN_TYPOGRAPHY.letterSpacing.body,
          color: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.ink,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default ReadingPassage;
