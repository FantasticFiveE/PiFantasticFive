const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  jobPostId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" }, // Référence au modèle Job
  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: Number,
    },
  ],
});

module.exports = mongoose.model("Quiz", quizSchema);