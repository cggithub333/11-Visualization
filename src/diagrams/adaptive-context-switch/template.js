// src/diagrams/adaptive-context-switch/template.js
/**
 * Adaptive Context Switching DOM Template (UMD-Lite)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../core/dom.js'));
  } else {
    root.ContextTemplate = factory(root.DiagramDOM);
  }
})(typeof self !== 'undefined' ? self : this, function (DiagramDOM) {
  'use strict';

  const CONTEXT_HTML = `
  <div id="view-adaptive-context-switch" class="diagram-view hidden w-full flex flex-col gap-6">
    
    <!-- Top Telemetry & Control Bar -->
    <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-[#0d1117] border border-[#21262d]">
      <div class="flex items-center gap-3">
        <span class="w-3 h-3 rounded-full bg-purple-500 animate-pulse"></span>
        <div>
          <h2 class="text-sm font-semibold text-zinc-100 uppercase tracking-wide">3. Adaptive Context Switching & Dynamic FSM Pipeline</h2>
          <p class="text-xs text-zinc-400">Live Turn-by-Turn Sub-Context Tracking & Prompt Directive Calibration</p>
        </div>
      </div>

      <!-- Simulation Action Controls -->
      <div class="flex flex-wrap items-center gap-2">
        <button id="btn-context-good-turn" class="px-3 py-1.5 rounded-md bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/></svg>
          Simulate Good Turn (4/5)
        </button>
        <button id="btn-context-weak-turn" class="px-3 py-1.5 rounded-md bg-amber-600/20 border border-amber-500/50 hover:bg-amber-600/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          Simulate Weak Turn (Hold/Rescue)
        </button>
        <button id="btn-context-offtopic-turn" class="px-3 py-1.5 rounded-md bg-rose-600/20 border border-rose-500/50 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer">
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"/></svg>
          Simulate Off-Topic (Redirect)
        </button>
        <button id="btn-context-auto-run" class="px-3 py-1.5 rounded-md bg-[#21262d] border border-[#30363d] hover:border-purple-500 text-zinc-300 text-xs font-medium cursor-pointer">
          Auto Run
        </button>
      </div>
    </div>

    <!-- Upper Tier: Macro Streaming Pipeline Canvas & Service Topology -->
    <div id="context-canvas-world" class="relative w-full h-[320px] rounded-lg bg-[#07090e] border border-[#1f2530] overflow-hidden">
      <canvas id="context-flow-canvas" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>

      <!-- Hardware Node Elements -->
      <div id="context-node-client" class="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-center w-36 shadow-lg">
        <div class="text-[10px] uppercase font-bold text-emerald-400">Student Station</div>
        <div class="text-xs text-zinc-300 font-mono mt-0.5">WS PCM Stream</div>
      </div>

      <div id="context-node-gateway" class="absolute left-48 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-center w-36 shadow-lg">
        <div class="text-[10px] uppercase font-bold text-purple-400">API Gateway</div>
        <div class="text-xs text-zinc-300 font-mono mt-0.5">Duplex Tunnel</div>
      </div>

      <div id="context-node-session" class="absolute left-[380px] top-8 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-center w-40 shadow-lg">
        <div class="text-[10px] uppercase font-bold text-cyan-400">Session Service</div>
        <div class="text-xs text-zinc-300 font-mono mt-0.5">PostgreSQL State DB</div>
      </div>

      <div id="context-node-harness" class="absolute left-[380px] bottom-8 p-3 rounded-lg bg-[#161b22] border border-[#58a6ff] text-center w-40 shadow-lg ring-1 ring-blue-500/50">
        <div class="text-[10px] uppercase font-bold text-blue-400">Harness FSM Engine</div>
        <div class="text-xs text-zinc-300 font-mono mt-0.5">Policy Evaluator</div>
      </div>

      <div id="context-node-llm" class="absolute right-48 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-center w-40 shadow-lg">
        <div class="text-[10px] uppercase font-bold text-fuchsia-400">vLLM Qwen 1.5B/7B</div>
        <div class="text-xs text-zinc-300 font-mono mt-0.5">AWQ / 8000</div>
      </div>

      <div id="context-node-tts" class="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-lg bg-[#161b22] border border-[#30363d] text-center w-36 shadow-lg">
        <div class="text-[10px] uppercase font-bold text-teal-400">Kokoro TTS</div>
        <div class="text-xs text-zinc-300 font-mono mt-0.5">Audio Synthesis</div>
      </div>
    </div>

    <!-- Lower Tier: Micro FSM State Inspector & Prompt Injection Box -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- FSM Telemetry Panel -->
      <div class="context-fsm-card p-4 flex flex-col gap-3">
        <div class="flex items-center justify-between border-b border-[#21262d] pb-2">
          <span class="text-xs font-semibold text-zinc-300">FSM State Machine</span>
          <span id="fsm-decision-badge" class="fsm-state-badge state-continue">CONTINUE</span>
        </div>
        <div class="flex flex-col gap-1.5 text-xs">
          <div class="flex justify-between">
            <span class="text-zinc-400">Active Sub-Context:</span>
            <span id="fsm-active-subcontext" class="font-mono text-zinc-200 font-bold">Facebook</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-400">Good Turns In Context:</span>
            <span id="fsm-good-turns-counter" class="font-mono text-emerald-400 font-bold">1 / 4</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-400">Consecutive Weak Count:</span>
            <span id="fsm-weak-counter" class="font-mono text-amber-400 font-bold">0 / 2</span>
          </div>
          <div class="flex justify-between">
            <span class="text-zinc-400">Anti-Deadlock Rescue:</span>
            <span id="fsm-rescue-flag" class="font-mono text-zinc-400">INACTIVE</span>
          </div>
        </div>

        <!-- Sibling Cluster Coverage -->
        <div class="border-t border-[#21262d] pt-2 mt-1">
          <span class="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">Sibling Cluster (social_media):</span>
          <div id="subcontext-cluster-pills" class="flex flex-wrap gap-1.5">
            <span class="subcontext-pill active">Facebook</span>
            <span class="subcontext-pill">Instagram</span>
            <span class="subcontext-pill">TikTok</span>
            <span class="subcontext-pill">YouTube</span>
            <span class="subcontext-pill">LinkedIn</span>
          </div>
        </div>
      </div>

      <!-- Real-Time Prompt Injection Directive (< 45 tokens) -->
      <div class="context-fsm-card p-4 flex flex-col gap-3 lg:col-span-2">
        <div class="flex items-center justify-between border-b border-[#21262d] pb-2">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-zinc-300">Prompt Injection Directive</span>
            <span class="text-[10px] text-zinc-500 uppercase font-mono">(Budget: &lt; 45 tokens · Zero Meta-Headers)</span>
          </div>
          <span id="token-budget-badge" class="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-900/30 text-blue-300 border border-blue-800/40">24 TOKENS</span>
        </div>

        <div id="context-directive-text" class="prompt-directive-box">
          SUB_CONTEXT_FOCUS: Stay on "Facebook" (1/4). Ask 1 follow-up question about "Facebook".
        </div>

        <!-- Bridge Transition Card -->
        <div class="border-t border-[#21262d] pt-2">
          <div class="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Interpolated Bridge Transition (15-Template Bank):</span>
            <span id="active-template-id" class="font-mono text-purple-400 text-[11px]">Template #2</span>
          </div>
          <p id="bridge-transition-speech" class="text-xs text-zinc-200 italic bg-[#161b22] p-2.5 rounded border border-[#30363d]">
            "You've shared some great points about Facebook. Let's switch gears and talk about Instagram. How do you feel about Instagram each day?"
          </p>
        </div>
      </div>

    </div>

  </div>
  `;

  function mount(containerOrId) {
    if (DiagramDOM && typeof DiagramDOM.mountTemplate === 'function') {
      return DiagramDOM.mountTemplate(containerOrId || 'diagram-viewport', CONTEXT_HTML);
    }
    let target = containerOrId;
    if (typeof containerOrId === 'string' && typeof document !== 'undefined') {
      target = document.getElementById(containerOrId);
    }
    if (!target && typeof document !== 'undefined') {
      target = document.getElementById('diagram-viewport');
    }
    if (target) {
      target.insertAdjacentHTML('beforeend', CONTEXT_HTML);
    }
    return target;
  }

  return {
    CONTEXT_HTML,
    mount
  };
});
