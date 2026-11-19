import express from "express";
import { createLeaderboard } from "./leaderboard.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { seedQuizzes } from "./seed.js";
const scrypt = promisify(scryptCallback);
const safeUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
});
const fail = (status, message) => Object.assign(new Error(message), { status });
async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + (await scrypt(password, salt, 64)).toString("hex");
}
async function verifyPassword(password, hash) {
  const [salt, key] = hash.split(":");
  return timingSafeEqual(
    Buffer.from(key, "hex"),
    await scrypt(password, salt, 64),
  );
}
export function createApp({
  dbPath = process.env.DB_PATH || "data/quizroom.sqlite",
  demo = process.env.DEMO_MODE === "true",
  secureCookies = process.env.COOKIE_SECURE === "true",
  leaderboardOptions = {},
} = {}) {
  if (dbPath !== ":memory:")
    mkdirSync(dirname(resolve(dbPath)), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'student');
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER REFERENCES users(id),expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS quizzes(id INTEGER PRIMARY KEY,title TEXT NOT NULL,description TEXT NOT NULL,category TEXT NOT NULL,difficulty TEXT NOT NULL,duration INTEGER NOT NULL,theme TEXT NOT NULL,icon TEXT NOT NULL,questions TEXT NOT NULL,archived INTEGER DEFAULT 0);
 CREATE TABLE IF NOT EXISTS attempts(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),quiz_id INTEGER NOT NULL REFERENCES quizzes(id),title TEXT NOT NULL,snapshot TEXT NOT NULL,answers TEXT NOT NULL,started_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,completed_at INTEGER,score INTEGER,timed_out INTEGER DEFAULT 0);
 CREATE INDEX IF NOT EXISTS attempts_user ON attempts(user_id,completed_at);`);
  if (!db.prepare("SELECT id FROM quizzes LIMIT 1").get()) {
    const insert = db.prepare(
      "INSERT INTO quizzes(title,description,category,difficulty,duration,theme,icon,questions) VALUES(?,?,?,?,?,?,?,?)",
    );
    for (const q of seedQuizzes)
      insert.run(
        q.title,
        q.description,
        q.category,
        q.difficulty,
        q.duration,
        q.theme,
        q.icon,
        JSON.stringify(q.questions),
      );
  }
  const leaderboard = createLeaderboard(db, leaderboardOptions);
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "script-src": ["'self'"],
          "style-src": ["'self'", "'unsafe-inline'"],
          "img-src": ["'self'", "data:"],
          "upgrade-insecure-requests": null,
        },
      },
      strictTransportSecurity: secureCookies ? undefined : false,
    }),
  );
  app.use(express.json({ limit: "200kb" }));
  app.use("/api", (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      if (origin) {
        try {
          const allowedOrigin = process.env.APP_ORIGIN;
          if (
            new URL(origin).host !== req.get("host") &&
            origin !== allowedOrigin
          )
            return next(fail(403, "This request is from an untrusted origin."));
        } catch {
          return next(fail(403, "Invalid request origin."));
        }
      }
      if (req.method !== "DELETE" && !req.is("application/json"))
        return next(fail(415, "Send JSON data."));
    }
    next();
  });
  const authLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many sign-in attempts. Try again in 15 minutes." },
  });
  function session(req, res, user) {
    db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(Date.now());
    const token = randomBytes(32).toString("hex");
    db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
      token,
      user.id,
      Date.now() + 7 * 86400000,
    );
    res.cookie("quizroom_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookies,
      maxAge: 7 * 86400000,
      path: "/",
    });
  }
  function authenticate(req, res, next) {
    const token = req.headers.cookie
      ?.split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("quizroom_session="))
      ?.slice(17);
    const u = token
      ? db
          .prepare(
            "SELECT u.* FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?",
          )
          .get(token, Date.now())
      : null;
    if (!u || (!demo && u.password === "disabled"))
      return next(fail(401, "Your session has ended. Please sign in."));
    req.user = u;
    req.token = token;
    next();
  }
  function admin(req, res, next) {
    if (req.user.role !== "admin")
      return next(fail(403, "Admin access is required."));
    next();
  }
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.get("/api/config", (req, res) => res.json({ demo }));
  app.post("/api/auth/demo", authLimit, (req, res, next) => {
    if (!demo) return next(fail(404, "Demo access is disabled."));
    const role = req.body.role === "admin" ? "admin" : "student";
    const email =
      role === "admin" ? "admin@quizroom.demo" : "aaditya@quizroom.demo";
    let u = db.prepare("SELECT * FROM users WHERE email=?").get(email);
    if (!u) {
      const id = db
        .prepare("INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)")
        .run(
          role === "admin" ? "Alex Morgan" : "Aaditya Jain",
          email,
          "disabled",
          role,
        ).lastInsertRowid;
      u = db.prepare("SELECT * FROM users WHERE id=?").get(id);
    }
    session(req, res, u);
    res.json({ user: safeUser(u) });
  });
  app.post("/api/auth/register", authLimit, async (req, res) => {
    const { name, email, password } = req.body;
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80
    )
      throw fail(400, "Enter a name between 2 and 80 characters.");
    if (
      typeof email !== "string" ||
      email.length > 254 ||
      !/^\S+@\S+\.\S+$/.test(email)
    )
      throw fail(400, "Enter a valid email address.");
    if (
      typeof password !== "string" ||
      password.length < 8 ||
      password.length > 128
    )
      throw fail(400, "Use a password between 8 and 128 characters.");
    const normalized = email.trim().toLowerCase();
    if (db.prepare("SELECT id FROM users WHERE email=?").get(normalized))
      throw fail(409, "An account with this email already exists.");
    const hash = await hashPassword(password);
    let id;
    try {
      id = db
        .prepare("INSERT INTO users(name,email,password) VALUES(?,?,?)")
        .run(name.trim(), normalized, hash).lastInsertRowid;
    } catch {
      throw fail(409, "An account with this email already exists.");
    }
    const u = db.prepare("SELECT * FROM users WHERE id=?").get(id);
    session(req, res, u);
    res.status(201).json({ user: safeUser(u) });
  });
  app.post("/api/auth/login", authLimit, async (req, res) => {
    const { email, password } = req.body;
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      password.length > 128
    )
      throw fail(401, "Email or password is incorrect.");
    const u = db
      .prepare("SELECT * FROM users WHERE email=?")
      .get(email.trim().toLowerCase());
    if (
      !u ||
      u.password === "disabled" ||
      !(await verifyPassword(password, u.password))
    )
      throw fail(401, "Email or password is incorrect.");
    session(req, res, u);
    res.json({ user: safeUser(u) });
  });
  app.post("/api/auth/logout", authenticate, (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(req.token);
    res.clearCookie("quizroom_session", { path: "/" });
    res.json({ ok: true });
  });
  app.use("/api", authenticate);
  app.get("/api/me", (req, res) => res.json({ user: safeUser(req.user) }));
  function catalog(q) {
    const { questions, ...rest } = q;
    return { ...rest, questionCount: JSON.parse(questions).length };
  }
  app.get("/api/quizzes", (req, res) =>
    res.json({
      quizzes: db
        .prepare("SELECT * FROM quizzes WHERE archived=0 ORDER BY id LIMIT 100")
        .all()
        .map(catalog),
    }),
  );
  function attemptView(a) {
    const snapshot = JSON.parse(a.snapshot);
    return {
      id: a.id,
      quizId: a.quiz_id,
      title: a.title,
      startedAt: a.started_at,
      expiresAt: a.expires_at,
      answers: JSON.parse(a.answers),
      completed: !!a.completed_at,
      questions: snapshot.map(({ correct, explanation, ...rest }) => rest),
    };
  }
  function resultView(a) {
    const questions = JSON.parse(a.snapshot),
      answers = JSON.parse(a.answers);
    return {
      id: a.id,
      title: a.title,
      quizId: a.quiz_id,
      score: a.score,
      total: questions.length,
      correct: questions.filter((q, i) => answers[i] === q.correct).length,
      completedAt: a.completed_at,
      duration: Math.max(
        0,
        Math.round(
          (Math.min(a.completed_at, a.expires_at) - a.started_at) / 1000,
        ),
      ),
      timedOut: !!a.timed_out,
      review: questions.map((q, i) => ({ ...q, selected: answers[i] ?? null })),
    };
  }
  function ownAttempt(id, user) {
    const a = db
      .prepare("SELECT * FROM attempts WHERE id=? AND user_id=?")
      .get(id, user);
    if (!a) throw fail(404, "This attempt could not be found.");
    return a;
  }
  app.post("/api/quizzes/:id/start", (req, res) => {
    const quiz = db
      .prepare("SELECT * FROM quizzes WHERE id=? AND archived=0")
      .get(req.params.id);
    if (!quiz) throw fail(404, "This quiz is no longer available.");
    let a = db
      .prepare(
        "SELECT * FROM attempts WHERE user_id=? AND quiz_id=? AND completed_at IS NULL ORDER BY id DESC LIMIT 1",
      )
      .get(req.user.id, quiz.id);
    if (!a) {
      const now = Date.now();
      const id = db
        .prepare(
          "INSERT INTO attempts(user_id,quiz_id,title,snapshot,answers,started_at,expires_at) VALUES(?,?,?,?,?,?,?)",
        )
        .run(
          req.user.id,
          quiz.id,
          quiz.title,
          quiz.questions,
          JSON.stringify(JSON.parse(quiz.questions).map(() => null)),
          now,
          now + quiz.duration * 60000,
        ).lastInsertRowid;
      a = ownAttempt(id, req.user.id);
    }
    res.json(attemptView(a));
  });
  app.get("/api/attempts/active", (req, res) =>
    res.json({
      attempts: db
        .prepare(
          "SELECT * FROM attempts WHERE user_id=? AND completed_at IS NULL ORDER BY started_at DESC LIMIT 100",
        )
        .all(req.user.id)
        .map(attemptView),
    }),
  );
  app.get("/api/attempts/:id", (req, res) =>
    res.json(attemptView(ownAttempt(req.params.id, req.user.id))),
  );
  function validAnswers(answers, a) {
    const qs = JSON.parse(a.snapshot);
    if (
      !Array.isArray(answers) ||
      answers.length > qs.length ||
      answers.some(
        (v, i) =>
          v !== null &&
          (!Number.isInteger(v) || v < 0 || v >= qs[i].options.length),
      )
    )
      throw fail(400, "Answers must be valid option indexes.");
    return qs.map((_, i) => answers[i] ?? null);
  }
  app.patch("/api/attempts/:id", (req, res) => {
    const a = ownAttempt(req.params.id, req.user.id);
    if (a.completed_at)
      throw fail(409, "This quiz has already been submitted.");
    if (Date.now() > a.expires_at)
      throw fail(409, "Time is up. Submit your saved answers.");
    const answers = validAnswers(req.body.answers, a);
    db.prepare("UPDATE attempts SET answers=? WHERE id=?").run(
      JSON.stringify(answers),
      a.id,
    );
    res.json({ saved: true });
  });
  app.post("/api/attempts/:id/submit", (req, res) => {
    let a = ownAttempt(req.params.id, req.user.id);
    if (!a.completed_at) {
      const now = Date.now(),
        expired = now > a.expires_at;
      const answers = expired
        ? JSON.parse(a.answers)
        : validAnswers(req.body.answers, a);
      const qs = JSON.parse(a.snapshot),
        score = Math.round(
          (100 * qs.filter((q, i) => q.correct === answers[i]).length) /
            qs.length,
        );
      db.prepare(
        "UPDATE attempts SET answers=?,completed_at=?,score=?,timed_out=? WHERE id=? AND completed_at IS NULL",
      ).run(JSON.stringify(answers), now, score, expired ? 1 : 0, a.id);
      a = ownAttempt(a.id, req.user.id);
    }
    leaderboard.changed();
    res.json(resultView(a));
  });
  app.get("/api/results", (req, res) =>
    res.json({
      results: db
        .prepare(
          "SELECT * FROM attempts WHERE user_id=? AND completed_at IS NOT NULL ORDER BY completed_at DESC LIMIT 100",
        )
        .all(req.user.id)
        .map((a) => {
          const { review, ...rest } = resultView(a);
          return rest;
        }),
    }),
  );
  app.get("/api/results/:id", (req, res) => {
    const a = ownAttempt(req.params.id, req.user.id);
    if (!a.completed_at)
      throw fail(404, "This quiz has not been submitted yet.");
    res.json(resultView(a));
  });
  app.get("/api/stats", (req, res) => {
    const a = db
      .prepare(
        "SELECT COUNT(*) completed,AVG(score) average,MAX(score) best,COALESCE(SUM((MIN(completed_at,expires_at)-started_at)/1000),0) seconds FROM attempts WHERE user_id=? AND completed_at IS NOT NULL",
      )
      .get(req.user.id);
    const week = db
      .prepare(
        "SELECT COUNT(*) n FROM attempts WHERE user_id=? AND completed_at>=?",
      )
      .get(req.user.id, Date.now() - 7 * 86400000).n;
    res.json({
      ...a,
      average: a.average === null ? null : Math.round(a.average),
      week,
    });
  });
  app.get("/api/leaderboard", async (req, res) => {
    await leaderboard.sync();
    res.json(leaderboard.view(req.user.id));
  });
  app.get("/api/leaderboard/stream", async (req, res) => {
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    let closed = false;
    const send = () => {
      if (!closed && !res.writableEnded)
        res.write(
          "event: leaderboard\ndata: " +
            JSON.stringify(leaderboard.view(req.user.id)) +
            "\n\n",
        );
    };
    const unsubscribe = leaderboard.subscribe(send),
      unstop = leaderboard.onStop(() => res.end());
    const heartbeat = setInterval(() => {
      const valid = db
        .prepare("SELECT token FROM sessions WHERE token=? AND expires_at>?")
        .get(req.token, Date.now());
      if (!valid) {
        res.write("event: expired\ndata: {}\n\n");
        res.end();
      } else res.write(": heartbeat\n\n");
    }, 15000);
    heartbeat.unref();
    res.on("close", () => {
      closed = true;
      clearInterval(heartbeat);
      unsubscribe();
      unstop();
    });
    await leaderboard.sync();
  });
  app.get("/api/admin/quizzes", admin, (req, res) =>
    res.json({
      quizzes: db
        .prepare(
          "SELECT * FROM quizzes ORDER BY archived ASC,id DESC LIMIT 100",
        )
        .all()
        .map((q) => ({ ...q, questions: JSON.parse(q.questions) })),
    }),
  );
  function quizInput(body) {
    const { title, description, category, difficulty, duration, questions } =
      body;
    if (
      typeof title !== "string" ||
      title.trim().length < 3 ||
      title.length > 100
    )
      throw fail(400, "Use a quiz title between 3 and 100 characters.");
    if (
      typeof description !== "string" ||
      description.trim().length < 10 ||
      description.length > 500
    )
      throw fail(400, "Add a description between 10 and 500 characters.");
    if (
      !["Computer Science", "Science", "General Knowledge"].includes(
        category,
      ) ||
      !["Beginner", "Intermediate", "Advanced"].includes(difficulty)
    )
      throw fail(400, "Choose a valid topic and difficulty.");
    if (!Number.isInteger(duration) || duration < 1 || duration > 120)
      throw fail(400, "Duration must be between 1 and 120 minutes.");
    if (
      !Array.isArray(questions) ||
      questions.length < 1 ||
      questions.length > 30
    )
      throw fail(400, "Add between 1 and 30 questions.");
    for (const q of questions) {
      if (
        typeof q.text !== "string" ||
        q.text.trim().length < 3 ||
        q.text.length > 1000 ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        q.options.some(
          (o) => typeof o !== "string" || !o.trim() || o.length > 300,
        ) ||
        !Number.isInteger(q.correct) ||
        q.correct < 0 ||
        q.correct > 3 ||
        typeof q.explanation !== "string" ||
        q.explanation.length > 1000
      )
        throw fail(
          400,
          "Every question needs text, four options, a correct answer and a valid explanation.",
        );
    }
    const theme =
      category === "Science"
        ? "peach"
        : category === "General Knowledge"
          ? "pink"
          : "blue";
    const icon =
      category === "Science"
        ? "science"
        : category === "General Knowledge"
          ? "globe"
          : "code";
    return [
      title.trim(),
      description.trim(),
      category,
      difficulty,
      duration,
      theme,
      icon,
      JSON.stringify(
        questions.map((q) => ({
          text: q.text.trim(),
          options: q.options.map((s) => s.trim()),
          correct: q.correct,
          explanation: q.explanation.trim(),
        })),
      ),
    ];
  }
  app.post("/api/admin/quizzes", admin, (req, res) => {
    const values = quizInput(req.body);
    if (
      db.prepare("SELECT COUNT(*) n FROM quizzes WHERE archived=0").get().n >=
      100
    )
      throw fail(
        409,
        "Archive a quiz before creating another (100 active quizzes maximum).",
      );
    const id = Number(
      db
        .prepare(
          "INSERT INTO quizzes(title,description,category,difficulty,duration,theme,icon,questions) VALUES(?,?,?,?,?,?,?,?)",
        )
        .run(...values).lastInsertRowid,
    );
    res.status(201).json({ id });
  });
  app.put("/api/admin/quizzes/:id", admin, (req, res) => {
    const values = quizInput(req.body);
    const changed = db
      .prepare(
        "UPDATE quizzes SET title=?,description=?,category=?,difficulty=?,duration=?,theme=?,icon=?,questions=? WHERE id=? AND archived=0",
      )
      .run(...values, req.params.id);
    if (!changed.changes) throw fail(404, "Active quiz not found.");
    res.json({ ok: true });
  });
  app.delete("/api/admin/quizzes/:id", admin, (req, res) => {
    const result = db
      .prepare("UPDATE quizzes SET archived=1 WHERE id=?")
      .run(req.params.id);
    if (!result.changes) throw fail(404, "Quiz not found.");
    res.json({ ok: true });
  });
  app.use("/api", (req, res) =>
    res.status(404).json({ error: "This endpoint could not be found." }),
  );
  app.use(express.static(resolve("dist")));
  app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
  app.use((err, req, res, next) => {
    if (!err.status) console.error(err.message);
    res.status(err.status || 500).json({
      error: err.status
        ? err.message
        : "Something went wrong. Please try again.",
    });
  });
  return { app, db, leaderboard };
}
export async function provisionAdmin(db) {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return;
  if (process.env.ADMIN_PASSWORD.length < 12)
    throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  if (
    !db
      .prepare("SELECT id FROM users WHERE email=?")
      .get(process.env.ADMIN_EMAIL.toLowerCase())
  )
    db.prepare(
      "INSERT INTO users(name,email,password,role) VALUES(?,?,?,?)",
    ).run(
      process.env.ADMIN_NAME || "Quizroom Admin",
      process.env.ADMIN_EMAIL.toLowerCase(),
      await hashPassword(process.env.ADMIN_PASSWORD),
      "admin",
    );
}
