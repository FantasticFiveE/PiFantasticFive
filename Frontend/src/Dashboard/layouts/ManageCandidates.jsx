import React, { useEffect, useState } from "react";
import "./ManageCandidates.css";

function ManageCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedCandidate, setEditedCandidate] = useState({});

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/users");
        if (!response.ok) throw new Error("Failed to fetch candidates");
        const { data: usersData } = await response.json();
        const candidateData = usersData.filter((user) => user.role === "CANDIDATE");
        setCandidates(candidateData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete candidate");
      setCandidates(candidates.filter((candidate) => candidate._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (candidate) => {
    setEditingId(candidate._id);
    setEditedCandidate({
      name: candidate.name || "",
      skills: candidate.profile?.skills?.join(", ") || "",
      availability: candidate.profile?.availability || "",
    });
  };

  const handleSave = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedCandidate.name,
          profile: {
            skills: editedCandidate.skills.split(",").map((skill) => skill.trim()),
            availability: editedCandidate.availability,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to update candidate");

      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate._id === id
            ? {
                ...candidate,
                name: editedCandidate.name,
                profile: {
                  ...candidate.profile,
                  skills: editedCandidate.skills.split(",").map((skill) => skill.trim()),
                  availability: editedCandidate.availability,
                },
              }
            : candidate
        )
      );
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedCandidate((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <div className="loading-message">Loading candidates...</div>;
  if (error) return <div className="error-message">Error: {error}</div>;

  return (
    <div className="manage-container">
      <h2>Manage Candidates</h2>
      <p>Manage candidate profiles and their details.</p>

      <div className="candidate-list">
        {candidates.length > 0 ? (
          candidates.map((candidate) => (
            <div key={candidate._id} className="candidate-card">
              <h6 className="candidate-title">{candidate.name || candidate.email}</h6>
              {editingId === candidate._id ? (
                <div className="edit-form">
                  <input
                    type="text"
                    name="name"
                    value={editedCandidate.name}
                    onChange={handleInputChange}
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    name="skills"
                    value={editedCandidate.skills}
                    onChange={handleInputChange}
                    placeholder="Skills (comma-separated)"
                  />
                  <input
                    type="text"
                    name="availability"
                    value={editedCandidate.availability}
                    onChange={handleInputChange}
                    placeholder="Availability"
                  />
                  <button onClick={() => handleSave(candidate._id)}>Save</button>
                  <button onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              ) : (
                <div className="candidate-info">
                  <p>
                    <strong>Skills:</strong>{" "}
                    {candidate.profile?.skills?.join(", ") || "No skills available"}
                  </p>
                  <p>
                    <strong>Availability:</strong>{" "}
                    {candidate.profile?.availability || "Not specified"}
                  </p>
                  <p>
                    <strong>Applications:</strong> {candidate.applications?.length || 0}
                    {candidate.applications?.length > 0 && (
                      <ul>
                        {candidate.applications.map((app, index) => (
                          <li key={index}>
                            {app.jobId?.title || "Unknown job"} - {app.status}
                          </li>
                        ))}
                      </ul>
                    )}
                  </p>
                  <p>
                    <strong>Interviews:</strong> {candidate.interviews?.length || 0}
                    {candidate.interviews?.length > 0 && (
                      <ul>
                        {candidate.interviews.map((interview, index) => (
                          <li key={index}>
                            {interview.jobId?.title || "Unknown job"} - {interview.status}
                          </li>
                        ))}
                      </ul>
                    )}
                  </p>
                  <div className="action-buttons">
                    <button onClick={() => handleEdit(candidate)}>Edit</button>
                    <button onClick={() => handleDelete(candidate._id)}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div>No candidates found.</div>
        )}
      </div>
    </div>
  );
}

export default ManageCandidates;
