# Market Manager — Cycle 1

Mobile-first market planning tool. This first build establishes Organiser → Market → Event relationships, event-specific persistent checklists, local persistence, a basic dashboard, current-month calendar, personal calendar items, and future-section placeholders.

## Deploy on GitHub Pages
Upload all files in this folder to the repository root. In **Settings → Pages**, choose **Deploy from a branch**, `main`, `/ (root)`.

## Persistence
Cycle 1 uses browser `localStorage`. Data survives refresh/reopen on the same browser/device. Use **Settings → Export backup** for a JSON backup. This is intentionally isolated in the data layer so a cloud database can replace it later.

## Architecture
- Organiser: reusable organiser/contact data
- Market: recurring/general market information
- Event: one dated occurrence, with its own fee/status/times/instructions/checklist
- Personal calendar item: non-market commitments
- Default checklist is copied into each new event; event edits do not mutate the master list.

## Next Cycle 1 pass
Full calendar navigation, clash detection, improved organiser reuse, dashboard action queue, and checklist reordering.


## Cycle 1 Fix 1
- Fixed event checklist add/remove wiping unsaved form fields.
- Added Craic Larder's standard market checklist as the default for new events.
- Existing saved markets/events are preserved.

## Cycle 1 Fix 2
- Migrates the older eight-item live default checklist to Craic's full standard checklist.
- Fixes Settings checklist Add/Remove controls so they cannot submit or reset anything.
- Adds "Restore Craic standard list" as a safe recovery button.
- Existing markets and event records are preserved.

## Checklist Locked Patch
- Craic's 31-item market checklist is now the canonical master checklist.
- A one-time migration replaces the old short default checklist.
- Every newly-created event copies the 31-item master list.
- Existing saved markets and existing event checklists are not overwritten.
- After migration, the master list remains editable in Settings.

## Cycle 2 - Market Performance
Adds post-market takings, cash/card, travel and other costs, footfall, weather, rebook judgement, notes, automatic net and net/hour, plus per-market averages/best/worst.

## Cycle 2.1
- All money inputs now accept pounds and pence (e.g. £209.50).
- Base postcode stored as PA2 8TR; full home address is not stored.
- Return mileage × configurable mileage rate calculates travel cost.
- Default mileage rate: £0.55/mile for 2026/27.
- Itemised event expenses with description + amount.
- Existing legacy 'other costs' are migrated into an expense line when an event is opened.
