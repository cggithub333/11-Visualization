import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { SCENARIOS } = require('../src/diagrams/full-architecture/scenarios.js');
const { ROUTES } = require('../src/diagrams/full-architecture/routes.js');

const edgeExists = (a, b) => ROUTES.some((r) => (r.a === a && r.b === b) || (r.a === b && r.b === a));
const hops = (s) => [s.source, ...(s.via || []), s.target].filter((id, i, arr) => i === 0 || id !== arr[i - 1]);

test('five scenarios keep their ids', () => {
  assert.deepEqual(SCENARIOS.map((s) => s.id), ['case-1', 'case-2', 'case-3', 'case-4', 'case-5']);
});

test('every step has a label and every hop is a real route edge', () => {
  for (const sc of SCENARIOS) {
    for (const [i, step] of sc.steps.entries()) {
      assert.ok(step.label && step.label.length <= 18, `${sc.id}#${i} label`);
      const chain = hops(step);
      for (let k = 0; k < chain.length - 1; k++) {
        assert.ok(edgeExists(chain[k], chain[k + 1]), `${sc.id}#${i}: no route ${chain[k]} -> ${chain[k + 1]}`);
      }
    }
  }
});

test('responses are complete and only appear on synchronous calls', () => {
  let responses = 0;
  for (const sc of SCENARIOS) {
    for (const step of sc.steps) {
      if (!step.response) continue;
      responses += 1;
      for (const key of ['label', 'latency', 'desc', 'payload']) {
        assert.equal(typeof step.response[key], 'string', `${sc.id} ${step.label} response.${key}`);
      }
      assert.notEqual(step.protocol, 'AMQP', 'async broker events never get a request/response pair');
    }
  }
  assert.ok(responses >= 15, `expected at least 15 two-way steps, found ${responses}`);
});

test('Redis and Message Broker steps match the real code paths', () => {
  const find = (id, label) => SCENARIOS.find((s) => s.id === id).steps.find((s) => s.label === label);
  assert.equal(find('case-2', 'Buffer Audio').target, 'redis');
  assert.equal(find('case-4', 'Drain Buffer').target, 'redis');
  assert.equal(find('case-4', 'Upload R2').target, 'cloudflare-r2');
  assert.equal(find('case-3', 'Load Persona').target, 'db-agent');
  assert.equal(find('case-3', 'Cache Context').target, 'redis');
  assert.equal(find('case-5', 'Publish Event').target, 'rabbitmq');
  assert.equal(find('case-5', 'Publish Event').response, undefined);
  assert.equal(find('case-5', 'Class Sync').source, 'rabbitmq');
  assert.equal(find('case-5', 'Push Alert').source, 'rabbitmq');
});

test('no scenario text exposes forbidden product names as node names', () => {
  const text = JSON.stringify(SCENARIOS);
  for (const banned of ['Service Laya', 'RabbitMQ Broker', 'vLLM Inference']) {
    assert.ok(!text.includes(banned), `must not contain ${banned}`);
  }
});

test('legacy assertions still hold: Agent over gRPC, R2 upload payload, AMQP publish', () => {
  const c3 = SCENARIOS[2].steps.find((s) => s.target === 'agent');
  assert.equal(c3.protocol, 'gRPC');
  const c4 = SCENARIOS[3].steps.find((s) => s.target === 'cloudflare-r2' && s.protocol === 'S3/R2');
  assert.ok(c4.payload.includes('conversation.m4a'));
  const c5 = SCENARIOS[4].steps.find((s) => s.target === 'rabbitmq');
  assert.equal(c5.protocol, 'AMQP');
});

test('every non-AMQP flow from web-client ends back at web-client via apisix and reverse-proxy', () => {
  for (const sc of SCENARIOS) {
    if (sc.id === 'case-5') continue; // AMQP broker event fan-out does not start at web-client
    if (sc.steps[0].source === 'web-client') {
      const lastStep = sc.steps[sc.steps.length - 1];
      assert.equal(lastStep.target, 'web-client', `${sc.id} last step target must be web-client`);
      assert.deepEqual(lastStep.via, ['apisix', 'reverse-proxy'], `${sc.id} must retrace via apisix and reverse-proxy`);
    }
  }
});

test('isolated-node steps have responses and new return steps exist', () => {
  const isolated = new Set(['db-class', 'db-curriculum', 'db-agent', 'postgres', 'redis', 'iam', 'cloudflare-r2', 'ai-voice', 'laya', 'tts', 'vllm']);
  for (const sc of SCENARIOS) {
    sc.steps.forEach((st, i) => {
      if (isolated.has(st.target)) {
        assert.ok(st.response, `${sc.id} step ${i + 1} (${st.source}->${st.target}) must have a response`);
      }
    });
  }

  // Case 1 final return step
  const c1Final = SCENARIOS[0].steps[SCENARIOS[0].steps.length - 1];
  assert.equal(c1Final.source, 'session');
  assert.equal(c1Final.target, 'web-client');
  assert.deepEqual(c1Final.via, ['apisix', 'reverse-proxy']);
  assert.equal(c1Final.isResponse, true);

  // Case 2 Audio Reply step
  const c2Final = SCENARIOS[1].steps[SCENARIOS[1].steps.length - 1];
  assert.equal(c2Final.source, 'harness');
  assert.equal(c2Final.target, 'web-client');
  assert.deepEqual(c2Final.via, ['apisix', 'reverse-proxy']);
  assert.equal(c2Final.label, 'Audio Reply');
  assert.equal(c2Final.isResponse, true);

  // Case 3 Directive Ready / bridge return step
  const c3Final = SCENARIOS[2].steps[SCENARIOS[2].steps.length - 1];
  assert.equal(c3Final.source, 'laya');
  assert.equal(c3Final.target, 'harness');

  // Case 4 final return step
  const c4Final = SCENARIOS[3].steps[SCENARIOS[3].steps.length - 1];
  assert.equal(c4Final.source, 'harness');
  assert.equal(c4Final.target, 'web-client');
  assert.deepEqual(c4Final.via, ['apisix', 'reverse-proxy']);
  assert.equal(c4Final.isResponse, true);
});

test('all scenario payloads are valid JSON', () => {
  for (const sc of SCENARIOS) {
    for (const st of sc.steps) {
      if (st.payload) {
        assert.doesNotThrow(() => JSON.parse(st.payload), `${sc.id} ${st.label} payload is not valid JSON`);
      }
      if (st.response?.payload) {
        assert.doesNotThrow(() => JSON.parse(st.response.payload), `${sc.id} ${st.label} response payload is not valid JSON`);
      }
    }
  }
});
