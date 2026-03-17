# Job Search Helper

A browser-based web app for organizing job opportunities and generating tailored application materials from reusable profile data.

## Documentation

- MVP plan: [docs/mvp-plan.md](docs/mvp-plan.md)
- State shape: [docs/state-shape.md](docs/state-shape.md)
- State actions: [docs/state-actions.md](docs/state-actions.md)

## Current direction

- Single-user MVP
- Fully browser-based
- IndexedDB as the local persisted source of truth behind an API client boundary
- TanStack Query for app-data reads and cache invalidation
- Zustand for transient UI state
- JSON import/export for backup, restore, and transfer
- React + Vite + TypeScript

## Development flags

- `VITE_SIMULATE_API_DELAY=true` enables simulated backend latency during development.
- `VITE_SIMULATE_API_DELAY_MIN_MS=150` optionally overrides the default minimum delay in milliseconds.
- `VITE_SIMULATE_API_DELAY_MAX_MS=900` optionally overrides the default maximum delay in milliseconds.

Example:

```bash
VITE_SIMULATE_API_DELAY=true VITE_SIMULATE_API_DELAY_MIN_MS=150 VITE_SIMULATE_API_DELAY_MAX_MS=900 npm run dev
```

