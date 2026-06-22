# Maison Survey

Medical and counseling intake survey system for Maison de Balance.

## Tech Stack

- Next.js App Router
- Vercel
- Supabase database, Auth, and RLS
- TypeScript
- npm

## Local Setup

Install dependencies:

```bash
npm install
```

Create local environment variables:

```bash
cp .env.example .env.local
```

Fill `.env.local` with real values from the secure project owner source. Do not commit or share `.env.local`.

Start development:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment Variables

Required variables are listed in `.env.example`.

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RRN_ENC_KEY`

`SUPABASE_SERVICE_ROLE_KEY` and `RRN_ENC_KEY` are server-only secrets. Never expose them to browser code.

## Main Documents

- [Project Overview](docs/01_PROJECT_OVERVIEW.md)
- [Current Status](docs/02_CURRENT_STATUS.md)
- [Supabase Schema and RLS](docs/05_SUPABASE_SCHEMA_AND_RLS.md)
- [Security Requirements](docs/06_SECURITY_REQUIREMENTS.md)
- [Environment Variables Guide](docs/07_ENVIRONMENT_VARIABLES_GUIDE.md)
- [Deployment and Test Guide](docs/08_DEPLOYMENT_AND_TEST_GUIDE.md)

## Security Notice

This project handles personal information and health-related information. Do not commit real patient data, `.env.local`, service role keys, encryption keys, or exported database files. Confirm Supabase RLS before production use.
