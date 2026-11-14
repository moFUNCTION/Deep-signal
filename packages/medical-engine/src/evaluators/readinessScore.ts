import type {
  MetricEvaluationResult,
  MetricKey,
  ReadinessBreakdown,
  ReadinessInput,
  ReadinessStatus,
} from '../types.js';

/**
 * Calculates the NASA Mission Readiness Score (50% vitals, 30% countermeasures, 20% sleep/mood)
 * and determines flight status: OPTIMAL_FOR_EVA, CAUTION_MONITOR, or NO_GO_MEDICAL_HOLD.
 */
export function calculateMissionReadiness(
  inputOrEvals: ReadinessInput | Record<MetricKey, MetricEvaluationResult> | MetricEvaluationResult[],
  completedTasksArg?: string[] | number,
  totalTasksArg?: string[] | number,
  sleepHoursArg?: number,
  moodScoreArg?: number,
): ReadinessBreakdown {
  let evals: Record<MetricKey, MetricEvaluationResult> | MetricEvaluationResult[];
  let completedCount = 0;
  let totalCount = 0;
  let sleepHours = 7.5;
  let moodScore = 10;

  // Check if first argument is a ReadinessInput object
  if (
    inputOrEvals &&
    typeof inputOrEvals === 'object' &&
    'evaluations' in inputOrEvals
  ) {
    const input = inputOrEvals as ReadinessInput;
    evals = input.evaluations;

    if (typeof input.completedTasksCount === 'number') {
      completedCount = input.completedTasksCount;
    } else if (Array.isArray(input.completedTasks)) {
      completedCount = input.completedTasks.length;
    } else if (typeof input.completedTasks === 'number') {
      completedCount = input.completedTasks;
    }

    if (typeof input.totalTasksCount === 'number') {
      totalCount = input.totalTasksCount;
    } else if (Array.isArray(input.totalTasks)) {
      totalCount = input.totalTasks.length;
    } else if (typeof input.totalTasks === 'number') {
      totalCount = input.totalTasks;
    }

    sleepHours = input.sleepHours ?? 7.5;
    moodScore = input.moodScore ?? 10;
  } else {
    evals = inputOrEvals as Record<MetricKey, MetricEvaluationResult> | MetricEvaluationResult[];

    if (Array.isArray(completedTasksArg)) {
      completedCount = completedTasksArg.length;
    } else if (typeof completedTasksArg === 'number') {
      completedCount = completedTasksArg;
    }

    if (Array.isArray(totalTasksArg)) {
      totalCount = totalTasksArg.length;
    } else if (typeof totalTasksArg === 'number') {
      totalCount = totalTasksArg;
    }

    sleepHours = sleepHoursArg ?? 7.5;
    moodScore = moodScoreArg ?? 10;
  }

  // 1. Vitals Score (50% weight)
  const evalList = Array.isArray(evals) ? evals : Object.values(evals || {});
  const yellowCount = evalList.filter((e) => e.severity === 'yellow').length;
  const redCount = evalList.filter((e) => e.severity === 'red').length;

  const vitalsScore = Math.max(0, 100 - (15 * yellowCount) - (40 * redCount));

  // 2. Countermeasures Score (30% weight)
  let countermeasuresScore = 100;
  if (totalCount > 0) {
    countermeasuresScore = Math.min(
      100,
      Math.max(0, Math.round((completedCount / totalCount) * 100)),
    );
  }

  // 3. Sleep & Mood Score (20% weight)
  const sleepRatio = Math.min(Math.max(sleepHours, 0) / 7.5, 1.0);
  const moodRatio = Math.min(Math.max(moodScore, 0) / 10.0, 1.0);
  const sleepMoodScore = Math.round((sleepRatio * 50) + (moodRatio * 50));

  // 4. Combined Weighted Mission Readiness Score
  const missionReadiness = Math.round(
    (0.50 * vitalsScore) + (0.30 * countermeasuresScore) + (0.20 * sleepMoodScore),
  );

  // 5. Readiness Status Classification
  let status: ReadinessStatus = 'OPTIMAL_FOR_EVA';
  if (redCount > 0 || missionReadiness < 55) {
    status = 'NO_GO_MEDICAL_HOLD';
  } else if (yellowCount > 0 || missionReadiness < 80) {
    status = 'CAUTION_MONITOR';
  } else {
    status = 'OPTIMAL_FOR_EVA';
  }

  return {
    missionReadiness,
    vitalsScore,
    countermeasuresScore,
    sleepMoodScore,
    status,
    redCount,
    yellowCount,
  };
}
