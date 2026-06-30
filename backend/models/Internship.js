const mongoose = require("mongoose");

const internshipSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true
    },

    companyName: {
        type: String,
        required: true
    },

    location: {
        type: String,
        required: true
    },

    stipend: {
        type: String,
        default: "Unpaid"
    },

    duration: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    skills: [
        {
            type: String
        }
    ],

    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
},
{
    timestamps: true
});

module.exports = mongoose.model("Internship", internshipSchema);