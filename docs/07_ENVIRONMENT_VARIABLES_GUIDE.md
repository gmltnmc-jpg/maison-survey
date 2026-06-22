# Environment Variables Guide

Use `.env.example` as the public template and create `.env.local` locally. Never copy real values into this guide.

| Variable | Type | Used In | Description | Caution |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Browser client, server client, proxy | Supabase project URL. Required locally and in Vercel. | Safe to expose, but it identifies the Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Browser client, server client, proxy | Supabase anon key. Required locally and in Vercel. | Safe to expose only when RLS is correctly configured. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Trusted server code, `/api/submit` via Supabase admin client | Allows trusted server-side inserts and bypasses RLS. Required locally and in Vercel server environment. | Never expose to browser. Never use `NEXT_PUBLIC_`. Never commit real value. |
| `RRN_ENC_KEY` | Server-only | `src/lib/crypto/rrn.ts` | Base64-encoded 32-byte key used for AES-256-GCM resident registration number encryption. Required locally and in Vercel server environment. | Never expose to browser. Never log. Losing or rotating it can affect decryptability of existing encrypted data. |

## Public vs Server-Only

Public variables start with `NEXT_PUBLIC_` and can be bundled into browser code.

Server-only variables must not start with `NEXT_PUBLIC_`. They should be read only by server routes, server actions, or server-only utility modules.

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in values from Supabase and the secure project secret store.
3. Keep `.env.local` private.
4. Do not send `.env.local` through chat or email.

## Vercel Setup

Register all required variables in the Vercel project settings for the correct environment:

- Production
- Preview, if used
- Development, if Vercel development variables are used

After editing Vercel environment variables, redeploy so the app picks up the new values.

## Required in Both Local and Vercel

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RRN_ENC_KEY`

## Quick Safety Check

- `SUPABASE_SERVICE_ROLE_KEY` is not prefixed with `NEXT_PUBLIC_`.
- `RRN_ENC_KEY` is not prefixed with `NEXT_PUBLIC_`.
- `.env.local` is ignored by Git.
- `.env.example` contains names and comments only, not real values.
