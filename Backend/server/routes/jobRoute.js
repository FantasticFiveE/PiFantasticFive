const express = require('express');
const router = express.Router();
const User = require('../models/user');
const JobModel = require('../models/job');
const autoGenerateApplication = require("../services/aiService");
// ✅ POST /api/jobs/create - Create a new job and link to enterprise

router.post('/jobs/create', async (req, res) => {
  try {
    console.log("✅ Raw body received:", req.body); // Add this

    const { title, description, location, salary, enterpriseId } = req.body;

    // 1. Create the Job
    const job = new JobModel({
      title,
      description,
      location,
      salary,
      enterpriseId,
    });
    await job.save();

    // 2. Link to the enterprise
    await User.findByIdAndUpdate(enterpriseId, {
      $push: {
        jobsPosted: {
          jobId: job._id,
          title: job.title,
          status: "OPEN",
          createdDate: job.createdAt,
        },
      },
    });

    res.status(201).json({ message: "✅ Job created successfully", job });
  } catch (error) {
    console.error("❌ Error creating job:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET /api/jobs - All jobs with applicants and enterprise info
router.get('/jobs', async (req, res) => {
  try {
    const enterprises = await User.find({ role: "ENTERPRISE" }, { jobsPosted: 1, enterprise: 1 });
    const candidates = await User.find({ role: "CANDIDATE" }, { applications: 1 });

    const applicantCountMap = new Map();
    candidates.forEach((candidate) => {
      candidate.applications.forEach((application) => {
        const jobId = application.jobId?.toString();
        if (jobId) {
          applicantCountMap.set(jobId, (applicantCountMap.get(jobId) || 0) + 1);
        }
      });
    });

    const jobs = enterprises.flatMap((enterprise) =>
      (enterprise.jobsPosted || []).map((job) => ({
        _id: job.jobId,
        title: job.title,
        applicants: applicantCountMap.get(job.jobId?.toString()) || 0,
        status: job.status || "UNKNOWN",
        createdDate: job.createdDate ? new Date(job.createdDate).toISOString() : "Unknown",
        enterpriseName: enterprise.enterprise?.name || "Unknown",
        industry: enterprise.enterprise?.industry || "Unknown",
        location: enterprise.enterprise?.location || "Unknown",
      }))
    );

    res.status(200).json(jobs);
  } catch (err) {
    console.error("❌ Error fetching jobs:", err);
    res.status(500).json({ message: "Server error." });
  }
});
// ✅ Get job details by ID
router.get('/job/:id', async (req, res) => {
    try {
      const job = await JobModel.findById(req.params.id).populate("enterpriseId");
  
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
  
      const enterprise = job.enterpriseId?.enterprise || {};
  
      res.json({
        title: job.title,
        description: job.description,
        location: job.location,
        salary: job.salary,
        createdAt: job.createdAt,
        enterpriseName: enterprise.name || "Unknown",
        industry: enterprise.industry || "Unknown",
        website: enterprise.website || "N/A",
        employeeCount: enterprise.employeeCount || 0,
      });
    } catch (err) {
      console.error("❌ Error fetching job:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  
  
  
  router.delete('/jobs/delete/:userId/:jobId', async (req, res) => {
    const { userId, jobId } = req.params;
  
    try {
      await User.updateOne(
        { _id: userId },
        { $pull: { jobsPosted: { jobId: jobId } } }
      );
  
      await JobModel.findByIdAndDelete(jobId); // optional: delete from Job collection
  
      res.json({ message: "✅ Job deleted successfully" });
    } catch (err) {
      console.error("❌ Error deleting job:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  router.post('/apply/:jobId', async (req, res) => {
    try {
      const jobId = req.params.jobId;
      const userId = req.body.userId; // ⬅️ must be sent from frontend
      const application = {
        jobId,
        experience: req.body.experience,
        employmentTypes: req.body.employmentTypes,
        position: req.body.position,
        domain: req.body.domain,
        salary: req.body.salary,
        status: req.body.status
      };
  
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      user.applications.push(application);
      await user.save();
  
      res.status(201).json({ message: "✅ Application saved under user profile" });
    } catch (err) {
      console.error("❌ Error saving application:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  // POST /api/apply/:jobId/:userId
  router.post('/apply/:jobId/:userId', async (req, res) => {
    try {
      const { jobId, userId } = req.params;
  
      const job = await JobModel.findById(jobId);
      if (!job) return res.status(404).json({ message: "❌ Job not found" });
  
      const {
        experience,
        employmentTypes,
        position,
        domain,
        salary,
        status,
      } = req.body;
  
      const newApplication = {
        jobId,
        enterpriseId: job.enterpriseId,
        experience,
        employmentTypes,
        position,
        domain,
        salary,
        status,
        dateSubmitted: new Date(),
      };
  
      await User.findByIdAndUpdate(userId, {
        $push: { applications: newApplication }
      });
  
      res.status(201).json({ message: "✅ Application submitted", application: newApplication });
    } catch (err) {
      console.error("❌ Failed to apply:", err);
      res.status(500).json({ message: "Server error" });
    }
  });
  router.post("/generate-application/:userId/:jobId", async (req, res) => {
    const { userId, jobId } = req.params;
    const { resume } = req.body;
  
    try {
      const job = await JobModel.findById(jobId);
      if (!job) return res.status(404).json({ message: "Job not found" });
  
      const suggestion = await autoGenerateApplication(resume, job.title);
      res.status(200).json({ suggestion });
    } catch (err) {
      res.status(500).json({ message: "Erreur pendant la génération de la candidature" });
    }
  });
  router.post("/api/ai/generate-application", async (req, res) => {
    const { resume, jobTitle } = req.body;
    const suggestion = await autoGenerateApplication(resume, jobTitle);
    res.status(200).json({ suggestion });
  });
  




module.exports = router;
