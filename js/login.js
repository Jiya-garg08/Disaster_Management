/* ============================================================
   login.js
   Relief Resolver — Common Login

   ONE LOGIN PAGE FOR:

   1. Individual
   2. NGO
   3. Staff

   Staff is intentionally NOT shown as a role.
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
           INDIVIDUAL MODE
           ============================================================ */

        function selectIndividual() {

            selectedRole =
                "individual";


            roleSwitch.classList.remove(
                "ngo-active"
            );


            individualRole.classList.add(
                "active"
            );


            ngoRole.classList.remove(
                "active"
            );


            loginTitle.textContent =
                "Sign in as an individual";


            loginDescription.textContent =
                "Continue to manage your emergency requests and assistance.";


            identifierLabel.textContent =
                "Email";


            identifierInput.placeholder =
                "Enter your email";


            individualRegisterLink.style.display =
                "inline-block";


            ngoRegisterLink.style.display =
                "none";


            clearMessages();

        }


        /* ============================================================
           NGO MODE
           ============================================================ */

        function selectNgo() {

            selectedRole =
                "ngo";


            roleSwitch.classList.add(
                "ngo-active"
            );


            individualRole.classList.remove(
                "active"
            );


            ngoRole.classList.add(
                "active"
            );


            loginTitle.textContent =
                "Sign in as an NGO";


            loginDescription.textContent =
                "Access your verified organization's relief dashboard.";


            identifierLabel.textContent =
                "Organization Email";


            identifierInput.placeholder =
                "Enter organization email";


            individualRegisterLink.style.display =
                "none";


            ngoRegisterLink.style.display =
                "inline-block";


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
                        ? identifierInput
                            .value
                            .trim()
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
                    STAFF_USERNAME
                        .toLowerCase()
                    &&
                    password ===
                    STAFF_PASSWORD
                ) {

                    sessionStorage.setItem(
                        "reliefStaffLoggedIn",
                        "true"
                    );


                    sessionStorage.setItem(
                        "reliefStaffName",
                        "Relief Coordinator"
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
               ======================================================== */

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
                "reliefUserLoggedIn",
                "true"
            );


            sessionStorage.setItem(
                "reliefUserName",
                ngo.name
            );


            sessionStorage.setItem(
                "reliefUserEmail",
                ngo.email
            );


            showSuccess(
                "NGO verified. Opening your organization dashboard..."
            );


            setTimeout(
                () => {

                    window.location.href =
                        "ngo-dashboard.html";

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
