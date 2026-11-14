import React from 'react';
import {
  CheckCircle2,
  HardDrive,
  Radio,
  RefreshCw,
  Send,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { HudCard, ProgressBar, StatusBadge } from '@aura/ui-kit';
import { useOfflineSyncStore } from '../../store/useOfflineSyncStore';

export const EarthDelayQueueBar: React.FC = () => {
  const commsMode = useOfflineSyncStore((s) => s.commsMode);
  const offlineQueue = useOfflineSyncStore((s) => s.offlineQueue);
  const offlineVitals = useOfflineSyncStore((s) => s.offlineVitals);
  const activeTransmissions = useOfflineSyncStore((s) => s.activeTransmissions);
  const completedTransmissions = useOfflineSyncStore((s) => s.completedTransmissions);
  const flushOfflineQueue = useOfflineSyncStore((s) => s.flushOfflineQueue);
  const clearCompleted = useOfflineSyncStore((s) => s.clearCompleted);

  const isBlackout = commsMode === 'SOLAR_BLACKOUT';
  const totalQueued = offlineQueue.length + offlineVitals.length;
  const hasPending = totalQueued > 0 || activeTransmissions.length > 0;

  return (
    <HudCard padding="20px" className="w-full flex flex-col gap-3">
      {/* Top Status Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-9 h-9 rounded-btn flex items-center justify-center shrink-0 ${
              isBlackout
                ? 'bg-coral-soft text-coral'
                : 'bg-sky-soft text-sky-deep'
            }`}
          >
            {isBlackout ? <WifiOff className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-sm text-ink">
                DTN Space-to-Earth Telemetry Queue
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-pill bg-surface-sunken border border-outline text-ink-muted">
                {commsMode.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs text-ink-muted font-body">
              {isBlackout
                ? 'Solar blackout active — edge-triaged vitals and PDF dossiers buffer locally in IndexedDB with idempotent edge IDs.'
                : 'Delay/Disruption-Tolerant Networking active with automatic light-time propagation tracking.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge
            severity={isBlackout ? 'red' : 'green'}
            label={isBlackout ? 'RF BLACKOUT · LOCAL BUFFER' : 'RF CARRIER LOCK'}
            size="sm"
          />

          {totalQueued > 0 && !isBlackout && (
            <button
              type="button"
              onClick={() => flushOfflineQueue()}
              className="px-3 py-1.5 rounded-btn bg-sky hover:bg-sky-deep text-white font-body font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Flush {totalQueued} Buffered Packet{totalQueued > 1 ? 's' : ''}</span>
            </button>
          )}

          {completedTransmissions.length > 0 && (
            <button
              type="button"
              onClick={() => clearCompleted()}
              className="px-2.5 py-1 rounded-btn text-xs text-ink-muted hover:text-ink hover:bg-surface-sunken font-body inline-flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log ({completedTransmissions.length})</span>
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
                className="p-3 rounded-btn bg-surface border border-outline flex flex-col gap-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <Send className="w-3.5 h-3.5 text-sky-deep" />
                    <span className="text-ink font-bold">{tx.$id}</span>
                    <span className="text-ink-subtle">({tx.distance_mode})</span>
                  </div>
                  <span className="text-sky-deep font-bold">
                    In Flight: {tx.remaining_seconds}s remaining ({Math.round(pct)}%)
                  </span>
                </div>
                <ProgressBar value={pct} height={6} />
              </div>
            );
          })}
        </div>
      )}

      {/* Offline Buffered Packets during Blackout */}
      {totalQueued > 0 && (
        <div className="p-3 rounded-btn bg-coral-soft/35 border border-coral/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-ink font-body font-semibold">
            <HardDrive className="w-4 h-4 text-coral shrink-0" />
            <span>
              {offlineQueue.length} Clinical Dossier(s) &amp; {offlineVitals.length} Edge-Triaged Vital Frame(s) Buffered in IndexedDB
            </span>
          </div>
          <span className="font-mono text-[11px] text-ink-muted">
            {isBlackout
              ? 'Awaiting line-of-sight acquisition for OFFLINE_SYNC_FLUSH'
              : 'Ready to flush cleanly via idempotent edge_alert_id'}
          </span>
        </div>
      )}

      {/* Earth DSN Acknowledgments */}
      {completedTransmissions.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-outline/60 text-[11px] font-mono">
          <span className="text-leaf-deep font-bold inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Earth DSN Acknowledgments:
          </span>
          {completedTransmissions.slice(0, 4).map((tx) => (
            <span
              key={tx.$id}
              className="px-2 py-0.5 rounded-pill bg-leaf-soft/70 border border-leaf/40 text-leaf-deep"
            >
              {tx.$id} · {new Date(tx.$createdAt || Date.now()).toLocaleTimeString()}
            </span>
          ))}
          {completedTransmissions.length > 4 && (
            <span className="text-ink-muted">
              +{completedTransmissions.length - 4} earlier
            </span>
          )}
        </div>
      )}

      {!hasPending && completedTransmissions.length === 0 && (
        <div className="pt-2 border-t border-outline/60 text-xs font-mono text-ink-subtle flex flex-wrap items-center justify-between gap-2">
          <span>Queue idle — all medical dossiers and telemetry frames synchronized.</span>
          <span>Storage: IndexedDB [aura_dtn_offline_packets]</span>
        </div>
      )}
    </HudCard>
  );
};
