// Contact form: messages are not sent anywhere. Each accepted submission
// bumps a public counter; a GitHub Action copies it into submissions.txt daily.
const COUNTER_URL = "https://abacus.jasoncameron.dev/hit/buchinski-net/contact-form";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const stacking = matchMedia("(min-width: 761px) and (min-height: 700px)");
const clamp01 = (v) => Math.min(1, Math.max(0, v));

document.getElementById("year").textContent = new Date().getFullYear();

/* Hero: the letters of "Complexity in." fly in scattered and settle into place */
const scramble = document.querySelector(".scramble");
const scrambleText = scramble.textContent;
scramble.innerHTML =
  `<span class="sr-only">${scrambleText}</span>` +
  [...scrambleText].map((ch, i) => {
    const r = (n) => (Math.random() * 2 - 1) * n;
    const style = `--tx:${r(90).toFixed(0)}px;--ty:${r(70).toFixed(0)}px;--r:${r(55).toFixed(0)}deg;--d:${(0.05 + i * 0.045 + Math.random() * 0.12).toFixed(2)}s`;
    return `<span class="ch" aria-hidden="true" style="${style}">${ch}</span>`;
  }).join("");

/* Nav: solid background after the hero starts scrolling; mobile menu */
const nav = document.getElementById("nav");
const toggle = nav.querySelector(".menu-toggle");
toggle.addEventListener("click", () => {
  const open = toggle.getAttribute("aria-expanded") !== "true";
  toggle.setAttribute("aria-expanded", open);
  nav.classList.toggle("open", open);
  document.body.style.overflow = open ? "hidden" : "";
});
nav.querySelectorAll("nav a").forEach((link) =>
  link.addEventListener("click", () => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
    document.body.style.overflow = "";
  })
);

/* Reveal and line drawing on scroll */
const revealer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      revealer.unobserve(entry.target);
    }
  }),
  { rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal, .draw-on").forEach((el) => revealer.observe(el));

/* Statement: words light up as it scrolls through the viewport */
const statement = document.querySelector("[data-words]");
statement.innerHTML = statement.textContent
  .trim()
  .split(/\s+/)
  .map((word) => `<span class="w">${word}</span>`)
  .join(" ");
const words = [...statement.querySelectorAll(".w")];

const timeline = document.getElementById("timeline");
const steps = [...timeline.querySelectorAll(".step")];
const services = [...document.querySelectorAll(".service")];
const footerBig = document.querySelector(".footer-big");
const root = document.documentElement;

// The scrolling band speeds up with fast scrolling, then eases back.
const marqueeAnim = document.querySelector(".marquee-track").getAnimations?.()[0];
let marqueeRate = 1, easing = false, lastY = window.scrollY;
function easeMarquee() {
  marqueeRate += (1 - marqueeRate) * 0.06;
  if (marqueeRate < 1.01) marqueeRate = 1;
  marqueeAnim.playbackRate = marqueeRate;
  if (marqueeRate > 1) requestAnimationFrame(easeMarquee);
  else easing = false;
}

function progressThrough(el, startAt, span) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return clamp01((vh * startAt - r.top) / (r.height + vh * span));
}

function onScroll() {
  const max = root.scrollHeight - window.innerHeight;
  root.style.setProperty("--scroll", max > 0 ? window.scrollY / max : 0);
  nav.classList.toggle("solid", window.scrollY > 40);

  const lit = reduceMotion ? words.length : Math.round(progressThrough(statement, 0.85, 0.15) * words.length);
  words.forEach((w, i) => w.classList.toggle("lit", i < lit));

  const p = reduceMotion ? 1 : progressThrough(timeline, 0.75, 0.05);
  timeline.style.setProperty("--p", p);
  steps.forEach((step, i) => step.classList.toggle("active", p >= i / steps.length + 0.02));

  // Service cards stack: each one shrinks and dims as the next slides over it.
  services.forEach((card, i) => {
    const inner = card.firstElementChild;
    const next = services[i + 1];
    let covered = 0;
    if (next && stacking.matches && !reduceMotion) {
      const r = card.getBoundingClientRect();
      covered = clamp01((r.bottom - next.getBoundingClientRect().top) / r.height);
    }
    inner.style.setProperty("--sc", (1 - covered * 0.06).toFixed(4));
    inner.style.setProperty("--dim", (covered * 0.1).toFixed(3));
  });

  // Fills as you approach the bottom of the page, complete when you reach it.
  const toBottom = max - window.scrollY;
  const fill = reduceMotion ? 100 : clamp01(1 - toBottom / (window.innerHeight * 0.7)) * 100;
  footerBig.style.setProperty("--fill", `${fill.toFixed(1)}%`);

  if (marqueeAnim && !reduceMotion) {
    const speed = Math.abs(window.scrollY - lastY);
    marqueeRate = Math.max(marqueeRate, 1 + Math.min(speed / 8, 6));
    marqueeAnim.playbackRate = marqueeRate;
    if (!easing) {
      easing = true;
      requestAnimationFrame(easeMarquee);
    }
  }
  lastY = window.scrollY;
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    onScroll();
    ticking = false;
  });
}, { passive: true });
window.addEventListener("resize", onScroll);
onScroll();

/* Pointer effects (desktop only): spotlight cards, tilt, magnetic buttons */
if (finePointer && !reduceMotion) {
  document.querySelectorAll(".spotlight").forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - r.left}px`);
      card.style.setProperty("--y", `${e.clientY - r.top}px`);
    })
  );
  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.classList.add("tilting");
      card.style.setProperty("--ry", `${((px - 0.5) * 10).toFixed(2)}deg`);
      card.style.setProperty("--rx", `${((0.5 - py) * 8).toFixed(2)}deg`);
      card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("tilting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  });
  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.setProperty("--mx", `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
      btn.style.setProperty("--my", `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
    });
    btn.addEventListener("pointerleave", () => {
      btn.style.setProperty("--mx", "0px");
      btn.style.setProperty("--my", "0px");
    });
  });
}

/* Across Canada: illustrative scenarios on the map (composites, not clients).
   x/y are positions on canada-map.svg (1000 × 861). */
const SCENARIOS = [
  { city: "Vancouver", prov: "BC", x: 63, y: 608, tag: "Technology", who: "An independent retail group with six stores",
    problem: "Stock lives in a different spreadsheet at every location, so reordering is guesswork and good sellers keep running out.",
    start: "One shared view of inventory across the stores, with simple reorder rules the team can actually keep up with." },
  { city: "Calgary", prov: "AB", x: 188, y: 624, tag: "Operations", who: "An energy services contractor",
    problem: "Field crews and the office work from different versions of the schedule, and every change turns into a round of phone calls.",
    start: "Map dispatch from first call to closed job, then move everyone onto a single schedule they all trust." },
  { city: "Saskatoon", prov: "SK", x: 286, y: 630, tag: "Strategy", who: "An agricultural equipment dealer",
    problem: "After two strong years, the owners are torn on whether to open a second location or invest in the one they have.",
    start: "Test both options against real demand and cash flow before anyone signs a lease." },
  { city: "Winnipeg", prov: "MB", x: 401, y: 695, tag: "Operations", who: "A regional distributor",
    problem: "Volume is up every year, but margins keep shrinking and nobody can say which customers or routes are actually profitable.",
    start: "Work out the real cost to serve each customer and route, then reset pricing, minimums and delivery days around it." },
  { city: "Toronto", prov: "ON", x: 664, y: 811, tag: "Strategy", who: "A 40-person professional services firm",
    problem: "The partners agree the firm should grow but disagree on how, so every planning meeting ends without a decision.",
    start: "A structured planning process that ends with three priorities, each with an owner, a budget and a date." },
  { city: "Ottawa", prov: "ON", x: 710, y: 761, tag: "Technology", who: "A national non-profit",
    problem: "Quarterly reporting to funders takes a week of copying numbers between systems, and the totals rarely match the first time.",
    start: "Automate the data collection and build one reporting template that every program feeds into." },
  { city: "Montréal", prov: "QC", x: 740, y: 751, tag: "Operations", who: "A specialty food manufacturer",
    problem: "New wholesale accounts are great news, but production planning hasn't kept up and overtime is becoming the plan.",
    start: "A realistic capacity plan and a weekly sales-and-production rhythm so orders and the plant stay in step." },
  { city: "Halifax", prov: "NS", x: 887, y: 714, tag: "Strategy", who: "A family-owned marine supplier",
    problem: "The founder wants to step back, but every decision still runs through them and nothing is written down.",
    start: "Document how decisions really get made, delegate in stages and build a succession roadmap the family agrees on." },
  { city: "St. John's", prov: "NL", x: 993, y: 581, tag: "Technology", who: "A growing construction firm",
    problem: "They need new job-costing software and have three vendor demos booked, but no agreed list of what it must do.",
    start: "Agree the three must-haves first, then test each option with the people who'll use it on site." },
];

const cityLayer = document.getElementById("cities");
const scenarioCard = document.getElementById("scenario");
const scBody = document.getElementById("sc-body");
const scBar = document.getElementById("sc-bar");
const field = (id) => document.getElementById(id);
const cityButtons = SCENARIOS.map((s, i) => {
  const btn = document.createElement("button");
  btn.className = "city" + (s.x < 120 ? " edge-left" : s.x > 860 ? " edge-right" : "");
  btn.style.left = `${s.x / 10}%`;
  btn.style.top = `${(s.y / 861) * 100}%`;
  btn.setAttribute("aria-label", `${s.city}, ${s.prov}`);
  btn.innerHTML = `<span class="city-label">${s.city}</span>`;
  btn.addEventListener("click", () => showScenario(i));
  cityLayer.appendChild(btn);
  return btn;
});

let current = 0, inView = false, hovering = false;

function showScenario(i) {
  current = (i + SCENARIOS.length) % SCENARIOS.length;
  const s = SCENARIOS[current];
  field("sc-tag").textContent = s.tag;
  field("sc-count").textContent = `${String(current + 1).padStart(2, "0")} / ${String(SCENARIOS.length).padStart(2, "0")}`;
  field("sc-place").textContent = `${s.city}, ${s.prov}`;
  field("sc-who").textContent = s.who;
  field("sc-problem").textContent = s.problem;
  field("sc-start").textContent = s.start;
  cityButtons.forEach((b, j) => b.classList.toggle("active", j === current));
  scBody.classList.remove("swap");
  void scBody.offsetWidth; // restart the swap animation
  scBody.classList.add("swap");
  restartTimer();
}

// The progress bar is the timer: when its fill animation ends, move east.
function restartTimer() {
  if (reduceMotion) return;
  scBar.classList.remove("run");
  void scBar.offsetWidth;
  scBar.classList.add("run");
  updatePause();
}
function updatePause() {
  scBar.classList.toggle("paused", !inView || hovering);
}
scBar.addEventListener("animationend", () => showScenario(current + 1));
field("sc-prev").addEventListener("click", () => showScenario(current - 1));
field("sc-next").addEventListener("click", () => showScenario(current + 1));
[scenarioCard, cityLayer].forEach((el) => {
  el.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") { hovering = true; updatePause(); } });
  el.addEventListener("pointerleave", () => { hovering = false; updatePause(); });
});
new IntersectionObserver(([entry]) => {
  inView = entry.isIntersecting;
  updatePause();
}, { threshold: 0.3 }).observe(document.getElementById("canada"));
showScenario(0);

/* Coast to coast to coast: live local time in each Canadian time zone */
const zoneClocks = [...document.querySelectorAll("[data-tz]")].map((el) => ({
  el,
  sun: el.parentElement.querySelector(".zone-sun"),
  time: new Intl.DateTimeFormat("en-CA", { timeZone: el.dataset.tz, hour: "numeric", minute: "2-digit", hour12: true }),
  hour: new Intl.DateTimeFormat("en-CA", { timeZone: el.dataset.tz, hour: "numeric", hourCycle: "h23" }),
}));
function tickClocks() {
  const now = new Date();
  zoneClocks.forEach(({ el, sun, time, hour }) => {
    const parts = Object.fromEntries(time.formatToParts(now).map((p) => [p.type, p.value]));
    el.innerHTML = `${parts.hour}<span class="colon">:</span>${parts.minute}<small>${parts.dayPeriod ?? ""}</small>`;
    const h = Number(hour.format(now));
    sun.classList.toggle("night", h < 7 || h >= 19);
  });
}
tickClocks();
setInterval(tickClocks, 10000);

/* FAQ */
document.querySelectorAll(".faq-q").forEach((q) =>
  q.addEventListener("click", () => q.setAttribute("aria-expanded", q.getAttribute("aria-expanded") !== "true"))
);

/* Field notes dialogs */
document.querySelectorAll("[data-note]").forEach((card) =>
  card.addEventListener("click", () => document.getElementById(card.dataset.note).showModal())
);
document.querySelectorAll(".note-dialog").forEach((dialog) => {
  dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });
});

/* Contact form */
const form = document.getElementById("contact-form");
const thanks = document.getElementById("form-thanks");
const error = document.getElementById("form-error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const invalid = [...form.elements].filter((el) => el.willValidate && !el.checkValidity());
  form.querySelectorAll("input, textarea").forEach((el) => el.removeAttribute("aria-invalid"));
  if (invalid.length) {
    invalid.forEach((el) => el.setAttribute("aria-invalid", "true"));
    error.textContent = "Please fill in your name, a valid email and a message.";
    error.hidden = false;
    invalid[0].focus();
    return;
  }
  error.hidden = true;

  const button = form.querySelector("button");
  button.disabled = true;
  button.textContent = "Sending…";

  try {
    await fetch(COUNTER_URL, { keepalive: true });
  } catch {
    // The visitor still gets the confirmation if the counter is unreachable.
  }

  form.hidden = true;
  thanks.hidden = false;
  thanks.focus();
});
