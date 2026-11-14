import React, { useState } from 'react';
import {
  STORAGE_VISUAL_GUIDES,
  type VisualGuideMetadata,
} from '@aura/medical-engine';
import {
  BigFriendlyButton,
  DragAndDropZone,
  StatusBadge,
} from '@aura/ui-kit';
import { useMedicalStore } from '../../store/useMedicalStore';

export const GuidedExamModal: React.FC = () => {
  const isExamModalOpen = useMedicalStore((s) => s.isExamModalOpen);
  const activeGuideId = useMedicalStore((s) => s.activeGuideId);
  const closeVisualGuide = useMedicalStore((s) => s.closeVisualGuide);

  const [calibrated, setCalibrated] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  if (!isExamModalOpen) return null;

  const defaultGuide: VisualGuideMetadata = {
    fileId: 'guide_default',
    title: 'Standard Spaceflight Physiological Assessment Protocol',
    durationSec: 45,
    equipmentLocation: 'Crew Medical Restraint System (CMRS) - Locker M1',
    fallbackSteps: [
      'Confirm physical sensor attachment on chest and finger cuff.',
      'Calibrate zero-gravity biometric receiver on Local AURA Hub.',
      'Record steady baseline telemetry reading for 30 seconds.',
    ],
  };

  const guide: VisualGuideMetadata =
    (activeGuideId && STORAGE_VISUAL_GUIDES[activeGuideId]) || defaultGuide;

  const handleStepToggle = (index: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const allCompleted =
    calibrated && guide.fallbackSteps.every((_, idx) => completedSteps[idx]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-modal border-2 border-sky-bright shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-surface border-b border-outline flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusBadge severity="green" label="INTERACTIVE VISUAL GUIDE" size="sm" />
              <span className="text-xs font-mono font-semibold text-ink-muted">
                Est. Duration: {guide.durationSec}s
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-ink">{guide.title}</h2>
            <p className="text-xs text-ink-muted font-body mt-1">
              📍 Location: <strong className="text-ink">{guide.equipmentLocation}</strong>
            </p>
          </div>

          <button
            onClick={closeVisualGuide}
            className="w-10 h-10 rounded-full bg-surface-sunken hover:bg-outline text-ink-muted hover:text-ink flex items-center justify-center text-lg font-bold transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Visual Equipment Schematic Diagram */}
          <div className="p-4 rounded-card bg-slate-900 border border-slate-800 text-white flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-3xl mb-2 animate-pulse">
              ⚙️
            </div>
            <p className="font-display font-bold text-cyan-300 text-sm">
              Hardware Alignment &amp; Zero-G Deployment Schematic
            </p>
            <p className="font-mono text-xs text-slate-400 mt-1 max-w-md">
              Secure magnetic tether to locker frame before releasing pressurized diagnostic seals.
            </p>
          </div>

          {/* Interactive Calibration Drag & Drop Zone */}
          <div>
            <h3 className="font-display font-bold text-sm text-ink mb-2">
              Step 1: Equipment Verification &amp; Sensor Calibration
            </h3>
            <DragAndDropZone
              prompt={
                calibrated
                  ? '✓ Equipment Verified & Sensor Calibrated'
                  : 'Drag Diagnostic Capsule Here or Tap to Calibrate'
              }
              helperText="Confirms secure sensor connection in microgravity"
              isOccupied={calibrated}
              onDropAccepted={() => setCalibrated(true)}
              onClick={() => setCalibrated(!calibrated)}
            />
          </div>

          {/* Step-by-Step Procedure Checklist */}
          <div>
            <h3 className="font-display font-bold text-sm text-ink mb-2">
              Step 2: Fallback Action Steps
            </h3>
            <div className="space-y-2">
              {guide.fallbackSteps.map((step, idx) => {
                const isChecked = !!completedSteps[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => handleStepToggle(idx)}
                    className={`p-3.5 rounded-btn border transition-all cursor-pointer flex items-start gap-3 ${
                      isChecked
                        ? 'bg-leaf-soft/40 border-leaf text-ink'
                        : 'bg-surface hover:bg-surface-elevated border-outline text-ink-muted'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                        isChecked
                          ? 'bg-leaf border-leaf text-white'
                          : 'bg-white border-outline text-transparent'
                      }`}
                    >
                      ✓
                    </div>
                    <div>
                      <p className={`text-sm font-body ${isChecked ? 'text-ink font-semibold' : 'text-ink'}`}>
                        {idx + 1}. {step}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-surface border-t border-outline flex items-center justify-between gap-4">
          <p className="text-xs text-ink-muted font-body">
            {allCompleted ? 'All steps validated' : 'Complete calibration and steps to finalize'}
          </p>

          <div className="flex items-center gap-2">
            <BigFriendlyButton
              variant="secondary"
              onClick={closeVisualGuide}
              className="!min-h-[48px] !py-2 !px-4 text-xs"
            >
              Cancel
            </BigFriendlyButton>

            <BigFriendlyButton
              variant="primary"
              onClick={closeVisualGuide}
              className="!min-h-[48px] !py-2 !px-5 text-xs"
            >
              {allCompleted ? '✓ Protocol Complete' : 'Close Guide'}
            </BigFriendlyButton>
          </div>
        </div>
      </div>
    </div>
  );
};
