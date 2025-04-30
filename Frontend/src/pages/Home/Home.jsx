import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import { io } from "socket.io-client";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Home.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLanguage,
  faLayerGroup,
  faChevronRight,
  faLocationDot,
  faMagnifyingGlass,
  faCirclePlay,
  faLightbulb
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

// ✅ Initialize Socket.IO outside the component
const socket = io("http://localhost:3001", {
  path: "/socket.io/",
  transports: ["websocket"]
});

const Home = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [contactName, setContactName] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const role = localStorage.getItem("role");

  useEffect(() => {
    fetchJobs();
    if (role === "ENTERPRISE") {
      fetchCandidates();
    }
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get("http://localhost:3001/Frontend/jobs");
      setJobs(res.data);
    } catch (error) {
      console.error("❌ Failed to fetch jobs:", error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/Frontend/all-candidates");
      setCandidates(res.data);
    } catch (error) {
      console.error("❌ Failed to fetch candidates:", error);
    }
  };

  const openContactModal = (candidate) => {
    setSelectedCandidate(candidate);
    setShowModal(true);
  };

  const handleSend = async () => {
    if (!contactName || !contactSubject || !contactMessage) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3001/api/messages/send", {
        senderName: contactName,
        subject: contactSubject,
        message: contactMessage,
        candidateId: selectedCandidate._id
      });

      if (response.data.success) {
        socket.emit("notify-candidate", {
          to: selectedCandidate._id,
          message: `📬 New message from ${contactName}: "${contactSubject}"`,
        });

        alert("Message sent!");
        setShowModal(false);
        setContactName("");
        setContactSubject("");
        setContactMessage("");
      } else {
        alert("Failed to send message.");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      alert("An error occurred while sending the message.");
    }
  };

  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {showModal && (
        <div className="side-panel-overlay" onClick={() => setShowModal(false)}>
          <div className="side-panel" onClick={(e) => e.stopPropagation()}>
          <div className="message-header">
          <img src={selectedCandidate?.picture || "/images/avatar-placeholder.png"} alt="Candidate" className="avatar-thumbnail" />
          <div>
            <h3>Message to {selectedCandidate?.name}</h3>
            <p className="muted-text">{selectedCandidate?.email}</p>
          </div>
        </div>

        <input
        type="text"
        placeholder="e.g. John Smith from HR Department"
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Subject: e.g. Let's Connect Regarding a Role"
        value={contactSubject}
        onChange={(e) => setContactSubject(e.target.value)}
      />
      <textarea
        placeholder="Write a clear, polite message. Mention why you're contacting them and what value you offer."
        value={contactMessage}
        onChange={(e) => setContactMessage(e.target.value)}
      ></textarea>


            <div className="side-panel-actions">
              <button onClick={handleSend}>Send</button>
              
              <button onClick={() => setShowModal(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="home-container">
        <Navbar />

        {/* Hero Section */}
        <section className="hero_section_clean elite">
          <svg className="hero_blob" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(300,300)">
              <path
                d="M120,-152C156,-115,182,-77,186,-38C190,1,171,41,147,84C123,127,94,172,55,182C16,193,-33,170,-76,143C-118,117,-154,86,-166,47C-178,7,-165,-41,-139,-89C-113,-137,-75,-186,-28,-192C19,-199,77,-164,120,-152Z"
                fill="#5b86e5"
                opacity="0.3"
              />
            </g>
          </svg>

          <div className="hero_shapes">
            <div className="circle circle1"></div>
            <div className="circle circle2"></div>
            <div className="blur_light"></div>
          </div>

          <div className="hero_wrapper">
            <motion.div
              className="hero_text_block"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <h1 className="hero_heading">
                Welcome to NextHire <br />
                <TypeAnimation
                  sequence={[
                    "Connecting Talent with Opportunity",
                    2000,
                    "Hire Smarter. Get Hired Faster.",
                    2000,
                    "Your Next Hire is Just One Click Away",
                    2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                  className="highlighted"
                  style={{ display: "inline-block" }}
                />
              </h1>
              <p className="hero_subtext">
                NextHire bridges the gap between top companies and ambitious professionals. Whether you're looking
                for your dream job or the perfect candidate — we've got you covered.
              </p>
              <motion.div
                className="hero_ctas"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <motion.a href="#contact" className="hero_btn pulse primary" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
                  <FontAwesomeIcon icon={faCirclePlay} style={{ color: "#ffffff" }} /> &nbsp; Get Started
                </motion.a>
                <motion.a href="#about" className="hero_btn secondary" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.95 }}>
                  <FontAwesomeIcon icon={faLightbulb} style={{ color: "#36d1dc" }} /> &nbsp; Learn More
                </motion.a>
              </motion.div>
            </motion.div>

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
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </div>
        </section>

        {/* Candidates Section */}
        {role === "ENTERPRISE" && (
          <section className="candidates_section">
            <div className="container">
              <h2 className="section-title clean">Recently Registered Candidates</h2>
              <div className="candidate-card-list">
                {candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <div key={candidate._id} className="candidate-card">
                      <div className="candidate-header">
                        <img
                          src={candidate.picture || "/images/avatar-placeholder.png"}
                          alt="Candidate"
                          className="candidate-avatar"
                        />
                        <h3>{candidate.name}</h3>
                        <p>{candidate.email}</p>
                      </div>
                      <div className="candidate-skills">
                        {candidate.profile?.skills?.slice(0, 4).map((skill, i) => (
                          <span key={i} className="candidate-skill">
                            {skill}
                          </span>
                        ))}
                      </div>
                      <div className="candidate-actions">
                        <Link to={`/candidate/${candidate._id}`} className="view-profile-link">
                          View Profile
                        </Link>
                        <button className="contact-btn" onClick={() => openContactModal(candidate)}>
                          Contact
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No candidates available.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Jobs Section */}
        <section className="jobs_section">
          <div className="container">
            <div className="job-section-header">
              <h2 className="section-title clean">Latest Job Offers</h2>
              <div className="job-search-bar modern">
                <div className="search-icon-wrapper">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
                </div>
                <input
                  type="text"
                  placeholder="Search by job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="button">Search</button>
              </div>
            </div>

            <div className="job-list">
              {jobs.length === 0 ? (
                <p>No job offers available yet.</p>
              ) : (
                filteredJobs.map((job) => (
                  <div key={job._id} className="job-card-home">
                    <div className="job-card-body">
                      <div className="job-card-header">
                        <div className="company-info">
                          <div className="company-logo">
                            <img src="/images/working.png" alt="Company Logo" />
                          </div>
                          <div className="company-details">
                            <span className="company-name">{job.entrepriseId?.enterprise?.name || "Unknown"}</span>
                            <span className="company-location">
                              <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: "5px" }} />
                              {job.location}
                            </span>
                          </div>
                        </div>
                      </div>
                      <h3 className="job-title">{job.title}</h3>
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

        <Footer />
      </div>
    </>
  );
};

export default Home;
