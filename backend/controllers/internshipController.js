const Internship = require("../models/Internship");

// Create Internship
exports.createInternship = async (req, res) => {
    try {

        const {
            title,
            companyName,
            location,
            stipend,
            duration,
            description,
            skills
        } = req.body;

        const internship = await Internship.create({
            title,
            companyName,
            location,
            stipend,
            duration,
            description,
            skills,
            postedBy: req.user.id
        });

        res.status(201).json({
            success: true,
            message: "Internship created successfully.",
            internship
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });

    }
};