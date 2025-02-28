import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import React from "react";

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    email: "",
  });
  
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Function to handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Form validation function
  const validateForm = () => {
    const errors = {};
    if (!formData.email) {
      errors.email = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    return errors;
  };

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Sending the request to reset password
    axios.post('http://localhost:3001/forgot-password', formData)
      .then((result) => {
        console.log(result);
        alert("Check your email for a password reset link.");
        navigate('/login'); // Redirect to login page after submission
      })
      .catch((err) => {
        console.error(err);
        alert("An error occurred. Please try again later.");
      });
  };

  return (
    <div className="signup-container">
      <div className="signup-form-container">
        <h2 className="signup-header">Forgot Password</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group mb-3">
            <label htmlFor="email" className="form-label">
              <strong>Email</strong>
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter Email"
              autoComplete="off"
              name="email"
              className={`form-control ${errors.email ? 'is-invalid' : ''}`}
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <button type="submit" className="btn-submit">
            Send Reset Link
          </button>
        </form>

        <div className="signup-footer">
          {/* Optionally, add a link back to login or home */}
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
