import { createApp, provisionAdmin } from "./app.js";
const { app, db, leaderboard } = createApp();
await provisionAdmin(db);
leaderboard.start();
const port = Number(process.env.PORT || 3001);
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`Quizroom is ready at http://localhost:${port}`),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    leaderboard.stop();
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
