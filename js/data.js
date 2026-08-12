/* ============================================================
   data.js — mock "database" for Phase 1 (Pure JS)
   In Phase 2 this becomes MongoDB collections (Shelter,
   ReliefHub, SupplyPackage, DispatchLog) with 2dsphere indexes.
   ============================================================ */

// Active disaster zones — bounding boxes (India). Replace with a
// live fetch() from a disaster-data API later if you want real
// zones instead of hardcoded ones.
const ACTIVE_ZONES = [
  {
    id: "zone-kerala-flood",
    name: "Kerala Flood Zone — Ernakulam Belt",
    disaster: "Flood",
    bounds: { minLat: 9.8, maxLat: 10.3, minLng: 76.1, maxLng: 76.6 },
  },
  {
    id: "zone-assam-flood",
    name: "Assam Flood Zone — Brahmaputra Basin",
    disaster: "Flood",
    bounds: { minLat: 26.0, maxLat: 26.8, minLng: 90.5, maxLng: 91.8 },
  },
  {
    id: "zone-uttarakhand-quake",
    name: "Uttarakhand Seismic Zone — Chamoli",
    disaster: "Earthquake",
    bounds: { minLat: 30.2, maxLat: 30.7, minLng: 79.2, maxLng: 79.8 },
  },
  {
    id: "zone-odisha-cyclone",
    name: "Odisha Cyclone Corridor — Puri Coast",
    disaster: "Cyclone",
    bounds: { minLat: 19.5, maxLat: 20.1, minLng: 85.5, maxLng: 86.2 },
  },
];

// Dispatch fleet — each truck has a max payload (kg) and route
// weight limit. Bin-packing fits requests into these.
const TRUCK_FLEET = [
  { id: "TRK-01", capacityKg: 1200, route: "Route A — North Corridor" },
  { id: "TRK-02", capacityKg: 1200, route: "Route B — Coastal Loop" },
  { id: "TRK-03", capacityKg: 800, route: "Route C — Hill Access" },
];

// Average supply weight per victim, per day (kg) — used to turn
// "victims + days without supply" into an actual cargo weight.
const SUPPLY_KG_PER_VICTIM_PER_DAY = 2.5;

// A request is flagged as anomalous if it claims more victims
// than this, relative to a "reasonable shelter" ceiling.
const ANOMALY_VICTIM_THRESHOLD = 2000;

// Seed a few sample shelters into localStorage on first load,
// so the dispatcher board isn't empty on a fresh clone.
const SEED_REQUESTS = [
  {
    id: "REQ-1001",
    shelterName: "Govt. Higher Secondary School, Aluva",
    lat: 10.11,
    lng: 76.35,
    victims: 340,
    daysWithoutSupply: 3,
    supplyType: "Food + Water",
    status: "pending",
    submittedAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: "REQ-1002",
    shelterName: "Community Hall, Kaziranga Road",
    lat: 26.42,
    lng: 91.1,
    victims: 120,
    daysWithoutSupply: 1,
    supplyType: "Medicine",
    status: "pending",
    submittedAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "REQ-1003",
    shelterName: "Primary School, Puri Coastal Belt",
    lat: 19.8,
    lng: 85.83,
    victims: 610,
    daysWithoutSupply: 5,
    supplyType: "Tents + Food",
    status: "pending",
    submittedAt: Date.now() - 1000 * 60 * 60 * 20,
  },
];