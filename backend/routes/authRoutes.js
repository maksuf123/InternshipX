const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
    register,
    verifyOTP,
    resendOTP,
    login,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

// Rate limiter for login — 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: "Too many login attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for OTP verification — 5 attempts per 15 minutes per IP
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many OTP attempts. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for OTP sending — 3 sends per 15 minutes per IP
const otpSendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: "Too many OTP requests. Please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for registration — 5 per hour per IP
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: "Too many registration attempts. Please try again after an hour."
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post("/register", registerLimiter, register);
router.post("/verify-otp", otpLimiter, verifyOTP);
router.post("/resend-otp", otpSendLimiter, resendOTP);
router.post("/login", loginLimiter, login);
router.post("/forgot-password", otpSendLimiter, forgotPassword);
router.post("/reset-password", otpLimiter, resetPassword);
module.exports = router;