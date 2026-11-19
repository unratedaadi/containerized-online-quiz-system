# Quizroom behavior contract

## Canonical UI Map

| Capability     | Canonical owner                                                | Source of truth                | Allowed variants                   | Verification      |
| -------------- | -------------------------------------------------------------- | ------------------------------ | ---------------------------------- | ----------------- |
| Select/Listbox | Native select in Field                                         | This contract                  | native                             | tests/ui.spec.js  |
| Form           | Field and form error in src/App.jsx                            | API validation + this contract | auth / quiz editor                 | tests/ui.spec.js  |
| Scrollbar      | src/styles.css global baseline with src/presentation.css theme | DESIGN.md                      | horizontal table wrapper           | tests/ui.spec.js  |
| Toast          | App status live region                                         | This contract                  | success / error                    | tests/ui.spec.js  |
| CRUD           | Admin editor and API service                                   | docs/IMPLEMENTATION.md         | create / edit / archive            | tests/api.test.js |
| Dialog         | Modal wrapping native dialog                                   | This contract                  | confirmation / quiz intro / editor | tests/ui.spec.js  |

## Navigation and state

Real hash routes support back/forward and reload. Catalog search and category persist in URLSearchParams inside the hash. Search is immediate against an already-loaded bounded catalog; clear returns focus to input. All result and leaderboard lists show up to 100 records. Long admin forms scroll within a bounded dialog; textareas grow with content and do not require manual resizing. Native selects own their popup geometry and keyboard behavior.

## Attempts

Starting a quiz requires an intro dialog. Answers autosave to the API; pending saves finish before changing questions or submitting. Reload resumes from server-saved answers. Exiting an attempt asks to leave and preserves it for resume. Submission confirmation reports unanswered questions. Expired attempts submit saved answers automatically; failed submission can be retried. Correct answers are not exposed until grading.

## Feedback and recovery

Buttons disable during writes. Shared inline error banner retains user inputs. Loading uses a stable app-owned spinner. Empty catalogs offer Clear filters; empty results offer Explore quizzes. Session expiry returns to authentication. Live status is polite; errors are alerts. Dialogs trap focus, support Escape, restore trigger focus and inert the background. Submit confirmation initially focuses Cancel. Unsaved admin drafts require confirmation to discard. No browser alert/confirm/prompt.

## Permission and demo behavior

Server authorization is authoritative. Admin actions are hidden for students and forbidden through the API. Demo mode is visibly labeled and shares accounts across visitors. Authentication uses HttpOnly SameSite cookies, no credentials in local storage. Leaderboard uses first name plus last initial, never email. Demo mode should be disabled before real private use.

## Accessibility

Semantic navigation, buttons, labels, radiogroups and tables. Visible keyboard focus, sufficiently contrasted text, responsive layout, labeled icon buttons, no motion under prefers-reduced-motion. Forms use noValidate and app-owned validation. Date rendering uses en-IN. Form errors are linked through aria-describedby.

## Live leaderboard

Leaderboard opens an authenticated SSE feed and closes it on navigation. Incoming snapshots update ranks in place without page reload. A visible status distinguishes live connection, cloud reconnection and pending uploads. Supabase is the leaderboard store; SQLite remains the durable outbox and offline fallback. Server grading is authoritative; browser clients never receive the sync credential or write scores to Supabase directly. See server/leaderboard.js and README.md for sync ownership and privacy boundaries.
