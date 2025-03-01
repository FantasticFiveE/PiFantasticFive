import React, { useEffect, useState } from "react";
import { Heading, Subtitle } from "../components/UI/Typography";
import Button from "../components/UI/Button";

function ManageCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // Track which candidate is being edited
  const [editedCandidate, setEditedCandidate] = useState({}); // Store edited data

  // Fetch candidates from the backend
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users");
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

  // Handle deleting a candidate
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete candidate");
      }

      // Remove the deleted candidate from the list
      setCandidates(candidates.filter((candidate) => candidate._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle entering edit mode
  const handleEdit = (candidate) => {
    setEditingId(candidate._id);
    setEditedCandidate({
      name: candidate.name || "", // Include the name field
      skills: candidate.profile.skills.join(", "),
      availability: candidate.profile.availability,
    });
  };

  // Handle saving edited candidate details
  const handleSave = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editedCandidate.name, // Include the name field
          profile: {
            skills: editedCandidate.skills.split(",").map((skill) => skill.trim()),
            availability: editedCandidate.availability,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update candidate details");
      }

      // Update the candidate's details in the local state
      setCandidates((prevCandidates) =>
        prevCandidates.map((candidate) =>
          candidate._id === id
            ? {
                ...candidate,
                name: editedCandidate.name, // Update the name field
                profile: {
                  ...candidate.profile,
                  skills: editedCandidate.skills.split(",").map((skill) => skill.trim()),
                  availability: editedCandidate.availability,
                },
              }
            : candidate
        )
      );

      // Exit edit mode
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle input changes in edit mode
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedCandidate((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return <div>Loading candidates...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4 shadow mb-4 manage-candidates-container">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center border-bottom border-2 pb-1 mb-3">
        <div className="d-flex flex-column gap-1">
          <Heading style={{ fontSize: "19px" }}>Manage Candidates</Heading>
          <Subtitle style={{ fontSize: "14px" }}>
            Manage candidate profiles and their details.
          </Subtitle>
        </div>
        
      </div>

      {/* List of Candidates */}
      <div className="candidate-list">
        {candidates.map((candidate) => (
          <div
            key={candidate._id}
            className="candidate-item d-flex justify-content-between align-items-center p-3 mb-2 border rounded"
          >
            <div>
              <h6>{candidate.name || candidate.email}</h6> {/* Display name or fallback to email */}
              {editingId === candidate._id ? (
                // Edit mode
                <div className="d-flex flex-column gap-2">
                  <input
                    type="text"
                    name="name"
                    value={editedCandidate.name}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    name="skills"
                    value={editedCandidate.skills}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Skills (comma-separated)"
                  />
                  <input
                    type="text"
                    name="availability"
                    value={editedCandidate.availability}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Availability"
                  />
                </div>
              ) : (
                // View mode
                <div>
                  <p className="mb-0">
                    <strong>Skills:</strong> {candidate.profile.skills.join(", ")}
                  </p>
                  <p className="mb-0">
                    <strong>Availability:</strong> {candidate.profile.availability}
                  </p>
                </div>
              )}
            </div>
            <div className="d-flex gap-2">
              {editingId === candidate._id ? (
                // Save and Cancel buttons in edit mode
                <>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleSave(candidate._id)}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                // Edit and Delete buttons in view mode
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEdit(candidate)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(candidate._id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ManageCandidates;