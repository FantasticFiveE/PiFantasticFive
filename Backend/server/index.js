require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const UserModel = require("./models/user");
const nodemailer = require("nodemailer");  // ✅ AJOUTE CETTE LIGNE

const app = express();


// CORS setup
const allowedOrigins = ["http://localhost:5173"];
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/users")
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Secret key for JWT
const SECRET_KEY = process.env.JWT_SECRET_KEY || "jwttokenkey";

// ============================
// PASSPORT GOOGLE STRATEGY
// ============================
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await UserModel.findOne({ email: profile.emails[0].value });

        if (!user) {
            user = await UserModel.create({
                email: profile.emails[0].value,
                name: profile.displayName,
                googleId: profile.id,
                emailVerified: true,
                role: "CANDIDATE"
            });
        }

        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await UserModel.findById(id);
    done(null, user);
});

// ============================
// LOGIN ROUTE
// ============================
app.post("/Frontend/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.findOne({ email });

        if (!user) return res.status(401).json({ message: "Email ou mot de passe incorrect!" });
        if (!await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: "Email ou mot de passe incorrect!" });
        }

        if (!user.verificationStatus.emailVerified || user.verificationStatus.status !== "APPROVED") {
            return res.status(401).json({ message: "Veuillez vérifier votre email avant de vous connecter.", emailVerified: false });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });

        res.cookie("token", token, { httpOnly: true, maxAge: 3600000, sameSite: "Lax" });

        res.json({ status: true, message: "Login successful", token, emailVerified: true });
    } catch (err) {
        res.status(500).json({ message: "Erreur serveur" });
    }
});
app.post("/Frontend/register", async (req, res) => {
  try {
      const { name, email, password, role, enterprise } = req.body;

      if (!email || !password || !role) {
          return res.status(400).json({ message: "Email, mot de passe et rôle sont requis." });
      }

      const existingUser = await UserModel.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ message: "Cet email est déjà utilisé." });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const verificationCode = Math.floor(100000 + Math.random() * 900000);  // Code de vérification email (optionnel)

      const newUser = new UserModel({
          name,
          email,
          password: hashedPassword,
          role,
          emailVerified: false,  // par défaut, non vérifié
          verificationStatus: {
              emailVerified: false,
              status: "PENDING"
          },
          verificationCode,  // Ajouter le code de vérification
          enterprise: role === "ENTERPRISE" ? enterprise : undefined
      });

      await newUser.save();

      // Envoi d'un email de vérification (optionnel)
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
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
              subject: "🔐 Code de vérification - NextHire",
              text: `Bonjour ${name},\n\nVotre code de vérification est : ${verificationCode}\n\nMerci de le saisir sur la page de vérification pour activer votre compte.`
          };

          await transporter.sendMail(mailOptions);
      }

      res.status(201).json({ message: "Inscription réussie ! Un code de vérification a été envoyé à votre email." });

  } catch (err) {
      console.error("❌ Erreur lors de l'inscription :", err);
      res.status(500).json({ message: "Erreur serveur." });
  }
});


// ============================
// GOOGLE AUTH ROUTES
// ============================
// Lancer la connexion Google (frontend redirige ici)
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Callback Google après connexion
app.get("/auth/google/callback", passport.authenticate("google", { session: false, failureRedirect: "/login" }), (req, res) => {
    const token = jwt.sign({ id: req.user._id, email: req.user.email }, SECRET_KEY, { expiresIn: "1h" });

    res.cookie("token", token, { httpOnly: true, maxAge: 3600000, sameSite: "Lax" });
    res.redirect("http://localhost:5173/home");  // Redirige vers le frontend après succès
});

// Connexion via Google directement depuis frontend (post direct)
app.post("/auth/google", async (req, res) => {
    const { email, name, googleId } = req.body;

    try {
        let user = await UserModel.findOne({ email });

        if (!user) {
            user = await UserModel.create({
                email,
                name,
                googleId,
                emailVerified: true,
                role: "CANDIDATE"
            });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
        res.json({ status: true, token, role: user.role });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

// ============================
// PROTECTED ROUTE EXEMPLE
// ============================
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Access Denied" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid Token" });
        req.user = decoded;
        next();
    });
};

app.get("/Frontend/protected", verifyToken, (req, res) => {
    res.json({ message: "This is a protected route", user: req.user });
});

// ============================
// SERVE REACT APP (IF BUILT)
// ============================
const path = require("path");
app.use(express.static(path.join(__dirname, "client/build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

// ============================
// START SERVER
// ============================
app.listen(3001, () => {
    console.log("✅ Server running on port 3001");
});
