import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function ProfileInfo() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null); // State to manage admin user data

  // Fetch admin data from localStorage on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("admin"));
    if (user) {
      setAdminUser(user);
    }
  }, []); // Add empty dependency array

  // Handle log out
  const handleLogout = () => {
    localStorage.removeItem("admin"); // Remove admin data from localStorage
    navigate("/dashboard/login"); // Redirect to the login page
  };

  if (!adminUser) {
    return null; // Don't render anything if admin data is not available
  }

  return (
    <div style={styles.profileInfoContainer}>
      <div style={styles.profileHeader}>
        <img
          src={adminUser.picture || "https://via.placeholder.com/50"} // Fallback image if no picture is set
          alt="Admin Profile"
          style={styles.profilePicture}
        />
        <div>
          <h6 style={styles.profileName}>{adminUser.email}</h6>
          <small style={styles.profileRole}>{adminUser.role}</small>
        </div>
      </div>

      <div style={styles.profileDetails}>
        <p style={styles.detailItem}>
          <strong>Status:</strong>{" "}
          <span style={{ color: adminUser.isActive ? "#28a745" : "#dc3545" }}>
            {adminUser.isActive ? "Active" : "Inactive"}
          </span>
        </p>
        <p style={styles.detailItem}>
          <strong>Last Login:</strong>{" "}
          {adminUser.lastLogin
            ? new Date(adminUser.lastLogin).toLocaleString()
            : "N/A"}
        </p>
      </div>

      <button style={styles.logoutButton} onClick={handleLogout}>
        Log Out
      </button>
    </div>
  );
}

export default ProfileInfo;

// Styles
const styles = {
  profileInfoContainer: {
    width: "280px",
    backgroundColor: "#ffffff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "20px",
    position: "absolute",
    top: "60px",
    right: "20px",
    zIndex: 1000,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  profileHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  profilePicture: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    border: "2px solid #e0e0e0",
  },
  profileName: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "600",
    color: "#333",
  },
  profileRole: {
    color: "#6c757d",
    fontSize: "12px",
  },
  profileDetails: {
    marginBottom: "16px",
  },
  detailItem: {
    fontSize: "14px",
    marginBottom: "8px",
    color: "#555",
  },
  logoutButton: {
    width: "100%",
    padding: "10px",
    fontSize: "14px",
    backgroundColor: "#dc3545",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
};