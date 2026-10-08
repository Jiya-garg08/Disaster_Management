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

    try {

        const value =
            JSON.parse(
                localStorage.getItem(
                    "relief_requests"
                ) || "[]"
            );


        return Array.isArray(value)
            ? value
            : [];

    }
    catch (error) {

        console.error(
            "Unable to read emergency requests:",
            error
        );

        return [];

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

function getPriorityScore(
    request
) {

    const people =
        getPeopleAffected(
            request
        );


    const days =
        getWithoutSupply(
            request
        );


    let score =
        50;


    score +=
        Math.min(
            people * 2,
            30
        );


    score +=
        Math.min(
            days * 8,
            20
        );


    return Math.min(
        score,
        100
    );

}


function getPriority(
    request
) {

    const score =
        getPriorityScore(
            request
        );


    if (score >= 80) {

        return {
            label: "URGENT",
            cls: "urgent"
        };

    }


    if (score >= 60) {

        return {
            label: "HIGH",
            cls: "high"
        };

    }


    return {
        label: "NORMAL",
        cls: "normal"
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

function createReviewCard(
    request
) {

    const priority =
        getPriority(
            request
        );


    const evidence =
        hasEvidence(
            request
        );


    const id =
        getRequestId(
            request
        );


    const reporter =
        getReporterName(
            request
        );


    const lat =
        getLat(
            request
        );


    const lng =
        getLng(
            request
        );


    const location =
        getLocationName(
            request
        );


    return `

        <article class="request-card">

            <div class="request-head">

                <div>

                    <div class="request-id">

                        ${safe(id)}

                        <span
                            class="
                                priority
                                ${priority.cls}
                            "
                        >
                            ${priority.label}
                        </span>

                    </div>


                    <h3 class="request-title">

                        ${safe(location)}

                    </h3>


                    <div class="request-location">

                        📍
                        ${
                            lat !== null
                                ? lat.toFixed(5)
                                : "—"
                        },
                        ${
                            lng !== null
                                ? lng.toFixed(5)
                                : "—"
                        }

                    </div>

                </div>


                <div class="urgency-box">

                    <span>
                        URGENCY
                    </span>

                    <strong>
                        ${getPriorityScore(request)}
                    </strong>

                </div>

            </div>


            ${requestDetails(request)}


            <div class="reporter-row">

                <div class="reporter-avatar">

                    ${
                        safe(
                            reporter
                                .charAt(0)
                                .toUpperCase()
                        )
                    }

                </div>


                <div class="reporter-main">

                    <strong>
                        ${safe(reporter)}
                    </strong>

                    <span>

                        ${
                            safe(
                                request.reporterType ||
                                "Affected Person"
                            )
                        }

                        ·

                        ${
                            safe(
                                request.contactNumber ||
                                request.phone ||
                                "No contact"
                            )
                        }

                    </span>

                </div>

            </div>


            <div class="situation">

                <div class="situation-label">
                    SITUATION DETAILS
                </div>

                <p>

                    ${safe(
                        request.situationDetails ||
                        request.description ||
                        "No details provided."
                    )}

                </p>

            </div>


            <div class="verification-row">

                <div class="status-main">

                    <span>
                        VERIFICATION
                    </span>

                    <strong>
                        ⚠ Verification pending
                    </strong>

                </div>


                <button
                    type="button"
                    class="btn btn-light"
                    onclick="
                        viewEvidence(
                            '${jsArg(id)}'
                        )
                    "
                    ${
                        evidence
                            ? ""
                            : "disabled"
                    }
                >

                    📷

                    ${
                        evidence
                            ? "View evidence"
                            : "No evidence"
                    }

                </button>

            </div>


            <div class="actions">

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="
                        verifyRequest(
                            '${jsArg(id)}'
                        )
                    "
                    ${
                        evidence
                            ? ""
                            : "disabled"
                    }
                >

                    ✓ VERIFY REQUEST

                </button>


                ${
                    evidence
                        ? ""
                        : `
                            <span
                                style="
                                    font-size:9px;
                                    color:#9a6a00;
                                "
                            >
                                Evidence photo is required
                                before verification.
                            </span>
                        `
                }

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


    list.innerHTML =
        requests
            .map(
                createReviewCard
            )
            .join("");

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


/* ============================================================
   VERIFY REQUEST
============================================================ */

function verifyRequest(
    id
) {

    const requests =
        readRequests();


    const request =
        requests.find(
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


    if (
        request.verified === true
    ) {

        showControlMessage(
            "This request is already verified."
        );

        return;

    }


    if (
        !hasEvidence(
            request
        )
    ) {

        showControlMessage(
            "Verification requires the submitted evidence photo.",
            true
        );

        return;

    }


    request.verified =
        true;


    request.verificationStatus =
        "verified";


    request.verifiedAt =
        Date.now();


    request.verifiedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    /*
     * Verification does NOT automatically
     * notify an NGO.
     */

    request.status =
        "pending";


    request.ngoNotificationStatus =
        request.ngoNotificationStatus ||
        "not_notified";


    writeRequests(
        requests
    );


    renderAll();


    showControlMessage(
        `✓ ${id} verified. Verified NGO information is now unlocked for the individual dashboard.`
    );

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

function createCoordinationCard(
    request
) {

    const id =
        getRequestId(
            request
        );


    const responses =
        getNGOResponses(
            request
        );


    const notified =
        request.ngoNotificationStatus ===
        "notified";


    return `

        <article class="request-card">

            <div class="request-head">

                <div>

                    <div class="request-id">

                        ${safe(id)}

                    </div>


                    <h3 class="request-title">

                        ${safe(
                            getLocationName(
                                request
                            )
                        )}

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

                    <span>
                        URGENCY
                    </span>

                    <strong>
                        ${getPriorityScore(request)}
                    </strong>

                </div>

            </div>


            ${requestDetails(request)}


            <div class="verification-row verified">

                <div class="status-main">

                    <span>
                        REQUEST STATUS
                    </span>

                    <strong>
                        ✓ Verified
                    </strong>

                </div>


                <button
                    type="button"
                    class="btn btn-light"
                    onclick="
                        viewEvidence(
                            '${jsArg(id)}'
                        )
                    "
                    ${
                        hasEvidence(request)
                            ? ""
                            : "disabled"
                    }
                >

                    📷 View evidence

                </button>

            </div>


            ${
                !notified

                    ?

                    `

                        <div class="coordination-wrap">

                            <div
                                class="coordination-head"
                            >

                                <h3>
                                    Notify NGO network
                                </h3>

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
                                class="
                                    btn
                                    btn-green
                                "
                                onclick="
                                    notifyNGONetwork(
                                        '${jsArg(id)}'
                                    )
                                "
                            >

                                🔔
                                NOTIFY NGO NETWORK

                            </button>

                        </div>

                    `

                    :

                    `

                        <div
                            class="coordination-wrap"
                        >

                            <div
                                class="coordination-state"
                            >

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

                                <h3>
                                    NGO responses
                                </h3>

                                <p>
                                    NGOs independently decide
                                    whether they can help.
                                </p>

                            </div>


                            ${
                                responses.length

                                    ?

                                    `

                                        <div
                                            class="match-list"
                                        >

                                            ${
                                                responses
                                                    .map(
                                                        response => `

                                                            <div
                                                                class="ngo-match"
                                                            >

                                                                <h4>

                                                                    🏠

                                                                    ${
                                                                        safe(
                                                                            response.ngoName ||
                                                                            response.name ||
                                                                            "Verified NGO"
                                                                        )
                                                                    }

                                                                </h4>


                                                                <div
                                                                    class="match-meta"
                                                                >

                                                                    ✓ Will help

                                                                </div>

                                                            </div>

                                                        `
                                                    )
                                                    .join("")
                                            }

                                        </div>

                                    `

                                    :

                                    `

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


function hasNGODocument(
    ngo,
    type
) {

    if (
        type ===
        "registration"
    ) {

        return Boolean(
            getDocumentData(
                ngo.registrationCertificate
            )
        );

    }


    if (
        type ===
        "pan"
    ) {

        return Boolean(
            getDocumentData(
                ngo.panDocument
            )
        );

    }


    return false;

}


/* ============================================================
   NGO DOCUMENT VIEWER
============================================================ */

function viewNGODocument(
    ngoId,
    type
) {

    const ngo =
        readNGOs()
            .find(
                item =>
                    String(item.id) ===
                    String(ngoId)
            );


    if (!ngo) {

        showControlMessage(
            "NGO could not be found.",
            true
        );

        return;

    }


    const documentData =
        type === "registration"
            ? getDocumentData(
                ngo.registrationCertificate
            )
            : getDocumentData(
                ngo.panDocument
            );


    if (!documentData) {

        showControlMessage(
            "This document is not available.",
            true
        );

        return;

    }


    closeNGODocument();


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "ngoDocumentOverlay";


    overlay.style.cssText = `

        position:fixed;
        inset:0;
        z-index:100002;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        background:rgba(7,21,37,.82);
        backdrop-filter:blur(6px);

    `;


    overlay.innerHTML = `

        <div
            style="
                width:min(900px,95vw);
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
                            color:#2f7a4a;
                            font-size:9px;
                            font-weight:800;
                            letter-spacing:.1em;
                            text-transform:uppercase;
                        "
                    >
                        NGO document
                    </div>

                    <h2
                        style="
                            margin:5px 0 0;
                            font-family:Fraunces,Georgia,serif;
                            font-size:24px;
                        "
                    >
                        ${
                            type === "registration"
                                ? "Registration Certificate"
                                : "PAN Document"
                        }
                    </h2>

                </div>


                <button
                    type="button"
                    class="btn btn-light"
                    onclick="closeNGODocument()"
                >
                    CLOSE
                </button>

            </div>


            <img
                src="${documentData}"
                alt="NGO document"
                style="
                    display:block;
                    width:100%;
                    max-height:72vh;
                    object-fit:contain;
                    background:#f0ece4;
                    border-radius:9px;
                "
            >

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

                closeNGODocument();

            }

        }
    );

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

function updateNGOChecklist(
    ngoId,
    field,
    value
) {

    const ngos =
        readNGOs();


    const ngo =
        ngos.find(
            item =>
                String(item.id) ===
                String(ngoId)
        );


    if (!ngo) {
        return;
    }


    if (
        !ngo.verificationChecklist ||
        typeof ngo.verificationChecklist !==
            "object"
    ) {

        ngo.verificationChecklist = {};

    }


    ngo.verificationChecklist[
        field
    ] =
        Boolean(value);


    writeNGOs(
        ngos
    );


    renderNGOs();

}


/* ============================================================
   VERIFY NGO
============================================================ */

function verifyNGO(
    ngoId
) {

    const ngos =
        readNGOs();


    const ngo =
        ngos.find(
            item =>
                String(item.id) ===
                String(ngoId)
        );


    if (!ngo) {

        showControlMessage(
            "NGO could not be found.",
            true
        );

        return;

    }


    if (
        !hasNGODocument(
            ngo,
            "registration"
        ) ||
        !hasNGODocument(
            ngo,
            "pan"
        )
    ) {

        showControlMessage(
            "Registration certificate and PAN document are required before NGO verification.",
            true
        );

        return;

    }


    if (
        !ngo.verificationChecklist ||
        !ngo.verificationChecklist.registrationReviewed ||
        !ngo.verificationChecklist.panReviewed ||
        !ngo.verificationChecklist.documentsReviewed
    ) {

        showControlMessage(
            "Please review all NGO documents before verification.",
            true
        );

        return;

    }


    ngo.status =
        "verified";


    ngo.verificationStatus =
        "verified";


    ngo.verifiedAt =
        Date.now();


    ngo.verifiedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    writeNGOs(
        ngos
    );


    renderAll();


    showControlMessage(
        `✓ ${ngo.name || ngoId} has been verified and added to the NGO network.`
    );

}


/* ============================================================
   REJECT NGO
============================================================ */

function rejectNGO(
    ngoId
) {

    const ngos =
        readNGOs();


    const ngo =
        ngos.find(
            item =>
                String(item.id) ===
                String(ngoId)
        );


    if (!ngo) {

        showControlMessage(
            "NGO could not be found.",
            true
        );

        return;

    }


    ngo.status =
        "rejected";


    ngo.verificationStatus =
        "rejected";


    ngo.rejectedAt =
        Date.now();


    ngo.rejectedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    writeNGOs(
        ngos
    );


    renderAll();


    showControlMessage(
        `NGO ${ngo.name || ngoId} has been rejected.`
    );

}


/* ============================================================
   VERIFIED NGO CARD
============================================================ */

function createVerifiedNGOCard(
    ngo
) {

    const radius =
        Number(
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

                🏠

                ${safe(
                    ngo.name ||
                    "Verified NGO"
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
                        PAN
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
                        OPERATING RADIUS
                    </span>

                    <strong>
                        ${
                            radius > 0
                                ? radius + " km"
                                : "Not specified"
                        }
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


            <div
                style="
                    margin-top:14px;
                    padding:10px;
                    border-radius:8px;
                    background:#eef8f1;
                    color:#2f7a4a;
                    font-size:9px;
                    font-weight:800;
                "
            >

                ✓ VERIFIED RELIEF PARTNER

            </div>

        </article>

    `;

}


/* ============================================================
   NGO RENDER
============================================================ */

function renderNGOs() {

    const ngos =
        readNGOs();


    const pending =
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


    const verified =
        ngos.filter(
            ngo =>
                String(
                    ngo.status ||
                    ""
                )
                .toLowerCase()
                .trim() ===
                "verified"
        );


    setText(
        "ngoPendingCount",
        `${pending.length} pending`
    );


    setText(
        "ngoNetworkBadge",
        `${verified.length} verified`
    );


    const pendingList =
        document.getElementById(
            "ngoVerificationList"
        );


    const verifiedList =
        document.getElementById(
            "verifiedNgoList"
        );


    if (pendingList) {

        pendingList.innerHTML =
            pending.length
                ?

                pending
                    .map(
                        createPendingNGOCard
                    )
                    .join("")

                :

                emptyState(
                    "✓",
                    "No NGOs are currently awaiting verification."
                );

    }


    if (verifiedList) {

        verifiedList.innerHTML =
            verified.length
                ?

                verified
                    .map(
                        createVerifiedNGOCard
                    )
                    .join("")

                :

                emptyState(
                    "—",
                    "No verified NGOs are available yet."
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

    const requests =
        readRequests();


    const ngos =
        readNGOs();


    const pending =
        requests.filter(
            request =>
                request.verified !== true
        );


    const verified =
        requests.filter(
            request =>
                request.verified === true
        );


    const coordinating =
        requests.filter(
            request =>
                request.status ===
                    "ngo_notified" ||

                request.status ===
                    "coordinating" ||

                request.status ===
                    "assistance_confirmed"
        );


    const verifiedNGOs =
        ngos.filter(
            ngo =>
                String(
                    ngo.status ||
                    ""
                )
                .toLowerCase()
                .trim() ===
                "verified"
        );


    setText(
        "reviewCount",
        pending.length
    );


    setText(
        "verifiedCount",
        verified.length
    );


    setText(
        "verifiedNgoCount",
        verifiedNGOs.length
    );


    setText(
        "coordinationCount",
        coordinating.length
    );


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
        requests.filter(
            request =>
                request.verified !== true
        );


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


    const ngos =
        readNGOs()
            .filter(
                ngo =>
                    String(
                        ngo.status ||
                        ""
                    )
                    .toLowerCase()
                    .trim() ===
                    "verified"
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

    renderAlerts();

    renderNGOs();

    updateSidebarCounts();


    if (
        coordinationMap
    ) {

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

        /*
         * Do not create fake/sample requests.
         */

        renderAll();


        /*
         * Initialize map after Leaflet
         * has loaded.
         */

        if (
            typeof L !==
            "undefined"
        ) {

            initializeCoordinationMap();

        }


        /*
         * Keep the sidebar on Dashboard
         * on the first visit.
         */

        if (
            !document.body.dataset.crView
        ) {

            document.body.dataset.crView =
                "dashboard";

        }

    }
);
