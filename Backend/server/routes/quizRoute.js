const express = require("express");
const router = express.Router();
const QuizModel = require("../models/Quiz");

// Route pour récupérer tous les quizzes
router.get("/all-quizzes", async (req, res) => {
  try {
    const quizzes = await QuizModel.find({})
      .populate("jobPostId", "title") // Peuplez le titre du job si nécessaire
      .lean();

    // Formattez la réponse pour inclure uniquement les champs nécessaires
    const formattedQuizzes = quizzes.map((quiz) => ({
      _id: quiz._id,
      jobPostId: quiz.jobPostId?._id || "No Job Post ID",
      jobTitle: quiz.jobPostId?.title || "No Job Title",
      questions: quiz.questions.map((question) => ({
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
      })),
    }));

    res.status(200).json(formattedQuizzes);
  } catch (err) {
    console.error("❌ Error fetching quizzes:", err.message);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;