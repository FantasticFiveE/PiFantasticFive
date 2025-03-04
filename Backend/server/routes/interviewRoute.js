const express = require('express');
const User = require('../models/user'); // Ensure correct path to your User model
const router = express.Router();

// Get all interview meetings
router.get('/interviews', async(req, res) => {
    try {
        // Find all users with scheduled interviews
        const usersWithInterviews = await User.find({ 'interviews.0': { $exists: true } }, // Users who have at least one interview
            { interviews: 1, name: 1, email: 1, profile: 1, picture: 1, enterprise: 1 } // Include the 'name' and 'enterprise' fields
        );

        // Transform data to match frontend expectations
        const meetings = usersWithInterviews.flatMap((user) =>
            (user.interviews || []).map((interview) => ({
                id: interview._id,
                candidate: {
                    name: user.name || user.email, // Use name if available, otherwise fallback to email
                    designation: (user.profile && user.profile.experience && user.profile.experience[0] && user.profile.experience[0].title) || "N/A", // Use first experience title or "N/A"
                    picture: user.picture || "https://via.placeholder.com/80", // Default picture if none provided
                },
                date: interview.date, // Use the interview date
                jobId: interview.jobId || "N/A", // Use job ID
                status: interview.status, // Use the interview status
                enterpriseName: (user.enterprise && user.enterprise.name) || "N/A", // Use enterprise name if available
                meeting: {
                    type: (interview.meeting && interview.meeting.type) || "N/A", // Use meeting type or "N/A"
                    attendees: (interview.meeting && interview.meeting.attendees) || "N/A", // Use attendees or "N/A"
                },
            }))
        );

        res.json(meetings); // Return the transformed meeting list
    } catch (err) {
        res.status(500).json({ message: err.message }); // Handle errors
    }
});

// Get upcoming interviews
router.get("/upcoming-interviews", async(req, res) => {
    try {
        const today = new Date();

        // Find users with scheduled interviews in the future
        const usersWithInterviews = await User.find({ "interviews.date": { $gte: today } }, { interviews: 1, name: 1, email: 1, profile: 1, picture: 1, enterprise: 1, jobsPosted: 1 });

        // Extract interviews from users
        const interviews = usersWithInterviews.flatMap((user) =>
            user.interviews
            .filter((interview) => new Date(interview.date) >= today) // Filter for future interviews
            .map((interview) => {
                // Find the job title from the jobsPosted array
                const job = user.jobsPosted.find((job) => job.jobId === interview.jobId);

                return {
                    jobId: interview.jobId || "N/A", // Use job ID
                    jobTitle: job ? job.title : "N/A", // Use job title if available
                    enterpriseId: interview.enterpriseId,
                    enterpriseName: user.enterprise ? user.enterprise.name : "N/A", // Use enterprise name if available
                    date: interview.date,
                    status: interview.status,
                    meeting: interview.meeting,
                    candidate: {
                        name: user.name || user.email, // Use name if available, otherwise fallback to email
                        designation:
                            (user.profile &&
                                user.profile.experience &&
                                user.profile.experience[0] &&
                                user.profile.experience[0].title) ||
                            "N/A", // Use first experience title or "N/A"
                        picture: user.picture || "https://via.placeholder.com/80", // Default picture if none provided
                    },
                };
            })
        );

        res.status(200).json(interviews);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch interviews. Please try again later." });
    }
});

module.exports = router;