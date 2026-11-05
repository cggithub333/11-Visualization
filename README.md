# 11-Visualization: Interactive Architecture Visualizer Hub

An interactive, high-fidelity real-time architectural visualizer featuring modular per-diagram source folders, particle packet dynamics, finite state machines, and live 60 FPS telemetry canvases.

---

## 🚀 Quick Start (Zero Build Required)

This visualizer runs on standard HTML5 Canvas, modern CSS, and vanilla ES6+ JavaScript (UMD-Lite modules) with zero `node_modules` or build steps required.

### 1. Launch via Local HTTP Server
```bash
python3 -m http.server 3300
```
Then navigate to: `http://localhost:3300`

### 2. Or Open Directly in Google Chrome (`file://` Compatible)
```bash
google-chrome index.html
```

---

## 🏗️ Scalable Per-Diagram Modular Structure

Each diagram lives in its own isolated folder under `src/diagrams/<diagram-id>/` and connects to the slim `index.html` Hub shell through `window.DiagramRegistry`:

```text
11-Visualization/
├── index.html                                    # Slim ~62-line Hub shell (#diagram-select + #diagram-viewport)
├── src/
│   ├── tailwind.js                               # Offline standalone Tailwind JIT browser engine
│   ├── core/                                     # Shared Hub Orchestrator & Component Helpers
│   │   ├── chassis.css                           # Global dark-console tokens, chassis panels & utilities
│   │   ├── dom.js                                # Zero-build component helper (html`...`, createComponent, mountTemplate)
│   │   ├── registry.js                           # Plugin registry contract (window.DiagramRegistry)
│   │   └── switcher.js                           # Central view switcher, lifecycle manager & URL router
│   └── diagrams/                                 # Isolated Per-Diagram Source Modules
│       ├── runpod-serverless/                    # Diagram 1: RunPod Serverless GPU & Auto-Scaling
│       │   ├── styles.css                        # Scoped worker card FSM styles
│       │   ├── template.js                       # Self-mounting #view-runpod-serverless DOM template
│       │   └── engine.js                         # ServerlessSimulation engine + registry manifest
│       └── lexis-voice/                          # Diagram 2: Lexis Real-Time Voice Practice Architecture
│           ├── styles.css                        # Scoped 5-tier draggable node & VRAM block styles
│           ├── template.js                       # Self-mounting #view-diagram-slot-2 DOM template
│           ├── llm-deep-dive.js                  # LLMEngineDeepDiveSimulation (vLLM vs Ollama branch)
│           └── lexis-engine.js                   # LexisArchitectureSimulation + registry manifest
└── tests/                                        # Zero-dependency Node native test suite (node:test)
```

### Adding a New Diagram (`src/diagrams/<new-id>/`)
Not all diagrams need to share the same internal code architecture. Any diagram can use imperative Canvas, SVG, or JSX-like functional components via `window.DiagramDOM` and self-register:

```javascript
const { html, createComponent, mountTemplate } = window.DiagramDOM;

const ServiceCard = createComponent(({ id, title }) => html`
  <div id="${id}" class="hardware-node p-4">${title}</div>
`);

window.DiagramRegistry.register({
  id: 'my-diagram',
  aliases: ['custom'],
  label: '3. Custom System Architecture',
  defaultSelected: false,
  mount(viewport) {
    mountTemplate(viewport, html`
      <div id="view-my-diagram" class="diagram-view hidden">
        ${ServiceCard({ id: 'node-gateway', title: 'API Gateway' })}
      </div>
    `);
  },
  init() {},
  activate() {},
  deactivate() {},
  resize() {},
  handleUrlParams(params) {}
});
```

---

## ☁️ Deploying to Cloudflare Pages

Because the repository is 100% static HTML/CSS/JS with zero build dependencies, deploying to **Cloudflare Pages** takes under 30 seconds:

1. Go to **Cloudflare Dashboard** ➔ **Workers & Pages** ➔ **Create** ➔ **Pages** ➔ **Connect to Git**.
2. Select the **`11-Visualization`** GitHub repository.
3. Configure build settings:
   - **Production branch**: `main` (or `dev`)
   - **Framework preset**: `None`
   - **Build command**: *(Leave empty)*
   - **Build output directory**: `/` (or leave default root)
4. Click **Save and Deploy**.

---

## 🧪 Automated Tests & Headless Verification

```bash
# 1. Run the 26-test zero-dependency Node.js unit & integration suite:
node --test tests/*.test.mjs

# 2. Verify View 1 (RunPod Serverless):
google-chrome --headless=new --disable-gpu --window-size=1400,900 --screenshot="templates/edit/verify/view1_runpod_verified.png" "file://$PWD/index.html?diagram=runpod-serverless&autostart=12&simtime=2.5"

# 3. Verify View 2 (Lexis Voice Practice + vLLM Deep-Dive Branch):
google-chrome --headless=new --disable-gpu --window-size=1400,1400 --screenshot="templates/edit/verify/view2_lexis_vllm.png" "file://$PWD/index.html?diagram=diagram-slot-2&branch=1&engine=vllm&mockreq=3&enginesteps=5"
```
