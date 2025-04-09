import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const QuizPassNotification = () => {
  const { responseId, quizId, jobId, candidateId, score } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const notifyEnterprise = async () => {
      try {
        await axios.post('http://localhost:3001/api/quiz/completed', {
          responseId,
          quizId,
          jobId,
          candidateId,
          score: parseFloat(score),
          passed: true
        });
        
        // Redirect to dashboard with success message
        navigate('/dashboard?message=EnterpriseNotified');
      } catch (error) {
        console.error('Error notifying enterprise:', error);
        navigate('/dashboard?error=NotificationFailed');
      }
    };

    notifyEnterprise();
  }, [responseId, quizId, jobId, candidateId, score, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 max-w-md w-full bg-white rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-green-600 mb-4">Quiz Passed!</h2>
        <p className="text-gray-700 mb-4">
          Congratulations! You scored {score} on the quiz.
        </p>
        <p className="text-gray-700">
          The enterprise has been notified and may contact you to schedule an interview.
        </p>
        <div className="mt-6 animate-spin">
          <svg className="w-8 h-8 text-blue-500 mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default QuizPassNotification;