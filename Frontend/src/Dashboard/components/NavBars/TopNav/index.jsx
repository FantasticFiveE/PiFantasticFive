import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SearchBox from "../../UI/SearchBox";
import ProfileInfo from "../../../layouts/ProfileInfo";
import Logo from "../../../_assets/navbar/logo.png";

// Icons
import SettingsIcon from "../../../_assets/navbar/settings.svg";
import NotificationIcon from "../../../_assets/navbar/notification.svg";
import DayNightModeIcon from "../../../_assets/navbar/darklightmode.svg";
import MessageIcon from "../../../_assets/navbar/messages.svg";

function TopNav() {
  const navigate = useNavigate();
  const [showProfileInfo, setShowProfileInfo] = useState(false); // Toggle profile info window
  const [adminUser, setAdminUser] = useState(null); // Store admin data
  const [searchQuery, setSearchQuery] = useState(""); // Store search query

  // Fetch admin data from localStorage
  useEffect(() => {
    const adminData = JSON.parse(localStorage.getItem("admin"));
    if (adminData) {
      setAdminUser(adminData);
    }
  }, []);

  // Inline styles for the profile picture in the navbar
  const navbarProfilePictureStyles = {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "2px solid #ffffff",
    cursor: "pointer",
  };

  // Handle search query
  const handleSearch = (query) => {
    setSearchQuery(query); // Update the search query state
    if (query.trim() !== "") {
      // Navigate to search results page with the query
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      // If the query is empty, navigate back to the home page or a default page
      navigate("/");
    }
  };

  return (
    <div className="d-flex justify-content-between align-items-center p-3 shadow mb-4 position-relative">
      <div className="d-flex justify-content-start align-items-center gap-2">
        <img src={Logo} alt="logo" width={"15%"} className="me-4" />
        <SearchBox onSearch={handleSearch} /> {/* Pass handleSearch as prop */}
        <button className="btn">
          <i className="fs-3 d-sm-display d-md-none bi bi-list"></i>
        </button>
      </div>
      <div className="d-none d-md-flex justify-content-end align-items-center gap-5">
        {/* Day/Night Mode Icon */}
        <button
          className="btn p-0"
          onClick={() => alert("Day/Night mode toggled!")}
        >
          <img src={DayNightModeIcon} alt="Day/Night Mode Icon" width={"20px"} />
        </button>

        {/* Settings Icon */}
        <button className="btn p-0" onClick={() => navigate("/settings")}>
          <img src={SettingsIcon} alt="Settings Icon" width={"20px"} />
        </button>

        {/* Profile Picture and Name */}
        {adminUser && (
          <button
            className="btn p-0 d-flex align-items-center gap-2"
            onClick={() => setShowProfileInfo(!showProfileInfo)}
          >
            <img
              src={adminUser.picture}
              alt="Profile Picture"
              style={navbarProfilePictureStyles}
            />
            <span style={{ color: "#000", fontWeight: "500" }}>
              {adminUser.name}
            </span>
          </button>
        )}
      </div>

      {/* Profile Information Window */}
      {showProfileInfo && <ProfileInfo />}
    </div>
  );
}

export default TopNav;