# Autonomous Space Medical Triage Engine (`triage-cloud-fn`)

A serverless Appwrite Cloud Function triggered whenever a new document is created in the `vitals_logs` collection.

## Event Trigger
- `databases.AURA_Medical_DB.collections.vitals_logs.documents.*.create`

## Features
- **Deterministic 8-Rule Clinical Engine**: Isomorphic space medicine clinical evaluation matching NASA standards.
- **Edge-Cloud Idempotency Guard**: Checks `vitalReading.edge_alert_id` against the `triage_alerts` collection to prevent duplicate alert documents when flushed from offline mode or edge devices.
- **Personalized Z-Score Calibration**: Retrieves pre-flight BDC baselines from user preferences or defaults, applying mission phase offsets.
- **Self-Contained Deployment**: Ships with bundled ESM clinical evaluator in `src/triageEngine.js`, requiring zero monorepo symlinks during remote container builds.

## Environment Variables
- `APPWRITE_FUNCTION_ENDPOINT`: Provided by Appwrite runtime (or fallback to `https://cloud.appwrite.io/v1`).
- `APPWRITE_FUNCTION_PROJECT_ID`: Provided by Appwrite runtime (`aura_nasa_2026`).
- `APPWRITE_API_KEY`: Provided automatically by Appwrite execution context.
- `AURA_DB_ID`: `AURA_Medical_DB` (default).
