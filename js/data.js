/* ============================================================
   data.js — Phase 1 application data

   Disaster zones are intentionally NOT hard-coded.

   In Phase 2, current disaster alerts can be loaded from
   an external/live disaster-data source.
   ============================================================ */


/*
   Empty for Phase 1.

   IMPORTANT:
   Do not add Kerala, Assam, Odisha, etc. here.

   We don't want the application pretending that a region
   is currently affected when we don't have live data.
*/

const ACTIVE_ZONES = [];


/* ============================================================
   DISPATCH FLEET
============================================================ */

const TRUCK_FLEET = [

    {
        id: "TRK-01",
        capacityKg: 1200,
        route: "Route A — North Corridor"
    },

    {
        id: "TRK-02",
        capacityKg: 1200,
        route: "Route B — Coastal Loop"
    },

    {
        id: "TRK-03",
        capacityKg: 800,
        route: "Route C — Hill Access"
    }

];


/* ============================================================
   SUPPLY WEIGHT
============================================================ */

const SUPPLY_KG_PER_VICTIM_PER_DAY = 2.5;


/* ============================================================
   ANOMALY THRESHOLD
============================================================ */

const ANOMALY_VICTIM_THRESHOLD = 2000;


/* ============================================================
   SAMPLE REQUESTS
============================================================ */

const SEED_REQUESTS = [

    {
        id: "REQ-1001",

        shelterName:
            "Govt. Higher Secondary School, Aluva",

        lat: 10.11,

        lng: 76.35,

        victims: 340,

        daysWithoutSupply: 3,

        supplyType: "Food + Water",

        status: "pending",

        submittedAt:
            Date.now() - 1000 * 60 * 60 * 5
    },


    {
        id: "REQ-1002",

        shelterName:
            "Community Hall, Kaziranga Road",

        lat: 26.42,

        lng: 91.1,

        victims: 120,

        daysWithoutSupply: 1,

        supplyType: "Medicine",

        status: "pending",

        submittedAt:
            Date.now() - 1000 * 60 * 60 * 2
    },


    {
        id: "REQ-1003",

        shelterName:
            "Primary School, Puri Coastal Belt",

        lat: 19.8,

        lng: 85.83,

        victims: 610,

        daysWithoutSupply: 5,

        supplyType: "Tents + Food",

        status: "pending",

        submittedAt:
            Date.now() - 1000 * 60 * 60 * 20
    }

];
