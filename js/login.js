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
    sessionStorage.removeItem("reliefUserLoggedIn");
    sessionStorage.removeItem("reliefUserName");
    sessionStorage.removeItem("reliefUserEmail");
    sessionStorage.removeItem("reliefUserPhone");

    // Clear stale authentication tokens
    sessionStorage.removeItem("reliefAuthToken");
    localStorage.removeItem("reliefAuthToken");

    sessionStorage.removeItem("reliefAccountRole");
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
            async (event) => {

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

 
if (
    identifier.toLowerCase() === STAFF_USERNAME.toLowerCase()
) {
    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: "coordinator@relief.local",
                    password: password,
                    role: "control_room"
                })
            }
        );

        const data = await response.json();

        // Temporary debugging
        console.log("CONTROL ROOM LOGIN RESPONSE:", data);
        console.log("TOKEN ROLE:", data.user?.role);

        if (!response.ok || !data.success || !data.token) {
            showError(data.message || "Control Room login failed.");
            return;
        }

        clearAllSessions();

        sessionStorage.setItem("reliefStaffLoggedIn", "true");
        sessionStorage.setItem("reliefStaffName", "Relief Coordinator");
        sessionStorage.setItem("reliefAccountRole", "staff");
        sessionStorage.setItem("reliefAuthToken", data.token);

        showSuccess("Credentials verified. Opening Control Room...");

        setTimeout(() => {
            window.location.href = "dispatcher.html";
        }, 500);

    } catch (err) {
        console.error("Control Room login error:", err);
        showError("Unable to connect to the server. Please try again.");
    }

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

async function loginNgo(email, password) {
    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password: password,
                    role: "ngo"
                })
            }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
            showError(
                data.message || "NGO login failed. Please try again."
            );
            return;
        }

        // Clear other account sessions first.
        clearIndividualSession();
        clearStaffSession();
        clearNgoSession();

        // Save the NGO session in localStorage.
        localStorage.setItem("reliefAuthToken", data.token);
        localStorage.setItem("reliefNgoLoggedIn", "true");
        localStorage.setItem("reliefNgoId", data.user.id);
        localStorage.setItem("reliefNgoName", data.user.name);
        localStorage.setItem("reliefAccountRole", "ngo");

        showSuccess("Login successful.");

        setTimeout(() => {
           
            window.location.href = "ngo-dashboard.html";
        }, 500);

    } catch (error) {
        console.error("NGO login error:", error);

        showError(
            "Unable to connect to the server. Please ensure the backend is running."
        );
    }
}

        /* ============================================================
           INDIVIDUAL LOGIN
           ============================================================ */

async function loginIndividual(email, password) {
    try {
        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password: password,
                    role: "individual"
                })
            }
        );

        const data = await response.json();
        console.log("INDIVIDUAL LOGIN FUNCTION RAN");
console.log("LOGIN RESPONSE:", data);
console.log("RETURNED ROLE:", data.user?.role);
console.log("RETURNED TOKEN:", data.token);

        console.log("Individual login response:", data);
        console.log("Authenticated role:", data.user?.role);

        if (!response.ok || !data.success || !data.token) {
            showError(data.message || "Individual login failed.");
            return;
        }

        if (!data.user || data.user.role !== "individual") {
            showError("Please use a valid Individual account.");
            return;
        }

        clearNgoSession();
        clearStaffSession();

        sessionStorage.removeItem("reliefAuthToken");
        localStorage.removeItem("reliefAuthToken");

        sessionStorage.setItem("reliefAuthToken", data.token);
        sessionStorage.setItem("reliefUserLoggedIn", "true");
        sessionStorage.setItem(
            "reliefUserName",
            data.user.name || "Relief User"
        );
        sessionStorage.setItem(
            "reliefUserEmail",
            data.user.email || email
        );
        sessionStorage.setItem("reliefAccountRole", "individual");

        if (data.user.phone) {
            sessionStorage.setItem("reliefUserPhone", data.user.phone);
        } else {
            sessionStorage.removeItem("reliefUserPhone");
        }

        showSuccess("Login successful. Continuing...");

        const pendingRequest =
            sessionStorage.getItem("reliefPendingRequest");
        const loginPurpose =
            sessionStorage.getItem("reliefLoginPurpose");

        if (pendingRequest && loginPurpose === "submit_request") {
            setTimeout(() => {
                window.location.href =
                    "request.html?resumeRequest=true";
            }, 500);
            return;
        }

        setTimeout(() => {
            window.location.href = "individual-dashboard.html";
        }, 500);

    } catch (error) {
        console.error("Individual login error:", error);
        showError("Cannot connect to the server. Please try again.");
    }
}


        /* ============================================================
           INITIAL STATE
           ============================================================ */

        selectIndividual();

    }

);