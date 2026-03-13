# Job Search Helper

A browser-based web app for organizing job opportunities and generating tailored application materials from reusable profile data.

## Documentation

- MVP plan: [docs/mvp-plan.md](docs/mvp-plan.md)
- IndexedDB migration plan: [docs/indexeddb-migration-plan.md](docs/indexeddb-migration-plan.md)
- State shape: [docs/state-shape.md](docs/state-shape.md)
- State actions: [docs/state-actions.md](docs/state-actions.md)

## Current direction

- Single-user MVP
- Fully browser-based
- Local persisted data boundary behind a mock backend and API client
- Zustand as the app-facing cache and UI state layer
- JSON import/export for persistence
- React + Vite + TypeScript

## Development flags

- IndexedDB is now the default local persistence backend.
- `VITE_APP_DATA_BACKEND=memory` switches the app back to the in-memory mock backend for debugging or comparison.
- `VITE_SIMULATE_API_DELAY=true` enables simulated backend latency in the Vite dev server.
- `VITE_SIMULATE_API_DELAY_MIN_MS=150` optionally overrides the default minimum delay in milliseconds.
- `VITE_SIMULATE_API_DELAY_MAX_MS=900` optionally overrides the default maximum delay in milliseconds.

Example:

```bash
VITE_SIMULATE_API_DELAY=true VITE_SIMULATE_API_DELAY_MIN_MS=150 VITE_SIMULATE_API_DELAY_MAX_MS=900 npm run dev
```

