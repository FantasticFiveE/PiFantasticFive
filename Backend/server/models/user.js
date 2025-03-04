const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String },
    password: { type: String },
    googleId: { type: String, sparse: true },
    role: { type: String, enum: ['ADMIN', 'ENTERPRISE', 'CANDIDATE'], default: 'CANDIDATE' },
    emailVerified: { type: Boolean, default: false },
    verificationStatus: {
        emailVerified: { type: Boolean, default: false },
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
        updatedDate: { type: Date },
        reason: { type: String }
    },
    createdDate: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    verificationCode: { type: String },
    picture: { type: String, default: "/images/default-profile.png" },
    resume: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    profile: {
        availability: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Freelance'], default: 'Full-time' },
        skills: { type: [String], default: [] },
        experience: [{
            title: String,
            company: String,
            duration: String,
            description: String
        }]
    },
    enterprise: {
        name: { type: String },
        industry: { type: String },
        location: { type: String },
        website: { type: String },
        description: { type: String },
        employeeCount: { type: Number }
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
