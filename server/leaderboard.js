import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
export function createLeaderboard(
  db,
  {
    url = process.env.SUPABASE_LEADERBOARD_URL,
    token = process.env.QUIZROOM_SYNC_TOKEN,
  } = {},
) {
  if (Boolean(url) !== Boolean(token))
    throw new Error("Set both Supabase leaderboard URL and sync token.");
  db.exec(
    "CREATE TABLE IF NOT EXISTS app_settings(key TEXT PRIMARY KEY,value TEXT NOT NULL); CREATE TABLE IF NOT EXISTS leaderboard_synced(attempt_id INTEGER PRIMARY KEY REFERENCES attempts(id));",
  );
  db.prepare("INSERT OR IGNORE INTO app_settings VALUES(?,?)").run(
    "installation_id",
    randomUUID(),
  );
  const installation = db
    .prepare("SELECT value FROM app_settings WHERE key=?")
    .get("installation_id").value;
  const events = new EventEmitter();
  events.setMaxListeners(1000);
  let working = null,
    timer = null,
    lastCloud = null,
    status = url ? "connecting" : "local",
    updatedAt = null;
  const displayName = (name) =>
    name
      .trim()
      .split(/\s+/)
      .map((p, i) => (i === 0 ? p : p[0] + "."))
      .join(" ");
  function local() {
    return db
      .prepare(
        "SELECT u.id,u.name,COUNT(*) completed,ROUND(AVG(a.score)) average,MAX(a.score) best FROM users u JOIN attempts a ON a.user_id=u.id WHERE a.completed_at IS NOT NULL AND u.role='student' GROUP BY u.id ORDER BY average DESC,completed DESC,u.id LIMIT 100",
      )
      .all()
      .map((u) => ({
        ...u,
        id: installation + ":" + u.id,
        name: displayName(u.name),
      }));
  }
  async function cloud(method = "GET", scores) {
    const r = await fetch(url, {
      method,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      ...(scores ? { body: JSON.stringify({ scores }) } : {}),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error("Supabase leaderboard unavailable");
    return r.json();
  }
  function view(userId) {
    const entries = (lastCloud || local()).map((e, i) => ({
      ...e,
      rank: i + 1,
      isYou: e.id === installation + ":" + userId,
    }));
    return {
      entries,
      source: url ? "supabase" : "sqlite",
      status,
      updatedAt,
      pending: db
        .prepare(
          "SELECT COUNT(*) n FROM attempts a JOIN users u ON u.id=a.user_id LEFT JOIN leaderboard_synced s ON s.attempt_id=a.id WHERE a.completed_at IS NOT NULL AND u.role='student' AND s.attempt_id IS NULL",
        )
        .get().n,
    };
  }
  async function sync() {
    if (working) return working;
    working = (async () => {
      if (url) {
        try {
          const rows = db
            .prepare(
              "SELECT a.id attempt_id,a.user_id,a.score,a.completed_at,u.name FROM attempts a JOIN users u ON u.id=a.user_id LEFT JOIN leaderboard_synced s ON s.attempt_id=a.id WHERE a.completed_at IS NOT NULL AND u.role='student' AND s.attempt_id IS NULL ORDER BY a.id LIMIT 100",
            )
            .all();
          if (rows.length) {
            await cloud(
              "POST",
              rows.map((r) => ({
                installation_id: installation,
                attempt_id: r.attempt_id,
                user_id: r.user_id,
                display_name: displayName(r.name),
                score: r.score,
                completed_at: new Date(r.completed_at).toISOString(),
              })),
            );
            const mark = db.prepare(
              "INSERT OR IGNORE INTO leaderboard_synced VALUES(?)",
            );
            for (const r of rows) mark.run(r.attempt_id);
          }
          lastCloud = (await cloud()).entries;
          status = "live";
          updatedAt = Date.now();
        } catch {
          status = "reconnecting";
        }
      } else {
        status = "local";
        updatedAt = Date.now();
      }
      events.emit("change");
    })().finally(() => {
      working = null;
    });
    return working;
  }
  return {
    sync,
    view,
    subscribe(fn) {
      events.on("change", fn);
      return () => events.off("change", fn);
    },
    changed() {
      void sync();
    },
    start() {
      void sync();
      timer = setInterval(() => void sync(), 5000);
      timer.unref();
    },
    stop() {
      clearInterval(timer);
      events.emit("shutdown");
    },
    onStop(fn) {
      events.once("shutdown", fn);
      return () => events.off("shutdown", fn);
    },
  };
}
