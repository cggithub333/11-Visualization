import test from 'node:test';
import assert from 'node:assert/strict';
import LexisTemplate from '../src/diagrams/lexis-voice/template.js';
import LLMDeepDiveModule from '../src/diagrams/lexis-voice/llm-deep-dive.js';
import LexisEngineModule from '../src/diagrams/lexis-voice/lexis-engine.js';
import DiagramRegistry from '../src/core/registry.js';

test('LexisTemplate exports HTML markup and mount helper', () => {
  assert.ok(LexisTemplate, 'LexisTemplate must be defined');
  assert.ok(typeof LexisTemplate.LEXIS_HTML === 'string', 'LEXIS_HTML must be a string');
  assert.ok(LexisTemplate.LEXIS_HTML.includes('id="view-diagram-slot-2"'), 'must contain view-diagram-slot-2');
  assert.ok(LexisTemplate.LEXIS_HTML.includes('id="lexis-node-stt"'), 'must contain lexis-node-stt');
  assert.ok(LexisTemplate.LEXIS_HTML.includes('id="lexis-node-llm"'), 'must contain lexis-node-llm');
  assert.ok(LexisTemplate.LEXIS_HTML.includes('inspect-chevron'), 'must contain inspect-chevron icon');
  assert.ok(LexisTemplate.LEXIS_HTML.includes('inspect-badge-text'), 'must contain inspect-badge-text');
  assert.ok(LexisTemplate.LEXIS_HTML.includes('max-w-[260px]'), 'must contain max-w-[260px]');
  assert.ok(LexisTemplate.LEXIS_HTML.includes('id="lexis-branch-llm"'), 'must contain lexis-branch-llm');
  assert.ok(LexisTemplate.LEXIS_HTML.includes('id="vram-blocks-grid"'), 'must contain vram-blocks-grid');
  assert.equal(typeof LexisTemplate.mount, 'function', 'mount must be a function');
});

test('LexisTemplate.mount appends view to container', () => {
  const container = {
    innerHTML: '',
    insertAdjacentHTML(pos, html) {
      if (pos === 'beforeend') this.innerHTML += html;
    }
  };
  LexisTemplate.mount(container);
  assert.ok(container.innerHTML.includes('id="view-diagram-slot-2"'));
});

test('LLMDeepDiveModule exports LLMEngineDeepDiveSimulation class and methods', () => {
  assert.ok(LLMDeepDiveModule, 'LLMDeepDiveModule must be defined');
  const Cls = LLMDeepDiveModule.LLMEngineDeepDiveSimulation;
  assert.equal(typeof Cls, 'function');
  assert.equal(typeof Cls.prototype.switchEngine, 'function');
  assert.equal(typeof Cls.prototype.schedule, 'function');
  assert.equal(typeof Cls.prototype.tick, 'function');
  assert.equal(typeof Cls.prototype.stepIteration, 'function');
  assert.equal(typeof Cls.prototype.receiveRequestFromMain, 'function');
  assert.equal(typeof Cls.prototype.toggleBranch, 'function');
});

test('LexisEngineModule exports LexisArchitectureSimulation class and methods', () => {
  assert.ok(LexisEngineModule, 'LexisEngineModule must be defined');
  const Cls = LexisEngineModule.LexisArchitectureSimulation;
  assert.equal(typeof Cls, 'function');
  assert.equal(typeof Cls.prototype.triggerBatchRequests, 'function');
  assert.equal(typeof Cls.prototype.triggerStepHop, 'function');
  assert.equal(typeof Cls.prototype.updateSimulation, 'function');
  assert.equal(typeof Cls.prototype.handleResize, 'function');
});

test('Lexis diagram registers into DiagramRegistry with defaultSelected true', () => {
  const entry = DiagramRegistry.get('lexis-voice');
  assert.ok(entry, 'lexis-voice must be registered');
  assert.equal(entry.defaultSelected, true, 'lexis diagram should be defaultSelected');
  assert.ok(entry.aliases.includes('diagram-slot-2'), 'alias diagram-slot-2 must be registered');
  assert.ok(entry.aliases.includes('lexis'), 'alias lexis must be registered');
  assert.equal(typeof entry.mount, 'function');
  assert.equal(typeof entry.init, 'function');
  assert.equal(typeof entry.activate, 'function');
  assert.equal(typeof entry.deactivate, 'function');
  assert.equal(typeof entry.resize, 'function');
  assert.equal(typeof entry.handleUrlParams, 'function');
});
