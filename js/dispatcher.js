/* ============================================================
   dispatcher.js
   RELIEF RESOLVER — CONTROL ROOM

   WORKFLOW

   Individual
       ↓
   Emergency Request
       ↓
   Control Room Evidence Review
       ↓
   Verification
       ↓
   NGO Network Notification
       ↓
   NGO Response
       ↓
   Relief Assistance

   IMPORTANT:
   Control Room does NOT automatically assign an NGO.
============================================================ */


/* ============================================================
   BASIC HELPERS
============================================================ */

function escapeHtml(value) {

    return String(
        value ?? ""
    ).replace(
        /[&<>"']/g,
        function (char) {

            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char];

        }
    );

}


function jsArg(value) {

    return String(
        value ?? ""
    )
    .replace(
        /\\/g,
        "\\\\"
    )
    .replace(
        /'/g,
        "\\'"
    )
    .replace(
        /\n/g,
        "\\n"
    )
    .replace(
        /\r/g,
        "\\r"
    );

}


function safe(value) {

    return escapeHtml(
        value
    );

}


function firstValue() {

    for (
        let i = 0;
        i < arguments.length;
        i++
    ) {

        const value =
            arguments[i];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return value;

        }

    }

    return "";

}


function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

}




/* ============================================================
   STORAGE
============================================================ */

function readRequests() {
    return Array.isArray(window.controlRoomRequests)
        ? window.controlRoomRequests
        : [];
}


async function loadControlRoomRequests() {
    const token = sessionStorage.getItem("reliefAuthToken");

    if (!token) {
        console.error("Control Room authentication token is missing.");
        showControlMessage("Please log in to the Control Room again.", true);
        return;
    }

    try {
        const response = await fetch(
            "https://disaster-management-7o5i.onrender.com/api/requests/control-room",
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Unable to load requests.");
        }

        window.controlRoomRequests = data.requests;
        renderAll();
    } catch (error) {
        console.error("Control Room request loading failed:", error);
        showControlMessage("Unable to load requests from the server.", true);
    }
}



function writeRequests(
    requests
) {

    localStorage.setItem(
        "relief_requests",
        JSON.stringify(
            requests
        )
    );

}


function readNGOs() {

    try {

        const value =
            JSON.parse(
                localStorage.getItem(
                    "drr_ngos"
                ) || "[]"
            );


        return Array.isArray(value)
            ? value
            : [];

    }
    catch (error) {

        console.error(
            "Unable to read NGOs:",
            error
        );

        return [];

    }

}


function writeNGOs(
    ngos
) {

    localStorage.setItem(
        "drr_ngos",
        JSON.stringify(
            ngos
        )
    );

}


/* ============================================================
   REQUEST HELPERS
============================================================ */

function getRequestId(
    request
) {

    return firstValue(
        request?.id,
        request?.requestNumber
    );

}


function getLocationName(
    request
) {

    return firstValue(
        request?.shelterName,
        request?.locationName,
        request?.city,
        request?.location?.name
    ) || "Affected location";

}


function getReporterName(
    request
) {

    return firstValue(
        request?.reporterName,
        request?.submittedByName,
        request?.name
    ) || "Affected Person";

}


function getPeopleAffected(
    request
) {

    return Number(
        firstValue(
            request?.victims,
            request?.peopleAffected,
            request?.affectedPeople
        ) || 0
    );

}


function getWithoutSupply(
    request
) {

    return Number(
        firstValue(
            request?.daysWithoutSupply,
            request?.withoutSupply,
            request?.daysWithoutSupport
        ) || 0
    );

}


function getReliefNeeded(
    request
) {

    return firstValue(
        request?.supplyType,
        request?.reliefNeeded,
        request?.reliefRequired,
        request?.requirement
    ) || "Relief support";

}


function getLat(
    object
) {

    const value =
        Number(
            firstValue(
                object?.lat,
                object?.latitude,
                object?.location?.lat
            )
        );


    return Number.isFinite(value)
        ? value
        : null;

}


function getLng(
    object
) {

    const value =
        Number(
            firstValue(
                object?.lng,
                object?.longitude,
                object?.location?.lng
            )
        );


    return Number.isFinite(value)
        ? value
        : null;

}


/* ============================================================
   EVIDENCE
============================================================ */

function getEvidence(
    request
) {

    return firstValue(
        request?.verificationPhoto,
        request?.evidencePhoto,
        request?.evidence,
        request?.photo
    );

}


function hasEvidence(
    request
) {

    const photo =
        getEvidence(
            request
        );


    return (
        typeof photo === "string" &&
        photo.startsWith("data:image/")
    );

}


/* ============================================================
   PRIORITY
============================================================ */


/* ============================================================
   SMART EMERGENCY PRIORITY SYSTEM
============================================================ */

function getRequestWaitingMinutes(request) {
    const raw =
        request?.createdAt ||
        request?.timestamp ||
        request?.savedAt;

    if (!raw) return 0;

    const submittedAt =
        typeof raw === "number"
            ? raw
            : Date.parse(raw);

    if (!Number.isFinite(submittedAt)) return 0;

    return Math.max(
        0,
        Math.floor((Date.now() - submittedAt) / 60000)
    );
}

function getPriorityAssessment(request) {
    let score = 0;
    const reasons = [];

    const people = Math.max(
        0,
        Number(getPeopleAffected(request)) || 0
    );

    const days = Math.max(
        0,
        Number(getWithoutSupply(request)) || 0
    );

    const supply =
        String(request?.supplyType || "").toLowerCase();

    const urgency =
        String(request?.urgencyLevel || "routine").toLowerCase();

    const waitingMinutes =
        getRequestWaitingMinutes(request);

    // 1. Reported urgency: maximum 30 points.
    if (urgency === "immediate") {
        score += 30;
        reasons.push(
            "Immediate danger or urgent medical need reported (+30)"
        );
    } else if (urgency === "urgent") {
        score += 20;
        reasons.push(
            "Situation reported as urgent (+20)"
        );
    }

    // 2. People affected: maximum 20 points.
    let peoplePoints = 0;

    if (people >= 50) peoplePoints = 20;
    else if (people >= 20) peoplePoints = 15;
    else if (people >= 10) peoplePoints = 10;
    else if (people >= 5) peoplePoints = 5;
    else if (people > 0) peoplePoints = 2;

    score += peoplePoints;

    if (peoplePoints) {
        reasons.push(
            `${people} people affected (+${peoplePoints})`
        );
    }

    // 3. Essential supplies: maximum 20 points.
    let supplyPoints = 0;

    if (supply.includes("medicine")) {
        supplyPoints = 20;
    } else if (supply.includes("water")) {
        supplyPoints = 16;
    } else if (supply.includes("food")) {
        supplyPoints = 14;
    } else if (supply.includes("shelter-food")) {
        supplyPoints = 16;
    } else if (supply.includes("shelter")) {
        supplyPoints = 10;
    } else if (supply && supply !== "general") {
        supplyPoints = 8;
    }

    score += supplyPoints;

    if (supplyPoints) {
        reasons.push(
            `${supply.replace(/-/g, " ")} supply requested (+${supplyPoints})`
        );
    }

    // 4. Vulnerability: 15 points.
    if (
        request?.vulnerablePerson === true ||
        request?.vulnerablePerson === "true"
    ) {
        score += 15;
        reasons.push(
            "Vulnerable person or group reported (+15)"
        );
    }

    // 5. Days without adequate supplies: maximum 10 points.
    const daysPoints = Math.min(10, days * 2);

    score += daysPoints;

    if (daysPoints) {
        reasons.push(
            `${days} day(s) without adequate support (+${daysPoints})`
        );
    }

    // 6. Waiting for review: maximum 15 points.
    let waitPoints = 0;

    if (waitingMinutes >= 240) waitPoints = 15;
    else if (waitingMinutes >= 120) waitPoints = 12;
    else if (waitingMinutes >= 60) waitPoints = 8;
    else if (waitingMinutes >= 30) waitPoints = 4;

    score += waitPoints;

    if (waitPoints) {
        reasons.push(
            `Waiting ${waitingMinutes} minutes for review (+${waitPoints})`
        );
    }

    // Cap the suggested score at 100.
    score = Math.min(100, score);

    let label;
    let cls;

    if (score >= 70) {
        label = "CRITICAL";
        cls = "critical";
    } else if (score >= 50) {
        label = "HIGH";
        cls = "high";
    } else if (score >= 30) {
        label = "MEDIUM";
        cls = "medium";
    } else {
        label = "LOW";
        cls = "low";
    }

    if (!reasons.length) {
        reasons.push(
            "No additional urgency indicators reported"
        );
    }

    return {
        score,
        label,
        cls,
        reasons,
        waitingMinutes
    };
}

function getPriorityScore(request) {
    return getPriorityAssessment(request).score;
}

function getPriority(request) {
    const assessment = getPriorityAssessment(request);

    return {
        label: assessment.label,
        cls: assessment.cls
    };
}


/* ============================================================
   EMPTY STATE
============================================================ */

function emptyState(
    icon,
    message
) {

    return `

        <div class="empty-state">

            <div class="empty-icon">
                ${escapeHtml(icon)}
            </div>

            ${escapeHtml(message)}

        </div>

    `;

}


/* ============================================================
   REQUEST DETAILS
============================================================ */

function requestDetails(
    request
) {

    return `

        <div class="detail-grid">

            <div class="detail">

                <span>
                    PEOPLE AFFECTED
                </span>

                <strong>
                    ${getPeopleAffected(request).toLocaleString()}
                </strong>

            </div>


            <div class="detail">

                <span>
                    WITHOUT SUPPLY
                </span>

                <strong>
                    ${getWithoutSupply(request)}
                    ${
                        getWithoutSupply(request) === 1
                            ? "day"
                            : "days"
                    }
                </strong>

            </div>


            <div class="detail">

                <span>
                    RELIEF NEEDED
                </span>

                <strong>
                    ${safe(
                        getReliefNeeded(request)
                    )}
                </strong>

            </div>


            <div class="detail">

                <span>
                    REQUESTED BY
                </span>

                <strong>
                    ${safe(
                        request.reporterType ||
                        "Affected Person"
                    )}
                </strong>

            </div>

        </div>

    `;

}


/* ============================================================
   REVIEW CARD
============================================================ */


function createReviewCard(request) {
    const priority = getPriority(request);
    const assessment = getPriorityAssessment(request);
    const evidence = hasEvidence(request);
    const photo = evidence ? getEvidence(request) : "";
    const id = getRequestId(request);
    const reporter = getReporterName(request);
    const lat = getLat(request);
    const lng = getLng(request);
    const location = getLocationName(request);

    const submittedRaw =
        request.createdAt || request.timestamp || request.savedAt;

    const submittedDate = submittedRaw
        ? (typeof submittedRaw === "number"
            ? submittedRaw
            : Date.parse(submittedRaw))
        : NaN;

    const submittedLabel = Number.isFinite(submittedDate)
        ? new Date(submittedDate).toLocaleString()
        : "Submission time unavailable";

    const mapFrame = lat !== null && lng !== null
        ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.015}%2C${lat - 0.01}%2C${lng + 0.015}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`
        : "";

    const scoreReasons = assessment.reasons
        .map(reason => `<li>${safe(reason)}</li>`)
        .join("");

    return `
        <article class="request-card rr-detail-card">

            <div class="rr-breadcrumb">
                <span>⌂</span>
                <span>Individual Requests</span>
                <span>›</span>
                <strong>Request Details</strong>
            </div>

            <div class="rr-page-heading">
                <div>
                    <h3 class="rr-page-title">
                        Individual Emergency Request
                    </h3>
                    <p class="rr-page-subtitle">
                        Inspect the evidence before a request enters the relief network.
                    </p>
                </div>

                <span class="rr-awaiting-pill">
                    ● Awaiting review
                </span>
            </div>

            <div class="rr-detail-layout">

                <!-- LEFT: REQUEST DETAILS -->
                <section class="rr-main-column">
                    <div class="rr-request-overview">

                        <div class="rr-overview-top">
                            <div class="rr-id-line">
                                <span class="priority ${priority.cls}">
                                    ${safe(priority.label)} PRIORITY
                                </span>
                                <span class="rr-request-id">
                                    ${safe(id)}
                                </span>
                            </div>

                            <span class="rr-received-pill">
                                ◷ ${safe(submittedLabel)}
                            </span>
                        </div>

                        <h4 class="rr-location-title">
                            📍 ${safe(location)}
                        </h4>

                        <p class="rr-coordinates">
                            ${lat !== null ? lat.toFixed(5) : "—"},
                            ${lng !== null ? lng.toFixed(5) : "—"}
                        </p>

                        ${requestDetails(request)}

                        <div class="rr-situation-panel">
                            <h5>▤ Situation Details</h5>
                            <p>${safe(
                                request.situationDetails ||
                                request.description ||
                                "No details provided."
                            )}</p>
                        </div>

                        <!-- EVIDENCE AND MAP -->
                        <div class="rr-media-grid">

                            <section class="rr-media-panel">
                                <div class="rr-panel-heading">
                                    <h5>▣ Evidence</h5>
                                    <span class="rr-count-pill">
                                        ${evidence ? "1 image" : "No image"}
                                    </span>
                                </div>

                                ${evidence ? `
                                    <button
                                        type="button"
                                        class="rr-evidence-preview"
                                        onclick="viewEvidence('${jsArg(id)}')"
                                        aria-label="View evidence photo"
                                    >
                                        <img
                                            src="${photo}"
                                            alt="Emergency evidence"
                                        >
                                        <span>View evidence ↗</span>
                                    </button>
                                ` : `
                                    <div class="rr-no-evidence">
                                        <strong>No evidence photo submitted</strong>
                                        <small>
                                            A photo is required before verification.
                                        </small>
                                    </div>
                                `}
                            </section>

                            <section class="rr-media-panel">
                                <div class="rr-panel-heading">
                                    <h5>📍 Location</h5>

                                    ${lat !== null && lng !== null ? `
                                        <a
                                            href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >Open in Maps ↗</a>
                                    ` : ""}
                                </div>

                                ${mapFrame ? `
                                    <div
    class="rr-map-frame rr-leaflet-map"
    data-lat="${lat}"
    data-lng="${lng}"
    data-location="${safe(location)}"
></div>
                                ` : `
                                    <div class="rr-no-map">
                                        Location coordinates unavailable.
                                    </div>
                                `}
                            </section>

                        </div>

                        <!-- REPORTER -->
                        <div class="rr-reporter-row">
                            <div class="reporter-avatar">
                                ${safe(reporter.charAt(0).toUpperCase())}
                            </div>

                            <div class="reporter-main">
                                <strong>${safe(reporter)}</strong>
                                <span>
                                    ${safe(request.reporterType || "Affected Person")}
                                    ·
                                    ${safe(
                                        request.contactNumber ||
                                        request.phone ||
                                        "No contact"
                                    )}
                                </span>
                            </div>
                        </div>

                    </div>
                </section>

                <!-- RIGHT: PRIORITY AND ACTIONS -->
                <aside class="rr-side-column">

                    <section class="rr-side-panel">
                        <div class="rr-side-heading">
                            <span class="rr-side-icon">◉</span>
                            <h5>Priority Score</h5>
                        </div>

                        <div class="rr-score-row">
                            <span>
                                Suggested priority: ${safe(assessment.label)}
                            </span>
                            <strong>
                                ${assessment.score}<small>/100</small>
                            </strong>
                        </div>

                        <div class="rr-score-track">
                            <span style="width:${assessment.score}%"></span>
                        </div>

                        <div class="rr-breakdown">
                            <h6>▥ Score Breakdown</h6>
                            <ul>${scoreReasons}</ul>

                            <div class="rr-score-total">
                                <span>Total Score</span>
                                <strong>${assessment.score}/100</strong>
                            </div>
                        </div>

                        <p class="rr-decision-note">
                            Decision support only. The Control Room makes
                            the final verification and assistance decisions.
                        </p>
                    </section>

                    <section class="rr-side-panel">
                        <div class="rr-side-heading">
                            <span class="rr-side-icon">⚙</span>
                            <h5>Quick Actions</h5>
                        </div>

                        <div class="rr-quick-actions">
                            <button
                                type="button"
                                class="btn btn-green rr-verify-btn"
                                onclick="verifyRequest('${jsArg(id)}')"
                                ${evidence ? "" : "disabled"}
                            >
                                ✓ Verify Request
                            </button>

                            <button
                                type="button"
                                class="btn rr-reject-btn"
                                onclick="rejectRequest('${jsArg(id)}')"
                            >
                                ✕ Reject Request
                            </button>
                        </div>

                        ${evidence ? "" : `
                            <p class="rr-evidence-warning">
                                Evidence photo is required before verification.
                            </p>
                        `}
                    </section>

                    <section class="rr-side-panel">
                        <div class="rr-side-heading">
                            <span class="rr-side-icon">◷</span>
                            <h5>Status Timeline</h5>
                        </div>

                        <ol class="rr-timeline">
                            <li class="rr-timeline-complete">
                                <span class="rr-timeline-dot"></span>
                                <div>
                                    <strong>Request Submitted</strong>
                                    <small>${safe(submittedLabel)}</small>
                                </div>
                            </li>

                            <li class="rr-timeline-current">
                                <span class="rr-timeline-dot"></span>
                                <div>
                                    <strong>Awaiting Verification</strong>
                                    <small>Evidence review is pending</small>
                                </div>
                            </li>

                            <li>
                                <span class="rr-timeline-dot"></span>
                                <div>
                                    <strong>NGO Network Notification</strong>
                                    <small>Available after verification</small>
                                </div>
                            </li>
                        </ol>
                    </section>

                </aside>
            </div>
        </article>
    `;
}


/* ============================================================
   REVIEW QUEUE
============================================================ */

function renderReviewQueue() {

    const list =
        document.getElementById(
            "reviewList"
        );


    if (!list) {
        return;
    }


    const requests =
        readRequests()
            .filter(
                request => {

                    const status =
                        String(
                            request.status ||
                            ""
                        )
                        .toLowerCase()
                        .trim();


                    return (
                        request.verified !== true &&
                        (
                            status === "" ||
                            status === "pending" ||
                            status === "pending verification"
                        )
                    );

                }
            );


    setText(
        "reviewBadge",
        `${requests.length} awaiting review`
    );


    if (!requests.length) {

        list.innerHTML =
            emptyState(
                "✓",
                "No emergency requests are waiting for verification."
            );

        return;

    }
requests.sort((a, b) =>
    getPriorityAssessment(b).score -
    getPriorityAssessment(a).score
);

    list.innerHTML =
        requests
            .map(
                createReviewCard
            )
            .join("");

    initializeRequestMaps();

}


function initializeRequestMaps() {
    if (typeof L === "undefined") {
        console.error("Leaflet did not load. Check your internet connection.");
        return;
    }

    document.querySelectorAll(".rr-leaflet-map").forEach(element => {
        if (element.dataset.mapInitialized === "true") return;

        const lat = Number(element.dataset.lat);
        const lng = Number(element.dataset.lng);
        const location = element.dataset.location || "Emergency location";

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const map = L.map(element).setView([lat, lng], 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);

        L.marker([lat, lng])
            .addTo(map)
            .bindPopup(location);

        element.dataset.mapInitialized = "true";

        setTimeout(() => map.invalidateSize(), 100);
    });
}
/* ============================================================
   VIEW EVIDENCE
============================================================ */

function viewEvidence(
    id
) {

    const request =
        readRequests()
            .find(
                item =>
                    String(
                        getRequestId(item)
                    ) ===
                    String(id)
            );


    if (!request) {

        showControlMessage(
            "Request could not be found.",
            true
        );

        return;

    }


    const photo =
        getEvidence(
            request
        );


    if (
        typeof photo !== "string" ||
        !photo.startsWith("data:image/")
    ) {

        showControlMessage(
            `No viewable evidence photo is stored for ${id}.`,
            true
        );

        return;

    }


    closeEvidence();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "evidenceOverlay";


    overlay.style.cssText = `

        position:fixed;
        inset:0;
        z-index:100000;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:25px;
        background:rgba(7,21,37,.82);
        backdrop-filter:blur(6px);

    `;


    overlay.innerHTML = `

        <div
            style="
                width:min(850px,95vw);
                max-height:92vh;
                overflow:auto;
                background:#fffdf9;
                border-radius:15px;
                padding:20px;
                box-shadow:0 30px 90px rgba(0,0,0,.3);
            "
        >

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    gap:15px;
                    margin-bottom:15px;
                "
            >

                <div>

                    <div
                        style="
                            color:#b43b32;
                            font-size:9px;
                            font-weight:800;
                            letter-spacing:.1em;
                            text-transform:uppercase;
                        "
                    >
                        Verification evidence
                    </div>

                    <h2
                        style="
                            margin:5px 0 0;
                            font-family:Fraunces,Georgia,serif;
                            font-size:25px;
                        "
                    >
                        ${safe(id)}
                    </h2>

                </div>


                <button
                    type="button"
                    class="btn btn-light"
                    onclick="closeEvidence()"
                >
                    CLOSE
                </button>

            </div>


            <img
                src="${photo}"
                alt="Emergency verification evidence"
                style="
                    display:block;
                    width:100%;
                    max-height:68vh;
                    object-fit:contain;
                    background:#f0ece4;
                    border-radius:9px;
                "
            >


            <div
                style="
                    margin-top:14px;
                    padding:13px;
                    background:#f7f4ed;
                    border-radius:8px;
                    color:#52606c;
                    font-size:10px;
                    line-height:1.6;
                "
            >

                <strong>
                    Situation reported
                </strong>

                <br>

                ${safe(
                    request.situationDetails ||
                    request.description ||
                    "No details provided."
                )}

            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeEvidence();

            }

        }
    );

}


function closeEvidence() {

    const overlay =
        document.getElementById(
            "evidenceOverlay"
        );


    if (overlay) {

        overlay.remove();

    }

}


async function verifyRequest(id) {
    const requests = readRequests();

    const request = requests.find(
        item =>
            String(getRequestId(item)) === String(id) ||
            String(item.mongoId || item._id || "") === String(id)
    );

    if (!request) {
        showControlMessage("Request could not be found.", true);
        return;
    }

    if (request.verified === true) {
        showControlMessage("This request is already verified.");
        return;
    }

    if (!hasEvidence(request)) {
        showControlMessage(
            "Verification requires the submitted evidence photo.",
            true
        );
        return;
    }

    const mongoId = request.mongoId || request._id;

    if (!mongoId) {
        showControlMessage(
            "MongoDB request ID is missing. Please reload the dashboard.",
            true
        );
        return;
    }

    const token = sessionStorage.getItem("reliefAuthToken");

    if (!token) {
        showControlMessage(
            "Your session has expired. Please log in again.",
            true
        );
        return;
    }

    try {
        const response = await fetch(
            `https://disaster-management-7o5i.onrender.com/api/requests/${encodeURIComponent(mongoId)}/verify`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: "verified"
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Request verification failed."
            );
        }

        showControlMessage(
            `✓ ${request.requestNumber || id} verified successfully.`
        );

        await loadControlRoomRequests();
    } catch (error) {
        console.error("Request verification failed:", error);

        showControlMessage(
            error.message || "Unable to verify the request.",
            true
        );
    }
}



/* ============================================================
   REJECT INDIVIDUAL EMERGENCY REQUEST
============================================================ */

async function rejectRequest(id) {
    const requests = readRequests();

    const request = requests.find(item =>
        String(getRequestId(item)) === String(id) ||
        String(item.mongoId || item._id || "") === String(id)
    );

    if (!request) {
        showControlMessage("Request could not be found.", true);
        return;
    }

    if (
        request.verified === true ||
        String(request.verificationStatus || "").toLowerCase() === "verified"
    ) {
        showControlMessage(
            "This request has already been verified.",
            true
        );
        return;
    }

    showRejectConfirmation(request, async () => {
    await processRequestRejection(request, id);
});

return;

    const mongoId = request.mongoId || request._id;

    if (!mongoId) {
        showControlMessage(
            "MongoDB request ID is missing. Please reload the dashboard.",
            true
        );
        return;
    }

    const token = sessionStorage.getItem("reliefAuthToken");

    if (!token) {
        showControlMessage(
            "Your session has expired. Please log in again.",
            true
        );
        return;
    }

    try {
        const response = await fetch(
            `https://disaster-management-7o5i.onrender.com/api/requests/${encodeURIComponent(mongoId)}/verify`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: "rejected"
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Request rejection failed."
            );
        }

        showControlMessage(
            `Request ${request.requestNumber || id} rejected successfully.`
        );

        await loadControlRoomRequests();

    } catch (error) {
        console.error("Request rejection failed:", error);

        showControlMessage(
            error.message || "Unable to reject the request.",
            true
        );
    }
}



function showRejectConfirmation(request, onConfirm) {
    document.getElementById("rejectConfirmationOverlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "rejectConfirmationOverlay";
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 100002;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        background: rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(4px);
    `;

    overlay.innerHTML = `
        <div style="
            width: min(420px, 94vw);
            padding: 25px;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,.2);
            font-family: inherit;
        ">
            <div style="
                width: 44px;
                height: 44px;
                display: grid;
                place-items: center;
                border-radius: 12px;
                background: #fee2e2;
                color: #dc2626;
                font-size: 23px;
                margin-bottom: 16px;
            ">!</div>

            <h3 style="
                margin: 0 0 9px;
                color: #172b43;
                font-size: 20px;
            ">Reject emergency request?</h3>

            <p style="
                margin: 0;
                color: #64748b;
                font-size: 13px;
                line-height: 1.6;
            ">
                Are you sure you want to reject request
                <strong style="color:#334155"></strong>?
                This will mark the request as rejected.
            </p>

            <div style="
                display: flex;
                justify-content: flex-end;
                gap: 10px;
                margin-top: 25px;
            ">
                <button id="cancelRejectButton" type="button"
                    style="
                        padding: 11px 17px;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        background: white;
                        color: #374151;
                        font-weight: 600;
                        cursor: pointer;
                    ">Cancel</button>

                <button id="confirmRejectButton" type="button"
                    style="
                        padding: 11px 17px;
                        border: 1px solid #dc2626;
                        border-radius: 8px;
                        background: #dc2626;
                        color: white;
                        font-weight: 700;
                        cursor: pointer;
                    ">Reject Request</button>
            </div>
        </div>
    `;

    overlay.querySelector("p strong").textContent =
        request.requestNumber || getRequestId(request);

    document.body.appendChild(overlay);

    const closeModal = () => overlay.remove();

    overlay.querySelector("#cancelRejectButton").onclick = closeModal;

    overlay.addEventListener("click", event => {
        if (event.target === overlay) closeModal();
    });

    overlay.querySelector("#confirmRejectButton").onclick = async event => {
        const button = event.currentTarget;
        button.disabled = true;
        button.textContent = "Rejecting...";

        try {
            await onConfirm();
            closeModal();
        } catch (error) {
            button.disabled = false;
            button.textContent = "Reject Request";
            showControlMessage(
                error.message || "Unable to reject the request.",
                true
            );
        }
    };
}

async function processRequestRejection(request, id) {
    const mongoId = request.mongoId || request._id;

    if (!mongoId) {
        throw new Error(
            "MongoDB request ID is missing. Please reload the dashboard."
        );
    }

    const token = sessionStorage.getItem("reliefAuthToken");

    if (!token) {
        throw new Error(
            "Your session has expired. Please log in again."
        );
    }

    const response = await fetch(
        `https://disaster-management-7o5i.onrender.com/api/requests/${encodeURIComponent(mongoId)}/verify`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status: "rejected" })
        }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
        throw new Error(
            data.message || "Request rejection failed."
        );
    }

    showControlMessage(
        `Request ${request.requestNumber || id} rejected successfully.`
    );

    await loadControlRoomRequests();
}


/* ============================================================
   NGO NETWORK NOTIFICATION
============================================================ */

function notifyNGONetwork(
    requestId
) {

    const requests =
        readRequests();


    const request =
        requests.find(
            item =>
                String(
                    getRequestId(item)
                ) ===
                String(requestId)
        );


    if (!request) {

        showControlMessage(
            "Emergency request could not be found.",
            true
        );

        return;

    }


    if (
        request.verified !== true
    ) {

        showControlMessage(
            "Only verified requests can be sent to NGOs.",
            true
        );

        return;

    }


    if (
        request.ngoNotificationStatus ===
        "notified"
    ) {

        showControlMessage(
            "This request has already been sent to the NGO network."
        );

        return;

    }


    showNotifyConfirmation(
        request
    );

}


/* ============================================================
   NGO NOTIFICATION CONFIRMATION
============================================================ */

function showNotifyConfirmation(
    request
) {

    closeNotifyConfirmation();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "notifyConfirmationOverlay";


    overlay.style.cssText = `

        position:fixed;
        inset:0;
        z-index:100001;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        background:rgba(7,21,37,.78);
        backdrop-filter:blur(6px);

    `;


    overlay.innerHTML = `

        <div
            style="
                width:min(520px,94vw);
                background:#fffdf9;
                border-radius:15px;
                padding:25px;
                box-shadow:0 30px 90px rgba(0,0,0,.28);
            "
        >

            <div
                style="
                    color:#b43b32;
                    font-size:9px;
                    font-weight:800;
                    letter-spacing:.12em;
                    text-transform:uppercase;
                "
            >
                NGO Network
            </div>


            <h2
                style="
                    margin:7px 0;
                    font-family:Fraunces,Georgia,serif;
                    font-size:27px;
                "
            >
                Notify verified NGOs?
            </h2>


            <p
                style="
                    margin:0;
                    color:#687789;
                    font-size:11px;
                    line-height:1.7;
                "
            >

                This will publish

                <strong>
                    ${safe(
                        getRequestId(request)
                    )}
                </strong>

                to the verified NGO network.

                The Control Room does not select
                or force-assign an NGO.

            </p>


            <div
                style="
                    margin-top:17px;
                    padding:13px;
                    border:1px solid #e3ded3;
                    border-radius:9px;
                    background:#f8f5ee;
                "
            >

                <strong
                    style="
                        display:block;
                        font-size:12px;
                    "
                >
                    ${safe(
                        getLocationName(request)
                    )}
                </strong>


                <span
                    style="
                        display:block;
                        margin-top:4px;
                        color:#74818b;
                        font-size:9px;
                    "
                >
                    ${getPeopleAffected(request)}
                    people affected ·
                    ${safe(
                        getReliefNeeded(request)
                    )}
                </span>

            </div>


            <div
                style="
                    display:flex;
                    justify-content:flex-end;
                    gap:8px;
                    margin-top:20px;
                "
            >

                <button
                    type="button"
                    class="btn btn-light"
                    onclick="closeNotifyConfirmation()"
                >
                    Cancel
                </button>


                <button
                    type="button"
                    class="btn btn-green"
                    onclick="
                        confirmNotifyNGONetwork(
                            '${jsArg(
                                getRequestId(request)
                            )}'
                        )
                    "
                >
                    🔔 Notify NGO Network
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeNotifyConfirmation();

            }

        }
    );

}


function closeNotifyConfirmation() {

    const overlay =
        document.getElementById(
            "notifyConfirmationOverlay"
        );


    if (overlay) {

        overlay.remove();

    }

}


/* ============================================================
   CONFIRM NGO NOTIFICATION
============================================================ */

function confirmNotifyNGONetwork(
    requestId
) {

    const requests =
        readRequests();


    const request =
        requests.find(
            item =>
                String(
                    getRequestId(item)
                ) ===
                String(requestId)
        );


    if (!request) {

        closeNotifyConfirmation();

        showControlMessage(
            "Emergency request could not be found.",
            true
        );

        return;

    }


    if (
        request.verified !== true
    ) {

        closeNotifyConfirmation();

        showControlMessage(
            "Only verified requests can be published to NGOs.",
            true
        );

        return;

    }


    request.ngoNotificationStatus =
        "notified";


    request.ngoNotifiedAt =
        Date.now();


    request.ngoNotifiedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    request.status =
        "ngo_notified";


    if (
        !request.ngoResponses ||
        typeof request.ngoResponses !==
            "object" ||
        Array.isArray(
            request.ngoResponses
        )
    ) {

        request.ngoResponses =
            {};

    }


    /*
     * Do not automatically assign an NGO.
     */

    delete request.assignedNgoId;

    delete request.assignedNgoName;


    writeRequests(
        requests
    );


    closeNotifyConfirmation();


    renderAll();


    showControlMessage(
        `✓ ${requestId} is now published to the verified NGO network.`
    );

}


/* ============================================================
   NGO RESPONSES
============================================================ */

function getNGOResponses(
    request
) {

    if (
        !request ||
        !request.ngoResponses ||
        typeof request.ngoResponses !==
            "object"
    ) {

        return [];

    }


    return Object.values(
        request.ngoResponses
    );

}


/* ============================================================
   COORDINATION CARD
============================================================ */

function createCoordinationCard(request) {
    const id = getRequestId(request);
    const responses = getNGOResponses(request);

    const notified =
        request.ngoNotificationStatus === "notified";

    const priority = getPriority(request);
    const assessment = getPriorityAssessment(request);

    return `
        <article class="request-card">

            <div class="request-head">
                <div>
                    <div class="request-id">
                        ${safe(id)}

                        <span class="priority ${priority.cls}">
                            ${safe(priority.label)}
                        </span>
                    </div>

                    <h3 class="request-title">
                        ${safe(getLocationName(request))}
                    </h3>

                    <div class="request-location">
                        📍
                        ${
                            getLat(request) !== null
                                ? getLat(request).toFixed(5)
                                : "—"
                        },
                        ${
                            getLng(request) !== null
                                ? getLng(request).toFixed(5)
                                : "—"
                        }
                    </div>
                </div>

                <div class="urgency-box">
                    <span>PRIORITY SCORE</span>
                    <strong>${assessment.score}/100</strong>
                </div>
            </div>

            <div class="priority-explanation">
                <strong>
                    Suggested priority: ${safe(assessment.label)}
                </strong>

                <div>
                    ${safe(assessment.reasons.join(" · "))}
                </div>

                <small>
                    Decision support only. The Control Room retains
                    responsibility for coordination decisions.
                </small>
            </div>

            ${requestDetails(request)}

            <div class="verification-row verified">
                <div class="status-main">
                    <span>REQUEST STATUS</span>

                    <strong>✓ Verified</strong>
                </div>

                <button
                    type="button"
                    class="btn btn-light"
                    onclick="viewEvidence('${jsArg(id)}')"
                    ${hasEvidence(request) ? "" : "disabled"}
                >
                    📷 View evidence
                </button>
            </div>

            ${
                !notified
                    ? `
                        <div class="coordination-wrap">
                            <div class="coordination-head">
                                <h3>Notify NGO network</h3>

                                <p>
                                    This publishes the verified
                                    request to eligible verified
                                    NGO dashboards.

                                    No specific NGO is selected
                                    by the Control Room.
                                </p>
                            </div>

                            <button
                                type="button"
                                class="btn btn-green"
                                onclick="notifyNGONetwork('${jsArg(id)}')"
                            >
                                🔔 NOTIFY NGO NETWORK
                            </button>
                        </div>
                    `
                    : `
                        <div class="coordination-wrap">
                            <div class="coordination-state">
                                <div>
                                    <strong>
                                        🔔 NGO network notified
                                    </strong>

                                    <span>
                                        Verified NGOs can now
                                        review this emergency
                                        request.
                                    </span>
                                </div>

                                <span class="available">
                                    ${
                                        responses.length
                                            ? `${responses.length} response${
                                                responses.length === 1
                                                    ? ""
                                                    : "s"
                                            }`
                                            : "Awaiting response"
                                    }
                                </span>
                            </div>

                            <div
                                class="coordination-head"
                                style="margin-top:15px;"
                            >
                                <h3>NGO responses</h3>

                                <p>
                                    NGOs independently decide
                                    whether they can help.
                                </p>
                            </div>

                            ${
                                responses.length
                                    ? `
                                        <div class="match-list">
                                            ${
                                                responses
                                                    .map(response => `
                                                        <div class="ngo-match">
                                                            <h4>
                                                                🏠
                                                                ${safe(
                                                                    response.ngoName ||
                                                                    response.name ||
                                                                    "Verified NGO"
                                                                )}
                                                            </h4>

                                                            <div class="match-meta">
                                                                ✓ Will help
                                                            </div>
                                                        </div>
                                                    `)
                                                    .join("")
                                            }
                                        </div>
                                    `
                                    : `
                                        <div
                                            style="
                                                padding:15px;
                                                border:1px solid #e3ded3;
                                                border-radius:8px;
                                                background:#faf8f3;
                                                color:#71808a;
                                                font-size:9px;
                                                line-height:1.6;
                                            "
                                        >
                                            ⏳ No NGO has responded yet.
                                        </div>
                                    `
                            }
                        </div>
                    `
            }

        </article>
    `;
}

/* ============================================================
   COORDINATION QUEUE
============================================================ */

function renderCoordinationQueue() {

    const list =
        document.getElementById(
            "coordinationList"
        );


    if (!list) {
        return;
    }


    const requests =
        readRequests()
            .filter(
                request =>
                    request.verified === true &&
                    (
                        request.status ===
                            "pending" ||

                        request.status ===
                            "ngo_notified" ||

                        request.status ===
                            "coordinating" ||

                        request.status ===
                            "assistance_confirmed"
                    )
            );


    setText(
        "coordinationBadge",
        `${requests.length} active`
    );


    if (!requests.length) {

        list.innerHTML =
            emptyState(
                "✓",
                "No verified requests are currently waiting for NGO coordination."
            );

        return;

    }


    list.innerHTML =
        requests
            .map(
                createCoordinationCard
            )
            .join("");

}



function getControlTrackingStatus(response, request) {
    const steps = [
        "accepted",
        "preparing",
        "on_the_way",
        "reached",
        "delivered"
    ];

    const responseStatus = String(response?.status || "")
        .toLowerCase()
        .trim()
        .replace(/^ngo_/, "");

    if (steps.includes(responseStatus)) {
        return responseStatus;
    }

    const coordinationStatus = String(
        request?.coordinationStatus || ""
    )
        .toLowerCase()
        .trim()
        .replace(/^ngo_/, "");

    if (steps.includes(coordinationStatus)) {
        return coordinationStatus;
    }

    if (
        request?.trackingNgoId &&
        request?.status === "coordinating"
    ) {
        return "on_the_way";
    }

    return "";
}



/* ============================================================
   NGO ASSISTANCE TRACKING
============================================================ */


function renderAssistanceTracking() {
    const list = document.getElementById("assistanceTrackingList");
    if (!list) return;

    const showDelivered =
        document.getElementById("showDeliveredAssistance")?.checked === true;

    // Use the same server-loaded requests as the rest of the Control Room.
    const requests = readRequests();

    const steps = [
        "accepted",
        "preparing",
        "on_the_way",
        "reached",
        "delivered"
    ];

    const labels = {
        accepted: "NGO ACCEPTED",
        preparing: "PREPARING HELP",
        on_the_way: "NGO ON THE WAY",
        reached: "NGO REACHED",
        delivered: "ASSISTANCE DELIVERED"
    };

    const normalizeStatus = value =>
        String(value || "")
            .toLowerCase()
            .trim()
            .replace(/^ngo_/, "");

    const firstValue = (...values) =>
        values.find(value =>
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        );

    const records = [];

    requests.forEach(request => {
        const rawResponses = request.ngoResponses;

const responseEntries = Array.isArray(rawResponses)
    ? rawResponses.map((response, index) => [
        String(
            response?.ngoId ??
            response?.ngo?._id ??
            response?.ngo?.id ??
            response?.ngo ??
            index
        ),
        response
    ])
    : rawResponses && typeof rawResponses === "object"
        ? Object.entries(rawResponses)
        : {};

        responseEntries.forEach(([ngoId, response]) => {
            if (!response || typeof response !== "object") return;

            const isTrackingNgo =
                request.trackingNgoId != null &&
                String(request.trackingNgoId) === String(ngoId);

            // Prefer the status saved for this particular NGO.
            let status = normalizeStatus(response.status);

            // Use the request-level status only for the tracking NGO.
            if (!steps.includes(status) && isTrackingNgo) {
                const requestStatus = normalizeStatus(
                    request.coordinationStatus
                );

                if (requestStatus === "assistance_delivered") {
                    status = "delivered";
                } else if (steps.includes(requestStatus)) {
                    status = requestStatus;
                }
            }

            // Legacy fallback, after checking for delivery.
            if (
                !steps.includes(status) &&
                isTrackingNgo &&
                request.status === "coordinating"
            ) {
                status = "on_the_way";
            }

            if (!steps.includes(status)) return;

            const updatedAt = firstValue(
    response.statusUpdatedAt,
    response.updatedAt,
    response.respondedAt,
    request.lastUpdatedAt,
    request.updatedAt,
    request.createdAt
);

            records.push({
                request,
                response,
                ngoId,
                status,
                updatedAt
            });
        });
    });

    // Separate active and delivered records.
    const activeRecords = records.filter(
        record => record.status !== "delivered"
    );

    const deliveredRecords = records.filter(
        record => record.status === "delivered"
    );

    // Active records appear first.
    records.sort((a, b) => {
        const aDelivered = a.status === "delivered";
        const bDelivered = b.status === "delivered";

        if (aDelivered !== bDelivered) {
            return aDelivered ? 1 : -1;
        }

        return Number(b.updatedAt) - Number(a.updatedAt);
    });

    // Update header badge with active count.
    const badge = document.getElementById("assistanceTrackingBadge");

    if (badge) {
        badge.textContent = `${activeRecords.length} active`;
    }

    // Update sidebar count if available.
    const sidebarCount = document.getElementById(
        "sideAssistanceTrackingCount"
    );

    if (sidebarCount) {
        sidebarCount.textContent = String(activeRecords.length);
    }

    // Update summary.
// Always show both counts, regardless of the checkbox.
const summary = document.getElementById("assistanceTrackingSummary");

if (summary) {
    summary.textContent =
        `${activeRecords.length} active · ` +
        `${deliveredRecords.length} delivered`;
}

    // Show delivered records only when requested.
    const visibleRecords = showDelivered ? records : activeRecords;

    if (!visibleRecords.length) {
        list.innerHTML = `
            <div class="tracking-empty-state">
                ${
                    showDelivered
                        ? "No NGO assistance tracking records found."
                        : "No active NGO assistance records found."
                }
            </div>
        `;
        return;
    }

    list.innerHTML = visibleRecords.map(
        ({ request, response, ngoId, status, updatedAt }) => {
            const currentStep = steps.indexOf(status);

            const ngoName = firstValue(
                response.ngoName,
                response.name,
                isTrackingNgoName(request, ngoId),
                ngoId
            );

            const requestId = firstValue(
    request.requestNumber,
    request.id,
    request._id,
    "Unknown"
);

            // Individual details come from the original saved request.
            const individualName = firstValue(
                request.reporterName,
                request.submittedByName,
                request.name,
                request.fullName,
                "Name not provided"
            );

            const contactNumber = firstValue(
                request.contactNumber,
                request.phone,
                request.reporterPhone,
                "Not provided"
            );

            const helpReceived =
    request.helpReceived === true ||
    request.helpReceived === "true" ||
    request.status === "assistance_confirmed";

const receiptStatus = helpReceived
    ? "✓ CONFIRMED BY INDIVIDUAL"
    : status === "delivered"
        ? "Awaiting individual confirmation"
        : "Not yet confirmed";

            const location = firstValue(
                request.locationName,
                request.shelterName,
                request.city,
                typeof request.location === "string"
                    ? request.location
                    : request.location?.name,
                request.address,
                "Location not provided"
            );

            const reliefNeeded = firstValue(
    request.reliefNeeded,
    request.supplyType,
    request.reliefType,
    request.suppliesNeeded,
    request.serviceNeeded,
    request.emergencyType,
    "Not specified"
);

const formattedReliefNeeded = String(reliefNeeded)
    .split(/[-_,]/)
    .map(item =>
        item.trim().replace(/\b\w/g, char => char.toUpperCase())
    )
    .filter(Boolean)
    .join(", ");

            const peopleAffected = firstValue(
                request.victims,
                request.peopleAffected,
                request.affectedPeople,
                request.numberOfPeople,
                "Not specified"
            );

            const formattedUpdatedAt = (() => {
                if (!updatedAt) {
    return "Not recorded";
}

const date = new Date(updatedAt);

                return Number.isNaN(date.getTime())
                    ? "Not recorded"
                    : date.toLocaleString([], {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });
            })();

            const stages = steps.map((step, index) => `
                <div class="assistance-stage ${
                    index <= currentStep ? "complete" : ""
                } ${index === currentStep ? "current" : ""}">
                    <span class="assistance-stage-dot">
                        ${index <= currentStep ? "✓" : index + 1}
                    </span>
                    <span>${labels[step]}</span>
                </div>
            `).join("");

            // Show a separate message when delivered assistance is requested
// but no requests have reached the delivered stage.

            return `
                <article class="tracking-card assistance-tracking-card">
                    <div class="tracking-card-header">
                        <div>
                            <span class="tracking-request-label">
                                REQUEST ID
                            </span>
                            <h3>${safe(requestId)}</h3>
                        </div>

                        <span class="tracking-current-status">
                            ${labels[status]}
                        </span>
                    </div>

                    <div class="tracking-individual-details">
                        <div class="tracking-detail">
                            <span>INDIVIDUAL NAME</span>
                            <strong>${safe(individualName)}</strong>
                        </div>

                        <div class="tracking-detail">
                            <span>CONTACT NUMBER</span>
                            <strong>${safe(contactNumber)}</strong>
                        </div>

                        <div class="tracking-detail">
                            <span>LOCATION</span>
                            <strong>${safe(location)}</strong>
                        </div>

                        <div class="tracking-detail">
                            <span>RELIEF NEEDED</span>
                            <strong>${safe(formattedReliefNeeded)}</strong>
                        </div>

                        <div class="tracking-detail">
                            <span>PEOPLE AFFECTED</span>
                            <strong>${safe(peopleAffected)}</strong>
                        </div>

                        <div class="tracking-detail">
                            <span>NGO ASSIGNED</span>
                            <strong>${safe(ngoName)}</strong>
                        </div>
                    </div>

                    <div class="tracking-detail">
    <span>HELP RECEIVED?</span>
    <strong>${safe(receiptStatus)}</strong>
</div>

                    <div class="assistance-tracking-progress"
                         aria-label="NGO assistance progress">
                        ${stages}
                    </div>

                    <div class="assistance-tracking-footer">
                        <span>
                            ${
                                status === "delivered"
                                    ? "Assistance has been marked as delivered."
                                    : "Assistance status reflects the NGO's latest recorded update."
                            }
                        </span>

                        <span class="assistance-updated-note">
                            Last updated: ${safe(formattedUpdatedAt)}
                        </span>
                    </div>
                </article>
            `;
        }
    ).join("");

    // Show a separate message when delivered assistance is requested
// but no requests have reached the delivered stage.
if (showDelivered && deliveredRecords.length === 0) {
    list.insertAdjacentHTML(
        "beforeend",
        `
        <section class="delivered-empty-section">
            <div class="delivered-empty-icon">✓</div>
            <h3>Delivered Assistance</h3>
            <p>No assistance has been marked as delivered yet.</p>
            <span>
                Requests will appear here when an NGO completes delivery.
            </span>
        </section>
        `
    );
}

    // Keep this helper local to the tracking function's scope.
    function isTrackingNgoName(request, ngoId) {
        return request.trackingNgoId != null &&
            String(request.trackingNgoId) === String(ngoId)
                ? request.trackingNgoName
                : "";
    }
}


/* ============================================================
   NGO DOCUMENT HELPERS
============================================================ */

function getDocumentData(
    documentObject
) {

    if (!documentObject) {

        return "";

    }


    if (
        typeof documentObject ===
        "string"
    ) {

        return documentObject;

    }


    return firstValue(
        documentObject.data,
        documentObject.url,
        documentObject.preview
    );

}


function hasNGODocument(ngo, type) {
    if (!ngo || !type) {
        return false;
    }

    // Check document metadata returned by the backend.
    if (type === "registration" &&
        ngo.documents?.registrationCertificate?.filename) {
        return true;
    }

    if (type === "pan" &&
        ngo.documents?.panDocument?.filename) {
        return true;
    }

    // Preserve support for older locally stored NGO records.
    const documentData = type === "registration"
        ? ngo.registrationCertificate
        : type === "pan"
            ? ngo.panDocument
            : null;

    if (!documentData) {
        return false;
    }

    if (typeof documentData === "string") {
        return documentData.trim().length > 0;
    }

    return Boolean(
        documentData.data ||
        documentData.url ||
        documentData.base64 ||
        documentData.filename ||
        documentData.name
    );
}

/* ============================================================
   NGO DOCUMENT VIEWER
============================================================ */

async function viewNGODocument(ngoId, type) {
    console.log("[NGO DOC] Click received:", { ngoId, type });

    let objectUrl = null;

    try {
        const targetId = String(ngoId ?? "").trim();

        const kind = {
            registration: "registration",
            pan: "pan"
        }[type];

        if (!kind) {
            throw new Error("Invalid document type.");
        }

        const token = sessionStorage.getItem("reliefAuthToken");

        if (!token) {
            throw new Error("Please log in to the Control Room again.");
        }

        const localNGOs = typeof readNGOs === "function"
            ? readNGOs()
            : [];

        const localNGO = localNGOs.find(item =>
            [item.id, item.ngoId, item.mongoId, item._id]
                .some(id => String(id ?? "").trim() === targetId)
        );

        const response = await fetch(
            "https://disaster-management-7o5i.onrender.com/api/auth/ngos",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                `Unable to load NGO records (HTTP ${response.status}).`
            );
        }

        const result = await response.json();
        const backendNGOs = Array.isArray(result.ngos)
            ? result.ngos
            : [];

        // First try MongoDB ID / backend ID.
        let ngo = backendNGOs.find(item =>
            [item.id, item._id, item.mongoId]
                .some(id => String(id ?? "").trim() === targetId)
        );

        // Next, match by email when available.
        const localEmail = String(
            localNGO?.email || localNGO?.contactEmail || ""
        ).trim().toLowerCase();

        if (!ngo && localEmail) {
            ngo = backendNGOs.find(item =>
                String(item.email || "").trim().toLowerCase() === localEmail
            );
        }

        // Last, try organization name only if it identifies exactly one record.
        if (!ngo && localNGO) {
            const localName = String(
                localNGO.name || localNGO.organizationName || ""
            ).trim().toLowerCase();

            if (localName) {
                const matches = backendNGOs.filter(item =>
                    String(item.name || item.organizationName || "")
                        .trim().toLowerCase() === localName
                );

                if (matches.length === 1) {
                    ngo = matches[0];
                }
            }
        }

        if (!ngo) {
            console.error("[NGO DOC] No backend match.", {
                targetId,
                localNGO,
                backendNGOs: backendNGOs.map(item => ({
                    id: item.id,
                    name: item.name,
                    email: item.email
                }))
            });

            throw new Error(
                "This NGO is not present in the backend. Check its registration and database record."
            );
        }

        const mongoNgoId = ngo._id || ngo.id || ngo.mongoId;

        if (!mongoNgoId) {
            throw new Error("The backend NGO record has no MongoDB ID.");
        }

        const metadata = kind === "registration"
            ? ngo.documents?.registrationCertificate
            : ngo.documents?.panDocument;

        console.log("[NGO DOC] Resolved document:", {
            ngoName: ngo.name,
            mongoNgoId,
            kind,
            filename: metadata?.filename,
            mimeType: metadata?.mimeType
        });

        if (!metadata?.filename) {
            throw new Error(
                `No ${kind} document is stored for ${ngo.name || targetId}.`
            );
        }

        const documentUrl =
            `https://disaster-management-7o5i.onrender.com/api/auth/ngos/${encodeURIComponent(mongoNgoId)}/documents/${kind}`;

        const fileResponse = await fetch(documentUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            },
            cache: "no-store"
        });

        if (!fileResponse.ok) {
            let message = `Document API returned HTTP ${fileResponse.status}.`;

            try {
                const data = await fileResponse.json();
                message = data.message || message;
            } catch (_) {}

            throw new Error(message);
        }

        const blob = await fileResponse.blob();

        if (!blob.size) {
            throw new Error("The document file is empty.");
        }

        const mimeType = (
            blob.type || metadata.mimeType || ""
        ).toLowerCase();

        const isPdf = mimeType.includes("pdf");
        const isImage = mimeType.startsWith("image/");

        if (!isPdf && !isImage) {
            throw new Error(
                `Unsupported document format: ${mimeType || "unknown"}.`
            );
        }

        objectUrl = URL.createObjectURL(blob);

        closeNGODocument();

        const overlay = document.createElement("div");
        overlay.id = "ngoDocumentOverlay";
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 100002;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(7, 21, 37, .82);
            backdrop-filter: blur(6px);
        `;

        const panel = document.createElement("div");
        panel.style.cssText = `
            width: min(900px, 95vw);
            max-height: 92vh;
            overflow: auto;
            background: #fffdf9;
            border: 1px solid #e6dfd3;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 30px 90px rgba(0, 0, 0, .3);
        `;

        const header = document.createElement("div");
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;
            margin-bottom: 15px;
        `;

        const heading = document.createElement("div");
        const label = document.createElement("div");
        label.textContent = "NGO DOCUMENT";
        label.style.cssText = `
            color: #2f7a4a;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: .1em;
        `;

        const title = document.createElement("h2");
        title.textContent = kind === "registration"
            ? "Registration Certificate"
            : "PAN Document";
        title.style.cssText = `
            margin: 5px 0 0;
            font-family: Georgia, serif;
            font-size: 24px;
            color: #171717;
        `;

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "btn btn-light";
        closeButton.textContent = "CLOSE";
        closeButton.addEventListener("click", closeNGODocument);

        const preview = document.createElement(isPdf ? "iframe" : "img");
        preview.style.cssText = `
            display: block;
            width: 100%;
            height: 72vh;
            max-height: 72vh;
            border: 0;
            object-fit: contain;
            background: #f0ece4;
            border-radius: 9px;
        `;

        if (isPdf) {
            preview.title = title.textContent;
            preview.src = objectUrl;
        } else {
            preview.alt = title.textContent;
            preview.src = objectUrl;
        }

        heading.append(label, title);
        header.append(heading, closeButton);
        panel.append(header, preview);
        overlay.appendChild(panel);

        // Register the overlay before adding it to the document.
        const activeObjectUrl = objectUrl;
        const originalCloseNGODocument = closeNGODocument;

        // Ensure the object URL is released when this viewer closes.
        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                closeNGODocument();
            }
        });

        document.body.appendChild(overlay);

        console.log("[NGO DOC] Viewer opened successfully.");

    } catch (error) {
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
        }

        console.error("[NGO DOC] Viewing failed:", error);

        showControlMessage(
            error.message || "Unable to open NGO document.",
            true
        );
    }
}


function closeNGODocument() {

    const overlay =
        document.getElementById(
            "ngoDocumentOverlay"
        );


    if (overlay) {

        overlay.remove();

    }

}


/* ============================================================
   NGO HELPERS
============================================================ */

function normalizeServices(
    value
) {

    if (
        Array.isArray(value)
    ) {

        return value
            .map(
                item =>
                    String(item)
                        .trim()
                        .toLowerCase()
            )
            .filter(Boolean);

    }


    return String(
        value || ""
    )
    .split(
        /[,;+|]/
    )
    .map(
        item =>
            item
                .trim()
                .toLowerCase()
    )
    .filter(Boolean);

}


function formatServices(
    value
) {

    return normalizeServices(
        value
    )
    .map(
        service =>
            service.replace(
                /\b\w/g,
                char =>
                    char.toUpperCase()
            )
    )
    .join(", ")
    ||
    "Relief support";

}


/* ============================================================
   PENDING NGO CARD
============================================================ */

function createPendingNGOCard(
    ngo
) {

    if (
        !ngo.verificationChecklist ||
        typeof ngo.verificationChecklist !==
            "object"
    ) {

        ngo.verificationChecklist = {

            registrationReviewed:
                false,

            panReviewed:
                false,

            documentsReviewed:
                false

        };

    }


    const checklist =
        ngo.verificationChecklist;


    const registrationAvailable =
        hasNGODocument(
            ngo,
            "registration"
        );


    const panAvailable =
        hasNGODocument(
            ngo,
            "pan"
        );

const ngoId =
    ngo.mongoId ||
    ngo._id ||
    ngo.id ||
    "NGO";

    return `

        <article class="ngo-card">

            <div class="ngo-id">

                ${safe(ngoId)}

            </div>


            <h3>

                ${safe(
                    ngo.name ||
                    "Unnamed NGO"
                )}

            </h3>


            <div class="ngo-location">

                ${safe(
                    ngo.city ||
                    "Location not provided"
                )}

                ${
                    ngo.state
                        ? ", " +
                            safe(
                                ngo.state
                            )
                        : ""
                }

            </div>


            <div class="ngo-info">

                <div>

                    <span>
                        REGISTRATION
                    </span>

                    <strong>
                        ${safe(
                            ngo.registrationNumber ||
                            "—"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        ORGANISATION PAN
                    </span>

                    <strong>

                        ${safe(
                            ngo.organizationPan ||
                            ngo.panNumber ||
                            ngo.organisationPan ||
                            "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        CONTACT
                    </span>

                    <strong>
                        ${safe(
                            ngo.contactPerson ||
                            "—"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        PHONE
                    </span>

                    <strong>
                        ${safe(
                            ngo.phone ||
                            "—"
                        )}
                    </strong>

                </div>

            </div>


            <div class="ngo-services">

                <strong>
                    Services:
                </strong>

                ${safe(
                    formatServices(
                        ngo.services
                    )
                )}

            </div>


            <div class="document-box">

                <div class="document-box-title">

                    Supporting Documents

                </div>


                <div class="document-row">

                    <span>
                        Registration Certificate
                    </span>


                    <div class="document-buttons">

                        <button
                            type="button"
                            class="btn btn-light"
                            onclick="
                                viewNGODocument(
                                    '${jsArg(ngoId)}',
                                    'registration'
                                )
                            "
                            ${
                                registrationAvailable
                                    ? ""
                                    : "disabled"
                            }
                        >

                            ${
                                registrationAvailable
                                    ? "📷 View"
                                    : "No file"
                            }

                        </button>

                    </div>

                </div>


                <div class="document-row">

                    <span>
                        PAN Document
                    </span>


                    <div class="document-buttons">

                        <button
                            type="button"
                            class="btn btn-light"
                            onclick="
                                viewNGODocument(
                                    '${jsArg(ngoId)}',
                                    'pan'
                                )
                            "
                            ${
                                panAvailable
                                    ? ""
                                    : "disabled"
                            }
                        >

                            ${
                                panAvailable
                                    ? "📷 View"
                                    : "No file"
                            }

                        </button>

                    </div>

                </div>


                <label class="check-row">

                    <input
                        type="checkbox"
                        ${
                            checklist.registrationReviewed
                                ? "checked"
                                : ""
                        }
                        onchange="
                            updateNGOChecklist(
                                '${jsArg(ngoId)}',
                                'registrationReviewed',
                                this.checked
                            )
                        "
                    >

                    Registration certificate reviewed

                </label>


                <label class="check-row">

                    <input
                        type="checkbox"
                        ${
                            checklist.panReviewed
                                ? "checked"
                                : ""
                        }
                        onchange="
                            updateNGOChecklist(
                                '${jsArg(ngoId)}',
                                'panReviewed',
                                this.checked
                            )
                        "
                    >

                    PAN document reviewed

                </label>


                <label class="check-row">

                    <input
                        type="checkbox"
                        ${
                            checklist.documentsReviewed
                                ? "checked"
                                : ""
                        }
                        onchange="
                            updateNGOChecklist(
                                '${jsArg(ngoId)}',
                                'documentsReviewed',
                                this.checked
                            )
                        "
                    >

                    All submitted documents reviewed

                </label>

            </div>


            <div class="ngo-actions">

                <button
                    type="button"
                    class="btn btn-green"
                    onclick="
                        verifyNGO(
                            '${jsArg(ngoId)}'
                        )
                    "
                >

                    ✓ VERIFY NGO

                </button>


                <button
                    type="button"
                    class="btn btn-light"
                    onclick="
                        rejectNGO(
                            '${jsArg(ngoId)}'
                        )
                    "
                >

                    REJECT

                </button>

            </div>

        </article>

    `;

}


/* ============================================================
   NGO CHECKLIST
============================================================ */

async function updateNGOChecklist(ngoId, field, value) {
    const allowedFields = [
        "registrationReviewed",
        "panReviewed",
        "documentsReviewed"
    ];

    if (!allowedFields.includes(field)) {
        return;
    }

    const controlRoomNGOs = Array.isArray(window.controlRoomNGOs)
        ? window.controlRoomNGOs
        : [];

    const ngo = controlRoomNGOs.find(item =>
        String(item.id) === String(ngoId) ||
        String(item.mongoId || item._id || "") === String(ngoId)
    );

    if (!ngo) {
        showControlMessage("NGO could not be found.", true);
        return;
    }

    const targetId = String(ngoId).trim();

const mongoNgoId =
    ngo.mongoId ||
    ngo._id ||
    ngo.id;
    const newValue = Boolean(value);

    const token = sessionStorage.getItem("reliefAuthToken");

    if (!token) {
        showControlMessage(
            "Control Room login token not found. Please log in again.",
            true
        );
        return;
    }

    const previousChecklist = {
        registrationReviewed:
            ngo.verificationChecklist?.registrationReviewed || false,
        panReviewed:
            ngo.verificationChecklist?.panReviewed || false,
        documentsReviewed:
            ngo.verificationChecklist?.documentsReviewed || false
    };

    if (!ngo.verificationChecklist ||
        typeof ngo.verificationChecklist !== "object") {
        ngo.verificationChecklist = {
            registrationReviewed: false,
            panReviewed: false,
            documentsReviewed: false
        };
    }

    // Update the displayed checklist immediately.
    ngo.verificationChecklist[field] = newValue;

    renderNGOs();

    try {
        const response = await fetch(
            `https://disaster-management-7o5i.onrender.com/api/auth/ngos/${encodeURIComponent(mongoNgoId)}/verification-checklist`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    field,
                    value: newValue
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to save the checklist."
            );
        }

        // Use the saved checklist returned by MongoDB.
        ngo.verificationChecklist = data.verificationChecklist;

        // Preserve compatibility with older locally stored NGO records.
        const localNGOs = readNGOs();

        const localNGO = localNGOs.find(item =>
            String(item.id) === String(ngoId) ||
            String(item.mongoId || item._id || "") === String(ngoId)
        );

        if (localNGO) {
            localNGO.verificationChecklist = {
                ...data.verificationChecklist
            };

            writeNGOs(localNGOs);
        }

        renderNGOs();

    } catch (error) {
        // Restore the previous state if saving failed.
        ngo.verificationChecklist = previousChecklist;

        renderNGOs();

        console.error("Checklist update error:", error);

        showControlMessage(
            error.message || "Unable to save the verification checklist.",
            true
        );
    }
}

/* ============================================================
   VERIFY NGO
============================================================ */

async function verifyNGO(ngoId) {
    const ngos = Array.isArray(window.controlRoomNGOs)
        ? window.controlRoomNGOs
        : [];

    const ngo = ngos.find(item =>
        String(item.id) === String(ngoId) ||
        String(item.mongoId || item._id || "") === String(ngoId)
    );

    if (!ngo) {
        showControlMessage("NGO could not be found.", true);
        return;
    }

    // Both documents must exist in the backend.
    if (
        !ngo.documents?.registrationCertificate?.filename ||
        !ngo.documents?.panDocument?.filename
    ) {
        showControlMessage(
            "Registration certificate and PAN document are required before NGO verification.",
            true
        );
        return;
    }

    // All checklist items must be reviewed.
    const checklist = ngo.verificationChecklist;

    if (
        !checklist?.registrationReviewed ||
        !checklist?.panReviewed ||
        !checklist?.documentsReviewed
    ) {
        showControlMessage(
            "Please review all NGO documents before verification.",
            true
        );
        return;
    }

    const token = sessionStorage.getItem("reliefAuthToken");

    if (!token) {
        showControlMessage(
            "Control Room login token not found. Please log in again.",
            true
        );
        return;
    }

    const mongoNgoId = ngo.mongoId || ngo._id || ngo.id;

    try {
        const response = await fetch(
            `https://disaster-management-7o5i.onrender.com/api/auth/ngos/${encodeURIComponent(mongoNgoId)}/verification`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    status: "verified"
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            showControlMessage(
                data.message || "Unable to verify NGO.",
                true
            );
            return;
        }

        // Update the MongoDB-backed record after success.
        ngo.status = "verified";
        ngo.verificationStatus = "verified";
        ngo.verifiedAt = Date.now();
        ngo.verifiedBy =
            sessionStorage.getItem("reliefStaffName") ||
            "Control Room Staff";

        // Keep older locally stored records compatible.
  
        // Update the locally stored NGO record.
        const localNGOs = readNGOs();

        const localNGO = localNGOs.find(item =>
            String(item.id) === String(ngoId) ||
            String(item.mongoId || item._id || "") === String(ngoId) ||
            String(item.id) === String(mongoNgoId) ||
            String(item.mongoId || item._id || "") === String(mongoNgoId)
        );

        if (localNGO) {
            localNGO.status = "verified";
            localNGO.verificationStatus = "verified";
            localNGO.verifiedAt = Date.now();

            writeNGOs(localNGOs);
        }

        // Keep the backend-backed list in sync too.
        ngo.status = "verified";
        ngo.verificationStatus = "verified";

        if (typeof window.renderCoordinationMap === "function") {
            window.renderCoordinationMap();
        }

        renderAll();


        showControlMessage(
            `✓ ${ngo.name || ngoId} has been verified and added to the NGO network.`
        );
    } catch (error) {
        console.error("NGO verification error:", error);

        showControlMessage(
            "Unable to connect to the backend. Please ensure the server is running.",
            true
        );
    }
}

/* ============================================================
   REJECT NGO
============================================================ */

async function rejectNGO(ngoId) {
    const ngos = Array.isArray(window.controlRoomNGOs)
        ? window.controlRoomNGOs
        : readNGOs();

    const ngo = ngos.find(item =>
        String(item.id || "") === String(ngoId) ||
        String(item.mongoId || item._id || "") === String(ngoId)
    );

    if (!ngo) {
        showControlMessage("NGO could not be found.", true);
        return;
    }

    const token = sessionStorage.getItem("reliefAuthToken");

    if (!token) {
        showControlMessage(
            "Control Room login token not found. Please log in again.",
            true
        );
        return;
    }

    // Use a real backend MongoDB ID.
    let mongoNgoId = ngo._id || ngo.mongoId;

    try {
        // Resolve the backend record if the displayed ID is a local ID.
        if (!mongoNgoId || !/^[a-f\d]{24}$/i.test(String(mongoNgoId))) {
            const listResponse = await fetch(
    "https://disaster-management-7o5i.onrender.com/api/auth/ngos",
    {
        headers: {
            Authorization: `Bearer ${token}`
        },
        cache: "no-store"
    }
);

            const listData = await listResponse.json();

            if (!listResponse.ok) {
                throw new Error(
                    listData.message || "Unable to load backend NGOs."
                );
            }

            const backendNGOs = Array.isArray(listData.ngos)
                ? listData.ngos
                : [];

            const email = String(ngo.email || "").trim().toLowerCase();

            const matches = backendNGOs.filter(item =>
                email &&
                String(item.email || "").trim().toLowerCase() === email
            );

            if (matches.length !== 1) {
                throw new Error(
                    "This NGO has no unique matching backend record. Rejection was not submitted."
                );
            }

            mongoNgoId = matches[0]._id || matches[0].id;
        }

        if (!/^[a-f\d]{24}$/i.test(String(mongoNgoId || ""))) {
            throw new Error("A valid MongoDB NGO ID could not be resolved.");
        }

        const response = await fetch(
    `https://disaster-management-7o5i.onrender.com/api/auth/ngos/${encodeURIComponent(mongoNgoId)}/verification`,
    {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            status: "rejected"
        })
    }
);

        const rawResponse = await response.text();
        let data = {};

        try {
            data = rawResponse ? JSON.parse(rawResponse) : {};
        } catch (_) {
            throw new Error(
                `Unexpected backend response (HTTP ${response.status}).`
            );
        }

        console.log("[NGO REJECT] Response:", {
            status: response.status,
            data
        });

        if (!response.ok || data.success !== true) {
            throw new Error(
                data.message || `Unable to reject NGO (HTTP ${response.status}).`
            );
        }

        ngo.status = "rejected";
        ngo.verificationStatus = "rejected";
        ngo.rejectedAt = Date.now();

        if (typeof renderAll === "function") {
            renderAll();
        } else if (typeof renderNGOs === "function") {
            renderNGOs();
        }

        showControlMessage(
            `NGO ${ngo.name || ngoId} has been rejected.`
        );
    } catch (error) {
        console.error("[NGO REJECT] Failed:", error);

        showControlMessage(
            error.message || "Unable to reject NGO.",
            true
        );
    }
}


/* ============================================================
   VERIFIED NGO CARD
============================================================ */

function formatNGOAvailability(value) {
    const normalized = String(value || "available")
        .trim()
        .toLowerCase();

    if (
        normalized.includes("unavailable") ||
        normalized === "not_available"
    ) {
        return "Unavailable";
    }

    if (normalized.includes("limited")) {
        return "Limited capacity";
    }

    return "Available";
}

function getNGOAvailabilityClass(value) {
    const normalized = String(value || "available")
        .trim()
        .toLowerCase();

    if (
        normalized.includes("unavailable") ||
        normalized === "not_available"
    ) {
        return "unavailable";
    }

    if (normalized.includes("limited")) {
        return "limited";
    }

    return "available";
}

function createVerifiedNGOCard(ngo) {
    const radius = Number(
        firstValue(
            ngo.operatingRadiusKm,
            ngo.operatingRadius,
            ngo.radiusKm
        ) || 0
    );

    return `
        <article class="ngo-card">
            <div class="ngo-id">
                VERIFIED NGO
            </div>

            <h3>
                🏠 ${safe(ngo.name || "Verified NGO")}
            </h3>

            <div class="ngo-location">
                ${safe(ngo.city || "Location not provided")}
                ${ngo.state ? ", " + safe(ngo.state) : ""}
            </div>

            <div class="ngo-info">
                <div>
                    <span>REGISTRATION</span>
                    <strong>${safe(ngo.registrationNumber || "—")}</strong>
                </div>

                <div>
                    <span>PAN</span>
                    <strong>${safe(
                        ngo.organizationPan ||
                        ngo.panNumber ||
                        ngo.organisationPan ||
                        "—"
                    )}</strong>
                </div>

                <div>
                    <span>CONTACT</span>
                    <strong>${safe(ngo.contactPerson || "—")}</strong>
                </div>

                <div>
                    <span>OPERATING RADIUS</span>
                    <strong>
                        ${radius > 0 ? radius + " km" : "Not specified"}
                    </strong>
                </div>
            </div>

            <div class="ngo-services">
                <strong>Services:</strong>
                ${safe(formatServices(ngo.services))}
            </div>

            <div class="ngo-capacity-summary">
                <div>
                    <span>AVAILABILITY</span>
                    <strong class="ngo-availability-${getNGOAvailabilityClass(ngo.availability)}">
                        ${safe(formatNGOAvailability(ngo.availability))}
                    </strong>
                </div>

                <div>
                    <span>ACTIVE CASES</span>
                    <strong>${getNGOActiveCaseCountForControlRoom(ngo.id)}</strong>
                </div>

                <div>
                    <span>VOLUNTEERS</span>
                    <strong>
                        ${
                            ngo.capacity &&
                            ngo.capacity.volunteersAvailable != null
                                ? safe(ngo.capacity.volunteersAvailable)
                                : "Not reported"
                        }
                    </strong>
                </div>

                <div>
                    <span>VEHICLES</span>
                    <strong>
                        ${
                            ngo.capacity &&
                            ngo.capacity.vehiclesAvailable != null
                                ? safe(ngo.capacity.vehiclesAvailable)
                                : "Not reported"
                        }
                    </strong>
                </div>
            </div>

            ${
                ngo.inventory && (
                    ngo.inventory.medicine != null ||
                    ngo.inventory.foodPackets != null ||
                    ngo.inventory.waterUnits != null
                )
                    ? `
                        <div class="ngo-capacity-stock">
                            <strong>Reported stock:</strong>
                            ${
                                ngo.inventory.medicine != null
                                    ? `Medicine ${safe(ngo.inventory.medicine)}`
                                    : ""
                            }
                            ${
                                ngo.inventory.foodPackets != null
                                    ? ` · Food packets ${safe(ngo.inventory.foodPackets)}`
                                    : ""
                            }
                            ${
                                ngo.inventory.waterUnits != null
                                    ? ` · Water units ${safe(ngo.inventory.waterUnits)}`
                                    : ""
                            }
                        </div>
                    `
                    : ""
            }

            <div style="
                margin-top:14px;
                padding:10px;
                border-radius:8px;
                background:#eef8f1;
                color:#2f7a4a;
                font-size:9px;
                font-weight:800;
            ">
                ✓ VERIFIED RELIEF PARTNER
            </div>
        </article>
    `;
}

function getNGOActiveCaseCountForControlRoom(ngoId) {
    return readRequests().filter(request => {
        const response = (request.ngoResponses || {})[ngoId];

        return Boolean(
            response &&
            [
                "accepted",
                "preparing",
                "on_the_way",
                "reached"
            ].includes(
                String(response.status || "").toLowerCase()
            )
        );
    }).length;
}


async function loadControlRoomNGOs() {
    const token = sessionStorage.getItem("reliefAuthToken");

    if (!token) {
        console.error("Control Room authentication token not found.");
        return;
    }

    try {
        const response = await fetch(
            "https://disaster-management-7o5i.onrender.com/api/auth/ngos",
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(
                data.message || "Unable to load NGOs."
            );
        }

        window.controlRoomNGOs = data.ngos.map(ngo => ({
            ...ngo,
            mongoId: ngo.id,
            id: ngo.id,
            name: ngo.name,
            status: ngo.status,
            verificationStatus: ngo.verificationStatus,

            verificationChecklist: {
                registrationReviewed:
                    ngo.verificationChecklist?.registrationReviewed ?? false,

                panReviewed:
                    ngo.verificationChecklist?.panReviewed ?? false,

                documentsReviewed:
                    ngo.verificationChecklist?.documentsReviewed ?? false
            }
        }));

        renderNGOs();
    } catch (error) {
        console.error("Loading Control Room NGOs failed:", error);

        showControlMessage(
            error.message || "Unable to load NGOs from the backend.",
            true
        );
    }
}

/* ============================================================
   NGO RENDER
============================================================ */

function renderNGOs() {
    // Merge backend and local NGOs by their IDs.
    const localNGOs = readNGOs();
    const backendNGOs = Array.isArray(window.controlRoomNGOs)
        ? window.controlRoomNGOs
        : [];

    const ngoMap = new Map();

    [...backendNGOs, ...localNGOs].forEach(ngo => {
        const id = String(
            ngo.mongoId || ngo._id || ngo.id || ""
        ).trim();

        if (!id) return;

        const existing = ngoMap.get(id);

        ngoMap.set(
            id,
            existing ? { ...existing, ...ngo } : ngo
        );
    });

    const ngos = [...ngoMap.values()];

    // Separate pending and verified NGOs.
    const getStatus = ngo =>
        String(
            ngo.status || ngo.verificationStatus || ""
        ).trim().toLowerCase();

    const pending = ngos.filter(
        ngo => getStatus(ngo) === "pending"
    );

    const verified = ngos.filter(
        ngo => getStatus(ngo) === "verified"
    );

    setText("ngoPendingCount", `${pending.length} pending`);
    setText("ngoNetworkBadge", `${verified.length} verified`);

    const pendingList = document.getElementById("ngoVerificationList");
    const verifiedList = document.getElementById("verifiedNgoList");

    if (pendingList) {
        pendingList.innerHTML = pending.length
            ? pending.map(createPendingNGOCard).join("")
            : emptyState(
                "✓",
                "No NGOs are currently awaiting verification."
            );
    }

    if (verifiedList) {
        const availabilityFilter =
            document.getElementById("ngoAvailabilityFilter")?.value || "all";

        const serviceFilter =
            document.getElementById("ngoServiceFilter")?.value || "all";

        const searchTerm = (
            document.getElementById("ngoNetworkSearch")?.value || ""
        ).trim().toLowerCase();

        const filteredVerified = verified.filter(ngo => {
            const availability = String(
                ngo.availability || "available"
            ).trim().toLowerCase();

            const normalizedAvailability =
                availability.includes("unavailable") ||
                availability === "not_available"
                    ? "unavailable"
                    : availability.includes("limited")
                        ? "limited"
                        : "available";

            const services = normalizeServices(ngo.services);

            const matchesAvailability =
                availabilityFilter === "all" ||
                normalizedAvailability === availabilityFilter;

            const matchesService =
                serviceFilter === "all" ||
                services.includes(serviceFilter);

            const searchableText = [
                ngo.name,
                ngo.city,
                ngo.state,
                ngo.id,
                ngo.mongoId,
                ngo._id
            ].filter(Boolean).join(" ").toLowerCase();

            const matchesSearch =
                !searchTerm || searchableText.includes(searchTerm);

            return (
                matchesAvailability &&
                matchesService &&
                matchesSearch
            );
        });

        verifiedList.innerHTML = filteredVerified.length
            ? filteredVerified.map(createVerifiedNGOCard).join("")
            : emptyState(
                "—",
                verified.length
                    ? "No verified NGOs match these filters."
                    : "No verified NGOs are available yet."
            );
    }
}

/* ============================================================
   ALERTS
============================================================ */

function renderAlerts() {

    const list =
        document.getElementById(
            "alertList"
        );


    if (!list) {
        return;
    }


    const flagged =
        readRequests()
            .filter(
                request =>
                    request.status ===
                    "flagged"
            );


    setText(
        "alertCount",
        `${flagged.length} flagged`
    );


    if (!flagged.length) {

        list.innerHTML =
            emptyState(
                "✓",
                "No verification anomalies detected."
            );

        return;

    }


    list.innerHTML =
        flagged
            .map(
                request => `

                    <div
                        class="flagged-item"
                    >

                        <strong>

                            ⚠️

                            ${safe(
                                getRequestId(
                                    request
                                )
                            )}

                        </strong>


                        <p>

                            ${safe(
                                getLocationName(
                                    request
                                )
                            )}

                            ·

                            ${getPeopleAffected(
                                request
                            )}

                            people affected.

                            This request has been
                            held for manual review.

                        </p>

                    </div>

                `
            )
            .join("");

}


/* ============================================================
   STATISTICS
============================================================ */

function renderStatistics() {
    const requests = readRequests();

    // Merge backend and local NGOs without duplicate IDs.
    const localNGOs = readNGOs();
    const backendNGOs = Array.isArray(window.controlRoomNGOs)
        ? window.controlRoomNGOs
        : [];

    const ngoMap = new Map();

    [...backendNGOs, ...localNGOs].forEach(ngo => {
        const id = String(
            ngo.mongoId || ngo._id || ngo.id || ""
        ).trim();

        if (!id) return;

        const existing = ngoMap.get(id);

        ngoMap.set(
            id,
            existing
                ? { ...existing, ...ngo }
                : ngo
        );
    });

    const ngos = [...ngoMap.values()];

    // Count requests awaiting verification.
    const pending = requests.filter(request => {
        const status = String(request.status || "")
            .trim()
            .toLowerCase();

        return (
            ["pending", "pending verification"].includes(status) &&
            request.verified !== true
        );
    });

    // Count verified requests.
    const verified = requests.filter(
        request => request.verified === true
    );

    // Count requests currently being coordinated.
    const coordinating = requests.filter(request =>
        [
            "ngo_notified",
            "coordinating",
            "assistance_confirmed"
        ].includes(
            String(request.status || "").trim().toLowerCase()
        )
    );

    // Count verified NGOs using either status field.
    const verifiedNGOs = ngos.filter(ngo => {
        const status = String(
            ngo.status || ngo.verificationStatus || ""
        ).trim().toLowerCase();

        return status === "verified";
    });

    // Update summary cards.
    setText("reviewCount", pending.length);
    setText("verifiedCount", verified.length);
    setText("verifiedNgoCount", verifiedNGOs.length);
    setText("coordinationCount", coordinating.length);

    // Update section badges.
    setText(
        "reviewBadge",
        `${pending.length} awaiting review`
    );

    setText(
        "coordinationBadge",
        `${coordinating.length} active`
    );

    setText(
        "ngoNetworkBadge",
        `${verifiedNGOs.length} verified`
    );
}

/* ============================================================
   SIDEBAR COUNTS
============================================================ */

function updateSidebarCounts() {

    const requests =
        readRequests();


    const ngos =
        readNGOs();

    const pendingRequests =
    requests.filter(request => {
        const status = String(request.status || "")
            .trim()
            .toLowerCase();

        return (
            (status === "pending" ||
             status === "pending verification") &&
            request.verified !== true
        );
    });

    const coordinating =
        requests.filter(
            request =>
                [
                    "ngo_notified",
                    "coordinating",
                    "assistance_confirmed"
                ].includes(
                    request.status
                )
        );


    const pendingNGOs =
        ngos.filter(
            ngo =>
                String(
                    ngo.status ||
                    ""
                )
                .toLowerCase()
                .trim() ===
                "pending"
        );


    const flagged =
        requests.filter(
            request =>
                request.status ===
                "flagged"
        );


    setText(
        "sideReviewCount",
        pendingRequests.length
    );


    setText(
        "sideCoordinationCount",
        coordinating.length
    );


    setText(
        "sideNgoCount",
        pendingNGOs.length
    );


    setText(
        "sideAlertCount",
        flagged.length
    );


    try {

        const messages =
            JSON.parse(
                localStorage.getItem(
                    "relief_contact_messages"
                ) || "[]"
            );


        setText(
            "sideMessageCount",
            messages.filter(
                message =>
                    message.read !== true
            ).length
        );

    }
    catch (error) {

        setText(
            "sideMessageCount",
            0
        );

    }

}


/* ============================================================
   MAP
============================================================ */

let coordinationMap =
    null;


function initializeCoordinationMap() {

    const element =
        document.getElementById(
            "coordinationMap"
        );


    if (
        !element ||
        typeof L ===
            "undefined"
    ) {

        return;

    }


    if (
        coordinationMap
    ) {

        coordinationMap.remove();

        coordinationMap =
            null;

    }


    coordinationMap =
        L.map(
            element
        )
        .setView(
            [22.5,79],
            5
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            maxZoom: 18,
            attribution:
                "&copy; OpenStreetMap contributors"
        }
    )
    .addTo(
        coordinationMap
    );


    renderCoordinationMap();

}


function renderCoordinationMap() {

    if (
        !coordinationMap
    ) {

        return;

    }


    coordinationMap.eachLayer(
        layer => {

            if (
                layer instanceof
                    L.TileLayer
            ) {

                return;

            }


            coordinationMap.removeLayer(
                layer
            );

        }
    );


    const requests =
        readRequests()
            .filter(
                request =>
                    request.verified === true
            );


    
const localNGOs = readNGOs();
const backendNGOs = Array.isArray(window.controlRoomNGOs)
    ? window.controlRoomNGOs
    : [];

const ngoMap = new Map();

[...backendNGOs, ...localNGOs].forEach(ngo => {
    const id = String(
        ngo.mongoId || ngo._id || ngo.id || ""
    ).trim();

    if (!id) return;

    const existing = ngoMap.get(id);

    ngoMap.set(
        id,
        existing ? { ...existing, ...ngo } : ngo
    );
});

const ngos = [...ngoMap.values()].filter(ngo =>
    String(ngo.status || ngo.verificationStatus || "")
        .trim()
        .toLowerCase() === "verified"
);



    const bounds = [];


    /*
     * Individual markers
     */

    requests.forEach(
        request => {

            const lat =
                getLat(
                    request
                );


            const lng =
                getLng(
                    request
                );


            if (
                lat === null ||
                lng === null
            ) {

                return;

            }


            const icon =
                L.divIcon(
                    {
                        className:
                            "coordination-map-icon",

                        html:
                            `
                                <div
                                    style="
                                        width:42px;
                                        height:42px;
                                        display:grid;
                                        place-items:center;
                                        background:#b43b32;
                                        border:3px solid white;
                                        border-radius:50%;
                                        color:white;
                                        font-size:19px;
                                        box-shadow:
                                            0 3px 12px
                                            rgba(0,0,0,.3);
                                    "
                                >
                                    👤
                                </div>
                            `,

                        iconSize:
                            [42,42],

                        iconAnchor:
                            [21,42],

                        popupAnchor:
                            [0,-42]

                    }
                );


            L.marker(
                [
                    lat,
                    lng
                ],
                {
                    icon
                }
            )
            .addTo(
                coordinationMap
            )
            .bindPopup(
                `

                    <strong>
                        VERIFIED INDIVIDUAL REQUEST
                    </strong>

                    <br><br>

                    <strong>
                        ${safe(
                            getLocationName(
                                request
                            )
                        )}
                    </strong>

                    <br>

                    Request:
                    ${safe(
                        getRequestId(
                            request
                        )
                    )}

                    <br>

                    People affected:
                    ${getPeopleAffected(
                        request
                    )}

                    <br>

                    Relief:
                    ${safe(
                        getReliefNeeded(
                            request
                        )
                    )}

                `
            );


            bounds.push(
                [
                    lat,
                    lng
                ]
            );

        }
    );


    /*
     * NGO markers
     */

    ngos.forEach(
        ngo => {

            const lat =
                getLat(
                    ngo
                );


            const lng =
                getLng(
                    ngo
                );


            if (
                lat === null ||
                lng === null
            ) {

                return;

            }


            const icon =
                L.divIcon(
                    {
                        className:
                            "coordination-map-icon",

                        html:
                            `
                                <div
                                    style="
                                        width:44px;
                                        height:44px;
                                        display:grid;
                                        place-items:center;
                                        background:#2f7a4a;
                                        border:3px solid white;
                                        border-radius:9px;
                                        color:white;
                                        font-size:20px;
                                        box-shadow:
                                            0 3px 12px
                                            rgba(0,0,0,.3);
                                    "
                                >
                                    🏠
                                </div>
                            `,

                        iconSize:
                            [44,44],

                        iconAnchor:
                            [22,44],

                        popupAnchor:
                            [0,-44]

                    }
                );


            L.marker(
                [
                    lat,
                    lng
                ],
                {
                    icon
                }
            )
            .addTo(
                coordinationMap
            )
            .bindPopup(
                `

                    <strong>
                        🏠
                        ${safe(
                            ngo.name ||
                            "Verified NGO"
                        )}
                    </strong>

                    <br><br>

                    ✓ Verified

                    <br>

                    Location:
                    ${safe(
                        [
                            ngo.city,
                            ngo.state
                        ]
                        .filter(Boolean)
                        .join(", ")
                    )}

                    <br>

                    Services:
                    ${safe(
                        formatServices(
                            ngo.services
                        )
                    )}

                    <br>

                    Operating radius:
                    ${
                        Number(
                            ngo.operatingRadiusKm ||
                            ngo.operatingRadius ||
                            0
                        )
                    }
                    km

                `
            );


            bounds.push(
                [
                    lat,
                    lng
                ]
            );

        }
    );


    /*
     * Active NGO response lines
     */

    requests.forEach(
        request => {

            const requestLat =
                getLat(
                    request
                );


            const requestLng =
                getLng(
                    request
                );


            if (
                requestLat === null ||
                requestLng === null
            ) {

                return;

            }


            const responses =
                getNGOResponses(
                    request
                );


            responses.forEach(
                response => {

                    const ngo =
                        ngos.find(
                            item =>
                                String(
                                    item.id
                                ) ===
                                String(
                                    response.ngoId
                                )
                        );


                    if (!ngo) {
                        return;
                    }


                    const ngoLat =
                        getLat(
                            ngo
                        );


                    const ngoLng =
                        getLng(
                            ngo
                        );


                    if (
                        ngoLat === null ||
                        ngoLng === null
                    ) {

                        return;

                    }


                    L.polyline(
                        [
                            [
                                requestLat,
                                requestLng
                            ],
                            [
                                ngoLat,
                                ngoLng
                            ]
                        ],
                        {
                            color:
                                "#071525",

                            weight:
                                2,

                            dashArray:
                                "7,7",

                            opacity:
                                .65
                        }
                    )
                    .addTo(
                        coordinationMap
                    );

                }
            );

        }
    );


    if (
        bounds.length
    ) {

        coordinationMap.fitBounds(
            bounds,
            {
                padding:
                    [40,40],

                maxZoom:
                    11
            }
        );

    }
    else {

        coordinationMap.setView(
            [22.5,79],
            5
        );

    }


    setTimeout(
        () => {

            coordinationMap.invalidateSize();

        },
        100
    );

}


/* ============================================================
   RENDER ALL
============================================================ */

function renderAll() {

    renderStatistics();

    renderReviewQueue();

    renderCoordinationQueue();

    // NEW: Render NGO Assistance Tracking section
    renderAssistanceTracking();

    renderAlerts();

    renderNGOs();

    updateSidebarCounts();

    if (coordinationMap) {

        renderCoordinationMap();

    }

    if (
        typeof window.renderContactMessages ===
        "function"
    ) {

        window.renderContactMessages();

    }

}


/* ============================================================
   CONTROL MESSAGE
============================================================ */

function showControlMessage(
    message,
    isError = false
) {

    const element =
        document.getElementById(
            "controlMessage"
        );


    if (!element) {

        alert(
            message
        );

        return;

    }


    element.textContent =
        message;


    element.classList.toggle(
        "show",
        true
    );


    element.classList.toggle(
        "error",
        Boolean(isError)
    );


    clearTimeout(
        window.__controlMessageTimer
    );


    window.__controlMessageTimer =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            5000
        );

}


/* ============================================================
   STORAGE EVENT
============================================================ */

window.addEventListener(
    "storage",
    event => {

        if (
            [
                "relief_requests",
                "drr_ngos",
                "relief_contact_messages"
            ]
            .includes(
                event.key
            )
        ) {

            renderAll();

        }

    }
);


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // Do not create fake/sample requests.
        loadControlRoomRequests();
        loadControlRoomNGOs();

        const showDeliveredToggle = document.getElementById(
    "showDeliveredAssistance"
);

if (showDeliveredToggle) {
    showDeliveredToggle.addEventListener(
        "change",
        renderAssistanceTracking
    );
}

        // Refresh the review queue every 30 seconds.
        window.setInterval(() => {
    loadControlRoomRequests();
}, 30000);

        // Initialize map after Leaflet has loaded.
        if (typeof L !== "undefined") {
            initializeCoordinationMap();
        }

        // Keep the sidebar on Dashboard on the first visit.
        if (!document.body.dataset.crView) {
            document.body.dataset.crView = "dashboard";
        }

    }
);
