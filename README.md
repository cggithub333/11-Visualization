# 11-Visualization: Interactive Architecture Visualizer Hub

An interactive, high-fidelity real-time architectural visualizer featuring interactive topologies, particle packet dynamics, state machines, and live telemetry canvases.

---

## 🚀 Quick Start (Zero Build Required)

This visualizer runs on standard HTML5 Canvas, modern CSS, and vanilla ES6+ JavaScript with zero node_modules or build steps required.

### 1. Launch via Local HTTP Server
```bash
# From 11-Visualization directory:
python3 -m http.server 3300
```
Then navigate to: `http://localhost:3300`

### 2. Or Open Directly in Google Chrome
```bash
google-chrome index.html
```

---

## 🎛️ Dual-Diagram Switcher Hub

Use the dropdown menu at the top right of the application to switch between diagrams, or navigate directly via URL parameters:

1. **`runpod-serverless`** (`?diagram=runpod-serverless`):
   - **How Serverless Endpoints Work**: Interactive replica of RunPod request routing, FIFO queue buffering, cold-start provisioning, and dynamic GPU worker auto-scaling (`Idle` -> `Init` -> `Ready` -> `Run`).
   - Includes real-time stacked area telemetry chart tracking Active Workers, Queued Requests, and Processing Compute.

2. **`diagram-slot-2` (Lexis Architecture)** (`?diagram=diagram-slot-2`):
   - **How Lexis Voice Practice Works**: Clean, vertical top-to-bottom pipeline illustrating real-time conversational practice:
     - **Tier 1 (Top)**: Student Web App (`Client`, Next.js 15 WebAudio API).
     - **Tier 2**: `API Gateway` with horizontal branches to `Curriculum Service` (CEFR rubrics & syllabus) and `Core Services` (IAM, Class, Notification).
     - **Tier 3**: `Session Service` (Single-Seat Lock & Turn FSM).
     - **Horizontal AI Boundary**: Explicit architectural demarcation (`Application State Plane` ──── `WebSocket Full-Duplex Tunnel` ──── `Low-Latency Neural Inference Tier`).
     - **Tier 4 (Orchestrator)**: `Harness Service` (01-Service-Harness-Ts).
     - **Tier 5 (Inference Servers)**:
       - 🟢 **STT Server**: Whisper / Scribe continuous streaming.
       - 🟣 **Decision Server & LLM Server**: System 1 Evaluator (CEFR Scaffolding) + vLLM / Qwen 2.5 Tutor Reasoning.
       - 🔵 **TTS Server**: EdgeTTS / MiniMax chunked audio synthesis.
     - **Interactive Canvas & Controls**:
       - **Clean Minimal Nodes**: Removed cluttering description paragraphs and technical specs; each box presents a crisp service title and icon.
       - **Spacious Layout**: Generously spaced tiers and horizontal branches for maximum visual clarity.
       - **Drag & Pan Interaction**: Freely click and drag any service node across the canvas (with real-time dynamic rail and particle re-anchoring), or drag the canvas background to pan.
       - **Toolbar**: Includes `Simulate voice turn`, `Single-step trace`, session stepper (`Active sessions: [ - 1 + ]`), `Pause`, and `↺ Reset layout`.

---

## 🧪 Headless Verification Commands

```bash
# Verify View 1 (RunPod):
google-chrome --headless=new --disable-gpu --window-size=1400,1200 --screenshot="templates/edit/verify/view1_runpod_verified.png" "file://$PWD/index.html?diagram=runpod-serverless"

# Verify View 2 (Lexis Architecture initial state):
google-chrome --headless=new --disable-gpu --window-size=1400,1600 --screenshot="templates/edit/verify/view2_lexis_full.png" "file://$PWD/index.html?diagram=diagram-slot-2"

# Verify View 2 with Step 1 active:
google-chrome --headless=new --disable-gpu --window-size=1400,1600 --screenshot="templates/edit/verify/view2_lexis_stephop1.png" "file://$PWD/index.html?diagram=diagram-slot-2&stephop=1"
```

