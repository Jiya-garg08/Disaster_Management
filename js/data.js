/* ============================================================
   data.js — Phase 1 application data

   Disaster zones are NOT hard-coded.

   Requests are NOT hard-coded.

   Emergency requests come from request.html and are stored
   in localStorage.

   In Phase 2, disaster alerts and fleet information can be
   loaded from the backend / live data sources.
   ============================================================ */


/* ============================================================
   ACTIVE DISASTER ZONES
   ============================================================ */

/*
   Empty in Phase 1.

   We do NOT pretend that any region is currently affected
   without verified disaster information.

   Therefore, location verification should not reject a
   request simply because it isn't inside a hardcoded zone.
*/

const ACTIVE_ZONES = [];


/* ============================================================
   DISPATCH FLEET
   ============================================================ */

/*
   These represent the relief vehicles available to the
   coordination team.

   They are configuration data, not emergency requests.
*/

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

/*
   Approximate relief cargo required per person per day.
*/

const SUPPLY_KG_PER_VICTIM_PER_DAY = 2.5;


/* ============================================================
   ANOMALY THRESHOLD
   ============================================================ */

/*
   Extremely large requests are sent for manual verification
   instead of being automatically dispatched.
*/

const ANOMALY_VICTIM_THRESHOLD = 2000;


/* ============================================================
   NO SAMPLE REQUESTS
   ============================================================ */

/*
   IMPORTANT:
   There are intentionally NO SEED_REQUESTS here.

   All requests must come from:
   
       request.html
             ↓
       request.js
             ↓
       addRequest()
             ↓
       localStorage
             ↓
       Control Room
*/


const SEED_REQUESTS = [];