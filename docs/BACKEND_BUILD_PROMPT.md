# Prompt: Build the HTU Secure Online Voting System Backend

Paste this into your AI app builder. Two reference files are attached alongside this prompt: `package.json` (dependencies already chosen and installed) and `prisma/schema.prisma` (the complete, finalized database schema). Use both exactly as provided — do not regenerate or restructure them unless you find an actual bug.

---

## Context

Build the complete backend for the HTU Secure Online Voting System, a NestJS application currently scoped for COMPSSA elections and designed to scale to other HTU bodies later. This backend serves three existing frontend phases (Voter App, Admin Dashboard, Results & Tally View) that were already built separately — your job is the backend only, exposing the exact API contract those frontends expect.

Two companion documents define every requirement in full detail and must be treated as the source of truth for anything not explicitly repeated below: the **Backend Requirements Specification** (architecture, full API contract, security implementation, error handling, testing requirements, deployment) and the **Software Requirements Specification** (business rules, especially the vote-counting rules in its Section 5). If anything in this prompt seems ambiguous, defer to those documents rather than guessing.

## Starting Point — Do Not Redo This

A NestJS project has already been scaffolded with these dependencies installed (see attached `package.json`): `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `@nestjs/bullmq`, `@prisma/client`, `prisma`, `passport`, `passport-jwt`, `argon2`, `bullmq`, `ioredis`, `nodemailer`, `class-validator`, `class-transformer`, `helmet`, `uuid`. A `multer` override is pinned in `package.json` (`"overrides": { "multer": "2.2.0" }`) to patch a known high-severity DoS vulnerability in the version NestJS pulls in by default — keep this override in place.

The attached `prisma/schema.prisma` is the complete, final database schema. Run `npx prisma migrate dev --name init` to apply it — do not modify the schema's structure except to fix a genuine bug. In particular, preserve this rule exactly as written: **`VoteRecord` has no foreign key or relation to `Voter` or `VoterToken`.** This is a deliberate anonymity control, not an oversight — one-vote-per-voter is enforced entirely through `VoterToken.used`, in a completely separate table from where vote content lives. Do not "fix" this by adding a voterId column to VoteRecord under any circumstance.

## What to Build

Build all eight modules exactly as architected in the Backend Requirements Specification Section 2.1: `AuthModule`, `ElectionModule`, `CandidateModule`, `VoterModule`, `VotingModule`, `TallyModule`, `NotificationModule`, `AuditModule`. Each module owns its own Prisma model access; no module should directly query another module's tables — go through that module's service instead, even though they share one Prisma client.

Implement every endpoint listed in the Backend Requirements Specification Section 4 (API Contract), with the exact request/response JSON shapes, status codes, and error format shown there. Do not invent your own response envelope — every error response must follow the standard shape in Section 4.8 (`statusCode`, `error`, `message`, `requestId`).

Pay special attention to these specific pieces of logic, which are the parts most likely to be implemented incorrectly if rushed:

**Vote casting (Backend Requirements Section 2.2).** This is the single most important piece of code in the system. The full step-by-step transaction is specified there: acquire a row-level lock on the voter's `VoterToken` row inside a database transaction, check `used = false` *inside* that lock (not as a separate pre-check), validate the ballot payload, encrypt it with AES-256-GCM using a freshly generated IV per record (never reused), compute the hash-chain link from the previous link's hash, insert `VoteRecord` + `VoteChainLink`, set `token.used = true`, and commit — all in one transaction. If anything fails, the whole operation rolls back and the token remains valid for a safe retry. The `Idempotency-Key` header on `POST /api/v1/votes` must be honored: replay the same key and return the original response without re-processing.

**Vote counting rules (SRS Section 5, Backend Requirements Section 4.6).** Each `Position` has a `countingMethod` (`plurality` or `simple_majority`) and, if majority, a `majorityFallback` (`runoff` or `plurality`), both locked once the election opens. The tally computation must: exclude abstentions from the percentage denominator for majority calculations, detect exact ties at the top vote count and flag `resolutionState: tie`, detect majority shortfalls (leading candidate at or under 50%) and flag `resolutionState: no_majority_reached`, and block results publication (`POST /elections/:id/results/publish`) until every position is `resolved`.

**Vote anonymity (Backend Requirements Section 5.3).** No log line, audit entry, or application log may ever contain both a voter's identity and any reference to their vote's existence or content in the same record. Audit log entries for vote-casting record only the event ("vote cast for election X"), never which voter.

**Token email delivery via Google Workspace SMTP.** The `NotificationModule` must send voter token emails using Nodemailer configured against Google Workspace SMTP (`smtp.gmail.com`, port 587, STARTTLS) authenticated with an App Password (the team will provide `GMAIL_USER` and `GMAIL_APP_PASSWORD` as environment variables — do not hardcode credentials). Token generation (`POST /elections/:id/voters/generate-tokens`) must respond immediately (202 Accepted with a batch ID) while actual sending happens asynchronously via a BullMQ job per voter, retrying up to 3 times with exponential backoff before marking that voter's `EmailDeliveryLog.status` as `failed`. Implement `GET /elections/:id/voters/delivery-status` and `POST /voters/:voterId/resend-token` exactly as specified — the resend endpoint must remain callable even while the election is open, unlike every other voter-roll endpoint.

**RBAC.** Two admin roles, `super_admin` and `election_officer`, plus the voter JWT scope — implement as a NestJS Guard checked via an `@Roles()` decorator on every endpoint, with a global default that fails closed (denies) if a route is missing the decorator, never one that defaults to open access.

## Required Engineering Practices

Follow Backend Requirements Section 1.2 (Non-Negotiable Engineering Principles) throughout: fail closed, idempotent writes, immutable historical records (votes, audit logs, and locked election config are never updated in place), and counting rules as configuration, never hardcoded logic.

Implement the global exception filter from Section 6.1 so every thrown error — including unexpected ones — is formatted into the standard error shape, with internal stack traces logged server-side only, never returned to the client.

Implement rate limiting via `@nestjs/throttler` backed by Redis exactly per the table in Backend Requirements Section 5.5 (5 attempts / 15 min on voter and admin login, 3/hour on resend-token, 429 with `Retry-After` on limit breach).

Write the test suite described in Backend Requirements Section 7 — at minimum, the concurrency test is non-negotiable: simulate multiple simultaneous vote-casting requests using the same token and assert exactly one succeeds while all others receive 409, with the database showing exactly one resulting `VoteRecord` for that token's usage event.

## Deliverables

- A working NestJS application implementing all eight modules and every endpoint in the API contract
- A `docker-compose.yml` bringing up the app, PostgreSQL, and Redis together, runnable via a single `docker compose up` with no manual steps beyond providing a `.env` file
- A committed `.env.example` listing every required variable (per Backend Requirements Section 8.2, plus `GMAIL_USER` and `GMAIL_APP_PASSWORD` for email) with placeholder values and one-line comments — no real secrets ever in this file
- `GET /health/live` and `GET /health/ready` endpoints per Section 8.3
- The test suite from Section 7, passing
- Swagger/OpenAPI documentation auto-generated from NestJS decorators, available at a `/docs` route in development

Confirm before finishing that `docker compose up` produces a fully working system, that the concurrency test passes, and that no response from any endpoint ever leaks vote content alongside voter identity.
