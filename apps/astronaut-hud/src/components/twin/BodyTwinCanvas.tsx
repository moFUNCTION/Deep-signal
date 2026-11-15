import React, { useEffect, useMemo, useState } from 'react';
import Body, { type ExtendedBodyPart, type Slug } from '@mjcdev/react-body-highlighter';
import {
  Activity,
  Brain,
  Dumbbell,
  Flame,
  HeartPulse,
  RotateCcw,
} from 'lucide-react';
import {
  evaluateAllMetrics,
  type AnatomicalSystem,
  type MetricKey,
  type SeverityLevel,
} from '@aura/medical-engine';
import { StatusBadge, useAccessibility } from '@aura/ui-kit';
import { useAuthStore } from '../../store/useAuthStore';
import { useMedicalStore } from '../../store/useMedicalStore';

interface BodyTwinCanvasProps {
  selectedSystem: AnatomicalSystem | 'all' | null;
  activeAlertSeverity?: SeverityLevel;
  activeAlertSystem?: AnatomicalSystem;
  onSelectSystem: (system: AnatomicalSystem | 'all' | null) => void;
}

type CoreOrganSystem = Exclude<AnatomicalSystem, 'nominal'>;

const SYSTEM_SLUGS: Record<CoreOrganSystem, Slug[]> = {
  nervous: ['head', 'neck'],
  cardiovascular: ['chest', 'upper-back'],
  metabolic: ['abs', 'obliques'],
  musculoskeletal: [
    'deltoids',
    'biceps',
    'triceps',
    'forearm',
    'trapezius',
    'lower-back',
    'gluteal',
    'quadriceps',
    'hamstring',
    'adductors',
    'calves',
    'tibialis',
  ],
};

const SLUG_TO_SYSTEM: Partial<Record<Slug, CoreOrganSystem>> = Object.entries(
  SYSTEM_SLUGS,
).reduce<Partial<Record<Slug, CoreOrganSystem>>>((acc, [system, slugs]) => {
  slugs.forEach((slug) => {
    acc[slug] = system as CoreOrganSystem;
  });
  return acc;
}, {});

interface SystemMeta {
  id: CoreOrganSystem;
  label: string;
  regionLabel: string;
  metrics: MetricKey[];
  icon: React.FC<{ className?: string }>;
}

const SYSTEMS_META: SystemMeta[] = [
  {
    id: 'nervous',
    label: 'Nervous System',
    regionLabel: 'Cerebral / Vestibular',
    metrics: ['cabin_co2_mmhg', 'spo2'],
    icon: Brain,
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular',
    regionLabel: 'Thorax / Vascular',
    metrics: ['heart_rate', 'bp_systolic', 'cabin_radiation_msv'],
    icon: HeartPulse,
  },
  {
    id: 'metabolic',
    label: 'Metabolic',
    regionLabel: 'Abdominal / Glycemic',
    metrics: ['blood_glucose', 'body_temp'],
    icon: Flame,
  },
  {
    id: 'musculoskeletal',
    label: 'Musculoskeletal',
    regionLabel: 'Extremities / Spine',
    metrics: ['bp_diastolic'],
    icon: Dumbbell,
  },
];

export const BodyTwinCanvas: React.FC<BodyTwinCanvasProps> = ({
  selectedSystem,
  activeAlertSeverity = 'green',
  activeAlertSystem,
  onSelectSystem,
}) => {
  const { highContrast, isSurgeonMode } = useAccessibility();
  const profile = useAuthStore((s) => s.profile);
  const currentVital = useMedicalStore((s) => s.currentVital);
  const dailyMissions = useMedicalStore((s) => s.dailyMissions);
  const setSelectedMetric = useMedicalStore((s) => s.setSelectedMetric);

  const [viewSide, setViewSide] = useState<'both' | 'front' | 'back'>('both');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [isCompactViewport, setIsCompactViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsCompactViewport(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const bodyScale = isCompactViewport
    ? viewSide === 'both'
      ? 0.68
      : 0.92
    : viewSide === 'both'
    ? 0.92
    : 1.15;

  const evals = useMemo(
    () =>
      evaluateAllMetrics(
        currentVital,
        profile.earthBaselines,
        currentVital.mission_phase || profile.missionPhase,
      ),
    [currentVital, profile.earthBaselines, profile.missionPhase],
  );

  const focusedSystem: CoreOrganSystem | null =
    selectedSystem && selectedSystem !== 'all' && selectedSystem !== 'nominal'
      ? selectedSystem
      : activeAlertSystem && activeAlertSystem !== 'nominal'
      ? activeAlertSystem
      : null;

  // Determine severity per system from active alert + per-metric evaluations + missed ARED
  const systemSeverity = useMemo(() => {
    const worstMetricSeverity = (keys: MetricKey[]): SeverityLevel => {
      let level: SeverityLevel = 'green';
      for (const k of keys) {
        const s = evals[k]?.severity;
        if (s === 'red') return 'red';
        if (s === 'yellow') level = 'yellow';
      }
      return level;
    };

    const aredMissed = dailyMissions.some(
      (m) => m.task_code === 'ARED_WORKOUT' && !m.is_completed,
    );

    const map: Record<CoreOrganSystem, SeverityLevel> = {
      nervous: worstMetricSeverity(['cabin_co2_mmhg', 'spo2']),
      cardiovascular: worstMetricSeverity([
        'heart_rate',
        'bp_systolic',
        'bp_diastolic',
        'cabin_radiation_msv',
      ]),
      metabolic: worstMetricSeverity(['blood_glucose', 'body_temp']),
      musculoskeletal: aredMissed ? 'yellow' : 'green',
    };

    if (
      activeAlertSystem &&
      activeAlertSystem !== 'nominal' &&
      activeAlertSeverity !== 'green'
    ) {
      map[activeAlertSystem] = activeAlertSeverity;
    }

    return map;
  }, [evals, dailyMissions, activeAlertSystem, activeAlertSeverity]);

  // Intensity ramp: 1 = resting slate tint, 2 = active selected sky blue, 3 = caution amber, 4 = critical coral
  const highlightColors = useMemo(
    () =>
      highContrast
        ? (['#CBD5E1', '#1D4ED8', '#D97706', '#B91C1C'] as const)
        : (['#DBEAFE', '#3B82F6', '#FBBF24', '#F87171'] as const),
    [highContrast],
  );

  const bodyData: ExtendedBodyPart[] = useMemo(() => {
    const parts: ExtendedBodyPart[] = [];
    (Object.keys(SYSTEM_SLUGS) as CoreOrganSystem[]).forEach((sys) => {
      const sev = systemSeverity[sys];
      const isFocused = focusedSystem === sys;

      let intensity = 1;
      if (sev === 'red') intensity = 4;
      else if (sev === 'yellow') intensity = 3;
      else if (isFocused) intensity = 2;

      SYSTEM_SLUGS[sys].forEach((slug) => {
        parts.push({ slug, intensity });
      });
    });
    return parts;
  }, [systemSeverity, focusedSystem]);

  const handleBodyPartClick = (part: ExtendedBodyPart) => {
    if (!part.slug) return;
    const mapped = SLUG_TO_SYSTEM[part.slug];
    if (!mapped) return;

    const next = selectedSystem === mapped ? null : mapped;
    onSelectSystem(next);

    const sysMeta = SYSTEMS_META.find((m) => m.id === mapped);
    if (next && sysMeta?.metrics[0]) {
      setSelectedMetric(sysMeta.metrics[0]);
    }
  };

  const handleSelectSystemCard = (sys: SystemMeta) => {
    const next = selectedSystem === sys.id ? null : sys.id;
    onSelectSystem(next);
    if (next && sys.metrics[0]) {
      setSelectedMetric(sys.metrics[0]);
    }
  };

  const inspectedMeta = focusedSystem
    ? SYSTEMS_META.find((s) => s.id === focusedSystem)
    : null;

  return (
    <div className="w-full h-full bg-surface-elevated border border-outline rounded-card shadow-card flex flex-col overflow-hidden">
      {/* Header Toolbar */}
      <div className="px-5 py-4 border-b border-outline flex flex-wrap items-center justify-between gap-3 bg-surface/60">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sky" />
            <h2 className="font-display font-bold text-base text-ink">
              Anatomical Health Twin
            </h2>
          </div>
          <p className="text-xs text-ink-muted font-body mt-0.5">
            {inspectedMeta
              ? `Inspecting ${inspectedMeta.label} (${inspectedMeta.regionLabel})`
              : 'Select any body region or organ system to inspect localized baselines'}
          </p>
        </div>

        {/* Clean Controls: Orientation + Model + Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="inline-flex items-center rounded-input bg-surface-sunken p-0.5 border border-outline text-xs font-body"
            role="group"
            aria-label="Body diagram view orientation"
          >
            {(['both', 'front', 'back'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewSide(mode)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  viewSide === mode
                    ? 'bg-surface-elevated text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {mode === 'both' ? 'Dual' : mode}
              </button>
            ))}
          </div>

          <div
            className="inline-flex items-center rounded-input bg-surface-sunken p-0.5 border border-outline text-xs font-body"
            role="group"
            aria-label="Anatomical model variant"
          >
            {(['male', 'female'] as const).map((variant) => (
              <button
                key={variant}
                type="button"
                onClick={() => setGender(variant)}
                className={`px-2.5 py-1 rounded-lg font-semibold capitalize transition-colors ${
                  gender === variant
                    ? 'bg-surface-elevated text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {variant === 'male' ? 'M' : 'F'}
              </button>
            ))}
          </div>

          {selectedSystem && (
            <button
              type="button"
              onClick={() => onSelectSystem(null)}
              className="px-2.5 py-1 rounded-input text-xs font-semibold text-ink-muted hover:text-ink bg-surface border border-outline flex items-center gap-1 transition-colors"
              title="Clear region filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Anatomical Visualizer (@mjcdev/react-body-highlighter) */}
      <div className="flex-1 px-2.5 sm:px-4 py-3 sm:py-4 bg-surface/30 flex flex-col items-center justify-center min-h-[260px] sm:min-h-[300px] overflow-hidden">
        <div
          className={`w-full flex items-center justify-center gap-2 sm:gap-8 ${
            viewSide === 'both' ? 'flex-row flex-wrap sm:flex-nowrap' : 'flex-col'
          }`}
        >
          {(viewSide === 'both' || viewSide === 'front') && (
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-subtle mb-1">
                Anterior (Front)
              </span>
              <div className="cursor-pointer select-none">
                <Body
                  data={bodyData}
                  gender={gender}
                  side="front"
                  scale={bodyScale}
                  border={highContrast ? '#0F172A' : '#CBD5E1'}
                  colors={highlightColors}
                  onBodyPartClick={handleBodyPartClick}
                />
              </div>
            </div>
          )}

          {(viewSide === 'both' || viewSide === 'back') && (
            <div className="flex flex-col items-center">
              <span className="text-[11px] font-mono uppercase tracking-wider text-ink-subtle mb-1">
                Posterior (Back)
              </span>
              <div className="cursor-pointer select-none">
                <Body
                  data={bodyData}
                  gender={gender}
                  side="back"
                  scale={bodyScale}
                  border={highContrast ? '#0F172A' : '#CBD5E1'}
                  colors={highlightColors}
                  onBodyPartClick={handleBodyPartClick}
                />
              </div>
            </div>
          )}
        </div>

        {/* Semantic Legend */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-[11px] font-body text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#DBEAFE] border border-sky/40" />
            Nominal
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky" />
            Selected Focus
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sun" />
            Caution Deviation
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-coral" />
            Critical Action
          </span>
        </div>
      </div>

      {/* Focused System Live Summary (when system focused or alerted) */}
      {inspectedMeta && (
        <div className="px-5 py-3 bg-sky-soft/35 border-t border-outline flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <inspectedMeta.icon className="w-4 h-4 text-sky-deep" />
            <span className="font-display font-bold text-ink">
              {inspectedMeta.label} Telemetry:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 font-mono">
            {inspectedMeta.metrics.map((mKey) => {
              const ev = evals[mKey];
              if (!ev) return null;
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setSelectedMetric(mKey)}
                  className="px-2 py-0.5 rounded-pill bg-surface-elevated border border-outline hover:border-sky text-ink transition-colors"
                >
                  {mKey.replace(/_/g, ' ')}: <strong>{ev.currentValue}</strong>
                  {isSurgeonMode ? ` (${ev.zScore.toFixed(1)}σ)` : ''}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Interactive System Selector Cards */}
      <div className="p-3 sm:p-4 border-t border-outline bg-surface-elevated grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SYSTEMS_META.map((sys) => {
          const Icon = sys.icon;
          const sev = systemSeverity[sys.id];
          const isSelected = selectedSystem === sys.id;
          const isAffected = focusedSystem === sys.id && sev !== 'green';

          return (
            <button
              key={sys.id}
              type="button"
              onClick={() => handleSelectSystemCard(sys)}
              className={`min-h-[56px] px-3 py-2.5 rounded-btn text-left border transition-all flex items-center justify-between gap-2 ${
                sev === 'red'
                  ? 'bg-coral-soft/45 border-coral text-ink'
                  : sev === 'yellow'
                  ? 'bg-sun-bright/20 border-sun text-ink'
                  : isSelected
                  ? 'bg-sky-soft/50 border-sky text-ink shadow-sm'
                  : 'bg-surface hover:bg-surface-sunken border-outline text-ink'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    sev === 'red'
                      ? 'bg-coral text-white'
                      : sev === 'yellow'
                      ? 'bg-sun text-ink'
                      : isSelected
                      ? 'bg-sky text-white'
                      : 'bg-surface-sunken text-ink-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-body font-bold text-xs text-ink leading-tight">
                    {sys.label}
                  </div>
                  <div className="font-mono text-[10px] text-ink-muted leading-tight mt-0.5">
                    {sys.regionLabel}
                  </div>
                </div>
              </div>

              <StatusBadge
                severity={sev}
                label={sev === 'green' ? 'OK' : sev === 'yellow' ? 'ATTN' : 'CRIT'}
                size="sm"
                showIcon={isAffected}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
