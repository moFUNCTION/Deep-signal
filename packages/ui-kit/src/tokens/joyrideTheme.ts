import { SKYLEARN_COLORS, SKYLEARN_TYPOGRAPHY } from './skylearnTokens';

/**
 * Shared Skylearn configuration helpers for react-joyride guided focus tours.
 * Keeps overlay, contrast, typography, and reduced-motion behavior uniform across apps.
 */
export const getSkylearnJoyrideOptions = (reducedMotion: boolean) => ({
  primaryColor: SKYLEARN_COLORS.skyDeep,
  backgroundColor: SKYLEARN_COLORS.surfaceElevated,
  textColor: SKYLEARN_COLORS.ink,
  arrowColor: SKYLEARN_COLORS.surfaceElevated,
  overlayColor: 'rgba(15, 23, 42, 0.48)',
  spotlightPadding: 10,
  spotlightRadius: 16,
  scrollOffset: 104,
  scrollDuration: reducedMotion ? 0 : 240,
  skipBeacon: true,
  showProgress: true,
  closeButtonAction: 'skip' as const,
  dismissKeyAction: 'close' as const,
  overlayClickAction: false as const,
  buttons: ['back', 'primary', 'skip', 'close'] as Array<'back' | 'close' | 'primary' | 'skip'>,
  zIndex: 60,
  width: 360,
});

export const SKYLEARN_JOYRIDE_LOCALE = {
  back: 'Back',
  close: 'Close',
  last: 'Finish',
  next: 'Next',
  nextWithProgress: 'Next ({current}/{total})',
  skip: 'Dismiss Guide',
};

export const SKYLEARN_JOYRIDE_STYLES = {
  tooltip: {
    borderRadius: 16,
    border: `1px solid ${SKYLEARN_COLORS.outline}`,
    boxShadow: '0 18px 36px -12px rgba(15, 23, 42, 0.18)',
    padding: 20,
    fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
  },
  tooltipTitle: {
    fontFamily: SKYLEARN_TYPOGRAPHY.fonts.display,
    fontSize: 16,
    fontWeight: 700,
    color: SKYLEARN_COLORS.ink,
    marginBottom: 6,
  },
  tooltipContent: {
    fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
    fontSize: 13.5,
    lineHeight: 1.55,
    color: SKYLEARN_COLORS.inkMuted,
    padding: '4px 0 8px',
  },
  buttonPrimary: {
    backgroundColor: SKYLEARN_COLORS.skyDeep,
    color: '#FFFFFF',
    borderRadius: 10,
    fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
    fontSize: 12.5,
    fontWeight: 600,
    padding: '8px 14px',
  },
  buttonBack: {
    color: SKYLEARN_COLORS.inkMuted,
    fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
    fontSize: 12.5,
    fontWeight: 600,
    marginRight: 8,
  },
  buttonSkip: {
    color: SKYLEARN_COLORS.inkSubtle,
    fontFamily: SKYLEARN_TYPOGRAPHY.fonts.body,
    fontSize: 12,
    fontWeight: 600,
  },
  buttonClose: {
    color: SKYLEARN_COLORS.inkMuted,
    padding: 8,
  },
} as const;

export const readFocusTourSeen = (storageKey: string): boolean => {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(storageKey) === 'done';
  } catch {
    return true;
  }
};

export const markFocusTourSeen = (storageKey: string): void => {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, 'done');
    }
  } catch {
    // Ignore storage restriction errors in sandboxed contexts.
  }
};
