import React, { useEffect, useState } from "react";
import SectionHeader from "../SectionHeader";

function CandidateStatus() {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        // Fetch users data
        const usersResponse = await fetch("http://localhost:3001/api/users");
        const usersData = await usersResponse.json();

        // Fetch jobs data to map jobId to job title
        const jobsResponse = await fetch("http://localhost:3001/api/jobs");
        const jobsData = await jobsResponse.json();
        const jobMap = jobsData.reduce((acc, job) => {
          acc[job._id] = job.title; // Map job ID to job title
          return acc;
        }, {});

        // Filter candidates (role === "CANDIDATE")
        const candidateData = usersData.filter((user) => user.role === "CANDIDATE");

        // Transform backend data into the format expected by the table
        const transformedRows = candidateData.map((candidate) => {
          const jobApplication = candidate.applications && candidate.applications[0]; // Get the first application
          const interview = candidate.interviews && candidate.interviews[0]; // Get the first interview
          const experience = (candidate.profile && candidate.profile.experience && candidate.profile.experience[0] && candidate.profile.experience[0].title) || "N/A"; // Get experience title or fallback
          const skills = (candidate.profile && candidate.profile.skills && candidate.profile.skills.join(", ")) || "N/A"; // Get skills as a comma-separated string or fallback

          // Check if the application is approved and the interview is completed
          const isInterviewCompleted = interview && interview.status === "Completed";
          const interviewDate = isInterviewCompleted && interview.date && interview.date.$date ? new Date(interview.date.$date).toLocaleDateString() : "N/A";

          return {
            name: candidate.name || candidate.email, // Use name if available, otherwise fallback to email
            jobName: (jobApplication && jobApplication.jobId && jobMap[jobApplication.jobId]) || "N/A", // Map job ID to job title
            applicationStatus: (jobApplication && jobApplication.status) || "N/A", // Get application status or fallback
            interviewDate, // Format interview date or fallback
            interviewStatus: (interview && interview.status) || "Pending", // Get interview status or fallback
            skills, // Skills as a comma-separated string
            experience, // Experience title
          };
        });

        setRows(transformedRows);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    };

    fetchCandidates();
  }, []);

  // Filter rows based on search term
  const filteredRows = rows.filter((row) =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.skills.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 shadow mb-4 candidate-status-container">
      {/* Pass searchTerm and setSearchTerm to SectionHeader */}
      <SectionHeader
        title="Candidate Status"
        viewAllPath="/dashboard/manage-candidates"
        onSearch={(term) => setSearchTerm(term)}
      />
      <div className="candidate-status-table">
        <TableComponent rows={filteredRows} />
      </div>
    </div>
  );
}

export default CandidateStatus;

const TableComponent = ({ rows }) => {
  return (
    <table className="table table-hover">
      <thead className="table-header">
        <tr>
          <th>Name</th>
          <th>Applied Job</th>
          <th>Application Status</th>
          <th>Interview Date</th>
          <th>Interview Status</th>
          <th>Skills</th>
          <th>Experience</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index} className="table-row">
            <td className="text-left">{row.name}</td>
            <td className="text-left">{row.jobName}</td>
            <td className="text-center">
              <span className={`status-badge ${row.applicationStatus.toLowerCase()}`}>
                {row.applicationStatus}
              </span>
            </td>
            <td className="text-center">{row.interviewDate}</td>
            <td className="text-center">
              <span className={`status-badge ${row.interviewStatus.toLowerCase()}`}>
                {row.interviewStatus}
              </span>
            </td>
            <td className="text-left">{row.skills}</td>
            <td className="text-left">{row.experience}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};