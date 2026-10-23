/* ============================================================
   disaster-zones.js
   Relief Resolver
   Control Room Disaster Zone Management
============================================================ */

(function () {

    "use strict";


    /* ============================================================
       STORAGE
    ============================================================ */

    const STORAGE_KEY =
        "relief_disaster_zones";


    let map = null;

    let savedZonesLayer = null;

    let drawingLayer = null;

    let editingZoneId = null;


    /* ============================================================
       INITIALIZE
    ============================================================ */

    document.addEventListener(
        "DOMContentLoaded",
        initializeDisasterZoneMap
    );

function initializeDisasterZoneMap() {
    const mapElement = document.getElementById("disasterZoneMap");

    if (!mapElement) {
        console.error("Disaster Zone Map: #disasterZoneMap not found.");
        return;
    }

    if (typeof L === "undefined") {
        console.error("Leaflet is not loaded.");

        mapElement.innerHTML = `
            <div style="
                padding: 40px;
                text-align: center;
                color: #b43b32;
                font-weight: 700;
            ">
                Map could not be loaded.
                <br><br>
                Please check your internet connection.
            </div>
        `;
        return;
    }

    // Create the map only once.
    if (!map) {
        map = L.map("disasterZoneMap");

        map.setView([22.9734, 78.6569], 5);

        // OpenStreetMap tiles.
        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution: "&copy; OpenStreetMap contributors"
            }
        ).addTo(map);

        // Saved disaster zones.
        savedZonesLayer = new L.FeatureGroup();
        map.addLayer(savedZonesLayer);

        // Temporary drawing layer.
        drawingLayer = new L.FeatureGroup();
        map.addLayer(drawingLayer);

        // Drawing controls.
        if (L.Control && L.Control.Draw) {
            const drawControl = new L.Control.Draw({
                position: "topleft",

                draw: {
                    polygon: {
                        allowIntersection: false,
                        showArea: true,
                        shapeOptions: {
                            color: "#dc2626",
                            fillColor: "#dc2626",
                            fillOpacity: 0.25,
                            weight: 2
                        }
                    },

                    rectangle: {
                        shapeOptions: {
                            color: "#dc2626",
                            fillColor: "#dc2626",
                            fillOpacity: 0.25,
                            weight: 2
                        }
                    },

                    polyline: false,
                    circle: false,
                    circlemarker: false,
                    marker: false
                },

                edit: {
                    featureGroup: drawingLayer,
                    remove: false
                }
            });

            map.addControl(drawControl);

            // Handle newly drawn zones.
            map.on(L.Draw.Event.CREATED, function (event) {
                drawingLayer.clearLayers();
                drawingLayer.addLayer(event.layer);

                const instruction =
                    document.getElementById("zoneInstruction");

                if (instruction) {
                    instruction.classList.remove("show");
                }

                const form =
                    document.getElementById("disasterZoneForm");

                if (form) {
                    form.classList.add("show");
                }
            });
        } else {
            console.error("Leaflet Draw is not loaded.");
        }
    }

    // Attach form button handlers only once.
    const addButton =
        document.getElementById("addDisasterZoneButton");

    const saveButton =
        document.getElementById("saveDisasterZoneButton");

    const cancelButton =
        document.getElementById("cancelDisasterZoneButton");

    if (addButton && !addButton.dataset.zoneHandlerAttached) {
        addButton.addEventListener("click", startNewZone);
        addButton.dataset.zoneHandlerAttached = "true";
    }

    if (saveButton && !saveButton.dataset.zoneHandlerAttached) {
        saveButton.addEventListener("click", saveDisasterZone);
        saveButton.dataset.zoneHandlerAttached = "true";
    }

    if (cancelButton && !cancelButton.dataset.zoneHandlerAttached) {
        cancelButton.addEventListener("click", cancelZone);
        cancelButton.dataset.zoneHandlerAttached = "true";
    }

    // Render saved zones.
    renderDisasterZones();

    // Resize the map after its container becomes visible.
    setTimeout(function () {
        if (map) {
            map.invalidateSize();
        }
    }, 300);
}

// Listen for resize requests from dispatcher.html.
// Keep this outside initializeDisasterZoneMap() so it is registered once.
window.addEventListener("disaster-zone-map-resize", function () {
    if (map) {
        requestAnimationFrame(function () {
    modal.classList.add("show");

    console.log(
        "[Delete Debug] Modal classes:",
        modal.className
    );

    console.log(
        "[Delete Debug] Modal dimensions:",
        modal.getBoundingClientRect()
    );

    console.log(
        "[Delete Debug] Modal styles:",
        getComputedStyle(modal).display,
        getComputedStyle(modal).visibility,
        getComputedStyle(modal).opacity
    );
});
    }
});


    /* ============================================================
       CLEAR FORM
    ============================================================ */
    function clearForm() {
        const name = document.getElementById("zoneName");
        const type = document.getElementById("zoneType");
        const severity = document.getElementById("zoneSeverity");
        const description = document.getElementById("zoneDescription");

        if (name) name.value = "";
        if (type) type.value = "Flood";
        if (severity) severity.value = "moderate";
        if (description) description.value = "";
    }

    /* ============================================================
       START NEW ZONE
    ============================================================ */

    function startNewZone(){

        editingZoneId =
            null;


        if (drawingLayer) {
            drawingLayer.clearLayers();
        }

        // Reset the form before starting a new zone.
        clearForm();


        const instruction =
            document.getElementById(
                "zoneInstruction"
            );


        if(instruction){

            instruction.classList.add(
                "show"
            );

        }


        const form =
            document.getElementById(
                "disasterZoneForm"
            );


        if(form){

            form.classList.remove(
                "show"
            );

        }


        /* ========================================================
           OPEN POLYGON TOOL
        ======================================================== */

        const polygonButton =
            document.querySelector(
                ".leaflet-draw-draw-polygon"
            );


        const rectangleButton =
            document.querySelector(
                ".leaflet-draw-draw-rectangle"
            );


        if(polygonButton){

            polygonButton.click();

        }
        else if(rectangleButton){

            rectangleButton.click();

        }

    }


    /* ============================================================
       SAVE
    ============================================================ */

    function saveDisasterZone(){

        const name =
            document
                .getElementById(
                    "zoneName"
                )
                .value
                .trim();


        const type =
            document.getElementById(
                "zoneType"
            ).value;


        const severity =
            document.getElementById(
                "zoneSeverity"
            ).value;


        const description =
            document
                .getElementById(
                    "zoneDescription"
                )
                .value
                .trim();


        /* ========================================================
           VALIDATE NAME
        ======================================================== */

        if(!name){

            alert(
                "Please enter a disaster zone name."
            );

            return;

        }


        /* ========================================================
           GET DRAWN SHAPE
        ======================================================== */

        const layer =
            drawingLayer.getLayers()[0];


        if(!layer){

            alert(
                "Please draw the affected area on the map first."
            );

            return;

        }


        const coordinates =
            extractCoordinates(
                layer
            );


        if(
            !coordinates.length
        ){

            alert(
                "Unable to read the selected area."
            );

            return;

        }


        /* ========================================================
           EXISTING ZONES
        ======================================================== */

        const zones =
            getZones();


        const colors =
            getSeverityColors(
                severity
            );


        let zone;


        /* ========================================================
           EDIT
        ======================================================== */

        if(editingZoneId){

            zone =
                zones.find(
                    function(item){

                        return (
                            item.id ===
                            editingZoneId
                        );

                    }
                );


            if(!zone){

                return;

            }


            zone.name =
                name;


            zone.type =
                type;


            zone.severity =
                severity;


            zone.description =
                description;


            zone.coordinates =
                coordinates;


            zone.color =
                colors.border;


            zone.fillColor =
                colors.fill;


            zone.updatedAt =
                new Date().toISOString();

        }


        /* ========================================================
           NEW ZONE
        ======================================================== */

        else{

            zone = {

                id:
                    "DZ-" +
                    Date.now()
                        .toString(36)
                        .toUpperCase(),

                name:
                    name,

                type:
                    type,

                severity:
                    severity,

                description:
                    description,

                coordinates:
                    coordinates,

                color:
                    colors.border,

                fillColor:
                    colors.fill,

                active:
                    true,

                createdAt:
                    new Date().toISOString(),

                updatedAt:
                    new Date().toISOString()

            };


            zones.push(
                zone
            );

        }


        /* ========================================================
           SAVE LOCAL STORAGE
        ======================================================== */

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                zones
            )

        );


        /* ========================================================
           RESET
        ======================================================== */

        cancelZone();


        renderDisasterZones();


        /* ========================================================
           MESSAGE
        ======================================================== */

        showZoneMessage(
            "✓ Disaster zone saved successfully."
        );


        console.log(
            "Saved disaster zone:",
            zone
        );

    }


    /* ============================================================
       RENDER
    ============================================================ */

    function renderDisasterZones(){

        if(!map){

            return;

        }


        savedZonesLayer.clearLayers();


        const zones =
            getZones()
                .filter(
                    function(zone){

                        return (
                            zone.active !==
                            false
                        );

                    }
                );


        renderZoneSidebar(
            zones
        );


        zones.forEach(
            function(zone){

                drawSavedZone(
                    zone
                );

            }
        );

    }


    /* ============================================================
       DRAW SAVED ZONE
    ============================================================ */

    function drawSavedZone(
        zone
    ){

        const colors =
            getSeverityColors(
                zone.severity
            );


        const polygon =
            L.polygon(
                zone.coordinates,
                {

                    color:
                        colors.border,

                    fillColor:
                        colors.fill,

                    fillOpacity:
                        0.30,

                    weight:
                        2

                }
            );


        polygon.bindPopup(

            `
            <div
                style="
                    min-width:180px;
                    font-family:Arial,sans-serif;
                "
            >

                <strong>
                    ${escapeHtml(zone.name)}
                </strong>

                <br><br>

                <strong>
                    Disaster:
                </strong>

                ${escapeHtml(zone.type)}

                <br>

                <strong>
                    Severity:
                </strong>

                ${escapeHtml(zone.severity)}

                ${
                    zone.description
                        ?
                        `
                        <br><br>

                        ${escapeHtml(
                            zone.description
                        )}
                        `
                        :
                        ""
                }

            </div>
            `

        );


        polygon.addTo(
            savedZonesLayer
        );

    }


    /* ============================================================
       SIDEBAR
    ============================================================ */

function renderZoneSidebar(zones) {
    const list = document.getElementById("disasterZoneList");

    if (!list) {
        return;
    }

    if (!zones.length) {
        list.innerHTML = `
            <div class="zone-list-empty">
                No disaster zones have been marked yet.
                <br><br>
                Click <strong>+ Add Disaster Zone</strong> to begin.
            </div>
        `;
        return;
    }

    list.innerHTML = zones.map(function (zone) {
        const id = escapeAttribute(zone.id);

        return `
            <div class="zone-item">
                <div class="zone-item-top">
                    <div>
                        <div class="zone-item-name">
                            ${escapeHtml(zone.name)}
                        </div>

                        <div class="zone-item-type">
                            ${escapeHtml(zone.type)}
                        </div>
                    </div>

                    <span class="zone-severity ${escapeHtml(zone.severity)}">
                        ${escapeHtml(zone.severity)}
                    </span>
                </div>

                ${
                    zone.description
                        ? `
                            <div class="zone-item-description">
                                ${escapeHtml(zone.description)}
                            </div>
                        `
                        : ""
                }

                <div class="zone-item-actions">
                    <button
                        type="button"
                        class="zone-mini-btn zone-edit-btn"
                        data-zone-edit="${id}">
                        Edit
                    </button>

                    <button
                        type="button"
                        class="zone-mini-btn delete zone-delete-btn"
                        data-zone-delete="${id}">
                        Delete
                    </button>
                </div>
            </div>
        `;
    }).join("");

    // Edit button events.
    list.querySelectorAll("[data-zone-edit]").forEach(function (button) {
        button.addEventListener("click", function () {
            editZone(button.dataset.zoneEdit);
        });
    });

    
    // Delete button events.
    list.querySelectorAll("[data-zone-delete]").forEach(function (button) {
        button.onclick = function (event) {
            event.preventDefault();
            event.stopPropagation();

            const zoneId = button.getAttribute("data-zone-delete");

            console.log("[Disaster Zones] Delete clicked:", zoneId);

            if (!zoneId) {
                console.error("Missing disaster zone ID on Delete button.");
                return;
            }

            deleteZone(zoneId);
        };
    });

}
    /* ============================================================
       EDIT ZONE
    ============================================================ */

function editZone(id) {
    const zone = getZones().find(function (item) {
        return String(item.id) === String(id);
    });

    if (!zone) {
        console.error("Disaster zone not found:", id);
        alert("Disaster zone not found. Please refresh and try again.");
        return;
    }

    const nameInput = document.getElementById("zoneName");
    const typeInput = document.getElementById("zoneType");
    const severityInput = document.getElementById("zoneSeverity");
    const descriptionInput = document.getElementById("zoneDescription");
    const form = document.getElementById("disasterZoneForm");

    if (!nameInput || !typeInput || !severityInput ||
        !descriptionInput || !form) {
        console.error("Disaster zone form elements are missing.");
        return;
    }

    if (!map || !drawingLayer) {
        console.error("Disaster zone map is not initialized.");
        alert("The map is not ready. Please refresh and try again.");
        return;
    }

    if (!Array.isArray(zone.coordinates) || !zone.coordinates.length) {
        console.error("Zone has no saved coordinates:", zone);
        alert("This zone has no saved coordinates to edit.");
        return;
    }

    // Set the zone being edited.
    editingZoneId = zone.id;

    // Populate the existing form.
    nameInput.value = zone.name || "";
    typeInput.value = zone.type || "Flood";
    severityInput.value = zone.severity || "moderate";
    descriptionInput.value = zone.description || "";

    // Restore the polygon on the map.
    drawingLayer.clearLayers();

    const polygon = L.polygon(zone.coordinates, {
        color: zone.color || "#dc2626",
        fillColor: zone.fillColor || "#dc2626",
        fillOpacity: 0.25,
        weight: 2
    });

    drawingLayer.addLayer(polygon);

    // Show the form and focus the selected zone.
    form.classList.add("show");

    map.fitBounds(polygon.getBounds(), {
        padding: [30, 30]
    });

    // Ensure the form is visible on screen.
    form.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}

    /* ============================================================
       DELETE
    ============================================================ */

/* ============================================================
   DELETE ZONE — CUSTOM CONFIRMATION MODAL
============================================================ */

function deleteZone(id) {
    console.log("[Delete Debug] deleteZone called with:", id);

    const zones = getZones();
    console.log("[Delete Debug] Zones loaded:", zones);

    const zone = zones.find(function (item) {
        return String(item.id) === String(id);
    });

    console.log("[Delete Debug] Matching zone:", zone);

    if (!zone) {
        console.error("[Delete Debug] Zone not found:", id);
        showZoneMessage("Unable to find this disaster zone.");
        return;
    }

    console.log("[Delete Debug] Opening confirmation modal...");
    openDeleteModal(zone);

    console.log(
        "[Delete Debug] Modal in DOM:",
        !!document.getElementById("deleteDisasterZoneModal")
    );
}

/* ============================================================
   OPEN DELETE MODAL
============================================================ */

function openDeleteModal(zone){

    /* Remove any old modal */

    const existing =
        document.getElementById(
            "deleteDisasterZoneModal"
        );


    if(existing){

        existing.remove();

    }


    /* Create modal */

    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "deleteDisasterZoneModal";


    modal.className =
        "delete-modal-overlay";


    modal.innerHTML = `

        <div
            class="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deleteModalTitle"
        >

            <!-- =================================================
                 HEADER
            ================================================== -->

            <div class="delete-modal-top">

                <div class="delete-modal-icon">
                    ⚠
                </div>


                <div>

                    <div class="delete-modal-eyebrow">
                        Permanent Action
                    </div>


                    <h3
                        id="deleteModalTitle"
                        class="delete-modal-title"
                    >
                        Delete disaster zone?
                    </h3>

                </div>

            </div>


            <!-- =================================================
                 BODY
            ================================================== -->

            <div class="delete-modal-body">

                <p class="delete-modal-message">

                    You are about to remove this disaster
                    zone from the Control Room.

                </p>


                <div class="delete-modal-zone">

                    <span
                        class="delete-modal-zone-label"
                    >
                        Disaster Zone
                    </span>


                    <span
                        class="delete-modal-zone-name"
                    >
                        ${escapeHtml(zone.name)}
                    </span>

                </div>


                <div class="delete-modal-warning">

                    <span
                        class="delete-modal-warning-icon"
                    >
                        ⚠
                    </span>


                    <span>

                        This action will remove the zone
                        from the active disaster map and
                        it cannot be undone.

                    </span>

                </div>

            </div>


            <!-- =================================================
                 ACTIONS
            ================================================== -->

            <div class="delete-modal-actions">

                <button
                    type="button"
                    class="delete-modal-cancel"
                    id="cancelDeleteZone"
                >
                    Keep Zone
                </button>


                <button
                    type="button"
                    class="delete-modal-delete"
                    id="confirmDeleteZone"
                >
                    Delete Zone
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* ============================================================
       SHOW
    ============================================================ */

    requestAnimationFrame(
        function(){

            modal.classList.add(
                "show"
            );

        }
    );


    /* ============================================================
       CANCEL
    ============================================================ */

    document
        .getElementById(
            "cancelDeleteZone"
        )
        .addEventListener(
            "click",
            function(){

                closeDeleteModal();

            }
        );


    /* ============================================================
       CONFIRM
    ============================================================ */

  
    // CONFIRM DELETE
    const confirmButton = modal.querySelector("#confirmDeleteZone");

    if (confirmButton) {
        confirmButton.onclick = function (event) {
            event.preventDefault();
            event.stopPropagation();

            console.log("[Disaster Zones] Confirm clicked:", zone.id);
console.log("[Disaster Zones] Calling permanentlyDeleteZone...");
            try {
                permanentlyDeleteZone(zone.id);
            } catch (error) {
                console.error("[Disaster Zones] Delete failed:", error);
                alert("Could not delete the disaster zone. Check the browser console.");
            }
        };
    }


    /* ============================================================
       CLICK OUTSIDE
    ============================================================ */

    modal.addEventListener(
        "click",
        function(event){

            if(
                event.target ===
                modal
            ){

                closeDeleteModal();

            }

        }
    );


    /* ============================================================
       ESCAPE KEY
    ============================================================ */

    document.addEventListener(
        "keydown",
        handleDeleteEscape
    );

}


/* ============================================================
   CLOSE DELETE MODAL
============================================================ */

function closeDeleteModal(){

    const modal =
        document.getElementById(
            "deleteDisasterZoneModal"
        );


    if(!modal){

        return;

    }


    modal.classList.remove(
        "show"
    );


    setTimeout(
        function(){

            if(modal){

                modal.remove();

            }

        },
        200
    );


    document.removeEventListener(
        "keydown",
        handleDeleteEscape
    );

}


/* ============================================================
   ESCAPE KEY HANDLER
============================================================ */

function handleDeleteEscape(
    event
){

    if(
        event.key ===
        "Escape"
    ){

        closeDeleteModal();

    }

}


/* ============================================================
   ACTUALLY DELETE ZONE
============================================================ */

function permanentlyDeleteZone(id) {
    const zones = getZones();

    const remaining = zones.filter(function (zone) {
        return String(zone.id) !== String(id);
    });

    if (remaining.length === zones.length) {
        console.error("Zone not found for deletion:", id, zones);
        closeDeleteModal();
        showZoneMessage("Unable to find this disaster zone.");
        return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));

    closeDeleteModal();
    renderDisasterZones();

    showZoneMessage("✓ Disaster zone removed successfully.");
}

    /* ============================================================
       CANCEL
    ============================================================ */

    function cancelZone(){

        editingZoneId =
            null;


        if (drawingLayer) {
            drawingLayer.clearLayers();
        }

        clearForm();


        const form =
            document.getElementById(
                "disasterZoneForm"
            );


        if(form){

            form.classList.remove(
                "show"
            );

        }


        const instruction =
            document.getElementById(
                "zoneInstruction"
            );


        if(instruction){

            instruction.classList.remove(
                "show"
            );

        }

    }


    /* ============================================================
       GET ZONES
    ============================================================ */

    function getZones(){

        try{

            const data =
                JSON.parse(
                    localStorage.getItem(
                        STORAGE_KEY
                    ) ||
                    "[]"
                );


            return Array.isArray(
                data
            )
                ?
                data
                :
                [];

        }
        catch(error){

            console.error(
                "Unable to load disaster zones:",
                error
            );


            return [];

        }

    }


    /* ============================================================
       EXTRACT COORDINATES
    ============================================================ */

    function extractCoordinates(
        layer
    ){

        let latLngs;


        /* ========================================================
           POLYGON / RECTANGLE
        ======================================================== */

        if(
            typeof layer.getLatLngs ===
            "function"
        ){

            latLngs =
                layer.getLatLngs();

        }
        else{

            return [];

        }


        if(
            !latLngs ||
            !latLngs.length
        ){

            return [];

        }


        let points =
            latLngs[0];


        if(
            Array.isArray(
                points
            ) &&
            points.length
        ){

            return points.map(
                function(point){

                    return [

                        Number(
                            point.lat.toFixed(6)
                        ),

                        Number(
                            point.lng.toFixed(6)
                        )

                    ];

                }
            );

        }


        return [];

    }


    /* ============================================================
       COLORS
    ============================================================ */

    function getSeverityColors(
        severity
    ){

        if(
            severity ===
            "critical"
        ){

            return {

                border:
                    "#dc2626",

                fill:
                    "#dc2626"

            };

        }


        if(
            severity ===
            "high"
        ){

            return {

                border:
                    "#f97316",

                fill:
                    "#f97316"

            };

        }


        return {

            border:
                "#eab308",

            fill:
                "#eab308"

        };

    }


    /* ============================================================
       ESCAPE HTML
    ============================================================ */

    function escapeHtml(
        value
    ){

        const div =
            document.createElement(
                "div"
            );


        div.textContent =
            value == null
                ?
                ""
                :
                String(value);


        return div.innerHTML;

    }


    /* ============================================================
       ESCAPE ATTRIBUTE
    ============================================================ */

    function escapeAttribute(
        value
    ){

        return String(
            value
        )
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            );

    }


    /* ============================================================
       MESSAGE
    ============================================================ */

    function showZoneMessage(
        message
    ){

        const controlMessage =
            document.getElementById(
                "controlMessage"
            );


        if(
            controlMessage
        ){

            controlMessage.textContent =
                message;


            controlMessage.classList.add(
                "show"
            );


            setTimeout(
                function(){

                    controlMessage.classList.remove(
                        "show"
                    );

                },
                3000
            );

        }

    }


})();