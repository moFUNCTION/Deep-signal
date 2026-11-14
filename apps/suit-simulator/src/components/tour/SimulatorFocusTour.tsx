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

const TOUR_STORAGE_KEY = 'aura_sim_focus_tour_v1';

const SIMULATOR_STEPS: Step[] = [
  {
    target: '[data-tour="sim-live-preview"]',
    title: 'Predicted Triage Banner',
    content:
      'Displays the live triage rule and injected biometrics at a glance so you always know the clinical state being transmitted.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="sim-tabs"]',
    title: 'Focused Control Modes',
    content:
      'Keep only one control set on screen at a time—switch cleanly between Clinical Test Scenarios, Biometric Sliders, and Earth BDC Calibration.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="sim-workspace"]',
    title: 'Scenario & Telemetry Deck',
    content:
      'Trigger realistic anomalies like Launch 3G, CO2 Hypercapnia, or Solar Blackout in one click without hunting through cluttered controls.',
    placement: 'top',
  },
  {
    target: '[data-tour="sim-open-hud"]',
    title: 'Live Sync to Astronaut HUD',
    content:
      'All changes broadcast across ports immediately to the Crew Health HUD on localhost:5173.',
    placement: 'bottom',
    isFixed: true,
    skipScroll: true,
  },
];

export const SimulatorFocusTour: React.FC = () => {
  const { reducedMotion } = useAccessibility();
  const [run, setRun] = useState<boolean>(false);

  useEffect(() => {
    if (readFocusTourSeen(TOUR_STORAGE_KEY)) return;
    const timer = window.setTimeout(() => setRun(true), 450);
    return () => window.clearTimeout(timer);
  }, []);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setRun(true)}
        title="Launch simulator focus guide"
        aria-label="Launch simulator focus guide"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-btn border border-outline bg-surface-sunken hover:bg-sky-soft/60 text-xs font-body font-semibold text-ink transition-colors"
      >
        <Compass className="w-3.5 h-3.5 text-sky-deep" aria-hidden="true" />
        <span className="hidden sm:inline">Guide</span>
      </button>

      <Joyride
        steps={SIMULATOR_STEPS}
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
