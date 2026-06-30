const express = require("express");

const router = express.Router();

const { createInternship } = require("../controllers/internshipController");

const authMiddleware = require("../middleware/authMiddleware");

const roleMiddleware = require("../middleware/roleMiddleware");

router.post(
    "/",
    authMiddleware,
    roleMiddleware("company"),
    createInternship
);

module.exports = router;