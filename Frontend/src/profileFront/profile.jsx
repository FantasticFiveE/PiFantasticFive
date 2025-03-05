import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Avatar } from "./avatar";
import { Skeleton } from "./skeleton";
import "./Profile.css";
import { FaCamera, FaCheckCircle, FaTimesCircle, FaUpload, FaFilePdf, FaCog } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";

const Profile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState("");
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [pictureError, setPictureError] = useState(false);
  const [picture, setPicture] = useState(null);
  const [newPicture, setNewPicture] = useState(null);
  const [isPictureConfirmed, setIsPictureConfirmed] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:3001/Frontend/getUser/${id}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        console.log("Données utilisateur récupérées:", data);
        setUser(data);
        
        // Vérifier que le résumé est valide (pas null, pas vide, pas un chemin de fichier local)
        const isValidResume = data.resume && 
                             data.resume.trim() !== "" && 
                             !data.resume.startsWith("file://");
        
        setResumeUrl(isValidResume ? data.resume : "");
        setPicture(data.picture || "/images/team-1.jpg");
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des données", error);
        setLoading(false);
      });
  }, [id]);
  
  const navigate = useNavigate();

  const handleEditProfile = () => {
    navigate(`/edit-profile/${id}`); // Utilise bien la route correcte
  };
  
  
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      setUploadStatus("Aucun fichier sélectionné.");
      return;
    }
  
    const allowedExtensions = ["pdf", "doc", "docx"];
    const allowedMimeTypes = [
      "application/pdf", 
      "application/msword", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
  
    const fileExtension = selectedFile.name.split(".").pop().toLowerCase();
    const fileType = selectedFile.type;
  
    if (!allowedExtensions.includes(fileExtension) || !allowedMimeTypes.includes(fileType)) {
      setUploadStatus("Format de fichier non pris en charge. Choisissez un PDF ou DOC.");
      return;
    }
  
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > MAX_FILE_SIZE) {
      setUploadStatus("Le fichier est trop volumineux. La taille maximale est de 10 Mo.");
      return;
    }
  
    setFile(selectedFile);
    setUploadStatus(""); // Reset status
  };
  
  const handleFileUpload = async () => {
    if (!file) {
      setUploadStatus("Veuillez sélectionner un fichier.");
      return;
    }
  
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("userId", id);
    
    console.log("📤 Envoi du CV au serveur");
    console.log("📄 Fichier à envoyer:", file);
    console.log("🆔 User ID:", id);
  
    try {
      const response = await fetch("http://localhost:3001/Frontend/upload-resume", {
        method: "POST",
        body: formData,
      });
      
      console.log("📨 Réponse du serveur:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Erreur serveur:", errorText);
        throw new Error(`Erreur lors du téléchargement du CV (${response.status}): ${errorText}`);
      }
  
      const data = await response.json();
      console.log("✅ Données reçues:", data);
      
      if (data.resumeUrl) {
        setResumeUrl(data.resumeUrl);
        setUploadStatus("CV téléchargé avec succès !");
      } else {
        setUploadStatus("Erreur lors de l'upload du CV.");
      }
      setFile(null);
    } catch (error) {
      console.error("❌ Erreur d'upload :", error);
      setUploadStatus("Erreur lors de l'upload du CV: " + error.message);
    }
  };
  
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert("L'image dépasse la taille maximale autorisée (5MB).");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPicture(reader.result);
      setIsPictureConfirmed(false);
    };
    reader.readAsDataURL(file);

    setFile(file);
  };

  const handlePictureConfirm = async () => {
    if (!file) {
      console.error("Aucune image sélectionnée pour la confirmation.");
      return;
    }

    const formData = new FormData();
    formData.append("userId", id);
    formData.append("picture", file);

    try {
      const response = await fetch("http://localhost:3001/Frontend/upload-profile", {
        method: "POST",
        body: formData,
        headers: {
          "x-user-id": id,  // Passe l'userId dans le header
      },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement de l'image.");
      }

      const data = await response.json();
      setPicture(data.pictureUrl);
      setIsPictureConfirmed(true);
      setNewPicture(null);
      setFile(null);
    } catch (error) {
      console.error("Erreur lors du téléchargement de l'image:", error);
    }
  };

  const handlePictureCancel = () => {
    setNewPicture(null);
    setIsPictureConfirmed(false);
  };

  const handleImageError = () => {
    setPictureError(true);
  };

  const pictureSrc =
    !picture || pictureError ? "/images/team-1.jpg" : `http://localhost:3001${picture}`;

  if (loading) {
    return <Skeleton className="w-full h-64" />;
  }

  if (!user) {
    return <p className="text-center text-red-500">Utilisateur introuvable.</p>;
  }
  
  // Vérifier si resumeUrl est valide
  const hasValidResume = resumeUrl && resumeUrl.trim() !== "" && !resumeUrl.startsWith("file://");
  console.log("Valeur de resumeUrl:", resumeUrl);
  console.log("Resume valide ?", hasValidResume);

  return (
    <div className="profile-container">
      <Card className="card">
        <CardHeader className="card-header">
          <div className="avatar-container">
            <Avatar
              className="avatar"
              src={isPictureConfirmed ? pictureSrc : newPicture || pictureSrc}
              alt={user.role === "CANDIDATE" ? user.email : user.enterprise?.name}
              onError={handleImageError}
            />
            <label htmlFor="profile-upload" className="camera-icon">
              <FaCamera />
            </label>
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>

          {newPicture && !isPictureConfirmed && (
            <div className="confirm-cancel-container">
              <button className="confirm-button" onClick={handlePictureConfirm}>
                <FaCheckCircle /> Confirmer
              </button>
              <button className="cancel-button" onClick={handlePictureCancel}>
                <FaTimesCircle /> Annuler
              </button>
            </div>
          )}

          <h2 className="name">{user.name}</h2>
          {user.role === "CANDIDATE" ? (
            <p className="email">{user.email}</p>
          ) : (
            <p className="email">{user.enterprise?.name}</p>
          )}

          {/* Bouton pour modifier le profil */}
          <button className="edit-profile-button" onClick={handleEditProfile}>
            <FaCog /> Modifier le profil
          </button>
        </CardHeader>
        <CardContent className="card-body">
          <p className="role">{user.role}</p>

          {user.role === "CANDIDATE" && (
            <div className="card-content">
              <p>
                <strong>Disponibilité:</strong> {user.profile?.availability}
              </p>
              <div className="skills">
                <ul>
                  {user.profile?.skills?.map((skill, index) => (
                    <li key={index}>• {skill}</li>
                  ))}
                </ul>
              </div>
              <div className="experience">
                {Array.isArray(user.profile?.experience) ? (
                  user.profile.experience.length > 0 ? (
                    user.profile.experience.map((exp) => (
                      <div key={exp._id} className="experience-card">
                        <h4 className="text-lg font-bold">{exp.title}</h4>
                        <p>
                          <strong>Entreprise:</strong> {exp.company}
                        </p>
                        <p>
                          <strong>Durée:</strong> {exp.duration}
                        </p>
                        <p>{exp.description}</p>
                      </div>
                    ))
                  ) : (
                    <p>Aucune expérience disponible.</p>
                  )
                ) : (
                  <p>Aucune expérience enregistrée.</p>
                )}
              </div>

              <div className="upload-container">
                {hasValidResume ? (
                  // Si le CV est déjà téléchargé et valide, afficher seulement le lien
                  <p className="cv-link">
                    <a href={`http://localhost:3001${resumeUrl}`} target="_blank" rel="noopener noreferrer">
                      <FaFilePdf /> Check Resume
                    </a>
                  </p>
                ) : (
                  // Sinon, afficher les boutons de téléchargement
                  <>
                    <label className="upload-button">
                      {file ? (
                        <FaCheckCircle style={{ color: "green", marginRight: "10px" }} />
                      ) : (
                        <FaTimesCircle style={{ color: "red", marginRight: "10px" }} />
                      )}
                      {file ? file.name : "ADD RESUME"}
                      <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" hidden />
                    </label>
                    {file && (
                      <button className="upload-btn" onClick={handleFileUpload}>
                        <FaUpload /> Upload Resume
                      </button>
                    )}
                    {uploadStatus && (
                      <p
                        className={uploadStatus.includes("succès") ? "upload-success" : "upload-error"}
                      >
                        {uploadStatus.includes("succès") ? (
                          <FaCheckCircle style={{ marginRight: "10px" }} />
                        ) : (
                          <FaTimesCircle style={{ marginRight: "10px" }} />
                        )}
                        {uploadStatus}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {user.role === "ENTERPRISE" && (
            <div className="enterprise-details">
              <p>
                <strong>Name:</strong> {user.enterprise?.name}
              </p>
              <p>
                <strong>Adresse:</strong> {user.enterprise?.address}
              </p>
              <p>
                <strong>Site web:</strong> <a href={user.enterprise?.website} target="_blank" rel="noopener noreferrer">{user.enterprise?.website}</a>
              </p>
              <p>
                <strong>Description:</strong> {user.enterprise?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;