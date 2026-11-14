import { create } from 'zustand';
import type {
  EarthBaselines,
  MissionPhase,
} from '@aura/medical-engine';
import {
  AuthCalibrationService,
  DEFAULT_ASTRONAUT_PREFS,
  broadcastBusMessage,
  type AstronautProfilePrefs,
} from '@aura/appwrite-client';

export interface AstronautProfileState {
  astronautId: string;
  astronautCode: string;
  fullName: string;
  role: string;
  bloodType: string;
  missionPhase: MissionPhase;
  earthBaselines: EarthBaselines;
  lastSyncTimestamp?: string;
}

export type ViewMode = 'crew' | 'surgeon';

interface AuthState {
  profile: AstronautProfileState;
  viewMode: ViewMode;
  isLoading: boolean;
  loadProfile: () => Promise<void>;
  setMissionPhase: (phase: MissionPhase) => Promise<void>;
  updateBaselines: (baselines: EarthBaselines) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
  setProfile: (profile: AstronautProfileState) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: {
    astronautId: DEFAULT_ASTRONAUT_PREFS.astronautCode || 'AST-CDR-01',
    astronautCode: DEFAULT_ASTRONAUT_PREFS.astronautCode || 'AST-CDR-01',
    fullName: DEFAULT_ASTRONAUT_PREFS.fullName || 'Cmdr. Tariq Al-Mansoor',
    role: 'Mission Commander & Pilot',
    bloodType: DEFAULT_ASTRONAUT_PREFS.bloodType || 'O+',
    missionPhase: (DEFAULT_ASTRONAUT_PREFS.missionPhase as MissionPhase) || 'EARLY_ORBIT_ADAPTATION',
    earthBaselines: {
      heart_rate: { mean: 65, stdDev: 6 },
      bp_systolic: { mean: 118, stdDev: 8 },
      bp_diastolic: { mean: 76, stdDev: 5 },
      blood_glucose: { mean: 92, stdDev: 9 },
      body_temp: { mean: 36.6, stdDev: 0.25 },
      spo2: { mean: 98, stdDev: 1 },
      ...(DEFAULT_ASTRONAUT_PREFS.earthBaselines as any),
    },
  },
  viewMode: 'crew',
  isLoading: false,

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const stored = await AuthCalibrationService.getAstronautProfile();
      if (stored) {
        set({
          profile: {
            astronautId: (stored as any).astronautId || stored.astronautCode || 'AST-CDR-01',
            astronautCode: stored.astronautCode || 'AST-CDR-01',
            fullName: stored.fullName || 'Cmdr. Tariq Al-Mansoor',
            role: (stored as any).role || 'Mission Commander & Pilot',
            bloodType: stored.bloodType || 'O+',
            missionPhase: stored.missionPhase as MissionPhase,
            earthBaselines: stored.earthBaselines as EarthBaselines,
            lastSyncTimestamp: (stored as any).lastSyncTimestamp,
          },
        });
      }
    } catch (err) {
      console.warn('Failed to load profile from AuthCalibrationService, using defaults', err);
    } finally {
      set({ isLoading: false });
    }
  },

  setMissionPhase: async (phase: MissionPhase) => {
    const updated = {
      ...get().profile,
      missionPhase: phase,
      lastSyncTimestamp: new Date().toISOString(),
    };
    set({ profile: updated });

    try {
      await AuthCalibrationService.setMissionPhase(phase);
    } catch {
      localStorage.setItem('aura_astronaut_prefs', JSON.stringify(updated));
    }

    const payload: AstronautProfilePrefs = {
      astronautCode: updated.astronautCode,
      fullName: updated.fullName,
      bloodType: updated.bloodType,
      missionPhase: updated.missionPhase,
      earthBaselines: updated.earthBaselines,
    };
    broadcastBusMessage({
      type: 'PREFS_UPDATED',
      payload,
    });
  },

  updateBaselines: async (baselines: EarthBaselines) => {
    const updated = {
      ...get().profile,
      earthBaselines: baselines,
      lastSyncTimestamp: new Date().toISOString(),
    };
    set({ profile: updated });

    try {
      await AuthCalibrationService.updateEarthBaselines(baselines);
    } catch {
      localStorage.setItem('aura_astronaut_prefs', JSON.stringify(updated));
    }

    const payload: AstronautProfilePrefs = {
      astronautCode: updated.astronautCode,
      fullName: updated.fullName,
      bloodType: updated.bloodType,
      missionPhase: updated.missionPhase,
      earthBaselines: updated.earthBaselines,
    };
    broadcastBusMessage({
      type: 'PREFS_UPDATED',
      payload,
    });
  },

  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
    localStorage.setItem('aura_skylearn_view_mode', mode);
  },

  toggleViewMode: () => {
    const next = get().viewMode === 'crew' ? 'surgeon' : 'crew';
    set({ viewMode: next });
    localStorage.setItem('aura_skylearn_view_mode', next);
  },

  setProfile: (profile: AstronautProfileState) => {
    set({ profile });
  },
}));
