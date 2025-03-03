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

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5175", // Frontend running on port 5173
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

// Routes
const userRoutes = require('./routes/userRoute');
const jobRoutes = require('./routes/jobRoute');
const interviewRoutes = require('./routes/interviewRoute');

app.use('/api', userRoutes);
app.use('/api', jobRoutes);
app.use('/api', interviewRoutes);

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

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.SECRET_KEY, {
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

app.post("/Frontend/register", async(req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({ message: "Email, mot de passe et rôle sont requis" });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000);

        const newUser = await UserModel.create({
            email,
            name,
            password: hashedPassword,
            role,
            emailVerified: false,
            verificationCode: verificationCode,
        });

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "🔐 Code de vérification",
            text: `Bonjour,\n\nVotre code de vérification est : ${verificationCode}\n\nVeuillez entrer ce code sur la page de vérification.`,
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: "Utilisateur créé. Un code de vérification a été envoyé par email." });
    } catch (err) {
        console.error("❌ Erreur lors de l'enregistrement :", err);
        res.status(500).json({ message: "Erreur serveur" });
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
const uploadDir = path.join(__dirname, 'uploads');
const uploadPicsDir = path.join(__dirname, 'uploadsPics');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(uploadPicsDir)) {
    fs.mkdirSync(uploadPicsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir));
app.use("/uploadsPics", express.static(uploadPicsDir));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.body.userId}-${Date.now()}${path.extname(file.originalname)}`);
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
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max pour le fichier
    }
});

app.post("/Frontend/upload-resume", upload.single("resume"), async(req, res) => {
    try {
        const { userId } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: "Aucun fichier envoyé." });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "Utilisateur non trouvé." });
        }

        user.resume = `/uploads/${req.file.filename}`;
        await user.save();

        res.status(200).json({ message: "CV téléchargé avec succès !", resumeUrl: user.resume });
    } catch (error) {
        console.error("❌ Erreur lors du téléchargement du CV", error);
        res.status(500).json({ error: "Erreur serveur." });
    }
});

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPicsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${req.body.userId}-profile-${Date.now()}${path.extname(file.originalname)}`);
    },
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

app.put("/Frontend/updateUser/:id", async(req, res) => {
    try {
        const userId = req.params.id;
        const updatedData = req.body;

        const user = await UserModel.findByIdAndUpdate(userId, updatedData, { new: true });

        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        res.json({ message: "Profil mis à jour avec succès", user });
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour du profil", error: error.message });
    }
});

// Serveur en écoute
const PORT = process.env.PORT || 3001; // Updated to port 3001
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});