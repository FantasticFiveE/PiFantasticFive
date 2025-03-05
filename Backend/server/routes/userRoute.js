const express = require("express");
const User = require("../models/user");
const router = express.Router();
const bcrypt = require("bcrypt"); // For password hashing
const multer = require("multer");


// Get all users
router.get("/users", async(req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: "Error retrieving users", error: err.message });
    }
});

// Get single user by ID
router.get("/users/:id", async(req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Error fetching user", error: err.message });
    }
});

// Create new user
router.post("/users", async(req, res) => {
    try {
        const user = new User(req.body);
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: "Failed to create user", error: err.message });
    }
});

// Update user by ID
router.put("/users/:id", async(req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (err) {
        res.status(400).json({ message: "Failed to update user", error: err.message });
    }
});

// Delete user by ID
router.delete("/users/:id", async(req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete user", error: err.message });
    }
});

// Change password
router.post("/users/change-password", async(req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Verify the current password (plain text comparison)
        if (currentPassword !== user.password) {
            return res.status(400).json({ message: "Current password is incorrect." });
        }

        // Update the user's password (save in plain text)
        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        res.status(500).json({ message: "An error occurred. Please try again." });
    }
});
router.get('/approved-candidates', async(req, res) => {
    try {
        // Fetch all candidates with approved applications
        const candidates = await User.find({ role: 'CANDIDATE', 'applications.status': 'APPROVED' }, { name: 1, email: 1, profile: 1, picture: 1, applications: 1, interviews: 1 });

        // Fetch all enterprises to map enterprise names and job titles
        const enterprises = await User.find({ role: 'ENTERPRISE' }, { enterprise: 1, jobsPosted: 1 });

        // Create a map for enterprise names and job titles
        const enterpriseMap = new Map();
        const jobTitleMap = new Map();

        enterprises.forEach((enterprise) => {
            if (enterprise.enterprise) {
                enterpriseMap.set(enterprise._id.toString(), enterprise.enterprise.name);
            }
            if (enterprise.jobsPosted) {
                enterprise.jobsPosted.forEach((job) => {
                    jobTitleMap.set(job.jobId.toString(), job.title);
                });
            }
        });

        // Transform data for the frontend
        const approvedCandidates = candidates.flatMap((candidate) =>
            (candidate.applications || [])
            .filter((app) => app.status === 'APPROVED') // Filter for approved applications
            .map((app) => {
                // Find the interview for this application
                const interview = (candidate.interviews || []).find(
                    (int) => int.jobId.toString() === app.jobId.toString() && int.status === 'Completed'
                );

                return {
                    candidate_name: candidate.name || candidate.email, // Use name if available, otherwise fallback to email
                    position: jobTitleMap.get(app.jobId.toString()) || 'N/A', // Use job title if available
                    hiredBy: enterpriseMap.get(app.enterpriseId.toString()) || 'N/A', // Use enterprise name if available
                    picture: candidate.picture || 'https://via.placeholder.com/80', // Default picture if none provided
                    interviewDate: interview && interview.date ? new Date(interview.date).toLocaleDateString() : 'N/A', // Format interview date or fallback
                };
            })
        );

        res.json(approvedCandidates); // Return approved candidates
    } catch (err) {
        res.status(500).json({ message: err.message }); // Handle errors
    }
});
router.post("/login", async(req, res) => {
    const { email, password } = req.body;

    try {
        // Find the user by email
        const user = await User.findOne({ email: email.trim().toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Compare the provided password with the plain text password in the database
        if (password !== user.password) {
            return res.status(400).json({ message: "Invalid email or password." });
        }

        // If everything is correct, log the user in
        res.status(200).json({ message: "Login successful!", user });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "An error occurred. Please try again." });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save files in the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
    },
});

const upload = multer({ storage });

// API endpoint for picture upload
router.post("/upload-picture", upload.single("picture"), async(req, res) => {
    try {
        const { userId } = req.body;
        const pictureURL = `/uploads/${req.file.filename}`; // URL to access the uploaded file

        // Update the user's picture in the database
        const updatedUser = await User.findByIdAndUpdate(
            userId, { picture: pictureURL }, { new: true } // Return the updated user
        );

        res.status(200).json({
            message: "Picture uploaded successfully",
            pictureURL: updatedUser.picture,
            user: updatedUser, // Return the entire updated user object
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to upload picture", error: error.message });
    }
});
app.put("/api/users/:id/last-login", async(req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByIdAndUpdate(
            id, { lastLogin: new Date() }, // Update lastLogin to the current timestamp
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Last login updated", user });
    } catch (error) {
        console.error("Error updating last login:", error);
        res.status(500).json({ message: "Server error" });
    }
});
module.exports = router;