import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../server/app.js";
test("Supabase sync retries failures, backfills scores and never duplicates attempts", async () => {
  const scores = new Map();
  let available = false;
  const cloud = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    assert.equal(req.headers.authorization, "Bearer test-only-token");
    if (!available) {
      res.writeHead(503).end("{}");
      return;
    }
    if (req.method === "POST") {
      let raw = "";
      for await (const chunk of req) raw += chunk;
      for (const r of JSON.parse(raw).scores)
        scores.set(r.installation_id + ":" + r.attempt_id, r);
      res.end('{"saved":1}');
    } else {
      const values = [...scores.values()];
      res.end(
        JSON.stringify({
          entries: values.length
            ? [
                {
                  id: values[0].installation_id + ":1",
                  name: values[0].display_name,
                  completed: values.length,
                  average: 80,
                  best: 80,
                },
              ]
            : [],
        }),
      );
    }
  });
  await new Promise((resolve) => cloud.listen(0, "127.0.0.1", resolve));
  const { db, leaderboard } = createApp({
    dbPath: ":memory:",
    demo: true,
    leaderboardOptions: {
      url: `http://127.0.0.1:${cloud.address().port}`,
      token: "test-only-token",
    },
  });
  try {
    db.prepare("INSERT INTO users(id,name,email,password) VALUES(1,?,?,?)").run(
      "Test Learner",
      "private@example.com",
      "disabled",
    );
    db.prepare(
      "INSERT INTO attempts(user_id,quiz_id,title,snapshot,answers,started_at,expires_at,completed_at,score) VALUES(1,1,?,?,?,?,?,?,?)",
    ).run("Test", "[]", "[]", 1000, 2000, 2000, 80);
    await leaderboard.sync();
    assert.equal(leaderboard.view(1).pending, 1);
    assert.equal(leaderboard.view(1).status, "reconnecting");
    available = true;
    await leaderboard.sync();
    assert.equal(leaderboard.view(1).pending, 0);
    assert.equal(leaderboard.view(1).source, "supabase");
    assert.equal(leaderboard.view(1).status, "live");
    assert.equal(leaderboard.view(1).entries[0].isYou, true);
    await leaderboard.sync();
    assert.equal(scores.size, 1);
    assert.equal([...scores.values()][0].display_name, "Test L.");
    assert.equal(
      JSON.stringify([...scores.values()]).includes("private@example.com"),
      false,
    );
  } finally {
    leaderboard.stop();
    db.close();
    await new Promise((resolve) => cloud.close(resolve));
  }
});
