const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const UserModel = require("./models/user"); // Changed to User model
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer"); // Ajout de l'importation de nodemailer
const passport = require("passport");
const fs = require('fs');
const multer = require("multer");


const GoogleStrategy = require("passport-google-oauth20").Strategy;
require("dotenv").config();




const app = express();


app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  next();
});

app.use(express.json());
const allowedOrigins = [
  "http://localhost:5173",
   // Add more if needed
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

    // Retourner l'ID de l'utilisateur dans la réponse
    return res.json({ 
      status: true, 
      message: "Login successful", 
      token, 
      userId: user._id, // ID de l'utilisateur
      emailVerified: true 
    });
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
  const userId = req.user.id;
  res.json({ message: "This is a protected route", user: req.user });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3001/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
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

passport.deserializeUser(async (id, done) => {
  const user = await UserModel.findById(id);
  done(null, user);
});

app.post("/auth/google", async (req, res) => {
  const { email, name, googleId } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({ email, name, googleId });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, "SECRET_KEY", { expiresIn: "1h" });

    res.json({ status: true, token, role: user.role || "CANDIDATE" });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Route pour déclencher l'auth Google
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Route de callback après authentification Google
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id, email: req.user.email }, SECRET_KEY, {
      expiresIn: "1h",
    });

    res.cookie("token", token, { httpOnly: true, maxAge: 3600000, sameSite: "strict" });

    res.redirect("http://localhost:5173/home"); // Redirige après connexion réussie
  }
);
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self' https://accounts.google.com");
  next();
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

/* app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
}); */


//************** PROFILE */
// Middleware pour servir les fichiers statiques des dossiers 'uploads/' et 'uploadsPics/'
const uploadDir = path.join(__dirname, 'uploads');
const uploadPicsDir = path.join(__dirname, 'uploadsPics');

// Vérifiez si les dossiers existent, sinon créez-les
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(uploadPicsDir)) {
  fs.mkdirSync(uploadPicsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadDir)); 
app.use("/uploadsPics", express.static(uploadPicsDir)); 

app.get("/Frontend/getUser/:id", async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }
    
    // Nettoyer les chemins de résumé invalides
    if (user.resume && (user.resume.startsWith("file://") || user.resume === "")) {
      user.resume = null;
      await user.save();
      console.log(`Chemin de résumé invalide détecté et nettoyé pour l'utilisateur ${user._id}`);
    }
    
    // Assurez-vous que tous les champs sont bien renvoyés
    console.log("Données utilisateur à renvoyer:", {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      resume: user.resume,
      picture: user.picture
    });
    
    res.json(user);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

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

app.post("/Frontend/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const { userId } = req.body;
    console.log("📥 Requête reçue pour l'upload de CV");
    console.log("👤 User ID :", userId);
    console.log("📂 Fichier reçu :", req.file);

    if (!req.file) {
      console.error("❌ Aucun fichier reçu !");
      return res.status(400).json({ error: "Aucun fichier envoyé." });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      console.error("❌ Utilisateur non trouvé !");
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // Enregistrez le chemin du CV dans la base de données
    user.resume = `/uploads/${req.file.filename}`;
    await user.save(); // Sauvegarde l'utilisateur avec le lien du CV

    console.log("✅ CV sauvegardé :", user.resume);
    // Renvoi de l'URL du CV
    res.status(200).json({ message: "CV téléchargé avec succès !", resumeUrl: user.resume });
  } catch (error) {
    console.error("❌ Erreur lors du téléchargement du CV", error);
    res.status(500).json({ error: "Erreur serveur." });
  }
});


// Configurer Multer pour l'upload d'image de profil
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

app.post("/Frontend/upload-profile", profileUpload.single("picture"), async (req, res) => {
  try {
    console.log("📥 Requête reçue pour l'upload d'image");
    console.log("📂 Fichier reçu :", req.file);
    console.log("👤 User ID :", req.body.userId);

    if (!req.file) {
      console.error("❌ Aucune image reçue !");
      return res.status(400).json({ error: "Aucune image envoyée." });
    }

    const { userId } = req.body;
    if (!userId) {
      console.error("❌ User ID manquant !");
      return res.status(400).json({ error: "User ID manquant." });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      console.error("❌ Utilisateur non trouvé !");
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    user.picture = `/uploadsPics/${req.file.filename}`;
    await user.save();

    console.log("✅ Image sauvegardée :", user.picture);
    res.status(200).json({ message: "Photo de profil importée avec succès !", pictureUrl: user.picture });
  } catch (error) {
    console.error("❌ Erreur serveur :", error);
    res.status(500).json({ error: "Erreur serveur.", details: error.message });
  }
});

app.put("/Frontend/updateUser/:id", async (req, res) => {
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
app.listen(3001, () => {
  console.log("✅ Server running on port 3001");
});
