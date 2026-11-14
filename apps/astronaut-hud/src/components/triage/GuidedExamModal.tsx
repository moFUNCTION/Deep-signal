import React, { useEffect, useState } from 'react';
import {
  Activity,
  Check,
  Clock,
  Droplets,
  Dumbbell,
  MapPin,
  Shield,
  Wind,
  X,
} from 'lucide-react';
import { DB_CONFIG, storage } from '@aura/appwrite-client';
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

function renderGuideDiagram(fileId: string) {
  switch (fileId) {
    case 'guide_co2_airflow_check':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-soft text-sky-deep flex items-center justify-center">
            <Wind className="w-7 h-7" />
          </div>
          <p className="font-display font-bold text-ink text-sm">
            Personal Ventilation Fan (PVF) &amp; CDRA Airflow Alignment
          </p>
          <p className="font-body text-xs text-ink-muted max-w-md">
            Translate 2m from work envelope, aim high-velocity PVF nozzle 45 degrees across facial zone, and verify green CDRA scrubber lock.
          </p>
        </div>
      );
    case 'guide_zero_g_bp_cuff':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-coral-soft text-ink flex items-center justify-center">
            <Shield className="w-7 h-7 text-coral" />
          </div>
          <p className="font-display font-bold text-ink text-sm">
            Storm Shelter Entry &amp; Zero-G Brachial Cuff Calibration
          </p>
          <p className="font-body text-xs text-ink-muted max-w-md">
            Relocate inside polyethylene water-wall shelter, secure AstroRad torso shielding, and align brachial cuff level with right atrium.
          </p>
        </div>
      );
    case 'guide_hydration_electrolyte':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-soft text-sky-deep flex items-center justify-center">
            <Droplets className="w-7 h-7" />
          </div>
          <p className="font-display font-bold text-ink text-sm">
            Galley PWD Electrolyte Reconstitution Schematic
          </p>
          <p className="font-body text-xs text-ink-muted max-w-md">
            Couple oral rehydration pouch to the ambient water septum, dispense 400 mL, mix for 20s, and ingest over 10 minutes.
          </p>
        </div>
      );
    case 'guide_ared_resistive_load':
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sun-bright/30 text-sun-deep flex items-center justify-center">
            <Dumbbell className="w-7 h-7" />
          </div>
          <p className="font-display font-bold text-ink text-sm">
            ARED Vacuum Cylinder &amp; Harness Load Setup
          </p>
          <p className="font-body text-xs text-ink-muted max-w-md">
            Calibrate vacuum cylinders to 75% Earth body-weight equivalent before commencing squats and heel-raise sets.
          </p>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-2xl bg-sky-soft text-sky-deep flex items-center justify-center">
            <Activity className="w-7 h-7" />
          </div>
          <p className="font-display font-bold text-ink text-sm">
            Zero-G Capillary Surface-Tension &amp; Sensor Protocol
          </p>
          <p className="font-body text-xs text-ink-muted max-w-md">
            Allow alcohol wipe to flash-evaporate before puncture so capillary bead stays cohesive in microgravity.
          </p>
        </div>
      );
  }
}

export const GuidedExamModal: React.FC = () => {
  const isExamModalOpen = useMedicalStore((s) => s.isExamModalOpen);
  const activeGuideId = useMedicalStore((s) => s.activeGuideId);
  const closeVisualGuide = useMedicalStore((s) => s.closeVisualGuide);

  const [calibrated, setCalibrated] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [remotePreviewFailed, setRemotePreviewFailed] = useState(false);

  useEffect(() => {
    setCalibrated(false);
    setCompletedSteps({});
    setRemotePreviewFailed(false);
  }, [activeGuideId, isExamModalOpen]);

  if (!isExamModalOpen) return null;

  const defaultGuide: VisualGuideMetadata = {
    fileId: 'guide_default',
    title: 'Standard Spaceflight Physiological Assessment Protocol',
    durationSec: 45,
    equipmentLocation: 'Crew Medical Restraint System (CMRS) - Locker M1',
    fallbackSteps: [
      'Confirm physical sensor contact on chest strap and optical finger clip.',
      'Calibrate zero-gravity receiver on Local AURA Hub.',
      'Record steady baseline telemetry reading for 30 seconds.',
    ],
  };

  const guide: VisualGuideMetadata =
    (activeGuideId && STORAGE_VISUAL_GUIDES[activeGuideId]) || defaultGuide;

  const cloudImageUrl =
    DB_CONFIG.IS_CONFIGURED && !remotePreviewFailed
      ? (() => {
          try {
            return String(storage.getFileView(DB_CONFIG.BUCKETS.MEDICAL_GUIDES, guide.fileId));
          } catch {
            return null;
          }
        })()
      : null;

  const handleStepToggle = (index: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const allCompleted =
    calibrated && guide.fallbackSteps.every((_, idx) => completedSteps[idx]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-exam-title"
    >
      <div className="relative w-full max-w-2xl bg-surface-elevated rounded-modal border border-outline shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-surface border-b border-outline flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <StatusBadge severity="green" label="VISUAL PROCEDURE GUIDE" size="sm" />
              <span className="inline-flex items-center gap-1 text-xs font-mono font-semibold text-ink-muted">
                <Clock className="w-3.5 h-3.5" />
                {guide.durationSec}s est.
              </span>
            </div>
            <h2 id="guided-exam-title" className="text-xl font-display font-bold text-ink">
              {guide.title}
            </h2>
            <p className="text-xs text-ink-muted font-body mt-1 inline-flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-deep shrink-0" />
              <span>
                Stowage Location: <strong className="text-ink">{guide.equipmentLocation}</strong>
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={closeVisualGuide}
            className="w-10 h-10 rounded-full bg-surface-sunken hover:bg-outline text-ink-muted hover:text-ink flex items-center justify-center transition-colors shrink-0"
            aria-label="Close visual guide modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Storage Visual or Clean Local Fallback Schematic */}
          <div className="p-5 rounded-card bg-surface border border-outline">
            {cloudImageUrl ? (
              <img
                src={cloudImageUrl}
                alt={guide.title}
                onError={() => setRemotePreviewFailed(true)}
                className="w-full max-h-56 object-contain rounded-btn mx-auto"
              />
            ) : (
              renderGuideDiagram(guide.fileId)
            )}
          </div>

          {/* Step 1: Hardware Calibration */}
          <div>
            <h3 className="font-display font-bold text-sm text-ink mb-2">
              1. Hardware Alignment &amp; Sensor Verification
            </h3>
            <DragAndDropZone
              prompt={
                calibrated
                  ? 'Equipment Verified & Calibrated'
                  : 'Drag Diagnostic Capsule Here or Tap to Confirm Calibration'
              }
              helperText="Verifies physical lock & seal in microgravity before sampling"
              isOccupied={calibrated}
              onDropAccepted={() => setCalibrated(true)}
              onClick={() => setCalibrated((prev) => !prev)}
            />
          </div>

          {/* Step 2: Procedure Steps */}
          <div>
            <h3 className="font-display font-bold text-sm text-ink mb-2">
              2. Execution Checklist
            </h3>
            <div className="space-y-2">
              {guide.fallbackSteps.map((step, idx) => {
                const isChecked = !!completedSteps[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStepToggle(idx)}
                    className={`w-full text-left p-3.5 rounded-btn border transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-leaf-soft/45 border-leaf text-ink'
                        : 'bg-surface hover:bg-surface-sunken border-outline text-ink-muted'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                        isChecked
                          ? 'bg-leaf border-leaf text-white'
                          : 'bg-surface-elevated border-outline text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                    <p className={`text-sm font-body ${isChecked ? 'text-ink font-semibold' : 'text-ink'}`}>
                      {idx + 1}. {step}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-surface border-t border-outline flex items-center justify-between gap-4">
          <p className="text-xs text-ink-muted font-body">
            {allCompleted
              ? 'All procedure checks validated'
              : 'Confirm hardware calibration and complete steps above'}
          </p>

          <div className="flex items-center gap-2">
            <BigFriendlyButton
              variant="secondary"
              onClick={closeVisualGuide}
              className="!min-h-[48px] !py-2 !px-4 text-xs"
            >
              Close
            </BigFriendlyButton>

            <BigFriendlyButton
              variant="primary"
              onClick={closeVisualGuide}
              className="!min-h-[48px] !py-2 !px-5 text-xs inline-flex items-center gap-1.5"
            >
              {allCompleted && <Check className="w-4 h-4" />}
              <span>{allCompleted ? 'Procedure Complete' : 'Done'}</span>
            </BigFriendlyButton>
          </div>
        </div>
      </div>
    </div>
  );
};
