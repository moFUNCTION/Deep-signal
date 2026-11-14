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
  account,
  broadcastBusMessage,
  localBus,
  safeLocalStorageGet,
  safeLocalStorageSet,
} from '../client';

export class AuthCalibrationService {
  /**
   * Retrieves the current astronaut profile and pre-flight BDC baselines.
   * Checks Appwrite account preferences, falling back to LocalStorage and default constants.
   */
  public static async getAstronautProfile(
    options?: { isOfflineMode?: boolean }
  ): Promise<AstronautProfilePrefs> {
    // 1. Try Appwrite account prefs if logged in and not explicitly offline
    if (!options?.isOfflineMode) {
      try {
        const prefs = await account.getPrefs();
        if (prefs && prefs.astronautCode && prefs.earthBaselines) {
          const fullProfile: AstronautProfilePrefs = {
            astronautCode: prefs.astronautCode,
            fullName: prefs.fullName || DEFAULT_ASTRONAUT_PREFS.fullName,
            bloodType: prefs.bloodType || DEFAULT_ASTRONAUT_PREFS.bloodType,
            missionPhase: prefs.missionPhase || DEFAULT_ASTRONAUT_PREFS.missionPhase,
            earthBaselines: prefs.earthBaselines,
          };
          safeLocalStorageSet(DB_CONFIG.STORAGE_KEYS.PREFS, fullProfile);
          return fullProfile;
        }
      } catch {
        // Expected when unauthenticated or offline
      }
    }

    // 2. Fall back to LocalStorage
    const localProfile = safeLocalStorageGet<AstronautProfilePrefs>(
      DB_CONFIG.STORAGE_KEYS.PREFS,
      DEFAULT_ASTRONAUT_PREFS
    );

    return localProfile;
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

    // 3. Attempt async Appwrite account prefs update (silent if unauthenticated)
    try {
      await account.updatePrefs(profile);
    } catch {
      // Degrades gracefully offline
    }

    return profile;
  }
}
