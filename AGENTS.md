# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Product direction

- Visual source of truth: `/Users/fabricecoroller/.codex/generated_images/01a0153d-c7db-7c71-9553-55605e277037/exec-ac0c8652-d496-4e12-841b-3c61b0fdaa49.png`.
- Build a premium, dark, immersive French lunar-phase learning SPA for the general public.
- Preserve the three-step narrative, large Earth/Moon/Sun scene, observer phase lens, and bottom lunar-month transport from the selected mockup.
- Astronomy must be computed from the selected place, date, and time; real values take precedence over illustrative numbers in the mockup.
- Support place search plus globe clicking, and provide a fully responsive mobile experience.
- Keep the project frontend-only, without accounts, backend, database, or deployment unless explicitly requested later.
- Audit corrections approved on 2026-09-19: preserve the visual identity while prioritizing geographic accuracy, continuous observer-oriented lunar illumination, stable lunar-month navigation, and visible controls on desktop and mobile. Keep the three-step lesson with concise explanations and explicitly distinguish altitude above the horizon from actual naked-eye visibility.
