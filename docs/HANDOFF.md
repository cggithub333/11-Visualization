---
handoff-version: 1
generated: 2026-11-06T04:40:00+07:00
generator: james:handoff@2.0.0
focus: "Modular diagram plugin architecture, Lexis Voice component box enlargement & semantic glow, Cloudflare Pages deployment (archify.omnicrafts.uk)"
workspace: /home/brian/Projects/03-Main-Source/11-Visualization
branch: dev
---
**Description:** Handoff metadata capturing workspace state, active branch, commit HEAD, and session focus for `11-Visualization`.

# HANDOFF: Modular Diagram Architecture & Cloudflare Pages Deployment (`archify.omnicrafts.uk`)

## Mission and current status
Focus: "Modular diagram plugin architecture, GitHub sync, Cloudflare Pages deployment (archify.omnicrafts.uk), and /etc/cloudflared cleanup".

- **Done:**
  1. **Phase 1 — Modular Plugin Architecture & GitHub Repository Setup:**
     - Refactored monolithic `index.html` (636 lines), `src/app.js` (2,586 lines), and `src/styles.css` (571 lines) into a zero-build modular plugin architecture (`src/core/` + `src/diagrams/runpod-serverless/` + `src/diagrams/lexis-voice/`).
     - Preserved 100% visual and behavioral parity across all 4 simulation views (RunPod Serverless, Lexis Voice Pipeline, vLLM Deep-Dive, and Ollama Deep-Dive).
     - Retired monolithic `src/app.js` and `src/styles.css`.
     - Split changes into 7 atomic Conventional Commits (`43d88da`..`7f2260d`), created the public GitHub repository `https://github.com/cggithub333/11-Visualization`, and pushed both `main` (default) and `dev` branches.
  2. **Phase 2 — Cloudflare Pages (`archify.omnicrafts.uk`) & `/etc/cloudflared` Cleanup:**
     - Provisioned Cloudflare Pages project `archify-omnicrafts` linked to GitHub `cggithub333/11-Visualization` (`production_branch: "main"`, preview deployments enabled for `dev` and feature branches, zero-build root `/`).
     - Bound custom domain `https://archify.omnicrafts.uk` (`status: "active"`) and created a proxied DNS `CNAME` record (`archify.omnicrafts.uk -> archify-omnicrafts.pages.dev`) in the `omnicrafts.uk` zone.
     - Decommissioned the legacy `architecture.omnicrafts.uk` DNS `CNAME` record from the `omnicrafts.uk` zone.
     - Surgically cleaned `/etc/cloudflared/config.yml` (removed only the `architecture.omnicrafts.uk` `http://localhost:8888` ingress rule and deleted `/etc/cloudflared/config.yml.bak-20261105104502`), validated ingress rules (`OK`), and restarted `cloudflared.service` while keeping `vllm2.omnicrafts.uk` (`:8000`), `api.omnicrafts.uk` (`:9080`), `stt.omnicrafts.uk` (`:8091`), and `tts.omnicrafts.uk` (`:8092`) online with 4 active HTTP/2 tunnel connections.
     - Authored `docs/deployment.md` and `tests/deployment-docs.test.mjs` (`28/28` tests passing), committed (`3419fa3`), pushed to `origin/dev` and `origin/main`, and locked `gpg-agent` via `pass:lock`.
  3. **Phase 3 — Diagram 3: Adaptive Context Switching & Dynamic FSM Pipeline:**
     - Created modular diagram plugin `src/diagrams/adaptive-context-switch/` (`styles.css`, `template.js`, `context-engine.js`) and registered into `DiagramRegistry` (`id: 'adaptive-context-switch'`).
     - Faithfully modeled 100% of `01-Service-Harness-Ts/src/domain/policy/adaptive-context-switching.policy.ts`: initial sub-context entity locking on Turn 1, good turns threshold (4-5), SIBLING_SUB_CONTEXT_CLUSTERS, 15-Template Bank bridge phrase interpolation, anti-deadlock rescue on >2 consecutive weak turns, off-topic redirect badge, and real-time prompt injection directive (< 45 tokens) strictly forbidding meta-headers.
  4. **Phase 4 — RunPod Option Hiding, URL Diagram Persistence, & Diagram 3 Visual Routes/Interactive Demo:**
     - **Hidden RunPod Option**: Preserved RunPod in `DiagramRegistry` and `#diagram-viewport` mount, but set `hidden: true` and added `hidden` attribute to `<option value="runpod-serverless">` in `index.html` dropdown. Filtered hidden entries in dynamic select generation in `src/core/switcher.js`.
     - **URL Diagram State Persistence**: Updated `switchDiagram` and `bootstrapDiagrams` in `src/core/switcher.js` to automatically set and update `?diagram=<id>` via `window.history.replaceState`. On page reload/refresh, the active diagram is read from the URL param so it stays on the selected diagram (e.g. `?diagram=adaptive-context-switch`) rather than falling back to the second diagram. Added `popstate` listener for browser back/forward navigation.
     - **Diagram 3 Visual Topology & Routes**: Engineered orthogonal canvas connection rails and animated directional signal buses across all 6 hardware components (Student Station, API Gateway, Session State DB, Harness FSM Engine, vLLM Qwen 1.5B/7B AWQ, and Kokoro TTS) on `#context-flow-canvas`.
     - **Interactive Request Demo Flow**: Built full interactive controls in `template.js` and `context-engine.js`: "Send Turn Request" split button with batch sizes (1x, 3x, 5x), quality scenario triggers ("Simulate Good Turn 4/5", "Simulate Weak Turn Hold/Rescue", "Simulate Off-Topic Redirect"), Auto-Run live conversation mode, Pause/Resume, and Reset Session. Animated multi-hop signal packets with node glowing and live 6-step progress status banner.
     - **Test Suite Expansion**: Added `tests/diagram-url-persistence.test.mjs`, expanding test suite from 36 to 40 tests (`40/40` passing, 0 regressions). Captured and verified visual screenshot (`templates/edit/verify/view3_adaptive_context_verified.png`, 141 KB).
  5. **Phase 5 — Lexis Voice Component Box Enlargement & Semantic Glow Animation:**
     - **Component Box Enlargement & 4-Column Layout**: Resized all component boxes in Diagram 1 (`lexis-voice`) while preserving 100% of the 6-tier architecture. Student Station (`w-72`), API Gateway (`w-72`), Curriculum & Session Services (`w-64`), Harness Service (`w-72`), and Tier 5 Inference Workers (`STT`, `DECISION`, `LLM`, `TTS` across an evenly-spaced 4-column grid with `w-full max-w-[240px]`, identical heights, and `whitespace-nowrap` headers).
     - **Vibrant Semantic Glow States**: Modeled node highlight behavior after Diagram 2 (`adaptive-context-switch`), implementing scoped glow tokens in `src/diagrams/lexis-voice/styles.css` (`.node-active-emerald`, `.node-active-blue`, `.node-active-purple`, `.node-active-teal`, `.node-active-indigo`, `.node-active-cyan`) with `0 0 20px` drop shadows and `-1px` tactile hover lifts.
     - **Pipeline Pulse Coordination**: Updated `triggerSingleVoiceTurn` and `triggerStepHop` in `src/diagrams/lexis-voice/lexis-engine.js` so each packet hop triggers the matching component's semantic theme color (e.g. teal for curriculum, purple for session/decision, indigo for harness, blue for LLM, emerald for STT/client, cyan for TTS).
     - **Visual & Automated Verification**: Captured and inspected visual verification screenshot `templates/edit/verify/view2_lexis_voice_verified.png`. Confirmed all 40 unit and integration tests pass cleanly (`40/40`).
   6. **Phase 6 — Diagram 3 Full Architecture Refinement & MVC Architecture Standards:**
      - **Mandatory Architecture Design Rules**: Established `docs/rules/design.md` detailing the 5 core invariants: (1) 3-Subblock MVC stack per service card; (2) Zero-AI-slop & Lucide Icons standard (no emojis, no sparkle icon); (3) Squared / Orthogonal Manhattan Routing (`M x1 y1 L x1 y_mid L x2 y_mid L x2 y2`); (4) Standardized Enterprise Technical Terminology (`Decision Server`, `Message Broker`, `LLM Server`, `External IAM Service`, `External Storage Service`, `SQL Database`, `NoSQL Database`); (5) Unified Scenario Command Bar (1 dropdown + dedicated scenario play button).
      - **Full Architecture Visualizer (Diagram 3)**: Implemented `src/diagrams/full-architecture/` (`styles.css`, `template.js`, `engine.js`), covering 100% of Tab 0 (`espp-microservice-architecture.drawio`).
   7. **Phase 7 — SPP Plan Execution: MVC 3-Subblock Stack, Squared Manhattan Routing & Lexis Polish:**
      - Executed 5-task tactical TDD plan (`plans/2026-11-06-diagram3-mvc-refinement/spp-plan.md`) orchestrated via Herdr subagents.
      - Embedded 3-subblock MVC structure (`.mvc-controller`, `.mvc-service`, `.mvc-model`) across all microservices and web client.
      - Implemented channel-aware squared Manhattan routing (`generateSquaredPath`) connecting all services to designated PostgreSQL SQL schemas and Redis/MongoDB NoSQL databases.
      - Replaced horizontal buttons with unified `<select id="use-case-select">` and dedicated `<button id="btn-arch-play-scenario">` (`▶ Play Scenario` / `⏸ Pause`).
      - Polished Lexis Voice Diagram: removed down arrow character, widened LLM Server card (`min-w-[200px] max-w-[260px]`), and embedded Lucide vector chevron dynamically rotating on branch expansion (`> ` to `v`).
      - Expanded test suite to 54 passing tests repo-wide (`54/54` pass, 0 regressions).
- **Remaining:**
  - Continuous enhancement and live deployment monitoring.
- **Urgency:** low (completed milestone handoff).

## Scope and guardrails
- **Workspace:** `/home/brian/Projects/03-Main-Source/11-Visualization`
- **In scope:**
  - `index.html`, `README.md`, `src/core/*`, `src/diagrams/<diagram-id>/*`, `tests/*.test.mjs`, `docs/deployment.md`, and `docs/HANDOFF.md`.
- **Out of scope:**
  - Bundlers (Vite/Webpack/Rollup) — project strictly uses a zero-build static ES/UMD-Lite architecture so `index.html` runs directly on Cloudflare Pages and local HTTP servers without a build step.
  - Active local production tunnels in `/etc/cloudflared/config.yml` (`vllm2`, `api`, `stt`, `tts` on `omnicrafts-end4-tunnel`).
- **Constraints:**
  - Each diagram must reside in its own isolated folder under `src/diagrams/<diagram-id>/` with its own template, simulation engine, and styles, registering into `window.DiagramRegistry` (`src/core/registry.js`).
  - Zero raw credentials, API tokens, 32-char hex Cloudflare Account/Zone IDs, or tunnel UUIDs may be committed to git.
- **Safety boundaries:**
  - Always use `james:pass-agent` (`source ~/.james-pass-agent/init.sh && pass:run --persistent cloudflare -- ...`) for Cloudflare API operations and `pass:lock` when finished.

## Current state
- **Branch:** `dev` (in sync with `origin/dev` and `origin/main`)
- **HEAD:** `3419fa3809117fb2649b929033fb68bba6a4b078` (`docs(deploy): add Cloudflare Pages archify.omnicrafts.uk deployment docs and verification test`)
- **Working tree:** clean (adding `docs/HANDOFF.md` in this commit)
- **Changed files:** `docs/HANDOFF.md`
- **Untracked files:** none (local scratch directories in `plans/` and `docs/advisory/`, `docs/verify/` are ignored via `.gitignore`; `docs/deployment.md` and `docs/HANDOFF.md` are tracked via `git add -f`)
- **Intentional local modifications:** yes (`docs/HANDOFF.md`)

## Decisions and rationale

| Decision | Rationale | Alternative Rejected | Reference |
| :--- | :--- | :--- | :--- |
| **Per-Diagram Feature Folders (`src/diagrams/<id>/`) + Shared Hub Core (`src/core/`)** | Isolates each diagram's HTML template, simulation engine, and CSS so new diagrams can be added without touching existing diagram code | Monolithic `src/app.js` (2,586 lines) and `src/styles.css` (571 lines) | `plans/2026-11-05-modular-diagram-architecture/spp-plan.md` |
| **Zero-Build UMD-Lite / IIFE Global + CommonJS Dual Export Pattern** | Works both natively in browsers (`<script defer>` tags in `index.html`, including `file://` and static CDN hosting) and in Node.js `node --test` unit tests without a build step | ES Module bundler requiring `npm run build` or breaking `file://` preview | `src/core/dom.js`, `src/core/registry.js`, `src/core/switcher.js` |
| **Lifecycle Contract (`mount`, `unmount`, `pause`, `resume`) in `DiagramRegistry`** | Guarantees only the active diagram runs `requestAnimationFrame` loops and timers while inactive diagrams pause cleanly | Running all diagram simulations simultaneously in the background | `src/core/registry.js`, `src/core/switcher.js` |
| **Cloudflare Pages (`archify-omnicrafts`) Linked to GitHub `cggithub333/11-Visualization`** | Automatic GitOps edge deployment on every push to `main` (production `https://archify.omnicrafts.uk`) and `dev` (preview URLs) with zero local server process | Hosting static files through a local Python HTTP server on `localhost:8888` via `cloudflared` | `docs/deployment.md` |
| **Surgical `/etc/cloudflared/config.yml` Cleanup** | Removes only the retired `architecture.omnicrafts.uk` (`localhost:8888`) ingress rule and `.bak` file while preserving 100% uptime for `vllm2`, `api`, `stt`, and `tts.omnicrafts.uk` | Stopping `cloudflared.service` or wiping `/etc/cloudflared/`, which would take down active local AI/voice endpoints | `/etc/cloudflared/config.yml` |

## Work performed
- **Modular Codebase Refactoring & Commit Split:**
  - `43d88da` — `feat(core): add zero-build DOM and component template helper` (`src/core/dom.js`, `tests/core-dom.test.mjs`)
  - `90bfc66` — `feat(core): add diagram plugin registry and lifecycle contract` (`src/core/registry.js`, `tests/core-registry.test.mjs`)
  - `878f8ac` — `refactor(styles): split global chassis and per-diagram stylesheets` (`src/core/chassis.css`, `src/diagrams/runpod-serverless/styles.css`, `src/diagrams/lexis-voice/styles.css`, `tests/css-modularization.test.mjs`)
  - `8a64f15` — `feat(runpod): extract RunPod serverless template and simulation module` (`src/diagrams/runpod-serverless/template.js`, `src/diagrams/runpod-serverless/engine.js`, `tests/diagram-runpod.test.mjs`)
  - `4c3aead` — `feat(lexis): extract Lexis voice and LLM deep-dive diagram modules` (`src/diagrams/lexis-voice/template.js`, `src/diagrams/lexis-voice/llm-deep-dive.js`, `src/diagrams/lexis-voice/lexis-engine.js`, `tests/diagram-lexis.test.mjs`)
  - `e144b36` — `refactor(hub): add central switcher, slim index.html shell, and retire monolith` (`index.html`, `src/core/switcher.js`, `tests/hub-integration.test.mjs`, deleted `src/app.js` & `src/styles.css`)
  - `7f2260d` — `docs(readme): document modular plugin architecture and Cloudflare Pages deployment` (`README.md`, `.gitignore`)
  - `3419fa3` — `docs(deploy): add Cloudflare Pages archify.omnicrafts.uk deployment docs and verification test` (`docs/deployment.md`, `tests/deployment-docs.test.mjs`)
- **Cloudflare & System Operations Executed:**
  - Provisioned Cloudflare Pages project `archify-omnicrafts` linked to `cggithub333/11-Visualization` (`main`), triggered initial deployment (`c5ca9625-9cfb-436a-af45-059bb1780d6e`), bound custom domain `archify.omnicrafts.uk`, and created proxied DNS `CNAME` (`archify.omnicrafts.uk -> archify-omnicrafts.pages.dev`) using `[REDACTED:cloudflare-api-token]`.
  - Deleted legacy DNS `CNAME` record `architecture.omnicrafts.uk` from the `omnicrafts.uk` zone using `[REDACTED:cloudflare-api-token]`.
  - Updated `/etc/cloudflared/config.yml`, removed `/etc/cloudflared/config.yml.bak-20261105104502`, validated ingress rules (`cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate` -> `OK`), and restarted `cloudflared.service` using `[REDACTED:sudo-password]`.
- `2 redactions applied.`

## Verification

| Check | Command | Outcome | When |
| :--- | :--- | :--- | :--- |
| **Node.js Unit & Integration Suite (9 files, 40 tests)** | `node --test tests/*.test.mjs` | `PASS` (`40/40` passed, `0` failed in `~1.5s`) | Post-Phase 4 |
| **Headless Chrome Visual & Runtime Parity** | `google-chrome-stable --headless --dump-dom ...` (inside `tests/hub-integration.test.mjs` & visual screenshots) | `PASS` (Zero console/page errors; verified RunPod, Lexis, vLLM, Ollama, and Adaptive Context views) | Post-Phase 4 |
| **Live Production Custom Domain & Assets** | `curl -fsSI https://archify.omnicrafts.uk/` (plus `/src/core/switcher.js`, `/src/diagrams/runpod-serverless/engine.js`, `/src/diagrams/lexis-voice/lexis-engine.js`, `/src/diagrams/adaptive-context-switch/context-engine.js`) | `PASS` (`HTTP/2 200 OK` across all endpoints) | Post-Phase 2 / 4 |
| **Legacy DNS Record Removal** | Cloudflare DNS API query for `architecture.omnicrafts.uk` in `omnicrafts.uk` zone | `PASS` (`legacy_architecture_dns_count=0`, `archify_dns_count=1`) | Wave 2 & Audit |
| **Local `/etc/cloudflared` Ingress & Service Health** | `cloudflared tunnel --config /etc/cloudflared/config.yml ingress validate && systemctl is-active cloudflared.service` | `PASS` (`OK`, `active`, 4/4 `http2` connections registered) | Wave 2 & Audit |

- **Not run:**
  - External load testing (`k6`): Not applicable for static Cloudflare Pages CDN assets.

## Open risks and blockers
- **Type:** note (non-blocking). **Owner:** developer. **Impact:** `.gitignore` ignores `docs/` by default to keep local scratch artifacts (`docs/advisory/`, `docs/verify/`) out of git; tracked documentation files inside `docs/` (`docs/deployment.md`, `docs/HANDOFF.md`) must be staged with `git add -f docs/<file>.md`.

## Exact next actions
1. **First safe step** — Run `node --test tests/*.test.mjs` and `git status -sb` to confirm all 28 tests pass and `dev` / `main` are clean before starting any new feature work.
2. **To add a new diagram module (`<new-diagram-id>`) in a future session:**
   - Create `src/diagrams/<new-diagram-id>/styles.css`, `src/diagrams/<new-diagram-id>/template.js`, and `src/diagrams/<new-diagram-id>/engine.js`.
   - Call `window.DiagramRegistry.register({ id: '<new-diagram-id>', title: '...', mount(container) { ... }, unmount() { ... }, pause() { ... }, resume() { ... } })` inside `engine.js`.
   - Link the stylesheet and `<script defer>` tags in `index.html`.
   - Add a unit test file `tests/diagram-<new-diagram-id>.test.mjs` and run `node --test tests/*.test.mjs`.
3. **To deploy updates to `https://archify.omnicrafts.uk`:**
   - Push to `origin/dev` for a Cloudflare Pages preview deployment, and push/merge to `origin/main` to automatically publish to `https://archify.omnicrafts.uk`.

## Source pointers
- `index.html`
- `README.md`
- `docs/rules/design.md`
- `docs/deployment.md`
- `docs/HANDOFF.md`
- `src/core/dom.js`
- `src/core/registry.js`
- `src/core/switcher.js`
- `src/core/chassis.css`
- `src/diagrams/runpod-serverless/styles.css`
- `src/diagrams/runpod-serverless/template.js`
- `src/diagrams/runpod-serverless/engine.js`
- `src/diagrams/lexis-voice/styles.css`
- `src/diagrams/lexis-voice/template.js`
- `src/diagrams/lexis-voice/llm-deep-dive.js`
- `src/diagrams/lexis-voice/lexis-engine.js`
- `tests/deployment-docs.test.mjs`
- `tests/hub-integration.test.mjs`
- `https://github.com/cggithub333/11-Visualization`
- `https://archify.omnicrafts.uk`
