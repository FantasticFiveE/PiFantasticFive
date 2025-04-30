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
  faLightbulb,
  faStar
} from "@fortawesome/free-solid-svg-icons";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";

const socket = io("http://localhost:3001", {
  path: "/socket.io/",
  transports: ["websocket"]
});

const Home = () => {
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [contactName, setContactName] = useState("");
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const role = localStorage.getItem("role");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobsRes = await axios.get("http://localhost:3001/Frontend/jobs");
        setJobs(jobsRes.data);

        if (role === "ENTERPRISE") {
          const candidatesRes = await axios.get("http://localhost:3001/api/Frontend/all-candidates");
          setCandidates(candidatesRes.data);
        }

        const token = localStorage.getItem("token");
        if (token) {
          setRecommendationsLoading(true);
          try {
            const recRes = await axios.get(
              "http://localhost:3001/api/recommendations/for-user",
              { 
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
              }
            );
            
            let recommendationsData = [];
            if (Array.isArray(recRes.data)) {
              recommendationsData = recRes.data;
            } else if (recRes.data && recRes.data.recommendations) {
              recommendationsData = recRes.data.recommendations;
            } else if (recRes.data && Array.isArray(recRes.data.jobs)) {
              recommendationsData = recRes.data.jobs.map(job => ({
                ...job,
                match_score: job.score || 0
              }));
            }

            const transformedRecs = recommendationsData.map(rec => {
              const jobData = rec.job || rec;
              return {
                ...jobData,
                match_score: rec.score || rec.match_score || 0
              };
            });

            setRecommendations(transformedRecs);
          } catch (recError) {
            console.error("Error fetching recommendations:", recError);
            setRecommendationsError("Failed to load recommendations. Please try again later.");
          } finally {
            setRecommendationsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [role]);

  const filteredJobs = jobs.filter((job) =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRecommendations = recommendations.filter((job) =>
    job.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      console.error("Error sending message:", error);
      alert("An error occurred while sending the message.");
    }
  };

  const renderJobCard = (job, isRecommended = false) => (
    <div key={job._id || job.id} className="job-card-home">
      {isRecommended && (job.match_score || job.score) && (
        <div className="recommendation-badge">
          <FontAwesomeIcon icon={faStar} />
          <span>{Math.round((job.match_score || job.score) * 100)}% Match</span>
        </div>
      )}
      
      <div className="job-card-body">
        <div className="job-card-header">
          <div className="company-info">
            <div className="company-logo">
              <img 
                src={job.entrepriseId?.picture || job.company?.logo || "/images/working.png"} 
                alt="Company Logo" 
                onError={(e) => {
                  e.target.src = "/images/working.png";
                }}
              />
            </div>

            <div className="company-details">
              <span className="company-name">
                {job.entrepriseId?.enterprise?.name || 
                 job.entrepriseId?.name || 
                 job.company?.name || 
                 "Unknown Company"}
              </span>
              <span className="company-location">
                <FontAwesomeIcon icon={faLocationDot} style={{ marginRight: "5px" }} />
                {job.location || "Remote"}
              </span>
            </div>
          </div>
          <div className="job-bookmark">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
        </div>

        <h3 className="job-title">{job.title || "Untitled Position"}</h3>

        {(job.skills?.length > 0 || job.languages?.length > 0 || job.tags?.length > 0) && (
          <div className="job-tags">
            {(job.skills || job.tags || []).slice(0, 3).map((skill, index) => (
              <span key={`skill-${index}`} className="job-tag skill">
                <FontAwesomeIcon icon={faLayerGroup} style={{ marginRight: "5px" }} />
                {typeof skill === 'string' ? skill : skill.name}
              </span>
            ))}
            {(job.languages || []).slice(0, 2).map((language, index) => (
              <span key={`lang-${index}`} className="job-tag language">
                <FontAwesomeIcon icon={faLanguage} style={{ marginRight: "5px" }} />
                {typeof language === 'string' ? language : language.name}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="job-card-footer">
        <span className="job-salary">
          {job.salary ? `${job.salary}€` : "Competitive"} <span className="job-salary-period">/Month</span>
        </span>

        <Link to={`/job/${job._id || job.id}`} className="apply-btn-home">
          Apply Now <FontAwesomeIcon icon={faChevronRight} />
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

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

        <section className="hero_section_clean elite">
          <svg className="hero_blob" viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(300,300)">
              <path d="M120,-152C156,-115,182,-77,186,-38C190,1,171,41,147,84C123,127,94,172,55,182C16,193,-33,170,-76,143C-118,117,-154,86,-166,47C-178,7,-165,-41,-139,-89C-113,-137,-75,-186,-28,-192C19,-199,77,-164,120,-152Z" fill="#5b86e5" opacity="0.3" />
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

        <section className="jobs_section">
          <div className="container">
            <div className="job-section-header">
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

            {localStorage.getItem("token") && (
              <div className="recommendations-section">
                <h2 className="section-title clean">
                  Recommended For You
                  {recommendationsLoading && (
                    <span className="loading-text">Loading...</span>
                  )}
                </h2>
                {recommendationsError && (
                  <div className="recommendation-error-message">
                    {recommendationsError}
                  </div>
                )}
                
                <div className="job-list">
                  {recommendationsLoading ? (
                    <div className="loading-container">
                      <div className="loading-spinner"></div>
                    </div>
                  ) : filteredRecommendations.length === 0 ? (
                    <div className="no-jobs-message">
                      {recommendationsError || "No recommendations available. Complete your profile for better matches."}
                    </div>
                  ) : (
                    filteredRecommendations.map(job => renderJobCard(job, true))
                  )}
                </div>
              </div>
            )}

            <div className="latest-jobs-section">
              <h2 className="section-title clean">Latest Job Offers</h2>
              <div className="job-list">
                {filteredJobs.length === 0 ? (
                  <div className="no-jobs-message">
                    No job offers match your search criteria.
                  </div>
                ) : (
                  filteredJobs.map(job => renderJobCard(job))
                )}
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Home;