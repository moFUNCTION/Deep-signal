import React from 'react';
import {
  AstronautAvatar,
  ViewModeSwitcher,
  useAccessibility,
} from '@aura/ui-kit';
import { ExternalLink, SlidersHorizontal } from 'lucide-react';
import { useAuthStore } from './store/useAuthStore';
import { useMedicalStore } from './store/useMedicalStore';
import { useAppwriteRealtime } from './hooks/useAppwriteRealtime';
import { BodyTwinCanvas } from './components/twin/BodyTwinCanvas';
import { VitalsGrid } from './components/vitals/VitalsGrid';
import { BaselineTrendChart } from './components/vitals/BaselineTrendChart';
import { SurgeonCalibrationPanel } from './components/vitals/SurgeonCalibrationPanel';
import { EmergencyProtocolCard } from './components/triage/EmergencyProtocolCard';
import { GuidedExamModal } from './components/triage/GuidedExamModal';
import { ReadinessGauge } from './components/gamification/ReadinessGauge';
import { DailyCountermeasures } from './components/gamification/DailyCountermeasures';
import { MissionPhaseSelector } from './components/comms/MissionPhaseSelector';
import { EarthDelayQueueBar } from './components/comms/EarthDelayQueueBar';
import { HudFocusTour } from './components/tour/HudFocusTour';

export const App: React.FC = () => {
  const realtimeStatus = useAppwriteRealtime();
  const { isSurgeonMode, highContrast, reducedMotion } = useAccessibility();

  const profile = useAuthStore((s) => s.profile);
  const activeAlert = useMedicalStore((s) => s.activeAlert);
  const selectedSystem = useMedicalStore((s) => s.selectedSystem);
  const setSelectedSystem = useMedicalStore((s) => s.setSelectedSystem);

  return (
    <div
      className={`min-h-screen bg-surface flex flex-col transition-colors duration-200 ${
        highContrast ? 'high-contrast' : ''
      } ${reducedMotion ? 'reduced-motion' : ''}`}
    >
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-surface-elevated/95 backdrop-blur-md border-b border-outline px-4 lg:px-8 py-3">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-btn bg-sky flex items-center justify-center text-white shadow-sm shrink-0"
              aria-hidden="true"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12h4l3-7 4 14 3-7h4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-lg tracking-tight text-ink">
                  AURA Crew Health HUD
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-sky-soft text-sky-deep font-bold">
                  SOL-142
                </span>
              </div>
              <p className="text-xs font-body text-ink-muted -mt-0.5">
                Autonomous Recovery &amp; Assessment System
              </p>
            </div>
          </div>

          {/* Center: Compact Phase & Link Controls (single DOM instance, wraps neatly below lg/xl) */}
          <div
            data-tour="hud-phase-comms"
            className="order-last xl:order-none w-full xl:w-auto flex items-center justify-center pt-2 xl:pt-0 border-t xl:border-t-0 border-outline"
          >
            <MissionPhaseSelector />
          </div>

          {/* Right: Crew Profile, Focus Guide & Mode Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5 pr-3 border-r border-outline">
              <AstronautAvatar
                name={profile.fullName}
                callsign={profile.astronautCode}
                size="sm"
                status={activeAlert ? activeAlert.severity : 'nominal'}
              />
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-display font-bold text-xs text-ink leading-tight">
                  {profile.fullName}
                </span>
                <span className="font-mono text-[10px] text-ink-muted">
                  {profile.astronautCode} · {profile.bloodType}
                </span>
              </div>
            </div>

            <HudFocusTour />
            <a
              href="https://suit-simulator.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-pill bg-sky text-white text-xs font-body font-bold shadow-sm hover:bg-sky-deep transition-all inline-flex items-center gap-1.5"
              title="Open Suit Telemetry Simulator"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Suit Simulator</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <ViewModeSwitcher compact={false} />
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-8 py-6 flex flex-col gap-6">
        {/* Zone 1: Status Strip / Active Emergency Protocol */}
        <section aria-label="Clinical Protocol Advisory" data-tour="hud-triage-banner">
          <EmergencyProtocolCard />
        </section>

        {/* Zone 2: Anatomical Health Twin + Mission Readiness & Countermeasures */}
        <section className="grid grid-cols-12 gap-6 items-stretch">
          <div className="col-span-12 lg:col-span-5 flex flex-col" data-tour="hud-body-twin">
            <BodyTwinCanvas
              selectedSystem={selectedSystem}
              activeAlertSeverity={activeAlert?.severity}
              activeAlertSystem={activeAlert?.affected_system}
              onSelectSystem={setSelectedSystem}
            />
          </div>

          <div
            className="col-span-12 lg:col-span-7 flex flex-col gap-5 justify-between"
            data-tour="hud-readiness"
          >
            <ReadinessGauge />
            <DailyCountermeasures />
          </div>
        </section>

        {/* Zone 3: Live Biometric Telemetry & Reference Trend Bands */}
        <section
          className="grid grid-cols-12 gap-6 items-stretch"
          data-tour="hud-vitals"
        >
          <div className="col-span-12 xl:col-span-7 flex flex-col">
            <VitalsGrid />
          </div>

          <div className="col-span-12 xl:col-span-5 flex flex-col">
            <BaselineTrendChart />
          </div>
        </section>

        {/* Zone 4 (Flight Surgeon Telemetry View): Pre-Flight BDC Calibration & Offset Matrix */}
        {isSurgeonMode && (
          <section aria-label="Flight Surgeon Baseline Calibration">
            <SurgeonCalibrationPanel />
          </section>
        )}

        {/* Zone 5: Delay/Disruption-Tolerant Networking (DTN) Queue */}
        <section aria-label="Earth Telemetry Delay Queue" data-tour="hud-dtn-queue">
          <EarthDelayQueueBar />
        </section>
      </main>

      {/* 3. FOOTER */}
      <footer className="border-t border-outline bg-surface-elevated py-3.5 px-6 text-xs text-ink-muted font-body">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            AURA v1.0.0 · Autonomous Space Medicine Decision Support
          </span>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>
              Telemetry Bus:{' '}
              <strong className={realtimeStatus.isLocalBusConnected ? 'text-leaf-deep' : 'text-coral'}>
                {realtimeStatus.isLocalBusConnected ? 'SYNCED' : 'OFFLINE'}
              </strong>
            </span>
            <span>·</span>
            <span>
              Appwrite Cloud:{' '}
              <strong className={realtimeStatus.isAppwriteConnected ? 'text-leaf-deep' : 'text-ink-muted'}>
                {realtimeStatus.isAppwriteConnected ? 'CONNECTED' : 'LOCAL EDGE MODE'}
              </strong>
            </span>
          </div>
        </div>
      </footer>

      {/* 4. MODALS */}
      <GuidedExamModal />
    </div>
  );
};

export default App;
