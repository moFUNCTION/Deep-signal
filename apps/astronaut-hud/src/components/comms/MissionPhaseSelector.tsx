import React from 'react';
import type { DistanceCommsMode, MissionPhase } from '@aura/medical-engine';
import { StatusBadge } from '@aura/ui-kit';
import { useAuthStore } from '../../store/useAuthStore';
import { useOfflineSyncStore } from '../../store/useOfflineSyncStore';

const PHASES: { id: MissionPhase; label: string; desc: string }[] = [
  { id: 'PRE_FLIGHT_BDC', label: 'Pre-Flight BDC', desc: '1G Earth Baseline Calibration' },
  { id: 'LAUNCH_ASCENT', label: 'Launch Ascent', desc: '+3G Dynamic Peak Load' },
  { id: 'EARLY_ORBIT_ADAPTATION', label: 'Early Orbit', desc: 'Cephalad Fluid Shift & Neurovestibular' },
  { id: 'DEEP_SPACE_CRUISE', label: 'Deep Space', desc: 'Nominal Microgravity Cruise' },
];

const COMMS_MODES: { id: DistanceCommsMode; label: string; latency: string; icon: string }[] = [
  { id: 'ISS_REALTIME', label: 'ISS Low Orbit', latency: '~1s latency', icon: '🛰️' },
  { id: 'MOON_2S', label: 'Lunar Gateway', latency: '2.6s round-trip', icon: '🌖' },
  { id: 'MARS_15M', label: 'Mars Transit', latency: '15m light-time', icon: '🔴' },
  { id: 'SOLAR_BLACKOUT', label: 'Solar Storm Blackout', latency: 'OFFLINE DTN', icon: '⚡' },
];

export const MissionPhaseSelector: React.FC = () => {
  const missionPhase = useAuthStore((s) => s.profile.missionPhase);
  const setMissionPhase = useAuthStore((s) => s.setMissionPhase);

  const commsMode = useOfflineSyncStore((s) => s.commsMode);
  const setCommsMode = useOfflineSyncStore((s) => s.setCommsMode);

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Mission Phase Dropdown / Buttons */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-sunken rounded-btn border border-outline">
        <span className="text-xs font-mono font-bold text-ink-muted px-2">PHASE:</span>
        {PHASES.map((p) => {
          const isActive = missionPhase === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setMissionPhase(p.id)}
              className={`px-2.5 py-1 text-xs rounded-btn font-body font-semibold transition-all ${
                isActive
                  ? 'bg-sky text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-surface'
              }`}
              title={p.desc}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* DTN Comms Mode Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-sunken rounded-btn border border-outline">
        <span className="text-xs font-mono font-bold text-ink-muted px-2">COMMS:</span>
        {COMMS_MODES.map((mode) => {
          const isActive = commsMode === mode.id;
          const isBlackout = mode.id === 'SOLAR_BLACKOUT';
          return (
            <button
              key={mode.id}
              onClick={() => setCommsMode(mode.id)}
              className={`px-2 py-1 text-xs rounded-btn font-body font-semibold flex items-center gap-1 transition-all ${
                isActive
                  ? isBlackout
                    ? 'bg-coral text-white shadow-sm'
                    : 'bg-slate-900 text-white shadow-sm'
                  : 'text-ink-muted hover:text-ink hover:bg-surface'
              }`}
              title={`${mode.label} (${mode.latency})`}
            >
              <span>{mode.icon}</span>
              <span className="hidden sm:inline">{mode.label}</span>
              {isActive && isBlackout && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
