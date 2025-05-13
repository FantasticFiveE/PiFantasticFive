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
const { JobModel } = require('./models/user');
const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const axios = require('axios');
const fetch = require("node-fetch");
const http = require('http');
const socketIO = require('socket.io');
const { exec } = require('child_process');
const ApplicationModel = require('./models/Application');
const uploadCV = require("./middleware/uploadCV");
const QuizModel = require("./models/Quiz");
const QuizResultModel = require("./models/QuizResultModel");
const messageRoutes = require('./routes/messages');
const setupSocketEvents = require('./socket');
const Message = require('./models/Message');

// Error Handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);

// CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",  // For local browser access
  "http://frontend:5173"    // For internal Docker communication
];

// Initialize Socket.IO with corrected CORS configuration
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins, // Allow both localhost and frontend service
    methods: ["GET", "POST"],
    credentials: true
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error("Authentication token missing"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    socket.user = decoded;
    next();
  } catch (err) {
    console.error("Authentication failed:", err);
    return next(new Error("Authentication failed"));
  }
});

// Socket.IO setup
io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id, "User ID:", socket.user?.id);

  // Each user joins their own room for private messaging
  if (socket.user?.id) {
    socket.join(socket.user.id);
  }

  // Message handling
  socket.on("send-message", ({ to, from, text, timestamp }) => {
    // Save to database first
    const newMessage = new Message({
      from,
      to,
      text,
      timestamp
    });
    
    newMessage.save()
      .then(() => {
        // Then emit to recipient
        io.to(to).emit("receive-message", { from, to, text, timestamp });
      })
      .catch(err => {
        console.error("Error saving message:", err);
      });
  });

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
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
      url: "http://frontend:5173",
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

// Apply CORS with dynamic origin checking
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use('/api/messages', messageRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await createBotUser();
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Bot User Creation
async function createBotUser() {
  try {
    const existingBot = await UserModel.findOne({ email: 'bot@jobmatch.com' });
    if (!existingBot) {
      const botUser = await UserModel.create({
        email: 'bot@jobmatch.com',
        name: 'NextBot',
        role: 'CANDIDATE',
        emailVerified: true,
        verificationStatus: { status: 'APPROVED', emailVerified: true }
      });
      console.log('✅ Bot user created:', botUser.email);
    } else {
      console.log('✅ Bot user already exists:', existingBot.email);
    }
  } catch (err) {
    console.error('❌ Error creating bot user:', err.message);
  }
}

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
const quizRoutes = require('./routes/quizRoute');

app.use('/api', userRoutes);
app.use('/api', jobRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/quiz', quizRoutes);

const uploadDir = pathphan
.join(__dirname, 'Uploads');
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
app.post("/Frontend/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await UserModel.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password!" });
    }

    if (!user.verificationStatus.emailVerified || user.verificationStatus.status !== 'APPROVED') {
      return res.status(401).json({
        message: "Please verify your email before logging in.",
        emailVerified: false
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1h" }
    );

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile: user.profile,
      enterprise: user.enterprise,
      picture: user.picture
    };

    return res.json({
      status: true,
      message: "Login successful",
      token,
      userId: user._id,
      role: user.role,
      emailVerified: true,
      userData
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

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
          userData.profile.resume = `/Uploads/${req.file.filename}`;
          userData.profile.skills = resumeData.profile?.skills || [];
          userData.profile.languages = resumeData.profile?.languages || [];
          userData.profile.phone = resumeData.profile?.phone || "";
          userData.profile.experience = Array.isArray(resumeData.profile?.experience)
            ? resumeData.profile.experience
            : [];

          if (resumeData.name) userData.name = resumeData.name;
        } catch (error) {
          console.error("❌ Resume analysis error:", error.message);

          if (error.response) {
            console.error("📨 Erreur IA réponse:", error.response.data);
            return res.status(500).json({ 
              message: "Error analyzing resume from AI model.",
              details: error.response.data
            });
          } else if (error.request) {
            console.error("📡 Aucune réponse reçue de l'IA:", error.request);
            return res.status(500).json({ 
              message: "No response from AI model.",
              details: "Check if the Flask server is running on port 5002"
            });
          } else {
            console.error("❗ Autre erreur:", error.message);
            return res.status(500).json({ 
              message: "Unexpected error during resume analysis.",
              details: error.message
            });
          }
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
const uploadPicsDir = path.join(__dirname, 'UploadsPics');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(uploadPicsDir)) {
  fs.mkdirSync(uploadPicsDir, { recursive: true });
}

app.use("/Uploads", express.static(uploadDir));
app.use("/UploadsPics", express.static(uploadPicsDir));

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
      user.enterprise.picture = ent.picture || user.enterprise.picture;
      user.enterprise.industry = ent.industry || user.enterprise.industry;
      user.enterprise.location = ent.location || user.enterprise.location;
      user.enterprise.website = ent.website || user.enterprise.website;
      user.enterprise.description = ent.description || user.enterprise.description;
      user.enterprise.employeeCount = ent.employeeCount ?? user.enterprise.employeeCount;

      user.markModified("enterprise");
    }

    await user.save();
    console.log("✅ Utilisateur mis à jour avec succès !");
    return res.status(200).json({ message: "Mise à jour réussie", User: user });
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
      cb(null, `temp-${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
});

app.get("/Frontend/getUser/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture,
      profile: user.profile || {},
      enterprise: user.enterprise || {},
    });
  } catch (err) {
    console.error("❌ Error fetching user:", err);
    res.status(500).json({ message: "Server error" });
  }
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
      message: "Mise à jour réussFINDINGSie",
      enterprise: user.enterprise,
      picture: user.picture,
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

    user.profile = user.profile || {};
    user.profile.resume = `/Uploads/${newFilename}`;
    user.profile.phone = resumeData.phone || user.profile.phone;
    user.profile.skills = resumeData.skills || user.profile.skills || [];
    user.profile.languages = resumeData.languages || user.profile.languages || [];
    user.profile.experience = Array.isArray(resumeData.experience)
      ? resumeData.experience.map(item => ({
          title: "",
          company: "",
          duration: "",
          description: item
        }))
      : [];

    if (resumeData.name) user.name = user.name || resumeData.name;

    user.markModified("profile");
    await user.save();

    console.log('✅ Resume updated for user:', user);
    res.status(200).json({
      message: 'Resume uploaded and analyzed successfully!',
      resumeUrl: user.profile.resume,
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

    user.picture = `/UploadsPics/${req.file.filename}`;
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

    const resetLink = `http://frontend:5173/reset-password/${resetToken}`;

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

    if (!user || user.reset audiblePasswordToken !== token) {
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
    const audioDir = path.join(__dirname, "Uploads/audio");
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
    const job = await JobModel.findById(req.params.id).populate("entrepriseId");
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

app.get("/Frontend/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const user = await UserModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error in /Frontend/me:", error);
    res.status(401).json({ message: "Invalid token." });
  }
});

app.post("/Frontend/apply-job", uploadCV.single("cv"), async (req, res) => {
  try {
    const { jobId, enterpriseId, candidateId, fullName, email, phone } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Fichier CV manquant." });
    }

    const newApplication = new ApplicationModel({
      jobId,
      enterpriseId,
      candidateId,
      fullName,
      email,
      phone,
      cv: `/Uploads/cvs/${req.file.filename}`
    });

    await newApplication.save();

    res.status(201).json({ message: "Candidature envoyée avec succès." });
  } catch (error) {
    console.error("❌ Backend error:", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

app.get("/Frontend/notifications/:enterpriseId", async (req, res) => {
  try {
    const { enterpriseId } = req.params;
    const user = await UserModel.findById(enterpriseId).select("notifications");

    if (!user) return res.status(404).json({ message: "Entreprise non trouvée" });

    res.status(200).json({ notifications: user.notifications || [] });
  } catch (err) {
    console.error("❌ Erreur récupération notifications:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/Frontend/applications/:enterpriseId", async (req, res) => {
  try {
    const { enterpriseId } = req.params;

    const applications = await ApplicationModel.find({ enterpriseId })
      .populate("jobId", "title")
      .populate("candidateId", "name email profile.phone");

    res.status(200).json(applications);
  } catch (error) {
    console.error("❌ Error fetching applications:", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des candidatures." });
  }
});

app.get("/Frontend/job-applications-count/:entrepriseId", async (req, res) => {
  try {
    const { entrepriseId } = req.params;

    const jobs = await JobModel.find({ entrepriseId }).select("_id");
    const jobIds = jobs.map((j) => j._id);

    const counts = await ApplicationModel.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } }
    ]);

    const countMap = {};
    counts.forEach(c => {
      countMap[c._id] = c.count;
    });

    res.json(countMap);
  } catch (err) {
    console.error("❌ Error in job-applications-count:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/Frontend/job-applications/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const applications = await ApplicationModel.find({ jobId }).populate("candidateId");
    
    res.status(200).json({
      success: true,
      applications: applications || []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching applications",
      applications: []
    });
  }
});

app.post("/Frontend/create-quiz", async (req, res) => {
  try {
    const { jobId, questions } = req.body;
    const quiz = new QuizModel({ jobId, questions });
    await quiz.save();
    res.status(200).json({ message: "Quiz enregistré !" });
  } catch (error) {
    console.error("Erreur création quiz:", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

app.get("/Frontend/quiz/:jobId", async (req, res) => {
  try {
    const { jobId } = req.params;
    const quiz = await QuizModel.findOne({ jobId });

    if (!quiz) {
      return res.status(404).json({ message: "Aucun quiz trouvé pour ce job." });
    }

    res.json(quiz);
  } catch (err) {
    console.error("❌ Erreur récupération quiz:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/Frontend/submit-quiz", async (req, res) => {
  try {
    const { jobId, candidateId, answers } = req.body;

    // Get the quiz questions
    const quiz = await QuizModel.findOne({ jobId });
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found for this job" });
    }

    // Calculate score
    let score = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        score++;
      }
    });

    // Update application with quiz score
    await ApplicationModel.findOneAndUpdate(
      { jobId, candidateId },
      { quizScore: score, quizCompleted: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      score,
      totalQuestions: quiz.questions.length,
      passingScore: Math.ceil(quiz.questions.length / 2)
    });
  } catch (error) {
    console.error("❌ Error submitting quiz:", error);
    res.status(500).json({ message: "Server error while processing quiz" });
  }
});

app.get('/Frontend/quiz-lengths', async (req, res) => {
  try {
    const quizzes = await QuizModel.find({}, 'jobId questions');
    const lengths = {};
    quizzes.forEach(quiz => {
      lengths[quiz.jobId] = quiz.questions.length;
    });
    res.status(200).json(lengths);
  } catch (error) {
    console.error("Error fetching quiz lengths:", error);
    res.status(500).json({ message: "Error fetching quiz lengths" });
  }
});

app.get("/Frontend/quiz-results/:jobId", async (req, res) => {
  try {
    const results = await QuizResultModel.find({ jobId })
      .populate("candidateId", "name email");

    res.json(results);
  } catch (err) {
    console.error("❌ Erreur récupération des scores:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.put("/Frontend/update-quiz-score", async (req, res) => {
  try {
    const { jobId, candidateId, score } = req.body;

    console.log("💬 Reçu :", { jobId, candidateId, score });

    // 1. Mettre à jour l'application
    const updatedApplication = await ApplicationModel.findOneAndUpdate(
      {
        jobId: new mongoose.Types.ObjectId(jobId),
        candidateId: new mongoose.Types.ObjectId(candidateId),
      },
      { quizScore: score },
      { new: true }
    );

    if (!updatedApplication) {
      return res.status(404).json({ message: "Application not found" });
    }

    // 2. Créer ou mettre à jour QuizResult
    const quizResult = await QuizResultModel.findOneAndUpdate(
      {
        jobId: new mongoose.Types.ObjectId(jobId),
        candidateId: new mongoose.Types.ObjectId(candidateId),
      },
      {
        jobId: new mongoose.Types.ObjectId(jobId),
        candidateId: new mongoose.Types.ObjectId(candidateId),
        score,
      },
      { new: true, upsert: true }
    );

    console.log("✅ Application mise à jour :", updatedApplication);
    console.log("✅ Résultat quiz enregistré :", quizResult);

    res.json({ message: "Quiz score updated in both Application and QuizResult", updatedApplication, quizResult });

  } catch (err) {
    console.error("❌ Erreur :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.get("/Frontend/applications-by-candidate/:candidateId", async (req, res) => {
  try {
    const { candidateId } = req.params;

    const applications = await ApplicationModel.find({ candidateId })
      .populate("jobId", "title")
      .sort({ appliedAt: -1 });

    res.status(200).json(applications);
  } catch (err) {
    console.error("❌ Error fetching applications by candidate:", err);
    res.status(500).json({ message: "Erreur lors de la récupération des candidatures." });
  }
});

app.delete("/Frontend/delete-application/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log("🧩 ID reçu pour suppression :", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID invalide" });
    }

    const deleted = await ApplicationModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Aucune candidature trouvée." });
    }

    res.status(200).json({ message: "Candidature supprimée avec succès." });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression :", error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression." });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await UserModel.find().select('-password');
    res.json(users);
  } catch (err) {
    console.error("❌ Erreur lors de la récupération des utilisateurs :", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post('/admins', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Vérifie si l'admin existe déjà
    const existingAdmin = await UserModel.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Un utilisateur avec cet email existe déjà." });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new UserModel({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin ajouté avec succès.", admin: newAdmin });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de l'admin :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

const recommendationRoutes = require('./routes/recommendationRoute');
app.use('/api/recommendations', recommendationRoutes);

// SIGTERM Handling
process.on('SIGTERM', async () => {
  console.log('❌ Received SIGTERM. Performing graceful shutdown...');
  await mongoose.connection.close();
  server.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Socket.IO available at ws://localhost:${PORT}/socket.io/`);
});