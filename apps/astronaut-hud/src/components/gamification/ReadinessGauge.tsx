import React, { useState } from 'react';
import { HudCard, ReadinessScoreCard, StatusBadge } from '@aura/ui-kit';
import { useMedicalStore } from '../../store/useMedicalStore';

export const ReadinessGauge: React.FC = () => {
  const readiness = useMedicalStore((s) => s.readiness);
  const dailyMissions = useMedicalStore((s) => s.dailyMissions);
  const activeAlert = useMedicalStore((s) => s.activeAlert);

  const [showFullScoreCard, setShowFullScoreCard] = useState(false);

  const score = Math.round(readiness.missionReadiness ?? (readiness as any).totalScore ?? 85);
  const status = readiness.status;

  const completedCount = dailyMissions.filter((m) => m.is_completed).length;
  const totalCount = dailyMissions.length;

  // Circular gauge calculations
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const gaugeColor =
    score >= 85 ? '#22C55E' : score >= 65 ? '#FBBF24' : '#F87171';

  const nominalItems = [
    `Vitals Evaluation Score: ${readiness.vitalsScore} / 50 pts`,
    `Countermeasures: ${completedCount} / ${totalCount} completed (${readiness.countermeasuresScore} / 30 pts)`,
    `Sleep & Rest Score: ${readiness.sleepMoodScore} / 20 pts`,
  ];

  const reviewItems = [];
  if (activeAlert) {
    reviewItems.push(`Active Clinical Advisory: ${activeAlert.diagnosis_title}`);
  }
  const incomplete = dailyMissions.filter((m) => !m.is_completed);
  for (const m of incomplete) {
    reviewItems.push(`Incomplete: ${m.task_title}`);
  }
  if (reviewItems.length === 0) {
    reviewItems.push('All daily operational countermeasure requirements satisfied.');
  }

  return (
    <div className="w-full">
      <HudCard padding="20px" className="flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-base text-ink">
              Mission Readiness Index
            </h3>
            <p className="text-xs text-ink-muted">50% Vitals + 30% Tasks + 20% Sleep/Mood</p>
          </div>
          <StatusBadge
            severity={score >= 85 ? 'green' : score >= 65 ? 'yellow' : 'red'}
            label={status.replace(/_/g, ' ')}
            size="sm"
          />
        </div>

        {/* Circular Dial & Breakdown Row */}
        <div className="flex items-center justify-around gap-4 py-2">
          {/* Circular SVG Gauge */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 130 130">
              {/* Track */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke="#e2e8f0"
                strokeWidth="10"
                fill="none"
              />
              {/* Animated Progress Fill */}
              <circle
                cx="65"
                cy="65"
                r={radius}
                stroke={gaugeColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                style={{ transition: 'stroke-dashoffset 600ms ease-out' }}
              />
            </svg>

            {/* Score in Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-extrabold text-3xl text-ink tracking-tight">
                {score}
              </span>
              <span className="font-mono text-[10px] text-ink-muted uppercase">/ 100 PTS</span>
            </div>
          </div>

          {/* Points Breakdown Pills */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex justify-between items-center text-xs p-2 rounded-btn bg-surface border border-outline">
              <span className="text-ink font-body">Biometric Vitals</span>
              <span className="font-mono font-bold text-ink">{readiness.vitalsScore} / 50</span>
            </div>
            <div className="flex justify-between items-center text-xs p-2 rounded-btn bg-surface border border-outline">
              <span className="text-ink font-body">Daily Countermeasures</span>
              <span className="font-mono font-bold text-ink">{readiness.countermeasuresScore} / 30</span>
            </div>
            <div className="flex justify-between items-center text-xs p-2 rounded-btn bg-surface border border-outline">
              <span className="text-ink font-body">Circadian Sleep &amp; Mood</span>
              <span className="font-mono font-bold text-ink">{readiness.sleepMoodScore} / 20</span>
            </div>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="mt-3 pt-2 border-t border-outline/50 flex justify-end">
          <button
            onClick={() => setShowFullScoreCard(!showFullScoreCard)}
            className="text-xs text-sky font-semibold hover:text-sky-deep font-body transition-colors"
          >
            {showFullScoreCard ? 'Hide Detailed Breakdown ▲' : 'View Full Mission Score Card ▼'}
          </button>
        </div>
      </HudCard>

      {/* Expanded Skylearn Quiz Score Card */}
      {showFullScoreCard && (
        <div className="mt-4">
          <ReadinessScoreCard
            score={score}
            statusClassification={status}
            nominalItems={nominalItems}
            reviewItems={reviewItems}
            onContinue={() => setShowFullScoreCard(false)}
            continueLabel="Collapse Breakdown"
          />
        </div>
      )}
    </div>
  );
};
