const express = require("express");

const router = express.Router();


const {
    createInternship,
    getCompanyInternships,
    getAllInternships,
    getPublicInternships,
    deleteInternship,
    updateInternship
} = require("../controllers/internshipController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Public latest internships for homepage preview
router.get(
    "/public/latest",
    getPublicInternships
);

// Create internship
router.post(
    "/",
    authMiddleware,
    roleMiddleware("company"),
    createInternship
);

// Get internships of logged-in company
router.get(
    "/company",
    authMiddleware,
    roleMiddleware("company"),
    getCompanyInternships
);

// Get all internships
router.get(
    "/",
    authMiddleware,
    getAllInternships
);
router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware("company"),
    deleteInternship
);
router.put(
    "/:id",
    authMiddleware,
    roleMiddleware("company"),
    updateInternship
);
module.exports = router;
