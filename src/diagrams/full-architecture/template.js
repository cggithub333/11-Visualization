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
          <!-- 5 Canonical Scenarios Selector -->
          <div class="case-selector" role="tablist" aria-label="Architecture Scenarios">
            <button class="case-btn active" data-case="case-1" id="btn-case-1" title="Ingress, JWT verification, and session setup">1. Ingress &amp; Init</button>
            <button class="case-btn" data-case="case-2" id="btn-case-2" title="Real-time voice turn: STT, Laya System 1, vLLM System 2, TTS">2. Speaking Turn</button>
            <button class="case-btn" data-case="case-3" id="btn-case-3" title="Dynamic adaptive context switch during speech">3. Context Switch</button>
            <button class="case-btn" data-case="case-4" id="btn-case-4" title="Zero-disk audio buffer in Redis and multipart upload to Cloudflare R2">4. Audio Buffer &amp; R2</button>
            <button class="case-btn" data-case="case-5" id="btn-case-5" title="Spring Modulith Transactional Outbox fan-out via RabbitMQ">5. RabbitMQ Outbox</button>
          </div>

          <!-- Simulation Controls -->
          <div class="player-controls">
            <button id="btn-arch-play-pause" class="btn-ctrl" title="Play or pause simulation">
              <span id="icon-arch-play">▶ Play</span>
              <span id="icon-arch-pause" style="display:none;">⏸ Pause</span>
            </button>
            <button id="btn-arch-step-next" class="btn-ctrl" title="Step forward one interaction">⏭ Next Step</button>
            <button id="btn-arch-reset" class="btn-ctrl" title="Reset scenario state">↺ Reset</button>
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

          <div class="service-node" data-node="web-client" id="node-web-client">
            <div class="service-node-header">
              <span class="service-icon">💻</span>
              <span class="service-port">:3000</span>
            </div>
            <div class="service-name">Web Client</div>
            <div class="service-desc">Student / Mentor Browser (Next.js React UI)</div>
          </div>

          <div class="service-node" data-node="apisix" id="node-apisix">
            <div class="service-node-header">
              <span class="service-icon">🛡️</span>
              <span class="service-port">:9080</span>
            </div>
            <div class="service-name">Apache APISIX</div>
            <div class="service-desc">API Gateway, JWT Entra JWKS, WS Proxy, CORS</div>
          </div>
        </div>

        <!-- Tier 2: Core Microservices & Event Broker -->
        <div class="tier-row tier-services" id="tier-2">
          <span class="tier-label">Tier 2 · Services</span>

          <div class="service-node" data-node="harness" id="node-harness">
            <div class="service-node-header">
              <span class="service-icon">⚡</span>
              <span class="service-port">:8081</span>
            </div>
            <div class="service-name">Service-Harness</div>
            <div class="service-desc">Voice Orchestrator &amp; AudioMux (TypeScript)</div>
          </div>

          <div class="service-node" data-node="session" id="node-session">
            <div class="service-node-header">
              <span class="service-icon">📋</span>
              <span class="service-port">:8080</span>
            </div>
            <div class="service-name">Service-Session</div>
            <div class="service-desc">Spring Boot Modulith, Outbox &amp; Presigned URLs</div>
          </div>

          <div class="service-node" data-node="class" id="node-class">
            <div class="service-node-header">
              <span class="service-icon">🎓</span>
              <span class="service-port">:8082</span>
            </div>
            <div class="service-name">Service-Class</div>
            <div class="service-desc">Class Enrollment &amp; Grading Level-Up</div>
          </div>

          <div class="service-node" data-node="curriculum" id="node-curriculum">
            <div class="service-node-header">
              <span class="service-icon">📚</span>
              <span class="service-port">:3001</span>
            </div>
            <div class="service-name">Service-Curriculum</div>
            <div class="service-desc">Syllabus, Rubrics &amp; Practice Tasks (NestJS)</div>
          </div>

          <div class="service-node" data-node="agent" id="node-agent">
            <div class="service-node-header">
              <span class="service-icon">🤖</span>
              <span class="service-port">:50051</span>
            </div>
            <div class="service-name">Service-Agent</div>
            <div class="service-desc">AI Personas &amp; gRPC Dynamic Context Configs</div>
          </div>

          <div class="service-node" data-node="notification" id="node-notification">
            <div class="service-node-header">
              <span class="service-icon">🔔</span>
              <span class="service-port">:8083</span>
            </div>
            <div class="service-name">Service-Notification</div>
            <div class="service-desc">Web Push Notifications &amp; Student Alerts</div>
          </div>

          <div class="service-node" data-node="rabbitmq" id="node-rabbitmq">
            <div class="service-node-header">
              <span class="service-icon">📬</span>
              <span class="service-port">:5672</span>
            </div>
            <div class="service-name">RabbitMQ Broker</div>
            <div class="service-desc">Topic Exchanges, Outbox Events &amp; DLQ</div>
            <div class="amqp-badge" id="badge-amqp">topic.session</div>
          </div>
        </div>

        <!-- Tier 3: Storage, Caching & External Object Store -->
        <div class="tier-row tier-storage" id="tier-3">
          <span class="tier-label">Tier 3 · Storage</span>

          <div class="service-node" data-node="postgres" id="node-postgres">
            <div class="service-node-header">
              <span class="service-icon">🗄️</span>
              <span class="service-port">:5432</span>
            </div>
            <div class="service-name">PostgreSQL Supabase</div>
            <div class="service-desc">Schemas: session, class, harness, outbox</div>
          </div>

          <div class="service-node" data-node="redis" id="node-redis">
            <div class="service-node-header">
              <span class="service-icon">🧠</span>
              <span class="service-port">:6379</span>
            </div>
            <div class="service-name">Redis Cluster</div>
            <div class="service-desc">Session State &amp; Zero-Disk AAC-ADTS Buffer</div>
            <div class="audio-buffer-pill" id="pill-audio-buffer">
              <span>●</span> <span id="label-audio-chunks">Buffer: 0 chunks</span>
            </div>
          </div>

          <div class="service-node" data-node="cloudflare-r2" id="node-cloudflare-r2">
            <div class="service-node-header">
              <span class="service-icon">☁️</span>
              <span class="service-port">S3 API</span>
            </div>
            <div class="service-name">Cloudflare R2</div>
            <div class="service-desc">External Object Store (Fragmented .m4a)</div>
            <div class="r2-badge" id="badge-r2-status">Standby</div>
          </div>
        </div>

        <!-- Tier 4: AI Services Cluster -->
        <div class="tier-row tier-ai" id="tier-4">
          <span class="tier-label">Tier 4 · AI Engine</span>

          <div class="service-node" data-node="ai-voice" id="node-ai-voice">
            <div class="service-node-header">
              <span class="service-icon">🎙️</span>
              <span class="service-port">:8000</span>
            </div>
            <div class="service-name">Service-AI-Voice</div>
            <div class="service-desc">Whisper / Parakeet STT &amp; Kokoro TTS Engine</div>
          </div>

          <div class="service-node" data-node="laya" id="node-laya">
            <div class="service-node-header">
              <span class="service-icon">⚡</span>
              <span class="service-port">:8092</span>
            </div>
            <div class="service-name">Service-Laya</div>
            <div class="service-desc">ModernBERT-Large 421M (System 1 &lt;70ms)</div>
          </div>

          <div class="service-node" data-node="vllm" id="node-vllm">
            <div class="service-node-header">
              <span class="service-icon">🧠</span>
              <span class="service-port">:8000</span>
            </div>
            <div class="service-name">vLLM Inference</div>
            <div class="service-desc">Qwen 1.5B/7B AWQ (System 2 Deep Reasoning)</div>
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
  }

  return {
    render: render,
    mount: mount
  };
});
