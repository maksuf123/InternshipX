const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Internship = require("../models/Internship");
const sendOTPEmail = require("../services/emailService");
const bcrypt = require("bcryptjs");

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const normalizeEmail = (email = "") => email.trim().toLowerCase();
const isValidEmail = (email = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashOTP = async (otp) => await bcrypt.hash(otp, 10);
const verifyOTPHash = async (plainOtp, hashedOtp) => await bcrypt.compare(plainOtp, hashedOtp);

const formatUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    pendingEmail: user.pendingEmail || "",
    profileImage: user.profileImage || ""
});

const createProfileToken = (user) => jwt.sign(
    {
        id: user._id,
        email: user.email,
        role: user.role
    },
    process.env.JWT_SECRET,
    {
        expiresIn: "7d"
    }
);

const sendCodeEmail = async (...args) => {
    try {
        await sendOTPEmail(...args);
    } catch (error) {
        error.isEmailSendError = true;
        throw error;
    }
};

const handleProfileError = (res, error, label) => {
    console.error(label, error);

    if (error.code === 11000) {
        return res.status(400).json({
            success: false,
            message: "Email already registered."
        });
    }

    if (error.isEmailSendError) {
        return res.status(503).json({
            success: false,
            message: error.publicMessage || "We could not send the email code right now. Please try again in a minute."
        });
    }

    return res.status(500).json({
        success: false,
        message: "Server Error"
    });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("name email role pendingEmail profileImage");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Profile not found."
            });
        }

        return res.json({
            success: true,
            user: formatUser(user)
        });
    } catch (error) {
        console.error("PROFILE FETCH ERROR", error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();
        const email = normalizeEmail(req.body.email);

        if (!name || !email) {
            return res.status(400).json({
                success: false,
                message: "Name and email are required."
            });
        }

        if (name.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Name must be at least 3 characters."
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Profile not found."
            });
        }

        if (email !== user.email) {
            return res.status(400).json({
                success: false,
                message: "Please verify your new email before saving it."
            });
        }

        user.name = name;

        await user.save();

        if (user.role === "company") {
            await Internship.updateMany(
                { postedBy: user._id },
                { companyName: user.name }
            );
        }

        return res.json({
            success: true,
            message: "Profile updated successfully.",
            token: createProfileToken(user),
            user: formatUser(user)
        });
    } catch (error) {
        return handleProfileError(res, error, "PROFILE UPDATE ERROR");
    }
};

exports.requestEmailVerification = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);

        if (!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required."
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Profile not found."
            });
        }

        if (email === user.email) {
            return res.status(400).json({
                success: false,
                message: "This is already your account email."
            });
        }

        const duplicateEmail = await User.findOne({
            email,
            _id: { $ne: req.user.id }
        });

        if (duplicateEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already registered."
            });
        }

        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);

        user.pendingEmail = email;
        user.emailChangeOtp = hashedOtp;
        user.emailChangeOtpExpiry = Date.now() + OTP_EXPIRY_MS;

        await user.save();
        await sendCodeEmail(email, user.name, otp, "email-change");

        return res.json({
            success: true,
            message: "Verification code sent to your new email.",
            pendingEmail: email
        });
    } catch (error) {
        return handleProfileError(res, error, "PROFILE EMAIL CODE ERROR");
    }
};

exports.verifyEmailUpdate = async (req, res) => {
    try {
        const email = normalizeEmail(req.body.email);
        const otp = String(req.body.otp || "").trim();
        const name = String(req.body.name || "").trim();

        if (!otp) {
            return res.status(400).json({
                success: false,
                message: "Verification code is required."
            });
        }

        if (name && name.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Name must be at least 3 characters."
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Profile not found."
            });
        }

        if (!user.pendingEmail || !user.emailChangeOtp) {
            return res.status(400).json({
                success: false,
                message: "No email verification request found."
            });
        }

        if (email && email !== user.pendingEmail) {
            return res.status(400).json({
                success: false,
                message: "Request a verification code for this email first."
            });
        }

        if (user.emailChangeOtpExpiry < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "Verification code expired. Please request a new one."
            });
        }

        const isOtpValid = await verifyOTPHash(otp, user.emailChangeOtp);

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid verification code."
            });
        }

        const duplicateEmail = await User.findOne({
            email: user.pendingEmail,
            _id: { $ne: req.user.id }
        });

        if (duplicateEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already registered."
            });
        }

        user.email = user.pendingEmail;
        if (name) {
            user.name = name;
        }
        user.pendingEmail = null;
        user.emailChangeOtp = null;
        user.emailChangeOtpExpiry = null;

        await user.save();

        if (user.role === "company") {
            await Internship.updateMany(
                { postedBy: user._id },
                { companyName: user.name }
            );
        }

        return res.json({
            success: true,
            message: "Email verified and updated successfully.",
            token: createProfileToken(user),
            user: formatUser(user)
        });
    } catch (error) {
        return handleProfileError(res, error, "PROFILE EMAIL VERIFY ERROR");
    }
};
