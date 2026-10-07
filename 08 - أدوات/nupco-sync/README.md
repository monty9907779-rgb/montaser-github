# nupco-sync — CALYTD change (2026-10-07)

Pulled read-only from Google Drive (Apps Script export) for:
- Engine — 1-vr-FKrrmkekZ7ItP2g-HQ3NwCnX-Rgz5nkqbzPq38lgCviSzANyu5zZ
- TAMER BD Dashboards — 1iOA3amBK5lNoK92prMnRK91iYuRax2Hai3Qwb0xgK227zVCBpesV01L5

Edits (all marked `/*CALYTD*/`):
- Engine/Engine.js: gatherSalesRows_ + buildAggregates_ month list = Jan..current month of current year; Oct–Dec of previous year prepended only when current month is Jan–Sep.
- Engine/Report.js: same SEQ change.
- Engine/Render.js + TAMER BD Dashboards/Render.js: months() with basis==='bd' keeps only months >= Oct of D.bdStartYear.

Status (2026-10-07):
- Pushed to both Apps Script projects via API; fresh pull confirms 8 `/*CALYTD*/` markers.
- TAMER BD Dashboards: version 76 created, web-app deployment AKfycbz0UFD… updated to v76.
- runDaily: not runnable via API (needs execution scope); run from the Engine editor or wait for the daily trigger.
- TAMER-Engine-Data.json (last built 2026-10-07 01:53) still has old seq [Oct 2026]; regenerates on next runDaily.
