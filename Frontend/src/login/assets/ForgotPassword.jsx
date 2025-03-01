import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ForgotPassword.css"; // New CSS file

const ForgotPassword = () => {
  const [formData, setFormData] = useState({ email: "" });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    axios
      .post("http://localhost:3001/forgot-password", formData)
      .then(() => {
        setMessage("✅ Check your email for a password reset link.");
        setTimeout(() => navigate("/login"), 3000); // Redirect after showing message
      })
      .catch(() => {
        setMessage("❌ An error occurred. Please try again later.");
      });
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <h2 className="forgot-password-title">Forgot Your Password?</h2>
        <p className="forgot-password-subtitle">
          Enter your email and we’ll send you a link to reset your password.
        </p>

        {message && <div className="forgot-password-message">{message}</div>}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="forgot-password-input-group">
            <label htmlFor="email" className="forgot-password-label">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className={`forgot-password-input ${errors.email ? 'error' : ''}`}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <button type="submit" className="forgot-password-button">Send Reset Link</button>
        </form>

        <div className="forgot-password-footer">
          <Link to="/login" className="back-to-login">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
