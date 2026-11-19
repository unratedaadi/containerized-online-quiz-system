# Setup guide

Quizroom is a React and Node.js quiz application with a local SQLite database and an optional Supabase leaderboard connection.

## Requirements

Choose one way to run the application:

- **Docker:** Docker Desktop with Docker Compose.
- **Local Node.js:** Node.js 24 or newer and npm.

Download or clone this repository, then open a terminal in the project folder.

## Configure the environment

Copy the example configuration:

```sh
cp .env.example .env
```

The default settings enable shared demo accounts. They are suitable for demonstrations. For private use, set `DEMO_MODE=false` and configure an instructor account:

```dotenv
DEMO_MODE=false
ADMIN_NAME=Your Name
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-unique-password
```

Use a password with at least 12 characters. The instructor is created at startup only if that email does not already exist. Never commit the real `.env` file.

## Run with Docker

```sh
docker compose up --build -d
```

Open [Quizroom](http://localhost:9180).

```sh
docker compose logs -f
# Stop the application while preserving data:
docker compose down
```

The `quizroom-data` Docker volume preserves accounts, quizzes, and results. Removing that volume deletes its data. The default port is available only on the local computer.

## Run with Node.js

```sh
npm ci
npm run dev
```

Open [the development app](http://localhost:5173). The backend runs on port 3001.

For a production build:

```sh
npm run build
npm start
```

Open [the production app](http://localhost:3001). Local data is stored in `data/quizroom.sqlite` unless `DB_PATH` is changed.

## Optional Supabase leaderboard

The application works without cloud configuration and uses a local leaderboard. To use an existing, provisioned Quizroom Supabase backend, add its matching values to `.env`:

```dotenv
SUPABASE_LEADERBOARD_URL=https://your-project.supabase.co/functions/v1/leaderboard
QUIZROOM_SYNC_TOKEN=your-private-app-token
```

Both values must be set together. Restart the backend after changing them; for Docker, run `docker compose up -d` to apply environment changes.

A new Supabase backend also needs the database schema in `supabase/schema.sql`, the `leaderboard` Edge Function in `supabase/functions/leaderboard/`, and its server credentials. The function's token verifier must match the configured app token. Setting the two variables alone does not provision this backend. See the Supabase section in [README.md](README.md) for architecture and credential details.

Keep cloud credentials on the backend. Do not use `VITE_` environment variables for secrets or publish an existing private token. Accounts, quiz content, and answer reviews remain in SQLite; completed student scores are synchronized to the cloud leaderboard.

## Verify the installation

```sh
npm test
npm run build
npm run format:check
```

Optional browser checks:

```sh
npm run test:e2e
```

Browser tests use Google Chrome by default. See [README.md](README.md) for the Chromium alternative.

## Prepare for GitHub

Before pushing, ensure `.gitignore` excludes `.env`, `node_modules/`, `dist/`, local database files, and test output. Keep `.env.example` with placeholders only. Review staged files to ensure no passwords, tokens, or student data are included.

If this folder is not already a Git repository:

```sh
git init
git branch -M main
```

After creating an empty repository on GitHub, replace the example URL below with its actual URL:

```sh
git add .
git diff --cached --stat
git diff --cached
# Commit only after reviewing the staged contents:
git commit -m "Add Quizroom application and documentation"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

For an existing repository, use its current branch and remote instead of initializing it again.

## Private deployment

Disable demo mode, use HTTPS, set `COOKIE_SECURE=true`, and place the application behind an HTTPS reverse proxy. Preserve and back up the SQLite database or Docker volume. The current SQLite setup is intended for a single application instance.
