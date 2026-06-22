# Security Requirements

## Secret Handling

- Do not share `.env.local` externally.
- Do not paste real environment variable values into chat, documents, screenshots, or GitHub.
- Do not commit real Supabase keys, encryption keys, Vercel tokens, Supabase access tokens, or GitHub tokens.

## Service Role Key

`SUPABASE_SERVICE_ROLE_KEY` is a server-only secret.

- Never prefix it with `NEXT_PUBLIC_`.
- Never import it into client components.
- Never return it from an API response.
- Use it only in trusted server-side code such as `/api/submit`.

## RRN Encryption Key

`RRN_ENC_KEY` is a server-only encryption key.

- Never prefix it with `NEXT_PUBLIC_`.
- Never expose it in browser code.
- Never log it.
- Store it only in local `.env.local` and Vercel server environment variables.

## Resident Registration Number Handling

- Resident registration numbers must be encrypted before storage.
- Plain resident registration numbers must not be stored in `raw_answers`.
- Admin UI should use masked values where possible.
- If full resident registration number collection is not legally required, consider replacing it with a less sensitive identifier.

## Patient and Health Data

- Do not upload real patient or customer data to GitHub.
- Do not commit CSV, PDF, spreadsheet, screenshot, or export files containing real personal or health data.
- Review `docs/*.pdf` manually to confirm they do not contain real personal information or real health information.

## Logging and API Responses

- Do not use `console.log(formData)`, `console.log(answers)`, or similar full-payload logging for survey submissions.
- Do not log resident registration numbers, phone numbers, addresses, medical history, or raw request bodies.
- `/api/submit` must not return sensitive data in its response.
- API errors should be generic enough that they do not reveal private records or secret configuration.

## Admin Access

- Admin pages must verify the Supabase session.
- Admin pages must verify `app_metadata.role = admin`.
- Server actions and server queries must re-check admin role instead of relying only on UI hiding.
- Non-admin authenticated users must not be able to list or view survey responses.

## Supabase RLS

- RLS must be enabled on sensitive tables.
- Public select must be blocked.
- Public direct insert should not be required because `/api/submit` handles trusted inserts.
- Admin select/update should require the admin role.
- Production Supabase policies must be checked directly in the Supabase dashboard or SQL editor before handoff.

## Deployment Safety

Before deployment, confirm:

- Vercel has all required environment variables.
- Server-only secrets are not exposed as `NEXT_PUBLIC_*`.
- Supabase RLS policies match the expected migration files.
- No real patient files are included in the repository.
- Lint/build status is known.
