import React from 'react';
import { ProgressBar, StatusBadge } from '@aura/ui-kit';
import { useOfflineSyncStore } from '../../store/useOfflineSyncStore';

export const EarthDelayQueueBar: React.FC = () => {
  const commsMode = useOfflineSyncStore((s) => s.commsMode);
  const offlineQueue = useOfflineSyncStore((s) => s.offlineQueue);
  const activeTransmissions = useOfflineSyncStore((s) => s.activeTransmissions);
  const completedTransmissions = useOfflineSyncStore((s) => s.completedTransmissions);
  const flushOfflineQueue = useOfflineSyncStore((s) => s.flushOfflineQueue);
  const clearCompleted = useOfflineSyncStore((s) => s.clearCompleted);

  const isBlackout = commsMode === 'SOLAR_BLACKOUT';
  const hasPending = offlineQueue.length > 0 || activeTransmissions.length > 0;

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-card p-3.5 text-white flex flex-col gap-2.5">
      {/* Top Status Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-display font-bold uppercase tracking-wider text-cyan-400">
            DTN Space-to-Earth Telemetry Relay Bus
          </span>
          <span className="font-mono text-slate-400">
            Mode: <strong className="text-white">{commsMode}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isBlackout ? (
            <span className="px-2.5 py-0.5 rounded-pill bg-coral-soft border border-coral text-coral font-mono font-bold text-[11px] animate-pulse">
              ⚡ SOLAR RF BLACKOUT ACTIVE (QUEUING TO LOCAL IDB)
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-pill bg-leaf-soft border border-leaf text-leaf-deep font-mono font-bold text-[11px]">
              ✓ RF CARRIER LOCK ESTABLISHED
            </span>
          )}

          {offlineQueue.length > 0 && !isBlackout && (
            <button
              onClick={() => flushOfflineQueue()}
              className="px-2.5 py-0.5 rounded-pill bg-sky hover:bg-sky-deep text-white font-mono font-bold text-[11px] transition-colors"
            >
              Flush {offlineQueue.length} Queued Packets ⇪
            </button>
          )}

          {completedTransmissions.length > 0 && (
            <button
              onClick={() => clearCompleted()}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline font-mono"
            >
              Clear Log ({completedTransmissions.length})
            </button>
          )}
        </div>
      </div>

      {/* Active Transmitting Packets */}
      {activeTransmissions.length > 0 && (
        <div className="space-y-2 pt-1">
          {activeTransmissions.map((tx) => {
            const total = tx.delay_seconds || 1;
            const elapsed = total - tx.remaining_seconds;
            const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));

            return (
              <div
                key={tx.$id}
                className="p-2.5 rounded-btn bg-slate-800/90 border border-slate-700 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-300 font-bold">📡 Packet {tx.$id}</span>
                    <span className="text-slate-400">({tx.distance_mode})</span>
                  </div>
                  <span className="text-sun font-bold animate-pulse">
                    Light-Time In Flight: {tx.remaining_seconds}s remaining ({Math.round(pct)}%)
                  </span>
                </div>
                <ProgressBar progressPercent={pct} height={6} />
              </div>
            );
          })}
        </div>
      )}

      {/* Offline Queued Packets in Blackout */}
      {isBlackout && offlineQueue.length > 0 && (
        <div className="p-2.5 rounded-btn bg-coral/10 border border-coral/40 flex items-center justify-between text-xs font-mono">
          <span className="text-coral">
            📦 {offlineQueue.length} Clinical PDF Dossier(s) Safely Buffered in IndexedDB
          </span>
          <span className="text-slate-400">
            Will automatically flush upon radio line-of-sight acquisition
          </span>
        </div>
      )}

      {/* Earth Received Confirmations */}
      {completedTransmissions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] font-mono text-slate-300">
          <span className="text-leaf font-bold">Earth DSN Acknowledgments:</span>
          {completedTransmissions.slice(0, 3).map((tx) => (
            <span
              key={tx.$id}
              className="px-2 py-0.5 rounded bg-leaf/20 border border-leaf/40 text-leaf"
            >
              ✓ {tx.$id} ({new Date(tx.createdAt).toLocaleTimeString()})
            </span>
          ))}
          {completedTransmissions.length > 3 && (
            <span className="text-slate-400">
              +{completedTransmissions.length - 3} more received
            </span>
          )}
        </div>
      )}

      {!hasPending && completedTransmissions.length === 0 && (
        <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>DTN Queue Idle — All medical telemetry frames synchronized.</span>
          <span>Buffer: IndexedDB [aura_dtn_offline_packets]</span>
        </div>
      )}
    </div>
  );
};
