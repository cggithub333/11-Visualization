/**
 * Lexis Voice Practice Diagram HTML Template Module (UMD-Lite)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../core/dom.js'));
  } else {
    root.LexisTemplate = factory(root.DiagramDOM);
  }
})(typeof self !== 'undefined' ? self : this, function (DiagramDOM) {
  'use strict';

  const LEXIS_HTML = `
    <!-- VIEW 2: Lexis Voice Practice Architecture -->
    <div id="view-diagram-slot-2" class="diagram-view">
      
      <!-- Header Section (Matching View 1 Common Pattern) -->
      <header class="text-center mb-6">
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-2">
          How Lexis voice practice works
        </h1>
        <p class="text-sm sm:text-base text-zinc-400 font-normal">
          Watch student voice streams flow through the AI practice infrastructure in real-time.
        </p>
      </header>

      <!-- Controls Toolbar -->
      <section class="flex flex-wrap items-center justify-center gap-4 mb-6 p-3 bg-[#11141b] border border-[#1d232e] rounded-lg select-none" aria-label="Simulation Controls">
        
        <!-- Pause / Resume Toggle -->
        <button id="btn-lexis-pause" class="btn-tactile px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer">
          <svg id="icon-lexis-pause" class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          <svg id="icon-lexis-play" class="w-3 h-3 fill-current hidden" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          <span id="text-lexis-pause">Pause</span>
        </button>

        <!-- Pack of Requests Split Button & Dropdown (Matching Diagram 1) -->
        <div class="flex items-center relative">
          <button id="btn-lexis-send-pack" class="btn-primary-action px-3.5 py-1.5 text-xs flex items-center gap-1.5 rounded-r-none border-r-0 cursor-pointer">
            <svg class="w-3.5 h-3.5 fill-current transform rotate-45" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            <span id="label-lexis-send-count">Send 5 requests</span>
          </button>
          <button id="btn-lexis-toggle-dropdown" class="btn-primary-action px-2 py-1.5 text-xs rounded-l-none cursor-pointer" title="Batch Size">
            <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
          </button>

          <div id="dropdown-lexis-batch" class="hidden absolute top-full mt-1 right-0 sm:left-0 sm:right-auto bg-[#161a22] border border-[#262d3d] rounded-md shadow-xl py-1 z-30 min-w-[155px]">
            <button class="dropdown-lexis-item w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-emerald-600/20 flex items-center justify-between cursor-pointer" data-count="5">
              <span>Send 5 requests</span>
              <span class="text-[10px] font-mono text-emerald-400 font-semibold">5x</span>
            </button>
            <button class="dropdown-lexis-item w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-emerald-600/20 flex items-center justify-between cursor-pointer" data-count="10">
              <span>Send 10 requests</span>
              <span class="text-[10px] font-mono text-emerald-400 font-semibold">10x</span>
            </button>
            <button class="dropdown-lexis-item w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-emerald-600/20 flex items-center justify-between cursor-pointer" data-count="15">
              <span>Send 15 requests</span>
              <span class="text-[10px] font-mono text-emerald-400 font-semibold">15x</span>
            </button>
            <button class="dropdown-lexis-item w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-emerald-600/20 flex items-center justify-between cursor-pointer" data-count="25">
              <span>Send 25 requests</span>
              <span class="text-[10px] font-mono text-emerald-400 font-semibold">25x</span>
            </button>
            <button class="dropdown-lexis-item w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-emerald-600/20 flex items-center justify-between cursor-pointer" data-count="50">
              <span>Send 50 requests</span>
              <span class="text-[10px] font-mono text-emerald-400 font-semibold">50x</span>
            </button>
            <button class="dropdown-lexis-item w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-emerald-600/20 flex items-center justify-between cursor-pointer" data-count="100">
              <span>Send 100 requests</span>
              <span class="text-[10px] font-mono text-emerald-400 font-semibold">100x</span>
            </button>
          </div>
        </div>

        <!-- Reset Layout Button -->
        <button id="btn-lexis-reset" class="btn-tactile px-3 py-1.5 text-xs text-[#8b949e] hover:text-[#f0f3f6] flex items-center gap-1.5 cursor-pointer" title="Reset dragged boxes and pan to original positions">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
          <span>Reset layout</span>
        </button>

        <span class="text-[11px] font-mono text-[#656d76] ml-2 hidden sm:inline">&bull; Drag boxes or canvas to rearrange</span>

      </section>

      <!-- Step Telemetry Status Banner -->
      <div id="lexis-step-banner" class="w-full mb-5 telemetry-banner px-3.5 py-2 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <span class="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 animate-pulse"></span>
          <span id="lexis-step-text" class="text-[#d1d9e0] truncate font-medium">Ready: Trigger a pack of requests to inspect audio, token streams, and speech synthesis through the AI Tier.</span>
        </div>
        <span id="lexis-step-badge" class="text-[11px] font-mono text-blue-400 px-2 py-0.5 rounded bg-[#162030] border border-[#20324c] whitespace-nowrap ml-3">Ready</span>
      </div>

      <!-- Vertical Topology Architecture Diagram -->
      <section id="lexis-diagram-card" class="relative bg-[#0b0d12] border border-[#1c222e] rounded-xl p-8 mb-2 overflow-hidden min-h-[820px] canvas-pannable select-none" aria-label="Lexis Architecture Schematic">
        
        <!-- Canvas for Dynamic Packet & Signal Bus Lines -->
        <canvas id="lexis-flow-canvas" class="absolute inset-0 w-full h-full pointer-events-none z-10"></canvas>

        <div id="lexis-canvas-world" class="relative z-20 flex flex-col items-center w-full max-w-[1140px] mx-auto space-y-12 sm:space-y-14 py-4">
          
          <!-- TIER 1: Student Client Endpoint (Top) -->
          <div id="lexis-node-client" class="lexis-draggable-node hardware-node px-6 py-4 w-72 text-center flex flex-col items-center justify-center gap-1 shadow-lg">
            <div class="flex items-center justify-center gap-2 mb-0.5">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-xs uppercase font-bold text-emerald-400 tracking-wide whitespace-nowrap">Student Client Station</span>
            </div>
            <div class="text-[11px] text-zinc-200 font-mono font-medium">WS PCM Stream · Real-Time Mic</div>
            <div class="text-[9px] text-zinc-400 font-mono">16kHz 16-bit Low-Latency Audio</div>
            <!-- Live VU Level Meter -->
            <div class="flex items-center justify-center gap-0.5 mt-1" title="Mic Input Active">
              <span class="w-1 h-2 rounded-sm bg-emerald-500"></span>
              <span class="w-1 h-3 rounded-sm bg-emerald-500"></span>
              <span class="w-1 h-4 rounded-sm bg-emerald-400"></span>
              <span class="w-1 h-2.5 rounded-sm bg-emerald-500"></span>
              <span class="w-1 h-1.5 rounded-sm bg-[#223028]"></span>
            </div>
          </div>

          <!-- TIER 2: Edge Routing & Application Services (Structured Layout) -->
          <div class="w-full flex flex-col gap-10 px-4 sm:px-10">
            
            <!-- Row 2A: API Gateway (Center) -->
            <div class="w-full flex justify-center items-center">
              <div id="lexis-node-gateway" class="lexis-draggable-node hardware-node px-6 py-4 w-72 text-center flex flex-col items-center justify-center gap-1 shadow-lg">
                <div class="flex items-center justify-center gap-2 mb-0.5">
                  <svg class="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
                  <span class="text-xs uppercase font-bold text-blue-400 tracking-wide whitespace-nowrap">API Gateway</span>
                </div>
                <div class="text-[11px] text-zinc-200 font-mono font-medium">Duplex Tunnel Router</div>
                <div class="text-[9px] text-zinc-400 font-mono">Edge WebSocket Ingress &amp; Egress</div>
              </div>
            </div>

            <!-- Row 2B: Curriculum Service (Left) & Session Service (Center) -->
            <div class="w-full grid grid-cols-3 items-center">
              <div class="flex justify-start">
                <!-- Node: Curriculum Service -->
                <div id="lexis-node-curriculum" class="lexis-draggable-node hardware-node px-5 py-4 w-64 text-center flex flex-col items-center justify-center gap-1 shadow-lg">
                  <div class="flex items-center justify-center gap-2 mb-0.5">
                    <svg class="w-4 h-4 text-teal-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                    <span class="text-xs uppercase font-bold text-teal-400 tracking-wide whitespace-nowrap">Curriculum Service</span>
                  </div>
                  <div class="text-[11px] text-zinc-200 font-mono font-medium">Lesson Prompts &amp; Rubrics</div>
                  <div class="text-[9px] text-zinc-400 font-mono">Pedagogical State Model</div>
                </div>
              </div>
              <div class="flex justify-center">
                <!-- Node: Session Service -->
                <div id="lexis-node-session" class="lexis-draggable-node hardware-node px-5 py-4 w-64 text-center flex flex-col items-center justify-center gap-1 shadow-lg">
                  <div class="flex items-center justify-center gap-2 mb-0.5">
                    <svg class="w-4 h-4 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span class="text-xs uppercase font-bold text-purple-400 tracking-wide whitespace-nowrap">Session Service</span>
                  </div>
                  <div class="text-[11px] text-zinc-200 font-mono font-medium">PostgreSQL State DB</div>
                  <div class="text-[9px] text-zinc-400 font-mono">Active Turn &amp; History Cache</div>
                </div>
              </div>
              <div class="flex justify-end">
                <!-- Spacer for balance with Curriculum Service on the left -->
              </div>
            </div>

          </div>

          <!-- TIER 3: Architectural Plane Demarcation Boundary -->
          <div class="w-full relative my-2">
            <div class="border-b border-dashed border-[#2b3548] w-full"></div>
            <div class="absolute left-6 -top-2.5 bg-[#0b0d12] px-2 text-[10px] font-mono text-[#656d76] uppercase tracking-wider">
              Application State Plane
            </div>
            <div class="absolute right-6 -top-2.5 bg-[#0b0d12] px-2 text-[10px] font-mono text-blue-400 uppercase tracking-wider font-semibold">
              Low-Latency Inference Tier
            </div>
            <!-- Center Duplex Tunnel Indicator -->
            <div class="absolute left-1/2 -translate-x-1/2 -top-3.5 bg-[#131924] border border-[#2b3952] px-3.5 py-1 rounded text-[11px] font-mono text-[#93c5fd] flex items-center gap-1.5 shadow-md">
              <span>&#8645; WebSocket Full-Duplex Tunnel</span>
            </div>
          </div>

          <!-- TIER 4: Real-Time Audio Pipeline Orchestrator -->
          <div id="lexis-node-harness" class="lexis-draggable-node hardware-node px-8 py-4.5 w-72 text-center flex flex-col items-center justify-center gap-1 shadow-lg ring-1 ring-indigo-500/50">
            <div class="flex items-center justify-center gap-2 mb-0.5">
              <svg class="w-4 h-4 text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
              <span class="text-xs uppercase font-bold text-indigo-400 tracking-wide whitespace-nowrap">Harness Service</span>
            </div>
            <div class="text-xs text-zinc-100 font-mono font-semibold">Audio Pipeline Orchestrator</div>
            <div class="text-[10px] text-indigo-300/90 font-mono">Low-Latency AI Tier Boundary</div>
          </div>

          <!-- TIER 5: Inference Servers (4-Column Balanced Grid) -->
          <div class="w-full grid grid-cols-4 gap-4 sm:gap-6 items-stretch px-2 sm:px-6 pt-2">
            
            <!-- STT Server (Column 1) -->
            <div class="flex justify-center">
              <div id="lexis-node-stt" class="lexis-draggable-node hardware-node px-4 py-4 w-full max-w-[240px] text-center flex flex-col items-center justify-center gap-1 shadow-lg">
                <div class="flex items-center justify-center gap-2 mb-0.5">
                  <svg class="w-4 h-4 text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path></svg>
                  <span class="text-xs uppercase font-bold text-emerald-400 tracking-wide whitespace-nowrap">STT Server</span>
                </div>
                <div class="text-[11px] text-zinc-200 font-mono font-medium">Fast Whisper Ingestion</div>
                <div class="text-[9px] text-zinc-400 font-mono">Streaming Text Transcript</div>
              </div>
            </div>

            <!-- Decision Server (Column 2) -->
            <div class="flex justify-center">
              <div id="lexis-node-decision" class="lexis-draggable-node hardware-node px-4 py-4 w-full max-w-[240px] text-center flex flex-col items-center justify-center gap-1 shadow-lg">
                <div class="flex items-center justify-center gap-2 mb-0.5">
                  <svg class="w-4 h-4 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                  <span class="text-xs uppercase font-bold text-purple-400 tracking-wide whitespace-nowrap">Decision Server</span>
                </div>
                <div class="text-[11px] text-zinc-200 font-mono font-medium">Scaffolding &amp; Pedagogy</div>
                <div class="text-[9px] text-zinc-400 font-mono">Adaptive Rubric Analysis</div>
              </div>
            </div>

            <!-- LLM Server (Column 3, Interactive Deep-Dive Trigger) -->
            <div class="flex justify-center">
              <div id="lexis-node-llm" class="lexis-draggable-node hardware-node px-4 py-4 w-full min-w-[200px] max-w-[260px] text-center flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer relative group transition-all hover:border-blue-400" title="Click to unfold Under-The-Hood Architecture Branch">
                <div class="flex items-center justify-center gap-1.5 mb-0.5">
                  <svg class="w-4 h-4 text-blue-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  <span class="text-xs uppercase font-bold text-[#f0f3f6] tracking-wide whitespace-nowrap">LLM Server</span>
                  <span id="badge-node-llm-engine" class="px-1.5 py-0.2 bg-blue-500/20 border border-blue-400/40 rounded text-[9px] font-mono text-blue-300 font-semibold">vLLM</span>
                </div>
                <div class="text-[11px] text-zinc-200 font-mono font-medium">Continuous Batching</div>
                <span class="text-[9px] text-blue-400 font-mono flex items-center justify-center gap-1 whitespace-nowrap group-hover:text-blue-300 font-medium">
                  <span class="inspect-badge-text whitespace-nowrap">Inspect Engine</span>
                  <svg class="w-3 h-3 inspect-chevron transition-transform duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
                </span>
              </div>
            </div>

            <!-- TTS Server (Column 4) -->
            <div class="flex justify-center">
              <div id="lexis-node-tts" class="lexis-draggable-node hardware-node px-4 py-4 w-full max-w-[240px] text-center flex flex-col items-center justify-center gap-1 shadow-lg">
                <div class="flex items-center justify-center gap-2 mb-0.5">
                  <svg class="w-4 h-4 text-cyan-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                  <span class="text-xs uppercase font-bold text-cyan-400 tracking-wide whitespace-nowrap">TTS Server</span>
                </div>
                <div class="text-[11px] text-zinc-200 font-mono font-medium">Kokoro Neural Speech</div>
                <div class="text-[9px] text-zinc-400 font-mono">Real-Time Audio Synthesis</div>
              </div>
            </div>

          </div>

          <!-- TIER 6: Appended Under-The-Hood Branch for LLM Server -->
          <div id="lexis-branch-llm" class="w-full max-w-[1040px] mx-auto mt-4 hidden" aria-label="LLM Server Execution Branch">
            <div class="relative bg-[#080b11] border-2 border-blue-500/50 rounded-xl p-5 shadow-2xl overflow-hidden branch-connector-glow">
              
              <!-- Subtle Branch Header with Top Notch Connector Indicator -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1c2434] relative">
                <div class="flex items-center gap-3">
                  <div class="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 flex-shrink-0">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-sm font-semibold text-white tracking-tight">LLM Server Under-The-Hood Branch</h3>
                      <span id="badge-engine-type" class="px-2 py-0.5 text-[10px] font-mono rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 font-semibold">Continuous Batching &amp; PagedAttention</span>
                    </div>
                    <p class="text-xs text-zinc-400 mt-0.5">Appended execution branch showing request buffering, iteration batching, and memory allocation.</p>
                  </div>
                </div>

                <!-- Engine Switcher Tabs & Close Button -->
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5 bg-[#121620] border border-[#212b3d] p-1 rounded-lg">
                    <button id="btn-switch-vllm" class="px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 bg-blue-600 text-white shadow-sm cursor-pointer" title="vLLM: Iteration-Level Continuous Batching">
                      <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                      <span>vLLM (PagedAttention)</span>
                    </button>
                    <button id="btn-switch-ollama" class="px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5 text-zinc-400 hover:text-white hover:bg-[#1a202c] cursor-pointer" title="Ollama: Fixed Slot Sequential Queue">
                      <span class="text-xs">🦙</span>
                      <span>Ollama (llama.cpp)</span>
                    </button>
                  </div>

                  <!-- Collapse Branch Button -->
                  <button id="btn-close-branch" class="p-1.5 rounded-lg border border-[#232d40] text-zinc-400 hover:text-white hover:bg-[#1c2434] transition-all cursor-pointer" title="Collapse this branch">
                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>

              <!-- Synchronized Pipeline Controls & Telemetry Status -->
              <div class="flex flex-wrap items-center justify-between gap-3 py-2.5 px-3.5 my-3.5 bg-[#0e131d] border border-[#1b2536] rounded-lg">
                <div class="flex items-center gap-2">
                  <button id="btn-engine-trigger-1" class="btn-primary-action px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer" title="Trigger 1 voice request through the synchronized pipeline">
                    <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                    <span>Send Voice Request (Synced)</span>
                  </button>
                  <button id="btn-engine-trigger-3" class="btn-tactile px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer" title="Send 3 concurrent requests to test batching/blocking">
                    <svg class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    <span>Send 3 Concurrent Requests</span>
                  </button>
                  <button id="btn-engine-reset" class="btn-tactile px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer" title="Reset active pipeline and memory">
                    <span>Reset</span>
                  </button>
                </div>

                <!-- Live Pipeline Synchronization Status -->
                <div class="flex items-center gap-4 text-xs font-mono">
                  <div class="flex items-center gap-1.5 text-zinc-400">
                    <span>Pipeline Sync:</span>
                    <span id="val-pipeline-status" class="text-blue-400 font-semibold flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Synced
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 text-zinc-400">
                    <span>Active in GPU:</span>
                    <span id="val-engine-batch" class="text-emerald-400 font-semibold">0</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-zinc-400">
                    <span>Queue Pool:</span>
                    <span id="val-engine-waiting" class="text-purple-400 font-semibold">0</span>
                  </div>
                </div>
              </div>

              <!-- Dynamic 3-Zone Architecture Schematic & Inspector -->
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
                
                <!-- Column 1: Live Interactive 3-Zone Engine Visualizer (8 cols) -->
                <div class="lg:col-span-8 bg-[#090c12] border border-[#1b2332] rounded-lg p-3.5 relative min-h-[350px] flex flex-col justify-between">
                  <div class="flex items-center justify-between mb-3 pb-2 border-b border-[#171f2d]">
                    <div class="flex items-center gap-2">
                      <span id="dot-engine-indicator" class="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                      <span id="title-engine-schematic" class="text-xs font-mono font-semibold text-zinc-200">vLLM: Iteration-Level Continuous Batching &amp; Memory Map</span>
                    </div>
                    <span id="badge-engine-status" class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-medium">Ready</span>
                  </div>

                  <!-- 3-Zone Architecture Layout (Responsive DOM with Zero Text Truncation) -->
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1">
                    
                    <!-- Zone 1: INCOMING REQUEST POOL (3 cols) -->
                    <div class="md:col-span-3 bg-[#0d121c] border border-[#1c2637] rounded-lg p-2.5 flex flex-col">
                      <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-[#182233]">
                        <span class="text-[10px] font-mono font-semibold text-zinc-400 tracking-wider">INCOMING POOL</span>
                        <span id="badge-pool-count" class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">0 queued</span>
                      </div>
                      
                      <!-- Pool items list -->
                      <div id="engine-pool-list" class="flex-1 space-y-1.5 overflow-y-auto max-h-[220px] no-scrollbar">
                        <div class="flex flex-col items-center justify-center h-full py-8 text-center text-zinc-500">
                          <svg class="w-5 h-5 text-zinc-600 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
                          <span class="text-[11px] font-mono">Pool Empty</span>
                          <span class="text-[9px] text-zinc-600">Requests from Decision flow here</span>
                        </div>
                      </div>
                    </div>

                    <!-- Zone 2: CONTINUOUS ITERATION BATCH (5 cols) -->
                    <div class="md:col-span-5 bg-[#0d121c] border border-[#1c2637] rounded-lg p-2.5 flex flex-col justify-between">
                      <div>
                        <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-[#182233]">
                          <span id="label-batch-header" class="text-[10px] font-mono font-semibold text-blue-400 tracking-wider">CONTINUOUS ITERATION BATCH</span>
                          <span id="badge-batch-active-count" class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30">0 active</span>
                        </div>

                        <!-- Active batch items list -->
                        <div id="engine-batch-list" class="space-y-2 overflow-y-auto max-h-[200px] no-scrollbar">
                          <div class="flex flex-col items-center justify-center py-8 text-center text-zinc-500">
                            <span class="text-[11px] font-mono">Waiting for inference requests...</span>
                            <span class="text-[9px] text-zinc-600 mt-0.5">Trigger a voice turn in the diagram</span>
                          </div>
                        </div>
                      </div>

                      <!-- Iteration ticker bar at bottom of Zone 2 -->
                      <div class="mt-2 pt-1.5 border-t border-[#182233] flex items-center justify-between text-[10px] font-mono">
                        <div class="flex items-center gap-1.5 text-blue-300 truncate">
                          <svg class="w-3 h-3 text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                          <span id="text-iteration-ticker" class="truncate">Forward Pass: Standby</span>
                        </div>
                        <span id="val-iteration-tokens-sec" class="text-zinc-500 flex-shrink-0">0 tok/s</span>
                      </div>
                    </div>

                    <!-- Zone 3: STREAM TO HARNESS (4 cols) -->
                    <div class="md:col-span-4 bg-[#0d121c] border border-[#1c2637] rounded-lg p-2.5 flex flex-col justify-between">
                      <div>
                        <div class="flex items-center justify-between mb-2 pb-1.5 border-b border-[#182233]">
                          <span class="text-[10px] font-mono font-semibold text-emerald-400 tracking-wider">STREAM TO HARNESS (SSE)</span>
                          <span id="badge-egress-status" class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">SSE Buffer</span>
                        </div>

                        <!-- Live Token Buffer display -->
                        <div class="bg-[#080b11] border border-[#1a2332] rounded p-2 mb-2 font-mono text-[10px]">
                          <div class="text-[9px] text-zinc-500 mb-1 flex items-center justify-between">
                            <span>LIVE CLAUSE BUFFER:</span>
                            <span id="text-clause-status" class="text-zinc-500">Idle</span>
                          </div>
                          <div id="box-stream-tokens" class="min-h-[42px] max-h-[56px] overflow-y-auto text-zinc-300 leading-snug font-sans text-xs italic no-scrollbar">
                            Awaiting token stream from LLM forward pass...
                          </div>
                        </div>

                        <!-- 3-Step Egress Protocol List (with full text, NO truncation!) -->
                        <div class="space-y-1 text-[10px] font-mono">
                          <div class="flex items-start gap-1.5 text-zinc-400">
                            <span class="text-emerald-400 font-bold">&bull;</span>
                            <span><strong class="text-zinc-300">SSE Chunking:</strong> Token-by-token stream</span>
                          </div>
                          <div class="flex items-start gap-1.5 text-zinc-400">
                            <span class="text-emerald-400 font-bold">&bull;</span>
                            <span><strong class="text-zinc-300">Boundary Detect:</strong> '.', '!', '?' split</span>
                          </div>
                          <div class="flex items-start gap-1.5 text-cyan-400">
                            <span class="text-cyan-400 font-bold">&bull;</span>
                            <span><strong class="text-zinc-300">Fast Egress:</strong> Streams early to TTS</span>
                          </div>
                        </div>
                      </div>

                      <!-- Egress status pill -->
                      <div id="egress-notification" class="mt-2 py-1 px-2 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 flex items-center justify-between">
                        <span>Harness Egress</span>
                        <span id="egress-pipeline-pill" class="text-zinc-500">Standby</span>
                      </div>

                    </div>

                  </div>
                </div>

                <!-- Column 2: Memory & Concurrency Inspector (4 cols) -->
                <div class="lg:col-span-4 flex flex-col gap-3.5">
                  
                  <!-- KV Cache Memory Blocks / Slot Allocator -->
                  <div class="bg-[#090c12] border border-[#1b2332] rounded-lg p-3.5 flex-1">
                    <div class="flex items-center justify-between mb-2">
                      <span id="label-memory-title" class="text-xs font-mono text-zinc-300 font-medium">PagedAttention VRAM Block Table</span>
                      <span id="val-memory-efficiency" class="text-[11px] font-mono text-emerald-400 font-semibold">96.4% Utilized</span>
                    </div>

                    <!-- Blocks Grid (24 physical blocks) -->
                    <div id="vram-blocks-grid" class="grid grid-cols-6 gap-1.5 mb-2.5">
                      <!-- Dynamically generated block cells -->
                    </div>

                    <div class="text-[10px] font-mono text-zinc-400 flex items-center justify-between pt-2 border-t border-[#1a2230]">
                      <span id="desc-memory-model">Block size: 16 tokens &bull; Non-contiguous</span>
                      <span id="val-free-blocks" class="text-zinc-500">24 free</span>
                    </div>
                  </div>

                  <!-- Telemetry & Latency Diagnostics -->
                  <div class="bg-[#090c12] border border-[#1b2332] rounded-lg p-3.5">
                    <div class="text-xs font-mono text-zinc-300 font-medium mb-2 pb-1 border-b border-[#171f2d]">Engine Telemetry &amp; SLA Impact</div>
                    <div class="space-y-1.5 text-xs font-mono">
                      <div class="flex justify-between items-center">
                        <span class="text-zinc-400">Time-to-First-Token (TTFT):</span>
                        <span id="metric-ttft" class="text-emerald-400 font-semibold">~85ms (Instant Prefill)</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-zinc-400">Head-of-Line Blocking:</span>
                        <span id="metric-hol" class="text-blue-400 font-semibold">0ms (Zero Blocking)</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-zinc-400">Memory Fragmentation:</span>
                        <span id="metric-frag" class="text-emerald-400 font-semibold">&lt; 3.6% (Near-Zero)</span>
                      </div>
                      <div class="flex justify-between items-center pt-1 border-t border-[#171f2d]">
                        <span class="text-zinc-400">Lexis Real-Time Voice SLA:</span>
                        <span id="metric-sla" class="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold">PASSED (&lt;300ms)</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Technical Comparison Matrix Drawer -->
              <details class="mt-2 pt-3 border-t border-[#1c2434] group">
                <summary class="cursor-pointer text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center justify-between select-none">
                  <span>Architectural Comparison Table: Why vLLM vs Ollama for Real-Time Voice</span>
                  <span class="text-[10px] text-zinc-500 group-open:rotate-180 transition-transform">&#9660;</span>
                </summary>
                
                <div class="overflow-x-auto mt-3">
                  <table class="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr class="border-b border-[#212b3d] text-zinc-400 bg-[#10141d]">
                        <th class="py-2 px-3">Architectural Dimension</th>
                        <th class="py-2 px-3 text-blue-400">vLLM (Production Voice Tutor Engine)</th>
                        <th class="py-2 px-3 text-amber-400">Ollama (llama.cpp Desktop Engine)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#18202e] text-zinc-300">
                      <tr>
                        <td class="py-2 px-3 font-semibold text-zinc-200">Scheduling Mechanism</td>
                        <td class="py-2 px-3 text-blue-300">Iteration-level continuous batching. Requests enter and exit at every single token step without stalling other sequences.</td>
                        <td class="py-2 px-3 text-zinc-400">Request-level slot locking. Once a slot starts, it runs until full completion. Other requests must wait in FIFO queue.</td>
                      </tr>
                      <tr>
                        <td class="py-2 px-3 font-semibold text-zinc-200">KV Cache Memory Management</td>
                        <td class="py-2 px-3 text-blue-300">PagedAttention: Virtual memory paging with dynamic 16-token physical blocks. Zero contiguous pre-allocation.</td>
                        <td class="py-2 px-3 text-zinc-400">Static contiguous buffers: Allocates full context memory up front per slot, wasting 60-80% of VRAM on ungenerated tokens.</td>
                      </tr>
                      <tr>
                        <td class="py-2 px-3 font-semibold text-zinc-200">Head-of-Line (HoL) Blocking</td>
                        <td class="py-2 px-3 text-emerald-400 font-semibold">None: A 500-token answer does not block a 20-token answer from starting or returning speech audio immediately.</td>
                        <td class="py-2 px-3 text-rose-400 font-semibold">Severe: If Slot 0 generates 200 tokens, request #3 is frozen waiting in line even if it only needs a 10-token prompt answer.</td>
                      </tr>
                      <tr>
                        <td class="py-2 px-3 font-semibold text-zinc-200">Concurrency Ceiling (per GPU)</td>
                        <td class="py-2 px-3 text-blue-300">40 to 120+ concurrent conversational sessions on a single A10G/L4/A100 GPU.</td>
                        <td class="py-2 px-3 text-zinc-400">1 to 4 slots max before VRAM exhaustion or severe latency degradation.</td>
                      </tr>
                      <tr>
                        <td class="py-2 px-3 font-semibold text-zinc-200">SLA for Speech-to-Speech Practice</td>
                        <td class="py-2 px-3 text-emerald-400 font-semibold">Strict sub-250ms TTFA achievable (tokens streamed immediately into Harness sentence chunker).</td>
                        <td class="py-2 px-3 text-rose-400 font-semibold">Fails multi-student SLA: queuing delays cause 2s–6s speech pauses, breaking conversational immersion.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </details>

            </div>
          </div>

        </div>
      </section>

    </div>
    <!-- End View 2 -->
  `;

  function mount(containerOrId) {
    if (DiagramDOM && typeof DiagramDOM.mountTemplate === 'function') {
      return DiagramDOM.mountTemplate(containerOrId || 'diagram-viewport', LEXIS_HTML);
    }
    let target = containerOrId;
    if (typeof containerOrId === 'string' && typeof document !== 'undefined') {
      target = document.getElementById(containerOrId);
    }
    if (!target && typeof document !== 'undefined') {
      target = document.getElementById('diagram-viewport');
    }
    if (target) {
      target.insertAdjacentHTML('beforeend', LEXIS_HTML);
    }
    return target;
  }

  return {
    LEXIS_HTML,
    mount
  };
});
