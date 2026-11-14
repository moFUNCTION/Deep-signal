# AURA — Autonomous Unified Readiness & Aerospace Medical Assistant

**AURA** is an offline-first space medicine platform built for deep-space exploration missions where round-trip Earth communication delays (up to 4–48 minutes) or solar blackouts make real-time ground flight-surgeon support impossible.

It pairs an **Astronaut Medical HUD** with a real-time **Suit & Telemetry Simulator** so crews can monitor phase-adjusted biometrics, run deterministic medical triage autonomously on the edge, inspect affected organ systems on an interactive anatomical twin, track daily countermeasures, and queue medical dossiers over simulated Delay-Tolerant Networking (DTN) links.

---

## What Problem Does AURA Solve?

Standard hospital vital thresholds trigger false alarms during spaceflight because human physiology adapts to hypergravity launch loads and microgravity fluid shifts. At the same time, true anomalies—such as suit/cabin $\text{CO}_2$ buildup, solar particle radiation stress, hypoglycemia, or uncompleted hydration countermeasures—require immediate crew guidance without waiting for Earth.

AURA addresses this with:

- **Earth Baseline + Flight Phase Adaptation:** Adjusts each astronaut's Pre-Flight Earth Baseline Data Collection ($\mu$, $\sigma$) by mission phase (`LAUNCH_ASCENT`, `ISS_LEO`, `LUNAR_TRANSIT`, `DEEP_SPACE_CRUISE`, `MARS_TRANSIT`, `SOLAR_BLACKOUT`) alongside strict NASA clinical and environmental limits.
- **Autonomous 8-Rule Triage Engine (`@aura/medical-engine`):** Evaluates telemetry locally with zero network dependency across 8 clinical states (`HYPERCAPNIA_CO2_POCKET`, `ACUTE_RADIATION_CARDIO_STRESS`, `MICROGRAVITY_HYPOVOLEMIA`, `METABOLIC_CIRCADIAN_DRIFT`, `MUSCULOSKELETAL_UNLOADING_RISK`, `BIOMETRIC_DEVIATION`, `LAUNCH_ASCENT_ADAPTATION`, and `ALL_SYSTEMS_NOMINAL`).
- **Interactive Anatomical Twin:** Uses [`@mjcdev/react-body-highlighter`](https://www.npmjs.com/package/@mjcdev/react-body-highlighter) (Anterior/Posterior & Male/Female views) to highlight strained biological systems (**Nervous System**, **Cardiovascular**, **Metabolic**, **Musculoskeletal**) and link directly to filtered vitals and 3-step emergency action checklists + visual examination guides.
- **Weighted Mission Readiness Score (0–100):** Combines Biometrics (`/50`), Daily Countermeasures (`/30` — Hydration, Nutrition, Sleep, ARED Resistive Exercise), and Cabin Environment (`/20`) to classify EVA readiness as `OPTIMAL_FOR_EVA`, `CAUTION_MONITOR`, or `NO_GO_MEDICAL_HOLD`.
- **Store-and-Forward DTN & Solar Blackout Resilience:** Automatically generates downloadable PDF medical dossiers (`PdfReportGenerator`) and buffers both dossiers and raw telemetry frames in IndexedDB during `SOLAR_BLACKOUT`, deduplicating via `edge_alert_id` and flushing to Earth when carrier signal returns.
- **Dual Operator Views & Live Telemetry Simulator:** Switch between **Astronaut HUD** (high-readability Skylearn clinical interface) and **Flight Surgeon** mode (exposing $\mu_{\text{adj}}$, $\sigma_{\text{eff}}$, hard limits, and Earth BDC calibration) while streaming synthetic telemetry from the companion Suit Simulator app.

---

## Monorepo Architecture

```text
.
├── apps/
│   ├── astronaut-hud/         # Crew & Flight Surgeon HUD (React, Vite, Tailwind — http://localhost:5173)
│   └── suit-simulator/        # Suit telemetry generator, presets & BDC editor (http://localhost:5174)
├── packages/
│   ├── medical-engine/        # @aura/medical-engine: phase baselines, Z-scores, 8-rule triage, readiness scoring
│   ├── appwrite-client/       # @aura/appwrite-client: Appwrite SDK services, DTN comms & cross-origin bus
│   ├── ui-kit/                # @aura/ui-kit: Skylearn accessible clinical tokens & reusable components
│   ├── eslint-config/         # @repo/eslint-config: shared ESLint configuration
│   └── typescript-config/     # @repo/typescript-config: shared TypeScript configs
├── appwrite/                  # Appwrite project config, permissions, seed data, provisioning script & cloud function
│   └── functions/
│       └── triage-cloud-fn/   # Idempotent server triage verifier (deduplicates via edge_alert_id)
└── docs/                      # Architecture specs, UI design system, execution plan & stage checkpoints
```

### Tech Stack
- **Monorepo:** Turborepo + npm workspaces (Node.js `>=20.0.0`)
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, Lucide Icons, `@mjcdev/react-body-highlighter`, jsPDF
- **Backend / Sync (Optional in Offline Demo Mode):** Appwrite Database, Realtime, Storage & Functions (`appwrite/`), paired with local IndexedDB and a Vite cross-port `/__aura_bus` + `BroadcastChannel` bridge for zero-config local demos.

---

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Both Apps Locally (Offline Demo Mode Ready)

Start both the Astronaut HUD (`http://localhost:5173`) and the Suit Simulator (`http://localhost:5174`) together:

```bash
npm run dev
```

No cloud configuration is required to run and test locally—when Appwrite environment variables are not set, AURA runs cleanly offline with full cross-port real-time synchronization between the simulator and the HUD.

### 3. Try the End-to-End Demo Flow
Open both `http://localhost:5173` (Astronaut HUD) and `http://localhost:5174` (Suit Simulator) side by side, then trigger scenarios from the Suit Simulator's **Test Scenarios (7)** tab:

1. **Nominal Deep Space Cruise** — Baseline healthy state (`OPTIMAL_FOR_EVA`).
2. **Launch Ascent 3G Peak** — Demonstrates phase-adjusted baselines ($Z = 0.0\sigma$) preventing false alarms under 3G acceleration.
3. **Microgravity Dehydration / Hypovolemia** — Triggers fluid-shift hypovolemia advisory; completing the **Hydration 2.5L** countermeasure dynamically restores readiness.
4. **Cabin $\text{CO}_2$ Hypercapnia** — Highlights the Nervous System red on the body diagram and displays the 3-step emergency protocol + Visual Guide modal.
5. **Solar Particle Event + Solar Blackout** — Switches comms to `SOLAR_BLACKOUT`, buffers telemetry frames and auto-generated PDF dossiers in IndexedDB, and flushes them when restoring `ISS LEO`.
6. **Circadian Drift & Hypoglycemia** — Triggers Metabolic critical alert and highlights affected torso/system zones.
7. **Musculoskeletal Unloading Risk** — Triggers caution highlights across limbs/back until the ARED resistive workout countermeasure is logged.

---

## Optional Appwrite Cloud Setup

To connect a live Appwrite project instead of running purely in local offline mode:

1. Copy `.env.example` to `.env` and fill in your Appwrite credentials (`VITE_APPWRITE_ENDPOINT`, `VITE_APPWRITE_PROJECT_ID`, `VITE_APPWRITE_DB_ID`, `APPWRITE_API_KEY`).
2. Provision collections, storage buckets, permissions, and seed data:

```bash
npm run provision:appwrite
```

---

## Workspace Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs `astronaut-hud` (`:5173`) and `suit-simulator` (`:5174`) in parallel |
| `npm run typecheck` | Type-checks all workspace packages and apps (`tsc --noEmit`) |
| `npm run test` | Runs unit tests across `@aura/medical-engine`, `@aura/appwrite-client`, and `@aura/ui-kit` |
| `npm run lint` | Runs ESLint across the monorepo |
| `npm run build` | Builds all apps and packages |
| `npm run provision:appwrite` | Provisions Appwrite collections, buckets, and seed data via `appwrite/scripts/provision-appwrite.mjs` |

---

## Documentation

- [Master Architecture & Service Specification](docs/aura_master_ai_ready_architecture_service_specification%20(2).md)
- [Skylearn Clinical UI/UX Design Specification](docs/skylearn-DESIGN.md)
- [Master Execution Plan](docs/AURA_MASTER_EXECUTION_PLAN.md)
- [Execution Progress Checkpoints](docs/EXECUTION_PROGRESS_STAGES.md)
