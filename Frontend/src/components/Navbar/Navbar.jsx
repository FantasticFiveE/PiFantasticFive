import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const userId = localStorage.getItem("userId");
  const rawRole = localStorage.getItem("role");
  const userRole = (localStorage.getItem("role") || "").toUpperCase(); // 🔥 NORMALISATION MAJUSCULE

  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="futuristic-navbar navbar navbar-expand-lg">
      <div className="container-fluid">
        <Link className="navbar-brand futuristic-brand" to="/">
          <span>NEXTHIRE</span>
        </Link>
  
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
  
        <div className="collapse navbar-collapse" id="navbarSupportedContent">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/home">Home</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/about">About</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/service">Services</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/why">Why Us</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link futuristic-nav-link" to="/team">Team</Link>
            </li>
  
            {/* 🔒 Authenticated User */}
            {isAuthenticated && userId ? (
  <>
    {/* ✅ Only show messages for candidates */}
    {userRole === "CANDIDATE" && (
      <li className="nav-item">
        <Link className="nav-link futuristic-nav-link" to="/messages">📨 Messages</Link>
      </li>
    )}

    <li className="nav-item">
      <Link
        className="nav-link futuristic-nav-link"
        to={userRole === "ENTERPRISE" ? `/entreprise/${userId}` : `/profile/${userId}`}
      >
        {userRole === "ENTERPRISE" ? "My Enterprise" : "Mon Profil"}
      </Link>
    </li>

    <li className="nav-item">
      <button
        className="btn logout-btn"
        onClick={handleLogout}
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
                  <Link className="btn signin-btn mx-2" to="/login">Sign In</Link>
                </li>
                <li className="nav-item">
                  <Link className="btn signup-btn" to="/register">Sign Up</Link>
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
