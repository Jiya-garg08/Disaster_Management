/* ============================================================
   individual-dashboard.js
   Relief Resolver — Individual Dashboard

   IMPORTANT FLOW:

   1. Individual logs in.
   2. Their latest request is loaded.
   3. If request is NOT verified:
        - show request
        - show verification pending
        - DO NOT show NGOs
        - DO NOT show NGO map
        - DO NOT show NGO details

   4. If request IS verified:
        - show request
        - show map
        - show verified NGOs
        - calculate nearest NGOs
        - show NGO details

   5. Control Room verification is stored in:
        localStorage["relief_requests"]

   ============================================================ */


document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       SESSION
       ======================================================== */

    const loggedIn =
        sessionStorage.getItem("reliefUserLoggedIn") === "true";


    const role =
        sessionStorage.getItem("reliefAccountRole");


    if (
        !loggedIn ||
        role !== "individual"
    ) {
        window.location.href = "login.html";
        return;
    }


    const userName =
        sessionStorage.getItem("reliefUserName") ||
        "Relief User";


    const userEmail =
        sessionStorage.getItem("reliefUserEmail") ||
        "";


    const userPhone =
        sessionStorage.getItem("reliefUserPhone") ||
        "";


    /* ========================================================
       USER UI
       ======================================================== */

    const userNameElement =
        document.getElementById("userName");


    const userAvatar =
        document.getElementById("userAvatar");


    if (userNameElement) {
        userNameElement.textContent = userName;
    }


    if (userAvatar) {
        userAvatar.textContent =
            userName.charAt(0).toUpperCase();
    }


    /* ========================================================
       LOGOUT
       ======================================================== */

    const logoutButton =
        document.getElementById("logoutButton");


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            () => {

                sessionStorage.removeItem(
                    "reliefUserLoggedIn"
                );

                sessionStorage.removeItem(
                    "reliefUserName"
                );

                sessionStorage.removeItem(
                    "reliefUserEmail"
                );

                sessionStorage.removeItem(
                    "reliefUserPhone"
                );

                sessionStorage.removeItem(
                    "lastReliefRequestId"
                );

                sessionStorage.removeItem(
                    "reliefAccountRole"
                );

                window.location.href =
                    "login.html";
            }
        );

    }


    /* ========================================================
       STORAGE
       ======================================================== */

async function getRequests() {
    try {
        const token = sessionStorage.getItem("reliefAuthToken");

        const loggedInUser = JSON.parse(
            sessionStorage.getItem("reliefUser") || "null"
        );

        console.log("Token exists:", !!token);
        console.log("Logged-in user:", loggedInUser);

        if (!token) {
            console.error(
                "No authentication token found. Please log in again."
            );
            return [];
        }

        const response = await fetch(
            "https://disaster-management-7o5i.onrender.com/api/requests/mine",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                cache: "no-store"
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            console.error(
                "Failed to load requests:",
                data.message || response.status
            );
            return [];
        }

        const serverRequests = Array.isArray(data.requests)
            ? data.requests
            : [];

        // Backend is the source of truth.
        localStorage.setItem(
            "relief_requests",
            JSON.stringify(serverRequests)
        );

        console.log("Requests loaded from backend:", serverRequests.length);

        return serverRequests;

    } catch (error) {
        console.error("Could not load requests from server:", error);
        return [];
    }
}


    function getNGOs() {

        try {

            const data =
                JSON.parse(
                    localStorage.getItem(
                        "drr_ngos"
                    ) || "[]"
                );


            return Array.isArray(data)
                ? data
                : [];

        } catch (error) {

            console.error(
                "Could not load NGOs:",
                error
            );

            return [];
        }

    }


    /* ========================================================
       FIND USER REQUEST
       ======================================================== */

async function findUserRequest() {
    try {
        const requests = await getRequests();

        if (!requests.length) {
            console.warn("No requests returned by the backend.");
            return null;
        }

        // Prefer the specific request saved by the user.
        const lastRequestId =
            sessionStorage.getItem("lastReliefRequestId") ||
            localStorage.getItem("lastReliefRequestId");

        if (lastRequestId) {
            const matchingRequest = requests.find(request =>
                String(request._id || request.id || request.mongoId) ===
                    String(lastRequestId) ||
                String(request.requestNumber) === String(lastRequestId)
            );

            if (matchingRequest) {
                return matchingRequest;
            }
        }

        // The backend already filters requests by the authenticated user.
        // If no specific request ID is saved, use the latest returned request.
        return requests[0];

    } catch (error) {
        console.error("Unable to identify the current request:", error);
        return null;
    }
}


    /* ========================================================
       NORMALIZATION HELPERS
       ======================================================== */

    function firstValue(...values) {

        for (const value of values) {

            if (
                value !== undefined &&
                value !== null &&
                String(value).trim() !== ""
            ) {
                return value;
            }

        }

        return null;
    }


    function getPeopleAffected(request) {

        return firstValue(
            request.peopleAffected,
            request.affectedPeople,
            request.victims,
            request.numberOfPeople,
            request.people,
            request.personsAffected
        ) ?? "—";
    }


    function getWithoutSupply(request) {

        return firstValue(
            request.withoutSupply,
            request.daysWithoutSupply,
            request.waitingTime,
            request.daysWithoutRelief,
            request.supplyDuration
        ) ?? "—";
    }


    

function getReliefNeeded(request) {
    const relief = firstValue(
        request.reliefNeeded,
        request.reliefNeededType,
        request.reliefType,
        request.supplyType,
        request.suppliesNeeded,
        request.serviceNeeded,
        request.requiredSupplies,
        request.reliefItems,
        request.needs,
        request.resourcesNeeded,
        request.helpNeeded,
        request.itemsNeeded,
        request.emergencyType
    );

    if (!relief) {
        return "—";
    }

    return String(relief)
        .split(/[-_,]/)
        .map(item =>
            item.trim().replace(/\b\w/g, char => char.toUpperCase())
        )
        .filter(Boolean)
        .join(", ");
}




    function getLocationName(request) {

        return firstValue(
            request.locationName,
            request.shelterName,
            request.city,
            request.location?.name
        ) || "Emergency location";
    }


    function getReporterName(request) {

        return firstValue(
            request.submittedByName,
            request.reporterName,
            request.name
        ) || userName;
    }


    function getReporterPhone(request) {

        return firstValue(
            request.contactNumber,
            request.phone,
            request.reporterPhone,
            userPhone
        ) || "";
    }


    function getSituation(request) {

        return firstValue(
            request.situationDetails,
            request.description,
            request.message
        ) || "No additional details provided.";
    }


    /* ========================================================
   NGO RELIEF TRACKING
======================================================== */

const INDIVIDUAL_TRACKING_STEPS = [
    "accepted",
    "preparing",
    "on_the_way",
    "reached",
    "delivered"
];


const INDIVIDUAL_TRACKING_LABELS = {

    accepted:
        "NGO ACCEPTED",

    preparing:
        "PREPARING HELP",

    on_the_way:
        "NGO ON THE WAY",

    reached:
        "NGO REACHED",

    delivered:
        "ASSISTANCE DELIVERED"
};


function getTrackedNGOResponse(request) {
    if (!request || !request.ngoResponses) {
        return null;
    }

    const responses = Array.isArray(request.ngoResponses)
        ? request.ngoResponses
        : Object.values(request.ngoResponses);

    if (!responses.length) {
        return null;
    }

    const trackingNgoId = String(request.trackingNgoId || "");

    // Prefer the NGO explicitly recorded as the tracking partner.
    let response = trackingNgoId
        ? responses.find(item => {
            const ngoId = item.ngo?._id || item.ngoId || item.ngo;
            return String(ngoId || "") === trackingNgoId;
        })
        : null;

    // Otherwise, find the accepted response.
    response ||= responses.find(item =>
        item.response === "accepted" ||
        item.status === "accepted" ||
        item.progressStatus === "accepted"
    );

    if (!response) {
        return null;
    }

    return {
        ...response,
        ngoId: response.ngo?._id || response.ngoId || response.ngo,
        ngoName:
            response.ngoName ||
            response.ngo?.name ||
            request.trackingNgoName ||
            "Verified NGO",
        status:
            response.status ||
            response.progressStatus ||
            response.response ||
            "accepted",
        timeline: response.timeline || []
    };
}


function formatIndividualTrackingTime(
    timestamp
) {

    if (!timestamp) {
        return "";
    }


    const date =
        new Date(timestamp);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";
    }


    return date.toLocaleString(
        [],
        {
            day:
                "2-digit",

            month:
                "short",

            hour:
                "2-digit",

            minute:
                "2-digit"
        }
    );
}

    /* ========================================================
       STATUS
       ======================================================== */

 function getStatus(request) {

    const tracking =
        getTrackedNGOResponse(
            request
        );


    if (tracking) {

        switch (
            tracking.status
        ) {

            case "accepted":

                return {
                    key:
                        "accepted",

                    label:
                        "NGO ACCEPTED"
                };


            case "preparing":

                return {
                    key:
                        "preparing",

                    label:
                        "PREPARING HELP"
                };


            case "on_the_way":

                return {
                    key:
                        "on_the_way",

                    label:
                        "NGO ON THE WAY"
                };


            case "reached":

                return {
                    key:
                        "reached",

                    label:
                        "NGO REACHED"
                };


            case "delivered":

                return {
                    key:
                        "delivered",

                    label:
                        "ASSISTANCE DELIVERED"
                };
        }
    }


    /*
     * EXISTING FALLBACK STATES
     */

    if (
        request.helpReceived === true ||
        request.status ===
            "assistance_confirmed"
    ) {

        return {
            key:
                "help_received",

            label:
                "HELP RECEIVED"
        };
    }


    if (
        request.status ===
        "coordinating"
    ) {

        return {
            key:
                "coordinating",

            label:
                "COORDINATING"
        };
    }


    if (
        request.status ===
        "verified"
    ) {

        return {
            key:
                "verified",

            label:
                "REQUEST VERIFIED"
        };
    }


    return {
        key:
            "pending",

        label:
            "REQUEST SUBMITTED"
    };
}

    /* ========================================================
       HTML ESCAPE
       ======================================================== */

    function escapeHtml(value) {

        return String(
            value ?? ""
        )
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

    }


    /* ========================================================
       SERVICES
       ======================================================== */

    function normalizeServices(value) {

        if (Array.isArray(value)) {

            return value
                .map(
                    item =>
                        String(item)
                            .trim()
                            .toLowerCase()
                )
                .filter(Boolean);

        }


        return String(value || "")
            .split(/[,;+|]/)
            .map(
                item =>
                    item
                        .trim()
                        .toLowerCase()
            )
            .filter(Boolean);

    }


    /* ========================================================
       COORDINATES
       ======================================================== */

    function getRequestCoordinates(request) {

        const lat =
            Number(
                firstValue(
                    request.lat,
                    request.latitude,
                    request.location?.lat,
                    request.location?.latitude,
                    request.coordinates?.lat
                )
            );


        const lng =
            Number(
                firstValue(
                    request.lng,
                    request.longitude,
                    request.location?.lng,
                    request.location?.longitude,
                    request.coordinates?.lng
                )
            );


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {
            return null;
        }


        return {
            lat,
            lng
        };

    }


    
function getNGOCoordinates(ngo) {
    if (!ngo) return null;

    const lat = Number(
        firstValue(
            ngo.latitude,
            ngo.lat,
            ngo.location?.latitude,
            ngo.location?.lat,
            ngo.coordinates?.latitude,
            ngo.coordinates?.lat
        )
    );

    const lng = Number(
        firstValue(
            ngo.longitude,
            ngo.lng,
            ngo.lon,
            ngo.location?.longitude,
            ngo.location?.lng,
            ngo.coordinates?.longitude,
            ngo.coordinates?.lng
        )
    );

    if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
    ) {
        return null;
    }

    // Reject empty coordinate values converted to zero.
    const hasLatitude = firstValue(
        ngo.latitude,
        ngo.lat,
        ngo.location?.latitude,
        ngo.location?.lat,
        ngo.coordinates?.latitude,
        ngo.coordinates?.lat
    );

    const hasLongitude = firstValue(
        ngo.longitude,
        ngo.lng,
        ngo.lon,
        ngo.location?.longitude,
        ngo.location?.lng,
        ngo.coordinates?.longitude,
        ngo.coordinates?.lng
    );

    if (
        hasLatitude == null ||
        hasLongitude == null ||
        hasLatitude === "" ||
        hasLongitude === ""
    ) {
        return null;
    }

    return { lat, lng };
}


    /* ========================================================
       DISTANCE
       ======================================================== */

    function distanceKm(
        lat1,
        lng1,
        lat2,
        lng2
    ) {

        const earthRadius = 6371;


        const dLat =
            (
                lat2 -
                lat1
            ) *
            Math.PI /
            180;


        const dLng =
            (
                lng2 -
                lng1
            ) *
            Math.PI /
            180;


        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(
                lat1 *
                Math.PI /
                180
            ) *
            Math.cos(
                lat2 *
                Math.PI /
                180
            ) *
            Math.sin(dLng / 2) ** 2;


        const c =
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );


        return earthRadius * c;
    }


    /* ========================================================
       VERIFIED NGO FILTER
       ======================================================== */

    function isVerifiedNGO(ngo) {

        return String(
            ngo.status || ""
        )
        .toLowerCase()
        .trim() === "verified";

    }


    /* ========================================================
       NEAREST VERIFIED NGOs
       
       IMPORTANT:
       This function is ONLY called after request verification.
       ======================================================== */


function normalizeReliefTypes(value) {
    if (!value) return [];

    const values = Array.isArray(value)
        ? value
        : String(value).split(/[,;|]/);

    return values
        .flatMap(item => String(item).split(/[,;|]/))
        .map(item => item.trim().toLowerCase())
        .filter(Boolean);
}

function getRequestReliefTypes(request) {
    const value = firstValue(
        request?.reliefNeeded,
        request?.reliefNeededType,
        request?.reliefType,
        request?.supplyType,
        request?.suppliesNeeded,
        request?.serviceNeeded,
        request?.requiredSupplies,
        request?.reliefItems,
        request?.needs,
        request?.resourcesNeeded,
        request?.helpNeeded,
        request?.itemsNeeded
    );

    return normalizeReliefTypes(value);
}

function getNGOReliefTypes(ngo) {
    const value = firstValue(
        ngo?.services,
        ngo?.availableServices,
        ngo?.serviceTypes,
        ngo?.helpTypes,
        ngo?.supportedEmergencies,
        ngo?.reliefTypes,
        ngo?.suppliesProvided,
        ngo?.resourcesProvided,
        ngo?.specializations
    );

    return normalizeReliefTypes(value);
}

function reliefTypeMatches(required, offered) {
    const aliases = {
        shelter: ["shelter", "housing", "temporary housing", "accommodation"],
        food: ["food", "meals", "rations", "food supplies"],
        water: ["water", "drinking water", "clean water"],
        medical: ["medical", "medicine", "medicines", "healthcare", "medical aid"],
        clothing: ["clothing", "clothes", "garments"],
        rescue: ["rescue", "evacuation", "search and rescue"]
    };

    function expand(value) {
        const normalized = value
            .toLowerCase()
            .replace(/[_-]/g, " ")
            .trim();

        const group = Object.values(aliases).find(items =>
            items.includes(normalized)
        );

        return new Set([normalized, ...(group || [])]);
    }

    const requiredTerms = expand(required);
    const offeredTerms = expand(offered);

    return [...requiredTerms].some(term => offeredTerms.has(term));
}

function ngoSupportsRequest(ngo, request) {
    const requiredTypes = getRequestReliefTypes(request);

    // If the request has no recognizable relief requirement,
    // don't silently hide all otherwise eligible NGOs.
    if (!requiredTypes.length) return true;

    const offeredTypes = getNGOReliefTypes(ngo);

    // No declared services means we cannot confirm a match.
    if (!offeredTypes.length) return false;

    return requiredTypes.some(required =>
        offeredTypes.some(offered =>
            reliefTypeMatches(required, offered)
        )
    );
}

function getNearestVerifiedNGOs(request) {
    const coordinates = getRequestCoordinates(request);

    if (!coordinates) return [];

    const allNGOs = getNGOs();
    const assignedNGO = getAssignedNGO(request);

    const candidates = [
        ...allNGOs,
        ...(assignedNGO ? [assignedNGO] : [])
    ];

    const uniqueNGOs = [
        ...new Map(
            candidates.map(ngo => [
                String(
                    ngo.id ||
                    ngo._id ||
                    ngo.userId ||
                    ngo.user?._id
                ),
                ngo
            ])
        ).values()
    ];

    return uniqueNGOs
        .filter(ngo =>
            isVerifiedNGO(ngo) ||
            (
                assignedNGO &&
                String(
                    ngo.id || ngo._id || ngo.userId || ngo.user?._id
                ) === String(
                    assignedNGO.id ||
                    assignedNGO._id ||
                    assignedNGO.userId ||
                    assignedNGO.user?._id
                )
            )
        )
        // NEW: Match NGO services to the individual's relief requirement.
        .filter(ngo => ngoSupportsRequest(ngo, request))
        .map(ngo => {
            const ngoCoordinates = getNGOCoordinates(ngo);

            if (!ngoCoordinates) return null;

            const distance = distanceKm(
                coordinates.lat,
                coordinates.lng,
                ngoCoordinates.lat,
                ngoCoordinates.lng
            );

            const radius = Number(
                firstValue(
                    ngo.serviceRadiusKm,
                    ngo.operatingRadiusKm,
                    ngo.operatingRadius,
                    ngo.radiusKm,
                    ngo.radius
                ) || 0
            );

            const isAssigned =
                assignedNGO &&
                String(
                    ngo.id || ngo._id || ngo.userId || ngo.user?._id
                ) === String(
                    assignedNGO.id ||
                    assignedNGO._id ||
                    assignedNGO.userId ||
                    assignedNGO.user?._id
                );

            return {
                ...ngo,
                mapLat: ngoCoordinates.lat,
                mapLng: ngoCoordinates.lng,
                distance,
                operatingRadius: radius,
                withinRadius:
                    Boolean(isAssigned) ||
                    (radius > 0 && distance <= radius),
                isAssigned: Boolean(isAssigned)
            };
        })
        .filter(Boolean)
        .filter(ngo => ngo.withinRadius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
}


function getAssignedNGO(request) {
    if (!request) return null;

    const assignedId = firstValue(
        request.trackingNgoId,
        request.matchedNgoId,
        request.assignedNgoId,
        request.assignedNGOId
    );

    if (!assignedId) return null;

    return (
        getNGOs().find(ngo => {
            const ids = [
                ngo.id,
                ngo._id,
                ngo.userId,
                ngo.user?._id,
                ngo.user
            ]
                .filter(value => value != null)
                .map(String);

            return ids.includes(String(assignedId));
        }) || null
    );
}

    /* ========================================================
       NGO RESPONSES
       ======================================================== */

    function getNGOResponses(request) {

        if (
            !request.ngoResponses ||
            typeof request.ngoResponses !== "object" ||
            Array.isArray(request.ngoResponses)
        ) {
            return [];
        }


        return Object.values(
            request.ngoResponses
        );

    }


    /* ========================================================
       BUILD REQUEST CARD
       ======================================================== */

    function buildRequestCard(
        request,
        status
    ) {

        const requestNumber =
            firstValue(
                request.requestNumber,
                request.id
            ) || "—";


        const location =
            getLocationName(request);


        const state =
            request.state || "";


        const fullLocation =
            state
                ? `${location}, ${state}`
                : location;


        const people =
            getPeopleAffected(request);


        const withoutSupply =
            getWithoutSupply(request);


        const relief =
            getReliefNeeded(request);


        const reporter =
            getReporterName(request);


        const phone =
            getReporterPhone(request);


        const situation =
            getSituation(request);


        const coordinates =
            getRequestCoordinates(request);


        const initial =
            reporter
                .charAt(0)
                .toUpperCase();


        return `

            <section class="dashboard-card">

                <div class="card-heading">

                    <div>

                        <span class="eyebrow">
                            YOUR REQUEST
                        </span>

                        <h2>
                            Your Emergency Request
                        </h2>

                        <p>
                            Everything connected to your
                            current relief request.
                        </p>

                    </div>

                </div>


                <div class="request-number-box">

                    <span>
                        REQUEST NUMBER
                    </span>

                    <strong>
                        ${escapeHtml(requestNumber)}
                    </strong>

                </div>


                <div class="request-location">

                    <span class="location-pin">
                        📍
                    </span>

                    <div>

                        <strong>
                            ${escapeHtml(fullLocation)}
                        </strong>

                        ${
                            coordinates
                                ? `
                                    <small>
                                        ${coordinates.lat.toFixed(5)},
                                        ${coordinates.lng.toFixed(5)}
                                    </small>
                                `
                                : `
                                    <small>
                                        Location coordinates unavailable
                                    </small>
                                `
                        }

                    </div>

                </div>


                <div class="request-stats">

                    <div class="stat">

                        <span>
                            PEOPLE AFFECTED
                        </span>

                        <strong>
                            ${escapeHtml(people)}
                        </strong>

                    </div>


                    <div class="stat">

                        <span>
                            WITHOUT SUPPLY
                        </span>

                        <strong>
                            ${escapeHtml(withoutSupply)}
                        </strong>

                    </div>


                    <div class="stat">

                        <span>
                            RELIEF NEEDED
                        </span>

                        <strong>
                            ${escapeHtml(relief)}
                        </strong>

                    </div>

                </div>


                <div class="reporter-box">

                    <div class="reporter-avatar">
                        ${escapeHtml(initial)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHtml(reporter)}
                        </strong>

                        <span>
                            Affected Person
                            ${
                                phone
                                    ? ` · ${escapeHtml(phone)}`
                                    : ""
                            }
                        </span>

                    </div>

                </div>


                <div class="situation-box">

                    <span>
                        SITUATION DETAILS
                    </span>

                    <p>
                        ${escapeHtml(situation)}
                    </p>

                </div>

            </section>

        `;

    }


    /* ========================================================
       PENDING VERIFICATION
       ======================================================== */

    function buildPendingSection() {

        return `

            <section class="pending-panel">

                <div class="pending-icon">
                    ⏳
                </div>

                <div>

                    <strong>
                        Your request is awaiting verification
                    </strong>

                    <p>
                        The Control Room is reviewing the
                        evidence submitted with your emergency
                        request. Verified NGOs and their
                        locations will appear here only after
                        the request has been verified.
                    </p>

                </div>

            </section>

        `;

    }


    /* ========================================================
       VERIFIED MAP
       ======================================================== */

    function buildMapSection(
        request,
        nearestNGOs
    ) {

        return `

            <section class="dashboard-card map-card">

                <div class="card-heading">

                    <div>

                        <span class="eyebrow">
                            LIVE FIELD VIEW
                        </span>

                        <h2>
                            Relief Map
                        </h2>

                        <p>
                            Your location and nearby verified
                            relief organizations.
                        </p>

                    </div>

                </div>


                <div
                    id="individualMap"
                    class="individual-map"
                ></div>


                <div class="map-legend">

                    <div class="legend-item">

                        <span
                            class="
                                legend-marker
                                individual-marker
                            "
                        >
                            ●
                        </span>

                        Your location

                    </div>


                    <div class="legend-item">

                        <span
                            class="
                                legend-marker
                                ngo-marker
                            "
                        >
                            🏠
                        </span>

                        Verified NGO

                    </div>

                </div>

            </section>

        `;

    }


    /* ========================================================
       NGO LIST
       ======================================================== */

function getIndividualNGOAvailabilityLabel(value, isAssigned = false) {
    // An assigned NGO is already handling this request.
    if (isAssigned) {
        return "Assigned to your request";
    }

    const normalized = String(value || "").trim().toLowerCase();

    if (
        normalized.includes("unavailable") ||
        normalized === "not_available"
    ) {
        return "Currently unavailable for new requests";
    }

    if (normalized.includes("limited")) {
        return "Limited capacity";
    }

    if (!normalized || normalized === "available") {
        return "Availability not reported";
    }

    return String(value);
}

function getIndividualNGOAvailabilityClass(value) {
    const normalized = String(value || "available").trim().toLowerCase();
    if (normalized.includes("unavailable") || normalized === "not_available") return "unavailable";
    if (normalized.includes("limited")) return "limited";
    return "available";
}

function getIndividualNGOActiveCaseCount(ngoId) {
    try {
        const requests = JSON.parse(
            localStorage.getItem("relief_requests") || "[]"
        );

        return requests.filter(request => {
            const trackingNgoId = String(
                request.trackingNgoId ||
                request.matchedNgoId ||
                request.assignedNgoId ||
                ""
            );

            const isAssignedToNGO =
                trackingNgoId === String(ngoId);

            const responses = Array.isArray(request.ngoResponses)
                ? request.ngoResponses
                : [];

            const response = responses.find(item =>
                String(item.ngoId || item.ngo) === String(ngoId)
            );

            const status = String(
                response?.progressStatus ||
                response?.status ||
                ""
            ).toLowerCase();

            const isActiveStatus = [
                "accepted",
                "preparing",
                "on_the_way",
                "reached"
            ].includes(status);

            return isAssignedToNGO && isActiveStatus;
        }).length;
    } catch (error) {
        console.error("Could not count active NGO cases:", error);
        return 0;
    }
}


function buildNGOList(nearestNGOs) {
    return `
        <section class="dashboard-card full-width nearby-ngo-section">
            <div class="card-heading nearby-ngo-heading">
                <div>
                    <span class="eyebrow">RELIEF PARTNERS</span>
                    <h2>Nearby Verified NGOs</h2>
                    <p>Verified organizations closest to your emergency location.</p>
                </div>

                <span class="count-pill">
                    ${nearestNGOs.length} NEARBY
                </span>
            </div>

            <div class="ngo-list">
                ${
                    nearestNGOs.length
                        ? nearestNGOs.map(ngo => {
                            const services = normalizeServices(
                                firstValue(
                                    ngo.services,
                                    ngo.availableServices,
                                    ngo.serviceTypes,
                                    ngo.helpTypes,
                                    ngo.supportedEmergencies
                                )
                            )
                            .map(service =>
                                String(service).replace(
                                    /\b\w/g,
                                    char => char.toUpperCase()
                                )
                            )
                            .join(", ");

                            const inventory = ngo.inventory || {};
                            const capacity = ngo.capacity || {};

                            const volunteersAvailable = Number(
                                capacity.volunteersAvailable ??
                                ngo.volunteersAvailable ??
                                0
                            );

                            const vehiclesAvailable = Number(
                                capacity.vehiclesAvailable ??
                                ngo.vehiclesAvailable ??
                                0
                            );

                            const phone = String(
                                ngo.phone || ngo.contactNumber || ""
                            ).trim();

                            const email = String(
                                ngo.email || ""
                            ).trim();

                            const location = [
                                ngo.city,
                                ngo.state
                            ].filter(Boolean).join(", ") ||
                                ngo.address ||
                                ngo.locationName ||
                                (ngo.isAssigned
                                    ? "Assigned relief partner"
                                    : "Location unavailable");

                            const ngoId =
                                ngo.id ||
                                ngo._id ||
                                ngo.user ||
                                "";

                            const activeCases =
                                getIndividualNGOActiveCaseCount(ngoId);

                            const hasDistance =
                                ngo.distance !== null &&
                                ngo.distance !== undefined &&
                                ngo.distance !== "" &&
                                Number.isFinite(Number(ngo.distance));

                            const distanceLabel = hasDistance
                                ? `${Number(ngo.distance).toFixed(1)} km`
                                : ngo.isAssigned
                                    ? "Assigned"
                                    : "N/A";

                            const distanceDescription = hasDistance
                                ? "from emergency location"
                                : ngo.isAssigned
                                    ? "relief partner"
                                    : "distance unavailable";

                            return `
                                <article class="ngo-list-item">
                                    <div class="ngo-icon">🏠</div>

                                    <div class="ngo-main">
                                        <div class="ngo-identity">
                                            <strong class="ngo-name">
                                                ${escapeHtml(
                                                    ngo.organizationName ||
                                                    ngo.name ||
                                                    ngo.ngoName ||
                                                    "Verified NGO"
                                                )}
                                            </strong>

                                            <span class="verified">
                                                ✓ VERIFIED
                                            </span>
                                        </div>

                                        <div class="ngo-location">
                                            ${escapeHtml(location)}
                                        </div>

                                        ${
                                            phone
                                                ? `
                                                    <div class="ngo-contact"
                                                         style="margin-top:8px;">
                                                        <strong>Contact:</strong>
                                                        <a
                                                            href="tel:${escapeHtml(phone)}"
                                                            style="color:#2f8b52;font-weight:600;text-decoration:none;"
                                                        >
                                                            ☎ ${escapeHtml(phone)}
                                                        </a>
                                                    </div>
                                                `
                                                : ""
                                        }

                                        ${
                                            email
                                                ? `
                                                    <div class="ngo-contact"
                                                         style="margin-top:5px;">
                                                        <strong>Email:</strong>
                                                        <a
                                                            href="mailto:${escapeHtml(email)}"
                                                            style="color:#2f8b52;text-decoration:none;"
                                                        >
                                                            ${escapeHtml(email)}
                                                        </a>
                                                    </div>
                                                `
                                                : ""
                                        }

                                        ${
                                            services
                                                ? `
                                                    <div class="ngo-services">
                                                        <span class="ngo-detail-label">
                                                            Services
                                                        </span>
                                                        <span>${escapeHtml(services)}</span>
                                                    </div>
                                                `
                                                : ""
                                        }

                                        <div class="ngo-capacity-status ${getIndividualNGOAvailabilityClass(ngo.availability, ngo.isAssigned)}">
                                            <span class="ngo-status-dot"></span>
                                            ${escapeHtml(
                                                getIndividualNGOAvailabilityLabel(
                                                    ngo.availability,
                                                    ngo.isAssigned
                                                )
                                            )}
                                        </div>

                                        <div class="ngo-capacity-grid">
                                            <div class="ngo-capacity-stat">
                                                <strong>${activeCases}</strong>
                                                <span class="ngo-stat-label">
                                                    Active cases
                                                </span>
                                            </div>

                                            <div class="ngo-capacity-stat">
                                                <strong>${volunteersAvailable}</strong>
                                                <span class="ngo-stat-label">
                                                    Volunteers
                                                </span>
                                            </div>

                                            <div class="ngo-capacity-stat">
                                                <strong>${vehiclesAvailable}</strong>
                                                <span class="ngo-stat-label">
                                                    Vehicles
                                                </span>
                                            </div>
                                        </div>

                                        ${
                                            inventory.medicine != null ||
                                            inventory.foodPackets != null ||
                                            inventory.waterUnits != null
                                                ? `
                                                    <div class="ngo-capacity-details">
                                                        <span class="ngo-detail-label">
                                                            Reported stock
                                                        </span>

                                                        <div class="ngo-inventory-items">
                                                            ${
                                                                inventory.medicine != null
                                                                    ? `<span>Medicine: ${escapeHtml(inventory.medicine)}</span>`
                                                                    : ""
                                                            }

                                                            ${
                                                                inventory.foodPackets != null
                                                                    ? `<span>Food: ${escapeHtml(inventory.foodPackets)}</span>`
                                                                    : ""
                                                            }

                                                            ${
                                                                inventory.waterUnits != null
                                                                    ? `<span>Water: ${escapeHtml(inventory.waterUnits)}</span>`
                                                                    : ""
                                                            }
                                                        </div>
                                                    </div>
                                                `
                                                : ""
                                        }
                                    </div>

                                    <div class="ngo-distance">
                                        <strong>${escapeHtml(distanceLabel)}</strong>
                                        <span>${escapeHtml(distanceDescription)}</span>

                                        ${
                                            Number(ngo.operatingRadius) > 0
                                                ? `
                                                    <span class="ngo-radius">
                                                        Service radius:
                                                        ${escapeHtml(ngo.operatingRadius)} km
                                                    </span>
                                                `
                                                : ""
                                        }
                                    </div>
                                </article>
                            `;
                        }).join("")
                        : `
                            <div class="empty-mini">
                                No verified NGOs with valid location coordinates
                                are currently available.
                            </div>
                        `
                }
            </div>
        </section>
    `;
}

    /* ========================================================
       COORDINATION SECTION
       ======================================================== */
function buildCoordinationSection(
    request
) {

    const tracking =
        getTrackedNGOResponse(
            request
        );


    if (!tracking) {

        return `
            <section class="relief-tracking-card">

                <div class="tracking-current-status">

                    <span>
                        CURRENT STATUS
                    </span>

                    <strong>
                        WAITING FOR NGO RESPONSE
                    </strong>

                </div>


                <p>
                    Your request has been verified.
                    An NGO can now respond to provide
                    assistance.
                </p>

            </section>
        `;
    }


    const currentStatus =
        tracking.status ||
        "accepted";


    const currentIndex =
        INDIVIDUAL_TRACKING_STEPS.indexOf(
            currentStatus
        );


    const timeline =
        Array.isArray(
            tracking.timeline
        )
            ? tracking.timeline
            : [];


    const timelineHTML =
        INDIVIDUAL_TRACKING_STEPS
            .map(
                (
                    step,
                    index
                ) => {

                    const completed =
                        index <= currentIndex;


                    const timelineItem =
                        timeline.find(
                            item =>
                                item.status ===
                                step
                        );


                    const timestamp =
                        timelineItem
                            ? formatIndividualTrackingTime(
                                timelineItem.timestamp
                            )
                            : "";


                    return `
                        <div
                            class="
                                tracking-step
                                ${
                                    completed
                                        ? "completed"
                                        : ""
                                }
                                ${
                                    step === currentStatus
                                        ? "current"
                                        : ""
                                }
                            "
                        >

                            <div class="tracking-node">

                                ${
                                    completed
                                        ? "✓"
                                        : index + 1
                                }

                            </div>


                            <div class="tracking-content">

                                <strong>
                                    ${
                                        INDIVIDUAL_TRACKING_LABELS[
                                            step
                                        ]
                                    }
                                </strong>


                                ${
                                    timestamp
                                        ? `
                                            <div class="tracking-updated">
                                                ${timestamp}
                                            </div>
                                          `
                                        : ""
                                }

                            </div>

                        </div>
                    `;
                }
            )
            .join("");


    return `
        <section class="relief-tracking-card">

            <div class="tracking-partner">

                <div>

                    <span>
                        ASSISTANCE PARTNER
                    </span>

                    <h3>
                        ${
                            tracking.ngoName ||
request.trackingNgoName ||
"NGO Partner"
                        }
                    </h3>

                </div>

            </div>


            <div class="tracking-current-status">

                <span>
                    CURRENT STATUS
                </span>

                <strong>
                    ${
                        INDIVIDUAL_TRACKING_LABELS[
                            currentStatus
                        ]
                    }
                </strong>

            </div>


            <div class="relief-tracking-timeline">

                ${timelineHTML}

            </div>


            ${
                Object.keys(
                    request.ngoResponses || {}
                ).length > 1
                    ? `
                        <div class="additional-response-note">

                            Multiple NGOs have responded.
                            Your live tracking follows
                            ${
                                request.trackingNgoName ||
                                "the tracking NGO"
                            }.

                        </div>
                      `
                    : ""
            }

        </section>
    `;
}
       /* ========================================================
       REVIEW SECTION
       ======================================================== */
function buildReviewSection(
    request
) {

    const alreadyReceived =
        request.helpReceived === true ||
        request.status === "assistance_confirmed";


    const tracking =
        getTrackedNGOResponse(
            request
        );


    const delivered =
        tracking &&
        tracking.status === "delivered";


    /*
     * The individual can confirm HELP RECEIVED
     * only after the NGO marks the assistance
     * as delivered.
     */

    const canConfirm =
        delivered &&
        !alreadyReceived;


    let buttonText =
        "WAITING FOR DELIVERY";


    if (alreadyReceived) {

        buttonText =
            "✓ HELP RECEIVED";

    }
    else if (delivered) {

        buttonText =
            "✓ HELP RECEIVED";

    }


    return `

        <section class="
            dashboard-card
            review-section
            full-width
        ">

            <div class="card-heading">

                <div>

                    <span class="eyebrow">
                        AFTER ASSISTANCE
                    </span>

                    <h2>
                        Confirm your assistance
                    </h2>

                    <p>
                        ${
                            alreadyReceived
                                ? "You have confirmed that the assistance reached you."
                                : delivered
                                    ? "The NGO has marked the assistance as delivered. You can now confirm receipt."
                                    : "You can confirm receipt after the NGO marks the assistance as delivered."
                        }
                    </p>

                </div>

            </div>


            <button
                id="receivedHelpButton"
                class="primary-button"
                type="button"
                ${
                    alreadyReceived ||
                    !canConfirm
                        ? "disabled"
                        : ""
                }
            >
                ${buttonText}
            </button>


            <div
                id="reviewForm"
                class="review-form
                ${alreadyReceived ? "show" : ""}"
            >

                <div class="rating-label">
                    RATE YOUR EXPERIENCE
                </div>


                <div class="stars">

                    ${[1,2,3,4,5]
                        .map(
                            rating => `
                                <button
                                    type="button"
                                    class="star"
                                    data-rating="${rating}"
                                >
                                    ★
                                </button>
                            `
                        )
                        .join("")
                    }

                </div>


                <textarea
                    id="reviewText"
                    placeholder="Tell us about your experience..."
                ></textarea>


                <input
                    id="reviewPhoto"
                    type="file"
                    accept="image/*"
                >


                <button
                    id="submitReviewButton"
                    class="primary-button"
                    type="button"
                >
                    SUBMIT REVIEW →
                </button>


                <div
                    id="reviewSuccess"
                    class="review-success"
                >
                    ✓ Your review has been submitted successfully.
                </div>

            </div>

        </section>

    `;

}

    /* ========================================================
       RENDER
       ======================================================== */

    async function render() {
        currentRequest = await findUserRequest();

        const content =
            document.getElementById(
                "dashboardContent"
            );


        if (!content) {
            return;
        }


        currentRequest = await findUserRequest();


        if (!currentRequest) {

            content.innerHTML = `

                <section class="empty-state">

                    <div class="empty-icon">
                        !
                    </div>

                    <h2>
                        No emergency request found
                    </h2>

                    <p>
                        We could not find an emergency
                        request connected to this account.
                    </p>

                </section>

            `;

            return;
        }


        const status =
            getStatus(currentRequest);


        const requestCard =
            buildRequestCard(
                currentRequest,
                status
            );


        /*
         * =====================================================
         * IMPORTANT VERIFICATION GATE
         *
         * DO NOT LOAD NGO DATA HERE IF NOT VERIFIED.
         * =====================================================
         */

        const isVerified =
    currentRequest.verified === true ||
    currentRequest.verificationStatus === "verified";

if (!isVerified) {

            content.innerHTML = `

                <section class="
                    dashboard-status
                    pending
                ">

                    <div>

                        <span class="eyebrow">
                            CURRENT REQUEST
                        </span>

                        <h2>
                            Your request is being reviewed
                        </h2>

                    </div>

                    <span class="status-pill">
                        PENDING VERIFICATION
                    </span>

                </section>


                <div class="dashboard-grid">

                    ${requestCard}

                    <section class="dashboard-card">

                        <div class="card-heading">

                            <span class="eyebrow">
                                VERIFICATION
                            </span>

                            <h2>
                                Waiting for Control Room verification
                            </h2>

                            <p>
                                Your location and request have
                                been submitted successfully.
                            </p>

                        </div>


                        ${buildPendingSection()}

                    </section>

                </div>

            `;

            return;
        }


        /*
         * =====================================================
         * VERIFIED REQUEST
         *
         * ONLY NOW do we calculate/load NGOs.
         * =====================================================
         */
const nearestNGOs =
    getNearestVerifiedNGOs(currentRequest);


    

const tracking = getTrackedNGOResponse(currentRequest);

const assignedNGOName =
    currentRequest.trackingNgoName ||
    tracking?.ngoName ||
    "Assigned NGO";

const assignedCoordinates =
    currentRequest.trackingNgoCoordinates;


const ngoDetails = currentRequest.trackingNGODetails || {};

const assignedNGO = {
    ...ngoDetails,

    id: currentRequest.trackingNgoId,
    name: ngoDetails.name || currentRequest.trackingNgoName || "Assigned NGO",
    organizationName: ngoDetails.name || currentRequest.trackingNgoName || "Assigned NGO",

    // Always use the latest backend capacity and inventory.
    capacity: {
        volunteersAvailable: Number(
            ngoDetails.capacity?.volunteersAvailable ?? 0
        ),
        vehiclesAvailable: Number(
            ngoDetails.capacity?.vehiclesAvailable ?? 0
        )
    },

    inventory: ngoDetails.inventory || {},

    latitude: assignedCoordinates?.latitude,
    longitude: assignedCoordinates?.longitude,

    location: assignedCoordinates
        ? {
            latitude: assignedCoordinates.latitude,
            longitude: assignedCoordinates.longitude
        }
        : null,

    isAssigned: true,
    isVerified: true
};

const assignedIndex = nearestNGOs.findIndex(ngo =>
    String(ngo.id || ngo._id) ===
    String(assignedNGO.id)
);

const assignedNGOForDisplay = {
    ...(assignedIndex >= 0 ? nearestNGOs[assignedIndex] : {}),
    ...assignedNGO,

    capacity: {
        volunteersAvailable: Number(
            ngoDetails.capacity?.volunteersAvailable ?? 0
        ),
        vehiclesAvailable: Number(
            ngoDetails.capacity?.vehiclesAvailable ?? 0
        )
    },

    inventory: ngoDetails.inventory || {}
};

if (assignedIndex >= 0) {
    nearestNGOs[assignedIndex] = assignedNGOForDisplay;
} else if (assignedNGO.id) {
    const emergencyCoordinates = getRequestCoordinates(currentRequest);

    const ngoCoordinates = getNGOCoordinates({
        ...assignedNGO,
        latitude: assignedCoordinates?.latitude,
        longitude: assignedCoordinates?.longitude
    });

    const assignedDistance =
        emergencyCoordinates && ngoCoordinates
            ? distanceKm(
                emergencyCoordinates.lat,
                emergencyCoordinates.lng,
                ngoCoordinates.lat,
                ngoCoordinates.lng
            )
            : null;

    nearestNGOs.unshift({
        ...assignedNGOForDisplay,
        mapLat: ngoCoordinates?.lat,
        mapLng: ngoCoordinates?.lng,
        distance: assignedDistance,
        withinRadius: true,
        isAssigned: true
    });
}

        content.innerHTML = `

            <section class="
                dashboard-status
                ${status.className}
            ">

                <div>

                    <span class="eyebrow">
                        CURRENT REQUEST
                    </span>

                    <h2>
                        ${escapeHtml(status.title)}
                    </h2>

                </div>

                <span class="status-pill">
                    ${escapeHtml(status.label)}
                </span>

            </section>


            <div class="dashboard-grid">

                ${requestCard}

                ${
                    getRequestCoordinates(currentRequest)
                        ? buildMapSection(
                            currentRequest,
                            nearestNGOs
                        )
                        : `
                            <section class="dashboard-card">

                                <div class="card-heading">

                                    <span class="eyebrow">
                                        LIVE FIELD VIEW
                                    </span>

                                    <h2>
                                        Relief Map
                                    </h2>

                                    <p>
                                        Location coordinates are
                                        not available for this request.
                                    </p>

                                </div>

                            </section>
                        `
                }

            </div>


            ${buildNGOList(nearestNGOs)}


            ${buildCoordinationSection(currentRequest)}


            ${buildReviewSection(currentRequest)}

        `;


        initializeMap(
            currentRequest,
            nearestNGOs
        );


        attachReviewEvents();

    }


    /* ========================================================
       MAP
       ======================================================== */

    let map = null;
    let liveNgoMarker =
    null;

    let liveNgoRoute =
    null;

    let liveNgoAnimationFrame =
    null;



    function initializeMap(
        request,
        nearestNGOs
    ) {

        const mapElement =
            document.getElementById(
                "individualMap"
            );


        if (!mapElement) {
            return;
        }


        if (
            typeof L === "undefined"
        ) {

            mapElement.innerHTML = `
                <div style="
                    height:100%;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    color:#64758a;
                    font-size:12px;
                ">
                    Map library could not be loaded.
                </div>
            `;

            return;
        }


        const coordinates =
            getRequestCoordinates(request);


        if (!coordinates) {
            return;
        }

/*
 * Stop any previous live NGO animation.
 */

if (
    liveNgoAnimationFrame
) {

    cancelAnimationFrame(
        liveNgoAnimationFrame
    );

    liveNgoAnimationFrame =
        null;

}

liveNgoMarker =
    null;

liveNgoRoute =
    null;


if (map) {

    map.remove();

    map = null;

}


        map =
            L.map(
                "individualMap"
            ).setView(
                [
                    coordinates.lat,
                    coordinates.lng
                ],
                8
            );


        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 18,
                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);


        const bounds = [];


        /* Individual marker */

        const personIcon =
            L.divIcon({
                className: "",
                html: `
                    <div style="
                        width:34px;
                        height:34px;
                        border-radius:50%;
                        background:#b83d34;
                        border:3px solid white;
                        box-shadow:0 3px 12px rgba(0,0,0,.25);
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        color:white;
                        font-size:15px;
                    ">
                        ●
                    </div>
                `,
                iconSize: [34,34],
                iconAnchor: [17,17]
            });


        L.marker(
            [
                coordinates.lat,
                coordinates.lng
            ],
            {
                icon: personIcon
            }
        )
        .addTo(map)
        .bindPopup(`
            <strong>Your emergency location</strong>
            <br>
            ${coordinates.lat.toFixed(5)},
            ${coordinates.lng.toFixed(5)}
        `);


        bounds.push([
            coordinates.lat,
            coordinates.lng
        ]);


        /* NGO markers */

        nearestNGOs.forEach(
            ngo => {

                const ngoIcon =
                    L.divIcon({
                        className: "",
                        html: `
                            <div style="
                                width:38px;
                                height:38px;
                                border-radius:10px;
                                background:#2f8b52;
                                border:3px solid white;
                                box-shadow:0 3px 12px rgba(0,0,0,.25);
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                font-size:17px;
                            ">
                                🏠
                            </div>
                        `,
                        iconSize: [38,38],
                        iconAnchor: [19,19]
                    });


                const markerLat = Number(
    ngo.mapLat ?? ngo.latitude ?? ngo.location?.latitude
);

const markerLng = Number(
    ngo.mapLng ?? ngo.longitude ?? ngo.location?.longitude
);

if (
    !Number.isFinite(markerLat) ||
    !Number.isFinite(markerLng) ||
    markerLat < -90 ||
    markerLat > 90 ||
    markerLng < -180 ||
    markerLng > 180
) {
    return;
}

const marker = L.marker(
    [markerLat, markerLng],
    { icon: ngoIcon }
).addTo(map);


                const services =
                    normalizeServices(
                        firstValue(
                            ngo.services,
                            ngo.availableServices,
                            ngo.serviceTypes,
                            ngo.helpTypes
                        )
                    )
                    .map(
                        service =>
                            service.replace(
                                /\b\w/g,
                                char =>
                                    char.toUpperCase()
                            )
                    )
                    .join(", ");


                marker.bindPopup(`
                    <div style="
                        min-width:220px;
                        font-family:Inter,sans-serif;
                    ">

                        <strong style="
                            font-size:15px;
                        ">
                            ${escapeHtml(
                                ngo.name ||
                                "Verified NGO"
                            )}
                        </strong>

                        <br>

                        <span style="
                            color:#2f8b52;
                            font-size:11px;
                            font-weight:700;
                        ">
                            ✓ VERIFIED
                        </span>

                        <hr style="
                            border:0;
                            border-top:1px solid #ddd;
                            margin:9px 0;
                        ">

                        <div>
                            📍
                            ${escapeHtml(
                                ngo.city ||
                                ngo.locationName ||
                                ""
                            )}
                            ${
                                ngo.state
                                    ? ", " +
                                      escapeHtml(
                                          ngo.state
                                      )
                                    : ""
                            }
                        </div>

                        <div style="
                            margin-top:6px;
                        ">
                            📏
${
    ngo.distance != null &&
    ngo.distance !== "" &&
    Number.isFinite(Number(ngo.distance))
        ? `${Number(ngo.distance).toFixed(1)} km from emergency`
        : ngo.isAssigned
            ? "Assigned to your request"
            : "Distance unavailable"
}
                        </div>

                        ${
                            ngo.operatingRadius > 0
                                ? `
                                    <div style="
                                        margin-top:5px;
                                    ">
                                        Operating radius:
                                        ${ngo.operatingRadius} km
                                    </div>
                                `
                                : ""
                        }

                        ${
                            services
                                ? `
                                    <div style="
                                        margin-top:7px;
                                        color:#64758a;
                                    ">
                                        Services:
                                        ${escapeHtml(services)}
                                    </div>
                                `
                                : ""
                        }

                        ${
                            ngo.phone ||
                            ngo.contactNumber
                                ? `
                                    <div style="
                                        margin-top:7px;
                                    ">
                                        📞
                                        ${escapeHtml(
                                            ngo.phone ||
                                            ngo.contactNumber
                                        )}
                                    </div>
                                `
                                : ""
                        }

                    </div>
                `);


                bounds.push([
                    ngo.mapLat,
                    ngo.mapLng
                ]);

            }
        );


        if (bounds.length > 1) {

            map.fitBounds(
                bounds,
                {
                    padding: [40,40],
                    maxZoom: 10
                }
            );

        }


        setTimeout(
            () => {

                if (map) {
                    map.invalidateSize();
                }

            },
            200
        );

        /*
 * ------------------------------------------------------------
 * LIVE NGO MOVEMENT
 * ------------------------------------------------------------
 */

initializeLiveNgoTracking(
    request,
    nearestNGOs
);

    }

/* ========================================================
   LIVE NGO TRACKING
   ======================================================== */

function initializeLiveNgoTracking(
    request,
    nearestNGOs
) {

    if (
        !map ||
        !request
    ) {

        return;

    }


    const tracking =
        getTrackedNGOResponse(
            request
        );


    if (!tracking) {

        return;

    }


    /*
     * We only animate while the NGO
     * is actually ON THE WAY.
     *
     * REACHED and DELIVERED use
     * a stopped truck at the user.
     */

    if (
        tracking.status !==
            "on_the_way" &&
        tracking.status !==
            "reached" &&
        tracking.status !==
            "delivered"
    ) {

        return;

    }


    const destination =
        getRequestCoordinates(
            request
        );


    if (!destination) {

        return;

    }


    /*
     * Find the NGO responsible for
     * this request.
     */
const trackingNgoId = String(
    request.trackingNgoId || tracking.ngoId || ""
);

const allNGOs = getNGOs();

const trackingNgo = allNGOs.find(ngo =>
    String(ngo.id) === trackingNgoId ||
    String(ngo.userId || ngo.user?._id || ngo.user || "") === trackingNgoId
);


    if (!trackingNgo) {

        return;

    }


    const ngoCoordinates =
        getNGOCoordinates(
            trackingNgo
        );


    if (!ngoCoordinates) {

        return;

    }


    const startLat =
        ngoCoordinates.lat;

    const startLng =
        ngoCoordinates.lng;


    /*
     * --------------------------------------------------------
     * TRUCK ICON
     * --------------------------------------------------------
     */

    const liveNgoIcon =
        L.divIcon({

            className:
                "live-ngo-marker",

            html: `
                <div style="
                    width:46px;
                    height:46px;
                    border-radius:50%;
                    background:#2f8b52;
                    border:3px solid white;
                    box-shadow:
                        0 4px 16px
                        rgba(0,0,0,.35);

                    display:flex;
                    align-items:center;
                    justify-content:center;

                    font-size:22px;
                ">
                    🚚
                </div>
            `,

            iconSize:
                [46,46],

            iconAnchor:
                [23,23]

        });


    /*
     * --------------------------------------------------------
     * REACHED / DELIVERED
     * --------------------------------------------------------
     *
     * Once the NGO reaches the person,
     * the truck stays at the destination.
     */

    if (
        tracking.status ===
            "reached" ||
        tracking.status ===
            "delivered"
    ) {

        liveNgoMarker =
            L.marker(
                [
                    destination.lat,
                    destination.lng
                ],
                {
                    icon:
                        liveNgoIcon,

                    zIndexOffset:
                        1000
                }
            )
            .addTo(map);


        liveNgoMarker.bindPopup(`
            <strong>
                🚚 NGO REACHED
            </strong>
            <br><br>
            ${escapeHtml(
    ngo.organizationName ||
    ngo.name ||
    ngo.ngoName ||
    "Verified NGO"
)}
            <br><br>
            Assistance has reached
            your emergency location.
        `);


        return;

    }


    /*
     * --------------------------------------------------------
     * ON THE WAY
     * --------------------------------------------------------
     */

    liveNgoRoute =
        L.polyline(
            [
                [
                    startLat,
                    startLng
                ],

                [
                    destination.lat,
                    destination.lng
                ]
            ],
            {
                weight:
                    4,

                dashArray:
                    "10,10",

                opacity:
                    0.75
            }
        )
        .addTo(map);


    /*
     * Create truck at NGO location.
     */

    liveNgoMarker =
        L.marker(
            [
                startLat,
                startLng
            ],
            {
                icon:
                    liveNgoIcon,

                zIndexOffset:
                    1000
            }
        )
        .addTo(map);


    liveNgoMarker.bindPopup(`
        <strong>
            🚚 NGO ON THE WAY
        </strong>
        <br><br>
        ${escapeHtml(
            tracking.ngoName ||
            "Relief organization"
        )}
        <br><br>
        Assistance is moving
        toward your location.
    `);


    /*
     * --------------------------------------------------------
     * DEMO JOURNEY
     * --------------------------------------------------------
     *
     * 30 seconds by default.
     */
/*
 * --------------------------------------------------------
 * DEMO JOURNEY
 * --------------------------------------------------------
 *
 * Older requests may not have startedAt
 * or travelDurationMs because they were
 * created before live movement was added.
 *
 * In that case, start a fresh 30-second
 * demo journey now.
 * --------------------------------------------------------
 */

const duration =
    Number(
        tracking.travelDurationMs
    ) ||
    30000;


let startedAt =
    Number(
        tracking.startedAt
    );


if (
    !Number.isFinite(
        startedAt
    )
) {

    startedAt =
        Date.now();

    tracking.startedAt =
        startedAt;

    tracking.travelDurationMs =
        duration;


    /*
     * Save the missing movement
     * information for this request.
     */

    try {

        const requests =
            getRequests();

        const requestIndex =
            requests.findIndex(
                item =>
                    String(
                        item.id ||
                        item.requestNumber
                    ) ===
                    String(
                        request.id ||
                        request.requestNumber
                    )
            );


        if (
            requestIndex !== -1
        ) {

            const storedRequest =
                requests[
                    requestIndex
                ];


            if (
                storedRequest.ngoResponses &&
                storedRequest.ngoResponses[
                    tracking.ngoId
                ]
            ) {

                storedRequest
                    .ngoResponses[
                        tracking.ngoId
                    ]
                    .startedAt =
                        startedAt;


                storedRequest
                    .ngoResponses[
                        tracking.ngoId
                    ]
                    .travelDurationMs =
                        duration;


                localStorage.setItem(
                    "relief_requests",
                    JSON.stringify(
                        requests
                    )
                );

            }

        }

    }
    catch (error) {

        console.warn(
            "Could not save NGO movement data:",
            error
        );

    }

}


    function animate() {

        /*
         * Read the latest request.
         *
         * This allows the animation to stop
         * immediately if NGO changes status.
         */

        const latestRequest =
            findUserRequest();


        const latestTracking =
            latestRequest
                ? getTrackedNGOResponse(
                    latestRequest
                )
                : null;


        if (
            !latestTracking ||
            (
                latestTracking.status !==
                "on_the_way"
            )
        ) {

            liveNgoAnimationFrame =
                null;

            return;

        }


        const elapsed =
            Date.now() -
            startedAt;


        const progress =
            Math.min(
                elapsed /
                duration,
                1
            );


        /*
         * Ease-out movement.
         *
         * Starts slightly faster and
         * smoothly slows near destination.
         */

        const eased =
            progress *
            (2 - progress);


        const currentLat =
            startLat +
            (
                destination.lat -
                startLat
            ) *
            eased;


        const currentLng =
            startLng +
            (
                destination.lng -
                startLng
            ) *
            eased;


        /*
         * Move truck.
         */

        liveNgoMarker.setLatLng(
            [
                currentLat,
                currentLng
            ]
        );


        /*
         * Journey completed visually.
         */

        if (
            progress >= 1
        ) {

            liveNgoMarker.setLatLng(
                [
                    destination.lat,
                    destination.lng
                ]
            );

            liveNgoAnimationFrame =
                null;

            return;

        }


        liveNgoAnimationFrame =
            requestAnimationFrame(
                animate
            );

    }


    animate();

}


    /* ========================================================
       REVIEW EVENTS
       ======================================================== */

       function attachReviewEvents() {

    const receivedButton =
        document.getElementById(
            "receivedHelpButton"
        );


    const reviewForm =
        document.getElementById(
            "reviewForm"
        );


    if (
        receivedButton &&
        reviewForm
    ) {

        receivedButton.addEventListener(
            "click",
            () => {

                /*
                 * Allow HELP RECEIVED only after
                 * NGO marks the assistance as delivered.
                 */

                const tracking =
                    getTrackedNGOResponse(
                        currentRequest
                    );


                if (
                    !tracking ||
                    tracking.status !==
                        "delivered"
                ) {

                    alert(
                        "You can confirm HELP RECEIVED only after the NGO marks the assistance as delivered."
                    );

                    return;

                }


                reviewForm.classList.add(
                    "show"
                );


                receivedButton.disabled =
                    true;


                receivedButton.textContent =
                    "✓ HELP RECEIVED";

            }
        );

    }


    let selectedRating = 0;


    document
        .querySelectorAll(".star")
        .forEach(
            star => {

                star.addEventListener(
                    "click",
                    function () {

                        selectedRating =
                            Number(
                                this.dataset.rating
                            );


                        document
                            .querySelectorAll(".star")
                            .forEach(
                                item => {

                                    item.classList.toggle(
                                        "selected",
                                        Number(
                                            item.dataset.rating
                                        ) <=
                                        selectedRating
                                    );

                                }
                            );

                    }
                );

            }
        );


    const submitButton =
        document.getElementById(
            "submitReviewButton"
        );


    if (submitButton) {

        submitButton.addEventListener(
            "click",
            async () => {

                if (
                    selectedRating <
                    1
                ) {

                    alert(
                        "Please select a rating."
                    );

                    return;

                }


                const text =
                    document
                        .getElementById(
                            "reviewText"
                        )
                        ?.value
                        .trim() ||
                    "";


                const photoInput =
                    document.getElementById(
                        "reviewPhoto"
                    );


                const photo =
                    photoInput &&
                    photoInput.files
                        ? photoInput.files[0]
                        : null;


                let photoData = "";


                if (photo) {

                    if (
                        photo.size >
                        5 *
                        1024 *
                        1024
                    ) {

                        alert(
                            "Please upload a photo smaller than 5 MB."
                        );

                        return;

                    }


                    photoData =
                        await readFile(
                            photo
                        );

                }


                saveReview(
                    selectedRating,
                    text,
                    photoData
                );


                const success =
                    document.getElementById(
                        "reviewSuccess"
                    );


                if (success) {

                    success.classList.add(
                        "show"
                    );

                }

            }
        );

    }

}

    /* ========================================================
       FILE READER
       ======================================================== */

    function readFile(file) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const reader =
                    new FileReader();


                reader.onload =
                    event =>
                        resolve(
                            event.target.result
                        );


                reader.onerror =
                    reject;


                reader.readAsDataURL(file);

            }
        );

    }


    /* ========================================================
       SAVE REVIEW
       ======================================================== */

    function saveReview(
        rating,
        reviewText,
        photoData
    ) {

        const requests =
            getRequests();


        const index =
            requests.findIndex(
                request =>
                    String(
                        request.id ||
                        request.requestNumber
                    ) ===
                    String(
                        currentRequest.id ||
                        currentRequest.requestNumber
                    )
            );


        if (index === -1) {
            return;
        }


        requests[index] = {

            ...requests[index],

            helpReceived: true,

            assistanceConfirmedAt:
                Date.now(),

            status:
                "assistance_confirmed",

            coordinationStatus:
                "assistance_confirmed",

            reviewRating:
                rating,

            reviewText:
                reviewText,

            reviewPhoto:
                photoData,

            reviewSubmittedAt:
                Date.now()

        };


        localStorage.setItem(
            "relief_requests",
            JSON.stringify(requests)
        );


        currentRequest =
            requests[index];

    }


    /* ========================================================
       LIVE UPDATE
       
       Allows the individual dashboard to notice when the
       Control Room verifies the request in another tab.
       ======================================================== */

    let lastSignature = "";

    function getRequestSignature(request) {

    if (!request) {
        return "none";
    }


    return JSON.stringify({

        id:
            request.id ||
            request.requestNumber,


        verified:
            request.verified === true,


        status:
            request.status,


        ngoNotificationStatus:
            request.ngoNotificationStatus,


        coordinationStatus:
            request.coordinationStatus,


        trackingNgoId:
            request.trackingNgoId,


        trackingNgoName:
            request.trackingNgoName,


        ngoResponses:
            request.ngoResponses,

        ngoCapacity:
            getNGOs().map(ngo => ({
                id: ngo.id,
                availability: ngo.availability,
                services: ngo.services,
                capacity: ngo.capacity,
                inventory: ngo.inventory,
                capacityUpdatedAt: ngo.capacityUpdatedAt
            })),

        lastUpdatedAt:
            request.lastUpdatedAt

    });

}


    function checkForUpdates() {

        const request =
            findUserRequest();


        const signature =
            getRequestSignature(request);


        if (
            signature !==
            lastSignature
        ) {

            lastSignature =
                signature;


            render();

        }

    }


    /* ========================================================
       INITIAL RENDER
       ======================================================== */

    currentRequest =
        findUserRequest();


    lastSignature =
        getRequestSignature(
            currentRequest
        );


    render();


    /* ========================================================
       STORAGE EVENT
       ======================================================== */

    window.addEventListener(
        "storage",
        event => {

            if (
                event.key === "relief_requests" ||
                event.key === "drr_ngos"
            ) {
                checkForUpdates();
            }

        }
    );


    /* ========================================================
       PERIODIC CHECK
       ======================================================== */

    setInterval(
        checkForUpdates,
        1500
    );


    /* ========================================================
       RESIZE
       ======================================================== */

    window.addEventListener(
        "resize",
        () => {

            if (map) {
                map.invalidateSize();
            }

        }
    );

});
