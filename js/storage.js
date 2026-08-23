/* ============================================================
   storage.js — Relief Resolver Storage

   REQUESTS:
       relief_requests

   DISPATCH LOG:
       relief_dispatch_log

   DISASTER ZONES:
       relief_disaster_zones
   ============================================================ */


/* ============================================================
   STORAGE KEYS
   ============================================================ */

const REQUESTS_STORAGE_KEY =
    "relief_requests";

const DISPATCH_LOG_STORAGE_KEY =
    "relief_dispatch_log";

const DISASTER_ZONES_STORAGE_KEY =
    "relief_disaster_zones";


/* ============================================================
   GET ALL REQUESTS
   ============================================================ */

function getRequests() {

    try {

        const stored =
            localStorage.getItem(
                REQUESTS_STORAGE_KEY
            );

        if (!stored) {
            return [];
        }

        const requests =
            JSON.parse(stored);

        return Array.isArray(requests)
            ? requests
            : [];

    }
    catch (error) {

        console.error(
            "Unable to read requests:",
            error
        );

        return [];

    }
}


/* ============================================================
   SAVE ALL REQUESTS
   ============================================================ */

function saveRequests(requests) {

    if (!Array.isArray(requests)) {

        console.error(
            "saveRequests expected an array."
        );

        return;

    }

    localStorage.setItem(
        REQUESTS_STORAGE_KEY,
        JSON.stringify(requests)
    );

}


/* ============================================================
   ADD ONE REQUEST
   ============================================================ */

function addRequest(request) {

    if (!request) {

        console.error(
            "Cannot save empty request."
        );

        return false;

    }

    try {

        const requests =
            getRequests();

        requests.push(request);

        saveRequests(
            requests
        );

        console.log(
            "Relief Resolver request saved:",
            request.id
        );

        return true;

    }
    catch (error) {

        console.error(
            "Unable to save request:",
            error
        );

        throw error;

    }

}


/* ============================================================
   FIND REQUEST BY ID
   ============================================================ */

function getRequestById(id) {

    if (!id) {
        return null;
    }

    const requests =
        getRequests();

    return (
        requests.find(
            request =>
                request.id === id
        ) || null
    );

}


/* ============================================================
   UPDATE REQUEST
   ============================================================ */

function updateRequest(
    updatedRequest
) {

    if (
        !updatedRequest ||
        !updatedRequest.id
    ) {

        return false;

    }

    const requests =
        getRequests();

    const index =
        requests.findIndex(
            request =>
                request.id ===
                updatedRequest.id
        );

    if (index === -1) {
        return false;
    }

    requests[index] =
        updatedRequest;

    saveRequests(
        requests
    );

    return true;

}


/* ============================================================
   UPDATE REQUEST STATUS
   ============================================================ */

function updateRequestStatus(
    requestId,
    newStatus
) {

    const requests =
        getRequests();

    const request =
        requests.find(
            item =>
                item.id === requestId
        );

    if (!request) {

        console.warn(
            "Request not found:",
            requestId
        );

        return false;

    }

    request.status =
        newStatus;

    saveRequests(
        requests
    );

    return true;

}


/* ============================================================
   DELETE REQUEST
   ============================================================ */

function deleteRequest(
    requestId
) {

    const requests =
        getRequests();

    const filtered =
        requests.filter(
            request =>
                request.id !== requestId
        );

    if (
        filtered.length ===
        requests.length
    ) {

        return false;

    }

    saveRequests(
        filtered
    );

    return true;

}


/* ============================================================
   CLEAR REQUESTS
   ============================================================ */

function clearRequests() {

    localStorage.removeItem(
        REQUESTS_STORAGE_KEY
    );

}


/* ============================================================
   DISPATCH LOG
   ============================================================ */

function getDispatchLog() {

    try {

        const stored =
            localStorage.getItem(
                DISPATCH_LOG_STORAGE_KEY
            );

        if (!stored) {
            return [];
        }

        const log =
            JSON.parse(stored);

        return Array.isArray(log)
            ? log
            : [];

    }
    catch (error) {

        console.error(
            "Unable to read dispatch log:",
            error
        );

        return [];

    }

}


/* ============================================================
   ADD DISPATCH LOG ENTRY
   ============================================================ */

function addDispatchLogEntry(
    entry
) {

    if (!entry) {
        return false;
    }

    const log =
        getDispatchLog();

    log.push(entry);

    localStorage.setItem(
        DISPATCH_LOG_STORAGE_KEY,
        JSON.stringify(log)
    );

    return true;

}


/* ============================================================
   CLEAR DISPATCH LOG
   ============================================================ */

function clearDispatchLog() {

    localStorage.removeItem(
        DISPATCH_LOG_STORAGE_KEY
    );

}


/* ============================================================
   DISASTER ZONES
   ============================================================ */


/*
   Get all disaster zones.
*/

function getDisasterZones() {

    try {

        const stored =
            localStorage.getItem(
                DISASTER_ZONES_STORAGE_KEY
            );

        if (!stored) {
            return [];
        }

        const zones =
            JSON.parse(stored);

        return Array.isArray(zones)
            ? zones
            : [];

    }
    catch (error) {

        console.error(
            "Unable to read disaster zones:",
            error
        );

        return [];

    }

}


/*
   Save all disaster zones.
*/

function saveDisasterZones(
    zones
) {

    if (!Array.isArray(zones)) {

        console.error(
            "saveDisasterZones expected an array."
        );

        return false;

    }

    try {

        localStorage.setItem(
            DISASTER_ZONES_STORAGE_KEY,
            JSON.stringify(zones)
        );

        return true;

    }
    catch (error) {

        console.error(
            "Unable to save disaster zones:",
            error
        );

        return false;

    }

}


/*
   Add one disaster zone.
*/

function addDisasterZone(
    zone
) {

    if (!zone || !zone.id) {

        console.error(
            "Invalid disaster zone."
        );

        return false;

    }

    const zones =
        getDisasterZones();

    zones.push(
        zone
    );

    return saveDisasterZones(
        zones
    );

}


/*
   Update disaster zone.
*/

function updateDisasterZone(
    updatedZone
) {

    if (
        !updatedZone ||
        !updatedZone.id
    ) {

        return false;

    }

    const zones =
        getDisasterZones();

    const index =
        zones.findIndex(
            zone =>
                zone.id ===
                updatedZone.id
        );

    if (index === -1) {
        return false;
    }

    zones[index] =
        updatedZone;

    return saveDisasterZones(
        zones
    );

}


/*
   Delete disaster zone.
*/

function deleteDisasterZone(
    zoneId
) {

    const zones =
        getDisasterZones();

    const filtered =
        zones.filter(
            zone =>
                zone.id !== zoneId
        );

    if (
        filtered.length ===
        zones.length
    ) {

        return false;

    }

    return saveDisasterZones(
        filtered
    );

}


/*
   Get active zones only.
*/

function getActiveDisasterZones() {

    return getDisasterZones()
        .filter(
            zone =>
                zone.active !== false
        );

}


/* ============================================================
   DEMO DATA
   ============================================================ */

function seedIfEmpty() {

    /*
       Intentionally empty.

       We do NOT create fake emergency requests
       or fake disaster zones automatically.
    */

    return;

}
