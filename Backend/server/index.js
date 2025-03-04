require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const UserModel = require("./models/user");
const crypto = require("crypto");  // Pour le token de reset password


const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

mongoose.connect("mongodb://127.0.0.1:27017/users")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const SECRET_KEY = process.env.JWT_SECRET_KEY || "jwttokenkey";

// ========== Inscription ==========
app.post("/Frontend/register", async (req, res) => {
    try {
        const { name, email, password, role, enterprise } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Tous les champs obligatoires doivent être renseignés." });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Cet email est déjà utilisé." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000);

        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            role,
            verificationCode,
            verificationStatus: { emailVerified: false, status: "PENDING" },
            emailVerified: false,
            enterprise: role === "ENTERPRISE" ? enterprise : undefined
        });

        await newUser.save();

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "🔐 Votre code de vérification - NextHire",
            text: `Bonjour ${name},\n\nVotre code de vérification est : ${verificationCode}\nMerci de le saisir sur la page de vérification.`
        };

        await transporter.sendMail(mailOptions);

        res.status(201).json({ message: "Inscription réussie ! Un code de vérification a été envoyé." });
    } catch (err) {
        console.error("❌ Erreur lors de l'inscription:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// ========== Connexion ==========
app.post("/Frontend/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect !" });
        }

        if (!user.verificationStatus.emailVerified || user.verificationStatus.status !== "APPROVED") {
            return res.status(401).json({ message: "Veuillez vérifier votre email avant de vous connecter.", emailVerified: false });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });

        res.cookie("token", token, { httpOnly: true, maxAge: 3600000, sameSite: "Lax" });

        res.json({ status: true, message: "Connexion réussie", token, role: user.role, userId: user._id });
    } catch (err) {
        console.error("❌ Erreur de connexion:", err);
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// ========== Vérification de l'email ==========
app.post("/Frontend/verify-email", async (req, res) => {
    const { email, verificationCode } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user || user.verificationCode !== verificationCode) {
            return res.status(400).json({ message: "Code de vérification incorrect ou utilisateur introuvable." });
        }

        user.verificationStatus.emailVerified = true;
        user.verificationStatus.status = "APPROVED";
        user.verificationCode = null;

        await user.save();

        res.json({ message: "Email vérifié avec succès !" });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur." });
    }
});

// ========== Google Auth ==========
app.post("/auth/google", async (req, res) => {
    console.log("✅ Google Auth Route Reached");  // Vérification
    const { email, name, googleId } = req.body;

    try {
        let user = await UserModel.findOne({ email });

        if (!user) {
            user = new UserModel({
                name,
                email,
                googleId,
                emailVerified: true,
                verificationStatus: {
                    emailVerified: true,
                    status: "APPROVED"
                },
                role: "CANDIDATE"
            });
            await user.save();
        } else if (!user.googleId) {
            user.googleId = googleId;
            user.emailVerified = true;
            user.verificationStatus.emailVerified = true;
            user.verificationStatus.status = "APPROVED";
            await user.save();
        }

        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });

        res.json({
            status: true,
            token,
            role: user.role,
            userId: user._id
        });
    } catch (error) {
        console.error("❌ Erreur lors de la connexion Google :", error);
        res.status(500).json({ message: "Erreur serveur lors de la connexion Google." });
    }
});

// ATTENTION: Place les routes React ici, APRÈS !
app.use(express.static(path.join(__dirname, "client", "build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
});



// ========== Upload Directories ==========
const uploadDir = path.join(__dirname, "uploads");
const uploadPicsDir = path.join(__dirname, "uploadsPics");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(uploadPicsDir)) fs.mkdirSync(uploadPicsDir);

app.use("/uploads", express.static(uploadDir));
app.use("/uploadsPics", express.static(uploadPicsDir));

// ========== Upload CV ==========
const storage = multer.diskStorage({ destination: uploadDir, filename: (req, file, cb) => cb(null, `${req.body.userId}-${Date.now()}${path.extname(file.originalname)}`) });
const upload = multer({ storage });

app.post("/Frontend/upload-resume", upload.single("resume"), async (req, res) => {
    const user = await UserModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.resume = `/uploads/${req.file.filename}`;
    await user.save();
    res.json({ message: "CV uploadé", resumeUrl: user.resume });
});

// ========== Upload Profile Picture ==========
const profileStorage = multer.diskStorage({ destination: uploadPicsDir, filename: (req, file, cb) => cb(null, `${req.body.userId}-profile-${Date.now()}${path.extname(file.originalname)}`) });
const profileUpload = multer({ storage: profileStorage });

app.post("/Frontend/upload-profile", profileUpload.single("picture"), async (req, res) => {
    const user = await UserModel.findById(req.body.userId);
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    user.picture = `/uploadsPics/${req.file.filename}`;
    await user.save();
    res.json({ message: "Photo de profil mise à jour", pictureUrl: user.picture });
});

// ========== Update User ==========
app.put("/Frontend/updateUser/:id", async (req, res) => {
    const user = await UserModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Profil mis à jour", user });
});
// ========== Forgot Password ==========
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) return res.status(404).json({ message: "Utilisateur introuvable." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 heure

    await user.save();

    const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "🔐 Réinitialisation de mot de passe",
        text: `Bonjour, cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}`
    });

    res.json({ message: "Lien de réinitialisation envoyé par email." });
});

// ========== Reset Password ==========
app.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await UserModel.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Lien invalide ou expiré." });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.json({ message: "Mot de passe mis à jour." });
});


app.listen(3001, () => console.log("✅ Server running on port 3001"));
