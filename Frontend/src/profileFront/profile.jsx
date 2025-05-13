import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Avatar } from "./avatar";
import { Skeleton } from "./skeleton";
import { FaCamera, FaCheckCircle, FaTimesCircle, FaUpload, FaFilePdf, FaCog, FaUser, FaEnvelope, FaPhone, FaGlobe, FaBriefcase } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import "./profile.css";

const Profile = () => {
  const id = localStorage.getItem("userId");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("infos");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState("");
  const [picture, setPicture] = useState(null);
  const [newPicture, setNewPicture] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [pictureStatus, setPictureStatus] = useState("");
  const [applications, setApplications] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:3001/Frontend/getUser/${id}`);
        const data = await res.json();
        setUser(data);
        setResumeUrl(data.profile?.resume || "");
        setPicture(data.picture || "/images/team-1.jpg");
        setLoading(false);
      } catch (err) {
        console.error("Error loading user:", err);
        setLoading(false);
      }
    };
  
    const fetchApplications = async () => {
      try {
        const res = await fetch(`http://localhost:3001/Frontend/applications-by-candidate/${id}`);
        const data = await res.json();
        setApplications(data);
      } catch (err) {
        console.error("❌ Erreur lors de la récupération des candidatures:", err);
      }
    };
  
    fetchUser();
  
    if (role === "CANDIDATE") {
      fetchApplications();
    }
  }, [id, role]);
  
  const handleEditProfile = () => navigate(`/edit-profile/${id}`);

  const handleCameraClick = () => fileInputRef.current.click();

  const handlePictureChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onloadend = () => setNewPicture(reader.result);
    reader.readAsDataURL(selectedFile);
    setFile(selectedFile);
  };

  const handlePictureConfirm = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("userId", id);
    formData.append("picture", file);

    try {
      const res = await fetch("http://localhost:3001/Frontend/upload-profile", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setPicture(data.pictureUrl);
      setNewPicture(null);
      setFile(null);
      setPictureStatus("✔️ Profile picture updated successfully!");
    } catch (err) {
      console.error("❌ Error uploading picture:", err);
      setPictureStatus("❌ Upload failed. Try again.");
    }
  };

  const handleDeleteApplication = async (applicationId) => {
    try {
      const res = await fetch(`http://localhost:3001/Frontend/delete-application/${applicationId}`, {
        method: "DELETE",
      });
  
      if (res.ok) {
        alert("✅ Candidature supprimée !");
        setApplications((prev) => prev.filter((app) => app._id !== applicationId));
      } else {
        console.error("❌ Échec de la suppression");
      }
    } catch (error) {
      console.error("❌ Erreur lors de la suppression :", error);
    }
  };
  
  const handlePictureCancel = () => {
    setNewPicture(null);
    setFile(null);
    setPictureStatus("");
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
  };

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file.");
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("userId", id);
  
    try {
      const res = await fetch("http://localhost:3001/Frontend/upload-resume", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResumeUrl(data.resumeUrl);
      setUploadStatus("CV uploaded successfully!");
      setFile(null);
  
      const resUser = await fetch(`http://localhost:3001/Frontend/getUser/${id}`);
      const updatedUser = await resUser.json();
      setUser(updatedUser);
    } catch (err) {
      setUploadStatus("Error uploading CV.");
      console.error(err);
    }
  };
  
  if (loading) return (
    <div className="text-center">
      <div className="loading-spinner">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  );
  
  if (!user) return <p className="text-center text-red-500">User not found.</p>;

  return (
    <>
      <Navbar />

      <div className="profile-container">
        <div className="profile-content">
          <div className="profile-sidebar">
            <div className="image-upload-container">
              {picture && !newPicture ? (
                <div className="enterprise-image-wrapper">
                  <img
                    src={`http://localhost:3001${picture}`}
                    alt={user.name}
                    className="enterprise-image"
                  />
                  <div className="image-overlay" onClick={handleCameraClick}>
                    <FaCamera className="camera-icon" />
                  </div>
                </div>
              ) : newPicture ? (
                <div className="enterprise-image-wrapper">
                  <img src={newPicture} alt="Preview" className="enterprise-image" />
                  <div className="image-actions">
                    <button className="btn btn-success btn-sm" onClick={handlePictureConfirm}>
                      <FaCheckCircle />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={handlePictureCancel}>
                      <FaTimesCircle />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="image-placeholder editable" onClick={handleCameraClick}>
                  <FaCamera className="camera-icon" />
                  <span>Add image</span>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handlePictureChange}
              />
            </div>

            <h2 className="name">{user.name}</h2>
            <p className="role">{user.role}</p>

            <button className="edit-profile-button" onClick={handleEditProfile}>
              <FaCog /> Edit Profile
            </button>
          </div>

          <div className="profile-details">
            <div className="tab-buttons">
              <button
                className={activeTab === "infos" ? "tab active" : "tab"}
                onClick={() => setActiveTab("infos")}
              >
                <FaUser /> Infos
              </button>

              <button
                className={activeTab === "experience" ? "tab active" : "tab"}
                onClick={() => setActiveTab("experience")}
              >
                <FaBriefcase /> Experience
              </button>

              <button
                className={activeTab === "cv" ? "tab active" : "tab"}
                onClick={() => setActiveTab("cv")}
              >
                <FaFilePdf /> CV
              </button>

              {user.role === "CANDIDATE" && (
                <button
                  className={activeTab === "candidatures" ? "tab active" : "tab"}
                  onClick={() => setActiveTab("candidatures")}
                >
                  <FaEnvelope /> Applications
                </button>
              )}
            </div>

            <div className="profile-card">
              {activeTab === "infos" && (
                <>
                  {user.role === "ENTERPRISE" && user.enterprise && (
                    <>
                      <div className="profile-detail">
                        <FaBuilding className="detail-icon" />
                        <div className="detail-content">
                          <label>Company</label>
                          <p>{user.enterprise.name}</p>
                        </div>
                      </div>

                      <div className="profile-detail">
                        <FaLocationDot className="detail-icon" />
                        <div className="detail-content">
                          <label>Location</label>
                          <p>{user.enterprise.location}</p>
                        </div>
                      </div>

                      <div className="profile-detail">
                        <FaIndustry className="detail-icon" />
                        <div className="detail-content">
                          <label>Industry</label>
                          <p>{user.enterprise.industry}</p>
                        </div>
                      </div>

                      <div className="profile-detail">
                        <FaGlobe className="detail-icon" />
                        <div className="detail-content">
                          <label>Website</label>
                          <p>
                            <a href={user.enterprise.website} target="_blank" rel="noreferrer">
                              {user.enterprise.website}
                            </a>
                          </p>
                        </div>
                      </div>

                      <div className="profile-detail">
                        <FaEnvelope className="detail-icon" />
                        <div className="detail-content">
                          <label>Email</label>
                          <p>{user.email}</p>
                        </div>
                      </div>
                    </>
                  )}

                  {user.role === "CANDIDATE" && user.profile && (
                    <>
                      <div className="profile-detail">
                        <FaEnvelope className="detail-icon" />
                        <div className="detail-content">
                          <label>Email</label>
                          <p>{user.email}</p>
                        </div>
                      </div>

                      <div className="profile-detail">
                        <FaPhone className="detail-icon" />
                        <div className="detail-content">
                          <label>Phone</label>
                          <p>{user.profile.phone || "Not provided"}</p>
                        </div>
                      </div>

                      <div className="profile-detail">
                        <div className="detail-icon">
                          <FaBriefcase />
                        </div>
                        <div className="detail-content">
                          <label>Skills</label>
                          <div className="skills">
                            {user.profile.skills?.length > 0 ? (
                              user.profile.skills.map((skill, index) => (
                                <span key={index} className="skill-badge">{skill}</span>
                              ))
                            ) : <p>Not provided</p>}
                          </div>
                        </div>
                      </div>

                      <div className="profile-detail">
                        <div className="detail-icon">
                          <FaGlobe />
                        </div>
                        <div className="detail-content">
                          <label>Languages</label>
                          <div className="languages">
                            {user.profile.languages?.length > 0 ? (
                              user.profile.languages.map((lang, index) => (
                                <span key={index} className="language-badge">{lang}</span>
                              ))
                            ) : <p>Not provided</p>}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {activeTab === "experience" && user.profile?.experience?.length > 0 && (
                <div className="profile-detail description-detail">
                  <div className="detail-icon">
                    <FaBriefcase />
                  </div>
                  <div className="detail-content">
                    <label>Experience</label>
                    <ul className="experience-list">
                      {user.profile.experience.map((exp, idx) => (
                        <li key={idx}>
                          <strong>{exp.title}</strong> at {exp.company} – {exp.duration}<br />
                          <em>{exp.description}</em>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "cv" && (
                <div className="profile-detail">
                  <div className="detail-icon">
                    <FaFilePdf />
                  </div>
                  <div className="detail-content">
                    <label>Resume</label>
                    {resumeUrl ? (
                      <p className="cv-link">
                        <a href={`http://localhost:3001${resumeUrl}`} target="_blank" rel="noopener noreferrer">
                          <FaFilePdf /> View Resume
                        </a>
                      </p>
                    ) : (
                      <>
                        <label className="upload-button">
                          <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" hidden />
                          <FaUpload /> Add Resume
                        </label>
                        {file && (
                          <button className="upload-btn" onClick={handleFileUpload}>
                            <FaUpload /> Upload
                          </button>
                        )}
                      </>
                    )}
                    {uploadStatus && <p className={uploadStatus.includes("success") ? "text-success" : "text-danger"}>{uploadStatus}</p>}
                  </div>
                </div>
              )}

              {activeTab === "candidatures" && (
                <div className="profile-detail">
                  <div className="detail-icon">
                    <FaEnvelope />
                  </div>
                  <div className="detail-content">
                    <label>My Applications</label>
                    {applications.length > 0 ? (
                      applications.map((app, i) => (
                        <div key={i} className="application-box">
                          <p><strong>Position:</strong> {app.jobId?.title}</p>
                          <p><strong>Email:</strong> {app.email}</p>
                          <p><strong>Phone:</strong> {app.phone}</p>
                          <p><strong>Date:</strong> {new Date(app.appliedAt).toLocaleDateString()}</p>
                          <p><strong>Quiz Score:</strong> {app.quizScore !== undefined ? `${app.quizScore} / 10` : "Not taken"}</p>

                          {app.cv && (
                            <p>
                              <a href={`http://localhost:3001${app.cv}`} target="_blank" rel="noopener noreferrer" className="cv-link">
                                <FaFilePdf /> View CV
                              </a>
                            </p>
                          )}

                          <button
                            className="btn btn-danger"
                            onClick={() => handleDeleteApplication(app._id)}
                          >
                            Delete Application
                          </button>
                          <hr />
                        </div>
                      ))
                    ) : (
                      <p>No applications submitted yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Profile;