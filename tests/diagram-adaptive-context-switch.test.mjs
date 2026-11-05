import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve();

test('Adaptive context switch stylesheet exists and contains scoped classes', () => {
  const cssPath = path.join(ROOT, 'src/diagrams/adaptive-context-switch/styles.css');
  assert.ok(fs.existsSync(cssPath), 'styles.css must exist');
  const content = fs.readFileSync(cssPath, 'utf8');
  assert.ok(content.includes('.context-fsm-card'), 'must define .context-fsm-card');
  assert.ok(content.includes('.fsm-state-badge'), 'must define .fsm-state-badge');
  assert.ok(content.includes('.prompt-directive-box'), 'must define .prompt-directive-box');
  assert.ok(content.includes('.subcontext-pill'), 'must define .subcontext-pill');
});

import ContextTemplate from '../src/diagrams/adaptive-context-switch/template.js';

test('ContextTemplate exports CONTEXT_HTML and mount helper', () => {
  assert.ok(ContextTemplate, 'ContextTemplate must be defined');
  assert.ok(typeof ContextTemplate.CONTEXT_HTML === 'string', 'CONTEXT_HTML must be a string');
  assert.ok(ContextTemplate.CONTEXT_HTML.includes('id="view-adaptive-context-switch"'), 'must contain view-adaptive-context-switch');
  assert.ok(ContextTemplate.CONTEXT_HTML.includes('id="context-flow-canvas"'), 'must contain context-flow-canvas');
  assert.ok(ContextTemplate.CONTEXT_HTML.includes('id="btn-context-good-turn"'), 'must contain btn-context-good-turn');
  assert.ok(ContextTemplate.CONTEXT_HTML.includes('id="btn-context-weak-turn"'), 'must contain btn-context-weak-turn');
  assert.ok(ContextTemplate.CONTEXT_HTML.includes('id="btn-context-offtopic-turn"'), 'must contain btn-context-offtopic-turn');
  assert.ok(ContextTemplate.CONTEXT_HTML.includes('id="context-directive-text"'), 'must contain context-directive-text');
  assert.equal(typeof ContextTemplate.mount, 'function', 'mount must be a function');
});

test('ContextTemplate.mount appends view to container', () => {
  const container = {
    innerHTML: '',
    insertAdjacentHTML(pos, html) {
      if (pos === 'beforeend') this.innerHTML += html;
    }
  };
  ContextTemplate.mount(container);
  assert.ok(container.innerHTML.includes('id="view-adaptive-context-switch"'));
});

import ContextEngineModule from '../src/diagrams/adaptive-context-switch/context-engine.js';
import DiagramRegistry from '../src/core/registry.js';

test('ContextEngineModule exports AdaptiveContextSwitchSimulation class and methods', () => {
  assert.ok(ContextEngineModule, 'ContextEngineModule must be defined');
  const Cls = ContextEngineModule.AdaptiveContextSwitchSimulation;
  assert.equal(typeof Cls, 'function');
  assert.equal(typeof Cls.prototype.triggerTurn, 'function');
  assert.equal(typeof Cls.prototype.evaluateTurnFsm, 'function');
  assert.equal(typeof Cls.prototype.renderDirective, 'function');
  assert.equal(typeof Cls.prototype.renderBridgeSpeech, 'function');
  assert.equal(typeof Cls.prototype.updateSimulation, 'function');
});

test('AdaptiveContextSwitchSimulation correctly transitions FSM states', () => {
  const Cls = ContextEngineModule.AdaptiveContextSwitchSimulation;
  const sim = new Cls({ headless: true });

  // 1. Initial State
  assert.equal(sim.state.activeSubContext, 'Facebook');
  assert.equal(sim.state.goodTurnsInCurrentContext, 0);

  // 2. Good turn increments
  const res1 = sim.evaluateTurnFsm('good');
  assert.equal(res1.decision, 'CONTINUE');
  assert.equal(sim.state.goodTurnsInCurrentContext, 1);

  // 3. Reaching target good turns triggers CONTEXT_SWITCH
  sim.state.goodTurnsInCurrentContext = 3;
  sim.state.targetGoodTurnsForSwitch = 4;
  const res2 = sim.evaluateTurnFsm('good');
  assert.equal(res2.decision, 'CONTEXT_SWITCH');
  assert.equal(sim.state.activeSubContext, 'Instagram');
  assert.equal(sim.state.goodTurnsInCurrentContext, 0);
  assert.ok(sim.state.coveredSubContexts.includes('Facebook'));

  // 4. Weak turn holds good turns counter and increments weak count
  const res3 = sim.evaluateTurnFsm('weak');
  assert.equal(res3.decision, 'HOLD_WEAK');
  assert.equal(sim.state.consecutiveWeakCount, 1);

  // 5. Exceeding max consecutive weak turns triggers WEAK_RESCUE
  sim.state.consecutiveWeakCount = 2;
  const res4 = sim.evaluateTurnFsm('weak');
  assert.equal(res4.decision, 'WEAK_RESCUE');
  assert.equal(res4.antiDeadlockRescue, true);

  // 6. Off-topic turn triggers REDIRECT
  const res5 = sim.evaluateTurnFsm('offtopic');
  assert.equal(res5.decision, 'REDIRECT');
  assert.ok(res5.directive.includes('SUB_CONTEXT_REDIRECT'));
});

test('Adaptive context switch diagram registers into DiagramRegistry', () => {
  const entry = DiagramRegistry.get('adaptive-context-switch');
  assert.ok(entry, 'adaptive-context-switch must be registered');
  assert.ok(entry.aliases.includes('context-switch'));
  assert.ok(entry.aliases.includes('diagram-slot-3'));
  assert.equal(typeof entry.mount, 'function');
  assert.equal(typeof entry.init, 'function');
  assert.equal(typeof entry.activate, 'function');
  assert.equal(typeof entry.deactivate, 'function');
  assert.equal(typeof entry.resize, 'function');
});

import { execSync } from 'node:child_process';

test('Headless Chrome mounts and executes adaptive-context-switch diagram via URL route', () => {
  const fileUrl = `file://${path.join(ROOT, 'index.html')}?diagram=adaptive-context-switch&turn=good`;
  const dump = execSync(`google-chrome --headless=new --disable-gpu --dump-dom "${fileUrl}"`, {
    encoding: 'utf8',
    timeout: 10000
  });

  assert.ok(dump.includes('id="view-adaptive-context-switch"'), 'Chrome dump must include view-adaptive-context-switch');
  assert.ok(dump.includes('id="context-directive-text"'), 'Chrome dump must include context-directive-text');
  assert.ok(dump.includes('SUB_CONTEXT_FOCUS'), 'Chrome dump must reflect initial FSM directive');
});

test('Headless Chrome captures visual verification screenshot for Diagram 3', () => {
  const verifyDir = path.join(ROOT, 'templates/edit/verify');
  fs.mkdirSync(verifyDir, { recursive: true });
  const screenshotPath = path.join(verifyDir, 'view3_adaptive_context_verified.png');
  const fileUrl = `file://${path.join(ROOT, 'index.html')}?diagram=adaptive-context-switch&turn=good`;

  execSync(`google-chrome --headless=new --disable-gpu --window-size=1400,1000 --screenshot="${screenshotPath}" "${fileUrl}"`, {
    timeout: 15000
  });

  assert.ok(fs.existsSync(screenshotPath), 'Screenshot view3_adaptive_context_verified.png must exist');
  const stats = fs.statSync(screenshotPath);
  assert.ok(stats.size > 20000, `Screenshot size (${stats.size} bytes) must be > 20KB`);
});
