const express = require('express');
const User = require('../models/user'); // Ensure correct path to your User model
const router = express.Router();

/**
 * Helper function to transform interview data into the desired format.
 * @param {Object} user - The user object containing interviews.
 * @param {Object} interview - The specific interview object to transform.
 * @returns {Object} - Transformed interview data.
 */
function transformInterviewData(user, interview) {
    const job = user.jobsPosted.find((job) => String(job.jobId) === String(interview.jobId));

    return {
        jobId: interview.jobId || "N/A", // Use job ID
        jobTitle: job ? job.title : "N/A", // Use job title if available
        enterpriseId: interview.enterpriseId,
        enterpriseName: user.enterprise?.name || "N/A", // Use enterprise name if available
        date: isValidDate(interview.date) ? new Date(interview.date).toISOString() : "Invalid Date",
        status: interview.status || "N/A",
        meeting: {
            type: (interview.meeting && interview.meeting.type) || "N/A", // Use meeting type or "N/A"
            attendees: (interview.meeting && interview.meeting.attendees) || "N/A", // Use attendees or "N/A"
        },
        candidate: {
            name: user.name || user.email || "Unknown", // Use name if available, otherwise fallback to email
            designation:
                (user.profile &&
                    Array.isArray(user.profile.experience) &&
                    user.profile.experience[0] &&
                    user.profile.experience[0].title) ||
                "N/A", // Use first experience title or "N/A"
            picture: user.picture || "https://via.placeholder.com/80", // Default picture if none provided
        },
    };
}

/**
 * Validates if a value is a valid date.
 * @param {any} date - The value to check.
 * @returns {boolean} - True if valid date, false otherwise.
 */
function isValidDate(date) {
    return date && !isNaN(new Date(date).getTime());
}

// Get all interview meetings
router.get('/interviews', async (req, res) => {
    try {
        console.log("📥 GET /interviews request received");

        // Find all users with scheduled interviews
        const usersWithInterviews = await User.find(
            { 'interviews.0': { $exists: true } }, // Users who have at least one interview
            { interviews: 1, name: 1, email: 1, profile: 1, picture: 1, enterprise: 1 }
        );

        // Transform data to match frontend expectations
        const meetings = usersWithInterviews.flatMap((user) =>
            (user.interviews || []).map((interview) => transformInterviewData(user, interview))
        );

        res.json(meetings); // Return the transformed meeting list
    } catch (err) {
        console.error("❌ Error fetching interviews:", err.message, err.stack);
        res.status(500).json({ message: "Failed to fetch interviews. Please try again later." });
    }
});

// Get upcoming interviews
router.get("/upcoming-interviews", async (req, res) => {
    try {
        console.log("📥 GET /upcoming-interviews request received");

        const today = new Date();

        // Find users with scheduled interviews in the future
        const usersWithInterviews = await User.find(
            { "interviews.date": { $gte: today } },
            { interviews: 1, name: 1, email: 1, profile: 1, picture: 1, enterprise: 1, jobsPosted: 1 }
        );

        // Extract and transform interviews
        const interviews = usersWithInterviews.flatMap((user) =>
            (user.interviews || [])
                .filter((interview) => isValidDate(interview.date) && new Date(interview.date) >= today)
                .map((interview) => transformInterviewData(user, interview))
        );

        res.status(200).json(interviews);
    } catch (error) {
        console.error("❌ Error fetching upcoming interviews:", error.message, error.stack);
        res.status(500).json({ error: "Failed to fetch interviews. Please try again later." });
    }
});

module.exports = router;