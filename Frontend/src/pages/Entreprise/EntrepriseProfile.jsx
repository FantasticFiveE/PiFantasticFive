import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import PublicLayout from "../../layouts/PublicLayout";
import "./EntrepriseProfile.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
import {faBuilding, faIndustry, faLocationDot, faGlobe, faFileLines, faPeopleGroup, faEdit, faSave, faTimes, faBriefcase, faCamera, faPlus, faMinus, faPlusCircle } from "@fortawesome/free-solid-svg-icons";

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
  
  const [showQuizFormModal, setShowQuizFormModal] = useState(false);
  const [quizJobId, setQuizJobId] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([{ question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
  


  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    languages: "",
    skills: ""
  });

  const fileInputRef = useRef(null);

  const openQuizFormModal = (jobId) => {
    setQuizJobId(jobId);
    setShowQuizFormModal(true);
  };
  

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const [jobsRes, countRes] = await Promise.all([
          axios.get(`http://localhost:3001/Frontend/jobs-by-entreprise/${userId}`),
          axios.get(`http://localhost:3001/Frontend/job-applications-count/${userId}`)
        ]);
        setJobs(jobsRes.data);
        setApplicationCounts(countRes.data);
      } catch (error) {
        console.error("❌ Failed to fetch jobs or counts", error);
      }
    };
  
    fetchJobs();
  }, []);



  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const enterpriseId = localStorage.getItem("userId"); // ou le bon ID de l'entreprise
        const res = await axios.get(`http://localhost:3001/Frontend/applications/${enterpriseId}`);
        setApplications(res.data);
      } catch (err) {
        console.error("❌ Erreur récupération des candidatures:", err);
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
        console.error("Erreur entreprise:", err);
      }
    };
    
    const fetchEnterpriseJobs = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/Frontend/jobs-by-entreprise/${id}`);
        setEnterpriseJobs(res.data);
      } catch (err) {
        console.error("Erreur lors de la récupération des jobs de l'entreprise :", err);
      }
    };

    fetchEntreprise();
    fetchEnterpriseJobs();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setSelectedFile(file);
    }
  };

  const handleDeleteJob = async (jobId) => {
    const confirm = window.confirm("Voulez-vous vraiment supprimer ce job ?");
    if (!confirm) return;
  
    try {
      await axios.delete(`http://localhost:3001/Frontend/delete-job/${jobId}`);
      // Update jobs list locally after deletion
      setEnterpriseJobs((prev) => prev.filter((job) => job._id !== jobId));
    } catch (error) {
      console.error("Erreur lors de la suppression du job :", error);
    }
  };
  
const openApplicationModal = async (jobId) => {
  try {
    const res = await axios.get(`http://localhost:3001/Frontend/job-applications/${jobId}`);
    setSelectedApplications(res.data);
    setSelectedJobId(jobId);
    setShowModal(true);
  } catch (err) {
    console.error("❌ Failed to fetch applications for job:", jobId, err);
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
      setUserPicture(res.data.picture || userPicture); // ajoute ça après setEnterprise

      if (selectedFile) {
        const formData = new FormData();
        formData.append("picture", selectedFile);
        formData.append("userId", id);
  
        const uploadRes = await axios.post("http://localhost:3001/Frontend/upload-profile", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
  
        if (uploadRes.data.pictureUrl) {
          setUserPicture(uploadRes.data.pictureUrl);
        }
      }
  
      setImagePreview(null);
      setSelectedFile(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
    }
  };
  

  const handleSubmitQuiz = async () => {
    try {
      await axios.post("http://localhost:3001/Frontend/create-quiz", {
        jobId: quizJobId,
        questions: quizQuestions
      });
      alert("🎉 Quiz enregistré avec succès !");
      setShowQuizFormModal(false);
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du quiz :", error);
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
        skills: newJob.skills.split(',').map(skill => skill.trim()),
        languages: newJob.languages.split(',').map(lang => lang.trim()),
        entrepriseId: id
      });
  
      // Refresh job list after adding
      const res = await axios.get(`http://localhost:3001/Frontend/jobs-by-entreprise/${id}`);
      setEnterpriseJobs(res.data);
      
      alert("Nouveau poste ajouté avec succès !");
      setNewJob({ title: "", description: "", location: "", salary: "", languages: "", skills: "" });
      setShowJobForm(false);
    } catch (err) {
      console.error("Erreur lors de l'ajout du job :", err);
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
                  <span className="visually-hidden">Chargement...</span>
                </div>
              </div>
            </div>
          ) : !enterprise ? (
            <div className="alert alert-danger" role="alert">
              Aucune donnée trouvée pour cette entreprise.
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
                    <FontAwesomeIcon icon={faEdit} /> Modifier
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
                        className={`image-placeholder ${isEditing ? 'editable' : ''}`} 
                        onClick={isEditing ? handleChooseImage : null}
                      >
                        <FontAwesomeIcon icon={faCamera} className="camera-icon" />
                        <span>Ajouter une image</span>
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
                      {showJobForm ? 'Masquer' : 'Ajouter un Job'}
                    </button>
                  
                </div>

                <div className="profile-details">
                  <div className="profile-card">
                    <div className="profile-detail">
                      <FontAwesomeIcon icon={faBuilding} className="detail-icon" />
                      <div className="detail-content">
                        <label>Nom</label>
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
                        <label>Industrie</label>
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
                        <label>Localisation</label>
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
                        <label>Site Web</label>
                        {isEditing ? (
                          <input 
                            name="website" 
                            className="form-control" 
                            value={editedEnterprise.website || ""} 
                            onChange={handleChange} 
                          />
                        ) : (
                          <p><a href={enterprise.website} target="_blank" rel="noreferrer">{enterprise.website}</a></p>
                        )}
                      </div>
                    </div>

                    <div className="profile-detail">
                      <FontAwesomeIcon icon={faPeopleGroup} className="detail-icon" />
                      <div className="detail-content">
                        <label>Nombre d'employés</label>
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
                        Enregistrer
                      </button>
                      <button className="btn btn-cancel" onClick={handleCancelEdit}>
                        <FontAwesomeIcon icon={faTimes} className="me-2" />
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Form */}
              {showJobForm && (
                <div className="job-form">
                  <h4 className="mb-4">
                    <FontAwesomeIcon icon={faBriefcase} className="me-2" />
                    Nouveau poste
                  </h4>
                  <div className="mb-3">
                    <label className="form-label">Titre du poste</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={newJob.title}
                      onChange={handleJobChange}
                      placeholder="Ex: Développeur Frontend React"
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={newJob.description}
                      onChange={handleJobChange}
                      placeholder="Décrivez les responsabilités et qualifications requises"
                      rows="4"
                    ></textarea>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Localisation</label>
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
                      <label className="form-label">Salaire (€)</label>
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
                      <label className="form-label">Langues requises</label>
                      <input
                        type="text"
                        className="form-control"
                        name="languages"
                        value={newJob.languages}
                        onChange={handleJobChange}
                        placeholder="Ex: Anglais, Français"
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Compétences requises</label>
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
                      Ajouter
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
      <i className="fas fa-briefcase icon"></i>Jobs publiés par votre entreprise
    </h4>
    <div className="jobs-grid">
      {enterpriseJobs.map((job, index) => (
        <div 
          key={job._id} 
          className="job-card" 
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="card-header position-relative d-flex justify-content-between align-items-center">
            
          <h5 className="card-title d-flex align-items-center gap-2">
  {applicationCounts[job._id] > 0 && (
    <div
      className="notification-badge"
      onClick={() => openApplicationModal(job._id)}
      style={{ cursor: "pointer" }}
      title="Voir les candidatures"
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
              title="Supprimer ce job"
            />
          </div>

          <div className="card-body">
            <div className="job-detail">
              <strong>Description:</strong> {job.description}
            </div>
            <div className="job-detail">
              <strong><i className="fas fa-map-marker-alt me-2"></i>Localisation:</strong> {job.location}
            </div>
            <div className="job-detail">
              <strong>Salaire:</strong> {job.salary} €
            </div>

         

            {job.languages?.length > 0 && (
              <div className="job-detail">
                <strong>Langues:</strong>
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
                <strong>Compétences:</strong>
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
  🧠 Ajouter un Quiz
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
  <div className="custom-modal-overlay" onClick={() => setShowModal(false)}>
    <div className="custom-modal" onClick={(e) => e.stopPropagation()}>
      <h4 className="modal-title">Candidatures pour ce poste</h4>
      <button className="close-modal" onClick={() => setShowModal(false)}>✖</button>
      {selectedApplications.length > 0 ? (
        <ul className="application-list">
          {selectedApplications.map((app, index) => (
            <li key={index} className="application-item">
              <p><strong>Nom:</strong> {app.fullName}</p>
              <p><strong>Email:</strong> {app.email}</p>
              <p><strong>Téléphone:</strong> {app.phone}</p>
              <p><strong>Résultat du Quiz :</strong> {app.quizScore}/10</p>

              {/* Ajoute d'autres infos ici si tu veux */}
            </li>
          ))}
        </ul>
      ) : (
        <p>Aucune candidature reçue pour ce poste.</p>
      )}
    </div>
  </div>
)}


{showModal && (
  <div className="custom-modal-overlay">
    <div className="custom-modal">
      <div className="modal-header">
        <h5>Candidatures pour le job</h5>
        <button className="close-button" onClick={() => setShowModal(false)}>✖</button>
      </div>
      <div className="modal-body">
      {selectedApplications.length > 0 ? (
  selectedApplications.map((app, i) => (
    <div key={i} className="application-card">
      <p><strong>Nom :</strong> {app.candidateId?.name}</p>
      <p><strong>Email :</strong> {app.candidateId?.email}</p>
      <p><strong>Téléphone :</strong> {app.candidateId?.profile?.phone || 'Non disponible'}</p>

      {/* ✅ Affiche le score du quiz */}
      <p><strong>Score au quiz :</strong> {app.quizScore !== undefined ? `${app.quizScore} / 10` : 'Non soumis'}</p>

      <div className="action-buttons">
        <a href={`mailto:${app.candidateId?.email}`} className="btn btn-outline-primary">📧 Envoyer un email</a>
        {app.candidateId?.profile?.phone && (
          <a href={`tel:${app.candidateId.profile.phone}`} className="btn btn-outline-success">📞 Appeler</a>
        )}
        {app.cv && (
          <a 
            href={`http://localhost:3001${app.cv}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn btn-outline-secondary"
          >
            📄 Télécharger le CV
          </a>
        )}
      </div>
      <hr />
    </div>
  ))
) : (
  <p>Aucune candidature trouvée pour ce job.</p>
)}


      </div>  
    </div>
  </div>
)}

{showQuizFormModal && (
  <div className="quiz-modal">
    <h4>Ajouter un Quiz pour ce job</h4>
    {quizQuestions.map((q, idx) => (
      <div key={idx} className="mb-3">
        <label>Question {idx + 1}</label>
        <input
          type="text"
          className="form-control"
          value={q.question}
          onChange={(e) => {
            const updated = [...quizQuestions];
            updated[idx].question = e.target.value;
            setQuizQuestions(updated);
          }}
        />
        {q.options.map((opt, i) => (
          <input
            key={i}
            type="text"
            placeholder={`Option ${i + 1}`}
            className="form-control mt-1"
            value={opt}
            onChange={(e) => {
              const updated = [...quizQuestions];
              updated[idx].options[i] = e.target.value;
              setQuizQuestions(updated);
            }}
          />
        ))}
        <select
          className="form-select mt-2"
          value={q.correctAnswer}
          onChange={(e) => {
            const updated = [...quizQuestions];
            updated[idx].correctAnswer = parseInt(e.target.value);
            setQuizQuestions(updated);
          }}
        >
          <option value={0}>Réponse correcte: Option 1</option>
          <option value={1}>Option 2</option>
          <option value={2}>Option 3</option>
          <option value={3}>Option 4</option>
        </select>
      </div>
    ))}
    <button className="btn btn-secondary" onClick={() => {
      if (quizQuestions.length < 10) {
        setQuizQuestions([...quizQuestions, { question: "", options: ["", "", "", ""], correctAnswer: 0 }]);
      }
    }}>➕ Ajouter une autre question</button>

    <button className="btn btn-success mt-3" onClick={handleSubmitQuiz}>✅ Enregistrer le quiz</button>
    <button className="btn btn-danger mt-2" onClick={() => setShowQuizFormModal(false)}>❌ Fermer</button>
  </div>
)}



      </div>
    </PublicLayout>
  );
};

export default EntrepriseProfile;