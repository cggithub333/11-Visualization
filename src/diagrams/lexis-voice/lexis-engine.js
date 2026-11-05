/**
 * Lexis Voice Practice Architecture Simulation Engine (UMD-Lite)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../../core/registry.js'),
      require('./template.js'),
      require('./llm-deep-dive.js')
    );
  } else {
    const exports = factory(
      root.DiagramRegistry,
      root.LexisTemplate,
      { LLMEngineDeepDiveSimulation: root.LLMEngineDeepDiveSimulation }
    );
    root.LexisArchitectureSimulation = exports.LexisArchitectureSimulation;
  }
})(typeof self !== 'undefined' ? self : this, function (DiagramRegistry, LexisTemplate, LLMDeepDiveModule) {
  'use strict';

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
        this.highlightNode('gateway', 'node-active-blue', 250);

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
            this.highlightNode('session', 'node-active-purple', 250);

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
                this.highlightNode('curriculum', 'node-active-teal', 250);

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
                    this.highlightNode('session', 'node-active-purple', 250);

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
                    this.highlightNode('harness', 'node-active-indigo', 300);

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
                              this.highlightNode('harness', 'node-active-indigo', 250);

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
                                  this.highlightNode('decision', 'node-active-purple', 300);

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
                                      this.highlightNode('llm', 'node-active-blue', 350);

                                      // Hop 9: LLM -> Harness (Tokens streamed back to Harness Orchestrator)
                                      const forwardToHarness = () => {
                                        this.highlightNode('llm', 'node-active-blue', 250);
                                        this.spawnParticle('llm', 'harness', {
                                          color: '#60a5fa',
                                          glowColor: 'rgba(96, 165, 250, 0.5)',
                                          size: 5,
                                          label: 'Token Stream (SSE)',
                                          showLabel: showLabels,
                                          laneOffset: laneOffset,
                                          speed: slowSpeed,
                                          onComplete: () => {
                                            this.highlightNode('harness', 'node-active-indigo', 250);

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
                                                        this.highlightNode('harness', 'node-active-indigo', 250);

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
                                                            this.highlightNode('session', 'node-active-purple', 200);
                                                            this.spawnParticle('session', 'gateway', {
                                                              color: '#06b6d4',
                                                              size: 5,
                                                              laneOffset: laneOffset,
                                                              speed: slowSpeed * 1.1,
                                                              onComplete: () => {
                                                                this.highlightNode('gateway', 'node-active-blue', 150);
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

    const nodeGlowMap = {
      client: 'node-active-emerald',
      gateway: 'node-active-blue',
      session: 'node-active-purple',
      curriculum: 'node-active-teal',
      harness: 'node-active-indigo',
      stt: 'node-active-emerald',
      decision: 'node-active-purple',
      llm: 'node-active-blue',
      tts: 'node-active-cyan',
    };

    this.updateStepBanner((this.activeStepIndex || 0) + 1, step.label);
    this.highlightNode(step.from, nodeGlowMap[step.from] || 'node-active', 400);
    this.spawnParticle(step.from, step.to, {
      color: step.color,
      size: 6,
      speed: this.baseSpeed,
      label: step.label.split(':')[0],
      showLabel: true,
      onComplete: () => {
        this.highlightNode(step.to, nodeGlowMap[step.to] || 'node-active', 500);
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

  if (typeof LexisArchitectureSimulation.prototype.updateSimulation !== 'function') {
    LexisArchitectureSimulation.prototype.updateSimulation = LexisArchitectureSimulation.prototype.update;
  }

  // Register with DiagramRegistry if available
  if (DiagramRegistry && typeof DiagramRegistry.register === 'function') {
    DiagramRegistry.register({
      id: 'lexis-voice',
      aliases: ['diagram-slot-2', 'lexis'],
      label: '2. Lexis: Voice Practice Architecture',
      defaultSelected: true,
      mount(viewport) {
        if (LexisTemplate && typeof LexisTemplate.mount === 'function') {
          LexisTemplate.mount(viewport);
        }
      },
      init() {
        if (typeof window !== 'undefined') {
          const LLMClass = (LLMDeepDiveModule && LLMDeepDiveModule.LLMEngineDeepDiveSimulation) || window.LLMEngineDeepDiveSimulation;
          window.lexisSimulation = new LexisArchitectureSimulation();
          if (LLMClass) {
            window.llmEngineSimulation = new LLMClass();
          }
        }
      },
      activate() {
        if (typeof window !== 'undefined' && window.lexisSimulation) {
          window.lexisSimulation.isPaused = false;
          setTimeout(() => {
            if (window.lexisSimulation && typeof window.lexisSimulation.handleResize === 'function') {
              window.lexisSimulation.handleResize();
            }
            if (window.llmEngineSimulation && typeof window.llmEngineSimulation.handleResize === 'function') {
              window.llmEngineSimulation.handleResize();
            }
            if (window.lexisSimulation && window.lexisSimulation.particles && window.lexisSimulation.particles.length === 0) {
              window.lexisSimulation.triggerBatchRequests(5);
            }
          }, 50);
        }
      },
      deactivate() {
        if (typeof window !== 'undefined' && window.lexisSimulation) {
          window.lexisSimulation.isPaused = true;
        }
      },
      resize() {
        if (typeof window !== 'undefined') {
          if (window.lexisSimulation && typeof window.lexisSimulation.handleResize === 'function') {
            window.lexisSimulation.handleResize();
          }
          if (window.llmEngineSimulation && typeof window.llmEngineSimulation.handleResize === 'function') {
            window.llmEngineSimulation.handleResize();
          }
        }
      },
      handleUrlParams(params) {
        if (typeof window === 'undefined' || !params) return;

        const engineParam = params.get('engine');
        if (engineParam && (engineParam === 'ollama' || engineParam === 'vllm') && window.llmEngineSimulation) {
          window.llmEngineSimulation.switchEngine(engineParam);
        }

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

        const stephop = parseInt(params.get('stephop'), 10);
        const autoturn = parseInt(params.get('autoturn'), 10);
        if (!isNaN(stephop) && stephop > 0) {
          for (let i = 0; i < stephop; i++) {
            if (window.lexisSimulation) window.lexisSimulation.triggerStepHop();
          }
        } else if (!isNaN(autoturn) && autoturn > 0) {
          if (window.lexisSimulation) window.lexisSimulation.triggerBatchRequests(autoturn);
        } else {
          setTimeout(() => {
            if (window.lexisSimulation && window.lexisSimulation.particles.length === 0) {
              window.lexisSimulation.triggerBatchRequests(5);
            }
          }, 100);
        }

        const mockreq = parseInt(params.get('mockreq'), 10);
        if (!isNaN(mockreq) && mockreq > 0 && window.llmEngineSimulation) {
          for (let i = 0; i < mockreq; i++) {
            window.llmEngineSimulation.receiveRequestFromMain({ reqIndex: i });
          }
        }

        const enginesteps = parseInt(params.get('enginesteps'), 10);
        if (!isNaN(enginesteps) && enginesteps > 0 && window.llmEngineSimulation) {
          for (let s = 0; s < enginesteps; s++) {
            window.llmEngineSimulation.stepIteration();
          }
        }

        if ((params.get('branch') === '1' || engineParam) && window.llmEngineSimulation) {
          window.llmEngineSimulation.toggleBranch(true);
        }

        const toggletest = parseInt(params.get('toggletest'), 10);
        if (!isNaN(toggletest) && toggletest > 0 && window.llmEngineSimulation) {
          for (let t = 0; t < toggletest; t++) {
            window.llmEngineSimulation.toggleBranch(t % 2 === 0);
          }
        }
      }
    });
  }

  return {
    LexisArchitectureSimulation
  };
});
