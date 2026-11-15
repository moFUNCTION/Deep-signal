import React, { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_ASTRONAUT_PREFS,
  runAutonomousTriage,
  type DistanceCommsMode,
  type EarthBaselines,
  type MissionPhase,
  type VitalReadingInput,
} from '@aura/medical-engine';
import { AccessibilityProvider, StatusBadge } from '@aura/ui-kit';
import {
  Activity,
  ExternalLink,
  ListChecks,
  Radio,
  Sliders,
  SlidersHorizontal,
} from 'lucide-react';
import {
  SCENARIO_PRESETS,
  type ScenarioDefinition,
  ScenarioPresets,
} from './components/ScenarioPresets';
import { TelemetrySliders } from './components/TelemetrySliders';
import { PreFlightCalibrationForm } from './components/PreFlightCalibrationForm';
import { SimulatorFocusTour } from './components/tour/SimulatorFocusTour';
import { telemetryBridge } from './services/telemetryBridge';

type SimulatorTab = 'scenarios' | 'sliders' | 'calibration';

export const AppContent: React.FC = () => {
  const [profile] = useState(() => telemetryBridge.getProfile());
  const [earthBaselines, setEarthBaselines] = useState<EarthBaselines>(
    () => profile.earthBaselines || DEFAULT_ASTRONAUT_PREFS.earthBaselines,
  );
  const [missionPhase, setMissionPhase] = useState<MissionPhase>(
    () => profile.missionPhase || 'EARLY_ORBIT_ADAPTATION',
  );
  const [commsMode, setCommsMode] = useState<DistanceCommsMode>('ISS_REALTIME');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>('nominal_cruise');
  const [activeTab, setActiveTab] = useState<SimulatorTab>('scenarios');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [, setMissionsVersion] = useState<number>(0);

  const [currentValues, setCurrentValues] = useState<VitalReadingInput>(() => {
    const nominal = SCENARIO_PRESETS[0];
    return {
      astronaut_id: profile.astronautCode || 'AST-CDR-01',
      mission_phase: nominal.missionPhase,
      ...nominal.vitals,
    };
  });

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = telemetryBridge.subscribe((event) => {
      if (!isMounted) return;

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
      } else if (event.type === 'MISSIONS_UPDATED') {
        setMissionsVersion((v) => v + 1);
      } else if (event.type === 'TELEMETRY_SAMPLE' && event.payload) {
        const sample = event.payload as Partial<VitalReadingInput>;
        if (typeof sample.heart_rate === 'number') {
          setCurrentValues((prev) => ({
            ...prev,
            astronaut_id: sample.astronaut_id ?? prev.astronaut_id,
            mission_phase: sample.mission_phase ?? prev.mission_phase,
            heart_rate: sample.heart_rate ?? prev.heart_rate,
            bp_systolic: sample.bp_systolic ?? prev.bp_systolic,
            bp_diastolic: sample.bp_diastolic ?? prev.bp_diastolic,
            blood_glucose: sample.blood_glucose ?? prev.blood_glucose,
            body_temp: sample.body_temp ?? prev.body_temp,
            spo2: sample.spo2 ?? prev.spo2,
            cabin_co2_mmhg: sample.cabin_co2_mmhg ?? prev.cabin_co2_mmhg,
            cabin_radiation_msv: sample.cabin_radiation_msv ?? prev.cabin_radiation_msv,
            sleep_hours: sample.sleep_hours ?? prev.sleep_hours,
            mood_score: sample.mood_score ?? prev.mood_score,
          }));
        }
      }
    });

    void telemetryBridge.hydrateFromCloud().then((hydrated) => {
      if (!isMounted || !hydrated) return;
      setEarthBaselines(hydrated.earthBaselines);
      setMissionPhase(hydrated.missionPhase);
      if (hydrated.commsMode) {
        setCommsMode(hydrated.commsMode);
      }
      if (hydrated.latestVital) {
        const latest = hydrated.latestVital;
        setCurrentValues((prev) => ({
          ...prev,
          astronaut_id: latest.astronaut_id ?? prev.astronaut_id,
          mission_phase: latest.mission_phase ?? prev.mission_phase,
          heart_rate: latest.heart_rate ?? prev.heart_rate,
          bp_systolic: latest.bp_systolic ?? prev.bp_systolic,
          bp_diastolic: latest.bp_diastolic ?? prev.bp_diastolic,
          blood_glucose: latest.blood_glucose ?? prev.blood_glucose,
          body_temp: latest.body_temp ?? prev.body_temp,
          spo2: latest.spo2 ?? prev.spo2,
          cabin_co2_mmhg: latest.cabin_co2_mmhg ?? prev.cabin_co2_mmhg,
          cabin_radiation_msv: latest.cabin_radiation_msv ?? prev.cabin_radiation_msv,
          sleep_hours: latest.sleep_hours ?? prev.sleep_hours,
          mood_score: latest.mood_score ?? prev.mood_score,
        }));
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const liveTriage = useMemo(() => {
    const missions = telemetryBridge.getDailyMissions();
    const incompleteTasks = missions
      .filter((m: any) => !m.is_completed)
      .map((m: any) => m.task_code);
    return runAutonomousTriage(
      currentValues,
      earthBaselines,
      missionPhase,
      incompleteTasks,
    );
  }, [currentValues, earthBaselines, missionPhase]);

  const handleSelectScenario = async (scenario: ScenarioDefinition) => {
    setActiveScenarioId(scenario.id);
    setMissionPhase(scenario.missionPhase);
    setCommsMode(scenario.commsMode);

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

    await telemetryBridge.broadcastCommsMode(scenario.commsMode);
    await telemetryBridge.broadcastMissionPhaseChange(scenario.missionPhase);

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
      <header className="sm:sticky sm:top-0 z-30 bg-surface-elevated/95 backdrop-blur-md border-b border-outline px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-btn bg-sky text-white flex items-center justify-center shadow-sm shrink-0"
              aria-hidden="true"
            >
              <Activity className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-display font-extrabold tracking-tight text-ink">
                  AURA Suit Telemetry Simulator
                </h1>
                <span className="px-2 py-0.5 rounded-pill text-[10px] font-mono font-bold bg-sky-soft text-sky-deep shrink-0">
                  CONTROL CONSOLE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-ink-muted font-body truncate">
                Biometric Injector &amp; Clinical Scenario Verification Deck
              </p>
            </div>
          </div>

          {/* Phase, Comms & HUD Link */}
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="px-2.5 py-1 rounded-input bg-surface-sunken border border-outline text-[11px] sm:text-xs font-mono">
              <span className="text-ink-muted mr-1">Phase:</span>
              <strong className="text-sky-deep">{missionPhase.replace(/_/g, ' ')}</strong>
            </div>

            <div className="px-2.5 py-1 rounded-input bg-surface-sunken border border-outline text-[11px] sm:text-xs font-mono inline-flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-leaf-deep shrink-0" />
              <strong className="text-ink">{commsMode.replace(/_/g, ' ')}</strong>
            </div>

            <SimulatorFocusTour />

            <a
              data-tour="sim-open-hud"
              href="https://aura-astronaut.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-btn text-xs font-semibold font-body bg-sky hover:bg-sky-deep text-white transition-colors inline-flex items-center gap-1.5"
            >
              <span>Open Astronaut HUD</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 flex-1">
        {/* Always-Visible Predicted Triage Outcome Bar */}
        <section
          data-tour="sim-live-preview"
          aria-label="Live Injected State Preview"
          className="p-3.5 sm:p-4 rounded-card bg-surface-elevated border border-outline shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 sm:gap-4"
        >
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <StatusBadge
              severity={liveTriage.severity}
              label={
                liveTriage.severity === 'green'
                  ? 'NOMINAL'
                  : liveTriage.severity === 'yellow'
                  ? 'CAUTION'
                  : 'CRITICAL'
              }
              size="md"
            />
            <div className="min-w-0">
              <div className="text-sm font-display font-bold text-ink">
                {liveTriage.diagnosis_title}
              </div>
              <div className="text-[11px] sm:text-xs font-mono text-ink-muted break-words">
                Rule: {liveTriage.diagnosis_code} · System: {liveTriage.affected_system.toUpperCase()} · HR {currentValues.heart_rate} bpm · SpO2 {currentValues.spo2}% · CO2 {currentValues.cabin_co2_mmhg} mmHg
              </div>
            </div>
          </div>

          {/* Primary Tab Navigation */}
          <div
            data-tour="sim-tabs"
            className="w-full lg:w-auto grid grid-cols-3 lg:inline-flex items-stretch lg:items-center gap-1 p-1 rounded-btn bg-surface-sunken border border-outline shrink-0"
            role="tablist"
            aria-label="Simulator console sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'scenarios'}
              onClick={() => setActiveTab('scenarios')}
              className={`px-2 sm:px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-body font-semibold inline-flex items-center justify-center gap-1.5 transition-all text-center ${
                activeTab === 'scenarios'
                  ? 'bg-surface-elevated text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <ListChecks className="w-4 h-4 shrink-0 hidden sm:inline" />
              <span>Scenarios (7)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sliders'}
              onClick={() => setActiveTab('sliders')}
              className={`px-2 sm:px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-body font-semibold inline-flex items-center justify-center gap-1.5 transition-all text-center ${
                activeTab === 'sliders'
                  ? 'bg-surface-elevated text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0 hidden sm:inline" />
              <span>Sliders</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'calibration'}
              onClick={() => setActiveTab('calibration')}
              className={`px-2 sm:px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-body font-semibold inline-flex items-center justify-center gap-1.5 transition-all text-center ${
                activeTab === 'calibration'
                  ? 'bg-surface-elevated text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0 hidden sm:inline" />
              <span>BDC Calibration</span>
            </button>
          </div>
        </section>

        {/* Active Tab Workspace */}
        <div data-tour="sim-workspace">
          {activeTab === 'scenarios' && (
            <ScenarioPresets
              activeScenarioId={activeScenarioId}
              onSelectScenario={handleSelectScenario}
              isStreaming={isStreaming}
            />
          )}

          {activeTab === 'sliders' && (
            <TelemetrySliders
              currentValues={currentValues}
              earthBaselines={earthBaselines}
              missionPhase={missionPhase}
              onChangeValues={(vals) => setCurrentValues(vals)}
              isStreaming={isStreaming}
              onToggleStreaming={(active) => setIsStreaming(active)}
            />
          )}

          {activeTab === 'calibration' && (
            <div className="p-4 sm:p-6 rounded-card bg-surface-elevated border border-outline shadow-card">
              <PreFlightCalibrationForm
                initialBaselines={earthBaselines}
                initialPhase={missionPhase}
                initialCommsMode={commsMode}
                onApplyCalibration={(baselines, phase, mode) => {
                  setEarthBaselines(baselines);
                  setMissionPhase(phase);
                  setCommsMode(mode);
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-surface-elevated border-t border-outline px-3 sm:px-4 lg:px-8 py-3 text-xs font-mono text-ink-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-leaf" />
            <span>
              Telemetry Relay: <strong className="text-ink">aura_telemetry_bus</strong> [ACTIVE]
            </span>
          </div>
          <span>Cloud Sync: Appwrite Realtime + Cross-Tab Bus</span>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}

export default App;
