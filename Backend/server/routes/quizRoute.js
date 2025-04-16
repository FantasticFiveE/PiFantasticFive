const express = require("express");
const router = express.Router();
const QuizModel = require("../models/Quiz");

// GET /quiz/all-quizzes - Fetch all quizzes
router.get("/all-quizzes", async (req, res) => {
  try {
    const quizzes = await QuizModel.find({})
      .populate({
        path: "jobPostId",
        select: "title", // Only include title
        strictPopulate: false, // Avoid crash if jobPostId doesn't exist
      })
      .lean();

    const formattedQuizzes = quizzes.map((quiz) => ({
      _id: quiz._id,
      jobPostId: quiz.jobPostId?._id || null,
      jobTitle: quiz.jobPostId?.title || "No Job Title",
      questions: (quiz.questions || []).map((question) => ({
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
      })),
    }));

    res.status(200).json(formattedQuizzes);
  } catch (err) {
    console.error("❌ Error fetching quizzes:", err.message);
    res.status(500).json({ message: "Erreur serveur : " + err.message });
  }
});

module.exports = router;
