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

// 2b. Idle-state highlight: for EVERY step of all 5 scenarios, every hop route must be lit
report.idleHighlights = await page.evaluate(() => {
  const sim = window.fullArchSim;
  const S = window.FullArchScenarios.SCENARIOS;
  const violations = [];
  for (const sc of S) {
    sim.setCase(sc.id);
    for (let sIdx = 0; sIdx < sc.steps.length; sIdx++) {
      sim.state.stepIndex = sIdx;
      sim.renderCurrentState();
      const step = sc.steps[sIdx];
      const hops = sim.getHops(step);
      if (hops.length > 1) {
        for (let i = 0; i < hops.length - 1; i++) {
          const u = hops[i];
          const v = hops[i + 1];
          const pathEl = document.getElementById(`path-${u}-${v}`) ||
                         document.getElementById(`path-${v}-${u}`) ||
                         document.querySelector(`[data-id-alt="path-${u}-${v}"]`) ||
                         document.querySelector(`[data-connection="${u}-${v}"]`) ||
                         document.querySelector(`[data-connection="${v}-${u}"]`);
          if (!pathEl || !pathEl.classList.contains('arch-path-active')) {
            violations.push(`${sc.id} step ${sIdx + 1} (${step.label}): hop ${u}->${v} not highlighted in idle state`);
          }
        }
      }
    }
  }
  sim.setCase('case-1');
  sim.state.stepIndex = 0;
  sim.renderCurrentState();
  return violations;
});
report.idleHighlights.forEach((v) => failures.push(`idle-highlight: ${v}`));

await page.screenshot({ path: path.join(OUT, 'idle-100.png') });
await page.locator('#full-arch-grid').screenshot({ path: path.join(OUT, 'idle-grid.png') });

// Instrument packet emission to trace every request and response packet
await page.evaluate(() => {
  window.__packetLog = [];
  const sim = window.fullArchSim;
  const origEmit = sim.emitPacket.bind(sim);
  sim.emitPacket = function (srcId, tgtId, colorClass, label, isResponse = false) {
    const drawn = document.getElementById(`path-${srcId}-${tgtId}`) ||
                  document.getElementById(`path-${tgtId}-${srcId}`) ||
                  document.querySelector(`[data-id-alt="path-${srcId}-${tgtId}"]`) ||
                  document.querySelector(`[data-connection="${srcId}-${tgtId}"]`) ||
                  document.querySelector(`[data-connection="${tgtId}-${srcId}"]`);
    window.__packetLog.push({
      caseId: this.state.activeCaseId,
      stepIndex: this.state.stepIndex,
      srcId,
      tgtId,
      label,
      isResponse: Boolean(isResponse),
      hasDrawnPath: Boolean(drawn),
      timestamp: performance.now()
    });
    return origEmit(srcId, tgtId, colorClass, label, isResponse);
  };
});

// 3. Scenarios: run each with Send Request, sample packet labels, require request AND response labels.
const scenarios = await page.evaluate(() => window.FullArchScenarios.SCENARIOS.map((s) => ({
  id: s.id,
  steps: s.steps,
  expected: s.steps.flatMap((st) => [st.label, st.response?.label].filter(Boolean))
})));

for (const sc of scenarios) {
  await page.evaluate((cId) => {
    window.__packetLog = [];
    window.fullArchSim.setCase(cId);
  }, sc.id);
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

  // Assertions on packet trace for this scenario:
  const scPackets = await page.evaluate(() => window.__packetLog);

  // A. Every emitted packet path coincides with a drawn route polyline (no empty space crossings)
  for (const pkt of scPackets) {
    if (!pkt.hasDrawnPath) {
      failures.push(`${sc.id} step ${pkt.stepIndex + 1}: packet ${pkt.srcId}->${pkt.tgtId} has no drawn route polyline (crossed empty space)`);
    }
  }

  // B. Response phases retrace request hops in reverse
  for (let sIdx = 0; sIdx < sc.steps.length; sIdx++) {
    const step = sc.steps[sIdx];
    if (step.response) {
      const stepPkts = scPackets.filter((p) => p.stepIndex === sIdx);
      const reqPkts = stepPkts.filter((p) => !p.isResponse);
      const respPkts = stepPkts.filter((p) => p.isResponse);
      if (!reqPkts.length) failures.push(`${sc.id} step ${sIdx + 1} (${step.label}): missing request packets`);
      if (!respPkts.length) failures.push(`${sc.id} step ${sIdx + 1} (${step.label}): missing response packets`);

      const reqHops = reqPkts.map((p) => `${p.srcId}->${p.tgtId}`);
      const expectedRespHops = reqPkts.map((p) => `${p.tgtId}->${p.srcId}`).reverse();
      const actualRespHops = respPkts.map((p) => `${p.srcId}->${p.tgtId}`);
      if (JSON.stringify(actualRespHops) !== JSON.stringify(expectedRespHops)) {
        failures.push(`${sc.id} step ${sIdx + 1} (${step.label}): response hops [${actualRespHops.join(', ')}] did not retrace request hops [${reqHops.join(', ')}] in reverse`);
      }
    }
  }

  // C. Case 1, 2, 4 responses reach web-client via apisix then reverse-proxy
  if (['case-1', 'case-2', 'case-4'].includes(sc.id)) {
    const respPkts = scPackets.filter((p) => p.isResponse);
    if (!respPkts.length) {
      failures.push(`${sc.id}: no response packets emitted`);
    } else {
      const lastHop = respPkts[respPkts.length - 1];
      const prevHop = respPkts[respPkts.length - 2];
      if (!lastHop || lastHop.srcId !== 'reverse-proxy' || lastHop.tgtId !== 'web-client') {
        failures.push(`${sc.id}: final response hop must be reverse-proxy -> web-client, got ${lastHop ? `${lastHop.srcId}->${lastHop.tgtId}` : 'none'}`);
      }
      if (!prevHop || prevHop.srcId !== 'apisix' || prevHop.tgtId !== 'reverse-proxy') {
        failures.push(`${sc.id}: penultimate response hop must be apisix -> reverse-proxy, got ${prevHop ? `${prevHop.srcId}->${prevHop.tgtId}` : 'none'}`);
      }
    }
  }

  // D. Timing assertion: play loop and sendRequest never start the next step before response phase finishes
  for (let sIdx = 0; sIdx < sc.steps.length - 1; sIdx++) {
    const step = sc.steps[sIdx];
    if (step.response) {
      const stepRespPkts = scPackets.filter((p) => p.stepIndex === sIdx && p.isResponse);
      const nextStepPkts = scPackets.filter((p) => p.stepIndex === sIdx + 1);
      if (stepRespPkts.length > 0 && nextStepPkts.length > 0) {
        const lastRespTime = Math.max(...stepRespPkts.map((p) => p.timestamp));
        const firstNextTime = Math.min(...nextStepPkts.map((p) => p.timestamp));
        if (firstNextTime < lastRespTime) {
          failures.push(`${sc.id}: step ${sIdx + 2} started at ${firstNextTime.toFixed(1)}ms before step ${sIdx + 1} response finished at ${lastRespTime.toFixed(1)}ms`);
        }
      }
    }
  }
}

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ ...report, failures }, null, 2));
await browser.close();
console.log(JSON.stringify({ failures }, null, 2));
process.exit(failures.length ? 1 : 0);
