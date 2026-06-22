---
name: maison-survey-architecture
description: Core architecture decisions for the Maison de Balance 초진 설문 rebuild
metadata: 
  node_type: memory
  type: project
  originSessionId: f142f688-e2f0-4497-91ce-b1d73ab9b9d8
---

압구정 한방 다이어트·웰니스 의원의 환자 초진 설문 시스템. Decided 2026-06: scrap the old static HTML (index.html/admin.html, backed up + deleted) and rebuild from scratch as **Next.js App Router + TypeScript + Supabase Auth**.

- Old Supabase project was manually deleted by the user; a NEW project must be created (env keys change → update both `.env.local` and Vercel project `maison-survey`). Vercel project is kept.
- Two tables: `patients` (identity/admin, incl. encrypted RRN) and `survey_responses` (1 submission = 1 row, `raw_answers` jsonb keyed by semantic question IDs).
- Question IDs are **semantic/meaning-based** (e.g. `basic_name`, `goal_reason`, `sleep_quality`) per the Cowork 설계안 — never the numeric `02-01` style. Single source of truth in `src/lib/survey/questions.ts`.
- Submission goes through `/api/submit` server route with `service_role`; clients never write to Supabase directly. RLS denies anon all read/write.
- RRN stored encrypted in a separate column — see [[rrn-enc-key-policy]].
- Design docs live in `docs/` (Cowork = survey flow/wording authority; Chat = dashboard/PDF/risk/sensitivity authority).

**Why:** Static HTML exposed the anon key client-side with anon SELECT/UPDATE RLS — any visitor could read/edit all patient RRNs. Rebuild is required to satisfy server-side secrets, real admin auth, and encryption.

**How to apply:** Work is gated — user wants the plan + irreversible steps (Supabase project creation, migrations, env) confirmed before each. Scaffolding is local/free and can start on approval. PDF export and health-score formula are deferred (structure only).
