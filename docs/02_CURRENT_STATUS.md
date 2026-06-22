# Current Status

## Known Project State

- Project path: `/Users/heetsoo/Desktop/maison survey`
- GitHub: `https://github.com/gmltnmc-jpg/maison-survey.git`
- Vercel project: `maison-survey`
- Current branch: `main`
- Next.js App Router is used.
- Supabase migrations exist under `supabase/migrations`.
- `.env.local.example` exists.
- `.env.example` has been added for handoff clarity.
- `npm run lint` passes after the lint cleanup pass.

## Completed Work

- Patient-facing survey structure exists under `src/app`.
- Admin dashboard routes exist under `src/app/admin`.
- Supabase helper clients exist under `src/lib/supabase`.
- Server submission endpoint exists at `src/app/api/submit/route.ts`.
- RRN encryption helper exists under `src/lib/crypto`.
- Supabase migration files exist for initial schema, admin memo, RLS/admin policy updates, and missing response columns.
- GitHub remote and Vercel project metadata are present locally.

## Items That Need Improvement

- README needed replacement from the default Next.js template.
- Handoff documents need to explain project structure, Supabase schema, security rules, environment variables, and deployment testing.
- Supabase production database must be checked to confirm migrations and RLS policies are actually applied.
- Previous lint errors have been fixed. Keep running lint before handoff and deployment.
- Admin account setup and `app_metadata.role = admin` assignment need a clear operational guide.

## Inspection Summary

Current handoff grade: **B grade: can be transferred after documentation and environment variable cleanup.**

The project structure is usable, but a new developer or AI assistant would need clearer documentation before safely continuing work. The main risks are not missing app code; they are unclear operational setup, RLS verification, secret handling, and incomplete deployment/test instructions.

## Remaining Major Risks

- Supabase RLS may not match local migration files in the live project.
- `0001_init.sql` alone gives too much access to authenticated users unless later RLS migrations are also applied.
- `.env.local` contains real local secrets and must never be shared.
- Documents under `docs/*.pdf` may need manual review for real personal or health information.
- Continue checking lint and build before deployment because CI or Vercel settings may depend on them.

## Next Priorities

1. Confirm live Supabase migration and RLS state.
2. Verify Vercel environment variables are registered correctly.
3. Keep `npm run lint` and `npm run build` passing before deployment.
4. Document admin account creation and role assignment.
5. Review `docs/*.pdf` for accidental real patient or customer data.
