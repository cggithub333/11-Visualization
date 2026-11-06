/**
 * ESPP Full Architecture - declarative orthogonal routes (UMD-Lite).
 * Pure geometry, no DOM access. Rects are { left, top, right, bottom } in grid-local px.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FullArchRoutes = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // aSide / bSide: box edge the route leaves / enters. aAt / bAt: position along that edge (0..1).
  // lane: px offset used by L/U routes (vertical trunk next to the source box).
  const ROUTES = [
    // Ingress pipeline
    { a: 'web-client', b: 'reverse-proxy', aSide: 'right', bSide: 'left' },
    { a: 'reverse-proxy', b: 'apisix', aSide: 'right', bSide: 'left' },
    // External IAM Service
    { a: 'apisix', b: 'iam', aSide: 'top', bSide: 'bottom' },
    // Gateway fan-out (shared vertical trunk at the corridor midpoint)
    { a: 'apisix', b: 'class', aSide: 'right', bSide: 'left', bAt: 0.35 },
    { a: 'apisix', b: 'curriculum', aSide: 'right', bSide: 'left', bAt: 0.35 },
    { a: 'apisix', b: 'agent', aSide: 'right', bSide: 'left', bAt: 0.35 },
    { a: 'apisix', b: 'notification', aSide: 'right', bSide: 'left', bAt: 0.35 },
    { a: 'apisix', b: 'session', aSide: 'right', bSide: 'left', bAt: 0.35 },
    // Service <-> its own database (two-way)
    { a: 'class', b: 'db-class', aSide: 'right', bSide: 'left' },
    { a: 'curriculum', b: 'db-curriculum', aSide: 'right', bSide: 'left' },
    { a: 'agent', b: 'db-agent', aSide: 'right', bSide: 'left' },
    { a: 'session', b: 'postgres', aSide: 'right', bSide: 'left' },
    // Message Broker event bus (distinct short drop for session; shared trunk lane for upper services)
    { a: 'class', b: 'rabbitmq', aSide: 'right', aAt: 0.85, bSide: 'top', lane: 44, bus: true },
    { a: 'curriculum', b: 'rabbitmq', aSide: 'right', aAt: 0.85, bSide: 'top', lane: 44, bus: true, dir: 'publish' },
    { a: 'agent', b: 'rabbitmq', aSide: 'right', aAt: 0.85, bSide: 'top', lane: 44, bus: true, dir: 'publish' },
    { a: 'notification', b: 'rabbitmq', aSide: 'right', aAt: 0.85, bSide: 'top', lane: 44, bus: true, dir: 'consume' },
    { a: 'session', b: 'rabbitmq', aSide: 'right', aAt: 0.85, bSide: 'top', lane: 20, bus: true, dir: 'publish' },
    // Harness
    { a: 'apisix', b: 'harness', aSide: 'bottom', bSide: 'top', bAt: 0.3 },
    { a: 'session', b: 'harness', aSide: 'left', aAt: 0.8, bSide: 'top', bAt: 0.75, lane: 14 },
    { a: 'harness', b: 'redis', aSide: 'left', bSide: 'right' },
    { a: 'harness', b: 'cloudflare-r2', aSide: 'right', bSide: 'left' },
    // AI inference cluster
    { a: 'harness', b: 'ai-voice', aSide: 'bottom', aAt: 0.25, bSide: 'top' },
    { a: 'harness', b: 'laya', aSide: 'bottom', aAt: 0.5, bSide: 'top' },
    { a: 'harness', b: 'tts', aSide: 'bottom', aAt: 0.75, bSide: 'top' },
    { a: 'laya', b: 'vllm', aSide: 'bottom', bSide: 'top' }
  ];

  const isHorizontal = (side) => side === 'left' || side === 'right';

  function anchor(rect, side, at) {
    const w = rect.right - rect.left;
    const h = rect.bottom - rect.top;
    if (side === 'right') return { x: rect.right, y: rect.top + h * at };
    if (side === 'left') return { x: rect.left, y: rect.top + h * at };
    if (side === 'top') return { x: rect.left + w * at, y: rect.top };
    return { x: rect.left + w * at, y: rect.bottom };
  }

  function buildPoints(route, rectA, rectB) {
    const { aSide, bSide } = route;
    const A = anchor(rectA, aSide, route.aAt ?? 0.5);
    const B = anchor(rectB, bSide, route.bAt ?? 0.5);

    if (isHorizontal(aSide) && isHorizontal(bSide)) {
      if (Math.round(A.y) === Math.round(B.y)) return [A, { x: B.x, y: A.y }];
      const xm = route.lane != null
        ? A.x + (aSide === 'right' ? route.lane : -route.lane)
        : Math.round((A.x + B.x) / 2);
      return [A, { x: xm, y: A.y }, { x: xm, y: B.y }, B];
    }

    if (!isHorizontal(aSide) && !isHorizontal(bSide)) {
      if (Math.round(A.x) === Math.round(B.x)) return [A, { x: A.x, y: B.y }];
      const ym = route.lane != null
        ? A.y + (aSide === 'bottom' ? route.lane : -route.lane)
        : Math.round((A.y + B.y) / 2);
      return [A, { x: A.x, y: ym }, { x: B.x, y: ym }, B];
    }

    if (isHorizontal(aSide) && !isHorizontal(bSide)) {
      if (typeof route.lane !== 'number') {
        throw new Error(`Route ${route.a}-${route.b} needs a numeric lane`);
      }
      const laneX = A.x + (aSide === 'right' ? route.lane : -route.lane);
      if (aSide === 'right') {
        return [A, { x: laneX, y: A.y }, { x: laneX, y: B.y }];
      }
      const yJog = B.y - 22;
      return [A, { x: laneX, y: A.y }, { x: laneX, y: yJog }, { x: B.x, y: yJog }, B];
    }

    throw new Error(`Unsupported side pair ${aSide}->${bSide} on route ${route.a}-${route.b}`);
  }

  function toPath(points) {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  function buildRoute(route, rectA, rectB) {
    const points = buildPoints(route, rectA, rectB).map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    return { points, d: toPath(points), dReverse: toPath(points.slice().reverse()) };
  }

  function findRoute(src, tgt) {
    for (const route of ROUTES) {
      if (route.a === src && route.b === tgt) return { route, forward: true };
      if (route.a === tgt && route.b === src) return { route, forward: false };
    }
    return null;
  }

  function routeHitsRect(points, rect, pad = 1) {
    for (let i = 0; i < points.length - 1; i++) {
      const p = points[i];
      const q = points[i + 1];
      const hit =
        Math.max(p.x, q.x) > rect.left + pad &&
        Math.min(p.x, q.x) < rect.right - pad &&
        Math.max(p.y, q.y) > rect.top + pad &&
        Math.min(p.y, q.y) < rect.bottom - pad;
      if (hit) return true;
    }
    return false;
  }

  function findLabelPlacement(points, pillWidth, pillHeight = 15, textRects = []) {
    const segs = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      segs.push({ p1, p2, len, i, isHoriz: Math.round(p1.y) === Math.round(p2.y) });
    }
    segs.sort((a, b) => {
      const aFit = a.isHoriz ? (a.len >= pillWidth + 8) : (a.len >= pillHeight + 8);
      const bFit = b.isHoriz ? (b.len >= pillWidth + 8) : (b.len >= pillHeight + 8);
      if (aFit !== bFit) return aFit ? -1 : 1;
      return b.len - a.len;
    });

    const hitsAny = (pill) => {
      if (!textRects || !textRects.length) return false;
      const pad = 4;
      for (const tr of textRects) {
        if (
          pill.left < tr.right + pad &&
          pill.right > tr.left - pad &&
          pill.top < tr.bottom + pad &&
          pill.bottom > tr.top - pad
        ) {
          return true;
        }
      }
      return false;
    };

    for (const seg of segs) {
      const { p1, p2, isHoriz } = seg;
      const midX = Math.round((p1.x + p2.x) / 2);
      const midY = Math.round((p1.y + p2.y) / 2);

      let candidates = [];
      if (isHoriz) {
        candidates.push({
          pill: { left: midX - pillWidth / 2, top: midY - 18, right: midX + pillWidth / 2, bottom: midY - 3 },
          x: midX, y: midY - 10.5
        });
        candidates.push({
          pill: { left: midX - pillWidth / 2, top: midY + 4, right: midX + pillWidth / 2, bottom: midY + 19 },
          x: midX, y: midY + 11.5
        });
        candidates.push({
          pill: { left: midX - pillWidth / 2, top: midY - 24, right: midX + pillWidth / 2, bottom: midY - 9 },
          x: midX, y: midY - 16.5
        });
      } else {
        candidates.push({
          pill: { left: midX - pillWidth / 2, top: midY - pillHeight / 2, right: midX + pillWidth / 2, bottom: midY + pillHeight / 2 },
          x: midX, y: midY
        });
        candidates.push({
          pill: { left: midX - pillWidth - 8, top: midY - pillHeight / 2, right: midX - 8, bottom: midY + pillHeight / 2 },
          x: midX - pillWidth / 2 - 8, y: midY
        });
        candidates.push({
          pill: { left: midX + 8, top: midY - pillHeight / 2, right: midX + 8 + pillWidth, bottom: midY + pillHeight / 2 },
          x: midX + 8 + pillWidth / 2, y: midY
        });
      }

      for (const cand of candidates) {
        if (!hitsAny(cand.pill)) {
          return { ...cand, seg };
        }
      }
    }

    const fallback = segs[0] || { p1: points[0], p2: points[points.length - 1], isHoriz: true };
    const fx = Math.round((fallback.p1.x + fallback.p2.x) / 2);
    const fy = Math.round((fallback.p1.y + fallback.p2.y) / 2);
    return fallback.isHoriz
      ? { pill: { left: fx - pillWidth / 2, top: fy - 18, right: fx + pillWidth / 2, bottom: fy - 3 }, x: fx, y: fy - 10.5 }
      : { pill: { left: fx - pillWidth / 2, top: fy - pillHeight / 2, right: fx + pillWidth / 2, bottom: fy + pillHeight / 2 }, x: fx, y: fy };
  }

  return { ROUTES, findRoute, buildRoute, routeHitsRect, findLabelPlacement };
});
