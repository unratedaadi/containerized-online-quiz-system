# User guide

Follow [SETUP.md](SETUP.md) to start Quizroom.

## Open the application

- Docker: [localhost:9180](http://localhost:9180).
- Local development: [localhost:5173](http://localhost:5173).
- Local production build: [localhost:3001](http://localhost:3001).

With demo mode enabled, select **Try student demo** or **Try admin demo** on the sign-in screen. Demo accounts are shared, so use them for demonstrations only.

For private use, register a student account or sign in with the instructor credentials configured during setup. New registrations receive the student role.

## Take a quiz

1. Open **Explore quizzes**.
2. Search by title or description, or filter by topic and difficulty.
3. Start a quiz and answer its questions before the timer expires.
4. Use the question navigator to move between questions.
5. Submit your attempt and review the score, explanations, and answers.

Answers are saved while you work. If you leave an unfinished quiz, resume it from Overview. The server controls the deadline; leaving the page does not pause the timer. Expired attempts are submitted automatically.

## Review your progress

Overview shows completed quizzes, average and best scores, study time, a weekly learning goal, and recent activity. Open **My results** to review completed attempts and export results as CSV.

## View the leaderboard

The leaderboard ranks students by average score and completed quiz count.

- Without cloud configuration, rankings come from the local SQLite database.
- With Supabase configured, completed student scores synchronize to the shared cloud leaderboard.
- Open leaderboard screens receive updates automatically. The backend checks for cloud changes every five seconds.
- If cloud access fails, scores remain queued locally and retry automatically, including after a restart. Check the displayed connection status and pending-score indicator.

Cloud synchronization sends display names, opaque installation and user identifiers, scores, attempt identifiers, and completion times. It does not send email addresses, passwords, questions, or answers.

## Manage quizzes as an instructor

1. Sign in as an admin or choose **Try admin demo** when demo mode is enabled.
2. Open **Manage quizzes**.
3. Create a quiz with its topic, difficulty, duration, questions, and correct answers.
4. Save it and check that it appears in the quiz library.
5. Use the management tools to edit or archive quizzes.

Each quiz supports up to 30 questions with four options per question. Sign out through the avatar menu when finished.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| The page will not open | Confirm the application is running and use the URL for your chosen setup. For Docker, inspect `docker compose logs -f`. |
| Demo buttons are unavailable | Demo access requires `DEMO_MODE=true`; restart the backend after changing configuration. |
| Instructor login fails | Confirm the configured email and password. Startup provisioning does not overwrite an existing account. |
| Leaderboard shows local mode | Set both cloud environment variables if you intend to use Supabase, then restart or recreate the backend container. |
| Cloud status shows reconnecting | Check network access and the matching endpoint/token configuration. Queued scores retry automatically. |
| Data appears missing | Check that the same SQLite file or Docker data volume is being used. |

This project does not include password reset email, email verification, or proctoring. See [README.md](README.md) for more details.
