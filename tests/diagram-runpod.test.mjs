import test from 'node:test';
import assert from 'node:assert/strict';
import RunPodTemplate from '../src/diagrams/runpod-serverless/template.js';
import RunPodEngine from '../src/diagrams/runpod-serverless/engine.js';
import DiagramRegistry from '../src/core/registry.js';

test('RunPodTemplate exports HTML markup and mount helper', () => {
  assert.ok(RunPodTemplate, 'RunPodTemplate must be defined');
  assert.ok(typeof RunPodTemplate.RUNPOD_HTML === 'string', 'RUNPOD_HTML must be a string');
  assert.ok(RunPodTemplate.RUNPOD_HTML.includes('id="view-runpod-serverless"'), 'must contain view-runpod-serverless');
  assert.ok(RunPodTemplate.RUNPOD_HTML.includes('id="btn-dec-max"'), 'must contain btn-dec-max');
  assert.ok(RunPodTemplate.RUNPOD_HTML.includes('id="btn-inc-max"'), 'must contain btn-inc-max');
  assert.ok(RunPodTemplate.RUNPOD_HTML.includes('id="flow-canvas"'), 'must contain flow-canvas');
  assert.ok(RunPodTemplate.RUNPOD_HTML.includes('id="telemetry-canvas"'), 'must contain telemetry-canvas');
  assert.ok(RunPodTemplate.RUNPOD_HTML.includes('id="workers-container"'), 'must contain workers-container');
  assert.equal(typeof RunPodTemplate.mount, 'function', 'mount must be a function');
});

test('RunPodTemplate.mount appends view to container', () => {
  const container = {
    innerHTML: '',
    insertAdjacentHTML(pos, html) {
      if (pos === 'beforeend') this.innerHTML += html;
    }
  };
  RunPodTemplate.mount(container);
  assert.ok(container.innerHTML.includes('id="view-runpod-serverless"'));
});

test('RunPodEngine exports ServerlessSimulation constructor', () => {
  assert.ok(RunPodEngine, 'RunPodEngine must be defined');
  assert.equal(typeof RunPodEngine.ServerlessSimulation, 'function', 'ServerlessSimulation must be a class/constructor');
  assert.equal(typeof RunPodEngine.ServerlessSimulation.prototype.updateSimulation, 'function');
  assert.equal(typeof RunPodEngine.ServerlessSimulation.prototype.getActiveWorkerCount, 'function');
  assert.equal(typeof RunPodEngine.ServerlessSimulation.prototype.getRunningWorkerCount, 'function');
});

test('RunPod diagram registers into DiagramRegistry with lifecycle hooks', () => {
  const entry = DiagramRegistry.get('runpod-serverless');
  assert.ok(entry, 'runpod-serverless must be registered');
  assert.equal(entry.id, 'runpod-serverless');
  assert.ok(entry.aliases.includes('runpod'), 'alias runpod must be registered');
  assert.equal(typeof entry.mount, 'function');
  assert.equal(typeof entry.init, 'function');
  assert.equal(typeof entry.activate, 'function');
  assert.equal(typeof entry.deactivate, 'function');
  assert.equal(typeof entry.resize, 'function');
  assert.equal(typeof entry.handleUrlParams, 'function');
});
