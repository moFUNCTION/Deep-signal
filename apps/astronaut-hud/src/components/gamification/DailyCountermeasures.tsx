import React, { useState, useEffect } from 'react';
import {
  HudCard,
  LessonCard,
  ProgressBar,
  StreakCounter,
  ConfettiCelebration,
} from '@aura/ui-kit';
import { useMedicalStore } from '../../store/useMedicalStore';

export const DailyCountermeasures: React.FC = () => {
  const dailyMissions = useMedicalStore((s) => s.dailyMissions);
  const toggleCountermeasure = useMedicalStore((s) => s.toggleCountermeasure);

  const [showConfetti, setShowConfetti] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const completedCount = dailyMissions.filter((m) => m.is_completed).length;
  const totalCount = dailyMissions.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const highestStreak = Math.max(...dailyMissions.map((m) => m.streak_days), 12);

  // Trigger confetti burst when 100% completion is reached
  useEffect(() => {
    if (completedCount === totalCount && totalCount > 0) {
      if (!hasCelebrated) {
        setShowConfetti(true);
        setHasCelebrated(true);
      }
    } else {
      setHasCelebrated(false);
    }
  }, [completedCount, totalCount, hasCelebrated]);

  const getTaskIcon = (taskCode: string) => {
    switch (taskCode) {
      case 'HYDRATION_2500ML':
        return '💧';
      case 'ARED_WORKOUT':
        return '🏋️';
      case 'CIRCADIAN_LIGHT_SYNC':
        return '☀️';
      default:
        return '⭐';
    }
  };

  const getTaskDescription = (taskCode: string) => {
    switch (taskCode) {
      case 'HYDRATION_2500ML':
        return 'Consume 2500 mL electrolyte solution to prevent cephalad fluid shift and orthostatic intolerance.';
      case 'ARED_WORKOUT':
        return '45-minute multi-joint resistance training to preserve bone mineral density and muscle mass in 0G.';
      case 'CIRCADIAN_LIGHT_SYNC':
        return '30-minute 480nm blue-enriched illumination to synchronize suprachiasmatic nucleus circadian rhythm.';
      default:
        return 'Prescribed clinical countermeasure protocol.';
    }
  };

  return (
    <div className="w-full">
      {/* Confetti Burst at 100% */}
      <ConfettiCelebration
        trigger={showConfetti}
        duration={1600}
        onComplete={() => setShowConfetti(false)}
        title="All Daily Countermeasures Complete!"
        message="Intravascular volume, musculoskeletal tone, and circadian phase synchronized."
      />

      <HudCard padding="20px" className="flex flex-col gap-4">
        {/* Header & Streak Counter */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-display font-bold text-base text-ink">
              Daily Clinical Countermeasures
            </h3>
            <p className="text-xs text-ink-muted">
              Executing protocols resolves active microgravity advisories
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StreakCounter streakDays={highestStreak} label="Team Streak" />
            <span className="font-mono text-xs font-bold text-ink bg-surface border border-outline px-2.5 py-1 rounded-pill">
              {completedCount} / {totalCount} Done
            </span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full">
          <ProgressBar progressPercent={progressPercent} height={10} showSparkle={progressPercent === 100} />
        </div>

        {/* Interactive Mission Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dailyMissions.map((mission) => {
            return (
              <LessonCard
                key={mission.$id || mission.task_code}
                title={mission.task_title}
                description={getTaskDescription(mission.task_code)}
                icon={<span className="text-3xl">{getTaskIcon(mission.task_code)}</span>}
                progressPercent={mission.is_completed ? 100 : 0}
                isCompleted={mission.is_completed}
                streakDays={mission.streak_days}
                categoryTag={mission.target_system.toUpperCase()}
                actionLabel={mission.is_completed ? 'Completed ✓' : 'Mark as Executed'}
                onToggleComplete={() => toggleCountermeasure(mission.$id, !mission.is_completed)}
                className="cursor-pointer"
              />
            );
          })}
        </div>
      </HudCard>
    </div>
  );
};
