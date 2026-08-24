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

    function getRequests() {

        try {

            const data =
                JSON.parse(
                    localStorage.getItem(
                        "relief_requests"
                    ) || "[]"
                );


            return Array.isArray(data)
                ? data
                : [];

        } catch (error) {

            console.error(
                "Could not load requests:",
                error
            );

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

    function findUserRequest() {

        const requests =
            getRequests();


        const lastRequestId =
            sessionStorage.getItem(
                "lastReliefRequestId"
            );


        /* Exact request ID has highest priority. */

        if (lastRequestId) {

            const exact =
                requests.find(
                    request =>
                        String(
                            request.id ||
                            request.requestNumber
                        ) ===
                        String(lastRequestId)
                );


            if (exact) {
                return exact;
            }

        }


        /* Match by email. */

        if (userEmail) {

            const emailMatches =
                requests.filter(
                    request =>
                        String(
                            request.submittedByEmail ||
                            request.email ||
                            ""
                        )
                        .toLowerCase() ===
                        userEmail.toLowerCase()
                );


            if (emailMatches.length) {

                return emailMatches.sort(
                    (a, b) =>
                        Number(
                            b.submittedAt ||
                            b.createdAt ||
                            0
                        ) -
                        Number(
                            a.submittedAt ||
                            a.createdAt ||
                            0
                        )
                )[0];

            }

        }


        /* Match by name. */

        const nameMatches =
            requests.filter(
                request =>
                    String(
                        request.submittedByName ||
                        request.reporterName ||
                        ""
                    )
                    .toLowerCase() ===
                    userName.toLowerCase()
            );


        if (nameMatches.length) {

            return nameMatches.sort(
                (a, b) =>
                    Number(
                        b.submittedAt ||
                        b.createdAt ||
                        0
                    ) -
                    Number(
                        a.submittedAt ||
                        a.createdAt ||
                        0
                    )
            )[0];

        }


        return null;
    }


    let currentRequest =
        findUserRequest();


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

        return firstValue(
            request.reliefNeeded,
            request.reliefType,
            request.supplyType,
            request.suppliesNeeded,
            request.serviceNeeded
        ) ?? "—";
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
       STATUS
       ======================================================== */

    function getStatus(request) {

        if (
            request.helpReceived === true ||
            request.status === "assistance_confirmed"
        ) {

            return {
                title: "Help received",
                label: "ASSISTANCE RECEIVED",
                className: "received"
            };

        }


        if (
            request.status === "coordinating"
        ) {

            return {
                title:
                    "A relief organization is coordinating help",
                label:
                    "NGO COORDINATING",
                className:
                    "coordinating"
            };

        }


        if (
            request.verified === true
        ) {

            return {
                title:
                    "Your request has been verified",
                label:
                    "VERIFIED",
                className:
                    "verified"
            };

        }


        return {
            title:
                "Your request is being reviewed",
            label:
                "PENDING VERIFICATION",
            className:
                "pending"
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

        const lat =
            Number(
                firstValue(
                    ngo.latitude,
                    ngo.lat,
                    ngo.location?.lat,
                    ngo.coordinates?.lat,
                    ngo.coordinates?.latitude
                )
            );


        const lng =
            Number(
                firstValue(
                    ngo.longitude,
                    ngo.lng,
                    ngo.lon,
                    ngo.location?.lng,
                    ngo.coordinates?.lng,
                    ngo.coordinates?.longitude
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

    function getNearestVerifiedNGOs(request) {

        const coordinates =
            getRequestCoordinates(request);


        if (!coordinates) {
            return [];
        }


        return getNGOs()

            .filter(
                ngo =>
                    isVerifiedNGO(ngo)
            )

            .map(
                ngo => {

                    const ngoCoordinates =
                        getNGOCoordinates(ngo);


                    if (!ngoCoordinates) {
                        return null;
                    }


                    const distance =
                        distanceKm(
                            coordinates.lat,
                            coordinates.lng,
                            ngoCoordinates.lat,
                            ngoCoordinates.lng
                        );


                    const radius =
                        Number(
                            firstValue(
                                ngo.operatingRadiusKm,
                                ngo.operatingRadius,
                                ngo.radiusKm,
                                ngo.radius
                            ) || 0
                        );


                    return {
                        ...ngo,

                        mapLat:
                            ngoCoordinates.lat,

                        mapLng:
                            ngoCoordinates.lng,

                        distance:
                            Number(
                                distance.toFixed(1)
                            ),

                        operatingRadius:
                            radius,

                        withinRadius:
                            radius > 0
                                ? distance <= radius
                                : false
                    };

                }
            )

            .filter(Boolean)

            .sort(
                (a, b) =>
                    a.distance -
                    b.distance
            )

            .slice(0, 5);

    }


    /* ========================================================
       ASSIGNED NGO
       
       Kept only for compatibility with old data.
       The new workflow does NOT automatically assign NGOs.
       ======================================================== */

    function getAssignedNGO(request) {

        const assignedId =
            firstValue(
                request.matchedNgoId,
                request.assignedNgoId,
                request.assignedNGOId
            );


        if (!assignedId) {
            return null;
        }


        return (
            getNGOs().find(
                ngo =>
                    String(ngo.id) ===
                    String(assignedId)
            ) ||
            null
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

    function buildNGOList(
        nearestNGOs
    ) {

        return `

            <section class="
                dashboard-card
                full-width
            ">

                <div class="card-heading">

                    <div>

                        <span class="eyebrow">
                            RELIEF PARTNERS
                        </span>

                        <h2>
                            Nearby Verified NGOs
                        </h2>

                        <p>
                            Verified organizations closest
                            to your emergency location.
                        </p>

                    </div>

                    <span class="count-pill">

                        ${nearestNGOs.length}
                        NEARBY

                    </span>

                </div>


                <div class="ngo-list">

                    ${
                        nearestNGOs.length

                            ? nearestNGOs
                                .map(
                                    ngo => {

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


                                        return `

                                            <article
                                                class="
                                                    ngo-list-item
                                                "
                                            >

                                                <div class="ngo-icon">
                                                    🏠
                                                </div>


                                                <div class="ngo-main">

                                                    <strong>
                                                        ${escapeHtml(
                                                            ngo.name ||
                                                            "Verified NGO"
                                                        )}
                                                    </strong>

                                                    <span
                                                        class="verified"
                                                    >
                                                        ✓ VERIFIED
                                                    </span>

                                                    <small>
                                                        ${escapeHtml(
                                                            ngo.city ||
                                                            ngo.locationName ||
                                                            "Location unavailable"
                                                        )}
                                                        ${
                                                            ngo.state
                                                                ? `, ${escapeHtml(ngo.state)}`
                                                                : ""
                                                        }
                                                    </small>

                                                    ${
                                                        services
                                                            ? `
                                                                <div class="ngo-services">
                                                                    Services:
                                                                    ${escapeHtml(services)}
                                                                </div>
                                                            `
                                                            : ""
                                                    }

                                                </div>


                                                <div class="ngo-distance">

                                                    <strong>
                                                        ${ngo.distance}
                                                        km
                                                    </strong>

                                                    <span>
                                                        from you
                                                    </span>

                                                    ${
                                                        ngo.operatingRadius > 0
                                                            ? `
                                                                <span>
                                                                    Radius:
                                                                    ${ngo.operatingRadius}
                                                                    km
                                                                </span>
                                                            `
                                                            : ""
                                                    }

                                                </div>

                                            </article>

                                        `;

                                    }
                                )
                                .join("")

                            : `

                                <div class="empty-mini">

                                    No verified NGOs with valid
                                    location coordinates are
                                    currently available.

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

        const responses =
            getNGOResponses(request);


        const assigned =
            getAssignedNGO(request);


        if (assigned) {

            return `

                <section class="
                    dashboard-card
                    full-width
                ">

                    <div class="card-heading">

                        <div>

                            <span class="eyebrow">
                                COORDINATION STATUS
                            </span>

                            <h2>
                                Relief coordination
                            </h2>

                        </div>

                    </div>


                    <div class="coordination-box">

                        <strong>
                            ${escapeHtml(
                                assigned.name ||
                                "Relief organization"
                            )}
                            is coordinating assistance.
                        </strong>

                        <p>
                            A verified relief organization
                            has responded to your request.
                        </p>

                    </div>

                </section>

            `;

        }


        if (responses.length) {

            return `

                <section class="
                    dashboard-card
                    full-width
                ">

                    <div class="card-heading">

                        <div>

                            <span class="eyebrow">
                                NGO RESPONSES
                            </span>

                            <h2>
                                Relief organizations responding
                            </h2>

                            <p>
                                These verified organizations
                                have voluntarily offered help.
                            </p>

                        </div>

                        <span class="count-pill">
                            ${responses.length}
                            RESPONSE${
                                responses.length === 1
                                    ? ""
                                    : "S"
                            }
                        </span>

                    </div>


                    <div class="ngo-list">

                        ${
                            responses
                                .map(
                                    response => `

                                        <article
                                            class="ngo-list-item"
                                        >

                                            <div class="ngo-icon">
                                                🏠
                                            </div>

                                            <div class="ngo-main">

                                                <strong>
                                                    ${escapeHtml(
                                                        response.ngoName ||
                                                        "Verified NGO"
                                                    )}
                                                </strong>

                                                <span
                                                    class="verified"
                                                >
                                                    ✓ OFFERED TO HELP
                                                </span>

                                            </div>

                                            <div class="ngo-distance">

                                                <strong>
                                                    ✓
                                                </strong>

                                                <span>
                                                    Response received
                                                </span>

                                            </div>

                                        </article>

                                    `
                                )
                                .join("")
                        }

                    </div>

                </section>

            `;

        }


        const notified =
            request.ngoNotificationStatus ===
            "notified" ||
            request.status ===
            "ngo_notified";


        return `

            <section class="
                dashboard-card
                full-width
            ">

                <div class="card-heading">

                    <div>

                        <span class="eyebrow">
                            COORDINATION STATUS
                        </span>

                        <h2>
                            Relief coordination
                        </h2>

                    </div>

                </div>


                <div class="coordination-box">

                    <strong>
                        ${
                            notified
                                ? "Your request is visible to verified NGOs."
                                : "Your request has been verified."
                        }
                    </strong>

                    <p>
                        ${
                            notified
                                ? "Verified NGOs can review your emergency request and decide whether they have the capacity to help."
                                : "The Control Room can now publish your verified request to the NGO network."
                        }
                    </p>

                </div>

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
                            Let us know when help reaches you.
                        </p>

                    </div>

                </div>


                <button
                    id="receivedHelpButton"
                    class="primary-button"
                    type="button"
                    ${alreadyReceived ? "disabled" : ""}
                >
                    ${
                        alreadyReceived
                            ? "✓ HELP RECEIVED"
                            : "✓ HELP RECEIVED"
                    }
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
                            .join("")}

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

    function render() {

        const content =
            document.getElementById(
                "dashboardContent"
            );


        if (!content) {
            return;
        }


        currentRequest =
            findUserRequest();


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

        if (
            currentRequest.verified !== true
        ) {

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
            getNearestVerifiedNGOs(
                currentRequest
            );


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


                const marker =
                    L.marker(
                        [
                            ngo.mapLat,
                            ngo.mapLng
                        ],
                        {
                            icon: ngoIcon
                        }
                    )
                    .addTo(map);


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
                            ${ngo.distance} km from you
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
                            await readFile(photo);

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
                        success.classList.add("show");
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

            ngoResponses:
                request.ngoResponses
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
                event.key ===
                "relief_requests"
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