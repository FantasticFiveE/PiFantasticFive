import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  const navigate = useNavigate();


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

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleApply = async () => {
    if (!formData.name || !formData.email || !formData.phone || !selectedFile) {
      return alert("Veuillez remplir tous les champs et ajouter un CV.");
    }
  
    const formDataToSend = new FormData();
    formDataToSend.append("jobId", job._id);
    formDataToSend.append("enterpriseId", job.entrepriseId?._id || job.entrepriseId);
    formDataToSend.append("candidateId", userId);
    formDataToSend.append("fullName", formData.name);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone", formData.phone);
    formDataToSend.append("cv", selectedFile);
  
    try {
      await axios.post("http://localhost:3001/Frontend/apply-job", formDataToSend);
      alert("🎉 Candidature envoyée avec succès !");
      navigate(`/quiz/${job._id}`); // Redirection vers le quiz !
    } catch (err) {
      console.error("❌ Erreur lors de l'envoi :", err);
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
                <p>Ready to take the next step in your career? Submit your application now and join our team!</p>
                <button className="apply-btn" onClick={() => setShowForm(!showForm)}>
                  Apply Now <FaChevronRight className="apply-btn-icon" />
                </button>

                {showForm && (
                  <div className="application-form">
                    <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleInputChange} />
                    <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleInputChange} />
                    <input type="text" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleInputChange} />
                    <input 
  type="file" 
  accept=".pdf,.doc,.docx"
  onChange={(e) => setSelectedFile(e.target.files[0])} 
  className="form-control"
/>
                    <button className="submit-btn" onClick={handleApply}>Submit Application</button>
                  </div>
                )}

{successMessage && (
  <div className="alert alert-success mt-3">
    {successMessage}
  </div>
)}

                {successMessage && <p className="success-message">{successMessage}</p>}
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
