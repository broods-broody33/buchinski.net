// Hero animation: tangled lines swirl on the left and dissolve, while evenly
// spaced lanes form and stream out on the right ("complexity in, clarity
// out"). The pointer stirs the lines up; the system re-orders itself.
// Add data-static to the canvas to render a single still frame (used for the
// social preview image).
(() => {
  const canvas = document.getElementById("flow");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const still = canvas.hasAttribute("data-static") ||
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BG = "12,15,14";
  const LANE = 18;
  const BUCKETS = [
    "rgba(196,188,170,0.28)",
    "rgba(214,196,170,0.36)",
    "rgba(255,107,61,0.55)",
    "rgba(255,176,140,0.85)",
  ];
  const pointer = { x: -9999, y: -9999 };
  let w = 0, h = 0, t = 0, particles = [], running = false, frame = 0;
  let zoneStart = 0, zoneEnd = 0;

  const smooth = (a, b, x) => {
    const k = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return k * k * (3 - 2 * k);
  };
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));

  // Curl of a smooth potential: a swirling, divergence-free flow, so the
  // tangle never herds particles into clumps however long it runs.
  const K1 = 0.0055, K2 = 0.0068, K3 = 0.0031, AMP = 280;
  function field(x, y) {
    const a = K1 * x + t * 0.6, b = K2 * y - t * 0.45, c = K3 * (x + y) + t * 0.3;
    const dx = K1 * Math.cos(a) * Math.cos(b) + 0.7 * K3 * Math.cos(c);
    const dy = -K2 * Math.sin(a) * Math.sin(b) + 0.7 * K3 * Math.cos(c);
    return [dy * AMP, -dx * AMP];
  }

  // Two populations. Tangle particles swirl on the left and fade out partway
  // into the transition; lane particles are born in the transition, slightly
  // off their lane, and settle into it. The lanes stay evenly filled forever.
  function spawnTangle(p, x) {
    p.lane = -1;
    p.x = x ?? Math.random() * (zoneStart + 40) - 40;
    p.y = Math.random() * h;
    p.s = 0.55 + Math.random() * 0.8;
    p.cut = 0.15 + Math.random() * 0.5;
    return p;
  }
  function spawnLane(p, x) {
    const lanes = Math.max(1, Math.floor(h / LANE));
    p.lane = (Math.floor(Math.random() * lanes) + 0.5) * LANE;
    p.x = x ?? zoneStart - 30 + Math.random() * (zoneEnd - zoneStart) * 0.4;
    p.y = p.lane + (Math.random() - 0.5) * LANE * 5;
    p.s = 0.7 + Math.random() * 0.6;
    return p;
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    w = r.width;
    h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = `rgb(${BG})`;
    ctx.fillRect(0, 0, w, h);
    // On narrow screens the ordered zone starts earlier so it shows above the text.
    zoneStart = w * (w < 760 ? 0.25 : 0.38);
    zoneEnd = w * (w < 760 ? 0.7 : 0.8);
    const count = Math.round(Math.min(1300, Math.max(650, (w * h) / 800)));
    particles = Array.from({ length: count }, (_, i) =>
      i % 20 < 11
        ? spawnTangle({}, Math.random() * zoneEnd)
        : spawnLane({}, zoneStart + Math.random() * (w - zoneStart)));
  }

  function step() {
    t += 0.004;
    ctx.fillStyle = `rgba(${BG},0.085)`;
    ctx.fillRect(0, 0, w, h);
    const paths = BUCKETS.map(() => new Path2D());

    for (const p of particles) {
      const px = p.x, py = p.y;
      const order = smooth(zoneStart, zoneEnd, p.x);
      const [fx, fy] = field(p.x, p.y);
      const tangle = p.lane < 0;
      let vx, vy;
      if (tangle) {
        // The floor on vx keeps eddies from trapping particles.
        vx = Math.max(0.3, fx + 0.9);
        vy = fy;
      } else {
        vx = 1 + order * 1.8;
        vy = fy * (1 - order) * 0.5 + clamp((p.lane - p.y) * 0.05, 1.2) * order;
      }

      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < 130) {
        const f = (1 - d / 130) * 4;
        vx += (dx / (d + 1)) * f + (-dy / (d + 1)) * f;
        vy += (dy / (d + 1)) * f + (dx / (d + 1)) * f;
      }

      p.x += vx * p.s;
      p.y += vy * p.s;
      if (tangle && (order > p.cut || p.x > w || Math.random() < 0.003)) {
        spawnTangle(p);
        continue;
      }
      if (!tangle && p.x > w + 10) {
        spawnLane(p);
        continue;
      }
      // Wrap top/bottom instead of losing particles the field flings out.
      if (p.y < 0 || p.y > h) {
        p.y = (p.y + h) % h;
        continue;
      }
      const path = paths[Math.min(3, Math.floor(order * 4))];
      path.moveTo(px, py);
      path.lineTo(p.x, p.y);
    }

    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    paths.forEach((path, i) => {
      ctx.strokeStyle = BUCKETS[i];
      ctx.stroke(path);
    });
  }

  function loop() {
    if (!running) return;
    step();
    frame = requestAnimationFrame(loop);
  }

  function start() {
    if (running || still) return;
    running = true;
    frame = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
  }

  function renderStill() {
    for (let i = 0; i < 500; i++) step();
  }

  resize();
  if (still) {
    renderStill();
    return;
  }
  // Warm up so the lanes are already formed on first paint.
  for (let i = 0; i < 160; i++) step();

  let lastW = w, lastH = h, timer;
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const r = canvas.getBoundingClientRect();
      // Ignore the small height changes from mobile browser toolbars.
      if (r.width === lastW && Math.abs(r.height - lastH) < 140) return;
      resize();
      lastW = w;
      lastH = h;
      for (let i = 0; i < 160; i++) step();
    }, 150);
  });

  const hero = canvas.parentElement;
  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", () => {
    pointer.x = pointer.y = -9999;
  });

  new IntersectionObserver(([entry]) => {
    entry.isIntersecting && !document.hidden ? start() : stop();
  }).observe(canvas);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else if (canvas.getBoundingClientRect().bottom > 0) start();
  });
})();
