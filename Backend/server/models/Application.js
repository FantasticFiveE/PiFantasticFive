const mongoose = require('mongoose');
const { Schema } = mongoose;

const applicationSchema = new Schema({
  jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  enterpriseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  candidateId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  cv: { type: String },
  quizScore: { type: Number },
  quizCompleted: { type: Boolean, default: false },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Application || mongoose.model('Application', applicationSchema);