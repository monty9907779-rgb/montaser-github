# nupco-sync — CALYTD change (2026-10-07)

Pulled read-only from Google Drive (Apps Script export) for:
- Engine — 1-vr-FKrrmkekZ7ItP2g-HQ3NwCnX-Rgz5nkqbzPq38lgCviSzANyu5zZ
- TAMER BD Dashboards — 1iOA3amBK5lNoK92prMnRK91iYuRax2Hai3Qwb0xgK227zVCBpesV01L5

Edits (all marked `/*CALYTD*/`):
- Engine/Engine.js: gatherSalesRows_ + buildAggregates_ month list = Jan..current month of current year; Oct–Dec of previous year prepended only when current month is Jan–Sep.
- Engine/Report.js: same SEQ change.
- Engine/Render.js + TAMER BD Dashboards/Render.js: months() with basis==='bd' keeps only months >= Oct of D.bdStartYear.

NOT done here (no Apps Script credentials / gas.py in this environment):
push, runDaily, new deployment version, TAMER-Engine-Data.json check.
