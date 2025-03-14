const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['ADMIN', 'ENTERPRISE', 'CANDIDATE'] },
    
    password: {
        type: String,
        required: function () {
            return !this.googleId; // Only require password if it's not a Google user
        }
    },
    
    googleId: { type: String }, // For Google authentication
    
    isActive: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now },
    lastLogin: { type: Date },

    permissions: {
        canManageUsers: { type: Boolean, default: false },
        canControlPermissions: { type: Boolean, default: false },
        canOverseeSystem: { type: Boolean, default: false },
    },

    verificationStatus: {
        status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
        updatedDate: { type: Date },
        emailVerified: { type: Boolean, default: false },
        reason: { type: String },
    },

    profile: {
        resume: { type: String },
        skills: [{ type: String }],
        phone: { type: String },
        languages: [{ type: String }],
        availability: { type: String, enum: ["Full-time", "Part-time", "Contract", "Freelance"] },
        experience: [{ 
            title: { type: String },
            company: { type: String },
            duration: { type: String },
            description: { type: String },
        }],
    },
    


    picture: { type: String },

    verificationCode: { type: Number },

    // Password Reset fields
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // Enterprise Information (Only for 'ENTERPRISE' role)
    enterprise: {
        name: { type: String },
        industry: { type: String },
        location: { type: String },
        website: { type: String },
        description: { type: String },
        employeeCount: { type: Number },
    },

    // Jobs and Applications (For 'ENTERPRISE' role)
    jobsPosted: [{
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
        title: { type: String },
        status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
        createdDate: { type: Date, default: Date.now },
    }],

    applications: [{
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
        enterpriseId: { type: Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
        dateSubmitted: { type: Date, default: Date.now },
        notes: { type: String },
    }],

    interviews: [{
        jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
        enterpriseId: { type: Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date },
        status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
        meeting: {
            type: { type: String, enum: ['In-person', 'Virtual', 'TBD'] },
            link: { type: String },
            details: { type: String },
        },
        feedback: {
            rating: { type: Number, min: 1, max: 5 }, // Ensures rating is between 1 and 5
            comments: { type: String },
        },
    }]
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
