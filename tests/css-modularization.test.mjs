import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve();

test('Core chassis.css exists and contains global dark chassis styles', () => {
  const filePath = path.join(ROOT, 'src/core/chassis.css');
  assert.ok(fs.existsSync(filePath), 'src/core/chassis.css must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(content.includes('.chassis-panel'), 'must include .chassis-panel');
  assert.ok(content.includes('.sub-panel'), 'must include .sub-panel');
  assert.ok(content.includes('.hardware-node'), 'must include .hardware-node');
  assert.ok(content.includes('.btn-tactile'), 'must include .btn-tactile');
  assert.ok(content.includes('::-webkit-scrollbar'), 'must include webkit-scrollbar');
  assert.ok(content.includes('.flex'), 'must include layout utility .flex');
  assert.ok(content.includes('.select-none'), 'must include .select-none');
});

test('RunPod serverless styles.css exists and contains worker card styles', () => {
  const filePath = path.join(ROOT, 'src/diagrams/runpod-serverless/styles.css');
  assert.ok(fs.existsSync(filePath), 'src/diagrams/runpod-serverless/styles.css must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(content.includes('.worker-card'), 'must include .worker-card');
  assert.ok(content.includes('.worker-idle'), 'must include .worker-idle');
  assert.ok(content.includes('.worker-ready'), 'must include .worker-ready');
  assert.ok(content.includes('.worker-run'), 'must include .worker-run');
  assert.ok(content.includes('.worker-init'), 'must include .worker-init');
  assert.ok(content.includes('@keyframes spin-slow'), 'must include @keyframes spin-slow');
});

test('Lexis voice styles.css exists and contains voice nodes and LLM deep-dive styles', () => {
  const filePath = path.join(ROOT, 'src/diagrams/lexis-voice/styles.css');
  assert.ok(fs.existsSync(filePath), 'src/diagrams/lexis-voice/styles.css must exist');
  const content = fs.readFileSync(filePath, 'utf8');

  assert.ok(content.includes('.lexis-draggable-node'), 'must include .lexis-draggable-node');
  assert.ok(content.includes('.canvas-pannable'), 'must include .canvas-pannable');
  assert.ok(content.includes('#lexis-node-llm'), 'must include #lexis-node-llm');
  assert.ok(content.includes('.vram-block-cell'), 'must include .vram-block-cell');
  assert.ok(content.includes('.engine-pool-card'), 'must include .engine-pool-card');
  assert.ok(content.includes('.streamed-token'), 'must include .streamed-token');
  assert.ok(content.includes('#engine-batch-list::-webkit-scrollbar'), 'must include scrollbar override');
});
