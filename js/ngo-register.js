/* ============================================================
   NGO REGISTER.JS
   RELIEF RESOLVER — NGO REGISTRATION

   IMPORTANT:

   New NGOs are saved into:

       localStorage["drr_ngos"]

   with:

       status = "pending"

   DARPAN IS NOT USED.

   LOCATION:

       latitude
       longitude
       coordinates: [latitude, longitude]

   The Control Room can therefore use:

       ngo.latitude
       ngo.longitude

   or:

       ngo.coordinates
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    /* ============================================================
       FORM REFERENCES
    ============================================================ */
    const form = document.getElementById("ngoRegisterForm");
    const result = document.getElementById("ngoResult");

    if (!form) {
        console.error("NGO registration form not found.");
        return;
    }


    /* ============================================================
       REMOVE DARPAN COMPLETELY
       ------------------------------------------------------------
       This also protects us if the old HTML still contains:

       <input id="darpanId" required>

       The old field will be removed automatically.
    ============================================================ */

    const oldDarpanInput = document.getElementById("darpanId");

    if (oldDarpanInput) {

        const darpanGroup =
            oldDarpanInput.closest(".form-group");

        if (darpanGroup) {
            darpanGroup.remove();
        }
        else {
            oldDarpanInput.remove();
        }
    }


    /* ============================================================
       TOAST
    ============================================================ */

    const toast =
        document.getElementById("ngoToast");

    const toastText =
        document.getElementById("ngoToastText");

    let toastTimer = null;


    function showToast(message) {

        if (!toast || !toastText) {
            return;
        }

        toastText.textContent = message;

        toast.classList.add("show");

        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        toastTimer = setTimeout(function () {

            toast.classList.remove("show");

        }, 3500);
    }


    /* ============================================================
       SHOW RESULT
    ============================================================ */
function showResult(type, message) {
    const resultElement = document.getElementById("ngoResult");

    if (!resultElement) {
        alert(message);
        return;
    }

    resultElement.className = "ngo-result show " + type;
    resultElement.textContent = message;

    // Force the message to be visible
    resultElement.style.display = "block";
    resultElement.style.visibility = "visible";
    resultElement.style.opacity = "1";

    resultElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

    if (type === "error") {
        showToast(message);
    }
}

    /* ============================================================
       FIELD REFERENCES
    ============================================================ */

    const phoneInput =
        document.getElementById("ngoPhone");

    const phoneError =
        document.getElementById("ngoPhoneError");


    const radiusInput =
        document.getElementById("operatingRadius");

    const radiusError =
        document.getElementById("operatingRadiusError");


    /* ============================================================
       NGO LOCATION MAP
    ============================================================ */

    const useLocationButton =
        document.getElementById("useNgoLocationBtn");

    const locationStatus =
        document.getElementById("ngoLocationStatus");

    const latitudeDisplay =
        document.getElementById("ngoLatitudeDisplay");

    const longitudeDisplay =
        document.getElementById("ngoLongitudeDisplay");


    let ngoMap = null;

    let ngoMarker = null;

    let selectedLatitude = null;

    let selectedLongitude = null;


    /* ============================================================
       FIELD ERROR
    ============================================================ */

    function setFieldError(
        input,
        errorElement,
        valid
    ) {

        if (!input || !errorElement) {
            return;
        }

        if (valid) {

            input.classList.remove("invalid");

            errorElement.classList.remove("show");

        }
        else {

            input.classList.add("invalid");

            errorElement.classList.add("show");
        }
    }


    /* ============================================================
       PHONE VALIDATION
    ============================================================ */

    function validatePhoneLive() {

        if (!phoneInput) {
            return false;
        }

        let value =
            phoneInput.value;

        value =
            value.replace(/\D/g, "");

        if (value.length > 10) {

            value =
                value.substring(0, 10);
        }

        phoneInput.value = value;


        const valid =
            /^[0-9]{10}$/.test(value);


        if (value.length === 0) {

            setFieldError(
                phoneInput,
                phoneError,
                true
            );

            return false;
        }


        setFieldError(
            phoneInput,
            phoneError,
            valid
        );

        return valid;
    }


    /* ============================================================
       RADIUS VALIDATION
    ============================================================ */

    function validateRadiusLive() {

        if (!radiusInput) {
            return false;
        }

        const raw =
            radiusInput.value;

        if (raw === "") {

            setFieldError(
                radiusInput,
                radiusError,
                true
            );

            return false;
        }


        const value =
            Number(raw);


        const valid =
            /^[0-9]+$/.test(raw) &&
            Number.isFinite(value) &&
            value >= 1 &&
            value <= 1000;


        setFieldError(
            radiusInput,
            radiusError,
            valid
        );

        return valid;
    }


    /* ============================================================
       LOCATION STATUS
    ============================================================ */

    function updateLocationStatus(
        message,
        selected,
        isError
    ) {

        if (!locationStatus) {
            return;
        }

        locationStatus.className =
            "ngo-location-status";

        if (selected) {
            locationStatus.classList.add("selected");
        }

        if (isError) {
            locationStatus.classList.add("error");
        }

        locationStatus.innerHTML =
            message;
    }


    /* ============================================================
       SET NGO LOCATION
    ============================================================ */

    function setNgoLocation(
        latitude,
        longitude,
        source
    ) {

        const lat =
            Number(latitude);

        const lng =
            Number(longitude);


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            lat < -90 ||
            lat > 90 ||
            lng < -180 ||
            lng > 180
        ) {

            updateLocationStatus(
                "<strong>Invalid location.</strong> Please select another point on the map.",
                false,
                true
            );

            return false;
        }


        selectedLatitude =
            lat;

        selectedLongitude =
            lng;


        if (!ngoMap) {
            return false;
        }


        /* --------------------------------------------------------
           CREATE OR MOVE MARKER
        -------------------------------------------------------- */

        if (ngoMarker) {

            ngoMarker.setLatLng([
                lat,
                lng
            ]);

        }
        else {

            ngoMarker =
                L.marker(
                    [lat, lng],
                    {
                        draggable: true
                    }
                ).addTo(ngoMap);


            ngoMarker.on(
                "dragend",
                function () {

                    const position =
                        ngoMarker.getLatLng();

                    setNgoLocation(
                        position.lat,
                        position.lng,
                        "marker"
                    );
                }
            );
        }


        /* --------------------------------------------------------
           CENTER MAP
        -------------------------------------------------------- */

        ngoMap.setView(
            [lat, lng],
            Math.max(
                ngoMap.getZoom(),
                13
            )
        );


        /* --------------------------------------------------------
           DISPLAY COORDINATES
        -------------------------------------------------------- */

        if (latitudeDisplay) {

            latitudeDisplay.textContent =
                lat.toFixed(6);
        }


        if (longitudeDisplay) {

            longitudeDisplay.textContent =
                lng.toFixed(6);
        }


        let sourceText =
            "selected on the map";


        if (source === "gps") {

            sourceText =
                "from your current device location";
        }


        updateLocationStatus(
            "<strong>✓ Location selected.</strong> " +
            "Your organization pin is " +
            sourceText +
            ". You can click the map or drag the marker to adjust it.",
            true,
            false
        );


        return true;
    }


    /* ============================================================
       INITIALIZE NGO MAP
    ============================================================ */

    function initializeNgoLocationMap() {

        const mapElement =
            document.getElementById(
                "ngoLocationMap"
            );


        if (
            !mapElement ||
            typeof L === "undefined"
        ) {

            console.error(
                "Leaflet map could not be initialized."
            );

            updateLocationStatus(
                "<strong>Map unavailable.</strong> Please make sure the Leaflet library is loaded.",
                false,
                true
            );

            return;
        }


        /* --------------------------------------------------------
           INDIA DEFAULT VIEW
        -------------------------------------------------------- */

        ngoMap =
            L.map(
                mapElement
            ).setView(
                [22.5937, 78.9629],
                5
            );


        /* --------------------------------------------------------
           OPEN STREET MAP
        -------------------------------------------------------- */

        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,

                attribution:
                    "&copy; OpenStreetMap contributors"
            }
        ).addTo(ngoMap);


        /* --------------------------------------------------------
           CLICK MAP
        -------------------------------------------------------- */

        ngoMap.on(
            "click",
            function (event) {

                setNgoLocation(
                    event.latlng.lat,
                    event.latlng.lng,
                    "map"
                );
            }
        );


        /* --------------------------------------------------------
           FIX MAP SIZE
        -------------------------------------------------------- */

        setTimeout(
            function () {

                ngoMap.invalidateSize();

            },
            250
        );
    }


    /* ============================================================
       USE MY LOCATION
    ============================================================ */

    function useCurrentNgoLocation() {

        if (!navigator.geolocation) {

            updateLocationStatus(
                "<strong>Location access is not supported by this browser.</strong> Please select the location directly on the map.",
                false,
                true
            );

            return;
        }


        if (useLocationButton) {

            useLocationButton.disabled =
                true;

            useLocationButton.textContent =
                "📍 Finding Location...";
        }


        updateLocationStatus(
            "<strong>Finding your location...</strong> Please allow location access when your browser asks.",
            false,
            false
        );


        navigator.geolocation.getCurrentPosition(

            function (position) {

                setNgoLocation(
                    position.coords.latitude,
                    position.coords.longitude,
                    "gps"
                );


                if (useLocationButton) {

                    useLocationButton.disabled =
                        false;

                    useLocationButton.textContent =
                        "📍 Use My Location";
                }
            },


            function (error) {

                let message =
                    "Unable to get your location.";


                if (
                    error.code ===
                    error.PERMISSION_DENIED
                ) {

                    message =
                        "Location permission was denied. Please allow location access in your browser or select the location manually on the map.";
                }

                else if (
                    error.code ===
                    error.POSITION_UNAVAILABLE
                ) {

                    message =
                        "Your location is currently unavailable. Please select the location manually on the map.";
                }

                else if (
                    error.code ===
                    error.TIMEOUT
                ) {

                    message =
                        "Location request timed out. Please try again or select the location manually on the map.";
                }


                updateLocationStatus(
                    "<strong>Location not selected.</strong> " +
                    message,
                    false,
                    true
                );


                if (useLocationButton) {

                    useLocationButton.disabled =
                        false;

                    useLocationButton.textContent =
                        "📍 Use My Location";
                }
            },


            {
                enableHighAccuracy: true,

                timeout: 15000,

                maximumAge: 60000
            }
        );
    }


    /* ============================================================
       INITIALIZE MAP
    ============================================================ */

    initializeNgoLocationMap();


    if (useLocationButton) {

        useLocationButton.addEventListener(
            "click",
            useCurrentNgoLocation
        );
    }


    /* ============================================================
       LIVE VALIDATION EVENTS
    ============================================================ */

    if (phoneInput) {

        phoneInput.addEventListener(
            "input",
            validatePhoneLive
        );
    }


    if (radiusInput) {

        radiusInput.addEventListener(
            "input",
            validateRadiusLive
        );
    }


    /* ============================================================
       FORM SUBMISSION
    ============================================================ */

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


    console.log("NGO REGISTRATION SUBMIT HANDLER RUNNING");
            /* ====================================================
               BASIC INFORMATION
            ==================================================== */

            const name =
                document
                    .getElementById("ngoName")
                    .value
                    .trim();


            const registrationNumber =
                document
                    .getElementById("registrationNumber")
                    .value
                    .trim();


            const contactPerson =
                document
                    .getElementById("contactPerson")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("ngoEmail")
                    .value
                    .trim()
                    .toLowerCase();


            const phone =
                document
                    .getElementById("ngoPhone")
                    .value
                    .trim();


            const country =
                document
                    .getElementById("ngoCountry")
                    .value
                    .trim();


            const state =
                document
                    .getElementById("ngoState")
                    .value
                    .trim();


            const city =
                document
                    .getElementById("ngoCity")
                    .value
                    .trim();


            const radiusRaw =
                document
                    .getElementById("operatingRadius")
                    .value
                    .trim();


            const radius =
                Number(radiusRaw);


            /* ====================================================
               LOCATION FROM MAP
            ==================================================== */

            const latitude =
                selectedLatitude;


            const longitude =
                selectedLongitude;


            /* ====================================================
               PAN
            ==================================================== */

            const panInput =
                document.getElementById(
                    "organisationPan"
                );


            const organisationPan =
                panInput
                    ? panInput.value
                        .trim()
                        .toUpperCase()
                    : "";


            /* ====================================================
               DOCUMENTS
            ==================================================== */

            const registrationCertificateInput =
                document.getElementById(
                    "registrationCertificate"
                );


            const panDocumentInput =
                document.getElementById(
                    "panDocument"
                );


            const registrationCertificate =
                registrationCertificateInput &&
                registrationCertificateInput.files
                    ? registrationCertificateInput.files[0]
                    : null;


            const panDocument =
                panDocumentInput &&
                panDocumentInput.files
                    ? panDocumentInput.files[0]
                    : null;


            /* ====================================================
               SERVICES
            ==================================================== */

            const checkedServices =
                document.querySelectorAll(
                    'input[name="ngoServices"]:checked'
                );


            const services =
                Array.from(
                    checkedServices
                ).map(
                    function (checkbox) {

                        return checkbox.value;
                    }
                );


            /* ====================================================
               AVAILABILITY
            ==================================================== */

            const availabilityInput =
                document.querySelector(
                    'input[name="availability"]:checked'
                );


            const availability =
                availabilityInput
                    ? availabilityInput.value
                    : "";


            /* ====================================================
               PASSWORD
            ==================================================== */

            const passwordInput =
                document.getElementById(
                    "ngoPassword"
                );


            const confirmPasswordInput =
                document.getElementById(
                    "ngoConfirmPassword"
                );


            const password =
                passwordInput
                    ? passwordInput.value
                    : "";


            const confirmPassword =
                confirmPasswordInput
                    ? confirmPasswordInput.value
                    : "";


            /* ====================================================
               AGREEMENTS
            ==================================================== */

            const termsAgreement =
                document.getElementById(
                    "ngoTermsAgreement"
                );


            const accuracyAgreement =
                document.getElementById(
                    "ngoAgreement"
                );


            /* ====================================================
               REQUIRED TEXT FIELDS
            ==================================================== */

            if (!name) {

                showResult(
                    "error",
                    "Please enter the organization name."
                );

                return;
            }


            if (!registrationNumber) {

                showResult(
                    "error",
                    "Please enter the organization registration number."
                );

                return;
            }


            if (!contactPerson) {

                showResult(
                    "error",
                    "Please enter the contact person's name."
                );

                return;
            }


            if (!email) {

                showResult(
                    "error",
                    "Please enter the organization email."
                );

                return;
            }


            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailPattern.test(email)) {

                showResult(
                    "error",
                    "Please enter a valid organization email address."
                );

                return;
            }


            if (!country) {

                showResult(
                    "error",
                    "Please enter the country."
                );

                return;
            }


            if (!state) {

                showResult(
                    "error",
                    "Please enter the state."
                );

                return;
            }


            if (!city) {

                showResult(
                    "error",
                    "Please enter the city or district."
                );

                return;
            }


            /* ====================================================
               PHONE
            ==================================================== */

            if (
                !/^[0-9]{10}$/.test(phone)
            ) {

                setFieldError(
                    phoneInput,
                    phoneError,
                    false
                );


                showResult(
                    "error",
                    "Phone number must contain exactly 10 digits."
                );

                return;
            }


            setFieldError(
                phoneInput,
                phoneError,
                true
            );


            /* ====================================================
               RADIUS
            ==================================================== */

            if (
                !/^[0-9]+$/.test(radiusRaw) ||
                radius < 1 ||
                radius > 1000
            ) {

                setFieldError(
                    radiusInput,
                    radiusError,
                    false
                );


                showResult(
                    "error",
                    "Operating radius must be between 1 and 1000 km."
                );

                return;
            }


            setFieldError(
                radiusInput,
                radiusError,
                true
            );


            /* ====================================================
               MAP LOCATION
            ==================================================== */

            if (
                !Number.isFinite(latitude) ||
                !Number.isFinite(longitude) ||
                latitude < -90 ||
                latitude > 90 ||
                longitude < -180 ||
                longitude > 180
            ) {

                updateLocationStatus(
                    "<strong>Location required.</strong> Please click the map or use the \"Use My Location\" button before submitting.",
                    false,
                    true
                );


                showResult(
                    "error",
                    "Please select your organization's location on the map."
                );

                return;
            }


            /* ====================================================
               PAN
            ==================================================== */

            if (!organisationPan) {

                showResult(
                    "error",
                    "Organisation PAN is required."
                );

                return;
            }


            const panPattern =
                /^[A-Z]{5}[0-9]{4}[A-Z]$/;


            if (
                !panPattern.test(
                    organisationPan
                )
            ) {

                showResult(
                    "error",
                    "Please enter a valid 10-character organisation PAN."
                );

                return;
            }


            /* ====================================================
               REGISTRATION CERTIFICATE
            ==================================================== */

            if (!registrationCertificate) {

                showResult(
                    "error",
                    "Please upload the organization registration certificate."
                );

                return;
            }


            /* ====================================================
               PAN DOCUMENT
            ==================================================== */

            if (!panDocument) {

                showResult(
                    "error",
                    "Please upload the organisation PAN document."
                );

                return;
            }


            /* ====================================================
               ALLOWED FILE TYPES
            ==================================================== */

            const allowedTypes = [
                "application/pdf",
                "image/jpeg",
                "image/png",
                "image/webp"
            ];


            if (
                !allowedTypes.includes(
                    registrationCertificate.type
                )
            ) {

                showResult(
                    "error",
                    "Registration certificate must be PDF, JPG, PNG or WEBP."
                );

                return;
            }


            if (
                !allowedTypes.includes(
                    panDocument.type
                )
            ) {

                showResult(
                    "error",
                    "PAN document must be PDF, JPG, PNG or WEBP."
                );

                return;
            }


            /* ====================================================
               FILE SIZE
            ==================================================== */

            const MAX_FILE_SIZE =
                5 * 1024 * 1024;


            if (
                registrationCertificate.size >
                MAX_FILE_SIZE
            ) {

                showResult(
                    "error",
                    "Registration certificate must be smaller than 5 MB."
                );

                return;
            }


            if (
                panDocument.size >
                MAX_FILE_SIZE
            ) {

                showResult(
                    "error",
                    "PAN document must be smaller than 5 MB."
                );

                return;
            }


            /* ====================================================
               SERVICES
            ==================================================== */

            if (
                services.length === 0
            ) {

                showResult(
                    "error",
                    "Please select at least one type of assistance."
                );

                return;
            }


            /* ====================================================
               AVAILABILITY
            ==================================================== */

            if (!availability) {

                showResult(
                    "error",
                    "Please select your current availability."
                );

                return;
            }


            /* ====================================================
               PASSWORD
            ==================================================== */

            if (
                password.length < 6
            ) {

                showResult(
                    "error",
                    "Password must contain at least 6 characters."
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                showResult(
                    "error",
                    "Passwords do not match."
                );

                return;
            }


            /* ====================================================
               TERMS
            ==================================================== */

            if (
                !termsAgreement ||
                !termsAgreement.checked
            ) {

                showResult(
                    "error",
                    "You must agree to the Terms & Conditions."
                );

                return;
            }


            if (
                !accuracyAgreement ||
                !accuracyAgreement.checked
            ) {

                showResult(
                    "error",
                    "Please confirm that the information provided is accurate."
                );

                return;
            }


            /* ====================================================
               GET EXISTING NGOS
            ==================================================== */

            let ngos = [];


            try {

                const stored =
                    JSON.parse(
                        localStorage.getItem(
                            "drr_ngos"
                        ) || "[]"
                    );


                ngos =
                    Array.isArray(stored)
                        ? stored
                        : [];

            }
            catch (error) {

                console.error(
                    "Unable to read NGO data:",
                    error
                );


                showResult(
                    "error",
                    "Unable to read existing NGO records."
                );

                return;
            }


            /* ====================================================
               DUPLICATE EMAIL
            ==================================================== */

            const duplicateEmail =
                ngos.some(
                    function (ngo) {

                        return (
                            ngo.email &&
                            String(
                                ngo.email
                            ).toLowerCase() ===
                            email
                        );

                    }
                );


            if (duplicateEmail) {

                showResult(
                    "error",
                    "An organization with this email is already registered."
                );

                return;
            }


            /* ====================================================
               DUPLICATE REGISTRATION NUMBER
            ==================================================== */

            const duplicateRegistration =
                ngos.some(
                    function (ngo) {

                        return (
                            ngo.registrationNumber &&
                            String(
                                ngo.registrationNumber
                            ).toLowerCase() ===
                            registrationNumber.toLowerCase()
                        );

                    }
                );


            if (duplicateRegistration) {

                showResult(
                    "error",
                    "This organization registration number is already registered."
                );

                return;
            }


            /* ====================================================
               DUPLICATE PAN
            ==================================================== */

            const duplicatePan =
                ngos.some(
                    function (ngo) {

                        return (
                            ngo.organisationPan &&
                            String(
                                ngo.organisationPan
                            ).toUpperCase() ===
                            organisationPan
                        );

                    }
                );


            if (duplicatePan) {

                showResult(
                    "error",
                    "This organisation PAN is already registered."
                );

                return;
            }


            /* ====================================================
               DOCUMENT METADATA
            ==================================================== */

            const registrationCertificateData = {

                name:
                    registrationCertificate.name,

                type:
                    registrationCertificate.type,

                size:
                    registrationCertificate.size,

                uploadedAt:
                    Date.now()
            };


            const panDocumentData = {

                name:
                    panDocument.name,

                type:
                    panDocument.type,

                size:
                    panDocument.size,

                uploadedAt:
                    Date.now()
            };


            /* ====================================================
               CREATE NGO OBJECT
            ==================================================== */

            const ngo = {

                /* ------------------------------------------------
                   IDENTITY
                ------------------------------------------------ */

                id:
                    generateNgoId(
                        ngos
                    ),

                name:
                    name,

                registrationNumber:
                    registrationNumber,


                /* ------------------------------------------------
                   CONTACT
                ------------------------------------------------ */

                contactPerson:
                    contactPerson,

                email:
                    email,

                phone:
                    phone,


                /* ------------------------------------------------
                   LOCATION
                ------------------------------------------------ */

                country:
                    country,

                state:
                    state,

                city:
                    city,

                operatingRadiusKm:
                    radius,


                /* ------------------------------------------------
                   EXACT MAP LOCATION
                ------------------------------------------------ */

                latitude:
                    latitude,

                longitude:
                    longitude,

                coordinates: [
                    latitude,
                    longitude
                ],


                /* ------------------------------------------------
                   SERVICES
                ------------------------------------------------ */

                services:
                    services,

                availability:
                    availability,


                /* ------------------------------------------------
                   VERIFICATION DOCUMENTS
                   DARPAN REMOVED
                ------------------------------------------------ */

                organisationPan:
                    organisationPan,

                registrationCertificate:
                    registrationCertificateData,

                panDocument:
                    panDocumentData,

                documentsSubmitted:
                    true,


                /* ------------------------------------------------
                   STATUS
                ------------------------------------------------ */

                status:
                    "pending",


                verificationChecklist: {

                    registrationReviewed:
                        false,

                    panReviewed:
                        false,

                    documentsReviewed:
                        false
                },


                /* ------------------------------------------------
                   AGREEMENTS
                ------------------------------------------------ */

                termsAccepted:
                    true,

                termsAcceptedAt:
                    Date.now(),


                /* ------------------------------------------------
                   TIMESTAMPS
                ------------------------------------------------ */

                createdAt:
                    Date.now(),

                updatedAt:
                    Date.now(),


                /* ------------------------------------------------
                   DEMO LOGIN
                ------------------------------------------------ */

                password:
                    password
            };


            /* ====================================================
               SAVE NGO
            ==================================================== */

try {
    const formData = new FormData();

    // Basic account details
    formData.append("name", contactPerson);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("phone", phone);
    formData.append("role", "ngo");

    // Organization details
    formData.append("organizationName", name);
    formData.append("registrationNumber", registrationNumber);
    formData.append("organisationPan", organisationPan);
    formData.append("city", city);
    formData.append("state", state);
    formData.append("country", country);

    formData.append(
        "address",
        [city, state, country].filter(Boolean).join(", ")
    );

    // Location details
    formData.append("latitude", String(Number(latitude)));
    formData.append("longitude", String(Number(longitude)));

    // Service details
    formData.append(
        "serviceAreas",
        JSON.stringify([city, state].filter(Boolean))
    );

    formData.append(
        "supportedEmergencies",
        JSON.stringify(Array.isArray(services) ? services : [])
    );

    formData.append("serviceRadiusKm", String(Number(radius)));

    // Uploaded documents
    if (registrationCertificate instanceof File) {
        formData.append(
            "registrationCertificate",
            registrationCertificate
        );
    }

    if (panDocument instanceof File) {
        formData.append("panDocument", panDocument);
    }

    // Submit registration to the backend
    const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
            method: "POST",
            body: formData
        }
    );

    const responseText = await response.text();
    let data;

    try {
        data = JSON.parse(responseText);
    } catch (parseError) {
        console.error(
            "Non-JSON registration response:",
            responseText
        );

        throw new Error(
            `Server returned a non-JSON response (HTTP ${response.status}). Check the backend terminal for details.`
        );
    }

    // Handle unsuccessful registration
    if (!response.ok || !data.success) {
        throw new Error(
            data.message || "NGO registration failed."
        );
    }

    // Registration succeeded
    console.log(
        "NGO successfully registered in MongoDB:",
        data.user
    );

    showResult(
        "success",
        "Your NGO has been registered successfully! " +
        "Your organization is awaiting verification. " +
        "Redirecting to login..."
    );

    // Reset the form
    form.reset();

    const countryInput = document.getElementById("ngoCountry");

    if (countryInput) {
        countryInput.value = "India";
    }

    // Redirect only once, after successful registration
    setTimeout(function () {
        window.location.replace("./login.html");
    }, 2000);

} catch (error) {
    console.error("Unable to register NGO:", error);

    showResult(
        "error",
        error.message ||
        "The organization could not be saved. Please try again."
    );

    return;
}

// Continue with your existing validation-reset code below.

            /* ====================================================
               VERIFY SAVE
               ----------------------------------------------------
               This is useful while testing.
            ==================================================== */
           
            /* ====================================================
               SUCCESS
            ==================================================== */
showResult(
    "success",
    "Your NGO has been registered successfully! " +
    "Your organization is awaiting verification. " +
    "Redirecting to login..."
);

form.reset();

const countryInput = document.getElementById("ngoCountry");
if (countryInput) {
    countryInput.value = "India";
}

setTimeout(() => {
    window.location.assign("./login.html");
}, 2500);
            /* ----------------------------------------------------
               RESET VALIDATION
            ---------------------------------------------------- */

            setFieldError(
                phoneInput,
                phoneError,
                true
            );


            setFieldError(
                radiusInput,
                radiusError,
                true
            );


            /* ----------------------------------------------------
               RESET LOCATION
            ---------------------------------------------------- */

            selectedLatitude =
                null;

            selectedLongitude =
                null;


            if (
                ngoMarker &&
                ngoMap
            ) {

                ngoMap.removeLayer(
                    ngoMarker
                );

                ngoMarker =
                    null;
            }


            if (latitudeDisplay) {

                latitudeDisplay.textContent =
                    "—";
            }


            if (longitudeDisplay) {

                longitudeDisplay.textContent =
                    "—";
            }


            updateLocationStatus(
                "<strong>Location not selected.</strong> Click anywhere on the map or use <strong>Use My Location</strong> to place your organization marker.",
                false,
                false
            );

        }
    );


    /* ============================================================
       GENERATE NGO ID
    ============================================================ */

    function generateNgoId(ngos) {

        let highestNumber =
            1000;


        ngos.forEach(
            function (ngo) {

                if (
                    !ngo ||
                    !ngo.id
                ) {

                    return;
                }


                const match =
                    String(
                        ngo.id
                    ).match(
                        /^NGO-(\d+)$/i
                    );


                if (!match) {

                    return;
                }


                const number =
                    parseInt(
                        match[1],
                        10
                    );


                if (
                    Number.isFinite(number) &&
                    number > highestNumber
                ) {

                    highestNumber =
                        number;
                }

            }
        );


        return (
            "NGO-" +
            (
                highestNumber + 1
            )
        );
    }

});