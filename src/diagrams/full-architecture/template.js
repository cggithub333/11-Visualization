/**
 * ESPP Full Microservice Architecture DOM Template (UMD-Lite)
 * Architecture Visualizer Hub (Diagram 3)
 * Redesigned to match the hand-drawn architecture topology and adaptive-context box styling
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const exported = factory();
    module.exports = exported;
    module.exports.FullArchTemplate = exported;
    module.exports.default = exported;
  } else {
    root.FullArchTemplate = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function render() {
    const mvcStageHtml = `
            <div class="mvc-triad-stage">
              <div class="mvc-subnode mvc-service mvc-subnode-view" title="View" data-sub="view">
                <span class="mvc-icon-wrap" data-lucide="eye-dashed">
                  <svg class="lucide lucide-eye-dashed" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13.054 18.946a11 11 0 0 1-2.11 0"/><path d="M13.054 5.054a11 11 0 0 0-2.11-.001"/><path d="M17.072 6.274a11 11 0 0 1 1.753 1.173"/><path d="M18.825 16.552a11 11 0 0 1-1.753 1.174"/><path d="M2.514 13.303a11 11 0 0 1-.452-.954 1 1 0 0 1 0-.697 11 11 0 0 1 .45-.955"/><path d="M21.485 10.697a11 11 0 0 1 .453.955 1 1 0 0 1 0 .697 11 11 0 0 1-.453.954"/><path d="M5.173 7.448a11 11 0 0 1 1.753-1.174"/><path d="M6.926 17.726a11 11 0 0 1-1.753-1.174"/><circle cx="12" cy="12" r="3"/></svg>
                </span>
              </div>
              <div class="mvc-bus mvc-bus-view-ctrl"><div class="mvc-bus-line"></div><div class="mvc-bus-pulse"></div></div>
              <div class="mvc-subnode mvc-controller mvc-subnode-controller" title="Controller" data-sub="controller">
                <span class="mvc-icon-wrap" data-lucide="gamepad-directional">
                  <svg class="lucide lucide-gamepad-directional" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11.146 15.854a1.207 1.207 0 0 1 1.708 0l1.56 1.56A2 2 0 0 1 15 18.828V21a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2.172a2 2 0 0 1 .586-1.414z"/><path d="M18.828 15a2 2 0 0 1-1.414-.586l-1.56-1.56a1.207 1.207 0 0 1 0-1.708l1.56-1.56A2 2 0 0 1 18.828 9H21a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1z"/><path d="M6.586 14.414A2 2 0 0 1 5.172 15H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h2.172a2 2 0 0 1 1.414.586l1.56 1.56a1.207 1.207 0 0 1 0 1.708z"/><path d="M9 3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.172a2 2 0 0 1-.586 1.414l-1.56 1.56a1.207 1.207 0 0 1-1.708 0l-1.56-1.56A2 2 0 0 1 9 5.172z"/></svg>
                </span>
              </div>
              <div class="mvc-bus mvc-bus-ctrl-model"><div class="mvc-bus-line"></div><div class="mvc-bus-pulse"></div></div>
              <div class="mvc-subnode mvc-model mvc-subnode-model" title="Model" data-sub="model">
                <span class="mvc-icon-wrap" data-lucide="book-bookmark">
                  <svg class="lucide lucide-book-bookmark" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M10 2v8l3-2 3 2V2"/></svg>
                </span>
              </div>
            </div>`;

    return `
    <div id="view-full-architecture" class="diagram-view hidden w-full full-arch-viewport">
      
      <!-- Header & Scenario Toolbar -->
      <header class="full-arch-header">
        <div class="full-arch-title-group">
          <h2>
            <span>ESPP Full Microservices Architecture &amp; Cloud Storage</span>
            <span class="live-badge">Live System Dynamic View</span>
          </h2>
          <p>
            Distributed microservices topology matching system routing: Ingress Gateway, Paired Domain Services &amp; DBs, Voice Harness Hub, and AI Inference Cluster.
          </p>
        </div>

        <div class="full-arch-toolbar">
          <!-- Unified Scenario Dropdown -->
          <div class="scenario-selector-group">
            <select id="use-case-select" class="use-case-select" aria-label="Select Architecture Scenario">
              <option value="case-1" selected>Case 1: Ingress &amp; Session Initialization</option>
              <option value="case-2">Case 2: Real-time Speaking Turn &amp; Audio Stream</option>
              <option value="case-3">Case 3: Dynamic Adaptive Context Switch</option>
              <option value="case-4">Case 4: Zero-Disk Buffer &amp; External Storage Upload</option>
              <option value="case-5">Case 5: Transactional Outbox &amp; Message Broker Fan-Out</option>
            </select>
          </div>

          <!-- Simulation Controls -->
          <div class="player-controls">
            <button id="btn-arch-play-scenario" class="btn-ctrl btn-play-scenario" title="Play or pause current scenario">
              <span id="label-arch-play">▶ Play Scenario</span>
            </button>
            <button id="btn-arch-play-pause" class="btn-ctrl" style="display:none;" title="Legacy Play/Pause">
              <span id="icon-arch-play">Play</span>
              <span id="icon-arch-pause" style="display:none;">Pause</span>
            </button>
            <div class="send-request-group">
              <button id="btn-arch-send-request" class="btn-ctrl btn-send-request" title="Send request through pipeline">
                <span class="btn-icon">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="transform: rotate(45deg);"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </span>
                <span id="label-arch-send-count">Send Request</span>
              </button>
              <button id="btn-arch-toggle-batch" class="btn-ctrl btn-batch-toggle" title="Batch Request Size">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
              </button>
              <div id="dropdown-arch-batch" class="dropdown-arch-batch hidden">
                <button class="dropdown-batch-item active" data-count="1">
                  <span>Send 1 Request</span>
                  <span class="batch-badge">1x</span>
                </button>
                <button class="dropdown-batch-item" data-count="3">
                  <span>Send 3 Requests</span>
                  <span class="batch-badge">3x</span>
                </button>
                <button class="dropdown-batch-item" data-count="5">
                  <span>Send 5 Requests</span>
                  <span class="batch-badge">5x</span>
                </button>
              </div>
            </div>
            <button id="btn-arch-reset" class="btn-ctrl" title="Reset scenario state">
              <span class="btn-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </span>
              <span>Reset</span>
            </button>
            <button id="btn-arch-zoom" class="btn-ctrl btn-zoom" title="Toggle 100% Expanded View / Fit Screen">
              <span class="btn-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
              </span>
              <span id="label-arch-zoom">100% View</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Topology Canvas & Dynamic Interactive Layout -->
      <div class="full-arch-grid" id="full-arch-grid">
        
        <!-- SVG Interactive Connection Paths & Packets -->
        <svg id="full-arch-svg" class="full-arch-svg-overlay" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <!-- Default Idle Markers (Crisp Visible Slate-400) -->
            <marker id="arrow-default-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 8 1.5 L 1 5 L 8 8.5 z" fill="#64748b" />
            </marker>
            <marker id="arrow-default" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
            </marker>
            <!-- Cyan Active Markers -->
            <marker id="arrow-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 8 1.5 L 1 5 L 8 8.5 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <!-- Purple Active Markers -->
            <marker id="arrow-purple-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 8 1.5 L 1 5 L 8 8.5 z" fill="#c084fc" />
            </marker>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#a855f7" />
            </marker>
            <!-- Orange Active Markers -->
            <marker id="arrow-orange-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 8 1.5 L 1 5 L 8 8.5 z" fill="#f97316" />
            </marker>
            <marker id="arrow-orange" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#f97316" />
            </marker>
            <!-- Emerald Active Markers -->
            <marker id="arrow-emerald-start" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 8 1.5 L 1 5 L 8 8.5 z" fill="#10b981" />
            </marker>
            <marker id="arrow-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
            </marker>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <g id="svg-paths-group"></g>
          <g id="svg-packets-group"></g>
        </svg>

        <!-- Main Topology Layout -->
        <div class="arch-topology-body">
          
          <!-- Upper Level: Ingress Pipeline + Gateway Hub + Microservices & DB Matrix -->
          <div class="arch-upper-zone">
            
            <!-- Left Ingress Pipeline -->
            <div class="ingress-subzone">
              
              <!-- 1. Frontend (Nextjs/Mobile) -->
              <div class="service-node context-draggable-node" data-node="web-client" id="node-web-client">
                <div class="node-header-row">
                  <div class="node-title-group">
                    <span class="service-icon text-sky-400" data-lucide="monitor">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                    </span>
                    <span class="node-title text-sky-400">Frontend (Next.js/Mobile)</span>
                  </div>
                  <span class="node-port">:3000</span>
                </div>
                <div class="node-subtitle">WS PCM Stream · React 18</div>
                <div class="node-desc">Client Microphone &amp; Audio Player</div>
              </div>

              <!-- 2. Reversed Proxy -->
              <div class="service-node context-draggable-node" data-node="reverse-proxy" id="node-reverse-proxy">
                <div class="node-header-row">
                  <div class="node-title-group">
                    <span class="service-icon text-indigo-400" data-lucide="shield-check">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
                    </span>
                    <span class="node-title text-indigo-400">Reversed Proxy</span>
                  </div>
                  <span class="node-port">:443</span>
                </div>
                <div class="node-subtitle">TLS Termination · Nginx</div>
                <div class="node-desc">HTTPS/WSS Edge Ingress Gate</div>
              </div>

            </div>

            <!-- Center Gateway & IAM Column -->
            <div class="gateway-hub-subzone">
              
              <!-- 3. External IAM Service (Above Gateway) -->
              <div class="service-node context-draggable-node" data-node="iam" id="node-iam">
                <div class="node-header-row">
                  <div class="node-title-group">
                    <span class="service-icon text-amber-400" data-lucide="key-round">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                    </span>
                    <span class="node-title text-amber-400">External IAM Service</span>
                  </div>
                  <span class="badge-protocol badge-iam">Entra ID</span>
                </div>
                <div class="node-subtitle">Microsoft Entra ID</div>
                <div class="node-desc">OIDC &amp; Claims Provider (JWKS)</div>
              </div>

              <!-- 4. API Gateway -->
              <div class="service-node context-draggable-node" data-node="apisix" id="node-apisix">
                <div class="node-header-row">
                  <div class="node-title-group">
                    <span class="service-icon text-purple-400" data-lucide="shield">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                    </span>
                    <span class="node-title text-purple-400">API Gateway</span>
                  </div>
                  <span class="node-port">:9080</span>
                </div>
                <div class="node-subtitle">Apache APISIX Gateway</div>
                <div class="node-desc">WebSocket Router &amp; JWT Verification</div>
              </div>

            </div>

            <!-- Right Microservices & Databases Stack (Paired Rows) -->
            <div class="services-db-stack-subzone">
              
              <!-- Row 1: Service-Class <-> Database Class -->
              <div class="service-db-pair-row">
                <div class="service-node context-draggable-node" data-node="class" id="node-class">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-blue-400" data-lucide="graduation-cap">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
                      </span>
                      <span class="node-title text-blue-400">Service-Class</span>
                    </div>
                    <span class="node-port">:8082</span>
                  </div>
                  <div class="node-subtitle">Spring Boot Modulith</div>
                  <div class="node-desc">Rubrics &amp; Level-Up Domain</div>
                  ${mvcStageHtml}
                </div>

                <div class="service-node context-draggable-node" data-node="db-class" id="node-db-class">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-cyan-400" data-lucide="database">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                      </span>
                      <span class="node-title text-cyan-400">Class Database</span>
                    </div>
                    <span class="badge-protocol badge-sql">:5432</span>
                  </div>
                  <div class="node-subtitle">SQL Database · PostgreSQL Relational</div>
                  <div class="node-desc">Student Grading &amp; Rubrics Store</div>
                </div>
              </div>

              <!-- Row 2: Service-Curriculum <-> Database Curriculum -->
              <div class="service-db-pair-row">
                <div class="service-node context-draggable-node" data-node="curriculum" id="node-curriculum">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-blue-400" data-lucide="book-open">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                      </span>
                      <span class="node-title text-blue-400">Service-Curriculum</span>
                    </div>
                    <span class="node-port">:3001</span>
                  </div>
                  <div class="node-subtitle">Spring Boot Modulith</div>
                  <div class="node-desc">CEFR Syllabus &amp; Pedagogy</div>
                  ${mvcStageHtml}
                </div>

                <div class="service-node context-draggable-node" data-node="db-curriculum" id="node-db-curriculum">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-cyan-400" data-lucide="database">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                      </span>
                      <span class="node-title text-cyan-400">Curriculum Database</span>
                    </div>
                    <span class="badge-protocol badge-sql">:5432</span>
                  </div>
                  <div class="node-subtitle">SQL Database · PostgreSQL Relational</div>
                  <div class="node-desc">Lesson Topics &amp; Criteria Tree</div>
                </div>
              </div>

              <!-- Row 3: Service-Agent <-> Database Agent (Redis) -->
              <div class="service-db-pair-row">
                <div class="service-node context-draggable-node" data-node="agent" id="node-agent">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-blue-400" data-lucide="bot">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                      </span>
                      <span class="node-title text-blue-400">Service-Agent</span>
                    </div>
                    <span class="node-port">:50051</span>
                  </div>
                  <div class="node-subtitle">gRPC / Go Engine</div>
                  <div class="node-desc">Tone FSM &amp; Context Calibration</div>
                  ${mvcStageHtml}
                </div>

                <div class="service-node context-draggable-node" data-node="redis" id="node-redis">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-emerald-400" data-lucide="layers">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0l8.57-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
                      </span>
                      <span class="node-title text-emerald-400">Agent Memory (Redis)</span>
                    </div>
                    <span class="badge-protocol badge-nosql">:6379</span>
                  </div>
                  <div class="node-subtitle">NoSQL Database · Redis In-Memory Cache</div>
                  <div class="node-desc">Conversation State &amp; Directives</div>
                </div>
              </div>

              <!-- Row 4: Service-Notification <-> Message Broker (RabbitMQ) -->
              <div class="service-db-pair-row">
                <div class="service-node context-draggable-node" data-node="notification" id="node-notification">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-blue-400" data-lucide="bell">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                      </span>
                      <span class="node-title text-blue-400">Service-Notification</span>
                    </div>
                    <span class="node-port">:8083</span>
                  </div>
                  <div class="node-subtitle">Spring Boot Consumer</div>
                  <div class="node-desc">AMQP Consumer · Web Push</div>
                  ${mvcStageHtml}
                </div>

                <div class="service-node context-draggable-node" data-node="rabbitmq" id="node-rabbitmq">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-rose-400" data-lucide="mail">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </span>
                      <span class="node-title text-rose-400">Message Broker</span>
                    </div>
                    <span class="badge-protocol badge-broker">AMQP</span>
                  </div>
                  <div class="node-subtitle">RabbitMQ 0-9-1</div>
                  <div class="node-desc">Fan-Out Outbox Topic Exchange</div>
                </div>
              </div>

              <!-- Row 5: Session Service <-> Database Session -->
              <div class="service-db-pair-row">
                <div class="service-node context-draggable-node" data-node="session" id="node-session">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-blue-400" data-lucide="clipboard-list">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                      </span>
                      <span class="node-title text-blue-400">Session Service</span>
                    </div>
                    <span class="node-port">:8080</span>
                  </div>
                  <div class="node-subtitle">Spring Boot Modulith</div>
                  <div class="node-desc">REST &amp; Outbox Event Publisher</div>
                  ${mvcStageHtml}
                </div>

                <div class="service-node context-draggable-node" data-node="postgres" id="node-postgres">
                  <div class="node-header-row">
                    <div class="node-title-group">
                      <span class="service-icon text-cyan-400" data-lucide="database">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                      </span>
                      <span class="node-title text-cyan-400">Database Session</span>
                    </div>
                    <span class="badge-protocol badge-sql">:5432</span>
                  </div>
                  <div class="node-subtitle">SQL Database · PostgreSQL Relational</div>
                  <div class="node-desc">Transactional Outbox &amp; Session DB</div>
                </div>
              </div>

            </div>

          </div>

          <!-- Mid Level: Voice Harness Orchestrator & Harness Database -->
          <div class="arch-mid-zone">
            <div class="harness-storage-pair-row">
              
              <!-- Harness Service -->
              <div class="service-node context-draggable-node" data-node="harness" id="node-harness">
                <div class="node-header-row">
                  <div class="node-title-group">
                    <span class="service-icon text-blue-400" data-lucide="activity">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    </span>
                    <span class="node-title text-blue-400 font-bold">Harness Service</span>
                  </div>
                  <span class="node-port">:8081</span>
                </div>
                <div class="node-subtitle">Turn FSM Engine · Audio Mux</div>
                <div class="node-desc">&lt;45 Tok Directive Injector &amp; Orchestration</div>
                ${mvcStageHtml}
              </div>

              <!-- Database Harness Service (External Storage Service) -->
              <div class="service-node context-draggable-node" data-node="cloudflare-r2" id="node-cloudflare-r2">
                <div class="node-header-row">
                  <div class="node-title-group">
                    <span class="service-icon text-amber-400" data-lucide="cloud">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                    </span>
                    <span class="node-title text-amber-400">Database Harness Service</span>
                  </div>
                  <span class="badge-protocol badge-storage">S3 / R2</span>
                </div>
                <div class="node-subtitle">External Storage Service · Redis Zero-Disk RAM + Cloudflare R2</div>
                <div class="node-desc" style="display:flex;align-items:center;justify-content:space-between;">
                  <span id="label-audio-chunks">Buffer: 0 chunks</span>
                  <span class="r2-badge" id="badge-r2-status">Standby</span>
                </div>
              </div>

            </div>
          </div>

          <!-- Bottom Level: AI Speech & Reasoning Cluster (Fanning from Harness) -->
          <div class="arch-ai-zone">
            
            <!-- STT Server (Down-Left) -->
            <div class="service-node context-draggable-node" data-node="ai-voice" id="node-ai-voice">
              <div class="node-header-row">
                <div class="node-title-group">
                  <span class="service-icon text-teal-400" data-lucide="mic">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  </span>
                  <span class="node-title text-teal-400">STT Server</span>
                </div>
                <span class="node-port">:8000</span>
              </div>
              <div class="node-subtitle">Faster-Whisper Engine</div>
              <div class="node-desc">Streaming PCM ➔ Real-Time Transcripts</div>
            </div>

            <!-- Decision Server & LLM Server Stack (Down-Center) -->
            <div class="decision-llm-stack">
              <!-- Decision Server -->
              <div class="service-node context-draggable-node" data-node="laya" id="node-laya">
                <div class="node-header-row">
                  <div class="node-title-group">
                    <span class="service-icon text-purple-400" data-lucide="cpu">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
                    </span>
                    <span class="node-title text-purple-400">Decision Server</span>
                  </div>
                  <span class="badge-protocol badge-decision">:8092</span>
                </div>
                <div class="node-subtitle">Intent Classification</div>
                <div class="node-desc">Subcontext &amp; Anti-Deadlock Engine</div>
              </div>

              <!-- LLM Server (Stacked Directly Below Decision Server) -->
              <div class="service-node context-draggable-node" data-node="vllm" id="node-vllm">
                <div class="node-header-row">
                  <div class="node-title-group">
                    <span class="service-icon text-fuchsia-400" data-lucide="brain-circuit">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>
                    </span>
                    <span class="node-title text-fuchsia-400">LLM Server</span>
                  </div>
                  <span class="badge-protocol badge-llm">:8000</span>
                </div>
                <div class="node-subtitle">Qwen-2.5B-INSTRUCT · vLLM</div>
                <div class="node-desc">Directive Reasoning &amp; Dialogue Flow</div>
              </div>
            </div>

            <!-- TTS Server (Down-Right) -->
            <div class="service-node context-draggable-node" data-node="tts" id="node-tts">
              <div class="node-header-row">
                <div class="node-title-group">
                  <span class="service-icon text-emerald-400" data-lucide="volume-2">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                  </span>
                  <span class="node-title text-emerald-400">TTS Server</span>
                </div>
                <span class="node-port">:8000</span>
              </div>
              <div class="node-subtitle">Kokoro TTS Engine</div>
              <div class="node-desc">Speech Synthesis &amp; Streaming Audio Return</div>
            </div>

          </div>

        </div>

      </div>

      <!-- Live Telemetry Inspector Card -->
      <footer class="telemetry-panel" id="telemetry-panel">
        <div class="telemetry-step-info">
          <div class="telemetry-badge" id="telemetry-case-label">CASE 1 · STEP 1/5</div>
          <div class="telemetry-desc" id="telemetry-desc-label">Student initiates connection handshake with APISIX Gateway</div>
        </div>

        <div class="telemetry-data-box" id="telemetry-data-box">
          <span id="telemetry-payload">{"event": "session.init", "token": "Bearer eyJhbG...", "target": "harness"}</span>
        </div>

        <div class="telemetry-metrics">
          <div class="metric-item">
            <span class="metric-label">Protocol</span>
            <span class="metric-val" id="metric-protocol">HTTP/2</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Latency</span>
            <span class="metric-val" id="metric-latency">4.2 ms</span>
          </div>
        </div>
      </footer>

    </div>
    `;
  }

  function mount(container) {
    if (!container) {
      throw new Error('Target container is required for mounting FullArchTemplate');
    }
    if (typeof container.insertAdjacentHTML === 'function') {
      container.insertAdjacentHTML('beforeend', render());
    } else {
      container.innerHTML += render();
    }
    if (typeof lucide !== 'undefined' && typeof lucide.createIcons === 'function') {
      try {
        lucide.createIcons();
      } catch (e) {
        // Safe fallback in non-browser or test runner environments
      }
    }
  }

  return {
    render: render,
    mount: mount
  };
});
