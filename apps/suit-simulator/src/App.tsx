import React, { useEffect, useState } from 'react';
import {
  DEFAULT_ASTRONAUT_PREFS,
  DistanceCommsMode,
  EarthBaselines,
  MissionPhase,
  VitalReadingInput,
} from '@aura/medical-engine';
import {
  AccessibilityProvider,
  HudCard,
  StatusBadge,
  ViewModeSwitcher,
} from '@aura/ui-kit';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
  Radio,
  RotateCcw,
  Sliders,
  Sparkles,
  Wifi,
  Zap,
} from 'lucide-react';
import {
  SCENARIO_PRESETS,
  ScenarioDefinition,
  ScenarioPresets,
} from './components/ScenarioPresets';
import { TelemetrySliders } from './components/TelemetrySliders';
import { PreFlightCalibrationForm } from './components/PreFlightCalibrationForm';
import { telemetryBridge } from './services/telemetryBridge';

export const AppContent: React.FC = () => {
  const [profile, setProfile] = useState(() => telemetryBridge.getProfile());
  const [earthBaselines, setEarthBaselines] = useState<EarthBaselines>(
    () => profile.earthBaselines || DEFAULT_ASTRONAUT_PREFS.earthBaselines,
  );
  const [missionPhase, setMissionPhase] = useState<MissionPhase>(
    () => profile.missionPhase || 'DEEP_SPACE_CRUISE',
  );
  const [commsMode, setCommsMode] = useState<DistanceCommsMode>('ISS_REALTIME');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>('nominal_cruise');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);

  // Initialize with Scenario 1 nominal vitals
  const [currentValues, setCurrentValues] = useState<VitalReadingInput>(() => {
    const nominal = SCENARIO_PRESETS[0];
    return {
      astronaut_id: profile.astronautCode || 'AST-CDR-01',
      mission_phase: nominal.missionPhase,
      ...nominal.vitals,
    };
  });

  // Listen to remote changes over BroadcastChannel
  useEffect(() => {
    const unsubscribe = telemetryBridge.subscribe((event) => {
      if (event.type === 'BASELINE_CHANGE' || event.type === 'PREFS_UPDATED') {
        const payload = event.payload;
        if (payload?.earthBaselines) {
          setEarthBaselines(payload.earthBaselines);
        }
        if (payload?.missionPhase) {
          setMissionPhase(payload.missionPhase);
        }
      } else if (event.type === 'MISSION_PHASE_CHANGE') {
        if (event.payload?.missionPhase) {
          setMissionPhase(event.payload.missionPhase);
        }
      } else if (event.type === 'COMMS_MODE_UPDATED') {
        if (event.payload?.commsMode) {
          setCommsMode(event.payload.commsMode);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle Scenario Preset Selection
  const handleSelectScenario = async (scenario: ScenarioDefinition) => {
    setActiveScenarioId(scenario.id);
    setMissionPhase(scenario.missionPhase);
    setCommsMode(scenario.commsMode);

    // Update Countermeasures
    await telemetryBridge.broadcastTaskCompletion(
      'HYDRATION_2500ML',
      scenario.countermeasures.hydration,
    );
    await telemetryBridge.broadcastTaskCompletion(
      'ARED_WORKOUT',
      scenario.countermeasures.ared,
    );
    await telemetryBridge.broadcastTaskCompletion(
      'CIRCADIAN_LIGHT_SYNC',
      scenario.countermeasures.circadian,
    );

    // Update Comms Mode
    telemetryBridge.broadcastCommsMode(scenario.commsMode);

    // Update Phase & Baselines
    await telemetryBridge.broadcastMissionPhaseChange(scenario.missionPhase);

    // Inject Telemetry
    const nextVitals: VitalReadingInput = {
      astronaut_id: profile.astronautCode || 'AST-CDR-01',
      mission_phase: scenario.missionPhase,
      ...scenario.vitals,
    };

    setCurrentValues(nextVitals);
    await telemetryBridge.broadcastTelemetry(nextVitals);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-between text-ink">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-surface-elevated/95 backdrop-blur border-b border-outline px-4 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-card bg-sky text-white flex items-center justify-center font-display font-black text-xl shadow-glowSky">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-display font-black tracking-tight text-ink">
                  AURA // Telemetry Simulator &amp; Judge Deck
                </h1>
                <span className="px-2 py-0.5 rounded-pill text-[10px] font-mono font-bold bg-sky-soft text-sky-deep border border-sky/30">
                  PORT 5174
                </span>
              </div>
              <p className="text-xs text-ink-muted font-body">
                NASA Space Apps Challenge · Autonomous Unified Recovery &amp; Assessment
              </p>
            </div>
          </div>

          {/* Quick Controls & Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-sunken border border-outline text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-leaf animate-pulse" />
              <span>Phase:</span>
              <strong className="text-sky-deep">{missionPhase.replace(/_/g, ' ')}</strong>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-pill bg-surface-sunken border border-outline text-xs font-mono">
              <Radio className="w-3.5 h-3.5 text-sun-deep" />
              <span>Comms:</span>
              <strong className="text-ink">{commsMode}</strong>
            </div>

            <button
              type="button"
              onClick={() => setIsCalibrationOpen(true)}
              className="px-3 py-1.5 rounded-btn text-xs font-semibold font-body bg-sky-soft hover:bg-sky/20 text-sky-deep border border-sky/30 transition-all flex items-center gap-1.5"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Edit Baselines</span>
            </button>

            <ViewModeSwitcher />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-8 flex-1">
        {/* Section 1: Scenario Presets Banner */}
        <section>
          <ScenarioPresets
            activeScenarioId={activeScenarioId}
            onSelectScenario={handleSelectScenario}
            isStreaming={isStreaming}
          />
        </section>

        {/* Section 2: Interactive Sliders & Live Correlation */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-display font-bold text-ink flex items-center gap-2">
              <Sliders className="w-6 h-6 text-sky" />
              Real-Time Suit Biometric &amp; Cabin Sliders
            </h2>
            <p className="text-sm text-ink-muted font-body">
              Move any slider to trigger immediate real-time Z-score recalculation and cross-tab injection.
            </p>
          </div>

          <TelemetrySliders
            currentValues={currentValues}
            earthBaselines={earthBaselines}
            missionPhase={missionPhase}
            onChangeValues={(vals) => setCurrentValues(vals)}
            isStreaming={isStreaming}
            onToggleStreaming={(active) => setIsStreaming(active)}
          />
        </section>

        {/* Calibration Modal / Drawer */}
        {isCalibrationOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-surface-elevated max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-card border border-outline shadow-2xl p-6">
              <PreFlightCalibrationForm
                initialBaselines={earthBaselines}
                initialPhase={missionPhase}
                initialCommsMode={commsMode}
                onApplyCalibration={(baselines, phase, mode) => {
                  setEarthBaselines(baselines);
                  setMissionPhase(phase);
                  setCommsMode(mode);
                }}
                onClose={() => setIsCalibrationOpen(false)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-surface-elevated border-t border-outline px-4 lg:px-8 py-3 text-xs font-mono text-ink-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-leaf animate-pulse" />
            <span>
              Realtime Bus: <strong className="text-ink">aura_telemetry_bus</strong> [CONNECTED]
            </span>
            <span className="text-ink-subtle">·</span>
            <span>
              Astronaut HUD Sync:{' '}
              <a
                href="http://localhost:5173"
                target="_blank"
                rel="noreferrer"
                className="text-sky hover:underline"
              >
                http://localhost:5173
              </a>
            </span>
          </div>

          <div>
            <span>Dual-Mode: Local Storage &amp; Appwrite Cloud Fallback</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}
