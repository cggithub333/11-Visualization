import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_CORE || '/tmp/pw/node_modules/playwright-core');

const ROOT = path.resolve();
const OUT = path.join(ROOT, 'templates/edit/verify/two-way');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.VERIFY_BASE_URL || `file://${path.join(ROOT, 'index.html')}`;
const URL = `${BASE}?diagram=full-architecture&zoom=100`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const failures = [];
const report = { geometry: [], topology: [], cases: {} };

await page.goto(URL, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('#svg-paths-group path', { state: 'attached' });
await page.waitForTimeout(800);

// 1. Geometry: no route passes through a non-endpoint node, drawn <path> equals router output,
//    every segment is orthogonal, and no two nodes overlap.
report.geometry = await page.evaluate(() => {
  const R = window.FullArchRoutes;
  const grid = document.getElementById('full-arch-grid').getBoundingClientRect();
  const rect = (id) => {
    const r = document.getElementById(`node-${id}`).getBoundingClientRect();
    return { left: r.left - grid.left, top: r.top - grid.top, right: r.right - grid.left, bottom: r.bottom - grid.top };
  };
  const ids = [...document.querySelectorAll('.service-node[data-node]')].map((n) => n.dataset.node);
  const violations = [];
  for (const route of R.ROUTES) {
    const built = R.buildRoute(route, rect(route.a), rect(route.b));
    for (let i = 0; i < built.points.length - 1; i++) {
      const p = built.points[i];
      const q = built.points[i + 1];
      if (p.x !== q.x && p.y !== q.y) violations.push(`${route.a}-${route.b} has a diagonal segment`);
    }
    for (const id of ids) {
      if (id === route.a || id === route.b) continue;
      if (R.routeHitsRect(built.points, rect(id))) violations.push(`${route.a}-${route.b} crosses ${id}`);
    }
    const el = document.getElementById(`path-${route.a}-${route.b}`) || document.getElementById(`path-${route.b}-${route.a}`);
    if (!el) violations.push(`${route.a}-${route.b} has no drawn path`);
    else if (el.getAttribute('d') !== built.d) violations.push(`${route.a}-${route.b} drawn path differs from router`);
  }
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = rect(ids[i]);
      const b = rect(ids[j]);
      if (a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1) {
        violations.push(`nodes overlap: ${ids[i]} and ${ids[j]}`);
      }
    }
  }
  return violations;
});
report.geometry.forEach((v) => failures.push(`geometry: ${v}`));

// 2. Topology and naming: Redis only to Harness, db-agent only to Agent, Event Bus fed by services,
//    sync routes to isolated nodes have a response, no emoji, banned display names absent.
report.topology = await page.evaluate(() => {
  const R = window.FullArchRoutes;
  const S = window.FullArchScenarios.SCENARIOS;
  const out = [];
  const touching = (id) => R.ROUTES.filter((r) => r.a === id || r.b === id).map((r) => (r.a === id ? r.b : r.a)).sort();
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  if (!eq(touching('redis'), ['harness'])) out.push(`redis routes: ${touching('redis')}`);
  if (!eq(touching('db-agent'), ['agent'])) out.push(`db-agent routes: ${touching('db-agent')}`);
  const bus = touching('rabbitmq');
  ['class', 'curriculum', 'agent', 'notification', 'session'].forEach((s) => {
    if (!bus.includes(s)) out.push(`rabbitmq not connected to ${s}`);
  });
  if (bus.includes('harness')) out.push('rabbitmq connected to harness');
  const isolated = new Set(['db-class', 'db-curriculum', 'db-agent', 'postgres', 'redis', 'iam', 'cloudflare-r2', 'ai-voice', 'laya', 'tts', 'vllm']);
  for (const sc of S) {
    sc.steps.forEach((st, i) => {
      if (isolated.has(st.target) && !st.response) out.push(`${sc.id} step ${i + 1} ${st.source}->${st.target} has no response`);
    });
  }
  const text = document.getElementById('full-arch-grid').innerText;
  if (/\p{Extended_Pictographic}/u.test(text)) out.push('emoji found in diagram text');
  ['Service Laya', 'RabbitMQ Broker', 'vLLM Inference'].forEach((n) => {
    if (text.includes(n)) out.push(`banned display name: ${n}`);
  });
  return out;
});
report.topology.forEach((v) => failures.push(`topology: ${v}`));
await page.screenshot({ path: path.join(OUT, 'idle-100.png') });
await page.locator('#full-arch-grid').screenshot({ path: path.join(OUT, 'idle-grid.png') });

// 3. Scenarios: run each with Send Request, sample packet labels, require request AND response labels.
const scenarios = await page.evaluate(() => window.FullArchScenarios.SCENARIOS.map((s) => ({
  id: s.id,
  expected: s.steps.filter((st) => st.source !== st.target).flatMap((st) => [st.label, st.response?.label].filter(Boolean))
})));

for (const sc of scenarios) {
  await page.selectOption('#use-case-select', sc.id);
  await page.click('#btn-arch-send-request');
  const seen = new Set();
  let shotResponse = false;
  const started = Date.now();
  while (Date.now() - started < 120000) {
    const labels = await page.$$eval('.moving-packet .packet-label-text', (els) => els.map((e) => e.textContent));
    labels.forEach((l) => seen.add(l));

    // Geometry check: verify label pill rects do not intersect node text rects
    const textOverlaps = await page.evaluate(() => {
      const pills = document.querySelectorAll('.packet-label-pill');
      if (!pills.length) return [];
      const textEls = document.querySelectorAll('.service-node[data-node] .node-title, .service-node[data-node] .node-subtitle, .service-node[data-node] .node-desc');
      const textRects = [...textEls].map((el) => {
        const r = el.getBoundingClientRect();
        const node = el.closest('.service-node')?.dataset.node || 'unknown';
        return { node, text: el.textContent.trim(), left: r.left, top: r.top, right: r.right, bottom: r.bottom };
      });
      const violations = [];
      for (const pill of pills) {
        const pr = pill.getBoundingClientRect();
        for (const tr of textRects) {
          if (pr.left < tr.right && pr.right > tr.left && pr.top < tr.bottom && pr.bottom > tr.top) {
            violations.push(`label pill overlaps "${tr.text}" in node ${tr.node}`);
          }
        }
      }
      return violations;
    });
    textOverlaps.forEach((v) => {
      const msg = `${sc.id}: geometry: ${v}`;
      if (!failures.includes(msg)) failures.push(msg);
    });

    const hasResponsePacket = (await page.$$('.moving-packet-response')).length > 0;
    if (hasResponsePacket && !shotResponse) {
      await page.waitForTimeout(450);
      await page.screenshot({ path: path.join(OUT, `${sc.id}-response.png`) });
      shotResponse = true;
    }
    const sending = await page.$eval('#btn-arch-send-request', (b) => b.classList.contains('sending'));
    if (!sending && Date.now() - started > 1500) break;
    await page.waitForTimeout(100);
  }
  await page.screenshot({ path: path.join(OUT, `${sc.id}-final.png`) });
  const missing = sc.expected.filter((l) => !seen.has(l));
  report.cases[sc.id] = { expected: sc.expected.length, seen: [...seen], missing };
  missing.forEach((l) => failures.push(`${sc.id}: packet label never seen: ${l}`));
}

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ ...report, failures }, null, 2));
await browser.close();
console.log(JSON.stringify({ failures }, null, 2));
process.exit(failures.length ? 1 : 0);
