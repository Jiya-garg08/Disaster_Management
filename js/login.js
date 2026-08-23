/* ============================================================
   login.js
   Relief Resolver — Common Login

   ONE LOGIN PAGE FOR:

   1. Individual
   2. NGO
   3. Staff

   Staff is intentionally NOT shown as a role.

   IMPORTANT ROLE SEPARATION:

   Individual:
       reliefUserLoggedIn = true
       reliefAccountRole = individual

   NGO:
       reliefNgoLoggedIn = true
       reliefAccountRole = ngo

   Staff:
       reliefStaffLoggedIn = true
       reliefAccountRole = staff

   Only ONE role is allowed to be active at a time.
   ============================================================ */


document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* ============================================================
           ELEMENTS
           ============================================================ */

        const form =
            document.getElementById(
                "commonLoginForm"
            );


        const roleSwitch =
            document.getElementById(
                "roleSwitch"
            );


        const individualRole =
            document.getElementById(
                "individualRole"
            );


        const ngoRole =
            document.getElementById(
                "ngoRole"
            );


        const loginTitle =
            document.getElementById(
                "loginTitle"
            );


        const loginDescription =
            document.getElementById(
                "loginDescription"
            );


        const identifierLabel =
            document.getElementById(
                "identifierLabel"
            );


        const identifierInput =
            document.getElementById(
                "loginIdentifier"
            );


        const passwordInput =
            document.getElementById(
                "loginPassword"
            );


        const error =
            document.getElementById(
                "loginError"
            );


        const success =
            document.getElementById(
                "loginSuccess"
            );


        const individualRegisterLink =
            document.getElementById(
                "individualRegisterLink"
            );


        const ngoRegisterLink =
            document.getElementById(
                "ngoRegisterLink"
            );


        let selectedRole =
            "individual";


        /* ============================================================
           SESSION HELPERS

           IMPORTANT:
           These functions make sure Individual, NGO and Staff
           sessions can NEVER remain active together.
           ============================================================ */


        function clearIndividualSession() {

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

        }


        function clearNgoSession() {

            sessionStorage.removeItem(
                "reliefNgoLoggedIn"
            );

            sessionStorage.removeItem(
                "reliefNgoId"
            );

            sessionStorage.removeItem(
                "reliefNgoName"
            );

        }


        function clearStaffSession() {

            sessionStorage.removeItem(
                "reliefStaffLoggedIn"
            );

            sessionStorage.removeItem(
                "reliefStaffName"
            );

        }


        function clearAllSessions() {

            clearIndividualSession();

            clearNgoSession();

            clearStaffSession();

            sessionStorage.removeItem(
                "reliefAccountRole"
            );

        }


        /* ============================================================
           INDIVIDUAL MODE
           ============================================================ */

        function selectIndividual() {

            selectedRole =
                "individual";


            if (roleSwitch) {

                roleSwitch.classList.remove(
                    "ngo-active"
                );

            }


            if (individualRole) {

                individualRole.classList.add(
                    "active"
                );

            }


            if (ngoRole) {

                ngoRole.classList.remove(
                    "active"
                );

            }


            if (loginTitle) {

                loginTitle.textContent =
                    "Sign in as an individual";

            }


            if (loginDescription) {

                loginDescription.textContent =
                    "Continue to manage your emergency requests and assistance.";

            }


            if (identifierLabel) {

                identifierLabel.textContent =
                    "Email";

            }


            if (identifierInput) {

                identifierInput.placeholder =
                    "Enter your email";

            }


            if (individualRegisterLink) {

                individualRegisterLink.style.display =
                    "inline-block";

            }


            if (ngoRegisterLink) {

                ngoRegisterLink.style.display =
                    "none";

            }


            clearMessages();

        }


        /* ============================================================
           NGO MODE
           ============================================================ */

        function selectNgo() {

            selectedRole =
                "ngo";


            if (roleSwitch) {

                roleSwitch.classList.add(
                    "ngo-active"
                );

            }


            if (individualRole) {

                individualRole.classList.remove(
                    "active"
                );

            }


            if (ngoRole) {

                ngoRole.classList.add(
                    "active"
                );

            }


            if (loginTitle) {

                loginTitle.textContent =
                    "Sign in as an NGO";

            }


            if (loginDescription) {

                loginDescription.textContent =
                    "Access your verified organization's relief dashboard.";

            }


            if (identifierLabel) {

                identifierLabel.textContent =
                    "Organization Email";

            }


            if (identifierInput) {

                identifierInput.placeholder =
                    "Enter organization email";

            }


            if (individualRegisterLink) {

                individualRegisterLink.style.display =
                    "none";

            }


            if (ngoRegisterLink) {

                ngoRegisterLink.style.display =
                    "inline-block";

            }


            clearMessages();

        }


        /* ============================================================
           ROLE BUTTON EVENTS
           ============================================================ */

        if (individualRole) {

            individualRole.addEventListener(
                "click",
                selectIndividual
            );

        }


        if (ngoRole) {

            ngoRole.addEventListener(
                "click",
                selectNgo
            );

        }


        /* ============================================================
           MESSAGE HELPERS
           ============================================================ */

        function clearMessages() {

            if (error) {

                error.classList.remove(
                    "show"
                );

                error.textContent =
                    "";

            }


            if (success) {

                success.classList.remove(
                    "show"
                );

                success.textContent =
                    "";

            }

        }


        function showError(
            message
        ) {

            if (success) {

                success.classList.remove(
                    "show"
                );

                success.textContent =
                    "";

            }


            if (error) {

                error.textContent =
                    message;

                error.classList.add(
                    "show"
                );

            }

        }


        function showSuccess(
            message
        ) {

            if (error) {

                error.classList.remove(
                    "show"
                );

                error.textContent =
                    "";

            }


            if (success) {

                success.textContent =
                    message;

                success.classList.add(
                    "show"
                );

            }

        }


        /* ============================================================
           STAFF CREDENTIALS

           Staff does NOT appear as a visible role.

           Staff uses the SAME login page.

           DEMO:

           username:
           coordinator

           password:
           relief123

           Production authentication must be
           handled server-side.
           ============================================================ */

        const STAFF_USERNAME =
            "coordinator";


        const STAFF_PASSWORD =
            "relief123";


        /* ============================================================
           FORM SUBMIT
           ============================================================ */

        if (!form) {

            console.error(
                "Relief Resolver: commonLoginForm not found."
            );

            return;

        }


        form.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                clearMessages();


                const identifier =
                    identifierInput
                        ? identifierInput.value.trim()
                        : "";


                const password =
                    passwordInput
                        ? passwordInput.value
                        : "";


                if (
                    !identifier ||
                    !password
                ) {

                    showError(
                        "Please enter your login details."
                    );

                    return;

                }


                /* ====================================================
                   1. STAFF LOGIN

                   Staff can log in regardless of whether
                   Individual or NGO is selected.

                   Staff remains hidden from normal users.
                   ==================================================== */

                if (
                    identifier
                        .toLowerCase() ===
                    STAFF_USERNAME.toLowerCase()
                    &&
                    password ===
                    STAFF_PASSWORD
                ) {

                    /* ----------------------------------------------
                       IMPORTANT:
                       Remove every other role before creating
                       Staff session.
                       ---------------------------------------------- */

                    clearIndividualSession();

                    clearNgoSession();

                    clearStaffSession();

                    sessionStorage.removeItem(
                        "reliefAccountRole"
                    );


                    /* Set Staff session */

                    sessionStorage.setItem(
                        "reliefStaffLoggedIn",
                        "true"
                    );


                    sessionStorage.setItem(
                        "reliefStaffName",
                        "Relief Coordinator"
                    );


                    sessionStorage.setItem(
                        "reliefAccountRole",
                        "staff"
                    );


                    showSuccess(
                        "Credentials verified. Opening Control Room..."
                    );


                    setTimeout(
                        () => {

                            window.location.href =
                                "dispatcher.html";

                        },
                        500
                    );


                    return;

                }


                /* ====================================================
                   2. NGO LOGIN
                   ==================================================== */

                if (
                    selectedRole ===
                    "ngo"
                ) {

                    loginNgo(
                        identifier,
                        password
                    );

                    return;

                }


                /* ====================================================
                   3. INDIVIDUAL LOGIN
                   ==================================================== */

                loginIndividual(
                    identifier,
                    password
                );

            }
        );


        /* ============================================================
           NGO LOGIN
           ============================================================ */

        function loginNgo(
            email,
            password
        ) {

            let ngos = [];


            try {

                ngos =
                    JSON.parse(
                        localStorage.getItem(
                            "drr_ngos"
                        ) || "[]"
                    );

            }

            catch (error) {

                console.error(
                    "Could not read NGO accounts:",
                    error
                );


                showError(
                    "Unable to read NGO account data."
                );

                return;

            }


            const ngo =
                ngos.find(
                    (item) =>
                        item.email &&
                        item.email
                            .toLowerCase() ===
                        email.toLowerCase()
                );


            if (!ngo) {

                showError(
                    "No NGO account was found with this email."
                );

                return;

            }


            /* ========================================================
               PASSWORD
               ======================================================== */

            if (
                ngo.password !==
                password
            ) {

                showError(
                    "Incorrect NGO password."
                );

                return;

            }


            /* ========================================================
               NGO VERIFICATION

               NGO cannot access its dashboard
               until staff verifies it.
               ======================================================== */

            if (
                ngo.status !==
                "verified"
            ) {

                showError(
                    "Your organization is registered but is still awaiting verification by Relief Resolver staff."
                );

                return;

            }


            /* ========================================================
               NGO SESSION

               IMPORTANT:

               NGO and Individual sessions must NEVER coexist.
               ======================================================== */


            /* Clear old Individual session */

            clearIndividualSession();


            /* Clear old Staff session */

            clearStaffSession();


            /* Clear any previous NGO session */

            clearNgoSession();


            /* Set NGO session */

            sessionStorage.setItem(
                "reliefNgoLoggedIn",
                "true"
            );


            sessionStorage.setItem(
                "reliefNgoId",
                ngo.id
            );


            sessionStorage.setItem(
                "reliefNgoName",
                ngo.name
            );


            sessionStorage.setItem(
                "reliefAccountRole",
                "ngo"
            );


            showSuccess(
                "NGO verified successfully."
            );


            /* ========================================================
               IMPORTANT

               NGO dashboard has NOT been created yet.

               Therefore DO NOT send NGO to:

                   individual-dashboard.html

               For now send NGO to the home page.

               Later, when ngo-dashboard.html is created,
               this can simply become:

                   window.location.href =
                       "ngo-dashboard.html";
               ======================================================== */

            setTimeout(
                () => {

                    window.location.href =
                        "index.html";

                },
                500
            );

        }


        /* ============================================================
           INDIVIDUAL LOGIN
           ============================================================ */

        function loginIndividual(
            email,
            password
        ) {


            /*
             * Your individual registration may use
             * different localStorage names depending
             * on the version of registration code.
             *
             * We keep compatibility with all of them.
             */


            const possibleKeys = [

                "drr_users",

                "drr_users_data",

                "relief_users",

                "users"

            ];


            let users = [];


            for (
                const key of possibleKeys
            ) {

                const stored =
                    localStorage.getItem(
                        key
                    );


                if (!stored) {

                    continue;

                }


                try {

                    const parsed =
                        JSON.parse(
                            stored
                        );


                    if (
                        Array.isArray(
                            parsed
                        )
                    ) {

                        users =
                            parsed;

                        break;

                    }

                }

                catch (error) {

                    console.warn(
                        "Could not read user storage:",
                        key
                    );

                }

            }


            /* ========================================================
               FIND INDIVIDUAL
               ======================================================== */

            const normalizedEmail =
                email
                    .trim()
                    .toLowerCase();


            const user =
                users.find(
                    (item) => {

                        const userEmail =
                            item.email ||
                            item.userEmail;


                        return (
                            userEmail &&
                            String(
                                userEmail
                            )
                                .trim()
                                .toLowerCase() ===
                            normalizedEmail
                        );

                    }
                );


            if (!user) {

                showError(
                    "No individual account was found with this email."
                );

                return;

            }


            /* ========================================================
               PASSWORD
               ======================================================== */

            const storedPassword =
                user.password ||
                user.userPassword;


            if (
                storedPassword !==
                password
            ) {

                showError(
                    "Incorrect password."
                );

                return;

            }


            /* ========================================================
               INDIVIDUAL SESSION
               ======================================================== */

            const userName =
                user.name ||
                user.fullName ||
                user.userName ||
                "Relief User";


            const userEmail =
                user.email ||
                user.userEmail ||
                email;


            /* --------------------------------------------------------
               IMPORTANT:
               Clear NGO and Staff sessions first.
               -------------------------------------------------------- */

            clearNgoSession();

            clearStaffSession();

            sessionStorage.removeItem(
                "reliefAccountRole"
            );


            /* Set Individual session */

            sessionStorage.setItem(
                "reliefUserLoggedIn",
                "true"
            );


            sessionStorage.setItem(
                "reliefUserName",
                userName
            );


            sessionStorage.setItem(
                "reliefUserEmail",
                userEmail
            );


            sessionStorage.setItem(
                "reliefAccountRole",
                "individual"
            );


            /*
             * Keep the phone number if it exists.
             * This allows the emergency request to
             * use the registered contact number.
             */

            const phone =
                user.phone ||
                user.contactNumber ||
                user.mobile ||
                "";


            if (phone) {

                sessionStorage.setItem(
                    "reliefUserPhone",
                    phone
                );

            }


            showSuccess(
                "Login successful. Continuing..."
            );


            /* ========================================================
               IMPORTANT REQUEST FLOW

               If the user originally came here because
               they submitted an emergency request while
               logged out, request.js stored:

                   reliefPendingRequest

               and:

                   reliefLoginPurpose = submit_request

               We MUST return to:

                   request.html?resumeRequest=true

               NOT simply request.html.

               request.js will then:

               1. Read the pending request
               2. Keep the SAME Request Number
               3. Create the final request object
               4. Save it to relief_requests
               5. Remove the temporary request
               6. Show the request confirmation
               7. Redirect to the individual dashboard
               ======================================================== */

            const pendingRequest =
                sessionStorage.getItem(
                    "reliefPendingRequest"
                );


            const loginPurpose =
                sessionStorage.getItem(
                    "reliefLoginPurpose"
                );


            if (
                pendingRequest &&
                loginPurpose ===
                "submit_request"
            ) {

                setTimeout(
                    () => {

                        window.location.href =
                            "request.html?resumeRequest=true";

                    },
                    500
                );


                return;

            }


            /* ========================================================
               NORMAL INDIVIDUAL LOGIN

               If the user did NOT come from an emergency
               request, continue normally.
               ======================================================== */

            setTimeout(
                () => {

                    window.location.href =
                        "individual-dashboard.html";

                },
                500
            );

        }


        /* ============================================================
           INITIAL STATE
           ============================================================ */

        selectIndividual();

    }

);
