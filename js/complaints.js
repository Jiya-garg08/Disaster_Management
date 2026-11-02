
/* =========================================================
   Relief Resolver — Individual Complaint Management
   API: /api/complaints
   ========================================================= */

(() => {
    "use strict";

    const API = "http://localhost:5000/api/complaints";

    const issueOptions = {
        relief: [
            "Assistance delayed",
            "Assistance not received",
            "Incomplete relief supplies",
            "Incorrect request status",
            "Other relief issue"
        ],
        ngo: [
            "NGO did not arrive",
            "NGO service was poor",
            "NGO misconduct",
            "Misleading status updates",
            "Other NGO issue"
        ],
        disaster: [
            "Unsafe conditions",
            "Damaged infrastructure",
            "Blocked road or access",
            "Other disaster-related issue"
        ]
    };

    const $ = (id) => document.getElementById(id);

    function getToken() {
        return sessionStorage.getItem("reliefAuthToken");
    }

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
        const element = $("complaintFormMessage");
        if (!element) return;

        element.textContent = message;
        element.style.color = isError ? "#b42318" : "#16794b";
    }

    async function apiRequest(url, options = {}) {
        const token = getToken();

        if (!token) {
            throw new Error("Your session has expired. Please log in again.");
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

    function populateIssueTypes() {
        const category = $("complaintCategory");
        const issue = $("complaintIssueType");

        if (!category || !issue) return;

        const options = issueOptions[category.value] || [];

        issue.innerHTML =
            '<option value="">Select an issue</option>' +
            options.map((item) =>
                `<option value="${escapeHTML(item)}">${escapeHTML(item)}</option>`
            ).join("");
    }

    function renderComplaints(complaints) {
        const container = $("myComplaintsList");
        if (!container) return;

        if (!complaints.length) {
            container.innerHTML = `
                <p style="padding:16px 0;">
                    You haven't submitted any complaints yet.
                </p>`;
            return;
        }

        container.innerHTML = complaints.map((complaint) => {
            const history = Array.isArray(complaint.statusHistory)
                ? complaint.statusHistory
                : [];

            return `
                <article style="
                    border:1px solid #e1e5eb;
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
                            <strong>
                                ${escapeHTML(complaint.complaintNumber || "Complaint")}
                            </strong>
                            <p style="margin:8px 0;">
                                ${escapeHTML(complaint.issueType)}
                            </p>
                        </div>
                        <span style="
                            padding:6px 10px;
                            border-radius:20px;
                            background:#eef2ff;
                            color:#3730a3;
                            font-size:12px;
                        ">
                            ${escapeHTML(readable(complaint.status))}
                        </span>
                    </div>

                    <p>${escapeHTML(complaint.description)}</p>

                    <p>
                        <strong>Category:</strong>
                        ${escapeHTML(readable(complaint.category))}
                    </p>
                    <p>
                        <strong>Priority:</strong>
                        ${escapeHTML(readable(complaint.priority))}
                    </p>
                    <p>
                        <strong>Submitted:</strong>
                        ${escapeHTML(dateText(complaint.createdAt))}
                    </p>

                    ${
                        complaint.controlRoomRemarks
                            ? `<p><strong>Control Room remarks:</strong>
                               ${escapeHTML(complaint.controlRoomRemarks)}</p>`
                            : ""
                    }

                    ${
                        history.length
                            ? `<details style="margin-top:12px;">
                                <summary>View status history</summary>
                                <ul>
                                    ${history.map((item) => `
                                        <li style="margin:8px 0;">
                                            <strong>${escapeHTML(readable(item.status))}</strong>
                                            — ${escapeHTML(dateText(item.updatedAt))}
                                            ${
                                                item.remarks
                                                    ? `<br>${escapeHTML(item.remarks)}`
                                                    : ""
                                            }
                                        </li>
                                    `).join("")}
                                </ul>
                               </details>`
                            : ""
                    }
                </article>
            `;
        }).join("");
    }

    async function loadMyComplaints() {
        const container = $("myComplaintsList");
        if (!container) return;

        container.textContent = "Loading complaints...";

        try {
            const result = await apiRequest(`${API}/mine`);
            renderComplaints(normalizeList(result));
        } catch (error) {
            container.textContent = error.message;
        }
    }

    async function submitComplaint(event) {
        event.preventDefault();

        const form = $("complaintForm");
        if (!form) return;

        const submitButton = form.querySelector('[type="submit"]');
        const category = $("complaintCategory")?.value;
        const issueType = $("complaintIssueType")?.value;
        const description = $("complaintDescription")?.value.trim();
        const requestId = $("complaintRequestId")?.value.trim();

        if (!category || !issueType || !description) {
            showMessage("Please complete all required fields.", true);
            return;
        }

        if (description.length > 2000) {
            showMessage("Description must be 2000 characters or fewer.", true);
            return;
        }

        const payload = { category, issueType, description };

        if (requestId) {
            payload.requestId = requestId;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Submitting...";
        }

        try {
            await apiRequest(API, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            showMessage("Complaint submitted successfully.");
            form.reset();
            populateIssueTypes();
            await loadMyComplaints();
        } catch (error) {
            showMessage(error.message, true);
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "SUBMIT COMPLAINT";
            }
        }
    }

    function init() {
        const category = $("complaintCategory");
        const form = $("complaintForm");

        if (!category || !form) return;

        category.addEventListener("change", populateIssueTypes);
        form.addEventListener("submit", submitComplaint);

        populateIssueTypes();
        loadMyComplaints();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
