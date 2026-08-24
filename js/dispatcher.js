/* ============================================================
   dispatcher.js
   Relief Resolver — Control Room

   WORKFLOW

   Individual submits request
          ↓
   Control Room reviews evidence
          ↓
   Control Room verifies request
          ↓
   Individual dashboard unlocks NGO information
          ↓
   Control Room can notify NGO network
          ↓
   Verified NGOs see the request
          ↓
   NGOs independently decide whether to help

   IMPORTANT:
   Control Room does NOT select an NGO.
   ============================================================ */


document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderAll();

    }
);


/* ============================================================
   STORAGE
   ============================================================ */

function readRequests() {

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
            "Unable to read requests:",
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
        JSON.stringify(requests)
    );

}


function readNGOs() {

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
            "Unable to read NGOs:",
            error
        );

        return [];

    }

}


function saveNGOs(
    ngos
) {

    localStorage.setItem(
        "drr_ngos",
        JSON.stringify(ngos)
    );

}


/* ============================================================
   HELPERS
   ============================================================ */

function safe(
    value
) {

    return String(
        value ?? ""
    )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function jsArg(
    value
) {

    return String(
        value ?? ""
    )
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");

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


function showControlMessage(
    message,
    error = false
) {

    const element =
        document.getElementById(
            "controlMessage"
        );


    if (!element) {

        alert(message);
        return;

    }


    element.textContent =
        message;


    element.style.display =
        "block";


    element.style.background =
        error
            ? "#fff0ed"
            : "#edf7ef";


    element.style.color =
        error
            ? "#9c342b"
            : "#276b3f";


    setTimeout(
        () => {

            element.style.display =
                "none";

        },
        4500
    );

}


function emptyState(
    icon,
    message
) {

    return `

        <div style="
            padding:30px;
            text-align:center;
            color:#64758a;
            background:#faf8f3;
            border:1px solid #e2ddd3;
            border-radius:12px;
        ">

            <div style="
                width:42px;
                height:42px;
                margin:0 auto 12px;
                border-radius:50%;
                background:#f0ece4;
                display:flex;
                align-items:center;
                justify-content:center;
                font-weight:800;
                color:#071525;
            ">
                ${safe(icon)}
            </div>

            ${safe(message)}

        </div>

    `;

}


function firstValue(
    ...values
) {

    for (
        const value
        of values
    ) {

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


/* ============================================================
   REQUEST FIELD NORMALIZATION
   ============================================================ */

function getPeopleAffected(
    request
) {

    return firstValue(
        request.peopleAffected,
        request.affectedPeople,
        request.victims,
        request.numberOfPeople,
        request.people
    ) ?? "—";

}


function getWithoutSupply(
    request
) {

    return firstValue(
        request.withoutSupply,
        request.daysWithoutSupply,
        request.waitingTime,
        request.daysWithoutRelief
    ) ?? "—";

}


function getReliefNeeded(
    request
) {

    return firstValue(
        request.reliefNeeded,
        request.reliefType,
        request.supplyType,
        request.suppliesNeeded,
        request.serviceNeeded
    ) ?? "Relief support";

}


function getReporterName(
    request
) {

    return firstValue(
        request.reporterName,
        request.submittedByName,
        request.name
    ) || "Affected Person";

}


function getLocationName(
    request
) {

    return firstValue(
        request.shelterName,
        request.locationName,
        request.city
    ) || "Affected location";

}


/* ============================================================
   EVIDENCE
   ============================================================ */

function hasEvidence(
    request
) {

    return (
        typeof request?.verificationPhoto ===
            "string" &&

        request.verificationPhoto
            .startsWith(
                "data:image/"
            )
    );

}


/* ============================================================
   PRIORITY
   ============================================================ */

function getPriorityScore(
    request
) {

    const people =
        Number(
            getPeopleAffected(request)
        ) || 0;


    const days =
        Number(
            firstValue(
                request.daysWithoutSupply,
                request.withoutSupply
            ) || 0
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
                    ${safe(
                        getPeopleAffected(request)
                    )}
                </strong>

            </div>


            <div class="detail">

                <span>
                    WITHOUT SUPPLY
                </span>

                <strong>
                    ${safe(
                        getWithoutSupply(request)
                    )}
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
                            status === "pending" ||
                            status ===
                                "pending verification" ||
                            status === ""
                        )
                    );

                }
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
   REVIEW CARD
   ============================================================ */

function createReviewCard(
    request
) {

    const priority =
        getPriority(request);


    const evidence =
        hasEvidence(request);


    return `

        <article class="request-card">

            <div class="request-head">

                <div>

                    <div class="request-id">

                        ${safe(
                            request.id ||
                            request.requestNumber
                        )}

                        <span class="
                            priority
                            ${priority.cls}
                        ">
                            ${priority.label}
                        </span>

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

                        ${safe(
                            request.lat ??
                            request.latitude ??
                            "—"
                        )},

                        ${safe(
                            request.lng ??
                            request.longitude ??
                            "—"
                        )}

                    </div>

                </div>


                <div class="urgency-box">

                    <span>
                        URGENCY
                    </span>

                    <strong>
                        ${getPriorityScore(
                            request
                        )}
                    </strong>

                </div>

            </div>


            ${requestDetails(request)}


            <div class="reporter-row">

                <div class="reporter-avatar">

                    ${safe(
                        getReporterName(
                            request
                        )
                        .charAt(0)
                        .toUpperCase()
                    )}

                </div>


                <div class="reporter-main">

                    <strong>
                        ${safe(
                            getReporterName(
                                request
                            )
                        )}
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
                            '${jsArg(
                                request.id ||
                                request.requestNumber
                            )}'
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
                            '${jsArg(
                                request.id ||
                                request.requestNumber
                            )}'
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
                            <span style="
                                font-size:10px;
                                color:#9a6a00;
                            ">
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
   VERIFY REQUEST

   IMPORTANT:
   Verification unlocks NGO information on the
   Individual Dashboard.

   Verification DOES NOT choose an NGO.
   Verification DOES NOT notify NGOs automatically.
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
                    item.id ||
                    item.requestNumber
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
        !hasEvidence(request)
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
     * Keep the request in the Control Room coordination
     * workflow. The request is verified, but NGO notification
     * is a separate action.
     */

    request.status =
        "pending";


    /*
     * Explicitly record that NGO network has not yet
     * been notified.
     */

    request.ngoNotificationStatus =
        request.ngoNotificationStatus ||
        "not_notified";


    writeRequests(
        requests
    );


    renderAll();


    showControlMessage(
        `✓ ${id} verified. The individual's dashboard can now show verified NGOs.`
    );

}


/* ============================================================
   NOTIFY NGO NETWORK

   This does NOT select an NGO.

   It simply publishes the verified request to the
   verified NGO network.

   NGO dashboards should use:

       request.verified === true

   AND

       request.ngoNotificationStatus === "notified"

   to show this request.
   ============================================================ */

/* ============================================================
   NGO NOTIFICATION WORKFLOW
   ============================================================

   WORKFLOW:

   Control Room verifies request
              ↓
   Control Room clicks Notify NGO Network
              ↓
   Confirmation modal
              ↓
   Confirm
              ↓
   Request becomes NGO-notified
              ↓
   Verified NGOs can see request
              ↓
   NGOs independently decide whether to help

   IMPORTANT:
   Control Room DOES NOT select an NGO.
   ============================================================ */


/* ============================================================
   OPEN NGO NOTIFICATION
   ============================================================ */

function notifyNGONetwork(requestId) {

    const requests = readRequests();

    const request = requests.find(
        item =>
            String(
                item.id ||
                item.requestNumber
            ) === String(requestId)
    );


    if (!request) {

        showControlMessage(
            "Emergency request could not be found.",
            true
        );

        return;
    }


    /*
     * NGO notification is allowed ONLY after
     * Control Room verification.
     */

    if (request.verified !== true) {

        showControlMessage(
            "Only verified requests can be sent to NGOs.",
            true
        );

        return;
    }


    /*
     * Prevent duplicate notifications.
     */

    if (
        request.ngoNotificationStatus ===
        "notified"
    ) {

        showControlMessage(
            "This request has already been sent to the NGO network."
        );

        return;
    }


    /*
     * Open custom confirmation popup.
     */

    showNotifyConfirmation(request);

}


/* ============================================================
   NGO NOTIFICATION CONFIRMATION MODAL
   ============================================================ */

function showNotifyConfirmation(request) {

    /*
     * Remove old modal if one already exists.
     */

    const existingModal =
        document.getElementById(
            "notifyNGOModal"
        );


    if (existingModal) {

        existingModal.remove();

    }


    /*
     * Create modal.
     */

    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "notifyNGOModal";


    modal.innerHTML = `

        <div class="notify-modal-backdrop">

            <div class="notify-modal">


                <!-- CLOSE -->

                <button
                    type="button"
                    class="notify-modal-close"
                    onclick="
                        closeNotifyConfirmation()
                    "
                    aria-label="Close"
                >
                    ×
                </button>


                <!-- ICON -->

                <div class="notify-modal-icon">
                    🔔
                </div>


                <!-- EYEBROW -->

                <div class="notify-modal-eyebrow">
                    NGO NETWORK
                </div>


                <!-- TITLE -->

                <h2>
                    Notify verified NGOs?
                </h2>


                <!-- DESCRIPTION -->

                <p class="notify-modal-description">

                    This emergency request will be
                    published to verified NGOs so they
                    can independently decide whether
                    they have the capacity to help.

                </p>


                <!-- REQUEST SUMMARY -->

                <div class="notify-request-summary">


                    <div class="notify-summary-item">

                        <span>
                            REQUEST
                        </span>

                        <strong>
                            ${safe(
                                request.id ||
                                request.requestNumber ||
                                "—"
                            )}
                        </strong>

                    </div>


                    <div class="notify-summary-item">

                        <span>
                            LOCATION
                        </span>

                        <strong>
                            ${safe(
                                getLocationName(
                                    request
                                )
                            )}
                        </strong>

                    </div>


                    <div class="notify-summary-item">

                        <span>
                            RELIEF NEEDED
                        </span>

                        <strong>
                            ${safe(
                                getReliefNeeded(
                                    request
                                )
                            )}
                        </strong>

                    </div>


                </div>


                <!-- INFORMATION NOTE -->

                <div class="notify-modal-note">

                    <span>
                        ✓
                    </span>

                    <p>

                        The Control Room does
                        <strong>
                            not select an NGO.
                        </strong>

                        Every verified NGO can see
                        this request on its dashboard
                        and decide whether it can help.

                    </p>

                </div>


                <!-- ACTIONS -->

                <div class="notify-modal-actions">


                    <button
                        type="button"
                        class="notify-cancel-btn"
                        onclick="
                            closeNotifyConfirmation()
                        "
                    >

                        Cancel

                    </button>


                    <button
                        type="button"
                        class="notify-confirm-btn"
                        onclick="
                            confirmNotifyNGONetwork(
                                '${jsArg(
                                    request.id ||
                                    request.requestNumber
                                )}'
                            )
                        "
                    >

                        🔔
                        Notify NGO Network

                    </button>


                </div>


            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /*
     * Close when clicking outside modal.
     */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target.classList.contains(
                    "notify-modal-backdrop"
                )
            ) {

                closeNotifyConfirmation();

            }

        }
    );


    /*
     * Close with Escape key.
     */

    document.addEventListener(
        "keydown",
        handleNotifyEscape
    );

}


/* ============================================================
   ESCAPE KEY
   ============================================================ */

function handleNotifyEscape(
    event
) {

    if (
        event.key === "Escape"
    ) {

        closeNotifyConfirmation();

    }

}


/* ============================================================
   CLOSE CONFIRMATION MODAL
   ============================================================ */

function closeNotifyConfirmation() {

    const modal =
        document.getElementById(
            "notifyNGOModal"
        );


    if (modal) {

        modal.remove();

    }


    document.removeEventListener(
        "keydown",
        handleNotifyEscape
    );

}


/* ============================================================
   CONFIRM NGO NOTIFICATION
   ============================================================ */

function confirmNotifyNGONetwork(
    requestId
) {

    /*
     * Close popup first.
     */

    closeNotifyConfirmation();


    /*
     * Reload latest request data.
     */

    const requests =
        readRequests();


    const request =
        requests.find(
            item =>
                String(
                    item.id ||
                    item.requestNumber
                ) === String(requestId)
        );


    if (!request) {

        showControlMessage(
            "Emergency request could not be found.",
            true
        );

        return;
    }


    /*
     * Safety check:
     * request MUST be verified.
     */

    if (
        request.verified !== true
    ) {

        showControlMessage(
            "Only verified requests can be sent to NGOs.",
            true
        );

        return;
    }


    /*
     * Prevent duplicate notification.
     */

    if (
        request.ngoNotificationStatus ===
        "notified"
    ) {

        showControlMessage(
            "This request has already been sent to the NGO network."
        );

        return;
    }


    /*
     * IMPORTANT:
     *
     * We are NOT selecting an NGO.
     *
     * We are only publishing the request
     * to the verified NGO network.
     */

    request.ngoNotificationStatus =
        "notified";


    request.ngoNotifiedAt =
        Date.now();


    request.ngoNotifiedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    /*
     * Update request status.
     */

    request.status =
        "ngo_notified";


    /*
     * Make sure NGO response
     * storage exists.
     */

    if (
        !request.ngoResponses ||
        typeof request.ngoResponses !==
            "object" ||
        Array.isArray(
            request.ngoResponses
        )
    ) {

        request.ngoResponses = {};

    }


    /*
     * IMPORTANT:
     *
     * Remove any old automatic NGO
     * assignment fields.
     */

    delete request.assignedNgoId;

    delete request.assignedNgoName;


    /*
     * Save updated request.
     */

    writeRequests(
        requests
    );


    /*
     * Refresh dashboard.
     */

    renderAll();


    /*
     * Show success message.
     */

    showControlMessage(
        `✓ ${
            request.id ||
            request.requestNumber
        } is now published to the verified NGO network.`
    );

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


    if (!requests.length) {

        list.innerHTML =
            emptyState(
                "✓",
                "Verify an emergency request to see it in the coordination queue."
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

function createCoordinationCard(request) {

    const notified =
        request.ngoNotificationStatus === "notified" ||
        request.status === "ngo_notified";

    const responses =
        request.ngoResponses &&
        typeof request.ngoResponses === "object"
            ? Object.values(request.ngoResponses)
            : [];

    return `

        <article class="request-card coordinating-card">

            <!-- =========================
                 REQUEST HEADER
            ========================== -->

            <div class="request-head">

                <div>

                    <div class="request-id">
                        ${safe(
                            request.id ||
                            request.requestNumber ||
                            "REQUEST"
                        )}
                    </div>

                    <h3 class="request-title">
                        ${safe(
                            getLocationName(request)
                        )}
                    </h3>

                    <div class="request-location">
                        📍
                        ${safe(
                            request.lat ??
                            request.latitude ??
                            "—"
                        )},
                        ${safe(
                            request.lng ??
                            request.longitude ??
                            "—"
                        )}
                    </div>

                </div>


                <div class="urgency-box">

                    <span>
                        ${
                            notified
                                ? "NGO NETWORK"
                                : "VERIFIED"
                        }
                    </span>

                    <strong>
                        ${
                            notified
                                ? responses.length
                                : "✓"
                        }
                    </strong>

                </div>

            </div>


            <!-- =========================
                 REQUEST DETAILS
            ========================== -->

            ${requestDetails(request)}


            <!-- =========================
                 BEFORE NGO NOTIFICATION
            ========================== -->

            ${
                !notified

                    ? `

                        <div class="verification-row verified">

                            <div class="status-main">

                                <span>
                                    REQUEST STATUS
                                </span>

                                <strong>
                                    ✓ Verified — ready to notify NGO network
                                </strong>

                            </div>

                        </div>


                        <div
                            class="coordination-wrap"
                            style="
                                margin-top:16px;
                            "
                        >

                            <div class="coordination-head">

                                <div>

                                    <h3>
                                        Notify NGO network
                                    </h3>

                                    <p>
                                        This publishes the verified
                                        request to all eligible
                                        verified NGO dashboards.
                                        No NGO is selected by the
                                        Control Room.
                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                class="btn btn-green"
                                onclick="
                                    notifyNGONetwork(
                                        '${jsArg(
                                            request.id ||
                                            request.requestNumber
                                        )}'
                                    )
                                "
                            >

                                🔔
                                NOTIFY NGO NETWORK →

                            </button>

                        </div>

                    `

                    : `

                        <!-- =========================
                             NGO NETWORK NOTIFIED
                        ========================== -->

                        <div class="coordination-wrap">

                            <div class="coordination-state">

                                <div>

                                    <strong>
                                        🔔 NGO network notified
                                    </strong>

                                    <span>
                                        Verified NGOs can now review
                                        this emergency request.
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


                            <!-- =========================
                                 NGO RESPONSES
                            ========================== -->

                            <div class="coordination-head">

                                <div>

                                    <h3>
                                        NGO responses
                                    </h3>

                                    <p>
                                        NGOs decide independently
                                        whether they can help.
                                    </p>

                                </div>

                            </div>


                            ${
                                responses.length

                                    ? `

                                        <div class="match-list">

                                            ${
                                                responses
                                                    .map(
                                                        response => `

                                                            <div class="ngo-match">

                                                                <h4>
                                                                    🏠
                                                                    ${safe(
                                                                        response.ngoName ||
                                                                        "Verified NGO"
                                                                    )}
                                                                </h4>

                                                                <div class="match-meta">
                                                                    ✓ Will help
                                                                </div>

                                                            </div>

                                                        `
                                                    )
                                                    .join("")
                                            }

                                        </div>

                                    `

                                    : `

                                        <div
                                            style="
                                                padding:18px;
                                                background:#faf8f3;
                                                border:1px solid #e2ddd3;
                                                color:#64758a;
                                                font-size:12px;
                                                line-height:1.6;
                                            "
                                        >

                                            ⏳ No NGO has responded yet.

                                            <br><br>

                                            Verified NGOs can see this
                                            request on their dashboard
                                            and choose whether they
                                            have the capacity to help.

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
   NGO VERIFICATION
   ============================================================ */

function normalizeServices(
    value
) {

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


function formatServices(
    value
) {

    return normalizeServices(value)
        .map(
            service =>
                service.replace(
                    /\b\w/g,
                    char =>
                        char.toUpperCase()
                )
        )
        .join(", ") ||
        "Relief support";

}


function renderNGOs() {

    const ngos =
        readNGOs();


    const pending =
        ngos.filter(
            ngo =>
                String(
                    ngo.status ||
                    ""
                ).toLowerCase() ===
                "pending"
        );


    const verified =
        ngos.filter(
            ngo =>
                String(
                    ngo.status ||
                    ""
                ).toLowerCase() ===
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

                ? pending
                    .map(
                        createPendingNGOCard
                    )
                    .join("")

                : emptyState(
                    "✓",
                    "No NGOs are currently awaiting verification."
                );

    }


    if (verifiedList) {

        verifiedList.innerHTML =
            verified.length

                ? verified
                    .map(
                        createVerifiedNGOCard
                    )
                    .join("")

                : emptyState(
                    "—",
                    "No verified NGOs are available yet."
                );

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


    return (
        documentObject.data ||
        documentObject.url ||
        documentObject.preview ||
        ""
    );

}


function hasNGODocument(
    ngo,
    type
) {

    if (type === "registration") {

        return Boolean(
            getDocumentData(
                ngo.registrationCertificate
            )
        );

    }


    if (type === "pan") {

        return Boolean(
            getDocumentData(
                ngo.panDocument
            )
        );

    }


    return false;

}


/* ============================================================
   PENDING NGO CARD
   ============================================================ */

function createPendingNGOCard(
    ngo
) {

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


    return `

        <article class="ngo-card">

            <div class="ngo-id">
                ${safe(
                    ngo.id ||
                    "NGO"
                )}
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


            <!-- DOCUMENT VERIFICATION -->

            <div style="
                margin-top:18px;
                padding:18px;
                background:#faf8f3;
                border:1px solid #e1dbd0;
                border-radius:10px;
            ">

                <div style="
                    font-size:13px;
                    font-weight:800;
                    margin-bottom:12px;
                ">
                    DOCUMENT VERIFICATION
                </div>


                <div style="
                    display:grid;
                    grid-template-columns:
                        repeat(2,minmax(0,1fr));
                    gap:10px;
                ">

                    <button
                        type="button"
                        class="btn btn-light"
                        onclick="
                            viewNGODocument(
                                '${jsArg(
                                    ngo.id
                                )}',
                                'registration'
                            )
                        "
                        ${
                            registrationAvailable
                                ? ""
                                : "disabled"
                        }
                    >

                        📄

                        ${
                            registrationAvailable
                                ? "VIEW REGISTRATION CERTIFICATE"
                                : "REGISTRATION CERTIFICATE MISSING"
                        }

                    </button>


                    <button
                        type="button"
                        class="btn btn-light"
                        onclick="
                            viewNGODocument(
                                '${jsArg(
                                    ngo.id
                                )}',
                                'pan'
                            )
                        "
                        ${
                            panAvailable
                                ? ""
                                : "disabled"
                        }
                    >

                        🪪

                        ${
                            panAvailable
                                ? "VIEW PAN DOCUMENT"
                                : "PAN DOCUMENT MISSING"
                        }

                    </button>

                </div>


                <label style="
                    display:block;
                    margin-top:15px;
                    font-size:12px;
                    font-weight:700;
                ">

                    <input
                        type="checkbox"
                        onchange="
                            setNGOChecklist(
                                '${jsArg(ngo.id)}',
                                'registrationReviewed',
                                this.checked
                            )
                        "
                        ${
                            checklist.registrationReviewed
                                ? "checked"
                                : ""
                        }
                    >

                    Registration certificate reviewed

                </label>


                <label style="
                    display:block;
                    margin-top:10px;
                    font-size:12px;
                    font-weight:700;
                ">

                    <input
                        type="checkbox"
                        onchange="
                            setNGOChecklist(
                                '${jsArg(ngo.id)}',
                                'panReviewed',
                                this.checked
                            )
                        "
                        ${
                            checklist.panReviewed
                                ? "checked"
                                : ""
                        }
                    >

                    PAN document reviewed

                </label>


                <label style="
                    display:block;
                    margin-top:10px;
                    font-size:12px;
                    font-weight:700;
                ">

                    <input
                        type="checkbox"
                        onchange="
                            setNGOChecklist(
                                '${jsArg(ngo.id)}',
                                'documentsReviewed',
                                this.checked
                            )
                        "
                        ${
                            checklist.documentsReviewed
                                ? "checked"
                                : ""
                        }
                    >

                    All submitted documents appear valid

                </label>

            </div>


            <div class="ngo-actions">

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="
                        verifyNGO(
                            '${jsArg(
                                ngo.id
                            )}'
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
                            '${jsArg(
                                ngo.id
                            )}'
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

function setNGOChecklist(
    id,
    field,
    value
) {

    const ngos =
        readNGOs();


    const ngo =
        ngos.find(
            item =>
                String(item.id) ===
                String(id)
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


    ngo.verificationChecklist[field] =
        value;


    saveNGOs(
        ngos
    );

}


/* ============================================================
   VERIFY NGO
   ============================================================ */

function verifyNGO(
    id
) {

    const ngos =
        readNGOs();


    const ngo =
        ngos.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!ngo) {

        showControlMessage(
            "NGO could not be found.",
            true
        );

        return;

    }


    const checklist =
        ngo.verificationChecklist ||
        {};


    const hasRegistration =
        hasNGODocument(
            ngo,
            "registration"
        );


    const hasPan =
        hasNGODocument(
            ngo,
            "pan"
        );


    /*
     * If documents were uploaded, require them
     * to be reviewed.
     */

    if (
        hasRegistration &&
        checklist.registrationReviewed !== true
    ) {

        showControlMessage(
            "Please review the registration certificate first.",
            true
        );

        return;

    }


    if (
        hasPan &&
        checklist.panReviewed !== true
    ) {

        showControlMessage(
            "Please review the PAN document first.",
            true
        );

        return;

    }


    if (
        (
            hasRegistration ||
            hasPan
        ) &&
        checklist.documentsReviewed !== true
    ) {

        showControlMessage(
            "Please confirm that all submitted documents appear valid.",
            true
        );

        return;

    }


    ngo.status =
        "verified";


    ngo.verifiedAt =
        Date.now();


    ngo.verifiedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    saveNGOs(
        ngos
    );


    renderAll();


    showControlMessage(
        `✓ ${ngo.name} is now a verified relief partner.`
    );

}


/* ============================================================
   REJECT NGO
   ============================================================ */

function rejectNGO(
    id
) {

    const ngos =
        readNGOs();


    const ngo =
        ngos.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!ngo) {

        showControlMessage(
            "NGO could not be found.",
            true
        );

        return;

    }


    if (
        !confirm(
            `Reject ${ngo.name} from the relief network?`
        )
    ) {

        return;

    }


    ngo.status =
        "rejected";


    ngo.rejectedAt =
        Date.now();


    ngo.rejectedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    saveNGOs(
        ngos
    );


    renderAll();


    showControlMessage(
        `NGO ${ngo.name} has been rejected.`
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
                ${safe(
                    ngo.id ||
                    "NGO"
                )}
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
                                ? radius +
                                  " km"
                                : "—"
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        EMAIL
                    </span>

                    <strong>
                        ${safe(
                            ngo.email ||
                            "—"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        STATUS
                    </span>

                    <strong style="
                        color:#2f8b52;
                    ">
                        ✓ VERIFIED
                    </strong>

                </div>

            </div>


            <div class="ngo-services">

                <strong>
                    Available services:
                </strong>

                ${safe(
                    formatServices(
                        ngo.services
                    )
                )}

            </div>

        </article>

    `;

}


/* ============================================================
   NGO DOCUMENT VIEWER
   ============================================================ */

function viewNGODocument(
    id,
    type
) {

    const ngo =
        readNGOs().find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!ngo) {

        showControlMessage(
            "NGO could not be found.",
            true
        );

        return;

    }


    const documentObject =
        type === "registration"
            ? ngo.registrationCertificate
            : ngo.panDocument;


    const data =
        getDocumentData(
            documentObject
        );


    if (!data) {

        showControlMessage(
            "This document was not uploaded.",
            true
        );

        return;

    }


    closeEvidence();


    const title =
        type === "registration"
            ? "Registration Certificate"
            : "PAN Document";


    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "evidenceOverlay";


    overlay.style.cssText = `
        position:fixed;
        inset:0;
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:24px;
        background:rgba(7,21,37,.88);
        backdrop-filter:blur(5px);
    `;


    overlay.innerHTML = `

        <div style="
            position:relative;
            width:min(950px,100%);
            max-height:94vh;
            overflow:auto;
            padding:25px;
            background:#fffdf9;
            border-radius:14px;
            box-shadow:0 30px 100px rgba(0,0,0,.35);
        ">

            <button
                type="button"
                onclick="closeEvidence()"
                style="
                    position:absolute;
                    top:14px;
                    right:14px;
                    width:38px;
                    height:38px;
                    border:0;
                    border-radius:50%;
                    background:#071525;
                    color:#fff;
                    font-size:21px;
                "
            >
                ×
            </button>


            <div style="
                padding-right:55px;
            ">

                <div style="
                    color:#b83d34;
                    font-size:9px;
                    font-weight:800;
                    letter-spacing:1.4px;
                ">
                    NGO DOCUMENT VERIFICATION
                </div>


                <h2 style="
                    margin:7px 0 3px;
                    font-family:Fraunces,Georgia,serif;
                ">
                    ${safe(title)}
                </h2>


                <p style="
                    margin:0 0 18px;
                    color:#64758a;
                    font-size:11px;
                ">
                    ${safe(
                        ngo.name ||
                        "NGO"
                    )}
                    ·
                    ${safe(
                        ngo.id ||
                        ""
                    )}
                </p>

            </div>


            <img
                src="${data}"
                alt="${safe(title)}"
                style="
                    display:block;
                    width:100%;
                    max-height:70vh;
                    object-fit:contain;
                    background:#f0ece4;
                    border:1px solid #ded8cd;
                    border-radius:8px;
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

                closeEvidence();

            }

        }
    );

}


/* ============================================================
   EMERGENCY REQUEST EVIDENCE VIEWER
   ============================================================ */

function viewEvidence(
    id
) {

    const request =
        readRequests().find(
            item =>
                String(
                    item.id ||
                    item.requestNumber
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
        !hasEvidence(request)
    ) {

        showControlMessage(
            "No usable evidence photo is available.",
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
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:24px;
        background:rgba(7,21,37,.88);
    `;


    overlay.innerHTML = `

        <div style="
            position:relative;
            width:min(950px,100%);
            max-height:94vh;
            overflow:auto;
            padding:25px;
            background:#fffdf9;
            border-radius:14px;
        ">

            <button
                type="button"
                onclick="closeEvidence()"
                style="
                    position:absolute;
                    top:14px;
                    right:14px;
                    width:38px;
                    height:38px;
                    border:0;
                    border-radius:50%;
                    background:#071525;
                    color:white;
                    font-size:21px;
                "
            >
                ×
            </button>


            <h2 style="
                margin:0 50px 5px 0;
                font-family:Fraunces,Georgia,serif;
            ">

                ${safe(
                    getLocationName(
                        request
                    )
                )}

            </h2>


            <p style="
                margin:0 0 18px;
                color:#64758a;
                font-size:11px;
            ">

                Verification evidence ·

                ${safe(
                    request.id ||
                    request.requestNumber
                )}

            </p>


            <img
                src="${request.verificationPhoto}"
                alt="Emergency verification evidence"
                style="
                    display:block;
                    width:100%;
                    max-height:70vh;
                    object-fit:contain;
                    background:#f0ece4;
                    border-radius:8px;
                "
            >


            <div style="
                margin-top:15px;
                padding:14px;
                background:#f7f4ed;
                border-radius:8px;
                color:#52606c;
                font-size:11px;
                line-height:1.55;
            ">

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
                ngo.status ===
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
   ALERTS
   ============================================================ */

function renderAlerts() {

    const list =
        document.getElementById(
            "alertList"
        );


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


    if (!list) {
        return;
    }


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

                    <div class="flagged-item">

                        <strong>
                            ${safe(
                                request.id
                            )}
                        </strong>

                        <p>
                            ${safe(
                                getLocationName(
                                    request
                                )
                            )}
                            ·
                            ${safe(
                                getPeopleAffected(
                                    request
                                )
                            )}
                            people affected.
                        </p>

                    </div>

                `
            )
            .join("");

}


// /* ============================================================
//    MAP
//    ============================================================ */

// let coordinationMap =
//     null;


// function getLat(
//     object
// ) {

//     const value =
//         Number(
//             firstValue(
//                 object.lat,
//                 object.latitude,
//                 object.location?.lat,
//                 object.coordinates?.lat
//             )
//         );


//     return Number.isFinite(value)
//         ? value
//         : null;

// }


// function getLng(
//     object
// ) {

//     const value =
//         Number(
//             firstValue(
//                 object.lng,
//                 object.longitude,
//                 object.location?.lng,
//                 object.coordinates?.lng
//             )
//         );


//     return Number.isFinite(value)
//         ? value
//         : null;

// }


// function initializeCoordinationMap() {

//     const element =
//         document.getElementById(
//             "coordinationMap"
//         );


//     if (
//         !element ||
//         typeof L ===
//             "undefined"
//     ) {
//         return;
//     }


//     if (coordinationMap) {

//         coordinationMap.remove();

//     }


//     coordinationMap =
//         L.map(
//             element
//         ).setView(
//             [
//                 22.5,
//                 79
//             ],
//             5
//         );


//     L.tileLayer(
//         "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
//         {
//             maxZoom: 18,
//             attribution:
//                 "&copy; OpenStreetMap contributors"
//         }
//     )
//     .addTo(
//         coordinationMap
//     );


//     renderCoordinationMap();

// }


// function renderCoordinationMap() {

//     if (!coordinationMap) {
//         return;
//     }


//     const requests =
//         readRequests()
//             .filter(
//                 request =>
//                     request.verified === true
//             );


//     const ngos =
//         readNGOs()
//             .filter(
//                 ngo =>
//                     ngo.status ===
//                     "verified"
//             );


//     const bounds = [];


//     requests.forEach(
//         request => {

//             const lat =
//                 getLat(request);


//             const lng =
//                 getLng(request);


//             if (
//                 lat === null ||
//                 lng === null
//             ) {
//                 return;
//             }


//             L.marker([
//                 lat,
//                 lng
//             ])
//             .addTo(
//                 coordinationMap
//             )
//             .bindPopup(`
//                 <strong>
//                     Verified Emergency Request
//                 </strong>
//                 <br><br>
//                 ${safe(
//                     getLocationName(
//                         request
//                     )
//                 )}
//                 <br>
//                 ${safe(
//                     request.id ||
//                     request.requestNumber
//                 )}
//             `);


//             bounds.push([
//                 lat,
//                 lng
//             ]);

//         }
//     );


//     ngos.forEach(
//         ngo => {

//             const lat =
//                 getLat(ngo);


//             const lng =
//                 getLng(ngo);


//             if (
//                 lat === null ||
//                 lng === null
//             ) {
//                 return;
//             }


//             L.marker([
//                 lat,
//                 lng
//             ])
//             .addTo(
//                 coordinationMap
//             )
//             .bindPopup(`
//                 <strong>
//                     🏠
//                     ${safe(
//                         ngo.name ||
//                         "Verified NGO"
//                     )}
//                 </strong>

//                 <br><br>

//                 ✓ Verified

//                 <br>

//                 Services:
//                 ${safe(
//                     formatServices(
//                         ngo.services
//                     )
//                 )}

//                 <br>

//                 Operating radius:
//                 ${
//                     Number(
//                         ngo.operatingRadiusKm ||
//                         ngo.operatingRadius ||
//                         0
//                     )
//                 }
//                 km
//             `);


//             bounds.push([
//                 lat,
//                 lng
//             ]);

//         }
//     );


//     if (bounds.length) {

//         coordinationMap.fitBounds(
//             bounds,
//             {
//                 padding: [35,35],
//                 maxZoom: 10
//             }
//         );

//     }

// }


/* ============================================================
   RENDER ALL
   ============================================================ */

function renderAll() {

    renderStatistics();

    renderReviewQueue();

    renderCoordinationQueue();

    renderAlerts();

    renderNGOs();

    

}


/* ============================================================
   COMPATIBILITY FUNCTIONS
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


function findNGO(
    id
) {

    return readNGOs().find(
        ngo =>
            String(ngo.id) ===
            String(id)
    ) || null;

}


/* ============================================================
   OPTIONAL OLD WORKFLOW FUNCTION

   Kept so old buttons do not break.
   The new workflow does not automatically assign NGOs.
   ============================================================ */

function markNGOOnTheWay(
    requestId
) {

    showControlMessage(
        "NGO selection is handled by the NGO network. The Control Room does not assign an NGO automatically."
    );

}
