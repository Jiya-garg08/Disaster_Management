/* ============================================================
   priority.js — priority-weighted bin-packing + dispatch queue
   Phase 2 equivalent: this logic moves server-side into an
   Express endpoint (POST /api/v1/dispatch/run) so it can't be
   tampered with client-side.
   ============================================================ */

// urgency-score = vulnerable population count + days without supply,
// weighted so "days without supply" compounds faster (a shelter
// that's waited 5 days is worse off than raw victim count implies).
function calculateUrgencyScore(request) {
  const victimWeight = request.victims * 1;
  const waitWeight = request.daysWithoutSupply * 40;
  return victimWeight + waitWeight;
}

// Approximate cargo weight (kg) a request needs.
function estimateCargoWeightKg(request) {
  return Math.round(
    request.victims * request.daysWithoutSupply * SUPPLY_KG_PER_VICTIM_PER_DAY
  );
}

// Anomaly check: absurd victim counts get flagged for manual
// audit instead of being auto-dispatched.
function isAnomalous(request) {
  return request.victims > ANOMALY_VICTIM_THRESHOLD;
}

// Returns requests sorted highest-urgency first.
function sortByUrgency(requests) {
  return [...requests].sort(
    (a, b) => calculateUrgencyScore(b) - calculateUrgencyScore(a)
  );
}

// Greedy capacity-constrained bin-packing:
// walk requests in urgency order, load each into the first truck
// that still has room; if none fit, it stays "unfulfilled".
function packTrucks(requests, fleet = TRUCK_FLEET) {
  const trucks = fleet.map((t) => ({
    ...t,
    loadKg: 0,
    cargo: [], // request ids
  }));

  const sorted = sortByUrgency(requests.filter((r) => r.status === "pending" && !isAnomalous(r)));
  const unfulfilled = [];

  sorted.forEach((request) => {
    const weight = estimateCargoWeightKg(request);
    const truck = trucks.find((t) => t.loadKg + weight <= t.capacityKg);
    if (truck) {
      truck.cargo.push({ id: request.id, shelterName: request.shelterName, weight });
      truck.loadKg += weight;
    } else {
      unfulfilled.push(request.id);
    }
  });

  return { trucks, unfulfilled };
}