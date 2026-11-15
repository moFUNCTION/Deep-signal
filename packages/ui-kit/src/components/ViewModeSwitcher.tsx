import React from 'react';
import {
  SKYLEARN_COLORS,
  SKYLEARN_RADII,
  SKYLEARN_TYPOGRAPHY,
} from '../tokens/skylearnTokens';
import { useAccessibility } from '../context/AccessibilityContext';

export interface ViewModeSwitcherProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
  showAccessibilityToggles?: boolean;
  className?: string;
}

export const ViewModeSwitcher: React.FC<ViewModeSwitcherProps> = ({
  compact = false,
  showAccessibilityToggles = true,
  className = '',
  style,
  ...rest
}) => {
  const {
    viewMode,
    setViewMode,
    highContrast,
    toggleHighContrast,
    reducedMotion,
    toggleReducedMotion,
    readingRuler,
    toggleReadingRuler,
  } = useAccessibility();

  const isCrew = viewMode === 'crew';

  return (
    <div
      role="group"
      aria-label="Display View and Accessibility Mode Switcher"
      className={`skylearn-viewmode-switcher ${className}`}
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: '100%',
        gap: '8px',
        padding: compact ? '4px' : '6px 10px',
        borderRadius: SKYLEARN_RADII.full,
        backgroundColor: highContrast ? SKYLEARN_COLORS.background : SKYLEARN_COLORS.surfaceSunken,
        border: `1px solid ${highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.outline}`,
        boxSizing: 'border-box',
        ...style,
      }}
      {...rest}
    >
      {/* Segmented Toggle: Crew Mode vs Flight Surgeon Mode */}
      <div
        style={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '100%',
          backgroundColor: highContrast ? SKYLEARN_COLORS.background : SKYLEARN_COLORS.surface,
          borderRadius: SKYLEARN_RADII.full,
          padding: '3px',
          border: `1px solid ${SKYLEARN_COLORS.outline}`,
        }}
      >
        <button
          type="button"
          aria-pressed={isCrew}
          onClick={() => setViewMode('crew')}
          style={{
            minHeight: compact ? '38px' : '40px',
            minWidth: '56px',
            padding: '6px 12px',
            borderRadius: SKYLEARN_RADII.full,
            border: 'none',
            backgroundColor: isCrew
              ? highContrast
                ? SKYLEARN_COLORS.ink
                : SKYLEARN_COLORS.sky
              : 'transparent',
            color: isCrew
              ? highContrast
                ? SKYLEARN_COLORS.background
                : '#FFFFFF'
              : SKYLEARN_COLORS.inkMuted,
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 160ms ease-out',
          }}
        >
          Crew Mode
        </button>

        <button
          type="button"
          aria-pressed={!isCrew}
          onClick={() => setViewMode('surgeon')}
          style={{
            minHeight: compact ? '38px' : '40px',
            minWidth: '56px',
            padding: '6px 12px',
            borderRadius: SKYLEARN_RADII.full,
            border: 'none',
            backgroundColor: !isCrew
              ? highContrast
                ? SKYLEARN_COLORS.ink
                : SKYLEARN_COLORS.ink
              : 'transparent',
            color: !isCrew ? '#FFFFFF' : SKYLEARN_COLORS.inkMuted,
            fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 160ms ease-out',
          }}
        >
          Surgeon Telemetry
        </button>
      </div>

      {/* Accessibility Feature Quick Toggles */}
      {showAccessibilityToggles && !compact && (
        <div
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          {/* High Contrast */}
          <button
            type="button"
            aria-pressed={highContrast}
            onClick={toggleHighContrast}
            title="Toggle High Contrast"
            style={{
              minHeight: '40px',
              minWidth: '40px',
              padding: '6px 10px',
              borderRadius: SKYLEARN_RADII.full,
              border: `1px solid ${highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.outline}`,
              backgroundColor: highContrast ? SKYLEARN_COLORS.ink : SKYLEARN_COLORS.surface,
              color: highContrast ? '#FFFFFF' : SKYLEARN_COLORS.ink,
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            HC
          </button>

          {/* Reading Ruler */}
          <button
            type="button"
            aria-pressed={readingRuler}
            onClick={toggleReadingRuler}
            title="Toggle Dyslexia Reading Ruler"
            style={{
              minHeight: '40px',
              minWidth: '40px',
              padding: '6px 10px',
              borderRadius: SKYLEARN_RADII.full,
              border: `1px solid ${readingRuler ? SKYLEARN_COLORS.sky : SKYLEARN_COLORS.outline}`,
              backgroundColor: readingRuler ? SKYLEARN_COLORS.skySoft : SKYLEARN_COLORS.surface,
              color: readingRuler ? SKYLEARN_COLORS.skyDeep : SKYLEARN_COLORS.ink,
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Ruler
          </button>

          {/* Reduced Motion */}
          <button
            type="button"
            aria-pressed={reducedMotion}
            onClick={toggleReducedMotion}
            title="Toggle Reduced Motion"
            style={{
              minHeight: '40px',
              minWidth: '40px',
              padding: '6px 10px',
              borderRadius: SKYLEARN_RADII.full,
              border: `1px solid ${reducedMotion ? SKYLEARN_COLORS.sun : SKYLEARN_COLORS.outline}`,
              backgroundColor: reducedMotion ? '#FEF3C7' : SKYLEARN_COLORS.surface,
              color: reducedMotion ? SKYLEARN_COLORS.sunDeep : SKYLEARN_COLORS.ink,
              fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Calm Motion
          </button>
        </div>
      )}
    </div>
  );
};

export default ViewModeSwitcher;
