# Project Overview

## Project Purpose

Maison Survey is a medical and counseling intake survey system for Maison de Balance. It is designed to collect pre-consultation answers, store them in Supabase, and let authorized administrators review submissions before counseling.

This project handles personal information and health-related information. Any future work must treat privacy, access control, and safe deployment as core requirements, not optional cleanup.

## Users

- Patients or clients who submit the intake survey.
- Clinic administrators or counselors who review submissions.
- Developers or AI assistants who maintain the survey, database, and dashboard.

## Technical Structure

- Next.js App Router: survey UI, admin pages, and server routes.
- Vercel: hosting and deployment target.
- Supabase: database, authentication, RLS, and project backend.
- Supabase Auth: admin login and session handling.
- Supabase migrations: schema and RLS policy history.

## Role of Each Platform

### Next.js

Next.js provides the patient-facing survey, admin dashboard, route protection, and `/api/submit` server endpoint. The app uses the App Router structure under `src/app`.

### Vercel

Vercel hosts the production deployment and must hold the required environment variables. Production settings should be checked before every deploy because this app depends on server-only secrets.

### Supabase

Supabase stores patients and survey responses. It also provides admin authentication and Row Level Security policies. RLS must prevent public reads and allow only authorized admin users to review submitted data.

## Survey Submission Flow

1. A patient opens the survey page.
2. The browser sends answers to `/api/submit`.
3. `/api/submit` validates the payload on the server.
4. The resident registration number is encrypted with `RRN_ENC_KEY`.
5. Plain resident registration number data is removed from `raw_answers`.
6. The server inserts patient and response rows through a trusted Supabase service role client.
7. The browser receives only a simple success or error response.

## Admin Dashboard Role

The admin dashboard lets authorized users view submitted survey responses, inspect details, manage status, and write admin memos. Admin access depends on Supabase Auth and an `app_metadata.role = admin` check.

## Privacy Warning

This project may process names, phone numbers, addresses, resident registration numbers, and health information. Never expose service keys, encryption keys, raw patient data, or full request payloads in browser code, logs, GitHub, or public documents.
