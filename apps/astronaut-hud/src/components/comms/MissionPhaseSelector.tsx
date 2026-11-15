import React, { useId } from 'react';
import { Globe, Orbit } from 'lucide-react';
import type { DistanceCommsMode, MissionPhase } from '@aura/medical-engine';
import { useAuthStore } from '../../store/useAuthStore';
import { useOfflineSyncStore } from '../../store/useOfflineSyncStore';

const PHASES: { id: MissionPhase; label: string }[] = [
  { id: 'PRE_FLIGHT_BDC', label: 'Pre-Flight BDC (1G)' },
  { id: 'LAUNCH_ASCENT', label: 'Launch Ascent (+3G)' },
  { id: 'EARLY_ORBIT_ADAPTATION', label: 'Early Orbit Adaptation' },
  { id: 'DEEP_SPACE_CRUISE', label: 'Deep Space Cruise' },
];

const COMMS_MODES: { id: DistanceCommsMode; label: string }[] = [
  { id: 'ISS_REALTIME', label: 'ISS LEO (~1s)' },
  { id: 'MOON_2S', label: 'Lunar Gateway (3s)' },
  { id: 'MARS_15M', label: 'Mars Transit (25s demo)' },
  { id: 'SOLAR_BLACKOUT', label: 'Solar Storm Blackout (DTN)' },
];

export const MissionPhaseSelector: React.FC = () => {
  const uid = useId();
  const phaseSelectId = `${uid}-phase`;
  const commsSelectId = `${uid}-comms`;

  const missionPhase = useAuthStore((s) => s.profile.missionPhase);
  const setMissionPhase = useAuthStore((s) => s.setMissionPhase);

  const commsMode = useOfflineSyncStore((s) => s.commsMode);
  const setCommsMode = useOfflineSyncStore((s) => s.setCommsMode);

  const isBlackout = commsMode === 'SOLAR_BLACKOUT';

  return (
    <div className="w-full xl:w-auto grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
      {/* Mission Phase Selector */}
      <div className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 sm:py-1.5 bg-surface-sunken rounded-input border border-outline min-w-0">
        <Orbit className="w-4 h-4 text-sky-deep shrink-0" />
        <label
          htmlFor={phaseSelectId}
          className="text-[11px] font-mono font-bold text-ink-muted uppercase shrink-0"
        >
          Phase
        </label>
        <select
          id={phaseSelectId}
          value={missionPhase}
          onChange={(e) => void setMissionPhase(e.target.value as MissionPhase)}
          className="bg-transparent text-xs font-body font-bold text-ink focus:outline-none cursor-pointer pr-1 flex-1 min-w-0 truncate"
        >
          {PHASES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* DTN Comms Mode Selector */}
      <div
        className={`w-full sm:w-auto flex items-center gap-2 px-3 py-2 sm:py-1.5 rounded-input border transition-colors min-w-0 ${
          isBlackout
            ? 'bg-coral-soft/60 border-coral text-ink'
            : 'bg-surface-sunken border-outline text-ink'
        }`}
      >
        <Globe className={`w-4 h-4 shrink-0 ${isBlackout ? 'text-coral' : 'text-leaf-deep'}`} />
        <label
          htmlFor={commsSelectId}
          className="text-[11px] font-mono font-bold text-ink-muted uppercase shrink-0"
        >
          Link
        </label>
        <select
          id={commsSelectId}
          value={commsMode}
          onChange={(e) => setCommsMode(e.target.value as DistanceCommsMode)}
          className="bg-transparent text-xs font-body font-bold text-ink focus:outline-none cursor-pointer pr-1 flex-1 min-w-0 truncate"
        >
          {COMMS_MODES.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
