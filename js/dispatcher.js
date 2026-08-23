/* ============================================================
   dispatcher.js — Relief Resolver Control Room
   NGO COORDINATION WORKFLOW

   Workflow:
   1. Emergency request arrives.
   2. Staff inspect evidence.
   3. Staff verify the request.
   4. Verified NGOs are matched using requested service.
   5. Staff notify a suitable NGO.
   6. Request becomes "coordinating".
   7. Staff can mark the NGO as "on the way".

   There is intentionally NO vehicle/fleet dispatch workflow.
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    renderAll();
});


/* ============================================================
   MAIN RENDER
   ============================================================ */

function renderAll() {
    renderStatistics();
    renderReviewQueue();
    renderCoordinationQueue();
    renderAlerts();
    renderNGOs();
}


/* ============================================================
   STORAGE HELPERS
   Uses the project's existing storage.js when available.
   ============================================================ */
function readRequests() {
    try {
        const raw =
            localStorage.getItem("relief_requests") || "[]";

        const requests = JSON.parse(raw);

        return Array.isArray(requests)
            ? requests
            : [];

    } catch (error) {
        console.error(
            "Unable to read relief requests:",
            error
        );

        return [];
    }
}

function writeRequests(requests) {
    try {
        localStorage.setItem(
            "relief_requests",
            JSON.stringify(requests)
        );

        console.log(
            "RELIEF RESOLVER — REQUESTS SAVED:",
            requests
        );

    } catch (error) {
        console.error(
            "Unable to save requests:",
            error
        );
    }
}

function readNGOs() {

    try {

        return JSON.parse(
            localStorage.getItem("drr_ngos") || "[]"
        );

    } catch (error) {

        console.error(
            "Unable to read NGO data:",
            error
        );

        return [];
    }
}


function saveNGOs(ngos) {

    localStorage.setItem(
        "drr_ngos",
        JSON.stringify(ngos)
    );
}


/* ============================================================
   STATISTICS
   ============================================================ */

function renderStatistics() {

    const requests = readRequests();
    const ngos = readNGOs();

const review =
    requests.filter(
        request => {

            const status =
                String(
                    request.status || ""
                )
                .trim()
                .toLowerCase();


            const isPending =
                status === "pending" ||
                status === "pending verification";


            return (
                isPending &&
                request.verified !== true
            );

        }
    );


    const verified = requests.filter(
        request =>
            request.verified === true &&
            request.status !== "coordinating" &&
            request.status !== "assistance_confirmed"
    );


    const coordinating = requests.filter(
        request =>
            request.status === "coordinating" ||
            request.status === "assistance_confirmed"
    );


    const verifiedNGOs = ngos.filter(
        ngo =>
            ngo.status === "verified"
    );


    setText(
        "reviewCount",
        review.length
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
        `${review.length} awaiting review`
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
   REQUEST REVIEW QUEUE
   ============================================================ */

function renderReviewQueue() {

    const list =
        document.getElementById("reviewList");

    if (!list) return;


    let requests =
        readRequests().filter(
            request => {

                const status =
                    String(
                        request.status || ""
                    )
                    .trim()
                    .toLowerCase();


                const isPending =
                    status === "pending" ||
                    status === "pending verification";


                const isNotVerified =
                    request.verified !== true;


                return (
                    isPending &&
                    isNotVerified
                );

            }
        );


    /*
     * Sort by urgency if the priority
     * function exists.
     */

    if (
        typeof sortByUrgency ===
        "function"
    ) {

        requests =
            sortByUrgency(requests);

    }


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
            .map(createReviewCard)
            .join("");
}
/* ============================================================
   COORDINATION QUEUE
   ============================================================ */

function renderCoordinationQueue() {

    const list =
        document.getElementById("coordinationList");

    if (!list) return;

const requests =
    readRequests().filter(
        request => {

            const status =
                String(
                    request.status || ""
                )
                .trim()
                .toLowerCase();


            return (
                request.verified === true &&
                (
                    status === "pending" ||
                    status === "pending verification" ||
                    status === "coordinating" ||
                    status === "assistance_confirmed"
                )
            );

        }
    );

    if (!requests.length) {

        list.innerHTML =
            emptyState(
                "✓",
                "Verify an emergency request to see suitable NGOs here."
            );

        return;
    }


    list.innerHTML =
        requests
            .map(createCoordinationCard)
            .join("");
}


/* ============================================================
   PRIORITY
   ============================================================ */

function getPriority(request) {

    const score =
        typeof calculateUrgencyScore === "function"
            ? Number(
                calculateUrgencyScore(request)
            ) || 0
            : (
                Number(request.victims || 0) +
                Number(request.daysWithoutSupply || 0) * 40
            );


    if (score >= 700) {

        return {
            label: "CRITICAL",
            cls: "critical"
        };
    }


    if (score >= 500) {

        return {
            label: "HIGH",
            cls: "high"
        };
    }


    if (score >= 250) {

        return {
            label: "MEDIUM",
            cls: "medium"
        };
    }


    return {
        label: "NORMAL",
        cls: "normal"
    };
}


/* ============================================================
   REQUEST CARD — REVIEW
   ============================================================ */

function createReviewCard(request) {

    const priority =
        getPriority(request);


    const id =
        safe(
            request.id || ""
        );


    const reporter =
        request.reporterName ||
        "Unknown reporter";


    const initial =
        reporter.charAt(0).toUpperCase() ||
        "R";


    const hasPhoto =
        hasEvidence(request);


    return `
        <article class="request-card">

            <div class="request-head">

                <div>

                    <div class="request-id">

                        ${id}

                        <span class="priority ${priority.cls}">
                            ${priority.label}
                        </span>

                    </div>


                    <h3 class="request-title">
                        ${safe(
                            request.shelterName ||
                            "Affected location"
                        )}
                    </h3>


                    <div class="request-location">

                        📍
                        ${formatCoordinate(request.lat)},
                        ${formatCoordinate(request.lng)}

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
                    ${safe(initial)}
                </div>


                <div class="reporter-main">

                    <strong>
                        ${safe(reporter)}
                    </strong>

                    <span>

                        ${safe(
                            request.reporterType ||
                            "Reporter"
                        )}

                        ·

                        ${safe(
                            request.contactNumber ||
                            "No contact"
                        )}

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
                    onclick="viewEvidence('${jsArg(request.id)}')"
                    ${hasPhoto ? "" : "disabled"}
                >

                    📷
                    ${hasPhoto
                        ? "View evidence"
                        : "No evidence"}

                </button>

            </div>


            <div class="actions">

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="verifyRequest('${jsArg(request.id)}')"
                    ${hasPhoto ? "" : "disabled"}
                >

                    ✓ Verify request

                </button>


                ${
                    hasPhoto
                        ? ""
                        : `
                            <span
                                style="
                                    font-size:9px;
                                    color:#9a6a00;
                                    padding:10px 2px;
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
   REQUEST CARD — VERIFIED / COORDINATION
   ============================================================ */

function createCoordinationCard(request) {

    const priority =
        getPriority(request);


    const notified =
        request.status === "coordinating" ||
        request.status === "assistance_confirmed";


    const ngo =
        notified
            ? findNGO(request.assignedNgoId)
            : null;


    /* --------------------------------------------------------
       NGO ALREADY NOTIFIED
       -------------------------------------------------------- */

    if (notified) {

        return `
            <article class="request-card coordinating-card">

                <div class="request-head">

                    <div>

                        <div class="request-id">

                            ${safe(request.id)}

                            <span
                                class="priority ${priority.cls}"
                            >
                                ${priority.label}
                            </span>

                        </div>


                        <h3 class="request-title">

                            ${safe(
                                request.shelterName ||
                                "Affected location"
                            )}

                        </h3>


                        <div class="request-location">

                            📍
                            ${formatCoordinate(request.lat)},
                            ${formatCoordinate(request.lng)}

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


                <div class="coordination-state">

                    <div>

                        <strong>

                            ${
                                request.status ===
                                "assistance_confirmed"

                                ? "✓ NGO is on the way"

                                : "✓ NGO notified — coordinating"
                            }

                        </strong>


                        <span>

                            ${safe(
                                request.assignedNgoName ||
                                (ngo && ngo.name) ||
                                "Assigned relief organization"
                            )}

                            ${
                                request.ngoNotifiedAt
                                    ? " · notified " +
                                      formatTime(
                                          request.ngoNotifiedAt
                                      )
                                    : ""
                            }

                        </span>

                    </div>


                    ${
                        request.status ===
                        "coordinating"

                            ? `

                                <button
                                    type="button"
                                    class="btn btn-green"
                                    onclick="markNGOOnTheWay('${jsArg(request.id)}')"
                                >

                                    ✓ Mark NGO on the way

                                </button>

                            `

                            : `

                                <span class="available">
                                    Response confirmed
                                </span>

                            `
                    }

                </div>

            </article>
        `;
    }


    /* --------------------------------------------------------
       VERIFIED BUT NGO NOT YET SELECTED
       -------------------------------------------------------- */

    const matches =
        findMatchingNGOs(request);


    return `
        <article class="request-card">

            <div class="request-head">

                <div>

                    <div class="request-id">

                        ${safe(request.id)}

                        <span
                            class="priority ${priority.cls}"
                        >
                            ${priority.label}
                        </span>

                    </div>


                    <h3 class="request-title">

                        ${safe(
                            request.shelterName ||
                            "Affected location"
                        )}

                    </h3>


                    <div class="request-location">

                        📍
                        ${formatCoordinate(request.lat)},
                        ${formatCoordinate(request.lng)}

                    </div>

                </div>


                <div class="urgency-box">

                    <span>
                        VERIFIED
                    </span>

                    <strong>
                        ✓
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
                        ✓ Verified — ready for NGO coordination
                    </strong>

                </div>


                <span class="available">
                    Verified
                </span>

            </div>


            <div class="coordination-wrap">

                <div class="coordination-head">

                    <div>

                        <h3>
                            Available NGOs for this request
                        </h3>

                        <p>

                            Matches are based on the requested
                            relief service. Where NGO coordinates
                            are available, operating radius is
                            also considered.

                        </p>

                    </div>


                    <span class="section-badge">

                        ${matches.length}

                        match${matches.length === 1 ? "" : "es"}

                    </span>

                </div>


                ${
                    matches.length

                        ? `
                            <div class="match-list">

                                ${matches
                                    .map(
                                        ngo =>
                                            createMatchCard(
                                                request,
                                                ngo
                                            )
                                    )
                                    .join("")}

                            </div>
                        `

                        : emptyState(
                            "—",
                            "No verified NGO currently matches this request. Review the available NGO network below."
                        )
                }

            </div>

        </article>
    `;
}


/* ============================================================
   REQUEST DETAILS
   ============================================================ */

function requestDetails(request) {

    return `
        <div class="detail-grid">

            <div class="detail">

                <span>
                    PEOPLE AFFECTED
                </span>

                <strong>

                    ${Number(
                        request.victims || 0
                    ).toLocaleString()}

                </strong>

            </div>


            <div class="detail">

                <span>
                    WITHOUT SUPPLY
                </span>

                <strong>

                    ${Number(
                        request.daysWithoutSupply || 0
                    )}

                    ${
                        Number(
                            request.daysWithoutSupply || 0
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

                    ${safe(
                        request.supplyType ||
                        "Relief support"
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
                        "Reporter"
                    )}

                </strong>

            </div>

        </div>
    `;
}


/* ============================================================
   NGO MATCHING
   ============================================================ */

function findMatchingNGOs(request) {

    return readNGOs()

        .filter(
            ngo =>
                ngo.status === "verified"
        )

        .map(
            ngo => ({

                ngo,

                match:
                    calculateNGOMatch(
                        request,
                        ngo
                    )

            })
        )

        .filter(
            item =>
                item.match.score > 0
        )

        .sort(
            (a, b) =>
                b.match.score -
                a.match.score
        )

        .map(
            item =>
                item.ngo
        );
}


function calculateNGOMatch(
    request,
    ngo
) {

    const required =
        normalizeServices(
            request.supplyType
        );


    const offered =
        normalizeServices(
            ngo.services
        );


    const serviceMatches =
        required.filter(
            service =>
                offered.some(
                    item =>
                        serviceCompatible(
                            service,
                            item
                        )
                )
        );


    let score =
        serviceMatches.length * 100;


    let distance = null;


    const reqLat =
        Number(request.lat);


    const reqLng =
        Number(request.lng);


    const ngoLat =
        Number(
            ngo.lat ??
            ngo.latitude
        );


    const ngoLng =
        Number(
            ngo.lng ??
            ngo.longitude
        );


    if (
        Number.isFinite(reqLat) &&
        Number.isFinite(reqLng) &&
        Number.isFinite(ngoLat) &&
        Number.isFinite(ngoLng)
    ) {

        distance =
            haversine(
                reqLat,
                reqLng,
                ngoLat,
                ngoLng
            );


        const radius =
            Number(
                ngo.operatingRadiusKm ??
                ngo.operatingRadius ??
                0
            );


        if (radius > 0) {

            if (distance <= radius) {

                score += 60;

            } else {

                score -= 80;

            }

        } else {

            score += 20;

        }

    } else {

        /*
         * Older NGO records may only contain
         * city/state/radius.
         */

        score += 10;
    }


    return {

        score,

        serviceMatches,

        distance

    };
}


function createMatchCard(
    request,
    ngo
) {

    const match =
        calculateNGOMatch(
            request,
            ngo
        );


    const services =
        Array.isArray(ngo.services)

            ? ngo.services

            : String(
                ngo.services || ""
            )
                .split(",")
                .map(
                    service =>
                        service.trim()
                )
                .filter(Boolean);


    const distanceText =
        match.distance !== null

            ? `${match.distance.toFixed(1)} km from request`

            : `${safe(
                ngo.city || "Local"
            )} · ${safe(
                ngo.state || ""
            )}`;


    return `
        <div class="ngo-match">

            <div class="ngo-match-top">

                <div>

                    <h4>
                        ${safe(
                            ngo.name ||
                            "Verified NGO"
                        )}
                    </h4>


                    <div class="match-meta">

                        ${distanceText}

                        <br>

                        Operating radius:

                        ${
                            Number(
                                ngo.operatingRadiusKm ??
                                ngo.operatingRadius ??
                                0
                            ) || "—"
                        }

                        km

                    </div>

                </div>


                <span class="available">
                    Available
                </span>

            </div>


            <div class="match-services">

                ${services
                    .map(
                        service =>
                            `
                                <span class="service-chip">
                                    ${safe(service)}
                                </span>
                            `
                    )
                    .join("")}

            </div>


            <button
                type="button"
                class="btn btn-green match-action"
                onclick="notifyNGO(
                    '${jsArg(request.id)}',
                    '${jsArg(ngo.id)}'
                )"
            >

                Notify
                ${safe(
                    ngo.name ||
                    "NGO"
                )}

            </button>

        </div>
    `;
}


/* ============================================================
   NGO VERIFICATION
   ============================================================ */

function renderNGOs() {

    const ngos =
        readNGOs();


    const pending =
        ngos.filter(
            ngo =>
                ngo.status === "pending"
        );


    const verified =
        ngos.filter(
            ngo =>
                ngo.status === "verified"
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
   PENDING NGO CARD
   ============================================================ */

function createPendingNGOCard(ngo) {

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

                ,

                ${safe(
                    ngo.state ||
                    ""
                )}

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


            <div class="ngo-actions">

                <button
                    type="button"
                    class="btn btn-primary"
                    onclick="verifyNGO('${jsArg(ngo.id)}')"
                >

                    ✓ Verify NGO

                </button>


                <button
                    type="button"
                    class="btn btn-light"
                    onclick="rejectNGO('${jsArg(ngo.id)}')"
                >

                    Reject

                </button>

            </div>

        </article>
    `;
}


/* ============================================================
   VERIFIED NGO CARD
   ============================================================ */

function createVerifiedNGOCard(ngo) {

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

                ,

                ${safe(
                    ngo.state ||
                    ""
                )}

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
                            Number(
                                ngo.operatingRadiusKm ??
                                ngo.operatingRadius ??
                                0
                            ) || "—"
                        }

                        km

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

                    <strong style="color:#2f7a4a">

                        ✓ Verified

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
   VERIFY NGO
   ============================================================ */

function verifyNGO(id) {

    const ngos =
        readNGOs();


    const ngo =
        ngos.find(
            item =>
                item.id === id
        );


    if (!ngo) {

        showControlMessage(
            "NGO could not be found.",
            true
        );

        return;
    }


    if (ngo.status === "verified") {

        showControlMessage(
            "This NGO is already verified."
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
        `✓ ${ngo.name} is now a verified relief partner and can receive suitable emergency requests.`
    );
}


/* ============================================================
   REJECT NGO
   ============================================================ */

function rejectNGO(id) {

    const ngos =
        readNGOs();


    const ngo =
        ngos.find(
            item =>
                item.id === id
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
   VERIFY REQUEST
   ============================================================ */

function verifyRequest(id) {

    const requests =
        readRequests();


    const request =
        requests.find(
            item =>
                item.id === id
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
            "This request has already been verified."
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
     * Verification does NOT automatically
     * contact an NGO.
     */

    request.status =
        "pending";


    writeRequests(
        requests
    );


    renderAll();


    showControlMessage(
        `✓ ${id} verified. Suitable verified NGOs are now shown for coordination.`
    );
}


/* ============================================================
   NOTIFY NGO
   ============================================================ */

function notifyNGO(
    requestId,
    ngoId
) {

    const requests =
        readRequests();


    const ngos =
        readNGOs();


    const request =
        requests.find(
            item =>
                item.id === requestId
        );


    const ngo =
        ngos.find(
            item =>
                item.id === ngoId
        );


    if (
        !request ||
        !ngo
    ) {

        showControlMessage(
            "The request or NGO could not be found.",
            true
        );

        return;
    }


    if (
        request.verified !== true
    ) {

        showControlMessage(
            "Only verified emergency requests can be coordinated.",
            true
        );

        return;
    }


    if (
        ngo.status !== "verified"
    ) {

        showControlMessage(
            "Only verified NGOs can be selected.",
            true
        );

        return;
    }


    const confirmed =
        confirm(
            `Notify ${ngo.name} about ${request.id}?\n\n` +

            `Need: ${
                request.supplyType ||
                "Relief support"
            }\n` +

            `Location: ${
                request.shelterName ||
                "Affected location"
            }\n` +

            `People affected: ${
                request.victims ||
                0
            }`
        );


    if (!confirmed) {
        return;
    }


    request.status =
        "coordinating";


    request.assignedNgoId =
        ngo.id;


    request.assignedNgoName =
        ngo.name;


    request.ngoNotifiedAt =
        Date.now();


    request.ngoNotificationStatus =
        "notified";


    request.coordinatedBy =
        sessionStorage.getItem(
            "reliefStaffName"
        ) ||
        "Control Room Staff";


    writeRequests(
        requests
    );


    renderAll();


    showControlMessage(
        `✓ ${ngo.name} has been notified for ${request.id}. The request is now in NGO coordination.`
    );
}


/* ============================================================
   MARK NGO ON THE WAY
   ============================================================ */

function markNGOOnTheWay(
    requestId
) {

    const requests =
        readRequests();


    const request =
        requests.find(
            item =>
                item.id === requestId
        );


    if (!request) {

        showControlMessage(
            "Request could not be found.",
            true
        );

        return;
    }


    if (
        request.status !==
        "coordinating"
    ) {

        showControlMessage(
            "This request is not currently awaiting NGO confirmation.",
            true
        );

        return;
    }


    const confirmed =
        confirm(
            `Confirm that ${
                request.assignedNgoName ||
                "the NGO"
            } is responding to ${
                request.id
            }?`
        );


    if (!confirmed) {
        return;
    }


    request.status =
        "assistance_confirmed";


    request.ngoNotificationStatus =
        "responding";


    request.ngoConfirmedAt =
        Date.now();


    writeRequests(
        requests
    );


    renderAll();


    showControlMessage(
        `✓ ${
            request.assignedNgoName ||
            "The NGO"
        } is marked as on the way to help.`
    );
}


/* ============================================================
   EVIDENCE VIEWER
   ============================================================ */

function viewEvidence(id) {

    const request =
        readRequests().find(
            item =>
                item.id === id
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
        background:rgba(7,21,37,.86);
        backdrop-filter:blur(5px);
    `;


    overlay.innerHTML = `

        <div style="
            position:relative;
            width:min(900px,100%);
            max-height:94vh;
            overflow:auto;
            background:#fffdf9;
            border:1px solid #e3ded3;
            box-shadow:0 30px 100px rgba(0,0,0,.35);
            padding:24px;
        ">

            <button
                type="button"
                onclick="closeEvidence()"
                style="
                    position:absolute;
                    right:14px;
                    top:14px;
                    width:38px;
                    height:38px;
                    border:0;
                    border-radius:50%;
                    background:#071525;
                    color:#fff;
                    font-size:21px;
                    cursor:pointer;
                "
            >
                ×
            </button>


            <div style="
                padding-right:50px;
                margin-bottom:16px;
            ">

                <div style="
                    color:#b43b32;
                    font-size:8px;
                    font-weight:800;
                    letter-spacing:.12em;
                ">

                    VERIFICATION EVIDENCE

                </div>


                <h2 style="
                    margin:6px 0 3px;
                    font-family:Fraunces,Georgia,serif;
                ">

                    ${safe(
                        request.shelterName ||
                        "Affected location"
                    )}

                </h2>


                <p style="
                    margin:0;
                    color:#77838e;
                    font-size:9px;
                ">

                    Request
                    ${safe(request.id)}

                </p>

            </div>


            <img
                src="${request.verificationPhoto}"
                alt="Emergency verification evidence"
                style="
                    display:block;
                    width:100%;
                    max-height:65vh;
                    object-fit:contain;
                    background:#f0ece4;
                "
            >


            <div style="
                margin-top:14px;
                padding:13px;
                background:#f7f4ed;
                color:#52606c;
                font-size:10px;
                line-height:1.55;
            ">

                <strong>
                    Situation reported
                </strong>

                <br>

                ${safe(
                    request.situationDetails ||
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
   ALERTS
   ============================================================ */

function renderAlerts() {

    const list =
        document.getElementById(
            "alertList"
        );


    const requests =
        readRequests().filter(
            request =>
                request.status ===
                "flagged"
        );


    setText(
        "alertCount",
        `${requests.length} flagged`
    );


    if (!list) return;


    if (!requests.length) {

        list.innerHTML =
            emptyState(
                "✓",
                "No verification anomalies detected."
            );

        return;
    }


    list.innerHTML =
        requests
            .map(
                request => `

                    <div class="flagged-item">

                        <div class="flag-dot"></div>

                        <div>

                            <strong>

                                ${safe(
                                    request.id
                                )}

                                ·

                                ${safe(
                                    request.shelterName ||
                                    "Affected location"
                                )}

                            </strong>


                            <p>

                                This request was flagged
                                for manual attention.

                                ${
                                    Number(
                                        request.victims ||
                                        0
                                    ).toLocaleString()
                                }

                                people reported.

                            </p>

                        </div>

                    </div>

                `
            )
            .join("");
}


/* ============================================================
   SERVICE MATCHING
   ============================================================ */

function normalizeServices(
    value
) {

    if (
        Array.isArray(value)
    ) {

        return value
            .flatMap(
                item =>
                    normalizeServices(
                        item
                    )
            )
            .filter(Boolean);
    }


    const raw =
        String(
            value || ""
        )
            .replace(
                /\+/g,
                ","
            )
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);


    return raw.map(
        item => {

            const lower =
                item.toLowerCase();


            if (
                lower.includes(
                    "general relief"
                ) ||
                lower.includes(
                    "relief kit"
                ) ||
                lower.includes(
                    "emergency kit"
                )
            ) {

                return "emergency kits";
            }


            if (
                lower.includes(
                    "food"
                )
            ) {

                return "food";
            }


            if (
                lower.includes(
                    "water"
                )
            ) {

                return "water";
            }


            if (
                lower.includes(
                    "medicine"
                ) ||
                lower.includes(
                    "medical"
                )
            ) {

                return "medicine";
            }


            if (
                lower.includes(
                    "shelter"
                )
            ) {

                return "shelter";
            }


            return lower;
        }
    );
}


function serviceCompatible(
    a,
    b
) {

    return (
        a === b ||

        (
            a.includes("emergency") &&
            b.includes("kit")
        ) ||

        (
            b.includes("emergency") &&
            a.includes("kit")
        )
    );
}


function formatServices(
    value
) {

    if (
        Array.isArray(value)
    ) {

        return (
            value.join(", ") ||
            "Not specified"
        );
    }


    return String(
        value ||
        "Not specified"
    );
}


/* ============================================================
   FIND NGO
   ============================================================ */

function findNGO(id) {

    return readNGOs().find(
        ngo =>
            ngo.id === id
    ) || null;
}


/* ============================================================
   DISTANCE — HAVERSINE
   ============================================================ */

function haversine(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius =
        6371;


    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLon =
        toRadians(
            lon2 - lon1
        );


    const a =
        Math.sin(
            dLat / 2
        ) ** 2 +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(
            dLon / 2
        ) ** 2;


    return (
        earthRadius *
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        )
    );
}


function toRadians(
    value
) {

    return (
        value *
        Math.PI /
        180
    );
}


/* ============================================================
   EVIDENCE
   ============================================================ */

function hasEvidence(
    request
) {

    return (

        typeof request.verificationPhoto ===
            "string"

        &&

        request.verificationPhoto
            .startsWith(
                "data:image/"
            )

    );
}


/* ============================================================
   PRIORITY SCORE
   ============================================================ */

function getPriorityScore(
    request
) {

    if (
        typeof calculateUrgencyScore ===
        "function"
    ) {

        return Number(
            calculateUrgencyScore(
                request
            )
        ) || 0;
    }


    return (

        Number(
            request.victims ||
            0
        )

        +

        Number(
            request.daysWithoutSupply ||
            0
        ) * 40

    );
}


/* ============================================================
   COORDINATES
   ============================================================ */

function formatCoordinate(
    value
) {

    const number =
        Number(value);


    return Number.isFinite(
        number
    )

        ? number.toFixed(5)

        : "—";
}


/* ============================================================
   TIME
   ============================================================ */

function formatTime(
    timestamp
) {

    if (!timestamp) {
        return "";
    }


    try {

        return new Date(
            timestamp
        ).toLocaleString(
            [],
            {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    } catch {

        return "";
    }
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

            <div>

                <div class="icon">
                    ${icon}
                </div>

                <div>
                    ${message}
                </div>

            </div>

        </div>

    `;
}


/* ============================================================
   SET TEXT
   ============================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;
    }
}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function safe(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;
}


/* ============================================================
   SAFE JAVASCRIPT ARGUMENT
   ============================================================ */

function jsArg(
    value
) {

    return String(
        value == null
            ? ""
            : value
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
            /\r/g,
            "\\r"
        )

        .replace(
            /\n/g,
            "\\n"
        );
}


/* ============================================================
   CONTROL ROOM MESSAGE
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
        return;
    }


    element.textContent =
        message;


    element.className =
        isError
            ? "show error"
            : "show";


    window.clearTimeout(
        showControlMessage.timer
    );


    showControlMessage.timer =
        window.setTimeout(
            () => {

                element.className =
                    "";

            },
            6000
        );
}
