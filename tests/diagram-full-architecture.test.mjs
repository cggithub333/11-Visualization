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
});

test('FullArchTemplate exports HTML markup and mount helper', async () => {
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
  assert.ok(container.innerHTML.includes('class="case-selector"'), 'has case selector toolbar');
  assert.ok(container.innerHTML.includes('id="full-arch-svg"'), 'has SVG connection overlay');
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
  const r2Step = case4.steps.find((s) => s.target === 'cloudflare-r2');
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
  assert.ok(dump.includes('data-node="harness"'), 'Chrome dump must include harness node');
  assert.ok(dump.includes('data-node="cloudflare-r2"'), 'Chrome dump must include cloudflare-r2 node');
  assert.ok(dump.includes('data-node="rabbitmq"'), 'Chrome dump must include rabbitmq node');
  assert.ok(dump.includes('id="telemetry-panel"'), 'Chrome dump must include telemetry panel');
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



