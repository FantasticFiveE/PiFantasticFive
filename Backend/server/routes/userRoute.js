const express = require("express");
const User = require("../models/user");
const router = express.Router();
const bcrypt = require("bcrypt"); // For password hashing
const jwt = require("jsonwebtoken"); // Import JWT
const { UserModel } = require("../models/user");

router.post("/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const user = await User.findOne({ email, role: "ADMIN" });
        if (!user) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect!" });
        }

        if (!user.verificationStatus?.emailVerified || user.verificationStatus.status !== 'APPROVED') {
            return res.status(401).json({
                message: "Veuillez vérifier votre email avant de vous connecter.",
                emailVerified: false
            });
        }

        if (!process.env.JWT_SECRET_KEY) {
            console.error("❌ ERREUR: JWT_SECRET_KEY non défini dans .env !");
            return res.status(500).json({ message: "Erreur serveur : JWT non configuré" });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 3600000,
            sameSite: "strict",
        });

        return res.json({
            status: true,
            message: "Login successful",
            token,
            userId: user._id,
            emailVerified: true
        });

    } catch (err) {
        console.error("❌ Login Error:", err);
        return res.status(500).json({ message: "Erreur serveur", error: err.message });
    }
});
// Get all users
router.get("/users", async (req, res) => {
    try {
      console.log("📥 Requête reçue pour /api/users");  // debug log
      const users = await UserModel.find(); // ⚠️ bien UserModel ici
      res.status(200).json(users);
    } catch (err) {
      console.error("❌ Erreur dans /api/users:", err);  // trace exacte
      res.status(500).json({ message: "Erreur serveur", error: err.message });
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

// Route pour ajouter un administrateur
router.post("/admin", async (req, res) => {
    try {
        const { email, name, password } = req.body;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        // Hachage du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Création du nouvel administrateur
        const admin = new User({
            email,
            name,
            role: "ADMIN",
            password: hashedPassword,
            permissions: {
                canManageUsers: true,
                canControlPermissions: true,
                canOverseeSystem: true,
            },
            verificationStatus: {
                status: "APPROVED",
                emailVerified: true,
            }
        });

        // Sauvegarde dans la base de données
        const newAdmin = await admin.save();

        res.status(201).json({ message: "Administrateur ajouté avec succès", admin: newAdmin });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la création de l'administrateur", error: error.message });
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
router.post("/change-password", async(req, res) => {
    const { userId, currentPassword, newPassword } = req.body;

    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify the current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update the user's password
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error changing password", error: err.message });
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


module.exports = router;