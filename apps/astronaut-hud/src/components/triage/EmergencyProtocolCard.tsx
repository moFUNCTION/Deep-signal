import React, { useState } from 'react';
import {
  HudCard,
  StatusBadge,
  ReadingPassage,
  AnswerTile,
  BigFriendlyButton,
  HelpBubble,
} from '@aura/ui-kit';
import { useAuthStore } from '../../store/useAuthStore';
import { useMedicalStore } from '../../store/useMedicalStore';
import { transmitDossierToEarth } from '../../services/PdfReportGenerator';

export const EmergencyProtocolCard: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const currentVital = useMedicalStore((s) => s.currentVital);
  const activeAlert = useMedicalStore((s) => s.activeAlert);
  const resolveActiveAlert = useMedicalStore((s) => s.resolveActiveAlert);
  const openVisualGuide = useMedicalStore((s) => s.openVisualGuide);

  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmissionSuccess, setTransmissionSuccess] = useState<string | null>(null);

  const handleStepToggle = (index: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleTransmitPdf = async () => {
    if (!activeAlert) return;
    setIsTransmitting(true);
    setTransmissionSuccess(null);
    try {
      const res = await transmitDossierToEarth(profile, currentVital, activeAlert);
      setTransmissionSuccess(`Enqueued to DTN (${res.transmissionId}) & Downloaded`);
    } catch (err) {
      console.error('Failed to transmit dossier', err);
    } finally {
      setIsTransmitting(false);
    }
  };

  // If no alert is present, render Nominal Calm Status
  if (!activeAlert || activeAlert.severity === 'green' || activeAlert.affected_system === 'nominal') {
    return (
      <HudCard padding="24px" className="border-leaf/30 bg-leaf-soft/10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge severity="green" label="ALL SYSTEMS NOMINAL" size="md" />
                <span className="font-mono text-xs text-ink-muted">
                  Baseline Sync: {profile.missionPhase}
                </span>
              </div>
              <p className="text-ink text-sm font-body">
                Biometric and environmental parameters are within safe operational bands. No active clinical
                protocols required.
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <span className="text-xs px-3 py-1.5 rounded-pill bg-white border border-outline text-ink-muted font-mono font-medium">
              Autonomous Monitor Active
            </span>
          </div>
        </div>
      </HudCard>
    );
  }

  const allStepsDone =
    activeAlert.action_protocol.length > 0 &&
    activeAlert.action_protocol.every((_, idx) => completedSteps[idx]);

  return (
    <HudCard
      padding="24px"
      className={`border-2 shadow-cardActive ${
        activeAlert.severity === 'red'
          ? 'border-coral bg-coral-soft/15'
          : 'border-sun bg-sun-bright/10'
      }`}
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <StatusBadge
              severity={activeAlert.severity}
              label={activeAlert.severity === 'red' ? 'CLINICAL ACTION REQUIRED' : 'CLINICAL CAUTION ADVISORY'}
              size="md"
            />
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-pill bg-slate-900 text-white">
              {activeAlert.diagnosis_code}
            </span>
            <span className="text-xs font-body font-semibold px-2 py-0.5 rounded-pill bg-white text-ink border border-outline capitalize">
              Target: {activeAlert.affected_system}
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-ink">
            {activeAlert.diagnosis_title}
          </h2>
        </div>

        {activeAlert.notify_earth && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-coral-soft border border-coral text-coral rounded-pill text-xs font-bold font-mono">
            <span>📡</span>
            <span>EARTH TELEMETRY ALERT</span>
          </div>
        )}
      </div>

      {/* Explanation with Accessible ReadingPassage & Speech Synthesis */}
      <div className="mb-4">
        <ReadingPassage
          title="Clinical Assessment & Plain-Language Summary"
          text={activeAlert.simple_explanation}
          showReadToMe={true}
          showReadingRuler={true}
        />
      </div>

      {/* Companion Space Context HelpBubble */}
      <div className="mb-6">
        <HelpBubble title={`Space Adaptation Context // ${profile.missionPhase.replace(/_/g, ' ')}`}>
          <p className="text-xs text-sky-deep font-body leading-relaxed">
            During <strong className="font-semibold">{profile.missionPhase}</strong>, fluid redistribution,
            circadian phase delay, and microgravity unloading shift baseline setpoints. AURA applies personal
            Z-score offsets ($\mu \pm 2\sigma$) to distinguish normal spaceflight adaptation from acute pathological events.
          </p>
        </HelpBubble>
      </div>

      {/* Interactive Action Steps Checklist using AnswerTiles */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-bold text-sm text-ink">
            Prescribed Autonomous Clinical Protocol Checklist
          </h3>
          <span className="text-xs text-ink-muted font-mono">
            {Object.values(completedSteps).filter(Boolean).length} / {activeAlert.action_protocol.length} Completed
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {activeAlert.action_protocol.map((stepText, index) => {
            const isDone = !!completedSteps[index];
            return (
              <AnswerTile
                key={index}
                label={`Step ${index + 1}: ${stepText}`}
                sublabel={isDone ? 'Verified and executed' : 'Tap to confirm step execution'}
                state={isDone ? 'correct' : 'idle'}
                explanation={`Clinical rationale for step ${index + 1}: Executing this standard countermeasure restores physiological homeostasis without waiting for Earth ground-loop communication.`}
                onSelect={() => handleStepToggle(index)}
              />
            );
          })}
        </div>
      </div>

      {/* CTAs and Transmission Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-outline/50">
        <div className="flex flex-wrap items-center gap-3">
          {activeAlert.guide_file_id && (
            <BigFriendlyButton
              variant="secondary"
              onClick={() => openVisualGuide(activeAlert.guide_file_id!)}
              className="!min-h-[56px] !py-3 !px-5 text-sm"
            >
              📖 Open Visual Procedure Guide
            </BigFriendlyButton>
          )}

          <BigFriendlyButton
            variant="primary"
            onClick={handleTransmitPdf}
            disabled={isTransmitting}
            className="!min-h-[56px] !py-3 !px-5 text-sm"
          >
            {isTransmitting ? '⏳ Generating Dossier...' : '📄 Transmit Clinical PDF to Earth'}
          </BigFriendlyButton>
        </div>

        <div className="flex items-center gap-3">
          {transmissionSuccess && (
            <span className="text-xs font-mono text-leaf-deep font-semibold">
              ✓ {transmissionSuccess}
            </span>
          )}

          <BigFriendlyButton
            variant={allStepsDone ? 'primary' : 'secondary'}
            onClick={() => resolveActiveAlert()}
            className="!min-h-[56px] !py-3 !px-5 text-sm"
          >
            {allStepsDone ? '✓ Protocol Complete — Dismiss Advisory' : 'Dismiss Advisory'}
          </BigFriendlyButton>
        </div>
      </div>
    </HudCard>
  );
};
