import React, { useEffect, useState } from "react";
import { Heading, Subtitle } from "../components/UI/Typography";
import Button from "../components/UI/Button";

function ManageEmployees() {
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null); // Track which enterprise is being edited
  const [editedEnterprise, setEditedEnterprise] = useState({}); // Store edited data

  // Fetch enterprise users from the backend
  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch enterprise users");
        }
        const usersData = await response.json();

        // Filter enterprise users (users with role "ENTERPRISE")
        const enterpriseData = usersData.filter((user) => user.role === "ENTERPRISE");
        setEnterprises(enterpriseData);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchEnterprises();
  }, []);

  // Handle updating the verification status of an enterprise user
  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verificationStatus: {
            status: status,
            updatedDate: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update verification status");
      }

      // Update the enterprise's status in the local state
      setEnterprises((prevEnterprises) =>
        prevEnterprises.map((enterprise) =>
          enterprise._id === id
            ? {
                ...enterprise,
                verificationStatus: {
                  ...enterprise.verificationStatus,
                  status: status,
                  updatedDate: new Date().toISOString(),
                },
              }
            : enterprise
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle deleting an enterprise user
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete enterprise user");
      }

      // Remove the deleted enterprise user from the list
      setEnterprises(enterprises.filter((enterprise) => enterprise._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle entering edit mode
  const handleEdit = (enterprise) => {
    setEditingId(enterprise._id);
    setEditedEnterprise({
      name: enterprise.enterprise?.name || "",
      industry: enterprise.enterprise?.industry || "",
      location: enterprise.enterprise?.location || "",
      employeeCount: enterprise.enterprise?.employeeCount || "",
    });
  };

  // Handle saving edited enterprise details
  const handleSave = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enterprise: {
            name: editedEnterprise.name,
            industry: editedEnterprise.industry,
            location: editedEnterprise.location,
            employeeCount: editedEnterprise.employeeCount,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update enterprise details");
      }

      // Update the enterprise's details in the local state
      setEnterprises((prevEnterprises) =>
        prevEnterprises.map((enterprise) =>
          enterprise._id === id
            ? {
                ...enterprise,
                enterprise: {
                  ...enterprise.enterprise,
                  name: editedEnterprise.name,
                  industry: editedEnterprise.industry,
                  location: editedEnterprise.location,
                  employeeCount: editedEnterprise.employeeCount,
                },
              }
            : enterprise
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
    setEditedEnterprise((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return <div>Loading enterprise users...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4 shadow mb-4 manage-employees-container">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center border-bottom border-2 pb-1 mb-3">
        <div className="d-flex flex-column gap-1">
          <Heading style={{ fontSize: "19px" }}>Manage Enterprises</Heading>
          <Subtitle style={{ fontSize: "14px" }}>
            Manage enterprise users and their verification status.
          </Subtitle>
        </div>
 
      </div>

      {/* List of Enterprises */}
      <div className="enterprise-list">
        {enterprises.map((enterprise) => (
          <div
            key={enterprise._id}
            className="enterprise-item d-flex justify-content-between align-items-center p-3 mb-2 border rounded"
          >
            <div>
              <h6>{enterprise.email}</h6>
              {editingId === enterprise._id ? (
                // Edit mode
                <div className="d-flex flex-column gap-2">
                  <input
                    type="text"
                    name="name"
                    value={editedEnterprise.name}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enterprise Name"
                  />
                  <input
                    type="text"
                    name="industry"
                    value={editedEnterprise.industry}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Industry"
                  />
                  <input
                    type="text"
                    name="location"
                    value={editedEnterprise.location}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Location"
                  />
                  <input
                    type="number"
                    name="employeeCount"
                    value={editedEnterprise.employeeCount}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Employee Count"
                  />
                </div>
              ) : (
                // View mode
                <div>
                  <p className="mb-0">
                    <strong>Enterprise Name:</strong> {enterprise.enterprise?.name}
                  </p>
                  <p className="mb-0">
                    <strong>Industry:</strong> {enterprise.enterprise?.industry}
                  </p>
                  <p className="mb-0">
                    <strong>Location:</strong> {enterprise.enterprise?.location}
                  </p>
                  <p className="mb-0">
                    <strong>Employee Count:</strong> {enterprise.enterprise?.employeeCount}
                  </p>
                </div>
              )}
              <p className="mb-0">
                <strong>Verification Status:</strong>{" "}
                <span
                  style={{
                    color:
                      enterprise.verificationStatus?.status === "APPROVED"
                        ? "green"
                        : enterprise.verificationStatus?.status === "REJECTED"
                        ? "red"
                        : "orange",
                  }}
                >
                  {enterprise.verificationStatus?.status || "PENDING"}
                </span>
              </p>
            </div>
            <div className="d-flex gap-2">
              {editingId === enterprise._id ? (
                // Save and Cancel buttons in edit mode
                <>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleSave(enterprise._id)}
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
                // Edit, Approve, Reject, and Delete buttons in view mode
                <>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleEdit(enterprise)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleUpdateStatus(enterprise._id, "APPROVED")}
                    disabled={enterprise.verificationStatus?.status === "APPROVED"}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleUpdateStatus(enterprise._id, "REJECTED")}
                    disabled={enterprise.verificationStatus?.status === "REJECTED"}
                  >
                    Reject
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(enterprise._id)}
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

export default ManageEmployees;