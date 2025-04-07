import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaBriefcase,
  FaTools,
  FaLanguage,
  FaBuilding,
  FaEnvelope,
  FaClock,
  FaChevronRight,
  FaBookmark,
  FaShare,
  FaPrint,
  FaEye,
  FaUsers,
  FaCheckCircle,
  FaRegClock,
  FaCode,
  FaGraduationCap
} from "react-icons/fa";
import "./JobDetails.css";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/Frontend/jobs/${id}`);
        setJob(res.data);
        setLoading(false);
      } catch (err) {
        console.error("❌ Failed to fetch job details", err);
        setLoading(false);
      }
    };
    fetchJob();
    
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading job details...</div>
      </div>
    );
  }

  if (!job) return <div className="loading">Job not found</div>;

  // Format the date in a more readable way
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate days posted
  const daysPosted = () => {
    const posted = new Date(job.createdAt);
    const today = new Date();
    const difference = today - posted;
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days ago` : 'Today';
  };

  return (
    <div>
      <Navbar />
      <div className="job-details-container">
        <div className="job-card-expanded">
          <div className="job-header-wrapper">
            <div className="company-badge">
              <FaBuilding className="icon" />
            </div>
            <h2 className="job-title-centered">{job.title}</h2>
            <div className="company-info">
              <FaBuilding /> {job.company || "Company Name"}
            </div>
            
            <div className="job-stats">
            {/* 
              <div className="stat-item">
                <FaEye className="icon" />
                <span>320 views</span>
              </div>
              */}
              <div className="stat-item">
                <FaRegClock className="icon" />
                <span>Posted {formatDate(job.createdAt)}</span>
                
              </div>
              {/* 
              <div className="stat-item">
                <FaUsers className="icon" />
                <span>12 applicants</span>
              </div>
              */}
            </div>
          </div>

          <div className="job-meta">
            <div className="meta-item">
              <FaMapMarkerAlt className="icon" />
              <div className="label">Location</div>
              <div className="value">{job.location}</div>
            </div>
            <div className="meta-item">
              <FaMoneyBillWave className="icon" />
              <div className="label">Salary</div>
              <div className="value">{job.salary} €</div>
            </div>
            <div className="meta-item">
              <FaClock className="icon" />
              <div className="label">Job Type</div>
              <div className="value">{job.employmentType || "Full Time"}</div>
            </div>
          </div>

          <div className="job-content">
            <div className="job-info">
              <h3>Job Description</h3>
              <div className="job-info-item">
                <FaBriefcase className="info-icon" />
                <div className="info-content">
                  <strong>About This Role</strong>
                  <p>{job.description}</p>
                </div>
              </div>

              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="job-info-item">
                  <FaTools className="info-icon" />
                  <div className="info-content">
                    <strong>Required Skills</strong>
                    <div className="tag-container">
                      {job.skills.map((skill, index) => (
                        <span key={index} className="tag">
                          <FaCode className="icon" /> {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {Array.isArray(job.languages) && job.languages.length > 0 && (
                <div className="job-info-item">
                  <FaLanguage className="info-icon" />
                  <div className="info-content">
                    <strong>Language Requirements</strong>
                    <div className="tag-container">
                      {job.languages.map((language, index) => (
                        <span key={index} className="tag">
                          <FaGraduationCap className="icon" /> {language}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>

            <div className="actions-bar">
              <button className="action-btn">
                <FaBookmark /> Save
              </button>
              <button className="action-btn">
                <FaShare /> Share
              </button>
              <button className="action-btn">
                <FaPrint /> Print
              </button>
            </div>

            <div className="apply-section">
              <p>Ready to take the next step in your career? Submit your application now and join our team of talented professionals!</p>
              <button className="apply-btn">
                Apply Now 
                <FaChevronRight className="apply-btn-icon" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JobDetails;