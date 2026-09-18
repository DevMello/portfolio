# Product

## Register

brand

## Users

Hiring engineers and recruiters at robotics, firmware and applied-ML companies (humanoid startups, hardware teams, edge-AI groups). They open the link from a resume, a LinkedIn message or a GitHub profile, on a laptop in a bright office, and give it 30 to 60 seconds before deciding whether to keep reading. Secondary visitors: open-source maintainers checking who sent them a pull request, FIRST Tech Challenge mentors and students, and UC Santa Cruz classmates.

Job to be done: confirm in under a minute that Pranav ships real control software on real hardware, then find the one link they need (GitHub, email, resume) and act on it.

## Product Purpose

A single-page personal site for Pranav Yerramaneni at devmello.xyz. It replaces a purchased Bootstrap and GSAP agency template (particles, metric tiles, tabbed widgets) with a hand-built static page that is honest about what he has built: real-time control for a dual-reaction-wheel humanoid at Nova Robotics, edge ML on a Jetson Nano, an FTC team ranked 36th of 7,681, and CometKits robotics classes for elementary-school kids.

Success: a visitor can name three concrete things he built, sees that the work is current, and emails him or opens his GitHub.

## Brand Personality

Exacting, kinetic, generous.

The voice of an engineer who tunes control loops and also teaches fifth-graders: plain declarative sentences, numbers only where they prove a claim, no hype adjectives, no "passionate". Emotional goal for the visitor: quiet confidence that this person can be handed hardware and will bring it back working.

## Anti-references

- The current devmello.xyz: agency template, parallax particles, hero-metric tiles (500+ / 36 / 100 ms / 1 M+), red pill buttons, tabbed experience widget, "The Stack" years-of-experience badges.
- Terminal-cosplay developer portfolios: black background, neon green, monospace everywhere, blinking cursor, `> whoami` intros.
- Editorial-magazine portfolios: italic display serif on cream paper, drop caps, three ruled columns, tiny tracked uppercase labels above every heading.
- Project card grids with identical icons, skill bars with percentages, technology badge walls, testimonial carousels.

## Design Principles

1. Show the loop, don't describe it. The single piece of imagery on the page is a working control system the visitor can disturb and watch recover.
2. One page, nothing hidden. Everything a hiring engineer needs is reachable by scrolling; no tabs, modals or accordions gate the content.
3. Numbers are evidence, not decoration. A figure appears only inside the sentence that makes the claim it proves.
4. Links over claims. Every project points at code, a docs site, a merged pull request or a demo.
5. Built like firmware. No framework, no build step, a few kilobytes, readable without JavaScript, respectful of reduced motion and the visitor's color scheme.

## Accessibility & Inclusion

WCAG 2.2 AA. Text contrast at or above 4.5:1 in both color schemes; visible focus rings; semantic landmarks and a skip link; the simulation is operable by keyboard with a text readout (throttled `aria-live`) and is replaced by a static frame under `prefers-reduced-motion`; `prefers-color-scheme` is honored; nothing is conveyed by color alone; touch targets of at least 44 px; the page reflows at 200% zoom and 320 px wide without horizontal scrolling.
