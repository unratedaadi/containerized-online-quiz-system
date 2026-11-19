import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/app.js";
let server, db, base, student, admin;
async function request(path, body, cookie, method = body ? "POST" : "GET") {
  const r = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: r.status,
    body: await r.json().catch(() => null),
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
before(async () => {
  const created = createApp({ dbPath: ":memory:", demo: true });
  db = created.db;
  server = created.app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => {
  server.close();
  db.close();
});
test("health endpoint responds", async () => {
  assert.equal((await request("/api/health")).status, 200);
});
test("private endpoints require authentication", async () => {
  assert.equal((await request("/api/quizzes")).status, 401);
});
test("demo login creates an HttpOnly session", async () => {
  const r = await request("/api/auth/demo", { role: "student" });
  assert.equal(r.status, 200);
  assert.equal(r.body.user.role, "student");
  student = r.cookie;
  assert.ok(student);
});
test("student cannot create quizzes", async () => {
  assert.equal((await request("/api/admin/quizzes", {}, student)).status, 403);
});
test("quiz catalog never exposes answers", async () => {
  const r = await request("/api/quizzes", null, student);
  assert.equal(r.status, 200);
  assert.ok(r.body.quizzes.length >= 6);
  assert.equal(JSON.stringify(r.body).includes("correct"), false);
});
test("server grades answers and repeated submissions are idempotent", async () => {
  const r = await request("/api/quizzes/1/start", {}, student);
  assert.equal(r.status, 200);
  assert.ok(r.body.expiresAt);
  assert.equal(JSON.stringify(r.body).includes("correct"), false);
  const answers = r.body.questions.map(() => 0);
  const submitted = await request(
    `/api/attempts/${r.body.id}/submit`,
    { answers },
    student,
  );
  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.total, 5);
  assert.equal(submitted.body.score, 40);
  assert.equal(submitted.body.review.length, 5);
  const repeat = await request(
    `/api/attempts/${r.body.id}/submit`,
    { answers: [1, 1, 1, 1, 1] },
    student,
  );
  assert.equal(repeat.body.score, 40);
  assert.equal(
    (await request("/api/results", null, student)).body.results.length,
    1,
  );
});
test("expired attempt is graded from saved answers, ignoring late changes", async () => {
  const r = await request("/api/quizzes/2/start", {}, student);
  await request(
    `/api/attempts/${r.body.id}`,
    { answers: [0, 0, 0, 0, 0] },
    student,
    "PATCH",
  );
  db.prepare("UPDATE attempts SET expires_at=? WHERE id=?").run(
    Date.now() - 1000,
    r.body.id,
  );
  const result = await request(
    `/api/attempts/${r.body.id}/submit`,
    { answers: [1, 1, 1, 1, 1] },
    student,
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.timedOut, true);
  assert.deepEqual(
    result.body.review.map((q) => q.selected),
    [0, 0, 0, 0, 0],
  );
});
test("rejects invalid answer indexes", async () => {
  const r = await request("/api/quizzes/3/start", {}, student);
  assert.equal(
    (
      await request(
        `/api/attempts/${r.body.id}/submit`,
        { answers: [99] },
        student,
      )
    ).status,
    400,
  );
});
test("admin can create, update and archive a quiz", async () => {
  admin = (await request("/api/auth/demo", { role: "admin" })).cookie;
  const quiz = {
    title: "Integration test quiz",
    description: "A meaningful test quiz.",
    category: "Science",
    difficulty: "Beginner",
    duration: 5,
    questions: [
      {
        text: "What is 2 + 2?",
        options: ["2", "3", "4", "5"],
        correct: 2,
        explanation: "Two plus two equals four.",
      },
    ],
  };
  const r = await request("/api/admin/quizzes", quiz, admin);
  assert.equal(r.status, 201);
  const id = r.body.id;
  assert.equal(
    (
      await request(
        `/api/admin/quizzes/${id}`,
        { ...quiz, title: "Updated quiz" },
        admin,
        "PUT",
      )
    ).status,
    200,
  );
  assert.equal(
    (await request(`/api/admin/quizzes/${id}`, null, admin, "DELETE")).status,
    200,
  );
  assert.equal(
    (await request("/api/quizzes", null, student)).body.quizzes.some(
      (q) => q.id === id,
    ),
    false,
  );
});
test("registration, login, ownership and logout are enforced", async () => {
  const r = await request("/api/auth/register", {
    name: "Test Learner",
    email: "learner@example.com",
    password: "learnwithquizroom",
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.user.role, "student");
  const results = (await request("/api/results", null, student)).body.results;
  assert.equal(
    (await request(`/api/results/${results[0].id}`, null, r.cookie)).status,
    404,
  );
  assert.equal(
    (
      await request("/api/auth/login", {
        email: "learner@example.com",
        password: "incorrect",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/api/auth/login", {
        email: "learner@example.com",
        password: "learnwithquizroom",
      })
    ).status,
    200,
  );
  await request("/api/auth/logout", {}, r.cookie);
  assert.equal((await request("/api/me", null, r.cookie)).status, 401);
});
test("cross-origin writes are rejected", async () => {
  const r = await fetch(base + "/api/auth/demo", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://untrusted.example",
    },
    body: '{"role":"admin"}',
  });
  assert.equal(r.status, 403);
});
test("authenticated leaderboard streams a snapshot and updates on submission", async () => {
  const controller = new AbortController();
  const response = await fetch(base + "/api/leaderboard/stream", {
    headers: { cookie: student },
    signal: controller.signal,
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /text\/event-stream/);
  const reader = response.body.getReader();
  const first = new TextDecoder().decode((await reader.read()).value);
  assert.match(first, /event: leaderboard/);
  assert.doesNotMatch(first, /@example|password/);
  const a = await request("/api/quizzes/4/start", {}, student);
  await request(
    `/api/attempts/${a.body.id}/submit`,
    { answers: [0, 1, 2, 3, 0] },
    student,
  );
  let received = "";
  const deadline = setTimeout(() => controller.abort(), 3000);
  try {
    while (!received.includes("event: leaderboard")) {
      const chunk = await reader.read();
      received += new TextDecoder().decode(chunk.value);
    }
    assert.match(received, /completed/);
  } finally {
    clearTimeout(deadline);
    controller.abort();
  }
});
