const nodemailer = require("nodemailer");

console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log("EMAIL_PASS exists =", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOTPEmail = async (email, name, otp, type = "verify") => {

    console.log("Sending OTP email...");
    console.log("To:", email);

    const isReset = type === "reset";

    const subject = isReset
        ? "Reset Your InternshipX Password"
        : "Verify Your InternshipX Account";

    const heading = isReset
        ? "Password Reset"
        : "Email Verification";

    const bodyText = isReset
        ? "We received a request to reset your password."
        : "Thank you for registering with InternshipX.";

    const codeLabel = isReset
        ? "Your password reset code is:"
        : "Your verification code is:";

    const mailOptions = {
        from: `"InternshipX" <${process.env.EMAIL_USER}>`,
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

            ${isReset ? '<p style="color:#6B7280;">If you did not request a password reset, please ignore this email.</p>' : ''}

            <hr>

            <p style="font-size:13px;color:#6B7280;">
                Crafted by ByteForge
            </p>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);

    console.log("Email sent successfully!");
};

module.exports = sendOTPEmail;