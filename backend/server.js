const authRoutes = require("./routes/authRoutes");
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authMiddleware = require("./middleware/authMiddleware");
const roleMiddleware = require("./middleware/roleMiddleware");
const internshipRoutes = require("./routes/internshipRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const app = express();
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
app.get("/api/profile", authMiddleware, (req, res) => {

    res.json({
        success: true,
        message: "Protected Route Accessed",
        user: req.user
    });

});
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