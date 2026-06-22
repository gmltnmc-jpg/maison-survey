# Deployment and Test Guide

## New Local Environment Setup

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Create a local environment file:

```bash
cp .env.example .env.local
```

4. Fill `.env.local` with real project values from the secure owner-controlled source. Do not copy values into GitHub or chat.

5. Start the development server:

```bash
npm run dev
```

6. Open the local app:

```text
http://localhost:3000
```

## Environment Variables

Confirm `.env.local` contains:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RRN_ENC_KEY`

`SUPABASE_SERVICE_ROLE_KEY` and `RRN_ENC_KEY` must be server-only.

## Vercel Environment Check

In the Vercel project `maison-survey`, confirm all required environment variables are registered for the target environment.

After changing Vercel environment variables, redeploy the app.

## Supabase Connection Check

Before functional testing:

1. Confirm the Supabase project URL and anon key are correct.
2. Confirm the service role key belongs to the same Supabase project.
3. Confirm the required tables exist.
4. Confirm RLS is enabled and policies match the migration files.

## Test Survey Submission

Use test-only data. Do not enter real patient data.

1. Open the local survey page.
2. Submit a complete test response.
3. Confirm the browser receives a success response.
4. In Supabase, confirm a row was created in `patients`.
5. Confirm a row was created in `survey_responses`.
6. Confirm `raw_answers` does not contain plaintext resident registration number data.
7. Confirm `rrn_encrypted` exists and `rrn_mask` is masked.

## Admin Login Check

1. Confirm an admin user exists in Supabase Auth.
2. Confirm that user has `app_metadata.role = admin`.
3. Open `/admin/login`.
4. Log in with the admin account.
5. Confirm `/admin` shows response rows.
6. Confirm a non-admin authenticated user cannot access the admin dashboard.

## RLS Checklist

Run this verification before handoff or production changes:

- `patients` has RLS enabled.
- `survey_responses` has RLS enabled.
- Anonymous users cannot select from `patients`.
- Anonymous users cannot select from `survey_responses`.
- Normal authenticated non-admin users cannot list responses.
- Admin users with `app_metadata.role = admin` can list responses.
- Admin users can update intended fields such as `status` and `admin_memo`.
- Public direct database access is not required for survey submission.
- `/api/submit` is the only patient submission path.

## Deployment Preflight

Before deploying:

- Confirm `.env.local` is not tracked by Git.
- Confirm `.env.example` contains no real secrets.
- Confirm Vercel has all required environment variables.
- Confirm live Supabase migrations and RLS match local SQL.
- Confirm no real patient/customer files are committed.
- Run lint and build, then record any known failures.

Current verification note: `npm run lint` and `npm run build` passed after the lint cleanup pass.
