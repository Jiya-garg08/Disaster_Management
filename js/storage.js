/* ============================================================
   storage.js — Relief Resolver Storage
   Phase 1

   IMPORTANT:
   Both request.js and dispatcher.js use this same
   localStorage key.

   REQUESTS:
       relief_requests

   DISPATCH LOG:
       relief_dispatch_log
   ============================================================ */


/* ============================================================
   STORAGE KEYS
   ============================================================ */

const REQUESTS_STORAGE_KEY =
    "relief_requests";

const DISPATCH_LOG_STORAGE_KEY =
    "relief_dispatch_log";


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

        saveRequests(requests);

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

    saveRequests(requests);

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
   ------------------------------------------------------------
   USE ONLY FOR DEMO RESET.
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
   DEMO DATA
   ------------------------------------------------------------
   We do NOT create fake requests automatically.
   New requests should come from request.html.
   ============================================================ */

function seedIfEmpty() {

    /*
     * Intentionally empty.
     *
     * We don't want fake emergency requests
     * appearing in the Control Room.
     */

    return;

}
