import React, { useEffect, useState } from "react";
import SectionHeader from "../SectionHeader";

function CandidateStatus() {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false); // Loading state for handling fetch

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true); // Start loading

        const usersResponse = await fetch("http://localhost:3001/api/users");
        const usersData = await usersResponse.json();

        // Log the usersData to check its structure
        console.log("usersData:", usersData);

        // Check if usersData is an array before filtering
        if (!Array.isArray(usersData)) {
          throw new Error("usersData is not an array");
        }

        const jobsResponse = await fetch("http://localhost:3001/api/jobs");
        const jobsData = await jobsResponse.json();

        // Create a mapping of jobId to job title
        const jobMap = jobsData.reduce((acc, job) => {
          acc[job._id] = job.title;
          return acc;
        }, {});

        // Filter candidates only
        const candidates = usersData.filter(user => user.role === "CANDIDATE");

        // Transform the candidate data
        const transformed = candidates.map(candidate => {
          const application = candidate.applications?.[0];
          const interview = candidate.interviews?.[0];
          const experience = candidate.profile?.experience?.[0]?.title || "N/A";
          const skills = candidate.profile?.skills?.join(", ") || "N/A";

          const interviewDate =
            interview?.status === "Completed" && interview.date?.$date
              ? new Date(interview.date.$date).toLocaleDateString()
              : "N/A";

          return {
            name: candidate.name || candidate.email,
            jobName: jobMap[application?.jobId] || "N/A",
            applicationStatus: application?.status || "N/A",
            interviewDate,
            interviewStatus: interview?.status || "Pending",
            skills,
            experience,
          };
        });

        // Update state with transformed data
        setRows(transformed);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      } finally {
        setLoading(false); // End loading
      }
    };

    fetchCandidates();
  }, []);

  // Filter rows based on search term
  const filteredRows = rows.filter(row =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.skills.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 shadow mb-4 candidate-status-container">
      <SectionHeader
        title="Candidate Status"
        viewAllPath="/dashboard/manage-candidates"
        onSearch={setSearchTerm}
      />
      <div className="candidate-status-table">
        {loading ? (
          <div>Loading...</div> // Show loading text or spinner while data is being fetched
        ) : (
          <TableComponent rows={filteredRows} />
        )}
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
