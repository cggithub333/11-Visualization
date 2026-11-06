import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve();

test('Full architecture stylesheet exists and defines 4-tier grid and telemetry styles', () => {
  const cssPath = path.join(ROOT, 'src/diagrams/full-architecture/styles.css');
  assert.ok(fs.existsSync(cssPath), 'styles.css must exist');
  const content = fs.readFileSync(cssPath, 'utf8');
  assert.ok(content.includes('.full-arch-viewport'), 'defines .full-arch-viewport');
  assert.ok(content.includes('.full-arch-grid'), 'defines .full-arch-grid');
  assert.ok(content.includes('.service-node'), 'defines .service-node');
  assert.ok(content.includes('.telemetry-panel'), 'defines .telemetry-panel');
  assert.ok(content.includes('.audio-buffer-pill'), 'defines .audio-buffer-pill');
  assert.ok(content.includes('.r2-badge'), 'defines .r2-badge');
  assert.ok(content.includes('.tier-ingress'), 'defines .tier-ingress');
  assert.ok(content.includes('.tier-services'), 'defines .tier-services');
  assert.ok(content.includes('.tier-storage'), 'defines .tier-storage');
  assert.ok(content.includes('.tier-ai'), 'defines .tier-ai');
  assert.ok(content.includes('.mvc-card'), 'defines .mvc-card');
  assert.ok(content.includes('.mvc-controller'), 'defines .mvc-controller');
  assert.ok(content.includes('.mvc-service'), 'defines .mvc-service');
  assert.ok(content.includes('.mvc-model'), 'defines .mvc-model');
  assert.ok(content.includes('.mvc-triad-stage'), 'defines .mvc-triad-stage');
  assert.ok(content.includes('.mvc-phase-1'), 'defines .mvc-phase-1');
  assert.ok(content.includes('.use-case-select'), 'defines .use-case-select');
  assert.ok(content.includes('.btn-play-scenario'), 'defines .btn-play-scenario');
  assert.ok(content.includes('.view-100'), 'defines .view-100');
  assert.ok(content.includes('.btn-zoom'), 'defines .btn-zoom');
  assert.ok(content.includes('.send-request-group'), 'defines .send-request-group');
  assert.ok(content.includes('.btn-send-request'), 'defines .btn-send-request');
  assert.ok(content.includes('.dropdown-arch-batch'), 'defines .dropdown-arch-batch');
});

test('index.html embeds Lucide CDN and does not contain sparkles', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('unpkg.com/lucide'), 'index.html must embed Lucide CDN');
  assert.ok(!indexHtml.includes('sparkle'), 'must not contain sparkle icon');
});

test('FullArchTemplate exports 3-subblock MVC structure with zero emoji and clean technical names', async () => {
  const mod = await import('../src/diagrams/full-architecture/template.js');
  assert.ok(mod.FullArchTemplate, 'exports FullArchTemplate');
  assert.equal(typeof mod.FullArchTemplate.render, 'function', 'has render function');
  assert.equal(typeof mod.FullArchTemplate.mount, 'function', 'has mount function');

  const container = {
    innerHTML: '',
    insertAdjacentHTML(pos, html) {
      if (pos === 'beforeend') this.innerHTML += html;
    }
  };
  mod.FullArchTemplate.mount(container);
  assert.ok(container.innerHTML.includes('id="view-full-architecture"'), 'has root view id');
  assert.ok(container.innerHTML.includes('data-node="web-client"'), 'has web-client node');
  assert.ok(container.innerHTML.includes('data-node="apisix"'), 'has apisix node');
  assert.ok(container.innerHTML.includes('data-node="harness"'), 'has harness node');
  assert.ok(container.innerHTML.includes('data-node="session"'), 'has session node');
  assert.ok(container.innerHTML.includes('data-node="class"'), 'has class node');
  assert.ok(container.innerHTML.includes('data-node="curriculum"'), 'has curriculum node');
  assert.ok(container.innerHTML.includes('data-node="agent"'), 'has agent node');
  assert.ok(container.innerHTML.includes('data-node="notification"'), 'has notification node');
  assert.ok(container.innerHTML.includes('data-node="rabbitmq"'), 'has rabbitmq node');
  assert.ok(container.innerHTML.includes('data-node="postgres"'), 'has postgres node');
  assert.ok(container.innerHTML.includes('data-node="redis"'), 'has redis node');
  assert.ok(container.innerHTML.includes('data-node="cloudflare-r2"'), 'has cloudflare-r2 node');
  assert.ok(container.innerHTML.includes('data-node="ai-voice"'), 'has ai-voice node');
  assert.ok(container.innerHTML.includes('data-node="laya"'), 'has laya node');
  assert.ok(container.innerHTML.includes('data-node="vllm"'), 'has vllm node');
  assert.ok(container.innerHTML.includes('id="full-arch-svg"'), 'has SVG connection overlay');

  // Check Dropdown and Play Button
  assert.ok(container.innerHTML.includes('id="use-case-select"'), 'has use-case-select dropdown');
  assert.ok(container.innerHTML.includes('id="btn-arch-play-scenario"'), 'has btn-arch-play-scenario button');
  assert.ok(container.innerHTML.includes('id="btn-arch-send-request"'), 'has btn-arch-send-request button');
  assert.ok(container.innerHTML.includes('id="btn-arch-zoom"'), 'has btn-arch-zoom button');
  assert.ok(container.innerHTML.includes('id="btn-arch-toggle-batch"'), 'has btn-arch-toggle-batch button');
  assert.ok(container.innerHTML.includes('id="dropdown-arch-batch"'), 'has dropdown-arch-batch dropdown');

  // Check Clean Technical Names
  assert.ok(container.innerHTML.includes('Decision Server'), 'has Decision Server (not Service Laya)');
  assert.ok(container.innerHTML.includes('Message Broker'), 'has Message Broker (not RabbitMQ Broker)');
  assert.ok(container.innerHTML.includes('LLM Server'), 'has LLM Server (not vLLM)');
  assert.ok(container.innerHTML.includes('External IAM Service'), 'has External IAM Service');
  assert.ok(container.innerHTML.includes('External Storage Service'), 'has External Storage Service');
  assert.ok(container.innerHTML.includes('SQL Database'), 'has SQL Database');
  assert.ok(container.innerHTML.includes('NoSQL Database'), 'has NoSQL Database');

  // Check Icon-Only MVC Triad Stage
  assert.ok(container.innerHTML.includes('mvc-triad-stage'), 'has mvc-triad-stage');
  assert.ok(container.innerHTML.includes('mvc-controller'), 'has mvc-controller subblock');
  assert.ok(container.innerHTML.includes('mvc-service'), 'has mvc-service subblock');
  assert.ok(container.innerHTML.includes('mvc-model'), 'has mvc-model subblock');
  assert.ok(container.innerHTML.includes('gamepad-directional'), 'has gamepad-directional for controller');
  assert.ok(container.innerHTML.includes('eye-dashed'), 'has eye-dashed for view');
  assert.ok(container.innerHTML.includes('book-bookmark'), 'has book-bookmark for model');
  assert.ok(container.innerHTML.includes('mvc-bus-view-ctrl'), 'has bus between view and controller');
  assert.ok(container.innerHTML.includes('mvc-bus-ctrl-model'), 'has bus between controller and model');

  // Check Zero Emoji
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]/u;
  assert.ok(!emojiRegex.test(container.innerHTML), 'must have zero emoji');
});

test('FullArchitectureSimulation exports class and orchestrates 5 scenarios', async () => {
  const mod = await import('../src/diagrams/full-architecture/engine.js');
  const Cls = mod.FullArchitectureSimulation || mod.default?.FullArchitectureSimulation;
  assert.ok(Cls, 'exports FullArchitectureSimulation');

  const sim = new Cls({ headless: true });
  assert.equal(typeof sim.init, 'function');
  assert.equal(typeof sim.setCase, 'function');
  assert.equal(typeof sim.stepNext, 'function');
  assert.equal(typeof sim.reset, 'function');
  assert.equal(typeof sim.executeStep, 'function');
  assert.equal(typeof sim.animateServiceMvcCycle, 'function', 'has animateServiceMvcCycle method');
  assert.equal(typeof sim.sendRequest, 'function', 'has sendRequest method');
  assert.equal(typeof sim.toggleZoom, 'function', 'has toggleZoom method');
  assert.equal(typeof sim.setBatchSize, 'function', 'has setBatchSize method');

  // Verify all 5 canonical scenarios
  assert.equal(sim.scenarios.length, 5, 'must define 5 scenario workflows');
  assert.equal(sim.scenarios[0].id, 'case-1');
  assert.equal(sim.scenarios[1].id, 'case-2');
  assert.equal(sim.scenarios[2].id, 'case-3');
  assert.equal(sim.scenarios[3].id, 'case-4');
  assert.equal(sim.scenarios[4].id, 'case-5');

  // Verify Case 3 (Adaptive Context Switch) targets Service-Agent and vLLM
  const case3 = sim.scenarios[2];
  const agentStep = case3.steps.find((s) => s.target === 'agent');
  assert.ok(agentStep, 'Case 3 must invoke Service-Agent via gRPC');
  assert.equal(agentStep.protocol, 'gRPC');

  // Verify Case 4 (Audio Buffer & R2) targets Redis and Cloudflare R2
  const case4 = sim.scenarios[3];
  const r2Step = case4.steps.find((s) => s.target === 'cloudflare-r2' && s.protocol === 'S3/R2');
  assert.ok(r2Step, 'Case 4 must upload to Cloudflare R2');
  assert.equal(r2Step.protocol, 'S3/R2');
  assert.ok(r2Step.payload.includes('conversation.m4a'));

  // Verify Case 5 (RabbitMQ Outbox) targets RabbitMQ, Class, and Notification
  const case5 = sim.scenarios[4];
  const rmqStep = case5.steps.find((s) => s.target === 'rabbitmq');
  assert.ok(rmqStep, 'Case 5 must publish to RabbitMQ');
  assert.equal(rmqStep.protocol, 'AMQP');

  // Test state transitions
  sim.setCase('case-3');
  assert.equal(sim.state.activeCaseId, 'case-3');
  assert.equal(sim.state.stepIndex, 0);

  const nextRes = sim.stepNext();
  assert.equal(sim.state.stepIndex, 1);
  assert.ok(nextRes, 'stepNext returns step details');

  // Test toggleZoom
  assert.equal(sim.state.is100View, false);
  const zoomRes = sim.toggleZoom();
  assert.equal(zoomRes, true);
  assert.equal(sim.state.is100View, true);
  const zoomRes2 = sim.toggleZoom();
  assert.equal(zoomRes2, false);
  assert.equal(sim.state.is100View, false);

  // Test setBatchSize
  assert.equal(sim.state.batchSize, 1);
  sim.setBatchSize(3);
  assert.equal(sim.state.batchSize, 3);
  sim.setBatchSize(5);
  assert.equal(sim.state.batchSize, 5);

  // Test animateServiceMvcCycle resolves in headless mode
  await sim.animateServiceMvcCycle('harness');

  // Test sendRequest completes in headless mode
  await sim.sendRequest(1);
  assert.equal(sim.state.isBatchRunning, false);
});

test('FullArchitectureSimulation draws squared orthogonal paths and controls dropdown playback', async () => {
  const mod = await import('../src/diagrams/full-architecture/engine.js');
  const Cls = mod.FullArchitectureSimulation || mod.default?.FullArchitectureSimulation;
  const sim = new Cls({ headless: true });

  assert.equal(typeof sim.setCase, 'function');
  assert.equal(typeof sim.togglePlayScenario, 'function');

  // Verify squared routing generator
  const pathData = sim.generateSquaredPath(100, 200, 400, 500, 350);
  assert.ok(pathData.includes('M 100 200 L 100 350 L 400 350 L 400 500'), 'must follow orthogonal 90-degree squared path');
});

import DiagramRegistry from '../src/core/registry.js';
import { execSync } from 'node:child_process';

test('Full architecture diagram registers into DiagramRegistry', () => {
  const entry = DiagramRegistry.get('full-architecture');
  assert.ok(entry, 'full-architecture must be registered');
  assert.ok(entry.aliases.includes('microservices'), 'has microservices alias');
  assert.ok(entry.aliases.includes('espp-arch'), 'has espp-arch alias');
  assert.equal(typeof entry.mount, 'function');
  assert.equal(typeof entry.init, 'function');
  assert.equal(typeof entry.activate, 'function');
  assert.equal(typeof entry.deactivate, 'function');
  assert.equal(typeof entry.resize, 'function');
});

test('Headless Chrome mounts and executes full-architecture diagram via URL route', () => {
  const fileUrl = `file://${path.join(ROOT, 'index.html')}?diagram=full-architecture`;
  const dump = execSync(`google-chrome --headless=new --disable-gpu --dump-dom "${fileUrl}"`, {
    encoding: 'utf8',
    timeout: 10000
  });

  assert.ok(dump.includes('id="view-full-architecture"'), 'Chrome dump must include view-full-architecture');
  assert.ok(dump.includes('id="use-case-select"'), 'Chrome dump must include use-case-select');
  assert.ok(dump.includes('id="btn-arch-play-scenario"'), 'Chrome dump must include btn-arch-play-scenario');
  assert.ok(dump.includes('id="btn-arch-send-request"'), 'Chrome dump must include btn-arch-send-request');
  assert.ok(dump.includes('id="btn-arch-zoom"'), 'Chrome dump must include btn-arch-zoom');
  assert.ok(dump.includes('mvc-triad-stage'), 'Chrome dump must include mvc-triad-stage');
  assert.ok(dump.includes('data-node="harness"'), 'Chrome dump must include harness node');
  assert.ok(dump.includes('data-node="cloudflare-r2"'), 'Chrome dump must include cloudflare-r2 node');
  assert.ok(dump.includes('data-node="rabbitmq"'), 'Chrome dump must include rabbitmq node');
  assert.ok(dump.includes('data-node="postgres"'), 'Chrome dump must include postgres node');
  assert.ok(dump.includes('data-node="redis"'), 'Chrome dump must include redis node');
  assert.ok(dump.includes('id="telemetry-panel"'), 'Chrome dump must include telemetry panel');
});

test('FullArchitectureSimulation registers all database and service connection paths', async () => {
  const mod = await import('../src/diagrams/full-architecture/engine.js');
  const Cls = mod.FullArchitectureSimulation || mod.default?.FullArchitectureSimulation;
  const sim = new Cls({ headless: true });

  const requiredPathIds = [
    'path-web-client-reverse-proxy',
    'path-reverse-proxy-apisix',
    'path-apisix-iam',
    'path-apisix-class',
    'path-apisix-curriculum',
    'path-apisix-agent',
    'path-apisix-notification',
    'path-apisix-session',
    'path-class-db-class',
    'path-curriculum-db-curriculum',
    'path-agent-db-agent',
    'path-notification-rabbitmq',
    'path-class-rabbitmq',
    'path-curriculum-rabbitmq',
    'path-agent-rabbitmq',
    'path-session-rabbitmq',
    'path-session-postgres',
    'path-harness-redis',
    'path-apisix-harness',
    'path-session-harness',
    'path-harness-cloudflare-r2',
    'path-harness-ai-voice',
    'path-harness-laya',
    'path-laya-vllm',
    'path-harness-tts'
  ];

  requiredPathIds.forEach((id) => {
    const p = sim.paths.find((item) => item.id === id);
    assert.ok(p, `must register path ${id}`);
    assert.ok(p.from && p.to, `path ${id} must have valid endpoints`);
  });
});

test('Headless Chrome captures visual verification screenshot for Diagram 3 Full Architecture', () => {
  const verifyDir = path.join(ROOT, 'templates/edit/verify');
  fs.mkdirSync(verifyDir, { recursive: true });
  const screenshotPath = path.join(verifyDir, 'view3_full_architecture_verified.png');
  const fileUrl = `file://${path.join(ROOT, 'index.html')}?diagram=full-architecture`;

  execSync(`google-chrome --headless=new --disable-gpu --window-size=1400,1050 --screenshot="${screenshotPath}" "${fileUrl}"`, {
    timeout: 15000
  });

  assert.ok(fs.existsSync(screenshotPath), 'Screenshot view3_full_architecture_verified.png must exist');
  const stats = fs.statSync(screenshotPath);
  assert.ok(stats.size > 20000, `Screenshot size (${stats.size} bytes) must be > 20KB`);
});

test('Headless Chrome captures visual verification screenshot for Diagram 3 Full Architecture 100% Zoom View', () => {
  const verifyDir = path.join(ROOT, 'templates/edit/verify');
  fs.mkdirSync(verifyDir, { recursive: true });
  const screenshotPath = path.join(verifyDir, 'view3_100_percent_view_verified.png');
  const fileUrl = `file://${path.join(ROOT, 'index.html')}?diagram=full-architecture&zoom=100`;

  execSync(`google-chrome --headless=new --disable-gpu --window-size=1920,1080 --screenshot="${screenshotPath}" "${fileUrl}"`, {
    timeout: 15000
  });

  assert.ok(fs.existsSync(screenshotPath), 'Screenshot view3_100_percent_view_verified.png must exist');
  const stats = fs.statSync(screenshotPath);
  assert.ok(stats.size > 20000, `Screenshot size (${stats.size} bytes) must be > 20KB`);
});

test('FullArchitectureSimulation correctly derives short protocol labels for labeled packet pills', async () => {
  const mod = await import('../src/diagrams/full-architecture/engine.js');
  const Cls = mod.FullArchitectureSimulation || mod.default?.FullArchitectureSimulation;
  const sim = new Cls({ headless: true });

  assert.equal(typeof sim.getShortProtocolLabel, 'function', 'has getShortProtocolLabel');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'JWT Bearer' }), 'JWT');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'WebSocket' }), 'WS');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'WS Proxy' }), 'WS');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'gRPC' }), 'gRPC');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'RESP' }), 'RESP');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'S3/R2' }), 'S3');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'AMQP' }), 'AMQP');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'Postgres' }), 'SQL');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'In-Memory', method: 'ffmpeg remux' }), 'REMUX');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'HTTP/2' }), 'HTTP/2');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'HTTPS' }), 'HTTPS');
  assert.equal(sim.getShortProtocolLabel({ protocol: 'REST' }), 'REST');
});

test('Full architecture stylesheet defines calm idle gray subnodes, inactive buses, and moving packet styles', () => {
  const cssPath = path.join(ROOT, 'src/diagrams/full-architecture/styles.css');
  const content = fs.readFileSync(cssPath, 'utf8');

  // Verify idle gray subnodes styles
  assert.ok(content.includes('#64748b'), 'contains idle gray color #64748b');
  assert.ok(content.includes('rgba(255, 255, 255, 0.03)'), 'contains idle background rgba(255, 255, 255, 0.03)');
  assert.ok(content.includes('rgba(148, 163, 184, 0.15)'), 'contains idle border rgba(148, 163, 184, 0.15)');
  assert.ok(content.includes('rgba(148, 163, 184, 0.12)'), 'contains inactive bus background rgba(148, 163, 184, 0.12)');

  // Verify moving packet and faint path styles
  assert.ok(content.includes('.moving-packet'), 'defines .moving-packet class');
  assert.ok(content.includes('stroke-dasharray: 3 3;'), 'defines faint idle stroke dasharray 3 3');
  assert.ok(content.includes('stroke: rgba(100, 116, 139, 0.14)'), 'defines faint idle path stroke');
});




