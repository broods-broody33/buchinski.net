// Contact form: messages are not sent anywhere. Each accepted submission
// bumps a public counter; a GitHub Action copies it into submissions.txt daily.
const COUNTER_URL = "https://abacus.jasoncameron.dev/hit/buchinski-net/contact-form";

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

document.getElementById("year").textContent = new Date().getFullYear();

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

/* Reveal on scroll */
const revealer = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      revealer.unobserve(entry.target);
    }
  }),
  { rootMargin: "0px 0px -8% 0px" }
);
document.querySelectorAll(".reveal").forEach((el) => revealer.observe(el));

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
const root = document.documentElement;

function progressThrough(el, startAt, span) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return Math.min(1, Math.max(0, (vh * startAt - r.top) / (r.height + vh * span)));
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

/* Pointer effects (desktop only): spotlight cards, magnetic buttons */
if (finePointer && !reduceMotion) {
  document.querySelectorAll(".spotlight").forEach((card) =>
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--x", `${e.clientX - r.left}px`);
      card.style.setProperty("--y", `${e.clientY - r.top}px`);
    })
  );
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
