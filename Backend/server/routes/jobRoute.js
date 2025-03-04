const express = require('express');
const User = require('../models/user'); // Ensure the correct path to your User model
const router = express.Router();

// Get all jobs with the number of applicants
router.get('/jobs', async(req, res) => {
    try {
        // Fetch enterprises with their jobs
        const enterprises = await User.find({ role: "ENTERPRISE" }, { jobsPosted: 1, enterprise: 1 });

        // Fetch candidates to count applicants
        const candidates = await User.find({ role: "CANDIDATE" }, { applications: 1 });

        // Create a map to count applicants per job
        const applicantCountMap = new Map();
        candidates.forEach((candidate) => {
            candidate.applications.forEach((application) => {
                const jobId = application.jobId.toString();
                applicantCountMap.set(jobId, (applicantCountMap.get(jobId) || 0) + 1);
            });
        });

        // Transform data
        const jobs = enterprises.flatMap((enterprise) =>
            (enterprise.jobsPosted || []).map((job) => ({
                _id: job.jobId,
                title: job.title,
                applicants: applicantCountMap.get(job.jobId.toString()) || 0,
                status: job.status,
                createdDate: job.createdDate ? new Date(job.createdDate).toISOString() : "Unknown",
                enterpriseName: enterprise.enterprise && enterprise.enterprise.name ? enterprise.enterprise.name : "Unknown",
                industry: enterprise.enterprise && enterprise.enterprise.industry ? enterprise.enterprise.industry : "Unknown",
                location: enterprise.enterprise && enterprise.enterprise.location ? enterprise.enterprise.location : "Unknown",
            }))
        );

        res.json(jobs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;