// src/diagrams/adaptive-context-switch/template.js
/**
 * Adaptive Context Switching DOM Template (UMD-Lite)
 * Architecture Visualizer Hub
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
    
    <!-- Header Section -->
    <header class="text-center mb-1">
      <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
        Adaptive Context Switching &amp; Dynamic FSM Pipeline
      </h1>
      <p class="text-sm sm:text-base text-zinc-400 font-normal">
        Watch live student voice turns flow through FSM policy evaluation, dynamic prompt directive calibration, and speech synthesis.
      </p>
    </header>

    <!-- Controls Toolbar -->
    <section class="flex flex-wrap items-center justify-between gap-4 p-3 bg-[#11141b] border border-[#1d232e] rounded-lg select-none" aria-label="Simulation Controls">
      
      <!-- Left: Pause / Resume & Demo Actions -->
      <div class="flex flex-wrap items-center gap-2.5">
        <!-- Pause / Resume Toggle -->
        <button id="btn-context-pause" class="btn-tactile px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer">
          <svg id="icon-context-pause" class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          <svg id="icon-context-play" class="w-3 h-3 fill-current hidden" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <span id="text-context-pause">Pause</span>
        </button>

        <!-- Send Turn Request Split Button & Dropdown -->
        <div class="flex items-center relative">
          <button id="btn-context-send-turn" class="btn-primary-action px-3.5 py-1.5 text-xs flex items-center gap-1.5 rounded-r-none border-r-0 cursor-pointer" title="Send a student voice turn through the pipeline">
            <svg class="w-3.5 h-3.5 fill-current transform rotate-45" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            <span id="label-context-send-count">Send Turn Request</span>
          </button>
          <button id="btn-context-toggle-dropdown" class="btn-primary-action px-2 py-1.5 text-xs rounded-l-none cursor-pointer" title="Batch Turn Size">
            <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
          </button>

          <div id="dropdown-context-batch" class="hidden absolute top-full mt-1 left-0 bg-[#161a22] border border-[#262d3d] rounded-md shadow-xl py-1 z-30 min-w-[165px]">
            <button class="dropdown-context-item w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-purple-600/20 flex items-center justify-between cursor-pointer" data-count="1">
              <span>Send 1 Turn</span>
              <span class="text-[10px] font-mono text-purple-400 font-semibold">1x</span>
            </button>
            <button class="dropdown-context-item w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-purple-600/20 flex items-center justify-between cursor-pointer" data-count="3">
              <span>Send 3 Turns</span>
              <span class="text-[10px] font-mono text-purple-400 font-semibold">3x</span>
            </button>
            <button class="dropdown-context-item w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-purple-600/20 flex items-center justify-between cursor-pointer" data-count="5">
              <span>Send 5 Turns</span>
              <span class="text-[10px] font-mono text-purple-400 font-semibold">5x</span>
            </button>
          </div>
        </div>

        <!-- Quality Scenario Trigger Buttons -->
        <button id="btn-context-good-turn" class="px-3 py-1.5 rounded-md bg-emerald-600/20 border border-emerald-500/50 hover:bg-emerald-600/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer" title="Simulate a fluent response (increments good turns towards context switch)">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          Simulate Good Turn (4/5)
        </button>
        <button id="btn-context-weak-turn" class="px-3 py-1.5 rounded-md bg-amber-600/20 border border-amber-500/50 hover:bg-amber-600/30 text-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer" title="Simulate a weak or hesitant answer (holds context or activates anti-deadlock rescue)">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span>
          Simulate Weak Turn (Hold/Rescue)
        </button>
        <button id="btn-context-offtopic-turn" class="px-3 py-1.5 rounded-md bg-rose-600/20 border border-rose-500/50 hover:bg-rose-600/30 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer" title="Simulate an off-topic question (activates redirect directive)">
          <span class="w-2 h-2 rounded-full bg-rose-400"></span>
          Simulate Off-Topic (Redirect)
        </button>
      </div>

      <!-- Right: Auto Run & Reset Session -->
      <div class="flex items-center gap-2">
        <button id="btn-context-auto-run" class="btn-tactile px-3 py-1.5 text-xs text-zinc-300 flex items-center gap-1.5 cursor-pointer">
          <span class="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
          <span id="text-context-auto-run">Auto Run</span>
        </button>
        <button id="btn-context-reset" class="btn-tactile px-3 py-1.5 text-xs text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer" title="Reset FSM state to Turn 1">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
          <span>Reset Session</span>
        </button>
      </div>
    </section>

    <!-- Step Telemetry Status Banner -->
    <div id="context-step-banner" class="w-full telemetry-banner px-3.5 py-2 flex items-center justify-between text-xs">
      <div class="flex items-center gap-2.5 overflow-hidden">
        <span id="context-step-dot" class="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse"></span>
        <span id="context-step-text" class="text-[#d1d9e0] truncate font-medium">Ready: Trigger a turn request to watch voice input flow through FSM policy evaluation, directive injection, LLM generation, and speech synthesis.</span>
      </div>
      <span id="context-step-badge" class="text-[11px] font-mono text-purple-400 px-2 py-0.5 rounded bg-[#1f1730] border border-[#3b2d5a] whitespace-nowrap ml-3">Ready</span>
    </div>

    <!-- Upper Tier: Macro Streaming Pipeline Schematic & Service Topology -->
    <section id="context-diagram-card" class="relative bg-[#0b0d12] border border-[#1c222e] rounded-xl p-6 sm:p-8 overflow-hidden min-h-[460px] select-none" aria-label="Adaptive Context Switching Schematic">
      
      <!-- Canvas for Dynamic Packet & Connection Rails -->
      <canvas id="context-flow-canvas" class="absolute inset-0 w-full h-full pointer-events-none z-10"></canvas>

      <!-- Hardware Node Layout Grid -->
      <div id="context-canvas-world" class="relative z-20 w-full max-w-[1180px] mx-auto h-[400px] flex items-center justify-between px-2 sm:px-6">
        
        <!-- Column 1: Ingress Station -->
        <div class="flex flex-col items-center justify-center">
          <div id="context-node-client" class="context-draggable-node px-5 py-4 w-44 text-center cursor-pointer">
            <div class="flex items-center justify-center gap-2 mb-1">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs uppercase font-bold text-emerald-400 tracking-wide">Student Station</span>
            </div>
            <div class="text-[11px] text-zinc-300 font-mono">WS PCM Stream</div>
            <!-- Live Audio VU Level Meter Indicator -->
            <div class="flex items-center justify-center gap-0.5 mt-2" title="Audio Activity">
              <span class="w-1 h-2 rounded-sm bg-emerald-500"></span>
              <span class="w-1 h-3 rounded-sm bg-emerald-500"></span>
              <span class="w-1 h-4 rounded-sm bg-emerald-400"></span>
              <span class="w-1 h-2.5 rounded-sm bg-emerald-500"></span>
              <span class="w-1 h-1.5 rounded-sm bg-[#223028]"></span>
            </div>
          </div>
        </div>

        <!-- Column 2: API Gateway -->
        <div class="flex flex-col items-center justify-center">
          <div id="context-node-gateway" class="context-draggable-node px-5 py-4 w-44 text-center cursor-pointer">
            <div class="flex items-center justify-center gap-2 mb-1">
              <svg class="w-4 h-4 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
              <span class="text-xs uppercase font-bold text-purple-400 tracking-wide">API Gateway</span>
            </div>
            <div class="text-[11px] text-zinc-300 font-mono">Duplex Tunnel</div>
            <div class="text-[9px] text-zinc-500 font-mono mt-1">WebSocket Router</div>
          </div>
        </div>

        <!-- Column 3: Orchestration & State Plane -->
        <div class="flex flex-col items-center justify-between h-[360px] py-2">
          <!-- Session State DB (Top) -->
          <div id="context-node-session" class="context-draggable-node px-5 py-3.5 w-48 text-center cursor-pointer">
            <div class="flex items-center justify-center gap-2 mb-1">
              <svg class="w-4 h-4 text-cyan-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              <span class="text-xs uppercase font-bold text-cyan-400 tracking-wide">Session State DB</span>
            </div>
            <div class="text-[11px] text-zinc-300 font-mono">PostgreSQL Cluster</div>
            <div class="text-[9px] text-zinc-500 font-mono mt-0.5">Turn &amp; Entity State</div>
          </div>

          <!-- Harness FSM Engine (Bottom) -->
          <div id="context-node-harness" class="context-draggable-node px-5 py-4 w-48 text-center cursor-pointer ring-1 ring-blue-500/50">
            <div class="flex items-center justify-center gap-2 mb-1">
              <svg class="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              <span class="text-xs uppercase font-bold text-blue-400 tracking-wide">Harness FSM Engine</span>
            </div>
            <div class="text-[11px] text-zinc-200 font-mono font-semibold">Policy Evaluator</div>
            <div class="text-[9px] text-blue-400 font-mono mt-0.5">&lt;45 Tok Directive Injector</div>
          </div>
        </div>

        <!-- Column 4: Inference Tier & Speech Synthesis -->
        <div class="flex flex-col items-center justify-between h-[360px] py-2">
          <!-- vLLM Model Server (Top) -->
          <div id="context-node-llm" class="context-draggable-node px-5 py-3.5 w-48 text-center cursor-pointer">
            <div class="flex items-center justify-center gap-2 mb-1">
              <svg class="w-4 h-4 text-fuchsia-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span class="text-xs uppercase font-bold text-fuchsia-400 tracking-wide">vLLM Qwen 1.5B/7B</span>
            </div>
            <div class="text-[11px] text-zinc-300 font-mono">AWQ Model (:8000)</div>
            <div class="text-[9px] text-zinc-500 font-mono mt-0.5">Prompt Directive Execution</div>
          </div>

          <!-- Kokoro TTS (Bottom) -->
          <div id="context-node-tts" class="context-draggable-node px-5 py-3.5 w-48 text-center cursor-pointer">
            <div class="flex items-center justify-center gap-2 mb-1">
              <svg class="w-4 h-4 text-teal-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              <span class="text-xs uppercase font-bold text-teal-400 tracking-wide">Kokoro TTS</span>
            </div>
            <div class="text-[11px] text-zinc-300 font-mono">Speech Synthesis</div>
            <div class="text-[9px] text-zinc-500 font-mono mt-0.5">Real-Time Audio Egress</div>
          </div>
        </div>

      </div>
    </section>

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
            <span id="fsm-good-turns-counter" class="font-mono text-emerald-400 font-bold">0 / 4</span>
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
            <span class="text-[10px] text-zinc-500 uppercase font-mono">(Budget: &lt; 45 tokens &bull; Zero Meta-Headers)</span>
          </div>
          <span id="token-budget-badge" class="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-900/30 text-blue-300 border border-blue-800/40">24 TOKENS</span>
        </div>

        <div id="context-directive-text" class="prompt-directive-box">
          SUB_CONTEXT_FOCUS: Stay on "Facebook" (0/4). Ask 1 follow-up question about "Facebook".
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
