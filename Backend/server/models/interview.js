const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enterprise: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  scheduledTime: { type: Date, required: true },
  score: { type: Number },
  status: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);
