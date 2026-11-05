// src/diagrams/adaptive-context-switch/context-engine.js
/**
 * Adaptive Context Switching Architecture Simulation Engine (UMD-Lite)
 * Architecture Visualizer Hub
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../../core/registry.js'),
      require('./template.js')
    );
  } else {
    const exports = factory(root.DiagramRegistry, root.ContextTemplate);
    root.AdaptiveContextSwitchSimulation = exports.AdaptiveContextSwitchSimulation;
    root.SIBLING_CLUSTERS = exports.SIBLING_CLUSTERS;
    root.CONTEXT_SWITCH_TEMPLATES = exports.CONTEXT_SWITCH_TEMPLATES;
  }
})(typeof self !== 'undefined' ? self : this, function (DiagramRegistry, ContextTemplate) {
  'use strict';

  const SIBLING_CLUSTERS = {
    social_media: ['Facebook', 'Instagram', 'TikTok', 'YouTube', 'LinkedIn'],
    technology_ai: ['ChatGPT', 'Google Calendar', 'Notion', 'Slack'],
    food_nutrition: ['Home Cooking', 'Street Food', 'Restaurant Dining']
  };

  const CONTEXT_SWITCH_TEMPLATES = [
    "You've shared some great points about {CURRENT_CONTEXT}. Let's switch gears and talk about {NEXT_CONTEXT}. {NEXT_QUESTION}",
    "I really like how clearly you explained {CURRENT_CONTEXT}! Now let's explore {NEXT_CONTEXT} for a bit. {NEXT_QUESTION}",
    "Awesome job discussing {CURRENT_CONTEXT}! To keep things fresh, let's look at another part of this topic: {NEXT_CONTEXT}. {NEXT_QUESTION}",
    "You're doing really well with {CURRENT_CONTEXT}, so let's branch out to {NEXT_CONTEXT}. {NEXT_QUESTION}",
    "That was a solid discussion on {CURRENT_CONTEXT}! Let's shift our focus to {NEXT_CONTEXT} now. {NEXT_QUESTION}"
  ];

  class AdaptiveContextSwitchSimulation {
    constructor(options = {}) {
      this.isHeadless = Boolean(options.headless);
      this.isPaused = false;
      this.batchCount = 1;
      this.inFlightCount = 0;
      this.baseSpeed = 0.016;
      this.autoRunInterval = null;
      this.particles = [];
      this.nodePositions = {};
      this.basePositions = {};
      this.lastTime = typeof performance !== 'undefined' ? performance.now() : 0;

      // State machine state tracking
      this.state = {
        clusterKey: 'social_media',
        activeSubContext: 'Facebook',
        goodTurnsInCurrentContext: 0,
        targetGoodTurnsForSwitch: 4,
        consecutiveWeakCount: 0,
        maxConsecutiveWeakRetries: 2,
        coveredSubContexts: [],
        decision: 'CONTINUE',
        lastTransitionSpeech: '',
        lastDirective: 'SUB_CONTEXT_FOCUS: Stay on "Facebook" (0/4). Ask 1 follow-up question about "Facebook".'
      };

      this.nodeIds = {
        client: 'context-node-client',
        gateway: 'context-node-gateway',
        session: 'context-node-session',
        harness: 'context-node-harness',
        llm: 'context-node-llm',
        tts: 'context-node-tts'
      };

      if (!this.isHeadless && typeof document !== 'undefined') {
        this.initDom();
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());

        // Start continuous animation loop
        requestAnimationFrame((t) => this.tick(t));
      }
    }

    initDom() {
      this.flowCanvas = document.getElementById('context-flow-canvas');
      this.flowCtx = this.flowCanvas ? this.flowCanvas.getContext('2d') : null;
      this.card = document.getElementById('context-diagram-card');
      this.canvasWorld = document.getElementById('context-canvas-world');
      this.stepText = document.getElementById('context-step-text');
      this.stepBadge = document.getElementById('context-step-badge');
      this.btnPause = document.getElementById('btn-context-pause');
      this.iconPause = document.getElementById('icon-context-pause');
      this.iconPlay = document.getElementById('icon-context-play');
      this.textPause = document.getElementById('text-context-pause');
      this.labelSendCount = document.getElementById('label-context-send-count');
      this.dropdownBatch = document.getElementById('dropdown-context-batch');

      this.bindControls();
      this.updateDomView();
      this.updateTelemetry();
    }

    bindControls() {
      const btnSend = document.getElementById('btn-context-send-turn');
      const btnToggle = document.getElementById('btn-context-toggle-dropdown');
      const btnGood = document.getElementById('btn-context-good-turn');
      const btnWeak = document.getElementById('btn-context-weak-turn');
      const btnOfftopic = document.getElementById('btn-context-offtopic-turn');
      const btnAuto = document.getElementById('btn-context-auto-run');
      const btnReset = document.getElementById('btn-context-reset');

      // Send turn request
      if (btnSend) {
        btnSend.addEventListener('click', () => {
          this.triggerBatchRequests(this.batchCount || 1, 'good');
        });
      }

      // Dropdown toggle
      if (btnToggle && this.dropdownBatch) {
        btnToggle.addEventListener('click', (e) => {
          e.stopPropagation();
          this.dropdownBatch.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
          this.dropdownBatch.classList.add('hidden');
        });
      }

      // Dropdown items (1, 3, 5 turns)
      document.querySelectorAll('.dropdown-context-item').forEach((item) => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const count = parseInt(item.dataset.count, 10);
          this.batchCount = count;
          if (this.labelSendCount) {
            this.labelSendCount.textContent = count === 1 ? 'Send Turn Request' : `Send ${count} Turns`;
          }
          if (this.dropdownBatch) {
            this.dropdownBatch.classList.add('hidden');
          }
          this.triggerBatchRequests(count, 'good');
        });
      });

      // Scenario buttons
      if (btnGood) btnGood.addEventListener('click', () => this.triggerTurn('good'));
      if (btnWeak) btnWeak.addEventListener('click', () => this.triggerTurn('weak'));
      if (btnOfftopic) btnOfftopic.addEventListener('click', () => this.triggerTurn('offtopic'));

      // Pause / Resume toggle
      if (this.btnPause) {
        this.btnPause.addEventListener('click', () => {
          this.isPaused = !this.isPaused;
          if (this.iconPause && this.iconPlay && this.textPause) {
            if (this.isPaused) {
              this.iconPause.classList.add('hidden');
              this.iconPlay.classList.remove('hidden');
              this.textPause.textContent = 'Resume';
            } else {
              this.iconPause.classList.remove('hidden');
              this.iconPlay.classList.add('hidden');
              this.textPause.textContent = 'Pause';
            }
          }
        });
      }

      // Reset Session
      if (btnReset) {
        btnReset.addEventListener('click', () => {
          this.resetSession();
        });
      }

      // Auto Run
      if (btnAuto) {
        btnAuto.addEventListener('click', () => {
          const textAuto = document.getElementById('text-context-auto-run');
          if (this.autoRunInterval) {
            clearInterval(this.autoRunInterval);
            this.autoRunInterval = null;
            if (textAuto) textAuto.textContent = 'Auto Run';
            btnAuto.classList.remove('border-purple-500', 'text-purple-400');
          } else {
            if (textAuto) textAuto.textContent = 'Stop Auto';
            btnAuto.classList.add('border-purple-500', 'text-purple-400');
            this.autoRunInterval = setInterval(() => {
              if (this.isPaused) return;
              const types = ['good', 'good', 'weak', 'good', 'offtopic', 'good'];
              const pick = types[Math.floor(Math.random() * types.length)];
              this.triggerTurn(pick);
            }, 3200);
          }
        });
      }
    }

    resetSession() {
      this.state.activeSubContext = 'Facebook';
      this.state.goodTurnsInCurrentContext = 0;
      this.state.consecutiveWeakCount = 0;
      this.state.coveredSubContexts = [];
      this.state.decision = 'CONTINUE';
      this.state.lastDirective = 'SUB_CONTEXT_FOCUS: Stay on "Facebook" (0/4). Ask 1 follow-up question about "Facebook".';
      this.state.lastTransitionSpeech = '';
      this.particles = [];
      this.inFlightCount = 0;
      this.updateDomView();
      this.updateStepBanner('Ready', 'Session Reset: FSM returned to Turn 1 on "Facebook". Ready for next turn request.');
      this.updateTelemetry();
    }

    handleResize() {
      if (!this.flowCanvas) return;
      const rect = this.flowCanvas.getBoundingClientRect();
      const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
      this.flowCanvas.width = rect.width * dpr;
      this.flowCanvas.height = rect.height * dpr;
      if (this.flowCtx) {
        this.flowCtx.setTransform(1, 0, 0, 1, 0, 0);
        this.flowCtx.scale(dpr, dpr);
      }
      this.updateNodePositions();
    }

    updateNodePositions() {
      if (!this.flowCanvas) return;
      const parentRect = this.flowCanvas.getBoundingClientRect();
      this.nodePositions = {};

      for (const [key, elementId] of Object.entries(this.nodeIds)) {
        const el = document.getElementById(elementId);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        this.nodePositions[key] = {
          x: r.left - parentRect.left + r.width / 2,
          y: r.top - parentRect.top + r.height / 2,
          w: r.width,
          h: r.height,
          left: r.left - parentRect.left,
          right: r.right - parentRect.left,
          top: r.top - parentRect.top,
          bottom: r.bottom - parentRect.top
        };
      }
    }

    evaluateTurnFsm(turnType = 'good') {
      const { state } = this;
      const siblings = SIBLING_CLUSTERS[state.clusterKey] || SIBLING_CLUSTERS.social_media;

      if (turnType === 'offtopic') {
        state.decision = 'REDIRECT';
        state.lastDirective = `SUB_CONTEXT_REDIRECT: Acknowledge in 1 sentence, then redirect to "${state.activeSubContext}" with 1 question.`;
        return { decision: state.decision, directive: state.lastDirective, switched: false };
      }

      if (turnType === 'weak') {
        state.consecutiveWeakCount++;
        if (state.consecutiveWeakCount > state.maxConsecutiveWeakRetries) {
          state.decision = 'WEAK_RESCUE';
          state.lastDirective = `SUB_CONTEXT_RESCUE: Give 1 short phrase for "${state.activeSubContext}", then ask 1 simple A-or-B question.`;
          return { decision: state.decision, directive: state.lastDirective, antiDeadlockRescue: true, switched: false };
        } else {
          state.decision = 'HOLD_WEAK';
          state.lastDirective = `SUB_CONTEXT_HOLD: Stay on "${state.activeSubContext}" (retry ${state.consecutiveWeakCount}/2). Model 1 sentence and invite repetition.`;
          return { decision: state.decision, directive: state.lastDirective, antiDeadlockRescue: false, switched: false };
        }
      }

      // Good Turn
      state.consecutiveWeakCount = 0;
      state.goodTurnsInCurrentContext++;

      if (state.goodTurnsInCurrentContext >= state.targetGoodTurnsForSwitch) {
        state.decision = 'CONTEXT_SWITCH';
        if (!state.coveredSubContexts.includes(state.activeSubContext)) {
          state.coveredSubContexts.push(state.activeSubContext);
        }

        const remaining = siblings.filter(s => !state.coveredSubContexts.includes(s) && s !== state.activeSubContext);
        const nextSub = remaining.length > 0 ? remaining[0] : siblings.find(s => s !== state.activeSubContext) || 'another aspect';
        
        state.lastTransitionSpeech = this.renderBridgeSpeech(state.activeSubContext, nextSub);
        state.activeSubContext = nextSub;
        state.goodTurnsInCurrentContext = 0;
        state.lastDirective = `CONTEXT_SWITCH: "${state.lastTransitionSpeech}"`;
        return { decision: state.decision, directive: state.lastDirective, switched: true, nextSubContext: nextSub };
      }

      state.decision = 'CONTINUE';
      state.lastDirective = `SUB_CONTEXT_FOCUS: Stay on "${state.activeSubContext}" (${state.goodTurnsInCurrentContext}/${state.targetGoodTurnsForSwitch}). Ask 1 follow-up question about "${state.activeSubContext}".`;
      return { decision: state.decision, directive: state.lastDirective, switched: false };
    }

    renderBridgeSpeech(current, next) {
      const idx = Math.floor(Math.random() * CONTEXT_SWITCH_TEMPLATES.length);
      const tmpl = CONTEXT_SWITCH_TEMPLATES[idx];
      return tmpl
        .replace(/\{CURRENT_CONTEXT\}/g, current)
        .replace(/\{NEXT_CONTEXT\}/g, next)
        .replace(/\{NEXT_QUESTION\}/g, `How do you feel about ${next} each day?`);
    }

    renderDirective() {
      return this.state.lastDirective;
    }

    triggerBatchRequests(count = 1, turnType = 'good') {
      for (let i = 0; i < count; i++) {
        setTimeout(() => {
          if (this.isPaused) return;
          this.triggerTurn(turnType, i);
        }, i * 380);
      }
    }

    triggerTurn(turnType = 'good', reqIndex = 0) {
      const result = this.evaluateTurnFsm(turnType);
      this.inFlightCount++;
      this.updateTelemetry();
      this.updateDomView();

      if (!this.isHeadless) {
        this.runTurnPipeline(turnType, result, reqIndex);
      }

      return result;
    }

    highlightNode(key, glowClass = 'node-active', duration = 400) {
      if (this.isHeadless || typeof document === 'undefined') return;
      const el = document.getElementById(this.nodeIds[key]);
      if (!el) return;
      el.classList.add(glowClass);
      setTimeout(() => {
        el.classList.remove(glowClass);
      }, duration);
    }

    updateStepBanner(badgeText, mainText) {
      if (this.stepBadge && badgeText) {
        this.stepBadge.textContent = badgeText;
      }
      if (this.stepText && mainText) {
        this.stepText.textContent = mainText;
      }
    }

    updateTelemetry() {
      if (!this.stepBadge) return;
      if (this.inFlightCount > 0) {
        this.stepBadge.textContent = `${this.inFlightCount} Active Turn${this.inFlightCount > 1 ? 's' : ''}`;
        this.stepBadge.className = 'text-[11px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-[#132a22] border border-[#1b4334] whitespace-nowrap ml-3';
      } else {
        this.stepBadge.textContent = this.state.decision;
        this.stepBadge.className = 'text-[11px] font-mono text-purple-400 px-2 py-0.5 rounded bg-[#1f1730] border border-[#3b2d5a] whitespace-nowrap ml-3';
      }
    }

    runTurnPipeline(turnType, result, reqIndex = 0) {
      const slowSpeed = this.baseSpeed;
      const turnLabel = turnType.toUpperCase();

      this.highlightNode('client', 'node-active-emerald', 350);
      this.updateStepBanner('Step 1/6', `Ingress: Student Station streams PCM audio (${turnLabel}) over WebSocket to API Gateway...`);

      // Hop 1: Client -> Gateway (PCM Audio Stream)
      this.spawnParticle('client', 'gateway', {
        color: '#10b981',
        label: 'PCM Audio',
        speed: slowSpeed,
        onComplete: () => {
          this.highlightNode('gateway', 'node-active-purple', 350);
          this.updateStepBanner('Step 2/6', 'Routing: API Gateway multiplexes stream through Duplex Tunnel to Harness Engine...');

          // Hop 2: Gateway -> Harness (Duplex Tunnel Forward)
          this.spawnParticle('gateway', 'harness', {
            color: '#c084fc',
            label: 'Voice Stream',
            speed: slowSpeed,
            onComplete: () => {
              this.highlightNode('harness', 'node-active-blue', 400);
              this.updateStepBanner('Step 3/6', `FSM Eval: Harness queries Session DB & evaluates policy (${result.decision}: ${this.state.activeSubContext})...`);

              // Hop 3: Harness -> Session DB (Query & Persist State)
              this.spawnParticle('harness', 'session', {
                color: '#22d3ee',
                label: 'State Sync',
                speed: slowSpeed * 1.2,
                onComplete: () => {
                  this.highlightNode('session', 'node-active-cyan', 350);

                  // Return from Session DB to Harness
                  this.spawnParticle('session', 'harness', {
                    color: '#22d3ee',
                    label: 'State ACK',
                    speed: slowSpeed * 1.3,
                    onComplete: () => {
                      this.highlightNode('harness', 'node-active-blue', 350);
                      this.updateStepBanner('Step 4/6', 'Directive: Harness injects dynamic prompt directive (<45 tok) into vLLM Qwen...');

                      // Hop 4: Harness -> vLLM (Injected Prompt Directive)
                      this.spawnParticle('harness', 'llm', {
                        color: '#60a5fa',
                        label: 'Prompt Directive',
                        speed: slowSpeed,
                        onComplete: () => {
                          this.highlightNode('llm', 'node-active', 400);
                          this.updateStepBanner('Step 5/6', 'Inference: vLLM forward pass streams generated response tokens (SSE) to Kokoro TTS...');

                          // Hop 5: vLLM -> Kokoro TTS (Token Stream SSE)
                          this.spawnParticle('llm', 'tts', {
                            color: '#fbbf24',
                            label: 'Token Stream (SSE)',
                            speed: slowSpeed,
                            onComplete: () => {
                              this.highlightNode('tts', 'node-active-cyan', 400);
                              this.updateStepBanner('Step 6/6', 'Synthesis: Kokoro synthesizes speech chunks and returns audio stream to Student Station...');

                              // Hop 6: Kokoro TTS -> Gateway (Speech Audio Return)
                              this.spawnParticle('tts', 'gateway', {
                                color: '#2dd4bf',
                                label: 'Tutor Audio',
                                speed: slowSpeed * 1.1,
                                onComplete: () => {
                                  this.highlightNode('gateway', 'node-active-purple', 300);

                                  // Hop 7: Gateway -> Client (Playback Egress)
                                  this.spawnParticle('gateway', 'client', {
                                    color: '#10b981',
                                    label: 'Speech Playback',
                                    speed: slowSpeed * 1.1,
                                    onComplete: () => {
                                      this.highlightNode('client', 'node-active-emerald', 450);
                                      this.inFlightCount = Math.max(0, this.inFlightCount - 1);
                                      this.updateTelemetry();
                                      this.updateStepBanner('Completed', `Turn Completed: AI tutor response delivered (${this.state.decision} on "${this.state.activeSubContext}"). Ready for next turn.`);
                                    }
                                  });
                                }
                              });
                            }
                          });
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    spawnParticle(fromKey, toKey, options = {}) {
      if (this.isHeadless || !this.flowCanvas) return;
      this.particles.push({
        fromKey,
        toKey,
        progress: 0,
        speed: options.speed || this.baseSpeed,
        color: options.color || '#38bdf8',
        label: options.label || '',
        onComplete: options.onComplete || null
      });
    }

    getOrthogonalWaypoints(fromKey, toKey) {
      const p1 = this.nodePositions[fromKey];
      const p2 = this.nodePositions[toKey];
      if (!p1 || !p2) return [];

      // 1. Horizontal direct connection (client <-> gateway)
      if ((fromKey === 'client' && toKey === 'gateway') || (fromKey === 'gateway' && toKey === 'client')) {
        const isFwd = fromKey === 'client';
        const start = isFwd ? { x: p1.right, y: p1.y } : { x: p1.left, y: p1.y };
        const end = isFwd ? { x: p2.left, y: p2.y } : { x: p2.right, y: p2.y };
        return [start, end];
      }

      // 2. Gateway <-> Harness (duplex tunnel)
      if ((fromKey === 'gateway' && toKey === 'harness') || (fromKey === 'harness' && toKey === 'gateway')) {
        const isFwd = fromKey === 'gateway';
        const start = isFwd ? { x: p1.right, y: p1.y + 10 } : { x: p2.left, y: p2.y };
        const end = isFwd ? { x: p2.left, y: p2.y } : { x: p1.right, y: p1.y + 10 };
        const midX = (start.x + end.x) / 2;
        return isFwd ? [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end] : [end, { x: midX, y: end.y }, { x: midX, y: start.y }, start];
      }

      // 3. Harness <-> Session DB (vertical bus)
      if ((fromKey === 'harness' && toKey === 'session') || (fromKey === 'session' && toKey === 'harness')) {
        const isUp = fromKey === 'harness';
        const start = isUp ? { x: p1.x - 14, y: p1.top } : { x: p2.x + 14, y: p2.bottom };
        const end = isUp ? { x: p2.x - 14, y: p2.bottom } : { x: p1.x + 14, y: p1.top };
        return isUp ? [start, end] : [{ x: p1.x + 14, y: p1.bottom }, { x: p2.x + 14, y: p2.top }];
      }

      // 4. Harness <-> vLLM (prompt directive injection)
      if ((fromKey === 'harness' && toKey === 'llm') || (fromKey === 'llm' && toKey === 'harness')) {
        const isFwd = fromKey === 'harness';
        const start = isFwd ? { x: p1.right, y: p1.y - 12 } : { x: p1.left, y: p1.y };
        const end = isFwd ? { x: p2.left, y: p2.y } : { x: p2.right, y: p2.y - 12 };
        const midX = (start.x + end.x) / 2;
        return [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end];
      }

      // 5. vLLM <-> Kokoro TTS (token stream)
      if ((fromKey === 'llm' && toKey === 'tts') || (fromKey === 'tts' && toKey === 'llm')) {
        const isDown = fromKey === 'llm';
        const start = isDown ? { x: p1.x, y: p1.bottom } : { x: p1.x, y: p1.top };
        const end = isDown ? { x: p2.x, y: p2.top } : { x: p2.x, y: p2.bottom };
        return [start, end];
      }

      // 6. Kokoro TTS -> Gateway (audio return rail)
      if ((fromKey === 'tts' && toKey === 'gateway') || (fromKey === 'gateway' && toKey === 'tts')) {
        const isRet = fromKey === 'tts';
        const start = isRet ? { x: p1.left, y: p1.y + 14 } : { x: p1.right, y: p1.y - 14 };
        const end = isRet ? { x: p2.right, y: p2.y - 14 } : { x: p2.left, y: p2.y + 14 };
        const midY = Math.max(p1.bottom, p2.bottom) + 20;
        return [start, { x: start.x - 30, y: start.y }, { x: start.x - 30, y: midY }, { x: end.x + 30, y: midY }, { x: end.x + 30, y: end.y }, end];
      }

      // Generic fallback
      return [{ x: p1.x, y: p1.y }, { x: p2.x, y: p2.y }];
    }

    getPointOnPolyline(pts, t) {
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
          return {
            x: pts[i].x + (pts[i + 1].x - pts[i].x) * segT,
            y: pts[i].y + (pts[i + 1].y - pts[i].y) * segT
          };
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
        { from: 'client', to: 'gateway', color: 'rgba(16, 185, 129, 0.45)', dotColor: '#10b981', label: 'WebSocket PCM' },
        { from: 'gateway', to: 'harness', color: 'rgba(168, 85, 247, 0.45)', dotColor: '#c084fc', dashed: true, label: 'Duplex Tunnel' },
        { from: 'harness', to: 'session', color: 'rgba(34, 211, 238, 0.45)', dotColor: '#22d3ee', label: 'Session State Bus' },
        { from: 'harness', to: 'llm', color: 'rgba(96, 165, 250, 0.45)', dotColor: '#60a5fa', label: 'Directive Injection' },
        { from: 'llm', to: 'tts', color: 'rgba(245, 158, 11, 0.45)', dotColor: '#fbbf24', label: 'Token Stream (SSE)' },
        { from: 'tts', to: 'gateway', color: 'rgba(45, 212, 191, 0.45)', dotColor: '#2dd4bf', dashed: true, label: 'Audio Return Egress' }
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
        ctx.restore();

        // Terminal connection anchor dots
        this.drawAnchorDot(ctx, waypoints[0], r.dotColor, 2.5);
        this.drawAnchorDot(ctx, waypoints[waypoints.length - 1], r.dotColor, 2.5);
      }
    }

    tick(currentTime) {
      if (this.isHeadless) return;
      if (this.isPaused) {
        requestAnimationFrame((t) => this.tick(t));
        return;
      }

      const dt = (currentTime - this.lastTime) / 1000.0;
      this.lastTime = currentTime;

      this.updateSimulation(dt);
      requestAnimationFrame((t) => this.tick(t));
    }

    updateSimulation(dt = 0.016) {
      if (this.isHeadless || !this.flowCtx || !this.flowCanvas) return;
      const ctx = this.flowCtx;
      const rect = this.flowCanvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 1. Draw static and animated orthogonal rails
      this.drawTopologyRails(ctx, typeof performance !== 'undefined' ? performance.now() : 0);

      // 2. Update and draw animated signal packets
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.progress += p.speed * (dt * 60);

        const waypoints = this.getOrthogonalWaypoints(p.fromKey, p.toKey);
        const pos = this.getPointOnPolyline(waypoints, p.progress);

        ctx.save();
        // Glowing dot
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fill();

        // Label pill if specified
        if (p.label) {
          ctx.font = '9px monospace';
          ctx.fillStyle = '#e6edf3';
          ctx.shadowBlur = 0;
          ctx.fillText(p.label, pos.x + 8, pos.y - 6);
        }
        ctx.restore();

        if (p.progress >= 1.0) {
          if (typeof p.onComplete === 'function') {
            p.onComplete();
          }
          this.particles.splice(i, 1);
        }
      }
    }

    updateDomView() {
      if (this.isHeadless || typeof document === 'undefined') return;

      const badge = document.getElementById('fsm-decision-badge');
      const activeText = document.getElementById('fsm-active-subcontext');
      const turnsText = document.getElementById('fsm-good-turns-counter');
      const weakText = document.getElementById('fsm-weak-counter');
      const rescueText = document.getElementById('fsm-rescue-flag');
      const directiveBox = document.getElementById('context-directive-text');
      const speechBox = document.getElementById('bridge-transition-speech');
      const pillsBox = document.getElementById('subcontext-cluster-pills');

      if (badge) {
        badge.textContent = this.state.decision;
        badge.className = `fsm-state-badge state-${this.state.decision.toLowerCase().replace('_', '-')}`;
      }
      if (activeText) activeText.textContent = this.state.activeSubContext;
      if (turnsText) turnsText.textContent = `${this.state.goodTurnsInCurrentContext} / ${this.state.targetGoodTurnsForSwitch}`;
      if (weakText) weakText.textContent = `${this.state.consecutiveWeakCount} / ${this.state.maxConsecutiveWeakRetries}`;
      if (rescueText) {
        rescueText.textContent = this.state.decision === 'WEAK_RESCUE' ? 'ACTIVE (A/B)' : 'INACTIVE';
        rescueText.className = this.state.decision === 'WEAK_RESCUE' ? 'font-mono text-red-400 font-bold' : 'font-mono text-zinc-400';
      }
      if (directiveBox) directiveBox.textContent = this.state.lastDirective;
      if (speechBox && this.state.lastTransitionSpeech) {
        speechBox.textContent = `"${this.state.lastTransitionSpeech}"`;
      }

      if (pillsBox) {
        const siblings = SIBLING_CLUSTERS[this.state.clusterKey] || [];
        pillsBox.innerHTML = siblings.map(name => {
          let cls = 'subcontext-pill';
          if (name === this.state.activeSubContext) cls += ' active';
          else if (this.state.coveredSubContexts.includes(name)) cls += ' covered';
          return `<span class="${cls}">${name}</span>`;
        }).join('');
      }
    }
  }

  // Register with DiagramRegistry
  if (DiagramRegistry && typeof DiagramRegistry.register === 'function') {
    let instance = null;

    DiagramRegistry.register({
      id: 'adaptive-context-switch',
      aliases: ['context-switch', 'diagram-slot-3'],
      label: '2. Adaptive Context Switching & Dynamic FSM Pipeline',
      defaultSelected: false,
      mount(container) {
        ContextTemplate.mount(container);
      },
      init() {
        if (!instance && typeof window !== 'undefined') {
          instance = new AdaptiveContextSwitchSimulation();
          window.contextSimulation = instance;
        }
      },
      activate() {
        if (instance) {
          instance.isPaused = false;
          setTimeout(() => {
            instance.handleResize();
          }, 60);
        }
      },
      deactivate() {
        if (instance) {
          instance.isPaused = true;
          if (instance.autoRunInterval) {
            clearInterval(instance.autoRunInterval);
            instance.autoRunInterval = null;
          }
        }
      },
      resize() {
        if (instance) instance.handleResize();
      },
      handleUrlParams(params) {
        if (instance && params) {
          if (params.has('turn')) {
            instance.triggerTurn(params.get('turn'));
          }
          if (params.has('batch')) {
            const count = parseInt(params.get('batch'), 10) || 1;
            instance.triggerBatchRequests(count, 'good');
          }
        }
      }
    });
  }

  return {
    AdaptiveContextSwitchSimulation,
    SIBLING_CLUSTERS,
    CONTEXT_SWITCH_TEMPLATES
  };
});
