const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
  enterpriseId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  appliedAt: { type: Date, default: Date.now },
  cv: { type: String }, // si tu l’as
  quizScore: { type: Number }, // ✅ Ajoute cette ligne
});


module.exports = mongoose.model("Application", applicationSchema);
