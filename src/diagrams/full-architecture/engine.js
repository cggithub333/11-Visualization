/**
 * ESPP Full Microservice Architecture Simulation Engine (UMD-Lite)
 * Architecture Visualizer Hub (Diagram 3)
 * Redesigned to match the hand-drawn architecture topology and adaptive-context card styling
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    let DiagramRegistry;
    let FullArchTemplate;
    try { DiagramRegistry = require('../../core/registry.js'); } catch (e) {}
    try { FullArchTemplate = require('./template.js'); } catch (e) {}
    if (typeof globalThis !== 'undefined' && globalThis.DiagramRegistry && !DiagramRegistry) {
      DiagramRegistry = globalThis.DiagramRegistry;
    }
    const exported = factory(DiagramRegistry, FullArchTemplate);
    module.exports = exported;
    module.exports.FullArchitectureSimulation = exported.FullArchitectureSimulation;
    module.exports.default = exported;
  } else {
    const exports = factory(root.DiagramRegistry, root.FullArchTemplate);
    root.FullArchitectureSimulation = exports.FullArchitectureSimulation;
  }
})(typeof self !== 'undefined' ? self : this, function (DiagramRegistry, FullArchTemplate) {
  'use strict';

  const SCENARIOS = [
    {
      id: 'case-1',
      title: '1. Ingress & Session Init',
      steps: [
        {
          source: 'web-client',
          target: 'reverse-proxy',
          protocol: 'HTTPS',
          method: 'POST /api/v1/session/start',
          latency: '2.1 ms',
          desc: 'Student initiates speaking session from browser; hits TLS Reverse Proxy',
          payload: '{"studentId": "std_9821", "action": "start_session", "device": "chrome_122"}'
        },
        {
          source: 'reverse-proxy',
          target: 'apisix',
          protocol: 'HTTP/2',
          method: 'PROXY /api/v1/session/start',
          latency: '1.2 ms',
          desc: 'Reverse Proxy terminates TLS and forwards internal HTTP/2 stream to APISIX Gateway',
          payload: '{"proxy": "nginx-ingress", "upstream": "apisix:9080", "tls": "TLS_1_3"}'
        },
        {
          source: 'apisix',
          target: 'iam',
          protocol: 'JWT Bearer',
          method: 'OIDC Token Validation',
          latency: '3.8 ms',
          desc: 'APISIX verifies JWT token signature against Microsoft Entra ID JWKS endpoint',
          payload: '{"iss": "login.microsoftonline.com", "aud": "espp-core", "status": "TOKEN_VALID"}'
        },
        {
          source: 'apisix',
          target: 'session',
          protocol: 'REST',
          method: 'POST /sessions',
          latency: '12.4 ms',
          desc: 'APISIX routes authenticated request to Session Service to provision session state',
          payload: '{"externalId": "sess_842a1", "studentId": "std_9821", "lessonId": "les_a2_04"}'
        },
        {
          source: 'session',
          target: 'postgres',
          protocol: 'Postgres',
          method: 'INSERT INTO session.sessions',
          latency: '5.2 ms',
          desc: 'Session Service persists session record into PostgreSQL ACID cluster',
          payload: '{"schema": "session", "table": "sessions", "rowId": "sess_842a1", "status": "ACTIVE"}'
        },
        {
          source: 'session',
          target: 'harness',
          protocol: 'REST',
          method: 'POST /harness/session/init',
          latency: '8.1 ms',
          desc: 'Session Service signals Voice Harness to instantiate Turn FSM & audio buffers',
          payload: '{"sessionId": "sess_842a1", "mode": "VOICE_INTERACTIVE", "targetTurns": 8}'
        }
      ]
    },
    {
      id: 'case-2',
      title: '2. Real-time Speaking Turn',
      steps: [
        {
          source: 'web-client',
          target: 'reverse-proxy',
          protocol: 'WebSocket',
          method: 'WS audio_chunk (AAC-ADTS)',
          latency: '4.5 ms',
          desc: 'Student speaks into microphone; browser streams AAC-ADTS audio chunks via WebSocket',
          payload: '{"type": "audio_chunk", "codec": "aac-adts", "sampleRate": 24000, "bytes": 4096}'
        },
        {
          source: 'reverse-proxy',
          target: 'apisix',
          protocol: 'WS Proxy',
          method: 'WS Tunnel /ws/audio',
          latency: '1.4 ms',
          desc: 'Reverse Proxy forwards duplex WebSocket audio stream to APISIX Gateway',
          payload: '{"tunnel": "duplex-ws", "seq": 14, "upstream": "apisix:9080"}'
        },
        {
          source: 'apisix',
          target: 'harness',
          protocol: 'WebSocket',
          method: 'WS /ws/speech_stream',
          latency: '2.1 ms',
          desc: 'APISIX streams audio chunks directly down to Voice Harness Orchestrator',
          payload: '{"proxy": "apisix", "downstream": "harness:8081", "chunkSeq": 14}'
        },
        {
          source: 'harness',
          target: 'cloudflare-r2',
          protocol: 'RESP',
          method: 'LPUSH session:842a1:audio',
          latency: '1.8 ms',
          desc: 'Harness buffers raw audio chunk into Redis RAM (Zero-Disk in-memory ring buffer)',
          payload: '{"key": "session:842a1:audio", "chunk": 14, "mode": "zero-disk-ram"}'
        },
        {
          source: 'harness',
          target: 'ai-voice',
          protocol: 'gRPC',
          method: 'POST /stt/transcribe',
          latency: '185.0 ms',
          desc: 'Faster-Whisper STT converts real-time audio stream into text transcript',
          payload: '{"transcript": "I think electric cars are very good for the environment.", "confidence": 0.94}'
        },
        {
          source: 'harness',
          target: 'laya',
          protocol: 'HTTP/2',
          method: 'POST /intent/classify',
          latency: '48.6 ms',
          desc: 'Decision Server (ModernBERT 421M System 1) classifies turn intent in <70ms',
          payload: '{"intent": "OPINION_ARGUMENT", "relevance": 0.91, "cefrScore": "B1.2", "system1": true}'
        },
        {
          source: 'laya',
          target: 'vllm',
          protocol: 'HTTP/REST',
          method: 'POST /v1/chat/completions',
          latency: '210.0 ms',
          desc: 'LLM Server (Qwen 7B AWQ System 2) performs deep cognitive reasoning for teacher reply',
          payload: '{"role": "assistant", "reply": "That is a great point! How do you think battery disposal impacts that?"}'
        },
        {
          source: 'harness',
          target: 'tts',
          protocol: 'REST',
          method: 'POST /tts/synthesize',
          latency: '120.4 ms',
          desc: 'TTS Server (Kokoro TTS) synthesizes high-fidelity natural teacher voice stream',
          payload: '{"voice": "en_us_female", "speed": 1.0, "format": "aac", "durationMs": 3200}'
        },
        {
          source: 'harness',
          target: 'web-client',
          protocol: 'WebSocket',
          method: 'WS bot_audio_chunk',
          latency: '12.2 ms',
          desc: 'Synthesized voice audio streamed back to student browser for immediate audio playback',
          payload: '{"event": "audio_playback", "bytes": 16384, "turnIndex": 3}'
        }
      ]
    },
    {
      id: 'case-3',
      title: '3. Dynamic Context Switch',
      steps: [
        {
          source: 'harness',
          target: 'harness',
          protocol: 'Internal FSM',
          method: 'EVAL evaluateTurnFsm()',
          latency: '2.1 ms',
          desc: 'Harness FSM detects: Turn 1 lock expired, 4 good turns achieved, topic similarity < 0.65',
          payload: '{"decision": "CONTEXT_SWITCH", "oldTopic": "Electric Cars", "newTopic": "Public Transit"}'
        },
        {
          source: 'harness',
          target: 'agent',
          protocol: 'gRPC',
          method: 'gRPC GetAgentPersonaConfig(:50051)',
          latency: '16.4 ms',
          desc: 'Harness requests new adaptive subcontext persona & prompt directives from Service-Agent',
          payload: '{"persona": "Debater-B1", "directive": "SUB_CONTEXT_BRIDGE_ADVANCED", "protocol": "gRPC"}'
        },
        {
          source: 'agent',
          target: 'redis',
          protocol: 'RESP',
          method: 'HSET agent:842a1:context',
          latency: '2.4 ms',
          desc: 'Service-Agent updates Redis memory cache with new conversational context and personality',
          payload: '{"persona": "Debater-B1", "subContext": "Public Transit", "ttl": 3600}'
        },
        {
          source: 'harness',
          target: 'curriculum',
          protocol: 'REST',
          method: 'GET /curriculum/subcontext/transit',
          latency: '14.2 ms',
          desc: 'Harness fetches new lesson rubric & criteria from Service-Curriculum for the transitioned topic',
          payload: '{"subContext": "Public Transit", "keyPhrases": ["subway", "congestion", "eco-friendly"]}'
        },
        {
          source: 'harness',
          target: 'laya',
          protocol: 'HTTP',
          method: 'POST /directive/inject',
          latency: '12.8 ms',
          desc: 'Harness injects compact <45 token transition directive into Decision Server',
          payload: '{"directive": "[BRIDGE: validate_then_pivot -> subtopic: public_transit]"}'
        },
        {
          source: 'laya',
          target: 'vllm',
          protocol: 'HTTP/REST',
          method: 'POST /v1/chat/completions (Prefill Cache)',
          latency: '140.0 ms',
          desc: 'vLLM model server generates smooth transitional bridge prompt with zero hallucinations',
          payload: '{"tokens": 38, "bridge": "Speaking of vehicles, how effective is the subway system in your city?"}'
        }
      ]
    },
    {
      id: 'case-4',
      title: '4. Audio Buffer & R2 Upload',
      steps: [
        {
          source: 'web-client',
          target: 'harness',
          protocol: 'WebSocket',
          method: 'WS session_complete',
          latency: '5.2 ms',
          desc: 'Student completes speaking lesson; Harness triggers AudioMuxService.muxAndUpload()',
          payload: '{"event": "SESSION_FINISH", "sessionId": "sess_842a1", "totalTurns": 8}'
        },
        {
          source: 'harness',
          target: 'cloudflare-r2',
          protocol: 'RESP',
          method: 'LRANGE session:842a1:audio 0 -1',
          latency: '3.4 ms',
          desc: 'AudioMuxService pulls all raw AAC-ADTS segments from Redis RAM in single batch',
          payload: '{"key": "session:842a1:audio", "chunksRetrieved": 48, "totalSizeKb": 768}'
        },
        {
          source: 'harness',
          target: 'harness',
          protocol: 'In-Memory',
          method: 'ffmpeg bitstream copy remux',
          latency: '42.0 ms',
          desc: 'Zero-Disk remuxing via ffmpeg: -c:a copy -f mp4 -movflags empty_moov+default_base_moof+frag_keyframe',
          payload: '{"remux": "aac-to-fragmented-m4a", "diskUsage": 0, "outputFile": "conversation.m4a"}'
        },
        {
          source: 'harness',
          target: 'cloudflare-r2',
          protocol: 'S3/R2',
          method: 'S3 PutObject (Multipart)',
          latency: '188.5 ms',
          desc: 'Harness streams fragmented conversation.m4a directly to Cloudflare R2 bucket',
          payload: '{"bucket": "espp-audio", "key": "sessions/sess_842a1/conversation.m4a", "sizeKb": 745}'
        },
        {
          source: 'harness',
          target: 'session',
          protocol: 'REST',
          method: 'PATCH /sessions/842a1/audio_recorded',
          latency: '9.8 ms',
          desc: 'Session Service records R2 asset key and generates 2-hour presigned playback URL',
          payload: '{"audioRecorded": true, "r2Key": "sessions/sess_842a1/conversation.m4a", "ttl": 7200}'
        }
      ]
    },
    {
      id: 'case-5',
      title: '5. RabbitMQ Outbox Fan-Out',
      steps: [
        {
          source: 'session',
          target: 'postgres',
          protocol: 'Postgres',
          method: 'INSERT INTO session.outbox',
          latency: '4.5 ms',
          desc: 'Spring Modulith writes session.completed.v1 event into transactional outbox table',
          payload: '{"eventType": "session.completed.v1", "aggregateId": "sess_842a1", "table": "outbox"}'
        },
        {
          source: 'session',
          target: 'rabbitmq',
          protocol: 'AMQP',
          method: 'BASIC_PUBLISH exchange=topic.session',
          latency: '8.2 ms',
          desc: 'Transactional outbox poller publishes event to RabbitMQ topic exchange',
          payload: '{"exchange": "topic.session", "routingKey": "session.completed.v1", "msgId": "evt_9901"}'
        },
        {
          source: 'rabbitmq',
          target: 'class',
          protocol: 'AMQP',
          method: 'AMQP Deliver (queue=class.sync)',
          latency: '6.4 ms',
          desc: 'RabbitMQ fans out event to Service-Class for student grading & level-up progression',
          payload: '{"service": "Service-Class", "event": "session.completed", "studentLevelUp": true}'
        },
        {
          source: 'rabbitmq',
          target: 'notification',
          protocol: 'AMQP',
          method: 'AMQP Deliver (queue=notification.push)',
          latency: '7.1 ms',
          desc: 'RabbitMQ fans out event to Service-Notification to send student push alert & email',
          payload: '{"service": "Service-Notification", "action": "send_push", "title": "Lesson Completed!"}'
        },
        {
          source: 'class',
          target: 'rabbitmq',
          protocol: 'AMQP',
          method: 'BASIC_ACK',
          latency: '2.0 ms',
          desc: 'Consumer microservices confirm message ACK, ensuring at-least-once delivery',
          payload: '{"status": "ACK", "processedQueues": ["class.sync", "notification.push"]}'
        }
      ]
    }
  ];

  // System Connections Matching Hand-Drawn Topology
  const CONNECTIONS = [
    // Ingress Pipeline (Left to Right)
    ['web-client', 'reverse-proxy'],
    ['reverse-proxy', 'apisix'],

    // IAM Authentication (Vertical Upward)
    ['apisix', 'iam'],

    // Gateway Fan-Out to Microservices (Rightwards)
    ['apisix', 'class'],
    ['apisix', 'curriculum'],
    ['apisix', 'agent'],
    ['apisix', 'notification'],
    ['apisix', 'session'],

    // Microservices to their Dedicated Databases (Horizontal Straight)
    ['class', 'db-class'],
    ['curriculum', 'db-curriculum'],
    ['agent', 'redis'],
    ['notification', 'rabbitmq'],
    ['session', 'postgres'],

    // Ingress Gateway to Harness Voice Orchestrator (Downward)
    ['apisix', 'harness'],

    // Session Service to Harness (Vertical Bidirectional)
    ['session', 'harness'],

    // Harness to Harness Storage (Horizontal Right)
    ['harness', 'cloudflare-r2'],

    // Harness to AI Inference Cluster (Fanning Downwards)
    ['harness', 'ai-voice'],
    ['harness', 'laya'],
    ['laya', 'vllm'],
    ['harness', 'tts']
  ];

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
    }

    generateSquaredPath(x1, y1, x2, y2, yMid) {
      if (y1 === y2) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      }
      if (x1 === x2) {
        return `M ${x1} ${y1} L ${x2} ${y2}`;
      }
      const mid = typeof yMid === 'number' ? yMid : Math.round((y1 + y2) / 2);
      return `M ${x1} ${y1} L ${x1} ${mid} L ${x2} ${mid} L ${x2} ${y2}`;
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

      this.animateServiceMvcCycle(step.source, () => {
        this.emitPacket(step.source, step.target, highlightClass);
      });
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
      if (this.state.timerId) clearInterval(this.state.timerId);
      this.state.timerId = setInterval(() => {
        this.stepNext();
      }, 2400);
      if (this.state.timerId && typeof this.state.timerId.unref === 'function') {
        this.state.timerId.unref();
      }
    }

    pause() {
      this.state.isPlaying = false;
      this.updatePlayPauseIcons();
      if (this.state.timerId) {
        clearInterval(this.state.timerId);
        this.state.timerId = null;
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

      return new Promise((resolve) => {
        const nodeEl = document.getElementById(`node-${nodeId}`);
        if (nodeEl) {
          nodeEl.classList.add('node-active-cyan');
          const t = setTimeout(() => {
            nodeEl.classList.remove('node-active-cyan');
            if (typeof callback === 'function') callback();
            resolve();
          }, 350);
          this._activeMvcTimeouts = this._activeMvcTimeouts || [];
          this._activeMvcTimeouts.push(t);
        } else {
          if (typeof callback === 'function') callback();
          resolve();
        }
      });
    }

    computePathCoordinates(srcId, tgtId, gRect) {
      const srcEl = document.getElementById(`node-${srcId}`);
      const tgtEl = document.getElementById(`node-${tgtId}`);
      if (!srcEl || !tgtEl) return null;

      const s = srcEl.getBoundingClientRect();
      const t = tgtEl.getBoundingClientRect();

      let x1, y1, x2, y2, yMid;

      // 1. Direct Horizontal Left-to-Right Pairs
      if (
        (srcId === 'web-client' && tgtId === 'reverse-proxy') ||
        (srcId === 'reverse-proxy' && tgtId === 'apisix') ||
        (srcId === 'class' && tgtId === 'db-class') ||
        (srcId === 'curriculum' && tgtId === 'db-curriculum') ||
        (srcId === 'agent' && (tgtId === 'redis' || tgtId === 'db-agent')) ||
        (srcId === 'notification' && (tgtId === 'rabbitmq' || tgtId === 'db-notification')) ||
        (srcId === 'session' && (tgtId === 'postgres' || tgtId === 'db-session')) ||
        (srcId === 'harness' && (tgtId === 'cloudflare-r2' || tgtId === 'db-harness'))
      ) {
        x1 = Math.round(s.right - gRect.left);
        y1 = Math.round(s.top + s.height / 2 - gRect.top);
        x2 = Math.round(t.left - gRect.left);
        y2 = Math.round(t.top + t.height / 2 - gRect.top);
        yMid = y1;
      }
      // 2. Direct Vertical Upward Pairs (APISIX -> IAM)
      else if (srcId === 'apisix' && tgtId === 'iam') {
        x1 = Math.round(s.left + s.width / 2 - gRect.left);
        y1 = Math.round(s.top - gRect.top);
        x2 = Math.round(t.left + t.width / 2 - gRect.left);
        y2 = Math.round(t.bottom - gRect.top);
        yMid = Math.round((y1 + y2) / 2);
      }
      // 3. Direct Vertical Downward Pairs (Session -> Harness, Decision -> LLM)
      else if (
        (srcId === 'session' && tgtId === 'harness') ||
        (srcId === 'laya' && tgtId === 'vllm')
      ) {
        x1 = Math.round(s.left + s.width / 2 - gRect.left);
        y1 = Math.round(s.bottom - gRect.top);
        x2 = Math.round(t.left + t.width / 2 - gRect.left);
        y2 = Math.round(t.top - gRect.top);
        yMid = Math.round((y1 + y2) / 2);
      }
      // 4. Gateway Fan-Out to Microservices (Rightwards)
      else if (srcId === 'apisix') {
        x1 = Math.round(s.right - gRect.left);
        y1 = Math.round(s.top + s.height / 2 - gRect.top);
        x2 = Math.round(t.left - gRect.left);
        y2 = Math.round(t.top + t.height / 2 - gRect.top);
        yMid = Math.round((y1 + y2) / 2);
      }
      // 5. Harness down to AI Inference Cluster (STT, Decision, TTS)
      else if (srcId === 'harness' && (tgtId === 'ai-voice' || tgtId === 'laya' || tgtId === 'tts')) {
        let anchorRatio = 0.5;
        if (tgtId === 'ai-voice') anchorRatio = 0.25;
        if (tgtId === 'tts') anchorRatio = 0.75;

        x1 = Math.round(s.left + s.width * anchorRatio - gRect.left);
        y1 = Math.round(s.bottom - gRect.top);
        x2 = Math.round(t.left + t.width / 2 - gRect.left);
        y2 = Math.round(t.top - gRect.top);
        yMid = Math.round((y1 + y2) / 2);
      }
      // 6. Generic Fallback
      else {
        x1 = Math.round(s.left + s.width / 2 - gRect.left);
        y1 = Math.round(s.top + s.height / 2 - gRect.top);
        x2 = Math.round(t.left + t.width / 2 - gRect.left);
        y2 = Math.round(t.top + t.height / 2 - gRect.top);
        yMid = Math.round((y1 + y2) / 2);
      }

      return { x1, y1, x2, y2, yMid };
    }

    emitPacket(srcId, tgtId, colorClass, label) {
      if (this.headless || typeof document === 'undefined') return;
      const packetsGroup = document.getElementById('svg-packets-group');
      const grid = document.getElementById('full-arch-grid');
      if (!packetsGroup || !grid) return;

      const srcEl = document.getElementById(`node-${srcId}`);
      const tgtEl = document.getElementById(`node-${tgtId}`);
      if (!srcEl || !tgtEl) return;

      const gridRect = grid.getBoundingClientRect();
      const coords = this.computePathCoordinates(srcId, tgtId, gridRect);
      if (!coords) return;

      const pathD = this.generateSquaredPath(coords.x1, coords.y1, coords.x2, coords.y2, coords.yMid);

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
      group.setAttribute('class', 'moving-packet');
      group.setAttribute('style', `color: ${fillColor}`);

      const anim = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
      anim.setAttribute('path', pathD);
      anim.setAttribute('dur', '1.1s');
      anim.setAttribute('repeatCount', '1');
      anim.setAttribute('fill', 'freeze');
      group.appendChild(anim);

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('r', '5');
      circle.setAttribute('class', packetClass);
      circle.setAttribute('fill', fillColor);
      group.appendChild(circle);

      let shortLabel = label;
      if (!shortLabel && this.state) {
        const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
        const step = currentCase?.steps?.[this.state.stepIndex];
        if (step) {
          shortLabel = this.getShortProtocolLabel(step);
        }
      }

      if (shortLabel) {
        const textWidth = Math.max(18, Math.round(shortLabel.length * 6.2));
        const pillWidth = textWidth + 8;

        const pill = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        pill.setAttribute('class', 'packet-label-pill');
        pill.setAttribute('x', '8');
        pill.setAttribute('y', '-12');
        pill.setAttribute('width', String(pillWidth));
        pill.setAttribute('height', '15');
        pill.setAttribute('rx', '3');
        pill.setAttribute('ry', '3');
        group.appendChild(pill);

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'packet-label-text');
        text.setAttribute('x', String(8 + pillWidth / 2));
        text.setAttribute('y', '-4.5');
        text.textContent = shortLabel;
        group.appendChild(text);
      }

      packetsGroup.appendChild(group);

      if (typeof anim.beginElement === 'function') {
        try { anim.beginElement(); } catch (e) {}
      }

      setTimeout(() => {
        try { group.remove(); } catch (e) {}
      }, 1200);
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

      const sendBtn = document.getElementById('btn-arch-send-request');
      const labelEl = document.getElementById('label-arch-send-count');
      if (sendBtn) sendBtn.classList.add('sending');

      const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
      const totalSteps = currentCase.steps.length;

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

            this.emitPacket(step.source, step.target, highlightClass, this.getShortProtocolLabel(step));

            await new Promise((r) => setTimeout(r, 1150));
            if (!this.state.isBatchRunning) break;

            const tgtNode = document.getElementById(`node-${step.target}`);
            if (tgtNode) {
              tgtNode.classList.add('node-active');
              setTimeout(() => {
                tgtNode.classList.remove('node-active');
              }, 300);
            }

            await new Promise((r) => setTimeout(r, 150));
          }

          if (req < numRequests && this.state.isBatchRunning) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      } finally {
        this.state.isBatchRunning = false;
        if (sendBtn) sendBtn.classList.remove('sending');
        if (labelEl) {
          labelEl.textContent = this.state.batchSize === 1 ? 'Send Request' : `Send ${this.state.batchSize} Requests`;
        }
      }
    }

    reset() {
      this.pause();
      this.state.isBatchRunning = false;
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

      if (caseLabel) caseLabel.textContent = `${currentCase.title.toUpperCase()} · STEP ${this.state.stepIndex + 1}/${currentCase.steps.length}`;
      if (descLabel) descLabel.textContent = step.desc;
      if (payloadEl) payloadEl.textContent = step.payload;
      if (protoEl) protoEl.textContent = step.protocol;
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

      const srcNode = document.getElementById(`node-${step.source}`);
      const tgtNode = document.getElementById(`node-${step.target}`);

      const highlightClass = this.state.activeCaseId === 'case-3'
        ? 'node-active-purple'
        : (this.state.activeCaseId === 'case-4' ? 'node-active-amber' : 'node-active-cyan');

      if (srcNode) srcNode.classList.add(highlightClass);
      if (tgtNode) tgtNode.classList.add(highlightClass);

      this.highlightPath(step.source, step.target, highlightClass);
    }

    drawConnectionPaths() {
      if (this.headless || typeof document === 'undefined') return;

      const svgGroup = document.getElementById('svg-paths-group');
      const grid = document.getElementById('full-arch-grid');
      if (!svgGroup || !grid) return;

      svgGroup.innerHTML = '';
      const gridRect = grid.getBoundingClientRect();

      this.connections.forEach(([srcId, tgtId]) => {
        const coords = this.computePathCoordinates(srcId, tgtId, gridRect);
        if (!coords) return;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', `path-${srcId}-${tgtId}`);
        path.setAttribute('data-connection', `${srcId}-${tgtId}`);
        path.setAttribute('data-id-alt', `path-${tgtId}-${srcId}`);
        path.setAttribute('class', 'arch-path');

        const d = this.generateSquaredPath(coords.x1, coords.y1, coords.x2, coords.y2, coords.yMid);
        path.setAttribute('d', d);
        path.setAttribute('marker-end', 'url(#arrow-default)');

        svgGroup.appendChild(path);
      });
    }

    highlightPath(srcId, tgtId, colorClass) {
      if (this.headless || typeof document === 'undefined') return;

      document.querySelectorAll('.arch-path').forEach((p) => {
        p.classList.remove('arch-path-active', 'arch-path-purple', 'arch-path-orange', 'arch-path-emerald');
        p.setAttribute('marker-end', 'url(#arrow-default)');
      });

      let path = document.getElementById(`path-${srcId}-${tgtId}`) ||
                 document.getElementById(`path-${tgtId}-${srcId}`) ||
                 document.querySelector(`[data-id-alt="path-${srcId}-${tgtId}"]`) ||
                 document.querySelector(`[data-connection="${srcId}-${tgtId}"]`) ||
                 document.querySelector(`[data-connection="${tgtId}-${srcId}"]`);

      if (path) {
        path.classList.add('arch-path-active');
        if (colorClass === 'node-active-purple') {
          path.classList.add('arch-path-purple');
          path.setAttribute('marker-end', 'url(#arrow-purple)');
        } else if (colorClass === 'node-active-amber') {
          path.classList.add('arch-path-orange');
          path.setAttribute('marker-end', 'url(#arrow-orange)');
        } else {
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
