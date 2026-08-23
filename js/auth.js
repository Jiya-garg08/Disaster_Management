/* ============================================================
   auth.js
   Relief Resolver — Session Helpers
   ============================================================ */


/* ============================================================
   STAFF LOGOUT
   ============================================================ */

function staffLogout() {

    sessionStorage.removeItem(
        "reliefStaffLoggedIn"
    );

    sessionStorage.removeItem(
        "reliefStaffName"
    );

    window.location.href =
        "login.html";
}



/* ============================================================
   NGO LOGOUT
   ============================================================ */

function ngoLogout() {

    sessionStorage.removeItem(
        "reliefNgoLoggedIn"
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



/* ============================================================
   INDIVIDUAL LOGOUT
   ============================================================ */

function userLogout() {

    sessionStorage.removeItem(
        "reliefUserLoggedIn"
    );

    sessionStorage.removeItem(
        "reliefUserName"
    );

    sessionStorage.removeItem(
        "reliefUserEmail"
    );

    window.location.href =
        "login.html";
}
