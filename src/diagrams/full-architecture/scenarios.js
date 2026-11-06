/**
 * ESPP Full Architecture - scenario data (UMD-Lite).
 * step: { source, target, via?, protocol, label, method, latency, desc, payload, response? }
 * response (sync calls only): { label, latency, desc, payload }. Async broker events have no response.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FullArchScenarios = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const SCENARIOS = [
    {
      id: 'case-1',
      title: '1. Ingress & Session Init',
      steps: [
        {
          source: 'web-client', target: 'reverse-proxy', protocol: 'HTTPS', label: 'Init Session',
          method: 'POST /api/v1/session/start', latency: '2.1 ms',
          desc: 'Student starts a speaking session; the browser hits the TLS Reverse Proxy',
          payload: '{"studentId": "std_9821", "action": "start_session", "device": "chrome_122"}',
          response: { label: 'Edge Ack', latency: '0.8 ms', desc: 'Reverse Proxy confirms the request was accepted at the edge', payload: '{"status": 202, "edge": "accepted"}' }
        },
        {
          source: 'reverse-proxy', target: 'apisix', protocol: 'HTTP/2', label: 'Edge Ingress',
          method: 'PROXY /api/v1/session/start', latency: '1.2 ms',
          desc: 'Reverse Proxy terminates TLS and forwards an internal HTTP/2 stream to the API Gateway',
          payload: '{"proxy": "nginx-ingress", "upstream": "apisix:9080", "tls": "TLS_1_3"}',
          response: { label: 'Route Ack', latency: '0.6 ms', desc: 'API Gateway acknowledges the forwarded stream', payload: '{"upstream": "apisix:9080", "status": "ROUTED"}' }
        },
        {
          source: 'apisix', target: 'iam', protocol: 'JWT Bearer', label: 'Validate JWT',
          method: 'OIDC Token Validation', latency: '3.8 ms',
          desc: 'API Gateway verifies the JWT signature against the External IAM Service key set',
          payload: '{"iss": "login.microsoftonline.com", "aud": "espp-core", "kid": "k1"}',
          response: { label: 'Token Valid', latency: '2.9 ms', desc: 'External IAM Service returns the verified claims', payload: '{"status": "TOKEN_VALID", "sub": "std_9821", "roles": ["student"]}' }
        },
        {
          source: 'apisix', target: 'session', protocol: 'REST', label: 'Create Session',
          method: 'POST /sessions', latency: '12.4 ms',
          desc: 'API Gateway routes the authenticated request to Service-Session',
          payload: '{"externalId": "sess_842a1", "studentId": "std_9821", "lessonId": "les_a2_04"}',
          response: { label: 'Session Created', latency: '9.1 ms', desc: 'Service-Session returns the new session record', payload: '{"sessionId": "sess_842a1", "status": "ACTIVE"}' }
        },
        {
          source: 'session', target: 'postgres', protocol: 'Postgres', label: 'Store Session',
          method: 'INSERT INTO session.sessions', latency: '5.2 ms',
          desc: 'Service-Session persists the session row in its SQL database',
          payload: '{"schema": "session", "table": "sessions", "rowId": "sess_842a1"}',
          response: { label: 'Row Saved', latency: '1.4 ms', desc: 'Database confirms the insert', payload: '{"rowsAffected": 1, "rowId": "sess_842a1"}' }
        },
        {
          source: 'session', target: 'harness', protocol: 'REST', label: 'Init Voice Room',
          method: 'POST /harness/session/init', latency: '8.1 ms',
          desc: 'Service-Session asks the Harness to create the turn state machine and audio buffer',
          payload: '{"sessionId": "sess_842a1", "mode": "VOICE_INTERACTIVE", "targetTurns": 8}',
          response: { label: 'Room Ready', latency: '3.3 ms', desc: 'Harness confirms the voice room is ready for audio', payload: '{"room": "ready", "seat": "leased"}' }
        },
        {
          source: 'session', target: 'web-client', via: ['apisix', 'reverse-proxy'], isResponse: true, protocol: 'HTTPS', label: 'Session Ready',
          method: '200 OK /sessions', latency: '1.4 ms',
          desc: 'Service-Session confirms session initialization with sessionId back to the browser',
          payload: '{"sessionId": "sess_842a1", "status": "ACTIVE", "room": "ready"}'
        }
      ]
    },
    {
      id: 'case-2',
      title: '2. Real-time Speaking Turn',
      steps: [
        {
          source: 'web-client', target: 'reverse-proxy', protocol: 'WebSocket', label: 'Audio Stream',
          method: 'WS audio_chunk (AAC-ADTS)', latency: '4.5 ms',
          desc: 'Student speaks; the browser streams AAC-ADTS audio chunks over a WebSocket',
          payload: '{"type": "audio_chunk", "codec": "aac-adts", "sampleRate": 24000, "bytes": 4096}'
        },
        {
          source: 'reverse-proxy', target: 'apisix', protocol: 'WS Proxy', label: 'Audio Chunk',
          method: 'WS Tunnel /ws/audio', latency: '1.4 ms',
          desc: 'Reverse Proxy forwards the duplex audio stream to the API Gateway',
          payload: '{"tunnel": "duplex-ws", "seq": 14, "upstream": "apisix:9080"}'
        },
        {
          source: 'apisix', target: 'harness', protocol: 'WebSocket', label: 'Audio Stream',
          method: 'WS /ws/speech_stream', latency: '2.1 ms',
          desc: 'API Gateway streams the audio chunks down to the Voice Harness',
          payload: '{"proxy": "apisix", "downstream": "harness:8081", "chunkSeq": 14}'
        },
        {
          source: 'harness', target: 'redis', protocol: 'RESP', label: 'Buffer Audio',
          method: 'RPUSH session:842a1:audio', latency: '1.8 ms',
          desc: 'Harness appends the chunk to its Redis zero-disk audio ring buffer',
          payload: '{"key": "session:842a1:audio", "chunk": 14, "mode": "zero-disk-ram"}',
          response: { label: 'Chunk Stored', latency: '0.4 ms', desc: 'Redis confirms the new buffer length', payload: '{"length": 15}' }
        },
        {
          source: 'harness', target: 'ai-voice', protocol: 'gRPC', label: 'Speech-to-Text',
          method: 'POST /stt/transcribe', latency: '185.0 ms',
          desc: 'Harness sends audio to the STT Server for transcription',
          payload: '{"sessionId": "sess_842a1", "chunks": 15, "language": "en"}',
          response: { label: 'Transcript', latency: '12.0 ms', desc: 'STT Server returns the transcript with a confidence score', payload: '{"transcript": "I think electric cars are very good for the environment.", "confidence": 0.94}' }
        },
        {
          source: 'harness', target: 'laya', protocol: 'HTTP/2', label: 'Decision Call',
          method: 'POST /intent/classify', latency: '48.6 ms',
          desc: 'Harness asks the Decision Server to classify the turn intent',
          payload: '{"transcript": "I think electric cars are very good for the environment."}',
          response: { label: 'Intent Result', latency: '6.0 ms', desc: 'Decision Server returns intent, relevance and CEFR estimate', payload: '{"intent": "OPINION_ARGUMENT", "relevance": 0.91, "cefrScore": "B1.2"}' }
        },
        {
          source: 'laya', target: 'vllm', protocol: 'HTTP/REST', label: 'LLM Reasoning',
          method: 'POST /v1/chat/completions', latency: '210.0 ms',
          desc: 'Decision Server asks the LLM Server (Qwen-2.5B-INSTRUCT) for the teacher reply',
          payload: '{"model": "Qwen-2.5B-INSTRUCT", "intent": "OPINION_ARGUMENT", "maxTokens": 96}',
          response: { label: 'Teacher Reply', latency: '8.0 ms', desc: 'LLM Server returns the reply text', payload: '{"role": "assistant", "reply": "That is a great point! How do you think battery disposal impacts that?"}' }
        },
        {
          source: 'harness', target: 'tts', protocol: 'REST', label: 'Voice Synthesize',
          method: 'POST /tts/synthesize', latency: '120.4 ms',
          desc: 'Harness asks the TTS Server to synthesize the teacher voice',
          payload: '{"voice": "en_us_female", "speed": 1.0, "format": "aac"}',
          response: { label: 'Audio Ready', latency: '6.0 ms', desc: 'TTS Server returns the synthesized audio stream', payload: '{"durationMs": 3200, "bytes": 16384}' }
        },
        {
          source: 'harness', target: 'web-client', via: ['apisix', 'reverse-proxy'], isResponse: true, protocol: 'WebSocket', label: 'Audio Reply',
          method: 'WS bot_audio_chunk', latency: '12.2 ms',
          desc: 'Synthesized voice streams back through the gateway to the student browser',
          payload: '{"event": "audio_playback", "bytes": 16384, "turnIndex": 3}'
        }
      ]
    },
    {
      id: 'case-3',
      title: '3. Dynamic Context Switch',
      steps: [
        {
          source: 'harness', target: 'harness', protocol: 'Internal FSM', label: 'Context Check',
          method: 'EVAL evaluateTurnFsm()', latency: '2.1 ms',
          desc: 'Harness FSM detects: lock expired, 4 good turns achieved, topic similarity below 0.65',
          payload: '{"decision": "CONTEXT_SWITCH", "oldTopic": "Electric Cars", "newTopic": "Public Transit"}'
        },
        {
          source: 'harness', target: 'agent', via: ['apisix'], protocol: 'gRPC', label: 'Fetch Persona',
          method: 'gRPC GetAgentPersonaConfig(:50051)', latency: '16.4 ms',
          desc: 'Harness requests the new persona and prompt directives from Service-Agent (shown via the gateway hub)',
          payload: '{"subContext": "Public Transit", "protocol": "gRPC"}',
          response: { label: 'Persona Config', latency: '4.0 ms', desc: 'Service-Agent returns the persona configuration', payload: '{"persona": "Debater-B1", "directive": "SUB_CONTEXT_BRIDGE_ADVANCED"}' }
        },
        {
          source: 'agent', target: 'db-agent', protocol: 'MongoDB', label: 'Load Persona',
          method: 'db.personas.findOne({ id: "Debater-B1" })', latency: '3.6 ms',
          desc: 'Service-Agent reads the persona document from its own database',
          payload: '{"collection": "personas", "filter": {"id": "Debater-B1"}}',
          response: { label: 'Persona Doc', latency: '1.2 ms', desc: 'Agent Database returns the persona document', payload: '{"persona": "Debater-B1", "tone": "supportive-challenging"}' }
        },
        {
          source: 'harness', target: 'curriculum', via: ['apisix'], protocol: 'REST', label: 'Fetch Rubrics',
          method: 'GET /curriculum/subcontext/transit', latency: '14.2 ms',
          desc: 'Harness fetches the rubric for the new topic from Service-Curriculum (shown via the gateway hub)',
          payload: '{"subContext": "Public Transit"}',
          response: { label: 'Rubric Set', latency: '5.5 ms', desc: 'Service-Curriculum returns criteria and key phrases', payload: '{"keyPhrases": ["subway", "congestion", "eco-friendly"]}' }
        },
        {
          source: 'harness', target: 'redis', protocol: 'RESP', label: 'Cache Context',
          method: 'HSET session:842a1:grounding', latency: '2.4 ms',
          desc: 'Harness caches the grounded context for the new topic in Redis',
          payload: '{"persona": "Debater-B1", "subContext": "Public Transit", "ttl": 3600}',
          response: { label: 'Cached', latency: '0.3 ms', desc: 'Redis confirms the write', payload: '{"fieldsSet": 3}' }
        },
        {
          source: 'harness', target: 'laya', protocol: 'HTTP', label: 'Decision Inject',
          method: 'POST /directive/inject', latency: '12.8 ms',
          desc: 'Harness injects a compact transition directive into the Decision Server',
          payload: '{"directive": "[BRIDGE: validate_then_pivot -> subtopic: public_transit]"}',
          response: { label: 'Directive Ack', latency: '2.0 ms', desc: 'Decision Server confirms the directive was applied', payload: '{"status": "APPLIED"}' }
        },
        {
          source: 'laya', target: 'vllm', protocol: 'HTTP/REST', label: 'Bridge Prompt',
          method: 'POST /v1/chat/completions (Prefill Cache)', latency: '140.0 ms',
          desc: 'Decision Server asks the LLM Server for a smooth transitional bridge sentence',
          payload: '{"tokens": 38, "mode": "bridge"}',
          response: { label: 'Bridge Text', latency: '6.0 ms', desc: 'LLM Server returns the bridge sentence', payload: '{"bridge": "Speaking of vehicles, how effective is the subway system in your city?"}' }
        },
        {
          source: 'laya', target: 'harness', protocol: 'HTTP', label: 'Directive Ready',
          method: 'POST /directive/apply', latency: '4.2 ms',
          desc: 'Decision Server delivers the generated bridge prompt back to the Harness',
          payload: '{"directive": "[BRIDGE: validate_then_pivot]", "bridge": "Speaking of vehicles, how effective is the subway system in your city?"}',
          response: { label: 'Directive Ack', latency: '1.2 ms', desc: 'Harness acknowledges the transition bridge and updates active turn context', payload: '{"status": "CONTEXT_UPDATED"}' }
        }
      ]
    },
    {
      id: 'case-4',
      title: '4. Audio Buffer & R2 Upload',
      steps: [
        {
          source: 'web-client', target: 'harness', via: ['reverse-proxy', 'apisix'], protocol: 'WebSocket', label: 'Finish Session',
          method: 'WS session_complete', latency: '5.2 ms',
          desc: 'Student finishes the lesson; the request travels through the gateway to the Harness',
          payload: '{"event": "SESSION_FINISH", "sessionId": "sess_842a1", "totalTurns": 8}'
        },
        {
          source: 'harness', target: 'redis', protocol: 'RESP', label: 'Drain Buffer',
          method: 'LRANGE session:842a1:audio 0 -1', latency: '3.4 ms',
          desc: 'Harness drains every buffered AAC-ADTS segment from Redis in one batch',
          payload: '{"key": "session:842a1:audio", "chunksRequested": 48}',
          response: { label: 'Audio Chunks', latency: '1.1 ms', desc: 'Redis returns all buffered chunks', payload: '{"chunksRetrieved": 48, "totalSizeKb": 768}' }
        },
        {
          source: 'harness', target: 'harness', protocol: 'In-Memory', label: 'Mux AAC->M4A',
          method: 'ffmpeg bitstream copy remux', latency: '42.0 ms',
          desc: 'Zero-disk remux with ffmpeg: copy the AAC stream into a fragmented M4A in memory',
          payload: '{"remux": "aac-to-fragmented-m4a", "diskUsage": 0, "outputFile": "conversation.m4a"}'
        },
        {
          source: 'harness', target: 'cloudflare-r2', protocol: 'S3/R2', label: 'Upload R2',
          method: 'S3 PutObject (Multipart)', latency: '188.5 ms',
          desc: 'Harness streams conversation.m4a to the External Storage Service',
          payload: '{"bucket": "espp-audio", "key": "sessions/sess_842a1/conversation.m4a", "sizeKb": 745}',
          response: { label: 'Object Stored', latency: '14.0 ms', desc: 'External Storage Service confirms the object and returns its ETag', payload: '{"etag": "9b2cf5", "key": "sessions/sess_842a1/conversation.m4a"}' }
        },
        {
          source: 'harness', target: 'session', protocol: 'REST', label: 'Notify Done',
          method: 'PATCH /sessions/842a1/audio_recorded', latency: '9.8 ms',
          desc: 'Harness tells Service-Session where the recording lives',
          payload: '{"audioRecorded": true, "r2Key": "sessions/sess_842a1/conversation.m4a", "ttl": 7200}',
          response: { label: 'Audio Linked', latency: '4.2 ms', desc: 'Service-Session stores the key and returns a presigned playback URL', payload: '{"playbackUrl": "presigned", "ttl": 7200}' }
        },
        {
          source: 'harness', target: 'web-client', via: ['apisix', 'reverse-proxy'], isResponse: true, protocol: 'WebSocket', label: 'Session Complete',
          method: 'WS session_complete_ack', latency: '2.8 ms',
          desc: 'Harness delivers session completion confirmation and presigned playback URL to the student browser',
          payload: '{"event": "SESSION_COMPLETED", "playbackUrl": "https://storage.espp/sessions/sess_842a1/conversation.m4a", "durationSec": 184}'
        }
      ]
    },
    {
      id: 'case-5',
      title: '5. Outbox Event Fan-Out',
      steps: [
        {
          source: 'session', target: 'postgres', protocol: 'Postgres', label: 'Save Outbox',
          method: 'INSERT INTO session.outbox', latency: '4.5 ms',
          desc: 'Service-Session writes session.completed.v1 into its transactional outbox table',
          payload: '{"eventType": "session.completed.v1", "aggregateId": "sess_842a1", "table": "outbox"}',
          response: { label: 'Row Saved', latency: '1.2 ms', desc: 'Database confirms the outbox row', payload: '{"rowsAffected": 1}' }
        },
        {
          source: 'session', target: 'rabbitmq', protocol: 'AMQP', label: 'Publish Event',
          method: 'BASIC_PUBLISH exchange=session.events', latency: '8.2 ms',
          desc: 'The outbox poller publishes the event onto the Message Broker bus',
          payload: '{"exchange": "session.events", "routingKey": "session.completed.v1", "msgId": "evt_9901"}'
        },
        {
          source: 'rabbitmq', target: 'class', protocol: 'AMQP', label: 'Class Sync',
          method: 'AMQP Deliver (queue=class.sync)', latency: '6.4 ms',
          desc: 'The bus delivers the event to Service-Class for grading and level-up',
          payload: '{"service": "Service-Class", "event": "session.completed", "studentLevelUp": true}'
        },
        {
          source: 'rabbitmq', target: 'notification', protocol: 'AMQP', label: 'Push Alert',
          method: 'AMQP Deliver (queue=notification.push)', latency: '7.1 ms',
          desc: 'The bus delivers the event to Service-Notification to send the web push alert',
          payload: '{"service": "Service-Notification", "action": "send_push", "title": "Lesson Completed!"}'
        },
        {
          source: 'class', target: 'rabbitmq', protocol: 'AMQP', label: 'Event ACK',
          method: 'BASIC_ACK', latency: '2.0 ms',
          desc: 'Service-Class acknowledges the message so it is not redelivered',
          payload: '{"status": "ACK", "queue": "class.sync"}'
        },
        {
          source: 'notification', target: 'rabbitmq', protocol: 'AMQP', label: 'Event ACK',
          method: 'BASIC_ACK', latency: '2.1 ms',
          desc: 'Service-Notification acknowledges the message after sending the push',
          payload: '{"status": "ACK", "queue": "notification.push"}'
        }
      ]
    }
  ];

  return { SCENARIOS };
});
