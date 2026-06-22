---
name: rrn-enc-key-policy
description: How the RRN_ENC_KEY for encrypting 주민등록번호 must be generated and stored
metadata: 
  node_type: memory
  type: project
  originSessionId: f142f688-e2f0-4497-91ce-b1d73ab9b9d8
---

RRN (주민등록번호) is encrypted with AES-256-GCM. The key `RRN_ENC_KEY` is a 32-byte (256-bit) random value, base64-encoded (`crypto.randomBytes(32).toString('base64')`).

Storage rule (user directive): store ONLY in local `.env.local` and Vercel env vars. NEVER in source code, Git, or the client bundle. No `NEXT_PUBLIC_` prefix — read server-side only via `process.env.RRN_ENC_KEY`. Repo commits an empty `.env.local.example` template; `.env.local` is gitignored.

**Why:** Patient RRN is sensitive unique-id data; key leakage would expose all stored RRNs. Losing the key makes stored ciphertext unrecoverable, so back it up on creation.

**How to apply:** When wiring encryption, generate the key once, set it in both `.env.local` and Vercel, and never log or echo it. See [[maison-survey-architecture]].
