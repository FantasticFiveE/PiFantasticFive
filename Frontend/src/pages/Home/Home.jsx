import React from "react";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Home.css"; // Our updated style

const Home = () => {
  // Slick carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    arrows: false, // Hide previous/next arrows if you prefer a cleaner look
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero_section">
        <div className="hero_overlay">
          {/* Hero Background Image */}
          <img
            src="images/hero-bg.png"
            alt="Background"
            className="hero_bg_img"
          />
          
          <div className="hero_content">
            {/* New frosted background wrapper behind text */}
            <div className="hero_text_bg">
              <h1>Welcome to NextHire 2025</h1>
              <p>
                Revolutionizing recruitment with cutting-edge AI solutions.
                Find the perfect candidate or your dream job faster than ever!
              </p>
              <Link to="/login" className="hero_cta_btn">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Image Carousel Section */}
      <section className="carousel_section">
        <div className="container">
          <h2 className="section-title">Our Platform in Action</h2>
          <Slider {...carouselSettings}>
            {/* Slide 1 */}
            <div className="slide_item">
              <img src="images/slide1.jpg" alt="Slide 1" className="slide_img" />
              <div className="slide_caption">
                <h3>Advanced Matching Algorithms</h3>
                <p>Our AI seamlessly pairs top talent with your unique needs.</p>
              </div>
            </div>

            {/* Slide 2 */}
            <div className="slide_item">
              <img src="images/slide1.jpg" alt="Slide 2" className="slide_img" />
              <div className="slide_caption">
                <h3>Streamlined Hiring Process</h3>
                <p>
                  Minimize time-to-hire with our intuitive, data-driven platform.
                </p>
              </div>
            </div>

            {/* Slide 3 */}
            <div className="slide_item">
              <img src="images/slide1.jpg" alt="Slide 3" className="slide_img" />
              <div className="slide_caption">
                <h3>Global Talent Pool</h3>
                <p>Connect with candidates from around the world in seconds.</p>
              </div>
            </div>
          </Slider>
        </div>
      </section>

      {/* Featured Cards or Additional Info */}
      <section className="features_section">
        <div className="container">
          <h2 className="section-title">Key Features</h2>
          <div className="features_grid">
            <div className="feature_card">
              <img src="images/feature2.png" alt="Feature 1" />
              <h4>AI-Powered Screening</h4>
              <p>
                Let our algorithms handle the heavy lifting to filter out the
                best candidates for your role.
              </p>
            </div>
            <div className="feature_card">
              <img src="images/feature2.png" alt="Feature 2" />
              <h4>Smart Analytics</h4>
              <p>
                Gain real-time insights into hiring trends, candidate performance,
                and more.
              </p>
            </div>
            <div className="feature_card">
              <img src="images/feature2.png" alt="Feature 3" />
              <h4>Seamless Collaboration</h4>
              <p>
                Work with your entire team in one centralized platform for
                effective decision-making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
