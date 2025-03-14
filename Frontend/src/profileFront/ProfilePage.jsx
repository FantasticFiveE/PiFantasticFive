import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Card, CardHeader, CardContent, CardFooter } from "./card";
import { FaCamera, FaFilePdf, FaUpload } from "react-icons/fa";
import { useParams } from "react-router-dom";
import "./ProfilePage.css";

const ProfilePage = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    fetch(`http://localhost:3001/Frontend/getUser/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setUser(data);
        setResumeUrl(data.profile?.resume || ""); // Ensure profile exists before accessing resume
        setLoading(false);
      })
      .catch((error) => {
        console.error("❌ Error loading user:", error);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <div className="error">User not found</div>;

  const hasValidResume = resumeUrl.trim() !== "";

  return (
    <div className="profile-page-container">
      <Navbar />

      {/* 🔹 Hero Section */}
      <section className="profile-hero-section">
        <div className="profile-hero-overlay">
          <h1>Profile Details</h1>
          <p>Explore the futuristic profile of our valued member.</p>
        </div>
      </section>

      {/* 🔹 Profile Card Section */}
      <section className="profile-main">
        <Card className="profile-card">
          <CardHeader className="profile-card-header">
            {/* Profile Image */}
            <div className="avatar-container">
              <img
                src={user.picture || "/images/default-avatar.png"}
                alt="Profile"
                className="avatar"
              />
              <label htmlFor="profile-upload" className="camera-icon">
                <FaCamera />
              </label>
              <input type="file" id="profile-upload" hidden />
            </div>

            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-email">{user.email}</p>
          </CardHeader>

          <CardContent className="profile-card-content">
            <p><strong>📅 Disponibilité:</strong> {user.profile?.availability || "N/A"}</p>
            
            {/* Skills Section */}
            <div className="skills">
              <p><strong>🛠️ Compétences:</strong></p>
              {user.profile?.skills && user.profile.skills.length > 0 ? (
                user.profile.skills.map((skill, index) => (
                  <span key={index} className="skill-badge">{skill}</span>
                ))
              ) : (
                <p>Aucune compétence renseignée</p>
              )}
            </div>

            {/* Experience Section */}
            <p><strong>🏢 Expérience:</strong></p>
            {user.profile?.experience && user.profile.experience.length > 0 ? (
              user.profile.experience.map((exp, idx) => (
                <div key={idx} className="experience-card">
                  <h4>{exp.title}</h4>
                  <p><strong>Entreprise:</strong> {exp.company}</p>
                  <p><strong>Durée:</strong> {exp.duration}</p>
                  <p>{exp.description}</p>
                </div>
              ))
            ) : (
              <p>Aucune expérience disponible.</p>
            )}
          </CardContent>

          <CardFooter className="profile-card-footer">
            {/* Resume Section */}
            {hasValidResume ? (
              <a href={`http://localhost:3001${resumeUrl}`} target="_blank" rel="noopener noreferrer" className="futuristic-button">
                <FaFilePdf /> Voir CV
              </a>
            ) : (
              <label htmlFor="resume-upload" className="futuristic-button">
                <FaUpload /> Ajouter CV
                <input type="file" id="resume-upload" hidden />
              </label>
            )}
          </CardFooter>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default ProfilePage;
