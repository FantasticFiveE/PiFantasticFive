import { useState, useContext, useEffect } from "react";
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

  useEffect(() => {
    const createParticles = () => {
      const particleContainer = document.createElement('div');
      particleContainer.className = 'particle-system';
      
      for (let i = 0; i < 40; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 9 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        
        const duration = Math.random() * 12 + 8;
        particle.style.animation = `generateParticles ${duration}s ease-in-out infinite`;
        
        const delay = Math.random() * 5;
        particle.style.animationDelay = `${delay}s`;
        
        const zIndex = Math.floor(Math.random() * 200) - 100;
        particle.style.transform = `translateZ(${zIndex}px)`;
        
        particleContainer.appendChild(particle);
      }
      
      const container = document.querySelector('.futuristic-login-container');
      if (container) {
        container.appendChild(particleContainer);
      }
    };

    createParticles();
    
    return () => {
      const particleSystem = document.querySelector('.particle-system');
      if (particleSystem) {
        particleSystem.remove();
      }
    };
  }, []);

  useEffect(() => {
    const formCard = document.querySelector('.futuristic-form-card');
    if (!formCard) return;
    
    const handleMouseMove = (e) => {
      const rect = formCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateY = ((x - centerX) / centerX) * 5;
      const rotateX = ((centerY - y) / centerY) * 5;
      
      formCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
    };
    
    const handleMouseLeave = () => {
      formCard.style.transform = 'perspective(1000px) rotateX(2deg) rotateY(-2deg)';
      formCard.style.transition = 'transform 0.5s ease';
    };
    
    formCard.addEventListener('mousemove', handleMouseMove);
    formCard.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      formCard.removeEventListener('mousemove', handleMouseMove);
      formCard.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
  
    try {
      const result = await axios.post(
        "http://backend:3001/Frontend/login",
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
  
      console.log("Backend login response:", result.data);
  
      if (result.data.status) {
        const { token, userId, role, userData } = result.data;
        const userRole = role.toUpperCase();
        
        const formCard = document.querySelector('.futuristic-form-card');
        if (formCard) {
          formCard.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          formCard.style.transform = 'perspective(1000px) scale(1.05) translateY(-20px)';
          formCard.style.boxShadow = '0 30px 70px rgba(91, 134, 229, 0.6)';
          formCard.style.borderColor = 'rgba(54, 209, 220, 0.5)';
        }
      
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        localStorage.setItem("role", role);
      
        console.log("✅ Token saved:", localStorage.getItem("token"));
      
        login(userData, token);
        
        setTimeout(() => {
          if (userRole === "ENTERPRISE") {
            navigate("/dashboard");
          } else {
            navigate("/home");
          }
        }, 800);
      } else {
        setError(result.data.message || "Email or password is incorrect!");
        
        const formCard = document.querySelector('.futuristic-form-card');
        if (formCard) {
          formCard.style.animation = 'none';
          setTimeout(() => {
            formCard.style.animation = 'errorShake 0.5s';
          }, 10);
        }
        
        if (result.data.emailVerified === false) {
          navigate("/verify-email");
        }
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Unable to login.");
      
      const formCard = document.querySelector('.futuristic-form-card');
      if (formCard) {
        formCard.style.animation = 'none';
        setTimeout(() => {
          formCard.style.animation = 'errorShake 0.5s';
        }, 10);
      }
    }
  };
      
  const handleGoogleSuccess = async (response) => {
    try {
      const result = await axios.post("http://backend:3001/auth/google", {
        credential: response.credential,
      });

      if (result.data.status) {
        const { token, userId, role, userData } = result.data;
        const userRole = role.toUpperCase();

        const formCard = document.querySelector('.futuristic-form-card');
        if (formCard) {
          formCard.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
          formCard.style.transform = 'perspective(1000px) scale(1.05) translateY(-20px)';
          formCard.style.boxShadow = '0 30px 70px rgba(91, 134, 229, 0.6)';
        }

        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId);
        localStorage.setItem("role", userRole);

        login(userData, token);
        
        setTimeout(() => {
          navigate("/home");
        }, 800);
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      setError("Google authentication failed. Please try again.");
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
        <div className="futuristic-form-card">
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
                  name="email"
                  placeholder="Enter your email"
                  autoComplete="off"
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
                  name="password"
                  placeholder="Enter your password"
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
              <Link to="/forgotPassword" className="futuristic-forgot-link">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="futuristic-login-button">Login</button>

            <div className="google-login-wrapper">
              <span>OR</span>
            </div>

            <div className="google-button-container">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.error("Google Login Failed");
                  setError("Google authentication failed. Please try again.");
                }}
                shape="pill"
                size="large"
                width="100%"
              />
            </div>

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