import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./QuizPage.css";

const QuizPage = () => {
  const { jobId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const navigate = useNavigate();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/Frontend/quiz/${jobId}`);
        setQuestions(res.data.questions);
      } catch (err) {
        console.error("Erreur de chargement du quiz :", err);
      }
    };

    fetchQuiz();
  }, [jobId]);

  const handleAnswer = (qIndex, answerIndex) => {
    setAnswers({ ...answers, [qIndex]: answerIndex });
    setCurrentQuestionIndex(qIndex + 1);
  };

  const handleSubmit = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        correct++;
      }
    });

    setScore(correct);
    setSubmitted(true);

    try {
      const userId = localStorage.getItem("userId");
      await axios.put("http://localhost:3001/Frontend/update-quiz-score", {
        jobId,
        candidateId: userId,
        score: correct,
      });

      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      console.error("Erreur lors de l'envoi du score :", err);
    }
  };


  const answeredCount = Object.keys(answers).length;
const progressPercentage = Math.floor((answeredCount / questions.length) * 100);

return (
    <div className="quiz-container">
      <h2 className="quiz-title">📝 Quiz pour le poste</h2>
  
      {!submitted && (
        <>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progressPercentage}%` }}>
              {progressPercentage}%
            </div>
          </div>
          <p className="question-indicator">
            {Object.keys(answers).length} / {questions.length} questions répondues
          </p>
        </>
      )}
  
      {!submitted ? (
        <>
          {questions.map((q, idx) => (
            <div key={idx} className="question-block">
              <p><strong>{idx + 1}. {q.question}</strong></p>
              {q.options.map((opt, i) => (
                <div className="option" key={i}>
                  <input
                    type="radio"
                    name={`question-${idx}`}
                    checked={answers[idx] === i}
                    onChange={() => handleAnswer(idx, i)}
                  /> {opt}
                </div>
              ))}
            </div>
          ))}
          <button className="submit-btn" onClick={handleSubmit}>✅ Soumettre mes réponses</button>
        </>
      ) : (
        <div>
          <p className="success-message">✅ Vous avez obtenu {score} / 10</p>
          <p className="redirect-message">🙏 Merci pour vos réponses. Vous devez maintenant attendre un email de l'entreprise.</p>
          <p className="redirect-message">Redirection vers la page d'accueil...</p>
        </div>
      )}
    </div>
  );
  
  
};

export default QuizPage;
