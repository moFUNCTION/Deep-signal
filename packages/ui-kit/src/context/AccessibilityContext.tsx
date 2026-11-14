import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

export type ViewMode = 'crew' | 'surgeon' | 'CREW_ACCESSIBLE' | 'FLIGHT_SURGEON';

export interface AccessibilityContextValue {
  viewMode: 'crew' | 'surgeon';
  isCrewMode: boolean;
  isSurgeonMode: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  readingRuler: boolean;
  readingRulerEnabled: boolean; // alias
  readingRulerY: number;
  isSpeaking: boolean;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  setHighContrast: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleHighContrast: () => void;
  setReducedMotion: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleReducedMotion: () => void;
  setReadingRuler: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleReadingRuler: () => void;
  setReadingRulerY: (y: number) => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;
}

const STORAGE_KEYS = {
  VIEW_MODE: 'aura_skylearn_view_mode',
  HIGH_CONTRAST: 'aura_skylearn_high_contrast',
  REDUCED_MOTION: 'aura_skylearn_reduced_motion',
  READING_RULER: 'aura_skylearn_reading_ruler',
};

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

function normalizeViewMode(mode: ViewMode | string | null): 'crew' | 'surgeon' {
  if (!mode) return 'crew';
  const lower = mode.toLowerCase();
  if (lower.includes('surgeon')) return 'surgeon';
  return 'crew';
}

function getInitialStorageBool(key: string, defaultVal: boolean): boolean {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const item = window.localStorage.getItem(key);
    return item !== null ? item === 'true' : defaultVal;
  } catch {
    return defaultVal;
  }
}

export interface AccessibilityProviderProps {
  children: ReactNode;
  initialViewMode?: ViewMode;
  initialHighContrast?: boolean;
  initialReducedMotion?: boolean;
  initialReadingRuler?: boolean;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  initialViewMode = 'crew',
  initialHighContrast,
  initialReducedMotion,
  initialReadingRuler = false,
}) => {
  // View mode
  const [viewMode, setViewModeState] = useState<'crew' | 'surgeon'>(() => {
    if (typeof window === 'undefined') return normalizeViewMode(initialViewMode);
    try {
      const saved = window.localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
      return saved ? normalizeViewMode(saved) : normalizeViewMode(initialViewMode);
    } catch {
      return normalizeViewMode(initialViewMode);
    }
  });

  // High contrast
  const [highContrast, setHighContrastState] = useState<boolean>(() => {
    return initialHighContrast ?? getInitialStorageBool(STORAGE_KEYS.HIGH_CONTRAST, false);
  });

  // Reduced motion
  const [reducedMotion, setReducedMotionState] = useState<boolean>(() => {
    if (initialReducedMotion !== undefined) return initialReducedMotion;
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEYS.REDUCED_MOTION);
      if (saved !== null) return saved === 'true';
      return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
    }
    return false;
  });

  // Reading ruler overlay
  const [readingRuler, setReadingRulerState] = useState<boolean>(() => {
    return getInitialStorageBool(STORAGE_KEYS.READING_RULER, initialReadingRuler);
  });
  const [readingRulerY, setReadingRulerY] = useState<number>(180);

  // Speech synthesis state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Sync to localStorage
  const setViewMode = useCallback((mode: ViewMode) => {
    const normalized = normalizeViewMode(mode);
    setViewModeState(normalized);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(STORAGE_KEYS.VIEW_MODE, normalized);
      } catch {
        // ignore
      }
    }
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewModeState((prev) => {
      const next = prev === 'crew' ? 'surgeon' : 'crew';
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEYS.VIEW_MODE, next);
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const setHighContrast = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setHighContrastState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEYS.HIGH_CONTRAST, String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrast((prev) => !prev);
  }, [setHighContrast]);

  const setReducedMotion = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setReducedMotionState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEYS.REDUCED_MOTION, String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotion((prev) => !prev);
  }, [setReducedMotion]);

  const setReadingRuler = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setReadingRulerState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEYS.READING_RULER, String(next));
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  const toggleReadingRuler = useCallback(() => {
    setReadingRuler((prev) => !prev);
  }, [setReadingRuler]);

  // Speech synthesis
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }
      stopSpeaking();

      if (!text || text.trim().length === 0) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower for clear comprehension
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [stopSpeaking]
  );

  // Global cursor tracker for reading ruler when enabled
  useEffect(() => {
    if (!readingRuler || typeof window === 'undefined') return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if ('clientY' in e) {
        setReadingRulerY(e.clientY);
      } else if (e.touches && e.touches[0]) {
        setReadingRulerY(e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
    };
  }, [readingRuler]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const value: AccessibilityContextValue = {
    viewMode,
    isCrewMode: viewMode === 'crew',
    isSurgeonMode: viewMode === 'surgeon',
    highContrast,
    reducedMotion,
    readingRuler,
    readingRulerEnabled: readingRuler,
    readingRulerY,
    isSpeaking,
    setViewMode,
    toggleViewMode,
    setHighContrast,
    toggleHighContrast,
    setReducedMotion,
    toggleReducedMotion,
    setReadingRuler,
    toggleReadingRuler,
    setReadingRulerY,
    speakText,
    stopSpeaking,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextValue => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      viewMode: 'crew',
      isCrewMode: true,
      isSurgeonMode: false,
      highContrast: false,
      reducedMotion: false,
      readingRuler: false,
      readingRulerEnabled: false,
      readingRulerY: 180,
      isSpeaking: false,
      setViewMode: () => {},
      toggleViewMode: () => {},
      setHighContrast: () => {},
      toggleHighContrast: () => {},
      setReducedMotion: () => {},
      toggleReducedMotion: () => {},
      setReadingRuler: () => {},
      toggleReadingRuler: () => {},
      setReadingRulerY: () => {},
      speakText: () => {},
      stopSpeaking: () => {},
    };
  }
  return context;
};

export default AccessibilityContext;
