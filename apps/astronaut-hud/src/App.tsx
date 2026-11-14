import React from 'react';
import {
  AstronautAvatar,
  StreakCounter,
  ViewModeSwitcher,
  useAccessibility,
} from '@aura/ui-kit';
import { useAuthStore } from './store/useAuthStore';
import { useMedicalStore } from './store/useMedicalStore';
import { useAppwriteRealtime } from './hooks/useAppwriteRealtime';
import { BodyTwinCanvas } from './components/twin/BodyTwinCanvas';
import { VitalsGrid } from './components/vitals/VitalsGrid';
import { BaselineTrendChart } from './components/vitals/BaselineTrendChart';
import { EmergencyProtocolCard } from './components/triage/EmergencyProtocolCard';
import { GuidedExamModal } from './components/triage/GuidedExamModal';
import { ReadinessGauge } from './components/gamification/ReadinessGauge';
import { DailyCountermeasures } from './components/gamification/DailyCountermeasures';
import { MissionPhaseSelector } from './components/comms/MissionPhaseSelector';
import { EarthDelayQueueBar } from './components/comms/EarthDelayQueueBar';

export const App: React.FC = () => {
  const realtimeStatus = useAppwriteRealtime();
  const { viewMode, highContrast, reducedMotion } = useAccessibility();

  const profile = useAuthStore((s) => s.profile);
  const activeAlert = useMedicalStore((s) => s.activeAlert);
  const selectedSystem = useMedicalStore((s) => s.selectedSystem);
  const setSelectedSystem = useMedicalStore((s) => s.setSelectedSystem);
  const dailyMissions = useMedicalStore((s) => s.dailyMissions);

  const highestStreak = Math.max(...dailyMissions.map((m) => m.streak_days), 12);
  const isSurgeonMode = viewMode === 'surgeon';

  return (
    <div
      className={`min-h-screen bg-surface flex flex-col transition-colors duration-200 ${
        highContrast ? 'high-contrast' : ''
      } ${reducedMotion ? 'reduced-motion' : ''}`}
    >
      {/* 1. TOP NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-outline px-4 lg:px-8 py-3 transition-colors">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky flex items-center justify-center text-white font-display font-extrabold text-xl shadow-glowSky">
              Λ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-xl tracking-tight text-ink">
                  AURA
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-pill bg-sky-soft text-sky-deep font-bold border border-sky/30">
                  NASA SPACE APPS
                </span>
              </div>
              <p className="text-[11px] font-body text-ink-muted -mt-0.5">
                Autonomous Unified Recovery &amp; Assessment // Flight Deck
              </p>
            </div>
          </div>

          {/* Center: Mission Phase & Comms Selector */}
          <div className="hidden md:flex items-center">
            <MissionPhaseSelector />
          </div>

          {/* Right: Crew Profile + Streak + ViewMode Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            <StreakCounter streakDays={highestStreak} label="Team Streak" />

            <div className="flex items-center gap-2.5 pl-2 border-l border-outline">
              <AstronautAvatar
                name={profile.fullName}
                callsign={profile.astronautCode}
                size="sm"
                status={activeAlert ? activeAlert.severity : 'nominal'}
              />
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-display font-bold text-xs text-ink leading-tight">
                  {profile.fullName}
                </span>
                <span className="font-mono text-[10px] text-ink-muted">
                  {profile.astronautCode} • {profile.bloodType}
                </span>
              </div>
            </div>

            <ViewModeSwitcher compact={false} />
          </div>
        </div>

        {/* Mobile Mission Phase Selector */}
        <div className="md:hidden mt-3 pt-2 border-t border-outline flex justify-center">
          <MissionPhaseSelector />
        </div>
      </header>

      {/* 2. MAIN WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 lg:p-6 flex flex-col gap-6">
        {/* Active Emergency Protocol Card (if alert present) or Nominal Status */}
        <section aria-label="Clinical Protocol Advisory">
          <EmergencyProtocolCard />
        </section>

        {/* Top Split: 3D Holographic Twin + Gamified Readiness & Countermeasures */}
        <section className="grid grid-cols-12 gap-6 items-stretch">
          {/* 3D Holographic Digital Twin */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-7 flex flex-col min-h-[480px]">
            <BodyTwinCanvas
              selectedSystem={selectedSystem}
              activeAlertSeverity={activeAlert?.severity}
              activeAlertSystem={activeAlert?.affected_system}
              onSelectSystem={setSelectedSystem}
            />
          </div>

          {/* Gamified Readiness & Countermeasures */}
          <div className="col-span-12 lg:col-span-6 xl:col-span-5 flex flex-col gap-4">
            <ReadinessGauge />
            <DailyCountermeasures />
          </div>
        </section>

        {/* Middle: Live Biometric & Environmental Telemetry Deck */}
        <section aria-label="Biometric Telemetry">
          <VitalsGrid />
        </section>

        {/* Bottom Split: Baseline Trend Chart + DTN Telemetry Queue */}
        <section className="grid grid-cols-12 gap-6 items-stretch">
          <div className="col-span-12 lg:col-span-8 flex flex-col">
            <BaselineTrendChart />
          </div>

          <div className="col-span-12 lg:col-span-4 flex flex-col justify-between">
            <div className="h-full flex flex-col justify-between">
              <EarthDelayQueueBar />
            </div>
          </div>
        </section>
      </main>

      {/* 3. FOOTER */}
      <footer className="border-t border-outline/60 bg-surface-sunken/60 py-4 px-6 text-center text-xs text-ink-muted font-body">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            AURA v1.0.0 • NASA Space Apps Challenge 2026 • Autonomous Space Medicine Decision Support
          </span>
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span>
              Realtime Bus:{' '}
              <strong className={realtimeStatus.isLocalBusConnected ? 'text-leaf-deep' : 'text-coral'}>
                {realtimeStatus.isLocalBusConnected ? 'ACTIVE' : 'OFFLINE'}
              </strong>
            </span>
            <span>•</span>
            <span>
              Appwrite Cloud:{' '}
              <strong className={realtimeStatus.isAppwriteConnected ? 'text-leaf-deep' : 'text-sun-deep'}>
                {realtimeStatus.isAppwriteConnected ? 'CONNECTED' : 'LOCAL BUS FALLBACK'}
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
