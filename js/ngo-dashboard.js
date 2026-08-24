/* ================================================================
   RELIEF RESOLVER
   NGO DASHBOARD

   DATA SOURCES USED BY EXISTING PROJECT

   NGO:
       drr_ngos

   REQUESTS:
       relief_requests

   CONTROL ROOM DISASTER ZONES:
       relief_disaster_zones

   NGO SESSION:
       reliefNgoLoggedIn
       reliefNgoId
       reliefNgoName

   IMPORTANT:
   This dashboard does NOT create a new data system.
   It reads the same data already used by the Control Room.
================================================================ */


/* ================================================================
   GLOBALS
================================================================ */

let ngoDashboardMap = null;

let currentNgo = null;

let ngoMarker = null;

let radiusCircle = null;

let requestMarkers = [];

let disasterZoneLayers = [];

let currentRequests = [];

let currentFilter = "all";


/* ================================================================
   STORAGE KEYS

   These are constants only.
   Do NOT redeclare these in another script on this page.
================================================================ */

const NGO_STORAGE_KEY =
    "drr_ngos";

const REQUEST_STORAGE_KEY =
    "relief_requests";

const DISASTER_STORAGE_KEY =
    "relief_disaster_zones";


/* ================================================================
   DOM READY
================================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeNGODashboard();

    }
);


/* ================================================================
   INITIALIZE
================================================================ */

async function initializeNGODashboard() {

    /*
     * ------------------------------------------------------------
     * CHECK NGO SESSION
     * ------------------------------------------------------------
     */

    const loggedIn =
        sessionStorage.getItem(
            "reliefNgoLoggedIn"
        );

    const ngoId =
        sessionStorage.getItem(
            "reliefNgoId"
        );


    if (
        loggedIn !== "true" ||
        !ngoId
    ) {

        /*
         * NGO is not logged in.
         *
         * IMPORTANT:
         * Never send NGO to individual dashboard.
         */

        window.location.href =
            "login.html";

        return;
    }


    /*
     * ------------------------------------------------------------
     * LOAD NGO
     * ------------------------------------------------------------
     */

    currentNgo =
        getNgoById(
            ngoId
        );


    if (!currentNgo) {

        alert(
            "Your NGO account could not be found."
        );

        sessionStorage.removeItem(
            "reliefNgoLoggedIn"
        );

        sessionStorage.removeItem(
            "reliefNgoId"
        );

        sessionStorage.removeItem(
            "reliefNgoName"
        );

        window.location.href =
            "login.html";

        return;
    }


    /*
     * ------------------------------------------------------------
     * SECURITY CHECK
     *
     * Only verified NGOs can use this dashboard.
     * ------------------------------------------------------------
     */

    if (
        String(
            currentNgo.status || ""
        )
            .trim()
            .toLowerCase() !==
        "verified"
    ) {

        alert(
            "Your NGO is still awaiting verification."
        );

        window.location.href =
            "index.html";

        return;
    }


    /*
     * ------------------------------------------------------------
     * PREPARE OLD NGO RECORDS
     *
     * Some older NGO records may have only:
     *
     * city + state
     *
     * Newer records have:
     *
     * latitude + longitude
     *
     * We support both.
     * ------------------------------------------------------------
     */

    await ensureNGOCoordinates(
        currentNgo
    );


    /*
     * ------------------------------------------------------------
     * RENDER PROFILE
     * ------------------------------------------------------------
     */

    renderNGOProfile();


    /*
     * ------------------------------------------------------------
     * INITIALIZE MAP
     * ------------------------------------------------------------
     */

    initializeMap();


    /*
     * ------------------------------------------------------------
     * RENDER REQUESTS
     * ------------------------------------------------------------
     */

    renderRequests();


    /*
     * ------------------------------------------------------------
     * FILTER BUTTONS
     * ------------------------------------------------------------
     */

    initializeRequestFilters();


    /*
     * ------------------------------------------------------------
     * LOGOUT
     * ------------------------------------------------------------
     */

    initializeLogout();


    /*
     * ------------------------------------------------------------
     * REFRESH WHEN LOCAL STORAGE CHANGES
     * ------------------------------------------------------------
     */

    window.addEventListener(
        "storage",
        handleStorageChange
    );


    /*
     * ------------------------------------------------------------
     * REFRESH PERIODICALLY
     *
     * This is useful during your demo:
     *
     * Control Room verifies request
     * →
     * NGO dashboard updates.
     *
     * Control Room edits/deletes disaster zone
     * →
     * NGO dashboard updates.
     * ------------------------------------------------------------
     */

    setInterval(
        function () {

            refreshDashboard();

        },
        3000
    );

}


/* ================================================================
   NGO STORAGE
================================================================ */

function getNGOs() {

    try {

        const raw =
            localStorage.getItem(
                NGO_STORAGE_KEY
            );

        if (!raw) {
            return [];
        }

        const parsed =
            JSON.parse(raw);

        return Array.isArray(parsed)
            ? parsed
            : [];

    }
    catch (error) {

        console.error(
            "Unable to read NGO records:",
            error
        );

        return [];

    }

}


/* ================================================================
   FIND CURRENT NGO
================================================================ */

function getNgoById(
    ngoId
) {

    const ngos =
        getNGOs();

    return (
        ngos.find(
            ngo =>
                String(
                    ngo.id
                ) ===
                String(
                    ngoId
                )
        )
        ||
        null
    );

}


/* ================================================================
   NUMBER HELPER
================================================================ */

function numberValue(
    value
) {

    const number =
        Number(value);

    return Number.isFinite(
        number
    )
        ? number
        : null;

}


/* ================================================================
   NGO LATITUDE
================================================================ */

function getNgoLat(
    ngo
) {

    if (!ngo) {
        return null;
    }


    /*
     * New format
     */

    const direct =
        numberValue(
            ngo.latitude ??
            ngo.lat
        );

    if (
        direct !== null
    ) {
        return direct;
    }


    /*
     * Nested format
     */

    if (
        ngo.location
    ) {

        const nested =
            numberValue(
                ngo.location.lat ??
                ngo.location.latitude
            );

        if (
            nested !== null
        ) {
            return nested;
        }

    }


    /*
     * coordinates can be:
     *
     * [lat,lng]
     */

    if (
        Array.isArray(
            ngo.coordinates
        )
    ) {

        const coordinate =
            numberValue(
                ngo.coordinates[0]
            );

        if (
            coordinate !== null
        ) {
            return coordinate;
        }

    }


    /*
     * coordinates can also be:
     *
     * { lat, lng }
     */

    if (
        ngo.coordinates &&
        !Array.isArray(
            ngo.coordinates
        )
    ) {

        const coordinate =
            numberValue(
                ngo.coordinates.lat
            );

        if (
            coordinate !== null
        ) {
            return coordinate;
        }

    }


    return null;

}


/* ================================================================
   NGO LONGITUDE
================================================================ */

function getNgoLng(
    ngo
) {

    if (!ngo) {
        return null;
    }


    const direct =
        numberValue(
            ngo.longitude ??
            ngo.lng
        );

    if (
        direct !== null
    ) {
        return direct;
    }


    if (
        ngo.location
    ) {

        const nested =
            numberValue(
                ngo.location.lng ??
                ngo.location.longitude
            );

        if (
            nested !== null
        ) {
            return nested;
        }

    }


    if (
        Array.isArray(
            ngo.coordinates
        )
    ) {

        const coordinate =
            numberValue(
                ngo.coordinates[1]
            );

        if (
            coordinate !== null
        ) {
            return coordinate;
        }

    }


    if (
        ngo.coordinates &&
        !Array.isArray(
            ngo.coordinates
        )
    ) {

        const coordinate =
            numberValue(
                ngo.coordinates.lng ??
                ngo.coordinates.longitude
            );

        if (
            coordinate !== null
        ) {
            return coordinate;
        }

    }


    return null;

}


/* ================================================================
   NGO OPERATING RADIUS
================================================================ */

function getNgoRadius(
    ngo
) {

    const radius =
        numberValue(
            ngo?.operatingRadiusKm ??
            ngo?.operatingRadius ??
            ngo?.radiusKm ??
            ngo?.radius
        );

    if (
        radius === null ||
        radius <= 0
    ) {

        return 0;

    }

    return radius;

}


/* ================================================================
   ENSURE NGO COORDINATES
================================================================ */

async function ensureNGOCoordinates(
    ngo
) {

    let lat =
        getNgoLat(
            ngo
        );

    let lng =
        getNgoLng(
            ngo
        );


    /*
     * Already available.
     */

    if (
        lat !== null &&
        lng !== null
    ) {

        return;

    }


    /*
     * Local city database.
     *
     * Useful for older demo records.
     */

    const cityCoordinates =
        getCityCoordinates(
            ngo.city,
            ngo.state
        );


    if (
        cityCoordinates
    ) {

        ngo.latitude =
            cityCoordinates[0];

        ngo.longitude =
            cityCoordinates[1];

        ngo.lat =
            cityCoordinates[0];

        ngo.lng =
            cityCoordinates[1];

        ngo.coordinates = [
            cityCoordinates[0],
            cityCoordinates[1]
        ];


        persistCurrentNgoCoordinates(
            ngo
        );

        return;

    }


    /*
     * Last fallback:
     * OpenStreetMap Nominatim.
     */

    const city =
        String(
            ngo.city || ""
        ).trim();

    const state =
        String(
            ngo.state || ""
        ).trim();


    if (
        !city &&
        !state
    ) {

        return;

    }


    try {

        const query =
            [
                city,
                state,
                "India"
            ]
                .filter(Boolean)
                .join(", ");


        const response =
            await fetch(
                "https://nominatim.openstreetmap.org/search?" +
                new URLSearchParams({
                    q: query,
                    format: "json",
                    limit: "1"
                }),
                {
                    headers: {
                        Accept:
                            "application/json"
                    }
                }
            );


        if (
            !response.ok
        ) {
            return;
        }


        const results =
            await response.json();


        if (
            !Array.isArray(
                results
            ) ||
            results.length === 0
        ) {

            return;

        }


        lat =
            Number(
                results[0].lat
            );

        lng =
            Number(
                results[0].lon
            );


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {

            return;

        }


        ngo.latitude =
            Number(
                lat.toFixed(6)
            );

        ngo.longitude =
            Number(
                lng.toFixed(6)
            );

        ngo.lat =
            ngo.latitude;

        ngo.lng =
            ngo.longitude;

        ngo.coordinates = [
            ngo.latitude,
            ngo.longitude
        ];


        persistCurrentNgoCoordinates(
            ngo
        );

    }
    catch (error) {

        console.warn(
            "NGO geocoding failed:",
            error
        );

    }

}


/* ================================================================
   CITY COORDINATES
================================================================ */

function getCityCoordinates(
    city,
    state
) {

    const key =
        (
            String(
                city || ""
            )
            .trim()
            .toLowerCase()
            +
            ", " +
            String(
                state || ""
            )
            .trim()
            .toLowerCase()
        )
        .trim();


    const cities = {

        "bathinda, punjab":
            [30.2110, 74.9455],

        "gwalior, madhya pradesh":
            [26.2183, 78.1828],

        "new delhi, delhi":
            [28.6139, 77.2090],

        "delhi, delhi":
            [28.6139, 77.2090],

        "jaipur, rajasthan":
            [26.9124, 75.7873],

        "amritsar, punjab":
            [31.6340, 74.8723],

        "chandigarh, chandigarh":
            [30.7333, 76.7794],

        "lucknow, uttar pradesh":
            [26.8467, 80.9462],

        "varanasi, uttar pradesh":
            [25.3176, 82.9739],

        "patna, bihar":
            [25.5941, 85.1376],

        "kolkata, west bengal":
            [22.5726, 88.3639],

        "guwahati, assam":
            [26.1445, 91.7362],

        "siliguri, west bengal":
            [26.7271, 88.3953],

        "dehradun, uttarakhand":
            [30.3165, 78.0322],

        "haridwar, uttarakhand":
            [29.9457, 78.1642],

        "joshimath, uttarakhand":
            [30.5550, 79.5650],

        "rishikesh, uttarakhand":
            [30.0869, 78.2676],

        "bathinda,punjab":
            [30.2110, 74.9455]

    };


    return (
        cities[key]
        ||
        null
    );

}


/* ================================================================
   PERSIST NGO COORDINATES
================================================================ */

function persistCurrentNgoCoordinates(
    ngo
) {

    try {

        const ngos =
            getNGOs();


        const index =
            ngos.findIndex(
                item =>
                    String(
                        item.id
                    ) ===
                    String(
                        ngo.id
                    )
            );


        if (
            index === -1
        ) {
            return;
        }


        ngos[index] =
            {
                ...ngos[index],
                latitude:
                    getNgoLat(
                        ngo
                    ),
                longitude:
                    getNgoLng(
                        ngo
                    ),
                lat:
                    getNgoLat(
                        ngo
                    ),
                lng:
                    getNgoLng(
                        ngo
                    ),
                coordinates: [
                    getNgoLat(
                        ngo
                    ),
                    getNgoLng(
                        ngo
                    )
                ]
            };


        localStorage.setItem(
            NGO_STORAGE_KEY,
            JSON.stringify(
                ngos
            )
        );

    }
    catch (error) {

        console.warn(
            "Could not persist NGO coordinates:",
            error
        );

    }

}


/* ================================================================
   PROFILE
================================================================ */

function renderNGOProfile() {

    if (
        !currentNgo
    ) {
        return;
    }


    const location =
        [
            currentNgo.city,
            currentNgo.state
        ]
            .filter(Boolean)
            .join(", ");


    const services =
        Array.isArray(
            currentNgo.services
        )
            ? currentNgo.services
            : (
                currentNgo.services
                    ? [
                        currentNgo.services
                    ]
                    : []
            );


    const radius =
        getNgoRadius(
            currentNgo
        );


    setText(
        "heroNgoName",
        currentNgo.name ||
        "Verified NGO"
    );


    setText(
        "heroNgoLocation",
        location ||
        "India"
    );


    setText(
        "profileNgoName",
        currentNgo.name ||
        "Verified NGO"
    );


    setText(
        "profileNgoLocation",
        location ||
        "India"
    );


    setText(
        "profileNgoId",
        currentNgo.id ||
        "—"
    );


    setText(
        "profileRegistration",
        currentNgo.registrationNumber ||
        "—"
    );


    setText(
        "profileContact",
        currentNgo.contactPerson ||
        "—"
    );


    setText(
        "profilePhone",
        currentNgo.phone ||
        "—"
    );


    setText(
        "profileEmail",
        currentNgo.email ||
        "—"
    );


    setText(
        "profileStatus",
        "✓ Verified"
    );


    setText(
        "radiusValue",
        radius
            ? radius
            : "—"
    );


    const availability =
        String(
            currentNgo.availability ||
            "available"
        );


    setText(
        "availabilityValue",
        formatAvailability(
            availability
        )
    );


    setText(
        "availabilityDescription",
        getAvailabilityDescription(
            availability
        )
    );


    const servicesContainer =
        document.getElementById(
            "profileServices"
        );


    if (
        servicesContainer
    ) {

        if (
            services.length === 0
        ) {

            servicesContainer.innerHTML =
                '<span class="service-tag">Relief support</span>';

        }
        else {

            servicesContainer.innerHTML =
                services
                    .map(
                        service =>
                            `
                            <span class="service-tag">
                                ${escapeHTML(service)}
                            </span>
                            `
                    )
                    .join("");

        }

    }

}


/* ================================================================
   AVAILABILITY
================================================================ */

function formatAvailability(
    value
) {

    const normalized =
        String(
            value || ""
        )
            .trim()
            .toLowerCase();


    if (
        normalized.includes(
            "not"
        ) ||
        normalized.includes(
            "unavailable"
        )
    ) {

        return "Currently unavailable";

    }


    if (
        normalized.includes(
            "limited"
        )
    ) {

        return "Limited availability";

    }


    return "Available";

}


/* ================================================================
   AVAILABILITY DESCRIPTION
================================================================ */

function getAvailabilityDescription(
    value
) {

    const normalized =
        String(
            value || ""
        )
            .trim()
            .toLowerCase();


    if (
        normalized.includes(
            "not"
        ) ||
        normalized.includes(
            "unavailable"
        )
    ) {

        return (
            "Your organization is currently marked " +
            "as unavailable for new relief coordination."
        );

    }


    if (
        normalized.includes(
            "limited"
        )
    ) {

        return (
            "Your organization has limited capacity. " +
            "Prioritize the most urgent requests."
        );

    }


    return (
        "Your organization is currently available " +
        "for relief coordination."
    );

}


/* ================================================================
   MAP INITIALIZATION
================================================================ */

function initializeMap() {

    const element =
        document.getElementById(
            "ngoMap"
        );


    if (
        !element
    ) {

        return;

    }


    if (
        typeof L ===
        "undefined"
    ) {

        console.error(
            "Leaflet is not loaded."
        );

        return;

    }


    if (
        ngoDashboardMap
    ) {

        return;

    }


    /*
     * India
     */

    ngoDashboardMap =
        L.map(
            "ngoMap"
        )
        .setView(
            [22.5, 79.0],
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
        ngoDashboardMap
    );


    /*
     * NGO marker + radius
     */

    renderNgoOnMap();


    /*
     * Disaster zones
     */

    renderDisasterZones();


    /*
     * Requests
     */

    renderRequestMarkers();


    /*
     * Fit map
     */

    fitMap();


    /*
     * Leaflet sometimes initializes
     * before its container is fully visible.
     */

    setTimeout(
        function () {

            if (
                ngoDashboardMap
            ) {

                ngoDashboardMap.invalidateSize();

            }

        },
        250
    );

}


/* ================================================================
   NGO ICON
================================================================ */

function createNgoIcon() {

    return L.divIcon({

        className:
            "ngo-dashboard-map-icon",

        html:
            `
            <div style="
                width:46px;
                height:46px;
                border-radius:14px;
                background:#26784a;
                border:4px solid #ffffff;
                box-shadow:0 6px 18px rgba(7,21,37,.28);
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:23px;
            ">
                🏠
            </div>
            `,

        iconSize:
            [46, 46],

        iconAnchor:
            [23, 46],

        popupAnchor:
            [0, -46]

    });

}


/* ================================================================
   PERSON ICON
================================================================ */

function createPersonIcon(
    disaster = false
) {

    const background =
        disaster
            ? "#a92822"
            : "#b83b32";


    return L.divIcon({

        className:
            "ngo-dashboard-person-icon",

        html:
            `
            <div style="
                width:42px;
                height:42px;
                border-radius:50%;
                background:${background};
                border:4px solid #ffffff;
                box-shadow:0 6px 18px rgba(7,21,37,.28);
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:20px;
            ">
                👤
            </div>
            `,

        iconSize:
            [42, 42],

        iconAnchor:
            [21, 42],

        popupAnchor:
            [0, -42]

    });

}


/* ================================================================
   RENDER NGO
================================================================ */

function renderNgoOnMap() {

    if (
        !ngoDashboardMap ||
        !currentNgo
    ) {

        return;

    }


    const lat =
        getNgoLat(
            currentNgo
        );

    const lng =
        getNgoLng(
            currentNgo
        );


    if (
        lat === null ||
        lng === null
    ) {

        console.warn(
            "NGO does not have valid coordinates."
        );

        return;

    }


    /*
     * NGO marker
     */

    if (
        ngoMarker &&
        ngoDashboardMap.hasLayer(
            ngoMarker
        )
    ) {

        ngoDashboardMap.removeLayer(
            ngoMarker
        );

    }


    ngoMarker =
        L.marker(
            [
                lat,
                lng
            ],
            {
                icon:
                    createNgoIcon()
            }
        )
        .addTo(
            ngoDashboardMap
        );


    ngoMarker.bindPopup(
        createNgoPopup(
            currentNgo
        )
    );


    /*
     * Operating radius
     */

    if (
        radiusCircle &&
        ngoDashboardMap.hasLayer(
            radiusCircle
        )
    ) {

        ngoDashboardMap.removeLayer(
            radiusCircle
        );

    }


    const radius =
        getNgoRadius(
            currentNgo
        );


    if (
        radius > 0
    ) {

        radiusCircle =
            L.circle(
                [
                    lat,
                    lng
                ],
                {
                    radius:
                        radius * 1000,

                    color:
                        "#26784a",

                    weight:
                        2.5,

                    opacity:
                        0.85,

                    fillColor:
                        "#26784a",

                    fillOpacity:
                        0.08,

                    dashArray:
                        "8 7"
                }
            )
            .addTo(
                ngoDashboardMap
            );


        radiusCircle.bindPopup(
            `
            <div class="ngo-popup">

                <div class="popup-kicker">
                    OPERATING AREA
                </div>

                <div class="popup-title">
                    ${escapeHTML(
                        currentNgo.name ||
                        "Your NGO"
                    )}
                </div>

                <div class="popup-row">

                    <span>
                        Radius
                    </span>

                    <strong>
                        ${radius} km
                    </strong>

                </div>

                <div class="popup-row">

                    <span>
                        Location
                    </span>

                    <strong>
                        ${escapeHTML(
                            [
                                currentNgo.city,
                                currentNgo.state
                            ]
                                .filter(Boolean)
                                .join(", ")
                        )}
                    </strong>

                </div>

            </div>
            `
        );

    }

}


/* ================================================================
   NGO POPUP
================================================================ */

function createNgoPopup(
    ngo
) {

    const services =
        Array.isArray(
            ngo.services
        )
            ? ngo.services.join(
                ", "
            )
            : (
                ngo.services ||
                "Relief support"
            );


    const radius =
        getNgoRadius(
            ngo
        );


    return `
        <div class="ngo-popup">

            <div class="popup-kicker">
                VERIFIED NGO
            </div>

            <div class="popup-title">
                🏠
                ${escapeHTML(
                    ngo.name ||
                    "Verified NGO"
                )}
            </div>

            <div class="popup-row">

                <span>
                    Location
                </span>

                <strong>
                    ${escapeHTML(
                        [
                            ngo.city,
                            ngo.state
                        ]
                            .filter(Boolean)
                            .join(", ")
                    )}
                </strong>

            </div>

            <div class="popup-row">

                <span>
                    Radius
                </span>

                <strong>
                    ${
                        radius > 0
                            ? radius + " km"
                            : "Not specified"
                    }
                </strong>

            </div>

            <div class="popup-row">

                <span>
                    Services
                </span>

                <strong>
                    ${escapeHTML(
                        services
                    )}
                </strong>

            </div>

            <div class="popup-row">

                <span>
                    Status
                </span>

                <strong>
                    ✓ Verified
                </strong>

            </div>

        </div>
    `;

}


/* ================================================================
   REQUEST STORAGE
================================================================ */

function getRequests() {

    try {

        const raw =
            localStorage.getItem(
                REQUEST_STORAGE_KEY
            );


        if (
            !raw
        ) {

            return [];

        }


        const parsed =
            JSON.parse(
                raw
            );


        return Array.isArray(
            parsed
        )
            ? parsed
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

/* ================================================================
   VERIFIED + NGO-NOTIFIED REQUESTS

   An NGO should only receive a request after the Control Room
   has verified it AND published it to the NGO network.
================================================================ */

function getVerifiedRequests() {

    return getRequests()

        .filter(
            request => {

                /*
                 * Request must be verified.
                 */

                if (
                    request.verified !==
                    true
                ) {

                    return false;

                }


                /*
                 * Request must have been
                 * published to NGO network.
                 */

                if (
                    request.ngoNotificationStatus !==
                    "notified"
                ) {

                    return false;

                }


                /*
                 * Request must have coordinates.
                 */

                const lat =
                    getRequestLat(
                        request
                    );


                const lng =
                    getRequestLng(
                        request
                    );


                return (
                    lat !== null &&
                    lng !== null
                );

            }
        );

}

/* ================================================================
   REQUEST LATITUDE
================================================================ */

function getRequestLat(
    request
) {

    return numberValue(
        request?.lat ??
        request?.latitude ??
        request?.location?.lat ??
        request?.location?.latitude
    );

}


/* ================================================================
   REQUEST LONGITUDE
================================================================ */

function getRequestLng(
    request
) {

    return numberValue(
        request?.lng ??
        request?.longitude ??
        request?.location?.lng ??
        request?.location?.longitude
    );

}


/* ================================================================
   REQUEST DISTANCE
================================================================ */

function distanceFromNgo(
    request
) {

    const ngoLat =
        getNgoLat(
            currentNgo
        );

    const ngoLng =
        getNgoLng(
            currentNgo
        );


    const requestLat =
        getRequestLat(
            request
        );

    const requestLng =
        getRequestLng(
            request
        );


    if (
        ngoLat === null ||
        ngoLng === null ||
        requestLat === null ||
        requestLng === null
    ) {

        return Infinity;

    }


    return haversineDistance(
        ngoLat,
        ngoLng,
        requestLat,
        requestLng
    );

}


/* ================================================================
   HAVERSINE
================================================================ */

function haversineDistance(
    lat1,
    lng1,
    lat2,
    lng2
) {

    const R =
        6371;


    const dLat =
        (
            lat2 -
            lat1
        )
        *
        Math.PI /
        180;


    const dLng =
        (
            lng2 -
            lng1
        )
        *
        Math.PI /
        180;


    const a =
        Math.sin(
            dLat / 2
        ) ** 2
        +
        Math.cos(
            lat1 *
            Math.PI /
            180
        )
        *
        Math.cos(
            lat2 *
            Math.PI /
            180
        )
        *
        Math.sin(
            dLng / 2
        ) ** 2;


    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(
                1 - a
            )
        );


    return (
        R *
        c
    );

}


/* ================================================================
   DISASTER ZONES
================================================================ */

function getDisasterZones() {

    try {

        const raw =
            localStorage.getItem(
                DISASTER_STORAGE_KEY
            );


        if (
            !raw
        ) {

            return [];

        }


        const parsed =
            JSON.parse(
                raw
            );


        if (
            !Array.isArray(
                parsed
            )
        ) {

            return [];

        }


        return parsed.filter(
            zone =>
                zone &&
                zone.active !== false &&
                Array.isArray(
                    zone.coordinates
                ) &&
                zone.coordinates.length >= 3
        );

    }
    catch (error) {

        console.error(
            "Unable to read disaster zones:",
            error
        );

        return [];

    }

}


/* ================================================================
   POINT IN POLYGON
================================================================ */

function pointInsidePolygon(
    lat,
    lng,
    polygon
) {

    let inside =
        false;


    for (
        let i = 0,
            j = polygon.length - 1;

        i < polygon.length;

        j = i++
    ) {

        const xi =
            Number(
                polygon[i][0]
            );

        const yi =
            Number(
                polygon[i][1]
            );

        const xj =
            Number(
                polygon[j][0]
            );

        const yj =
            Number(
                polygon[j][1]
            );


        const intersect =
            (
                yi > lng
            ) !==
            (
                yj > lng
            )
            &&
            (
                lat <
                (
                    (xj - xi) *
                    (lng - yi)
                    /
                    (yj - yi)
                    +
                    xi
                )
            );


        if (
            intersect
        ) {

            inside =
                !inside;

        }

    }


    return inside;

}


/* ================================================================
   REQUEST IS IN DISASTER ZONE
================================================================ */

function isRequestInDisasterZone(
    request
) {

    const lat =
        getRequestLat(
            request
        );

    const lng =
        getRequestLng(
            request
        );


    if (
        lat === null ||
        lng === null
    ) {

        return false;

    }


    const zones =
        getDisasterZones();


    return zones.some(
        zone => {

            const polygon =
                zone.coordinates
                    .map(
                        point => {

                            if (
                                !Array.isArray(
                                    point
                                ) ||
                                point.length <
                                2
                            ) {

                                return null;

                            }


                            const pLat =
                                Number(
                                    point[0]
                                );

                            const pLng =
                                Number(
                                    point[1]
                                );


                            if (
                                !Number.isFinite(
                                    pLat
                                ) ||
                                !Number.isFinite(
                                    pLng
                                )
                            ) {

                                return null;

                            }


                            return [
                                pLat,
                                pLng
                            ];

                        }
                    )
                    .filter(Boolean);


            if (
                polygon.length <
                3
            ) {

                return false;

            }


            return pointInsidePolygon(
                lat,
                lng,
                polygon
            );

        }
    );

}


/* ================================================================
   RENDER REQUEST MARKERS
================================================================ */

function renderRequestMarkers() {

    if (
        !ngoDashboardMap
    ) {

        return;

    }


    /*
     * Remove previous request markers.
     */

    requestMarkers.forEach(
        marker => {

            if (
                ngoDashboardMap.hasLayer(
                    marker
                )
            ) {

                ngoDashboardMap.removeLayer(
                    marker
                );

            }

        }
    );


    requestMarkers =
        [];


    const requests =
        getVerifiedRequests();


    requests.forEach(
        request => {

            const lat =
                getRequestLat(
                    request
                );

            const lng =
                getRequestLng(
                    request
                );


            if (
                lat === null ||
                lng === null
            ) {

                return;

            }


            const disaster =
                isRequestInDisasterZone(
                    request
                );


            const marker =
                L.marker(
                    [
                        lat,
                        lng
                    ],
                    {
                        icon:
                            createPersonIcon(
                                disaster
                            )
                    }
                )
                .addTo(
                    ngoDashboardMap
                );


            marker.bindPopup(
                createRequestPopup(
                    request
                )
            );


            requestMarkers.push(
                marker
            );

        }
    );

}


/* ================================================================
   REQUEST POPUP
================================================================ */

function createRequestPopup(
    request
) {

    const distance =
        distanceFromNgo(
            request
        );


    const radius =
        getNgoRadius(
            currentNgo
        );


    const inside =
        distance <=
        radius;


    const disaster =
        isRequestInDisasterZone(
            request
        );


    const location =
        request.shelterName ||
        request.locationName ||
        "Affected location";


    const person =
        request.reporterName ||
        request.submittedByName ||
        "Affected individual";


    const victims =
        Number(
            request.victims ||
            0
        );


    const supply =
        request.supplyType ||
        "Relief support";


    return `
        <div class="ngo-popup">

            <div class="popup-kicker">
                VERIFIED EMERGENCY REQUEST
            </div>

            <div class="popup-title">
                👤
                ${escapeHTML(
                    location
                )}
            </div>

            <div class="popup-row">

                <span>
                    Reported by
                </span>

                <strong>
                    ${escapeHTML(
                        person
                    )}
                </strong>

            </div>

            <div class="popup-row">

                <span>
                    Distance
                </span>

                <strong>
                    ${
                        Number.isFinite(
                            distance
                        )
                            ? distance.toFixed(1) +
                              " km"
                            : "—"
                    }
                </strong>

            </div>

            <div class="popup-row">

                <span>
                    People affected
                </span>

                <strong>
                    ${victims}
                </strong>

            </div>

            <div class="popup-row">

                <span>
                    Relief needed
                </span>

                <strong>
                    ${escapeHTML(
                        supply
                    )}
                </strong>

            </div>

            <div class="popup-row">

                <span>
                    Coverage
                </span>

                <strong>
                    ${
                        inside
                            ? "Within NGO radius"
                            : "Outside NGO radius"
                    }
                </strong>

            </div>

            ${
                disaster
                    ? `
                        <div
                            style="
                                margin-top:10px;
                                padding:9px;
                                background:#fde9e7;
                                color:#a92822;
                                font-weight:800;
                                font-size:10px;
                            "
                        >
                            🔴 ACTIVE DISASTER ZONE
                        </div>
                    `
                    : ""
            }

        </div>
    `;

}


/* ================================================================
   RENDER DISASTER ZONES
================================================================ */

function renderDisasterZones() {

    if (
        !ngoDashboardMap
    ) {

        return;

    }


    /*
     * Clear old zones.
     */

    disasterZoneLayers.forEach(
        layer => {

            if (
                ngoDashboardMap.hasLayer(
                    layer
                )
            ) {

                ngoDashboardMap.removeLayer(
                    layer
                );

            }

        }
    );


    disasterZoneLayers =
        [];


    const zones =
        getDisasterZones();


    /*
     * Update counter.
     */

    setText(
        "zoneCount",
        zones.length
    );


    zones.forEach(
        zone => {

            const coordinates =
                zone.coordinates
                    .map(
                        point => {

                            if (
                                !Array.isArray(
                                    point
                                ) ||
                                point.length <
                                2
                            ) {

                                return null;

                            }


                            const lat =
                                Number(
                                    point[0]
                                );

                            const lng =
                                Number(
                                    point[1]
                                );


                            if (
                                !Number.isFinite(
                                    lat
                                ) ||
                                !Number.isFinite(
                                    lng
                                )
                            ) {

                                return null;

                            }


                            return [
                                lat,
                                lng
                            ];

                        }
                    )
                    .filter(Boolean);


            if (
                coordinates.length <
                3
            ) {

                return;

            }


            const severity =
                String(
                    zone.severity ||
                    "moderate"
                )
                    .toLowerCase();


            let borderColor =
                "#d99b13";


            let fillColor =
                "#eab308";


            if (
                severity ===
                "high"
            ) {

                borderColor =
                    "#ef6c1a";

                fillColor =
                    "#f97316";

            }


            if (
                severity ===
                "critical"
            ) {

                borderColor =
                    "#c62d27";

                fillColor =
                    "#dc2626";

            }


            const polygon =
                L.polygon(
                    coordinates,
                    {
                        color:
                            borderColor,

                        weight:
                            3,

                        opacity:
                            0.95,

                        fillColor:
                            fillColor,

                        fillOpacity:
                            0.23,

                        dashArray:
                            "8 6",

                        lineJoin:
                            "round"
                    }
                )
                .addTo(
                    ngoDashboardMap
                );


            polygon.bindPopup(
                `
                <div class="ngo-popup">

                    <div class="popup-kicker">
                        ACTIVE DISASTER ZONE
                    </div>

                    <div class="popup-title">
                        🔴
                        ${escapeHTML(
                            zone.name ||
                            "Active Disaster Zone"
                        )}
                    </div>

                    <div class="popup-row">

                        <span>
                            Type
                        </span>

                        <strong>
                            ${escapeHTML(
                                zone.type ||
                                "Disaster"
                            )}
                        </strong>

                    </div>

                    <div class="popup-row">

                        <span>
                            Severity
                        </span>

                        <strong>
                            ${escapeHTML(
                                zone.severity ||
                                "Unknown"
                            )}
                        </strong>

                    </div>

                    <div
                        style="
                            margin-top:10px;
                            color:#667b90;
                            font-size:10px;
                            line-height:1.5;
                        "
                    >
                        This area was marked by
                        the Relief Resolver Control Room.
                    </div>

                </div>
                `
            );


            disasterZoneLayers.push(
                polygon
            );

        }
    );

}


/* ================================================================
   REQUEST RENDERING / CARDS
================================================================ */

function renderRequests() {

    currentRequests =
        getVerifiedRequests()
            .map(
                request => {

                    const distance =
                        distanceFromNgo(
                            request
                        );

                    const radius =
                        getNgoRadius(
                            currentNgo
                        );


                    return {
                        request,
                        distance,
                        insideRadius:
                            distance <=
                            radius,
                        disaster:
                            isRequestInDisasterZone(
                                request
                            )
                    };

                }
            )
            .sort(
                function (a, b) {

                    /*
                     * Disaster requests first.
                     */

                    if (
                        a.disaster !==
                        b.disaster
                    ) {

                        return a.disaster
                            ? -1
                            : 1;

                    }


                    /*
                     * Then nearest.
                     */

                    return (
                        a.distance -
                        b.distance
                    );

                }
            );


    /*
     * Counts
     */

    const nearby =
        currentRequests.filter(
            item =>
                item.insideRadius
        ).length;


    const outside =
        currentRequests.filter(
            item =>
                !item.insideRadius
        ).length;


    const disaster =
        currentRequests.filter(
            item =>
                item.disaster
        ).length;


    setText(
        "nearbyCount",
        nearby
    );


    setText(
        "outsideCount",
        outside
    );


    setText(
        "disasterCount",
        disaster
    );


    setText(
        "allRequestsCount",
        currentRequests.length
    );


    setText(
        "nearRequestsCount",
        nearby
    );


    setText(
        "disasterRequestsCount",
        disaster
    );


    /*
     * Map
     */

    renderRequestMarkers();


    /*
     * Cards
     */

    renderRequestCards();

}


/* ================================================================
   REQUEST CARDS
================================================================ */

function renderRequestCards() {

    const container =
        document.getElementById(
            "requestList"
        );


    if (
        !container
    ) {

        return;

    }


    let filtered =
        currentRequests;


    if (
        currentFilter ===
        "near"
    ) {

        filtered =
            currentRequests.filter(
                item =>
                    item.insideRadius
            );

    }


    if (
        currentFilter ===
        "disaster"
    ) {

        filtered =
            currentRequests.filter(
                item =>
                    item.disaster
            );

    }


    /*
     * No results.
     */

    if (
        filtered.length ===
        0
    ) {

        container.innerHTML =
            `
            <div
                class="empty-state"
                style="grid-column:1/-1;"
            >

                <div class="empty-icon">
                    ✓
                </div>

                <h3>
                    ${
                        currentFilter === "near"
                            ? "No requests inside your radius"
                            : currentFilter === "disaster"
                                ? "No verified requests in disaster zones"
                                : "No verified emergency requests"
                    }
                </h3>

                <p>
                    Verified emergency requests will
                    appear here automatically when they
                    are available for coordination.
                </p>

            </div>
            `;

        return;

    }


    container.innerHTML =
        filtered
            .map(
                item =>
                    createRequestCard(
                        item
                    )
            )
            .join("");

}


/* ================================================================
   REQUEST CARD
================================================================ */

function createRequestCard(
    item
) {

    const request =
        item.request;


    const distance =
        item.distance;


    const location =
        request.shelterName ||
        request.locationName ||
        "Affected location";


    const person =
        request.reporterName ||
        request.submittedByName ||
        "Affected individual";


    const victims =
        Number(
            request.victims ||
            0
        );


    const days =
        Number(
            request.daysWithoutSupply ||
            0
        );


    const supply =
        request.supplyType ||
        "Relief support";


    const requestId =
        request.id ||
        request.requestNumber ||
        "Request";


    /*
     * Tags
     */

    const coverageTag =
        item.insideRadius
            ? `
                <span class="request-tag near">
                    ✓ Within radius
                </span>
              `
            : `
                <span class="request-tag outside">
                    ⚠ Outside radius
                </span>
              `;


    const disasterTag =
        item.disaster
            ? `
                <span class="request-tag disaster">
                    🔴 Disaster zone
                </span>
              `
            : "";


    /*
     * Nearest NGO for outside requests.
     */

    let nearestHTML =
        "";


    if (
        !item.insideRadius
    ) {

        const nearest =
            findNearestVerifiedNGO(
                request
            );


        if (
            nearest
        ) {

            nearestHTML =
                `
                <div class="nearest-box">

                    <strong>
                        Nearest verified NGO:
                    </strong>

                    ${escapeHTML(
                        nearest.ngo.name ||
                        "Verified NGO"
                    )}

                    ·
                    ${nearest.distance.toFixed(1)}
                    km away

                </div>
                `;

        }
        else {

            nearestHTML =
                `
                <div class="nearest-box">

                    No other verified NGO with
                    valid coordinates is currently
                    available.

                </div>
                `;

        }

    }


    return `
        <article class="request-card">

            <div class="request-card-top">

                <div>

                    <div class="request-id">
                        ${escapeHTML(
                            requestId
                        )}
                    </div>

                    <div class="request-location">
                        ${escapeHTML(
                            location
                        )}
                    </div>

                    <div class="request-coordinates">
                        📍
                        ${
                            getRequestLat(
                                request
                            )?.toFixed(5)
                            || "—"
                        },
                        ${
                            getRequestLng(
                                request
                            )?.toFixed(5)
                            || "—"
                        }
                    </div>

                </div>


                <div class="request-distance">

                    <div class="distance-number">

                        ${
                            Number.isFinite(
                                distance
                            )
                                ? distance.toFixed(0)
                                : "—"
                        }

                    </div>

                    <div class="distance-label">
                        km away
                    </div>

                </div>

            </div>


            <div class="request-tags">

                ${coverageTag}

                ${disasterTag}

            </div>


            <div class="request-details">

                <div class="request-detail">

                    <div class="request-detail-label">
                        People affected
                    </div>

                    <div class="request-detail-value">
                        ${victims}
                    </div>

                </div>


                <div class="request-detail">

                    <div class="request-detail-label">
                        Without supply
                    </div>

                    <div class="request-detail-value">
                        ${days}
                        day${days === 1 ? "" : "s"}
                    </div>

                </div>


                <div class="request-detail">

                    <div class="request-detail-label">
                        Relief needed
                    </div>

                    <div class="request-detail-value">
                        ${escapeHTML(
                            supply
                        )}
                    </div>

                </div>


                <div class="request-detail">

                    <div class="request-detail-label">
                        Reported by
                    </div>

                    <div class="request-detail-value">
                        ${escapeHTML(
                            person
                        )}
                    </div>

                </div>

            </div>


            ${nearestHTML}


<div class="request-actions">

    <button
        class="view-request"
        type="button"
        onclick="
            window.focusRequestOnMap(
                '${escapeJS(
                    String(requestId)
                )}'
            )
        "
    >
        VIEW ON MAP →
    </button>


    <button
        type="button"
        class="ngo-help-button"
        onclick="
            ngoAcceptRequest(
                '${escapeJS(
                    String(requestId)
                )}'
            )
        "
    >
        ✓ WE CAN HELP
    </button>

</div>

        </article>
    `;

}


/* ================================================================
   NGO — WE CAN HELP
   ----------------------------------------------------------------
   The NGO is NOT automatically assigned.

   This only records that this NGO voluntarily offered to help.
================================================================ */

function ngoAcceptRequest(
    requestId
) {

    if (
        !currentNgo ||
        !currentNgo.id
    ) {

        alert(
            "Your NGO session could not be identified."
        );

        return;

    }


    const requests =
        getRequests();


    const request =
        requests.find(
            item => {

                const id =
                    item.id ||
                    item.requestNumber ||
                    "";

                return (
                    String(id) ===
                    String(requestId)
                );

            }
        );


    if (!request) {

        alert(
            "This request could not be found."
        );

        return;

    }


    /*
     * Safety check.
     */

    if (
        request.verified !== true ||
        request.ngoNotificationStatus !==
            "notified"
    ) {

        alert(
            "This request is not currently open for NGO responses."
        );

        return;

    }


    /*
     * Initialize response object.
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
     * Check whether this NGO already
     * responded.
     */

    const alreadyResponded =
        request.ngoResponses[
            currentNgo.id
        ];


    if (
        alreadyResponded &&
        alreadyResponded.status ===
            "accepted"
    ) {

        alert(
            "Your NGO has already offered to help with this request."
        );

        return;

    }


    const confirmed =
        confirm(
            `Can ${currentNgo.name || "your NGO"} help with ${request.id}?\n\n` +

            `Location: ${
                request.shelterName ||
                "Affected location"
            }\n` +

            `Need: ${
                request.supplyType ||
                "Relief support"
            }\n\n` +

            `This will send your NGO's response to the Control Room.`
        );


    if (!confirmed) {

        return;

    }


    /*
     * Save this NGO's response.
     */

    request.ngoResponses[
        currentNgo.id
    ] = {

        ngoId:
            currentNgo.id,

        ngoName:
            currentNgo.name ||
            "Verified NGO",

        status:
            "accepted",

        respondedAt:
            Date.now()

    };


    /*
     * DO NOT assign the NGO.
     *
     * We only record a voluntary response.
     */

    delete request.assignedNgoId;

    delete request.assignedNgoName;


    localStorage.setItem(
        REQUEST_STORAGE_KEY,
        JSON.stringify(
            requests
        )
    );


    /*
     * Refresh NGO dashboard immediately.
     */

    renderRequests();


    /*
     * Optional confirmation message.
     */

    showNGOResponseMessage(
        "✓ Your NGO has offered to help. The Control Room has been notified."
    );

}

/* ================================================================
   NGO RESPONSE MESSAGE
================================================================ */

function showNGOResponseMessage(
    message
) {

    let box =
        document.getElementById(
            "ngoResponseMessage"
        );


    /*
     * If the HTML doesn't have a message box,
     * create one automatically.
     *
     * Therefore NO HTML modification is required.
     */

    if (!box) {

        box =
            document.createElement(
                "div"
            );


        box.id =
            "ngoResponseMessage";


        box.style.cssText = `

            position:fixed;
            top:90px;
            right:25px;
            z-index:9999;

            max-width:380px;

            padding:15px 18px;

            background:#eaf5ed;
            color:#26784a;

            border:1px solid #c8e4d2;

            box-shadow:
                0 12px 35px
                rgba(7,21,37,.12);

            font-size:13px;
            font-weight:800;

        `;


        document.body.appendChild(
            box
        );

    }


    box.textContent =
        message;


    box.style.display =
        "block";


    setTimeout(
        function () {

            box.style.display =
                "none";

        },
        4000
    );

}

/* ================================================================
   FIND NEAREST VERIFIED NGO
================================================================ */

function findNearestVerifiedNGO(
    request
) {

    const requestLat =
        getRequestLat(
            request
        );

    const requestLng =
        getRequestLng(
            request
        );


    if (
        requestLat === null ||
        requestLng === null
    ) {

        return null;

    }


    const ngos =
        getNGOs()
            .filter(
                ngo =>
                    String(
                        ngo.status ||
                        ""
                    )
                        .trim()
                        .toLowerCase() ===
                    "verified"
            );


    let nearest =
        null;


    ngos.forEach(
        ngo => {

            /*
             * Don't recommend itself
             */

            if (
                String(
                    ngo.id
                ) ===
                String(
                    currentNgo.id
                )
            ) {

                return;

            }


            const lat =
                getNgoLat(
                    ngo
                );

            const lng =
                getNgoLng(
                    ngo
                );


            if (
                lat === null ||
                lng === null
            ) {

                return;

            }


            const distance =
                haversineDistance(
                    requestLat,
                    requestLng,
                    lat,
                    lng
                );


            if (
                !nearest ||
                distance <
                nearest.distance
            ) {

                nearest = {
                    ngo,
                    distance
                };

            }

        }
    );


    return nearest;

}


/* ================================================================
   FOCUS REQUEST
================================================================ */
function focusRequestOnMap(requestId) {

    console.log("VIEW ON MAP clicked:", requestId);

    // Make sure the map exists
    if (!ngoDashboardMap) {
        console.error("NGO map is not initialized.");

        const mapElement = document.getElementById("ngoMap");

        if (mapElement) {
            mapElement.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }

        return;
    }

    // Find the request from the latest verified requests
    const request = getVerifiedRequests().find(function (item) {

        const id =
            item.id ||
            item.requestNumber ||
            "";

        return String(id) === String(requestId);

    });

    if (!request) {

        console.error(
            "Request not found:",
            requestId
        );

        return;
    }

    // Get request coordinates
    const lat = getRequestLat(request);
    const lng = getRequestLng(request);

    if (
        lat === null ||
        lng === null ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng)
    ) {

        console.error(
            "This request does not have valid coordinates:",
            request
        );

        return;
    }

    console.log(
        "Centering map on:",
        lat,
        lng
    );


    /*
     * ---------------------------------------------------------
     * SCROLL TO MAP
     * ---------------------------------------------------------
     */

    const mapElement =
        document.getElementById("ngoMap");

    if (mapElement) {

        mapElement.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    /*
     * ---------------------------------------------------------
     * CENTER MAP
     * ---------------------------------------------------------
     */

    setTimeout(function () {

        ngoDashboardMap.invalidateSize();

        ngoDashboardMap.setView(
            [lat, lng],
            12,
            {
                animate: true
            }
        );


        /*
         * -----------------------------------------------------
         * FIND REQUEST MARKER
         * -----------------------------------------------------
         */

        let marker = null;

        requestMarkers.forEach(function (item) {

            const position =
                item.getLatLng();

            if (
                Math.abs(position.lat - lat) < 0.00001 &&
                Math.abs(position.lng - lng) < 0.00001
            ) {

                marker = item;

            }

        });


        /*
         * -----------------------------------------------------
         * OPEN REQUEST POPUP
         * -----------------------------------------------------
         */

        if (marker) {

            marker.openPopup();

            // Small bounce effect by zooming slightly
            setTimeout(function () {

                ngoDashboardMap.setView(
                    [lat, lng],
                    13,
                    {
                        animate: true
                    }
                );

            }, 250);

        }
        else {

            console.warn(
                "Request marker was not found. Re-rendering markers..."
            );

            renderRequestMarkers();

            setTimeout(function () {

                const newMarker =
                    requestMarkers.find(function (item) {

                        const position =
                            item.getLatLng();

                        return (
                            Math.abs(position.lat - lat) < 0.00001 &&
                            Math.abs(position.lng - lng) < 0.00001
                        );

                    });

                if (newMarker) {
                    newMarker.openPopup();
                }

            }, 150);

        }

    }, 300);

}
window.focusRequestOnMap = focusRequestOnMap;
/* ================================================================
   FIT MAP
================================================================ */

function fitMap() {

    if (
        !ngoDashboardMap
    ) {

        return;

    }


    const points =
        [];


    /*
     * NGO
     */

    if (
        ngoMarker
    ) {

        points.push(
            ngoMarker.getLatLng()
        );

    }


    /*
     * Requests
     */

    requestMarkers.forEach(
        marker => {

            points.push(
                marker.getLatLng()
            );

        }
    );


    /*
     * Disaster polygons
     */

    disasterZoneLayers.forEach(
        layer => {

            try {

                const bounds =
                    layer.getBounds();


                if (
                    bounds &&
                    bounds.isValid()
                ) {

                    points.push(
                        bounds.getNorthEast()
                    );

                    points.push(
                        bounds.getSouthWest()
                    );

                }

            }
            catch (error) {

                console.warn(
                    "Could not read disaster bounds:",
                    error
                );

            }

        }
    );


    if (
        points.length ===
        0
    ) {

        ngoDashboardMap.setView(
            [22.5, 79.0],
            5
        );

        return;

    }


    const bounds =
        L.latLngBounds(
            points
        );


    ngoDashboardMap.fitBounds(
        bounds,
        {
            padding:
                [45, 45],

            maxZoom:
                10
        }
    );

}


/* ================================================================
   REQUEST FILTERS
================================================================ */

function initializeRequestFilters() {

    const filters =
        document.querySelectorAll(
            ".request-filter"
        );


    filters.forEach(
        filter => {

            filter.addEventListener(
                "click",
                function () {

                    filters.forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                    this.classList.add(
                        "active"
                    );


                    currentFilter =
                        this.dataset.filter ||
                        "all";


                    renderRequestCards();

                }
            );

        }
    );

}


/* ================================================================
   STORAGE CHANGE
================================================================ */

function handleStorageChange(
    event
) {

    if (
        event.key ===
        REQUEST_STORAGE_KEY
        ||
        event.key ===
        NGO_STORAGE_KEY
        ||
        event.key ===
        DISASTER_STORAGE_KEY
    ) {

        refreshDashboard();

    }

}


/* ================================================================
   REFRESH DASHBOARD
================================================================ */

async function refreshDashboard() {

    /*
     * Re-read current NGO.
     */

    const ngoId =
        sessionStorage.getItem(
            "reliefNgoId"
        );


    if (
        !ngoId
    ) {

        return;

    }


    const freshNgo =
        getNgoById(
            ngoId
        );


    if (
        !freshNgo
    ) {

        return;

    }


    currentNgo =
        freshNgo;


    await ensureNGOCoordinates(
        currentNgo
    );


    renderNGOProfile();


    renderDisasterZones();


    renderRequests();


    /*
     * Refresh map size.
     */

    if (
        ngoDashboardMap
    ) {

        setTimeout(
            function () {

                ngoDashboardMap.invalidateSize();

            },
            100
        );

    }

}


/* ================================================================
   LOGOUT
================================================================ */

function initializeLogout() {

    const button =
        document.getElementById(
            "logoutBtn"
        );


    if (
        !button
    ) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            /*
             * Remove NGO session.
             */

            sessionStorage.removeItem(
                "reliefNgoLoggedIn"
            );

            sessionStorage.removeItem(
                "reliefNgoId"
            );

            sessionStorage.removeItem(
                "reliefNgoName"
            );

            sessionStorage.removeItem(
                "reliefAccountRole"
            );


            /*
             * Also make sure individual
             * session isn't accidentally
             * retained.
             */

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


            window.location.href =
                "login.html";

        }
    );

}


/* ================================================================
   SET TEXT
================================================================ */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (
        element
    ) {

        element.textContent =
            value ??
            "—";

    }

}


/* ================================================================
   ESCAPE HTML
================================================================ */

function escapeHTML(
    value
) {

    return String(
        value ??
        ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ================================================================
   ESCAPE JS
================================================================ */

function escapeJS(
    value
) {

    return String(
        value ??
        ""
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
            /"/g,
            '\\"'
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