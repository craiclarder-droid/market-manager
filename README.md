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
