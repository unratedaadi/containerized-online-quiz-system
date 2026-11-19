# Quizroom

**A little progress, every day.** A complete, containerized online quiz system with a student workspace, instructor tools, persistent accounts, and server-side grading.

## Guides

- [Setup and GitHub preparation](SETUP.md)
- [How to use Quizroom](USAGE.md)

## Run with Docker

```sh
docker compose up --build -d
```

Open **http://localhost:9180**. Choose **Try student demo** or **Try admin demo** on the sign-in screen. No credentials are needed for presentation mode.

```sh
docker compose logs -f        # View application logs
docker compose down           # Stop; your data is preserved
```

The named `quizroom-data` volume stores the SQLite database. Rebuilding or restarting the container preserves accounts, quizzes and results. Deleting the volume removes that data.

## Run locally

Requires **Node.js 24+** and npm.

```sh
npm ci
cp .env.example .env
npm run dev
```

Open **http://localhost:5173**. The development client forwards API calls to port 3001. Fonts are bundled, so the UI does not depend on external font services.

For a production build without Docker:

```sh
npm run build
npm start
```

Open **http://localhost:3001**.

## What works

- **Accounts:** registration, password sign-in, logout, cookie sessions and server-enforced student/admin roles.
- **Student overview:** real completed quiz counts, average and best score, study time, weekly learning goal and recent activity.
- **Quiz library:** six seeded quizzes, 30 questions, topic filters, difficulty filters and searchable titles/descriptions.
- **Timed quizzes:** server-owned deadline, saved answers, resumable attempts, question navigation, unanswered-question confirmation and automatic expiry submission.
- **Results:** automatic scoring, explanations, answer review, persistent history and CSV export.
- **Leaderboard:** real learners ranked by average score and completed quizzes; no invented activity or email addresses.
- **Instructor tools:** create, edit and archive quizzes; up to 30 questions, four options per question and configurable duration.
- **Responsive UI:** desktop workspace, mobile navigation, keyboard interaction, focus management, loading and empty/error states.
- **Container delivery:** multi-stage image, non-root runtime, persistent volume, health check and restart policy.

## A five-minute presentation

1. Open the app and select **Try student demo**.
2. Explain the overview: all progress is calculated from real attempts.
3. Open **Explore quizzes**, search a subject and filter by topic or level.
4. Start **Web development essentials**; show the timer and question navigator.
5. Answer a question, leave the quiz, and resume it from Overview.
6. Complete the quiz, then show the score, explanations, My results and leaderboard.
7. Sign out using the avatar menu. Choose **Try admin demo**.
8. Open **Manage quizzes** and create a short quiz. Show that it immediately appears in the library. Edit or archive it to demonstrate management.

Seed quiz answer keys are in `server/seed.js` for instructor inspection. They are never included in student quiz responses before submission.

## Verification

```sh
npm test                 # API integration tests, isolated in-memory database
npm run test:e2e          # Browser workflows, isolated server and database
npm run build            # Production client build
npm run format:check     # Source formatting
```

Browser tests use installed Google Chrome. If Chrome is unavailable, install the Playwright browser using `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.js`. Browser tests run on port 5180 with a separate API on port 3102, preserving local presentation data.

## Structure

```text
src/                     React application and shared UI components
server/app.js            API, authentication, validation and SQLite schema
server/seed.js           Sample quizzes and instructor answer keys
server/index.js          Application startup and optional admin provisioning
tests/                   API and browser integration tests
public/                  Favicon and static assets
docs/                    Design concept, architecture and presentation notes
Dockerfile               Multi-stage container image
compose.yaml             Local container, health check and persistent volume
DESIGN.md                Visual identity and token ownership
UX-CONTRACT.md           Interaction and state contracts
```

## Private deployment

Presentation mode deliberately provides shared demo accounts, including admin access. Set **DEMO_MODE=false** before using private data. Provision a real instructor with `ADMIN_EMAIL`, `ADMIN_NAME` and `ADMIN_PASSWORD` (minimum 12 characters); the account is created only when the email does not already exist. Registered users always receive the student role.

Serve over HTTPS and set `COOKIE_SECURE=true` for HTTPS deployments. Keep secrets in your environment or an ignored `.env` file. The Compose port is bound to localhost; use an HTTPS reverse proxy for remote access. The API rejects cross-origin writes, uses parameterized queries, hashes passwords with scrypt, rate-limits sign-in, and stores sessions in HttpOnly SameSite cookies.

SQLite is a good fit for a single-container classroom/demo application. Multi-replica operation would need a shared database and operational hardening. This project does not include password reset email, email verification, proctoring or high-stakes examination controls.

## Technical references

- [Vite guide](https://vite.dev/guide/)
- [Node.js SQLite documentation](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html)

The final dashboard reference in `docs/presentation-concept.png` was created using the built-in image generation tool; the live interface is implemented in React and CSS. Its prompt is recorded in `docs/DESIGN-PROMPT.md`.

## Supabase leaderboard and live updates

The dedicated [Quizroom Supabase project](https://supabase.com/dashboard/project/makvifrmwaarncudvmtr) stores completed student scores. The local SQLite database still owns accounts, quizzes, answer reviews and a durable upload queue.

- The server sends only a display name, opaque installation/user identifiers, score, attempt identifier and completion time. No email, password, question content or answers leave the app.
- `quizroom_scores` stores immutable attempts. A composite primary key makes retries safe. `quizroom_leaderboard` calculates average/best scores and completed counts.
- Row-level security and grants restrict both tables and the view to the server. The deployed `leaderboard` Edge Function verifies a dedicated app token before allowing reads or writes. Its source stores a SHA-256 verifier; the credential stays in the ignored `.env` file. Supabase's database secret stays inside its Edge Function environment.
- Configure `SUPABASE_LEADERBOARD_URL` and `QUIZROOM_SYNC_TOKEN` on the backend only. Compose reads them from `.env`; do not use `VITE_` names or put the token in the browser.
- An authenticated server-sent events feed updates open leaderboard screens after submission, with a five-second cloud refresh to pick up changes from other app processes. It reconnects automatically and shows its connection state.
- Failed uploads stay queued in SQLite and retry every five seconds and after restart. The UI shows pending scores and cloud connection problems. Existing completed attempts are backfilled automatically.
- Separate SQLite databases have distinct persisted installation IDs; they represent separate account sets. Preserve the data volume when rebuilding to preserve identity and retry history.

Schema: `supabase/schema.sql`. Edge Function source and verifier: `supabase/functions/leaderboard/`. Keep the `.env` token and deployed verifier in sync when rotating the app credential. The project was quoted at $0/month on creation; future usage remains subject to Supabase's plan limits.
