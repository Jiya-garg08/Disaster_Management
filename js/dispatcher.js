/* ============================================================
   dispatcher.js — control room UI logic
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  seedIfEmpty();
  renderAll();

  document.getElementById("runDispatchBtn").addEventListener("click", runDispatch);
});

function renderAll() {
  renderQueue();
  renderAlerts();
  renderFleetIdle();
  renderDispatchLog();
}

function renderQueue() {
  const requests = getRequests().filter((r) => r.status === "pending");
  const sorted = sortByUrgency(requests);
  const list = document.getElementById("queueList");
  document.getElementById("queueCount").textContent = `${sorted.length} pending`;

  if (sorted.length === 0) {
    list.innerHTML = `<div class="empty-note">No pending requests. The queue is clear.</div>`;
    return;
  }

  list.innerHTML = sorted
    .map((r) => {
      const score = calculateUrgencyScore(r);
      const weight = estimateCargoWeightKg(r);
      return `
        <div class="req-row">
          <div class="req-main">
            <div class="shelter-name">${escapeHtml(r.shelterName)}</div>
            <div class="meta">${r.id} · ${r.victims} victims · ${r.daysWithoutSupply}d waiting · ~${weight}kg · ${escapeHtml(r.supplyType)}</div>
          </div>
          <div class="score-pill">score ${score}</div>
        </div>`;
    })
    .join("");
}

function renderAlerts() {
  const flagged = getRequests().filter((r) => r.status === "flagged");
  const list = document.getElementById("alertList");
  document.getElementById("alertCount").textContent = `${flagged.length} flagged`;

  if (flagged.length === 0) {
    list.innerHTML = `<div class="empty-note">No anomalies detected.</div>`;
    return;
  }

  list.innerHTML = flagged
    .map(
      (r) => `
      <div class="alert-item">
        <div class="dot"></div>
        <div class="body">
          <div class="title">Anomaly — ${r.id}</div>
          <div class="desc">${escapeHtml(r.shelterName)} claims ${r.victims} victims (exceeds ${ANOMALY_VICTIM_THRESHOLD} threshold). Held for manual audit.</div>
        </div>
      </div>`
    )
    .join("");
}

function renderFleetIdle() {
  const fleet = document.getElementById("fleetStatus");
  fleet.innerHTML = TRUCK_FLEET.map(
    (t) => `
      <div class="truck-block">
        <div class="truck-head">
          <span class="truck-id">${t.id}</span>
          <span class="truck-route">${t.route}</span>
        </div>
        <div class="load-bar-track"><div class="load-bar-fill" style="width:0%"></div></div>
        <div class="load-caption">0kg / ${t.capacityKg}kg · idle</div>
      </div>`
  ).join("");
  document.getElementById("unfulfilledNote").textContent = "";
}

function renderFleetPacked(packResult) {
  const fleet = document.getElementById("fleetStatus");
  fleet.innerHTML = packResult.trucks
    .map((t) => {
      const pct = Math.min(100, Math.round((t.loadKg / t.capacityKg) * 100));
      const overloaded = t.loadKg > t.capacityKg;
      const cargoLines = t.cargo
        .map((c) => `${c.id} — ${escapeHtml(c.shelterName)} (${c.weight}kg)`)
        .join("<br>");
      return `
        <div class="truck-block">
          <div class="truck-head">
            <span class="truck-id">${t.id}</span>
            <span class="truck-route">${t.route}</span>
          </div>
          <div class="load-bar-track">
            <div class="load-bar-fill ${overloaded ? "overloaded" : ""}" style="width:${pct}%"></div>
          </div>
          <div class="load-caption">${t.loadKg}kg / ${t.capacityKg}kg · ${t.cargo.length} shelters</div>
          ${t.cargo.length ? `<div class="truck-cargo-list">${cargoLines}</div>` : ""}
        </div>`;
    })
    .join("");

  const note = document.getElementById("unfulfilledNote");
  note.textContent = packResult.unfulfilled.length
    ? `⚠ ${packResult.unfulfilled.length} request(s) could not be fit into fleet capacity this run: ${packResult.unfulfilled.join(", ")}`
    : "All eligible pending requests fit within fleet capacity.";
}

function renderDispatchLog() {
  const log = getDispatchLog().slice().reverse();
  const el = document.getElementById("dispatchLog");
  if (log.length === 0) {
    el.innerHTML = `<div class="empty-note">No dispatch runs yet.</div>`;
    return;
  }
  el.innerHTML = log
    .map(
      (entry) => `
      <div class="req-row">
        <div class="req-main">
          <div class="shelter-name">${entry.truckId} → ${entry.cargo.length} shelters</div>
          <div class="meta">${new Date(entry.timestamp).toLocaleString()} · ${entry.loadKg}kg dispatched</div>
        </div>
      </div>`
    )
    .join("");
}

// Runs the bin-packing algorithm, updates request statuses,
// writes to the dispatch log, and re-renders the board.
function runDispatch() {
  const requests = getRequests();
  const result = packTrucks(requests);

  result.trucks.forEach((truck) => {
    if (truck.cargo.length === 0) return;
    truck.cargo.forEach((c) => updateRequestStatus(c.id, "dispatched"));
    addDispatchLogEntry({
      truckId: truck.id,
      route: truck.route,
      cargo: truck.cargo,
      loadKg: truck.loadKg,
      timestamp: Date.now(),
    });
  });

  renderFleetPacked(result);
  renderQueue();
  renderAlerts();
  renderDispatchLog();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}