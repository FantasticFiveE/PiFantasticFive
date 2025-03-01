import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer"; // Update path if in a different folder
import "./Service.css";          // Futuristic/Glassmorphism styling

const Service = () => {
  return (
    <div className="service-container">
      {/* Futuristic Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="service-hero-section">
        <div className="service-hero-overlay">
          <img
            src="images/hero-bg.png"
            alt="Service Hero Background"
            className="service-hero-bg"
          />
          <div className="service-hero-content">
            <div className="service-hero-text-bg">
              <h1>Our Services</h1>
              <p>
                Discover how we can help your business grow—fast, efficiently,
                and effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Services Content */}
      <section className="service-main">
        <div className="service-heading">
          <h2 className="section-title">What We Offer</h2>
          <p className="section-subtitle">
            Futuristic solutions for modern recruitment challenges.
          </p>
        </div>

        <div className="service-content-grid">
          {/* Glass Card #1 */}
          <div className="glass-card">
            <h3>AI-Powered Matching</h3>
            <p>
              Leverage advanced algorithms to connect top talent with your
              unique business needs in record time.
            </p>
          </div>

          {/* Glass Card #2 */}
          <div className="glass-card">
            <h3>End-to-End Consulting</h3>
            <p>
              From sourcing to onboarding, our experts ensure a seamless
              hiring process for both candidates and employers.
            </p>
          </div>

          {/* Glass Card #3 */}
          <div className="glass-card">
            <h3>Employer Branding</h3>
            <p>
              Stand out in the market by building a compelling brand that
              attracts and retains top professionals.
            </p>
          </div>
        </div>

        {/* Optional Extra Section (Testimonals, Additional Services, etc.) */}
        <div className="service-extra">
          <h2 className="section-title">Why Partner With Us?</h2>
          <p className="section-subtitle">
            Our track record of successful placements and satisfied clients
            speaks for itself.
          </p>
          <div className="extra-cards">
            <div className="extra-card glass-card">
              <h4>Global Reach</h4>
              <p>Access a worldwide pool of skilled candidates and top employers.</p>
            </div>
            {/* Add more extra cards if needed */}
          </div>
        </div>
      </section>

      {/* Futuristic Footer */}
      <Footer />
    </div>
  );
};

export default Service;
