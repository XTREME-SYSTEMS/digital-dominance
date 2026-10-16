/**
 * Pompano Beach development estimate experience.
 * Intentionally does not call fetch(), Base44, CRM, email, SMS,
 * localStorage, sessionStorage, or any third-party collection endpoint.
 * The displayed price is a TEST-ASSUMPTION example, never a verified quote.
 */
(() => {
  "use strict";

  const element = (id) => document.getElementById(id);
  const menu = element("menu-button");
  const navigation = element("primary-navigation");
  const closeMenu = () => {
    if (!navigation || !menu) return;
    navigation.classList.remove("is-open");
    menu.setAttribute("aria-expanded", "false");
  };

  menu?.addEventListener("click", () => {
    const isOpen = navigation.classList.toggle("is-open");
    menu.setAttribute("aria-expanded", String(isOpen));
  });

  navigation?.querySelectorAll("a").forEach((anchor) => {
    anchor.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  const introForm = element("intro-form");
  const introError = element("intro-error");
  const showError = (target, message) => {
    target.textContent = message;
    target.hidden = false;
  };
  const clearError = (target) => {
    target.textContent = "";
    target.hidden = true;
  };

  introForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    // Contacts stay in form fields only: never sent, persisted, or logged.
    const name = element("intro-name").value.trim();
    const phone = element("intro-phone").value.trim();
    const email = element("intro-email").value.trim();
    const zip = element("intro-zip").value.trim();
    const phoneDigits = (phone.match(/\d/g) || []).length;

    if (name.length < 2) {
      showError(introError, "Please enter your name (at least two characters).");
      element("intro-name").focus();
      return;
    }
    if (phoneDigits < 7 || !/^[\d()+.\s-]{7,30}$/.test(phone)) {
      showError(introError, "Please enter a valid phone number.");
      element("intro-phone").focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError(introError, "Please enter a valid email address.");
      element("intro-email").focus();
      return;
    }
    if (!/^\d{5}$/.test(zip)) {
      showError(introError, "Please enter a five-digit ZIP code.");
      element("intro-zip").focus();
      return;
    }

    clearError(introError);
    element("estimate").scrollIntoView({ behavior: "smooth", block: "start" });
    // Explicitly no form submission: validation only.
  });

  const photoInput = element("project-photos");
  const photoStatus = element("photo-status");
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const maxBytesPerImage = 10 * 1024 * 1024;
  photoInput?.addEventListener("change", () => {
    const photos = Array.from(photoInput.files || []);
    if (photos.length > 10) {
      photoInput.value = "";
      photoStatus.textContent = "Choose up to 10 images.";
      return;
    }
    const invalid = photos.find((photo) => !allowedTypes.has(photo.type) || photo.size > maxBytesPerImage);
    if (invalid) {
      photoInput.value = "";
      photoStatus.textContent = "Select JPG, PNG or WebP images, each 10 MB or smaller.";
      return;
    }
    photoStatus.textContent = photos.length === 0
      ? "No photos selected"
      : photos.length === 1
        ? "1 image selected locally. No upload will occur."
        : photos.length + " images selected locally. No upload will occur.";
  });

  const estimateForm = element("estimate-form");
  const estimateError = element("estimate-error");
  const rates = Object.freeze({
    flake: 7,
    solid: 6,
    quartz: 9,
    metallic: 12,
  });
  const conditionAdjustments = Object.freeze({
    good: 0,
    minor: 0.05,
    several: 0.12,
    major: 0.2,
  });
  const existingFloorAdjustments = Object.freeze({
    bare: 0,
    paint: 0.1,
    coating: 0.18,
    unsure: 0,
  });
  const priceFormat = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const round50 = (value) => Math.round(value / 50) * 50;

  estimateForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const feetInput = element("square-feet");
    const squareFeet = Number(feetInput.value);
    const selectedFinish = element("finish").value;
    const selectedCondition = element("condition").value;
    const selectedExisting = element("existing-floor").value;

    if (!Number.isInteger(squareFeet) || squareFeet < 80 || squareFeet > 10000) {
      showError(estimateError, "Enter floor area from 80 to 10,000 whole square feet.");
      feetInput.focus();
      element("estimate-output").hidden = true;
      return;
    }
    if (!(selectedFinish in rates) ||
        !(selectedCondition in conditionAdjustments) ||
        !(selectedExisting in existingFloorAdjustments)) {
      showError(estimateError, "Choose a valid floor, condition and finish.");
      element("estimate-output").hidden = true;
      return;
    }

    clearError(estimateError);
    // Internal test rates only: they are not sourced market prices.
    const adjustment = conditionAdjustments[selectedCondition] + existingFloorAdjustments[selectedExisting];
    const midpoint = Math.max(1800, squareFeet * rates[selectedFinish] * (1 + adjustment));
    const low = round50(midpoint * 0.88);
    const high = round50(midpoint * 1.15);

    element("estimate-value").textContent = priceFormat.format(low) + " – " + priceFormat.format(high);
    element("estimate-detail").textContent =
      squareFeet.toLocaleString("en-US") + " sq ft · " +
      element("finish").selectedOptions[0].textContent +
      " · " + element("condition").selectedOptions[0].textContent + ".";
    const result = element("estimate-output");
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  // Defense in depth: disable browser-native navigation/form posting if JS is unavailable?
  // The HTML form has no action; the deployed preview must not be treated as a CRM.
})();
