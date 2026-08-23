/* ============================================================
   RELIEF RESOLVER — REQUEST.JS
   EMERGENCY REQUEST FLOW

   FLOW:

   1. User fills request form
   2. Reporter information is captured
   3. Location is captured
   4. Request ID is generated IMMEDIATELY
   5. Request is saved temporarily
   6. Request ID is shown
   7. After 3 seconds -> login.html
   8. After login -> request is permanently saved
   9. Control Room reads relief_requests

   IMPORTANT:
   - NO alternate number
   - Priority is INTERNAL
   - Priority is NOT shown to user
   - Maximum relief radius = 50 KM
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    /* ============================================================
       FORM ELEMENTS
    ============================================================ */

    const form = document.getElementById("requestForm");
    const banner = document.getElementById("resultBanner");

    if (!form) {
        console.error("Relief Resolver: requestForm not found.");
        return;
    }

    /* LOCATION */

    const latInput = document.getElementById("lat");
    const lngInput = document.getElementById("lng");
    const shelterNameInput = document.getElementById("shelterName");
    const locationStatus = document.getElementById("locationStatus");
    const useLocationBtn = document.getElementById("useLocationBtn");

    /* REPORTER */

    const reporterTypeInput = document.getElementById("reporterType");
    const reporterNameInput = document.getElementById("reporterName");
    const contactNumberInput = document.getElementById("contactNumber");
    const organizationInput = document.getElementById("organization");

    /* EMERGENCY */

    const victimsInput = document.getElementById("victims");
    const daysInput = document.getElementById("days");
    const supplyType = document.getElementById("supplyType");
    const situationInput = document.getElementById("notes");

    /* PHOTO */

    const photoInput = document.getElementById("photo");

    /* MAP */

    const radiusSlider = document.getElementById("radiusSlider");
    const radiusValue = document.getElementById("radiusValue");

    /* PREVIEW */

    const previewVictims = document.getElementById("previewVictims");
    const previewDays = document.getElementById("previewDays");
    const previewNeed = document.getElementById("previewNeed");


    /* ============================================================
       ACCOUNT DROPDOWN
    ============================================================ */

    setupAccountDropdown();


    /* ============================================================
       MAP
    ============================================================ */

    let map = null;
    let selectedMarker = null;
    let reliefCircle = null;

  /* ============================================================
   MAP INITIALIZATION
   ============================================================ */

const mapContainer =
    document.getElementById("disasterMap");

if (
    typeof L !== "undefined" &&
    mapContainer
) {

    /*
     * Prevent Leaflet from initializing the
     * same container more than once.
     */

    if (mapContainer._leaflet_id) {

        console.warn(
            "Relief Resolver: Map already initialized."
        );

        /*
         * If a map instance already exists,
         * don't create another one.
         */

    } else {

        map = L.map(
            mapContainer
        ).setView(
            [22.9734, 78.6569],
            5
        );

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);


        map.on(
            "click",
            function (event) {

                setSelectedLocation(
                    event.latlng.lat,
                    event.latlng.lng
                );

            }
        );

    }
}

    /* ============================================================
       RADIUS
       HARD MAXIMUM = 50 KM
    ============================================================ */

    if (radiusSlider) {

        radiusSlider.min = "5";
        radiusSlider.max = "50";

        let initialRadius =
            Number(radiusSlider.value);

        if (
            Number.isNaN(initialRadius) ||
            initialRadius < 5
        ) {
            initialRadius = 50;
        }

        if (initialRadius > 50) {
            initialRadius = 50;
        }

        radiusSlider.value =
            String(initialRadius);

        updateRadius();

        radiusSlider.addEventListener(
            "input",
            updateRadius
        );
    }


    function updateRadius() {

        if (!radiusSlider) {
            return;
        }

        let radius =
            Number(radiusSlider.value);

        if (Number.isNaN(radius)) {
            radius = 50;
        }

        /* HARD LIMIT */

        radius = Math.max(
            5,
            Math.min(
                50,
                radius
            )
        );

        radiusSlider.value =
            String(radius);

        if (radiusValue) {
            radiusValue.textContent =
                radius + " km";
        }

        if (
            reliefCircle &&
            selectedMarker
        ) {

            reliefCircle.setRadius(
                radius * 1000
            );
        }
    }


    /* ============================================================
       LOCATION SELECTION
    ============================================================ */

    async function setSelectedLocation(
        latitude,
        longitude
    ) {

        latitude = Number(latitude);
        longitude = Number(longitude);

        if (
            Number.isNaN(latitude) ||
            Number.isNaN(longitude)
        ) {
            return;
        }

        if (
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {
            showBanner(
                "error",
                "Invalid location selected."
            );
            return;
        }


        /* SAVE COORDINATES */

        if (latInput) {
            latInput.value =
                latitude.toFixed(6);
        }

        if (lngInput) {
            lngInput.value =
                longitude.toFixed(6);
        }


        /* ========================================================
           PRIORITY COLOUR
        ======================================================== */

        const priority =
            getCurrentPriority();

        const markerClass =
            priority.toLowerCase();


        /* ========================================================
           MAP MARKER
        ======================================================== */

        if (map) {

            if (selectedMarker) {
                map.removeLayer(
                    selectedMarker
                );
            }

            if (reliefCircle) {
                map.removeLayer(
                    reliefCircle
                );
            }


            const icon =
                L.divIcon({
                    className: "",

                    html:
                        `<div class="priority-map-marker ${markerClass}"></div>`,

                    iconSize: [
                        30,
                        30
                    ],

                    iconAnchor: [
                        15,
                        15
                    ]
                });


            selectedMarker =
                L.marker(
                    [
                        latitude,
                        longitude
                    ],
                    {
                        icon: icon
                    }
                ).addTo(map);


            let radius =
                radiusSlider
                    ? Number(radiusSlider.value)
                    : 50;

            radius =
                Math.max(
                    5,
                    Math.min(
                        50,
                        radius
                    )
                );


            reliefCircle =
                L.circle(
                    [
                        latitude,
                        longitude
                    ],
                    {
                        radius:
                            radius * 1000,

                        color:
                            "#b43b32",

                        fillColor:
                            "#b43b32",

                        fillOpacity:
                            0.08,

                        weight:
                            2
                    }
                ).addTo(map);


            map.setView(
                [
                    latitude,
                    longitude
                ],
                12
            );
        }


        /* ========================================================
           AUTO LOCATION NAME
        ======================================================== */

        if (shelterNameInput) {
            shelterNameInput.value =
                "Finding location...";
        }

        updateLocationStatus(
            "Location selected. Finding the location name..."
        );

        await reverseGeocode(
            latitude,
            longitude
        );
    }


    /* ============================================================
       REVERSE GEOCODING
       LAT/LONG -> LOCATION NAME
    ============================================================ */

    async function reverseGeocode(
        latitude,
        longitude
    ) {

        try {

            const response =
                await fetch(
                    "https://nominatim.openstreetmap.org/reverse?" +
                    new URLSearchParams({
                        format: "json",
                        lat: latitude,
                        lon: longitude,
                        zoom: 18,
                        addressdetails: 1
                    })
                );

            if (!response.ok) {
                throw new Error(
                    "Location lookup failed."
                );
            }

            const data =
                await response.json();

            const address =
                data.address || {};

            const parts = [];

            const placeName =
                address.village ||
                address.town ||
                address.city ||
                address.municipality ||
                address.county ||
                address.state_district;

            if (placeName) {
                parts.push(placeName);
            }

            if (
                address.state &&
                !parts.includes(
                    address.state
                )
            ) {
                parts.push(
                    address.state
                );
            }

            if (
                address.country &&
                !parts.includes(
                    address.country
                )
            ) {
                parts.push(
                    address.country
                );
            }

            const finalName =
                parts.length > 0
                    ? parts.join(", ")
                    : (
                        data.display_name ||
                        "Selected Location"
                    );


            if (shelterNameInput) {
                shelterNameInput.value =
                    finalName;
            }

            updateLocationStatus(
                "✓ " +
                finalName +
                " selected successfully."
            );

        } catch (error) {

            console.warn(
                "Reverse geocoding failed:",
                error
            );

            /*
             * IMPORTANT:
             * Don't leave required location field empty.
             */

            const fallback =
                "Selected Location (" +
                latitude.toFixed(5) +
                ", " +
                longitude.toFixed(5) +
                ")";

            if (shelterNameInput) {
                shelterNameInput.value =
                    fallback;
            }

            updateLocationStatus(
                "✓ Location selected. Coordinates recorded."
            );
        }
    }


    function updateLocationStatus(
        message
    ) {

        if (!locationStatus) {
            return;
        }

        locationStatus.innerHTML =
            `<strong>${escapeHtml(message)}</strong>`;
    }


    /* ============================================================
       USE CURRENT LOCATION
    ============================================================ */

    if (useLocationBtn) {

        useLocationBtn.addEventListener(
            "click",
            function () {

                if (
                    !navigator.geolocation
                ) {

                    showBanner(
                        "error",
                        "Your browser does not support location services."
                    );

                    return;
                }


                useLocationBtn.disabled =
                    true;

                useLocationBtn.textContent =
                    "📍 FINDING YOUR LOCATION...";


                navigator.geolocation.getCurrentPosition(

                    function (position) {

                        setSelectedLocation(
                            position.coords.latitude,
                            position.coords.longitude
                        );

                        useLocationBtn.disabled =
                            false;

                        useLocationBtn.textContent =
                            "📍 USE MY CURRENT LOCATION";
                    },

                    function (error) {

                        console.error(
                            "Geolocation error:",
                            error
                        );

                        showBanner(
                            "error",
                            "Unable to access your current location. Please allow location permission or select the location manually on the map."
                        );

                        useLocationBtn.disabled =
                            false;

                        useLocationBtn.textContent =
                            "📍 USE MY CURRENT LOCATION";
                    },

                    {
                        enableHighAccuracy:
                            true,

                        timeout:
                            15000,

                        maximumAge:
                            0
                    }
                );
            }
        );
    }


    /* ============================================================
       PHONE VALIDATION
    ============================================================ */

    if (contactNumberInput) {

        contactNumberInput.addEventListener(
            "input",
            function () {

                this.value =
                    this.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .slice(
                            0,
                            10
                        );
            }
        );
    }


    /* ============================================================
       FORM SUBMISSION
    ============================================================ */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            clearBanner();


            const submitButton =
                form.querySelector(
                    ".submit-emergency, .submit-btn, button[type='submit']"
                );


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.style.opacity =
                    "0.7";

                submitButton.style.cursor =
                    "wait";

                submitButton.textContent =
                    "PREPARING REQUEST...";
            }


            try {

                /* =================================================
                   READ REPORTER
                ================================================= */

                const reporterType =
                    getValue(
                        "reporterType"
                    );

                const reporterName =
                    getValue(
                        "reporterName"
                    );

                const contactNumber =
                    getValue(
                        "contactNumber"
                    );

                const organization =
                    getValue(
                        "organization"
                    );


                /* =================================================
                   READ LOCATION
                ================================================= */

                const shelterName =
                    getValue(
                        "shelterName"
                    );

                const lat =
                    parseFloat(
                        latInput
                            ? latInput.value
                            : ""
                    );

                const lng =
                    parseFloat(
                        lngInput
                            ? lngInput.value
                            : ""
                    );


                /* =================================================
                   READ EMERGENCY
                ================================================= */

                const victims =
                    parseInt(
                        victimsInput
                            ? victimsInput.value
                            : "",
                        10
                    );

                const daysWithoutSupply =
                    parseInt(
                        daysInput
                            ? daysInput.value
                            : "",
                        10
                    );

                const selectedSupplyType =
                    supplyType
                        ? supplyType.value.trim()
                        : "";

                const situationDetails =
                    situationInput
                        ? situationInput.value.trim()
                        : "";


                /* =================================================
                   PHOTO
                ================================================= */

                const photo =
                    photoInput &&
                    photoInput.files &&
                    photoInput.files.length > 0
                        ? photoInput.files[0]
                        : null;


                /* =================================================
                   LOGIN STATUS
                ================================================= */

                const userLoggedIn =
                    sessionStorage.getItem(
                        "reliefUserLoggedIn"
                    ) === "true";

                const userEmail =
                    sessionStorage.getItem(
                        "reliefUserEmail"
                    ) || "";

                const ngoId =
                    sessionStorage.getItem(
                        "reliefNgoId"
                    ) || "";

                const ngoName =
                    sessionStorage.getItem(
                        "reliefNgoName"
                    ) || "";


                /* =================================================
                   VALIDATION
                ================================================= */

                if (!reporterType) {
                    showBanner(
                        "error",
                        "Please select who is submitting this request."
                    );
                    focusElement(
                        "reporterType"
                    );
                    return;
                }


                if (!reporterName) {
                    showBanner(
                        "error",
                        "Please enter the reporter's name."
                    );
                    focusElement(
                        "reporterName"
                    );
                    return;
                }


                if (
                    !/^[6-9]\d{9}$/.test(
                        contactNumber
                    )
                ) {
                    showBanner(
                        "error",
                        "Please enter a valid 10-digit Indian mobile number."
                    );
                    focusElement(
                        "contactNumber"
                    );
                    return;
                }


                if (!shelterName) {
                    showBanner(
                        "error",
                        "Please select the affected location on the map."
                    );
                    focusElement(
                        "shelterName"
                    );
                    return;
                }


                if (
                    Number.isNaN(lat) ||
                    Number.isNaN(lng)
                ) {
                    showBanner(
                        "error",
                        "Please select the affected location on the map or use your current location."
                    );
                    return;
                }


                if (
                    lat < -90 ||
                    lat > 90
                ) {
                    showBanner(
                        "error",
                        "Invalid latitude."
                    );
                    return;
                }


                if (
                    lng < -180 ||
                    lng > 180
                ) {
                    showBanner(
                        "error",
                        "Invalid longitude."
                    );
                    return;
                }


                if (
                    Number.isNaN(victims) ||
                    victims < 1
                ) {
                    showBanner(
                        "error",
                        "Please enter the number of people affected."
                    );
                    focusElement(
                        "victims"
                    );
                    return;
                }


                if (
                    Number.isNaN(
                        daysWithoutSupply
                    ) ||
                    daysWithoutSupply < 0
                ) {
                    showBanner(
                        "error",
                        "Days without support cannot be negative."
                    );
                    focusElement(
                        "days"
                    );
                    return;
                }


                if (!selectedSupplyType) {
                    showBanner(
                        "error",
                        "Please select the immediate relief required."
                    );
                    focusElement(
                        "supplyType"
                    );
                    return;
                }


                if (!situationDetails) {
                    showBanner(
                        "error",
                        "Please describe the emergency situation."
                    );
                    focusElement(
                        "notes"
                    );
                    return;
                }


                if (!photo) {
                    showBanner(
                        "error",
                        "Please upload a current photo of the emergency situation."
                    );
                    return;
                }


                if (
                    !photo.type ||
                    !photo.type.startsWith(
                        "image/"
                    )
                ) {
                    showBanner(
                        "error",
                        "Please upload a valid image file."
                    );
                    return;
                }


                if (
                    photo.size >
                    5 * 1024 * 1024
                ) {
                    showBanner(
                        "error",
                        "The photo must be smaller than 5 MB."
                    );
                    return;
                }


                /* =================================================
                   IMPORTANT FIX
                   
                   GENERATE ID BEFORE PHOTO PROCESSING.
                   
                   This means the ID is created immediately after
                   successful validation.
                ================================================= */
/*
 * EVERY NEW FORM SUBMISSION GETS A NEW REQUEST ID.
 *
 * Do NOT reuse reliefPendingRequest here.
 * Pending requests are only used when RESUMING
 * a request after login.
 */
const requestId = generateRequestId();


                /* =================================================
                   PHOTO

                   Compress only AFTER ID exists.
                   
                   If compression fails, the user still has an ID
                   and we show the actual error instead of silently
                   losing the request.
                ================================================= */

                if (submitButton) {
                    submitButton.textContent =
                        "SAVING REQUEST...";
                }

                let photoDataUrl = "";

                try {

                    photoDataUrl =
                        await readAndCompressImage(
                            photo
                        );

                } catch (photoError) {

                    console.error(
                        "Photo compression error:",
                        photoError
                    );

                    /*
                     * We still keep the request ID.
                     * The user should not lose the request.
                     */

                    photoDataUrl = "";

                    console.warn(
                        "Request will continue without compressed photo."
                    );
                }


                /* =================================================
                   NOT LOGGED IN
                   
                   SAVE TEMPORARILY
                ================================================= */

                if (!userLoggedIn) {

                    const pendingRequest = {

                        /* REQUEST ID */

                        requestId:
                            requestId,

                        id:
                            requestId,

                        requestNumber:
                            requestId,


                        /* REPORTER */

                        reporterType:
                            reporterType,

                        reporterName:
                            reporterName,

                        contactNumber:
                            contactNumber,

                        organization:
                            organization,


                        /* LOCATION */

                        shelterName:
                            shelterName,

                        lat:
                            lat,

                        lng:
                            lng,


                        /* EMERGENCY */

                        victims:
                            victims,

                        daysWithoutSupply:
                            daysWithoutSupply,

                        supplyType:
                            selectedSupplyType,

                        situationDetails:
                            situationDetails,


                        /* PHOTO */

                        verificationPhoto:
                            photoDataUrl,

                        verificationPhotoName:
                            photo.name,


                        /* INTERNAL */

                        priority:
                            calculatePriority(
                                victims,
                                daysWithoutSupply,
                                selectedSupplyType
                            ),

                        radiusKm:
                            Math.min(
                                50,
                                Number(
                                    radiusSlider
                                        ? radiusSlider.value
                                        : 50
                                )
                            ),


                        /* ACCOUNT */

                        submittedByEmail:
                            userEmail,

                        submittedByName:
                            reporterName,

                        submittedByNgoId:
                            null,


                        /* STATUS */

                        status:
                            "Pending Login",

                        createdAt:
                            new Date().toISOString(),

                        savedAt:
                            Date.now()
                    };


                    /*
                     * SAVE BEFORE SHOWING ID
                     */

                    savePendingRequest(
                        pendingRequest
                    );


                    /*
                     * Remember why login is happening.
                     */

                    sessionStorage.setItem(
                        "reliefLoginPurpose",
                        "submit_request"
                    );

                    sessionStorage.setItem(
                        "lastReliefRequestId",
                        requestId
                    );


                    /*
                     * SHOW REQUEST ID
                     */

                    showRequestId(
                        requestId,
                        "✓ Emergency request received."
                    );


                    /*
                     * REDIRECT AFTER 3 SECONDS
                     */

                    setTimeout(
                        function () {

                            window.location.href =
                                "login.html";

                        },
                        3000
                    );


                    return;
                }


                /* =================================================
                   ALREADY LOGGED IN
                ================================================= */

                const request =
                    createRequestObject({

                        requestId:
                            requestId,

                        shelterName:
                            shelterName,

                        lat:
                            lat,

                        lng:
                            lng,

                        victims:
                            victims,

                        daysWithoutSupply:
                            daysWithoutSupply,

                        supplyType:
                            selectedSupplyType,

                        situationDetails:
                            situationDetails,

                        reporterType:
                            reporterType,

                        reporterName:
                            reporterName,

                        contactNumber:
                            contactNumber,

                        organization:
                            organization,

                        submittedByEmail:
                            userEmail,

                        submittedByName:
                            reporterName,

                        submittedByNgoId:
                            ngoId || null,

                        verificationPhoto:
                            photoDataUrl,

                        verificationPhotoName:
                            photo.name,

                        priority:
                            calculatePriority(
                                victims,
                                daysWithoutSupply,
                                selectedSupplyType
                            ),

                        radiusKm:
                            Math.min(
                                50,
                                Number(
                                    radiusSlider
                                        ? radiusSlider.value
                                        : 50
                                )
                            )
                    });


                saveRequestToControlRoom(
                    request
                );
                removePendingRequest();


                sessionStorage.setItem(
                    "lastReliefRequestId",
                    request.id
                );


                showRequestId(
                    request.id,
                    "✓ Emergency request submitted successfully."
                );


                form.reset();


                setTimeout(
                    function () {

                        window.location.href =
                            "individual-dashboard.html";

                    },
                    2500
                );

            } catch (error) {

                console.error(
                    "Request submission failed:",
                    error
                );

                showBanner(
                    "error",
                    error.message ||
                    "Something went wrong while submitting your request."
                );

            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.style.opacity =
                        "1";

                    submitButton.style.cursor =
                        "pointer";

                    submitButton.textContent =
                        "SUBMIT EMERGENCY REQUEST →";
                }
            }
        }
    );


    /* ============================================================
       RESUME REQUEST AFTER LOGIN
    ============================================================ */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );

    if (
        urlParams.get(
            "resumeRequest"
        ) === "true"
    ) {

        resumePendingRequest();
    }


    /* ============================================================
       LIVE PREVIEW
    ============================================================ */

    [
        victimsInput,
        daysInput,
        supplyType
    ].forEach(
        function (element) {

            if (!element) {
                return;
            }

            element.addEventListener(
                "input",
                function () {

                    updatePreview();

                    refreshMapMarker();
                }
            );

            element.addEventListener(
                "change",
                function () {

                    updatePreview();

                    refreshMapMarker();
                }
            );
        }
    );


    updatePreview();


    /* ============================================================
       RESUME PENDING REQUEST
    ============================================================ */

    async function resumePendingRequest() {

        const loggedIn =
            sessionStorage.getItem(
                "reliefUserLoggedIn"
            ) === "true";

        if (!loggedIn) {
            return;
        }

        const pending =
            readPendingRequest();

        if (!pending) {
            return;
        }


        const age =
            Date.now() -
            Number(
                pending.savedAt || 0
            );

        const MAX_AGE =
            30 * 60 * 1000;


        if (
            pending.savedAt &&
            age > MAX_AGE
        ) {

            removePendingRequest();

            showBanner(
                "error",
                "Your saved request has expired. Please fill the request form again."
            );

            return;
        }


        showBanner(
            "success",
            "✓ Login successful. Saving your emergency request..."
        );


        await wait(1000);


        try {

            const currentUserName =
                sessionStorage.getItem(
                    "reliefUserName"
                ) ||
                pending.reporterName ||
                "Relief User";

            const currentUserEmail =
                sessionStorage.getItem(
                    "reliefUserEmail"
                ) ||
                pending.submittedByEmail ||
                "";

            const currentNgoId =
                sessionStorage.getItem(
                    "reliefNgoId"
                ) || "";

            const currentNgoName =
                sessionStorage.getItem(
                    "reliefNgoName"
                ) || "";


            /*
             * IMPORTANT:
             *
             * Keep the reporter information entered
             * BEFORE login.
             */

            const request =
                createRequestObject({

                    requestId:
                        pending.requestId ||
                        pending.id ||
                        generateRequestId(),

                    shelterName:
                        pending.shelterName,

                    lat:
                        pending.lat,

                    lng:
                        pending.lng,

                    victims:
                        pending.victims,

                    daysWithoutSupply:
                        pending.daysWithoutSupply,

                    supplyType:
                        pending.supplyType,

                    situationDetails:
                        pending.situationDetails,

                    reporterType:
                        pending.reporterType ||
                        "Affected Person",

                    reporterName:
                        pending.reporterName ||
                        currentUserName,

                    contactNumber:
                        pending.contactNumber ||
                        "",

                    organization:
                        pending.organization ||
                        currentNgoName ||
                        "",

                    submittedByEmail:
                        currentUserEmail,

                    submittedByName:
                        currentUserName,

                    submittedByNgoId:
                        currentNgoId ||
                        null,

                    verificationPhoto:
                        pending.verificationPhoto ||
                        "",

                    verificationPhotoName:
                        pending.verificationPhotoName ||
                        "emergency-evidence.jpg",

                    priority:
                        pending.priority ||
                        calculatePriority(
                            pending.victims,
                            pending.daysWithoutSupply,
                            pending.supplyType
                        ),

                    radiusKm:
                        Math.min(
                            50,
                            Number(
                                pending.radiusKm ||
                                50
                            )
                        )
                });


            /* =================================================
               SAVE TO CONTROL ROOM
            ================================================= */

            saveRequestToControlRoom(
                request
            );


            sessionStorage.setItem(
                "lastReliefRequestId",
                request.id
            );


            /*
             * REMOVE TEMPORARY COPY ONLY AFTER
             * SUCCESSFUL CONTROL ROOM SAVE.
             */

            removePendingRequest();


            sessionStorage.removeItem(
                "reliefLoginPurpose"
            );


            /*
             * Remove resume query.
             */

            window.history.replaceState(
                {},
                document.title,
                "request.html"
            );


            /*
             * Show SAME REQUEST ID.
             */

            showRequestId(
                request.id,
                "✓ Emergency request submitted successfully."
            );


            setTimeout(
                function () {

                    window.location.href =
                        "individual-dashboard.html";

                },
                2500
            );


        } catch (error) {

            console.error(
                "Could not save pending request:",
                error
            );

            showBanner(
                "error",
                "Your request could not be saved to the Control Room. Your details are still saved temporarily. Please try again."
            );
        }
    }


    /* ============================================================
       ACCOUNT DROPDOWN
    ============================================================ */

    function setupAccountDropdown() {

        const accountButton =
            document.getElementById(
                "accountButton"
            );

        const accountMenu =
            document.getElementById(
                "accountMenu"
            );

        const accountName =
            document.getElementById(
                "accountName"
            );

        const accountMenuName =
            document.getElementById(
                "accountMenuName"
            );

        const accountAvatar =
            document.getElementById(
                "accountAvatar"
            );

        const logoutButton =
            document.getElementById(
                "logoutButton"
            );


        const loggedIn =
            sessionStorage.getItem(
                "reliefUserLoggedIn"
            ) === "true";

        const userName =
            sessionStorage.getItem(
                "reliefUserName"
            ) ||
            "Account";


        if (
            loggedIn &&
            accountName
        ) {
            accountName.textContent =
                userName;
        }


        if (
            loggedIn &&
            accountMenuName
        ) {
            accountMenuName.textContent =
                userName;
        }


        if (
            loggedIn &&
            accountAvatar
        ) {

            accountAvatar.textContent =
                userName
                    .charAt(0)
                    .toUpperCase();
        }


        if (accountButton) {

            accountButton.addEventListener(
                "click",
                function (event) {

                    event.stopPropagation();

                    if (!accountMenu) {
                        return;
                    }

                    const isOpen =
                        accountMenu.classList.contains(
                            "show"
                        );

                    accountMenu.classList.toggle(
                        "show",
                        !isOpen
                    );

                    accountButton.setAttribute(
                        "aria-expanded",
                        String(!isOpen)
                    );
                }
            );
        }


        document.addEventListener(
            "click",
            function () {

                if (
                    accountMenu &&
                    accountMenu.classList.contains(
                        "show"
                    )
                ) {

                    accountMenu.classList.remove(
                        "show"
                    );

                    if (accountButton) {
                        accountButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );
                    }
                }
            }
        );


        if (logoutButton) {

            logoutButton.addEventListener(
                "click",
                function () {

                    sessionStorage.removeItem(
                        "reliefUserLoggedIn"
                    );

                    sessionStorage.removeItem(
                        "reliefUserEmail"
                    );

                    sessionStorage.removeItem(
                        "reliefUserName"
                    );

                    sessionStorage.removeItem(
                        "reliefNgoId"
                    );

                    sessionStorage.removeItem(
                        "reliefNgoName"
                    );

                    window.location.href =
                        "login.html";
                }
            );
        }
    }


    /* ============================================================
       PREVIEW
    ============================================================ */

    function updatePreview() {

        if (previewVictims) {

            previewVictims.textContent =
                victimsInput &&
                victimsInput.value
                    ? victimsInput.value
                    : "—";
        }


        if (previewDays) {

            previewDays.textContent =
                daysInput &&
                daysInput.value
                    ? daysInput.value
                    : "—";
        }


        if (previewNeed) {

            const needNames = {

                "shelter-food":
                    "SHELTER + FOOD",

                food:
                    "FOOD + WATER",

                medicine:
                    "MEDICINE",

                water:
                    "WATER",

                general:
                    "RELIEF KIT"
            };

            previewNeed.textContent =
                needNames[
                    supplyType
                        ? supplyType.value
                        : ""
                ] ||
                "—";
        }
    }


    /* ============================================================
       PRIORITY
       
       INTERNAL ONLY.
       
       NEVER DISPLAY PRIORITY TO PUBLIC USER.
    ============================================================ */

    function getCurrentPriority() {

        const victims =
            parseInt(
                victimsInput
                    ? victimsInput.value
                    : "",
                10
            ) || 0;

        const days =
            parseInt(
                daysInput
                    ? daysInput.value
                    : "",
                10
            ) || 0;

        const supply =
            supplyType
                ? supplyType.value
                : "";

        return calculatePriority(
            victims,
            days,
            supply
        );
    }


    function calculatePriority(
        victims,
        days,
        supply
    ) {

        victims =
            Number(victims) || 0;

        days =
            Number(days) || 0;


        let score = 0;


        /* Number of affected people */

        if (victims >= 100) {
            score += 50;
        } else if (victims >= 50) {
            score += 40;
        } else if (victims >= 20) {
            score += 30;
        } else if (victims >= 10) {
            score += 20;
        } else {
            score += 10;
        }


        /* Days without support */

        if (days >= 5) {
            score += 35;
        } else if (days >= 3) {
            score += 25;
        } else if (days >= 1) {
            score += 15;
        }


        /* Emergency supply */

        if (
            supply === "medicine"
        ) {
            score += 15;
        } else if (
            supply === "food" ||
            supply === "shelter-food"
        ) {
            score += 10;
        } else if (
            supply === "water"
        ) {
            score += 10;
        } else {
            score += 5;
        }


        if (score >= 70) {
            return "HIGH";
        }

        if (score >= 45) {
            return "MEDIUM";
        }

        return "LOW";
    }


    /* ============================================================
       REFRESH MAP MARKER
    ============================================================ */

    function refreshMapMarker() {

        if (
            !selectedMarker ||
            !latInput ||
            !lngInput
        ) {
            return;
        }

        const lat =
            parseFloat(
                latInput.value
            );

        const lng =
            parseFloat(
                lngInput.value
            );

        if (
            Number.isNaN(lat) ||
            Number.isNaN(lng)
        ) {
            return;
        }

        setSelectedLocation(
            lat,
            lng
        );
    }


    /* ============================================================
       CREATE REQUEST OBJECT
    ============================================================ */

    function createRequestObject(data) {

        const id =
            data.requestId ||
            generateRequestId();


        return {

            /* ID */

            id:
                id,

            requestId:
                id,

            requestNumber:
                id,


            /* REPORTER */

            reporterType:
                data.reporterType || "",

            reporterName:
                data.reporterName || "",

            contactNumber:
                data.contactNumber || "",

            organization:
                data.organization || "",


            /* LOCATION */

            shelterName:
                data.shelterName || "",

            latitude:
                Number(data.lat),

            longitude:
                Number(data.lng),

            lat:
                Number(data.lat),

            lng:
                Number(data.lng),


            /* EMERGENCY */

            victims:
                Number(data.victims) || 0,

            daysWithoutSupply:
                Number(
                    data.daysWithoutSupply
                ) || 0,

            supplyType:
                data.supplyType || "",

            situationDetails:
                data.situationDetails || "",


            /* PHOTO */

            verificationPhoto:
                data.verificationPhoto || "",

            verificationPhotoName:
                data.verificationPhotoName || "",


            /* INTERNAL */

            priority:
                data.priority ||
                calculatePriority(
                    data.victims,
                    data.daysWithoutSupply,
                    data.supplyType
                ),

            radiusKm:
                Math.min(
                    50,
                    Number(
                        data.radiusKm || 50
                    )
                ),


            /* ACCOUNT */

            submittedByEmail:
                data.submittedByEmail || "",

            submittedByName:
                data.submittedByName ||
                data.reporterName ||
                "",

            submittedByNgoId:
                data.submittedByNgoId ||
                null,


            /* STATUS */

            status:
                "Pending Verification",

            createdAt:
                new Date().toISOString(),

            timestamp:
                Date.now()
        };
    }


    /* ============================================================
       SAVE REQUEST TO CONTROL ROOM
    ============================================================ */

    function saveRequestToControlRoom(
        request
    ) {

        const STORAGE_KEY =
            "relief_requests";


        let requests = [];


        try {

            const raw =
                localStorage.getItem(
                    STORAGE_KEY
                );

            if (raw) {

                const parsed =
                    JSON.parse(raw);

                if (
                    Array.isArray(parsed)
                ) {
                    requests =
                        parsed;
                }
            }

        } catch (error) {

            console.error(
                "Could not read existing requests:",
                error
            );

            requests = [];
        }


        /* ========================================================
           REMOVE OLD DUPLICATE
        ======================================================== */

        requests =
            requests.filter(
                function (item) {

                    const existingId =
                        item.id ||
                        item.requestId ||
                        item.requestNumber ||
                        "";

                    return (
                        String(existingId) !==
                        String(request.id)
                    );
                }
            );


        /* ADD NEW REQUEST */

        requests.push(
            request
        );


        /* ========================================================
           SAVE
        ======================================================== */

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    requests
                )
            );

        } catch (error) {

            console.error(
                "Could not save request:",
                error
            );

            throw new Error(
                "The request could not be saved to the Control Room. Please try again with a smaller evidence photo."
            );
        }


        /* ========================================================
           VERIFY
        ======================================================== */

        let verificationData = [];


        try {

            verificationData =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) ||
                    "[]"
                );

        } catch (error) {

            throw new Error(
                "The Control Room storage could not be verified."
            );
        }


        const found =
            Array.isArray(
                verificationData
            ) &&
            verificationData.some(
                function (item) {

                    const itemId =
                        item.id ||
                        item.requestId ||
                        item.requestNumber ||
                        "";

                    return (
                        String(itemId) ===
                        String(request.id)
                    );
                }
            );


        if (!found) {

            throw new Error(
                "The request was not found in Control Room storage after saving."
            );
        }


        console.log(
            "RELIEF RESOLVER — REQUEST SAVED TO CONTROL ROOM",
            request
        );


        return true;
    }


    /* ============================================================
       PENDING REQUEST STORAGE
    ============================================================ */

    function savePendingRequest(
        request
    ) {

        const serialized =
            JSON.stringify(
                request
            );


        /*
         * First try sessionStorage.
         */

        try {

            sessionStorage.setItem(
                "reliefPendingRequest",
                serialized
            );

            return true;

        } catch (sessionError) {

            console.warn(
                "SessionStorage failed:",
                sessionError
            );
        }


        /*
         * Fallback to localStorage.
         */

        try {

            localStorage.setItem(
                "reliefPendingRequest",
                serialized
            );

            return true;

        } catch (localError) {

            console.error(
                "LocalStorage failed:",
                localError
            );

            throw new Error(
                "The request could not be saved temporarily. Please use a smaller photo."
            );
        }
    }


    function readPendingRequest() {

        const stores = [
            sessionStorage,
            localStorage
        ];


        for (
            const store of stores
        ) {

            try {

                const raw =
                    store.getItem(
                        "reliefPendingRequest"
                    );

                if (!raw) {
                    continue;
                }


                const parsed =
                    JSON.parse(
                        raw
                    );


                if (
                    parsed &&
                    typeof parsed ===
                    "object"
                ) {

                    return parsed;
                }

            } catch (error) {

                console.warn(
                    "Could not read pending request:",
                    error
                );
            }
        }


        return null;
    }


    function removePendingRequest() {

        try {

            sessionStorage.removeItem(
                "reliefPendingRequest"
            );

        } catch (error) {}


        try {

            localStorage.removeItem(
                "reliefPendingRequest"
            );

        } catch (error) {}
    }


    /* ============================================================
       REQUEST ID
    ============================================================ */

    function generateRequestId() {

        const date =
            new Date();


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );


        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );


        const random =
            Math.random()
                .toString(36)
                .substring(
                    2,
                    8
                )
                .toUpperCase();


        return (
            "RR-" +
            year +
            month +
            day +
            "-" +
            random
        );
    }


    /* ============================================================
       SHOW REQUEST ID
    ============================================================ */

    function showRequestId(
        requestId,
        heading
    ) {

        const title =
            heading ||
            "✓ Emergency request submitted successfully.";


        showBanner(
            "success",
            title +
            "\n\nREQUEST NUMBER: " +
            requestId +
            "\n\nKeep this Request Number. It is the unique ID used to identify your emergency request.\n\nRedirecting you to login..."
        );
    }


    /* ============================================================
       HELPERS
    ============================================================ */

    function getValue(id) {

        const element =
            document.getElementById(
                id
            );

        return element
            ? (
                element.value ||
                ""
            ).trim()
            : "";
    }


    function focusElement(id) {

        const element =
            document.getElementById(
                id
            );

        if (element) {
            element.focus();
        }
    }


 function showBanner(type, message) {

    if (!banner) {

        alert(message);

        return;
    }

    banner.className =
        "result-banner show " + type;

    banner.textContent =
        message;

    /* IMPORTANT:
       Force the banner to become visible.
       This protects against CSS conflicts.
    */
    banner.style.display = "block";

    banner.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

    function clearBanner() {

        if (!banner) {
            return;
        }


        banner.className =
            "result-banner";


        banner.textContent =
            "";
    }


    function wait(
        milliseconds
    ) {

        return new Promise(
            function (resolve) {

                setTimeout(
                    resolve,
                    milliseconds
                );
            }
        );
    }


    function escapeHtml(
        value
    ) {

        return String(value)
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


    /* ============================================================
       IMAGE COMPRESSION
    ============================================================ */

    function readAndCompressImage(
        file
    ) {

        return new Promise(
            function (
                resolve,
                reject
            ) {

                const reader =
                    new FileReader();


                reader.onload =
                    function () {

                        const image =
                            new Image();


                        image.onload =
                            function () {

                                const MAX_WIDTH =
                                    900;

                                const MAX_HEIGHT =
                                    900;


                                const scale =
                                    Math.min(
                                        1,

                                        MAX_WIDTH /
                                            image.width,

                                        MAX_HEIGHT /
                                            image.height
                                    );


                                const canvas =
                                    document.createElement(
                                        "canvas"
                                    );


                                canvas.width =
                                    Math.max(
                                        1,

                                        Math.round(
                                            image.width *
                                            scale
                                        )
                                    );


                                canvas.height =
                                    Math.max(
                                        1,

                                        Math.round(
                                            image.height *
                                            scale
                                        )
                                    );


                                const context =
                                    canvas.getContext(
                                        "2d"
                                    );


                                if (!context) {

                                    reject(
                                        new Error(
                                            "Could not create image canvas."
                                        )
                                    );

                                    return;
                                }


                                context.drawImage(
                                    image,
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height
                                );


                                const dataUrl =
                                    canvas.toDataURL(
                                        "image/jpeg",
                                        0.55
                                    );


                                resolve(
                                    dataUrl
                                );
                            };


                        image.onerror =
                            function () {

                                reject(
                                    new Error(
                                        "Invalid image file."
                                    )
                                );
                            };


                        image.src =
                            reader.result;
                    };


                reader.onerror =
                    function () {

                        reject(
                            new Error(
                                "Could not read the image file."
                            )
                        );
                    };


                reader.readAsDataURL(
                    file
                );
            }
        );
    }

});
