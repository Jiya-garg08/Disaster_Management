/* ============================================================
   auth.js
   Relief Resolver — Common Authentication Helpers
   ============================================================ */


/* ============================================================
   COMMON LOGOUT
   ============================================================ */

function logoutUser() {

    /* Individual session */

    sessionStorage.removeItem(
        "reliefUserLoggedIn"
    );

    sessionStorage.removeItem(
        "reliefUserName"
    );

    sessionStorage.removeItem(
        "reliefUserEmail"
    );


    /* NGO session */

    sessionStorage.removeItem(
        "reliefNgoLoggedIn"
    );

    sessionStorage.removeItem(
        "reliefNgoId"
    );

    sessionStorage.removeItem(
        "reliefNgoName"
    );


    /* Staff session */

    sessionStorage.removeItem(
        "reliefStaffLoggedIn"
    );

    sessionStorage.removeItem(
        "reliefStaffName"
    );


    /* Go to common login */

    window.location.href =
        "login.html";
}


/* ============================================================
   OLD STAFF LOGOUT COMPATIBILITY

   Existing dispatcher.html may still use:

       onclick="staffLogout()"

   So don't break it.
   ============================================================ */

function staffLogout() {

    logoutUser();

}