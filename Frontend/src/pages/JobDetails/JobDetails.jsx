import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/Navbar/Navbar";
import Footer from "../../components/Footer/Footer";
import axios from "axios";
import {
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaBriefcase,
  FaTools,
  FaLanguage,
} from "react-icons/fa";
import "./JobDetails.css";

const JobDetails = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/Frontend/jobs/${id}`);
        setJob(res.data);
      } catch (err) {
        console.error("❌ Failed to fetch job details", err);
      }
    };
    fetchJob();
  }, [id]);

  if (!job) return <div className="loading">Loading...</div>;

  return (
    <div>
      <Navbar />
      <div className="job-details-container">
        <div className="job-card-expanded">
          <h2 className="job-title-centered">{job.title}</h2>

          <div className="job-info">
            <p><FaBriefcase className="icon" /> <strong>Description:</strong> {job.description}</p>
            <p><FaMapMarkerAlt className="icon" /> <strong>Location:</strong> {job.location}</p>
            <p><FaMoneyBillWave className="icon" /> <strong>Salary:</strong> {job.salary} €</p>
            <p><FaCalendarAlt className="icon" /> <strong>Posted on:</strong> {new Date(job.createdAt).toLocaleDateString()}</p>
 
            {Array.isArray(job.skills) && job.skills.length > 0 && (
              <p><FaTools className="icon" /> <strong>Skills needed:</strong> {job.skills.join(", ")}</p>
            )}

            {Array.isArray(job.languages) && job.languages.length > 0 && (
              <p><FaLanguage className="icon" /> <strong>Languages:</strong> {job.languages.join(", ")}</p>
            )}
          </div>

          <div className="apply-section">
            <button className="apply-btn">📩 Apply now</button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default JobDetails;
