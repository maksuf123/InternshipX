const sendOTPEmail = require("../services/emailService");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const VALID_ROLES = ["student", "company", "admin"];

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashOTP = async (otp) => await bcrypt.hash(otp, 10);
const verifyOTPHash = async (plainOtp, hashedOtp) => await bcrypt.compare(plainOtp, hashedOtp);
const normalizeEmail = (email = "") => email.trim().toLowerCase();
const isValidEmail = (email = "") => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const defaultEmailSendMessage = "We could not send the email code right now. Please try again in a minute.";

const sendCodeEmail = async (...args) => {
  try {
    await sendOTPEmail(...args);
  } catch (error) {
    error.isEmailSendError = true;
    throw error;
  }
};

const handleError = (res, error, label = "AUTH ERROR") => {
  console.error(label, error);

  if (error.isEmailSendError) {
    return res.status(503).json({
      success: false,
      message: error.publicMessage || defaultEmailSendMessage
    });
  }

  return res.status(500).json({
    success: false,
    message: "Server Error"
  });
};

const requireValidEmail = (res, email) => {
  if (!email) {
    res.status(400).json({
      success: false,
      message: "Email is required."
    });
    return false;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      success: false,
      message: "Please enter a valid email address."
    });
    return false;
  }

  return true;
};

// Register
exports.register = async (req, res) => {
  try {
    const { name, password, college, industry, location } = req.body;
    const email = normalizeEmail(req.body.email);
    const role = VALID_ROLES.includes(req.body.role) ? req.body.role : "student";

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    let user;

    if (existingUser && !existingUser.isVerified) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role;
      existingUser.otp = hashedOtp;
      existingUser.otpExpiry = Date.now() + OTP_EXPIRY_MS;

      if (role === "student") {
        existingUser.college = college || "";
      } else if (role === "company") {
        existingUser.industry = industry || "";
        existingUser.location = location || "";
      }

      await existingUser.save();
      user = existingUser;
    } else {
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        otp: hashedOtp,
        otpExpiry: Date.now() + OTP_EXPIRY_MS,
        college: role === "student" ? (college || "") : "",
        industry: role === "company" ? (industry || "") : "",
        location: role === "company" ? (location || "") : ""
      });
    }

    await sendCodeEmail(user.email, user.name, otp);

    return res.status(201).json({
      success: true,
      message: "Verification code sent to your email."
    });
  } catch (error) {
    return handleError(res, error, "REGISTER ERROR");
  }
};

// Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp } = req.body;

    if (!requireValidEmail(res, email)) return;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified."
      });
    }

    if (!user.otp) {
      return res.status(400).json({
        success: false,
        message: "No OTP found. Please request a new one."
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP expired."
      });
    }

    const isOtpValid = await verifyOTPHash(otp, user.otp);

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP."
      });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.json({
      success: true,
      message: "Email verified successfully."
    });
  } catch (error) {
    return handleError(res, error, "VERIFY OTP ERROR");
  }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!requireValidEmail(res, email)) return;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified."
      });
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + OTP_EXPIRY_MS;

    await user.save();
    await sendCodeEmail(user.email, user.name, otp);

    return res.json({
      success: true,
      message: "A new verification code has been sent."
    });
  } catch (error) {
    return handleError(res, error, "RESEND OTP ERROR");
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email first."
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    const token = jwt.sign(
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

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return handleError(res, error, "LOGIN ERROR");
  }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!requireValidEmail(res, email)) return;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email."
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email first."
      });
    }

    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + OTP_EXPIRY_MS;

    await user.save();
    await sendCodeEmail(user.email, user.name, otp, "reset");

    return res.json({
      success: true,
      message: "Password reset code sent to your email."
    });
  } catch (error) {
    return handleError(res, error, "FORGOT PASSWORD ERROR");
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required."
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address."
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters."
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    if (!user.otp) {
      return res.status(400).json({
        success: false,
        message: "No reset code found. Please request a new one."
      });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one."
      });
    }

    const isOtpValid = await verifyOTPHash(otp, user.otp);

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP."
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful. You can now login."
    });
  } catch (error) {
    return handleError(res, error, "RESET PASSWORD ERROR");
  }
};
