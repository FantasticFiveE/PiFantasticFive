const mongoose = require('mongoose');
const { Schema } = mongoose;

// ✅ Subschemas d'abord

const ExperienceSchema = new Schema({
  title: { type: String },
  company: { type: String },
  duration: { type: String },
  description: { type: String },
}, { _id: false });

const ProfileSchema = new Schema({
  resume: { type: String, default: "" },
  skills: [{ type: String }],
  phone: { type: String, default: "" },
  languages: [{ type: String }],
  availability: { type: String, enum: ["Full-time", "Part-time", "Contract", "Freelance"], default: "Full-time" },
  experience: [ExperienceSchema],
}, { _id: false });

const MeetingSchema = new Schema({
  type: { type: String, enum: ['In-person', 'Virtual', 'TBD'] },
  link: { type: String },
  details: { type: String },
}, { _id: false });

const FeedbackSchema = new Schema({
  rating: { type: Number, min: 1, max: 5 },
  comments: { type: String },
}, { _id: false });

const InterviewSchema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  enterpriseId: { type: Schema.Types.ObjectId, ref: 'User' },
  candidateId: { type: Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
  meeting: MeetingSchema,
  feedback: FeedbackSchema,
  callStartedAt: { type: Date },
  callEndedAt: { type: Date },
  callDuration: { type: Number },
  callStatus: { type: String, enum: ['initiated', 'ongoing', 'completed', 'failed'], default: 'initiated' },
  callParticipants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    joinTime: { type: Date },
    leaveTime: { type: Date }
  }],
  recordingUrl: { type: String }
}, { _id: false });

const ApplicationSchema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  enterpriseId: { type: Schema.Types.ObjectId, ref: 'User' },
  experience: { type: String },
  position: { type: String },
  domain: { type: String },
  salary: { type: String },
  employmentTypes: [{ type: String }],
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  dateSubmitted: { type: Date, default: Date.now },
  notes: { type: String }
}, { _id: false });

const JobPostedSchema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
  title: { type: String },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
  createdDate: { type: Date, default: Date.now },
}, { _id: false });

const VerificationSchema = new Schema({
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  updatedDate: { type: Date },
  emailVerified: { type: Boolean, default: false },
  reason: { type: String },
}, { _id: false });

const PermissionsSchema = new Schema({
  canManageUsers: { type: Boolean, default: false },
  canControlPermissions: { type: Boolean, default: false },
  canOverseeSystem: { type: Boolean, default: false },
}, { _id: false });

const EnterpriseSchema = new Schema({
  name: { type: String },
  industry: { type: String },
  location: { type: String },
  website: { type: String },
  description: { type: String },
  employeeCount: { type: Number },
}, { _id: false });

// ✅ Job Schema
const JobSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  salary: { type: Number },
  languages: [{ type: String }],
  skills: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  entrepriseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const JobModel = mongoose.models.Job || mongoose.model("Job", JobSchema);

// ✅ User Schema
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, required: true, enum: ['ADMIN', 'ENTERPRISE', 'CANDIDATE'] },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    }
  },
  googleId: { type: String },
  isActive: { type: Boolean, default: true },
  createdDate: { type: Date, default: Date.now },
  lastLogin: { type: Date },
  permissions: PermissionsSchema,
  verificationStatus: VerificationSchema,
  profile: ProfileSchema, // ✅ OK maintenant car défini au-dessus
  picture: { type: String },
  verificationCode: { type: Number },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  enterprise: EnterpriseSchema,
  jobsPosted: { type: [JobPostedSchema], select: false },
  applications: { type: [ApplicationSchema], select: false },
  interviews: { type: [InterviewSchema], select: false },
  notifications: [{
    type: {
      type: String,
      enum: ['APPLICATION_RECEIVED', 'MESSAGE', 'SYSTEM', 'INTERVIEW'],
      default: 'APPLICATION_RECEIVED'
    },
    message: String,
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    seen: { type: Boolean, default: false },
    date: { type: Date, default: Date.now }
  }]
});

// ✅ Export
module.exports = {
  UserModel: mongoose.models.User || mongoose.model('User', UserSchema),
  JobModel,
  ApplicationModel: require("./Application")
};
