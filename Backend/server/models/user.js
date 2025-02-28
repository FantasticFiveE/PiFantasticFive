const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        enum: ['ADMIN', 'ENTERPRISE', 'CANDIDATE']
    },
    password: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    permissions: {
        canManageUsers: {
            type: Boolean,
            default: false
        },
        canControlPermissions: {
            type: Boolean,
            default: false
        },
        canOverseeSystem: {
            type: Boolean,
            default: false
        },
    },
    verificationStatus: {
        status: {
            type: String,
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            default: 'PENDING'
        },
        updatedDate: {
            type: Date
        },
        emailVerified: { type: Boolean, default: false },
        reason: {
            type: String
        },
    },
    enterprise: {
        name: {
            type: String
        },
        industry: {
            type: String
        },
        location: {
            type: String
        },
        website: {
            type: String
        },
        description: {
            type: String
        },
        employeeCount: {
            type: Number
        },
    },
    jobsPosted: [{
        jobId: {
            type: Schema.Types.ObjectId,
            ref: 'Job'
        },
        title: {
            type: String
        },
        status: {
            type: String,
            enum: ['OPEN', 'CLOSED'],
            default: 'OPEN'
        },
        createdDate: {
            type: Date,
            default: Date.now
        },
    }],
    profile: {
        resume: {
            type: String
        },
        skills: [{
            type: String
        }],
        availability: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Freelance']
        },
        experience: [{
            title: {
                type: String
            },
            company: {
                type: String
            },
            duration: {
                type: String
            },
            description: {
                type: String
            },
        }],
    },
    applications: [{
        jobId: {
            type: Schema.Types.ObjectId,
            ref: 'Job'
        },
        enterpriseId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending'
        },
        dateSubmitted: {
            type: Date,
            default: Date.now
        },
        notes: {
            type: String
        },
    }],
    interviews: [{
        jobId: {
            type: Schema.Types.ObjectId,
            ref: 'Job'
        },
        enterpriseId: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        date: {
            type: Date
        },
        status: {
            type: String,
            enum: ['Scheduled', 'Completed', 'Cancelled'],
            default: 'Scheduled'
        },
        meeting: {
            type: {
                type: String,
                enum: ['In-person', 'Virtual', 'TBD']
            },
            link: {
                type: String
            },
            details: {
                type: String
            },
        },
        feedback: {
            rating: {
                type: Number,
                min: 1,
                max: 5 // ✅ Ensures rating is between 1 and 5
            },
            comments: {
                type: String
            },
        },
    }],
    picture: {
        type: String
    },
    // Ajout du champ verificationCode pour stocker le code de vérification
    verificationCode: {
        type: Number,
        required: false // Ce champ peut être optionnel pour l'inscription
    }
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
