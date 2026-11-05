/**
 * ESPP Full Microservice Architecture Simulation Engine (UMD-Lite)
 * Architecture Visualizer Hub (Diagram 3)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const exported = factory(
      require('../../core/registry.js'),
      require('./template.js')
    );
    module.exports = exported;
    module.exports.FullArchitectureSimulation = exported.FullArchitectureSimulation;
    module.exports.default = exported;
  } else {
    const exported = factory(root.DiagramRegistry, root.FullArchTemplate);
    root.FullArchitectureSimulation = exported.FullArchitectureSimulation;
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
          target: 'apisix',
          protocol: 'HTTPS',
          method: 'POST /api/v1/session/start',
          latency: '4.2 ms',
          desc: 'Student initiates speaking session; APISIX verifies JWT via Entra JWKS',
          payload: '{"studentId": "std_9821", "action": "start_session", "device": "chrome_122"}'
        },
        {
          source: 'apisix',
          target: 'harness',
          protocol: 'HTTP/2',
          method: 'POST /sessions/init',
          latency: '12.5 ms',
          desc: 'APISIX routes request to Service-Harness orchestrator',
          payload: '{"externalSessionId": "sess_842a1", "studentId": "std_9821", "auth": "valid"}'
        },
        {
          source: 'harness',
          target: 'curriculum',
          protocol: 'REST',
          method: 'GET /curriculum/syllabus/rubric',
          latency: '18.2 ms',
          desc: 'Harness fetches lesson rubric, topic guidelines, and target vocabulary',
          payload: '{"lessonId": "les_a2_04", "rubric": "CEFR_B1", "targetTurnCount": 8}'
        },
        {
          source: 'harness',
          target: 'session',
          protocol: 'REST',
          method: 'POST /sessions',
          latency: '14.8 ms',
          desc: 'Harness creates persistent session record in Service-Session (Spring Boot)',
          payload: '{"externalId": "sess_842a1", "lessonId": "les_a2_04", "status": "IN_PROGRESS"}'
        },
        {
          source: 'session',
          target: 'postgres',
          protocol: 'Postgres',
          method: 'INSERT INTO session.sessions',
          latency: '6.1 ms',
          desc: 'Service-Session persists session state into PostgreSQL Supabase cluster',
          payload: '{"schema": "session", "table": "sessions", "rowId": "sess_842a1", "status": "ACTIVE"}'
        }
      ]
    },
    {
      id: 'case-2',
      title: '2. Real-time Speaking Turn',
      steps: [
        {
          source: 'web-client',
          target: 'apisix',
          protocol: 'WebSocket',
          method: 'WS audio_chunk (AAC-ADTS)',
          latency: '8.5 ms',
          desc: 'Student speaks into microphone; browser streams AAC-ADTS audio chunks via WebSocket',
          payload: '{"type": "audio_chunk", "codec": "aac-adts", "sampleRate": 24000, "bytes": 4096}'
        },
        {
          source: 'apisix',
          target: 'harness',
          protocol: 'WS Proxy',
          method: 'WS /ws/speech',
          latency: '2.1 ms',
          desc: 'APISIX proxies real-time audio chunk to Service-Harness',
          payload: '{"proxy": "apisix", "downstream": "harness:8081", "chunkSeq": 14}'
        },
        {
          source: 'harness',
          target: 'redis',
          protocol: 'RESP',
          method: 'LPUSH session:842a1:audio',
          latency: '1.8 ms',
          desc: 'Harness buffers audio chunk into Redis (Zero-Disk in-memory ring buffer)',
          payload: '{"key": "session:842a1:audio", "chunk": 14, "mode": "zero-disk-ram"}'
        },
        {
          source: 'harness',
          target: 'ai-voice',
          protocol: 'gRPC/REST',
          method: 'POST /stt/transcribe',
          latency: '185.0 ms',
          desc: 'Whisper STT converts speech stream into text transcript',
          payload: '{"transcript": "I think electric cars are very good for the environment.", "confidence": 0.94}'
        },
        {
          source: 'harness',
          target: 'laya',
          protocol: 'HTTP',
          method: 'POST /intent/classify',
          latency: '48.6 ms',
          desc: 'Service-Laya (ModernBERT-Large 421M System 1) classifies turn intent in <70ms',
          payload: '{"intent": "OPINION_ARGUMENT", "relevance": 0.91, "cefrScore": "B1.2", "system1": true}'
        },
        {
          source: 'harness',
          target: 'vllm',
          protocol: 'HTTP/REST',
          method: 'POST /v1/chat/completions',
          latency: '210.0 ms',
          desc: 'vLLM Qwen 1.5B/7B AWQ (System 2) generates pedagogical spoken reply',
          payload: '{"role": "assistant", "reply": "That is a great point! How do you think battery disposal impacts that?"}'
        },
        {
          source: 'harness',
          target: 'ai-voice',
          protocol: 'REST',
          method: 'POST /tts/synthesize',
          latency: '120.4 ms',
          desc: 'Kokoro TTS synthesizes high-fidelity natural teacher voice stream',
          payload: '{"voice": "en_us_female", "speed": 1.0, "format": "aac", "durationMs": 3200}'
        },
        {
          source: 'harness',
          target: 'web-client',
          protocol: 'WebSocket',
          method: 'WS bot_audio_chunk',
          latency: '15.2 ms',
          desc: 'Synthesized voice audio streamed back to student browser for immediate playback',
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
          source: 'harness',
          target: 'curriculum',
          protocol: 'REST',
          method: 'GET /curriculum/subcontext/transit',
          latency: '14.2 ms',
          desc: 'Harness fetches new lesson rubric & criteria for the transitioned subcontext',
          payload: '{"subContext": "Public Transit", "keyPhrases": ["subway", "congestion", "eco-friendly"]}'
        },
        {
          source: 'harness',
          target: 'session',
          protocol: 'REST',
          method: 'PATCH /sessions/842a1/context',
          latency: '11.5 ms',
          desc: 'Harness updates active subcontext state in Service-Session for progress tracking',
          payload: '{"externalId": "sess_842a1", "subContext": "Public Transit", "switchedAtTurn": 5}'
        },
        {
          source: 'harness',
          target: 'vllm',
          protocol: 'HTTP',
          method: 'POST /v1/chat/completions (Re-Prompt)',
          latency: '195.0 ms',
          desc: 'vLLM receives updated system prompt with Purple Glowing Burst transition bridge',
          payload: '{"systemPrompt": "Bridge student into public transit: Speaking of electric cars...", "theme": "purple"}'
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
          target: 'redis',
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
          target: 'redis',
          protocol: 'RESP',
          method: 'DEL session:842a1:audio',
          latency: '1.2 ms',
          desc: 'Redis buffer safely unlinked only AFTER Cloudflare R2 confirms upload success',
          payload: '{"action": "DEL", "key": "session:842a1:audio", "status": "CLEARED"}'
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

  class FullArchitectureSimulation {
    constructor(options = {}) {
      this.options = options;
      this.headless = Boolean(options.headless);
      this.scenarios = SCENARIOS;
      this.state = {
        activeCaseId: 'case-1',
        stepIndex: 0,
        isPlaying: false,
        timerId: null,
        audioChunksCount: 0,
        r2Uploaded: false
      };
      this.boundHandlers = {};
    }

    init() {
      if (this.headless || typeof document === 'undefined') {
        return this;
      }
      this.bindDomEvents();
      this.drawConnectionPaths();
      this.renderCurrentState();
      return this;
    }

    bindDomEvents() {
      // Scenario buttons
      const caseBtns = document.querySelectorAll('.case-btn');
      caseBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const caseId = e.currentTarget.getAttribute('data-case');
          this.setCase(caseId);
        });
      });

      // Controls
      const playBtn = document.getElementById('btn-arch-play-pause');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          if (this.state.isPlaying) {
            this.pause();
          } else {
            this.play();
          }
        });
      }

      const nextBtn = document.getElementById('btn-arch-step-next');
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          this.pause();
          this.stepNext();
        });
      }

      const resetBtn = document.getElementById('btn-arch-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.pause();
          this.reset();
        });
      }

      // Resize listener
      this.boundHandlers.resize = () => this.resize();
      window.addEventListener('resize', this.boundHandlers.resize);
    }

    setCase(caseId) {
      const target = this.scenarios.find((s) => s.id === caseId);
      if (!target) return;

      this.state.activeCaseId = caseId;
      this.state.stepIndex = 0;
      this.state.audioChunksCount = caseId === 'case-4' ? 48 : (caseId === 'case-2' ? 14 : 0);
      this.state.r2Uploaded = false;

      if (!this.headless && typeof document !== 'undefined') {
        // Update button active state
        document.querySelectorAll('.case-btn').forEach((b) => {
          if (b.getAttribute('data-case') === caseId) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });
        this.renderCurrentState();
      }
    }

    stepNext() {
      const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
      const maxSteps = currentCase.steps.length;

      if (this.state.stepIndex >= maxSteps - 1) {
        // Loop back or stop
        this.state.stepIndex = 0;
      } else {
        this.state.stepIndex += 1;
      }

      // Update audio buffer counter logic
      if (this.state.activeCaseId === 'case-2') {
        this.state.audioChunksCount = 14 + (this.state.stepIndex * 2);
      } else if (this.state.activeCaseId === 'case-4') {
        if (this.state.stepIndex >= 4) {
          this.state.audioChunksCount = 0;
          this.state.r2Uploaded = true;
        } else {
          this.state.audioChunksCount = 48;
          this.state.r2Uploaded = false;
        }
      }

      if (!this.headless && typeof document !== 'undefined') {
        this.renderCurrentState();
      }

      return currentCase.steps[this.state.stepIndex];
    }

    play() {
      this.state.isPlaying = true;
      this.updatePlayPauseIcons();
      if (this.state.timerId) clearInterval(this.state.timerId);
      this.state.timerId = setInterval(() => {
        this.stepNext();
      }, 2200);
    }

    pause() {
      this.state.isPlaying = false;
      this.updatePlayPauseIcons();
      if (this.state.timerId) {
        clearInterval(this.state.timerId);
        this.state.timerId = null;
      }
    }

    reset() {
      this.state.stepIndex = 0;
      this.state.audioChunksCount = 0;
      this.state.r2Uploaded = false;
      if (!this.headless && typeof document !== 'undefined') {
        this.renderCurrentState();
      }
    }

    updatePlayPauseIcons() {
      if (this.headless || typeof document === 'undefined') return;
      const playIcon = document.getElementById('icon-arch-play');
      const pauseIcon = document.getElementById('icon-arch-pause');
      if (playIcon && pauseIcon) {
        if (this.state.isPlaying) {
          playIcon.style.display = 'none';
          pauseIcon.style.display = 'inline';
        } else {
          playIcon.style.display = 'inline';
          pauseIcon.style.display = 'none';
        }
      }
    }

    renderCurrentState() {
      if (this.headless || typeof document === 'undefined') return;

      const currentCase = this.scenarios.find((s) => s.id === this.state.activeCaseId) || this.scenarios[0];
      const step = currentCase.steps[this.state.stepIndex];
      if (!step) return;

      // 1. Update Telemetry Panel
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

      // 2. Update Audio Buffer & R2 Badges
      const audioPill = document.getElementById('pill-audio-buffer');
      const audioLabel = document.getElementById('label-audio-chunks');
      const r2Badge = document.getElementById('badge-r2-status');

      if (audioLabel) {
        audioLabel.textContent = `Buffer: ${this.state.audioChunksCount} chunks`;
      }
      if (audioPill) {
        if (this.state.audioChunksCount > 0) {
          audioPill.classList.add('pulsing');
        } else {
          audioPill.classList.remove('pulsing');
        }
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

      // 3. Highlight Nodes
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

      // 4. Highlight Connection Path
      this.highlightPath(step.source, step.target, highlightClass);
    }

    drawConnectionPaths() {
      if (this.headless || typeof document === 'undefined') return;

      const svgGroup = document.getElementById('svg-paths-group');
      const grid = document.getElementById('full-arch-grid');
      if (!svgGroup || !grid) return;

      svgGroup.innerHTML = '';
      const gridRect = grid.getBoundingClientRect();

      // Connections topology map
      const connections = [
        ['web-client', 'apisix'],
        ['apisix', 'harness'],
        ['harness', 'curriculum'],
        ['harness', 'session'],
        ['harness', 'redis'],
        ['harness', 'ai-voice'],
        ['harness', 'laya'],
        ['harness', 'vllm'],
        ['harness', 'agent'],
        ['harness', 'cloudflare-r2'],
        ['session', 'postgres'],
        ['session', 'rabbitmq'],
        ['rabbitmq', 'class'],
        ['rabbitmq', 'notification']
      ];

      connections.forEach(([srcId, tgtId]) => {
        const srcEl = document.getElementById(`node-${srcId}`);
        const tgtEl = document.getElementById(`node-${tgtId}`);
        if (!srcEl || !tgtEl) return;

        const srcRect = srcEl.getBoundingClientRect();
        const tgtRect = tgtEl.getBoundingClientRect();

        const x1 = srcRect.left + srcRect.width / 2 - gridRect.left;
        const y1 = srcRect.top + srcRect.height / 2 - gridRect.top;
        const x2 = tgtRect.left + tgtRect.width / 2 - gridRect.left;
        const y2 = tgtRect.top + tgtRect.height / 2 - gridRect.top;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('id', `path-${srcId}-${tgtId}`);
        path.setAttribute('class', 'arch-path');

        // Smooth curve
        const dx = x2 - x1;
        const dy = y2 - y1;
        const cx1 = x1 + dx * 0.1;
        const cy1 = y1 + dy * 0.5;
        const cx2 = x2 - dx * 0.1;
        const cy2 = y2 - dy * 0.5;
        const d = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

        path.setAttribute('d', d);
        path.setAttribute('marker-end', 'url(#arrow)');
        svgGroup.appendChild(path);
      });
    }

    highlightPath(srcId, tgtId, colorClass) {
      if (this.headless || typeof document === 'undefined') return;

      document.querySelectorAll('.arch-path').forEach((p) => {
        p.classList.remove('arch-path-active', 'arch-path-purple', 'arch-path-orange', 'arch-path-emerald');
      });

      let path = document.getElementById(`path-${srcId}-${tgtId}`);
      if (!path) {
        path = document.getElementById(`path-${tgtId}-${srcId}`);
      }

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
      if (!this.headless && typeof window !== 'undefined' && this.boundHandlers.resize) {
        window.removeEventListener('resize', this.boundHandlers.resize);
      }
    }
  }

  // Self-register with DiagramRegistry if present
  if (typeof DiagramRegistry !== 'undefined' && DiagramRegistry && typeof DiagramRegistry.register === 'function') {
    DiagramRegistry.register({
      id: 'full-architecture',
      aliases: ['microservices', 'espp-arch', 'diagram-slot-4'],
      label: '3. ESPP Full Microservices Architecture & Cloud Storage',
      defaultSelected: false,
      mount: (container) => {
        if (FullArchTemplate && typeof FullArchTemplate.mount === 'function') {
          FullArchTemplate.mount(container);
        }
      },
      init: () => {
        if (typeof window !== 'undefined') {
          window.fullArchSim = new FullArchitectureSimulation().init();
          return window.fullArchSim;
        }
      },
      activate: () => {
        if (typeof window !== 'undefined' && window.fullArchSim) {
          window.fullArchSim.activate();
        }
      },
      deactivate: () => {
        if (typeof window !== 'undefined' && window.fullArchSim) {
          window.fullArchSim.deactivate();
        }
      },
      resize: () => {
        if (typeof window !== 'undefined' && window.fullArchSim) {
          window.fullArchSim.resize();
        }
      },
      handleUrlParams: (params) => {
        if (typeof window !== 'undefined' && window.fullArchSim) {
          window.fullArchSim.handleUrlParams(params);
        }
      }
    });
  }

  return {
    FullArchitectureSimulation: FullArchitectureSimulation,
    SCENARIOS: SCENARIOS
  };
});
