# Beezy — Product & Development Roadmap

**Beezy** — equal-split group budget tracker for friends who travel together.

This document is the single source of truth for building the SvelteKit app from the offline mockup. Reference it any time to see what's done, what's next, and how everything fits together.

| | |
|---|---|
| **Mockup spec** | [`static/beezy-mockup.html`](static/beezy-mockup.html) |
| **UI components** | [`src/lib/components/ui/`](src/lib/components/ui/) |
| **Design tokens** | [`src/lib/styles/`](src/lib/styles/) |
| **Domain helpers** | [`src/lib/beezy/`](src/lib/beezy/) |
| **Component showcase** | [`src/routes/+page.svelte`](src/routes/+page.svelte) (move to `/kit` in Phase 8) |

---

## Product summary

Beezy helps friend groups track shared trip expenses, split them equally, and settle up per expense — **offline-first**, with data stored in **IndexedDB** on the device.

> The mockup (`beezy-mockup.html`) uses `localStorage` for quick prototyping only. The SvelteKit app persists events and activities in IndexedDB.

### Core flows

1. **Events** — create a trip with a budget, add participants
2. **Activities** — log expenses (who paid, how much, which trip)
3. **Payment** — pick a trip → pick an expense → view/share a receipt → mark settled

### Design system

Hugging Face direction: sunshine yellow (`#ffd21e`) + IBM Plex Mono identity + Source Sans body text. All colors resolve through CSS custom properties in `tokens.css`.

### Settlement rules (from mockup)

- Each member's share = expense price ÷ number of participants
- Balance = amount paid − share (positive = owed money, negative = owes)
- Outstanding balances use **unsettled** expenses only
- An event is settled when every expense is marked settled

---

## Phase overview

```
Phase 1  Atoms & tokens          ✅ Done
Phase 2  App shell               ✅ Done
Phase 3  Cards & list molecules ✅ Done
Phase 4  Domain layer            ✅ Done
Phase 5  Tab screens             🔄 In progress
Phase 6  Sheets, forms & menu    ⬜ Not started
Phase 7  Payment & settlement    ⬜ Not started
Phase 8  Polish & ship           ⬜ Not started
```

---

## Phase 0 — Project scaffolding ✅

| Item | Location |
|------|----------|
| SvelteKit + Svelte 5 | `beezy-app/` |
| Tailwind (secondary) | `tailwind.config.ts`, `app.css` |
| Fonts | `@fontsource/ibm-plex-mono`, `@fontsource/source-sans-3` |
| Mockup reference | `static/beezy-mockup.html` |

**Exit criteria:** `bun run dev` works; design tokens load globally.

---

## Phase 1 — Design foundation & atoms ✅

Thin Svelte wrappers over global CSS classes in `primitives.css` — not Tailwind-first markup.

### Styles

| File | Purpose |
|------|---------|
| `tokens.css` | Colors, typography, spacing, motion, category accents |
| `fonts.css` | IBM Plex Mono + Source Sans |
| `base.css` | Reset, body, `.mono` |
| `primitives.css` | Buttons, avatars, chips, fields, screen-head, eyebrow |

### Components (`src/lib/components/ui/`)

- [x] `Button` — variants: primary, yellow, secondary, ghost, danger; sizes default/sm; block
- [x] `IconButton`
- [x] `Avatar` — sizes sm/default/md/lg; palette from name hash
- [x] `Chip` — variants: paid, event, settled
- [x] `Field` — label, hint, required
- [x] `Input`
- [x] `AmountInput` — ₱ prefix
- [x] `Select`
- [x] `Eyebrow` — optional accent
- [x] `ScreenHead` — title + description
- [x] `cn.ts` — class name helper

### Helpers

- [x] `src/lib/beezy/utils.ts` — `initials()`, `avatarIndex()`

**Exit criteria:** All atoms render on the showcase page and match the mockup visually.

---

## Phase 2 — App shell & layout ✅

Reproduce the mockup phone-frame shell (440px column, safe areas, internal scroll).

### Styles

- [x] `shell.css` — `.app`, `.appbar`, `.content`, `.screen`, `.tabbar`, `.fab`, `.sheet-*`

### Components

| Component | Mockup class | Status |
|-----------|--------------|--------|
| `AppShell` | `.app` | [x] |
| `AppBar` | `.appbar`, `.appbar-row` | [x] |
| `Screen` | `.screen` + scroll region | [x] |
| `TabBar` | `.tabbar` | [x] |
| `Tab` | `.tab` | [x] |
| `Fab` | `.fab` | [x] |
| `Sheet` | `.overlay` + `.sheet-*` | [x] |
| `Toast` | `.toast` | [x] |
| `MenuPopover` | `.menu-pop`, `.menu-item` | [x] |
| Icons module | mockup `ICON` object | [x] `src/lib/ui/icons/` |

`AppBar` uses slots for brand (🤗 badge) and leading/trailing actions instead of a separate `BrandBadge` component.

### FAB visibility rules (from mockup)

Show FAB when:
- No sub-screen open
- No sheet open
- Tab is `events`, OR tab is `activities` and at least one event exists

Hide FAB on `payment` tab and all sub-screens.

### Exit criteria

- [x] Showcase demonstrates shell: app bar + 3 tabs + FAB + sheet
- [x] Toast shows/hides with animation
- [x] Menu popover opens from app bar "more" button
- [x] Tab active state matches mockup (yellow top indicator)
- [ ] FAB visibility follows rules above (wired to real view state in Phase 5)

---

## Phase 3 — List & card molecules ✅

Reusable building blocks for all three main tabs.

### Components to build

| Component | Mockup class | Status |
|-----------|--------------|--------|
| `EmptyState` | `.empty` | [x] |
| `Card` | `.card` | [x] |
| `EventCard` | `.event-card` | [x] |
| `ProgressBar` | `.progress` | [x] |
| `ActivityRow` | `.act-row` | [x] |
| `PayEventCard` | `.pay-event-card` | [x] |
| `PayProgress` | `.pay-progress` | [x] |
| `StatGrid` / `StatCell` | `.summary-grid`, `.stat-cell` | [x] |
| `ParticipantRow` | `.pax-row` | [x] |
| `SectionLabel` | `.section-label` | [x] |
| `HintCard` | `.hint-card` | [x] |
| `AddParticipantRow` | `.add-pax` | [x] |
| `Divider` | `.divider-rule` | [x] |
| `EventDetail` | `viewEventDetail()` | [x] |
| `Receipt` | `.receipt` | [x] |
| `ReceiptLine` | `.r-line` | [x] |
| `ReceiptMember` | `.r-member` | [x] |

### CSS source

Copy from `beezy-mockup.html`:
- Lines ~232–266 — cards, activity rows
- Lines ~304–312 — empty states
- Lines ~368–456 — detail, payment, receipt

Consider `components.css` if `primitives.css` + `shell.css` grow too large.

- [x] `components.css` — empty, event-card, progress, act-row (Batch A)

### Exit criteria

- [x] Kit page demos EventCard, ActivityRow, EmptyState, ParticipantRow, Receipt with seed data
- Side-by-side visual match with mockup

---

## Phase 4 — Domain layer ✅

Port mockup data model and business logic into typed TypeScript — no UI.

### Data model

```ts
// Event
{ id, title, budget, createdAt, participants: [{ id, name }] }

// Activity
{ id, eventId, name, price, paidById, paidByName, createdAt, updatedAt, settled?: boolean }

// View state
{
  tab: 'events' | 'activities' | 'payment',
  sub: { type: 'detail' | 'pay-event' | 'pay-activity', ... } | null,
  sheet: { type: 'new-event' | 'activity' | 'about', ... } | null,
  menu: boolean
}
```

### Files

```
src/lib/beezy/
  types.ts            — Event, Activity, Participant, ViewState, SheetState [x]
  format.ts           — peso(), pesoSigned(), fmtDate(), fmtDateTime() [x]
  settlement.ts       — tally(), calcEvent(), calcOutstanding(), calcActivity(), isEventSettled() [x]
  db.ts               — IndexedDB open, schema, migrations [x]
  store.ts            — CRUD for events & activities via IndexedDB [x]
  seed.ts             — seedData() (Boracay + Tagaytay demo) [x]
  id.ts               — uid() [x]
  utils.ts            — initials(), avatarIndex() (Phase 1) [x]
  activitySummary.ts  — formatActivitySummary() (copy-to-clipboard text) [x]
  view.ts             — loadView() / saveView() via sessionStorage [x]
```

### Storage

| Layer | Technology | What it holds |
|-------|------------|---------------|
| **App data** | IndexedDB | Events, activities, participants |
| **UI view state** | `sessionStorage` or in-memory | Active tab, sub-screen, open sheet (optional persist) |

Database name: `beezy` (versioned schema for migrations, e.g. `settled` flag on activities).

The mockup prototype used `kkb.store.v1` / `kkb.view.v1` in `localStorage` — legacy naming only; do not use in the Svelte app.

### Functions to port

From mockup ~lines 627–665:

- `tally(acts, participants)` — equal-split math
- `calcEvent(ev)` — full trip totals
- `calcOutstanding(ev)` — unsettled-only balances
- `calcActivity(a, ev)` — per-expense breakdown
- `isEventSettled(ev)` — all activities settled
- `copyActivitySummary(id)` — plain-text receipt for clipboard

### Exit criteria

- [x] Pure settlement functions are unit-testable (tests deferred to Phase 8)
- [x] Store reads/writes IndexedDB with `settled` migration
- [x] Copy text format matches mockup output (Beezy branding instead of legacy KKB label)

> **Not in Phase 4 scope:** wiring `loadStore()` / `loadView()` into tab screens — that is Phase 5.

---

## Phase 5 — Tab screens 🔄

Compose Phases 2–4 into main content areas.

> **5.1 done:** `+page.svelte` loads IndexedDB via `loadStore()`, drives UI from `ViewState` + `loadView`/`saveView`, no inline seed.
> **5.2 done:** Events home (`Your trips` + EventCards) and event detail (stats, participants, settle up → payment). Empty states 1 & 6.
> **5.3 done:** Activities tab — flat list, mockup empty states 2 & 3, ScreenHead + Phase 6 edit stub. Remaining: 5.4–5.6.

### Route strategy

| Option | Pros |
|--------|------|
| **A — Single page** (like mockup) | Faster parity; one `view` state object |
| **B — SvelteKit routes** | `/events`, `/activities`, `/payment`; better long-term |

Mockup uses Option A. Either works.

### Screens

| Screen | Mockup function | When shown |
|--------|-----------------|------------|
| Events home | `viewEvents()` | tab = events, no sub |
| Event detail | `viewEventDetail()` | sub = `{ type: 'detail', id }` |
| Activities home | `viewActivities()` | tab = activities |
| Payment home | `viewPayment()` | tab = payment |
| Pay event picker | `viewPayEvent()` | sub = `{ type: 'pay-event', id }` |
| Pay activity receipt | `viewPayActivity()` | sub = `{ type: 'pay-activity', eventId, activityId }` |

### AppBar titles per view

| View | Title | Subtitle |
|------|-------|----------|
| Default | Welcome to Beezy | Split trips, stay friends |
| Event detail | `{event.title}` | Participants & balances |
| Pay event | `{event.title}` | Pick an expense to settle |
| Pay activity | `{event.title}` | Receipt to screenshot & share |

### Empty states (6 variants)

1. No events → welcome + create CTA
2. No activities (no events) → go to Events
3. No activities (has events) → add first expense
4. No payment (no events) → create event
5. Pay-event with no expenses → go to Activities
6. Event detail with no participants → hint card

### Exit criteria

- All tabs navigable with seed data
- Event detail shows stat grid + participant rows
- Back: pay-activity → pay-event → tab home
- FAB visibility tied to view state

---

## Phase 6 — Sheets, forms & menu ⬜

Modal flows for create/edit and global actions.

### Sheets

| Sheet | Form fields |
|-------|-------------|
| New event | title*, budget* |
| New / edit activity | name*, price*, event*, paid by* |
| About | static content |

### Behaviors

- **New event** → save → close sheet → open event detail → focus participant input
- **Activity sheet** → paid-by options update when event changes
- **Edit activity** → delete button in sheet head
- **Menu** → About, Reset demo data (with confirm)

Reuse Phase 1: `Field`, `Input`, `AmountInput`, `Select`, `Button`, `HintCard`, `Sheet`.

### Exit criteria

- Create event end-to-end
- Add / edit / delete activity
- About sheet from menu
- Reset demo restores Boracay + Tagaytay seed

---

## Phase 7 — Payment & settlement ⬜

### User flow

```
Payment tab → Pick event → Expense list + progress → Tap expense → Receipt
  → Settle (or Mark unpaid) / Copy receipt text
```

### Actions

| Action | Mockup function |
|--------|-----------------|
| Settle expense | `settleActivity()` |
| Unsettle | `unsettleActivity()` |
| Copy summary | `copyActivitySummary()` |
| From event detail | `goPayEvent()` — "Settle up →" |

### Edge cases

- Solo expense (1 participant) — receipt explains no split
- All settled event — green `PayEventCard` + hint card
- Participant with paid activities — cannot remove
- Event fully settled toast — "All settled — {title} is square 🤗"

### Exit criteria

- Settle / unsettle updates store and progress UI
- Receipt layout matches mockup (tear edge, collect breakdown)
- Clipboard copy with fallback for older browsers

---

## Phase 8 — Polish & ship ⬜

| Area | Task |
|------|------|
| Assets | Add `favicon.svg` (`+layout.svelte` currently imports missing file) |
| Routes | Move showcase to `/kit`; `/` becomes real app |
| Meta | `theme-color`, `viewport-fit=cover` |
| A11y | Sheet focus trap; `aria-label` on icon buttons; Enter on participant add |
| Persistence | Verify IndexedDB across refresh |
| Responsive | 440px phone frame + desktop backdrop |
| PWA (optional) | manifest, service worker |
| Tests | `settlement.ts` unit tests |
| CI | `bun run check` + build |
| README | Keep in sync with this PRD |

---

## Final parity checklist

Use when Phase 8 is near complete.

### Navigation

- [ ] 3 tabs: Activities, Events, Payment
- [ ] Back from detail / pay-event / pay-activity
- [ ] FAB on Events always; Activities only when events exist
- [ ] FAB hidden during sheets and sub-screens

### Events

- [ ] List with budget progress + over-budget styling
- [ ] Create event sheet
- [ ] Event detail: stats, add participants, balances
- [ ] Remove participant (only if they haven't paid)
- [ ] Delete event (with confirm)

### Activities

- [ ] Chronological list across events
- [ ] Tap to edit
- [ ] Create from FAB or event detail
- [ ] Paid-by dropdown depends on event participants

### Payment

- [ ] Event cards with settled progress
- [ ] Per-expense picker with progress header
- [ ] Receipt with tear edge, collect breakdown
- [ ] Settle / unsettle / copy text

### Global

- [ ] Menu: About, Reset demo
- [ ] Toasts on mutations
- [ ] Data persists in IndexedDB
- [ ] Works offline (no network calls)

---

## Recommended build order

Minimizes rework after Phase 1:

1. **Finish Phase 2** — Toast, MenuPopover, icons module
2. **Phase 3** — EmptyState, EventCard, ActivityRow, ProgressBar
3. **Phase 4** — types, settlement, store (can parallel Phase 3)
4. **Phase 5** — Events + Activities tabs first
5. **Phase 6** — New event + activity sheets
6. **Phase 3 cont.** — Receipt, PayEventCard, ParticipantRow
7. **Phase 7** — Payment tab + settle flow
8. **Phase 8** — favicon, `/kit`, tests, README

---

## Target file structure

```
beezy-app/
  PRD.md                          ← this file
  static/beezy-mockup.html        ← visual + behavior spec
  src/
    lib/
      styles/
        tokens.css
        fonts.css
        base.css
        primitives.css            # Phase 1
        shell.css                 # Phase 2
        components.css            # Phase 3 (optional)
      beezy/
        types.ts                  # Phase 4
        format.ts
        settlement.ts
        db.ts                     # IndexedDB schema + migrations
        store.ts                  # CRUD via IndexedDB
        seed.ts
        utils.ts
      components/ui/              # all Svelte UI components
        index.ts
        icons/                    # Phase 2 — Icon.svelte + IconName
    routes/
      +layout.svelte
      +page.svelte                # real app (Phase 5+)
      kit/+page.svelte            # component gallery (Phase 8)
```

---

## Component pattern (keep for every new component)

1. Copy CSS from `beezy-mockup.html` → `primitives.css`, `shell.css`, or `components.css`
2. Create thin Svelte wrapper with typed props + slots
3. Use `cn()` for conditional classes
4. Export from `src/lib/components/ui/index.ts`
5. Add demo section to showcase page (until `/kit` exists)
6. Compare side-by-side with mockup

```svelte
<!-- Example: wrapper over global CSS class -->
<button class={cn('btn', `btn-${variant}`, className)}>
  {@render children?.()}
</button>
```

---

## Quick commands

```sh
cd beezy-app
bun run dev      # local dev (http://localhost:5173)
bun run check    # TypeScript + Svelte check
bun run build    # production build
bun run preview  # preview production build
```

---

*Last updated: Phase 5.3 — Activities tab mockup parity (empty states 2 & 3, ScreenHead). Next: 5.4 Payment picker / 5.5–5.6.*
