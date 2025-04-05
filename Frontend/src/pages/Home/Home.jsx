import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Home.css";
import { useEffect, useState } from "react";
import axios from "axios";
import JobCard from "../Card/JobCard";

const Home = () => {
  const [jobOffers, setJobOffers] = useState([]);

  // Fetch jobs when page loads
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/jobs");
        setJobOffers(res.data);
      } catch (error) {
        console.error("❌ Failed to fetch jobs", error);
      }
    };
    fetchJobs();
  }, []);

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 4000,
    pauseOnHover: true,
    arrows: false,
  };

  return (
    <div className="home-container">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero_section">
        <div className="hero_overlay">
          <img src="images/hero-bg.png" alt="Background" className="hero_bg_img" />
          <div className="hero_content">
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

      {/* Carousel */}
      <section className="carousel_section">
        <div className="container">
          <h2 className="section-title">Our Platform in Action</h2>
          <Slider {...carouselSettings}>
            <div className="slide_item">
              <img src="images/slide1.jpg" alt="Slide 1" className="slide_img" />
              <div className="slide_caption">
                <h3>Advanced Matching Algorithms</h3>
                <p>Our AI seamlessly pairs top talent with your unique needs.</p>
              </div>
            </div>
            <div className="slide_item">
              <img src="images/slide1.jpg" alt="Slide 2" className="slide_img" />
              <div className="slide_caption">
                <h3>Streamlined Hiring Process</h3>
                <p>Minimize time-to-hire with our intuitive, data-driven platform.</p>
              </div>
            </div>
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

      {/* Job Offers Section */}
      <section className="job-cards-section container">
        <h2 className="section-title">Dernières Offres d'emploi</h2>
        {jobOffers.length > 0 ? (
          jobOffers.map((job) => (
            <JobCard key={job._id} job={job} />
          ))
        ) : (
          <p>Chargement des offres...</p>
        )}
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
