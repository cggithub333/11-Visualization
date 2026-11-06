import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function load() {
  return require('../src/diagrams/full-architecture/routes.js');
}

const box = (left, top, w, h) => ({ left, top, right: left + w, bottom: top + h });

test('routes.js exports the route contract', () => {
  const R = load();
  assert.ok(Array.isArray(R.ROUTES) && R.ROUTES.length >= 24, 'has ROUTES');
  for (const fn of ['findRoute', 'buildRoute', 'routeHitsRect']) {
    assert.equal(typeof R[fn], 'function', `exports ${fn}`);
  }
});

test('every route has valid sides and an optional lane where needed', () => {
  const { ROUTES } = load();
  const sides = ['left', 'right', 'top', 'bottom'];
  const horiz = (s) => s === 'left' || s === 'right';
  for (const r of ROUTES) {
    assert.ok(r.a && r.b, 'a and b ids');
    assert.ok(sides.includes(r.aSide) && sides.includes(r.bSide), `${r.a}-${r.b} sides`);
    if (horiz(r.aSide) !== horiz(r.bSide)) {
      assert.equal(typeof r.lane, 'number', `${r.a}-${r.b} needs a lane for an L/U route`);
    }
  }
});

test('route set encodes the corrected Redis and Message Broker wiring', () => {
  const R = load();
  const has = (a, b) => R.findRoute(a, b) !== null;
  assert.ok(has('harness', 'redis'), 'Harness owns Redis');
  assert.ok(has('agent', 'db-agent'), 'Agent has its own database');
  for (const svc of ['class', 'curriculum', 'agent', 'notification', 'session']) {
    assert.ok(has(svc, 'rabbitmq'), `${svc} connects to the Message Broker bus`);
  }
  assert.equal(has('agent', 'redis'), false, 'Agent must not connect to Redis');
  assert.equal(has('notification', 'db-notification'), false);
});

test('findRoute matches either direction and reports forward flag', () => {
  const R = load();
  assert.equal(R.findRoute('harness', 'redis').forward, true);
  assert.equal(R.findRoute('redis', 'harness').forward, false);
  assert.equal(R.findRoute('redis', 'agent'), null);
});

test('horizontal opposite sides: straight when aligned, Z-route when offset', () => {
  const R = load();
  const route = { a: 'x', b: 'y', aSide: 'right', bSide: 'left' };
  const straight = R.buildRoute(route, box(0, 0, 100, 40), box(200, 0, 100, 40));
  assert.equal(straight.d, 'M 100 20 L 200 20');
  const z = R.buildRoute(route, box(0, 0, 100, 40), box(200, 100, 100, 40));
  assert.equal(z.d, 'M 100 20 L 150 20 L 150 120 L 200 120');
});

test('vertical opposite sides: Z-route with midpoint', () => {
  const R = load();
  const route = { a: 'x', b: 'y', aSide: 'bottom', bSide: 'top', aAt: 0.25, bAt: 0.75 };
  const z = R.buildRoute(route, box(0, 0, 100, 40), box(100, 140, 100, 40));
  assert.equal(z.d, 'M 25 40 L 25 90 L 175 90 L 175 140');
});

test('right to top lane route drops onto the target edge at the lane x', () => {
  const R = load();
  const route = { a: 's', b: 'bus', aSide: 'right', aAt: 0.85, bSide: 'top', lane: 40 };
  const built = R.buildRoute(route, box(0, 0, 210, 80), box(0, 300, 555, 60));
  assert.equal(built.d, 'M 210 68 L 250 68 L 250 300');
  assert.equal(built.points[built.points.length - 1].y, 300);
});

test('left to top lane route jogs above the target then runs over', () => {
  const R = load();
  const route = { a: 'session', b: 'harness', aSide: 'left', aAt: 0.8, bSide: 'top', bAt: 0.75, lane: 14 };
  const built = R.buildRoute(route, box(900, 600, 210, 80), box(500, 800, 210, 80));
  assert.equal(built.d, 'M 900 664 L 886 664 L 886 778 L 658 778 L 658 800');
});

test('dReverse is the exact reverse of d and mutates nothing', () => {
  const R = load();
  const route = { a: 'x', b: 'y', aSide: 'right', bSide: 'left' };
  const built = R.buildRoute(route, box(0, 0, 100, 40), box(200, 100, 100, 40));
  assert.equal(built.dReverse, 'M 200 120 L 150 120 L 150 20 L 100 20');
  assert.equal(built.points[0].x, 100);
});

test('routeHitsRect detects interior crossings but not edge-touching endpoints', () => {
  const R = load();
  const rect = box(100, 100, 100, 100);
  assert.equal(R.routeHitsRect([{ x: 0, y: 150 }, { x: 300, y: 150 }], rect), true);
  assert.equal(R.routeHitsRect([{ x: 0, y: 150 }, { x: 100, y: 150 }], rect), false);
  assert.equal(R.routeHitsRect([{ x: 0, y: 50 }, { x: 300, y: 50 }], rect), false);
});

test('broker routes define distinct session short drop and directional bus metadata', () => {
  const R = load();
  const sessionRoute = R.findRoute('session', 'rabbitmq').route;
  assert.equal(sessionRoute.lane, 20, 'session has distinct short drop at lane 20');
  assert.equal(sessionRoute.bus, true);
  assert.equal(sessionRoute.dir, 'publish');

  for (const svc of ['class', 'curriculum', 'agent', 'notification']) {
    const r = R.findRoute(svc, 'rabbitmq').route;
    assert.equal(r.lane, 44, `${svc} shares bus trunk at lane 44`);
    assert.equal(r.bus, true);
  }
  assert.equal(R.findRoute('notification', 'rabbitmq').route.dir, 'consume');
});

test('findLabelPlacement places label pill in open space along the route', () => {
  const R = load();
  const pts = [{ x: 595, y: 659 }, { x: 735, y: 659 }];
  const textRects = [
    { left: 746, top: 630, right: 934, bottom: 687 }
  ];
  const placement = R.findLabelPlacement(pts, 80, 15, textRects);
  assert.ok(placement, 'finds placement');
  assert.ok(placement.pill.right < 746, 'pill sits outside textRect');
  assert.equal(placement.pill.left, 625);
  assert.equal(placement.pill.right, 705);
});

test('findPath finds shortest path over ROUTES adjacency', () => {
  const R = load();
  assert.equal(typeof R.findPath, 'function', 'exports findPath');

  // Direct neighbours
  assert.deepEqual(R.findPath('web-client', 'reverse-proxy'), ['web-client', 'reverse-proxy']);
  assert.deepEqual(R.findPath('reverse-proxy', 'web-client'), ['reverse-proxy', 'web-client']);
  assert.deepEqual(R.findPath('harness', 'redis'), ['harness', 'redis']);

  // Multi-hop through apisix
  assert.deepEqual(R.findPath('web-client', 'harness'), ['web-client', 'reverse-proxy', 'apisix', 'harness']);
  assert.deepEqual(R.findPath('harness', 'web-client'), ['harness', 'apisix', 'reverse-proxy', 'web-client']);
  assert.deepEqual(R.findPath('session', 'web-client'), ['session', 'apisix', 'reverse-proxy', 'web-client']);
  assert.deepEqual(R.findPath('harness', 'agent'), ['harness', 'apisix', 'agent']);

  // Same node
  assert.deepEqual(R.findPath('harness', 'harness'), ['harness']);

  // Unreachable returns null
  assert.equal(R.findPath('harness', 'nonexistent'), null);
  assert.equal(R.findPath('unknown-a', 'unknown-b'), null);
  assert.equal(R.findPath(null, 'harness'), null);
});

