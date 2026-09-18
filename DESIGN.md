# Design

## Overview

Visual theme: an instrument, not a brochure. The reference is the Braun and Rams instrument panel: a faintly cool light-grey ground, near-black type, and a single signal red that appears only where something is live or actionable. The one image on the page is a canvas-drawn reaction-wheel inverted pendulum that a PD controller keeps upright while the visitor drags it. Everything else is typography, whitespace and hairline rules.

Aesthetic lane, named: "Rams instrument panel, set in an accessibility typeface." Not terminal-dark, not editorial-serif, not industrial-condensed.

Color strategy: Restrained with intent. Tinted neutrals plus one accent held under 10% of the surface. The accent is a status color: it marks the moving parts of the simulation, the current section in the nav, link hover, and the availability line. It is never used decoratively.

Theme: light first. The scene that forced it: a robotics firmware lead opening the link from a hiring inbox at 2 pm on a MacBook in a bright open-plan office. A dark scheme is provided through `prefers-color-scheme` with the same tokens re-valued, and the simulation redraws from the tokens.

## Color Palette

All colors are OKLCH. Neutrals are tinted toward hue 250 (cool grey, machined aluminum); the accent is hue 24 (signal red, continuous with the red of the previous devmello.xyz).

Light scheme:

| Token | Value | Role |
|---|---|---|
| `--bg` | `oklch(0.985 0.004 250)` | page ground |
| `--bg-2` | `oklch(0.955 0.006 250)` | recessed panels (simulation stage, code) |
| `--ink` | `oklch(0.21 0.012 250)` | headings, body |
| `--ink-2` | `oklch(0.44 0.016 250)` | secondary text, dates, facts lines |
| `--ink-3` | `oklch(0.545 0.014 250)` | tertiary labels, dial scale |
| `--rule` | `oklch(0.88 0.006 250)` | hairlines |
| `--accent` | `oklch(0.54 0.19 24)` | signal red |
| `--accent-soft` | `oklch(0.93 0.03 24)` | accent tint for focus halo |

Dark scheme (`prefers-color-scheme: dark`):

| Token | Value |
|---|---|
| `--bg` | `oklch(0.18 0.008 250)` |
| `--bg-2` | `oklch(0.22 0.009 250)` |
| `--ink` | `oklch(0.93 0.006 250)` |
| `--ink-2` | `oklch(0.74 0.01 250)` |
| `--ink-3` | `oklch(0.64 0.01 250)` |
| `--rule` | `oklch(0.31 0.01 250)` |
| `--accent` | `oklch(0.72 0.17 26)` |
| `--accent-soft` | `oklch(0.28 0.05 24)` |

Contrast targets: `--ink`, `--ink-2` and `--accent` on `--bg` and `--bg-2` at or above 4.5:1; `--ink-3` at or above 4.5:1 on `--bg` (used for text 0.875 rem and larger only). Verified with a script before shipping.

## Typography

One superfamily, two cuts.

- **Atkinson Hyperlegible Next** (variable, 200 to 800) for everything. Chosen as a physical object: a typeface designed by the Braille Institute so every glyph is unmistakable from every other, which is the same instinct as a clean signal on a scope. It reads exact and warm, and it is not a portfolio default.
- **Atkinson Hyperlegible Mono** only for the simulation readouts and inline code, where tabular alignment matters.
- Fallback stack: `system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. Loaded from Google Fonts with `display=swap`.

Scale (base 1 rem = 16 px, ratio about 1.33):

| Role | Size | Weight | Notes |
|---|---|---|---|
| Display (name) | `clamp(2.4rem, 1.4rem + 3.2vw, 4.25rem)` | 600 | `letter-spacing: -0.025em`, `line-height: 0.98`, `text-wrap: balance` |
| Lead | `clamp(1.2rem, 1.05rem + 0.6vw, 1.5rem)` | 400 | `line-height: 1.4`, measure 34ch |
| Section heading | `1.5rem` | 600 | `letter-spacing: -0.01em` |
| Entry title | `1.125rem` | 600 | |
| Body | `1rem` | 400 | `line-height: 1.5`, measure 62ch |
| Small | `0.875rem` | 400 | dates, facts lines, footer |
| Readout | `0.875rem` mono | 500 | `font-variant-numeric: tabular-nums` |

Dark scheme adds 0.05 to body line-height and 0.01em letter-spacing. No all-caps body copy; caps only in the three-letter readout keys.

## Layout

- Container: `max-width: 72rem`, `padding-inline: clamp(1.25rem, 4vw, 3rem)`.
- Vertical rhythm: base unit 1.5 rem (body line-height). Section gaps `clamp(2.5rem, 5vw, 3.5rem)`; entry gaps 1.75 rem; inside an entry 0.25 to 0.375 rem. Density is a feature: on a 1280 by 900 screen the first Work entry must start above the fold and the whole page should stay near three screens.
- Hero: two columns at 56 rem and up (`minmax(0, 1fr) minmax(16rem, 22rem)`, gap `clamp(2rem, 5vw, 4rem)`), text left, simulation right. Below 56 rem the simulation stacks under the text at a 4:3 ratio.
- Sections: at 56 rem and up, a two-column grid `9rem minmax(0, 1fr)`; the section name sits in the left column and sticks under the nav while its content scrolls. Below 56 rem the name sits above the content.
- Entries are plain flow: title, one or two sentences, a facts line. No cards, no borders, no icons. Hairline rules separate sections only.
- Entries with a video use a two-column grid at 56 rem and up (`minmax(0, 62ch)` text, then 12 rem for a portrait clip or 17 rem for a landscape one) so the clip sits beside its text and adds no page height; below 56 rem the clip stacks under the text.
- Left-aligned throughout. Nothing is centered.

## Components

- **Nav**: wordmark left, five anchor links right, 3.25 rem tall, hairline below, `position: sticky` with the page ground (no blur) from 40 rem up; static on phones, where the links wrap under the wordmark. Current section link is marked with the accent via `aria-current`.
- **Simulation figure**: `<figure>` with a `<canvas>` on the `--bg-2` stage; the three readouts (angle, wheel speed, torque) sit inside the stage along its bottom edge in 0.75 rem mono, and the `<figcaption>` is one row: a one-sentence note and the "Nudge" button. The button is 2.75 rem tall, hairline border, fills with `--ink` on hover. The canvas is `role="img"` with an `aria-label`; a visually hidden `aria-live="polite"` line announces nudges, falls and recoveries.
- **Entry**: `<article>` with an `<h3>` link, a paragraph and a `<p class="facts">` of small secondary text separated by middle dots. External links carry a small `↗` glyph inside the link text.
- **Mode switch**: a fixed pill at the bottom centre of the viewport with two options, Human and LLM, after parallel.ai's Human/Machine switch. A dark indicator slides between them in 240 ms ease-out-quint and the active option's dot fills with the accent. LLM shows the raw `llms-full.txt` as monospace text straight on the page ground, with no heading or explanation (as parallel.ai does), hides the section nav and sets `?view=llm`; without JavaScript the LLM option is a plain link to `/ai`, and on `/ai` the pill links back.
- **Video figure**: inside an entry, a native `<video controls preload="none">` with a WebP poster on the `--bg-2` ground, 0.375 rem radius, placed beside the entry text (see Layout). A phone clip is shown cropped to 4:5 with `object-fit: cover` (fullscreen shows the whole frame). The caption names what is happening. No autoplay, no custom player.
- **YouTube figure**: the same slot, but a local WebP poster with a round play mark (ink, accent on hover) that links to the video; JavaScript swaps it for a youtube-nocookie iframe on click, so no third-party request happens until the visitor asks.
- **Agent page** (`/ai/`): the same content as plain semantic HTML with no nav, no script and no simulation, sharing the tokens and type; it points to `/llms-full.txt` (Markdown) and `/llms.txt` (index).
- **Contact block**: one wrapping row of label-plus-link pairs (email, GitHub, LinkedIn, Discord) under a single sentence; it stacks on phones.
- **Two-column entries**: from 72 rem the entry list becomes two columns so short entries pair up; any entry with media, or with `entry--wide`, spans both columns.
- **Footer**: one line of colophon and copyright, `--ink-3`.

Links: `--ink`, underlined with `text-decoration-thickness: 1px` and `text-underline-offset: 0.16em`, underline color `--rule` at rest and `--accent` on hover and focus. Focus-visible: 2 px `--accent` outline with 3 px offset.

## Motion

None on load. Tech-minimal restraint is the voice; the page appears complete on first paint.

- The simulation runs a fixed-step physics loop at 240 Hz inside `requestAnimationFrame`, renders at display rate, pauses when the tab is hidden or the canvas leaves the viewport, and drops to a single static frame under `prefers-reduced-motion: reduce` (the Nudge button is then hidden and the caption says so).
- Link underline color and button fill transition in 160 ms with `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint). No transforms, no bounce.

## Imagery

One figure in the hero: the reaction-wheel pendulum, drawn on canvas with 1.5 px strokes in `--ink`, a dial scale in `--ink-3`, and the wheel spokes and angle tick in `--accent`. Two real project videos sit inside their entries (the Nova humanoid, the FTC robot), self-hosted as H.264 with poster frames. No stock photographs, no icons above headings, no decorative SVG. The favicon is the pendulum reduced to a mark.

## Do / Don't

- Do put the number in the sentence ("finished 36th of 7,681 teams"). Don't make a stat tile.
- Do link the thing ("typethru on GitHub"). Don't list a technology without a project attached to it.
- Do use the accent for state (live, current, hover). Don't use it for headings or backgrounds.
- Do leave whitespace between sections. Don't add cards, borders or icons to fill it.
- Do keep sentences short and declarative. Don't use em dashes, "passionate", "leverage" or "seamless".
