/**
 * ESPP Full Microservice Architecture DOM Template (UMD-Lite)
 * Architecture Visualizer Hub (Diagram 3)
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
            Complete distributed microservices topology (draw.io Tab 0), real-time speech routing, zero-disk audio buffering in Redis, Cloudflare R2 mux upload, and RabbitMQ outbox fan-out.
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
            <button id="btn-arch-step-next" class="btn-ctrl" title="Step forward one interaction">
              <span class="btn-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg>
              </span>
              <span>Next Step</span>
            </button>
            <button id="btn-arch-reset" class="btn-ctrl" title="Reset scenario state">
              <span class="btn-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              </span>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </header>

      <!-- Main 4-Tier Semantic Grid with SVG Overlay -->
      <div class="full-arch-grid" id="full-arch-grid">
        
        <!-- SVG Interactive Connection Paths -->
        <svg id="full-arch-svg" class="full-arch-svg-overlay" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
            </marker>
            <marker id="arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#a855f7" />
            </marker>
            <marker id="arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#f97316" />
            </marker>
            <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
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

        <!-- Tier 1: Client & Ingress Gateway -->
        <div class="tier-row tier-ingress" id="tier-1">
          <span class="tier-label">Tier 1 · Ingress</span>

          <!-- Web Client (Client MVC) -->
          <div class="service-node mvc-card" data-node="web-client" id="node-web-client">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="monitor">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                </span>
                <span class="service-name">Web Client</span>
              </div>
              <span class="service-port">:3000</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">HTTP/WS</span></div>
              <div class="mvc-desc">Next.js Server Actions, Axios, WS Client</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>View / UI</span><span class="badge-protocol">React 18</span></div>
              <div class="mvc-desc">Student &amp; Mentor Real-Time Audio Dashboards</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">Store</span></div>
              <div class="mvc-desc">Zustand State Store &amp; Zod Schema Validation</div>
            </div>
          </div>

          <!-- Apache APISIX Gateway -->
          <div class="service-node mvc-card" data-node="apisix" id="node-apisix">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="shield">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                </span>
                <span class="service-name">Apache APISIX</span>
              </div>
              <span class="service-port">:9080</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Ingress Route</span><span class="badge-protocol">TLS/WS</span></div>
              <div class="mvc-desc">Entra JWKS Verification, WebSocket Proxy</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Traffic Policy</span><span class="badge-protocol">Plugins</span></div>
              <div class="mvc-desc">Rate Limit, CORS, Dynamic Upstream Load Balancing</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Route Config</span><span class="badge-protocol">etcd</span></div>
              <div class="mvc-desc">etcd Discovery, Route Declarations &amp; SSL Certs</div>
            </div>
          </div>

          <!-- External IAM Service -->
          <div class="service-node mvc-card" data-node="iam" id="node-iam">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="key-round">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>
                </span>
                <span class="service-name">External IAM Service</span>
              </div>
              <span class="badge-protocol badge-iam">Entra ID</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>OIDC / OAuth2</span><span class="badge-protocol">HTTPS</span></div>
              <div class="mvc-desc">JWKS Endpoints &amp; JWT Token Grant</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Auth Policy</span><span class="badge-protocol">Claims</span></div>
              <div class="mvc-desc">Enterprise Tenant Policies &amp; Role-Based Access</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Identity Store</span><span class="badge-protocol">Directory</span></div>
              <div class="mvc-desc">MS Graph Directory, User Entities &amp; Security Groups</div>
            </div>
          </div>

        </div>

        <!-- Tier 2: Core Microservices & Event Broker -->
        <div class="tier-row tier-services" id="tier-2">
          <span class="tier-label">Tier 2 · Services</span>

          <!-- Service-Harness -->
          <div class="service-node mvc-card" data-node="harness" id="node-harness">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="activity">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                </span>
                <span class="service-name">Service-Harness</span>
              </div>
              <span class="service-port">:8081</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">WS / REST</span></div>
              <div class="mvc-desc">WS /ws/speech &amp; Audio Stream Endpoints</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Service</span><span class="badge-protocol">FSM Mux</span></div>
              <div class="mvc-desc">Voice Orchestrator, Turn FSM &amp; AudioMux (TypeScript)</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">RAM Ring</span></div>
              <div class="mvc-desc">Zero-Disk AAC-ADTS Ring Buffer (NoSQL Redis)</div>
            </div>
          </div>

          <!-- Service-Session -->
          <div class="service-node mvc-card" data-node="session" id="node-session">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="clipboard-list">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
                </span>
                <span class="service-name">Service-Session</span>
              </div>
              <span class="service-port">:8080</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">REST API</span></div>
              <div class="mvc-desc">REST /sessions, Presigned URL Handshake</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Service</span><span class="badge-protocol">Modulith</span></div>
              <div class="mvc-desc">Spring Boot Modulith, Outbox Publisher</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">JPA / SQL</span></div>
              <div class="mvc-desc">SQL Database (schema: session, table: sessions)</div>
            </div>
          </div>

          <!-- Service-Class -->
          <div class="service-node mvc-card" data-node="class" id="node-class">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="graduation-cap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>
                </span>
                <span class="service-name">Service-Class</span>
              </div>
              <span class="service-port">:8082</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">REST / AMQP</span></div>
              <div class="mvc-desc">REST /classes &amp; Event Consumer Listener</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Service</span><span class="badge-protocol">Domain</span></div>
              <div class="mvc-desc">Enrollment, Grading Rubrics &amp; Level-Up Progression</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">JPA / SQL</span></div>
              <div class="mvc-desc">SQL Database (schema: class, entities: enrollments)</div>
            </div>
          </div>

          <!-- Service-Curriculum -->
          <div class="service-node mvc-card" data-node="curriculum" id="node-curriculum">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="book-open">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                </span>
                <span class="service-name">Service-Curriculum</span>
              </div>
              <span class="service-port">:3001</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">REST Ingress</span></div>
              <div class="mvc-desc">REST /curriculum/syllabus Endpoints (NestJS)</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Service</span><span class="badge-protocol">Pedagogy</span></div>
              <div class="mvc-desc">CEFR Syllabus, Rubrics &amp; Practice Tasks Engine</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">SQL / TypeORM</span></div>
              <div class="mvc-desc">SQL Database (schema: curriculum, tables: lessons)</div>
            </div>
          </div>

          <!-- Service-Agent -->
          <div class="service-node mvc-card" data-node="agent" id="node-agent">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="bot">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                </span>
                <span class="service-name">Service-Agent</span>
              </div>
              <span class="service-port">:50051</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">gRPC / REST</span></div>
              <div class="mvc-desc">gRPC AgentService &amp; Context Calibration Ingress</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Service</span><span class="badge-protocol">Adaptive FSM</span></div>
              <div class="mvc-desc">AI Personas, Dynamic Prompt Directives &amp; Tone FSM</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">NoSQL Mongo</span></div>
              <div class="mvc-desc">MongoDB (Agent Prompts, Persona Configs &amp; Rubrics)</div>
            </div>
          </div>

          <!-- Service-Notification -->
          <div class="service-node mvc-card" data-node="notification" id="node-notification">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="bell">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                </span>
                <span class="service-name">Service-Notification</span>
              </div>
              <span class="service-port">:8083</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">AMQP / Push</span></div>
              <div class="mvc-desc">AMQP Topic Listener &amp; Web Push Ingress</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Service</span><span class="badge-protocol">Dispatcher</span></div>
              <div class="mvc-desc">Multi-Channel Student Alerts &amp; Digest Queue</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">JPA / SQL</span></div>
              <div class="mvc-desc">SQL Database (schema: notification, table: alerts)</div>
            </div>
          </div>

          <!-- Message Broker -->
          <div class="service-node mvc-card" data-node="rabbitmq" id="node-rabbitmq">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="mail">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <span class="service-name">Message Broker</span>
              </div>
              <span class="badge-protocol badge-broker">AMQP 0-9-1</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Protocol Ingress</span><span class="badge-protocol">:5672</span></div>
              <div class="mvc-desc">AMQP 0-9-1 Endpoints &amp; MQTT Protocol Adapters</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Routing Core</span><span class="badge-protocol">Exchanges</span></div>
              <div class="mvc-desc">Topic Exchanges, Outbox Fan-Out &amp; DLQ Routing</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Message Store</span><span class="badge-protocol">Queues</span></div>
              <div class="mvc-desc">Durable Queues &amp; Mnesia Cluster Persistence</div>
            </div>
            <div style="padding: 4px 10px 8px 10px;">
              <div class="amqp-badge" id="badge-amqp">topic.session</div>
            </div>
          </div>

        </div>

        <!-- Tier 3: Storage, Caching & External Object Store -->
        <div class="tier-row tier-storage" id="tier-3">
          <span class="tier-label">Tier 3 · Storage</span>

          <!-- SQL Database -->
          <div class="service-node mvc-card" data-node="postgres" id="node-postgres">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="database">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
                </span>
                <span class="service-name">SQL Database</span>
              </div>
              <span class="badge-protocol badge-sql">:5432</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Connection Pool</span><span class="badge-protocol">PgBouncer</span></div>
              <div class="mvc-desc">TCP Protocol :5432, Transaction Pooling</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Engine</span><span class="badge-protocol">Postgres 16</span></div>
              <div class="mvc-desc">ACID Transactions &amp; WAL Streaming Replication</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Schemas</span><span class="badge-protocol">Relational</span></div>
              <div class="mvc-desc">session, class, harness, notification, outbox</div>
            </div>
          </div>

          <!-- NoSQL Database -->
          <div class="service-node mvc-card" data-node="redis" id="node-redis">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="layers">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.57 3.91a2 2 0 0 0 1.66 0l8.57-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>
                </span>
                <span class="service-name">NoSQL Database</span>
              </div>
              <span class="badge-protocol badge-nosql">:6379</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>RESP Ingress</span><span class="badge-protocol">TCP</span></div>
              <div class="mvc-desc">Redis Serialization Protocol &amp; Cluster Sentinel</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Engine</span><span class="badge-protocol">In-Memory</span></div>
              <div class="mvc-desc">Session State &amp; Key-Value Fast Eviction</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Zero-Disk RAM</span><span class="badge-protocol">ADTS Ring</span></div>
              <div class="mvc-desc">Zero-Disk AAC-ADTS Audio Ring Buffer</div>
            </div>
            <div style="padding: 4px 10px 8px 10px;">
              <div class="audio-buffer-pill" id="pill-audio-buffer">
                <span>●</span> <span id="label-audio-chunks">Buffer: 0 chunks</span>
              </div>
            </div>
          </div>

          <!-- External Storage Service -->
          <div class="service-node mvc-card" data-node="cloudflare-r2" id="node-cloudflare-r2">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="cloud">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>
                </span>
                <span class="service-name">External Storage Service</span>
              </div>
              <span class="badge-protocol badge-storage">S3 API</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>S3 API Ingress</span><span class="badge-protocol">HTTPS</span></div>
              <div class="mvc-desc">Presigned URL Handshake &amp; TLS 1.3 Streaming</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Lifecycle</span><span class="badge-protocol">Multipart</span></div>
              <div class="mvc-desc">Multipart Mux Upload &amp; Global CDN Cache</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Object Store</span><span class="badge-protocol">Buckets</span></div>
              <div class="mvc-desc">Fragmented .m4a Master Audio Chunks Storage</div>
            </div>
            <div style="padding: 4px 10px 8px 10px;">
              <div class="r2-badge" id="badge-r2-status">Standby</div>
            </div>
          </div>

        </div>

        <!-- Tier 4: AI Services Cluster -->
        <div class="tier-row tier-ai" id="tier-4">
          <span class="tier-label">Tier 4 · AI Engine</span>

          <!-- Service-AI-Voice -->
          <div class="service-node mvc-card" data-node="ai-voice" id="node-ai-voice">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="mic">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                </span>
                <span class="service-name">Service-AI-Voice</span>
              </div>
              <span class="service-port">:8000</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">gRPC / REST</span></div>
              <div class="mvc-desc">Speech Stream Endpoints (/stt &amp; /tts)</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Service</span><span class="badge-protocol">Voice AI</span></div>
              <div class="mvc-desc">Whisper / Parakeet STT &amp; Kokoro TTS Engine</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">Weights</span></div>
              <div class="mvc-desc">ONNX Acoustic Models, Tokenizer &amp; Vocoder</div>
            </div>
          </div>

          <!-- Decision Server -->
          <div class="service-node mvc-card" data-node="laya" id="node-laya">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="cpu">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
                </span>
                <span class="service-name">Decision Server</span>
              </div>
              <span class="badge-protocol badge-decision">:8092</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">HTTP API</span></div>
              <div class="mvc-desc">POST /intent/classify Fast Ingress</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Service</span><span class="badge-protocol">System 1</span></div>
              <div class="mvc-desc">Fast Intent &amp; Relevance Classifier (&lt;70ms)</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">ModernBERT</span></div>
              <div class="mvc-desc">ModernBERT-Large 421M Parameters</div>
            </div>
          </div>

          <!-- LLM Server -->
          <div class="service-node mvc-card" data-node="vllm" id="node-vllm">
            <div class="mvc-card-header">
              <div style="display:flex;align-items:center;gap:6px;">
                <span class="service-icon" data-lucide="brain-circuit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>
                </span>
                <span class="service-name">LLM Server</span>
              </div>
              <span class="badge-protocol badge-llm">:8000</span>
            </div>
            <div class="mvc-controller">
              <div class="mvc-label"><span>Controller</span><span class="badge-protocol">OpenAI API</span></div>
              <div class="mvc-desc">POST /v1/chat/completions Stream Ingress</div>
            </div>
            <div class="mvc-service">
              <div class="mvc-label"><span>Service</span><span class="badge-protocol">System 2</span></div>
              <div class="mvc-desc">Deep Pedagogical Reasoning &amp; Dialogue Flow</div>
            </div>
            <div class="mvc-model">
              <div class="mvc-label"><span>Model</span><span class="badge-protocol">Qwen AWQ</span></div>
              <div class="mvc-desc">Qwen 1.5B/7B AWQ PagedAttention Engine</div>
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
