const express = require("express");
const router = express.Router();

const {
    applyInternship,
    getCompanyApplications,
    updateApplicationStatus,
    getStudentApplications
} = require("../controllers/applicationController");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post(
    "/:internshipId",
    authMiddleware,
    roleMiddleware("student"),
    applyInternship
);

router.get(
    "/company",
    authMiddleware,
    roleMiddleware("company"),
    getCompanyApplications
);
router.get(
    "/student",
    authMiddleware,
    roleMiddleware("student"),
    getStudentApplications
);
router.patch(
    "/:applicationId/status",
    authMiddleware,
    roleMiddleware("company"),
    updateApplicationStatus
);

module.exports = router;
// Student View Own Applications
