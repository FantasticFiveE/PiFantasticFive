import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";// Adjust path if Footer is in a different folder
import "./About.css";           // Import your new About.css

const About = () => {
  return (
    <div className="about-container">
      {/* Futuristic Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="about-hero-section">
        <div className="about-hero-overlay">
          <img
            src="images/hero-bg.png"
            alt="Hero Background"
            className="about-hero-bg"
          />
          <div className="about-hero-content">
            <div className="about-hero-text-bg">
              <h1>About NEXTHIRE</h1>
              <p>
                Welcome to NEXTHIRE, your trusted recruitment partner—connecting
                top talent with leading companies worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main About Content */}
      <section className="about-main">
        <div className="about-heading">
          <h2 className="section-title">Our Mission</h2>
          <p className="section-subtitle">
            Revolutionizing recruitment with AI-driven solutions.
          </p>
        </div>

        <div className="about-content-grid">
          {/* Glass Card 1 */}
          <div className="glass-card">
            <h3>Who We Are</h3>
            <p>
              We’re a team of innovators dedicated to making hiring seamless and
              empowering job seekers to reach their full potential. 
            </p>
          </div>

          {/* Glass Card 2 */}
          <div className="glass-card">
            <h3>Global Impact</h3>
            <p>
              Our platform serves organizations around the globe, matching unique
              skill sets to diverse business needs, all through data-driven AI.
            </p>
          </div>

          {/* Glass Card 3 */}
          <div className="glass-card">
            <h3>Why Choose Us?</h3>
            <p>
              From advanced matching algorithms to real-time analytics, our
              cutting-edge technology ensures the perfect fit for every role.
            </p>
          </div>
        </div>

        {/* Optional "About Extra" Section (Team, etc.) */}
        <div className="about-extra">
          <h2 className="section-title">Meet Our Team</h2>
          <p className="section-subtitle">Passionate experts behind NEXTHIRE.</p>
          <div className="team-cards">
            <div className="team-card glass-card">
              <img src="images/team1.jpg" alt="Team Member" />
              <h4>Jane Doe</h4>
              <p>CEO & AI Visionary</p>
            </div>
            {/* Add more team cards if needed */}
          </div>
        </div>
      </section>

      {/* Futuristic Footer */}
      <Footer />
    </div>
  );
};

export default About;
