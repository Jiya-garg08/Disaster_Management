/* ============================================================
   ngo-register.js
   NGO registration — Phase 1

   New NGOs are ALWAYS created with:
       status = "pending"

   NGOs cannot access the NGO dashboard until
   Relief Resolver staff verifies them.

   Verification credentials:
       - Registration Number
       - NGO DARPAN ID
       - Organisation PAN
       - Registration Certificate
       - PAN Document

   IMPORTANT:
   This is a Phase 1 browser-only demo.
   Uploaded files are represented by metadata in localStorage.
   Real document storage and server-side verification should
   be implemented when a backend is added.
   ============================================================ */


document.addEventListener("DOMContentLoaded", () => {

    const form =
        document.getElementById("ngoRegisterForm");

    const result =
        document.getElementById("ngoResult");


    if (!form) {
        console.error("NGO registration form not found.");
        return;
    }


    form.addEventListener("submit", (event) => {

        event.preventDefault();


        /* =====================================================
           1. GET BASIC ORGANIZATION INFORMATION
           ===================================================== */

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


        const operatingRadius =
            parseInt(
                document
                    .getElementById("operatingRadius")
                    .value,
                10
            );


        /* =====================================================
           2. GET VERIFICATION CREDENTIALS
           ===================================================== */

        const darpanId =
            document
                .getElementById("darpanId")
                .value
                .trim()
                .toUpperCase();


        const organisationPan =
            document
                .getElementById("organisationPan")
                .value
                .trim()
                .toUpperCase();


        const registrationCertificateInput =
            document.getElementById(
                "registrationCertificate"
            );


        const panDocumentInput =
            document.getElementById(
                "panDocument"
            );


        const registrationCertificate =
            registrationCertificateInput.files[0];


        const panDocument =
            panDocumentInput.files[0];


        /* =====================================================
           3. GET SERVICES
           ===================================================== */

        const serviceCheckboxes =
            document.querySelectorAll(
                'input[name="ngoServices"]:checked'
            );


        const services =
            Array.from(serviceCheckboxes)
                .map((checkbox) => checkbox.value);


        /* =====================================================
           4. GET AVAILABILITY
           ===================================================== */

        const availabilityInput =
            document.querySelector(
                'input[name="availability"]:checked'
            );


        const availability =
            availabilityInput
                ? availabilityInput.value
                : "";


        /* =====================================================
           5. GET PASSWORD
           ===================================================== */

        const password =
            document
                .getElementById("ngoPassword")
                .value;


        const confirmPassword =
            document
                .getElementById("ngoConfirmPassword")
                .value;


        /* =====================================================
           6. GET AGREEMENT
           ===================================================== */

        const agreement =
            document.getElementById(
                "ngoAgreement"
            );


        /* =====================================================
           7. BASIC VALIDATION
           ===================================================== */

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


        if (!darpanId) {

            showResult(
                "error",
                "NGO DARPAN ID is required."
            );

            return;
        }


        if (!organisationPan) {

            showResult(
                "error",
                "Organisation PAN is required."
            );

            return;
        }


        /* =====================================================
           8. DARPAN ID VALIDATION
           ===================================================== */

        const darpanPattern =
            /^[A-Z0-9\-\/]{6,30}$/;


        if (!darpanPattern.test(darpanId)) {

            showResult(
                "error",
                "Please enter a valid NGO DARPAN ID."
            );

            return;
        }


        /* =====================================================
           9. PAN VALIDATION
           ===================================================== */

        const panPattern =
            /^[A-Z]{5}[0-9]{4}[A-Z]$/;


        if (!panPattern.test(organisationPan)) {

            showResult(
                "error",
                "Please enter a valid 10-character organisation PAN."
            );

            return;
        }


        /* =====================================================
           10. DOCUMENT VALIDATION
           ===================================================== */

        if (!registrationCertificate) {

            showResult(
                "error",
                "Please upload the organization registration certificate."
            );

            return;
        }


        if (!panDocument) {

            showResult(
                "error",
                "Please upload the organisation PAN document."
            );

            return;
        }


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
                "Registration certificate must be a PDF, JPG, PNG or WEBP file."
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
                "PAN document must be a PDF, JPG, PNG or WEBP file."
            );

            return;
        }


        /* =====================================================
           11. FILE SIZE CHECK
           Maximum 5 MB per document
           ===================================================== */

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


        /* =====================================================
           12. SERVICES
           ===================================================== */

        if (services.length === 0) {

            showResult(
                "error",
                "Please select at least one type of assistance your organization provides."
            );

            return;
        }


        /* =====================================================
           13. AVAILABILITY
           ===================================================== */

        if (!availability) {

            showResult(
                "error",
                "Please select your current availability."
            );

            return;
        }


        /* =====================================================
           14. PASSWORD
           ===================================================== */

        if (password !== confirmPassword) {

            showResult(
                "error",
                "Passwords do not match."
            );

            return;
        }


        if (password.length < 6) {

            showResult(
                "error",
                "Password must contain at least 6 characters."
            );

            return;
        }


        /* =====================================================
           15. AGREEMENT
           ===================================================== */

        if (!agreement.checked) {

            showResult(
                "error",
                "You must confirm that the information provided is accurate."
            );

            return;
        }


        /* =====================================================
           16. GET EXISTING NGOs
           ===================================================== */

        const ngos =
            JSON.parse(
                localStorage.getItem("drr_ngos") || "[]"
            );


        /* =====================================================
           17. DUPLICATE EMAIL
           ===================================================== */

        const emailExists =
            ngos.some(
                (ngo) =>
                    ngo.email &&
                    ngo.email.toLowerCase() === email
            );


        if (emailExists) {

            showResult(
                "error",
                "An organization with this email is already registered."
            );

            return;
        }


        /* =====================================================
           18. DUPLICATE REGISTRATION NUMBER
           ===================================================== */

        const registrationExists =
            ngos.some(
                (ngo) =>
                    ngo.registrationNumber &&
                    ngo.registrationNumber
                        .toLowerCase() ===
                    registrationNumber.toLowerCase()
            );


        if (registrationExists) {

            showResult(
                "error",
                "This organization registration number is already registered."
            );

            return;
        }


        /* =====================================================
           19. DUPLICATE DARPAN ID
           ===================================================== */

        const darpanExists =
            ngos.some(
                (ngo) =>
                    ngo.darpanId &&
                    ngo.darpanId.toUpperCase() ===
                    darpanId
            );


        if (darpanExists) {

            showResult(
                "error",
                "This NGO DARPAN ID is already registered."
            );

            return;
        }


        /* =====================================================
           20. DUPLICATE PAN
           ===================================================== */

        const panExists =
            ngos.some(
                (ngo) =>
                    ngo.organisationPan &&
                    ngo.organisationPan.toUpperCase() ===
                    organisationPan
            );


        if (panExists) {

            showResult(
                "error",
                "This organisation PAN is already registered."
            );

            return;
        }


        /* =====================================================
           21. DOCUMENT METADATA
           ===================================================== */

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


        /* =====================================================
           22. CREATE NGO OBJECT
           ===================================================== */

        const ngo = {

            id:
                generateNgoId(ngos),


            name:
                name,


            registrationNumber:
                registrationNumber,


            /* -------------------------------
               VERIFICATION CREDENTIALS
               ------------------------------- */

            darpanId:
                darpanId,


            organisationPan:
                organisationPan,


            registrationCertificate:
                registrationCertificateData,


            panDocument:
                panDocumentData,


            documentsSubmitted:
                true,


            /* -------------------------------
               CONTACT
               ------------------------------- */

            contactPerson:
                contactPerson,


            email:
                email,


            phone:
                phone,


            /* -------------------------------
               LOCATION
               ------------------------------- */

            country:
                country,


            state:
                state,


            city:
                city,


            operatingRadiusKm:
                operatingRadius,


            /* -------------------------------
               SERVICES
               ------------------------------- */

            services:
                services,


            availability:
                availability,


            /* -------------------------------
               VERIFICATION
               ------------------------------- */

            status:
                "pending",


            verificationChecklist: {

                registrationReviewed:
                    false,

                darpanReviewed:
                    false,

                panReviewed:
                    false,

                documentsReviewed:
                    false

            },


            /* -------------------------------
               TIMESTAMPS
               ------------------------------- */

            createdAt:
                Date.now(),


            /* -------------------------------
               PHASE 1 DEMO LOGIN
               ------------------------------- */

            password:
                password

        };


        /* =====================================================
           23. SAVE NGO
           ===================================================== */

        ngos.push(ngo);


        localStorage.setItem(
            "drr_ngos",
            JSON.stringify(ngos)
        );


        /* =====================================================
           24. SUCCESS MESSAGE
           ===================================================== */

        showResult(

            "success",

            `✓ ${name} has been registered successfully. Your organization is now pending verification. Relief Resolver staff will review your credentials and documents before approval.`

        );


        /* =====================================================
           25. RESET FORM
           ===================================================== */

        form.reset();


        document.getElementById(
            "ngoCountry"
        ).value = "India";


    });


    /* =========================================================
       GENERATE NGO ID
       ========================================================= */

    function generateNgoId(ngos) {

        const nextNumber =
            1001 + ngos.length;

        return `NGO-${nextNumber}`;

    }


    /* =========================================================
       SHOW RESULT
       ========================================================= */

    function showResult(type, message) {

        if (!result) {

            alert(message);

            return;

        }


        result.className =
            `ngo-result show ${type}`;


        result.textContent =
            message;


        result.scrollIntoView({

            behavior:
                "smooth",

            block:
                "nearest"

        });

    }

});