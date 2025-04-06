import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import PublicLayout from "../../layouts/PublicLayout";
import "./EntrepriseProfile.css";

const EntrepriseProfile = () => {
  const { id } = useParams();
  const [enterprise, setEnterprise] = useState(null);
  const [userPicture, setUserPicture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEnterprise, setEditedEnterprise] = useState({});
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({
    title: "",
    description: "",
    location: "",
    salary: ""
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchEntreprise = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/Frontend/getUser/${id}`);
        setEnterprise(res.data.enterprise);
        setUserPicture(res.data.picture);
        setEditedEnterprise(res.data.enterprise);
        setLoading(false);
      } catch (err) {
        console.error("Erreur entreprise:", err);
      }
    };

    fetchEntreprise();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setSelectedFile(file);
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

  const handleJobChange = (e) => {
    const { name, value } = e.target;
    setNewJob((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddJob = async () => {
    try {
      const res = await axios.post("http://localhost:3001/Frontend/add-job", {
        title: newJob.title,
        description: newJob.description,
        location: newJob.location,
        salary: newJob.salary,
        skills: newJob.skills.split(',').map(skill => skill.trim()),       // ✅ important
  languages: newJob.languages.split(',').map(lang => lang.trim()) ,   // ✅ important
        entrepriseId: id
      });
  
      alert("Nouveau poste ajouté avec succès !");
      setNewJob({ title: "", description: "", location: "", salary: "" });
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
            <p>Chargement...</p>
          ) : !enterprise ? (
            <p>Aucune donnée trouvée.</p>
          ) : (
            <>
              <h2 className="profile-title">My Entreprise</h2>

              <div className="image-upload-container">
                {userPicture && !imagePreview && (
                  <img src={`http://localhost:3001${userPicture}`} alt="Entreprise" className="enterprise-image" />
                )}

                {imagePreview && (
                  <>
                    <img src={imagePreview} alt="Preview" className="enterprise-image" />
                    <div className="btn-group mt-3">
                      <button className="btn btn-success me-2" onClick={handleSave}>✅ Enregistrer</button>
                      <button className="btn btn-danger" onClick={handleCancelImage}>❌ Annuler</button>
                    </div>
                  </>
                )}

                {!userPicture && !imagePreview && !isEditing && (
                  <div className="image-placeholder" onClick={handleChooseImage}>
                    Cliquez pour ajouter une image
                  </div>
                )}

                {isEditing && (
                  <div className="form-group mt-3">
                    <label>Changer l’image de l’entreprise</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} />
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="enterprise-image mt-2" />
                    )}
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

              <div className="profile-detail"><span className="icon">🏢</span>
                <strong>Nom :&nbsp;</strong>
                {isEditing ? (
                  <input name="name" value={editedEnterprise.name} onChange={handleChange} />
                ) : (
                  enterprise.name
                )}
              </div>

              <div className="profile-detail"><span className="icon">🏭</span>
                <strong>Industrie :&nbsp;</strong>
                {isEditing ? (
                  <input name="industry" value={editedEnterprise.industry} onChange={handleChange} />
                ) : (
                  enterprise.industry
                )}
              </div>

              <div className="profile-detail"><span className="icon">📍</span>
                <strong>Localisation :&nbsp;</strong>
                {isEditing ? (
                  <input name="location" value={editedEnterprise.location} onChange={handleChange} />
                ) : (
                  enterprise.location
                )}
              </div>

              <div className="profile-detail"><span className="icon">🌐</span>
                <strong>Site Web :&nbsp;</strong>
                {isEditing ? (
                  <input name="website" value={editedEnterprise.website} onChange={handleChange} />
                ) : (
                  <a href={enterprise.website} target="_blank" rel="noreferrer">{enterprise.website}</a>
                )}
              </div>

              <div className="profile-detail"><span className="icon">📝</span>
                <strong>Description :&nbsp;</strong>
                {isEditing ? (
                  <textarea name="description" value={editedEnterprise.description} onChange={handleChange} />
                ) : (
                  enterprise.description
                )}
              </div>

              <div className="profile-detail"><span className="icon">👥</span>
                <strong>Nombre d'employés :&nbsp;</strong>
                {isEditing ? (
                  <input name="employeeCount" type="number" value={editedEnterprise.employeeCount} onChange={handleChange} />
                ) : (
                  enterprise.employeeCount
                )}
              </div>

              {/* ✅ Boutons d'édition + Ajout de job */}
              <div className="text-center mt-4 d-flex justify-content-center gap-3">
                {isEditing ? (
                  <>
                    <button className="btn btn-success me-2" onClick={handleSave}>💾 Enregistrer</button>
                    <button className="btn btn-secondary" onClick={handleCancelEdit}>Annuler</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-primary" onClick={handleEdit}>✏️ Modifier</button>
                    <button className="btn btn-outline-info" onClick={() => setShowJobForm(!showJobForm)}>
                      ➕ Add a Job
                    </button>
                  </>
                )}
              </div>

              {/* ✅ Formulaire d’ajout de job */}
              {showJobForm && (
                <div className="mt-4 p-4 border rounded bg-light text-dark">
                  <h4 className="mb-3">New job</h4>
                  <div className="mb-3">
                    <label>Post title</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title"
                      value={newJob.title}
                      onChange={handleJobChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      value={newJob.description}
                      onChange={handleJobChange}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label>Location</label>
                    <input
                      type="text"
                      className="form-control"
                      name="location"
                      value={newJob.location}
                      onChange={handleJobChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label>Salary</label>
                    <input
                      type="number"
                      className="form-control"
                      name="salary"
                      value={newJob.salary}
                      onChange={handleJobChange}
                    />
                  </div>
                  <div className="mb-3">
  <label>Languages</label>
  <input
    type="text"
    className="form-control"
    name="languages"
    value={newJob.languages}
    onChange={handleJobChange}
    placeholder="e.g. English, French"
  />
</div>

<div className="mb-3">
  <label>Skills Needed</label>
  <input
    type="text"
    className="form-control"
    name="skills"
    value={newJob.skills}
    onChange={handleJobChange}
    placeholder="e.g. React, Node.js"
  />
</div>

                  <div className="text-end">
                    <button className="btn btn-success" onClick={handleAddJob}>✅ Add</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PublicLayout>
  );
};

export default EntrepriseProfile;
