/**
 * Dual-Mode Appwrite Client SDK & Local BroadcastChannel Bus
 * Operates against Appwrite Cloud when online and falls back smoothly
 * to browser LocalStorage and cross-tab BroadcastChannel ('aura_telemetry_bus').
 */

import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';
import { DB_CONFIG, AstronautProfilePrefs, DistanceCommsMode } from './config';

export { ID, Query };

export interface VitalReadingInput {
  $id?: string;
  $createdAt?: string;
  astronaut_id: string;
  mission_phase: any;
  heart_rate: number;
  bp_systolic: number;
  bp_diastolic: number;
  blood_glucose: number;
  body_temp: number;
  spo2: number;
  sleep_hours: number;
  mood_score: number;
  cabin_co2_mmhg: number;
  cabin_radiation_msv: number;
  ingestion_source?: 'LIVE_STREAM' | 'OFFLINE_SYNC_FLUSH';
  edge_alert_id?: string | null;
}

export interface PersistedAlertDocument {
  $id: string;
  $createdAt?: string;
  astronaut_id: string;
  vital_log_id: string;
  affected_system: 'nominal' | 'cardiovascular' | 'nervous' | 'metabolic' | 'musculoskeletal';
  severity: 'green' | 'yellow' | 'red';
  diagnosis_code: string;
  diagnosis_title: string;
  simple_explanation: string;
  action_protocol: string[];
  guide_file_id?: string | null;
  notify_earth: boolean;
  is_resolved: boolean;
}

export interface DailyMissionDocument {
  $id: string;
  astronaut_id: string;
  task_code: string;
  task_title: string;
  target_system: string;
  points_value: number;
  is_completed: boolean;
  streak_days: number;
  $createdAt?: string;
}

export type BusMessage =
  | { type: 'PREFS_UPDATED'; payload: AstronautProfilePrefs }
  | { type: 'MISSIONS_UPDATED'; payload: DailyMissionDocument[] }
  | { type: 'TELEMETRY_INGESTED'; payload: { vitalDoc: VitalReadingInput; alertDoc: PersistedAlertDocument } }
  | { type: 'ALERT_RESOLVED'; payload: { alertId: string } }
  | { type: 'COMMS_MODE_UPDATED'; payload: { commsMode: DistanceCommsMode } };

/**
 * Universal safe BroadcastChannel wrapper supporting browser tabs, workers, and Node mock fallbacks.
 */
class SafeBroadcastBus {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: BusMessage) => void> = new Set();

  constructor(channelName: string) {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(channelName);
        this.channel.onmessage = (event) => {
          if (event.data && typeof event.data === 'object') {
            this.notifyListeners(event.data as BusMessage);
          }
        };
      } catch (err) {
        console.warn('[SafeBroadcastBus] BroadcastChannel initialization failed:', err);
      }
    }
  }

  public post(msg: BusMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch (err) {
        console.warn('[SafeBroadcastBus] postMessage failed:', err);
      }
    }
    // Also notify same-window listeners
    this.notifyListeners(msg);
  }

  public subscribe(callback: (msg: BusMessage) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(msg: BusMessage): void {
    for (const listener of this.listeners) {
      try {
        listener(msg);
      } catch (err) {
        console.error('[SafeBroadcastBus] listener error:', err);
      }
    }
  }
}

export const localBus = new SafeBroadcastBus(DB_CONFIG.BUS_CHANNEL);

export function broadcastBusMessage(msg: BusMessage): void {
  localBus.post(msg);
}

// Appwrite Singletons
export const appwriteClient = new Client()
  .setEndpoint(DB_CONFIG.ENDPOINT)
  .setProject(DB_CONFIG.PROJECT_ID);

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export const storage = new Storage(appwriteClient);

function getStorage(): any {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

// LocalStorage Persistence Helpers
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  const store = getStorage();
  if (!store) {
    return fallback;
  }
  try {
    const raw = store.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[safeLocalStorageGet] Failed to read key "${key}":`, err);
    return fallback;
  }
}

export function safeLocalStorageSet(key: string, value: any): void {
  const store = getStorage();
  if (!store) {
    return;
  }
  try {
    store.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[safeLocalStorageSet] Failed to write key "${key}":`, err);
  }
}

export function safeLocalStorageRemove(key: string): void {
  const store = getStorage();
  if (!store) {
    return;
  }
  try {
    store.removeItem(key);
  } catch (err) {
    console.warn(`[safeLocalStorageRemove] Failed to remove key "${key}":`, err);
  }
}

// File URL Helpers
export function getStorageFileViewUrl(bucketId: string, fileId: string): string {
  try {
    return storage.getFileView(bucketId, fileId).toString();
  } catch {
    return `${DB_CONFIG.ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/view?project=${DB_CONFIG.PROJECT_ID}`;
  }
}

export function getStorageFileDownloadUrl(bucketId: string, fileId: string): string {
  try {
    return storage.getFileDownload(bucketId, fileId).toString();
  } catch {
    return `${DB_CONFIG.ENDPOINT}/storage/buckets/${bucketId}/files/${fileId}/download?project=${DB_CONFIG.PROJECT_ID}`;
  }
}
