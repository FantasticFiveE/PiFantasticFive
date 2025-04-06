import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Home.css";

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

      {/* ✅ Jobs Section */}
      <section className="jobs_section">
        <div className="container">
          <h2 className="section-title">🔍 Latest Job Offers</h2>

          <div className="job-list">
            {jobs.length === 0 ? (
              <p>No job offers available yet.</p>
            ) : (
              jobs.map((job) => (
                <div key={job._id} className="job-card">
                  <h3>{job.title}</h3>
                  <p><strong>Description:</strong> {job.description?.slice(0, 80)}...</p>
                  <p><strong>📍 Location:</strong> {job.location}</p>
                  <p><strong>💰 Salary:</strong> {job.salary} €</p>
                  <p><strong>🗣️ Languages:</strong> {job.languages || "Not specified"}</p>
                  <p><strong>🛠️ Skills:</strong> {job.skills || "Not specified"}</p>
                  <Link to={`/job/${job._id}`} className="see-more-btn">See More</Link>
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
