const sendOTPEmail = require("../services/emailService");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Helper: Generate and hash OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const hashOTP = async (otp) => await bcrypt.hash(otp, 10);
const verifyOTPHash = async (plainOtp, hashedOtp) => await bcrypt.compare(plainOtp, hashedOtp);

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email already registered."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate and hash OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    let user;

    if (existingUser && !existingUser.isVerified) {
      // Overwrite unverified user with new registration data
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.role = role;
      existingUser.otp = hashedOtp;
      existingUser.otpExpiry = Date.now() + 10 * 60 * 1000;
      await existingUser.save();
      user = existingUser;
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        password: hashedPassword,
        role,
        otp: hashedOtp,
        otpExpiry: Date.now() + 10 * 60 * 1000
      });
    }

    await sendOTPEmail(user.email, user.name, otp);

    res.status(201).json({
      success: true,
      message: "Verification code sent to your email."
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};


// Verify OTP
exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Email already verified"
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
                message: "OTP expired"
            });
        }

        // Compare hashed OTP
        const isOtpValid = await verifyOTPHash(otp, user.otp);

        if (!isOtpValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;

        await user.save();

        res.json({
            success: true,
            message: "Email verified successfully"
        });

    } catch (err) {
        console.error("VERIFY OTP ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

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

    // Generate and hash new OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendOTPEmail(user.email, user.name, otp);

    return res.json({
      success: true,
      message: "A new verification code has been sent."
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
        success: false,
        message: "Server Error"
    });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required."
      });
    }

    // Find user
    const user = await User.findOne({ email });

    // Use the same error message for both "user not found" and "wrong password"
    // to prevent email enumeration attacks
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Check verification
    if (!user.isVerified) {
      return res.status(401).json({
        success: false,
        message: "Please verify your email first."
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password."
      });
    }

    // Create JWT Token
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

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// Forgot Password - sends OTP to email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required."
      });
    }

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

    // Generate and hash OTP
    const otp = generateOTP();
    const hashedOtp = await hashOTP(otp);

    user.otp = hashedOtp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    await sendOTPEmail(user.email, user.name, otp, "reset");

    return res.json({
      success: true,
      message: "Password reset code sent to your email."
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};

// Reset Password - verifies OTP and sets new password
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required."
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

    // Compare hashed OTP
    const isOtpValid = await verifyOTPHash(otp, user.otp);

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP."
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;

    await user.save();

    return res.json({
      success: true,
      message: "Password reset successful. You can now login."
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};