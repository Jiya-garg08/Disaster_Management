/* ============================================================
   login.js
   Relief Resolver — Common Login

   ONE LOGIN PAGE FOR:

   1. Individual
   2. NGO
   3. Staff

   Staff is intentionally NOT shown as a role.
   ============================================================ */


document.addEventListener("DOMContentLoaded", () => {


    /* ============================================================
       ELEMENTS
       ============================================================ */

    const form =
        document.getElementById("commonLoginForm");


    const roleSwitch =
        document.getElementById("roleSwitch");


    const individualRole =
        document.getElementById("individualRole");


    const ngoRole =
        document.getElementById("ngoRole");


    const loginTitle =
        document.getElementById("loginTitle");


    const loginDescription =
        document.getElementById("loginDescription");


    const identifierLabel =
        document.getElementById("identifierLabel");


    const identifierInput =
        document.getElementById("loginIdentifier");


    const passwordInput =
        document.getElementById("loginPassword");


    const error =
        document.getElementById("loginError");


    const success =
        document.getElementById("loginSuccess");


    const individualRegisterLink =
        document.getElementById("individualRegisterLink");


    const ngoRegisterLink =
        document.getElementById("ngoRegisterLink");


    let selectedRole = "individual";


    /* ============================================================
       INDIVIDUAL MODE
       ============================================================ */

    function selectIndividual() {

        selectedRole = "individual";


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

        selectedRole = "ngo";


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

    individualRole.addEventListener(
        "click",
        selectIndividual
    );


    ngoRole.addEventListener(
        "click",
        selectNgo
    );



    /* ============================================================
       MESSAGE HELPERS
       ============================================================ */

    function clearMessages() {

        error.classList.remove(
            "show"
        );

        success.classList.remove(
            "show"
        );

        error.textContent = "";

        success.textContent = "";

    }



    function showError(message) {

        success.classList.remove(
            "show"
        );

        success.textContent = "";

        error.textContent =
            message;

        error.classList.add(
            "show"
        );

    }



    function showSuccess(message) {

        error.classList.remove(
            "show"
        );

        error.textContent = "";

        success.textContent =
            message;

        success.classList.add(
            "show"
        );

    }



    /* ============================================================
       STAFF CREDENTIALS

       Staff does NOT appear as a visible role.

       Staff simply uses the same login form.

       DEMO CREDENTIALS:

           username: coordinator
           password: relief123

       In the real backend these MUST be stored
       securely on the server.
       ============================================================ */

    const STAFF_USERNAME =
        "coordinator";


    const STAFF_PASSWORD =
        "relief123";



    /* ============================================================
       FORM SUBMIT
       ============================================================ */

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
                passwordInput.value;


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
               1. CHECK STAFF FIRST

               Staff can log in regardless of whether the
               Individual or NGO switch is selected.

               Staff is therefore completely hidden from
               normal users.
               ==================================================== */

            if (
                identifier.toLowerCase() ===
                    STAFF_USERNAME.toLowerCase()
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
           VERIFICATION

           A registered NGO cannot access its dashboard
           until Relief Resolver staff verifies it.
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
         * different localStorage names depending on
         * the version of the registration code.
         *
         * These keys keep the login compatible.
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
                    "Could not read:",
                    key
                );

            }

        }



        /* ========================================================
           FIND USER
           ======================================================== */

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
         * For now, the individual is sent to
         * request.html.
         *
         * Later, if you create an individual dashboard,
         * change this to:
         *
         * individual-dashboard.html
         */

        setTimeout(
            () => {

                window.location.href =
                    "request.html";

            },
            500
        );

    }



    /* ============================================================
       INITIAL STATE
       ============================================================ */

    selectIndividual();

});
