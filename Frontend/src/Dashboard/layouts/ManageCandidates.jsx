import React, { useEffect, useState } from "react";

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
        if (!response.ok) {
          throw new Error("Failed to fetch candidates");
        }
        const usersData = await response.json();

        // Filter candidates (users with role "CANDIDATE")
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
      if (!response.ok) {
        throw new Error("Failed to delete candidate");
      }
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

      if (!response.ok) {
        throw new Error("Failed to update candidate details");
      }

      setCandidates((prevCandidates) =>
        prevCandidates.map((candidate) =>
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

  if (loading) {
    return <div>Loading candidates...</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  return (
    <div className="p-4 shadow mb-4">
      <h2>Manage Candidates</h2>
      <p>Manage candidate profiles and their details.</p>

      <div>
        {candidates.length > 0 ? (
          candidates.map((candidate) => (
            <div key={candidate._id} className="border p-3 mb-2 rounded">
              <h6>{candidate.name || candidate.email}</h6>
              {editingId === candidate._id ? (
                <div>
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
                <div>
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
                  </p>
                  <p>
                    <strong>Interviews:</strong> {candidate.interviews?.length || 0}
                  </p>
                  <button onClick={() => handleEdit(candidate)}>Edit</button>
                  <button onClick={() => handleDelete(candidate._id)}>Delete</button>
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