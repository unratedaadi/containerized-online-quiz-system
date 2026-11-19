---
version: alpha
colors:
  primary: "#17665e"
  ink: "#182b34"
  muted: "#586b65"
  background: "#f0f2f1"
  surface: "#f7f8f6"
  border: "#d1d9d6"
  mint: "#e4ebe6"
typography:
  sans:
    fontFamily: "Manrope Variable, Manrope, Arial, sans-serif"
  data:
    fontFamily: "ui-monospace, monospace"
rounded:
  card: "2px"
  control: "2px"
spacing:
  unit: "4px"
components:
  Button:
    rounded: "2px"
---

# Quizroom

## Overview

A restrained assessment workspace for university students and instructors. Product UI, English language, en-IN date/number formatting. The visual reference is an academic index: clear type, fine rules, uniform quiz rows and honest progress. The owner's design avoid list from the project chat supersedes the original pastel dashboard concept. The other chat's website stylesheet is intentionally preserved.

## Colors

The frontmatter values map to `:root` in **src/presentation.css**, the final theme owner imported after `src/styles.css`. The original stylesheet remains as the compatibility/layout base. Change durable theme values in this document and the presentation owner together. No generated adapters exist. Slate text, cool gray document, off-white surfaces and restrained dark teal actions. Feedback alone uses semantic green, amber or red.

## Typography

Locally bundled Manrope Variable for display and body; monospace only for countdowns. Page titles 26–30px, quiz titles 13–16px, body 11–14px and labels 10–12px. Strong contrast and readable line height; no Inter, Geist or Space Grotesk.

## Layout

230px desktop sidebar, 76px header, wide single-column document. Metrics form a divided band; quizzes form a ruled list. No three-card feature row or bento layout. At 760px, navigation becomes a dialog and the list retains its actions in a compact two-column row. Document scrolling owns long content; tables scroll horizontally inside their panels.

## Elevation & Depth

Flat surfaces, 1px rules, no drop shadows, glass effects, gradients or decorative orbs. Dialog backdrops are plain translucent slate.

## Shapes

2px corners on panels and controls. Circular avatars and measurable progress indicators remain functional exceptions. No pill-based decoration.

## Components

Shared Button, Modal, Field, auto-growing Textarea, Empty and QuizCard own repeated behavior. Functional navigation/control icons remain small; decorative illustrations and sparkle iconography are hidden. Static hover colors only; no hover movement or animated arrows. Visible keyboard focus and reduced motion support are global. No skeleton loaders.

## Do's and Don'ts

Use actual user progress and real working quizzes. Never invent learners, historical activity or testimonials. No emojis, rainbow coloring, pastel illustration cards, decorative dot grids or colored left stripes. Keep the interface focused on learning and assessment. Preserve the existing website base while making final presentation changes in `src/presentation.css`.
