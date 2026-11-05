import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DEPLOY_DOC = path.join(ROOT, 'docs', 'deployment.md');

test('docs/deployment.md exists and documents Cloudflare Pages architecture and rollback', () => {
  assert.equal(fs.existsSync(DEPLOY_DOC), true, 'docs/deployment.md must exist');
  const content = fs.readFileSync(DEPLOY_DOC, 'utf8');

  // Core deployment target invariants
  assert.match(content, /archify-omnicrafts/);
  assert.match(content, /https:\/\/archify\.omnicrafts\.uk/);
  assert.match(content, /cggithub333\/11-Visualization/);
  assert.match(content, /archify-omnicrafts\.pages\.dev/);

  // Zero-build static modular paths documented
  assert.match(content, /\/src\/core\/switcher\.js/);
  assert.match(content, /\/src\/diagrams\/runpod-serverless\/engine\.js/);
  assert.match(content, /\/src\/diagrams\/lexis-voice\/lexis-engine\.js/);

  // Rollback & tunnel separation notes
  assert.match(content, /Rollback/i);
  assert.match(content, /cloudflared\.service/);
  assert.match(content, /pass:run --persistent cloudflare/);
});

test('docs/deployment.md contains zero raw secrets, tokens, or sensitive Cloudflare/Tunnel IDs', () => {
  const content = fs.readFileSync(DEPLOY_DOC, 'utf8');

  // Must not contain 32-hex Cloudflare Account/Zone IDs or real tunnel UUIDs
  assert.doesNotMatch(content, /\b[0-9a-f]{32}\b/i, 'Must not contain raw 32-char hex Account/Zone IDs');
  assert.doesNotMatch(
    content,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i,
    'Must not contain raw tunnel UUIDs'
  );
  assert.doesNotMatch(content, /pass show|gpg --decrypt/i, 'Must not instruct raw secret decryption');
});
