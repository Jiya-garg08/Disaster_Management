/* ============================================================
   individual-register.js
   Relief Resolver — Individual Registration
   Phase 1 Demo
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

    /* ========================================================
       GET FORM ELEMENTS
       ======================================================== */

    const form = document.getElementById(
        "individualRegisterForm"
    );

    const result = document.getElementById(
        "individualRegisterResult"
    );


    /* ========================================================
       SAFETY CHECK
       ======================================================== */

    if (!form || !result) {
        console.error(
            "Individual registration form elements were not found."
        );
        return;
    }


    /* ========================================================
       FORM SUBMIT
       ======================================================== */

    form.addEventListener("submit", (event) => {

        event.preventDefault();


        /* ====================================================
           1. GET FORM VALUES
           ==================================================== */

        const name =
            document
                .getElementById("individualName")
                .value
                .trim();


        const phone =
            document
                .getElementById("individualPhone")
                .value
                .trim();


        const alternatePhone =
            document
                .getElementById("individualAlternatePhone")
                .value
                .trim();


        const email =
            document
                .getElementById("individualEmail")
                .value
                .trim()
                .toLowerCase();


        const state =
            document
                .getElementById("individualState")
                .value
                .trim();


        const city =
            document
                .getElementById("individualCity")
                .value
                .trim();


        const password =
            document
                .getElementById("individualPassword")
                .value;


        const confirmPassword =
            document
                .getElementById("individualConfirmPassword")
                .value;


        const consent =
            document.getElementById(
                "individualConsent"
            ).checked;


        /* ====================================================
           2. REQUIRED FIELD VALIDATION
           ==================================================== */

        if (
            !name ||
            !phone ||
            !email ||
            !state ||
            !city ||
            !password ||
            !confirmPassword
        ) {

            showResult(
                "error",
                "Please complete all required fields."
            );

            return;
        }


        /* ====================================================
           3. PHONE VALIDATION
           ==================================================== */

        const phonePattern =
            /^[0-9]{10}$/;


        if (!phonePattern.test(phone)) {

            showResult(
                "error",
                "Please enter a valid 10-digit primary phone number."
            );

            return;
        }


        /* ====================================================
           4. ALTERNATE PHONE VALIDATION
           
           Alternate number is OPTIONAL.
           If provided, it must be 10 digits.
           ==================================================== */

        if (
            alternatePhone &&
            !phonePattern.test(alternatePhone)
        ) {

            showResult(
                "error",
                "Please enter a valid 10-digit alternate phone number."
            );

            return;
        }


        /* ====================================================
           5. PREVENT SAME PRIMARY AND ALTERNATE NUMBER
           ==================================================== */

        if (
            alternatePhone &&
            alternatePhone === phone
        ) {

            showResult(
                "error",
                "Primary and alternate phone numbers should be different."
            );

            return;
        }


        /* ====================================================
           6. BASIC EMAIL VALIDATION
           ==================================================== */

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (!emailPattern.test(email)) {

            showResult(
                "error",
                "Please enter a valid email address."
            );

            return;
        }


        /* ====================================================
           7. PASSWORD VALIDATION
           ==================================================== */

        if (password.length < 6) {

            showResult(
                "error",
                "Password must contain at least 6 characters."
            );

            return;
        }


        /* ====================================================
           8. CONFIRM PASSWORD
           ==================================================== */

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
           9. CONSENT
           ==================================================== */

        if (!consent) {

            showResult(
                "error",
                "Please confirm that the information provided is accurate."
            );

            return;
        }


        /* ====================================================
           10. GET EXISTING USERS
           
           New individual accounts are stored in:
           
               drr_users
           ==================================================== */

        let users = [];


        try {

            users =
                JSON.parse(
                    localStorage.getItem(
                        "drr_users"
                    ) || "[]"
                );


            if (!Array.isArray(users)) {

                users = [];

            }

        }
        catch (error) {

            console.error(
                "Could not read drr_users:",
                error
            );

            users = [];

        }


        /* ====================================================
           11. CHECK DUPLICATE EMAIL
           ==================================================== */

        const emailExists =
            users.some(
                (user) =>
                    user.email &&
                    user.email
                        .toLowerCase() ===
                    email
            );


        if (emailExists) {

            showResult(
                "error",
                "An account with this email already exists. Please sign in instead."
            );

            return;
        }


        /* ====================================================
           12. CHECK DUPLICATE PRIMARY PHONE
           ==================================================== */

        const phoneExists =
            users.some(
                (user) =>
                    user.phone ===
                    phone
            );


        if (phoneExists) {

            showResult(
                "error",
                "An account with this primary phone number already exists."
            );

            return;
        }


        /* ====================================================
           13. CREATE NEW USER
           ==================================================== */

        const user = {

            id:
                generateUserId(users),

            name:
                name,

            email:
                email,

            phone:
                phone,

            alternatePhone:
                alternatePhone,

            state:
                state,

            city:
                city,

            password:
                password,

            role:
                "individual",

            createdAt:
                Date.now()

        };


        /* ====================================================
           14. SAVE USER
           ==================================================== */

        users.push(user);


        try {

            localStorage.setItem(
                "drr_users",
                JSON.stringify(users)
            );

        }
        catch (error) {

            console.error(
                "Could not save individual account:",
                error
            );

            showResult(
                "error",
                "The account could not be saved. Please try again."
            );

            return;
        }


        /* ====================================================
           15. SHOW SUCCESS
           ==================================================== */

        showResult(
            "success",
            "✓ Account created successfully. Redirecting you to login..."
        );


        /* ====================================================
           16. CLEAR FORM
           ==================================================== */

        form.reset();


        /* ====================================================
           17. REDIRECT TO COMMON LOGIN
           ==================================================== */

        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 1200);

    });


    /* ========================================================
       GENERATE USER ID
       ======================================================== */

    function generateUserId(users) {

        let nextNumber =
            1001 + users.length;


        let id =
            `USER-${nextNumber}`;


        /*
         * Make sure the generated ID is not
         * already being used.
         */

        while (
            users.some(
                (user) =>
                    user.id === id
            )
        ) {

            nextNumber++;

            id =
                `USER-${nextNumber}`;

        }


        return id;

    }


    /* ========================================================
       SHOW RESULT MESSAGE
       ======================================================== */

    function showResult(
        type,
        message
    ) {

        result.className =
            `individual-register-result show ${type}`;


        result.textContent =
            message;


        result.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

    }

});