import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:3001/Frontend/login",
        formData
      );
      if (response.data === "Success") {
        navigate("/home");
      } else {
        setError("Email ou mot de passe incorrect!");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur de connexion. Veuillez réessayer plus tard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="futuristic-login-container">
      {/* Animated Overlay for the full background */}
      <div className="animated-bg-overlay"></div>

      {/* Left Side (Branding / Slogan) */}
      <div className="futuristic-login-left floating-brand">
        <div className="futuristic-brand-container">
          <img
            src="images/nexthire.png"
            alt="Futuristic Brand Logo"
            className="futuristic-company-logo"
          />
          <h1 className="futuristic-brand-title">NextHire 2025</h1>
          <p className="futuristic-brand-subtitle">
            Optimisez votre recrutement à l'ère de l'IA
          </p>
        </div>
      </div>

      {/* Right Side (Form) */}
      <div className="futuristic-login-right fade-in">
        <div className="futuristic-form-card float-up">
          <h2 className="futuristic-form-heading">Connexion</h2>
          <p className="futuristic-form-subheading">
            Accédez à votre espace personnel
          </p>

          {error && <div className="futuristic-error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="futuristic-login-form">
            {/* Email Field */}
            <div className="futuristic-form-group">
              <label className="futuristic-label" htmlFor="email">
                Adresse email
              </label>
              <div className="futuristic-input-container">
                <i className="fas fa-envelope futuristic-input-icon"></i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Entrez votre email"
                  className="futuristic-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="futuristic-form-group">
              <label className="futuristic-label" htmlFor="password">
                Mot de passe
              </label>
              <div className="futuristic-input-container">
                <i className="fas fa-lock futuristic-input-icon"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Entrez votre mot de passe"
                  className="futuristic-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <span
                  className="futuristic-eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </span>
              </div>
            </div>

            <div className="futuristic-forgot-password">
              <Link to="/forgot-password" className="futuristic-forgot-link">
                Mot de passe oublié?
              </Link>
            </div>

            <button
              type="submit"
              className={`futuristic-login-button ${
                loading ? "loading" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div className="futuristic-register-option">
            <p>Vous n'avez pas de compte?</p>
            <Link to="/register" className="futuristic-register-link">
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
