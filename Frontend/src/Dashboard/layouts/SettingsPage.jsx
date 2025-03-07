import React, { useState, useEffect } from "react";
import axios from "axios"; // For making API calls

function SettingsPage() {
  // Fetch admin data from localStorage
  const adminData = localStorage.getItem("admin");
  const adminUser = adminData ? JSON.parse(adminData) : null;

  // State to manage form inputs for password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  // State to manage notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
  });

  // State to manage theme selection
  const [theme, setTheme] = useState("light");

  // State to manage success/error messages
  const [message, setMessage] = useState("");

  // State for picture upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(adminUser?.picture || "");

  // Handle input changes for password form
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setPasswordData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  // Handle notification preference changes
  const handleNotificationChange = (e) => {
    const { id, checked } = e.target;
    setNotificationPreferences((prevPreferences) => ({
      ...prevPreferences,
      [id]: checked,
    }));
  };

  // Handle theme selection changes
  const handleThemeChange = (e) => {
    setTheme(e.target.value);
    // Apply the selected theme to the app (optional)
    document.body.setAttribute("data-theme", e.target.value);
  };

  // Handle file selection for picture upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewURL(URL.createObjectURL(file)); // Generate preview URL
    }
  };

  // Handle picture upload
  const handlePictureUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a file to upload.");
      return;
    }

    if (!adminUser) {
      setMessage("Admin data not found. Please log in.");
      return;
    }

    const formData = new FormData();
    formData.append("picture", selectedFile);
    formData.append("userId", adminUser._id); // Include the user ID

    try {
      const response = await axios.post(
        "http://localhost:3001/api/upload-picture",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.message === "Picture uploaded successfully") {
        setMessage("Picture uploaded successfully!");
        
        // Update the adminUser object in localStorage
        const updatedUser = response.data.user; // Updated user data from the backend
        localStorage.setItem("admin", JSON.stringify(updatedUser));

        // Dispatch a custom event to notify other components
        window.dispatchEvent(new Event("localStorageUpdated"));

        // Update the state to trigger a re-render
        setAdminUser(updatedUser);
        setPreviewURL(updatedUser.picture); // Update preview URL
      } else {
        setMessage(response.data.message || "Failed to upload picture.");
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message || "An error occurred. Please try again."
      );
    }
  };

  // Handle form submission for password change
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
      if (!adminUser) {
        setMessage("Admin data not found. Please log in.");
        return;
      }

      // Send a POST request to the backend API
      const response = await axios.post("http://localhost:3001/api/change-password", {
        userId: adminUser._id, // Use the admin's ID from localStorage
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

  // Handle contact support button click
  const handleContactSupport = () => {
    alert("Contact support clicked. Redirecting to support page...");
    // Redirect to support page or open a support modal
  };

  // Handle report a bug button click
  const handleReportBug = () => {
    alert("Report a bug clicked. Redirecting to bug report page...");
    // Redirect to bug report page or open a bug report modal
  };

  if (!adminUser) {
    return <div>No admin data found. Please log in.</div>; // Render a message if admin data is not available
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

          {/* Profile Picture Section */}
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h2 className="card-title mb-4">Profile Picture</h2>
              <div className="d-flex align-items-center">
                {/* Display current or preview picture */}
                {previewURL && (
                  <img
                    src={previewURL}
                    alt="Profile Preview"
                    className="rounded-circle me-3"
                    style={{ width: "100px", height: "100px", objectFit: "cover" }}
                  />
                )}
                {/* File input for picture upload */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-control mb-2"
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handlePictureUpload}
                    disabled={!selectedFile}
                  >
                    Upload Picture
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                  checked={notificationPreferences.emailNotifications}
                  onChange={handleNotificationChange}
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
                  checked={notificationPreferences.pushNotifications}
                  onChange={handleNotificationChange}
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
                <select
                  className="form-select"
                  id="themeSelect"
                  value={theme}
                  onChange={handleThemeChange}
                >
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
                onClick={handleContactSupport}
              >
                Contact Support
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={handleReportBug}
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