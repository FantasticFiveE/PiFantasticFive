import { useEffect, useState, useRef } from "react";
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
  const fileInputRef = useRef(null); // ✅ File input reference

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState("");
  const [picture, setPicture] = useState(null);
  const [newPicture, setNewPicture] = useState(null);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [pictureStatus, setPictureStatus] = useState(""); // ✅ Picture upload status

  useEffect(() => {
    fetch(`http://localhost:3001/Frontend/getUser/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setResumeUrl(data.profile?.resume || ""); // ✅ Fetch existing CV
        setPicture(data.picture || "/images/team-1.jpg"); // ✅ Load existing profile picture
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading user:", err);
        setLoading(false);
      });
  }, [id]);

  const handleEditProfile = () => navigate(`/edit-profile/${id}`);

  // ✅ Open file selector
  const handleCameraClick = () => {
    fileInputRef.current.click();
  };

  // ✅ Handle profile picture selection and preview
  const handlePictureChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPicture(reader.result); // ✅ Show preview
    };
    reader.readAsDataURL(selectedFile);

    setFile(selectedFile);
  };

  // ✅ Confirm and upload new profile picture
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

      setPicture(data.pictureUrl); // ✅ Update profile picture after upload
      setNewPicture(null);
      setFile(null);
      setPictureStatus("✔️ Profile picture updated successfully!");
    } catch (err) {
      console.error("❌ Error uploading picture:", err);
      setPictureStatus("❌ Upload failed. Try again.");
    }
  };

  // ✅ Cancel profile picture change
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
    } catch (err) {
      setUploadStatus("Error uploading CV.");
      console.error(err);
    }
  };

  if (loading) return <Skeleton className="w-full h-64" />;
  if (!user) return <p className="text-center text-red-500">User not found.</p>;

  return (
    <>
      <Navbar /> {/* 🏠 Navbar */}

      <div className="profile-container">
        <Card className="card">
          <CardHeader className="card-header">
            {/* 🖼️ Profile Picture */}
            <div className="avatar-container">
              <img
                src={newPicture || `http://localhost:3001${user.picture}`} // ✅ Preview or current image
                className="avatar"
                alt="Profile Picture"
              />
              <label className="camera-icon" onClick={handleCameraClick}>
                <FaCamera />
              </label>
              <input
                type="file"
                ref={fileInputRef} // ✅ File input reference
                className="hidden-input"
                onChange={handlePictureChange}
                accept="image/*"
                style={{ display: "none" }} // Hidden
              />
            </div>

            {/* ✅ Picture Upload Status Message */}
            {pictureStatus && (
              <p className={pictureStatus.includes("✔️") ? "upload-success" : "upload-error"}>
                {pictureStatus}
              </p>
            )}

            {/* ✅ Picture Confirmation Buttons */}
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
            <p className="email">{user.email}</p>
            <p className="phone"><strong>📞 Phone:</strong> {user.profile.phone || "Not provided"}</p>
            

            <button className="edit-profile-button" onClick={handleEditProfile}>
              <FaCog /> Edit Profile
            </button>
          </CardHeader>

          <CardContent className="card-body">
            <p className="role">{user.role}</p>

            {/* 🛠️ Skills */}
            <div className="skills">
              <p><strong>🛠️ Skills:</strong></p>
              {user.profile?.skills.length > 0 ? (
                user.profile.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">{skill}</span>
                ))
              ) : (
                <p>Not provided</p>
              )}
            </div>

            {/* 🌍 Languages */}
            <div className="languages">
              <p><strong>🌍 Languages:</strong></p>
              {user.profile?.languages.length > 0 ? (
                user.profile.languages.map((language, index) => (
                  <span key={index} className="language-badge">{language}</span>
                ))
              ) : (
                <p>Not provided</p>
              )}
            </div>

            {/* 📄 Experience */}
            <p><strong>📄 Experience:</strong> {user.profile?.experience || "Not provided"}</p>

            {/* 📂 CV */}
            <div className="upload-container">
              {resumeUrl ? (
                <p className="cv-link">
                  <a href={`http://localhost:3001${resumeUrl}`} target="_blank" rel="noopener noreferrer">
                    <FaFilePdf /> View CV
                  </a>
                </p>
              ) : (
                <>
                  <label className="upload-button">
                    <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" hidden />
                    <FaUpload /> Upload CV
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
          </CardContent>
        </Card>
      </div>

      <Footer /> {/* 📜 Footer */}
    </>
  );
};

export default Profile;
