import React, { useEffect, useState } from 'react';
import { Droplets, Dumbbell, Sparkles, SunMedium } from 'lucide-react';
import {
  ConfettiCelebration,
  HudCard,
  LessonCard,
  ProgressBar,
  StreakCounter,
} from '@aura/ui-kit';
import { useMedicalStore } from '../../store/useMedicalStore';

export const DailyCountermeasures: React.FC = () => {
  const dailyMissions = useMedicalStore((s) => s.dailyMissions);
  const toggleCountermeasure = useMedicalStore((s) => s.toggleCountermeasure);

  const [showConfetti, setShowConfetti] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const completedCount = dailyMissions.filter((m) => m.is_completed).length;
  const totalCount = dailyMissions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const highestStreak = Math.max(...dailyMissions.map((m) => m.streak_days), 12);

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
        return <Droplets className="w-7 h-7" />;
      case 'ARED_WORKOUT':
        return <Dumbbell className="w-7 h-7" />;
      case 'CIRCADIAN_LIGHT_SYNC':
        return <SunMedium className="w-7 h-7" />;
      default:
        return <Sparkles className="w-7 h-7" />;
    }
  };

  const getTaskDescription = (taskCode: string) => {
    switch (taskCode) {
      case 'HYDRATION_2500ML':
        return 'Consume 2500 mL electrolyte solution to counter cephalad fluid shift and prevent hypovolemia.';
      case 'ARED_WORKOUT':
        return '45-minute ARED resistance session to protect bone mineral density and muscle load in 0G.';
      case 'CIRCADIAN_LIGHT_SYNC':
        return '30-minute circadian spectrum illumination to stabilize melatonin and sleep architecture.';
      default:
        return 'Prescribed daily clinical countermeasure protocol.';
    }
  };

  return (
    <div className="w-full">
      <ConfettiCelebration
        trigger={showConfetti}
        duration={1600}
        onComplete={() => setShowConfetti(false)}
        title="All Daily Countermeasures Complete"
        message="Intravascular volume, musculoskeletal load, and circadian phase synchronized."
      />

      <HudCard padding="20px" className="flex flex-col gap-4">
        {/* Header & Streak Counter */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-display font-bold text-base text-ink">
              Daily Clinical Countermeasures
            </h3>
            <p className="text-xs text-ink-muted font-body">
              Completing countermeasures recalculates triage advisories and Mission Readiness in real time
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <StreakCounter days={highestStreak} label="Crew Streak" />
            <span className="font-mono text-xs font-bold text-ink bg-surface border border-outline px-2.5 py-1 rounded-pill">
              {completedCount} / {totalCount} Done
            </span>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div className="w-full">
          <ProgressBar
            value={progressPercent}
            height={10}
            sparkleOnComplete={progressPercent === 100}
          />
        </div>

        {/* Interactive Countermeasure Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {dailyMissions.map((mission) => (
            <LessonCard
              key={mission.$id || mission.task_code}
              title={mission.task_title}
              description={getTaskDescription(mission.task_code)}
              icon={getTaskIcon(mission.task_code)}
              progressPercent={mission.is_completed ? 100 : 0}
              isCompleted={mission.is_completed}
              streakDays={mission.streak_days}
              categoryTag={mission.target_system.toUpperCase()}
              actionLabel={mission.is_completed ? 'Executed' : 'Mark Complete'}
              onToggleComplete={() =>
                toggleCountermeasure(mission.$id, !mission.is_completed)
              }
              className="cursor-pointer h-full"
            />
          ))}
        </div>
      </HudCard>
    </div>
  );
};
