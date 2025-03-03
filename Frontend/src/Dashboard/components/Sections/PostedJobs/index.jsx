import React, { useEffect, useState } from "react";
import JobCard from "./JobCard";
import SectionHeader from "../SectionHeader";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

function PostedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // State for search term
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/jobs");
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

  // Filter jobs based on search term
  const filteredJobs = jobs.filter((job) =>
    job.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4 shadow mb-4">
      {/* Pass the viewAllPath and onSearch props to SectionHeader */}
      <SectionHeader
        title="Posted Jobs"
        viewAllPath="/dashboard/jobs"
        onSearch={(term) => setSearchTerm(term)}
      />
      <div className="row">
        {filteredJobs.map((job, idx) => (
          <div className="col-md-3 col-xs-6 p-1" key={job._id}>
            <JobCard jobDetail={job} id={idx} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PostedJobs;