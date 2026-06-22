# Supabase Schema and RLS

## Migration Files

The project currently keeps Supabase SQL under `supabase/migrations`.

| File | Role |
| --- | --- |
| `0001_init.sql` | Creates the initial `patients` and `survey_responses` tables, indexes, updated_at trigger, and first RLS policies. |
| `0002_add_admin_memo.sql` | Adds the `admin_memo` column to `survey_responses`. |
| `0003_rls_admin_policies.sql` | Tightens RLS policies so only authenticated users with `app_metadata.role = admin` can read/update admin data. Also restricts update privileges. |
| `0004_add_missing_response_columns.sql` | Adds additional response columns such as `submitted_at`, `health_score`, `pdf_generated`, and `score_components`. |

## Important Migration Warning

`0001_init.sql` alone must not be treated as the final security state.

If only `0001_init.sql` is applied, authenticated users may receive broad select/update access. The project must apply `0003_rls_admin_policies.sql` as well so admin access is limited by `app_metadata.role = admin`.

Before production use or handoff, confirm that the live Supabase database has the complete migration set and the expected RLS policies.

## `patients` Table

The `patients` table stores identity and contact information for the person submitting the survey.

Typical data includes:

- Name
- Encrypted resident registration number
- Masked resident registration number
- Phone
- Address
- Sex
- Referral information
- Consent information

The resident registration number must not be stored in plaintext.

## `survey_responses` Table

The `survey_responses` table stores one survey submission per row. It links to `patients` through `patient_id`.

Typical data includes:

- `raw_answers` JSONB response body
- Promoted dashboard fields such as goals, complaints, weight, height, target weight, BMI, and risk flags
- Submission timestamps
- Admin workflow fields such as `status` and `admin_memo`
- Future scoring or PDF status fields

`raw_answers` must not contain the plaintext resident registration number.

## `status` and `admin_memo`

`status` tracks the counseling workflow state for each response. Current app code expects values such as:

- `신규 제출`
- `상담 예정`
- `상담 완료`
- `보류·취소`

`admin_memo` stores internal notes written by an authorized admin or counselor.

## RLS Policy Purpose

RLS must make database access safe even if the anon key is visible in the browser. Public or anonymous users should not be able to read patient rows or response rows.

The intended structure is:

- Survey submitters do not directly read from Supabase.
- Survey submitters do not directly write from the browser to Supabase.
- `/api/submit` performs trusted server-side inserts.
- Admin users can read and update only after Supabase Auth verifies their session and role.

## Public Select Must Stay Blocked

Public select on `patients` or `survey_responses` would expose personal and health information. It must stay blocked.

The anon key can be public only if RLS is correctly configured. RLS is the protection layer that prevents the public browser client from reading private rows.

## Admin Role-Based Access

Admin access depends on Supabase Auth plus `app_metadata.role = admin`.

This is enforced in multiple places:

- Route protection in `src/proxy.ts`
- Server-side query checks in admin query/action code
- Supabase RLS policies from `0003_rls_admin_policies.sql`

An admin account is not just any authenticated user. The user must have the expected app metadata role.

## Why `/api/submit` Uses `service_role`

The survey submission endpoint uses a server-only service role client because public users should not receive direct insert permissions on sensitive tables.

This keeps browser access limited while allowing the trusted server route to:

1. Validate the request.
2. Encrypt sensitive identifiers.
3. Remove plaintext RRN from `raw_answers`.
4. Insert rows into Supabase.

The service role key must only exist in server-side environment variables and must never be exposed to browser code.

## Live Database Verification Required

Local migration files show the intended structure, but they do not prove the production database matches it.

Before handoff or production changes, verify in Supabase:

- All migrations have been applied.
- RLS is enabled on `patients` and `survey_responses`.
- Public select is blocked.
- Admin select/update policies require `app_metadata.role = admin`.
- Update privileges are limited to intended fields.
