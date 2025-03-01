import React, { useEffect, useState } from "react";
import JobCard from "./JobCard";
import SectionHeader from "../SectionHeader";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

function PostedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/jobs");
        console.log("API Response:", response.data);

        // Transform the API response to match JobCard's expected structure
        const transformedJobs = response.data.map((job) => ({
          _id: job._id,
          role: job.title, // Map title to role
          applicants: job.applicants || 0, // Number of applicants
          percentage_inc: 0, // Placeholder for percentage increase
          last_updated: "N/A", // Placeholder for last updated
        }));

        setJobs(transformedJobs);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 shadow mb-4">
      <SectionHeader title="Posted Jobs" />
      <div className="row">
        {jobs.map((job, idx) => (
          <div className="col-md-3 col-xs-6 p-1" key={job._id}>
            <JobCard jobDetail={job} id={idx} />
          </div>
        ))}
      </div>
      {/* Add a "View All" button */}
   
    </div>
  );
}

export default PostedJobs;