import React, { useEffect, useState } from "react";
import { Heading, Subtitle } from "../components/UI/Typography";
import Button from "../components/UI/Button";

function ManageEmployees() {
  const [enterprises, setEnterprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editedEnterprise, setEditedEnterprise] = useState({});

  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch enterprise users");
        }

        const data = await response.json();
        console.log("Fetched usersData:", data);

        const enterpriseUsers = data.data.filter((user) => user.role === "ENTERPRISE");
        setEnterprises(enterpriseUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEnterprises();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationStatus: {
            status: status,
            updatedDate: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to update verification status");

      setEnterprises((prev) =>
        prev.map((enterprise) =>
          enterprise._id === id
            ? {
                ...enterprise,
                verificationStatus: {
                  ...enterprise.verificationStatus,
                  status,
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

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete user");

      setEnterprises((prev) => prev.filter((enterprise) => enterprise._id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (enterprise) => {
    setEditingId(enterprise._id);
    setEditedEnterprise({
      name: enterprise.enterprise?.name || "",
      industry: enterprise.enterprise?.industry || "",
      location: enterprise.enterprise?.location || "",
      employeeCount: enterprise.enterprise?.employeeCount || "",
    });
  };

  const handleSave = async (id) => {
    try {
      const response = await fetch(`http://localhost:3001/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enterprise: editedEnterprise }),
      });

      if (!response.ok) throw new Error("Failed to update enterprise");

      setEnterprises((prev) =>
        prev.map((enterprise) =>
          enterprise._id === id
            ? {
                ...enterprise,
                enterprise: editedEnterprise,
              }
            : enterprise
        )
      );

      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedEnterprise((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <p>Loading enterprises...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="p-4 manage-employees-container">
      <div className="mb-4 border-bottom pb-2">
        <Heading>Manage Enterprises</Heading>
        <Subtitle>Total: {enterprises.length} enterprises</Subtitle>
      </div>

      <div className="enterprise-list">
        {enterprises.map((enterprise) => (
          <div
            key={enterprise._id}
            className="enterprise-item d-flex justify-content-between align-items-start p-3 mb-3 border rounded"
          >
            <div>
              <h6>{enterprise.email}</h6>
              {editingId === enterprise._id ? (
                <div className="d-flex flex-column gap-2">
                  <input
                    name="name"
                    value={editedEnterprise.name}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enterprise Name"
                  />
                  <input
                    name="industry"
                    value={editedEnterprise.industry}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Industry"
                  />
                  <input
                    name="location"
                    value={editedEnterprise.location}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Location"
                  />
                  <input
                    name="employeeCount"
                    type="number"
                    value={editedEnterprise.employeeCount}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Employee Count"
                  />
                </div>
              ) : (
                <div>
                  <p><strong>Enterprise Name:</strong> {enterprise.enterprise?.name}</p>
                  <p><strong>Industry:</strong> {enterprise.enterprise?.industry}</p>
                  <p><strong>Location:</strong> {enterprise.enterprise?.location}</p>
                  <p><strong>Employee Count:</strong> {enterprise.enterprise?.employeeCount}</p>
                </div>
              )}
              <p>
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

            <div className="d-flex flex-column gap-2">
              {editingId === enterprise._id ? (
                <>
                  <button className="btn btn-success btn-sm" onClick={() => handleSave(enterprise._id)}>
                    Save
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button className="btn btn-primary btn-sm" onClick={() => handleEdit(enterprise)}>
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
                    className="btn btn-warning btn-sm"
                    onClick={() => handleUpdateStatus(enterprise._id, "REJECTED")}
                    disabled={enterprise.verificationStatus?.status === "REJECTED"}
                  >
                    Reject
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(enterprise._id)}>
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
