# Features

Feature-first organization (high cohesion, low coupling). Each domain owns its components,
hooks, API calls and types. **Routing lives in `src/app/`** (Expo Router, file-based); feature
folders hold the logic and UI those routes render. Shared plumbing (HTTP client, storage, push
setup) lives in `src/services/`.

## Domain map

| Folder | What it owns | Screens |
|---|---|---|
| `auth/` | OTP login, session, rider profile | `login`, boot gate `index` |
| `onboarding/` | first-run slides | `onboarding` |
| `register/` | "Apply to join" lead form and document photos | `register` |
| `permissions/` | location, background location, notifications, battery wizard | `permissions`, Profile |
| `shift/` | attendance (selfie, kitchen proximity), online shift, end shift | Route tab, `shift-summary` |
| `orders/` | today's orders, clusters, polling sync, order cards | Orders tab, `order/[id]` |
| `route/` | route planner, stop cards, map | Route tab |
| `trip/` | pickup, delivery, proof photos, cancel and hand-over, offline action queue | `deliver/[id]`, `cancel/[id]` |
| `tracking/` | background location pings (task, buffer, policy) | none (runs in background) |
| `wallet/` | balance, ledger, incentives, salary, history | Wallet tab, `history/*` |
| `push/` | what the app does with a push (banner, refresh, open tab) | none |

## Layout per feature

```
features/<domain>/
  components/     # presentational + container components
  <name>Api.ts    # API calls (use src/services/http + endpoints)
  <name>Store.ts  # Zustand store
  <name>Model.ts  # models and pure helpers
  use<Name>.ts    # feature hooks
```

## Services (`src/services/`)

| Folder | Purpose |
|---|---|
| `http/` | fetch client with Bearer token, endpoints, 401 handler |
| `storage/` | MMKV key-value store and SecureStore for the token |
| `push/` | Firebase messaging setup, notification channel, push payload parser |
