/**
 * RunPod Serverless Architecture Simulation Engine (UMD-Lite)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../../core/registry.js'),
      require('./template.js')
    );
  } else {
    const exports = factory(root.DiagramRegistry, root.RunPodTemplate);
    root.ServerlessSimulation = exports.ServerlessSimulation;
  }
})(typeof self !== 'undefined' ? self : this, function (DiagramRegistry, RunPodTemplate) {
  'use strict';

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

  // Register with DiagramRegistry if available
  if (DiagramRegistry && typeof DiagramRegistry.register === 'function') {
    DiagramRegistry.register({
      id: 'runpod-serverless',
      aliases: ['runpod'],
      label: '1. RunPod: Serverless GPU & Auto-Scaling',
      defaultSelected: false,
      mount(viewport) {
        if (RunPodTemplate && typeof RunPodTemplate.mount === 'function') {
          RunPodTemplate.mount(viewport);
        }
      },
      init() {
        if (typeof window !== 'undefined') {
          window.simulation = new ServerlessSimulation();
        }
      },
      activate() {
        if (typeof window !== 'undefined' && window.simulation) {
          window.simulation.isPaused = false;
          setTimeout(() => {
            if (window.simulation && typeof window.simulation.handleResize === 'function') {
              window.simulation.handleResize();
            }
          }, 50);
        }
      },
      deactivate() {
        if (typeof window !== 'undefined' && window.simulation) {
          window.simulation.isPaused = true;
        }
      },
      resize() {
        if (typeof window !== 'undefined' && window.simulation && typeof window.simulation.handleResize === 'function') {
          window.simulation.handleResize();
        }
      },
      handleUrlParams(params) {
        if (typeof window === 'undefined' || !window.simulation || !params) return;
        const autostart = parseInt(params.get('autostart'), 10);
        const simtime = parseFloat(params.get('simtime') || '0');

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
      }
    });
  }

  return {
    ServerlessSimulation
  };
});
