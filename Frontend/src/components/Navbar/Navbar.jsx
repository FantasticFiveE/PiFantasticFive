import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";  // ✅ Import useNavigate
import AuthContext from "../../context/AuthContext";  // ✅ Import the AuthContext
import "./Navbar.css";

const Navbar = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);  // ✅ Access login state & logout function
  const navigate = useNavigate();  // ✅ Initialize navigate

  const handleLogout = () => {
    logout();              // ✅ Clear auth state
    navigate("/login");     // ✅ Redirect to login page
  };

  return (
    <nav className="futuristic-navbar navbar navbar-expand-lg">
      <div className="container-fluid">
        {/* Brand */}
        <Link className="navbar-brand futuristic-brand" to="/">
          <span>NEXTHIRE</span>
        </Link>

        {/* Mobile menu toggle button */}
        <button
          className="navbar-toggler futuristic-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarSupportedContent"
          aria-controls="navbarSupportedContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar links */}
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/home">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/about">
                About
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/service">
                Services
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/why">
                Why Us
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/team">
                Team
              </Link>
            </li>

            {/* Conditional Rendering for Authenticated/Unauthenticated Users */}
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link futuristic-nav-link" to="/profile">
                    Edit Profile
                  </Link>
                </li>
                <li className="nav-item">
                  <button
                    className="btn logout-btn"
                    onClick={handleLogout}  // ✅ Use handleLogout instead of logout
                    style={{
                      background: "transparent",
                      border: "2px solid #5b86e5",
                      color: "#5b86e5",
                      fontWeight: "600",
                      borderRadius: "25px",
                      transition: "all 0.3s ease",
                    }}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="btn signin-btn mx-2" to="/login">
                    Sign In
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn signup-btn" to="/register">
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
