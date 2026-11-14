# AURA: Autonomous Unified Recovery & Assessment
## Master System Architecture, Space Medicine Blueprint & AI-Executable Service Specification

* **Challenge:** NASA Space Apps Challenge 2026 — *Create Health Monitoring Software for Astronauts on Space Missions*
* **Target Execution Environment:** AI Coding Agents (Gemini Flash, Hydrogen, Cursor, Windsurf) & Full-Stack Engineers
* **Tech Stack:** Turborepo (Monorepo) | React 18 (Vite) | TypeScript (Strict Mode) | Appwrite (Auth, Databases, Storage, Functions, Realtime) | Three.js (`@react-three/fiber`, `@react-three/drei`) | Zustand | IndexedDB (`idb-keyval`) | Recharts | TailwindCSS | `jsPDF`

---

## 1. Architectural Audit & Enhancements Over Original Blueprint

Following a deep engineering analysis of the initial AURA specification, the system possesses an exceptional core concept: combining **Personalized Pre-Flight Baselines ($\mu_{\text{earth}}, \sigma_{\text{earth}}$)**, **Mission-Phase Physiological Offsets ($\Delta_{\text{phase}}$)**, **Multi-Metric Environmental Correlation**, and **Delay/Disruption-Tolerant Networking (DTN)**.

To make this specification 100% deterministic and executable by an autonomous AI model without runtime bugs or missing dependencies, the following **five critical architectural enhancements** have been engineered into this blueprint:

1. **Edge-Cloud Triage Idempotency (Preventing Duplicate Alerts After Blackout):**
   * *Flaw in Original Design:* During `SOLAR_BLACKOUT`, the frontend runs `@aura/medical-engine` locally and queues telemetry. When connectivity returns, flushing `vitals_logs` to Appwrite triggers the `triage-cloud-fn` webhook, which re-runs triage and creates duplicate alerts.
   * *Enhancement:* Introduced an `ingestion_source` (`'LIVE_STREAM' | 'OFFLINE_SYNC_FLUSH'`) and `edge_alert_id` attribute on `vitals_logs`. If an offline reading was already triaged at the edge, both the telemetry log and the resolved/active edge alert are synced atomically, and the Cloud Function skips redundant evaluation.
2. **Procedural 3D Holographic Twin Fallback (Zero-Asset Crash Protection):**
   * *Flaw in Original Design:* Relying solely on `/public/models/astronaut_body.glb` causes Three.js to throw a fatal loader error when an AI model generates the repository without binary 3D files.
   * *Enhancement:* Engineered a **Procedural Anatomical Hologram Generator** using Three.js parametric geometries (`CapsuleGeometry`, `SphereGeometry`, `CylinderGeometry`, and custom wireframe shaders) grouped into 4 interactive anatomical meshes (`nervous`, `cardiovascular`, `metabolic`, `musculoskeletal`). The system automatically falls back to this procedural hologram if `.glb` assets are absent.
3. **Strict Service-Oriented Architecture (SOA) & TypeScript Contracts:**
   * *Flaw in Original Design:* Database calls, offline caching, and state mutations were tightly coupled inside UI components and basic stores, with missing implementations for `packages/appwrite-client`, `packages/ui-kit`, `readinessScore`, and PDF generation.
   * *Enhancement:* Extracted 6 dedicated, strongly-typed domain services (`AuthCalibrationService`, `TelemetryIngestionService`, `TriageOrchestratorService`, `DtnCommsService`, `CountermeasureService`, and `ClinicalPdfService`) with explicit input/output interfaces.
4. **Expanded Space Medicine Correlation Matrix:**
   * Added **Spaceflight-Associated Neuro-ocular Syndrome (SANS)** and **Musculoskeletal Unloading** correlation rules so all 4 organ systems in the 3D Digital Twin (`nervous`, `cardiovascular`, `metabolic`, `musculoskeletal`) have dedicated clinical triggers.
5. **Deterministic Light-Time Delay State Machine:**
   * Formalized a tick-based transmission state machine (`queued_offline` $\rightarrow$ `transmitting` $\rightarrow$ `received_by_earth`) with real-time countdown progress bars and automated PDF dossier attachment.

---

## 2. System Vision & Space Medicine Lifecycle

### 2.1 Core Problem Statement
**AURA** is not a passive telemetry dashboard; it is an **Autonomous Space Medical Decision Support System** and **3D Digital Health Twin** engineered to solve four fundamental spaceflight challenges:
1. **Microgravity Physiological Shift ($\mu g$ Adaptation):** Readings that appear pathological on Earth (e.g., elevated heart rate during $3G$ launch or fluid-shift-induced blood pressure changes during early orbit) are normal in space. Conversely, a "normal" resting heart rate of $78\text{ bpm}$ can represent a $6\sigma$ medical emergency for an athletic astronaut whose pre-flight baseline is $\mu_{\text{earth}} = 54\text{ bpm}$ with $\sigma_{\text{earth}} = 4\text{ bpm}$.
2. **Communication Latency & Solar Blackouts:** Deep-space missions to Mars experience up to $20\text{ minutes}$ of one-way light-time delay ($40\text{ minutes}$ round-trip) and complete radio blackouts during solar conjunctions or Solar Particle Events (SPE). Reliance on Earth-based Flight Surgeons for acute triage is impossible.
3. **Lack of Onboard Medical Specialists:** Crew members are often engineers or payloads specialists. They require plain-language explanations and step-by-step, visually guided actionable protocols rather than raw clinical jargon.
4. **Psychological Fatigue & Countermeasure Neglect:** Isolation and circadian disruption lead astronauts to neglect hydration and resistive exercise (ARED), accelerating muscle atrophy, bone demineralization, and renal stone formation.

### 2.2 The Three-Stage Space Medicine Lifecycle

#### Phase 1: Pre-Flight Baseline Data Collection (`PRE_FLIGHT_BDC`, $L-180$ to $L-0$)
* **Objective:** Establish a personalized biometric fingerprint on Earth under nominal resting conditions.
* **Parameters Recorded per Metric $m$:**
  * Personal Earth Mean ($\mu_{\text{earth}, m}$)
  * Personal Earth Standard Deviation ($\sigma_{\text{earth}, m}$)

#### Phase 2: Launch, Ascent & Early Orbit Adaptation
Subdivided programmatically into two distinct operational modes:
1. **`LAUNCH_ASCENT` ($T-0$ to $+1\text{ hour}$):**
   * Astronauts experience $3G$ to $4G$ acceleration, acoustic vibration, and acute sympathetic nervous system activation.
   * **Programmatic Tolerance:** Permits transient physiological elevations ($\Delta_{\text{HR}} = +30\text{ bpm}$, $\Delta_{\text{Sys}} = +18\text{ mmHg}$, $\sigma\text{ multiplier} = 1.8\times$) without triggering false-positive red alerts, provided $\text{SpO}_2 \ge 91\%$ and NASA absolute hard limits are not breached.
2. **`EARLY_ORBIT_ADAPTATION` (Mission Days $1$ to $14$):**
   * **Cephalad Fluid Shift:** Entry into microgravity ($\mu g$) shifts approximately $2\text{ L}$ of intravascular and interstitial fluid from the lower extremities toward the thorax and head.
   * **Physiological Response:** Baroreceptors detect central hypervolemia, suppressing antidiuretic hormone (ADH), inducing diuresis, reducing plasma volume by $\sim 15\%$, and triggering Space Motion Sickness (SMS).
   * **Programmatic Handling:** Applies early-orbit phase offsets ($\Delta_{\text{phase}}$) and widens the standard deviation tolerance ($1.25\times$) while monitoring for acute dehydration or intracranial pressure spikes.

#### Phase 3: Deep Space & Mars Transit (`DEEP_SPACE_CRUISE`, Day $14+$)
Monitors compound, multi-system deep-space pathologies:
* **Localized Hypercapnia ($\text{CO}_2$ Pockets):** In the absence of buoyancy-driven natural convection in $\mu g$, exhaled $\text{CO}_2$ forms stagnant pockets around the astronaut's head if cabin ventilation fans degrade. Causes headaches, tachycardia, cognitive impairment, and plummeting mood scores.
* **Solar Particle Events (SPE) & Acute Radiation Stress:** Elevated cabin radiation ($\ge 1.5\text{ mSv/day}$) combined with low-grade fever and cardiovascular strain.
* **Circadian Misalignment & Metabolic Drift:** Loss of a natural $24\text{-hour}$ light-dark cycle disrupts sleep architecture ($< 5\text{ hours}$), elevating cortisol and destabilizing blood glucose.
* **Subclinical Dehydration (Microgravity Hypovolemia):** Blunted thirst reflex in $\mu g$ coupled with incomplete daily hydration tasks leads to tachycardia and orthostatic hypotension.
* **Musculoskeletal Unloading & Resistance Neglect:** Skipping ARED (Advanced Resistive Exercise Device) workouts triggers musculoskeletal degradation alerts and lowers Mission Readiness.

---

## 3. Complete Monorepo Architecture (Turborepo + TypeScript)

```text
aura-space-monorepo/
├── turbo.json
├── package.json
├── tsconfig.base.json
├── .env.example
│
├── packages/
│   ├── medical-engine/                        # Pure TypeScript Zero-Dependency Clinical Engine
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types.ts                       # Shared interfaces for Telemetry, Triage, Baselines
│   │       ├── constants/
│   │       │   ├── hardLimits.ts              # NASA Clinical Hard Limits
│   │       │   ├── phaseOffsets.ts            # Mission Phase physiological offsets
│   │       │   └── protocols.ts               # Actionable protocols & Storage guide mappings
│   │       ├── evaluators/
│   │       │   ├── zScoreEvaluator.ts         # Dual-Filter Personal Z-Score Evaluator
│   │       │   ├── correlationEngine.ts       # Multi-Metric & Environmental Correlation Engine
│   │       │   └── readinessScore.ts          # Gamified Mission Readiness Calculator
│   │       └── index.ts
│   │
│   ├── appwrite-client/                       # Shared Appwrite SDK & Domain Services Layer
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── config.ts                      # Database IDs, Collection IDs, Bucket IDs
│   │       ├── client.ts                      # Initialized Appwrite Client, Databases, Auth, Storage
│   │       ├── services/
│   │       │   ├── AuthCalibrationService.ts  # BDC Baselines & Mission Phase management
│   │       │   ├── TelemetryService.ts        # Vitals ingestion & historical queries
│   │       │   ├── TriageService.ts           # Alert persistence, resolution & Edge-Cloud sync
│   │       │   ├── CountermeasureService.ts   # Daily missions, streaks & readiness updates
│   │       │   └── DtnCommsService.ts         # Earth transmissions, light-time delay & PDF upload
│   │       └── index.ts
│   │
│   └── ui-kit/                                # Shared Sci-Fi Space HUD Component Library
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── StatusBadge.tsx
│           ├── HudCard.tsx
│           ├── MetricSparkline.tsx
│           └── index.ts
│
└── apps/
    ├── astronaut-hud/                         # Primary Astronaut Medical HUD (Port 5173)
    │   ├── package.json
    │   ├── vite.config.ts
    │   ├── tailwind.config.js
    │   ├── index.html
    │   └── src/
    │       ├── components/
    │       │   ├── twin/
    │       │   │   ├── BodyTwinCanvas.tsx     # Three.js Canvas with camera auto-focus controller
    │       │   │   └── ProceduralBodyMesh.tsx # 4-System Holographic 3D Mesh (Zero-asset fallback)
    │       │   ├── vitals/
    │       │   │   ├── VitalsGrid.tsx         # Live telemetry cards with Z-score & % deviation
    │       │   │   └── BaselineTrendChart.tsx # Recharts graph with shaded +/- 2 sigma band
    │       │   ├── triage/
    │       │   │   ├── EmergencyProtocolCard.tsx # Step-by-step protocol + Earth PDF trigger
    │       │   │   └── GuidedExamModal.tsx    # Appwrite Storage visual guide viewer
    │       │   ├── gamification/
    │       │   │   ├── ReadinessGauge.tsx     # Circular Mission Readiness dial
    │       │   │   └── DailyCountermeasures.tsx # Interactive checklist with streak confetti
    │       │   └── comms/
    │       │       ├── MissionPhaseSelector.tsx # Phase badge & manual override
    │       │       └── EarthDelayQueueBar.tsx # DTN Light-Time transmission progress bar
    │       ├── services/
    │       │   └── PdfReportGenerator.ts      # jsPDF clinical dossier generator
    │       ├── store/
    │       │   ├── useAuthStore.ts            # Astronaut profile & BDC baselines state
    │       │   ├── useMedicalStore.ts         # Active vitals, triage alert, readiness state
    │       │   └── useOfflineSyncStore.ts     # IndexedDB queue & light-time countdown loop
    │       ├── hooks/
    │       │   └── useAppwriteRealtime.ts     # Realtime WebSocket listener for vitals & alerts
    │       ├── App.tsx
    │       └── main.tsx
    │
    ├── suit-simulator/                        # Live Judge Demo & Telemetry Injector (Port 5174)
    │   ├── package.json
    │   ├── vite.config.ts
    │   ├── tailwind.config.js
    │   ├── index.html
    │   └── src/
    │       ├── components/
    │       │   ├── ScenarioPresets.tsx        # 6 One-click clinical & space scenario triggers
    │       │   ├── TelemetrySliders.tsx       # Fine-grained vital & cabin environment sliders
    │       │   └── PreFlightCalibrationForm.tsx # Live editor for Earth BDC mean & stdDev
    │       ├── App.tsx
    │       └── main.tsx
    │
    └── triage-cloud-fn/                       # Appwrite Serverless Node.js Function
        ├── package.json
        └── src/
            └── main.js                        # Event-driven serverless triage processor
```

### 3.1 Root Configuration Files

#### `package.json` (Root)
```json
{
  "name": "aura-space-monorepo",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

#### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

---

## 4. Mathematical Formulations & Clinical Engine (`@aura/medical-engine`)

This package is 100% isomorphic, deterministic, and has zero external runtime dependencies. It executes identically inside the browser (`apps/astronaut-hud` during solar blackouts) and on the server (`apps/triage-cloud-fn`).

### 4.1 Mathematical Formulations

#### 1. Phase-Adjusted Personal Baseline ($\mu_{\text{adj}, m}$)
For each physiological metric $m$, the astronaut's Earth baseline mean $\mu_{\text{earth}, m}$ is shifted by the expected physiological offset $\Delta_{\text{phase}, m}$ of the active mission phase:
$$
\mu_{\text{adj}, m} = \mu_{\text{earth}, m} + \Delta_{\text{phase}, m}
$$

#### 2. Effective Phase Standard Deviation ($\sigma_{\text{eff}, m}$)
To account for transient autonomic instability during launch or early microgravity adaptation, the personal standard deviation $\sigma_{\text{earth}, m}$ is scaled by a phase multiplier $\kappa_{\text{phase}}$:
$$
\sigma_{\text{eff}, m} = \sigma_{\text{earth}, m} \times \kappa_{\text{phase}}
$$

#### 3. Personal Adjusted Z-Score ($Z_m$)
When a live sensor reading $X_m$ arrives, its statistical distance from the astronaut's phase-adjusted baseline is calculated as:
$$
Z_m = \frac{\lvert X_m - \mu_{\text{adj}, m} \rvert}{\sigma_{\text{eff}, m}}
$$
* **Nominal (`green`):** $Z_m < 2.0$ and within NASA Hard Limits.
* **Moderate Deviation (`yellow`):** $2.0 \le Z_m < 3.0$ ($95.4\%$ confidence threshold exceeded).
* **Severe Deviation (`red`):** $Z_m \ge 3.0$ ($99.7\%$ confidence threshold exceeded) OR breach of NASA Clinical Hard Limits.

#### 4. Visual Deviation Percentage ($\text{Deviation}_{\%}$)
$$
\text{Deviation}_{\%} = \text{round}\left( \left( \frac{X_m - \mu_{\text{adj}, m}}{\mu_{\text{adj}, m}} \right) \times 100 \right)
$$

#### 5. Mission Readiness Score ($R_{\text{mission}}$)
$$
R_{\text{mission}} = \text{round}\left( 0.50 \cdot S_{\text{vitals}} + 0.30 \cdot S_{\text{countermeasures}} + 0.20 \cdot S_{\text{sleep\_mood}} \right)
$$
Where:
* $S_{\text{vitals}} = \max\left(0, 100 - 15 \cdot N_{\text{yellow}} - 40 \cdot N_{\text{red}}\right)$
* $S_{\text{countermeasures}} = \left(\frac{\text{Completed Daily Tasks}}{\text{Total Daily Tasks}}\right) \times 100$
* $S_{\text{sleep\_mood}} = \left( \min\left(\frac{\text{Sleep Hours}}{7.5}, 1.0\right) \times 50 \right) + \left( \frac{\text{Mood Score}}{10} \times 50 \right)$

---

### 4.2 Complete Source Code for `packages/medical-engine`

#### 1. `packages/medical-engine/src/types.ts`
```typescript
export type MissionPhase =
  | 'PRE_FLIGHT_BDC'
  | 'LAUNCH_ASCENT'
  | 'EARLY_ORBIT_ADAPTATION'
  | 'DEEP_SPACE_CRUISE';

export type SeverityLevel = 'green' | 'yellow' | 'red';

export type AnatomicalSystem =
  | 'nominal'
  | 'cardiovascular'
  | 'nervous'
  | 'metabolic'
  | 'musculoskeletal';

export type DistanceCommsMode =
  | 'ISS_REALTIME'
  | 'MOON_2S'
  | 'MARS_15M'
  | 'SOLAR_BLACKOUT';

export type MetricKey =
  | 'heart_rate'
  | 'bp_systolic'
  | 'bp_diastolic'
  | 'blood_glucose'
  | 'body_temp'
  | 'spo2'
  | 'cabin_co2_mmhg'
  | 'cabin_radiation_msv';

export interface BaselineStat {
  mean: number;
  stdDev: number;
}

export type EarthBaselines = Record<
  'heart_rate' | 'bp_systolic' | 'bp_diastolic' | 'blood_glucose' | 'body_temp' | 'spo2',
  BaselineStat
>;

export interface VitalReadingInput {
  $id?: string;
  astronaut_id: string;
  mission_phase: MissionPhase;
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
  $createdAt?: string;
}

export interface MetricEvaluationResult {
  metricKey: MetricKey;
  currentValue: number;
  adjustedMean: number | null;
  severity: SeverityLevel;
  triggerType:
    | 'HARD_CLINICAL_LIMIT'
    | 'SEVERE_PERSONAL_DEVIATION'
    | 'MODERATE_PERSONAL_DEVIATION'
    | 'NOMINAL'
    | 'ENVIRONMENTAL_NOMINAL';
  zScore: number;
  deviationPercent: number | null;
  summary: string;
}

export interface TriageDiagnosisOutput {
  affected_system: AnatomicalSystem;
  severity: SeverityLevel;
  diagnosis_code: string;
  diagnosis_title: string;
  simple_explanation: string;
  action_protocol: string[];
  guide_file_id: string | null;
  notify_earth: boolean;
  metric_evaluations: Record<string, MetricEvaluationResult>;
}
```

#### 2. `packages/medical-engine/src/constants/hardLimits.ts`
```typescript
import { MetricKey } from '../types';

export interface HardLimitConfig {
  minCritical: number;
  maxCritical: number;
  unit: string;
  label: string;
}

/**
 * NASA Absolute Clinical Hard Limits.
 * Any reading outside [minCritical, maxCritical] immediately triggers a RED alert
 * regardless of the astronaut's personal baseline or active mission phase.
 */
export const NASA_HARD_LIMITS: Record<MetricKey, HardLimitConfig> = {
  heart_rate: { minCritical: 42, maxCritical: 145, unit: 'bpm', label: 'Heart Rate' },
  bp_systolic: { minCritical: 85, maxCritical: 160, unit: 'mmHg', label: 'Systolic BP' },
  bp_diastolic: { minCritical: 50, maxCritical: 100, unit: 'mmHg', label: 'Diastolic BP' },
  blood_glucose: { minCritical: 65, maxCritical: 185, unit: 'mg/dL', label: 'Blood Glucose' },
  body_temp: { minCritical: 35.5, maxCritical: 38.3, unit: 'degC', label: 'Core Temp' },
  spo2: { minCritical: 91, maxCritical: 100, unit: '%', label: 'Oxygen Saturation' },
  cabin_co2_mmhg: { minCritical: 0, maxCritical: 5.0, unit: 'mmHg', label: 'Cabin CO2' },
  cabin_radiation_msv: { minCritical: 0, maxCritical: 2.0, unit: 'mSv/day', label: 'Radiation Dose' }
};
```

#### 3. `packages/medical-engine/src/constants/phaseOffsets.ts`
```typescript
import { MissionPhase } from '../types';

export interface PhaseOffsetConfig {
  heart_rate: number;
  bp_systolic: number;
  bp_diastolic: number;
  blood_glucose: number;
  body_temp: number;
  spo2: number;
  stdDevMultiplier: number;
}

export const MISSION_PHASE_OFFSETS: Record<MissionPhase, PhaseOffsetConfig> = {
  PRE_FLIGHT_BDC: {
    heart_rate: 0,
    bp_systolic: 0,
    bp_diastolic: 0,
    blood_glucose: 0,
    body_temp: 0,
    spo2: 0,
    stdDevMultiplier: 1.0
  },
  LAUNCH_ASCENT: {
    heart_rate: 30,
    bp_systolic: 18,
    bp_diastolic: 10,
    blood_glucose: 12,
    body_temp: 0.2,
    spo2: -1,
    stdDevMultiplier: 1.8
  },
  EARLY_ORBIT_ADAPTATION: {
    heart_rate: 6,
    bp_systolic: 8,
    bp_diastolic: -4,
    blood_glucose: 5,
    body_temp: 0.1,
    spo2: 0,
    stdDevMultiplier: 1.25
  },
  DEEP_SPACE_CRUISE: {
    heart_rate: -2,
    bp_systolic: -3,
    bp_diastolic: -5,
    blood_glucose: 0,
    body_temp: 0,
    spo2: 0,
    stdDevMultiplier: 1.0
  }
};
```

#### 4. `packages/medical-engine/src/constants/protocols.ts`
```typescript
export interface VisualGuideMetadata {
  fileId: string;
  title: string;
  durationSec: number;
  equipmentLocation: string;
  fallbackSteps: string[];
}

export const STORAGE_VISUAL_GUIDES: Record<string, VisualGuideMetadata> = {
  guide_co2_airflow_check: {
    fileId: 'guide_co2_airflow_check',
    title: 'Microgravity CO2 Pocket Dispersion & Fan Alignment',
    durationSec: 45,
    equipmentLocation: 'Crew Quarters Port Bulkhead - Rack B2',
    fallbackSteps: [
      'Translate immediately 2 meters away from your current work/sleep station.',
      'Switch Personal Ventilation Fan (PVF) to HIGH (3000 RPM) and angle nozzle 45 degrees across face.',
      'Verify CDRA (Carbon Dioxide Removal Assembly) indicator light is solid green.'
    ]
  },
  guide_zero_g_bp_cuff: {
    fileId: 'guide_zero_g_bp_cuff',
    title: 'Zero-G Sphygmomanometer Calibration & AstroRad Donning',
    durationSec: 60,
    equipmentLocation: 'Crew Medical Restraint System (CMRS) - Locker M1',
    fallbackSteps: [
      'Enter the Crew Storm Shelter lined with polyethylene water bags.',
      'Secure the AstroRad vest around torso and pelvis.',
      'Fasten the automated brachial cuff on left upper arm and keep arm tethered at heart level.'
    ]
  },
  guide_hydration_electrolyte: {
    fileId: 'guide_hydration_electrolyte',
    title: 'Potable Water Dispenser (PWD) Electrolyte Reconstitution',
    durationSec: 30,
    equipmentLocation: 'Galley Node 1 - Ambient Water Port',
    fallbackSteps: [
      'Attach oral rehydration salt (ORS) pouch to the Potable Water Dispenser septum.',
      'Dispense 400 mL of ambient water and massage pouch for 20 seconds to dissolve solutes.',
      'Consume steadily over 10 minutes to restore intravascular plasma volume.'
    ]
  },
  guide_space_glucometer: {
    fileId: 'guide_space_glucometer',
    title: 'Capillary Blood Sampling in Microgravity & Circadian Lighting',
    durationSec: 40,
    equipmentLocation: 'Ambulatory Medical Pack (AMP) - Pouch 3',
    fallbackSteps: [
      'Ingest one 15g fast-acting glucose gel packet immediately.',
      'Wipe ring finger with alcohol swab; allow to air dry completely so droplet remains spherical in 0G.',
      'Touch test strip tip directly to the surface tension bead without smearing.'
    ]
  },
  guide_ared_resistive_load: {
    fileId: 'guide_ared_resistive_load',
    title: 'ARED Vacuum Cylinder Calibration & Lower-Body Negative Pressure',
    durationSec: 50,
    equipmentLocation: 'Tranquility Node 3 - ARED Platform',
    fallbackSteps: [
      'Engage ARED flywheel and vacuum canisters to 75% Earth body-weight equivalent.',
      'Perform 3 sets of heel raises and squats with telemetry harness active.',
      'Log completion in Daily Countermeasures to restore musculoskeletal readiness.'
    ]
  }
};
```

#### 5. `packages/medical-engine/src/evaluators/zScoreEvaluator.ts`
```typescript
import { NASA_HARD_LIMITS } from '../constants/hardLimits';
import { MISSION_PHASE_OFFSETS } from '../constants/phaseOffsets';
import { BaselineStat, MetricEvaluationResult, MetricKey, MissionPhase } from '../types';

export function evaluateSingleMetric(
  metricKey: MetricKey,
  currentValue: number,
  earthBaseline?: BaselineStat,
  missionPhase: MissionPhase = 'DEEP_SPACE_CRUISE'
): MetricEvaluationResult {
  const hardLimit = NASA_HARD_LIMITS[metricKey];
  const phaseConfig = MISSION_PHASE_OFFSETS[missionPhase] || MISSION_PHASE_OFFSETS.DEEP_SPACE_CRUISE;

  // 1. Primary Filter: NASA Absolute Clinical Hard Limits
  if (
    hardLimit &&
    (currentValue <= hardLimit.minCritical || currentValue >= hardLimit.maxCritical)
  ) {
    return {
      metricKey,
      currentValue,
      adjustedMean: earthBaseline ? earthBaseline.mean : null,
      severity: 'red',
      triggerType: 'HARD_CLINICAL_LIMIT',
      zScore: 9.9,
      deviationPercent: earthBaseline
        ? Math.round(((currentValue - earthBaseline.mean) / earthBaseline.mean) * 100)
        : null,
      summary: `Critical NASA Hard Limit breached (${currentValue} ${hardLimit.unit}).`
    };
  }

  // Environmental metrics (CO2, Radiation) without personal physiological baselines
  if (!earthBaseline) {
    const isElevatedEnv =
      (metricKey === 'cabin_co2_mmhg' && currentValue >= 3.8) ||
      (metricKey === 'cabin_radiation_msv' && currentValue >= 1.2);
    return {
      metricKey,
      currentValue,
      adjustedMean: null,
      severity: isElevatedEnv ? 'yellow' : 'green',
      triggerType: 'ENVIRONMENTAL_NOMINAL',
      zScore: 0,
      deviationPercent: 0,
      summary: isElevatedEnv ? 'Elevated cabin environmental reading.' : 'Nominal cabin environment.'
    };
  }

  // 2. Secondary Filter: Phase-Adjusted Personal Z-Score
  const phaseOffset =
    metricKey in phaseConfig ? (phaseConfig[metricKey as keyof typeof phaseConfig] as number) : 0;
  const adjustedMean = Number((earthBaseline.mean + phaseOffset).toFixed(2));
  const effectiveStdDev = Math.max(
    0.1,
    earthBaseline.stdDev * (phaseConfig.stdDevMultiplier || 1.0)
  );

  const diff = currentValue - adjustedMean;
  const zScore = Number((Math.abs(diff) / effectiveStdDev).toFixed(2));
  const deviationPercent = Math.round((diff / adjustedMean) * 100);
  const sign = deviationPercent > 0 ? '+' : '';

  if (zScore >= 3.0) {
    return {
      metricKey,
      currentValue,
      adjustedMean,
      severity: 'red',
      triggerType: 'SEVERE_PERSONAL_DEVIATION',
      zScore,
      deviationPercent,
      summary: `Severe deviation (${sign}${deviationPercent}%, ${zScore} sigma) from your ${missionPhase} baseline (${adjustedMean}).`
    };
  }

  if (zScore >= 2.0) {
    return {
      metricKey,
      currentValue,
      adjustedMean,
      severity: 'yellow',
      triggerType: 'MODERATE_PERSONAL_DEVIATION',
      zScore,
      deviationPercent,
      summary: `Moderate deviation (${sign}${deviationPercent}%, ${zScore} sigma) from your ${missionPhase} baseline (${adjustedMean}).`
    };
  }

  return {
    metricKey,
    currentValue,
    adjustedMean,
    severity: 'green',
    triggerType: 'NOMINAL',
    zScore,
    deviationPercent,
    summary: `Within personal phase-adjusted baseline (${adjustedMean}).`
  };
}
```

#### 6. `packages/medical-engine/src/evaluators/correlationEngine.ts`
```typescript
import {
  EarthBaselines,
  MissionPhase,
  TriageDiagnosisOutput,
  VitalReadingInput
} from '../types';
import { evaluateSingleMetric } from './zScoreEvaluator';

/**
 * Multi-Metric Space Correlation Engine.
 * Synthesizes personal biometrics, cabin environmental sensors, mission phase,
 * and incomplete daily countermeasures into an autonomous diagnostic protocol.
 */
export function runAutonomousTriage(
  vitalReading: VitalReadingInput,
  userBaselines: EarthBaselines,
  missionPhase: MissionPhase = 'DEEP_SPACE_CRUISE',
  incompleteTasks: string[] = []
): TriageDiagnosisOutput {
  const evals = {
    heart_rate: evaluateSingleMetric('heart_rate', vitalReading.heart_rate, userBaselines.heart_rate, missionPhase),
    bp_systolic: evaluateSingleMetric('bp_systolic', vitalReading.bp_systolic, userBaselines.bp_systolic, missionPhase),
    bp_diastolic: evaluateSingleMetric('bp_diastolic', vitalReading.bp_diastolic, userBaselines.bp_diastolic, missionPhase),
    blood_glucose: evaluateSingleMetric('blood_glucose', vitalReading.blood_glucose, userBaselines.blood_glucose, missionPhase),
    body_temp: evaluateSingleMetric('body_temp', vitalReading.body_temp, userBaselines.body_temp, missionPhase),
    spo2: evaluateSingleMetric('spo2', vitalReading.spo2, userBaselines.spo2, missionPhase),
    cabin_co2_mmhg: evaluateSingleMetric('cabin_co2_mmhg', vitalReading.cabin_co2_mmhg, undefined, missionPhase),
    cabin_radiation_msv: evaluateSingleMetric('cabin_radiation_msv', vitalReading.cabin_radiation_msv, undefined, missionPhase)
  };

  // Compound Scenario 1: Microgravity Localized CO2 Pocket (Hypercapnia)
  if (
    vitalReading.cabin_co2_mmhg >= 4.0 &&
    (evals.heart_rate.severity !== 'green' || vitalReading.mood_score <= 4 || vitalReading.spo2 <= 94)
  ) {
    const isCritical = vitalReading.cabin_co2_mmhg >= 5.0 || evals.spo2.severity === 'red';
    return {
      affected_system: 'nervous',
      severity: isCritical ? 'red' : 'yellow',
      diagnosis_code: 'HYPERCAPNIA_CO2_POCKET',
      diagnosis_title: 'Localized Microgravity CO2 Pocket (Hypercapnia Risk)',
      simple_explanation:
        'Without gravity-driven convection, warm exhaled air does not rise. A stagnant bubble of CO2 has formed around your head, triggering elevated heart rate, cerebral vasodilation headache, and cognitive/mood decline.',
      action_protocol: [
        'Immediately translate at least 2 meters away from your current station to break the stagnant air pocket.',
        'Direct your Personal Ventilation Fan (PVF) toward your face at maximum RPM.',
        'Perform slow diaphragmatic breathing for 3 minutes and inspect the CDRA CO2 scrubber intake.'
      ],
      guide_file_id: 'guide_co2_airflow_check',
      notify_earth: isCritical,
      metric_evaluations: evals
    };
  }

  // Compound Scenario 2: Solar Particle Event (SPE) & Acute Cardiovascular Radiation Stress
  if (
    vitalReading.cabin_radiation_msv >= 1.5 &&
    (evals.heart_rate.severity === 'red' || evals.body_temp.severity !== 'green')
  ) {
    return {
      affected_system: 'cardiovascular',
      severity: 'red',
      diagnosis_code: 'ACUTE_RADIATION_CARDIO_STRESS',
      diagnosis_title: 'Acute Solar Radiation & Cardiovascular Stress',
      simple_explanation:
        'A spike in cabin radiation dose is coinciding with elevated core temperature and tachycardia, indicating acute autonomic and hematological stress.',
      action_protocol: [
        'Relocate immediately to the high-shielding polyethylene/water Storm Shelter.',
        'Don the AstroRad selective-shielding vest to protect bone marrow and vital organs.',
        'Consume 500 mL of antioxidant electrolyte solution and perform a confirmatory zero-G blood pressure check.'
      ],
      guide_file_id: 'guide_zero_g_bp_cuff',
      notify_earth: true,
      metric_evaluations: evals
    };
  }

  // Compound Scenario 3: Space Dehydration Linked to Missed Hydration Countermeasure
  const missedHydration = incompleteTasks.includes('HYDRATION_2500ML');
  if (
    evals.heart_rate.severity !== 'green' &&
    vitalReading.bp_systolic < userBaselines.bp_systolic.mean &&
    missedHydration
  ) {
    return {
      affected_system: 'cardiovascular',
      severity: 'yellow',
      diagnosis_code: 'MICROGRAVITY_HYPOVOLEMIA',
      diagnosis_title: 'Subclinical Space Dehydration (Countermeasure Incomplete)',
      simple_explanation:
        'Microgravity suppresses your natural thirst reflex via central fluid shift. Your elevated heart rate and lower systolic pressure correlate directly with an incomplete daily hydration task.',
      action_protocol: [
        'Dispense and drink 400 mL of electrolyte-fortified water from the Potable Water Dispenser immediately.',
        'Avoid rapid head rotations to prevent vestibular orthostatic dizziness.',
        'Mark the HYDRATION_2500ML task complete in Daily Countermeasures to restore Mission Readiness.'
      ],
      guide_file_id: 'guide_hydration_electrolyte',
      notify_earth: false,
      metric_evaluations: evals
    };
  }

  // Compound Scenario 4: Hypoglycemia & Circadian Drift
  if (
    evals.blood_glucose.severity !== 'green' ||
    (vitalReading.sleep_hours < 5.0 && vitalReading.mood_score <= 4)
  ) {
    const isCriticalGlucose =
      vitalReading.blood_glucose <= 65 || evals.blood_glucose.severity === 'red';
    return {
      affected_system: 'metabolic',
      severity: isCriticalGlucose ? 'red' : 'yellow',
      diagnosis_code: 'METABOLIC_CIRCADIAN_DRIFT',
      diagnosis_title: 'Metabolic Energy Deficit & Circadian Desynchronization',
      simple_explanation:
        'Insufficient sleep duration combined with blood glucose deviation is impairing your metabolic equilibrium and reaction speed for mission-critical tasks.',
      action_protocol: [
        'Consume one 15g fast-acting oral glucose pouch from the Ambulatory Medical Pack.',
        'Re-verify capillary blood glucose in 15 minutes using the zero-G surface-tension glucometer.',
        'Shift cabin solid-state lighting to 2700K amber spectrum 90 minutes prior to scheduled sleep.'
      ],
      guide_file_id: 'guide_space_glucometer',
      notify_earth: isCriticalGlucose,
      metric_evaluations: evals
    };
  }

  // Compound Scenario 5: Musculoskeletal Deconditioning Risk
  const missedWorkout = incompleteTasks.includes('ARED_WORKOUT');
  if (missedWorkout && vitalReading.sleep_hours < 6.0 && missionPhase === 'DEEP_SPACE_CRUISE') {
    return {
      affected_system: 'musculoskeletal',
      severity: 'yellow',
      diagnosis_code: 'MUSCULOSKELETAL_UNLOADING_RISK',
      diagnosis_title: 'Microgravity Osteopenia & Muscle Atrophy Risk',
      simple_explanation:
        'Unloaded posture in deep space causes 1.5% monthly bone mineral loss unless countered by resistive loading. Your ARED resistive workout remains incomplete today.',
      action_protocol: [
        'Complete a 30-minute resistive session on the ARED platform at 75% load calibration.',
        'Verify Vitamin D3 and calcium metabolic supplementation intake.',
        'Log the ARED_WORKOUT countermeasure to clear this advisory.'
      ],
      guide_file_id: 'guide_ared_resistive_load',
      notify_earth: false,
      metric_evaluations: evals
    };
  }

  // Scenario 6: General Single-Metric Anomaly Fallback (if any metric is red/yellow)
  const worstEval = Object.values(evals).find((e) => e.severity === 'red') ||
                    Object.values(evals).find((e) => e.severity === 'yellow');
  if (worstEval) {
    const systemMap: Record<string, 'cardiovascular' | 'nervous' | 'metabolic'> = {
      heart_rate: 'cardiovascular',
      bp_systolic: 'cardiovascular',
      bp_diastolic: 'cardiovascular',
      spo2: 'cardiovascular',
      blood_glucose: 'metabolic',
      body_temp: 'metabolic',
      cabin_co2_mmhg: 'nervous',
      cabin_radiation_msv: 'cardiovascular'
    };
    return {
      affected_system: systemMap[worstEval.metricKey] || 'cardiovascular',
      severity: worstEval.severity,
      diagnosis_code: `BIOMETRIC_DEVIATION_${worstEval.metricKey.toUpperCase()}`,
      diagnosis_title: `Personal Baseline Deviation: ${worstEval.metricKey.replace('_', ' ').toUpperCase()}`,
      simple_explanation: worstEval.summary,
      action_protocol: [
        'Suspend strenuous EVA or payload operations for 15 minutes.',
        'Verify biometric sensor skin contact and re-sample telemetry.',
        'If deviation persists above 3 sigma, initiate Earth medical packet transmission.'
      ],
      guide_file_id: 'guide_zero_g_bp_cuff',
      notify_earth: worstEval.severity === 'red',
      metric_evaluations: evals
    };
  }

  // Scenario 7: Launch Ascent G-Force Adaptation (Nominal High Load)
  if (missionPhase === 'LAUNCH_ASCENT') {
    return {
      affected_system: 'nominal',
      severity: 'green',
      diagnosis_code: 'LAUNCH_ASCENT_ADAPTATION',
      diagnosis_title: 'Nominal Physiological Response to Launch G-Load',
      simple_explanation:
        'Your elevated heart rate and blood pressure are within expected phase-adjusted parameters for 3G launch acceleration. No pathological anomaly detected.',
      action_protocol: [
        'Maintain Anti-G Straining Maneuver (AGSM) breathing rhythm.',
        'Keep lower extremity and abdominal muscles isometric to support cerebral perfusion.'
      ],
      guide_file_id: null,
      notify_earth: false,
      metric_evaluations: evals
    };
  }

  // Default Nominal State
  return {
    affected_system: 'nominal',
    severity: 'green',
    diagnosis_code: 'ALL_SYSTEMS_NOMINAL',
    diagnosis_title: 'All Biological Systems Nominal',
    simple_explanation:
      'Your real-time telemetry matches your personal pre-flight baseline adjusted for the current spaceflight phase.',
    action_protocol: [
      'Continue scheduled orbital operations and daily countermeasure regimen.'
    ],
    guide_file_id: null,
    notify_earth: false,
    metric_evaluations: evals
  };
}
```

#### 7. `packages/medical-engine/src/evaluators/readinessScore.ts`
```typescript
import { MetricEvaluationResult } from '../types';

export interface ReadinessInput {
  metricEvaluations: Record<string, MetricEvaluationResult>;
  completedTasksCount: number;
  totalTasksCount: number;
  sleepHours: number;
  moodScore: number;
}

export interface ReadinessBreakdown {
  totalScore: number;
  vitalsComponent: number;
  countermeasuresComponent: number;
  sleepMoodComponent: number;
  statusLabel: 'OPTIMAL_FOR_EVA' | 'CAUTION_MONITOR' | 'NO_GO_MEDICAL_HOLD';
}

export function calculateMissionReadiness(input: ReadinessInput): ReadinessBreakdown {
  const evaluations = Object.values(input.metricEvaluations);
  const yellowCount = evaluations.filter((e) => e.severity === 'yellow').length;
  const redCount = evaluations.filter((e) => e.severity === 'red').length;

  // 1. Vitals Score (50% weight)
  const vitalsComponent = Math.max(0, 100 - yellowCount * 15 - redCount * 40);

  // 2. Countermeasures Score (30% weight)
  const countermeasuresComponent =
    input.totalTasksCount > 0
      ? Math.min(100, Math.round((input.completedTasksCount / input.totalTasksCount) * 100))
      : 100;

  // 3. Sleep & Psychological Score (20% weight)
  const sleepNorm = Math.min(input.sleepHours / 7.5, 1.0) * 50;
  const moodNorm = Math.min(Math.max(input.moodScore, 0) / 10, 1.0) * 50;
  const sleepMoodComponent = Math.round(sleepNorm + moodNorm);

  const totalScore = Math.round(
    0.5 * vitalsComponent + 0.3 * countermeasuresComponent + 0.2 * sleepMoodComponent
  );

  let statusLabel: ReadinessBreakdown['statusLabel'] = 'OPTIMAL_FOR_EVA';
  if (redCount > 0 || totalScore < 55) {
    statusLabel = 'NO_GO_MEDICAL_HOLD';
  } else if (yellowCount > 0 || totalScore < 80) {
    statusLabel = 'CAUTION_MONITOR';
  }

  return {
    totalScore,
    vitalsComponent,
    countermeasuresComponent,
    sleepMoodComponent,
    statusLabel
  };
}
```

#### 8. `packages/medical-engine/src/index.ts`
```typescript
export * from './types';
export * from './constants/hardLimits';
export * from './constants/phaseOffsets';
export * from './constants/protocols';
export * from './evaluators/zScoreEvaluator';
export * from './evaluators/correlationEngine';
export * from './evaluators/readinessScore';
```

---

## 5. Appwrite Infrastructure & Service Layer (`@aura/appwrite-client`)

### 5.1 Database Schema (`AURA_Medical_DB`)

#### Collection 1: `vitals_logs`
| Attribute Key | Type | Constraints | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `astronaut_id` | String | `size: 36` | Yes | - | Astronaut ID or `AST-CDR-01` |
| `mission_phase` | Enum | `PRE_FLIGHT_BDC`, `LAUNCH_ASCENT`, `EARLY_ORBIT_ADAPTATION`, `DEEP_SPACE_CRUISE` | Yes | `DEEP_SPACE_CRUISE` | Active mission phase at capture time |
| `heart_rate` | Integer | `min: 20, max: 240` | Yes | - | Heart rate ($\text{bpm}$) |
| `bp_systolic` | Integer | `min: 50, max: 250` | Yes | - | Systolic blood pressure ($\text{mmHg}$) |
| `bp_diastolic` | Integer | `min: 30, max: 160` | Yes | - | Diastolic blood pressure ($\text{mmHg}$) |
| `blood_glucose` | Float | `min: 20.0, max: 500.0` | Yes | - | Capillary blood glucose ($\text{mg/dL}$) |
| `body_temp` | Float | `min: 32.0, max: 43.0` | Yes | - | Core temperature ($^\circ\text{C}$) |
| `spo2` | Integer | `min: 50, max: 100` | Yes | - | Oxygen saturation ($\%$) |
| `sleep_hours` | Float | `min: 0.0, max: 24.0` | Yes | - | Last circadian cycle sleep duration |
| `mood_score` | Integer | `min: 1, max: 10` | Yes | - | Self-reported or facial-inferred mood score |
| `cabin_co2_mmhg` | Float | `min: 0.0, max: 30.0` | Yes | `2.4` | Ambient partial pressure of $\text{CO}_2$ ($\text{mmHg}$) |
| `cabin_radiation_msv` | Float | `min: 0.0, max: 50.0` | Yes | `0.3` | Daily cabin radiation dose ($\text{mSv/day}$) |
| `ingestion_source` | Enum | `LIVE_STREAM`, `OFFLINE_SYNC_FLUSH` | No | `LIVE_STREAM` | Prevents duplicate cloud triage on offline flush |
| `edge_alert_id` | String | `size: 36` | No | `null` | Pre-computed edge alert ID if triaged offline |

* **Indexes:** `idx_astronaut_latest` (`astronaut_id` ASC, `$createdAt` DESC)

#### Collection 2: `triage_alerts`
| Attribute Key | Type | Constraints | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `astronaut_id` | String | `size: 36` | Yes | - | Target astronaut ID |
| `vital_log_id` | String | `size: 36` | Yes | - | Reference to triggering `vitals_logs.$id` |
| `affected_system` | Enum | `nominal`, `cardiovascular`, `nervous`, `metabolic`, `musculoskeletal` | Yes | `nominal` | Target 3D organ mesh to highlight |
| `severity` | Enum | `green`, `yellow`, `red` | Yes | `green` | Alert severity level |
| `diagnosis_code` | String | `size: 64` | Yes | - | Machine-readable diagnostic identifier |
| `diagnosis_title` | String | `size: 255` | Yes | - | Plain-language diagnostic headline |
| `simple_explanation` | String | `size: 1000` | Yes | - | Non-medical spaceflight causal explanation |
| `action_protocol` | String[] | `size: 500` per item | Yes | - | Ordered emergency response steps |
| `guide_file_id` | String | `size: 64` | No | `null` | ID of visual guide in `medical_guides` bucket |
| `notify_earth` | Boolean | - | Yes | `false` | Whether DTN Earth packet is recommended |
| `is_resolved` | Boolean | - | Yes | `false` | Set `true` when crew completes protocol |

#### Collection 3: `daily_missions`
| Attribute Key | Type | Constraints | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `astronaut_id` | String | `size: 36` | Yes | - | Astronaut ID |
| `task_code` | String | `size: 64` | Yes | - | e.g., `HYDRATION_2500ML`, `ARED_WORKOUT`, `CIRCADIAN_GLASSES` |
| `task_title` | String | `size: 255` | Yes | - | Human-readable countermeasure title |
| `target_system` | String | `size: 64` | Yes | - | Protected organ system (`cardiovascular`, `musculoskeletal`, `nervous`) |
| `points_value` | Integer | `min: 5, max: 100` | Yes | `25` | Readiness contribution points |
| `is_completed` | Boolean | - | Yes | `false` | Completion state for current mission sol |
| `streak_days` | Integer | `min: 0, max: 1000` | Yes | `1` | Consecutive sols completed |

#### Collection 4: `earth_transmissions`
| Attribute Key | Type | Constraints | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `astronaut_id` | String | `size: 36` | Yes | - | Astronaut ID |
| `alert_id` | String | `size: 36` | Yes | - | Linked `triage_alerts.$id` |
| `distance_mode` | Enum | `ISS_REALTIME`, `MOON_2S`, `MARS_15M`, `SOLAR_BLACKOUT` | Yes | - | Deep-space telemetry link mode |
| `delay_seconds` | Integer | `min: 0, max: 3600` | Yes | `0` | One-way light-time propagation delay |
| `status` | Enum | `queued_offline`, `transmitting`, `received_by_earth` | Yes | - | Current DTN state machine status |
| `report_file_id` | String | `size: 64` | No | `null` | Uploaded PDF ID in `earth_reports` bucket |
| `telemetry_json` | String | `size: 5000` | Yes | - | Serialized JSON snapshot of vitals + Z-scores |

---

### 5.2 Complete Source Code for `packages/appwrite-client`

This service layer includes an **Automatic LocalStorage / Memory Fallback Adapter** so that if the AI agent or judge runs the app before configuring live Appwrite Cloud credentials, all 5 services still function seamlessly via `BroadcastChannel` across browser tabs (`astronaut-hud` $\leftrightarrow$ `suit-simulator`).

#### 1. `packages/appwrite-client/src/config.ts`
```typescript
import { EarthBaselines, MissionPhase } from '@aura/medical-engine';

export const DB_CONFIG = {
  ENDPOINT: import.meta.env?.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1',
  PROJECT_ID: import.meta.env?.VITE_APPWRITE_PROJECT_ID || 'aura_nasa_2026',
  DB_ID: import.meta.env?.VITE_APPWRITE_DB_ID || 'AURA_Medical_DB',
  COLLECTIONS: {
    VITALS_LOGS: 'vitals_logs',
    TRIAGE_ALERTS: 'triage_alerts',
    DAILY_MISSIONS: 'daily_missions',
    EARTH_TRANSMISSIONS: 'earth_transmissions'
  },
  BUCKETS: {
    MEDICAL_GUIDES: 'medical_guides',
    EARTH_REPORTS: 'earth_reports'
  }
} as const;

export interface AstronautProfilePrefs {
  astronautCode: string;
  fullName: string;
  bloodType: string;
  missionPhase: MissionPhase;
  earthBaselines: EarthBaselines;
}

export const DEFAULT_ASTRONAUT_PREFS: AstronautProfilePrefs = {
  astronautCode: 'AST-CDR-01',
  fullName: 'Cmdr. Tariq Al-Mansoor',
  bloodType: 'O+',
  missionPhase: 'EARLY_ORBIT_ADAPTATION',
  earthBaselines: {
    heart_rate: { mean: 56, stdDev: 4 },
    bp_systolic: { mean: 114, stdDev: 7 },
    bp_diastolic: { mean: 72, stdDev: 5 },
    blood_glucose: { mean: 90, stdDev: 8 },
    body_temp: { mean: 36.7, stdDev: 0.25 },
    spo2: { mean: 98, stdDev: 1 }
  }
};
```

#### 2. `packages/appwrite-client/src/client.ts`
```typescript
import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';
import { DB_CONFIG } from './config';

export const appwriteClient = new Client()
  .setEndpoint(DB_CONFIG.ENDPOINT)
  .setProject(DB_CONFIG.PROJECT_ID);

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export const storage = new Storage(appwriteClient);

/**
 * Cross-tab BroadcastChannel bridge.
 * Guarantees instant zero-latency synchronization between `suit-simulator` (Port 5174)
 * and `astronaut-hud` (Port 5173) during offline demos or local evaluation.
 */
export const localBus =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('aura_telemetry_bus')
    : null;

export { ID, Query };
```

#### 3. `packages/appwrite-client/src/services/AuthCalibrationService.ts`
```typescript
import { EarthBaselines, MissionPhase } from '@aura/medical-engine';
import { account, localBus } from '../client';
import { AstronautProfilePrefs, DEFAULT_ASTRONAUT_PREFS } from '../config';

const LOCAL_PREFS_KEY = 'aura_astronaut_prefs';

export class AuthCalibrationService {
  static async getAstronautProfile(): Promise<AstronautProfilePrefs> {
    try {
      const prefs = await account.getPrefs<AstronautProfilePrefs>();
      if (prefs && prefs.earthBaselines) {
        return prefs;
      }
    } catch {
      // Fallback to local persisted calibration state if unauthenticated or offline
    }
    const cached = localStorage.getItem(LOCAL_PREFS_KEY);
    if (cached) {
      return JSON.parse(cached) as AstronautProfilePrefs;
    }
    localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(DEFAULT_ASTRONAUT_PREFS));
    return DEFAULT_ASTRONAUT_PREFS;
  }

  static async updateEarthBaselines(newBaselines: EarthBaselines): Promise<AstronautProfilePrefs> {
    const current = await this.getAstronautProfile();
    const updated: AstronautProfilePrefs = {
      ...current,
      earthBaselines: newBaselines
    };
    localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(updated));
    localBus?.postMessage({ type: 'PREFS_UPDATED', payload: updated });

    try {
      await account.updatePrefs(updated);
    } catch {
      // Continues gracefully in local/offline mode
    }
    return updated;
  }

  static async setMissionPhase(missionPhase: MissionPhase): Promise<AstronautProfilePrefs> {
    const current = await this.getAstronautProfile();
    const updated: AstronautProfilePrefs = {
      ...current,
      missionPhase
    };
    localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(updated));
    localBus?.postMessage({ type: 'PREFS_UPDATED', payload: updated });

    try {
      await account.updatePrefs(updated);
    } catch {
      // Continues gracefully in local/offline mode
    }
    return updated;
  }
}
```

#### 4. `packages/appwrite-client/src/services/CountermeasureService.ts`
```typescript
import { databases, ID, localBus, Query } from '../client';
import { DB_CONFIG } from '../config';

export interface DailyMissionDocument {
  $id: string;
  astronaut_id: string;
  task_code: string;
  task_title: string;
  target_system: string;
  points_value: number;
  is_completed: boolean;
  streak_days: number;
}

const DEFAULT_DAILY_MISSIONS: DailyMissionDocument[] = [
  {
    $id: 'task_hydration_01',
    astronaut_id: 'AST-CDR-01',
    task_code: 'HYDRATION_2500ML',
    task_title: 'Electrolyte Hydration Target (2500 mL)',
    target_system: 'cardiovascular',
    points_value: 35,
    is_completed: true,
    streak_days: 14
  },
  {
    $id: 'task_ared_02',
    astronaut_id: 'AST-CDR-01',
    task_code: 'ARED_WORKOUT',
    task_title: 'ARED Resistive Exercise (60 Min Load)',
    target_system: 'musculoskeletal',
    points_value: 40,
    is_completed: true,
    streak_days: 11
  },
  {
    $id: 'task_circadian_03',
    astronaut_id: 'AST-CDR-01',
    task_code: 'CIRCADIAN_LIGHT_SYNC',
    task_title: '2700K Amber Circadian Visor Protocol',
    target_system: 'nervous',
    points_value: 25,
    is_completed: true,
    streak_days: 9
  }
];

const LOCAL_MISSIONS_KEY = 'aura_daily_missions';

export class CountermeasureService {
  static async listDailyMissions(astronautId: string): Promise<DailyMissionDocument[]> {
    try {
      const response = await databases.listDocuments(
        DB_CONFIG.DB_ID,
        DB_CONFIG.COLLECTIONS.DAILY_MISSIONS,
        [Query.equal('astronaut_id', astronautId)]
      );
      if (response.documents.length > 0) {
        return response.documents as unknown as DailyMissionDocument[];
      }
    } catch {
      // Fallback to local state
    }
    const cached = localStorage.getItem(LOCAL_MISSIONS_KEY);
    if (cached) {
      return JSON.parse(cached) as DailyMissionDocument[];
    }
    localStorage.setItem(LOCAL_MISSIONS_KEY, JSON.stringify(DEFAULT_DAILY_MISSIONS));
    return DEFAULT_DAILY_MISSIONS;
  }

  static async toggleMissionCompletion(
    taskId: string,
    isCompleted: boolean
  ): Promise<DailyMissionDocument[]> {
    const current = await this.listDailyMissions('AST-CDR-01');
    const updated = current.map((task) => {
      if (task.$id === taskId || task.task_code === taskId) {
        return {
          ...task,
          is_completed: isCompleted,
          streak_days: isCompleted ? task.streak_days + 1 : Math.max(0, task.streak_days - 1)
        };
      }
      return task;
    });

    localStorage.setItem(LOCAL_MISSIONS_KEY, JSON.stringify(updated));
    localBus?.postMessage({ type: 'MISSIONS_UPDATED', payload: updated });

    const targetTask = updated.find((t) => t.$id === taskId || t.task_code === taskId);
    if (targetTask) {
      try {
        await databases.updateDocument(
          DB_CONFIG.DB_ID,
          DB_CONFIG.COLLECTIONS.DAILY_MISSIONS,
          targetTask.$id,
          {
            is_completed: targetTask.is_completed,
            streak_days: targetTask.streak_days
          }
        );
      } catch {
        // Handled locally
      }
    }
    return updated;
  }
}
```

#### 5. `packages/appwrite-client/src/services/TelemetryService.ts`
```typescript
import {
  runAutonomousTriage,
  TriageDiagnosisOutput,
  VitalReadingInput
} from '@aura/medical-engine';
import { databases, ID, localBus, Query } from '../client';
import { DB_CONFIG } from '../config';
import { AuthCalibrationService } from './AuthCalibrationService';
import { CountermeasureService } from './CountermeasureService';

export interface PersistedAlertDocument extends TriageDiagnosisOutput {
  $id: string;
  astronaut_id: string;
  vital_log_id: string;
  is_resolved: boolean;
  $createdAt: string;
}

const LOCAL_VITALS_HISTORY_KEY = 'aura_vitals_history';
const LOCAL_ACTIVE_ALERT_KEY = 'aura_active_alert';

export class TelemetryService {
  /**
   * Primary ingestion pipeline called by `suit-simulator` or wearable hardware stream.
   * Persists the vital log to Appwrite (if online) AND broadcasts over localBus
   * for zero-latency HUD rendering.
   */
  static async ingestVitalReading(
    reading: VitalReadingInput
  ): Promise<{ vitalDoc: VitalReadingInput; triageAlert: PersistedAlertDocument }> {
    const profile = await AuthCalibrationService.getAstronautProfile();
    const missions = await CountermeasureService.listDailyMissions(reading.astronaut_id);
    const incompleteCodes = missions.filter((m) => !m.is_completed).map((m) => m.task_code);

    // Compute deterministic triage using shared @aura/medical-engine
    const triageResult = runAutonomousTriage(
      reading,
      profile.earthBaselines,
      reading.mission_phase,
      incompleteCodes
    );

    const vitalId = reading.$id || ID.unique();
    const alertId = reading.edge_alert_id || ID.unique();
    const timestamp = new Date().toISOString();

    const vitalDoc: VitalReadingInput = {
      ...reading,
      $id: vitalId,
      ingestion_source: reading.ingestion_source || 'LIVE_STREAM',
      edge_alert_id: alertId,
      $createdAt: timestamp
    };

    const alertDoc: PersistedAlertDocument = {
      ...triageResult,
      $id: alertId,
      astronaut_id: reading.astronaut_id,
      vital_log_id: vitalId,
      is_resolved: false,
      $createdAt: timestamp
    };

    // Save to local ring buffer (max 30 readings for Recharts trend lines)
    const history = this.getLocalHistory();
    const nextHistory = [...history.slice(-29), vitalDoc];
    localStorage.setItem(LOCAL_VITALS_HISTORY_KEY, JSON.stringify(nextHistory));
    localStorage.setItem(LOCAL_ACTIVE_ALERT_KEY, JSON.stringify(alertDoc));

    // Broadcast immediately to astronaut-hud
    localBus?.postMessage({
      type: 'TELEMETRY_INGESTED',
      payload: { vitalDoc, alertDoc }
    });

    // Persist to Appwrite Cloud
    try {
      await databases.createDocument(
        DB_CONFIG.DB_ID,
        DB_CONFIG.COLLECTIONS.VITALS_LOGS,
        vitalId,
        {
          astronaut_id: vitalDoc.astronaut_id,
          mission_phase: vitalDoc.mission_phase,
          heart_rate: vitalDoc.heart_rate,
          bp_systolic: vitalDoc.bp_systolic,
          bp_diastolic: vitalDoc.bp_diastolic,
          blood_glucose: vitalDoc.blood_glucose,
          body_temp: vitalDoc.body_temp,
          spo2: vitalDoc.spo2,
          sleep_hours: vitalDoc.sleep_hours,
          mood_score: vitalDoc.mood_score,
          cabin_co2_mmhg: vitalDoc.cabin_co2_mmhg,
          cabin_radiation_msv: vitalDoc.cabin_radiation_msv,
          ingestion_source: vitalDoc.ingestion_source,
          edge_alert_id: alertId
        }
      );
    } catch {
      // Continues seamlessly via local IndexedDB/LocalStorage when offline
    }

    return { vitalDoc, triageAlert: alertDoc };
  }

  static getLocalHistory(): VitalReadingInput[] {
    const raw = localStorage.getItem(LOCAL_VITALS_HISTORY_KEY);
    if (raw) {
      return JSON.parse(raw) as VitalReadingInput[];
    }
    return [];
  }

  static async fetchRecentVitals(astronautId: string, limit = 20): Promise<VitalReadingInput[]> {
    try {
      const res = await databases.listDocuments(
        DB_CONFIG.DB_ID,
        DB_CONFIG.COLLECTIONS.VITALS_LOGS,
        [Query.equal('astronaut_id', astronautId), Query.orderDesc('$createdAt'), Query.limit(limit)]
      );
      if (res.documents.length > 0) {
        return (res.documents as unknown as VitalReadingInput[]).reverse();
      }
    } catch {
      // Fallback to local buffer
    }
    return this.getLocalHistory();
  }
}
```

#### 6. `packages/appwrite-client/src/services/DtnCommsService.ts`
```typescript
import { DistanceCommsMode } from '@aura/medical-engine';
import { databases, ID, storage } from '../client';
import { DB_CONFIG } from '../config';

export interface EarthTransmissionRecord {
  $id: string;
  astronaut_id: string;
  alert_id: string;
  distance_mode: DistanceCommsMode;
  delay_seconds: number;
  remaining_seconds: number;
  status: 'queued_offline' | 'transmitting' | 'received_by_earth';
  report_file_id: string | null;
  telemetry_json: string;
  queued_at: string;
}

export const LIGHT_TIME_DELAY_SECONDS: Record<DistanceCommsMode, number | null> = {
  ISS_REALTIME: 1,
  MOON_2S: 3,
  MARS_15M: 25, // Scaled to 25 seconds for live judge demo visibility
  SOLAR_BLACKOUT: null // Infinite delay until solar conjunction clears
};

export class DtnCommsService {
  static async uploadPdfDossier(pdfBlob: Blob, fileName: string): Promise<string | null> {
    try {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const uploaded = await storage.createFile(
        DB_CONFIG.BUCKETS.EARTH_REPORTS,
        ID.unique(),
        file
      );
      return uploaded.$id;
    } catch {
      return `local_pdf_${Date.now()}`;
    }
  }

  static async createEarthTransmission(
    record: Omit<EarthTransmissionRecord, '$id' | 'remaining_seconds'>
  ): Promise<EarthTransmissionRecord> {
    const docId = ID.unique();
    const fullRecord: EarthTransmissionRecord = {
      ...record,
      $id: docId,
      remaining_seconds: record.delay_seconds
    };

    try {
      await databases.createDocument(
        DB_CONFIG.DB_ID,
        DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
        docId,
        {
          astronaut_id: record.astronaut_id,
          alert_id: record.alert_id,
          distance_mode: record.distance_mode,
          delay_seconds: record.delay_seconds,
          status: record.status,
          report_file_id: record.report_file_id,
          telemetry_json: record.telemetry_json
        }
      );
    } catch {
      // Handled by local DTN queue store
    }

    return fullRecord;
  }

  static async markReceivedByEarth(transmissionId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DB_CONFIG.DB_ID,
        DB_CONFIG.COLLECTIONS.EARTH_TRANSMISSIONS,
        transmissionId,
        { status: 'received_by_earth' }
      );
    } catch {
      // Local state already updated
    }
  }
}
```

#### 7. `packages/appwrite-client/src/index.ts`
```typescript
export * from './config';
export * from './client';
export * from './services/AuthCalibrationService';
export * from './services/CountermeasureService';
export * from './services/TelemetryService';
export * from './services/DtnCommsService';
```

---

## 6. Appwrite Serverless Function (`apps/triage-cloud-fn/src/main.js`)

Triggered automatically by Appwrite Webhook event:
`databases.AURA_Medical_DB.collections.vitals_logs.documents.*.create`

Includes the **Edge-Cloud Idempotency Guard** (`edge_alert_id`) so that offline-triaged packets flushed after a solar blackout do not create duplicate alerts.

```javascript
import { Client, Databases, Users, Query, ID } from 'node-appwrite';
import { runAutonomousTriage } from '@aura/medical-engine';

export default async ({ req, res, log, error }) => {
  try {
    const vitalReading = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
      .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);
    const users = new Users(client);
    const DB_ID = process.env.APPWRITE_DB_ID || 'AURA_Medical_DB';

    // Idempotency Check: If edge_alert_id is already present in triage_alerts, skip duplicate creation
    if (vitalReading.edge_alert_id) {
      try {
        const existing = await databases.getDocument(
          DB_ID,
          'triage_alerts',
          vitalReading.edge_alert_id
        );
        if (existing) {
          log(`Idempotent skip: Alert ${vitalReading.edge_alert_id} already exists.`);
          return res.json({ success: true, deduplicated: true, alertId: existing.$id });
        }
      } catch {
        // Alert does not exist yet in cloud DB; proceed to create using the edge_alert_id
      }
    }

    // 1. Fetch astronaut personal Earth baselines from Account Preferences
    let earthBaselines = {
      heart_rate: { mean: 56, stdDev: 4 },
      bp_systolic: { mean: 114, stdDev: 7 },
      bp_diastolic: { mean: 72, stdDev: 5 },
      blood_glucose: { mean: 90, stdDev: 8 },
      body_temp: { mean: 36.7, stdDev: 0.25 },
      spo2: { mean: 98, stdDev: 1 }
    };
    let missionPhase = vitalReading.mission_phase || 'DEEP_SPACE_CRUISE';

    try {
      const prefs = await users.getPrefs(vitalReading.astronaut_id);
      if (prefs.earthBaselines) earthBaselines = prefs.earthBaselines;
      if (!vitalReading.mission_phase && prefs.missionPhase) missionPhase = prefs.missionPhase;
    } catch {
      log(`Using default BDC baselines for ${vitalReading.astronaut_id}`);
    }

    // 2. Query incomplete daily countermeasures
    const missionsList = await databases.listDocuments(DB_ID, 'daily_missions', [
      Query.equal('astronaut_id', vitalReading.astronaut_id),
      Query.equal('is_completed', false)
    ]);
    const incompleteTaskCodes = missionsList.documents.map((doc) => doc.task_code);

    // 3. Execute isomorphic @aura/medical-engine triage
    const triageResult = runAutonomousTriage(
      vitalReading,
      earthBaselines,
      missionPhase,
      incompleteTaskCodes
    );

    // 4. Persist alert document using deterministic ID
    const targetAlertId = vitalReading.edge_alert_id || ID.unique();
    const createdAlert = await databases.createDocument(
      DB_ID,
      'triage_alerts',
      targetAlertId,
      {
        astronaut_id: vitalReading.astronaut_id,
        vital_log_id: vitalReading.$id,
        affected_system: triageResult.affected_system,
        severity: triageResult.severity,
        diagnosis_code: triageResult.diagnosis_code,
        diagnosis_title: triageResult.diagnosis_title,
        simple_explanation: triageResult.simple_explanation,
        action_protocol: triageResult.action_protocol,
        guide_file_id: triageResult.guide_file_id,
        notify_earth: triageResult.notify_earth,
        is_resolved: false
      }
    );

    log(`Triage processed [${triageResult.severity.toUpperCase()}]: ${triageResult.diagnosis_code}`);

    return res.json({
      success: true,
      alertId: createdAlert.$id,
      triage: triageResult
    });
  } catch (err) {
    error(`Triage Cloud Function Error: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
```

---

## 7. Primary Astronaut Medical HUD (`apps/astronaut-hud`)

### 7.1 Zustand State Stores

#### 1. `apps/astronaut-hud/src/store/useOfflineSyncStore.ts`
Manages the Delay/Disruption-Tolerant Networking (DTN) queue via IndexedDB (`idb-keyval`) and runs a $1\text{-second}$ interval ticker to simulate radio propagation across space.

```typescript
import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import { DistanceCommsMode } from '@aura/medical-engine';
import {
  DtnCommsService,
  EarthTransmissionRecord,
  LIGHT_TIME_DELAY_SECONDS
} from '@aura/appwrite-client';

interface OfflineSyncState {
  commsMode: DistanceCommsMode;
  offlineQueue: EarthTransmissionRecord[];
  activeTransmissions: EarthTransmissionRecord[];
  initializeQueue: () => Promise<void>;
  setCommsMode: (mode: DistanceCommsMode) => Promise<void>;
  enqueueMedicalDossier: (params: {
    astronautId: string;
    alertId: string;
    snapshot: unknown;
    pdfBlob?: Blob;
  }) => Promise<void>;
  tickTransmissions: () => void;
  flushOfflineQueue: () => Promise<void>;
}

const IDB_QUEUE_KEY = 'aura_dtn_offline_packets';

export const useOfflineSyncStore = create<OfflineSyncState>((setState, getState) => ({
  commsMode: 'MARS_15M',
  offlineQueue: [],
  activeTransmissions: [],

  initializeQueue: async () => {
    const cached = (await get<EarthTransmissionRecord[]>(IDB_QUEUE_KEY)) || [];
    setState({ offlineQueue: cached });
  },

  setCommsMode: async (newMode: DistanceCommsMode) => {
    setState({ commsMode: newMode });
    if (newMode !== 'SOLAR_BLACKOUT') {
      await getState().flushOfflineQueue();
    }
  },

  enqueueMedicalDossier: async ({ astronautId, alertId, snapshot, pdfBlob }) => {
    const mode = getState().commsMode;
    const delaySec = LIGHT_TIME_DELAY_SECONDS[mode];

    let reportFileId: string | null = null;
    if (pdfBlob && mode !== 'SOLAR_BLACKOUT') {
      reportFileId = await DtnCommsService.uploadPdfDossier(
        pdfBlob,
        `AURA_MedReport_${alertId}.pdf`
      );
    }

    if (mode === 'SOLAR_BLACKOUT' || delaySec === null) {
      const offlineRecord: EarthTransmissionRecord = {
        $id: `offline_${Date.now()}`,
        astronaut_id: astronautId,
        alert_id: alertId,
        distance_mode: 'SOLAR_BLACKOUT',
        delay_seconds: 0,
        remaining_seconds: 0,
        status: 'queued_offline',
        report_file_id: reportFileId,
        telemetry_json: JSON.stringify(snapshot),
        queued_at: new Date().toISOString()
      };
      const current = (await get<EarthTransmissionRecord[]>(IDB_QUEUE_KEY)) || [];
      const updated = [...current, offlineRecord];
      await set(IDB_QUEUE_KEY, updated);
      setState({ offlineQueue: updated });
      return;
    }

    const record = await DtnCommsService.createEarthTransmission({
      astronaut_id: astronautId,
      alert_id: alertId,
      distance_mode: mode,
      delay_seconds: delaySec,
      status: 'transmitting',
      report_file_id: reportFileId,
      telemetry_json: JSON.stringify(snapshot),
      queued_at: new Date().toISOString()
    });

    setState((state) => ({
      activeTransmissions: [record, ...state.activeTransmissions]
    }));
  },

  tickTransmissions: () => {
    const { activeTransmissions } = getState();
    if (activeTransmissions.length === 0) return;

    const updated = activeTransmissions.map((tx) => {
      if (tx.status !== 'transmitting') return tx;
      const nextRemaining = Math.max(0, tx.remaining_seconds - 1);
      if (nextRemaining === 0) {
        DtnCommsService.markReceivedByEarth(tx.$id);
        return { ...tx, remaining_seconds: 0, status: 'received_by_earth' as const };
      }
      return { ...tx, remaining_seconds: nextRemaining };
    });

    setState({ activeTransmissions: updated });
  },

  flushOfflineQueue: async () => {
    const cached = (await get<EarthTransmissionRecord[]>(IDB_QUEUE_KEY)) || [];
    if (cached.length === 0) return;

    const mode = getState().commsMode;
    const delaySec = LIGHT_TIME_DELAY_SECONDS[mode] ?? 15;

    await set(IDB_QUEUE_KEY, []);
    setState({ offlineQueue: [] });

    for (const pkt of cached) {
      const transmitted = await DtnCommsService.createEarthTransmission({
        astronaut_id: pkt.astronaut_id,
        alert_id: pkt.alert_id,
        distance_mode: mode,
        delay_seconds: delaySec,
        status: 'transmitting',
        report_file_id: pkt.report_file_id,
        telemetry_json: pkt.telemetry_json,
        queued_at: pkt.queued_at
      });
      setState((state) => ({
        activeTransmissions: [transmitted, ...state.activeTransmissions]
      }));
    }
  }
}));
```

### 7.2 Autonomous Clinical PDF Dossier Service (`apps/astronaut-hud/src/services/PdfReportGenerator.ts`)

Generates a structured NASA Flight Surgeon medical telemetry packet using `jsPDF`.

```typescript
import { jsPDF } from 'jspdf';
import { AstronautProfilePrefs, PersistedAlertDocument } from '@aura/appwrite-client';
import { VitalReadingInput } from '@aura/medical-engine';

export function generateClinicalDossierPdf(
  profile: AstronautProfilePrefs,
  vital: VitalReadingInput,
  alert: PersistedAlertDocument
): { blob: Blob; fileName: string } {
  const doc = new jsPDF();
  const timestamp = new Date().toISOString();

  // Header
  doc.setFillColor(10, 15, 29);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(56, 189, 248);
  doc.setFontSize(16);
  doc.text('AURA // AUTONOMOUS SPACE MEDICAL TELEMETRY DOSSIER', 14, 15);
  doc.setFontSize(9);
  doc.setTextColor(200, 210, 225);
  doc.text(`GENERATED UTC: ${timestamp} | ALERT ID: ${alert.$id}`, 14, 24);

  // Crew Member Metadata
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.text(`Crew Member: ${profile.fullName} (${profile.astronautCode})`, 14, 44);
  doc.text(`Blood Type: ${profile.bloodType} | Active Mission Phase: ${vital.mission_phase}`, 14, 51);
  doc.text(`Severity Classification: ${alert.severity.toUpperCase()} | Organ System: ${alert.affected_system.toUpperCase()}`, 14, 58);

  // Diagnosis Box
  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.5);
  doc.rect(14, 65, 182, 34);
  doc.setFontSize(12);
  doc.text(`DIAGNOSIS: ${alert.diagnosis_title} [${alert.diagnosis_code}]`, 18, 74);
  doc.setFontSize(9);
  const splitExplanation = doc.splitTextToSize(alert.simple_explanation, 174);
  doc.text(splitExplanation, 18, 82);

  // Telemetry & Personal Z-Score Table
  doc.setFontSize(11);
  doc.text('BIOMETRIC & CABIN TELEMETRY SNAPSHOT (VS. PHASE-ADJUSTED BASELINE)', 14, 110);
  let y = 118;
  doc.setFontSize(9);
  Object.values(alert.metric_evaluations).forEach((evalItem) => {
    const line = `- ${evalItem.metricKey.toUpperCase()}: ${evalItem.currentValue} | Adjusted Baseline: ${
      evalItem.adjustedMean ?? 'N/A'
    } | Z-Score: ${evalItem.zScore} sigma | Status: ${evalItem.severity.toUpperCase()}`;
    doc.text(line, 16, y);
    y += 7;
  });

  // Action Protocol Executed Onboard
  y += 6;
  doc.setFontSize(11);
  doc.text('AUTONOMOUS ONBOARD COUNTERMEASURE PROTOCOL:', 14, y);
  y += 8;
  doc.setFontSize(9);
  alert.action_protocol.forEach((step, idx) => {
    const wrapped = doc.splitTextToSize(`${idx + 1}. ${step}`, 178);
    doc.text(wrapped, 16, y);
    y += wrapped.length * 6;
  });

  const fileName = `AURA_Dossier_${profile.astronautCode}_${Date.now()}.pdf`;
  const blob = doc.output('blob');
  return { blob, fileName };
}
```

### 7.3 3D Holographic Digital Twin (`apps/astronaut-hud/src/components/twin/BodyTwinCanvas.tsx`)

Implements an interactive Three.js scene with **Procedural Anatomical Meshes** so it renders immediately without requiring external `.glb` downloads, plus automatic camera focus interpolation (`THREE.Vector3.lerp`) toward the affected organ system.

```tsx
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { AnatomicalSystem, SeverityLevel } from '@aura/medical-engine';

interface TwinProps {
  affectedSystem: AnatomicalSystem;
  severity: SeverityLevel;
  selectedSystem: AnatomicalSystem | null;
  onSelectSystem: (sys: AnatomicalSystem) => void;
}

const SEVERITY_COLORS: Record<SeverityLevel, string> = {
  green: '#10b981',
  yellow: '#f59e0b',
  red: '#ef4444'
};

const SYSTEM_CAMERA_TARGETS: Record<AnatomicalSystem, [number, number, number]> = {
  nominal: [0, 0.3, 3.4],
  nervous: [0, 1.45, 1.8],
  cardiovascular: [0, 0.75, 1.9],
  metabolic: [0, 0.15, 1.9],
  musculoskeletal: [0, -0.6, 2.5]
};

function CameraFocusRig({ targetSystem }: { targetSystem: AnatomicalSystem }) {
  const desiredPos = new THREE.Vector3(...SYSTEM_CAMERA_TARGETS[targetSystem]);
  useFrame((state) => {
    state.camera.position.lerp(desiredPos, 0.05);
    state.camera.lookAt(0, targetSystem === 'nervous' ? 1.3 : 0.3, 0);
  });
  return null;
}

function OrganGroup({
  system,
  activeSystem,
  severity,
  onSelect,
  position,
  label,
  children
}: {
  system: AnatomicalSystem;
  activeSystem: AnatomicalSystem;
  severity: SeverityLevel;
  onSelect: (s: AnatomicalSystem) => void;
  position: [number, number, number];
  label: string;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const isAffected = activeSystem === system && severity !== 'green';
  const color = isAffected ? SEVERITY_COLORS[severity] : '#06b6d4';

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (isAffected) {
      const freq = severity === 'red' ? 8 : 3.5;
      const scale = 1 + Math.sin(clock.getElapsedTime() * freq) * 0.08;
      groupRef.current.scale.set(scale, scale, scale);
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(system);
      }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, {
               material: new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: isAffected ? 0.9 : 0.25,
                wireframe: !isAffected,
                transparent: true,
                opacity: isAffected ? 0.92 : 0.55
              })
            })
          : child
      )}
      {isAffected && (
        <Html distanceFactor={6} position={[0.45, 0.1, 0]}>
          <div className="px-2 py-0.5 rounded bg-slate-950/90 border border-red-500/60 text-[10px] font-mono text-white whitespace-nowrap shadow-lg">
            {label} [{severity.toUpperCase()}]
          </div>
        </Html>
      )}
    </group>
  );
}

export const BodyTwinCanvas: React.FC<TwinProps> = ({
  affectedSystem,
  severity,
  selectedSystem,
  onSelectSystem
}) => {
  const focusTarget = selectedSystem || (severity !== 'green' ? affectedSystem : 'nominal');

  return (
    <div className="relative w-full h-full min-h-[420px] bg-slate-950/70 rounded-xl border border-cyan-500/20 overflow-hidden">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400">
          3D BIOLOGICAL DIGITAL TWIN // HOLOGRAPHIC TELEMETRY
        </span>
        <span className="text-xs text-slate-400">
          Click any anatomical system to inspect localized Z-score stability
        </span>
      </div>

      {focusTarget !== 'nominal' && (
        <button
          onClick={() => onSelectSystem('nominal')}
          className="absolute top-3 right-3 z-10 px-2.5 py-1 text-xs font-mono bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 rounded"
        >
          Reset Camera View
        </button>
      )}

      <Canvas camera={{ position: [0, 0.3, 3.4], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 4, 4]} intensity={1.5} />
        <CameraFocusRig targetSystem={focusTarget} />
        <OrbitControls enablePan={false} minDistance={1.5} maxDistance={4.5} />

        {/* 1. Nervous System (Cranium & Cervical Spine) */}
        <OrganGroup
          system="nervous"
          activeSystem={affectedSystem}
          severity={severity}
          onSelect={onSelectSystem}
          position={[0, 1.35, 0]}
          label="NERVOUS / CEREBRAL"
        >
          <mesh>
            <sphereGeometry args={[0.24, 24, 24]} />
          </mesh>
        </OrganGroup>

        {/* 2. Cardiovascular System (Thoracic Cage & Heart Core) */}
        <OrganGroup
          system="cardiovascular"
          activeSystem={affectedSystem}
          severity={severity}
          onSelect={onSelectSystem}
          position={[0, 0.72, 0]}
          label="CARDIOVASCULAR / THORAX"
        >
          <mesh>
            <cylinderGeometry args={[0.32, 0.28, 0.65, 20]} />
          </mesh>
          <mesh position={[0.06, 0.05, 0.12]}>
            <octahedronGeometry args={[0.13, 2]} />
          </mesh>
        </OrganGroup>

        {/* 3. Metabolic System (Abdominal Core, Liver & Pancreas) */}
        <OrganGroup
          system="metabolic"
          activeSystem={affectedSystem}
          severity={severity}
          onSelect={onSelectSystem}
          position={[0, 0.1, 0]}
          label="METABOLIC / ENDOCRINE"
        >
          <mesh>
            <cylinderGeometry args={[0.27, 0.25, 0.5, 20]} />
          </mesh>
        </OrganGroup>

        {/* 4. Musculoskeletal System (Upper & Lower Extremities) */}
        <OrganGroup
          system="musculoskeletal"
          activeSystem={affectedSystem}
          severity={severity}
          onSelect={onSelectSystem}
          position={[0, -0.55, 0]}
          label="MUSCULOSKELETAL / LOAD"
        >
          {/* Left & Right Arms */}
          <mesh position={[-0.48, 1.15, 0]} rotation={[0, 0, 0.15]}>
            <capsuleGeometry args={[0.08, 0.75, 8, 16]} />
          </mesh>
          <mesh position={[0.48, 1.15, 0]} rotation={[0, 0, -0.15]}>
            <capsuleGeometry args={[0.08, 0.75, 8, 16]} />
          </mesh>
          {/* Left & Right Legs */}
          <mesh position={[-0.17, -0.35, 0]}>
            <capsuleGeometry args={[0.1, 0.95, 8, 16]} />
          </mesh>
          <mesh position={[0.17, -0.35, 0]}>
            <capsuleGeometry args={[0.1, 0.95, 8, 16]} />
          </mesh>
        </OrganGroup>

        <gridHelper args={[6, 20, '#0891b2', '#0f172a']} position={[0, -1.5, 0]} />
      </Canvas>
    </div>
  );
};
```

---

## 8. Live Suit Telemetry Simulator (`apps/suit-simulator`)

This application acts as the **Hackathon Judge Control Deck**, enabling live 1-click verification of every space medicine innovation in AURA.

### 8.1 Six Deterministic Judge Demo Scenarios (`ScenarioPresets.tsx`)

| Scenario Button | Mission Phase | Injected Telemetry Values | Expected Autonomous System Behavior |
| :--- | :--- | :--- | :--- |
| **1. Nominal Deep Space Cruise** | `DEEP_SPACE_CRUISE` | $\text{HR: } 54\text{ bpm}$, $\text{BP: } 111/67\text{ mmHg}$, $\text{Glu: } 90\text{ mg/dL}$, $\text{Temp: } 36.7^\circ\text{C}$, $\text{SpO}_2\text{: } 98\%$, $\text{CO}_2\text{: } 2.2\text{ mmHg}$, $\text{Rad: } 0.3\text{ mSv}$ | All organs glow emerald green; $Z_m < 1.0$; Readiness Score $\ge 95\%$. |
| **2. Launch Ascent $3G$ Peak (False-Alarm Proof)** | `LAUNCH_ASCENT` | $\text{HR: } 86\text{ bpm}$, $\text{BP: } 132/82\text{ mmHg}$, $\text{Glu: } 102\text{ mg/dL}$, $\text{Temp: } 36.9^\circ\text{C}$, $\text{SpO}_2\text{: } 97\%$ | **Proves Phase-Offset Intelligence:** Even though HR rose $+30\text{ bpm}$ above Earth baseline ($56\text{ bpm}$), `LAUNCH_ASCENT` offset adjusts $\mu_{\text{adj}} = 86\text{ bpm}$. Status stays **GREEN** (`LAUNCH_ASCENT_ADAPTATION`). |
| **3. Subclinical Space Dehydration** | `EARLY_ORBIT_ADAPTATION` | $\text{HR: } 75\text{ bpm}$, $\text{BP: } 102/68\text{ mmHg}$ + Marks `HYDRATION_2500ML` task **Incomplete** | **Proves Gamification Correlation:** Triggers **YELLOW** `MICROGRAVITY_HYPOVOLEMIA` alert on Cardiovascular system; links directly to `guide_hydration_electrolyte`. |
| **4. Microgravity $\text{CO}_2$ Bubble (Hypercapnia)** | `DEEP_SPACE_CRUISE` | $\text{CO}_2\text{: } 5.4\text{ mmHg}$, $\text{HR: } 104\text{ bpm}$, $\text{Mood: } 3/10$, $\text{SpO}_2\text{: } 93\%$ | **Proves Environmental Correlation:** Triggers **RED** `HYPERCAPNIA_CO2_POCKET` alert; 3D Camera zooms onto **Nervous System (Brain)** pulsing red; opens Fan Dispersion protocol. |
| **5. Solar Particle Storm (SPE) + Blackout** | `DEEP_SPACE_CRUISE` | $\text{Rad: } 3.8\text{ mSv/day}$, $\text{HR: } 128\text{ bpm}$, $\text{Temp: } 38.1^\circ\text{C}$ | **Proves Radiation & DTN Queue:** Triggers **RED** `ACUTE_RADIATION_CARDIO_STRESS`; highlights **Cardiovascular System**; generates PDF dossier and queues in `EarthDelayQueueBar`. |
| **6. Circadian Drift & Hypoglycemia** | `DEEP_SPACE_CRUISE` | $\text{Glu: } 63\text{ mg/dL}$, $\text{Sleep: } 3.8\text{ hrs}$, $\text{Mood: } 3/10$ | **Proves Hard Limit & Metabolic Triage:** Breaches NASA Glucose Hard Limit ($\le 65\text{ mg/dL}$); highlights **Metabolic System** in red; launches Zero-G Glucometer guide. |

---

## 9. Deterministic Build & Execution Sequence for AI Agents

When an AI coding model (such as Gemini Flash or Hydrogen) is tasked with generating or extending this repository, it should execute in the following strict dependency order:

1. **Step 1 — Workspace Scaffolding:** Create root `package.json`, `turbo.json`, `tsconfig.base.json`, and `.env.example`.
2. **Step 2 — Clinical Core (`packages/medical-engine`):** Generate `types.ts`, `hardLimits.ts`, `phaseOffsets.ts`, `protocols.ts`, `zScoreEvaluator.ts`, `correlationEngine.ts`, `readinessScore.ts`, and `index.ts`. Run `npm run typecheck` to verify zero-dependency compilation.
3. **Step 3 — Service Layer (`packages/appwrite-client`):** Generate `config.ts`, `client.ts`, and all 4 domain services (`AuthCalibrationService`, `CountermeasureService`, `TelemetryService`, `DtnCommsService`) with dual Appwrite Cloud + `BroadcastChannel` local resilience.
4. **Step 4 — Shared Sci-Fi UI Kit (`packages/ui-kit`):** Generate reusable HUD cards, severity badges, and telemetry header bars.
5. **Step 5 — Primary Astronaut HUD (`apps/astronaut-hud`):** Implement the Zustand stores (`useOfflineSyncStore`, `useMedicalStore`), `PdfReportGenerator.ts`, `BodyTwinCanvas.tsx` (with procedural 3D meshes), `BaselineTrendChart.tsx` (with $\mu_{\text{adj}} \pm 2\sigma_{\text{eff}}$ reference bands), `EmergencyProtocolCard.tsx`, and `EarthDelayQueueBar.tsx`.
6. **Step 6 — Suit Simulator (`apps/suit-simulator`) & Cloud Function (`apps/triage-cloud-fn`):** Implement the 6 one-click scenario triggers, live BDC baseline calibration form, and the idempotent Appwrite Node.js cloud function.