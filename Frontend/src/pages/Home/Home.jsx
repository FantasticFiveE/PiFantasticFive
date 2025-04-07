import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Home.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLanguage, faLayerGroup, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";

import { motion } from "framer-motion";
import { TypeAnimation } from 'react-type-animation';
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { faCirclePlay } from "@fortawesome/free-solid-svg-icons";
import { faLightbulb } from "@fortawesome/free-solid-svg-icons";




const Home = () => {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get("http://localhost:3001/Frontend/jobs");
      setJobs(res.data);
    } catch (error) {
      console.error("❌ Erreur récupération jobs:", error);
    }
  };

  return (
    <div className="home-container">
      {/* ✅ Navbar */}
      <Navbar />


<section className="hero_section_clean elite">
  {/* 🎨 SVG Blob Behind Image */}
  <svg className="hero_blob" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(300,300)">
      <path d="M120,-152C156,-115,182,-77,186,-38C190,1,171,41,147,84C123,127,94,172,55,182C16,193,-33,170,-76,143C-118,117,-154,86,-166,47C-178,7,-165,-41,-139,-89C-113,-137,-75,-186,-28,-192C19,-199,77,-164,120,-152Z" fill="#5b86e5" opacity="0.3" />
    </g>
  </svg>

  {/* 🔵 Decorative Background Elements */}
  <div className="hero_shapes">
    <div className="circle circle1"></div>
    <div className="circle circle2"></div>
    <div className="blur_light"></div>
  </div>

  <div className="hero_wrapper">
    {/* ✅ Left Side Content */}
    <motion.div
      className="hero_text_block"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <h1 className="hero_heading">
        Welcome to NextHire <br />
        <TypeAnimation
          sequence={[
            'Connecting Talent with Opportunity', 2000,
            'Hire Smarter. Get Hired Faster.', 2000,
            'Your Next Hire is Just One Click Away', 2000,
          ]}
          wrapper="span"
          speed={50}
          repeat={Infinity}
          className="highlighted"
          style={{ display: 'inline-block' }}
        />
      </h1>

      <p className="hero_subtext">
      NextHire bridges the gap between top companies and ambitious professionals. Whether you're looking for 
      your dream job or the perfect candidate — we've got you covered.
      </p>

      <motion.div
        className="hero_ctas"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.a
          href="#contact"
          className="hero_btn pulse primary"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
        >
          <FontAwesomeIcon icon={faCirclePlay} style={{ color: "#ffffff" }} />
          &nbsp; Get Started
        </motion.a>

        <motion.a
          href="#about"
          className="hero_btn secondary"
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
        >
            <FontAwesomeIcon icon={faLightbulb} style={{ color: "#36d1dc" }} />
            &nbsp; Learn More
        </motion.a>
      </motion.div>
    </motion.div>

    {/* ✅ Right Side Image */}
    <motion.div
      className="hero_image_block"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6, duration: 1 }}
    >
      <motion.img
        src="/images/hero2_img.png"
        alt="Hero visual"
        className="hero_main_img"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </motion.div>
  </div>
</section>




      {/* ✅ Jobs Section */}
      <section className="jobs_section">
        <div className="container">
        <div className="job-section-header">
  <h2 className="section-title clean">Latest Job Offers</h2>
  <div className="job-search-bar modern">
    <div className="search-icon-wrapper">
    <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
    </div>
    <input type="text" placeholder="Search by job title..." />
    <button type="button">Search</button>
  </div>
</div>


          <div className="job-list">
            {jobs.length === 0 ? (
              <p>No job offers available yet.</p>
            ) : (
              jobs.map((job) => (
                <div key={job._id} className="job-card-home">
                  
                  {/* ✅ Content Area */}
                  <div className="job-card-body">
                    <div className="job-card-header">
                      <div className="company-info">
                      <div className="company-logo">
                        <img src="/images/working.png" alt="Company Logo" />
                      </div>

                        <div className="company-details">
                          <span className="company-name">
                            {job.entrepriseId?.enterprise?.name || "Unknown"}
                          </span>
                          <span className="company-location">
                            <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: "5px" }} />
                            {job.location}
                          </span>

                        </div>
                      </div>
                      <div className="job-bookmark">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                    </div>

                    <h3 className="job-title">{job.title}</h3>
                   {/*  <p className="job-description">{job.description?.slice(0, 80)}...</p>*/}

                    {(job.skills?.length > 0 || job.languages?.length > 0) && (
                      <div className="job-tags">
                        {job.skills?.slice(0, 3).map((skill, index) => (
                          <span key={index} className="job-tag skill">
                            <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: "5px" }} />
                            {skill}
                          </span>
                        ))}
                        {job.languages?.slice(0, 2).map((language, index) => (
                          <span key={`lang-${index}`} className="job-tag language">
                            <FontAwesomeIcon icon={faLanguage} style={{ marginRight: "5px" }} />
                            {language}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ✅ Footer Area */}
                  <div className="job-card-footer">
                  <span className="job-salary">
                    {job.salary}€ <span className="job-salary-period">/Month</span>
                  </span>

                    <Link to={`/job/${job._id}`} className="apply-btn-home">
                      Apply Now <FontAwesomeIcon icon={faChevronRight} />
                    </Link>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ✅ Footer */}
      <Footer />
    </div>
  );
};

export default Home;
