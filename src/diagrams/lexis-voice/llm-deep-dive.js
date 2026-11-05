/**
 * LLM Server Under-The-Hood Architecture Simulation (UMD-Lite)
 * vLLM vs Ollama PagedAttention & Continuous Batching
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    const exports = factory();
    root.LLMEngineDeepDiveSimulation = exports.LLMEngineDeepDiveSimulation;
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

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

  return {
    LLMEngineDeepDiveSimulation
  };
});
