import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";  // Adjust path if Footer is in a different folder
import "./Why.css";             // We'll create a new CSS file mirroring About.css

const Why = () => {
  return (
    <div className="why-container">
      {/* Futuristic Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="why-hero-section">
        <div className="why-hero-overlay">
          <img
            src="images/hero-bg.png"
            alt="Hero Background"
            className="why-hero-bg"
          />
          <div className="why-hero-content">
            <div className="why-hero-text-bg">
              <h1>Why Choose NEXTHIRE?</h1>
              <p>
                Discover the key advantages that make us your perfect recruitment partner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Why Content */}
      <section className="why-main">
        <div className="why-heading">
          <h2 className="section-title">Why Us?</h2>
          <p className="section-subtitle">
            Unleashing AI-driven solutions for seamless, effective hiring.
          </p>
        </div>

        <div className="why-content-grid">
          {/* Glass Card 1 */}
          <div className="glass-card">
            <h3>Proven Expertise</h3>
            <p>
              Our team boasts years of experience in recruitment, building strong
              connections with industry-leading companies and candidates worldwide.
            </p>
          </div>

          {/* Glass Card 2 */}
          <div className="glass-card">
            <h3>Cutting-Edge Technology</h3>
            <p>
              We harness AI and data-driven insights to match top talent with
              organizations, accelerating the hiring process without compromising quality.
            </p>
          </div>

          {/* Glass Card 3 */}
          <div className="glass-card">
            <h3>Personalized Support</h3>
            <p>
              From start to finish, we’re here to guide you, ensuring a tailor-made
              hiring experience that meets your unique needs.
            </p>
          </div>
        </div>

        {/* Optional Extra Section */}
        <div className="why-extra">
          <h2 className="section-title">Our Commitment</h2>
          <p className="section-subtitle">
            We strive to create lasting partnerships between employers and candidates.
          </p>
          <div className="extra-cards">
            <div className="extra-card glass-card">
              <h4>Long-Term Growth</h4>
              <p>We’re dedicated to sustainable success for both businesses and job seekers.</p>
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

export default Why;
