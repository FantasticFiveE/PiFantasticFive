import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import "./Signup.css";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "candidat",
    matriculeFiscale: "",
    adresse: "",
    type: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleRoleChange = (role) => {
    setFormData({ ...formData, role });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Name is required.";
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email) {
      newErrors.email = "Email is required.";
    } else if (!emailPattern.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    if (formData.role === "entreprise") {
      if (!formData.matriculeFiscale) {
        newErrors.matriculeFiscale = "Matricule Fiscale is required.";
      }
      if (!formData.adresse) newErrors.adresse = "Adresse is required.";
      if (!formData.type) newErrors.type = "Type is required.";
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    setLoading(true);

    try {
      await axios.post("http://localhost:3001/Frontend/register", formData);
      navigate("/login");
    } catch (error) {
      console.error(error);
      // Display a global error message if needed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="futuristic-signup-container">
      {/* Rotating Background Overlay */}
      <div className="animated-bg-overlay"></div>

      {/* Left Side - Branding / Slogan with float animation */}
      <div className="futuristic-signup-left floating-brand">
        <div className="futuristic-signup-left-content fade-in-left">
          <div className="futuristic-signup-logo-container">
            <img
              src="images/nexthire.png"
              alt="NextHire Logo"
              className="futuristic-signup-logo"
            />
          </div>
          <h1 className="futuristic-signup-brand">NextHire 2025</h1>
          <p className="futuristic-signup-text">
            Simplifiez le recrutement grâce à l'IA
          </p>
        </div>
      </div>

      {/* Right Side - Glassmorphism Form with slight float-up */}
      <div className="futuristic-signup-right fade-in-right">
        <div className="futuristic-signup-card float-up">
          <h2 className="futuristic-signup-heading">Inscription</h2>
          <p className="futuristic-signup-subheading">
            Créez votre compte en quelques étapes
          </p>

          <form onSubmit={handleSubmit} className="futuristic-signup-form">
            {/* Role Selection */}
            <div className="futuristic-form-group futuristic-role-group">
              <button
                type="button"
                className={`futuristic-role-button ${
                  formData.role === "candidat" ? "selected" : ""
                }`}
                onClick={() => handleRoleChange("candidat")}
              >
                Je suis un Candidat
              </button>
              <button
                type="button"
                className={`futuristic-role-button ${
                  formData.role === "entreprise" ? "selected" : ""
                }`}
                onClick={() => handleRoleChange("entreprise")}
              >
                Je suis un Employeur
              </button>
            </div>

            {/* Name */}
            <div className="futuristic-form-group">
              <label className="futuristic-signup-label" htmlFor="name">
                Nom
              </label>
              <div className="futuristic-input-container">
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Entrez votre nom"
                  value={formData.name}
                  onChange={handleChange}
                  className={
                    errors.name ? "futuristic-input error-input" : "futuristic-input"
                  }
                />
              </div>
              {errors.name && (
                <div className="futuristic-error-message">{errors.name}</div>
              )}
            </div>

            {/* Email */}
            <div className="futuristic-form-group">
              <label className="futuristic-signup-label" htmlFor="email">
                Email
              </label>
              <div className="futuristic-input-container">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Entrez votre email"
                  value={formData.email}
                  onChange={handleChange}
                  className={
                    errors.email ? "futuristic-input error-input" : "futuristic-input"
                  }
                />
              </div>
              {errors.email && (
                <div className="futuristic-error-message">{errors.email}</div>
              )}
            </div>

            {/* Password */}
            <div className="futuristic-form-group">
              <label className="futuristic-signup-label" htmlFor="password">
                Mot de passe
              </label>
              <div className="futuristic-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Entrez votre mot de passe"
                  value={formData.password}
                  onChange={handleChange}
                  className={
                    errors.password
                      ? "futuristic-input error-input"
                      : "futuristic-input"
                  }
                />
                <span
                  className="futuristic-eye-icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </span>
              </div>
              {errors.password && (
                <div className="futuristic-error-message">{errors.password}</div>
              )}
            </div>

            {/* Additional Fields for Entreprise */}
            {formData.role === "entreprise" && (
              <>
                {/* Matricule Fiscale */}
                <div className="futuristic-form-group">
                  <label
                    className="futuristic-signup-label"
                    htmlFor="matriculeFiscale"
                  >
                    Matricule Fiscale
                  </label>
                  <div className="futuristic-input-container">
                    <input
                      type="text"
                      id="matriculeFiscale"
                      name="matriculeFiscale"
                      placeholder="Entrez votre matricule fiscale"
                      value={formData.matriculeFiscale}
                      onChange={handleChange}
                      className={
                        errors.matriculeFiscale
                          ? "futuristic-input error-input"
                          : "futuristic-input"
                      }
                    />
                  </div>
                  {errors.matriculeFiscale && (
                    <div className="futuristic-error-message">
                      {errors.matriculeFiscale}
                    </div>
                  )}
                </div>

                {/* Adresse */}
                <div className="futuristic-form-group">
                  <label className="futuristic-signup-label" htmlFor="adresse">
                    Adresse
                  </label>
                  <div className="futuristic-input-container">
                    <input
                      type="text"
                      id="adresse"
                      name="adresse"
                      placeholder="Entrez votre adresse"
                      value={formData.adresse}
                      onChange={handleChange}
                      className={
                        errors.adresse
                          ? "futuristic-input error-input"
                          : "futuristic-input"
                      }
                    />
                  </div>
                  {errors.adresse && (
                    <div className="futuristic-error-message">{errors.adresse}</div>
                  )}
                </div>

                {/* Type */}
                <div className="futuristic-form-group">
                  <label className="futuristic-signup-label" htmlFor="type">
                    Type
                  </label>
                  <div className="futuristic-input-container">
                    <input
                      type="text"
                      id="type"
                      name="type"
                      placeholder="Entrez le type d'entreprise"
                      value={formData.type}
                      onChange={handleChange}
                      className={
                        errors.type
                          ? "futuristic-input error-input"
                          : "futuristic-input"
                      }
                    />
                  </div>
                  {errors.type && (
                    <div className="futuristic-error-message">{errors.type}</div>
                  )}
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={`futuristic-signup-button ${loading ? "loading" : ""}`}
              disabled={loading}
            >
              {loading ? "Inscription en cours..." : "S'inscrire"}
            </button>
          </form>

          {/* Already Have an Account? */}
          <div className="futuristic-signup-footer">
            <p>Vous avez déjà un compte ?</p>
            <Link to="/login" className="futuristic-signup-link">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
