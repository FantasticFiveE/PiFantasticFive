import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import AuthContext from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = await axios.post(
        "http://localhost:3001/Frontend/login",
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      console.log("Backend login response:", result.data); // 👈 Debug ici

      if (result.data.status) {
        const { token, userId, role } = result.data;

        // Sécurité & validation du rôle
        if (!role) {
          setError("No role returned from server.");
          return;
        }

        const userRole = role.toUpperCase();
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        localStorage.setItem("role", userRole);
        login(userRole);

        if (userRole === "ENTERPRISE") {
          navigate("/enterprise-dashboard");
        } else {
          navigate("/home");
        }
      } else {
        setError(result.data.message || "Email or password is incorrect!");
        if (result.data.emailVerified === false) {
          navigate("/verify-email");
        }
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Unable to login.");
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const result = await axios.post("http://localhost:3001/auth/google", {
        credential: response.credential,
      });

      if (result.data.status) {
        const { token, userId, role } = result.data;
        const userRole = role.toUpperCase();

        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        localStorage.setItem("role", userRole);
        login(userRole);
        navigate("/home");
      }
    } catch (err) {
      console.error("Google Login Error:", err);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="futuristic-login-container">
      <div className="animated-bg-overlay"></div>
      <div className="futuristic-login-left">
        <div className="futuristic-brand-container floating-brand">
          <img
            src="/images/nexthire.png"
            alt="Company Logo"
            className="futuristic-company-logo"
            onError={(e) => {
              e.target.src = "https://placehold.co/80x80";
            }}
          />
          <h1 className="futuristic-brand-title">NextHire</h1>
          <p className="futuristic-brand-subtitle">
            Your gateway to the future. Login to access our innovative platform.
          </p>
        </div>
      </div>
      <div className="futuristic-login-right fade-in">
        <div className="futuristic-form-card float-up">
          <h2 className="futuristic-form-heading">Login</h2>
          <p className="futuristic-form-subheading">Enter your credentials to continue</p>
          <form onSubmit={handleSubmit}>
            {error && <div className="futuristic-error-message">{error}</div>}

            <div className="futuristic-form-group">
              <label htmlFor="email" className="futuristic-label">Email Address</label>
              <div className="futuristic-input-container">
                <FontAwesomeIcon icon={faEnvelope} className="futuristic-input-icon" />
                <input
                  type="email"
                  id="email"
                  placeholder="Enter your email"
                  autoComplete="off"
                  name="email"
                  className="futuristic-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="futuristic-form-group">
              <label htmlFor="password" className="futuristic-label">Password</label>
              <div className="futuristic-input-container">
                <FontAwesomeIcon icon={faLock} className="futuristic-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Enter your password"
                  name="password"
                  className="futuristic-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="futuristic-eye-icon"
                  onClick={togglePasswordVisibility}
                />
              </div>
            </div>

            <div className="futuristic-forgot-password">
              <Link to="/forgotPassword" className="futuristic-forgot-link">Forgot Password?</Link>
            </div>

            <button type="submit" className="futuristic-login-button">Login</button>

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.error("Google Login Failed")}
            />

            <div className="futuristic-register-option">
              <p>New Here?</p>
              <Link to="/register" className="futuristic-register-link">Sign Up</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
