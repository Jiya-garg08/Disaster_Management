/* ============================================================
   request.js — handles the shelter request form
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  seedIfEmpty();

  const form = document.getElementById("requestForm");
  const banner = document.getElementById("resultBanner");
  const useLocationBtn = document.getElementById("useLocationBtn");

  // "Photo Metadata Check" — use navigator.geolocation to confirm
  // the browser's current position, autofilling lat/lng so the
  // submission reflects where the request was actually made from.
  useLocationBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showBanner("error", "Geolocation is not supported on this device.");
      return;
    }
    useLocationBtn.textContent = "📍 Locating…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById("lat").value = pos.coords.latitude.toFixed(5);
        document.getElementById("lng").value = pos.coords.longitude.toFixed(5);
        useLocationBtn.textContent = "📍 Location Captured";
      },
      () => {
        useLocationBtn.textContent = "📍 Use My Current Location";
        showBanner("error", "Could not access your location. Enter coordinates manually.");
      }
    );
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const request = {
      id: generateRequestId(),
      shelterName: document.getElementById("shelterName").value.trim(),
      lat: parseFloat(document.getElementById("lat").value),
      lng: parseFloat(document.getElementById("lng").value),
      victims: parseInt(document.getElementById("victims").value, 10),
      daysWithoutSupply: parseInt(document.getElementById("days").value, 10),
      supplyType: document.getElementById("supplyType").value,
      status: "pending",
      submittedAt: Date.now(),
    };

    // 1. Geofencing check — must fall inside an active disaster zone.
    const zone = findActiveZone(request.lat, request.lng);
    if (!zone) {
      showBanner(
        "error",
        `⛔ Rejected — coordinates (${request.lat}, ${request.lng}) do not fall inside any active disaster zone. Verify the shelter location.`
      );
      return;
    }

    // 2. Anomaly detection — absurd victim counts get flagged for
    // audit instead of entering the auto-dispatch queue.
    if (isAnomalous(request)) {
      request.status = "flagged";
      addRequest(request);
      showBanner(
        "flagged",
        `⚠️ Request ${request.id} logged as FLAGGED — ${request.victims} victims exceeds the auto-dispatch threshold (${ANOMALY_VICTIM_THRESHOLD}). Sent for manual audit instead of automatic dispatch.`
      );
      form.reset();
      return;
    }

    // 3. Valid + reasonable — enters the priority queue.
    addRequest(request);
    const score = calculateUrgencyScore(request);
    showBanner(
      "success",
      `✅ Request ${request.id} accepted — inside ${zone.name}. Urgency score: ${score}. It will appear in the dispatcher's priority queue.`
    );
    form.reset();
  });

  function showBanner(type, message) {
    banner.className = `result-banner show ${type}`;
    banner.textContent = message;
  }
});