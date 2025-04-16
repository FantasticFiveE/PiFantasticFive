const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
  questions: [
    {
      question: String,
      options: [String],
      correctAnswer: Number,
    },
  ],
});

module.exports = mongoose.model("Quiz", quizSchema);
