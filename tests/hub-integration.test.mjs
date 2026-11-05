import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import DiagramRegistry from '../src/core/registry.js';
import SwitcherModule from '../src/core/switcher.js';

const ROOT = path.resolve();

test('Legacy monolithic files src/app.js and src/styles.css are retired', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'src/app.js')), false, 'src/app.js must be removed');
  assert.equal(fs.existsSync(path.join(ROOT, 'src/styles.css')), false, 'src/styles.css must be removed');
});

test('index.html is slimmed down to ~75 lines and contains modular links and scripts', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const lineCount = indexHtml.split('\n').length;
  assert.ok(lineCount >= 60 && lineCount <= 95, `index.html line count (${lineCount}) must be between 60 and 95`);

  // Assert required DOM hooks
  assert.ok(indexHtml.includes('id="diagram-select"'), 'must contain diagram-select');
  assert.ok(indexHtml.includes('id="diagram-viewport"'), 'must contain diagram-viewport mount container');
  assert.equal(indexHtml.includes('id="view-runpod-serverless"'), false, 'must NOT contain inline view-runpod-serverless');
  assert.equal(indexHtml.includes('id="view-diagram-slot-2"'), false, 'must NOT contain inline view-diagram-slot-2');

  // Assert modular stylesheets
  assert.ok(indexHtml.includes('href="./src/core/chassis.css"'), 'must link chassis.css');
  assert.ok(indexHtml.includes('href="./src/diagrams/runpod-serverless/styles.css"'), 'must link runpod styles.css');
  assert.ok(indexHtml.includes('href="./src/diagrams/lexis-voice/styles.css"'), 'must link lexis styles.css');
  assert.ok(indexHtml.includes('href="./src/diagrams/adaptive-context-switch/styles.css"'), 'must link adaptive-context-switch styles.css');

  // Assert modular scripts in dependency order
  assert.ok(indexHtml.includes('src="./src/tailwind.js"'), 'must load tailwind.js');
  assert.ok(indexHtml.includes('src="./src/core/dom.js"'), 'must load dom.js');
  assert.ok(indexHtml.includes('src="./src/core/registry.js"'), 'must load registry.js');
  assert.ok(indexHtml.includes('src="./src/diagrams/runpod-serverless/template.js"'), 'must load runpod template.js');
  assert.ok(indexHtml.includes('src="./src/diagrams/runpod-serverless/engine.js"'), 'must load runpod engine.js');
  assert.ok(indexHtml.includes('src="./src/diagrams/lexis-voice/template.js"'), 'must load lexis template.js');
  assert.ok(indexHtml.includes('src="./src/diagrams/lexis-voice/llm-deep-dive.js"'), 'must load llm-deep-dive.js');
  assert.ok(indexHtml.includes('src="./src/diagrams/lexis-voice/lexis-engine.js"'), 'must load lexis-engine.js');
  assert.ok(indexHtml.includes('src="./src/diagrams/adaptive-context-switch/template.js"'), 'must load adaptive-context-switch template.js');
  assert.ok(indexHtml.includes('src="./src/diagrams/adaptive-context-switch/context-engine.js"'), 'must load adaptive-context-switch context-engine.js');
  assert.ok(indexHtml.includes('src="./src/core/switcher.js"'), 'must load switcher.js');
  assert.ok(indexHtml.includes('value="adaptive-context-switch"'), 'must contain option value adaptive-context-switch');
});

test('Switcher controller exposes switchDiagram, initDiagramSwitcher, bootstrapDiagrams', () => {
  assert.ok(SwitcherModule, 'SwitcherModule must be defined');
  assert.equal(typeof SwitcherModule.switchDiagram, 'function');
  assert.equal(typeof SwitcherModule.initDiagramSwitcher, 'function');
  assert.equal(typeof SwitcherModule.bootstrapDiagrams, 'function');
});

test('Headless Chrome executes modular index.html without syntax or runtime errors', () => {
  const fileUrl = `file://${path.join(ROOT, 'index.html')}?diagram=diagram-slot-2&engine=vllm&mockreq=2`;
  const dump = execSync(`google-chrome --headless=new --disable-gpu --dump-dom "${fileUrl}"`, {
    encoding: 'utf8',
    timeout: 10000
  });

  assert.ok(dump.includes('id="diagram-viewport"'), 'Chrome dump must include diagram-viewport');
  assert.ok(dump.includes('id="view-diagram-slot-2"'), 'Chrome dump must include dynamically mounted Lexis view');
  assert.ok(dump.includes('id="view-runpod-serverless"'), 'Chrome dump must include dynamically mounted RunPod view');
});
