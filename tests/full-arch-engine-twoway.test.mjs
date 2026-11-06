import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve();

async function makeSim() {
  const mod = await import('../src/diagrams/full-architecture/engine.js');
  const Cls = mod.FullArchitectureSimulation || mod.default?.FullArchitectureSimulation;
  return new Cls({ headless: true });
}

test('engine reads scenarios and routes from the shared modules', async () => {
  const sim = await makeSim();
  assert.equal(sim.scenarios.length, 5);
  assert.ok(sim.scenarios.some((s) => s.steps.some((st) => st.response)), 'scenarios carry responses');
  const ids = sim.paths.map((p) => p.id);
  for (const id of ['path-harness-redis', 'path-agent-db-agent', 'path-class-rabbitmq', 'path-session-rabbitmq', 'path-notification-rabbitmq']) {
    assert.ok(ids.includes(id), `registers ${id}`);
  }
  assert.ok(!ids.includes('path-agent-redis'), 'Agent to Redis route is gone');
});

test('getHops expands via lists and collapses self steps', async () => {
  const sim = await makeSim();
  assert.deepEqual(sim.getHops({ source: 'harness', target: 'web-client', via: ['apisix', 'reverse-proxy'] }),
    ['harness', 'apisix', 'reverse-proxy', 'web-client']);
  assert.deepEqual(sim.getHops({ source: 'harness', target: 'harness' }), ['harness']);
  assert.deepEqual(sim.getHops({ source: 'class', target: 'db-class' }), ['class', 'db-class']);
});

test('engine exposes playback helpers and keeps legacy generateSquaredPath', async () => {
  const sim = await makeSim();
  for (const fn of ['getHops', 'getRoute', 'playStep', 'renderResponsePhase', 'sleep', 'generateSquaredPath']) {
    assert.equal(typeof sim[fn], 'function', `has ${fn}`);
  }
  assert.equal(typeof sim.computePathCoordinates, 'undefined', 'old coordinate if/else chain is removed');
});

test('headless playStep resolves immediately and stepNext still returns the step', async () => {
  const sim = await makeSim();
  await sim.playStep(sim.scenarios[0].steps[0], 'node-active-cyan');
  sim.setCase('case-2');
  assert.equal(sim.stepNext().label, 'Audio Chunk');
});

test('headless playStep handles self-loop steps without error', async () => {
  const sim = await makeSim();
  const selfStep = { source: 'harness', target: 'harness', label: 'Context Check' };
  await sim.playStep(selfStep, 'node-active-cyan');
  assert.deepEqual(sim.getHops(selfStep), ['harness']);
});

test('index.html loads routes.js and scenarios.js before engine.js', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const iRoutes = html.indexOf('./src/diagrams/full-architecture/routes.js');
  const iScen = html.indexOf('./src/diagrams/full-architecture/scenarios.js');
  const iEngine = html.indexOf('./src/diagrams/full-architecture/engine.js');
  assert.ok(iRoutes > -1 && iScen > -1 && iEngine > -1);
  assert.ok(iRoutes < iEngine && iScen < iEngine, 'dependencies load first');
});

test('stylesheet styles response packets distinctly', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/diagrams/full-architecture/styles.css'), 'utf8');
  assert.ok(css.includes('.moving-packet-response'));
});
