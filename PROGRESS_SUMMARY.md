# eVoting Project Progress Summary

This document serves as a permanent record of the features built, bugs fixed, and architectural changes made during our pair programming session. 

## 1. Election Creation Flow
- **Real-Time Date Validation:** Added strict real-time validation to the election creation form. The UI instantly warns and disables the "Continue" button if the End Date is before the Start Date, or if the Start Date is in the past.
- **Auto-Save Drafts:** Implemented a robust `localStorage` auto-save system. Any data typed into the form (title, dates, positions) is instantly saved locally. If the page crashes or is accidentally refreshed, the data persists. Drafts are automatically cleared upon successful backend submission.
- **Quick Entry:** Enhanced the Positions list so that pressing the `Enter` key automatically adds a new position line and focuses the cursor on it, allowing for extremely fast data entry without needing the mouse.

## 2. Candidate Management
- **Add Candidate Modal:** Built a sleek modal to add candidates to specific positions, complete with a drag-and-drop/clickable photo upload zone and dynamic lists for their past credentials/roles.
- **Photo Rendering:** Replaced the default initials fallback to correctly render the candidate's actual profile photo once uploaded.
- **Graceful Error Handling:** Wired up the UI to properly catch and display backend errors inside the modal (e.g., if a file upload fails or fields are missing), ensuring the app never silently fails or gets "stuck".

## 3. Backend Enhancements (Bypassing Supabase)
- **Local File Uploads:** To completely unblock testing without relying on third-party API keys, we bypassed Supabase entirely. The backend (`CandidateController` & `SupabaseService`) was rewritten to save uploaded candidate photos directly to your hard drive inside `backend/public/uploads/candidates/`.
- **Static File Serving:** Configured the NestJS backend (`main.ts`) using `express.static` to serve the `public/uploads` folder. The frontend now fetches and renders these images natively via `http://localhost:3000/uploads/...`.

## 4. Local Development Environment Setup (Milestone)
- **Database & Services:** Successfully configured and launched PostgreSQL and Redis using `docker-compose`.
- **Database Schema & Seeding:** Synced the Prisma schema with the database (`npx prisma db push`) and seeded initial test data (Admin: `admin@htu.edu.gh`, Voter: `040919012`).
- **Server Startup:** Verified both the NestJS backend (`:3000`) and Vite frontend (`:8081`) servers are running healthily in development mode.
- **Documentation:** Created a comprehensive `project_overview.md` artifact detailing the architecture, API routes, and database schema for future reference.

## 5. Google OAuth — COMPSSA HTU Fix (Milestone)
- **Strict Domain Enforcement:** Removed all dev bypasses. Only `@htu.edu.gh` Google accounts are permitted to log into the Admin portal. Any other Google account is rejected with a clear error.
- **Two-Step Admin Login Flow:** Admin logs in via Google → backend verifies `@htu.edu.gh` domain → auto-provisions admin account if first login → generates a secure `ADMIN-XXXX-XXXX` token → emails it (or prints to terminal log) → admin enters token in Step 2 UI.
- **TypeScript Compile Fixes:** Resolved broken imports (`VoterLoginDto`, `MailService` duplicate, `passwordHash` non-existent field) that were blocking the backend from compiling and starting.
- **Frontend Error:** Fixed `Cannot POST /auth/admin/request-token` — was caused by the backend compile failure blocking route registration.

## 6. Frontend Data Wiring Fixes (Milestone)
- **Query Invalidation Bug Fixed:** `useGenerateTokens` and `useClearVoters` were invalidating the wrong React Query key (`['election-voters']`). Fixed to match the actual key used by `useElectionVoters` (`['elections', electionId, 'voters']`). This means the Voter Roll table now auto-refreshes after generating tokens or clearing voters.
- **Global Voter Roll Page:** Confirmed the global `/admin/voters` route is NOT linked in the sidebar — UI is clean and judge-friendly.

## 7. Admin UI Scroll & Overflow Fixes (Milestone)
- **AdminShell Layout:** Changed from `min-h-dvh` to `h-dvh overflow-hidden`. The main content area is now `overflow-y-auto` with `pb-32` so content is never cut off at the bottom.
- **DateTimePicker Popover:** Applied `max-h-[var(--radix-popover-content-available-height)] overflow-y-auto` so the calendar/time picker can scroll internally when there isn't enough vertical space.
- **Popover (global):** Added `collisionPadding={16}` so all popovers stay 16px away from screen edges and never overflow.
- **Dialog & AlertDialog:** Both now have `max-h-[85vh] overflow-y-auto` — ensures the Candidate editor modal and election confirm dialogs scroll on small screens instead of vanishing.

## Current Status
- ✅ Backend running on `:3000`
- ✅ Frontend running on `:8081`
- ✅ PostgreSQL + Redis via Docker
- ✅ Google Auth restricted to `@htu.edu.gh` only
- ✅ Admin two-step token login working
- ✅ Voter Roll CSV upload + token generation wired end-to-end
- ✅ All overlay/modal/popover UIs scrollable

## Remaining Test Steps (E2E Flow)
1. Admin logs in with `@htu.edu.gh` Google account → enters emailed token
2. Create election → add positions → add candidates
3. Upload voter CSV → generate tokens
4. Open Election
5. Voter goes to `localhost:8081`, enters token, authenticates with Google, casts ballot
6. Admin watches Live Turnout update in real-time
