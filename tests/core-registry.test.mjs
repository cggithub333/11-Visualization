import test from 'node:test';
import assert from 'node:assert/strict';
import DiagramRegistry from '../src/core/registry.js';

test.beforeEach(() => {
  DiagramRegistry.clear();
});

test('DiagramRegistry validates required manifest fields', () => {
  assert.throws(() => DiagramRegistry.register(null), /non-null object/);
  assert.throws(() => DiagramRegistry.register({}), /valid string id/);
  assert.throws(() => DiagramRegistry.register({ id: 'test' }), /valid string label/);
});

test('DiagramRegistry registers a diagram and retrieves by id or alias', () => {
  DiagramRegistry.register({
    id: 'runpod-serverless',
    aliases: ['runpod'],
    label: '1. RunPod: Serverless GPU & Auto-Scaling',
    defaultSelected: false
  });

  DiagramRegistry.register({
    id: 'lexis-voice',
    aliases: ['diagram-slot-2', 'lexis'],
    label: '2. Lexis: Voice Practice Architecture',
    defaultSelected: true
  });

  const runpod = DiagramRegistry.get('runpod-serverless');
  assert.ok(runpod);
  assert.equal(runpod.id, 'runpod-serverless');
  assert.equal(DiagramRegistry.get('runpod'), runpod, 'alias must resolve to canonical entry');

  const lexis = DiagramRegistry.get('lexis-voice');
  assert.ok(lexis);
  assert.equal(DiagramRegistry.get('diagram-slot-2'), lexis, 'alias diagram-slot-2 must resolve');
  assert.equal(DiagramRegistry.get('lexis'), lexis, 'alias lexis must resolve');
  assert.equal(DiagramRegistry.get('unknown-diagram'), null);
});

test('DiagramRegistry.list returns all registered diagrams without alias duplicates', () => {
  DiagramRegistry.register({
    id: 'diag-1',
    aliases: ['d1'],
    label: 'Diagram One'
  });
  DiagramRegistry.register({
    id: 'diag-2',
    aliases: ['d2'],
    label: 'Diagram Two'
  });

  const list = DiagramRegistry.list();
  assert.equal(list.length, 2);
  assert.deepEqual(list.map(d => d.id), ['diag-1', 'diag-2']);
});

test('DiagramRegistry captures lifecycle callbacks', () => {
  let mounted = false;
  let activated = false;
  let deactivated = false;
  let resized = false;
  let receivedParams = null;

  DiagramRegistry.register({
    id: 'lifecycle-test',
    label: 'Lifecycle Diagram',
    mount(container) { mounted = true; },
    activate() { activated = true; },
    deactivate() { deactivated = true; },
    resize() { resized = true; },
    handleUrlParams(params) { receivedParams = params; }
  });

  const entry = DiagramRegistry.get('lifecycle-test');
  entry.mount('#diagram-viewport');
  entry.activate();
  entry.deactivate();
  entry.resize();
  entry.handleUrlParams({ get: () => 'val' });

  assert.equal(mounted, true);
  assert.equal(activated, true);
  assert.equal(deactivated, true);
  assert.equal(resized, true);
  assert.ok(receivedParams);
});
