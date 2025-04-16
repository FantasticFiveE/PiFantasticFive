import React, { useEffect, useState } from "react";
import axios from "axios";

function AllQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null); // Quiz sélectionné pour afficher les détails
  const [showDetails, setShowDetails] = useState(false); // Contrôle l'affichage des détails

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get("http://localhost:3001/quiz/all-quizzes");
        if (!Array.isArray(response.data)) {
          throw new Error("Unexpected data format from the server.");
        }
        setQuizzes(response.data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Error fetching quizzes:", err.message);
        setError(err.message || "Failed to fetch quizzes.");
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const handleViewDetails = (quiz) => {
    setSelectedQuiz(quiz);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedQuiz(null);
  };

  if (loading) {
    return <div>Loading quizzes...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="border p-4 rounded shadow-sm">
      <h4 className="mb-3">All Quizzes</h4>
      {quizzes.length === 0 ? (
        <p>No quizzes found.</p>
      ) : (
        <ul className="list-group">
          {quizzes.map((quiz, index) => (
            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>Quiz ID:</strong> {quiz._id}
                <p className="text-muted small">
                  Job Title: {quiz.jobTitle || "No Job Title"}
                </p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleViewDetails(quiz)}
              >
                View Details
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Modal pour afficher les détails du quiz */}
      {showDetails && selectedQuiz && (
        <div
          className="modal show"
          style={{ display: "block", backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Quiz Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseDetails}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  <strong>Job Title:</strong> {selectedQuiz.jobTitle || "No Job Title"}
                </p>
                <p>
                  <strong>Questions:</strong>{" "}
                  {selectedQuiz.questions.length > 0 ? (
                    <ul>
                      {selectedQuiz.questions.map((question, qIndex) => (
                        <li key={qIndex}>
                          <strong>{question.question}</strong>
                          <ul>
                            {question.options.map((option, oIndex) => (
                              <li key={oIndex}>
                                {option}{" "}
                                {oIndex === question.correctAnswer && (
                                  <span className="badge bg-success">Correct Answer</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No questions available."
                  )}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseDetails}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllQuizzes;