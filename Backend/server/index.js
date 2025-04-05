require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const passport = require('passport');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const UserModel = require('./models/user'); // Changed to User model
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const axios = require('axios'); // ✅ Add this line
const fetch = require("node-fetch");
const dotenv = require("dotenv");
const JobModel = require('./models/job');

const app = express();

// Swagger Configuration
const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "My API",
            version: "1.0.0",
            description: "API documentation for my project",
        },
        servers: [{
            url: "http://localhost:5173 ", // Change this if needed
        }, ],
    },
    apis: ["./routes/*.js"], // Ensure this path matches your route files
};

const swaggerSpec = swaggerJsdoc(options);

// Swagger UI Setup
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = [
    "http://localhost:5173",
    // Frontend running on port 5173
    // Add more if needed
];

app.use(
    cors({
        origin: function(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Passport Configuration
passport.use(
    new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:3001/auth/google/callback",
        },
        async(accessToken, refreshToken, profile, done) => {
            try {
                let user = await UserModel.findOne({ email: profile.emails[0].value });

                if (!user) {
                    user = await UserModel.create({
                        email: profile.emails[0].value,
                        name: profile.displayName,
                        googleId: profile.id,
                        emailVerified: true,
                        role: "CANDIDATE",
                    });
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async(id, done) => {
    const user = await UserModel.findById(id);
    done(null, user);
});
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

app.post("/auth/google", async(req, res) => {
    const { credential } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name;
        const googleId = payload.sub;

        let user = await UserModel.findOne({ email });

        if (!user) {
            user = new UserModel({
                email,
                name,
                googleId,
                emailVerified: true,
                role: "CANDIDATE",
                // No password required for Google users
            });

            await user.save();
        }

        const token = jwt.sign({ id: user._id, email: user.email },
            process.env.JWT_SECRET_KEY, { expiresIn: "1h" }
        );

        res.status(200).json({
            status: true,
            message: "Google login successful",
            token,
            userId: user._id,
            role: user.role,
        });

    } catch (error) {
        console.error("❌ Google Auth Error:", error);
        res.status(500).json({ message: "Google authentication failed." });
    }
});


// Routes
const userRoutes = require('./routes/userRoute');
const jobRoutes = require('./routes/jobRoute');
const interviewRoutes = require('./routes/interviewRoute');

app.use('/api', userRoutes);
app.use('/api', jobRoutes);      // ✅ now req.body will work here
app.use('/api', interviewRoutes);
const uploadDir = path.join(__dirname, 'uploads');

const resumeUpload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => cb(null, `resume-${Date.now()}${path.extname(file.originalname)}`)
    }),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(new Error("Unsupported file format."), false);
    }
});

// Authentication Routes
app.post("/Frontend/login", async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email et mot de passe requis" });
        }

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect!" });
        }

        if (!user.verificationStatus.emailVerified || user.verificationStatus.status !== 'APPROVED') {
            return res.status(401).json({
                message: "Veuillez vérifier votre email avant de vous connecter.",
                emailVerified: false
            });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1h",
        });

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
        console.error("Login Error:", err);
        return res.status(500).json({ message: "Erreur serveur" });
    }
});


app.post('/Frontend/register', resumeUpload.single('resume'), async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: 'Email, password, and role are required' });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000);

        // Create only common fields
        const userData = {
            email,
            name,
            password: hashedPassword,
            role,
            isActive: true,
            verificationCode,
            verificationStatus: {
                status: 'PENDING',
                emailVerified: false
            }
        };

        // 👤 Candidate: only profile data
        if (role === "CANDIDATE") {
            userData.profile = {
                resume: "",
                skills: [],
                phone: "",
                languages: [],
                availability: "Full-time",
                experience: []
            };

            if (req.file) {
                const filePath = path.join(uploadDir, req.file.filename);
                const FormData = require('form-data');
                const form = new FormData();
                form.append('resume', fs.createReadStream(filePath));

                try {
                    const pythonResponse = await axios.post('http://127.0.0.1:5002/upload', form, {
                        headers: {
                            ...form.getHeaders(),
                        },
                    });

                    const resumeData = pythonResponse.data;

                    userData.profile.resume = `/uploads/${req.file.filename}`;
                    userData.profile.skills = resumeData.skills || [];
                    userData.profile.languages = resumeData.languages || [];
                    userData.profile.phone = resumeData.phone || "";
                    userData.profile.experience = resumeData.experience || [];

                    if (resumeData.name) userData.name = resumeData.name;
                } catch (error) {
                    console.error("❌ Resume analysis error:", error);
                    return res.status(500).json({ message: "Error analyzing resume." });
                }
            }
        }

        // 🏢 Enterprise: enterprise + job fields
        if (role === "ENTERPRISE") {
            userData.enterprise = {
                name: req.body.enterpriseName,
                industry: req.body.industry,
                location: req.body.location,
                website: req.body.website,
                description: req.body.description,
                employeeCount: parseInt(req.body.employeeCount || 0)
            };

            userData.jobsPosted = [];
            userData.applications = [];
            userData.interviews = [];
        }

        const newUser = new UserModel(userData);
        await newUser.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '🔐 Verification Code',
            text: `Hello,\n\nYour verification code is: ${verificationCode}\n\nPlease enter this code on the verification page.`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'User created. A verification code has been sent to your email.' });

    } catch (err) {
        console.error('❌ Registration error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});






app.post("/Frontend/verify-email", async(req, res) => {
    try {
        const { email, verificationCode } = req.body;

        const user = await UserModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }

        if (user.verificationStatus.emailVerified) {
            return res.status(400).json({ message: "Email déjà vérifié." });
        }

        if (user.verificationCode !== parseInt(verificationCode, 10)) {
            return res.status(400).json({ message: "Code de vérification incorrect." });
        }

        user.verificationStatus.emailVerified = true;
        user.verificationStatus.status = "APPROVED";
        user.verificationCode = null;

        await user.save();

        res.json({ message: "Email vérifié avec succès! Vous pouvez maintenant vous connecter." });
    } catch (err) {
        console.error("❌ Erreur lors de la vérification :", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// File Upload Configuration
const uploadPicsDir = path.join(__dirname, 'uploadsPics');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(uploadPicsDir)) {
    fs.mkdirSync(uploadPicsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));
app.use("/uploadsPics", express.static(uploadPicsDir));
// Resume Upload Configuration
const resumeStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`),
});
const resumeFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file format.'), false);
    }
};

// Profile Picture Upload Configuration
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPicsDir),
    filename: (req, file, cb) => {
        const userId = req.body.userId || 'unknown';
        cb(null, `${userId}-profile-${Date.now()}${path.extname(file.originalname)}`);
    },
});
const profileFileFilter = (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and GIF formats are supported.'), false);
    }
};


app.get("/Frontend/getUser/:id", async (req, res) => {
    try {
      // Dynamically select extra fields based on role
      let user = await UserModel.findById(req.params.id);
  
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
  
      // If the user is an enterprise, include additional fields manually
      if (user.role === 'ENTERPRISE') {
        user = await UserModel.findById(req.params.id).select('+jobsPosted +applications +interviews');
      }
  
      const responseUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture: user.picture,
        profile: {
          phone: user.profile?.phone || "",
          resume: user.profile?.resume || "",
          skills: user.profile?.skills || [],
          languages: user.profile?.languages || [],
          experience: user.profile?.experience || [],
          availability: user.profile?.availability || "Full-time"
        }
      };
  
      // 🏢 Include enterprise fields if role is ENTERPRISE
      if (user.role === 'ENTERPRISE') {
        responseUser.enterprise = {
          name: user.enterprise?.name || "",
          industry: user.enterprise?.industry || "",
          location: user.enterprise?.location || "",
          website: user.enterprise?.website || "",
          description: user.enterprise?.description || "",
          employeeCount: user.enterprise?.employeeCount || 0,
        };
  
        responseUser.jobsPosted = user.jobsPosted || [];
        responseUser.applications = user.applications || [];
        responseUser.interviews = user.interviews || [];
      }
  
      console.log("📤 Données utilisateur à renvoyer:", responseUser);
      res.json(responseUser);
  
    } catch (error) {
      console.error("❌ Erreur lors de la récupération de l'utilisateur:", error);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
  });
  
  

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Nom temporaire (sans userId au début)
        cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
    },
});



const fileFilter = (req, file, cb) => {
    const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Format de fichier non supporté"), false);
    }
};

const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => {
            // Nom temporaire au cas où userId est absent
            cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
        }
    }),
});

app.post('/Frontend/upload-resume', resumeUpload.single('resume'), async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const newFilename = `${userId}-${Date.now()}${path.extname(req.file.originalname)}`;
        const newPath = path.join(req.file.destination, newFilename);

        const fsPromises = require('fs').promises;
        await fsPromises.rename(req.file.path, newPath);

        const form = new FormData();
        form.append('resume', fs.createReadStream(newPath));
        const pythonResponse = await axios.post('http://localhost:5002/upload', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        const resumeData = pythonResponse.data;

        user.resume = `/uploads/${newFilename}`;
        user.email = user.email || resumeData.email;
        user.phone = resumeData.phone || user.phone;
        user.skills = resumeData.skills || user.skills || [];
        user.languages = resumeData.languages || user.languages || [];
        if (resumeData.name) user.name = user.name || resumeData.name;

        await user.save();

        console.log('✅ Resume updated for user:', user);
        res.status(200).json({
            message: 'Resume uploaded and analyzed successfully!',
            resumeUrl: user.resume,
            extractedData: resumeData,
        });
    } catch (error) {
        console.error('❌ Server error during resume upload:', error);
        res.status(500).json({ error: 'Server error.', details: error.message });
    }
});





const profileUpload = multer({
    storage: profileStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max pour l'image de profil
    }
});

app.post("/Frontend/upload-profile", profileUpload.single("picture"), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Aucune image envoyée." });
        }

        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID manquant." });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        user.picture = `/uploadsPics/${req.file.filename}`;
        await user.save();

        res.status(200).json({ message: "Photo de profil importée avec succès !", pictureUrl: user.picture });
    } catch (error) {
        console.error("❌ Erreur serveur :", error);
        res.status(500).json({ error: "Erreur serveur.", details: error.message });
    }
});

app.put("/Frontend/updateUser/:id", async (req, res) => {
    try {
      console.log("📥 Received PUT data:", req.body);
  
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
  
      // Update top-level fields
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
  
      // Update password if provided and valid
      if (req.body.password && req.body.password.length > 4) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
      }
  
      // ✅ Ensure profile exists
      if (!user.profile) user.profile = {};
  
      // Update nested profile fields
      const profile = req.body.profile || {};
      user.profile.phone = profile.phone ?? user.profile.phone;
      user.profile.resume = profile.resume ?? user.profile.resume;
      user.profile.availability = profile.availability ?? user.profile.availability;
      user.profile.skills = profile.skills ?? user.profile.skills;
      user.profile.languages = profile.languages ?? user.profile.languages;
      user.profile.experience = profile.experience ?? user.profile.experience;
  
      // 🧠 Important when modifying nested objects in Mongoose
      user.markModified("profile");
  
      await user.save();
      console.log("✅ User updated:", user);
      return res.status(200).json(user);
    } catch (error) {
      console.error("❌ Erreur mise à jour utilisateur:", error);
      return res.status(500).json({ error: "Erreur interne du serveur." });
    }
  });
  
  
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found." });
 
        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
 
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();
 
        const resetLink = `http://localhost:5173/reset-password/${resetToken}`;
 
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        });
 
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset Request",
            text: `Click this link to reset your password: ${resetLink}`
        });
 
        res.json({ message: "✅ Password reset email sent." });
 
    } catch (error) {
        console.error("❌ Forgot Password Error:", error);
        res.status(500).json({ message: "Server error." });
    }
 });

app.post("/reset-password/:token", async(req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await UserModel.findById(decoded.id);

        if (!user || user.resetPasswordToken !== token) {
            return res.status(400).json({ message: "Invalid or expired reset token." });
        }

        if (user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: "Password reset link has expired." });
        }

        user.password = await bcrypt.hash(password, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: "✅ Password reset successfully." });
    } catch (error) {
        console.error("❌ Reset Password Error:", error);
        res.status(500).json({ message: "Server error." });
    }
});


// ✅ OpenAI API for Experience Correction
app.post("/api/openai", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Le prompt est requis." });
        }

        const response = await fetch("https://api-inference.huggingface.co/models/vennify/t5-base-grammar-correction", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: prompt }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Erreur Hugging Face API:", errorText);
            return res.status(response.status).json({ error: "Erreur Hugging Face API", details: errorText });
        }

        const data = await response.json();
        res.json({ correctedText: data[0]?.generated_text || prompt });
    } catch (error) {
        console.error("❌ Erreur Hugging Face API:", error);
        res.status(500).json({ error: "Erreur serveur." });
    }
});





// 📂 Configuration du stockage des fichiers audio
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const audioDir = path.join(__dirname, "uploads/audio");
        if (!fs.existsSync(audioDir)) {
            fs.mkdirSync(audioDir, { recursive: true });
        }
        cb(null, audioDir);
    },
    filename: (req, file, cb) => {
        cb(null, `audio-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const audioUpload = multer({ storage: audioStorage });

// 📡 Endpoint pour la transcription avec Whisper AI
app.post("/Frontend/transcribe-audio", audioUpload.single("audio"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier audio envoyé." });
        }

        const audioPath = path.join(__dirname, req.file.path);

        console.log(`🔊 Fichier audio reçu : ${audioPath}`);

        // 📢 Exécuter Whisper AI pour transcrire l'audio
        exec(`whisper "${audioPath}" --model medium`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Erreur Whisper: ${error.message}`);
                return res.status(500).json({ error: "Erreur lors de la transcription." });
            }

            console.log("✅ Transcription réussie :", stdout);
            res.json({ transcript: stdout.trim() });
        });

    } catch (error) {
        console.error("❌ Erreur transcription audio:", error);
        res.status(500).json({ error: "Erreur interne du serveur." });
    }
});


// Serveur en écoute
const PORT = process.env.PORT || 3001; // Updated to port 3001
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});