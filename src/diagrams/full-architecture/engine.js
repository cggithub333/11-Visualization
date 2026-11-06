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
      this._activeSleepResolvers = [];
      this._activePacketAnimations = [];
      this._batchSpeedFactor = 1.0;
      this._playToken = 0;
      this._playRun = 0;
      this._stepPromise = null;
    }

    sleep(ms) {
      return new Promise((resolve) => {
        let t = null;
        const cleanup = () => {
          if (this._activeSleepResolvers) {
            const idx = this._activeSleepResolvers.indexOf(cleanup);
            if (idx !== -1) this._activeSleepResolvers.splice(idx, 1);
          }
          if (t) clearTimeout(t);
          resolve();
        };
        t = setTimeout(cleanup, ms);
        this._activeSleepResolvers = this._activeSleepResolvers || [];
        this._activeSleepResolvers.push(cleanup);
      });
    }

    getHops(step) {
      if (!step) return [];
      const anchors = [step.source, ...(step.via || []), step.target]
        .filter((id, i, arr) => i === 0 || id !== arr[i - 1]);

      if (anchors.length <= 1) return anchors;

      const hops = [anchors[0]];
      for (let i = 0; i < anchors.length - 1; i++) {
        const u = anchors[i];
        const v = anchors[i + 1];
        if (u === v) continue;
        const direct = Routes && typeof Routes.findRoute === 'function' ? Routes.findRoute(u, v) : null;
        if (direct) {
          hops.push(v);
        } else if (Routes && typeof Routes.findPath === 'function') {
          const path = Routes.findPath(u, v);
          if (path && path.length > 1) {
            for (let j = 1; j < path.length; j++) {
              hops.push(path[j]);
            }
          } else {
            hops.push(v);
          }
        } else {
          hops.push(v);
        }
      }
      return hops.filter((id, i, arr) => i === 0 || id !== arr[i - 1]);
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
      if (typeof window !== 'undefined') {
        window.fullArchSim = this;
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
      if (this.headless || typeof document === 'undefined' || (!step.response && !step.isResponse)) return;
      const resp = step.response || step;
      const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
      const caseLabel = document.getElementById('telemetry-case-label');
      const descLabel = document.getElementById('telemetry-desc-label');
      const payloadEl = document.getElementById('telemetry-payload');
      const protoEl = document.getElementById('metric-protocol');
      const latencyEl = document.getElementById('metric-latency');
      if (caseLabel) caseLabel.textContent = `${currentCase.title.toUpperCase()} · STEP ${this.state.stepIndex + 1}/${currentCase.steps.length} · RESPONSE`;
      if (descLabel) descLabel.textContent = resp.desc || step.desc;
      if (payloadEl) payloadEl.textContent = resp.payload || step.payload;
      if (protoEl) protoEl.textContent = `${step.protocol} (response)`;
      if (latencyEl) latencyEl.textContent = resp.latency || step.latency;
    }

    emitSelfLoopVisual(nodeId, label, colorClass) {
      if (this.headless || typeof document === 'undefined') return;
      const packetsGroup = document.getElementById('svg-packets-group');
      const grid = document.getElementById('full-arch-grid');
      const nodeEl = document.getElementById(`node-${nodeId}`);
      if (!packetsGroup || !grid || !nodeEl) return;

      const gridRect = grid.getBoundingClientRect();
      const nodeRect = nodeEl.getBoundingClientRect();
      const nx = nodeRect.left - gridRect.left;
      const ny = nodeRect.top - gridRect.top;
      const nw = nodeRect.width;
      const nh = nodeRect.height;

      let strokeColor = '#38bdf8';
      let ringClass = 'self-loop-ring';
      if (colorClass === 'node-active-purple') {
        strokeColor = '#c084fc';
        ringClass = 'self-loop-ring ring-purple';
      } else if (colorClass === 'node-active-amber') {
        strokeColor = '#fb923c';
        ringClass = 'self-loop-ring ring-orange';
      } else if (colorClass === 'node-active-emerald') {
        strokeColor = '#34d399';
        ringClass = 'self-loop-ring ring-emerald';
      }

      const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      group.setAttribute('class', 'moving-packet moving-self-loop');
      group.setAttribute('style', `color: ${strokeColor}`);

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', String(nx - 4));
      rect.setAttribute('y', String(ny - 4));
      rect.setAttribute('width', String(nw + 8));
      rect.setAttribute('height', String(nh + 8));
      rect.setAttribute('rx', '8');
      rect.setAttribute('ry', '8');
      rect.setAttribute('fill', 'none');
      rect.setAttribute('stroke', strokeColor);
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('stroke-dasharray', '4 3');
      rect.setAttribute('class', ringClass);
      group.appendChild(rect);

      const shortLabel = label || 'IN-PLACE';
      const textWidth = Math.max(20, Math.round(shortLabel.length * 6.0));
      const pillWidth = textWidth + 12;
      const pillHeight = 15;
      const px = nx + nw / 2 - pillWidth / 2;
      const py = ny - 18;

      const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      labelGroup.setAttribute('class', 'packet-label-group');

      const pill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      pill.setAttribute('class', 'packet-label-pill');
      pill.setAttribute('x', String(Math.round(px)));
      pill.setAttribute('y', String(Math.round(py)));
      pill.setAttribute('width', String(pillWidth));
      pill.setAttribute('height', String(pillHeight));
      pill.setAttribute('rx', '3');
      pill.setAttribute('ry', '3');
      labelGroup.appendChild(pill);

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('class', 'packet-label-text');
      text.setAttribute('x', String(Math.round(px + pillWidth / 2)));
      text.setAttribute('y', String(Math.round(py + 10.5)));
      text.textContent = shortLabel;
      labelGroup.appendChild(text);

      group.appendChild(labelGroup);
      packetsGroup.appendChild(group);

      const speedFactor = this._batchSpeedFactor || 1.0;
      const loopDur = Math.max(100, Math.round(1200 / speedFactor));
      const t = setTimeout(() => {
        try { group.remove(); } catch (e) {}
      }, loopDur);
      this._activeMvcTimeouts = this._activeMvcTimeouts || [];
      this._activeMvcTimeouts.push(t);
    }

    async playStep(step, highlightClass) {
      if (this.headless || typeof document === 'undefined' || !step) return;
      const token = this._playToken;
      const hops = this.getHops(step);
      const isRespStep = Boolean(step.isResponse);
      const speedFactor = this._batchSpeedFactor || 1.0;
      const hopMs = Math.max(70, Math.round(HOP_MS / speedFactor));

      if (isRespStep) {
        this.renderResponsePhase(step);
      }

      if (hops.length === 1) {
        this.pulseNode(hops[0]);
        this.emitSelfLoopVisual(hops[0], step.label, highlightClass);
        await this.sleep(hopMs);
        if (token !== this._playToken) return;
      } else {
        for (let i = 0; i < hops.length - 1; i++) {
          this.highlightPath(hops[i], hops[i + 1], highlightClass, true);
          this.emitPacket(hops[i], hops[i + 1], highlightClass, step.label, isRespStep);
          await this.sleep(hopMs);
          if (token !== this._playToken) return;
          this.pulseNode(hops[i + 1]);
        }
      }

      if (!step.response) return;
      this.renderResponsePhase(step);
      if (hops.length === 1) {
        this.pulseNode(hops[0]);
        this.emitSelfLoopVisual(hops[0], step.response.label, highlightClass);
        await this.sleep(hopMs);
        if (token !== this._playToken) return;
      } else {
        for (let i = hops.length - 1; i > 0; i--) {
          this.highlightPath(hops[i], hops[i - 1], highlightClass, true);
          this.emitPacket(hops[i], hops[i - 1], highlightClass, step.response.label, true);
          await this.sleep(hopMs);
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
      this.state.isBatchRunning = false;
      this._batchSpeedFactor = 1.0;
      this._playRun += 1;
      this.cancelPlayback();
      this.clearMvcAnimations();
      this.updatePlayPauseIcons();
      if (!this.headless && typeof document !== 'undefined') {
        const sendBtn = document.getElementById('btn-arch-send-request');
        const labelEl = document.getElementById('label-arch-send-count');
        if (sendBtn) sendBtn.classList.remove('sending');
        if (labelEl) {
          labelEl.textContent = this.state.batchSize === 1 ? 'Send Request' : `Send ${this.state.batchSize} Requests`;
        }
      }
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
      if (this._activeSleepResolvers) {
        const resolvers = this._activeSleepResolvers.slice();
        this._activeSleepResolvers = [];
        resolvers.forEach((fn) => fn());
      }
      if (this._activePacketAnimations) {
        this._activePacketAnimations.forEach((anim) => {
          if (typeof anim.cancel === 'function') anim.cancel();
        });
        this._activePacketAnimations = [];
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

      const speedFactor = this._batchSpeedFactor || 1.0;
      const mvcDuration = Math.max(30, Math.round(350 / speedFactor));

      return new Promise((resolve) => {
        const nodeEl = document.getElementById(`node-${nodeId}`);
        if (nodeEl) {
          nodeEl.classList.add('node-active-cyan');
          const t = setTimeout(() => {
            nodeEl.classList.remove('node-active-cyan');
            if (typeof callback === 'function') callback();
            resolve();
          }, mvcDuration);
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

      // Temporary path for length calculation and geometry interpolation
      const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempPath.setAttribute('d', pathD);
      tempPath.setAttribute('fill', 'none');
      tempPath.setAttribute('stroke', 'none');
      tempPath.setAttribute('opacity', '0');
      tempPath.setAttribute('pointer-events', 'none');
      group.appendChild(tempPath);

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

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '5');
      circle.setAttribute('class', packetClass);
      circle.setAttribute('fill', fillColor);

      packetsGroup.appendChild(group);

      let totalLen = 0;
      let startPt = { x: 0, y: 0 };
      try {
        totalLen = tempPath.getTotalLength();
        if (totalLen > 0) {
          const pt = tempPath.getPointAtLength(0);
          startPt = { x: pt.x, y: pt.y };
        }
      } catch (e) {
        totalLen = 0;
      }

      circle.setAttribute('cx', String(startPt.x));
      circle.setAttribute('cy', String(startPt.y));
      group.appendChild(circle);

      const speedFactor = this._batchSpeedFactor || 1.0;
      const baseDuration = 1100;
      const duration = Math.max(70, Math.round(baseDuration / speedFactor));

      let startTime = null;
      let rafId = null;
      let isDone = false;
      let safetyTimeout = null;

      const animEntry = {
        group,
        cancel: () => {
          if (isDone) return;
          isDone = true;
          if (rafId) cancelAnimationFrame(rafId);
          if (safetyTimeout) clearTimeout(safetyTimeout);
          try { group.remove(); } catch (e) {}
        }
      };

      this._activePacketAnimations = this._activePacketAnimations || [];
      this._activePacketAnimations.push(animEntry);

      const stepAnim = (timestamp) => {
        if (isDone) return;
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 1;

        if (totalLen > 0) {
          try {
            const pt = tempPath.getPointAtLength(progress * totalLen);
            circle.setAttribute('cx', String(pt.x));
            circle.setAttribute('cy', String(pt.y));
          } catch (e) {}
        }

        if (progress < 1) {
          rafId = requestAnimationFrame(stepAnim);
        } else {
          isDone = true;
          if (safetyTimeout) clearTimeout(safetyTimeout);
          const idx = this._activePacketAnimations ? this._activePacketAnimations.indexOf(animEntry) : -1;
          if (idx !== -1) this._activePacketAnimations.splice(idx, 1);
          try { group.remove(); } catch (e) {}
        }
      };

      rafId = requestAnimationFrame(stepAnim);

      safetyTimeout = setTimeout(() => {
        animEntry.cancel();
      }, duration + 400);
    }

    getBatchSpeedFactor(numRequests) {
      if (numRequests >= 100) return 14.0;
      if (numRequests >= 50) return 9.0;
      if (numRequests >= 20) return 5.0;
      if (numRequests >= 10) return 3.0;
      if (numRequests >= 5) return 1.8;
      return 1.0;
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
      const speedFactor = this.getBatchSpeedFactor(numRequests);
      this._batchSpeedFactor = speedFactor;

      const sendBtn = document.getElementById('btn-arch-send-request');
      const labelEl = document.getElementById('label-arch-send-count');
      if (sendBtn) sendBtn.classList.add('sending');

      const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
      const totalSteps = currentCase.steps.length;

      const stepSleepMs = Math.max(10, Math.round(150 / speedFactor));
      const interReqGap = Math.max(15, Math.round(400 / speedFactor));

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

            await this.sleep(stepSleepMs);
          }

          if (req < numRequests && this.state.isBatchRunning) {
            await this.sleep(interReqGap);
          }
        }
      } finally {
        this.state.isBatchRunning = false;
        this._batchSpeedFactor = 1.0;
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
      this._batchSpeedFactor = 1.0;
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

      const isRespStep = Boolean(step.isResponse);
      if (caseLabel) {
        caseLabel.textContent = isRespStep
          ? `${currentCase.title.toUpperCase()} · STEP ${this.state.stepIndex + 1}/${currentCase.steps.length} · RESPONSE`
          : `${currentCase.title.toUpperCase()} · STEP ${this.state.stepIndex + 1}/${currentCase.steps.length}`;
      }
      if (descLabel) descLabel.textContent = step.desc;
      if (payloadEl) payloadEl.textContent = step.payload;
      if (protoEl) protoEl.textContent = isRespStep ? `${step.protocol} (response)` : step.protocol;
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

      const highlightClass = this.state.activeCaseId === 'case-3'
        ? 'node-active-purple'
        : (this.state.activeCaseId === 'case-4' ? 'node-active-amber' : 'node-active-cyan');

      this.clearHighlightedPaths();
      const hops = this.getHops(step);
      hops.forEach((nodeId) => {
        const el = document.getElementById(`node-${nodeId}`);
        if (el) el.classList.add(highlightClass);
      });

      if (hops.length > 1) {
        for (let i = 0; i < hops.length - 1; i++) {
          this.highlightPath(hops[i], hops[i + 1], highlightClass, true);
        }
      }
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

    clearHighlightedPaths() {
      if (this.headless || typeof document === 'undefined') return;

      document.querySelectorAll('.arch-path').forEach((p) => {
        p.classList.remove('arch-path-active', 'arch-path-purple', 'arch-path-orange', 'arch-path-emerald');
        const conn = p.getAttribute('data-connection');
        if (conn) {
          const [a, b] = conn.split('-');
          const rObj = Routes && typeof Routes.findRoute === 'function' ? Routes.findRoute(a, b)?.route : null;
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
    }

    highlightPath(srcId, tgtId, colorClass, preserveExisting = false) {
      if (this.headless || typeof document === 'undefined') return;

      if (!preserveExisting) {
        this.clearHighlightedPaths();
      }

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
