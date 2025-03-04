import React, { useState } from "react";
import axios from "axios"; // For making API calls

function SettingsPage() {
  // Fetch admin data from localStorage
  const adminUser = JSON.parse(localStorage.getItem("admin"));

  // State to manage form inputs
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // State to manage success/error messages
  const [message, setMessage] = useState("");

  // Handle input changes
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setPasswordData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate inputs
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setMessage("New passwords do not match.");
      return;
    }
  
    try {
      // Get the logged-in admin user from localStorage
      const adminUser = JSON.parse(localStorage.getItem("admin"));
  
      // Send a POST request to the backend API
      const response = await axios.post("http://localhost:3001/api/change-password", {
        userId: adminUser._id.$oid, // Use the admin's ID from localStorage
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
  
      // Handle success response
      if (response.data.message === "Password changed successfully") {
        setMessage("Password changed successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
      } else {
        setMessage(response.data.message || "Failed to change password.");
      }
    } catch (error) {
      // Handle error
      setMessage(
        error.response?.data?.message || "An error occurred. Please try again."
      );
    }
  };
  if (!adminUser) {
    return null; // Don't render anything if admin data is not available
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="text-center mb-4">Settings</h1>

          {/* Display success/error messages */}
          {message && (
            <div
              className={`alert ${
                message.includes("successfully") ? "alert-success" : "alert-danger"
              }`}
            >
              {message}
            </div>
          )}

          {/* Change Password Section */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">Change Password</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="currentPassword" className="form-label">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="currentPassword"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="newPassword" className="form-label">
                    New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="newPassword"
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmNewPassword" className="form-label">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmNewPassword"
                    placeholder="Confirm new password"
                    value={passwordData.confirmNewPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Change Password
                </button>
              </form>
            </div>
          </div>

          {/* Notification Preferences Section */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">Notification Preferences</h2>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="emailNotifications"
                  defaultChecked
                />
                <label className="form-check-label" htmlFor="emailNotifications">
                  Email Notifications
                </label>
              </div>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="pushNotifications"
                  defaultChecked
                />
                <label className="form-check-label" htmlFor="pushNotifications">
                  Push Notifications
                </label>
              </div>
            </div>
          </div>

          {/* Theme and Display Section */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">Theme and Display</h2>
              <div className="mb-3">
                <label htmlFor="themeSelect" className="form-label">
                  Theme
                </label>
                <select className="form-select" id="themeSelect">
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
            </div>
          </div>

          {/* Help and Support Section */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">Help and Support</h2>
              <button
                className="btn btn-outline-primary me-2"
                onClick={() => alert("Contact support clicked")}
              >
                Contact Support
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={() => alert("Report a bug clicked")}
              >
                Report a Bug
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;