/**
 * AURA Space Medicine — Astronaut Calibration & Auth Service
 * Manages pre-flight Earth BDC baselines, mission phase state, and astronaut profile.
 */

import {
  AstronautProfilePrefs,
  DEFAULT_ASTRONAUT_PREFS,
  DB_CONFIG,
  EarthBaselines,
  MissionPhase,
} from '../config';
import {
  broadcastBusMessage,
  localBus,
  safeLocalStorageGet,
  safeLocalStorageSet,
} from '../client';
import { DtnCommsService } from './DtnCommsService';

export class AuthCalibrationService {
  /**
   * Retrieves the current astronaut profile and pre-flight BDC baselines.
   * Reads LocalStorage (hydrated and kept in sync via Appwrite Remote Control + BroadcastChannel)
   * without triggering unauthenticated Account API 401 calls in guest sessions.
   */
  public static async getAstronautProfile(
    _options?: { isOfflineMode?: boolean }
  ): Promise<AstronautProfilePrefs> {
    return safeLocalStorageGet<AstronautProfilePrefs>(
      DB_CONFIG.STORAGE_KEYS.PREFS,
      DEFAULT_ASTRONAUT_PREFS
    );
  }

  /**
   * Updates partial or full Earth pre-flight baseline parameters.
   */
  public static async updateEarthBaselines(
    newBaselines: Partial<EarthBaselines>
  ): Promise<AstronautProfilePrefs> {
    const current = await this.getAstronautProfile();
    const mergedBaselines: EarthBaselines = {
      ...current.earthBaselines,
      ...newBaselines,
    };

    const updatedProfile: AstronautProfilePrefs = {
      ...current,
      earthBaselines: mergedBaselines,
    };

    return this.persistAndBroadcast(updatedProfile);
  }

  /**
   * Sets the active mission phase (e.g. LAUNCH_ASCENT, EARLY_ORBIT_ADAPTATION, DEEP_SPACE_CRUISE).
   */
  public static async setMissionPhase(
    missionPhase: MissionPhase
  ): Promise<AstronautProfilePrefs> {
    const current = await this.getAstronautProfile();
    const updatedProfile: AstronautProfilePrefs = {
      ...current,
      missionPhase,
    };

    return this.persistAndBroadcast(updatedProfile);
  }

  /**
   * Updates any astronaut profile field.
   */
  public static async updateAstronautProfile(
    partial: Partial<AstronautProfilePrefs>
  ): Promise<AstronautProfilePrefs> {
    const current = await this.getAstronautProfile();
    const updatedProfile: AstronautProfilePrefs = {
      ...current,
      ...partial,
      earthBaselines: {
        ...current.earthBaselines,
        ...(partial.earthBaselines || {}),
      },
    };

    return this.persistAndBroadcast(updatedProfile);
  }

  /**
   * Resets the astronaut profile and BDC baselines back to Earth default calibration.
   */
  public static async resetToEarthDefaults(): Promise<AstronautProfilePrefs> {
    const defaults = { ...DEFAULT_ASTRONAUT_PREFS };
    return this.persistAndBroadcast(defaults);
  }

  /**
   * Subscribes to profile and baseline modifications across tabs via BroadcastChannel.
   */
  public static subscribeProfileChanges(
    callback: (prefs: AstronautProfilePrefs) => void
  ): () => void {
    return localBus.subscribe((msg) => {
      if (msg.type === 'PREFS_UPDATED') {
        callback(msg.payload);
      }
    });
  }

  private static async persistAndBroadcast(
    profile: AstronautProfilePrefs
  ): Promise<AstronautProfilePrefs> {
    // 1. Write to LocalStorage
    safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.PREFS, profile);

    // 2. Broadcast on localBus for instant multi-tab sync
    broadcastBusMessage({
      type: 'PREFS_UPDATED',
      payload: profile,
    });

    // 3. Sync shared profile/phase control state via Appwrite Realtime (guest-safe Role.any collection)
    if (DB_CONFIG.IS_CONFIGURED) {
      try {
        await DtnCommsService.syncRemoteControlState(profile.astronautCode || 'AST-CDR-01', {
          missionPhase: profile.missionPhase,
          earthBaselines: profile.earthBaselines,
        });
      } catch {
        // Offline / network fallback succeeded locally
      }
    }

    return profile;
  }
}
