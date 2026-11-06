/**
 * ESPP Full Microservice Architecture Simulation Engine (UMD-Lite)
 * Architecture Visualizer Hub (Diagram 3)
 * Redesigned to match the hand-drawn architecture topology and adaptive-context card styling
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    let DiagramRegistry;
    let FullArchTemplate;
    let Routes;
    let Scenarios;
    try { DiagramRegistry = require('../../core/registry.js'); } catch (e) {}
    try { FullArchTemplate = require('./template.js'); } catch (e) {}
    try { Routes = require('./routes.js'); } catch (e) {}
    try { Scenarios = require('./scenarios.js'); } catch (e) {}
    if (typeof globalThis !== 'undefined' && globalThis.DiagramRegistry && !DiagramRegistry) {
      DiagramRegistry = globalThis.DiagramRegistry;
    }
    const exported = factory(DiagramRegistry, FullArchTemplate, Routes, Scenarios);
    module.exports = exported;
    module.exports.FullArchitectureSimulation = exported.FullArchitectureSimulation;
    module.exports.default = exported;
  } else {
    const exports = factory(root.DiagramRegistry, root.FullArchTemplate, root.FullArchRoutes, root.FullArchScenarios);
    root.FullArchitectureSimulation = exports.FullArchitectureSimulation;
  }
})(typeof self !== 'undefined' ? self : this, function (DiagramRegistry, FullArchTemplate, Routes, Scenarios) {
  'use strict';

  const SCENARIOS = Scenarios.SCENARIOS;
  const CONNECTIONS = Routes.ROUTES.map((r) => [r.a, r.b]);
  const HOP_MS = 1150;
  const PLAY_GAP_MS = 350;

  class FullArchitectureSimulation {
    constructor(options = {}) {
      this.options = options;
      this.headless = Boolean(options.headless);
      this.scenarios = SCENARIOS;
      this.connections = CONNECTIONS;
      this.paths = CONNECTIONS.map(([from, to]) => ({ id: `path-${from}-${to}`, from, to }));
      this.state = {
        activeCaseId: 'case-1',
        stepIndex: 0,
        isPlaying: false,
        timerId: null,
        audioChunksCount: 0,
        r2Uploaded: false,
        is100View: false,
        batchSize: 1,
        isBatchRunning: false
      };
      this.boundHandlers = {};
      this._activeMvcTimeouts = [];
      this._playToken = 0;
      this._playRun = 0;
      this._stepPromise = null;
    }

    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    getHops(step) {
      return [step.source, ...(step.via || []), step.target]
        .filter((id, i, arr) => i === 0 || id !== arr[i - 1]);
    }

    getRoute(srcId, tgtId, gRect) {
      const found = Routes.findRoute(srcId, tgtId);
      if (!found) return null;
      if (typeof document === 'undefined') return null;
      const aEl = document.getElementById(`node-${found.route.a}`);
      const bEl = document.getElementById(`node-${found.route.b}`);
      if (!aEl || !bEl) return null;
      const toRect = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left - gRect.left, top: r.top - gRect.top, right: r.right - gRect.left, bottom: r.bottom - gRect.top };
      };
      const built = Routes.buildRoute(found.route, toRect(aEl), toRect(bEl));
      return { built, d: found.forward ? built.d : built.dReverse };
    }

    generateSquaredPath(x1, y1, x2, y2, mid, orientation = 'vertical') {
      if (y1 === y2) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      }
      if (x1 === x2) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      }
      if (orientation === 'horizontal') {
        const xMid = typeof mid === 'number' ? mid : Math.round((x1 + x2) / 2);
        return `M ${x1} ${y1} L ${xMid} ${y1} L ${xMid} ${y2} L ${x2} ${y2}`;
      }
      const yMid = typeof mid === 'number' ? mid : Math.round((y1 + y2) / 2);
      return `M ${x1} ${y1} L ${x1} ${yMid} L ${x2} ${yMid} L ${x2} ${y2}`;
    }

    getShortProtocolLabel(step) {
      if (!step) return 'REQ';
      const proto = (step.protocol || '').toUpperCase();
      const method = (step.method || '').toUpperCase();

      if (proto.includes('JWT') || method.includes('JWT') || proto.includes('OIDC')) return 'JWT';
      if (proto.includes('WEBSOCKET') || proto.includes('WS')) return 'WS';
      if (proto.includes('GRPC')) return 'gRPC';
      if (proto.includes('RESP')) return 'RESP';
      if (proto.includes('S3') || proto.includes('R2')) return 'S3';
      if (proto.includes('AMQP')) return 'AMQP';
      if (proto.includes('POSTGRES') || proto.includes('SQL')) return 'SQL';
      if (proto.includes('IN-MEMORY') || method.includes('REMUX')) return 'REMUX';
      if (proto.includes('HTTP/2')) return 'HTTP/2';
      if (proto.includes('HTTPS')) return 'HTTPS';
      if (proto.includes('REST')) return 'REST';
      if (proto.includes('INTERNAL FSM') || method.includes('FSM')) return 'FSM';
      return proto.slice(0, 6) || 'REQ';
    }

    init() {
      if (this.headless || typeof document === 'undefined') {
        return this;
      }
      if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        try {
          lucide.createIcons();
        } catch (e) {}
      }
      this.bindDomEvents();
      if (typeof window !== 'undefined' && window.location) {
        try {
          const params = new URLSearchParams(window.location.search);
          if (params.get('zoom') === '100' || params.get('view') === '100') {
            this.toggleZoom();
          }
        } catch (e) {}
      }
      this.drawConnectionPaths();
      this.renderCurrentState();
      return this;
    }

    bindEvents() {
      this.bindDomEvents();
    }

    bindDomEvents() {
      const caseSelect = document.getElementById('use-case-select');
      if (caseSelect) {
        caseSelect.addEventListener('change', (e) => {
          this.setCase(e.target.value);
        });
      }

      const playScenarioBtn = document.getElementById('btn-arch-play-scenario');
      if (playScenarioBtn) {
        playScenarioBtn.addEventListener('click', () => {
          this.togglePlayScenario();
        });
      }

      const zoomBtn = document.getElementById('btn-arch-zoom');
      if (zoomBtn) {
        zoomBtn.addEventListener('click', () => {
          this.toggleZoom();
        });
      }

      const sendReqBtn = document.getElementById('btn-arch-send-request');
      if (sendReqBtn) {
        sendReqBtn.addEventListener('click', () => {
          this.sendRequest();
        });
      }

      const toggleBatchBtn = document.getElementById('btn-arch-toggle-batch');
      const dropdownBatch = document.getElementById('dropdown-arch-batch');
      if (toggleBatchBtn && dropdownBatch) {
        toggleBatchBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdownBatch.classList.toggle('hidden');
        });
      }

      const batchItems = document.querySelectorAll('.dropdown-batch-item');
      batchItems.forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const count = parseInt(e.currentTarget.getAttribute('data-count'), 10) || 1;
          this.setBatchSize(count);
          if (dropdownBatch) dropdownBatch.classList.add('hidden');
        });
      });

      const resetBtn = document.getElementById('btn-arch-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.reset();
        });
      }

      this.boundHandlers.documentClick = () => {
        if (dropdownBatch && !dropdownBatch.classList.contains('hidden')) {
          dropdownBatch.classList.add('hidden');
        }
      };
      document.addEventListener('click', this.boundHandlers.documentClick);

      this.boundHandlers.keydown = (e) => {
        if (e.key === 'Escape' && this.state.is100View) {
          this.toggleZoom();
        }
      };
      document.addEventListener('keydown', this.boundHandlers.keydown);

      this.boundHandlers.resize = () => {
        this.resize();
      };
      window.addEventListener('resize', this.boundHandlers.resize);
    }

    setCase(caseId) {
      if (this.state.activeCaseId !== caseId) {
        this.pause();
        this.cancelPlayback();
        this.state.activeCaseId = caseId;
        this.state.stepIndex = 0;
        this.clearMvcAnimations();
        this.renderCurrentState();
      }
    }

    stepNext() {
      const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
      const maxSteps = currentCase.steps.length;

      if (this.state.stepIndex >= maxSteps - 1) {
        this.state.stepIndex = 0;
      } else {
        this.state.stepIndex += 1;
      }

      if (this.state.activeCaseId === 'case-2') {
        this.state.audioChunksCount = 14 + (this.state.stepIndex * 2);
      } else if (this.state.activeCaseId === 'case-4') {
        if (this.state.stepIndex >= 3) {
          this.state.audioChunksCount = 0;
          this.state.r2Uploaded = true;
        } else {
          this.state.audioChunksCount = 48;
          this.state.r2Uploaded = false;
        }
      }

      if (!this.headless && typeof document !== 'undefined') {
        this.renderCurrentState();
        this.cancelPlayback();
        this.executeStep(currentCase.steps[this.state.stepIndex]);
      }

      return currentCase.steps[this.state.stepIndex];
    }

    executeStep(step) {
      if (this.headless || typeof document === 'undefined') return;
      if (!step) {
        const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
        step = currentCase.steps[this.state.stepIndex];
      }
      if (!step) return;

      const highlightClass = this.state.activeCaseId === 'case-3'
        ? 'node-active-purple'
        : (this.state.activeCaseId === 'case-4' ? 'node-active-amber' : 'node-active-cyan');

      const token = this._playToken;
      this._stepPromise = Promise.resolve(this.animateServiceMvcCycle(step.source))
        .then(() => {
          if (token !== this._playToken) return undefined;
          return this.playStep(step, highlightClass);
        });
      return this._stepPromise;
    }

    cancelPlayback() {
      this._playToken += 1;
    }

    pulseNode(nodeId) {
      if (typeof document === 'undefined') return;
      const el = document.getElementById(`node-${nodeId}`);
      if (!el) return;
      el.classList.add('node-active');
      setTimeout(() => el.classList.remove('node-active'), 300);
    }

    renderResponsePhase(step) {
      if (this.headless || typeof document === 'undefined' || !step.response) return;
      const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
      const caseLabel = document.getElementById('telemetry-case-label');
      const descLabel = document.getElementById('telemetry-desc-label');
      const payloadEl = document.getElementById('telemetry-payload');
      const protoEl = document.getElementById('metric-protocol');
      const latencyEl = document.getElementById('metric-latency');
      if (caseLabel) caseLabel.textContent = `${currentCase.title.toUpperCase()} · STEP ${this.state.stepIndex + 1}/${currentCase.steps.length} · RESPONSE`;
      if (descLabel) descLabel.textContent = step.response.desc;
      if (payloadEl) payloadEl.textContent = step.response.payload;
      if (protoEl) protoEl.textContent = `${step.protocol} (response)`;
      if (latencyEl) latencyEl.textContent = step.response.latency;
    }

    async playStep(step, highlightClass) {
      if (this.headless || typeof document === 'undefined' || !step) return;
      const token = this._playToken;
      const hops = this.getHops(step);

      if (hops.length === 1) {
        this.pulseNode(hops[0]);
        await this.sleep(HOP_MS);
        if (token !== this._playToken) return;
      } else {
        for (let i = 0; i < hops.length - 1; i++) {
          this.highlightPath(hops[i], hops[i + 1], highlightClass);
          this.emitPacket(hops[i], hops[i + 1], highlightClass, step.label);
          await this.sleep(HOP_MS);
          if (token !== this._playToken) return;
          this.pulseNode(hops[i + 1]);
        }
      }

      if (!step.response) return;
      this.renderResponsePhase(step);
      if (hops.length === 1) {
        this.pulseNode(hops[0]);
        await this.sleep(HOP_MS);
        if (token !== this._playToken) return;
      } else {
        for (let i = hops.length - 1; i > 0; i--) {
          this.highlightPath(hops[i], hops[i - 1], highlightClass);
          this.emitPacket(hops[i], hops[i - 1], highlightClass, step.response.label, true);
          await this.sleep(HOP_MS);
          if (token !== this._playToken) return;
          this.pulseNode(hops[i - 1]);
        }
      }
    }

    togglePlayScenario() {
      if (this.state.isPlaying) {
        this.pause();
      } else {
        this.play();
      }
    }

    play() {
      this.state.isPlaying = true;
      this.updatePlayPauseIcons();
      if (this.headless || typeof document === 'undefined') return;
      const runId = ++this._playRun;
      const loop = async () => {
        let first = true;
        while (this.state.isPlaying && runId === this._playRun) {
          if (first) {
            this.cancelPlayback();
            this.renderCurrentState();
            this.executeStep();
          } else {
            this.stepNext();
          }
          first = false;
          await this._stepPromise;
          await this.sleep(PLAY_GAP_MS);
        }
      };
      loop();
    }

    pause() {
      this.state.isPlaying = false;
      this._playRun += 1;
      this.cancelPlayback();
      this.updatePlayPauseIcons();
    }

    toggleZoom() {
      this.state.is100View = !this.state.is100View;
      if (!this.headless && typeof document !== 'undefined') {
        const viewport = document.getElementById('view-full-architecture');
        const zoomBtn = document.getElementById('btn-arch-zoom');
        const zoomLabel = document.getElementById('label-arch-zoom');
        if (viewport) {
          viewport.classList.toggle('view-100', this.state.is100View);
        }
        if (zoomBtn) {
          zoomBtn.classList.toggle('active', this.state.is100View);
        }
        if (zoomLabel) {
          zoomLabel.textContent = this.state.is100View ? 'Fit Screen' : '100% View';
        }
        this.drawConnectionPaths();
        this.renderCurrentState();
        if (typeof requestAnimationFrame === 'function') {
          requestAnimationFrame(() => this.drawConnectionPaths());
        }
      }
      return this.state.is100View;
    }

    setBatchSize(count) {
      this.state.batchSize = count;
      if (!this.headless && typeof document !== 'undefined') {
        const label = document.getElementById('label-arch-send-count');
        if (label) {
          label.textContent = count === 1 ? 'Send Request' : `Send ${count} Requests`;
        }
        document.querySelectorAll('.dropdown-batch-item').forEach((item) => {
          const c = parseInt(item.getAttribute('data-count'), 10) || 1;
          if (c === count) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      }
      return this.state.batchSize;
    }

    clearMvcAnimations() {
      if (this._activeMvcTimeouts) {
        this._activeMvcTimeouts.forEach((tid) => clearTimeout(tid));
        this._activeMvcTimeouts = [];
      }
      if (!this.headless && typeof document !== 'undefined') {
        const packetsGroup = document.getElementById('svg-packets-group');
        if (packetsGroup) {
          packetsGroup.innerHTML = '';
        }
      }
    }

    animateServiceMvcCycle(nodeId, callback) {
      if (this.headless || typeof document === 'undefined') {
        if (typeof callback === 'function') callback();
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        const nodeEl = document.getElementById(`node-${nodeId}`);
        if (nodeEl) {
          nodeEl.classList.add('node-active-cyan');
          const t = setTimeout(() => {
            nodeEl.classList.remove('node-active-cyan');
            if (typeof callback === 'function') callback();
            resolve();
          }, 350);
          this._activeMvcTimeouts = this._activeMvcTimeouts || [];
          this._activeMvcTimeouts.push(t);
        } else {
          if (typeof callback === 'function') callback();
          resolve();
        }
      });
    }

    emitPacket(srcId, tgtId, colorClass, label, isResponse = false) {
      if (this.headless || typeof document === 'undefined') return;
      const packetsGroup = document.getElementById('svg-packets-group');
      const grid = document.getElementById('full-arch-grid');
      if (!packetsGroup || !grid) return;

      const gridRect = grid.getBoundingClientRect();
      const route = this.getRoute(srcId, tgtId, gridRect);
      if (!route) return;
      const pathD = route.d;

      let packetClass = 'packet-dot';
      let fillColor = '#38bdf8';
      if (colorClass === 'node-active-purple') {
        packetClass = 'packet-dot packet-dot-purple';
        fillColor = '#c084fc';
      } else if (colorClass === 'node-active-amber') {
        packetClass = 'packet-dot packet-dot-orange';
        fillColor = '#fb923c';
      } else if (colorClass === 'node-active-emerald') {
        packetClass = 'packet-dot packet-dot-emerald';
        fillColor = '#34d399';
      }

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', isResponse ? 'moving-packet moving-packet-response' : 'moving-packet');
      group.setAttribute('style', `color: ${fillColor}`);

      const dotGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      anim.setAttribute('path', pathD);
      anim.setAttribute('dur', '1.1s');
      anim.setAttribute('repeatCount', '1');
      anim.setAttribute('fill', 'freeze');
      dotGroup.appendChild(anim);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '5');
      circle.setAttribute('class', packetClass);
      circle.setAttribute('fill', fillColor);
      dotGroup.appendChild(circle);
      group.appendChild(dotGroup);

      let shortLabel = label;
      if (!shortLabel && this.state) {
        const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
        const step = currentCase?.steps?.[this.state.stepIndex];
        if (step) {
          shortLabel = step.label || this.getShortProtocolLabel(step);
        }
      }

      if (shortLabel) {
        const textWidth = Math.max(20, Math.round(shortLabel.length * 6.0));
        const pillWidth = textWidth + 8;

        const textRects = [];
        const nodeEls = document.querySelectorAll('.service-node[data-node]');
        nodeEls.forEach((el) => {
          const tEls = el.querySelectorAll('.node-title, .node-subtitle, .node-desc, .node-port, .badge-protocol');
          tEls.forEach((t) => {
            const tr = t.getBoundingClientRect();
            textRects.push({
              left: tr.left - gridRect.left,
              top: tr.top - gridRect.top,
              right: tr.right - gridRect.left,
              bottom: tr.bottom - gridRect.top
            });
          });
        });

        const pts = (route.d === route.built.d) ? route.built.points : route.built.points.slice().reverse();
        const placement = Routes.findLabelPlacement
          ? Routes.findLabelPlacement(pts, pillWidth, 15, textRects)
          : null;

        const pillLeft = placement ? placement.pill.left : 8;
        const pillTop = placement ? placement.pill.top : -12;
        const textX = placement ? placement.x : 8 + pillWidth / 2;
        const textY = placement ? placement.y : -4.5;

        const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        labelGroup.setAttribute('class', 'packet-label-group');

        const pill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        pill.setAttribute('class', 'packet-label-pill');
        pill.setAttribute('x', String(pillLeft));
        pill.setAttribute('y', String(pillTop));
        pill.setAttribute('width', String(pillWidth));
        pill.setAttribute('height', '15');
        pill.setAttribute('rx', '3');
        pill.setAttribute('ry', '3');
        labelGroup.appendChild(pill);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'packet-label-text');
        text.setAttribute('x', String(textX));
        text.setAttribute('y', String(textY));
        text.textContent = shortLabel;
        labelGroup.appendChild(text);

        group.appendChild(labelGroup);
      }

      packetsGroup.appendChild(group);

      if (typeof anim.beginElement === 'function') {
        try { anim.beginElement(); } catch (e) {}
      }

      setTimeout(() => {
        try { group.remove(); } catch (e) {}
      }, 1200);
    }

    async sendRequest(count) {
      if (this.state.isBatchRunning) return;
      const numRequests = typeof count === 'number' ? count : (this.state.batchSize || 1);
      this.pause();

      if (this.headless || typeof document === 'undefined') {
        const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
        this.state.stepIndex = Math.max(0, currentCase.steps.length - 1);
        return;
      }

      this.state.isBatchRunning = true;

      const sendBtn = document.getElementById('btn-arch-send-request');
      const labelEl = document.getElementById('label-arch-send-count');
      if (sendBtn) sendBtn.classList.add('sending');

      const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
      const totalSteps = currentCase.steps.length;

      try {
        for (let req = 1; req <= numRequests; req++) {
          if (!this.state.isBatchRunning) break;
          if (labelEl) {
            labelEl.textContent = numRequests > 1 ? `Req ${req}/${numRequests}` : 'Processing...';
          }

          for (let sIdx = 0; sIdx < totalSteps; sIdx++) {
            if (!this.state.isBatchRunning) break;
            this.state.stepIndex = sIdx;
            const step = currentCase.steps[sIdx];

            if (this.state.activeCaseId === 'case-2') {
              this.state.audioChunksCount = 14 + (sIdx * 2);
            } else if (this.state.activeCaseId === 'case-4') {
              if (sIdx >= 3) {
                this.state.audioChunksCount = 0;
                this.state.r2Uploaded = true;
              } else {
                this.state.audioChunksCount = 48;
                this.state.r2Uploaded = false;
              }
            }

            this.renderCurrentState();

            const highlightClass = this.state.activeCaseId === 'case-3'
              ? 'node-active-purple'
              : (this.state.activeCaseId === 'case-4' ? 'node-active-amber' : 'node-active-cyan');

            await this.animateServiceMvcCycle(step.source);
            if (!this.state.isBatchRunning) break;

            await this.playStep(step, highlightClass);
            if (!this.state.isBatchRunning) break;

            await this.sleep(150);
          }

          if (req < numRequests && this.state.isBatchRunning) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      } finally {
        this.state.isBatchRunning = false;
        if (sendBtn) sendBtn.classList.remove('sending');
        if (labelEl) {
          labelEl.textContent = this.state.batchSize === 1 ? 'Send Request' : `Send ${this.state.batchSize} Requests`;
        }
      }
    }

    reset() {
      this.pause();
      this.cancelPlayback();
      this.state.isBatchRunning = false;
      this.clearMvcAnimations();
      this.state.stepIndex = 0;
      this.state.audioChunksCount = 0;
      this.state.r2Uploaded = false;
      if (!this.headless && typeof document !== 'undefined') {
        const sendBtn = document.getElementById('btn-arch-send-request');
        const labelEl = document.getElementById('label-arch-send-count');
        if (sendBtn) sendBtn.classList.remove('sending');
        if (labelEl) {
          labelEl.textContent = this.state.batchSize === 1 ? 'Send Request' : `Send ${this.state.batchSize} Requests`;
        }
        this.updatePlayPauseIcons();
        this.renderCurrentState();
      }
    }

    updatePlayPauseIcons() {
      if (this.headless || typeof document === 'undefined') return;

      const scenarioBtn = document.getElementById('btn-arch-play-scenario');
      const labelPlay = document.getElementById('label-arch-play');
      if (scenarioBtn) {
        if (this.state.isPlaying) {
          scenarioBtn.classList.add('playing');
          if (labelPlay) {
            labelPlay.textContent = '⏸ Pause';
          } else {
            scenarioBtn.textContent = '⏸ Pause';
          }
        } else {
          scenarioBtn.classList.remove('playing');
          if (labelPlay) {
            labelPlay.textContent = '▶ Play Scenario';
          } else {
            scenarioBtn.textContent = '▶ Play Scenario';
          }
        }
      }
    }

    renderCurrentState() {
      if (this.headless || typeof document === 'undefined') return;

      const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
      const step = currentCase.steps[this.state.stepIndex];
      if (!step) return;

      const caseLabel = document.getElementById('telemetry-case-label');
      const descLabel = document.getElementById('telemetry-desc-label');
      const payloadEl = document.getElementById('telemetry-payload');
      const protoEl = document.getElementById('metric-protocol');
      const latencyEl = document.getElementById('metric-latency');

      if (caseLabel) caseLabel.textContent = `${currentCase.title.toUpperCase()} · STEP ${this.state.stepIndex + 1}/${currentCase.steps.length}`;
      if (descLabel) descLabel.textContent = step.desc;
      if (payloadEl) payloadEl.textContent = step.payload;
      if (protoEl) protoEl.textContent = step.protocol;
      if (latencyEl) latencyEl.textContent = step.latency;

      const audioLabel = document.getElementById('label-audio-chunks');
      const r2Badge = document.getElementById('badge-r2-status');

      if (audioLabel) {
        audioLabel.textContent = `Buffer: ${this.state.audioChunksCount} chunks`;
      }

      if (r2Badge) {
        if (this.state.r2Uploaded || (this.state.activeCaseId === 'case-4' && this.state.stepIndex >= 3)) {
          r2Badge.textContent = '● Verified .m4a';
          r2Badge.classList.add('uploaded');
        } else {
          r2Badge.textContent = 'Standby';
          r2Badge.classList.remove('uploaded');
        }
      }

      document.querySelectorAll('.service-node').forEach((node) => {
        node.classList.remove('node-active-amber', 'node-active-emerald', 'node-active-purple', 'node-active-cyan', 'node-active-blue');
      });

      const srcNode = document.getElementById(`node-${step.source}`);
      const tgtNode = document.getElementById(`node-${step.target}`);

      const highlightClass = this.state.activeCaseId === 'case-3'
        ? 'node-active-purple'
        : (this.state.activeCaseId === 'case-4' ? 'node-active-amber' : 'node-active-cyan');

      if (srcNode) srcNode.classList.add(highlightClass);
      if (tgtNode) tgtNode.classList.add(highlightClass);

      this.highlightPath(step.source, step.target, highlightClass);
    }

    drawConnectionPaths() {
      if (this.headless || typeof document === 'undefined') return;

      const svgGroup = document.getElementById('svg-paths-group');
      const grid = document.getElementById('full-arch-grid');
      if (!svgGroup || !grid) return;

      svgGroup.innerHTML = '';
      const gridRect = grid.getBoundingClientRect();

      // Sort connections so bus trunk paths are rendered first (in background)
      const sortedConns = [...this.connections].sort(([a1, b1], [a2, b2]) => {
        const r1 = Routes.findRoute(a1, b1)?.route;
        const r2 = Routes.findRoute(a2, b2)?.route;
        const b1Bus = r1?.bus ? 0 : 1;
        const b2Bus = r2?.bus ? 0 : 1;
        return b1Bus - b2Bus;
      });

      sortedConns.forEach(([srcId, tgtId]) => {
        const found = Routes.findRoute(srcId, tgtId);
        if (!found) return;
        const routeObj = found.route;
        const route = this.getRoute(srcId, tgtId, gridRect);
        if (!route) return;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', `path-${srcId}-${tgtId}`);
        path.setAttribute('data-connection', `${srcId}-${tgtId}`);
        path.setAttribute('data-id-alt', `path-${tgtId}-${srcId}`);

        const isBus = Boolean(routeObj.bus);
        path.setAttribute('class', isBus ? 'arch-path arch-path-bus' : 'arch-path');
        path.setAttribute('d', route.built.d);

        if (isBus) {
          if (routeObj.dir === 'publish') {
            path.setAttribute('marker-end', 'url(#arrow-default)');
          } else if (routeObj.dir === 'consume') {
            path.setAttribute('marker-start', 'url(#arrow-default-start)');
          } else {
            path.setAttribute('marker-start', 'url(#arrow-default-start)');
            path.setAttribute('marker-end', 'url(#arrow-default)');
          }
        } else {
          path.setAttribute('marker-start', 'url(#arrow-default-start)');
          path.setAttribute('marker-end', 'url(#arrow-default)');
        }

        svgGroup.appendChild(path);
      });
    }

    highlightPath(srcId, tgtId, colorClass) {
      if (this.headless || typeof document === 'undefined') return;

      document.querySelectorAll('.arch-path').forEach((p) => {
        p.classList.remove('arch-path-active', 'arch-path-purple', 'arch-path-orange', 'arch-path-emerald');
        const conn = p.getAttribute('data-connection');
        if (conn) {
          const [a, b] = conn.split('-');
          const rObj = Routes.findRoute(a, b)?.route;
          if (rObj?.bus) {
            if (rObj.dir === 'publish') {
              p.removeAttribute('marker-start');
              p.setAttribute('marker-end', 'url(#arrow-default)');
            } else if (rObj.dir === 'consume') {
              p.setAttribute('marker-start', 'url(#arrow-default-start)');
              p.removeAttribute('marker-end');
            } else {
              p.setAttribute('marker-start', 'url(#arrow-default-start)');
              p.setAttribute('marker-end', 'url(#arrow-default)');
            }
          } else {
            p.setAttribute('marker-start', 'url(#arrow-default-start)');
            p.setAttribute('marker-end', 'url(#arrow-default)');
          }
        } else {
          p.setAttribute('marker-start', 'url(#arrow-default-start)');
          p.setAttribute('marker-end', 'url(#arrow-default)');
        }
      });

      let path = document.getElementById(`path-${srcId}-${tgtId}`) ||
                 document.getElementById(`path-${tgtId}-${srcId}`) ||
                 document.querySelector(`[data-id-alt="path-${srcId}-${tgtId}"]`) ||
                 document.querySelector(`[data-connection="${srcId}-${tgtId}"]`) ||
                 document.querySelector(`[data-connection="${tgtId}-${srcId}"]`);

      if (path) {
        path.classList.add('arch-path-active');
        if (colorClass === 'node-active-purple') {
          path.classList.add('arch-path-purple');
          path.setAttribute('marker-start', 'url(#arrow-purple-start)');
          path.setAttribute('marker-end', 'url(#arrow-purple)');
        } else if (colorClass === 'node-active-amber') {
          path.classList.add('arch-path-orange');
          path.setAttribute('marker-start', 'url(#arrow-orange-start)');
          path.setAttribute('marker-end', 'url(#arrow-orange)');
        } else if (colorClass === 'node-active-emerald') {
          path.classList.add('arch-path-emerald');
          path.setAttribute('marker-start', 'url(#arrow-emerald-start)');
          path.setAttribute('marker-end', 'url(#arrow-emerald)');
        } else {
          path.setAttribute('marker-start', 'url(#arrow-start)');
          path.setAttribute('marker-end', 'url(#arrow)');
        }
      }
    }

    resize() {
      if (this.headless || typeof document === 'undefined') return;
      this.drawConnectionPaths();
      this.renderCurrentState();
    }

    activate() {
      if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
        try {
          lucide.createIcons();
        } catch (e) {}
      }
      this.resize();
      this.play();
    }

    deactivate() {
      this.pause();
    }

    handleUrlParams(params) {
      if (!params) return;
      const caseParam = params.get('case');
      const stepParam = params.get('step');
      if (caseParam && this.scenarios.some((s) => s.id === caseParam)) {
        this.setCase(caseParam);
        if (stepParam) {
          const stepNum = parseInt(stepParam, 10);
          if (!isNaN(stepNum) && stepNum >= 0) {
            this.state.stepIndex = Math.min(stepNum, (this.scenarios.find((s) => s.id === caseParam)?.steps.length || 1) - 1);
            if (!this.headless && typeof document !== 'undefined') {
              this.renderCurrentState();
            }
          }
        }
      }
    }

    destroy() {
      this.pause();
      this.state.isBatchRunning = false;
      this.clearMvcAnimations();
      if (!this.headless && typeof window !== 'undefined') {
        if (this.boundHandlers.resize) {
          window.removeEventListener('resize', this.boundHandlers.resize);
        }
        if (this.boundHandlers.documentClick) {
          document.removeEventListener('click', this.boundHandlers.documentClick);
        }
        if (this.boundHandlers.keydown) {
          document.removeEventListener('keydown', this.boundHandlers.keydown);
        }
      }
    }
  }

  // Self-register with DiagramRegistry
  if (typeof DiagramRegistry !== 'undefined' && DiagramRegistry && typeof DiagramRegistry.register === 'function') {
    DiagramRegistry.register({
      id: 'full-architecture',
      aliases: ['microservices', 'espp-arch', 'diagram-slot-4'],
      label: '3. ESPP Full Microservices Architecture & Cloud Storage',
      defaultSelected: false,
      mount: (container) => {
        if (typeof FullArchTemplate !== 'undefined' && FullArchTemplate && typeof FullArchTemplate.mount === 'function') {
          FullArchTemplate.mount(container);
        }
      },
      init: () => {
        const instance = new FullArchitectureSimulation();
        return instance.init();
      },
      activate: (instance) => {
        if (instance && typeof instance.activate === 'function') {
          instance.activate();
        }
      },
      deactivate: (instance) => {
        if (instance && typeof instance.deactivate === 'function') {
          instance.deactivate();
        }
      },
      resize: (instance) => {
        if (instance && typeof instance.resize === 'function') {
          instance.resize();
        }
      }
    });
  }

  return {
    FullArchitectureSimulation: FullArchitectureSimulation,
    default: FullArchitectureSimulation
  };
});
