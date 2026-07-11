require("dotenv").config();
const authRoutes = require("./routes/authRoutes");


const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");
const internshipRoutes = require("./routes/internshipRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const {
    getProfile,
    updateProfile,
    requestEmailVerification,
    verifyEmailUpdate
} = require("./controllers/profileController");
const app = express();

app.set("trust proxy", 1);

connectDB();
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/applications", applicationRoutes);
app.get("/", (req, res) => {
  res.send("Internship Portal API Running...");
});
const PORT = process.env.PORT || 5000;
app.get("/api/profile", authMiddleware, getProfile);
app.put("/api/profile", authMiddleware, updateProfile);
app.post("/api/profile/email-verification", authMiddleware, requestEmailVerification);
app.post("/api/profile/verify-email", authMiddleware, verifyEmailUpdate);
app.get(
    "/api/student",
    authMiddleware,
    roleMiddleware("student"),
    (req, res) => {

        res.json({
            success: true,
            message: "Welcome Student"
        });

    }
);
app.get(
    "/api/company",
    authMiddleware,
    roleMiddleware("company"),
    (req, res) => {

        res.json({
            success: true,
            message: "Welcome Company"
        });

    }
);
app.get(
    "/api/admin",
    authMiddleware,
    roleMiddleware("admin"),
    (req, res) => {

        res.json({
            success: true,
            message: "Welcome Admin"
        });

    }
);

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
