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
const { UserModel } = require('./models/user');
const JobModel = require('./models/job');
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const axios = require('axios');
const fetch = require("node-fetch");
const http = require('http');
const socketIO = require('socket.io');
const { exec } = require('child_process');

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Authentication middleware for Socket.IO
  socket.use((packet, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  // Handle joining interview rooms
  socket.on('join-interview', ({ interviewId }) => {
    if (!interviewId) {
      return socket.emit('error', 'Interview ID is required');
    }
    socket.join(interviewId);
    console.log(`User ${socket.user.id} joined interview ${interviewId}`);
  });

  // WebRTC signaling handlers
  socket.on('offer', ({ interviewId, offer }) => {
    socket.to(interviewId).emit('offer', { 
      userId: socket.user.id, 
      offer 
    });
  });

  socket.on('answer', ({ interviewId, answer }) => {
    socket.to(interviewId).emit('answer', { 
      userId: socket.user.id, 
      answer 
    });
  });

  socket.on('ice-candidate', ({ interviewId, candidate }) => {
    socket.to(interviewId).emit('ice-candidate', { 
      userId: socket.user.id, 
      candidate 
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err.message);
  });
});

// Swagger Configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "JobMatch API",
      version: "1.0.0",
      description: "API documentation for JobMatch recruitment platform",
    },
    servers: [{
      url: "http://localhost:5173",
    }],
  },
  apis: ["./routes/*.js"],
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
app.use('/api', jobRoutes);
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
<<<<<<< Updated upstream
    try {
        const { email, password } = req.body;
=======
  try {
      const { email, password } = req.body;
>>>>>>> Stashed changes

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
          role: user.role,              // ✅ Ajoute ce champ
          emailVerified: true
      });
  } catch (err) {
      console.error("Login Error:", err);
      return res.status(500).json({ message: "Erreur serveur" });
  }
});

<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
app.post('/Frontend/register', resumeUpload.single('resume'), async(req, res) => {
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
            return res.status(404).json({ message: "User not found." });
        }

        if (user.verificationStatus.emailVerified) {
            return res.status(400).json({ message: "Email already verified." });
        }

        if (user.verificationCode !== parseInt(verificationCode, 10)) {
            return res.status(400).json({ message: "Invalid verification code." });
        }

        user.verificationStatus.emailVerified = true;
        user.verificationStatus.status = "APPROVED";
        user.verificationCode = null;
        await user.save();

        res.json({ message: "Email verified successfully! You can now login." });
    } catch (err) {
        console.error("❌ Verification Error:", err);
        res.status(500).json({ message: "Server error." });
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
app.use('/uploadsPics', express.static(path.join(__dirname, 'uploadsPics')));

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

app.get("/Frontend/user/:id", async (req, res) => {
    try {
      console.log("📥 Données reçues pour mise à jour:", req.body);
  
      const user = await UserModel.findById(req.params.id);
      if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
  
      // 🔹 Mise à jour des champs de base
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
  
      // 🔐 Mise à jour du mot de passe si fourni
      if (req.body.password && req.body.password.length > 4) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
      }
  
      // 🧩 Mise à jour du profil utilisateur
      if (!user.profile) user.profile = {};
      const profile = req.body.profile || {};
      user.profile.phone = profile.phone ?? user.profile.phone;
      user.profile.resume = profile.resume ?? user.profile.resume;
      user.profile.availability = profile.availability ?? user.profile.availability;
      user.profile.skills = profile.skills ?? user.profile.skills;
      user.profile.languages = profile.languages ?? user.profile.languages;
      user.profile.experience = profile.experience ?? user.profile.experience;
      user.markModified("profile");
  
      // 🏢 Mise à jour des données entreprise si role === 'ENTERPRISE'
      if (user.role === "ENTERPRISE" && req.body.enterprise) {
        if (!user.enterprise) user.enterprise = {};
        const ent = req.body.enterprise;
  
        user.enterprise.name = ent.name || user.enterprise.name;
        user.enterprise.industry = ent.industry || user.enterprise.industry;
        user.enterprise.location = ent.location || user.enterprise.location;
        user.enterprise.website = ent.website || user.enterprise.website;
        user.enterprise.description = ent.description || user.enterprise.description;
        user.enterprise.employeeCount = ent.employeeCount ?? user.enterprise.employeeCount;
  
        user.markModified("enterprise");
      }
  
      await user.save();
      console.log("✅ Utilisateur mis à jour avec succès !");
      return res.status(200).json({ message: "Mise à jour réussie", enterprise: user.enterprise });
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



app.put("/Frontend/updateUser/:id", async (req, res) => {
  try {
    console.log("📥 Données reçues pour mise à jour:", req.body);

    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });

    // 🔹 Mise à jour des champs de base
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    // 🔐 Mise à jour du mot de passe si fourni
    if (req.body.password && req.body.password.length > 4) {
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      user.password = hashedPassword;
    }

    // 🧩 Mise à jour du profil utilisateur
    if (!user.profile) user.profile = {};
    const profile = req.body.profile || {};
    user.profile.phone = profile.phone ?? user.profile.phone;
    user.profile.resume = profile.resume ?? user.profile.resume;
    user.profile.availability = profile.availability ?? user.profile.availability;
    user.profile.skills = profile.skills ?? user.profile.skills;
    user.profile.languages = profile.languages ?? user.profile.languages;
    user.profile.experience = profile.experience ?? user.profile.experience;
    user.markModified("profile");

    // 🏢 Mise à jour des données entreprise si role === 'ENTERPRISE'
    if (user.role === "ENTERPRISE" && req.body.enterprise) {
      if (!user.enterprise) user.enterprise = {};
      const ent = req.body.enterprise;

      user.enterprise.name = ent.name || user.enterprise.name;
      user.enterprise.industry = ent.industry || user.enterprise.industry;
      user.enterprise.location = ent.location || user.enterprise.location;
      user.enterprise.website = ent.website || user.enterprise.website;
      user.enterprise.description = ent.description || user.enterprise.description;
      user.enterprise.employeeCount = ent.employeeCount ?? user.enterprise.employeeCount;

      user.markModified("enterprise");
    }

    await user.save();

    console.log("✅ Utilisateur mis à jour avec succès !");
    return res.status(200).json({
      message: "Mise à jour réussie",
      enterprise: user.enterprise,
      picture: user.picture, // 🔁 renvoie aussi la photo
    });

  } catch (error) {
    console.error("❌ Erreur mise à jour utilisateur:", error);
    return res.status(500).json({ error: "Erreur interne du serveur." });
  }
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
    storage: multer.diskStorage({
        destination: uploadPicsDir,
        filename: (req, file, cb) => {
            const userId = req.body.userId || 'unknown';
            cb(null, `${userId}-profile-${Date.now()}${path.extname(file.originalname)}`);
        },
    }),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

app.post("/Frontend/upload-profile", profileUpload.single("picture"), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded." });
        }

        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "User ID required." });
        }

        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        user.picture = `/uploadsPics/${req.file.filename}`;
        await user.save();

        res.status(200).json({ message: "Profile picture uploaded successfully!", pictureUrl: user.picture });
    } catch (error) {
        console.error("❌ Server error:", error);
        res.status(500).json({ error: "Server error.", details: error.message });
    }
});

app.put("/Frontend/user/:id", async(req, res) => {
    try {
        const user = await UserModel.findById(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        if (req.body.password && req.body.password.length > 4) {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            user.password = hashedPassword;
        }

        if (!user.profile) user.profile = {};

        const profile = req.body.profile || {};
        user.profile.phone = profile.phone ?? user.profile.phone;
        user.profile.resume = profile.resume ?? user.profile.resume;
        user.profile.availability = profile.availability ?? user.profile.availability;
        user.profile.skills = profile.skills ?? user.profile.skills;
        user.profile.languages = profile.languages ?? user.profile.languages;
        user.profile.experience = profile.experience ?? user.profile.experience;

        user.markModified("profile");
        await user.save();
        
        return res.status(200).json(user);
    } catch (error) {
        console.error("❌ Error updating user:", error);
        return res.status(500).json({ error: "Server error." });
    }
});



app.post("/Frontend/forgot-password", async(req, res) => {
    const { email } = req.body;

    try {
        const user = await UserModel.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found." });

        const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000;
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

app.post("/Frontend/reset-password/:token", async(req, res) => {
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

app.post("/api/grammar-check", async(req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ error: "Prompt is required." });
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
            console.error("❌ Hugging Face API Error:", errorText);
            return res.status(response.status).json({ error: "Hugging Face API Error", details: errorText });
        }

        const data = await response.json();
        res.json({ correctedText: data[0]?.generated_text || prompt });
    } catch (error) {
        console.error("❌ Hugging Face API Error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

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

app.post("/Frontend/transcribe-audio", audioUpload.single("audio"), async(req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No audio file uploaded." });
        }

        const audioPath = path.join(__dirname, req.file.path);
        exec(`whisper "${audioPath}" --model medium`, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Whisper Error: ${error.message}`);
                return res.status(500).json({ error: "Error during transcription." });
            }
            res.json({ transcript: stdout.trim() });
        });
    } catch (error) {
        console.error("❌ Audio Transcription Error:", error);
        res.status(500).json({ error: "Server error." });
    }
});

app.post("/Frontend/add-job", async (req, res) => {
    try {
      const { title, description, location, salary, entrepriseId, languages, skills } = req.body;
  
      const newJob = new JobModel({
        title,
        description,
        location,
        salary,
        entrepriseId,
        languages,
        skills
      });
  
      await newJob.save();
  
      const user = await UserModel.findById(entrepriseId).select('+jobsPosted');
      if (!user) return res.status(404).json({ error: "Entreprise introuvable" });
  
      if (!Array.isArray(user.jobsPosted)) {
        user.jobsPosted = [];
      }
  
      user.jobsPosted.push({
        jobId: newJob._id,
        title: newJob.title,
        status: "OPEN",
        createdDate: newJob.createdAt
      });
  
      user.markModified('jobsPosted');
      await user.save();
  
      return res.status(201).json({ message: "Job ajouté avec succès", job: newJob });
  
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout du job:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
});
  
app.get("/Frontend/jobs", async (req, res) => {
    try {
      const jobs = await JobModel.find()
        .populate({
          path: 'entrepriseId',
          select: 'enterprise.name'
        })
        .sort({ createdAt: -1 });
  
      res.status(200).json(jobs);
    } catch (error) {
      console.error("❌ Erreur récupération jobs:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
});
  
app.get("/Frontend/jobs/:id", async (req, res) => {
    try {
      const job = await JobModel.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ message: "Job non trouvé" });
      }
      res.status(200).json(job);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération du job par ID:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
});

app.get("/Frontend/jobs-by-entreprise/:id", async (req, res) => {
    try {
      const jobs = await JobModel.find({ entrepriseId: req.params.id }).sort({ createdAt: -1 });
      res.status(200).json(jobs);
    } catch (error) {
      console.error("❌ Erreur récupération jobs entreprise:", error);
      res.status(500).json({ error: "Erreur serveur" });
    }
});
  
app.delete("/Frontend/delete-job/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deletedJob = await JobModel.findByIdAndDelete(id);
  
      if (!deletedJob) {
        return res.status(404).json({ message: "Job non trouvé" });
      }
  
      res.status(200).json({ message: "Job supprimé avec succès" });
    } catch (error) {
      console.error("❌ Erreur lors de la suppression du job :", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Socket.IO available at ws://localhost:${PORT}/socket.io/`);
});