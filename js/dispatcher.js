/* ============================================================
   dispatcher.js — Relief Resolver Control Room

   Phase 1:
   - Reads actual requests from localStorage
   - Shows verification status
   - Allows staff to inspect evidence
   - Allows staff to verify requests
   - ONLY verified requests can be dispatched
   - Uses existing priority.js for priority calculation
   - Uses existing storage.js for localStorage
   ============================================================ */


/* ============================================================
   START CONTROL ROOM
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    renderAll();


    const dispatchButton =
        document.getElementById(
            "runDispatchBtn"
        );


    if (dispatchButton) {

        dispatchButton.addEventListener(
            "click",
            runDispatch
        );

    }

});



/* ============================================================
   RENDER EVERYTHING
   ============================================================ */

function renderAll() {

    renderQueue();

    renderAlerts();

    renderFleetIdle();

    renderDispatchLog();

    renderStatistics();

    // NGO verification + verified NGO network
    renderNGOs();

}



/* ============================================================
   STATISTICS
   ============================================================ */

function renderStatistics() {

    const requests =
        getRequests();


    const pending =
        requests.filter(
            (request) =>
                request.status === "pending"
        );


    const verified =
        pending.filter(
            (request) =>
                request.verified === true
        );


    const waitingVerification =
        pending.filter(
            (request) =>
                request.verified !== true
        );


    const dispatched =
        requests.filter(
            (request) =>
                request.status === "dispatched"
        );


    const flagged =
        requests.filter(
            (request) =>
                request.status === "flagged"
        );


    /*
     * These elements are optional.
     * If your HTML doesn't contain them,
     * nothing will break.
     */

    const totalElement =
        document.getElementById(
            "totalRequests"
        );


    const verifiedElement =
        document.getElementById(
            "verifiedRequests"
        );


    const waitingElement =
        document.getElementById(
            "verificationPending"
        );


    const dispatchedElement =
        document.getElementById(
            "dispatchedRequests"
        );


    const flaggedElement =
        document.getElementById(
            "flaggedRequests"
        );


    if (totalElement) {

        totalElement.textContent =
            requests.length;

    }


    if (verifiedElement) {

        verifiedElement.textContent =
            verified.length;

    }


    if (waitingElement) {

        waitingElement.textContent =
            waitingVerification.length;

    }


    if (dispatchedElement) {

        dispatchedElement.textContent =
            dispatched.length;

    }


    if (flaggedElement) {

        flaggedElement.textContent =
            flagged.length;

    }

}



/* ============================================================
   PRIORITY QUEUE
   ============================================================ */

function renderQueue() {

    const requests =
        getRequests().filter(
            (request) =>
                request.status === "pending"
        );


    let sorted =
        requests;


    /*
     * Use priority.js if available.
     */

    if (
        typeof sortByUrgency ===
        "function"
    ) {

        sorted =
            sortByUrgency(
                requests
            );

    }


    const list =
        document.getElementById(
            "queueList"
        );


    const count =
        document.getElementById(
            "queueCount"
        );


    if (!list) {

        return;

    }


    if (count) {

        count.textContent =
            `${sorted.length} pending`;

    }


    if (sorted.length === 0) {

        list.innerHTML = `

            <div class="empty-note">

                ✓ No pending requests.
                The queue is clear.

            </div>

        `;

        return;

    }


    list.innerHTML =
        sorted
            .map(
                (request) =>
                    createRequestCard(
                        request
                    )
            )
            .join("");

}



/* ============================================================
   CREATE REQUEST CARD
   ============================================================ */

function createRequestCard(request) {

    const score =
        typeof calculateUrgencyScore ===
        "function"

            ? calculateUrgencyScore(
                request
            )

            : 0;


    const weight =
        typeof estimateCargoWeightKg ===
        "function"

            ? estimateCargoWeightKg(
                request
            )

            : 0;



    /* ========================================================
       PRIORITY LABEL
       ======================================================== */

    let priority =
        "NORMAL";


    if (score >= 700) {

        priority =
            "CRITICAL";

    }

    else if (score >= 500) {

        priority =
            "HIGH";

    }

    else if (score >= 250) {

        priority =
            "MEDIUM";

    }



    /* ========================================================
       VERIFICATION
       ======================================================== */

    const verified =
        request.verified === true;


    const verificationStatus =
        verified

            ? "✓ VERIFIED"

            : "⚠ VERIFICATION PENDING";


    const verificationClass =
        verified

            ? "verified"

            : "pending";



    /* ========================================================
       REPORTER
       ======================================================== */

    const reporterName =
        request.reporterName ||
        "Unknown reporter";


    const reporterType =
        request.reporterType ||
        "Reporter";


    const contactNumber =
        request.contactNumber ||
        "Not provided";


    const initial =
        reporterName
            .charAt(0)
            .toUpperCase() ||
        "R";



    /* ========================================================
       LOCATION
       ======================================================== */

    const latitude =
        Number.isFinite(
            Number(request.lat)
        )

            ? Number(
                request.lat
            ).toFixed(5)

            : "—";


    const longitude =
        Number.isFinite(
            Number(request.lng)
        )

            ? Number(
                request.lng
            ).toFixed(5)

            : "—";



    /* ========================================================
       SAFE TEXT
       ======================================================== */

    const id =
        escapeHtml(
            request.id ||
            ""
        );


    const shelterName =
        escapeHtml(
            request.shelterName ||
            "Unnamed location"
        );


    const safeReporter =
        escapeHtml(
            reporterName
        );


    const safeReporterType =
        escapeHtml(
            reporterType
        );


    const safeContact =
        escapeHtml(
            contactNumber
        );


    const safeSupply =
        escapeHtml(
            request.supplyType ||
            "Relief required"
        );


    const safeSituation =
        escapeHtml(
            request.situationDetails ||
            "No situation details provided."
        );



    /* ========================================================
       PHOTO AVAILABILITY
       ======================================================== */

    const hasPhoto =
        typeof request.verificationPhoto ===
        "string" &&

        request.verificationPhoto
            .startsWith(
                "data:image/"
            );



    /* ========================================================
       ACTION BUTTONS
       ======================================================== */

    let actionButtons =
        "";


    if (verified) {

        actionButtons = `

            <button
                type="button"
                class="dispatch-btn"
                onclick="dispatchSingleRequest('${id}')"
            >

                🚚 Dispatch Request

            </button>

        `;

    }

    else {

        actionButtons = `

            <button
                type="button"
                class="verify-btn"
                onclick="verifyRequest('${id}')"
            >

                ✓ Verify Request

            </button>


            <button
                type="button"
                class="dispatch-btn disabled"
                disabled
            >

                🔒 Verify Before Dispatch

            </button>

        `;

    }



    /* ========================================================
       CARD
       ======================================================== */

    return `

        <div
            class="request-card"
            data-request-id="${id}"
        >

            <!-- HEADER -->

            <div class="request-card-top">

                <div>

                    <div class="request-id">

                        ${id}

                        <span>
                            · ${priority}
                        </span>

                    </div>


                    <h3>
                        ${shelterName}
                    </h3>


                    <div class="request-location">

                        📍

                        ${latitude},
                        ${longitude}

                    </div>

                </div>


                <div class="score">

                    <span>
                        URGENCY
                    </span>

                    <strong>
                        ${score}
                    </strong>

                </div>

            </div>



            <!-- DETAILS -->

            <div class="request-details">

                <div class="detail">

                    <span>
                        PEOPLE AFFECTED
                    </span>

                    <strong>

                        ${Number(
                            request.victims ||
                            0
                        ).toLocaleString()}

                    </strong>

                </div>


                <div class="detail">

                    <span>
                        WITHOUT SUPPLY
                    </span>

                    <strong>

                        ${Number(
                            request.daysWithoutSupply ||
                            0
                        )}

                        ${
                            Number(
                                request.daysWithoutSupply ||
                                0
                            ) === 1
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
                        ${safeSupply}
                    </strong>

                </div>


                <div class="detail">

                    <span>
                        EST. CARGO
                    </span>

                    <strong>
                        ~${weight} kg
                    </strong>

                </div>

            </div>



            <!-- REPORTER -->

            <div class="reporter-box">

                <div class="reporter-avatar">

                    ${initial}

                </div>


                <div>

                    <strong>
                        ${safeReporter}
                    </strong>


                    <span>

                        ${safeReporterType}

                        ·

                        ${safeContact}

                    </span>

                </div>

            </div>



            <!-- SITUATION -->

            <div class="situation-box">

                <span>
                    SITUATION DETAILS
                </span>


                <p>
                    ${safeSituation}
                </p>

            </div>



            <!-- VERIFICATION -->

            <div
                class="verification-status
                ${verificationClass}"
            >

                <div>

                    <span>
                        VERIFICATION
                    </span>


                    <strong>
                        ${verificationStatus}
                    </strong>

                </div>


                <button
                    type="button"
                    class="evidence-btn"
                    onclick="viewEvidence('${id}')"
                    ${
                        hasPhoto
                            ? ""
                            : "disabled"
                    }
                >

                    📷 View Evidence

                </button>

            </div>



            <!-- ACTIONS -->

            <div class="request-actions">

                ${actionButtons}

            </div>

        </div>

    `;

}



/* ============================================================
   ALERT FEED
   ============================================================ */

function renderAlerts() {

    const flagged =
        getRequests().filter(
            (request) =>
                request.status === "flagged"
        );


    const list =
        document.getElementById(
            "alertList"
        );


    const count =
        document.getElementById(
            "alertCount"
        );


    if (!list) {

        return;

    }


    if (count) {

        count.textContent =
            `${flagged.length} flagged`;

    }


    if (flagged.length === 0) {

        list.innerHTML = `

            <div class="empty-note">

                ✓ No anomalies detected.

            </div>

        `;

        return;

    }


    list.innerHTML =
        flagged
            .map(
                (request) => `

                    <div class="alert-item">

                        <div class="dot"></div>

                        <div class="body">

                            <div class="title">

                                Anomaly —
                                ${escapeHtml(
                                    request.id
                                )}

                            </div>


                            <div class="desc">

                                ${escapeHtml(
                                    request.shelterName ||
                                    "Unknown location"
                                )}

                                claims

                                ${Number(
                                    request.victims ||
                                    0
                                ).toLocaleString()}

                                victims.

                                Request is held
                                for manual review.

                            </div>

                        </div>

                    </div>

                `
            )
            .join("");

}



/* ============================================================
   FLEET — IDLE
   ============================================================ */

function renderFleetIdle() {

    const fleet =
        document.getElementById(
            "fleetStatus"
        );


    if (!fleet) {

        return;

    }


    if (
        typeof TRUCK_FLEET ===
        "undefined"
    ) {

        fleet.innerHTML = `

            <div class="empty-note">

                Fleet information unavailable.

            </div>

        `;

        return;

    }


    fleet.innerHTML =
        TRUCK_FLEET
            .map(
                (truck) => `

                    <div class="truck-block">

                        <div class="truck-head">

                            <span class="truck-id">

                                ${escapeHtml(
                                    truck.id
                                )}

                            </span>


                            <span class="truck-route">

                                ${escapeHtml(
                                    truck.route
                                )}

                            </span>

                        </div>


                        <div class="load-bar-track">

                            <div
                                class="load-bar-fill"
                                style="width:0%"
                            ></div>

                        </div>


                        <div class="load-caption">

                            0kg /
                            ${truck.capacityKg}kg
                            · idle

                        </div>

                    </div>

                `
            )
            .join("");


    const note =
        document.getElementById(
            "unfulfilledNote"
        );


    if (note) {

        note.textContent =
            "";

    }

}



/* ============================================================
   FLEET — AFTER DISPATCH
   ============================================================ */

function renderFleetPacked(
    packResult
) {

    const fleet =
        document.getElementById(
            "fleetStatus"
        );


    if (!fleet) {

        return;

    }


    fleet.innerHTML =
        packResult.trucks
            .map(
                (truck) => {

                    const percentage =
                        Math.min(
                            100,
                            Math.round(
                                (
                                    truck.loadKg /
                                    truck.capacityKg
                                ) * 100
                            )
                        );


                    const cargoLines =
                        truck.cargo
                            .map(
                                (cargo) => `

                                    <div
                                        class="cargo-line"
                                    >

                                        <strong>
                                            ${escapeHtml(
                                                cargo.id
                                            )}
                                        </strong>

                                        —

                                        ${escapeHtml(
                                            cargo.shelterName
                                        )}

                                        (${cargo.weight}kg)

                                    </div>

                                `
                            )
                            .join("");


                    return `

                        <div class="truck-block">

                            <div class="truck-head">

                                <span class="truck-id">

                                    ${escapeHtml(
                                        truck.id
                                    )}

                                </span>


                                <span class="truck-route">

                                    ${escapeHtml(
                                        truck.route
                                    )}

                                </span>

                            </div>


                            <div
                                class="load-bar-track"
                            >

                                <div
                                    class="load-bar-fill"
                                    style="
                                        width:${percentage}%
                                    "
                                ></div>

                            </div>


                            <div class="load-caption">

                                ${truck.loadKg}kg /
                                ${truck.capacityKg}kg

                                ·

                                ${truck.cargo.length}
                                shelters

                            </div>


                            ${
                                truck.cargo.length
                                    ? `
                                        <div
                                            class="truck-cargo-list"
                                        >
                                            ${cargoLines}
                                        </div>
                                      `
                                    : ""
                            }

                        </div>

                    `;

                }
            )
            .join("");


    const note =
        document.getElementById(
            "unfulfilledNote"
        );


    if (!note) {

        return;

    }


    if (
        packResult.unfulfilled.length
    ) {

        note.textContent =
            `⚠ ${packResult.unfulfilled.length} verified request(s) could not fit into the available fleet capacity: ${packResult.unfulfilled.join(", ")}`;

    }

    else {

        note.textContent =
            "✓ All verified eligible requests fit within fleet capacity.";

    }

}



/* ============================================================
   DISPATCH LOG
   ============================================================ */

function renderDispatchLog() {

    const log =
        getDispatchLog()
            .slice()
            .reverse();


    const element =
        document.getElementById(
            "dispatchLog"
        );


    if (!element) {

        return;

    }


    if (log.length === 0) {

        element.innerHTML = `

            <div class="empty-note">

                No dispatch runs yet.

            </div>

        `;

        return;

    }


    element.innerHTML =
        log
            .map(
                (entry) => `

                    <div class="req-row">

                        <div class="req-main">

                            <div class="shelter-name">

                                🚚

                                ${escapeHtml(
                                    entry.truckId
                                )}

                                →

                                ${
                                    entry.cargo
                                        ? entry.cargo.length
                                        : 0
                                }

                                shelters

                            </div>


                            <div class="meta">

                                ${
                                    new Date(
                                        entry.timestamp
                                    ).toLocaleString()
                                }

                                ·

                                ${entry.loadKg}kg
                                dispatched

                            </div>

                        </div>

                    </div>

                `
            )
            .join("");

}



/* ============================================================
   VERIFY REQUEST
   ============================================================ */

function verifyRequest(id) {

    const requests =
        getRequests();


    const request =
        requests.find(
            (item) =>
                item.id === id
        );


    if (!request) {

        showControlMessage(
            "❌ Request could not be found."
        );

        return;

    }


    if (
        request.verified === true
    ) {

        showControlMessage(
            "This request has already been verified."
        );

        return;

    }


    /* ========================================================
       PHOTO REQUIRED
       ======================================================== */

    const hasPhoto =
        typeof request.verificationPhoto ===
        "string" &&

        request.verificationPhoto
            .startsWith(
                "data:image/"
            );


    if (!hasPhoto) {

        showControlMessage(
            "⚠️ This request cannot be verified because the evidence photo is unavailable."
        );

        return;

    }


    /* ========================================================
       MARK VERIFIED
       ======================================================== */

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
     * IMPORTANT:
     *
     * Verification does NOT dispatch
     * the request.
     *
     * It only makes the request eligible
     * for the priority dispatch system.
     */

    request.status =
        "pending";


    saveRequests(
        requests
    );


    renderAll();


    showControlMessage(
        `✓ ${id} verified successfully. It is now eligible for priority dispatch.`
    );

}



/* ============================================================
   VIEW EVIDENCE
   ============================================================ */

function viewEvidence(id) {

    const requests =
        getRequests();


    const request =
        requests.find(
            (item) =>
                item.id === id
        );


    if (!request) {

        showControlMessage(
            "❌ Request could not be found."
        );

        return;

    }


    const photo =
        request.verificationPhoto;


    if (
        typeof photo !== "string" ||
        !photo.startsWith(
            "data:image/"
        )
    ) {

        showControlMessage(
            "⚠️ No usable evidence photo is available for this request."
        );

        return;

    }


    /* ========================================================
       REMOVE OLD OVERLAY
       ======================================================== */

    closeEvidence();



    /* ========================================================
       CREATE OVERLAY
       ======================================================== */

    const overlay =
        document.createElement(
            "div"
        );


    overlay.id =
        "evidenceOverlay";


    overlay.style.cssText = `

        position:fixed;
        inset:0;
        background:rgba(0,0,0,0.86);
        z-index:99999;
        display:flex;
        align-items:center;
        justify-content:center;
        padding:25px;
        box-sizing:border-box;

    `;



    /* ========================================================
       MODAL
       ======================================================== */

    overlay.innerHTML = `

        <div
            style="
                position:relative;
                width:min(900px, 100%);
                max-height:95vh;
                overflow:auto;
                background:#ffffff;
                border-radius:18px;
                padding:24px;
                box-sizing:border-box;
                box-shadow:0 25px 80px rgba(0,0,0,.35);
            "
        >

            <button
                type="button"
                onclick="closeEvidence()"
                style="
                    position:absolute;
                    top:15px;
                    right:15px;
                    width:40px;
                    height:40px;
                    border:none;
                    border-radius:50%;
                    background:#111827;
                    color:white;
                    font-size:24px;
                    cursor:pointer;
                    z-index:2;
                "
            >
                ×
            </button>


            <div
                style="
                    padding-right:50px;
                    margin-bottom:18px;
                "
            >

                <div
                    style="
                        font-size:12px;
                        font-weight:700;
                        letter-spacing:1px;
                        color:#6b7280;
                        margin-bottom:5px;
                    "
                >
                    VERIFICATION EVIDENCE
                </div>


                <h2
                    style="
                        margin:0;
                        color:#111827;
                    "
                >
                    ${escapeHtml(
                        request.shelterName ||
                        "Affected Location"
                    )}
                </h2>


                <p
                    style="
                        margin:8px 0 0;
                        color:#6b7280;
                    "
                >
                    Request ID:
                    ${escapeHtml(
                        request.id
                    )}
                </p>

            </div>


            <img
                src="${photo}"
                alt="Emergency verification evidence"
                style="
                    display:block;
                    width:100%;
                    max-height:65vh;
                    object-fit:contain;
                    border-radius:12px;
                    background:#f3f4f6;
                "
            >


            <div
                style="
                    margin-top:18px;
                    padding:15px;
                    background:#f8fafc;
                    border-radius:10px;
                    color:#374151;
                "
            >

                <strong>
                    Situation reported:
                </strong>


                <div
                    style="
                        margin-top:6px;
                        line-height:1.5;
                    "
                >
                    ${escapeHtml(
                        request.situationDetails ||
                        "No description provided."
                    )}
                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        overlay
    );


    /* ========================================================
       CLOSE WHEN CLICKING BACKGROUND
       ======================================================== */

    overlay.addEventListener(
        "click",
        (event) => {

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
   CLOSE EVIDENCE
   ============================================================ */

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
   DISPATCH ONE VERIFIED REQUEST
   ============================================================ */

function dispatchSingleRequest(id) {

    const requests =
        getRequests();


    const request =
        requests.find(
            (item) =>
                item.id === id
        );


    if (!request) {

        showControlMessage(
            "❌ Request could not be found."
        );

        return;

    }


    if (
        request.status !==
        "pending"
    ) {

        showControlMessage(
            "This request is no longer pending."
        );

        return;

    }


    /* ========================================================
       VERIFICATION CHECK
       ======================================================== */

    if (
        request.verified !== true
    ) {

        showControlMessage(
            `🔒 ${request.id} cannot be dispatched until it is verified.`
        );

        return;

    }


    /* ========================================================
       PHOTO CHECK
       ======================================================== */

    const hasPhoto =
        typeof request.verificationPhoto ===
        "string" &&

        request.verificationPhoto
            .startsWith(
                "data:image/"
            );


    if (!hasPhoto) {

        showControlMessage(
            `⚠️ ${request.id} has no usable verification evidence.`
        );

        return;

    }


    /* ========================================================
       CARGO WEIGHT
       ======================================================== */

    const weight =
        typeof estimateCargoWeightKg ===
        "function"

            ? estimateCargoWeightKg(
                request
            )

            : 0;



    /* ========================================================
       FIND TRUCK
       ======================================================== */

    const truck =
        typeof TRUCK_FLEET !==
        "undefined"

            ? TRUCK_FLEET.find(
                (item) =>
                    weight <=
                    item.capacityKg
            )

            : null;


    if (!truck) {

        showControlMessage(
            `⚠️ No suitable truck is available for ${request.id}. Use Priority Dispatch to optimize the fleet.`
        );

        return;

    }



    /* ========================================================
       UPDATE STATUS
       ======================================================== */

    updateRequestStatus(
        request.id,
        "dispatched"
    );



    /* ========================================================
       ADD DISPATCH LOG
       ======================================================== */

    addDispatchLogEntry({

        truckId:
            truck.id,

        route:
            truck.route,

        cargo: [

            {

                id:
                    request.id,

                shelterName:
                    request.shelterName,

                weight:
                    weight

            }

        ],

        loadKg:
            weight,

        timestamp:
            Date.now()

    });



    /* ========================================================
       REFRESH
       ======================================================== */

    renderAll();


    showControlMessage(
        `🚚 ${request.id} has been dispatched through ${truck.id}.`
    );

}



/* ============================================================
   RUN PRIORITY DISPATCH
   ============================================================ */

function runDispatch() {

    const requests =
        getRequests();


    /* ========================================================
       ONLY VERIFIED + PENDING
       ======================================================== */

    const verifiedPending =
        requests.filter(
            (request) =>

                request.status ===
                    "pending"

                &&

                request.verified ===
                    true
        );


    if (
        verifiedPending.length ===
        0
    ) {

        showControlMessage(
            "🔒 No verified pending requests are ready for dispatch."
        );

        return;

    }



    /* ========================================================
       PRIORITY PACKING
       ======================================================== */

    let result;


    if (
        typeof packTrucks ===
        "function"
    ) {

        result =
            packTrucks(
                verifiedPending
            );

    }

    else {

        showControlMessage(
            "Priority dispatch engine is unavailable."
        );

        return;

    }



    /* ========================================================
       UPDATE REQUEST STATUS
       ======================================================== */

    result.trucks.forEach(
        (truck) => {

            if (
                !truck.cargo ||
                truck.cargo.length ===
                    0
            ) {

                return;

            }


            truck.cargo.forEach(
                (cargo) => {

                    updateRequestStatus(
                        cargo.id,
                        "dispatched"
                    );

                }
            );


            /* --------------------------------------------
               DISPATCH LOG
               -------------------------------------------- */

            addDispatchLogEntry({

                truckId:
                    truck.id,

                route:
                    truck.route,

                cargo:
                    truck.cargo,

                loadKg:
                    truck.loadKg,

                timestamp:
                    Date.now()

            });

        }
    );



    /* ========================================================
       UPDATE FLEET DISPLAY
       ======================================================== */

    renderFleetPacked(
        result
    );


    renderQueue();

    renderAlerts();

    renderDispatchLog();

    renderStatistics();



    /* ========================================================
       RESULT
       ======================================================== */

    if (
        result.unfulfilled &&
        result.unfulfilled.length > 0
    ) {

        showControlMessage(

            `⚠️ Dispatch completed. ${result.unfulfilled.length} verified request(s) could not fit within the available fleet capacity.`

        );

    }

    else {

        showControlMessage(

            "✓ Priority dispatch completed successfully."

        );

    }

}



/* ============================================================
   CONTROL ROOM MESSAGE
   ============================================================ */

function showControlMessage(
    message
) {

    /*
     * If your HTML already has a message/banner element,
     * use it.
     */

    const existing =
        document.getElementById(
            "controlMessage"
        );


    if (existing) {

        existing.textContent =
            message;


        existing.classList.add(
            "show"
        );


        setTimeout(
            () => {

                existing.classList.remove(
                    "show"
                );

            },
            5000
        );


        return;

    }



    /*
     * Otherwise create a temporary notification.
     */

    const notification =
        document.createElement(
            "div"
        );


    notification.textContent =
        message;


    notification.style.cssText = `

        position:fixed;
        right:24px;
        bottom:24px;
        z-index:99998;
        max-width:420px;
        padding:16px 20px;
        border-radius:12px;
        background:#111827;
        color:#ffffff;
        font-size:14px;
        font-weight:600;
        line-height:1.5;
        box-shadow:0 12px 35px rgba(0,0,0,.25);

    `;


    document.body.appendChild(
        notification
    );


    setTimeout(
        () => {

            notification.remove();

        },
        5000
    );

}



/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value || "";


    return div.innerHTML;

}

/* ============================================================
   NGO VERIFICATION
   ============================================================ */
/* ============================================================
   NGO VERIFICATION
   ============================================================ */

/*
 * Get all registered NGOs from localStorage.
 */
function getNGOs() {

    try {

        return JSON.parse(
            localStorage.getItem("drr_ngos") || "[]"
        );

    }

    catch (error) {

        console.error(
            "Unable to read NGO data:",
            error
        );

        return [];

    }

}


/*
 * Save NGO list to localStorage.
 */
function saveNGOs(ngos) {

    localStorage.setItem(
        "drr_ngos",
        JSON.stringify(ngos)
    );

}


/*
 * Render:
 *
 * 1. Pending NGOs
 * 2. Verified NGOs
 * 3. NGO counts
 */
function renderNGOs() {

    const ngos =
        getNGOs();


    /*
     * Only pending NGOs appear
     * in the verification section.
     */
    const pending =
        ngos.filter(
            ngo =>
                ngo.status === "pending"
        );


    /*
     * Only verified NGOs appear
     * in the verified NGO network.
     */
    const verified =
        ngos.filter(
            ngo =>
                ngo.status === "verified"
        );


    /* ========================================================
       COUNTS
       ======================================================== */

    /*
     * Your HTML currently uses:
     *
     * ngoCount
     * verifiedNgoCount
     *
     * So we support those IDs.
     *
     * We also support:
     *
     * ngoPendingCount
     * ngoVerifiedCount
     *
     * in case they exist in another version.
     */

    const pendingCount =
        document.getElementById(
            "ngoCount"
        );


    const verifiedCount =
        document.getElementById(
            "verifiedNgoCount"
        );


    const oldPendingCount =
        document.getElementById(
            "ngoPendingCount"
        );


    const oldVerifiedCount =
        document.getElementById(
            "ngoVerifiedCount"
        );


    if (pendingCount) {

        pendingCount.textContent =
            `${pending.length} pending`;

    }


    if (verifiedCount) {

        verifiedCount.textContent =
            `${verified.length} verified`;

    }


    if (oldPendingCount) {

        oldPendingCount.textContent =
            `${pending.length} pending`;

    }


    if (oldVerifiedCount) {

        oldVerifiedCount.textContent =
            `${verified.length} verified`;

    }


    /* ========================================================
       PENDING NGO LIST
       ======================================================== */

    const pendingList =
        document.getElementById(
            "ngoVerificationList"
        );


    if (pendingList) {

        if (pending.length === 0) {

            pendingList.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        ✓
                    </div>

                    <p>
                        No NGOs are currently
                        awaiting verification.
                    </p>

                </div>

            `;

        }

        else {

            pendingList.innerHTML =
                pending
                    .map(
                        ngo =>
                            createPendingNgoCard(
                                ngo
                            )
                    )
                    .join("");

        }

    }


    /* ========================================================
       VERIFIED NGO LIST
       ======================================================== */

    const verifiedList =
        document.getElementById(
            "verifiedNgoList"
        );


    if (verifiedList) {

        if (verified.length === 0) {

            verifiedList.innerHTML = `

                <div class="empty-state">

                    <div class="empty-icon">
                        —
                    </div>

                    <p>
                        No verified NGOs yet.
                    </p>

                </div>

            `;

        }

        else {

            verifiedList.innerHTML =
                verified
                    .map(
                        ngo =>
                            createVerifiedNgoCard(
                                ngo
                            )
                    )
                    .join("");

        }

    }

}


/* ============================================================
   CREATE PENDING NGO CARD
   ============================================================ */

function createPendingNgoCard(ngo) {

    const services =
        Array.isArray(ngo.services)

            ? ngo.services.join(", ")

            : "Not specified";


    return `

        <div class="ngo-card">

            <!-- HEADER -->

            <div class="ngo-card-header">

                <div>

                    <div class="ngo-id">

                        ${escapeHtml(
                            ngo.id || "—"
                        )}

                    </div>


                    <h3>

                        ${escapeHtml(
                            ngo.name || "Unnamed NGO"
                        )}

                    </h3>

                </div>


                <span class="ngo-status pending">

                    PENDING

                </span>

            </div>


            <!-- DETAILS -->

            <div class="ngo-details">

                <div>

                    <span>
                        REGISTRATION
                    </span>

                    <strong>

                        ${escapeHtml(
                            ngo.registrationNumber || "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        CONTACT PERSON
                    </span>

                    <strong>

                        ${escapeHtml(
                            ngo.contactPerson || "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        EMAIL
                    </span>

                    <strong>

                        ${escapeHtml(
                            ngo.email || "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        PHONE
                    </span>

                    <strong>

                        ${escapeHtml(
                            ngo.phone || "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        LOCATION
                    </span>

                    <strong>

                        ${escapeHtml(
                            `${ngo.city || "—"}, ${ngo.state || "—"}`
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        OPERATING RADIUS
                    </span>

                    <strong>

                        ${Number(
                            ngo.operatingRadiusKm || 0
                        )} km

                    </strong>

                </div>

            </div>


            <!-- SERVICES -->

            <div class="ngo-services">

                <span>
                    SERVICES
                </span>

                <p>

                    ${escapeHtml(
                        services
                    )}

                </p>

            </div>


            <!-- ACTIONS -->

            <div class="ngo-actions">

                <button
                    type="button"
                    class="verify-ngo-btn"
                    onclick="verifyNGO('${escapeHtml(ngo.id)}')"
                >

                    ✓ Verify NGO

                </button>


                <button
                    type="button"
                    class="reject-ngo-btn"
                    onclick="rejectNGO('${escapeHtml(ngo.id)}')"
                >

                    Reject

                </button>

            </div>

        </div>

    `;

}


/* ============================================================
   CREATE VERIFIED NGO CARD
   ============================================================ */

function createVerifiedNgoCard(ngo) {

    const services =
        Array.isArray(ngo.services)

            ? ngo.services.join(", ")

            : "Not specified";


    return `

        <div class="ngo-card verified-ngo-card">

            <!-- HEADER -->

            <div class="ngo-card-header">

                <div>

                    <div class="ngo-id">

                        ${escapeHtml(
                            ngo.id || "—"
                        )}

                    </div>


                    <h3>

                        ${escapeHtml(
                            ngo.name || "Unnamed NGO"
                        )}

                    </h3>

                </div>


                <span class="ngo-status verified">

                    ✓ VERIFIED

                </span>

            </div>


            <!-- DETAILS -->

            <div class="ngo-details">

                <div>

                    <span>
                        LOCATION
                    </span>

                    <strong>

                        ${escapeHtml(
                            `${ngo.city || "—"}, ${ngo.state || "—"}`
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        CONTACT
                    </span>

                    <strong>

                        ${escapeHtml(
                            ngo.contactPerson || "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        EMAIL
                    </span>

                    <strong>

                        ${escapeHtml(
                            ngo.email || "—"
                        )}

                    </strong>

                </div>


                <div>

                    <span>
                        RADIUS
                    </span>

                    <strong>

                        ${Number(
                            ngo.operatingRadiusKm || 0
                        )} km

                    </strong>

                </div>

            </div>


            <!-- SERVICES -->

            <div class="ngo-services">

                <span>
                    AVAILABLE SERVICES
                </span>

                <p>

                    ${escapeHtml(
                        services
                    )}

                </p>

            </div>

        </div>

    `;

}


/* ============================================================
   VERIFY NGO
   ============================================================ */

function verifyNGO(id) {

    const ngos =
        getNGOs();


    const ngo =
        ngos.find(
            item =>
                item.id === id
        );


    if (!ngo) {

        showControlMessage(
            "❌ NGO could not be found."
        );

        return;

    }


    /*
     * Prevent verifying an NGO
     * that is already verified.
     */

    if (
        ngo.status ===
        "verified"
    ) {

        showControlMessage(
            "This NGO is already verified."
        );

        return;

    }


    /*
     * IMPORTANT:
     *
     * Pending → Verified
     */

    ngo.status =
        "verified";


    ngo.verifiedAt =
        Date.now();


    ngo.verifiedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    /*
     * Save updated NGO list.
     */

    saveNGOs(
        ngos
    );


    /*
     * Refresh dashboard.
     */

    renderNGOs();


    /*
     * Show confirmation.
     */

    showControlMessage(

        `✓ ${ngo.name} has been verified successfully.`

    );

}


/* ============================================================
   REJECT NGO
   ============================================================ */

function rejectNGO(id) {

    const ngos =
        getNGOs();


    const ngo =
        ngos.find(
            item =>
                item.id === id
        );


    if (!ngo) {

        showControlMessage(
            "❌ NGO could not be found."
        );

        return;

    }


    /*
     * Ask staff for confirmation.
     */

    const confirmed =
        confirm(
            `Reject ${ngo.name} from the NGO network?`
        );


    if (!confirmed) {

        return;

    }


    /*
     * Pending → Rejected
     */

    ngo.status =
        "rejected";


    ngo.rejectedAt =
        Date.now();


    ngo.rejectedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    /*
     * Save.
     */

    saveNGOs(
        ngos
    );


    /*
     * Refresh NGO panels.
     */

    renderNGOs();


    /*
     * Show confirmation.
     */

    showControlMessage(

        `NGO ${ngo.name} has been rejected.`

    );

}
