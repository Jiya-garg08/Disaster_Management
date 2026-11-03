
/* =========================================================
   Relief Resolver — Control Room Complaint Management
   ========================================================= */

(() => {
    "use strict";

    const API = "http://localhost:5000/api/complaints";

    const $ = (id) => document.getElementById(id);

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]);
    }

    function readable(value) {
        return String(value || "")
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    }

    function dateText(value) {
        if (!value) return "Date unavailable";
        const date = new Date(value);
        return Number.isNaN(date.getTime())
            ? "Date unavailable"
            : date.toLocaleString();
    }

    function showMessage(message, isError = false) {
        const element = $("complaintManagementMessage");
        if (!element) return;

        element.textContent = message;
        element.style.color = isError ? "#b42318" : "#16794b";
    }

    async function apiRequest(url, options = {}) {
        const token = sessionStorage.getItem("reliefAuthToken");

        if (!token) {
            throw new Error("Control Room login token not found. Please log in again.");
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...(options.headers || {})
            }
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.message ||
                result.error ||
                `Request failed (${response.status}).`
            );
        }

        return result;
    }

    function normalizeList(result) {
        if (Array.isArray(result)) return result;
        if (Array.isArray(result.complaints)) return result.complaints;
        if (Array.isArray(result.data)) return result.data;
        if (result.data && Array.isArray(result.data.complaints)) {
            return result.data.complaints;
        }
        return [];
    }

    function renderComplaints(complaints) {
        const container = $("complaintManagementList");
        const badge = $("complaintsBadge");
        const sideCount = $("sideComplaintsCount");

        if (badge) {
            badge.textContent =
                `${complaints.length} complaint${complaints.length === 1 ? "" : "s"}`;
        }

        if (sideCount) {
            sideCount.textContent = String(
                complaints.filter((item) =>
                    ["pending", "under_review"].includes(item.status)
                ).length
            );
        }

        if (!container) return;

        if (!complaints.length) {
            container.innerHTML = "<p>No complaints found.</p>";
            return;
        }

        container.innerHTML = complaints.map((item) => `
            <article style="
                border:1px solid #dfe4eb;
                border-radius:12px;
                padding:18px;
                margin:12px 0;
                background:var(--card-bg, #fff);
            ">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:flex-start;
                    gap:12px;
                    flex-wrap:wrap;
                ">
                    <div>
                        <h3 style="margin:0 0 8px;">
                            ${escapeHTML(item.complaintNumber || "Complaint")}
                        </h3>
                        <p style="margin:0;">
                            ${escapeHTML(item.issueType)}
                        </p>
                    </div>
                    <span style="
                        background:#eef2ff;
                        color:#3730a3;
                        padding:6px 10px;
                        border-radius:20px;
                        font-size:12px;
                    ">
                        ${escapeHTML(readable(item.status))}
                    </span>
                </div>

                <p>${escapeHTML(item.description)}</p>

                <p><strong>Category:</strong>
                    ${escapeHTML(readable(item.category))}
                </p>
                <p><strong>Priority:</strong>
                    ${escapeHTML(readable(item.priority))}
                </p>
                <p><strong>Submitted:</strong>
                    ${escapeHTML(dateText(item.createdAt))}
                </p>
                <p><strong>Individual:</strong>
                    ${escapeHTML(item.submittedBy?.name ||
                        item.submittedBy?.email || "User")}
                </p>
                ${
                    item.request
                        ? `<p><strong>Related request:</strong>
                           ${escapeHTML(item.request._id || item.request)}</p>`
                        : ""
                }

                <form class="complaint-update-form"
                      data-complaint-id="${escapeHTML(item._id)}"
                      style="display:grid;gap:12px;margin-top:16px;">

                    <label>
                        Status
                        <select name="status" required
                                style="display:block;width:100%;padding:10px;margin-top:5px;">
                            ${[
                                ["pending", "Pending"],
                                ["under_review", "Under Review"],
                                ["resolved", "Resolved"],
                                ["rejected", "Rejected"]
                            ].map(([value, label]) => `
                                <option value="${value}"
                                    ${item.status === value ? "selected" : ""}>
                                    ${label}
                                </option>
                            `).join("")}
                        </select>
                    </label>

                    <label>
                        Priority
                        <select name="priority" required
                                style="display:block;width:100%;padding:10px;margin-top:5px;">
                            ${[
                                ["low", "Low"],
                                ["medium", "Medium"],
                                ["high", "High"],
                                ["urgent", "Urgent"]
                            ].map(([value, label]) => `
                                <option value="${value}"
                                    ${item.priority === value ? "selected" : ""}>
                                    ${label}
                                </option>
                            `).join("")}
                        </select>
                    </label>

                    <label>
                        Control Room remarks
                        <textarea name="remarks" rows="3" maxlength="2000"
                            placeholder="Add an update for the individual..."
                            style="display:block;width:100%;padding:10px;margin-top:5px;resize:vertical;">${escapeHTML(item.controlRoomRemarks || "")}</textarea>
                    </label>

                    <button type="submit"
                            style="padding:11px 16px;cursor:pointer;">
                        Save complaint update
                    </button>
                </form>
            </article>
        `).join("");
    }

    async function loadComplaints() {
        const container = $("complaintManagementList");
        if (!container) return;

        container.textContent = "Loading complaints...";

        try {
            const result = await apiRequest(`${API}/control-room`);
            renderComplaints(normalizeList(result));
        } catch (error) {
            container.textContent = error.message;
            showMessage(error.message, true);
        }
    }

    async function updateComplaint(event) {
        const form = event.target.closest(".complaint-update-form");
        if (!form) return;

        event.preventDefault();

        const id = form.dataset.complaintId;
        if (!id) {
            showMessage("Complaint ID is missing.", true);
            return;
        }

        const submitButton = form.querySelector('[type="submit"]');
        const formData = new FormData(form);

        const payload = {
            status: formData.get("status"),
            priority: formData.get("priority"),
            remarks: String(formData.get("remarks") || "").trim()
        };

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Saving...";
        }

        try {
            await apiRequest(`${API}/${encodeURIComponent(id)}`, {
                method: "PATCH",
                body: JSON.stringify(payload)
            });

            showMessage("Complaint updated successfully.");
            await loadComplaints();
        } catch (error) {
            showMessage(error.message, true);
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Save complaint update";
            }
        }
    }

    function init() {
        const container = $("complaintManagementList");
        if (!container) return;

        container.addEventListener("submit", updateComplaint);
        loadComplaints();

        // Refresh when the Control Room opens the complaints view.
        document.querySelectorAll('[data-view="complaints"]').forEach((button) => {
            button.addEventListener("click", loadComplaints);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
