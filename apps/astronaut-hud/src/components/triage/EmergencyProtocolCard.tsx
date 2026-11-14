import React, { useEffect, useState } from 'react';
import type { TriageDiagnosisOutput } from '@aura/medical-engine';
import {
  AnswerTile,
  BigFriendlyButton,
  HelpBubble,
  HudCard,
  ReadingPassage,
  StatusBadge,
} from '@aura/ui-kit';
import {
  BookOpen,
  Check,
  FileText,
  Loader2,
  Radio,
  ShieldCheck,
} from 'lucide-react';
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

  const alertSignature = `${(activeAlert as any)?.$id || ''}_${activeAlert?.diagnosis_code || 'nominal'}`;
  useEffect(() => {
    setCompletedSteps({});
    setTransmissionSuccess(null);
  }, [alertSignature]);

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
      const diagnosisOutput: TriageDiagnosisOutput = {
        affected_system: activeAlert.affected_system,
        severity: activeAlert.severity,
        diagnosis_code: activeAlert.diagnosis_code,
        diagnosis_title: activeAlert.diagnosis_title,
        simple_explanation: activeAlert.simple_explanation,
        action_protocol: activeAlert.action_protocol,
        guide_file_id: activeAlert.guide_file_id || null,
        notify_earth: activeAlert.notify_earth,
        metric_evaluations: (activeAlert as any).metric_evaluations,
        $id: (activeAlert as any).$id,
      };

      const res = await transmitDossierToEarth(profile, currentVital, diagnosisOutput);
      setTransmissionSuccess(`Enqueued to DTN (${res.transmissionId}) and downloaded`);
    } catch (err) {
      console.error('Failed to transmit dossier', err);
    } finally {
      setIsTransmitting(false);
    }
  };

  // Compact calm status strip when nominal
  if (
    !activeAlert ||
    activeAlert.severity === 'green' ||
    activeAlert.affected_system === 'nominal'
  ) {
    return (
      <div className="w-full rounded-card bg-surface-elevated border border-leaf/40 px-5 py-3.5 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-btn bg-leaf-soft text-leaf-deep flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge severity="green" label="ALL SYSTEMS NOMINAL" size="sm" />
              <span className="font-mono text-xs text-ink-muted">
                Baseline Sync: {profile.missionPhase.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-ink-muted text-xs sm:text-sm font-body mt-0.5 truncate">
              All biometric and cabin parameters sit within phase-adjusted personal bounds.
            </p>
          </div>
        </div>

        <span className="text-xs px-3 py-1 rounded-pill bg-surface-sunken border border-outline text-ink-muted font-mono font-medium shrink-0">
          Autonomous Monitor Active
        </span>
      </div>
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
          ? 'border-coral bg-coral-soft/20'
          : 'border-sun bg-sun-bright/15'
      }`}
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <StatusBadge
              severity={activeAlert.severity}
              label={
                activeAlert.severity === 'red'
                  ? 'CLINICAL ACTION REQUIRED'
                  : 'CLINICAL CAUTION ADVISORY'
              }
              size="md"
            />
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-pill bg-ink text-white">
              {activeAlert.diagnosis_code}
            </span>
            <span className="text-xs font-body font-semibold px-2.5 py-0.5 rounded-pill bg-surface-elevated text-ink border border-outline capitalize">
              Target: {activeAlert.affected_system}
            </span>
          </div>
          <h2 className="text-xl font-display font-bold text-ink">
            {activeAlert.diagnosis_title}
          </h2>
        </div>

        {activeAlert.notify_earth && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-coral-soft border border-coral text-ink rounded-pill text-xs font-bold font-mono">
            <Radio className="w-3.5 h-3.5 text-coral" />
            <span>EARTH DTN PACKET QUEUED</span>
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
      <div className="mb-5">
        <HelpBubble title={`Space Adaptation Context · ${profile.missionPhase.replace(/_/g, ' ')}`}>
          <p className="text-xs text-sky-deep font-body leading-relaxed">
            During <strong className="font-semibold">{profile.missionPhase.replace(/_/g, ' ')}</strong>,
            fluid redistribution, circadian shift, and microgravity unloading shift physiological setpoints.
            AURA evaluates personal Z-score envelopes (μ ± 2σ) to separate expected adaptation from acute pathology.
          </p>
        </HelpBubble>
      </div>

      {/* Interactive Action Steps Checklist */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-bold text-sm text-ink">
            Prescribed Autonomous Clinical Protocol
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
                sublabel={isDone ? 'Verified and executed' : 'Select to confirm step execution'}
                state={isDone ? 'correct' : 'idle'}
                explanation={`Clinical rationale for Step ${index + 1}: Performing this step restores physiological stability autonomously without waiting for Earth ground-loop latency.`}
                onSelect={() => handleStepToggle(index)}
              />
            );
          })}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-outline">
        <div className="flex flex-wrap items-center gap-3">
          {activeAlert.guide_file_id && (
            <BigFriendlyButton
              variant="secondary"
              onClick={() => openVisualGuide(activeAlert.guide_file_id!)}
              className="!min-h-[52px] !py-2.5 !px-5 text-sm inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Open Visual Procedure Guide</span>
            </BigFriendlyButton>
          )}

          <BigFriendlyButton
            variant="primary"
            onClick={handleTransmitPdf}
            disabled={isTransmitting}
            className="!min-h-[52px] !py-2.5 !px-5 text-sm inline-flex items-center gap-2"
          >
            {isTransmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating Dossier...</span>
              </>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Download &amp; Send Clinical PDF</span>
              </>
            )}
          </BigFriendlyButton>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {transmissionSuccess && (
            <span className="text-xs font-mono text-leaf-deep font-semibold inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {transmissionSuccess}
            </span>
          )}

          <BigFriendlyButton
            variant={allStepsDone ? 'primary' : 'secondary'}
            onClick={() => resolveActiveAlert()}
            className="!min-h-[52px] !py-2.5 !px-5 text-sm inline-flex items-center gap-2"
          >
            {allStepsDone && <Check className="w-4 h-4" />}
            <span>{allStepsDone ? 'Protocol Complete — Resolve Advisory' : 'Dismiss Advisory'}</span>
          </BigFriendlyButton>
        </div>
      </div>
    </HudCard>
  );
};
