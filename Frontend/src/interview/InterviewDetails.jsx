import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import './InterviewDetails.css';

const InterviewDetails = () => {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/interviews/${id}`);
        setInterview(res.data);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id]);

  if (loading) return <div className="container py-5 text-center">Loading...</div>;
  if (error) return <div className="container py-5 alert alert-danger">{error}</div>;
  if (!interview) return <div className="container py-5">Interview not found</div>;

  return (
    <div className="container py-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h2>Interview Details</h2>
            <Link to="/interviews" className="btn btn-light">
              Back to List
            </Link>
          </div>
        </div>
        <div className="card-body">
          <div className="row mb-4">
            <div className="col-md-6">
              <h4>Job Information</h4>
              <p><strong>Position:</strong> {interview.jobId?.title || 'N/A'}</p>
              <p><strong>Company:</strong> {interview.enterpriseId?.name || 'N/A'}</p>
              <p><strong>Quiz Score:</strong> {interview.quizScore || 'N/A'}</p>
            </div>
            <div className="col-md-6">
              <h4>Interview Details</h4>
              <p><strong>Date:</strong> {moment(interview.date).format('LLLL')}</p>
              <p><strong>Type:</strong> {interview.meeting?.type || 'N/A'}</p>
              <p><strong>Status:</strong> {getStatusBadge()}</p>
            </div>
          </div>

          <div className="mb-4">
            <h4>Meeting Information</h4>
            <p><strong>Location:</strong> {interview.meeting?.link || 'N/A'}</p>
            <p><strong>Details:</strong> {interview.meeting?.details || 'No additional details provided.'}</p>
          </div>

          {interview.status === 'Scheduled' && (
            <div className="d-grid gap-2 d-md-flex justify-content-md-start">
              <Link 
                to={`/interview/${interview._id}`}
                className="btn btn-primary me-md-2"
              >
                Join Interview
              </Link>
              <button className="btn btn-outline-danger">
                Request Reschedule
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  function getStatusBadge() {
    switch (interview.status) {
      case 'Scheduled': 
        return <span className="badge bg-primary">Scheduled</span>;
      case 'Completed': 
        return <span className="badge bg-success">Completed</span>;
      case 'Cancelled': 
        return <span className="badge bg-danger">Cancelled</span>;
      default: 
        return <span className="badge bg-secondary">{interview.status}</span>;
    }
  }
};

export default InterviewDetails;