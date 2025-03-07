import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Card, CardHeader, CardContent, CardFooter } from "./card";
import { FaCamera, FaFilePdf, FaUpload } from "react-icons/fa";
import { useParams } from "react-router-dom";
import "./ProfilePage.css";
import Navbar from "../../layout/Navbar";

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
        setResumeUrl(data.resume || "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  const hasValidResume = resumeUrl && resumeUrl.trim() !== "";

  return (
    <div className="profile-page-container">
      <Navbar />

      {/* Hero Section */}
      <section className="profile-hero-section">
        <div className="profile-hero-overlay">
          <h1>Profile Details</h1>
          <p>Explore the futuristic profile of our valued member.</p>
        </div>
      </section>

      {/* Profile Card Section */}
      <section className="profile-main">
        <Card className="profile-card">
          <CardHeader className="profile-card-header">
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
            <p><strong>Disponibilité:</strong> {user.profile?.availability || "N/A"}</p>
            <div className="skills">
              {user.profile?.skills?.map((skill, index) => (
                <span key={index} className="skill">{skill}</span>
              ))}
            </div>
            <p><strong>Expérience:</strong> {user.profile?.experience?.length > 0 ? "Voir ci-dessous" : "Aucune expérience disponible."}</p>
          </CardContent>

          <CardFooter className="profile-card-footer">
            {hasValidResume ? (
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="futuristic-button">
                <FaFilePdf /> View Resume
              </a>
            ) : (
              <label htmlFor="resume-upload" className="futuristic-button">
                <FaUpload /> Add Resume
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
