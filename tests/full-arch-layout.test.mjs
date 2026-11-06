import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve();

async function renderHtml() {
  const mod = await import('../src/diagrams/full-architecture/template.js');
  const container = {
    innerHTML: '',
    insertAdjacentHTML(pos, html) {
      if (pos === 'beforeend') this.innerHTML += html;
    }
  };
  mod.FullArchTemplate.mount(container);
  return container.innerHTML;
}

const nodeBlock = (html, id) => {
  const start = html.indexOf(`data-node="${id}"`);
  assert.ok(start > -1, `node ${id} exists`);
  return html.slice(html.lastIndexOf('<div', start), start + 1400);
};

test('Agent has its own MongoDB database node and no Redis pairing', async () => {
  const html = await renderHtml();
  const agentDb = nodeBlock(html, 'db-agent');
  assert.ok(agentDb.includes('Agent Database'));
  assert.ok(agentDb.includes('MongoDB'));
  assert.ok(!agentDb.includes('Redis'), 'Agent database must not mention Redis');
});

test('Redis is the Harness cache and carries the audio buffer counter', async () => {
  const html = await renderHtml();
  const redis = nodeBlock(html, 'redis');
  assert.ok(redis.includes('Harness Cache'));
  assert.ok(redis.includes('id="label-audio-chunks"'), 'buffer counter lives on Redis');
  const r2 = nodeBlock(html, 'cloudflare-r2');
  assert.ok(r2.includes('External Storage Service'));
  assert.ok(!r2.includes('label-audio-chunks'), 'R2 no longer owns the buffer counter');
  assert.ok(html.indexOf('data-node="redis"') < html.indexOf('data-node="harness"'), 'Redis sits left of Harness');
  assert.ok(html.indexOf('data-node="harness"') < html.indexOf('data-node="cloudflare-r2"'), 'Storage sits right of Harness');
});

test('Message Broker is a wide event bus after the Session row, not paired with Notification', async () => {
  const html = await renderHtml();
  const broker = nodeBlock(html, 'rabbitmq');
  assert.ok(broker.includes('Message Broker'));
  assert.ok(broker.includes('event-bus-node'));
  assert.ok(!broker.includes('RabbitMQ'), 'display text avoids the product name');
  assert.ok(html.indexOf('data-node="session"') < html.indexOf('data-node="rabbitmq"'), 'bus is below the Session row');
  const notifRow = html.slice(html.indexOf('data-node="notification"'), html.indexOf('data-node="session"'));
  assert.ok(!notifRow.includes('data-node="rabbitmq"'), 'Notification row has no broker node');
});

test('Case 5 option label drops the product name', async () => {
  const html = await renderHtml();
  assert.ok(!html.includes('RabbitMQ Outbox'));
});

test('stylesheet stretches pair rows and makes the event bus full width', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/diagrams/full-architecture/styles.css'), 'utf8');
  const pairRow = css.match(/\.service-db-pair-row \{[^}]*\}/)[0];
  const harnessRow = css.match(/(?:^|\n)\.harness-storage-pair-row \{[^}]*\}/)[0];
  assert.ok(pairRow.includes('align-items: stretch'), 'service-db rows stretch to equal height');
  assert.ok(harnessRow.includes('align-items: stretch'), 'harness row stretches to equal height');
  assert.ok(css.includes('.event-bus-row'), 'defines .event-bus-row');
  assert.ok(/#node-rabbitmq \{[^}]*width: 100%/.test(css), 'event bus is full width');
  assert.ok(css.includes('#node-db-agent'), 'sizes the Agent Database node');
  assert.ok(css.includes('.arch-path-bus'), 'defines .arch-path-bus for event bus');
  assert.ok(/\.ingress-subzone\s*\{[^}]*gap:\s*(?:7[0-9]|8[0-9])px/.test(css), 'ingress subzone has expanded gap for label pills');
});


test('Frontend and Redis boxes are wide enough to show their full titles', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/diagrams/full-architecture/styles.css'), 'utf8');
  assert.ok(/#node-web-client \{[^}]*width: 265px/.test(css), 'Frontend box is 265px wide');
  assert.ok(/#node-redis \{[^}]*width: 240px/.test(css), 'Redis box is 240px wide');
  const shared = css.match(/#node-db-class,[^{]*\{[^}]*\}/)[0];
  assert.ok(!shared.includes('#node-redis'), 'Redis is split out of the shared 230px group');
});
