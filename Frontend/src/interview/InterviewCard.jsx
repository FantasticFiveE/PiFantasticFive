import React from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';

const InterviewCard = ({ interview }) => {
  const getStatusBadge = () => {
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
  };

  return (
    <div className="card interview-card h-100">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div>
            <h5 className="card-title">{interview.jobId?.title || 'Interview'}</h5>
            <h6 className="card-subtitle mb-2 text-muted">
              {interview.enterpriseId?.name || 'Company'}
            </h6>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="mb-3">
          <div className="d-flex align-items-center mb-2">
            <i className="bi bi-calendar me-2"></i>
            <span>{moment(interview.date).format('MMMM Do YYYY, h:mm a')}</span>
          </div>
          <div className="d-flex align-items-center">
            <i className="bi bi-geo-alt me-2"></i>
            <span>
              {interview.meeting?.type === 'Virtual' ? 
                'Virtual Meeting' : 
                interview.meeting?.link}
            </span>
          </div>
        </div>

        <div className="d-grid gap-2">
          {interview.status === 'Scheduled' && (
            <Link 
              to={`/interview/${interview._id}`}
              className="btn btn-primary"
            >
              Join Interview
            </Link>
          )}
          <Link 
            to={`/interview-details/${interview._id}`}
            className="btn btn-outline-secondary"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;