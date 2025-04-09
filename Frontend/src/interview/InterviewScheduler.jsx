import React, { useState, useContext } from 'react';
import { useInterview } from '../../context/InterviewContext';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const InterviewScheduler = ({ jobId, candidateId, quizResponseId, quizScore }) => {
  const { scheduleInterview } = useInterview();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    date: new Date(),
    meetingType: 'Virtual',
    meetingDetails: '',
    locationDetails: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await scheduleInterview({
        jobId,
        candidateId,
        quizResponseId,
        quizScore,
        ...formData
      });
      navigate('/dashboard/calendar');
    } catch (error) {
      console.error('Error scheduling interview:', error);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h3>Schedule Interview</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Date & Time</label>
              <DatePicker
                selected={formData.date}
                onChange={(date) => setFormData({...formData, date})}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                className="form-control"
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Meeting Type</label>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="meetingType"
                  id="virtual"
                  value="Virtual"
                  checked={formData.meetingType === 'Virtual'}
                  onChange={() => setFormData({...formData, meetingType: 'Virtual'})}
                />
                <label className="form-check-label" htmlFor="virtual">
                  Virtual
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="meetingType"
                  id="inPerson"
                  value="In-person"
                  checked={formData.meetingType === 'In-person'}
                  onChange={() => setFormData({...formData, meetingType: 'In-person'})}
                />
                <label className="form-check-label" htmlFor="inPerson">
                  In-person
                </label>
              </div>
            </div>
            
            {formData.meetingType === 'In-person' && (
              <div className="mb-3">
                <label htmlFor="location" className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  id="location"
                  value={formData.locationDetails}
                  onChange={(e) => setFormData({...formData, locationDetails: e.target.value})}
                  required
                />
              </div>
            )}
            
            <div className="mb-3">
              <label htmlFor="details" className="form-label">Additional Details</label>
              <textarea
                className="form-control"
                id="details"
                rows="3"
                value={formData.meetingDetails}
                onChange={(e) => setFormData({...formData, meetingDetails: e.target.value})}
              ></textarea>
            </div>
            
            <button type="submit" className="btn btn-primary">
              Schedule Interview
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewScheduler;