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
const UserModel = require('./models/user'); 

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// CORS Configuration
const allowedOrigins = ["http://localhost:5173"];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Passport Google Strategy
passport.use(new GoogleStrategy({
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
    })
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    const user = await UserModel.findById(id);
    done(null, user);
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Auth Route
app.post("/auth/google", async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { email, name, sub: googleId } = ticket.getPayload();
        let user = await UserModel.findOne({ email });

        if (!user) {
            user = await UserModel.create({ email, name, googleId, emailVerified: true, role: "CANDIDATE" });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });

        res.json({ status: true, message: "Google login successful", token, userId: user._id, role: user.role });
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
app.use('/api', jobRoutes);
app.use('/api', interviewRoutes);

// Authentication & Registration Routes
app.post("/Frontend/login", async (req, res) => { /* Login logic (same as you provided) */ });
app.post("/Frontend/register", async (req, res) => { /* Registration logic (same as you provided) */ });
app.post("/Frontend/verify-email", async (req, res) => { /* Email Verification logic (same as you provided) */ });

// File Upload Setup
const uploadDir = path.join(__dirname, 'uploads');
const uploadPicsDir = path.join(__dirname, 'uploadsPics');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(uploadPicsDir)) fs.mkdirSync(uploadPicsDir, { recursive: true });

app.use("/uploads", express.static(uploadDir));
app.use("/uploadsPics", express.static(uploadPicsDir));

app.get("/Frontend/getUser/:id", async (req, res) => { /* Fetch user logic (same as you provided) */ });

const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`)
    }),
});

app.post("/Frontend/upload-resume", upload.single("resume"), async (req, res) => { /* Upload resume logic (same as you provided) */ });

const profileUpload = multer({
    storage: multer.diskStorage({
        destination: uploadPicsDir,
        filename: (req, file, cb) => {
            const userId = req.headers['x-user-id'] || 'unknown';
            cb(null, `${userId}-profile-${Date.now()}${path.extname(file.originalname)}`);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
});

app.post("/Frontend/upload-profile", profileUpload.single("picture"), async (req, res) => { /* Upload profile picture logic (same as you provided) */ });

app.put("/Frontend/updateUser/:id", async (req, res) => { /* Update user logic (same as you provided) */ });

app.post("/forgot-password", async (req, res) => { /* Forgot password logic (same as you provided) */ });

app.post("/reset-password/:token", async (req, res) => { /* Reset password logic (same as you provided) */ });

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

