import React, { useCallback, useEffect, useState } from 'react';
import {
  ACTIONS,
  EVENTS,
  Joyride,
  STATUS,
  type EventData,
  type Step,
} from 'react-joyride';
import { Compass } from 'lucide-react';
import {
  SKYLEARN_JOYRIDE_LOCALE,
  SKYLEARN_JOYRIDE_STYLES,
  getSkylearnJoyrideOptions,
  markFocusTourSeen,
  readFocusTourSeen,
  useAccessibility,
} from '@aura/ui-kit';
import { useMedicalStore } from '../../store/useMedicalStore';

const TOUR_STORAGE_KEY = 'aura_hud_focus_tour_v1';

const HUD_STEPS: Step[] = [
  {
    target: '[data-tour="hud-phase-comms"]',
    title: 'Mission Phase & Earth Link',
    content:
      'Set the active flight phase and Earth telemetry link (including Solar Blackout). AURA adapts physiological baselines automatically.',
    placement: 'bottom',
    isFixed: true,
    skipScroll: true,
  },
  {
    target: '[data-tour="hud-triage-banner"]',
    title: 'Autonomous Clinical Triage',
    content:
      'Instant edge medical triage evaluates biometrics without Earth delay, showing prioritized 3-step action protocols and exam guides when needed.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="hud-body-twin"]',
    title: 'Anatomical System Focus',
    content:
      'Inspect strained biological systems on the Anterior/Posterior body diagram. Select any region or card to isolate its vitals.',
    placement: 'right',
  },
  {
    target: '[data-tour="hud-readiness"]',
    title: 'Readiness Score & Countermeasures',
    content:
      'Your weighted EVA Readiness Score updates dynamically as daily Hydration, Nutrition, Sleep, and ARED workouts are completed.',
    placement: 'left',
  },
  {
    target: '[data-tour="hud-vitals"]',
    title: 'Adaptive Telemetry & Trend Bands',
    content:
      'Compares live biometrics against Earth baselines adjusted for spaceflight. Switch to Flight Surgeon mode in the header for μ_adj and calibration controls.',
    placement: 'top',
  },
  {
    target: '[data-tour="hud-dtn-queue"]',
    title: 'Store-and-Forward Earth Queue',
    content:
      'Buffers PDF medical dossiers and telemetry frames offline during blackouts, then flushes automatically once carrier signal returns.',
    placement: 'top',
  },
];

export const HudFocusTour: React.FC = () => {
  const { reducedMotion } = useAccessibility();
  const activeAlert = useMedicalStore((s) => s.activeAlert);
  const [run, setRun] = useState<boolean>(false);

  // Start gentle focus walkthrough once on initial visit unless a critical alert is active.
  useEffect(() => {
    if (readFocusTourSeen(TOUR_STORAGE_KEY)) return;
    if (activeAlert?.severity === 'red') return;
    const timer = window.setTimeout(() => setRun(true), 450);
    return () => window.clearTimeout(timer);
  }, [activeAlert?.severity]);

  const handleTourEvent = useCallback((data: EventData) => {
    const ended =
      data.status === STATUS.FINISHED ||
      data.status === STATUS.SKIPPED ||
      data.action === ACTIONS.CLOSE ||
      data.action === ACTIONS.SKIP ||
      data.type === EVENTS.TOUR_END;

    if (ended) {
      markFocusTourSeen(TOUR_STORAGE_KEY);
      setRun(false);
    }
  }, []);

  const startManualTour = useCallback(() => {
    setRun(true);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={startManualTour}
        title="Launch step-by-step focus guide"
        aria-label="Launch step-by-step focus guide"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-btn border border-outline bg-surface-sunken hover:bg-sky-soft/60 text-xs font-body font-semibold text-ink transition-colors"
      >
        <Compass className="w-3.5 h-3.5 text-sky-deep" aria-hidden="true" />
        <span className="hidden sm:inline">Guide</span>
      </button>

      <Joyride
        steps={HUD_STEPS}
        run={run}
        continuous
        scrollToFirstStep
        onEvent={handleTourEvent}
        locale={SKYLEARN_JOYRIDE_LOCALE}
        options={getSkylearnJoyrideOptions(reducedMotion)}
        styles={SKYLEARN_JOYRIDE_STYLES}
      />
    </>
  );
};
