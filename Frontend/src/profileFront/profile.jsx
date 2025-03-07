import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "./card";
import { Avatar } from "./avatar";
import { Skeleton } from "./skeleton";
import "./Profile.css";
import { FaCamera, FaCheckCircle, FaTimesCircle, FaUpload, FaFilePdf, FaCog } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setResumeUrl(data.resume || "");
        setPicture(data.picture || "/images/team-1.jpg");
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading user:", err);
        setLoading(false);
      });
  }, [id]);

  const handleEditProfile = () => navigate(`/edit-profile/${id}`);

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
      setUploadStatus("Resume uploaded successfully!");
      setFile(null);
    } catch (err) {
      setUploadStatus("Error uploading resume.");
      console.error(err);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPicture(reader.result);
      setIsPictureConfirmed(false);
    };
    reader.readAsDataURL(file);

    setFile(file);
  };

  const handlePictureConfirm = async () => {
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
      setIsPictureConfirmed(true);
      setNewPicture(null);
      setFile(null);
    } catch (err) {
      console.error("Error uploading image:", err);
    }
  };

  const handlePictureCancel = () => {
    setNewPicture(null);
    setIsPictureConfirmed(false);
  };

  const handleImageError = () => {
    setPictureError(true);
  };

  if (loading) return <Skeleton className="w-full h-64" />;
  if (!user) return <p className="text-center text-red-500">User not found.</p>;

  const pictureSrc = !picture || pictureError ? "/images/team-1.jpg" : `http://localhost:3001${picture}`;

  return (
    <>
      <Navbar />

      <div className="profile-container">
        <Card className="card">
          <CardHeader className="card-header">
            <div className="avatar-container">
              <Avatar
                className="avatar"
                src={isPictureConfirmed ? pictureSrc : newPicture || pictureSrc}
                alt={user.name}
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
                  <FaCheckCircle /> Confirm
                </button>
                <button className="cancel-button" onClick={handlePictureCancel}>
                  <FaTimesCircle /> Cancel
                </button>
              </div>
            )}

            <h2 className="name">{user.name}</h2>
            <p className="email">{user.email}</p>
            <button className="edit-profile-button" onClick={handleEditProfile}>
              <FaCog /> Edit Profile
            </button>
          </CardHeader>

          <CardContent className="card-body">
            <p className="role">{user.role}</p>

            {user.role === "CANDIDATE" && (
              <>
                <p><strong>Availability:</strong> {user.profile?.availability}</p>
                <div className="skills">
                  {user.profile?.skills.map((skill, index) => (
                    <span key={index} className="skill-badge">{skill}</span>
                  ))}
                </div>
                {user.profile?.experience?.map((exp, idx) => (
                  <div key={idx} className="experience-card">
                    <h4>{exp.title}</h4>
                    <p><strong>Company:</strong> {exp.company}</p>
                    <p><strong>Duration:</strong> {exp.duration}</p>
                    <p>{exp.description}</p>
                  </div>
                ))}
                <div className="upload-container">
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
                      {uploadStatus && <p>{uploadStatus}</p>}
                    </>
                  )}
                </div>
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
