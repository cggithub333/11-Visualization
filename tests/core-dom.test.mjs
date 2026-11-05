import test from 'node:test';
import assert from 'node:assert/strict';
import DiagramDOM from '../src/core/dom.js';

test('DiagramDOM exports core utilities', () => {
  assert.ok(DiagramDOM, 'DiagramDOM must be defined');
  assert.equal(typeof DiagramDOM.html, 'function', 'html must be a function');
  assert.equal(typeof DiagramDOM.raw, 'function', 'raw must be a function');
  assert.equal(typeof DiagramDOM.createComponent, 'function', 'createComponent must be a function');
  assert.equal(typeof DiagramDOM.mountTemplate, 'function', 'mountTemplate must be a function');
});

test('html tagged template concatenates strings, numbers, and arrays cleanly', () => {
  const { html } = DiagramDOM;
  const name = 'Serverless';
  const count = 9;
  const badges = ['GPU', 'Auto-Scale'];
  const result = html`<div class="${name}">${count} workers: ${badges.map(b => `<span>${b}</span>`)} ${null} ${undefined}</div>`;
  assert.equal(result, '<div class="Serverless">9 workers: <span>GPU</span><span>Auto-Scale</span>  </div>');
});

test('raw converts null and undefined to empty strings and values to strings', () => {
  const { raw } = DiagramDOM;
  assert.equal(raw(null), '');
  assert.equal(raw(undefined), '');
  assert.equal(raw(42), '42');
  assert.equal(raw('lexis'), 'lexis');
});

test('createComponent wraps a render function and accepts props', () => {
  const { html, createComponent } = DiagramDOM;
  const WorkerBadge = createComponent(({ id, status }) => html`<span class="badge ${status}">${id}</span>`);
  const rendered = WorkerBadge({ id: 'worker-1', status: 'idle' });
  assert.equal(rendered, '<span class="badge idle">worker-1</span>');
});

test('mountTemplate appends HTML to a target container', () => {
  const { mountTemplate } = DiagramDOM;
  const container = {
    innerHTML: '<div id="existing"></div>',
    insertAdjacentHTML(position, text) {
      if (position === 'beforeend') {
        this.innerHTML += text;
      }
    }
  };
  mountTemplate(container, '<div id="view-test">Rendered View</div>');
  assert.ok(container.innerHTML.includes('<div id="view-test">Rendered View</div>'));
});

test('mountTemplate throws when container is missing', () => {
  const { mountTemplate } = DiagramDOM;
  assert.throws(() => {
    mountTemplate(null, '<div></div>');
  }, /Target container not found/);
});
