import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { execSync } from 'node:child_process';
import DiagramRegistry from '../src/core/registry.js';
import SwitcherModule from '../src/core/switcher.js';

const ROOT = path.resolve();

test('DiagramRegistry respects manifest.hidden flag', () => {
  DiagramRegistry.clear();
  DiagramRegistry.register({
    id: 'hidden-diag',
    label: 'Hidden Diagram',
    hidden: true
  });
  DiagramRegistry.register({
    id: 'visible-diag',
    label: 'Visible Diagram',
    hidden: false
  });

  const hiddenEntry = DiagramRegistry.get('hidden-diag');
  assert.ok(hiddenEntry);
  assert.equal(hiddenEntry.hidden, true);

  const visibleEntry = DiagramRegistry.get('visible-diag');
  assert.ok(visibleEntry);
  assert.equal(visibleEntry.hidden, false);
});

test('switchDiagram updates window.history with ?diagram= parameter', () => {
  // Mock DOM and window.history environment
  DiagramRegistry.clear();
  DiagramRegistry.register({
    id: 'diag-a',
    label: 'Diagram A',
    defaultSelected: true
  });
  DiagramRegistry.register({
    id: 'diag-b',
    label: 'Diagram B'
  });

  let replacedUrl = null;
  global.window = {
    location: {
      href: 'https://archify.omnicrafts.uk/',
      search: ''
    },
    history: {
      replaceState(state, title, url) {
        replacedUrl = url;
        window.location.href = url;
        window.location.search = url.includes('?') ? url.slice(url.indexOf('?')) : '';
      }
    }
  };

  global.document = {
    getElementById(id) {
      if (id === 'diagram-select') {
        return {
          options: [{ value: 'diag-a' }, { value: 'diag-b' }],
          selectedIndex: 0
        };
      }
      return null;
    }
  };

  // Switch to diag-b
  SwitcherModule.switchDiagram('diag-b', true);
  assert.ok(replacedUrl, 'replaceState must be called');
  assert.ok(replacedUrl.includes('diagram=diag-b'), 'URL must include diagram=diag-b');
  assert.equal(window.location.search, '?diagram=diag-b');

  // Switch back to diag-a
  SwitcherModule.switchDiagram('diag-a', true);
  assert.ok(replacedUrl.includes('diagram=diag-a'), 'URL must include diagram=diag-a');
  assert.equal(window.location.search, '?diagram=diag-a');

  delete global.window;
  delete global.document;
});

test('Headless Chrome boots up with ?diagram=adaptive-context-switch and stays on Diagram 3 without fallback', () => {
  const fileUrl = `file://${path.join(ROOT, 'index.html')}?diagram=adaptive-context-switch`;
  const dump = execSync(`google-chrome --headless=new --disable-gpu --dump-dom "${fileUrl}"`, {
    encoding: 'utf8',
    timeout: 10000
  });

  // Must mount all diagrams but only show adaptive-context-switch (without hidden class on view)
  assert.ok(dump.includes('id="view-adaptive-context-switch" class="diagram-view w-full flex flex-col gap-6"'), 'adaptive-context-switch view must NOT be hidden');
  assert.ok(dump.includes('id="view-diagram-slot-2" class="diagram-view hidden"'), 'lexis-voice view MUST be hidden');
});

test('Headless Chrome boots up with ?diagram=runpod-serverless and mounts RunPod despite being hidden from options', () => {
  const fileUrl = `file://${path.join(ROOT, 'index.html')}?diagram=runpod-serverless`;
  const dump = execSync(`google-chrome --headless=new --disable-gpu --dump-dom "${fileUrl}"`, {
    encoding: 'utf8',
    timeout: 10000
  });

  // RunPod view should be visible and not hidden
  assert.ok(dump.includes('id="view-runpod-serverless" class="diagram-view"'), 'RunPod view must be visible when explicitly requested via URL');
  assert.ok(dump.includes('id="view-diagram-slot-2" class="diagram-view hidden"'), 'lexis-voice view MUST be hidden');
  assert.ok(dump.includes('id="view-adaptive-context-switch" class="diagram-view hidden'), 'adaptive-context-switch view MUST be hidden');
  
  // Option in select must be hidden
  assert.ok(dump.includes('option value="runpod-serverless" hidden'), 'runpod-serverless option must have hidden attribute');
});
