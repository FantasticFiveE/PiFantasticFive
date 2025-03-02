import { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import React from "react";
import './Signup.css';
import { FaUser, FaEnvelope, FaLock, FaBuilding, FaIndustry, FaMapMarkerAlt, FaGlobe, FaFileAlt, FaUsers, FaEye, FaEyeSlash } from 'react-icons/fa';

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CANDIDATE",
    enterprise: {
      name: "",
      industry: "",
      location: "",
      website: "",
      description: "",
      employeeCount: 0,
    },
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [confirmationMessage, setConfirmationMessage] = useState("");
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('enterprise.')) {
      setFormData({
        ...formData,
        enterprise: {
          ...formData.enterprise,
          [name.split('.')[1]]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

    // Validation for Enterprise fields
    if (formData.role === "ENTERPRISE") {
      if (!formData.enterprise.name) newErrors.enterpriseName = "Enterprise name is required.";
      if (!formData.enterprise.industry) newErrors.industry = "Industry is required.";
      if (!formData.enterprise.location) newErrors.location = "Location is required.";
      if (!formData.enterprise.website) newErrors.website = "Website is required.";
      if (!formData.enterprise.description) newErrors.description = "Description is required.";
      if (!formData.enterprise.employeeCount) newErrors.employeeCount = "Employee count is required.";
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

    setIsLoading(true);
  
    try {
      const result = await axios.post('http://localhost:3001/Frontend/register', formData);
      console.log(result);
      
      setConfirmationMessage("A verification code has been sent to your email.");
      
      setTimeout(() => {
        navigate(`/verify-email?email=${formData.email}`);
      }, 3000);
    } catch (err) {
      console.log(err);
      setErrors({ submit: "Registration error. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="futuristic-signup-container">
      {/* Animated background overlay */}
      <div className="animated-bg-overlay"></div>
      
      {/* Left panel - Branding */}
      <div className="futuristic-signup-left">
        <div className="futuristic-signup-left-content floating-brand fade-in-left">
          <div className="futuristic-signup-logo-container">
          <img 
  src="/images/nexthire.png" 
  alt="Company Logo" 
  className="futuristic-company-logo" 
  onError={(e) => { e.target.src = 'https://placehold.co/80x80'; }}
/>
          </div>
          <h1 className="futuristic-signup-brand">NextHire</h1>
          <p className="futuristic-signup-text">
            Join our platform to connect with opportunities and talents in a seamless experience.
          </p>
        </div>
      </div>
      
      {/* Right panel - Form */}
      <div className="futuristic-signup-right">
        <div className="futuristic-signup-card float-up fade-in-right">
          <h2 className="futuristic-signup-heading">Create Account</h2>
          <p className="futuristic-signup-subheading">Start your journey with us today</p>
          
          {confirmationMessage && (
            <div className="futuristic-confirmation-message">
              {confirmationMessage}
            </div>
          )}
          
          {errors.submit && (
            <div className="futuristic-error-message">
              {errors.submit}
            </div>
          )}
          
          <form className="futuristic-signup-form" onSubmit={handleSubmit}>
            {/* Role selection */}
            <div className="futuristic-form-group futuristic-role-group">
              <div 
                className={`futuristic-role-button ${formData.role === "CANDIDATE" ? "selected" : ""}`}
                onClick={() => setFormData({...formData, role: "CANDIDATE"})}
              >
                <FaUser style={{ marginRight: '8px' }} />
                Candidate
              </div>
              <div 
                className={`futuristic-role-button ${formData.role === "ENTERPRISE" ? "selected" : ""}`}
                onClick={() => setFormData({...formData, role: "ENTERPRISE"})}
              >
                <FaBuilding style={{ marginRight: '8px' }} />
                Enterprise
              </div>
            </div>
            
            {/* Name field */}
            <div className="futuristic-form-group">
              <label className="futuristic-signup-label" htmlFor="name">Full Name</label>
              <div className="futuristic-input-container">
                <input
                  type="text"
                  id="name"
                  name="name"
                  className={`futuristic-input ${errors.name ? 'error-input' : ''}`}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {errors.name && <div className="futuristic-error-message">{errors.name}</div>}
            </div>
            
            {/* Email field */}
            <div className="futuristic-form-group">
              <label className="futuristic-signup-label" htmlFor="email">Email Address</label>
              <div className="futuristic-input-container">
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`futuristic-input ${errors.email ? 'error-input' : ''}`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && <div className="futuristic-error-message">{errors.email}</div>}
            </div>
            
            {/* Password field */}
            <div className="futuristic-form-group">
              <label className="futuristic-signup-label" htmlFor="password">Password</label>
              <div className="futuristic-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className={`futuristic-input ${errors.password ? 'error-input' : ''}`}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
                <div 
                  className="futuristic-eye-icon" 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </div>
              </div>
              {errors.password && <div className="futuristic-error-message">{errors.password}</div>}
            </div>
            
            {/* Enterprise Fields */}
            {formData.role === "ENTERPRISE" && (
              <div className="futuristic-enterprise-fields">
                {/* Enterprise Name */}
                <div className="futuristic-form-group">
                  <label className="futuristic-signup-label" htmlFor="enterprise.name">Enterprise Name</label>
                  <div className="futuristic-input-container">
                    <input
                      type="text"
                      id="enterprise.name"
                      name="enterprise.name"
                      className={`futuristic-input ${errors.enterpriseName ? 'error-input' : ''}`}
                      placeholder="Enter enterprise name"
                      value={formData.enterprise.name}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.enterpriseName && <div className="futuristic-error-message">{errors.enterpriseName}</div>}
                </div>
                
                {/* Industry */}
                <div className="futuristic-form-group">
                  <label className="futuristic-signup-label" htmlFor="enterprise.industry">Industry</label>
                  <div className="futuristic-input-container">
                    <input
                      type="text"
                      id="enterprise.industry"
                      name="enterprise.industry"
                      className={`futuristic-input ${errors.industry ? 'error-input' : ''}`}
                      placeholder="Enter industry"
                      value={formData.enterprise.industry}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.industry && <div className="futuristic-error-message">{errors.industry}</div>}
                </div>
                
                {/* Location */}
                <div className="futuristic-form-group">
                  <label className="futuristic-signup-label" htmlFor="enterprise.location">Location</label>
                  <div className="futuristic-input-container">
                    <input
                      type="text"
                      id="enterprise.location"
                      name="enterprise.location"
                      className={`futuristic-input ${errors.location ? 'error-input' : ''}`}
                      placeholder="Enter location"
                      value={formData.enterprise.location}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.location && <div className="futuristic-error-message">{errors.location}</div>}
                </div>
                
                {/* Website */}
                <div className="futuristic-form-group">
                  <label className="futuristic-signup-label" htmlFor="enterprise.website">Website</label>
                  <div className="futuristic-input-container">
                    <input
                      type="text"
                      id="enterprise.website"
                      name="enterprise.website"
                      className={`futuristic-input ${errors.website ? 'error-input' : ''}`}
                      placeholder="Enter website URL"
                      value={formData.enterprise.website}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.website && <div className="futuristic-error-message">{errors.website}</div>}
                </div>
                
                {/* Description */}
                <div className="futuristic-form-group">
                  <label className="futuristic-signup-label" htmlFor="enterprise.description">Description</label>
                  <div className="futuristic-input-container">
                    <textarea
                      id="enterprise.description"
                      name="enterprise.description"
                      className={`futuristic-input futuristic-textarea ${errors.description ? 'error-input' : ''}`}
                      placeholder="Enter company description"
                      value={formData.enterprise.description}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.description && <div className="futuristic-error-message">{errors.description}</div>}
                </div>
                
                {/* Employee Count */}
                <div className="futuristic-form-group">
                  <label className="futuristic-signup-label" htmlFor="enterprise.employeeCount">Employee Count</label>
                  <div className="futuristic-input-container">
                    <input
                      type="number"
                      id="enterprise.employeeCount"
                      name="enterprise.employeeCount"
                      className={`futuristic-input ${errors.employeeCount ? 'error-input' : ''}`}
                      placeholder="Enter number of employees"
                      value={formData.enterprise.employeeCount}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.employeeCount && <div className="futuristic-error-message">{errors.employeeCount}</div>}
                </div>
              </div>
            )}
            
            {/* Submit  */}
            <button 
              type="submit" 
              className={`futuristic-signup-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="futuristic-signup-footer">
            <p>Already have an account?</p>
            <Link to="/login" className="futuristic-signup-link">Login now</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;