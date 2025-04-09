import React, { useContext } from 'react';
import { useInterview } from '../context/InterviewContext';
import InterviewCard from './InterviewCard';
import { Link } from 'react-router-dom';
import './Interviews.css';

const InterviewsPage = () => {
  const { interviews, loading, error } = useInterview();

  if (loading) return <div className="container py-5 text-center">Loading interviews...</div>;
  if (error) return <div className="container py-5 alert alert-danger">{error}</div>;

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>My Interviews</h1>
        <Link to="/profile" className="btn btn-outline-primary">
          Back to Profile
        </Link>
      </div>

      <div className="row">
        {interviews.length > 0 ? (
          interviews.map(interview => (
            <div className="col-md-6 col-lg-4 mb-4" key={interview._id}>
              <InterviewCard interview={interview} />
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="card shadow">
              <div className="card-body text-center py-5">
                <h4>No interviews scheduled yet</h4>
                <p className="text-muted">
                  When you have upcoming interviews, they'll appear here
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewsPage;