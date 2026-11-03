const nodemailer = require("nodemailer");

// Gmail transporter configuration
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Escape HTML to prevent unsafe content in emails
const escapeHTML = (value = "") => {
    return String(value).replace(/[&<>"']/g, (char) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[char];
    });
};

// Send tracking update email
exports.sendTrackingUpdateEmail = async ({
    individualEmail,
    individualName,
    requestNumber,
    ngoName,
    status
}) => {

    const steps = [
        { id: "accepted", label: "NGO Accepted" },
        { id: "preparing", label: "Preparing Help" },
        { id: "on_the_way", label: "On the Way" },
        { id: "reached", label: "Reached Your Location" },
        { id: "delivered", label: "Assistance Delivered" }
    ];

    const currentIndex = steps.findIndex(step => step.id === status);

    const timeline = steps.map((step, index) => {
        const completed = index <= currentIndex;

        return `
            <div style="
                padding: 12px;
                margin-bottom: 8px;
                border-radius: 6px;
                background: ${completed ? "#e8f5e9" : "#f5f5f5"};
                color: ${completed ? "#237a3b" : "#777"};
            ">
                ${completed ? "&#10003;" : "&#9675;"}
                <strong>${step.label}</strong>
            </div>
        `;
    }).join("");

    const safeName = escapeHTML(individualName || "there");
    const safeRequestNumber = escapeHTML(requestNumber);
    const safeNgoName = escapeHTML(ngoName);
    const currentStatus = steps[currentIndex]?.label || "Updated";

    const mailOptions = {
        from: `"Relief Resolver" <${process.env.EMAIL_USER}>`,
        to: individualEmail,
        subject: `Relief Request ${safeRequestNumber} - ${currentStatus}`,

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 25px;
                color: #333;
                border: 1px solid #ddd;
                border-radius: 10px;
            ">

                <h2 style="color: #198754;">
                    Relief Resolver
                </h2>

                <h3>Hello ${safeName},</h3>

                <p>
                    There is an update regarding your relief assistance request.
                </p>

                <div style="
                    background: #f0f7ff;
                    padding: 15px;
                    border-radius: 8px;
                ">
                    <p><strong>Request Number:</strong> ${safeRequestNumber}</p>
                    <p><strong>NGO:</strong> ${safeNgoName}</p>
                    <p><strong>Current Status:</strong> ${currentStatus}</p>
                </div>

                <h3>Assistance Tracking Timeline</h3>

                ${timeline}

                <p style="margin-top: 25px;">
                    Thank you for using Relief Resolver.
                    We are working to ensure that help reaches you.
                </p>

                <p>
                    Regards,<br>
                    <strong>Relief Resolver Team</strong>
                </p>

            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};