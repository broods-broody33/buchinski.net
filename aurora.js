// Northern lights behind the contact section: a few translucent ribbons of
// vertical light that sway and shimmer. Drawn at half resolution and blurred
// with CSS, so it stays cheap; pauses when off screen.
(() => {
  const canvas = document.getElementById("aurora");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SCALE = 0.5;
  const TAU = Math.PI * 2;

  const RIBBONS = [
    { rgb: [231, 185, 159], base: 0.3, amp: 0.09, f: 1.4, speed: 0.35, h: 0.4, phase: 0 },
    { rgb: [120, 200, 172], base: 0.4, amp: 0.07, f: 2.1, speed: -0.25, h: 0.38, phase: 2 },
    { rgb: [210, 122, 85], base: 0.24, amp: 0.06, f: 1.1, speed: 0.18, h: 0.28, phase: 4 },
  ];

  // One pre-rendered vertical stripe per ribbon: faint at the top, brightest
  // near the bottom edge, like an aurora curtain.
  const stripes = RIBBONS.map(({ rgb }) => {
    const c = document.createElement("canvas");
    c.width = 1;
    c.height = 128;
    const g = c.getContext("2d");
    const grad = g.createLinearGradient(0, 0, 0, 128);
    const [r, gr, b] = rgb;
    grad.addColorStop(0, `rgba(${r},${gr},${b},0)`);
    grad.addColorStop(0.75, `rgba(${r},${gr},${b},0.55)`);
    grad.addColorStop(0.92, `rgba(${r},${gr},${b},0.9)`);
    grad.addColorStop(1, `rgba(${r},${gr},${b},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 1, 128);
    return c;
  });

  let w = 0, h = 0, t = 0, running = false, frame = 0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width * SCALE));
    h = Math.max(1, Math.round(r.height * SCALE));
    canvas.width = w;
    canvas.height = h;
  }

  function draw() {
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    RIBBONS.forEach((rb, i) => {
      for (let x = 0; x < w; x += 2) {
        const nx = x / w;
        const y = h * (rb.base +
          rb.amp * Math.sin(nx * rb.f * TAU + t * rb.speed + rb.phase) +
          rb.amp * 0.5 * Math.sin(nx * rb.f * 5.3 - t * rb.speed * 1.7));
        const len = h * rb.h * (0.6 + 0.4 * Math.sin(nx * 7 + t * 0.6 + rb.phase));
        const shimmer = Math.sin(nx * 11 + t * 0.9 + rb.phase);
        ctx.globalAlpha = 0.25 + 0.4 * shimmer * shimmer;
        ctx.drawImage(stripes[i], x, y - len, 2, len);
      }
    });
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    t += 0.006;
    draw();
    frame = requestAnimationFrame(loop);
  }

  resize();
  draw();
  if (still) return;

  window.addEventListener("resize", () => {
    resize();
    draw();
  });
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !document.hidden) {
      if (!running) {
        running = true;
        frame = requestAnimationFrame(loop);
      }
    } else {
      running = false;
      cancelAnimationFrame(frame);
    }
  }).observe(canvas);
})();
