/**
 * RunPod Serverless Request & Auto-Scaling GPU Worker Simulation Engine
 * High-fidelity replica with particle dynamics, auto-scaler state machine, and real-time telemetry.
 */

// GPU Microchip SVG Template
const CHIP_ICON_SVG = `
<svg class="w-6 h-6 stroke-[1.75] fill-none transition-transform" viewBox="0 0 24 24">
  <rect x="4" y="4" width="16" height="16" rx="2" />
  <rect x="8" y="8" width="8" height="8" rx="1" />
  <path d="M1 9h3M1 14h3M20 9h3M20 14h3M9 1v3M14 1v3M9 20v3M14 20v3" />
</svg>
`;

class ServerlessSimulation {
  constructor() {
    // Config & Limits
    this.maxWorkers = 9;
    this.minWorkers = 0;
    this.batchCount = 25;
    this.isPaused = false;

    // Simulation State
    this.queuedCount = 0;
    this.workers = [];
    this.initWorkerPool(9);

    // Particle System
    this.particles = [];
    this.flowCanvas = document.getElementById('flow-canvas');
    this.flowCtx = this.flowCanvas.getContext('2d');

    // Telemetry History
    this.telemetryCanvas = document.getElementById('telemetry-canvas');
    this.telemetryCtx = this.telemetryCanvas.getContext('2d');
    this.history = [];
    this.maxHistory = 180; // ~30 seconds at 6 Hz
    this.lastHistoryPush = performance.now();

    // DOM Elements
    this.valMaxWorkers = document.getElementById('val-max-workers');
    this.valActiveWorkers = document.getElementById('val-active-workers');
    this.labelQueue = document.getElementById('label-queue');
    this.workersContainer = document.getElementById('workers-container');
    this.dropdownBatch = document.getElementById('dropdown-batch');
    this.labelSendCount = document.getElementById('label-send-count');
    this.btnPause = document.getElementById('btn-pause');
    this.iconPause = document.getElementById('icon-pause');
    this.iconPlay = document.getElementById('icon-play');
    this.textPause = document.getElementById('text-pause');

    // Node Positions Cache for Particle Physics
    this.nodePositions = {};

    this.initDOM();
    this.initEvents();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Start Simulation Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }

  initWorkerPool(count) {
    this.workers = [];
    for (let i = 0; i < count; i++) {
      this.workers.push({
        id: i,
        state: 'idle', // 'idle' | 'ready' | 'init' | 'run'
        progress: 0,
        jobDuration: 0,
        idleTimer: 0,
      });
    }
  }

  initDOM() {
    this.renderWorkerCards();
    this.updateLabels();
  }

  renderWorkerCards() {
    this.workersContainer.innerHTML = '';
    this.workers.slice(0, this.maxWorkers).forEach((worker) => {
      const card = document.createElement('div');
      card.id = `worker-card-${worker.id}`;
      card.className = `worker-card worker-${worker.state}`;
      card.innerHTML = `
        ${CHIP_ICON_SVG}
        <span class="text-[10px] font-semibold tracking-tight capitalize">${worker.state}</span>
      `;
      this.workersContainer.appendChild(card);
    });
  }

  updateWorkerCardDOM(worker) {
    const card = document.getElementById(`worker-card-${worker.id}`);
    if (!card) return;
    card.className = `worker-card worker-${worker.state}`;
    const label = card.querySelector('span');
    if (label) {
      label.textContent = worker.state;
    }
  }

  updateLabels() {
    this.valMaxWorkers.textContent = this.maxWorkers;
    const activeCount = this.getActiveWorkerCount();
    this.valActiveWorkers.textContent = activeCount;

    if (this.queuedCount > 0) {
      this.labelQueue.textContent = `Queue (${this.queuedCount})`;
      this.labelQueue.classList.add('text-purple-400');
    } else {
      this.labelQueue.textContent = 'Queue';
      this.labelQueue.classList.remove('text-purple-400');
    }
  }

  getActiveWorkerCount() {
    return this.workers.slice(0, this.maxWorkers).filter((w) => w.state !== 'idle').length;
  }

  getRunningWorkerCount() {
    return this.workers.slice(0, this.maxWorkers).filter((w) => w.state === 'run').length;
  }

  initEvents() {
    // Max workers buttons
    document.getElementById('btn-inc-max').addEventListener('click', () => {
      if (this.maxWorkers < 12) {
        this.maxWorkers++;
        if (this.workers.length < this.maxWorkers) {
          this.workers.push({ id: this.workers.length, state: 'idle', progress: 0, jobDuration: 0, idleTimer: 0 });
        }
        this.renderWorkerCards();
        this.updateLabels();
        this.updateNodePositions();
      }
    });

    document.getElementById('btn-dec-max').addEventListener('click', () => {
      if (this.maxWorkers > 1) {
        this.maxWorkers--;
        this.renderWorkerCards();
        this.updateLabels();
        this.updateNodePositions();
      }
    });

    // Manual Active Workers Scaling
    document.getElementById('btn-inc-active').addEventListener('click', () => {
      const idle = this.workers.slice(0, this.maxWorkers).find((w) => w.state === 'idle');
      if (idle) {
        idle.state = 'ready';
        idle.idleTimer = 0;
        this.updateWorkerCardDOM(idle);
        this.updateLabels();
      }
    });

    document.getElementById('btn-dec-active').addEventListener('click', () => {
      const readyOrInit = this.workers.slice(0, this.maxWorkers).reverse().find((w) => w.state === 'ready' || w.state === 'init');
      if (readyOrInit) {
        readyOrInit.state = 'idle';
        readyOrInit.progress = 0;
        this.updateWorkerCardDOM(readyOrInit);
        this.updateLabels();
      }
    });

    // Pause / Resume Toggle
    this.btnPause.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.iconPause.classList.add('hidden');
        this.iconPlay.classList.remove('hidden');
        this.textPause.textContent = 'Resume';
      } else {
        this.iconPause.classList.remove('hidden');
        this.iconPlay.classList.add('hidden');
        this.textPause.textContent = 'Pause';
      }
    });

    // Send Requests Button
    document.getElementById('btn-send-requests').addEventListener('click', () => {
      this.triggerBatchRequests(this.batchCount);
    });

    // Dropdown Toggle
    const toggleBtn = document.getElementById('btn-toggle-dropdown');
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.dropdownBatch.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      this.dropdownBatch.classList.add('hidden');
    });

    document.querySelectorAll('.dropdown-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        const count = parseInt(e.target.dataset.count, 10);
        this.batchCount = count;
        this.labelSendCount.textContent = `Send ${count} requests`;
        this.dropdownBatch.classList.add('hidden');
        this.triggerBatchRequests(count);
      });
    });
  }

  handleResize() {
    // Flow Canvas resolution
    const rectFlow = this.flowCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.flowCanvas.width = rectFlow.width * dpr;
    this.flowCanvas.height = rectFlow.height * dpr;
    this.flowCtx.scale(dpr, dpr);

    // Telemetry Canvas resolution
    const rectTelem = this.telemetryCanvas.getBoundingClientRect();
    this.telemetryCanvas.width = rectTelem.width * dpr;
    this.telemetryCanvas.height = rectTelem.height * dpr;
    this.telemetryCtx.scale(dpr, dpr);

    this.updateNodePositions();
  }

  updateNodePositions() {
    const parentRect = this.flowCanvas.getBoundingClientRect();
    const getNodeCenter = (id) => {
      const el = document.getElementById(id);
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return {
        x: r.left - parentRect.left + r.width / 2,
        y: r.top - parentRect.top + r.height / 2,
        width: r.width,
        height: r.height,
      };
    };

    this.nodePositions = {
      client: getNodeCenter('node-client'),
      endpoint: getNodeCenter('node-endpoint'),
      queue: getNodeCenter('node-queue'),
      workers: {},
    };

    this.workers.slice(0, this.maxWorkers).forEach((w) => {
      this.nodePositions.workers[w.id] = getNodeCenter(`worker-card-${w.id}`);
    });
  }

  triggerBatchRequests(count) {
    this.queuedCount += count;
    this.updateLabels();

    // Spawn visual ingress packets from Client to Endpoint with staggered delay
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (this.isPaused) return;
        this.spawnParticle('client-to-endpoint');
      }, i * 35);
    }
  }

  spawnParticle(stage, extra = {}) {
    if (!this.nodePositions.client) return;

    let p = {
      stage: stage, // 'client-to-endpoint' | 'endpoint-to-queue' | 'queue-to-worker' | 'worker-to-endpoint' | 'endpoint-to-client'
      t: 0,
      speed: 0.02 + Math.random() * 0.015,
      workerId: extra.workerId || 0,
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      color: '#818cf8',
    };

    if (stage === 'client-to-endpoint') {
      const c = this.nodePositions.client;
      const e = this.nodePositions.endpoint;
      p.startX = c.x + 25;
      p.startY = c.y - 12; // Top forward rail
      p.endX = e.x - e.width / 2;
      p.endY = e.y - 12;
      p.color = '#818cf8';
    } else if (stage === 'endpoint-to-queue') {
      const e = this.nodePositions.endpoint;
      const q = this.nodePositions.queue;
      p.startX = e.x + e.width / 2;
      p.startY = e.y - 10;
      p.endX = q.x - q.width / 2;
      p.endY = q.y - 10;
      p.color = '#a855f7';
    } else if (stage === 'queue-to-worker') {
      const q = this.nodePositions.queue;
      const wPos = this.nodePositions.workers[p.workerId] || q;
      p.startX = q.x + q.width / 2;
      p.startY = q.y;
      p.endX = wPos.x;
      p.endY = wPos.y;
      p.color = '#c084fc';
    } else if (stage === 'worker-to-endpoint') {
      const wPos = this.nodePositions.workers[p.workerId] || this.nodePositions.queue;
      const e = this.nodePositions.endpoint;
      p.startX = wPos.x;
      p.startY = wPos.y + 10;
      p.endX = e.x + e.width / 2;
      p.endY = e.y + 12; // Bottom return rail
      p.color = '#34d399';
    } else if (stage === 'endpoint-to-client') {
      const e = this.nodePositions.endpoint;
      const c = this.nodePositions.client;
      p.startX = e.x - e.width / 2;
      p.startY = e.y + 12;
      p.endX = c.x + 25;
      p.endY = c.y + 12;
      p.color = '#34d399';
    }

    this.particles.push(p);
  }

  tick(currentTime) {
    if (this.isPaused) {
      requestAnimationFrame((t) => this.tick(t));
      return;
    }

    const dt = (currentTime - this.lastTime) / 1000.0;
    this.lastTime = currentTime;

    this.updateSimulation(dt);
    this.updateParticles(dt);

    this.drawParticles();
    this.drawTelemetry(currentTime);

    requestAnimationFrame((t) => this.tick(t));
  }

  updateSimulation(dt) {
    const activeWorkers = this.workers.slice(0, this.maxWorkers);

    // 1. Worker State Machine Transitions
    activeWorkers.forEach((w) => {
      if (w.state === 'init') {
        w.progress += dt;
        if (w.progress >= w.jobDuration) {
          // Cold start finished -> transition to Run immediately if job queued, or Ready
          if (this.queuedCount > 0) {
            this.queuedCount--;
            w.state = 'run';
            w.progress = 0;
            w.jobDuration = 2.0 + Math.random() * 1.5;
            this.spawnParticle('queue-to-worker', { workerId: w.id });
          } else {
            w.state = 'ready';
            w.idleTimer = 0;
          }
          this.updateWorkerCardDOM(w);
          this.updateLabels();
        }
      } else if (w.state === 'run') {
        w.progress += dt;
        if (w.progress >= w.jobDuration) {
          // Completed job -> return response to Client
          this.spawnParticle('worker-to-endpoint', { workerId: w.id });

          // If more jobs waiting, pick next job immediately
          if (this.queuedCount > 0) {
            this.queuedCount--;
            w.progress = 0;
            w.jobDuration = 1.8 + Math.random() * 1.4;
            this.spawnParticle('queue-to-worker', { workerId: w.id });
          } else {
            w.state = 'ready';
            w.idleTimer = 0;
          }
          this.updateWorkerCardDOM(w);
          this.updateLabels();
        }
      } else if (w.state === 'ready') {
        // If jobs exist, take job
        if (this.queuedCount > 0) {
          this.queuedCount--;
          w.state = 'run';
          w.progress = 0;
          w.jobDuration = 2.0 + Math.random() * 1.2;
          this.spawnParticle('queue-to-worker', { workerId: w.id });
          this.updateWorkerCardDOM(w);
          this.updateLabels();
        } else {
          // Idle cooldown before scale-down
          w.idleTimer += dt;
          if (w.idleTimer > 4.5) {
            w.state = 'idle';
            w.idleTimer = 0;
            this.updateWorkerCardDOM(w);
            this.updateLabels();
          }
        }
      }
    });

    // 2. Auto-Scaler: Provision new workers if queue is backlogged
    if (this.queuedCount > 0) {
      const idleWorker = activeWorkers.find((w) => w.state === 'idle');
      if (idleWorker) {
        idleWorker.state = 'init';
        idleWorker.progress = 0;
        idleWorker.jobDuration = 1.2 + Math.random() * 0.6; // Cold start time
        this.updateWorkerCardDOM(idleWorker);
        this.updateLabels();
      }
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.t += p.speed * (dt * 60);

      if (p.t >= 1.0) {
        // Transition particle to next stage
        if (p.stage === 'client-to-endpoint') {
          this.spawnParticle('endpoint-to-queue');
        } else if (p.stage === 'worker-to-endpoint') {
          this.spawnParticle('endpoint-to-client');
        }
        this.particles.splice(i, 1);
      }
    }
  }

  drawParticles() {
    const ctx = this.flowCtx;
    const rect = this.flowCanvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw connection rails
    if (this.nodePositions.client && this.nodePositions.endpoint) {
      const c = this.nodePositions.client;
      const e = this.nodePositions.endpoint;
      const q = this.nodePositions.queue;

      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);

      // Client <-> Endpoint rails
      ctx.strokeStyle = '#272732';
      ctx.beginPath();
      ctx.moveTo(c.x + 25, c.y - 12);
      ctx.lineTo(e.x - e.width / 2, e.y - 12);
      ctx.moveTo(e.x - e.width / 2, e.y + 12);
      ctx.lineTo(c.x + 25, c.y + 12);
      ctx.stroke();

      // Endpoint <-> Queue rails
      ctx.beginPath();
      ctx.moveTo(e.x + e.width / 2, e.y - 10);
      ctx.lineTo(q.x - q.width / 2, q.y - 10);
      ctx.moveTo(q.x - q.width / 2, q.y + 10);
      ctx.lineTo(e.x + e.width / 2, e.y + 10);
      ctx.stroke();

      ctx.restore();
    }

    // Draw moving particles
    this.particles.forEach((p) => {
      const curX = p.startX + (p.endX - p.startX) * p.t;
      const curY = p.startY + (p.endY - p.startY) * p.t;

      ctx.save();
      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.restore();
    });
  }

  drawTelemetry(currentTime) {
    // Record history slice every 160ms (~6 Hz)
    if (currentTime - this.lastHistoryPush > 160 && !this.isPaused) {
      this.lastHistoryPush = currentTime;
      const activeCount = this.getActiveWorkerCount();
      const processingCount = this.getRunningWorkerCount();
      const queued = this.queuedCount;

      this.history.push({
        activeWorkers: activeCount,
        processing: processingCount,
        queued: queued,
      });

      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    const ctx = this.telemetryCtx;
    const rect = this.telemetryCanvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    // Draw subtle grid lines
    ctx.strokeStyle = '#1a1a24';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    if (this.history.length < 2) return;

    const maxScale = Math.max(12, ...this.history.map((d) => d.queued + d.processing + 2));
    const stepX = w / (this.maxHistory - 1);
    const scaleY = (val) => h - (val / maxScale) * (h - 20) - 10;

    const startIdx = this.maxHistory - this.history.length;

    // 1. Draw Queued Area (Dark Slate)
    ctx.save();
    ctx.fillStyle = 'rgba(51, 65, 85, 0.65)';
    ctx.beginPath();
    ctx.moveTo(startIdx * stepX, h);

    for (let i = 0; i < this.history.length; i++) {
      const d = this.history[i];
      const x = (startIdx + i) * stepX;
      const y = scaleY(d.queued + d.processing);
      ctx.lineTo(x, y);
    }
    ctx.lineTo((startIdx + this.history.length - 1) * stepX, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Draw Processing Area (Lavender Purple)
    ctx.save();
    ctx.fillStyle = 'rgba(139, 92, 246, 0.45)';
    ctx.beginPath();
    ctx.moveTo(startIdx * stepX, h);

    for (let i = 0; i < this.history.length; i++) {
      const d = this.history[i];
      const x = (startIdx + i) * stepX;
      const y = scaleY(d.processing);
      ctx.lineTo(x, y);
    }
    ctx.lineTo((startIdx + this.history.length - 1) * stepX, h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. Draw Active GPU Workers (Stepped Solid Violet Line)
    ctx.save();
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    for (let i = 0; i < this.history.length; i++) {
      const d = this.history[i];
      const x = (startIdx + i) * stepX;
      const y = scaleY(d.activeWorkers);

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (startIdx + i - 1) * stepX;
        const prevY = scaleY(this.history[i - 1].activeWorkers);
        // Stepped horizontal-then-vertical line
        ctx.lineTo(x, prevY);
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Lexis Real-Time AI Voice Practice Architecture Simulation Engine
 * Vertical top-to-bottom pipeline:
 * Client -> API Gateway (Other Services branch) -> Session Service (Curriculum branch)
 * -> [AI Tier Boundary / WebSocket] -> Harness Service -> [STT | Decision -> LLM | TTS]
 * -> Real-time sub-300ms SLA breakdown telemetry.
 */
class LexisArchitectureSimulation {
  constructor() {
    this.isPaused = false;
    this.batchCount = 5;
    this.inFlightCount = 0;
    this.totalBatchRequests = 5;
    this.baseSpeed = 0.011; // Slower, deliberate request speed (~3x slower than previous)
    this.particles = [];
    this.nodePositions = {};
    this.lastTime = performance.now();

    // Step-by-Step Architecture Pipeline Definitions
    this.stepDescriptions = [
      { from: 'client', to: 'gateway', label: '1. Ingress: Student workstation streams PCM audio over WebSocket to API Gateway', color: '#34d399' },
      { from: 'gateway', to: 'session', label: '2. Session Routing: Gateway establishes active Voice Session with Session Service', color: '#c084fc' },
      { from: 'session', to: 'curriculum', label: '3a. Curriculum Query: Session Service requests active lesson prompts & rubrics', color: '#2dd4bf' },
      { from: 'curriculum', to: 'session', label: '3b. Context Injection: Curriculum Service returns pedagogical prompt & grading constraints', color: '#2dd4bf' },
      { from: 'session', to: 'harness', label: '4. Duplex Tunnel: Session multiplexes stream across AI Tier Boundary into Harness Service', color: '#60a5fa' },
      { from: 'harness', to: 'stt', label: '5. STT Ingestion: Harness feeds audio buffer to STT Server', color: '#34d399' },
      { from: 'stt', to: 'harness', label: '6. Transcript Stream: STT Server streams text back to Harness Orchestrator', color: '#34d399' },
      { from: 'harness', to: 'decision', label: '7. Scaffolding Analysis: Harness routes transcript to Decision Server', color: '#c084fc' },
      { from: 'decision', to: 'llm', label: '8. Scaffolding Prompt: Decision Server prepares prompt for LLM Server', color: '#a855f7' },
      { from: 'llm', to: 'harness', label: '9. Token Streaming: LLM Server streams generated response tokens back to Harness', color: '#60a5fa' },
      { from: 'harness', to: 'tts', label: '10. Text Chunking: Harness buffers sentence boundaries and streams text chunks to TTS Server', color: '#38bdf8' },
      { from: 'tts', to: 'harness', label: '11. Audio Ingestion: TTS Server synthesizes speech audio chunks and returns to Harness', color: '#06b6d4' },
      { from: 'harness', to: 'client', label: '12. Playback Egress: Synthesized speech stream returns up the WebSocket tunnel to Student Station', color: '#34d399' },
    ];

    // Canvases
    this.flowCanvas = document.getElementById('lexis-flow-canvas');
    this.flowCtx = this.flowCanvas ? this.flowCanvas.getContext('2d') : null;

    // DOM Elements
    this.card = document.getElementById('lexis-diagram-card');
    this.canvasWorld = document.getElementById('lexis-canvas-world');
    this.btnSendPack = document.getElementById('btn-lexis-send-pack');
    this.labelSendCount = document.getElementById('label-lexis-send-count');
    this.btnToggleDropdown = document.getElementById('btn-lexis-toggle-dropdown');
    this.dropdownBatch = document.getElementById('dropdown-lexis-batch');
    this.btnPause = document.getElementById('btn-lexis-pause');
    this.iconPause = document.getElementById('icon-lexis-pause');
    this.iconPlay = document.getElementById('icon-lexis-play');
    this.textPause = document.getElementById('text-lexis-pause');
    this.btnReset = document.getElementById('btn-lexis-reset');
    this.stepText = document.getElementById('lexis-step-text');
    this.stepBadge = document.getElementById('lexis-step-badge');

    // Drag & Pan State
    this.nodeOffsets = {};
    this.pan = { x: 0, y: 0 };
    this.isDraggingNode = false;
    this.activeDragNode = null;
    this.isPanningCanvas = false;
    this.dragStart = { x: 0, y: 0 };
    this.initialNodeOffset = { x: 0, y: 0 };
    this.initialPan = { x: 0, y: 0 };

    // Node DOM IDs
    this.nodeIds = {
      client: 'lexis-node-client',
      gateway: 'lexis-node-gateway',
      curriculum: 'lexis-node-curriculum',
      session: 'lexis-node-session',
      harness: 'lexis-node-harness',
      stt: 'lexis-node-stt',
      decision: 'lexis-node-decision',
      llm: 'lexis-node-llm',
      tts: 'lexis-node-tts',
    };

    this.initEvents();
    this.initDragAndPan();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    if (window.ResizeObserver && this.card) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.card);
      if (this.canvasWorld) {
        this.resizeObserver.observe(this.canvasWorld);
      }
    }

    // Animation Loop
    requestAnimationFrame((t) => this.tick(t));
  }

  initEvents() {
    // Send Pack of Requests
    if (this.btnSendPack) {
      this.btnSendPack.addEventListener('click', () => {
        this.triggerBatchRequests(this.batchCount);
      });
    }

    // Toggle Dropdown Button
    if (this.btnToggleDropdown && this.dropdownBatch) {
      this.btnToggleDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dropdownBatch.classList.toggle('hidden');
      });

      document.addEventListener('click', () => {
        this.dropdownBatch.classList.add('hidden');
      });
    }

    // Dropdown Items (5, 10, 15, 25, 50, 100)
    document.querySelectorAll('.dropdown-lexis-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const count = parseInt(item.dataset.count, 10);
        this.batchCount = count;
        if (this.labelSendCount) {
          this.labelSendCount.textContent = `Send ${count} requests`;
        }
        if (this.dropdownBatch) {
          this.dropdownBatch.classList.add('hidden');
        }
        this.triggerBatchRequests(count);
      });
    });

    // Pause / Resume Toggle
    if (this.btnPause) {
      this.btnPause.addEventListener('click', () => {
        this.isPaused = !this.isPaused;
        if (this.iconPause && this.iconPlay) {
          if (this.isPaused) {
            this.iconPause.classList.add('hidden');
            this.iconPlay.classList.remove('hidden');
            if (this.textPause) this.textPause.textContent = 'Resume';
          } else {
            this.iconPause.classList.remove('hidden');
            this.iconPlay.classList.add('hidden');
            if (this.textPause) this.textPause.textContent = 'Pause';
          }
        }
      });
    }

    // Reset Layout
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => {
        this.resetLayout();
      });
    }
  }

  initDragAndPan() {
    // 1. Node Dragging (Mouse & Touch)
    for (const [key, elementId] of Object.entries(this.nodeIds)) {
      const el = document.getElementById(elementId);
      if (!el) continue;

      el.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        this.isDraggingNode = true;
        this.activeDragNode = key;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.initialNodeOffset = { ...(this.nodeOffsets[key] || { x: 0, y: 0 }) };
        el.classList.add('is-dragging');
        document.body.style.cursor = 'grabbing';
      });

      el.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        e.stopPropagation();
        const touch = e.touches[0];
        this.isDraggingNode = true;
        this.activeDragNode = key;
        this.dragStart = { x: touch.clientX, y: touch.clientY };
        this.initialNodeOffset = { ...(this.nodeOffsets[key] || { x: 0, y: 0 }) };
        el.classList.add('is-dragging');
      }, { passive: true });
    }

    // 2. Canvas Background Pan (Mouse & Touch)
    if (this.card) {
      this.card.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        if (e.target.closest('button') || e.target.closest('.lexis-draggable-node')) return;
        this.isPanningCanvas = true;
        this.dragStart = { x: e.clientX, y: e.clientY };
        this.initialPan = { ...this.pan };
        this.card.classList.add('is-panning');
        document.body.style.cursor = 'grabbing';
      });

      this.card.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        if (e.target.closest('button') || e.target.closest('.lexis-draggable-node')) return;
        const touch = e.touches[0];
        this.isPanningCanvas = true;
        this.dragStart = { x: touch.clientX, y: touch.clientY };
        this.initialPan = { ...this.pan };
        this.card.classList.add('is-panning');
      }, { passive: true });
    }

    // 3. Move Handlers
    const onMove = (clientX, clientY) => {
      if (this.isDraggingNode && this.activeDragNode) {
        const dx = clientX - this.dragStart.x;
        const dy = clientY - this.dragStart.y;
        const newX = this.initialNodeOffset.x + dx;
        const newY = this.initialNodeOffset.y + dy;
        this.nodeOffsets[this.activeDragNode] = { x: newX, y: newY };
        const el = document.getElementById(this.nodeIds[this.activeDragNode]);
        if (el) {
          el.style.transform = `translate(${newX}px, ${newY}px)`;
        }
        this.updateNodePositions();
      } else if (this.isPanningCanvas) {
        const dx = clientX - this.dragStart.x;
        const dy = clientY - this.dragStart.y;
        this.pan.x = this.initialPan.x + dx;
        this.pan.y = this.initialPan.y + dy;
        if (this.canvasWorld) {
          this.canvasWorld.style.transform = `translate(${this.pan.x}px, ${this.pan.y}px)`;
        }
        this.updateNodePositions();
      }
    };

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && (this.isDraggingNode || this.isPanningCanvas)) {
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });

    // 4. End Handlers
    const onEnd = () => {
      if (this.isDraggingNode && this.activeDragNode) {
        const el = document.getElementById(this.nodeIds[this.activeDragNode]);
        if (el) el.classList.remove('is-dragging');
        this.isDraggingNode = false;
        this.activeDragNode = null;
        document.body.style.cursor = '';
      }
      if (this.isPanningCanvas) {
        this.isPanningCanvas = false;
        if (this.card) this.card.classList.remove('is-panning');
        document.body.style.cursor = '';
      }
    };

    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
  }

  resetLayout() {
    this.nodeOffsets = {};
    this.pan = { x: 0, y: 0 };
    for (const elementId of Object.values(this.nodeIds)) {
      const el = document.getElementById(elementId);
      if (el) {
        el.style.transform = '';
        el.classList.remove('is-dragging');
      }
    }
    if (this.canvasWorld) {
      this.canvasWorld.style.transform = '';
    }
    this.measureBaseNodePositions();
  }

  measureBaseNodePositions() {
    if (!this.flowCanvas) return;
    const flowRect = this.flowCanvas.getBoundingClientRect();
    if (flowRect.width === 0 || flowRect.height === 0) return;

    this.basePositions = {};

    // Temporarily reset canvasWorld transform if panned, so we measure raw base layout coordinates
    const curWorldTransform = this.canvasWorld ? this.canvasWorld.style.transform : '';
    if (curWorldTransform && this.canvasWorld) {
      this.canvasWorld.style.transform = '';
    }

    for (const [key, elementId] of Object.entries(this.nodeIds)) {
      const el = document.getElementById(elementId);
      if (el) {
        const curTransform = el.style.transform;
        if (curTransform) el.style.transform = '';

        const elRect = el.getBoundingClientRect();
        this.basePositions[key] = {
          x: elRect.left - flowRect.left + elRect.width / 2,
          y: elRect.top - flowRect.top + elRect.height / 2,
          w: elRect.width,
          h: elRect.height,
          top: elRect.top - flowRect.top,
          bottom: elRect.bottom - flowRect.top,
          left: elRect.left - flowRect.left,
          right: elRect.right - flowRect.left,
        };

        if (curTransform) el.style.transform = curTransform;
      }
    }

    if (curWorldTransform && this.canvasWorld) {
      this.canvasWorld.style.transform = curWorldTransform;
    }

    this.updateNodePositions();
  }

  updateNodePositions() {
    if (!this.basePositions) {
      this.measureBaseNodePositions();
      return;
    }
    this.nodePositions = {};
    const panX = this.pan.x || 0;
    const panY = this.pan.y || 0;

    for (const key of Object.keys(this.nodeIds)) {
      const base = this.basePositions[key];
      if (!base) continue;
      const off = this.nodeOffsets[key] || { x: 0, y: 0 };
      const totalX = off.x + panX;
      const totalY = off.y + panY;

      this.nodePositions[key] = {
        x: base.x + totalX,
        y: base.y + totalY,
        w: base.w,
        h: base.h,
        top: base.top + totalY,
        bottom: base.bottom + totalY,
        left: base.left + totalX,
        right: base.right + totalX,
      };
    }
  }

  handleResize() {
    if (!this.flowCanvas) return;

    // 1. Setup Flow Canvas
    const flowRect = this.flowCanvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.flowCanvas.width = flowRect.width * dpr;
    this.flowCanvas.height = flowRect.height * dpr;
    this.flowCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.flowCtx.scale(dpr, dpr);

    // 2. Measure Base Node Positions Relative to Flow Canvas
    this.measureBaseNodePositions();
  }

  highlightNode(key, glowClass = 'node-active', duration = 400) {
    const el = document.getElementById(this.nodeIds[key]);
    if (!el) return;
    el.classList.add(glowClass);
    setTimeout(() => {
      el.classList.remove(glowClass);
    }, duration);
  }

  spawnParticle(fromKey, toKey, options = {}) {
    const from = this.nodePositions[fromKey];
    const to = this.nodePositions[toKey];
    if (!from || !to) return;

    this.particles.push({
      fromKey,
      toKey,
      fromX: from.x,
      fromY: from.y,
      toX: to.x,
      toY: to.y,
      progress: 0,
      speed: options.speed || this.baseSpeed,
      color: options.color || '#10b981',
      glowColor: options.glowColor || 'rgba(16, 185, 129, 0.4)',
      size: options.size || 5,
      label: options.label || '',
      showLabel: options.showLabel !== false,
      laneOffset: options.laneOffset || 0,
      curveOffset: options.curveOffset || 0,
      onComplete: options.onComplete || null,
    });
  }

  triggerBatchRequests(count) {
    this.totalBatchRequests = count;
    this.inFlightCount += count;
    this.updateTelemetry();

    // Slower, graceful staggered departure
    let stagger = 220;
    if (count >= 100) stagger = 45;
    else if (count >= 50) stagger = 75;
    else if (count >= 25) stagger = 110;
    else if (count >= 15) stagger = 150;
    else if (count >= 10) stagger = 180;

    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        if (this.isPaused) return;
        const showLabels = (i === 0 || count <= 3);
        this.triggerSingleVoiceTurn(i, showLabels);
      }, i * stagger);
    }
  }

  triggerVoiceTurn() {
    this.triggerBatchRequests(this.batchCount || 5);
  }

  triggerSingleVoiceTurn(reqIndex = 0, showLabels = true) {
    const laneOffset = ((reqIndex % 5) - 2) * 3.5;
    const speedJitter = 0.94 + ((reqIndex * 17) % 15) * 0.01;
    const slowSpeed = this.baseSpeed * speedJitter;

    this.highlightNode('client', 'node-active-emerald', 300);

    // Hop 1: Client -> Gateway
    this.spawnParticle('client', 'gateway', {
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.5)',
      size: 5.5,
      label: 'PCM Audio',
      showLabel: showLabels,
      laneOffset: laneOffset,
      speed: slowSpeed,
      onComplete: () => {
        this.highlightNode('gateway', 'node-active', 250);

        // Hop 2: Gateway -> Session Service (Routing to Voice Session)
        this.spawnParticle('gateway', 'session', {
          color: '#c084fc',
          glowColor: 'rgba(192, 132, 252, 0.4)',
          size: 5,
          label: 'Session Routing',
          showLabel: showLabels,
          laneOffset: laneOffset,
          speed: slowSpeed,
          onComplete: () => {
            this.highlightNode('session', 'node-active', 250);

            // Hop 3a: Session -> Curriculum Service (Query Syllabus & Rubrics)
            this.spawnParticle('session', 'curriculum', {
              color: '#2dd4bf',
              glowColor: 'rgba(45, 212, 191, 0.4)',
              size: 4.5,
              label: 'Query Rubrics',
              showLabel: showLabels,
              laneOffset: laneOffset * 0.5,
              speed: slowSpeed * 1.2,
              onComplete: () => {
                this.highlightNode('curriculum', 'node-active', 250);

                // Hop 3b: Curriculum -> Session Service (Inject Prompts & Constraints)
                this.spawnParticle('curriculum', 'session', {
                  color: '#2dd4bf',
                  glowColor: 'rgba(45, 212, 191, 0.5)',
                  size: 4.5,
                  label: 'Rubrics & Prompts',
                  showLabel: showLabels,
                  laneOffset: laneOffset * 0.5,
                  speed: slowSpeed * 1.2,
                  onComplete: () => {
                    this.highlightNode('session', 'node-active', 250);

                // Hop 4: Session -> Harness (Crossing AI Tier Boundary via WebSocket Tunnel)
                this.spawnParticle('session', 'harness', {
                  color: '#818cf8',
                  glowColor: 'rgba(129, 140, 248, 0.5)',
                  size: 6,
                  label: 'WS Duplex Tunnel',
                  showLabel: showLabels,
                  laneOffset: laneOffset,
                  speed: slowSpeed * 0.95,
                  onComplete: () => {
                    this.highlightNode('harness', 'node-active', 300);

                    // Hop 5: Harness -> STT Server
                    this.spawnParticle('harness', 'stt', {
                      color: '#34d399',
                      glowColor: 'rgba(52, 211, 153, 0.5)',
                      size: 5,
                      label: 'PCM Audio Chunk',
                      showLabel: showLabels,
                      laneOffset: laneOffset,
                      speed: slowSpeed,
                      onComplete: () => {
                        this.highlightNode('stt', 'node-active-emerald', 350);

                        // Hop 6: STT -> Harness (Transcript text)
                        setTimeout(() => {
                          this.spawnParticle('stt', 'harness', {
                            color: '#10b981',
                            glowColor: 'rgba(16, 185, 129, 0.5)',
                            size: 4.5,
                            label: 'Transcript Text',
                            showLabel: showLabels,
                            laneOffset: laneOffset,
                            speed: slowSpeed,
                            onComplete: () => {
                              this.highlightNode('harness', 'node-active', 250);

                              // Hop 7: Harness -> Decision Server (Scaffolding / System 1)
                              this.spawnParticle('harness', 'decision', {
                                color: '#c084fc',
                                glowColor: 'rgba(192, 132, 252, 0.5)',
                                size: 5,
                                label: 'Scaffolding Analysis',
                                showLabel: showLabels,
                                laneOffset: laneOffset,
                                speed: slowSpeed,
                                onComplete: () => {
                                  this.highlightNode('decision', 'node-active', 300);

                                  // Hop 8: Decision -> LLM Server
                                  this.spawnParticle('decision', 'llm', {
                                    color: '#a855f7',
                                    glowColor: 'rgba(168, 85, 247, 0.5)',
                                    size: 5,
                                    label: 'Tutor Prompt',
                                    showLabel: showLabels,
                                    laneOffset: laneOffset,
                                    speed: slowSpeed * 1.1,
                                    onComplete: () => {
                                      this.highlightNode('llm', 'node-active', 350);

                                      // Hop 9: LLM -> Harness (Tokens streamed back to Harness Orchestrator)
                                      const forwardToHarness = () => {
                                        this.highlightNode('llm', 'node-active', 250);
                                        this.spawnParticle('llm', 'harness', {
                                          color: '#60a5fa',
                                          glowColor: 'rgba(96, 165, 250, 0.5)',
                                          size: 5,
                                          label: 'Token Stream (SSE)',
                                          showLabel: showLabels,
                                          laneOffset: laneOffset,
                                          speed: slowSpeed,
                                          onComplete: () => {
                                            this.highlightNode('harness', 'node-active', 250);

                                            // Hop 10: Harness -> TTS Server (Sentence-chunked Speech Synthesis)
                                            setTimeout(() => {
                                              this.spawnParticle('harness', 'tts', {
                                                color: '#38bdf8',
                                                glowColor: 'rgba(56, 189, 248, 0.5)',
                                                size: 5,
                                                label: 'Text Chunk',
                                                showLabel: showLabels,
                                                laneOffset: laneOffset,
                                                speed: slowSpeed,
                                                onComplete: () => {
                                                  this.highlightNode('tts', 'node-active-cyan', 350);

                                                  // Hop 11: TTS -> Harness (Audio synthesis complete)
                                                  setTimeout(() => {
                                                    this.spawnParticle('tts', 'harness', {
                                                      color: '#06b6d4',
                                                      glowColor: 'rgba(6, 182, 212, 0.5)',
                                                      size: 5,
                                                      label: 'Audio Chunk',
                                                      showLabel: showLabels,
                                                      laneOffset: laneOffset,
                                                      speed: slowSpeed,
                                                      onComplete: () => {
                                                        this.highlightNode('harness', 'node-active', 250);

                                                        // Hop 12: Harness -> Session -> Gateway -> Client (Audio Egress)
                                                        this.spawnParticle('harness', 'session', {
                                                          color: '#06b6d4',
                                                          glowColor: 'rgba(6, 182, 212, 0.5)',
                                                          size: 5.5,
                                                          label: 'Tutor Audio',
                                                          showLabel: showLabels,
                                                          laneOffset: laneOffset,
                                                          speed: slowSpeed,
                                                          onComplete: () => {
                                                            this.highlightNode('session', 'node-active', 200);
                                                            this.spawnParticle('session', 'gateway', {
                                                              color: '#06b6d4',
                                                              size: 5,
                                                              laneOffset: laneOffset,
                                                              speed: slowSpeed * 1.1,
                                                              onComplete: () => {
                                                                this.highlightNode('gateway', 'node-active', 150);
                                                                this.spawnParticle('gateway', 'client', {
                                                                  color: '#10b981',
                                                                  glowColor: 'rgba(16, 185, 129, 0.6)',
                                                                  size: 6,
                                                                  label: 'Speech Playback',
                                                                  showLabel: showLabels,
                                                                  laneOffset: laneOffset,
                                                                  speed: slowSpeed * 1.1,
                                                                  onComplete: () => {
                                                                    this.highlightNode('client', 'node-active-emerald', 400);
                                                                    this.inFlightCount = Math.max(0, this.inFlightCount - 1);
                                    this.updateTelemetry();
                                  },
                                });
                              },
                            });
                          },
                        });
                      },
                    });
                  }, 80);
                },
              });
            }, 80);
          },
        });
                                      };

                                      if (window.llmEngineSimulation) {
                                        window.llmEngineSimulation.receiveRequestFromMain({
                                          reqIndex: reqIndex,
                                          onClauseReady: forwardToHarness,
                                        });
                                      } else {
                                        setTimeout(forwardToHarness, 600);
                                      }
                                    },
                                  });
},
});
},
});
}, 80);
},
});
},
});
},
});
},
});
},
});
},
});
  }

  updateTelemetry() {
    if (!this.stepText || !this.stepBadge) return;
    if (this.inFlightCount > 0) {
      this.stepText.textContent = `Processing: ${this.inFlightCount} voice practice requests in flight across AI Tier (STT, LLM, TTS)...`;
      this.stepBadge.textContent = `${this.inFlightCount} Active`;
      this.stepBadge.className = 'text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-[#132a22] border border-[#1b4334] whitespace-nowrap ml-3';
    } else {
      this.stepText.textContent = `Completed: All ${this.totalBatchRequests || 5} requests successfully processed through AI Tier.`;
      this.stepBadge.textContent = 'Ready';
      this.stepBadge.className = 'text-[11px] font-mono text-blue-400 px-2 py-0.5 rounded bg-[#162030] border border-[#20324c] whitespace-nowrap ml-3';
    }
  }

  updateStepBanner(index, text) {
    if (this.stepBadge) {
      this.stepBadge.textContent = typeof index === 'number' ? `Step ${index}/${this.stepDescriptions.length}` : index;
    }
    if (this.stepText && text) {
      this.stepText.textContent = text;
    }
  }

  triggerStepHop() {
    const step = this.stepDescriptions[this.activeStepIndex || 0];
    if (!step) return;

    this.updateStepBanner((this.activeStepIndex || 0) + 1, step.label);
    this.highlightNode(step.from, 'node-active', 400);
    this.spawnParticle(step.from, step.to, {
      color: step.color,
      size: 6,
      speed: this.baseSpeed,
      label: step.label.split(':')[0],
      showLabel: true,
      onComplete: () => {
        this.highlightNode(step.to, 'node-active', 500);
      },
    });

    this.activeStepIndex = ((this.activeStepIndex || 0) + 1) % this.stepDescriptions.length;
  }

  update(dt) {
    if (this.isPaused) return;

    // Update Particles with dt scaling
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.progress += p.speed * (dt * 60);

      if (p.progress >= 1) {
        if (typeof p.onComplete === 'function') {
          p.onComplete();
        }
        this.particles.splice(i, 1);
      }
    }
  }

  getOrthogonalWaypoints(fromKey, toKey) {
    const p1 = this.nodePositions[fromKey];
    const p2 = this.nodePositions[toKey];
    if (!p1 || !p2) return [];

    // 1. Central Vertical Spine (client <-> gateway, gateway <-> session, session <-> harness)
    const spineKeys = ['client', 'gateway', 'session', 'harness'];
    if (spineKeys.includes(fromKey) && spineKeys.includes(toKey)) {
      const isBelow = p1.bottom <= p2.top + 10;
      const start = isBelow ? { x: p1.x, y: p1.bottom } : { x: p1.x, y: p1.top };
      const end = isBelow ? { x: p2.x, y: p2.top } : { x: p2.x, y: p2.bottom };
      if (Math.abs(start.x - end.x) < 6) {
        const snapX = (start.x + end.x) / 2;
        return [{ x: snapX, y: start.y }, { x: snapX, y: end.y }];
      }
      const midY = (start.y + end.y) / 2;
      return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
    }

    // 2. Curriculum <-> Session (horizontal left branch)
    if ((fromKey === 'curriculum' && toKey === 'session') || (fromKey === 'session' && toKey === 'curriculum')) {
      const isFwd = fromKey === 'curriculum';
      const start = isFwd ? { x: p1.right, y: p1.y } : { x: p1.left, y: p1.y };
      const end = isFwd ? { x: p2.left, y: p2.y } : { x: p2.right, y: p2.y };
      if (Math.abs(start.y - end.y) < 6) {
        const snapY = (start.y + end.y) / 2;
        return [{ x: start.x, y: snapY }, { x: end.x, y: snapY }];
      }
      const midX = (start.x + end.x) / 2;
      return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
    }

    // 4. Inference Bus (harness <-> stt, harness <-> decision, harness <-> tts)
    if (fromKey === 'harness' || toKey === 'harness') {
      const isHarnessSrc = fromKey === 'harness';
      const hNode = isHarnessSrc ? p1 : p2;
      const wNode = isHarnessSrc ? p2 : p1;
      const workerKey = isHarnessSrc ? toKey : fromKey;

      if (workerKey === 'stt') {
        const busY = hNode.bottom + 20;
        const hPortX = hNode.x - 24;
        const start = isHarnessSrc ? { x: hPortX, y: hNode.bottom } : { x: wNode.x, y: wNode.top };
        const end = isHarnessSrc ? { x: wNode.x, y: wNode.top } : { x: hPortX, y: hNode.bottom };
        return [start, { x: start.x, y: busY }, { x: end.x, y: busY }, end];
      }

      if (workerKey === 'tts') {
        const busY = hNode.bottom + 20;
        const hPortX = hNode.x + 24;
        const start = isHarnessSrc ? { x: hPortX, y: hNode.bottom } : { x: wNode.x, y: wNode.top };
        const end = isHarnessSrc ? { x: wNode.x, y: wNode.top } : { x: hPortX, y: hNode.bottom };
        return [start, { x: start.x, y: busY }, { x: end.x, y: busY }, end];
      }

      if (workerKey === 'decision') {
        const busY = hNode.bottom + 38;
        const hPortX = hNode.x - 8;
        const start = isHarnessSrc ? { x: hPortX, y: hNode.bottom } : { x: wNode.x, y: wNode.top };
        const end = isHarnessSrc ? { x: wNode.x, y: wNode.top } : { x: hPortX, y: hNode.bottom };
        if (Math.abs(start.x - end.x) < 6) {
          const snapX = (start.x + end.x) / 2;
          return [{ x: snapX, y: start.y }, { x: snapX, y: end.y }];
        }
        return [start, { x: start.x, y: busY }, { x: end.x, y: busY }, end];
      }

      if (workerKey === 'llm') {
        const busY = hNode.bottom + 38;
        const hPortX = hNode.x + 8;
        const start = isHarnessSrc ? { x: hPortX, y: hNode.bottom } : { x: wNode.x, y: wNode.top };
        const end = isHarnessSrc ? { x: wNode.x, y: wNode.top } : { x: hPortX, y: hNode.bottom };
        if (Math.abs(start.x - end.x) < 6) {
          const snapX = (start.x + end.x) / 2;
          return [{ x: snapX, y: start.y }, { x: snapX, y: end.y }];
        }
        return [start, { x: start.x, y: busY }, { x: end.x, y: busY }, end];
      }
    }

    // 5. Decision <-> LLM (horizontal prompt handoff)
    if ((fromKey === 'decision' && toKey === 'llm') || (fromKey === 'llm' && toKey === 'decision')) {
      const isFwd = fromKey === 'decision';
      const start = isFwd ? { x: p1.right, y: p1.y } : { x: p1.left, y: p1.y };
      const end = isFwd ? { x: p2.left, y: p2.y } : { x: p2.right, y: p2.y };
      if (Math.abs(start.y - end.y) < 6) {
        const snapY = (start.y + end.y) / 2;
        return [{ x: start.x, y: snapY }, { x: end.x, y: snapY }];
      }
      const midX = (start.x + end.x) / 2;
      return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
    }

    // 6. Generic Fallback for arbitrary dragged positions
    const isBelow = p1.bottom <= p2.top + 8;
    const isAbove = p1.top >= p2.bottom - 8;
    if (isBelow) {
      const start = { x: p1.x, y: p1.bottom };
      const end = { x: p2.x, y: p2.top };
      if (Math.abs(start.x - end.x) < 6) return [start, end];
      const midY = (start.y + end.y) / 2;
      return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
    } else if (isAbove) {
      const start = { x: p1.x, y: p1.top };
      const end = { x: p2.x, y: p2.bottom };
      if (Math.abs(start.x - end.x) < 6) return [start, end];
      const midY = (start.y + end.y) / 2;
      return [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end];
    } else if (p1.x <= p2.x) {
      const start = { x: p1.right, y: p1.y };
      const end = { x: p2.left, y: p2.y };
      if (Math.abs(start.y - end.y) < 6) return [start, end];
      const midX = (start.x + end.x) / 2;
      return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
    } else {
      const start = { x: p1.left, y: p1.y };
      const end = { x: p2.right, y: p2.y };
      if (Math.abs(start.y - end.y) < 6) return [start, end];
      const midX = (start.x + end.x) / 2;
      return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
    }
  }

  getPointOnPolyline(pts, t, laneOffset = 0) {
    if (!pts || pts.length === 0) return { x: 0, y: 0 };
    if (pts.length === 1) return { x: pts[0].x, y: pts[0].y };

    const segLengths = [];
    let totalLength = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const dx = pts[i + 1].x - pts[i].x;
      const dy = pts[i + 1].y - pts[i].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      segLengths.push(len);
      totalLength += len;
    }

    if (totalLength === 0) return { x: pts[0].x, y: pts[0].y };

    const targetDist = Math.max(0, Math.min(1, t)) * totalLength;
    let accumulated = 0;

    for (let i = 0; i < segLengths.length; i++) {
      const len = segLengths[i];
      if (accumulated + len >= targetDist || i === segLengths.length - 1) {
        const segT = len > 0 ? (targetDist - accumulated) / len : 0;
        const curX = pts[i].x + (pts[i + 1].x - pts[i].x) * segT;
        const curY = pts[i].y + (pts[i + 1].y - pts[i].y) * segT;

        if (laneOffset !== 0) {
          const dx = pts[i + 1].x - pts[i].x;
          const dy = pts[i + 1].y - pts[i].y;
          if (Math.abs(dy) >= Math.abs(dx)) {
            // Mostly vertical segment: offset horizontally
            return { x: curX + laneOffset, y: curY };
          } else {
            // Mostly horizontal segment: offset vertically
            return { x: curX, y: curY + laneOffset };
          }
        }

        return { x: curX, y: curY };
      }
      accumulated += len;
    }

    return { x: pts[pts.length - 1].x, y: pts[pts.length - 1].y };
  }

  drawRoundedPolyline(ctx, pts, r = 8) {
    if (!pts || pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) {
      ctx.lineTo(pts[1].x, pts[1].y);
      ctx.stroke();
      return;
    }
    for (let i = 1; i < pts.length - 1; i++) {
      const p1 = pts[i];
      const p2 = pts[i + 1];
      ctx.arcTo(p1.x, p1.y, p2.x, p2.y, r);
    }
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  }

  drawAnchorDot(ctx, pt, color, radius = 2.5) {
    if (!pt) return;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawTopologyRails(ctx, time) {
    const rails = [
      { from: 'client', to: 'gateway', color: 'rgba(99, 102, 241, 0.45)', dotColor: '#818cf8' },
      { from: 'gateway', to: 'session', color: 'rgba(168, 85, 247, 0.45)', dotColor: '#c084fc' },
      { from: 'curriculum', to: 'session', color: 'rgba(45, 212, 191, 0.45)', dotColor: '#2dd4bf' },
      { from: 'session', to: 'harness', color: 'rgba(129, 140, 248, 0.55)', dotColor: '#818cf8', dashed: true },
      { from: 'harness', to: 'stt', color: 'rgba(16, 185, 129, 0.4)', dotColor: '#34d399' },
      { from: 'harness', to: 'decision', color: 'rgba(168, 85, 247, 0.4)', dotColor: '#c084fc' },
      { from: 'decision', to: 'llm', color: 'rgba(96, 165, 250, 0.45)', dotColor: '#60a5fa' },
      { from: 'llm', to: 'harness', color: 'rgba(96, 165, 250, 0.45)', dotColor: '#60a5fa' },
      { from: 'harness', to: 'tts', color: 'rgba(6, 182, 212, 0.45)', dotColor: '#06b6d4' },
    ];

    for (const r of rails) {
      const waypoints = this.getOrthogonalWaypoints(r.from, r.to);
      if (!waypoints || waypoints.length < 2) continue;

      ctx.save();
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 1.75;
      if (r.dashed) {
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -(time * 0.02) % 10;
      } else {
        ctx.setLineDash([]);
      }

      this.drawRoundedPolyline(ctx, waypoints, 8);

      // Terminal anchor dots
      this.drawAnchorDot(ctx, waypoints[0], r.dotColor, 2.5);
      this.drawAnchorDot(ctx, waypoints[waypoints.length - 1], r.dotColor, 2.5);
      ctx.restore();
    }

    // Appended LLM Execution Branch Connector Rail
    const branchEl = document.getElementById('lexis-branch-llm');
    if (branchEl && !branchEl.classList.contains('hidden') && this.nodePositions['llm']) {
      const llmPos = this.nodePositions['llm'];
      const flowRect = this.flowCanvas.getBoundingClientRect();
      const bRect = branchEl.getBoundingClientRect();
      const branchTop = bRect.top - flowRect.top;
      const branchLeft = bRect.left - flowRect.left;
      const branchRight = branchLeft + bRect.width;
      const targetX = Math.max(branchLeft + 30, Math.min(branchRight - 30, llmPos.x));

      ctx.save();
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -(time * 0.025) % 10;
      ctx.beginPath();
      ctx.moveTo(llmPos.x, llmPos.bottom);
      if (Math.abs(llmPos.x - targetX) < 4) {
        ctx.lineTo(llmPos.x, branchTop);
      } else {
        const midY = (llmPos.bottom + branchTop) / 2;
        ctx.bezierCurveTo(llmPos.x, midY, targetX, midY, targetX, branchTop);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      this.drawAnchorDot(ctx, { x: llmPos.x, y: llmPos.bottom }, '#60a5fa', 3);
      this.drawAnchorDot(ctx, { x: targetX, y: branchTop }, '#3b82f6', 3.5);
      ctx.restore();
    }
  }

  drawParticles(ctx) {
    ctx.save();
    for (const p of this.particles) {
      const t = Math.min(1, Math.max(0, p.progress));
      const waypoints = this.getOrthogonalWaypoints(p.fromKey, p.toKey);
      if (!waypoints || waypoints.length === 0) continue;

      const pos = this.getPointOnPolyline(waypoints, t, p.laneOffset || 0);
      const curX = pos.x;
      const curY = pos.y;

      // Glow halo
      ctx.shadowColor = p.glowColor || p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(curX, curY, p.size || 5, 0, Math.PI * 2);
      ctx.fill();

      // White core
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(curX, curY, (p.size || 5) * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Floating label badge (only if p.showLabel is true)
      if (p.showLabel && p.label) {
        ctx.font = '9px "JetBrains Mono", ui-monospace, monospace';
        const textWidth = ctx.measureText(p.label).width;
        const rx = curX + 8;
        const ry = curY - 14;
        const rw = textWidth + 8;
        const rh = 14;

        ctx.fillStyle = 'rgba(11, 13, 18, 0.85)';
        ctx.strokeStyle = 'rgba(43, 57, 82, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(rx, ry, rw, rh, 3);
        } else {
          ctx.rect(rx, ry, rw, rh);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(230, 237, 243, 0.95)';
        ctx.fillText(p.label, rx + 4, ry + 10);
      }
    }
    ctx.restore();
  }

  tick(time) {
    if (this.isPaused) {
      this.lastTime = time;
      requestAnimationFrame((t) => this.tick(t));
      return;
    }

    const dt = Math.min(0.1, (time - this.lastTime) / 1000);
    this.lastTime = time;

    this.update(dt);

    if (this.isDraggingNode || this.isPanningCanvas) {
      this.updateNodePositions();
    }

    if (this.flowCtx && this.flowCanvas) {
      const clientW = Math.round(this.flowCanvas.clientWidth);
      const clientH = Math.round(this.flowCanvas.clientHeight);
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.round(clientW * dpr);
      const targetH = Math.round(clientH * dpr);

      // Auto-synchronize canvas buffer resolution with DOM element dimensions (zero bitmap distortion)
      if (targetW > 0 && targetH > 0 && (this.flowCanvas.width !== targetW || this.flowCanvas.height !== targetH)) {
        this.flowCanvas.width = targetW;
        this.flowCanvas.height = targetH;
        this.flowCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.flowCtx.scale(dpr, dpr);
        this.measureBaseNodePositions();
      }

      this.flowCtx.clearRect(0, 0, clientW, clientH);
      this.drawTopologyRails(this.flowCtx, time);
      this.drawParticles(this.flowCtx);
    }

    requestAnimationFrame((t) => this.tick(t));
  }
}

/**
 * LLM Server Under-The-Hood Architecture Simulation
 * Visualizes how requests are buffered, batched, and scheduled in GPU memory.
 * Compares vLLM (Continuous Batching & PagedAttention) vs Ollama (Slot-based / llama.cpp Queue).
 */
class LLMEngineDeepDiveSimulation {
  constructor() {
    this.engine = 'vllm'; // 'vllm' | 'ollama'
    this.iteration = 0;
    this.completedCount = 0;
    this.activeRequests = [];
    this.stepInterval = 90; // ms per token iteration forward pass
    this.lastTickTime = performance.now();

    // 24 Physical VRAM Blocks (16 tokens per block)
    this.totalBlocks = 24;
    this.blocks = Array.from({ length: this.totalBlocks }, (_, i) => ({
      id: i,
      ownerId: null,
      tokensUsed: 0,
      isFragmented: false,
    }));

    // Ollama Fixed Slots (OLLAMA_NUM_PARALLEL = 2)
    this.ollamaSlots = [
      { slotId: 0, activeReqId: null, reservedBlocks: [0, 1, 2, 3, 4, 5] },
      { slotId: 1, activeReqId: null, reservedBlocks: [6, 7, 8, 9, 10, 11] },
    ];

    this.initDOM();
    this.renderBlocksGrid();
    this.renderDOM();

    // Start generation ticker loop
    this.tickInterval = setInterval(() => this.tick(), this.stepInterval);
  }

  initDOM() {
    this.btnSwitchVllm = document.getElementById('btn-switch-vllm');
    this.btnSwitchOllama = document.getElementById('btn-switch-ollama');
    this.btnTrigger1 = document.getElementById('btn-engine-trigger-1');
    this.btnTrigger3 = document.getElementById('btn-engine-trigger-3');
    this.btnReset = document.getElementById('btn-engine-reset');
    this.btnCloseBranch = document.getElementById('btn-close-branch');

    this.valPipelineStatus = document.getElementById('val-pipeline-status');
    this.valBatch = document.getElementById('val-engine-batch');
    this.valWaiting = document.getElementById('val-engine-waiting');

    this.badgePoolCount = document.getElementById('badge-pool-count');
    this.poolListEl = document.getElementById('engine-pool-list');

    this.labelBatchHeader = document.getElementById('label-batch-header');
    this.badgeBatchActiveCount = document.getElementById('badge-batch-active-count');
    this.batchListEl = document.getElementById('engine-batch-list');
    this.textIterationTicker = document.getElementById('text-iteration-ticker');
    this.valIterationTokensSec = document.getElementById('val-iteration-tokens-sec');

    this.badgeEgressStatus = document.getElementById('badge-egress-status');
    this.textClauseStatus = document.getElementById('text-clause-status');
    this.boxStreamTokens = document.getElementById('box-stream-tokens');
    this.egressPipelinePill = document.getElementById('egress-pipeline-pill');

    this.badgeType = document.getElementById('badge-engine-type');
    this.badgeStatus = document.getElementById('badge-engine-status');
    this.titleSchematic = document.getElementById('title-engine-schematic');
    this.labelMemory = document.getElementById('label-memory-title');
    this.valEfficiency = document.getElementById('val-memory-efficiency');
    this.descMemory = document.getElementById('desc-memory-model');
    this.valFreeBlocks = document.getElementById('val-free-blocks');

    this.metricTtft = document.getElementById('metric-ttft');
    this.metricHol = document.getElementById('metric-hol');
    this.metricFrag = document.getElementById('metric-frag');
    this.metricSla = document.getElementById('metric-sla');
    this.dotIndicator = document.getElementById('dot-engine-indicator');

    if (this.btnSwitchVllm) {
      this.btnSwitchVllm.addEventListener('click', () => this.switchEngine('vllm'));
    }
    if (this.btnSwitchOllama) {
      this.btnSwitchOllama.addEventListener('click', () => this.switchEngine('ollama'));
    }
    if (this.btnTrigger1) {
      this.btnTrigger1.addEventListener('click', () => {
        if (window.lexisSimulation) {
          window.lexisSimulation.triggerBatchRequests(1);
        }
      });
    }
    if (this.btnTrigger3) {
      this.btnTrigger3.addEventListener('click', () => {
        if (window.lexisSimulation) {
          window.lexisSimulation.triggerBatchRequests(3);
        }
      });
    }
    if (this.btnReset) {
      this.btnReset.addEventListener('click', () => this.reset());
    }
    if (this.btnCloseBranch) {
      this.btnCloseBranch.addEventListener('click', () => this.toggleBranch(false));
    }

    const lexisNodeLlm = document.getElementById('lexis-node-llm');
    if (lexisNodeLlm) {
      lexisNodeLlm.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleBranch();
      });
    }
  }

  toggleBranch(forceOpen) {
    const branchEl = document.getElementById('lexis-branch-llm');
    const lexisNodeLlm = document.getElementById('lexis-node-llm');
    if (!branchEl) return;

    const isHidden = branchEl.classList.contains('hidden');
    const shouldOpen = forceOpen !== undefined ? forceOpen : isHidden;

    if (shouldOpen) {
      branchEl.classList.remove('hidden');
      if (lexisNodeLlm) {
        lexisNodeLlm.classList.add('ring-2', 'ring-blue-500/60', 'border-blue-400');
        const badgeText = lexisNodeLlm.querySelector('.inspect-badge-text');
        if (badgeText) badgeText.textContent = 'Branch Active ▲';
      }
    } else {
      branchEl.classList.add('hidden');
      if (lexisNodeLlm) {
        lexisNodeLlm.classList.remove('ring-2', 'ring-blue-500/60', 'border-blue-400');
        const badgeText = lexisNodeLlm.querySelector('.inspect-badge-text');
        if (badgeText) badgeText.textContent = 'Inspect Engine ↓';
      }
    }

    // Immediately trigger synchronous canvas resize and coordinate remeasurement
    if (window.lexisSimulation) {
      window.lexisSimulation.handleResize();
      requestAnimationFrame(() => {
        if (window.lexisSimulation) {
          window.lexisSimulation.measureBaseNodePositions();
        }
      });
    }
  }

  reset() {
    this.iteration = 0;
    this.activeRequests = [];
    this.blocks.forEach((b) => {
      b.ownerId = null;
      b.tokensUsed = 0;
      b.isFragmented = false;
    });
    this.ollamaSlots.forEach((s) => {
      s.activeReqId = null;
    });
    if (this.boxStreamTokens) {
      this.boxStreamTokens.innerHTML = '<em>Awaiting token stream from LLM forward pass...</em>';
    }
    if (this.textClauseStatus) this.textClauseStatus.textContent = 'Idle';
    if (this.egressPipelinePill) this.egressPipelinePill.textContent = 'Standby';

    this.renderBlocksGrid();
    this.renderDOM();
  }

  handleResize() {
    // Compatible stub for diagram resizer
  }

  stepIteration() {
    this.tick();
  }

  switchEngine(engine) {
    if (this.engine === engine) return;
    this.engine = engine;

    if (engine === 'vllm') {
      if (this.btnSwitchVllm) {
        this.btnSwitchVllm.className = 'px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 bg-blue-600 text-white shadow-sm';
      }
      if (this.btnSwitchOllama) {
        this.btnSwitchOllama.className = 'px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 text-zinc-400 hover:text-white hover:bg-[#1a202c]';
      }
      if (this.badgeType) {
        this.badgeType.textContent = 'Continuous Batching & PagedAttention';
        this.badgeType.className = 'px-2 py-0.5 text-[10px] font-mono rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold';
      }
      if (this.titleSchematic) {
        this.titleSchematic.textContent = 'vLLM: Iteration-Level Continuous Batching & Memory Map';
      }
      if (this.labelBatchHeader) {
        this.labelBatchHeader.textContent = 'CONTINUOUS ITERATION BATCH';
        this.labelBatchHeader.className = 'text-[10px] font-mono font-semibold text-blue-400 tracking-wider';
      }
      if (this.labelMemory) {
        this.labelMemory.textContent = 'PagedAttention VRAM Block Table';
      }
      if (this.descMemory) {
        this.descMemory.textContent = 'Block size: 16 tokens • Non-contiguous paging';
      }
      if (this.dotIndicator) {
        this.dotIndicator.className = 'w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse';
      }

      // In vLLM mode: release fragmented reservations and re-evaluate
      this.blocks.forEach((b) => {
        b.isFragmented = false;
      });
      this.ollamaSlots.forEach((s) => (s.activeReqId = null));
      this.schedule();

    } else {
      // Ollama mode
      if (this.btnSwitchOllama) {
        this.btnSwitchOllama.className = 'px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 bg-amber-600 text-white shadow-sm';
      }
      if (this.btnSwitchVllm) {
        this.btnSwitchVllm.className = 'px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 text-zinc-400 hover:text-white hover:bg-[#1a202c]';
      }
      if (this.badgeType) {
        this.badgeType.textContent = 'Fixed Slot Queue (llama.cpp)';
        this.badgeType.className = 'px-2 py-0.5 text-[10px] font-mono rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold';
      }
      if (this.titleSchematic) {
        this.titleSchematic.textContent = 'Ollama: Slot-Bound FIFO Queue & Head-Of-Line Blocking';
      }
      if (this.labelBatchHeader) {
        this.labelBatchHeader.textContent = 'SLOT CONCURRENCY (MAX 2 SLOTS)';
        this.labelBatchHeader.className = 'text-[10px] font-mono font-semibold text-amber-400 tracking-wider';
      }
      if (this.labelMemory) {
        this.labelMemory.textContent = 'Fixed Slot Contiguous VRAM (OLLAMA_NUM_PARALLEL=2)';
      }
      if (this.descMemory) {
        this.descMemory.textContent = 'Pre-allocated contiguous buffers • High unused reserved waste';
      }
      if (this.dotIndicator) {
        this.dotIndicator.className = 'w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse';
      }

      // In Ollama mode: only 2 active slots permitted
      let slotIdx = 0;
      this.activeRequests.forEach((req) => {
        if (req.state === 'running') {
          if (slotIdx < 2) {
            req.slotId = slotIdx;
            this.ollamaSlots[slotIdx].activeReqId = req.id;
            slotIdx++;
          } else {
            req.state = 'waiting';
            req.isBlocked = true;
          }
        }
      });
      this.schedule();
    }

    const nodeEngineBadge = document.getElementById('badge-node-llm-engine');
    if (nodeEngineBadge) {
      if (engine === 'vllm') {
        nodeEngineBadge.textContent = 'vLLM';
        nodeEngineBadge.className = 'px-1.5 py-0.2 bg-blue-500/20 border border-blue-400/40 rounded text-[9px] font-mono text-blue-300 font-semibold';
      } else {
        nodeEngineBadge.textContent = 'Ollama';
        nodeEngineBadge.className = 'px-1.5 py-0.2 bg-amber-500/20 border border-amber-400/40 rounded text-[9px] font-mono text-amber-300 font-semibold';
      }
    }

    this.renderBlocksGrid();
    this.renderDOM();
  }

  receiveRequestFromMain({ reqIndex = 0, onClauseReady = null }) {
    const scenarios = [
      {
        label: 'Grammar Correction',
        prompt: 'Student: "I go to school yesterday and see my teacher."',
        tokens: ['Yesterday', 'I', 'went', 'to', 'school!', 'Remember', 'to', 'use', "'went'", 'for', 'past', 'actions.'],
        color: '#60a5fa',
        colorClass: 'is-active-r1',
        boundaryIndex: 4, // 'school!'
      },
      {
        label: 'Phonics & Pronunciation',
        prompt: 'Student: "How should I pronounce ubiquitous?"',
        tokens: ["'Ubiquitous'", 'is', 'pronounced', '/juːˈbɪk.wɪ.təs/!', 'It', 'means', 'appearing', 'everywhere.'],
        color: '#34d399',
        colorClass: 'is-active-r2',
        boundaryIndex: 3, // '/juːˈbɪk.wɪ.təs/!'
      },
      {
        label: 'Airport Roleplay Scenario',
        prompt: 'Student: "Can I order a hot coffee please?"',
        tokens: ['Welcome', 'to', 'Sky', 'Café!', 'Would', 'you', 'like', 'oat', 'milk', 'or', 'regular', 'cream?'],
        color: '#c084fc',
        colorClass: 'is-active-r3',
        boundaryIndex: 3, // 'Café!'
      },
      {
        label: 'Vocabulary & Nuance',
        prompt: 'Student: "Difference between affect and effect?"',
        tokens: ["'Affect'", 'is', 'a', 'verb!', 'While', "'effect'", 'is', 'a', 'noun', 'result.'],
        color: '#38bdf8',
        colorClass: 'is-active-r4',
        boundaryIndex: 3, // 'verb!'
      },
      {
        label: 'Confidence & Fluency',
        prompt: 'Student: "I feel nervous speaking in meetings."',
        tokens: ['Take', 'a', 'slow', 'breath!', 'Pausing', 'is', 'completely', 'natural.', 'Let', 'us', 'practice.'],
        color: '#fbbf24',
        colorClass: 'is-active-r5',
        boundaryIndex: 3, // 'breath!'
      },
      {
        label: 'Idiom Explanation',
        prompt: 'Student: "What does break a leg mean?"',
        tokens: ["'Break", 'a', "leg'", 'means', 'good', 'luck!', 'Use', 'it', 'before', 'performances.'],
        color: '#f43f5e',
        colorClass: 'is-active-r6',
        boundaryIndex: 5, // 'luck!'
      },
    ];

    const template = scenarios[reqIndex % scenarios.length];
    const reqNumber = this.completedCount + this.activeRequests.length + 1;
    const req = {
      id: `R${reqNumber}`,
      reqIndex: reqIndex,
      label: template.label,
      prompt: template.prompt,
      tokens: template.tokens,
      targetTokens: template.tokens.length,
      currentTokens: 0,
      color: template.color,
      colorClass: template.colorClass,
      boundaryIndex: template.boundaryIndex,
      state: 'waiting', // 'waiting' | 'running' | 'completed'
      isBlocked: false,
      slotId: null,
      onClauseReady: onClauseReady,
      clauseFired: false,
      allocatedBlocks: [],
      createdAt: performance.now(),
    };

    this.activeRequests.push(req);
    this.schedule();
    this.renderDOM();
  }

  schedule() {
    if (this.engine === 'vllm') {
      // vLLM: Iteration-level continuous batching. Up to 4 active sequences concurrently.
      const waiting = this.activeRequests.filter((r) => r.state === 'waiting');

      for (const req of waiting) {
        const currentRunning = this.activeRequests.filter((r) => r.state === 'running').length;
        if (currentRunning >= 4) break; // Concurrency limit per GPU stream

        const freeBlocks = this.blocks.filter((b) => b.ownerId === null);
        if (freeBlocks.length >= 1) {
          req.state = 'running';
          req.isBlocked = false;
          // Claim initial PagedAttention block
          const block = freeBlocks[0];
          block.ownerId = req.id;
          block.tokensUsed = 1;
          block.isFragmented = false;
          req.allocatedBlocks = [block.id];
        }
      }
    } else {
      // Ollama: Fixed slot locking (Max 2 slots).
      this.ollamaSlots.forEach((slot) => {
        if (!slot.activeReqId) {
          const nextWaiting = this.activeRequests.find((r) => r.state === 'waiting');
          if (nextWaiting) {
            slot.activeReqId = nextWaiting.id;
            nextWaiting.slotId = slot.slotId;
            nextWaiting.state = 'running';
            nextWaiting.isBlocked = false;
            nextWaiting.allocatedBlocks = [...slot.reservedBlocks];
            // Reserve 6 contiguous blocks
            slot.reservedBlocks.forEach((bIdx) => {
              const b = this.blocks[bIdx];
              b.ownerId = nextWaiting.id;
              b.tokensUsed = 0;
              b.isFragmented = true; // High contiguous allocation waste
            });
          }
        }
      });

      // Mark all other waiting requests as BLOCKED (HoL)
      this.activeRequests.forEach((req) => {
        if (req.state === 'waiting') {
          req.isBlocked = true;
        }
      });
    }

    this.renderBlocksGrid();
    this.renderDOM();
  }

  tick() {
    const running = this.activeRequests.filter((r) => r.state === 'running');
    if (running.length === 0) return;

    this.iteration++;

    running.forEach((req) => {
      req.currentTokens++;

      if (this.engine === 'vllm') {
        // Dynamic PagedAttention block expansion: each block holds 16 tokens
        const neededBlocks = Math.max(1, Math.ceil(req.currentTokens / 16));
        while (req.allocatedBlocks.length < neededBlocks) {
          const freeBlock = this.blocks.find((b) => b.ownerId === null);
          if (freeBlock) {
            freeBlock.ownerId = req.id;
            freeBlock.tokensUsed = Math.min(16, req.currentTokens - (req.allocatedBlocks.length * 16));
            freeBlock.isFragmented = false;
            req.allocatedBlocks.push(freeBlock.id);
          } else {
            break; // VRAM saturated
          }
        }
        // Update tokens used in last block
        if (req.allocatedBlocks.length > 0) {
          const lastB = this.blocks[req.allocatedBlocks[req.allocatedBlocks.length - 1]];
          if (lastB) lastB.tokensUsed = (req.currentTokens % 16) || 16;
        }
      } else {
        // Ollama: Update tokens within reserved contiguous slot blocks
        const usedBlocksCount = Math.ceil(req.currentTokens / 16);
        const slot = this.ollamaSlots.find((s) => s.slotId === req.slotId);
        if (slot) {
          slot.reservedBlocks.forEach((bIdx, idx) => {
            const b = this.blocks[bIdx];
            if (idx < usedBlocksCount) {
              b.isFragmented = false;
              b.tokensUsed = 16;
            } else {
              b.isFragmented = true; // Wasted reserved padding
              b.tokensUsed = 0;
            }
          });
        }
      }

      // Live Token Stream to Zone 3
      if (req.currentTokens <= req.tokens.length) {
        const word = req.tokens[req.currentTokens - 1];
        const isBoundary = word.endsWith('!') || word.endsWith('.') || word.endsWith('?');
        this.appendStreamedToken(word, isBoundary, req.color);
      }

      // Fast Egress: Check sentence boundary
      if (!req.clauseFired && (req.currentTokens >= req.boundaryIndex || req.currentTokens >= req.targetTokens)) {
        req.clauseFired = true;
        if (typeof req.onClauseReady === 'function') {
          req.onClauseReady();
        }
        this.flashEgressNotification(req);
      }

      // Check Completion
      if (req.currentTokens >= req.targetTokens) {
        req.state = 'completed';
        // Release memory blocks immediately!
        if (this.engine === 'vllm') {
          req.allocatedBlocks.forEach((bIdx) => {
            const b = this.blocks[bIdx];
            if (b) {
              b.ownerId = null;
              b.tokensUsed = 0;
              b.isFragmented = false;
            }
          });
        } else {
          const slot = this.ollamaSlots.find((s) => s.slotId === req.slotId);
          if (slot) {
            slot.activeReqId = null;
            slot.reservedBlocks.forEach((bIdx) => {
              const b = this.blocks[bIdx];
              b.ownerId = null;
              b.tokensUsed = 0;
              b.isFragmented = false;
            });
          }
        }

        // Schedule next waiting request!
        setTimeout(() => {
          this.activeRequests = this.activeRequests.filter((r) => r.id !== req.id);
          this.completedCount++;
          this.schedule();
        }, 500);
      }
    });

    this.renderBlocksGrid();
    this.renderDOM();
  }

  appendStreamedToken(word, isBoundary, color) {
    if (!this.boxStreamTokens) return;

    if (this.boxStreamTokens.querySelector('em')) {
      this.boxStreamTokens.innerHTML = '';
    }

    const span = document.createElement('span');
    span.className = `streamed-token ${isBoundary ? 'is-boundary' : ''}`;
    span.style.color = isBoundary ? '#34d399' : color;
    span.textContent = word + ' ';

    this.boxStreamTokens.appendChild(span);
    this.boxStreamTokens.scrollTop = this.boxStreamTokens.scrollHeight;

    if (this.textClauseStatus) {
      if (isBoundary) {
        this.textClauseStatus.textContent = '✓ Clause Boundary Met!';
        this.textClauseStatus.className = 'text-emerald-400 font-semibold';
      } else {
        this.textClauseStatus.textContent = 'Streaming SSE tokens...';
        this.textClauseStatus.className = 'text-blue-400';
      }
    }
  }

  flashEgressNotification(req) {
    if (this.egressPipelinePill) {
      this.egressPipelinePill.textContent = `Dispatched ${req.id} ➔ TTS`;
      this.egressPipelinePill.className = 'text-emerald-400 font-semibold flex items-center gap-1';
      setTimeout(() => {
        if (this.egressPipelinePill) {
          const running = this.activeRequests.filter((r) => r.state === 'running');
          if (running.length > 0) {
            this.egressPipelinePill.textContent = 'Streaming active';
            this.egressPipelinePill.className = 'text-blue-400';
          } else {
            this.egressPipelinePill.textContent = 'Standby';
            this.egressPipelinePill.className = 'text-zinc-500';
          }
        }
      }, 1500);
    }
  }

  renderDOM() {
    const running = this.activeRequests.filter((r) => r.state === 'running');
    const waiting = this.activeRequests.filter((r) => r.state === 'waiting');

    // Update status counters
    if (this.valBatch) this.valBatch.textContent = `${running.length} in GPU`;
    if (this.valWaiting) this.valWaiting.textContent = `${waiting.length}`;
    if (this.badgePoolCount) this.badgePoolCount.textContent = `${waiting.length} queued`;
    if (this.badgeBatchActiveCount) this.badgeBatchActiveCount.textContent = `${running.length} active`;

    if (this.badgeStatus) {
      if (running.length > 0) {
        this.badgeStatus.textContent = `Forward Pass Active (${running.length})`;
        this.badgeStatus.className = 'text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-medium';
      } else {
        this.badgeStatus.textContent = 'Ready / Synced';
        this.badgeStatus.className = 'text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-medium';
      }
    }

    if (this.textIterationTicker) {
      if (running.length > 0) {
        this.textIterationTicker.textContent = `Forward Pass #${this.iteration}: Tensor-Parallel MatMul`;
      } else {
        this.textIterationTicker.textContent = 'Forward Pass: Standby (Awaiting requests)';
      }
    }

    if (this.valIterationTokensSec) {
      const tokSec = running.length > 0 ? (running.length * 14.5).toFixed(1) : '0';
      this.valIterationTokensSec.textContent = `${tokSec} tok/s`;
    }

    // Render Zone 1: Incoming Pool
    if (this.poolListEl) {
      if (waiting.length === 0) {
        this.poolListEl.innerHTML = `
          <div class="flex flex-col items-center justify-center h-full py-8 text-center text-zinc-500">
            <svg class="w-5 h-5 text-zinc-600 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            <span class="text-[11px] font-mono">Pool Empty</span>
            <span class="text-[9px] text-zinc-600">Requests from Decision flow here</span>
          </div>
        `;
      } else {
        this.poolListEl.innerHTML = waiting
          .map((req) => {
            const isBlockedOllama = this.engine === 'ollama' && req.isBlocked;
            return `
              <div class="engine-pool-card ${isBlockedOllama ? 'is-blocked' : ''}" style="border-left-color: ${req.color}">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-white">${req.id} • ${req.label}</span>
                  ${
                    isBlockedOllama
                      ? '<span class="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded animate-pulse">BLOCKED (HoL)</span>'
                      : '<span class="text-[9px] text-blue-300">Queued</span>'
                  }
                </div>
                <div class="text-[10px] text-zinc-400 truncate mt-0.5">${req.prompt}</div>
                ${
                  isBlockedOllama
                    ? '<div class="text-[9px] text-rose-300 mt-1">⏳ Locked behind Slot 0/1 until completion</div>'
                    : '<div class="text-[9px] text-zinc-500 mt-0.5">Awaiting continuous scheduler admission</div>'
                }
              </div>
            `;
          })
          .join('');
      }
    }

    // Render Zone 2: Continuous Iteration Batch
    if (this.batchListEl) {
      if (running.length === 0) {
        this.batchListEl.innerHTML = `
          <div class="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
            <span class="text-[11px] font-mono">Waiting for inference requests...</span>
            <span class="text-[9px] text-zinc-600 mt-0.5">Click "Send Voice Request" above to test</span>
          </div>
        `;
      } else {
        this.batchListEl.innerHTML = running
          .map((req) => {
            const pct = Math.min(100, Math.round((req.currentTokens / req.targetTokens) * 100));
            const blocksAlloc = req.allocatedBlocks ? req.allocatedBlocks.length : 1;
            const memoryBadge =
              this.engine === 'vllm'
                ? `<span class="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">PagedAttention: ${blocksAlloc} blk (${blocksAlloc * 16} tok)</span>`
                : `<span class="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Slot ${req.slotId} (Locked 4096 tok)</span>`;

            const generatedText = req.tokens.slice(0, req.currentTokens).join(' ');

            return `
              <div class="engine-batch-card" style="border-left-color: ${req.color}">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full" style="background-color: ${req.color}"></span>
                    <span class="text-[11px] font-semibold text-white font-mono">${req.id} • ${req.label}</span>
                  </div>
                  ${memoryBadge}
                </div>

                <div class="engine-progress-bar mb-1.5">
                  <div class="engine-progress-fill" style="width: ${pct}%; background-color: ${req.color}"></div>
                </div>

                <div class="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span>${req.currentTokens} / ${req.targetTokens} tokens (${pct}%)</span>
                  <span class="truncate max-w-[180px] italic text-zinc-300">"${generatedText || 'Generating...'}"</span>
                </div>
              </div>
            `;
          })
          .join('');
      }
    }

    // Telemetry updates
    if (this.engine === 'vllm') {
      const allocated = this.blocks.filter((b) => b.ownerId !== null).length;
      const free = this.totalBlocks - allocated;
      if (this.valFreeBlocks) this.valFreeBlocks.textContent = `${free} free`;
      if (this.valEfficiency) {
        this.valEfficiency.textContent = allocated > 0 ? `${(94 + (allocated % 5)).toFixed(1)}% Utilized` : '96.4% Utilized';
        this.valEfficiency.className = 'text-[11px] font-mono text-emerald-400 font-semibold';
      }
      if (this.metricTtft) {
        this.metricTtft.textContent = '~85ms (Instant Prefill)';
        this.metricTtft.className = 'text-emerald-400 font-semibold';
      }
      if (this.metricHol) {
        this.metricHol.textContent = '0ms (Zero Blocking)';
        this.metricHol.className = 'text-blue-400 font-semibold';
      }
      if (this.metricFrag) {
        this.metricFrag.textContent = '< 3.6% (Near-Zero)';
        this.metricFrag.className = 'text-emerald-400 font-semibold';
      }
      if (this.metricSla) {
        this.metricSla.textContent = 'PASSED (<300ms)';
        this.metricSla.className = 'text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold';
      }
    } else {
      const activeSlots = this.ollamaSlots.filter((s) => s.activeReqId !== null).length;
      const reservedBlocks = activeSlots * 6;
      const free = this.totalBlocks - reservedBlocks;
      const hasBlocked = waiting.some((r) => r.isBlocked);

      if (this.valFreeBlocks) this.valFreeBlocks.textContent = `${free} unallocated (${reservedBlocks} locked)`;
      if (this.valEfficiency) {
        this.valEfficiency.textContent = '27.5% Utilized (72.5% Fragmented Waste)';
        this.valEfficiency.className = 'text-[11px] font-mono text-rose-400 font-semibold';
      }
      if (this.metricTtft) {
        this.metricTtft.textContent = hasBlocked ? '2,800ms - 6,500ms (Queued behind Slot 0)' : '350ms (Slot Available)';
        this.metricTtft.className = hasBlocked ? 'text-rose-400 font-semibold' : 'text-amber-400 font-semibold';
      }
      if (this.metricHol) {
        this.metricHol.textContent = hasBlocked ? `Severe (${waiting.length} locked in queue)` : 'None (Low Load)';
        this.metricHol.className = hasBlocked ? 'text-rose-400 font-semibold' : 'text-zinc-400 font-semibold';
      }
      if (this.metricFrag) {
        this.metricFrag.textContent = '~72.5% (Wasted contiguous padding)';
        this.metricFrag.className = 'text-rose-400 font-semibold';
      }
      if (this.metricSla) {
        this.metricSla.textContent = hasBlocked ? 'FAILED (Speech pauses exceed 300ms)' : 'AT RISK (~320ms)';
        this.metricSla.className = 'text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 font-semibold';
      }
    }
  }

  renderBlocksGrid() {
    const grid = document.getElementById('vram-blocks-grid');
    if (!grid) return;

    grid.innerHTML = '';
    this.blocks.forEach((b) => {
      const cell = document.createElement('div');
      cell.id = `vram-block-${b.id}`;

      if (!b.ownerId) {
        cell.className = 'vram-block-cell is-free';
        cell.textContent = `B${b.id}`;
        cell.title = `Block #${b.id}: Free (Available in GPU pool)`;
      } else if (b.isFragmented) {
        cell.className = 'vram-block-cell is-fragmented';
        cell.textContent = `WASTE`;
        cell.title = `Block #${b.id}: Contiguous slot padding (Unused reserved memory)`;
      } else {
        const req = this.activeRequests.find((r) => r.id === b.ownerId);
        const colorClass = req ? req.colorClass : 'is-active-r1';
        cell.className = `vram-block-cell ${colorClass}`;
        cell.textContent = `${b.ownerId}`;
        cell.title = `Block #${b.id}: Allocated to ${b.ownerId} (${b.tokensUsed}/16 tokens)`;
      }

      grid.appendChild(cell);
    });
  }
}

// Diagram Switching Controller
function initDiagramSwitcher() {
  const select = document.getElementById('diagram-select');
  const viewRunpod = document.getElementById('view-runpod-serverless');
  const viewSlot2 = document.getElementById('view-diagram-slot-2');
  const btnBack = document.getElementById('btn-back-to-runpod');

  function switchDiagram(val) {
    if (val === 'runpod-serverless') {
      viewRunpod.classList.remove('hidden');
      viewSlot2.classList.add('hidden');
      if (select) select.value = 'runpod-serverless';
      if (window.simulation) {
        window.simulation.isPaused = false;
        setTimeout(() => window.simulation.handleResize(), 50);
      }
      if (window.lexisSimulation) {
        window.lexisSimulation.isPaused = true;
      }
    } else if (val === 'diagram-slot-2' || val === 'lexis') {
      viewRunpod.classList.add('hidden');
      viewSlot2.classList.remove('hidden');
      if (select) select.value = 'diagram-slot-2';
      if (window.simulation) {
        window.simulation.isPaused = true;
      }
      if (window.lexisSimulation) {
        window.lexisSimulation.isPaused = false;
        setTimeout(() => {
          window.lexisSimulation.handleResize();
          if (window.llmEngineSimulation) {
            window.llmEngineSimulation.handleResize();
          }
          if (window.lexisSimulation.particles.length === 0) {
            window.lexisSimulation.triggerBatchRequests(5);
          }
        }, 50);
      }
    }
  }

  if (select) {
    select.addEventListener('change', (e) => switchDiagram(e.target.value));
  }
  if (btnBack) {
    btnBack.addEventListener('click', () => switchDiagram('runpod-serverless'));
  }

  // Support ?diagram= URL param
  const params = new URLSearchParams(window.location.search);
  const diagramParam = params.get('diagram');
  if (diagramParam) {
    switchDiagram(diagramParam);
  }
}

// Bootstrap on DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
  window.simulation = new ServerlessSimulation();
  window.lexisSimulation = new LexisArchitectureSimulation();
  window.llmEngineSimulation = new LLMEngineDeepDiveSimulation();
  initDiagramSwitcher();

  const params = new URLSearchParams(window.location.search);
  const autostart = parseInt(params.get('autostart'), 10);
  const simtime = parseFloat(params.get('simtime') || '0');
  const stephop = parseInt(params.get('stephop'), 10);
  const autoturn = parseInt(params.get('autoturn'), 10);
  const diagramParam = params.get('diagram');
  const engineParam = params.get('engine');

  if (engineParam && (engineParam === 'ollama' || engineParam === 'vllm')) {
    window.llmEngineSimulation.switchEngine(engineParam);
  }

  if (!isNaN(autostart) && autostart > 0) {
    window.simulation.queuedCount += autostart;
    window.simulation.updateLabels();

    if (simtime > 0) {
      const step = 0.1;
      const count = Math.floor(simtime / step);
      for (let s = 0; s < count; s++) {
        window.simulation.updateSimulation(step);
        window.simulation.history.push({
          activeWorkers: window.simulation.getActiveWorkerCount(),
          processing: window.simulation.getRunningWorkerCount(),
          queued: window.simulation.queuedCount,
        });
      }
      window.simulation.renderWorkerCards();
      window.simulation.updateLabels();
    }
  }

  if (diagramParam === 'diagram-slot-2' || diagramParam === 'lexis') {
    if (params.get('dragtest') === '1') {
      setTimeout(() => {
        const elStt = document.getElementById('lexis-node-stt');
        const elTts = document.getElementById('lexis-node-tts');
        if (elStt && window.lexisSimulation) {
          window.lexisSimulation.nodeOffsets['stt'] = { x: 50, y: -70 };
          elStt.style.transform = 'translate(50px, -70px)';
        }
        if (elTts && window.lexisSimulation) {
          window.lexisSimulation.nodeOffsets['tts'] = { x: -50, y: -70 };
          elTts.style.transform = 'translate(-50px, -70px)';
        }
        if (window.lexisSimulation) {
          window.lexisSimulation.updateNodePositions();
        }
      }, 50);
    }

    if (!isNaN(stephop) && stephop > 0) {
      for (let i = 0; i < stephop; i++) {
        window.lexisSimulation.triggerStepHop();
      }
    } else if (!isNaN(autoturn) && autoturn > 0) {
      window.lexisSimulation.triggerBatchRequests(autoturn);
    } else {
      setTimeout(() => {
        if (window.lexisSimulation && window.lexisSimulation.particles.length === 0) {
          window.lexisSimulation.triggerBatchRequests(5);
        }
      }, 100);
    }

    const mockreq = parseInt(params.get('mockreq'), 10);
    if (!isNaN(mockreq) && mockreq > 0) {
      for (let i = 0; i < mockreq; i++) {
        window.llmEngineSimulation.receiveRequestFromMain({ reqIndex: i });
      }
    }

    const enginesteps = parseInt(params.get('enginesteps'), 10);
    if (!isNaN(enginesteps) && enginesteps > 0) {
      for (let s = 0; s < enginesteps; s++) {
        window.llmEngineSimulation.stepIteration();
      }
    }

    if (params.get('branch') === '1' || engineParam) {
      window.llmEngineSimulation.toggleBranch(true);
    }

    const toggletest = parseInt(params.get('toggletest'), 10);
    if (!isNaN(toggletest) && toggletest > 0) {
      for (let t = 0; t < toggletest; t++) {
        window.llmEngineSimulation.toggleBranch(t % 2 === 0);
      }
    }
  }
});


