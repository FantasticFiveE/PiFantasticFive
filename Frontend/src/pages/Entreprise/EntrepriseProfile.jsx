import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import PublicLayout from "../../layouts/PublicLayout";
import "./EntrepriseProfile.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTrashCan, faBuilding, faIndustry, 
  faLocationDot, faGlobe, faFileLines, 
  faPeopleGroup, faEdit, faSave, faTimes, 
  faBriefcase, faCamera, faPlus, faMinus, 
  faPlusCircle, faCalendarAlt, faVideo 
} from "@fortawesome/free-solid-svg-icons";

const EntrepriseProfile = () => {
  const { id } = useParams();
  const [enterprise, setEnterprise] = useState(null);
  const [enterpriseJobs, setEnterpriseJobs] = useState([]);
  const [userPicture, setUserPicture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEnterprise, setEditedEnterprise] = useState({});
  const [showJobForm, setShowJobForm] = useState(false);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applicationCounts, setApplicationCounts] = useState({});
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [interviewDetails, setInterviewDetails] = useState({
    type: 'Virtual',
    link: '',
    date: '',
    time: '',
    notes: ''
  });
  const [scheduledInterviews, setScheduledInterviews] = useState([]);
  const [showQuizFormModal, setShowQuizFormModal] = useState(false);
  const [quizJobId, setQuizJobId] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([
    { question: "", options: ["", "", "", ""], correctAnswer: 0 },
  ]);
  const [jobQuizLengths, setJobQuizLengths] = useState({});

  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    languages: "",
    skills: "",
  });

  const fileInputRef = useRef(null);

  // Fetch scheduled interviews for the job
  const fetchInterviews = async (jobId) => {
    try {
      const res = await axios.get(`http://localhost:3001/api/interviews/job/${jobId}?enterpriseId=${id}`);
      setScheduledInterviews(res.data);
    } catch (err) {
      console.error("Error fetching interviews:", err);
    }
  };

  const fetchQuizLengths = async () => {
    try {
      const res = await axios.get('http://localhost:3001/Frontend/quiz-lengths');
      setJobQuizLengths(res.data);
    } catch (err) {
      console.error("Error fetching quiz lengths:", err);
    }
  };

  const openQuizFormModal = async (jobId) => {
    try {
      const res = await axios.get(`http://localhost:3001/quiz/job/${jobId}`);
      if (res.data && res.data.questions) {
        setQuizQuestions(res.data.questions);
      } else {
        setQuizQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
      }
      setQuizJobId(jobId);
      setShowQuizFormModal(true);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setQuizQuestions([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
      setQuizJobId(jobId);
      setShowQuizFormModal(true);
    }
  };

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const [jobsRes, countRes] = await Promise.all([
          axios.get(`http://localhost:3001/Frontend/jobs-by-entreprise/${userId}`),
          axios.get(`http://localhost:3001/Frontend/job-applications-count/${userId}`),
        ]);
        setJobs(jobsRes.data);
        setApplicationCounts(countRes.data);
        fetchQuizLengths();
      } catch (error) {
        console.error("❌ Failed to fetch jobs or counts", error);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const enterpriseId = localStorage.getItem("userId");
        const res = await axios.get(`http://localhost:3001/Frontend/applications/${enterpriseId}`);
        setApplications(res.data);
      } catch (err) {
        console.error("❌ Error fetching applications:", err);
      }
    };

    fetchApplications();
  }, []);

  useEffect(() => {
    const fetchEntreprise = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/Frontend/user/${id}`);
        setEnterprise(res.data.User.enterprise);
        setUserPicture(res.data.User.picture);
        setEditedEnterprise(res.data.User.enterprise);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching enterprise:", err);
      }
    };

    const fetchEnterpriseJobs = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/Frontend/jobs-by-entreprise/${id}`);
        setEnterpriseJobs(res.data);
      } catch (err) {
        console.error("Error fetching enterprise jobs:", err);
      }
    };

    fetchEntreprise();
    fetchEnterpriseJobs();
  }, [id]);

  // Call fetchInterviews when job is selected
  useEffect(() => {
    if (selectedJobId) {
      fetchInterviews(selectedJobId);
    }
  }, [selectedJobId]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setSelectedFile(file);
    }
  };

  const handleDeleteJob = async (jobId) => {
    const confirm = window.confirm("Are you sure you want to delete this job?");
    if (!confirm) return;

    try {
      await axios.delete(`http://localhost:3001/Frontend/delete-job/${jobId}`);
      setEnterpriseJobs((prev) => prev.filter((job) => job._id !== jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  };

const openApplicationModal = async (jobId) => {
  try {
    const res = await axios.get(`http://localhost:3001/Frontend/job-applications/${jobId}`);
    
    // Handle different response formats
    let applications = [];
    
    if (Array.isArray(res.data)) {
      applications = res.data;
    } else if (res.data && Array.isArray(res.data.applications)) {
      applications = res.data.applications;
    } else if (res.data && typeof res.data === 'object') {
      applications = [res.data];
    }
    
    // Get quiz length - use first application or fallback
    const quizLength = applications[0]?.quizLength || (jobQuizLengths[jobId] || 0);
    const passingScore = Math.ceil(quizLength / 2);
  
    // Get job details for ML prediction
    const jobRes = await axios.get(`http://localhost:3001/Frontend/job/${jobId}`);
    const job = jobRes.data;

    // Filter and enhance qualified candidates with ML predictions
    const qualifiedCandidates = await Promise.all(
      applications
        .filter(app => app.quizScore !== undefined && app.quizScore >= passingScore)
        .map(async (app) => {
          try {
            // Get ML prediction for each candidate
            const predictionRes = await axios.post('http://localhost:3001/predict-from-skills', {
              candidate_skills: app.candidateId.profile?.skills || [],
              job_skills: job.skills || [],
              candidate_exp: app.candidateId.profile?.experience || 0,
              required_exp: job.requiredExperience || 1,
              candidate_education: app.candidateId.profile?.education || '',
              required_education: job.education || ''
            });

            return {
              ...app,
              mlPrediction: {
                hired: predictionRes.data.hired === 1,
                confidence: Math.round(predictionRes.data.confidence * 100),
                matches: predictionRes.data.matches
              }
            };
          } catch (error) {
            console.error(`Error getting prediction for candidate ${app.candidateId._id}:`, error);
            return {
              ...app,
              mlPrediction: null
            };
          }
        })
    );

    // Sort candidates by ML prediction confidence (highest first)
    qualifiedCandidates.sort((a, b) => {
      if (a.mlPrediction && b.mlPrediction) {
        return b.mlPrediction.confidence - a.mlPrediction.confidence;
      }
      return 0;
    });

    setSelectedApplications(qualifiedCandidates);
    setSelectedJobId(jobId);
    setShowModal(true);
  } catch (err) {
    console.error("❌ Failed to fetch applications for job:", jobId, err);
    setSelectedApplications([]);
    setShowModal(true);
  }
};
  const handleScheduleInterview = (candidate) => {
    setSelectedCandidate(candidate);
    setShowInterviewModal(true);
  };

  const handleInterviewChange = (e) => {
    const { name, value } = e.target;
    setInterviewDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitInterview = async () => {
  try {
    // First get prediction
    const predictionRes = await axios.post('http://localhost:3001/Frontend/predict-score', {
      jobId: selectedJobId,
      candidateId: selectedCandidate.candidateId._id
    });

    const interviewData = {
      jobId: selectedJobId,
      enterpriseId: id,
      candidateId: selectedCandidate.candidateId._id,
      date: new Date(`${interviewDetails.date}T${interviewDetails.time}`),
      status: 'Scheduled',
      meeting: {
        type: interviewDetails.type,
        link: interviewDetails.type === 'Virtual' 
          ? interviewDetails.link 
          : enterprise.location,
        notes: interviewDetails.notes
      },
      evaluation: {
        predictedScore: predictionRes.data.predictedScore
      },
      mlFeatures: predictionRes.data.features
    };

    const response = await axios.post('http://localhost:3001/api/interviews/', interviewData);

    alert(`Interview scheduled successfully! Predicted score: ${Math.round(predictionRes.data.predictedScore * 100)}/100. The candidate will receive a confirmation email.`);
    
    setShowInterviewModal(false);
    setInterviewDetails({
      type: 'Virtual',
      link: '',
      date: '',
      time: '',
      notes: ''
    });
    
    fetchInterviews(selectedJobId);
  } catch (error) {
    console.error('Error scheduling interview:', error);
    alert(`Failed to schedule interview: ${error.response?.data?.message || error.message}`);
  }
};

  const handleChooseImage = () => fileInputRef.current.click();

  const handleCancelImage = () => {
    setImagePreview(null);
    setSelectedFile(null);
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancelEdit = () => {
    setEditedEnterprise(enterprise);
    setImagePreview(null);
    setSelectedFile(null);
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedEnterprise((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(`http://localhost:3001/Frontend/updateUser/${id}`, {
        enterprise: editedEnterprise,
      });

      setEnterprise(res.data.enterprise);
      setIsEditing(false);
      setUserPicture(res.data.picture || userPicture);

      if (selectedFile) {
        const formData = new FormData();
        formData.append("picture", selectedFile);
        formData.append("userId", id);

        const uploadRes = await axios.post(
          "http://localhost:3001/Frontend/upload-profile",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (uploadRes.data.pictureUrl) {
          setUserPicture(uploadRes.data.pictureUrl);
        }
      }

      setImagePreview(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      await axios.post("http://localhost:3001/Frontend/create-quiz", {
        jobId: quizJobId,
        questions: quizQuestions,
      });
      alert("🎉 Quiz saved successfully!");
      setShowQuizFormModal(false);
      fetchQuizLengths(); // Refresh quiz lengths
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Please try again.");
    }
  };

  const handleJobChange = (e) => {
    const { name, value } = e.target;
    setNewJob((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddJob = async () => {
    try {
      await axios.post("http://localhost:3001/Frontend/add-job", {
        title: newJob.title,
        description: newJob.description,
        location: newJob.location,
        salary: newJob.salary,
        skills: newJob.skills.split(",").map((skill) => skill.trim()),
        languages: newJob.languages.split(",").map((lang) => lang.trim()),
        entrepriseId: id,
      });

      const res = await axios.get(`http://localhost:3001/Frontend/jobs-by-entreprise/${id}`);
      setEnterpriseJobs(res.data);

      alert("New job added successfully!");
      setNewJob({
        title: "",
        description: "",
        location: "",
        salary: "",
        languages: "",
        skills: "",
      });
      setShowJobForm(false);
    } catch (err) {
      console.error("Error adding job:", err);
    }
  };

  return (
    <PublicLayout>
      <div className="entreprise-profile-container">
        <div className="entreprise-profile">
          {loading ? (
            <div className="text-center">
              <div className="loading-spinner">
                <div className="spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          ) : !enterprise ? (
            <div className="alert alert-danger" role="alert">
              No data found for this enterprise.
            </div>
          ) : (
            <>
              <div className="profile-header">
                <h2 className="profile-title">
                  <FontAwesomeIcon icon={faBuilding} className="title-icon" />
                  My Enterprise Profile
                </h2>
                {!isEditing && (
                  <button className="btn btn-edit-profile" onClick={handleEdit}>
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                )}
              </div>

              <div className="profile-content">
                <div className="profile-sidebar">
                  <div className="image-upload-container">
                    {userPicture && !imagePreview ? (
                      <div className="enterprise-image-wrapper">
                        <img
                          src={`http://localhost:3001${userPicture}`}
                          alt={enterprise.name}
                          className="enterprise-image"
                        />
                        {isEditing && (
                          <div className="image-overlay" onClick={handleChooseImage}>
                            <FontAwesomeIcon icon={faCamera} className="camera-icon" />
                          </div>
                        )}
                      </div>
                    ) : !userPicture && !imagePreview ? (
                      <div
                        className={`image-placeholder ${isEditing ? "editable" : ""}`}
                        onClick={isEditing ? handleChooseImage : null}
                      >
                        <FontAwesomeIcon icon={faCamera} className="camera-icon" />
                        <span>Add image</span>
                      </div>
                    ) : (
                      <div className="enterprise-image-wrapper">
                        <img src={imagePreview} alt="Preview" className="enterprise-image" />
                        <div className="image-actions">
                          <button className="btn btn-success btn-sm" onClick={handleSave}>
                            <FontAwesomeIcon icon={faSave} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={handleCancelImage}>
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleImageChange}
                    />
                  </div>

                  <button
                    className="btn btn-add-job mt-4 w-100"
                    onClick={() => setShowJobForm(!showJobForm)}
                  >
                    <FontAwesomeIcon icon={showJobForm ? faMinus : faPlus} className="me-2" />
                    {showJobForm ? "Hide" : "Add Job"}
                  </button>
                </div>

                <div className="profile-details">
                  <div className="profile-card">
                    <div className="profile-detail">
                      <FontAwesomeIcon icon={faBuilding} className="detail-icon" />
                      <div className="detail-content">
                        <label>Name</label>
                        {isEditing ? (
                          <input
                            name="name"
                            className="form-control"
                            value={editedEnterprise.name || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <p>{enterprise.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="profile-detail">
                      <FontAwesomeIcon icon={faIndustry} className="detail-icon" />
                      <div className="detail-content">
                        <label>Industry</label>
                        {isEditing ? (
                          <input
                            name="industry"
                            className="form-control"
                            value={editedEnterprise.industry || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <p>{enterprise.industry}</p>
                        )}
                      </div>
                    </div>

                    <div className="profile-detail">
                      <FontAwesomeIcon icon={faLocationDot} className="detail-icon" />
                      <div className="detail-content">
                        <label>Location</label>
                        {isEditing ? (
                          <input
                            name="location"
                            className="form-control"
                            value={editedEnterprise.location || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <p>{enterprise.location}</p>
                        )}
                      </div>
                    </div>

                    <div className="profile-detail">
                      <FontAwesomeIcon icon={faGlobe} className="detail-icon" />
                      <div className="detail-content">
                        <label>Website</label>
                        {isEditing ? (
                          <input
                            name="website"
                            className="form-control"
                            value={editedEnterprise.website || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <p>
                            <a href={enterprise.website} target="_blank" rel="noreferrer">
                              {enterprise.website}
                            </a>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="profile-detail">
                      <FontAwesomeIcon icon={faPeopleGroup} className="detail-icon" />
                      <div className="detail-content">
                        <label>Employee Count</label>
                        {isEditing ? (
                          <input
                            name="employeeCount"
                            type="number"
                            className="form-control"
                            value={editedEnterprise.employeeCount || ""}
                            onChange={handleChange}
                          />
                        ) : (
                          <p>{enterprise.employeeCount}</p>
                        )}
                      </div>
                    </div>

                    <div className="profile-detail description-detail">
                      <FontAwesomeIcon icon={faFileLines} className="detail-icon" />
                      <div className="detail-content">
                        <label>Description</label>
                        {isEditing ? (
                          <textarea
                            name="description"
                            className="form-control"
                            value={editedEnterprise.description || ""}
                            onChange={handleChange}
                            rows="4"
                          />
                        ) : (
                          <p>{enterprise.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="profile-actions">
                      <button className="btn btn-save" onClick={handleSave}>
                        <FontAwesomeIcon icon={faSave} className="me-2" />
                        Save
                      </button>
                      <button className="btn btn-cancel" onClick={handleCancelEdit}>
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {showJobForm && (
                <div className="job-form">
                  <h4 className="mb-4">
                    <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                    New Job Position
                  </h4>
                  <div className="mb-3">
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={newJob.title}
                      onChange={handleJobChange}
                      placeholder="Ex: React Frontend Developer"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={newJob.description}
                      onChange={handleJobChange}
                      placeholder="Describe responsibilities and required qualifications"
                      rows="4"
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        name="location"
                        value={newJob.location}
                        onChange={handleJobChange}
                        placeholder="Ex: Paris, France"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Salary (€)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="salary"
                        value={newJob.salary}
                        onChange={handleJobChange}
                        placeholder="Ex: 45000"
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Required Languages</label>
                      <input
                        type="text"
                        className="form-control"
                        name="languages"
                        value={newJob.languages}
                        onChange={handleJobChange}
                        placeholder="Ex: English, French"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Required Skills</label>
                      <input
                        type="text"
                        className="form-control"
                        name="skills"
                        value={newJob.skills}
                        onChange={handleJobChange}
                        placeholder="Ex: React, Node.js, MongoDB"
                      />
                    </div>
                  </div>

                  <div className="text-end mt-4">
                    <button
                      className="btn btn-success"
                      onClick={handleAddJob}
                      disabled={!newJob.title || !newJob.description}
                    >
                      <FontAwesomeIcon icon={faPlusCircle} className="me-2" />
                      Add
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {enterpriseJobs.length > 0 && (
          <div className="jobs-section mt-5">
            <h4 className="mb-4">
              <i className="fas fa-briefcase icon"></i>Jobs posted by your company
            </h4>
            <div className="jobs-grid">
              {enterpriseJobs.map((job, index) => (
                <div key={job._id} className="job-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="card-header position-relative d-flex justify-content-between align-items-center">
                    <h5 className="card-title d-flex align-items-center gap-2">
                      {applicationCounts[job._id] > 0 && (
                        <div
                          className="notification-badge"
                          onClick={() => openApplicationModal(job._id)}
                          style={{ cursor: "pointer" }}
                          title="View applications"
                        >
                          🔔 <span className="notif-count">{applicationCounts[job._id]}</span>
                        </div>
                      )}
                      {job.title}
                    </h5>

                    <FontAwesomeIcon
                      icon={faTrashCan}
                      className="delete-icon-top"
                      onClick={() => handleDeleteJob(job._id)}
                      title="Delete this job"
                    />
                  </div>

                  <div className="card-body">
                    <div className="job-detail">
                      <strong>Description:</strong> {job.description}
                    </div>
                    <div className="job-detail">
                      <strong>
                        <i className="fas fa-map-marker-alt me-2"></i>Location:
                      </strong>{" "}
                      {job.location}
                    </div>
                    <div className="job-detail">
                      <strong>Salary:</strong> {job.salary} €
                    </div>

                    {job.languages?.length > 0 && (
                      <div className="job-detail">
                        <strong>Languages:</strong>
                        <div className="tag-container">
                          {job.languages.map((lang, i) => (
                            <span key={i} className="language-tag">
                              <i className="fas fa-language"></i> {lang}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.skills?.length > 0 && (
                      <div className="job-detail">
                        <strong>Skills:</strong>
                        <div className="tag-container">
                          {job.skills.map((skill, i) => (
                            <span key={i} className="skill-tag">
                              <i className="fas fa-code"></i> {skill}
                            </span>
                          ))}
                          <button
                            className="btn btn-outline-warning mt-2"
                            onClick={() => openQuizFormModal(job._id)}
                          >
                            {jobQuizLengths[job._id] ? `Edit Quiz (${jobQuizLengths[job._id]} questions)` : "Add Quiz"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

{showModal && (
  <div className="custom-modal-overlay">
    <div className="custom-modal">
      <div className="modal-header">
        <h5>Qualified Candidates for this Job</h5>
        <button className="close-button" onClick={() => setShowModal(false)}>
          ✖
        </button>
      </div>
      <div className="modal-body">
        {selectedApplications.length > 0 ? (
          selectedApplications.map((app, i) => (
            <div key={i} className="application-card">
              <div className="candidate-header">
                <div>
                  <h6>{app.candidateId?.name}</h6>
                  <p className="text-muted">{app.candidateId?.email}</p>
                </div>
                {app.mlPrediction && (
                  <div className={`prediction-badge ${app.mlPrediction.hired ? 'recommended' : 'not-recommended'}`}>
                    {app.mlPrediction.hired ? 'Recommended' : 'Not Recommended'} ({app.mlPrediction.confidence}%)
                  </div>
                )}
              </div>
              
              <div className="candidate-details">
                <p><strong>Phone:</strong> {app.candidateId?.profile?.phone || "Not available"}</p>
                <p>
                  <strong>Quiz score:</strong> {app.quizScore}/{app.quizLength} 
                  ({Math.round((app.quizScore/app.quizLength)*100)}%)
                </p>
                <p className="text-success">✅ Qualified (Needed {app.passingScore} correct answers)</p>

                {app.mlPrediction && (
                  <div className="match-details">
                    <p><strong>Skill Match:</strong> {Math.round(app.mlPrediction.matches.skill_match * 100)}%</p>
                    <p><strong>Experience Match:</strong> {Math.round(app.mlPrediction.matches.exp_match * 100)}%</p>
                    <p><strong>Education Match:</strong> {Math.round(app.mlPrediction.matches.education_match * 100)}%</p>
                  </div>
                )}
              </div>

              <div className="action-buttons">
                <button 
                  className="btn btn-primary"
                  onClick={() => handleScheduleInterview(app)}
                >
                  <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                  Schedule Interview
                </button>
                <a
                  href={`mailto:${app.candidateId?.email}`}
                  className="btn btn-outline-primary"
                >
                  📧 Send email
                </a>
                {app.candidateId?.profile?.phone && (
                  <a
                    href={`tel:${app.candidateId.profile.phone}`}
                    className="btn btn-outline-success"
                  >
                    📞 Call
                  </a>
                )}
                {app.cv && (
                  <a
                    href={`http://localhost:3001${app.cv}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-secondary"
                  >
                    📄 Download CV
                  </a>
                )}
              </div>
              <hr />
            </div>
          ))
        ) : (
          <div className="alert alert-info">
            No qualified candidates found for this job. Candidates need to complete and pass the quiz to be eligible.
          </div>
        )}
      </div>
    </div>
  </div>
)}

        {/* Scheduled Interviews Section */}
        {scheduledInterviews.length > 0 && (
  <div className="interviews-section mt-5">
    <h4 className="mb-4">
      <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
      Scheduled Interviews
    </h4>
    <div className="interview-list">
      {scheduledInterviews.map((interview, index) => (
        <div key={index} className="interview-card">
          <div className="interview-header">
            <h6>
              <FontAwesomeIcon icon={faVideo} className="me-2" />
              Interview with {interview.candidateId?.name}
            </h6>
            <span className={`status-badge ${interview.status.toLowerCase()}`}>
              {interview.status}
            </span>
          </div>
          <div className="interview-details">
            <p>
              <strong>Date:</strong> {new Date(interview.date).toLocaleString()}
            </p>
            <p>
              <strong>Type:</strong> {interview.meeting.type}
            </p>
            {interview.evaluation?.predictedScore && (
              <p>
                <strong>Predicted Score:</strong> 
                <span className="score-badge">
                  {Math.round(interview.evaluation.predictedScore * 100)}/100
                </span>
              </p>
            )}
            {interview.meeting.type === 'Virtual' && (
              <p>
                <strong>Link:</strong> 
                <a 
                  href={interview.meeting.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="interview-link"
                >
                  {interview.meeting.link}
                </a>
              </p>
            )}
            {interview.meeting.notes && (
              <p>
                <strong>Notes:</strong> {interview.meeting.notes}
              </p>
            )}
          </div>
          <div className="interview-actions">
            {interview.meeting.type === 'Virtual' && (
              <a 
                href={interview.meeting.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-sm btn-primary"
              >
                <FontAwesomeIcon icon={faVideo} className="me-2" />
                Join Meeting
              </a>
            )}
            {interview.status === 'Completed' && interview.evaluation?.finalScore && (
              <div className="final-score">
                <strong>Final Score:</strong>
                <span className="score-badge final">
                  {Math.round(interview.evaluation.finalScore * 100)}/100
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}

        {showInterviewModal && (
          <div className="custom-modal-overlay">
            <div className="custom-modal">
              <div className="modal-header">
                <h5>Schedule Interview with {selectedCandidate?.candidateId?.name}</h5>
                <button className="close-button" onClick={() => setShowInterviewModal(false)}>
                  ✖
                </button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Interview Type</label>
                  <select
                    name="type"
                    className="form-select"
                    value={interviewDetails.type}
                    onChange={handleInterviewChange}
                  >
                    <option value="Virtual">Virtual</option>
                    <option value="In-person">In-person</option>
                  </select>
                </div>

                {interviewDetails.type === 'Virtual' && (
                  <div className="mb-3">
                    <label className="form-label">Meeting Link</label>
                    <input
                      type="text"
                      name="link"
                      className="form-control"
                      placeholder="Leave blank to generate a new meeting link"
                      value={interviewDetails.link}
                      onChange={handleInterviewChange}
                    />
                  </div>
                )}

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Date</label>
                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={interviewDetails.date}
                      onChange={handleInterviewChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Time</label>
                    <input
                      type="time"
                      name="time"
                      className="form-control"
                      value={interviewDetails.time}
                      onChange={handleInterviewChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Notes</label>
                  <textarea
                    name="notes"
                    className="form-control"
                    rows="3"
                    value={interviewDetails.notes}
                    onChange={handleInterviewChange}
                    placeholder="Any special instructions for the candidate"
                  ></textarea>
                </div>

                <div className="text-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmitInterview}
                    disabled={!interviewDetails.date || !interviewDetails.time}
                  >
                    <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
                    Schedule Interview
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showQuizFormModal && (
          <div className="quiz-modal">
            <h4>Add/Edit Quiz for this Job</h4>
            <p className="text-muted mb-3">
              The quiz will have {quizQuestions.length} questions. Candidates need to answer at least {Math.ceil(quizQuestions.length / 2)} correctly to qualify.
            </p>
            
            {quizQuestions.map((q, idx) => (
              <div key={idx} className="mb-3 p-3 border rounded">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="fw-bold">Question {idx + 1}</label>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => {
                      if (quizQuestions.length > 1) {
                        setQuizQuestions(quizQuestions.filter((_, i) => i !== idx));
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
                <input
                  type="text"
                  className="form-control mb-2"
                  placeholder="Enter question"
                  value={q.question}
                  onChange={(e) => {
                    const updated = [...quizQuestions];
                    updated[idx].question = e.target.value;
                    setQuizQuestions(updated);
                  }}
                  required
                />
                
                <div className="options-container">
                  {q.options.map((opt, i) => (
                    <div key={i} className="input-group mb-2">
                      <div className="input-group-text">
                        <input
                          type="radio"
                          name={`correctAnswer-${idx}`}
                          checked={q.correctAnswer === i}
                          onChange={() => {
                            const updated = [...quizQuestions];
                            updated[idx].correctAnswer = i;
                            setQuizQuestions(updated);
                          }}
                        />
                      </div>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...quizQuestions];
                          updated[idx].options[i] = e.target.value;
                          setQuizQuestions(updated);
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="d-flex justify-content-between mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  if (quizQuestions.length < 20) {
                    setQuizQuestions([
                      ...quizQuestions,
                      { question: "", options: ["", "", "", ""], correctAnswer: 0 },
                    ]);
                  }
                }}
                disabled={quizQuestions.length >= 20}
              >
                ➕ Add Question (Max 20)
              </button>

              <div>
                <button
                  className="btn btn-danger me-2"
                  onClick={() => setShowQuizFormModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={handleSubmitQuiz}
                  disabled={quizQuestions.some(q => !q.question || q.options.some(opt => !opt))}
                >
                  Save Quiz ({quizQuestions.length} questions)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
};

export default EntrepriseProfile;