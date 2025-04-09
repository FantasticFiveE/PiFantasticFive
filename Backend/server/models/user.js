const mongoose = require('mongoose');
const { Schema } = mongoose;

<<<<<<< Updated upstream
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

=======
>>>>>>> Stashed changes
// ✅ Subschemas
const ExperienceSchema = new Schema({
  title: { type: String },
  company: { type: String },
  duration: { type: String },
  description: { type: String },
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

const QuestionSchema = new Schema({
    questionId: { type: String, required: true },
    text: { type: String, required: true },
    type: { type: String, enum: ['multiple_choice', 'text', 'code'], required: true },
    options: [{ type: String }],
    correctAnswer: { type: Schema.Types.Mixed },
    points: { type: Number, required: true },
}, { _id: false });

const QuizSchema = new Schema({
    quizId: { type: String, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    title: { type: String, required: true },
    description: { type: String },
    questions: [QuestionSchema],
    passingScore: { type: Number, required: true },
    timeLimit: { type: Number },
    createdDate: { type: Date, default: Date.now },
}, { _id: false });

const AnswerSchema = new Schema({
    questionId: { type: String, required: true },
    answer: { type: Schema.Types.Mixed, required: true },
    isCorrect: { type: Boolean },
}, { _id: false });

const QuizResponseSchema = new Schema({
    responseId: { type: String, required: true },
    quizId: { type: String, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    enterpriseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    answers: [AnswerSchema],
    score: { type: Number, required: true },
    passed: { type: Boolean, required: true },
    submittedDate: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['pending', 'evaluated', 'passed', 'failed'],
        default: 'pending'
    },
}, { _id: false });

const InterviewSchema = new Schema({
<<<<<<< Updated upstream
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

const ProfileSchema = new Schema({
  resume: { type: String, default: "" },
  skills: [{ type: String }],
  phone: { type: String, default: "" },
  languages: [{ type: String }],
  availability: { type: String, enum: ["Full-time", "Part-time", "Contract", "Freelance"], default: "Full-time" },
  experience: [ExperienceSchema],
=======
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
    recordingUrl: { type: String },
    quizResponseId: { type: String },
    quizScore: { type: Number }
}, { _id: false });

const ApplicationSchema = new Schema({
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    enterpriseId: { type: Schema.Types.ObjectId, ref: 'User' },
    experience: { type: String },
    position: { type: String },
    domain: { type: String },
    salary: { type: String },
    employmentTypes: [{ type: String }],
    status: {
        type: String,
        enum: ['Pending', 'QuizPending', 'QuizCompleted', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    dateSubmitted: { type: Date, default: Date.now },
    notes: { type: String },
    quizResponseId: { type: String },
    quizScore: { type: Number }
}, { _id: false });

const JobPostedSchema = new Schema({
    jobId: { type: Schema.Types.ObjectId, ref: 'Job' },
    title: { type: String },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    createdDate: { type: Date, default: Date.now },
    requiresQuiz: { type: Boolean, default: false },
    quizId: { type: String }
}, { _id: false });

const ProfileSchema = new Schema({
    resume: { type: String, default: "" },
    skills: [{ type: String }],
    phone: { type: String, default: "" },
    languages: [{ type: String }],
    availability: {
        type: String,
        enum: ["Full-time", "Part-time", "Contract", "Freelance"],
        default: "Full-time"
    },
    experience: [ExperienceSchema],
>>>>>>> Stashed changes
}, { _id: false });

const VerificationSchema = new Schema({
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  updatedDate: { type: Date },
  emailVerified: { type: Boolean, default: false },
  reason: { type: String },
}, { _id: false });

const PermissionsSchema = new Schema({
<<<<<<< Updated upstream
  canManageUsers: { type: Boolean, default: false },
  canControlPermissions: { type: Boolean, default: false },
  canOverseeSystem: { type: Boolean, default: false },
=======
    canManageUsers: { type: Boolean, default: false },
    canControlPermissions: { type: Boolean, default: false },
    canOverseeSystem: { type: Boolean, default: false },
    canManageQuizzes: { type: Boolean, default: false },
>>>>>>> Stashed changes
}, { _id: false });

const EnterpriseSchema = new Schema({
  name: { type: String },
  industry: { type: String },
  location: { type: String },
  website: { type: String },
  description: { type: String },
  employeeCount: { type: Number },
}, { _id: false });

// ✅ User Schema
const UserSchema = new Schema({
<<<<<<< Updated upstream
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
  profile: ProfileSchema,
  picture: { type: String },
  verificationCode: { type: Number },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  enterprise: EnterpriseSchema,
  jobsPosted: { type: [JobPostedSchema], select: false },
  applications: { type: [ApplicationSchema], select: false },
  interviews: { type: [InterviewSchema], select: false }
});

// ✅ Export both models properly
module.exports = {
  UserModel: mongoose.models.User || mongoose.model('User', UserSchema),
  JobModel
};
=======
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: ['ADMIN', 'ENTERPRISE', 'CANDIDATE'] },
    password: {
        type: String,
        required: function() {
            return !this.googleId;
        },
    },
    googleId: { type: String },
    isActive: { type: Boolean, default: true },
    createdDate: { type: Date, default: Date.now },
    lastLogin: { type: Date },
    permissions: PermissionsSchema,
    verificationStatus: VerificationSchema,
    profile: ProfileSchema,
    picture: { type: String },
    verificationCode: { type: Number },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    enterprise: EnterpriseSchema,
    quizzes: {
        type: [QuizSchema],
        select: false,
        default: undefined
    },
    quizResponses: {
        type: [QuizResponseSchema],
        select: false,
        default: undefined
    },
    jobsPosted: {
        type: [JobPostedSchema],
        select: false,
        default: undefined
    },
    applications: {
        type: [ApplicationSchema],
        select: false,
        default: undefined
    },
    interviews: {
        type: [InterviewSchema],
        select: false
    }
});

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'verificationStatus.status': 1 });

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
const UserModel = mongoose.models.User || mongoose.model("User", UserSchema);


module.exports = { UserModel, JobModel };
>>>>>>> Stashed changes
