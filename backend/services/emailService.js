const nodemailer = require("nodemailer");

const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS) || 10000;

const getEmailConfig = () => {
    const user = String(process.env.EMAIL_USER || "").trim();
    const pass = String(process.env.EMAIL_PASS || "").replace(/\s+/g, "");

    return { user, pass };
};

const getPublicEmailErrorMessage = (error) => {
    if (error.message === "Email service is not configured.") {
        return "Email service is not configured on the server. Add EMAIL_USER and EMAIL_PASS in Render.";
    }

    const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
    if (error.code === "EAUTH" || error.responseCode === 535) {
        if (host.includes("gmail.com")) {
            return "Email login failed. Update EMAIL_USER and the Gmail App Password in Render.";
        }
        if (host.includes("brevo.com") || host.includes("sendinblue")) {
            return "Email login failed. Update EMAIL_USER and the Brevo SMTP Key in Render.";
        }
        return "Email login failed. Please check your EMAIL_USER and EMAIL_PASS in Render.";
    }

    if (error.code === "ETIMEDOUT" || error.code === "ECONNECTION" || error.code === "ESOCKET") {
        const port = Number(process.env.SMTP_PORT) || 2525;
        if (port === 587 || port === 465 || port === 25) {
            return "Email server connection timed out. Note: Render Free Tier blocks ports 25, 465, and 587. Please use port 2525 with Brevo.";
        }
        return "Email server connection timed out. Please try again in a minute.";
    }

    return "We could not send the email code right now. Please try again in a minute.";
};

const createTransporter = () => {
    const { user, pass } = getEmailConfig();
    const host = process.env.SMTP_HOST || "smtp-relay.brevo.com";
    const port = Number(process.env.SMTP_PORT) || 2525; // Default to 2525 to bypass Render port blocks
    const secure = process.env.SMTP_SECURE === "true" || port === 465;

    return nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass
        },
        connectionTimeout: SMTP_TIMEOUT_MS,
        greetingTimeout: SMTP_TIMEOUT_MS,
        socketTimeout: SMTP_TIMEOUT_MS
    });
};

const sendOTPEmail = async (email, name, otp, type = "verify") => {

    const { user, pass } = getEmailConfig();

    if (!user || !pass) {
        const configError = new Error("Email service is not configured.");
        configError.publicMessage = getPublicEmailErrorMessage(configError);
        throw configError;
    }

    console.log("Sending OTP email...");
    console.log("To:", email);

    const isReset = type === "reset";
    const isEmailChange = type === "email-change";

    const subject = isReset
        ? "Reset Your InternshipX Password"
        : isEmailChange
            ? "Verify Your New InternshipX Email"
            : "Verify Your InternshipX Account";

    const bodyText = isReset
        ? "We received a request to reset your password."
        : isEmailChange
            ? "We received a request to change your InternshipX account email."
            : "Thank you for registering with InternshipX.";

    const codeLabel = isReset
        ? "Your password reset code is:"
        : isEmailChange
            ? "Your email change verification code is:"
            : "Your verification code is:";

    const mailOptions = {
        from: `"InternshipX" <maksufmasrur786@gmail.com>`,
        to: email,
        subject,

        html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:30px;border:1px solid #e5e7eb;border-radius:10px">
            <h2 style="color:#2563EB;">InternshipX</h2>

            <p>Hello <strong>${name}</strong>,</p>

            <p>${bodyText}</p>

            <p>${codeLabel}</p>

            <h1 style="
                text-align:center;
                letter-spacing:8px;
                color:#2563EB;
                background:#F3F4F6;
                padding:20px;
                border-radius:8px;
            ">
                ${otp}
            </h1>

            <p>This OTP is valid for 10 minutes.</p>

            ${isReset || isEmailChange ? '<p style="color:#6B7280;">If you did not request this, please ignore this email.</p>' : ''}

            <hr>

            <p style="font-size:13px;color:#6B7280;">
                Crafted by ByteForge
            </p>
        </div>
        `
    };

    try {
        await createTransporter().sendMail(mailOptions);
    } catch (error) {
        console.error("EMAIL SEND ERROR", {
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response,
            message: error.message
        });

        if (error.code === "ETIMEDOUT" || error.code === "ECONNECTION" || error.code === "ESOCKET") {
            const port = Number(process.env.SMTP_PORT) || 2525;
            if (port === 587 || port === 465 || port === 25) {
                console.warn("\n⚠️  SMTP CONNECTION TIMEOUT DETECTED!");
                console.warn("👉 Render Free Tier blocks outbound SMTP traffic on ports 25, 465, and 587.");
                console.warn("👉 To bypass this block, configure your SMTP server (like Brevo) to use port 2525.");
                console.warn("👉 Add environment variables in Render: SMTP_HOST=smtp-relay.brevo.com and SMTP_PORT=2525\n");
            }
        }

        error.publicMessage = getPublicEmailErrorMessage(error);
        throw error;
    }

    console.log("Email sent successfully!");
};

module.exports = sendOTPEmail;
