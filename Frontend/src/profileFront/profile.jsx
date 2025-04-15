import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Avatar } from "./avatar";
import { Skeleton } from "./skeleton";
import "./Profile.css";
import { FaCamera, FaCheckCircle, FaTimesCircle, FaUpload, FaFilePdf, FaCog } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

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
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:3001/Frontend/getUser/${id}`);
        const data = await res.json();
        console.log("🧠 USER DATA:", data); // 👈 Ajoute ça

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
  
      // 🔁 Recharge les données utilisateur après upload
      const resUser = await fetch(`http://localhost:3001/Frontend/getUser/${id}`);
      const updatedUser = await resUser.json();
      setUser(updatedUser);
  
    } catch (err) {
      setUploadStatus("Error uploading CV.");
      console.error(err);
    }
  };
  
  if (loading) return <Skeleton className="w-full h-64" />;
  if (!user) return <p className="text-center text-red-500">User not found.</p>;

  return (
    <>
      <Navbar />

      <div className="profile-container">
        <Card className="card">
          <CardHeader className="card-header">
            <div className="avatar-container">
              <img
                src={newPicture || `http://localhost:3001${user.picture}`}
                className="avatar"
                alt="Profile Picture"
              />
              <label className="camera-icon" onClick={handleCameraClick}>
                <FaCamera />
              </label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden-input"
                onChange={handlePictureChange}
                accept="image/*"
                style={{ display: "none" }}
              />
            </div>

            {pictureStatus && (
              <p className={pictureStatus.includes("✔️") ? "upload-success" : "upload-error"}>
                {pictureStatus}
              </p>
            )}

            {newPicture && (
              <div className="picture-confirmation">
                <div className="confirmation-buttons">
                  <button onClick={handlePictureConfirm} className="confirm-button">
                    <FaCheckCircle /> Confirm
                  </button>
                  <button onClick={handlePictureCancel} className="cancel-button">
                    <FaTimesCircle /> Cancel
                  </button>
                </div>
              </div>
            )}

            <h2 className="name">{user.name}</h2>

            <button className="edit-profile-button" onClick={handleEditProfile}>
              <FaCog /> Edit Profile
            </button>
          
          </CardHeader>


        

<div className="tab-buttons">
  <button
    className={activeTab === "infos" ? "tab active" : "tab"}
    onClick={() => setActiveTab("infos")}
  >
    📋 Infos
  </button>

  <button
    className={activeTab === "experience" ? "tab active" : "tab"}
    onClick={() => setActiveTab("experience")}
  >
    💼 Expérience
  </button>

  <button
    className={activeTab === "cv" ? "tab active" : "tab"}
    onClick={() => setActiveTab("cv")}
  >
    📄 CV
  </button>

  {user.role === "CANDIDATE" && (
    <button
      className={activeTab === "candidatures" ? "tab active" : "tab"}
      onClick={() => setActiveTab("candidatures")}
    >
      📝 Candidatures
    </button>
  )}
</div>



<CardContent className="card-body">
  {activeTab === "infos" && (
    <>
      <p className="role">{user.role}</p>

      {/* ENTREPRISE */}
      {user.role === "ENTERPRISE" && user.enterprise && (
        <>
          <p><strong>🏢 Entreprise:</strong> {user.enterprise.name}</p>
          <p><strong>📍 Localisation:</strong> {user.enterprise.location}</p>
          <p><strong>💼 Secteur:</strong> {user.enterprise.industry}</p>
          <p><strong>🌐 Site web:</strong> {user.enterprise.website}</p>
          <p><strong>📧 Email:</strong> {user.email}</p>
        </>
      )}

      {/* CANDIDAT */}
      {user.role === "CANDIDATE" && user.profile && (
        <>
          <p><strong>📧 Email:</strong> {user.email}</p>
          <p><strong>📞 Téléphone:</strong> {user.profile.phone || "Non fourni"}</p>

          <div className="skills">
            <p><strong>🛠️ Compétences:</strong></p>
            {user.profile.skills?.length > 0 ? (
              user.profile.skills.map((skill, index) => (
                <span key={index} className="skill-badge">{skill}</span>
              ))
            ) : <p>Non fourni</p>}
          </div>

          <div className="languages">
            <p><strong>🌍 Langues:</strong></p>
            {user.profile.languages?.length > 0 ? (
              user.profile.languages.map((lang, index) => (
                <span key={index} className="language-badge">{lang}</span>
              ))
            ) : <p>Non fourni</p>}
          </div>
        </>
      )}
    </>
  )}

  {activeTab === "experience" && user.profile?.experience?.length > 0 && (
    <div className="experience">
      <h4>Expérience</h4>
      <ul>
        {user.profile.experience.map((exp, idx) => (
          <li key={idx}>
            <strong>{exp.title}</strong> at {exp.company} – {exp.duration}<br />
            <em>{exp.description}</em>
          </li>
        ))}
      </ul>
    </div>
  )}

  {activeTab === "cv" && (
    <div className="upload-container">
      {resumeUrl ? (
        <p className="cv-link">
          <a href={`http://localhost:3001${resumeUrl}`} target="_blank" rel="noopener noreferrer">
            <FaFilePdf /> Voir le CV
          </a>
        </p>
      ) : (
        <>
          <label className="upload-button">
            <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" hidden />
            <FaUpload /> Ajouter un CV
          </label>
          {file && (
            <button className="upload-btn" onClick={handleFileUpload}>
              <FaUpload /> Upload
            </button>
          )}
        </>
      )}
      {uploadStatus && <p>{uploadStatus}</p>}
    </div>
  )}

  {/* ✅ NOUVEAU BLOC CANDIDATURES */}
  {activeTab === "candidatures" && (
    <>
      <h4 className="section-title">📄 Mes Candidatures</h4>
      {applications.length > 0 ? (
  applications.map((app, i) => (
    <div key={i} className="application-box">
      <p><strong>🔹 Poste:</strong> {app.jobId?.title}</p>
      <p><strong>📧 Email:</strong> {app.email}</p>
      <p><strong>📞 Téléphone:</strong> {app.phone}</p>
      <p><strong>📅 Date:</strong> {new Date(app.appliedAt).toLocaleDateString()}</p>
      <p><strong>🎯 Score Quiz:</strong> {app.quizScore !== undefined ? `${app.quizScore} / 10` : "Pas encore passé"}</p>

      {app.cv && (
        <p>
          <a href={`http://localhost:3001${app.cv}`} target="_blank" rel="noopener noreferrer" className="cv-link">
            📄 Voir le CV
          </a>
        </p>
      )}

      {/* 🗑️ Bouton supprimer */}
      <button
  className="btn btn-danger"
  onClick={() => handleDeleteApplication(app._id)}
>
  ❌ Supprimer
</button>

      <hr />
    </div>
  ))
) : (
  <p>❌ Aucune candidature envoyée pour le moment.</p>
)}

    </>
  )}
</CardContent>


        </Card>
      </div>

      <Footer />
    </>
  );
};

export default Profile;
