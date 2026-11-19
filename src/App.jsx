import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  useLayoutEffect,
} from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock,
  Code2,
  Compass,
  Database,
  Download,
  FlaskConical,
  Globe2,
  GraduationCap,
  House,
  LayoutGrid,
  ListChecks,
  LoaderCircle,
  LogOut,
  Menu,
  Network,
  Plus,
  Play,
  Puzzle,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Trophy,
  X,
  ChartNoAxesColumnIncreasing,
  CalendarDays,
  Pencil,
  Flag,
  RotateCcw,
  Save,
  TriangleAlert,
} from "lucide-react";
const topics = [
  "All topics",
  "Computer Science",
  "Science",
  "General Knowledge",
];
const icons = {
  code: Code2,
  database: Database,
  network: Network,
  science: FlaskConical,
  globe: Globe2,
  puzzle: Puzzle,
};
const date = (n) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(n);
const initials = (name) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
function route() {
  const raw = window.location.hash.slice(1) || "/";
  const [path, query = ""] = raw.split("?");
  return { path, params: new URLSearchParams(query) };
}
function go(path) {
  window.location.hash = path;
}
async function api(path, body, method = body ? "POST" : "GET") {
  let response;
  try {
    response = await fetch("/api" + path, {
      method,
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error("Cannot connect. Check your connection and try again.");
  }
  const data = await response.json().catch(() => {
    throw new Error(
      "The server is starting or temporarily unavailable. Please try again.",
    );
  });
  if (!response.ok) {
    if (response.status === 401 && !path.startsWith("/auth") && path !== "/me")
      window.dispatchEvent(new Event("session-expired"));
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}
function Button({
  children,
  variant = "primary",
  busy = false,
  className = "",
  ...props
}) {
  return (
    <button
      className={`button ${variant} ${className}`}
      disabled={busy || props.disabled}
      {...props}
    >
      {busy ? <LoaderCircle className="spin" size={17} /> : null}
      {children}
    </button>
  );
}
function ErrorBox({ message }) {
  return message ? (
    <div className="error-box" role="alert">
      <TriangleAlert size={18} />
      <span>{message}</span>
    </div>
  ) : null;
}
function Loading() {
  return (
    <div className="loading" role="status">
      <LoaderCircle className="spin" size={26} />
      <span>Getting your workspace ready…</span>
    </div>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null),
    titleId = useId();
  useEffect(() => {
    const node = ref.current,
      previous = document.activeElement;
    node.showModal();
    return () => {
      node.close();
      previous?.focus?.();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "wide" : ""}`}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
      aria-labelledby={titleId}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function Textarea(props) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(88, el.scrollHeight) + "px";
    }
  }, [props.value]);
  return <textarea {...props} ref={ref} className="resize-none" />;
}
function Field({ label, id, error, children, ...props }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children || (
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
      )}
      {error ? (
        <span id={`${id}-error`} className="field-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}
function Empty({ icon: Icon = BookOpen, title, description, action }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
function Brand() {
  return (
    <a className="brand" href="#/">
      <span className="brand-mark">
        Q<span />
      </span>
      Quizroom<span className="brand-dot">.</span>
    </a>
  );
}
function Art({ large = false }) {
  return (
    <div className={`question-art ${large ? "large" : ""}`} aria-hidden="true">
      <span className="art-ray one" />
      <span className="art-ray two" />
      <span className="question-tile small">?</span>
      <span className="question-tile back">?</span>
      <span className="question-tile front">?</span>
      <span className="art-dot" />
    </div>
  );
}
function Auth({ onLogin, demo }) {
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [values, setValues] = useState({
      name: "",
      email: "",
      password: "",
      confirm: "",
    });
  const update = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setError("");
    if (register && values.password !== values.confirm) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy("auth");
    try {
      const data = await api(
        register ? "/auth/register" : "/auth/login",
        values,
      );
      onLogin(data.user);
      go("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  async function demoLogin(role) {
    setBusy(role);
    setError("");
    try {
      onLogin((await api("/auth/demo", { role })).user);
      go("/");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Brand />
        <div className="auth-story-content">
          <div className="auth-mini">
            <span className="mini-line" />
            YOUR SPACE TO GROW
          </div>
          <h1>
            A little curiosity.
            <br />A lot of possibility.
          </h1>
          <p>
            Make room for what you’ll learn next.
            <br />
            One question, one discovery, one step forward.
          </p>
          <Art large />
          <div className="auth-proof">
            <span>
              <CheckCircle2 size={18} />
              Learn at your pace
            </span>
            <span>
              <ChartNoAxesColumnIncreasing size={18} />
              See your progress
            </span>
            <span>
              <Trophy size={18} />
              Challenge yourself
            </span>
          </div>
        </div>
        <div className="auth-story-footer">Small steps. Real progress.</div>
      </section>
      <main className="auth-main">
        <div className="auth-form-wrap">
          <span className="auth-icon">
            <GraduationCap size={30} />
          </span>
          <h2>
            {register
              ? "Start your learning journey."
              : "Welcome to your next chapter."}
          </h2>
          <p className="muted">
            {register
              ? "Create your free account and make yourself at home."
              : "Sign in to pick up where your curiosity left off."}
          </p>
          <form noValidate onSubmit={submit}>
            <ErrorBox message={error} />
            {register ? (
              <Field
                id="name"
                label="Full name"
                name="name"
                value={values.name}
                onChange={update}
                autoComplete="name"
                required
              />
            ) : null}
            <Field
              id="email"
              label="Email address"
              name="email"
              type="email"
              value={values.email}
              onChange={update}
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            <Field
              id="password"
              label="Password"
              name="password"
              type="password"
              value={values.password}
              onChange={update}
              autoComplete={register ? "new-password" : "current-password"}
              placeholder={
                register ? "At least 8 characters" : "Enter your password"
              }
              required
            />
            {register ? (
              <>
                <p className="field-help">Use between 8 and 128 characters.</p>
                <Field
                  id="confirm"
                  label="Confirm password"
                  name="confirm"
                  type="password"
                  value={values.confirm}
                  onChange={update}
                  autoComplete="new-password"
                />
                <p className="field-help">
                  Your first name and last initial appear on the workspace
                  leaderboard when you complete a quiz.
                </p>
              </>
            ) : null}
            <Button
              type="submit"
              className="full"
              busy={busy === "auth"}
              disabled={!!busy}
            >
              {register ? "Create account" : "Sign in"}
              <ArrowRight size={17} />
            </Button>
          </form>
          <p className="auth-switch">
            {register ? "Already have an account?" : "New to Quizroom?"}{" "}
            <button
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create an account"}
            </button>
          </p>
          {demo ? (
            <div className="demo-box">
              <div className="divider-label">JUST LOOKING AROUND?</div>
              <p>Take the full experience for a spin.</p>
              <div className="demo-actions">
                <Button
                  variant="outline"
                  busy={busy === "student"}
                  disabled={!!busy}
                  onClick={() => demoLogin("student")}
                >
                  Try student demo
                  <ArrowRight size={15} />
                </Button>
                <Button
                  variant="ghost"
                  busy={busy === "admin"}
                  disabled={!!busy}
                  onClick={() => demoLogin("admin")}
                >
                  <ShieldCheck size={16} />
                  Try admin demo
                </Button>
              </div>
              <small>
                Shared demo accounts · sample quizzes · real functionality
              </small>
            </div>
          ) : null}
        </div>
        <footer className="auth-footer">
          <ShieldCheck size={14} />
          Your next great idea starts with a question.
        </footer>
      </main>
    </div>
  );
}
function QuizCard({ quiz, onStart }) {
  const Icon = icons[quiz.icon] || Code2;
  return (
    <article className="quiz-card">
      <div className={`quiz-art ${quiz.theme}`}>
        <Icon size={47} strokeWidth={1.6} />
        <span className="art-circle c1" />
        <span className="art-circle c2" />
      </div>
      <div className="quiz-card-body">
        <div className="topic-label">{quiz.category}</div>
        <h3>{quiz.title}</h3>
        <p className="quiz-description">{quiz.description}</p>
        <span
          className={`badge ${quiz.difficulty === "Beginner" ? "green" : "lilac"}`}
        >
          {quiz.difficulty}
        </span>
        <div className="quiz-meta">
          <span>
            <ListChecks size={15} />
            {quiz.questionCount} questions
          </span>
          <span>
            <Clock size={15} />
            {quiz.duration} min
          </span>
        </div>
        <button className="card-action" onClick={() => onStart(quiz)}>
          Start quiz
          <ArrowRight size={18} />
        </button>
      </div>
    </article>
  );
}
function TopicFilters({ value, onChange }) {
  return (
    <div className="topic-filters" aria-label="Filter by topic">
      {topics.map((t) => (
        <button
          key={t}
          className={value === t ? "selected" : ""}
          aria-pressed={value === t}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
function SearchBox({
  value,
  onChange,
  onSubmit,
  placeholder = "Search quizzes…",
  label = "Search quizzes",
}) {
  const ref = useRef(null);
  return (
    <form
      noValidate
      role="search"
      className="search-box"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
    >
      <Search size={17} />
      <input
        ref={ref}
        aria-label={label}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <button
          aria-label="Clear search"
          type="button"
          onClick={() => {
            onChange("");
            ref.current.focus();
          }}
        >
          <X size={15} />
        </button>
      ) : null}
    </form>
  );
}
function Dashboard({ user, data, onStart }) {
  const [topic, setTopic] = useState("All topics");
  const { stats, quizzes, results, active } = data;
  const filtered = quizzes
    .filter((q) => topic === "All topics" || q.category === topic)
    .slice(0, 3);
  const progress = Math.min(stats.week, 5);
  const hour = new Date().getHours(),
    greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            Good {greeting}, {user.name.split(" ")[0]}{" "}
            <Sun className="sun" size={27} />
          </h1>
          <p>
            A little progress, every day. Let’s put your knowledge to the test.
          </p>
        </div>
        <a href="#/explore" className="button outline">
          <Compass size={17} />
          Browse quizzes
        </a>
      </div>
      <div className="stats-grid">
        {[
          {
            label: "Quizzes completed",
            value: stats.completed,
            icon: CheckCircle2,
            foot: "Every attempt counts",
          },
          {
            label: "Average score",
            value: stats.average === null ? "—" : `${stats.average}%`,
            icon: Star,
            foot: "Across all your quizzes",
          },
          {
            label: "Study time",
            value:
              stats.seconds > 0 && stats.seconds < 60
                ? "<1"
                : Math.round(stats.seconds / 60),
            unit: "min",
            icon: Clock,
            foot: "Time well invested",
          },
          {
            label: "Best score",
            value: stats.best === null ? "—" : `${stats.best}%`,
            icon: Trophy,
            foot: "Your personal best",
          },
        ].map(({ label, value, unit, icon: Icon, foot }) => (
          <div className="stat-card" key={label}>
            <span className="stat-icon">
              <Icon size={21} />
            </span>
            <div>
              <span className="stat-label">{label}</span>
              <div className="stat-value">
                {value}
                <small>{unit}</small>
              </div>
              <span className="stat-foot">{foot}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-columns">
        <div className="main-column">
          <section className="curiosity-panel">
            <div className="curiosity-copy">
              <h2>Make room for your next discovery.</h2>
              <p>
                Find your next challenge and build confidence,
                <br className="desktop-break" /> one quiz at a time.
              </p>
              <a className="button primary" href="#/explore">
                Explore quizzes
                <ArrowRight size={17} />
              </a>
            </div>
            <Art />
          </section>
          <section className="goal-card">
            <div className="section-heading">
              <h2>Your learning goal</h2>
              <span className="tiny-icon">
                <Flag size={17} />
              </span>
            </div>
            <p className="muted">A little consistency goes a long way.</p>
            <div className="goal-progress">
              <div
                className="progress-ring"
                style={{ "--progress": `${progress * 20}%` }}
              >
                <div>
                  <strong>
                    {progress}
                    <small>/5</small>
                  </strong>
                  <span>quizzes</span>
                </div>
              </div>
              <div>
                <strong>
                  {progress === 5 ? "Goal achieved!" : "You’ve got this."}
                </strong>
                <p>
                  {progress === 5
                    ? "Keep your momentum going."
                    : `${5 - progress} more ${5 - progress === 1 ? "quiz" : "quizzes"} to reach your goal.`}
                </p>
                <span className="subtle-label">LAST 7 DAYS</span>
              </div>
            </div>
            <a href="#/explore" className="button mint full">
              {stats.completed ? "Keep learning" : "Start your first quiz"}
              <ArrowRight size={17} />
            </a>
          </section>
          {active.length ? (
            <div className="resume-banner">
              <span className="resume-icon">
                <Play size={21} />
              </span>
              <div>
                <strong>Pick up where you left off</strong>
                <p>{active[0].title}</p>
              </div>
              <Button
                variant="outline"
                onClick={() => go(`/attempt/${active[0].id}`)}
              >
                Resume
                <ArrowRight size={15} />
              </Button>
            </div>
          ) : null}
          <div className="section-heading">
            <h2>Discover your next challenge</h2>
            <a href="#/explore">
              View all
              <ArrowRight size={16} />
            </a>
          </div>
          <TopicFilters value={topic} onChange={setTopic} />
          <div className="quiz-grid dashboard-quizzes">
            {filtered.map((q) => (
              <QuizCard key={q.id} quiz={q} onStart={onStart} />
            ))}
          </div>
          <section className="recent-panel">
            <div className="section-heading">
              <h2>Recent activity</h2>
              <a href="#/results">
                All results
                <ArrowRight size={16} />
              </a>
            </div>
            {results.length ? (
              <div className="recent-list">
                {results.slice(0, 3).map((r) => (
                  <a
                    key={r.id}
                    className="recent-item"
                    href={`#/result/${r.id}`}
                  >
                    <span className="recent-symbol">
                      <CheckCircle2 size={20} />
                    </span>
                    <div>
                      <strong>{r.title}</strong>
                      <span>{date(r.completedAt)}</span>
                    </div>
                    <b className="score-text">{r.score}%</b>
                    <ChevronRight size={17} />
                  </a>
                ))}
              </div>
            ) : (
              <div className="recent-empty">
                <span>
                  <BookOpen size={22} />
                </span>
                <div>
                  <strong>Your progress starts here</strong>
                  <p>
                    Complete your first quiz and watch this space come to life.
                  </p>
                </div>
                <a href="#/explore">
                  <ArrowRight size={20} />
                  <span className="sr-only">Explore quizzes</span>
                </a>
              </div>
            )}
          </section>
        </div>
        <aside className="context-column">
          <section className="getting-started">
            <h2>Make every quiz count</h2>
            {[
              {
                title: "Choose a topic",
                text: "Find something familiar, or discover something new.",
              },
              {
                title: "Take your time",
                text: "Read, think, and trust what you know.",
              },
              {
                title: "Learn from every answer",
                text: "Review explanations and turn mistakes into progress.",
              },
            ].map((s, i) => (
              <div className="getting-step" key={s.title}>
                <span>{i + 1}</span>
                <div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </div>
            ))}
          </section>
        </aside>
      </div>
      <div className="workspace-footer">
        <span>Made for curious minds.</span>
        <span>
          Quizroom · Keep growing
          <GraduationCap size={15} />
        </span>
      </div>
    </>
  );
}
function Explore({ quizzes, onStart, params }) {
  const search = params.get("q") || "",
    topic = params.get("topic") || "All topics";
  const [difficulty, setDifficulty] = useState("All levels");
  function filter(q, t = topic) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (t !== "All topics") p.set("topic", t);
    go("/explore" + (p.size ? "?" + p.toString() : ""));
  }
  const filtered = quizzes.filter(
    (q) =>
      (topic === "All topics" || q.category === topic) &&
      (difficulty === "All levels" || q.difficulty === difficulty) &&
      `${q.title} ${q.description} ${q.category}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Find your next challenge.</h1>
          <p>A new topic, a fresh perspective. What will you learn today?</p>
        </div>
        <span className="library-count">
          <BookOpen size={18} />
          {quizzes.length} quizzes to explore
        </span>
      </div>
      <div className="catalog-tools">
        <SearchBox value={search} onChange={(q) => filter(q)} />
        <select
          aria-label="Filter by difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
        >
          <option>All levels</option>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </div>
      <TopicFilters value={topic} onChange={(t) => filter(search, t)} />
      <div className="catalog-count">
        {filtered.length} {filtered.length === 1 ? "quiz" : "quizzes"}
        {search ? ` matching “${search}”` : ""}
      </div>
      {filtered.length ? (
        <div className="quiz-grid catalog-grid">
          {filtered.map((q) => (
            <QuizCard quiz={q} key={q.id} onStart={onStart} />
          ))}
        </div>
      ) : (
        <Empty
          icon={Search}
          title="No quizzes found"
          description="Try a different search or explore another topic."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setDifficulty("All levels");
                filter("", "All topics");
              }}
            >
              Clear filters
            </Button>
          }
        />
      )}
    </>
  );
}
function Results({ results }) {
  function download() {
    const escape = (s) => '"' + String(s).replaceAll('"', '""') + '"';
    const blob = new Blob(
      [
        [
          "Quiz,Score,Correct,Total,Date",
          ...results.map((r) =>
            [r.title, r.score + "%", r.correct, r.total, date(r.completedAt)]
              .map(escape)
              .join(","),
          ),
        ].join("\n"),
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "quizroom-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Look how far you’ve come.</h1>
          <p>
            Every quiz is a step forward. Revisit your answers and keep growing.
          </p>
        </div>
        {results.length ? (
          <Button variant="outline" onClick={download}>
            <Download size={17} />
            Export results
          </Button>
        ) : null}
      </div>
      {results.length ? (
        <section className="table-panel">
          <div className="panel-title">
            <h2>Your quiz history</h2>
            <span>{results.length} completed</span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Completed</th>
                  <th>Score</th>
                  <th>Correct answers</th>
                  <th>
                    <span className="sr-only">Review</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.title}</strong>
                      <span className="table-sub">
                        {Math.floor(r.duration / 60)}m {r.duration % 60}s ·{" "}
                        {r.timedOut ? "Time limit reached" : "Submitted"}
                      </span>
                    </td>
                    <td>{date(r.completedAt)}</td>
                    <td>
                      <span
                        className={`score-badge ${r.score >= 60 ? "green" : "amber"}`}
                      >
                        {r.score}%
                      </span>
                    </td>
                    <td>
                      {r.correct} / {r.total}
                    </td>
                    <td>
                      <a className="text-link" href={`#/result/${r.id}`}>
                        Review
                        <ArrowRight size={15} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <Empty
          icon={ChartNoAxesColumnIncreasing}
          title="A fresh page, full of possibility."
          description="Your scores and answer reviews will appear here after your first quiz."
          action={
            <a className="button primary" href="#/explore">
              Explore quizzes
              <ArrowRight size={16} />
            </a>
          }
        />
      )}
    </>
  );
}
function Leaderboard({ entries: initialEntries }) {
  const [live, setLive] = useState({
    entries: initialEntries,
    status: "connecting",
    source: null,
  });
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    const stream = new EventSource("/api/leaderboard/stream");
    stream.addEventListener("leaderboard", (event) => {
      try {
        setLive(JSON.parse(event.data));
        setConnected(true);
      } catch {
        setConnected(false);
      }
    });
    stream.addEventListener("expired", () => {
      stream.close();
      window.dispatchEvent(new Event("session-expired"));
    });
    stream.onerror = () => setConnected(false);
    return () => stream.close();
  }, []);
  const entries = live.entries;
  const healthy = connected && live.status !== "reconnecting";

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>A little friendly competition.</h1>
          <p>
            Celebrate curious minds. Ranked by average score, then quizzes
            completed.
          </p>
        </div>
        <span className="library-count">
          <Trophy size={18} />
          The learning league
        </span>
      </div>
      <div className="leaderboard-status" role="status" aria-live="polite">
        <span
          className={healthy ? "connection-dot online" : "connection-dot"}
        />
        <strong>
          {healthy
            ? "Live updates"
            : connected
              ? "Cloud sync reconnecting"
              : "Connecting to live updates…"}
        </strong>
        <span>
          {live.source === "supabase"
            ? "Stored in Supabase"
            : live.source === "sqlite"
              ? "Local storage"
              : ""}
        </span>
        {live.pending > 0 && live.source === "supabase" ? (
          <span>{live.pending} scores waiting to sync</span>
        ) : null}
        {live.updatedAt ? (
          <span className="last-updated">
            Updated{" "}
            {new Intl.DateTimeFormat("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }).format(live.updatedAt)}
          </span>
        ) : null}
      </div>
      <div className="leaderboard-banner">
        <div className="trophy-art">
          <Trophy size={49} strokeWidth={1.5} />
          <Sparkles size={22} />
        </div>
        <div>
          <h2>Show up. Learn something. Move up.</h2>
          <p>
            Every completed quiz contributes to your average. Your next personal
            best is waiting.
          </p>
        </div>
        <a className="button primary" href="#/explore">
          Take a quiz
          <ArrowRight size={17} />
        </a>
      </div>
      {entries.length ? (
        <section className="table-panel">
          <div className="panel-title">
            <h2>Workspace leaderboard</h2>
            <span>
              {entries.length} {entries.length === 1 ? "learner" : "learners"}
            </span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Learner</th>
                  <th>Quizzes completed</th>
                  <th>Average score</th>
                  <th>Best score</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className={e.isYou ? "your-row" : ""}>
                    <td>
                      <span className={`rank ${e.rank <= 3 ? "podium" : ""}`}>
                        {e.rank <= 3 ? <Trophy size={18} /> : null}
                        {e.rank}
                      </span>
                    </td>
                    <td>
                      <div className="learner-name">
                        <span className="avatar small">{initials(e.name)}</span>
                        <strong>{e.name}</strong>
                        {e.isYou ? (
                          <span className="badge green">You</span>
                        ) : null}
                      </div>
                    </td>
                    <td>{e.completed}</td>
                    <td>
                      <strong className="score-text">{e.average}%</strong>
                    </td>
                    <td>{e.best}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <Empty
          icon={Trophy}
          title="The first spot could be yours."
          description="Complete a quiz to join the leaderboard. Everyone starts somewhere."
          action={
            <a className="button primary" href="#/explore">
              Find a quiz
              <ArrowRight size={16} />
            </a>
          }
        />
      )}
      <p className="privacy-note">
        <ShieldCheck size={14} />
        Only display names and scores are shared. Email addresses stay private.
      </p>
    </>
  );
}
function QuizIntro({ quiz, onClose, onBegin }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const Icon = icons[quiz.icon] || BookOpen;
  return (
    <Modal title="Your next challenge" onClose={() => !busy && onClose()}>
      <div className={`intro-art ${quiz.theme}`}>
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h3 className="intro-title">{quiz.title}</h3>
      <p className="muted">{quiz.description}</p>
      <div className="intro-meta">
        <span>
          <ListChecks size={18} />
          <strong>{quiz.questionCount}</strong> questions
        </span>
        <span>
          <Clock size={18} />
          <strong>{quiz.duration}</strong> minutes
        </span>
        <span>
          <Star size={18} />
          {quiz.difficulty}
        </span>
      </div>
      <div className="info-box">
        <ShieldCheck size={20} />
        <p>
          Your answers save as you go. You can return to an unfinished quiz, but
          the timer keeps running. When time is up, your saved answers are
          submitted.
        </p>
      </div>
      <ErrorBox message={error} />
      <div className="modal-actions">
        <Button variant="outline" onClick={onClose} disabled={busy}>
          Maybe later
        </Button>
        <Button
          busy={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onBegin(quiz);
            } catch (e) {
              setError(e.message);
              setBusy(false);
            }
          }}
        >
          Begin quiz
          <ArrowRight size={17} />
        </Button>
      </div>
    </Modal>
  );
}
function Attempt({ id, onFinish, onExit }) {
  const [attempt, setAttempt] = useState(null),
    [index, setIndex] = useState(0),
    [answers, setAnswers] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [saved, setSaved] = useState(true),
    [confirm, setConfirm] = useState(""),
    [now, setNow] = useState(Date.now());
  const submitting = useRef(false),
    answersRef = useRef([]);
  useEffect(() => {
    let alive = true;
    api(`/attempts/${id}`)
      .then((a) => {
        if (!alive) return;
        if (a.completed) {
          go(`/result/${id}`);
          return;
        }
        setAttempt(a);
        setAnswers(a.answers);
        answersRef.current = a.answers;
      })
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [id]);
  const submit = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      await api(`/attempts/${id}/submit`, { answers: answersRef.current });
      onFinish(id);
    } catch (e) {
      setError(e.message);
      submitting.current = false;
      setBusy(false);
    }
  }, [id, onFinish]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const expired = attempt && now >= attempt.expiresAt;
  useEffect(() => {
    if (expired && !error) submit();
  }, [expired, submit, error]);
  async function choose(option) {
    const next = [...answers];
    next[index] = option;
    setAnswers(next);
    answersRef.current = next;
    setBusy(true);
    setSaved(false);
    setError("");
    try {
      await api(`/attempts/${id}`, { answers: next }, "PATCH");
      setSaved(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!attempt)
    return (
      <div className="attempt-page">
        <header className="attempt-header">
          <Brand />
          <Button variant="outline" onClick={onExit}>
            Back to workspace
          </Button>
        </header>
        {error ? (
          <Empty
            title="We couldn’t open this quiz"
            description={error}
            action={
              <Button onClick={() => window.location.reload()}>
                Try again
              </Button>
            }
          />
        ) : (
          <Loading />
        )}
      </div>
    );
  const remaining = Math.max(0, Math.ceil((attempt.expiresAt - now) / 1000)),
    answered = answers.filter((v) => v !== null).length,
    question = attempt.questions[index];
  return (
    <div className="attempt-page">
      <header className="attempt-header">
        <Brand />
        <span className="attempt-header-title">{attempt.title}</span>
        <Button
          variant="ghost"
          onClick={() => setConfirm("exit")}
          disabled={busy}
        >
          <X size={17} />
          Leave quiz
        </Button>
      </header>
      <main className="attempt-main">
        <div className="attempt-topline">
          <div>
            <span className="subtle-label">STAY CURIOUS. YOU’VE GOT THIS.</span>
            <h1>{attempt.title}</h1>
          </div>
          <div
            className={`timer ${remaining < 60 ? "urgent" : ""}`}
            role="timer"
            aria-label="Time remaining"
          >
            <Clock size={20} />
            <strong>
              {Math.floor(remaining / 60)
                .toString()
                .padStart(2, "0")}
              :{(remaining % 60).toString().padStart(2, "0")}
            </strong>
            <span>remaining</span>
          </div>
        </div>
        <div className="attempt-progress">
          <div
            style={{ width: `${(answered / attempt.questions.length) * 100}%` }}
          />
        </div>
        <div className="attempt-layout">
          <section className="question-panel">
            <div className="question-count">
              Question {index + 1} of {attempt.questions.length}
              <span>Single choice</span>
            </div>
            <h2>{question.text}</h2>
            <fieldset className="answer-options" disabled={busy || expired}>
              <legend className="sr-only">Choose one answer</legend>
              {question.options.map((o, i) => (
                <label
                  className={`answer-option ${answers[index] === i ? "chosen" : ""}`}
                  key={i}
                >
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={i}
                    checked={answers[index] === i}
                    onChange={() => choose(i)}
                  />
                  <span className="option-letter">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{o}</span>
                  {answers[index] === i ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <span className="option-radio" />
                  )}
                </label>
              ))}
            </fieldset>
            <ErrorBox message={error} />
            {expired && error ? (
              <Button onClick={submit} busy={busy}>
                Retry submission
              </Button>
            ) : null}
            <div className="question-footer">
              <Button
                variant="outline"
                disabled={index === 0 || busy || expired}
                onClick={() => setIndex(index - 1)}
              >
                <ChevronLeft size={17} />
                Previous
              </Button>
              <span className="save-status" role="status">
                {busy ? (
                  <LoaderCircle size={14} className="spin" />
                ) : saved ? (
                  <Check size={15} />
                ) : (
                  <TriangleAlert size={15} />
                )}
                {busy
                  ? "Saving…"
                  : saved
                    ? "All answers saved"
                    : "Changes not saved"}
              </span>
              {index < attempt.questions.length - 1 ? (
                <Button
                  disabled={busy || expired}
                  onClick={() => setIndex(index + 1)}
                >
                  Next question
                  <ChevronRight size={17} />
                </Button>
              ) : (
                <Button
                  disabled={busy || expired}
                  onClick={() => setConfirm("submit")}
                >
                  Finish quiz
                  <CheckCircle2 size={17} />
                </Button>
              )}
            </div>
          </section>
          <aside className="question-navigator">
            <h3>Your questions</h3>
            <p>
              {answered} of {attempt.questions.length} answered
            </p>
            <div className="question-numbers">
              {attempt.questions.map((_, i) => (
                <button
                  key={i}
                  aria-label={`Go to question ${i + 1}`}
                  aria-current={index === i ? "step" : undefined}
                  className={`${index === i ? "current" : ""} ${answers[i] !== null ? "answered" : ""}`}
                  disabled={busy || expired}
                  onClick={() => setIndex(i)}
                >
                  {i + 1}
                  {answers[i] !== null ? <Check size={10} /> : null}
                </button>
              ))}
            </div>
            <div className="navigator-key">
              <span>
                <i />
                Unanswered
              </span>
              <span>
                <i className="green-dot" />
                Answered
              </span>
            </div>
            <div className="quiz-tip">
              <Sparkles size={20} />
              <p>
                Not sure about an answer? Move on and come back with a fresh
                perspective.
              </p>
            </div>
          </aside>
        </div>
        <p className="attempt-note">
          <ShieldCheck size={14} />
          Your progress is saved securely. The timer continues if you leave this
          page.
        </p>
      </main>
      {confirm ? (
        <Modal
          title={confirm === "exit" ? "Take a pause?" : "Ready to finish?"}
          onClose={() => !busy && setConfirm("")}
        >
          <p className="modal-copy">
            {confirm === "exit"
              ? "Your saved answers will be here when you return. The timer will keep running."
              : answered === attempt.questions.length
                ? "You’ve answered every question. Submit to see your score and learn from the explanations."
                : `You have ${attempt.questions.length - answered} unanswered ${attempt.questions.length - answered === 1 ? "question" : "questions"}. Unanswered questions receive no points.`}
          </p>
          <ErrorBox message={error} />
          <div className="modal-actions">
            <Button
              variant="outline"
              onClick={() => setConfirm("")}
              disabled={busy}
              autoFocus
            >
              Keep going
            </Button>
            <Button busy={busy} onClick={confirm === "exit" ? onExit : submit}>
              {confirm === "exit" ? "Leave quiz" : "Submit quiz"}
              <ArrowRight size={16} />
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
function ResultDetail({ id }) {
  const [result, setResult] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    api(`/results/${id}`)
      .then((r) => live && setResult(r))
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [id]);
  if (error)
    return (
      <Empty
        title="Result unavailable"
        description={error}
        action={
          <a href="#/results" className="button outline">
            Back to results
          </a>
        }
      />
    );
  if (!result) return <Loading />;
  return (
    <>
      <div className="result-hero">
        <span
          className={`result-medallion ${result.score < 60 ? "neutral" : ""}`}
        >
          <Trophy size={35} />
        </span>
        <h1>
          {result.score === 100
            ? "Perfectly done!"
            : result.score >= 60
              ? "That’s progress worth celebrating."
              : "Every attempt teaches you something."}
        </h1>
        <p>{result.title}</p>
        <div className="result-score">
          {result.score}
          <span>%</span>
        </div>
        <span className="score-caption">YOUR SCORE</span>
        <div className="result-stats">
          <span>
            <CheckCircle2 size={18} />
            <strong>
              {result.correct}/{result.total}
            </strong>{" "}
            correct
          </span>
          <span>
            <Clock size={18} />
            {Math.floor(result.duration / 60)}m {result.duration % 60}s
          </span>
          <span>
            <CalendarDays size={18} />
            {date(result.completedAt)}
          </span>
        </div>
        {result.timedOut ? (
          <p className="timeout-note">
            Time limit reached. Your last saved answers were graded.
          </p>
        ) : null}
        <div className="result-actions">
          <Button variant="outline" onClick={() => go("/")}>
            Back to overview
          </Button>
          <a href="#/explore" className="button primary">
            Find another quiz
            <ArrowRight size={17} />
          </a>
        </div>
      </div>
      <div className="section-heading review-heading">
        <div>
          <h2>A closer look at your answers</h2>
          <p className="muted">
            The best part of a quiz is what you take away from it.
          </p>
        </div>
        <span className="badge green">Answer review</span>
      </div>
      <div className="review-list">
        {result.review.map((q, i) => (
          <section
            className={`review-card ${q.selected === q.correct ? "right" : "wrong"}`}
            key={i}
          >
            <div className="review-title">
              <span className="question-label">QUESTION {i + 1}</span>
              <span
                className={`badge ${q.selected === q.correct ? "green" : "amber"}`}
              >
                {q.selected === q.correct ? <Check size={13} /> : null}
                {q.selected === q.correct
                  ? "Correct"
                  : q.selected === null
                    ? "Unanswered"
                    : "Keep learning"}
              </span>
            </div>
            <h3>{q.text}</h3>
            <div className="review-options">
              {q.options.map((o, j) => (
                <div
                  key={j}
                  className={`${j === q.correct ? "correct-option" : ""} ${j === q.selected && j !== q.correct ? "incorrect-option" : ""}`}
                >
                  <span>{String.fromCharCode(65 + j)}</span>
                  {o}
                  {j === q.correct ? (
                    <CheckCircle2 size={17} />
                  ) : j === q.selected ? (
                    <X size={17} />
                  ) : null}
                  <small>
                    {j === q.correct
                      ? "Correct answer"
                      : j === q.selected
                        ? "Your answer"
                        : ""}
                  </small>
                </div>
              ))}
            </div>
            <div className="explanation">
              <BookOpen size={17} />
              <p>
                <strong>Why this answer?</strong>
                {q.explanation ||
                  "Review the correct option above before your next attempt."}
              </p>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
const blankQuestion = () => ({
  text: "",
  options: ["", "", "", ""],
  correct: 0,
  explanation: "",
});
function QuizEditor({ quiz, onClose, onSave }) {
  const [draft, setDraft] = useState(() =>
      quiz
        ? structuredClone(quiz)
        : {
            title: "",
            description: "",
            category: "Computer Science",
            difficulty: "Beginner",
            duration: 10,
            questions: [blankQuestion()],
          },
    ),
    [dirty, setDirty] = useState(false),
    [discard, setDiscard] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const formRef = useRef(null);
  useEffect(() => {
    function unload(e) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", unload);
    return () => window.removeEventListener("beforeunload", unload);
  }, [dirty]);
  function update(key, value) {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  }
  function updateQ(i, key, value) {
    update(
      "questions",
      draft.questions.map((q, j) => (j === i ? { ...q, [key]: value } : q)),
    );
  }
  function close() {
    if (busy) return;
    if (dirty) setDiscard(true);
    else onClose();
  }
  async function submit(e) {
    e.preventDefault();
    setError("");
    const invalid = [
      ...formRef.current.querySelectorAll("input,textarea"),
    ].find((el) => el.required && !el.value.trim());
    if (invalid) {
      setError("Fill in each question and all four answer options.");
      invalid.focus();
      return;
    }
    setBusy(true);
    try {
      await api(
        quiz ? `/admin/quizzes/${quiz.id}` : "/admin/quizzes",
        { ...draft, duration: Number(draft.duration) },
        quiz ? "PUT" : "POST",
      );
      await onSave();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={quiz ? "Edit quiz" : "Create a quiz"} onClose={close} wide>
      <form noValidate ref={formRef} onSubmit={submit}>
        <div className="editor-body">
          <p className="muted">
            Give curious minds a new challenge. All fields are required unless
            marked optional.
          </p>
          <ErrorBox message={error} />
          <Field
            id="quiz-title"
            label="Quiz title"
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Give your quiz a clear, inviting name"
            maxLength={100}
            required
          />
          <Field id="quiz-description" label="Description">
            <Textarea
              className="resize-none"
              id="quiz-description"
              value={draft.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="What will learners discover?"
              rows={2}
              maxLength={500}
              required
            />
          </Field>
          <div className="form-row">
            <Field id="category" label="Topic">
              <select
                id="category"
                value={draft.category}
                onChange={(e) => update("category", e.target.value)}
              >
                {topics.slice(1).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field id="difficulty" label="Difficulty">
              <select
                id="difficulty"
                value={draft.difficulty}
                onChange={(e) => update("difficulty", e.target.value)}
              >
                {["Beginner", "Intermediate", "Advanced"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field
              id="duration"
              label="Time limit (minutes)"
              type="number"
              min={1}
              max={120}
              value={draft.duration}
              onChange={(e) => update("duration", e.target.value)}
              required
            />
          </div>
          <div className="editor-section-title">
            <h3>Questions</h3>
            <span>{draft.questions.length}/30</span>
          </div>
          {draft.questions.map((q, i) => (
            <section className="editor-question" key={i}>
              <div className="editor-question-top">
                <span>QUESTION {i + 1}</span>
                {draft.questions.length > 1 ? (
                  <button
                    type="button"
                    className="icon-button danger-text"
                    aria-label={`Remove question ${i + 1}`}
                    onClick={() =>
                      update(
                        "questions",
                        draft.questions.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                ) : null}
              </div>
              <Field
                id={`question-${i}`}
                label={`Question ${i + 1}`}
                value={q.text}
                onChange={(e) => updateQ(i, "text", e.target.value)}
                placeholder="What would you like to ask?"
                maxLength={1000}
                required
              />
              <div className="options-edit-grid">
                {q.options.map((o, j) => (
                  <Field
                    key={j}
                    id={`option-${i}-${j}`}
                    label={`Option ${String.fromCharCode(65 + j)}`}
                    value={o}
                    maxLength={300}
                    onChange={(e) =>
                      updateQ(
                        i,
                        "options",
                        q.options.map((v, k) => (k === j ? e.target.value : v)),
                      )
                    }
                    required
                  />
                ))}
              </div>
              <Field id={`correct-${i}`} label="Correct answer">
                <select
                  id={`correct-${i}`}
                  value={q.correct}
                  onChange={(e) =>
                    updateQ(i, "correct", Number(e.target.value))
                  }
                >
                  {q.options.map((_, j) => (
                    <option key={j} value={j}>
                      Option {String.fromCharCode(65 + j)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id={`explanation-${i}`} label="Explanation">
                <Textarea
                  className="resize-none"
                  id={`explanation-${i}`}
                  value={q.explanation}
                  onChange={(e) => updateQ(i, "explanation", e.target.value)}
                  placeholder="Help learners understand the answer (optional)"
                  rows={2}
                  maxLength={1000}
                />
              </Field>
            </section>
          ))}
          <Button
            type="button"
            variant="outline"
            disabled={draft.questions.length >= 30}
            onClick={() =>
              update("questions", [...draft.questions, blankQuestion()])
            }
          >
            <Plus size={16} />
            Add question
          </Button>
        </div>
        <div className="modal-actions editor-actions">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </Button>
          <Button type="submit" busy={busy}>
            {quiz ? "Save changes" : "Publish quiz"}
            <Check size={16} />
          </Button>
        </div>
      </form>
      {discard ? (
        <Modal title="Discard your changes?" onClose={() => setDiscard(false)}>
          <p className="modal-copy">Your unsaved quiz changes will be lost.</p>
          <div className="modal-actions">
            <Button
              variant="outline"
              autoFocus
              onClick={() => setDiscard(false)}
            >
              Keep editing
            </Button>
            <Button variant="danger" onClick={onClose}>
              Discard changes
            </Button>
          </div>
        </Modal>
      ) : null}
    </Modal>
  );
}
function Admin({ notify, onRefresh }) {
  const [quizzes, setQuizzes] = useState(null),
    [error, setError] = useState(""),
    [editor, setEditor] = useState(null),
    [archive, setArchive] = useState(null),
    [busy, setBusy] = useState(false),
    [search, setSearch] = useState(""),
    [showArchived, setShowArchived] = useState(false);
  const load = useCallback(async () => {
    try {
      setQuizzes((await api("/admin/quizzes")).quizzes);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  if (!quizzes)
    return error ? (
      <Empty
        title="Couldn’t load quizzes"
        description={error}
        action={<Button onClick={load}>Try again</Button>}
      />
    ) : (
      <Loading />
    );
  const filtered = quizzes.filter(
    (q) =>
      (showArchived || !q.archived) &&
      q.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Make room for new discoveries.</h1>
          <p>
            Create thoughtful quizzes, share knowledge, and help your learners
            grow.
          </p>
        </div>
        <Button onClick={() => setEditor({})}>
          <Plus size={17} />
          Create quiz
        </Button>
      </div>
      <div className="admin-summary">
        <div>
          <BookOpen size={22} />
          <strong>{quizzes.filter((q) => !q.archived).length}</strong>
          <span>Active quizzes</span>
        </div>
        <div>
          <ListChecks size={22} />
          <strong>
            {quizzes
              .filter((q) => !q.archived)
              .reduce((n, q) => n + q.questions.length, 0)}
          </strong>
          <span>Questions in the library</span>
        </div>
        <div>
          <ShieldCheck size={22} />
          <span>
            Instructor workspace
            <br />
            <small>You’re in control of the question bank.</small>
          </span>
        </div>
      </div>
      <ErrorBox message={error} />
      <section className="table-panel">
        <div className="admin-tools">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder="Search your quizzes…"
          />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Show archived
          </label>
        </div>
        {filtered.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Quiz</th>
                  <th>Topic</th>
                  <th>Questions</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <strong>{q.title}</strong>
                      <span className="table-sub">
                        {q.difficulty} · {q.duration} min
                      </span>
                    </td>
                    <td>{q.category}</td>
                    <td>{q.questions.length}</td>
                    <td>
                      <span
                        className={`badge ${q.archived ? "gray" : "green"}`}
                      >
                        {q.archived ? "Archived" : "Published"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label="Edit quiz"
                          title="Edit quiz"
                          disabled={!!q.archived}
                          onClick={() => setEditor(q)}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-button danger-text"
                          aria-label="Archive quiz"
                          title="Archive quiz"
                          disabled={!!q.archived}
                          onClick={() => setArchive(q)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            icon={Search}
            title="No quizzes found"
            description="Clear your search, or create a new quiz."
            action={
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
            }
          />
        )}
      </section>
      <p className="privacy-note">
        <ShieldCheck size={14} />
        Editing a quiz won’t change existing attempts. Archived quizzes keep
        their result history.
      </p>
      {editor ? (
        <QuizEditor
          quiz={editor.id ? editor : null}
          onClose={() => setEditor(null)}
          onSave={async () => {
            setEditor(null);
            notify(editor.id ? "Quiz updated." : "Quiz published.");
            await Promise.all([load(), onRefresh()]);
          }}
        />
      ) : null}
      {archive ? (
        <Modal
          title="Archive this quiz?"
          onClose={() => !busy && setArchive(null)}
        >
          <p className="modal-copy">
            <strong>{archive.title}</strong> will no longer appear in the quiz
            library. Existing results and attempts will be preserved.
          </p>
          <ErrorBox message={error} />
          <div className="modal-actions">
            <Button
              variant="outline"
              disabled={busy}
              autoFocus
              onClick={() => setArchive(null)}
            >
              Keep quiz
            </Button>
            <Button
              variant="danger"
              busy={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await api(`/admin/quizzes/${archive.id}`, null, "DELETE");
                  setArchive(null);
                  notify("Quiz archived.");
                  await Promise.all([load(), onRefresh()]);
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Archive quiz
            </Button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
const navItems = [
  { path: "/", label: "Overview", icon: House },
  { path: "/explore", label: "Explore quizzes", icon: Compass },
  { path: "/results", label: "My results", icon: ChartNoAxesColumnIncreasing },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
];
function Shell({ user, path, children, onLogout, onPractice }) {
  const [menu, setMenu] = useState(false),
    [mobile, setMobile] = useState(false),
    [help, setHelp] = useState(false),
    [search, setSearch] = useState("");
  const menuRef = useRef(null);
  useEffect(() => {
    setMobile(false);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [path]);
  useEffect(() => {
    function close(e) {
      if (!menuRef.current?.contains(e.target)) setMenu(false);
    }
    function key(e) {
      if (e.key === "Escape") {
        setMenu(false);
        setMobile(false);
      }
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", key);
    };
  }, []);
  const activeLabel = path.startsWith("/result/")
    ? "Answer review"
    : path === "/admin"
      ? "Manage quizzes"
      : navItems.find((n) => n.path === path)?.label || "Workspace";
  function navContent() {
    return (
      <>
        <Brand />
        <div className="nav-section-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {[
            ...navItems,
            ...(user.role === "admin"
              ? [{ path: "/admin", label: "Manage quizzes", icon: Settings2 }]
              : []),
          ].map(({ path: p, label, icon: Icon }) => (
            <a
              href={"#" + p}
              key={p}
              className={`nav-item ${path === p ? "active" : ""}`}
              aria-current={path === p ? "page" : undefined}
              onClick={() => setMobile(false)}
            >
              <Icon size={20} />
              {label}
              {path === p ? <span className="nav-active-dot" /> : null}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="daily-card">
            <CalendarDays size={23} />
            <h3>A little, every day.</h3>
            <p>Build a learning habit with one short quiz daily.</p>
            <button onClick={onPractice}>
              <Play size={15} />
              Start today’s practice
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="sidebar-user">
            <span className="avatar">{initials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <span>
                {user.role === "admin"
                  ? "Instructor workspace"
                  : "Your learning workspace"}
              </span>
            </div>
          </div>
        </div>
      </>
    );
  }
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">{navContent()}</aside>
      {mobile ? (
        <Modal title="Your workspace" onClose={() => setMobile(false)}>
          <div className="mobile-nav">{navContent()}</div>
        </Modal>
      ) : null}
      <div className="workspace">
        <header className="topbar">
          <button
            className="icon-button mobile-toggle"
            aria-label="Open navigation"
            onClick={() => setMobile(true)}
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <span>/</span>
            <strong>{activeLabel}</strong>
          </div>
          <div className="header-actions">
            <SearchBox
              value={search}
              onChange={setSearch}
              onSubmit={() => {
                go(
                  "/explore" +
                    (search ? "?q=" + encodeURIComponent(search) : ""),
                );
                setSearch("");
              }}
            />
            <button
              className="icon-button"
              aria-label="Open quick guide"
              title="Quick guide"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={21} />
            </button>
            <span className="header-divider" />
            <div className="profile-wrap" ref={menuRef}>
              <button
                className="profile-button"
                aria-label="Your account"
                aria-expanded={menu}
                onClick={() => setMenu(!menu)}
              >
                <span className="avatar small">{initials(user.name)}</span>
                <ChevronDown size={14} />
              </button>
              {menu ? (
                <div className="profile-menu">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                  <div className="profile-role">
                    <ShieldCheck size={14} />
                    {user.role === "admin" ? "Instructor" : "Student"} account
                  </div>
                  <button onClick={onLogout}>
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="workspace-content">
          {children}
        </main>
      </div>
      {help ? (
        <Modal title="Welcome to Quizroom" onClose={() => setHelp(false)}>
          <div className="guide-content">
            <span className="guide-icon">
              <GraduationCap size={32} />
            </span>
            <h3>A little progress, every day.</h3>
            <p>
              Explore a topic, take a timed quiz, then review every answer with
              an explanation. Your scores and study time update automatically.
            </p>
            <ul>
              <li>Your answers save as you go.</li>
              <li>Return to an unfinished quiz from Overview.</li>
              <li>The timer keeps running when you leave.</li>
              <li>Find previous scores under My results.</li>
              {user.role === "admin" ? (
                <li>Create, edit and archive quizzes under Manage quizzes.</li>
              ) : null}
            </ul>
            <Button onClick={() => setHelp(false)} className="full">
              Got it
              <Check size={16} />
            </Button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
export default function App() {
  const [current, setCurrent] = useState(route),
    [user, setUser] = useState(null),
    [config, setConfig] = useState({ demo: false }),
    [initial, setInitial] = useState(true),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [intro, setIntro] = useState(null),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const change = () => setCurrent(route());
    window.addEventListener("hashchange", change);
    const expire = () => {
      setUser(null);
      setData(null);
      setError("");
    };
    window.addEventListener("session-expired", expire);
    Promise.all([
      api("/config").then(setConfig),
      api("/me")
        .then((r) => setUser(r.user))
        .catch(() => {}),
    ])
      .catch((e) => setError(e.message))
      .finally(() => setInitial(false));
    return () => {
      window.removeEventListener("hashchange", change);
      window.removeEventListener("session-expired", expire);
    };
  }, []);
  const refresh = useCallback(async () => {
    const [q, s, r, l, a] = await Promise.all([
      api("/quizzes"),
      api("/stats"),
      api("/results"),
      api("/leaderboard"),
      api("/attempts/active"),
    ]);
    setData({
      quizzes: q.quizzes,
      stats: s,
      results: r.results,
      entries: l.entries,
      active: a.attempts,
    });
    setError("");
  }, []);
  useEffect(() => {
    if (user) refresh().catch((e) => setError(e.message));
  }, [user, refresh]);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(""), 4500);
      return () => clearTimeout(t);
    }
  }, [notice]);
  async function logout() {
    try {
      await api("/auth/logout", {});
      setUser(null);
      setData(null);
      go("/");
    } catch (e) {
      setError(e.message);
    }
  }
  const finish = useCallback(
    (id) => {
      go(`/result/${id}`);
      refresh().catch((e) => setError(e.message));
    },
    [refresh],
  );
  if (initial) return <Loading />;
  if (!user)
    return error ? (
      <Empty
        title="Couldn’t connect to Quizroom"
        description={error}
        action={
          <Button onClick={() => window.location.reload()}>Try again</Button>
        }
      />
    ) : (
      <Auth onLogin={setUser} demo={config.demo} />
    );
  if (current.path.startsWith("/attempt/"))
    return (
      <Attempt
        key={current.path}
        id={current.path.split("/")[2]}
        onFinish={finish}
        onExit={() => {
          go("/");
          refresh().catch((e) => setError(e.message));
        }}
      />
    );
  let content;
  if (!data)
    content = error ? (
      <Empty
        title="Your workspace needs another moment"
        description={error}
        action={
          <Button onClick={() => refresh().catch((e) => setError(e.message))}>
            Try again
          </Button>
        }
      />
    ) : (
      <Loading />
    );
  else if (current.path === "/")
    content = <Dashboard user={user} data={data} onStart={setIntro} />;
  else if (current.path === "/explore")
    content = (
      <Explore
        quizzes={data.quizzes}
        onStart={setIntro}
        params={current.params}
      />
    );
  else if (current.path === "/results")
    content = <Results results={data.results} />;
  else if (current.path === "/leaderboard")
    content = <Leaderboard entries={data.entries} />;
  else if (current.path.startsWith("/result/"))
    content = (
      <ResultDetail key={current.path} id={current.path.split("/")[2]} />
    );
  else if (current.path === "/admin" && user.role === "admin")
    content = <Admin notify={setNotice} onRefresh={refresh} />;
  else
    content = (
      <Empty
        title="Let’s find your way back."
        description="This page isn’t part of your workspace."
        action={
          <a href="#/" className="button primary">
            Back to overview
          </a>
        }
      />
    );
  return (
    <>
      <Shell
        user={user}
        path={current.path}
        onLogout={logout}
        onPractice={() =>
          data?.quizzes.length &&
          setIntro(data.quizzes[new Date().getDate() % data.quizzes.length])
        }
      >
        {data && error ? <ErrorBox message={error} /> : null}
        {content}
      </Shell>
      {intro ? (
        <QuizIntro
          quiz={intro}
          onClose={() => setIntro(null)}
          onBegin={async (q) => {
            const a = await api(`/quizzes/${q.id}/start`, {});
            setIntro(null);
            go(`/attempt/${a.id}`);
          }}
        />
      ) : null}
      <div
        className={`toast ${notice ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice ? (
          <>
            <CheckCircle2 size={18} />
            {notice}
          </>
        ) : null}
      </div>
    </>
  );
}
