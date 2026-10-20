# Beezy

Equal-split group budget tracker for friends who travel together — built with SvelteKit 2 and Svelte 5.

**Offline-first.** Events and activities are stored in **IndexedDB** on the device. No account, no signal required.

## Documentation

**[PRD.md](./PRD.md)** — full product spec and phased development roadmap.

| Resource | Path |
|----------|------|
| Phase guide & parity checklist | [`PRD.md`](./PRD.md) |
| Visual + behavior reference | [`static/beezy-mockup.html`](./static/beezy-mockup.html) |
| UI components | [`src/lib/components/`](./src/lib/components/) |
| Domain (store, settlement, types) | [`src/lib/beezy/`](./src/lib/beezy/) |
| Design tokens | [`src/lib/styles/`](./src/lib/styles/) |

## Current status

`/` is the real app (single-page controller in `src/routes/+page.svelte`), not a component showcase.

| Phase | Focus | Status |
|-------|--------|--------|
| 1 | Tokens & atoms | Done |
| 2 | App shell | Done |
| 3 | Cards & list molecules | Done |
| 4 | Domain layer (IndexedDB, settlement) | Done |
| 5 | Tab screens | Done — Events, Activities, Payment, event detail |
| 6 | Sheets, forms & menu | Not started — create/edit actions are placeholder toasts |
| 7 | Payment & settlement | Partial — receipts + settle/unsettle work; copy receipt does not |
| 8 | Polish & ship | Not started |

**Works today:** load/seed/reset demo data, browse trips, add/remove participants, delete an event, open payment receipts, settle or unsettle an expense.

**Not wired yet:** new event, new/edit activity, About sheet, copy receipt text. CRUD helpers already exist in `src/lib/beezy/store.ts`.

## Developing

```sh
bun install
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). First visit seeds two demo trips (Boracay + Tagaytay).

```sh
bun run check    # svelte-check + TypeScript
bun run build    # production build
bun run preview  # preview production build
```

## How data flows

```
IndexedDB (`beezy`)  →  loadStore()  →  +page.svelte ($state)
                                          ↓
                                  derived calcs + UI
                                          ↓
User action → store.ts write → refresh events/activities → re-render
```

- Trip data lives in IndexedDB (`events`, `activities`, `meta`).
- Navigation (tab, detail, menu) lives in `sessionStorage` (`beezy.view.v1`).
- `store.ts` is a persistence repository, not a Svelte store. Reactive state lives in `+page.svelte`.

## Project layout

```
src/routes/+page.svelte      # app controller — screens, handlers, reactive state
src/lib/components/          # generic UI (shell, forms, atoms)
src/lib/beezy/               # domain: types, IndexedDB, store, settlement, seed
src/lib/beezy/components/    # event/activity/payment UI
src/lib/styles/              # tokens, primitives, shell, component CSS
static/beezy-mockup.html     # single-file visual/behavior reference
```
