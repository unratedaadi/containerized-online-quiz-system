# Quizroom implementation

A presentation-ready containerized quiz platform for students and instructors.

The chosen approach is a React/Vite client, Express API and SQLite database in a persistent Docker volume. A single same-origin application avoids deployment complexity. PostgreSQL would add a separate service without a current concurrency requirement; a browser-only mock would not support trustworthy scoring or accounts.

## Scope

Student and admin authentication, demo entry, six seeded quizzes, searchable/filterable catalog, server-timed attempts, answer autosave, resume, automatic grading, explanations, result history, aggregate leaderboard, admin quiz creation/edit/archive, responsive dashboard, empty/error/loading states, accessible dialogs, Docker and project documentation.

## Domain decisions

- New accounts are students. Admin access is enforced on the server.
- Demo accounts are explicitly opt-in through DEMO_MODE=true; the local example enables them. Disable demo entry for private deployment.
- Correct answers are sent only after final submission. A question snapshot freezes an attempt against later admin edits.
- A server timestamp owns quiz expiry. Late submissions grade the last saved answers. Submission is idempotent.
- Archived quizzes disappear from the catalog; existing results remain available.
- Leaderboard displays a presentation name disclosed at registration (user's first name and last initial) and aggregate scores only; no emails.
- No artificial historical activity or fabricated leaderboard students. Dashboard statistics come from completed attempts.

## Delivery checks

API integration tests cover authentication, permissions, hidden answers, scoring, expiry, ownership, CRUD and idempotency. Browser tests cover catalog, complete quiz, result review, resume and admin authoring. Production Docker image is built and health checked.
