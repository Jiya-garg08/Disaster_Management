/* ============================================================
   login.js
   Relief Resolver — Common Login
   ============================================================ */


/* ============================================================
   WAIT FOR PAGE
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    () => {


        /* ====================================================
           ELEMENTS
           ==================================================== */

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


        /* ====================================================
           ROLE — INDIVIDUAL
           ==================================================== */

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


        /* ====================================================
           ROLE — NGO
           ==================================================== */

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
                "Access your organization's relief dashboard and requests.";


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


        /* ====================================================
           BUTTON EVENTS
           ==================================================== */

        individualRole.addEventListener(
            "click",
            selectIndividual
        );


        ngoRole.addEventListener(
            "click",
            selectNgo
        );


        /* ====================================================
           CLEAR MESSAGES
           ==================================================== */

        function clearMessages() {

            error.classList.remove(
                "show"
            );

            success.classList.remove(
                "show"
            );

            error.textContent =
                "";

            success.textContent =
                "";

        }


        /* ====================================================
           SHOW ERROR
           ==================================================== */

        function showError(message) {

            success.classList.remove(
                "show"
            );

            success.textContent =
                "";

            error.textContent =
                message;

            error.classList.add(
                "show"
            );

        }


        /* ====================================================
           SHOW SUCCESS
           ==================================================== */

        function showSuccess(message) {

            error.classList.remove(
                "show"
            );

            error.textContent =
                "";

            success.textContent =
                message;

            success.classList.add(
                "show"
            );

        }


        /* ====================================================
           STAFF LOGIN
           
           Staff does NOT appear as a role.

           Existing credentials:
           
               username: coordinator
               password: relief123

           If these are entered, staff goes directly
           to the Control Room.
           ==================================================== */

        const STAFF_USERNAME =
            "coordinator";


        const STAFF_PASSWORD =
            "relief123";


        /* ====================================================
           FORM SUBMIT
           ==================================================== */

        form.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                clearMessages();


                const identifier =
                    identifierInput
                        .value
                        .trim();


                const password =
                    passwordInput
                        .value;


                if (
                    !identifier ||
                    !password
                ) {

                    showError(
                        "Please enter your login details."
                    );

                    return;

                }


                /* =================================================
                   1. CHECK STAFF
                   
                   Staff can use the same login page.
                   No staff switch is shown.
                   ================================================= */

                if (
                    identifier.toLowerCase() ===
                    STAFF_USERNAME.toLowerCase() &&
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
                        "Staff credentials verified. Opening Control Room..."
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


                /* =================================================
                   2. NGO LOGIN
                   ================================================= */

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


                /* =================================================
                   3. INDIVIDUAL LOGIN
                   ================================================= */

                loginIndividual(
                    identifier,
                    password
                );

            }
        );


        /* ========================================================
           NGO LOGIN
           ======================================================== */

        function loginNgo(
            email,
            password
        ) {

            const ngos =
                JSON.parse(
                    localStorage.getItem(
                        "drr_ngos"
                    ) || "[]"
                );


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


            if (
                ngo.password !==
                password
            ) {

                showError(
                    "Incorrect NGO password."
                );

                return;

            }


            /* ================================================
               NGO IS STILL PENDING
               ================================================ */

            if (
                ngo.status !==
                "verified"
            ) {

                showError(
                    "Your organization is registered but is still awaiting verification by Relief Resolver staff."
                );

                return;

            }


            /* ================================================
               NGO VERIFIED
               ================================================ */

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


        /* ========================================================
           INDIVIDUAL LOGIN
           
           IMPORTANT:
           We are temporarily checking common possible
           localStorage keys so we don't break your existing
           Phase 1 data.
           ======================================================== */

        function loginIndividual(
            email,
            password
        ) {

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
                        "Could not read:",
                        key
                    );

                }

            }


            /* ================================================
               FIND INDIVIDUAL
               ================================================ */

            const user =
                users.find(
                    (item) => {

                        const userEmail =
                            item.email ||
                            item.userEmail;


                        return (
                            userEmail &&
                            userEmail
                                .toLowerCase() ===
                            email.toLowerCase()
                        );

                    }
                );


            if (!user) {

                showError(
                    "No individual account was found with this email."
                );

                return;

            }


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


            /* ================================================
               SAVE INDIVIDUAL SESSION
               ================================================ */

            sessionStorage.setItem(
                "reliefUserLoggedIn",
                "true"
            );


            sessionStorage.setItem(
                "reliefUserName",
                user.name ||
                user.fullName ||
                "Relief User"
            );


            sessionStorage.setItem(
                "reliefUserEmail",
                email
            );


            showSuccess(
                "Login successful. Opening your account..."
            );


            /*
             * We will connect this to your actual
             * individual dashboard after checking
             * your existing individual account structure.
             */

            setTimeout(
                () => {

                    /*
                     * TEMPORARY:
                     * Change this once we confirm
                     * your individual dashboard filename.
                     */

                    window.location.href =
                        "request.html";

                },
                500
            );

        }


        /* ====================================================
           INITIAL STATE
           ==================================================== */

        selectIndividual();

    }
);