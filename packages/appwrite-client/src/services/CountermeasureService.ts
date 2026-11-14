/**
 * AURA Space Medicine — Daily Countermeasures & Habit Gamification Service
 * Handles hydration, resistive workout, and circadian entrainment missions.
 */

import { DB_CONFIG } from '../config';
import {
  DailyMissionDocument,
  databases,
  appwriteClient,
  broadcastBusMessage,
  localBus,
  safeLocalStorageGet,
  safeLocalStorageSet,
  Query,
} from '../client';

export const DEFAULT_DAILY_MISSIONS: DailyMissionDocument[] = [
  {
    $id: 'task_hydration_01',
    astronaut_id: 'AST-CDR-01',
    task_code: 'HYDRATION_2500ML',
    task_title: 'Electrolyte Hydration Target (2500 mL)',
    target_system: 'cardiovascular',
    points_value: 35,
    is_completed: true,
    streak_days: 14,
  },
  {
    $id: 'task_ared_02',
    astronaut_id: 'AST-CDR-01',
    task_code: 'ARED_WORKOUT',
    task_title: 'ARED Resistive Exercise (60 Min Load)',
    target_system: 'musculoskeletal',
    points_value: 40,
    is_completed: true,
    streak_days: 11,
  },
  {
    $id: 'task_circadian_03',
    astronaut_id: 'AST-CDR-01',
    task_code: 'CIRCADIAN_LIGHT_SYNC',
    task_title: '2700K Amber Circadian Visor Protocol',
    target_system: 'nervous',
    points_value: 25,
    is_completed: true,
    streak_days: 9,
  },
];

export class CountermeasureService {
  /**
   * Lists daily missions for an astronaut.
   * Tries Appwrite Cloud, falls back to LocalStorage or default missions.
   */
  public static async listDailyMissions(
    astronautId: string = 'AST-CDR-01'
  ): Promise<DailyMissionDocument[]> {
    try {
      const response = await databases.listDocuments(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.COLLECTIONS.DAILY_MISSIONS,
        [Query.equal('astronaut_id', astronautId)]
      );

      if (response && response.documents.length > 0) {
        const missions = response.documents.map((doc: any) => ({
          $id: doc.$id,
          astronaut_id: doc.astronaut_id,
          task_code: doc.task_code,
          task_title: doc.task_title,
          target_system: doc.target_system,
          points_value: doc.points_value,
          is_completed: doc.is_completed,
          streak_days: doc.streak_days,
          $createdAt: doc.$createdAt,
        })) as DailyMissionDocument[];

        safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.MISSIONS, missions);
        return missions;
      }
    } catch {
      // Degrades gracefully offline
    }

    const localMissions = safeLocalStorageGet<DailyMissionDocument[]>(
      DB_CONFIG.STORAGE_KEYS.MISSIONS,
      DEFAULT_DAILY_MISSIONS
    );

    return localMissions;
  }

  /**
   * Toggles task completion and updates streak count.
   * Persists to LocalStorage, emits via BroadcastChannel, and syncs to Appwrite.
   */
  public static async toggleMissionCompletion(
    taskId: string,
    isCompleted: boolean
  ): Promise<DailyMissionDocument> {
    const currentMissions = await this.listDailyMissions();
    const index = currentMissions.findIndex((m) => m.$id === taskId || m.task_code === taskId);

    if (index === -1) {
      throw new Error(`Mission task with ID/code '${taskId}' not found.`);
    }

    const task = currentMissions[index];
    const newStreak = isCompleted
      ? task.streak_days + 1
      : Math.max(0, task.streak_days - 1);

    const updatedTask: DailyMissionDocument = {
      ...task,
      is_completed: isCompleted,
      streak_days: newStreak,
    };

    currentMissions[index] = updatedTask;

    // 1. LocalStorage
    safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.MISSIONS, currentMissions);

    // 2. BroadcastChannel
    broadcastBusMessage({
      type: 'MISSIONS_UPDATED',
      payload: currentMissions,
    });

    // 3. Appwrite Cloud Document Update
    try {
      await databases.updateDocument(
        DB_CONFIG.DATABASE_ID,
        DB_CONFIG.COLLECTIONS.DAILY_MISSIONS,
        updatedTask.$id,
        {
          is_completed: updatedTask.is_completed,
          streak_days: updatedTask.streak_days,
        }
      );
    } catch {
      // Offline fallback: update queued locally
    }

    return updatedTask;
  }

  /**
   * Subscribes to mission updates via BroadcastChannel and Appwrite Realtime.
   */
  public static subscribeMissions(
    callback: (missions: DailyMissionDocument[]) => void
  ): () => void {
    // 1. Local BroadcastChannel subscription
    const busUnsub = localBus.subscribe((msg) => {
      if (msg.type === 'MISSIONS_UPDATED') {
        callback(msg.payload);
      }
    });

    // 2. Appwrite Realtime subscription
    let realtimeUnsub = () => {};
    try {
      const channel = `databases.${DB_CONFIG.DATABASE_ID}.collections.${DB_CONFIG.COLLECTIONS.DAILY_MISSIONS}.documents`;
      realtimeUnsub = appwriteClient.subscribe(channel, async () => {
        const fresh = await this.listDailyMissions();
        callback(fresh);
      });
    } catch {
      // Offline fallback
    }

    return () => {
      busUnsub();
      realtimeUnsub();
    };
  }
}
