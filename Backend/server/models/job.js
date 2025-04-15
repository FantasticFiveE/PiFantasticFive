const mongoose = require('mongoose');
const { Schema } = mongoose;

const JobSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  location: { type: String },
  salary: { type: Number },
  languages: [{ type: String }],
  skills: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  enterpriseId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

// ✅ Check if already compiled before defining again
const JobModel = mongoose.models.Job || mongoose.model('Job', JobSchema);

module.exports = JobModel;