import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "./CandidateProfile.css";

const CandidateProfile = () => {
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/Frontend/getUser/${id}`);
        setCandidate(res.data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to fetch candidate profile:", err);
        setError("Failed to load candidate profile. Please try again later.");
        setLoading(false);
      }
    };
    
    fetchCandidate();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (!candidate) {
    return <div className="error-message">No candidate data found</div>;
  }

  return (
    <div className="candidate-profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          {candidate.name?.charAt(0) || "C"}
        </div>
        
        <div className="profile-title">
          <h1>{candidate.name || "Candidate"}</h1>
          <p className="headline">{candidate.profile?.headline || "Professional Profile"}</p>
        </div>
      </div>

      <div className="profile-card contact-info">
        <h2>Contact Information</h2>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{candidate.email}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Phone</span>
            <span className="info-value">{candidate.profile?.phone || "Not provided"}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Location</span>
            <span className="info-value">{candidate.profile?.location || "Not provided"}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Availability</span>
            <span className="info-value">{candidate.profile?.availability || "Not specified"}</span>
          </div>
        </div>
      </div>

      <div className="profile-card">
        <h2>Skills & Expertise</h2>
        <div className="skills-container">
          {candidate.profile?.skills?.length > 0 ? (
            candidate.profile.skills.map((skill, index) => (
              <span key={index} className="skill-tag">{skill}</span>
            ))
          ) : (
            <p>No skills listed</p>
          )}
        </div>

        <h3>Languages</h3>
        <div className="skills-container">
          {candidate.profile?.languages?.length > 0 ? (
            candidate.profile.languages.map((language, index) => (
              <span key={index} className="language-tag">{language}</span>
            ))
          ) : (
            <p>No languages listed</p>
          )}
        </div>
      </div>

      <div className="profile-card">
        <h2>Professional Experience</h2>
        {candidate.profile?.experience?.length > 0 ? (
          <div className="experience-timeline">
            {candidate.profile.experience.map((exp, index) => (
              <div key={index} className="experience-item">
                <div className="experience-header">
                  <h3>{exp.title}</h3>
                  <span className="company-name">{exp.company}</span>
                  <span className="duration">{exp.duration}</span>
                </div>
                <p className="experience-description">{exp.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No experience listed</p>
        )}
      </div>

      {candidate.profile?.education && (
        <div className="profile-card">
          <h2>Education</h2>
          {candidate.profile.education.length > 0 ? (
            <div className="education-container">
              {candidate.profile.education.map((edu, index) => (
                <div key={index} className="education-item">
                  <h3>{edu.degree}</h3>
                  <span className="institution">{edu.institution}</span>
                  <span className="duration">{edu.duration}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No education listed</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CandidateProfile;