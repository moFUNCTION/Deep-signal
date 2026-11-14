import React, { useEffect, useRef, useState } from 'react';
import {
  BiometricMetricKey,
  EarthBaselines,
  evaluateSingleMetric,
  MetricEvaluationResult,
  MetricKey,
  MissionPhase,
  NASA_HARD_LIMITS,
  runAutonomousTriage,
  TriageDiagnosisOutput,
  VitalReadingInput,
} from '@aura/medical-engine';
import { BigFriendlyButton, HudCard, StatusBadge, useDebounce } from '@aura/ui-kit';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Flame,
  Heart,
  Moon,
  Radio,
  RefreshCw,
  Send,
  Smile,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import { telemetryBridge } from '../services/telemetryBridge';

interface SliderConfig {
  key: MetricKey | 'sleep_hours' | 'mood_score';
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  isBiometric: boolean;
  icon: React.ReactNode;
}

const METRIC_CONFIGS: SliderConfig[] = [
  {
    key: 'heart_rate',
    label: 'Heart Rate',
    unit: 'bpm',
    min: 40,
    max: 180,
    step: 1,
    isBiometric: true,
    icon: <Heart className="w-4 h-4 text-coral" />,
  },
  {
    key: 'bp_systolic',
    label: 'Systolic Blood Pressure',
    unit: 'mmHg',
    min: 70,
    max: 200,
    step: 1,
    isBiometric: true,
    icon: <Activity className="w-4 h-4 text-sky" />,
  },
  {
    key: 'bp_diastolic',
    label: 'Diastolic Blood Pressure',
    unit: 'mmHg',
    min: 40,
    max: 120,
    step: 1,
    isBiometric: true,
    icon: <Activity className="w-4 h-4 text-sky-deep" />,
  },
  {
    key: 'blood_glucose',
    label: 'Blood Glucose',
    unit: 'mg/dL',
    min: 50,
    max: 220,
    step: 1,
    isBiometric: true,
    icon: <Flame className="w-4 h-4 text-sun-deep" />,
  },
  {
    key: 'body_temp',
    label: 'Core Body Temperature',
    unit: '°C',
    min: 34.5,
    max: 40.5,
    step: 0.1,
    isBiometric: true,
    icon: <Thermometer className="w-4 h-4 text-coral" />,
  },
  {
    key: 'spo2',
    label: 'Oxygen Saturation (SpO2)',
    unit: '%',
    min: 80,
    max: 100,
    step: 1,
    isBiometric: true,
    icon: <Activity className="w-4 h-4 text-leaf-deep" />,
  },
  {
    key: 'cabin_co2_mmhg',
    label: 'Cabin Partial CO2 Pressure',
    unit: 'mmHg',
    min: 0.0,
    max: 8.0,
    step: 0.1,
    isBiometric: false,
    icon: <Wind className="w-4 h-4 text-ink-muted" />,
  },
  {
    key: 'cabin_radiation_msv',
    label: 'Cabin Radiation Dose Rate',
    unit: 'mSv/day',
    min: 0.0,
    max: 10.0,
    step: 0.1,
    isBiometric: false,
    icon: <Zap className="w-4 h-4 text-sun-deep" />,
  },
  {
    key: 'sleep_hours',
    label: 'Rest / Sleep Duration (24h)',
    unit: 'hrs',
    min: 0.0,
    max: 12.0,
    step: 0.5,
    isBiometric: false,
    icon: <Moon className="w-4 h-4 text-berry" />,
  },
  {
    key: 'mood_score',
    label: 'Crew Cognitive / Mood Score',
    unit: '/10',
    min: 1,
    max: 10,
    step: 1,
    isBiometric: false,
    icon: <Smile className="w-4 h-4 text-leaf" />,
  },
];

interface TelemetrySlidersProps {
  currentValues: VitalReadingInput;
  earthBaselines: EarthBaselines;
  missionPhase: MissionPhase;
  onChangeValues: (newValues: VitalReadingInput) => void;
  isStreaming: boolean;
  onToggleStreaming: (active: boolean) => void;
}

export const TelemetrySliders: React.FC<TelemetrySlidersProps> = ({
  currentValues,
  earthBaselines,
  missionPhase,
  onChangeValues,
  isStreaming,
  onToggleStreaming,
}) => {
  const [packetCount, setPacketCount] = useState<number>(0);
  const [lastInjectedTime, setLastInjectedTime] = useState<string | null>(null);
  const [isSyncPending, setIsSyncPending] = useState<boolean>(false);
  const streamIntervalRef = useRef<number | null>(null);
  const pendingDragRef = useRef<boolean>(false);
  const latestValuesRef = useRef<VitalReadingInput>(currentValues);
  latestValuesRef.current = currentValues;

  const debouncedSliderValues = useDebounce(currentValues, 350);

  // Evaluate single metric in real time
  const getEvaluation = (key: MetricKey, value: number): MetricEvaluationResult => {
    const isBio = key !== 'cabin_co2_mmhg' && key !== 'cabin_radiation_msv';
    const baseline = isBio ? earthBaselines[key as BiometricMetricKey] : undefined;
    return evaluateSingleMetric(key, value, baseline, missionPhase);
  };

  // Live real-time triage diagnosis
  const missions = telemetryBridge.getDailyMissions();
  const incompleteTasks = missions
    .filter((m: any) => !m.is_completed)
    .map((m: any) => m.task_code);
  const activeTriage: TriageDiagnosisOutput = runAutonomousTriage(
    currentValues,
    earthBaselines,
    missionPhase,
    incompleteTasks,
  );

  // Debounced transmit for manual slider drags so Appwrite receives one clean packet after settling
  useEffect(() => {
    if (!pendingDragRef.current || isStreaming) return;
    pendingDragRef.current = false;
    setIsSyncPending(false);

    void telemetryBridge.broadcastTelemetry(debouncedSliderValues);
    setLastInjectedTime(new Date().toLocaleTimeString());
    setPacketCount((c) => c + 1);
  }, [debouncedSliderValues, isStreaming]);

  // Handle individual slider change (UI updates instantaneously; network sync debounced 350ms)
  const handleSliderChange = (key: string, val: number) => {
    const next: VitalReadingInput = {
      ...currentValues,
      mission_phase: missionPhase,
      [key]: val,
    };
    onChangeValues(next);

    if (!isStreaming) {
      pendingDragRef.current = true;
      setIsSyncPending(true);
    }
  };

  // Continuous auto-streaming interval (physiological Brownian fluctuation every 2 seconds)
  useEffect(() => {
    if (isStreaming) {
      pendingDragRef.current = false;
      setIsSyncPending(false);

      streamIntervalRef.current = window.setInterval(() => {
        const base = latestValuesRef.current;
        const jitter = (range: number) => (Math.random() - 0.5) * range;

        const next: VitalReadingInput = {
          ...base,
          mission_phase: missionPhase,
          heart_rate: Math.max(
            42,
            Math.min(170, Math.round(base.heart_rate + jitter(2))),
          ),
          bp_systolic: Math.max(
            80,
            Math.min(190, Math.round(base.bp_systolic + jitter(2))),
          ),
          bp_diastolic: Math.max(
            45,
            Math.min(115, Math.round(base.bp_diastolic + jitter(1.5))),
          ),
          body_temp: Math.max(
            35.0,
            Math.min(40.0, Math.round((base.body_temp + jitter(0.04)) * 10) / 10),
          ),
          spo2: Math.max(
            88,
            Math.min(100, Math.round(base.spo2 + (Math.random() > 0.8 ? jitter(1) : 0))),
          ),
        };

        onChangeValues(next);
        void telemetryBridge.broadcastTelemetry(next);
        setPacketCount((c) => c + 1);
        setLastInjectedTime(new Date().toLocaleTimeString());
      }, 2000);
    } else if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }

    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [isStreaming, missionPhase, onChangeValues]);

  // Single manual injection
  const handleManualInject = () => {
    pendingDragRef.current = false;
    setIsSyncPending(false);
    void telemetryBridge.broadcastTelemetry(
      { ...currentValues, mission_phase: missionPhase },
      activeTriage,
    );
    setPacketCount((c) => c + 1);
    setLastInjectedTime(new Date().toLocaleTimeString());
  };

  return (
    <div className="space-y-6">
      {/* Streaming Controls Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-card bg-surface-elevated border border-outline shadow-card">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-btn flex items-center justify-center ${
              isStreaming
                ? 'bg-leaf-soft text-leaf-deep animate-pulse'
                : 'bg-surface-sunken text-ink-muted'
            }`}
          >
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-display font-bold text-ink">
                Continuous Telemetry Stream
              </span>
              <span
                className={`px-2 py-0.5 rounded-pill text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isStreaming
                    ? 'bg-leaf-soft text-leaf-deep border border-leaf/30'
                    : 'bg-surface-sunken text-ink-subtle border border-outline'
                }`}
              >
                {isStreaming ? 'STREAMING ACTIVE (2s)' : 'PAUSED / MANUAL'}
              </span>
            </div>
            <p className="text-xs text-ink-muted font-body mt-0.5">
              Generates biophysical micro-fluctuations every 2 seconds simulating live wireless suit sensors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-ink-subtle font-mono block">PACKETS SENT</span>
            <span className="text-sm font-mono font-bold text-ink">{packetCount}</span>
          </div>

          <button
            type="button"
            onClick={() => onToggleStreaming(!isStreaming)}
            className={`px-4 py-2.5 rounded-btn text-xs font-semibold font-body tracking-wide transition-all duration-150 flex items-center gap-2 ${
              isStreaming
                ? 'bg-coral-soft text-coral border border-coral/30 hover:bg-coral/20'
                : 'bg-leaf hover:bg-leaf-deep text-white shadow-sm'
            }`}
          >
            {isStreaming ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Pause Stream</span>
              </>
            ) : (
              <>
                <Radio className="w-4 h-4" />
                <span>Start Continuous Stream</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {METRIC_CONFIGS.map((metric) => {
          const val = (currentValues as any)[metric.key] ?? metric.min;
          const isBioOrEnv =
            metric.key !== 'sleep_hours' && metric.key !== 'mood_score';
          const evalResult = isBioOrEnv
            ? getEvaluation(metric.key as MetricKey, Number(val))
            : null;

          const hardLimit = isBioOrEnv
            ? NASA_HARD_LIMITS[metric.key as MetricKey]
            : null;

          return (
            <div
              key={metric.key}
              className="p-4 rounded-card bg-surface-elevated border border-outline hover:border-sky-bright transition-all shadow-card"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-btn bg-surface-sunken">
                    {metric.icon}
                  </div>
                  <div>
                    <span className="text-sm font-display font-bold text-ink">
                      {metric.label}
                    </span>
                    <span className="text-xs text-ink-subtle font-mono ml-2">
                      ({metric.unit})
                    </span>
                  </div>
                </div>

                {evalResult && (
                  <StatusBadge
                    severity={evalResult.severity}
                    label={
                      evalResult.severity === 'green'
                        ? 'NOMINAL'
                        : evalResult.severity === 'yellow'
                        ? 'CAUTION'
                        : 'CRITICAL'
                    }
                    size="sm"
                  />
                )}
              </div>

              {/* Slider & Value Row */}
              <div className="flex items-center gap-4 my-2">
                <input
                  id={`telemetry-slider-${metric.key}`}
                  name={`telemetry-slider-${metric.key}`}
                  aria-label={`${metric.label} (${metric.unit})`}
                  type="range"
                  min={metric.min}
                  max={metric.max}
                  step={metric.step}
                  value={val}
                  onChange={(e) =>
                    handleSliderChange(metric.key, parseFloat(e.target.value))
                  }
                  className="flex-1"
                />
                <div className="w-20 text-right">
                  <span className="text-lg font-mono font-bold text-ink tracking-tight">
                    {typeof val === 'number' && metric.step < 1
                      ? val.toFixed(1)
                      : val}
                  </span>
                  <span className="text-[11px] text-ink-subtle font-mono ml-1">
                    {metric.unit}
                  </span>
                </div>
              </div>

              {/* Real-Time Diagnostics Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline text-[11px] font-mono">
                {evalResult ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-subtle">
                        μ_adj:{' '}
                        <strong className="text-ink">
                          {evalResult.adjustedMean !== null
                            ? evalResult.adjustedMean
                            : 'N/A'}
                        </strong>
                      </span>
                      <span className="text-ink-subtle">|</span>
                      <span className="text-ink-subtle">
                        Z-Score:{' '}
                        <strong
                          className={
                            evalResult.severity === 'green'
                              ? 'text-leaf'
                              : evalResult.severity === 'yellow'
                              ? 'text-sun-deep'
                              : 'text-coral'
                          }
                        >
                          {evalResult.zScore.toFixed(2)}σ
                        </strong>
                      </span>
                      {evalResult.deviationPercent !== 0 && (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] ${
                            evalResult.deviationPercent > 0
                              ? 'bg-coral-soft text-coral'
                              : 'bg-sky-soft text-sky-deep'
                          }`}
                        >
                          {evalResult.deviationPercent > 0 ? '+' : ''}
                          {evalResult.deviationPercent}%
                        </span>
                      )}
                    </div>
                    {hardLimit && (
                      <span className="text-ink-subtle">
                        Limits: {hardLimit.minCritical}–{hardLimit.maxCritical}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-ink-subtle">
                    {metric.key === 'sleep_hours'
                      ? 'Sleep requirement: >= 7.0 hrs for optimal neuro-cognitive performance'
                      : 'Cognitive/Mood target: >= 7/10 subjective wellness'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Triage Diagnostics Summary Box */}
      <div className="p-5 rounded-card bg-surface-elevated border border-outline shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky" />
            <h3 className="text-base font-display font-bold text-ink">
              Live Clinical Triage Correlation (Pure Deterministic Engine)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-subtle font-mono">
              Rule Triggered:
            </span>
            <span className="px-2 py-0.5 rounded-pill bg-surface-sunken text-ink text-xs font-mono font-bold border border-outline">
              {activeTriage.diagnosis_code}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-btn bg-surface-sunken">
            <span className="text-xs text-ink-subtle font-mono uppercase block mb-1">
              Active Diagnosis
            </span>
            <span className="text-sm font-display font-bold text-ink block leading-snug">
              {activeTriage.diagnosis_title}
            </span>
          </div>

          <div className="p-3 rounded-btn bg-surface-sunken">
            <span className="text-xs text-ink-subtle font-mono uppercase block mb-1">
              Organ System &amp; Severity
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-pill text-xs font-mono font-bold uppercase bg-sky-soft text-sky-deep border border-sky/30">
                {activeTriage.affected_system}
              </span>
              <StatusBadge
                severity={activeTriage.severity}
                label={
                  activeTriage.severity === 'green'
                    ? 'NOMINAL'
                    : activeTriage.severity === 'yellow'
                    ? 'CAUTION'
                    : 'CRITICAL'
                }
                size="sm"
              />
            </div>
          </div>

          <div className="p-3 rounded-btn bg-surface-sunken">
            <span className="text-xs text-ink-subtle font-mono uppercase block mb-1">
              Earth Notification Status
            </span>
            <span
              className={`text-sm font-body font-semibold block ${
                activeTriage.notify_earth ? 'text-coral' : 'text-leaf-deep'
              }`}
            >
              {activeTriage.notify_earth
                ? 'Action Required — Transmitting Dossier'
                : 'Local Autonomous Management'}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-outline">
          <p className="text-xs text-ink-muted font-body">
            {isSyncPending
              ? 'Syncing debounced rate update to Appwrite Cloud...'
              : lastInjectedTime
              ? `Last telemetry packet broadcast at ${lastInjectedTime}`
              : 'Ready to broadcast live suit telemetry via Appwrite Realtime.'}
          </p>

          <BigFriendlyButton
            onClick={handleManualInject}
            variant="primary"
            className="w-full sm:w-auto"
          >
            <Send className="w-5 h-5 mr-2" />
            <span>Broadcast Instant Telemetry Packet</span>
          </BigFriendlyButton>
        </div>
      </div>
    </div>
  );
};
