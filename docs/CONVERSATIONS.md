# HTU Secure Online Voting System - Build Log & Conversation History

This file tracks the key decisions, context, and progress made during the backend build.

## Pre-Build & Scaffolding (Phase 0)
- **Frontend Clean-up:** We successfully scrubbed all Lovable dependencies, telemetry hooks, and metadata from the frontend to ensure it's a completely standalone TanStack Start application ready for competition submission.
- **Backend Discovery:** The expected backend scaffold was missing, so we manually scaffolded a new NestJS application, ensuring it adheres exactly to the `Backend_Build_Phases.docx` and `COMPSSA_Voting_System_SRS.docx`.
- **Database Schema:** We created the `schema.prisma` file, strictly enforcing the anonymity rule (no foreign keys linking `VoteRecord` back to `Voter` or `VoterToken`).
- **Prisma Downgrade:** We encountered a compatibility issue with Prisma v7 dropping `url` support in the schema. We downgraded to Prisma v5 (standard for NestJS integrations) to ensure a stable, standard build.
- **Docker Setup:** Created `docker-compose.yml` to run PostgreSQL 15 and Redis 7 locally.

## Phase 1 Preparation
- **Google Auth Clarification:** Confirmed that Google OAuth is *not* used for Admin/Voter logins. Instead, Phase 1 uses Email/Password (Admin) and Student ID + Token (Voter). The Google integration is strictly for **Phase 3 (NotificationModule)**, which uses Google Workspace SMTP via Nodemailer and an App Password to deliver tokens.

---
*Note: We are currently waiting for the `docker compose up -d` command to be run so the databases are available to start Phase 1 (Database Migrations and AuthModule logic).*
