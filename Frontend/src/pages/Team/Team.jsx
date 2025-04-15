import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import {
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaInstagram,
  FaYoutube,
} from "react-icons/fa";


import "./Team.css";

const Team = () => {
  const teamMembers = [
    { name: "Yassin Nouri", role: "Marketing Head", img: "images/yassin.jpg" },
    { name: "Aziz Salmi", role: "Marketing Head", img: "images/team-2.jpg" },
    { name: "Hamouda chkir", role: "Marketing Head", img: "images/team-3.jpg" },
    { name: "Josephine Allard", role: "Marketing Head", img: "images/team-4.jpg" },
  ];

  return (
    <div className="team-container">
      {/* Futuristic Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="team-hero-section">
        <div className="team-hero-overlay">
          <img
            src="images/hero-bg.png"
            alt="Hero Background"
            className="team-hero-bg"
          />
          <div className="team-hero-content">
            <div className="team-hero-text-bg">
              <h1>Meet Our Team</h1>
              <p>
                The visionaries behind NextHire—driving innovation in recruitment.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Team Section */}
      <section className="team-main">
        <div className="team-heading">
          <h2 className="section-title">Our Dedicated Experts</h2>
          <p className="section-subtitle">
            Passionate professionals committed to connecting talent with opportunity.
          </p>
        </div>

        <div className="team-content-grid">
          {teamMembers.map((member, index) => (
            <div key={index} className="team-card glass-card">
              <div className="team-img-box">
                <img src={member.img} alt={member.name} />
              </div>
              <div className="team-detail-box">
                <h5>{member.name}</h5>
                <p>{member.role}</p>
              </div>
              <div className="team-social-box">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaFacebook />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaTwitter />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaYoutube />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Futuristic Footer */}
      <Footer />
    </div>
  );
};

export default Team;
