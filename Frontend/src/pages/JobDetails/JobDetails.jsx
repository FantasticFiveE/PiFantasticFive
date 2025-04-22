import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaBriefcase,
  FaTools,
  FaLanguage,
  FaBuilding,
  FaClock,
  FaChevronRight,
  FaBookmark,
  FaShare,
  FaPrint,
  FaRegClock,
  FaCode,
  FaGraduationCap
} from "react-icons/fa";
import "./JobDetails.css";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [solutionType, setSolutionType] = useState(1); // 1 for URL solution, 2 for File solution
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // Fetch the job details
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
    window.scrollTo(0, 0);
  }, [id]);

  // Fetch the user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/users/${userId}`);
        setUserProfile(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch user profile", err);
      }
    };

    if (role === "CANDIDATE") {
      fetchUserProfile();
    }
  }, [role, userId]);

  // Format date function
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // SOLUTION 1: When resume is stored as a URL
  const handleApplySolution1 = async () => {
    if (!userProfile?.profile?.resume) {
      return alert("❌ No resume found in your profile.");
    }

    try {
      // First, fetch the resume file if it's stored as a URL
      const resumeResponse = await axios.get(userProfile.profile.resume, {
        responseType: 'blob'
      });
      
      const resumeFile = new File([resumeResponse.data], 'resume.pdf', {
        type: resumeResponse.headers['content-type']
      });

      const formData = new FormData();
      formData.append('cv', resumeFile);
      formData.append('jobId', job._id);
      formData.append('enterpriseId', job.entrepriseId?._id || job.entrepriseId);
      formData.append('candidateId', userId);
      formData.append('fullName', userProfile.name);
      formData.append('email', userProfile.email);
      formData.append('phone', userProfile.profile?.phone || '');

      await axios.post(
        "http://localhost:3001/Frontend/apply-job",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      alert("🎉 Application submitted successfully!");
      navigate(`/quiz/${job._id}`);
    } catch (err) {
      console.error("❌ Error submitting application:", err);
      alert(`Failed to submit application: ${err.response?.data?.message || err.message}`);
    }
  };

  // SOLUTION 2: When resume is already a File object
  const handleApplySolution2 = async () => {
    if (!userProfile?.profile?.resume) {
      return alert("❌ No resume found in your profile.");
    }

    // Check if resume is a File object
    if (!(userProfile.profile.resume instanceof File)) {
      return alert("❌ Resume format is not supported. Please upload a new resume.");
    }

    const formData = new FormData();
    formData.append('cv', userProfile.profile.resume);
    formData.append('jobId', job._id);
    formData.append('enterpriseId', job.entrepriseId?._id || job.entrepriseId);
    formData.append('candidateId', userId);
    formData.append('fullName', userProfile.name);
    formData.append('email', userProfile.email);
    formData.append('phone', userProfile.profile?.phone || '');

    try {
      await axios.post(
        "http://localhost:3001/Frontend/apply-job",
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      alert("🎉 Application submitted successfully!");
      navigate(`/quiz/${job._id}`);
    } catch (err) {
      console.error("❌ Error submitting application:", err);
      alert(`Failed to submit application: ${err.response?.data?.message || err.message}`);
    }
  };

  // Main apply handler that chooses the right solution
  const handleApply = () => {
    if (solutionType === 1) {
      handleApplySolution1();
    } else {
      handleApplySolution2();
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading job details...</div>
      </div>
    );
  }

  if (!job) return <div className="loading">Job not found</div>;

  return (
    <div>
      <Navbar />
      <div className="job-details-container">
        <div className="job-card-expanded">
          <div className="job-header-wrapper">
            <div className="company-badge"><FaBuilding className="icon" /></div>
            <h2 className="job-title-centered">{job.title}</h2>
            <div className="company-info"><FaBuilding /> {job.company || "Company Name"}</div>
            <div className="job-stats">
              <div className="stat-item"><FaRegClock className="icon" /><span>Posted {formatDate(job.createdAt)}</span></div>
            </div>
          </div>

          <div className="job-meta">
            <div className="meta-item"><FaMapMarkerAlt className="icon" /><div className="label">Location</div><div className="value">{job.location}</div></div>
            <div className="meta-item"><FaMoneyBillWave className="icon" /><div className="label">Salary</div><div className="value">{job.salary} €</div></div>
            <div className="meta-item"><FaClock className="icon" /><div className="label">Job Type</div><div className="value">{job.employmentType || "Full Time"}</div></div>
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
                        <span key={index} className="tag"><FaCode className="icon" /> {skill}</span>
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
                        <span key={index} className="tag"><FaGraduationCap className="icon" /> {language}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="actions-bar">
              <button className="action-btn"><FaBookmark /> Save</button>
              <button className="action-btn"><FaShare /> Share</button>
              <button className="action-btn"><FaPrint /> Print</button>
            </div>

            {role === "CANDIDATE" && (
              <div className="apply-section">
                <div className="solution-toggle">
                  <button 
                    className={`toggle-btn ${solutionType === 1 ? 'active' : ''}`}
                    onClick={() => setSolutionType(1)}
                  >
                   
                  </button>
                  <button 
                    className={`toggle-btn ${solutionType === 2 ? 'active' : ''}`}
                    onClick={() => setSolutionType(2)}
                  >
                  
                  </button>
                </div>
                
                <p>Ready to take the next step in your career? Submit your application now and join our team!</p>
                <button className="apply-btn" onClick={handleApply}>
                  Apply Now <FaChevronRight className="apply-btn-icon" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JobDetails;