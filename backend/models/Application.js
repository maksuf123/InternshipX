const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
{
    internship: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Internship",
        required: true
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    status: {
        type: String,
        enum: ["Pending", "Reviewed", "Accepted", "Rejected"],
        default: "Pending"
    },

    resume: {
        type: String,
        default: ""
    },

    coverLetter: {
        type: String,
        default: ""
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("Application", applicationSchema);