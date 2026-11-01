// Contact form: messages are not sent anywhere. Each accepted submission
// bumps a public counter; a GitHub Action copies it into submissions.txt daily.
const COUNTER_URL = "https://abacus.jasoncameron.dev/hit/buchinski-net/contact-form";

document.getElementById("year").textContent = new Date().getFullYear();

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
