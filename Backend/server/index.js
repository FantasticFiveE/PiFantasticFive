const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const UserModel = require("./models/user"); // Changed to User model
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer"); // Ajout de l'importation de nodemailer
require("dotenv").config();




const app = express();
app.use(express.json());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",  // Add more if needed
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());

mongoose
  .connect("mongodb://127.0.0.1:27017/users") // You can update the DB name if needed
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

const SECRET_KEY = "jwttokenkey";

// Route pour se connecter (login)
app.post("/Frontend/login", async (req, res) => {
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

    // Vérifier si l'email est validé dans verificationStatus
    if (!user.verificationStatus.emailVerified || user.verificationStatus.status !== 'APPROVED') {
      return res.status(401).json({
        message: "Veuillez vérifier votre email avant de vous connecter.",
        emailVerified: false
      });
    }

    // Générer le token JWT
    const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 3600000,
      sameSite: "strict",
    });

    return res.json({ status: true, message: "Login successful", token, emailVerified: true });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});


// Middleware pour vérifier le token
const verifyToken = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Invalid Token" });
    }
    req.user = decoded;
    next();
  });
};

// Route protégée (exemple)
app.get("/Frontend/protected", verifyToken, (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
});

app.post("/Frontend/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "Email, mot de passe et rôle sont requis" });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer un code de vérification à 6 chiffres
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // Créer un nouvel utilisateur avec email non vérifié
    const newUser = await UserModel.create({
      email,
      name,
      password: hashedPassword,
      role,
      emailVerified: false,
      verificationCode: verificationCode, // Stocke le code dans la base
    });

    // Préparer l'email avec le code de vérification
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

    // Envoyer l'email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Utilisateur créé. Un code de vérification a été envoyé par email." });
  } catch (err) {
    console.error("❌ Erreur lors de l'enregistrement :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



app.post("/Frontend/verify-email", async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    // Vérification de l'utilisateur dans la base de données
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Vérification si l'email est déjà vérifié
    if (user.verificationStatus.emailVerified) {
      return res.status(400).json({ message: "Email déjà vérifié." });
    }

    // Comparaison du code de vérification
    if (user.verificationCode !== parseInt(verificationCode, 10)) {
      return res.status(400).json({ message: "Code de vérification incorrect." });
    }

    // Vérification réussie, on met à jour les champs dans verificationStatus
    user.verificationStatus.emailVerified = true; // Le statut de l'email est maintenant vérifié
    user.verificationStatus.status = "APPROVED"; // On met à jour le statut de la vérification
    user.verificationCode = null; // On efface le code après vérification

    await user.save();

    res.json({ message: "Email vérifié avec succès! Vous pouvez maintenant vous connecter." });
  } catch (err) {
    console.error("❌ Erreur lors de la vérification :", err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});






// Route de récupération du mot de passe
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "❌ Utilisateur non trouvé" });
    }

    const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "5m" });

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
      subject: "🔐 Réinitialisation de votre mot de passe",
      text: `Bonjour,\n\nCliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :\n\nhttp://localhost:5173/reset-password/${token}\n\nCe lien expire dans 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    return res.json({ status: true, message: "📩 Email envoyé avec succès" });

  } catch (error) {
    console.error("❌ Error sending email:", error);
    return res.status(500).json({ message: "❌ Error sending email" });
  }
});

// Route pour réinitialiser le mot de passe
app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Le mot de passe doit contenir au moins 6 caractères" });
    }

    // Vérification du token
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.findByIdAndUpdate(decoded.id, { password: hashedPassword }, { new: true });

    return res.json({ status: true, message: "✅ Mot de passe réinitialisé avec succès!" });

  } catch (err) {
    console.error("❌ Error updating password:", err);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});




const path = require("path");

// Servir l'application React pour toutes les autres routes non définies dans Express
app.use(express.static(path.join(__dirname, "client/build"))); // Assure-toi d'avoir buildé React

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});


// Serveur en écoute
app.listen(3001, () => {
  console.log("✅ Server running on port 3001");
});
