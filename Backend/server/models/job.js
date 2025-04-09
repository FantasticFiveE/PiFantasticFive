const mongoose = require('mongoose');
const { Schema } = mongoose;

<<<<<<< Updated upstream
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

// ✅ Check if already compiled before defining again
const JobModel = mongoose.models.Job || mongoose.model('Job', JobSchema);

module.exports = JobModel;
=======
const JobSchema = new mongoose.Schema({
    title: String,
    description: String,
    location: String,
    salary: String,
    enterpriseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.models.Job || mongoose.model("Job", JobSchema);
>>>>>>> Stashed changes
