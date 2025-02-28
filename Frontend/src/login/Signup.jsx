import { useState } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import React from "react";
import './Signup.css'; // Assurez-vous d'inclure ce fichier CSS pour les styles

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "CANDIDATE", // Par défaut "CANDIDATE"
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
  const navigate = useNavigate();
  const [confirmationMessage, setConfirmationMessage] = useState("");
  // Fonction pour mettre à jour l'état du formulaire
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

  // Validation des champs
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

    // Validation des champs pour "Entreprise"
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

  // Fonction de soumission du formulaire
  const handleSubmit = (e) => {
    e.preventDefault();
  
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
  
    axios.post('http://localhost:3001/Frontend/register', formData)
      .then(result => {
        console.log(result);
  
        // Afficher le message de confirmation
        setConfirmationMessage("Un code de vérification a été envoyé à votre adresse email.");
  
        // Rediriger vers la page VerifyEmail après 3 secondes
        setTimeout(() => {
          navigate(`/verify-email?email=${formData.email}`);
        }, 3000);
      })
      .catch(err => {
        console.log(err);
        setErrors({ submit: "Erreur lors de l'inscription. Veuillez réessayer." });
      });
  };

  return (
    <div className="signup-container">
      <div className="signup-form-container">
        <h2 className="signup-header">Register</h2>
  
        {/* Afficher le message de confirmation */}
        {confirmationMessage && (
          <div className="confirmation-message">
            {confirmationMessage}
          </div>
        )}
  
        <form onSubmit={handleSubmit}>
          {/* Champ pour le role placé en haut */}
          <div className="input-group mb-3">
            <label htmlFor="role" className="form-label">
              <strong>Role</strong>
            </label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="CANDIDATE">Candidat</option>
              <option value="ENTERPRISE">Entreprise</option>
            </select>
          </div>
  
          {/* Champs pour name, email et password sous le role */}
          <div className="input-group mb-3">
            <label htmlFor="name" className="form-label">
              <strong>Name</strong>
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter Name"
              autoComplete="off"
              name="name"
              className={`form-control ${errors.name ? 'is-invalid' : ''}`}
              value={formData.name}
              onChange={handleChange}
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>
  
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
  
          <div className="input-group mb-3">
            <label htmlFor="password" className="form-label">
              <strong>Password</strong>
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter Password"
              name="password"
              className={`form-control ${errors.password ? 'is-invalid' : ''}`}
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>
  
          {/* Champs spécifiques à l'Entreprise */}
{formData.role === "ENTERPRISE" && (
  <>
    {/* Enterprise Name */}
    <div className="input-group mb-3">
      <label htmlFor="enterprise.name" className="form-label">
        <strong>Enterprise Name</strong>
      </label>
      <input
        type="text"
        id="enterprise.name"
        name="enterprise.name"
        className={`form-control ${errors.enterpriseName ? 'is-invalid' : ''}`}
        value={formData.enterprise.name}
        onChange={handleChange}
      />
      {errors.enterpriseName && <div className="invalid-feedback">{errors.enterpriseName}</div>}
    </div>

    {/* Industry */}
    <div className="input-group mb-3">
      <label htmlFor="enterprise.industry" className="form-label">
        <strong>Industry</strong>
      </label>
      <input
        type="text"
        id="enterprise.industry"
        name="enterprise.industry"
        className={`form-control ${errors.industry ? 'is-invalid' : ''}`}
        value={formData.enterprise.industry}
        onChange={handleChange}
      />
      {errors.industry && <div className="invalid-feedback">{errors.industry}</div>}
    </div>

    {/* Location */}
    <div className="input-group mb-3">
      <label htmlFor="enterprise.location" className="form-label">
        <strong>Location</strong>
      </label>
      <input
        type="text"
        id="enterprise.location"
        name="enterprise.location"
        className={`form-control ${errors.location ? 'is-invalid' : ''}`}
        value={formData.enterprise.location}
        onChange={handleChange}
      />
      {errors.location && <div className="invalid-feedback">{errors.location}</div>}
    </div>

    {/* Website */}
    <div className="input-group mb-3">
      <label htmlFor="enterprise.website" className="form-label">
        <strong>Website</strong>
      </label>
      <input
        type="text"
        id="enterprise.website"
        name="enterprise.website"
        className={`form-control ${errors.website ? 'is-invalid' : ''}`}
        value={formData.enterprise.website}
        onChange={handleChange}
      />
      {errors.website && <div className="invalid-feedback">{errors.website}</div>}
    </div>

    {/* Description */}
    <div className="input-group mb-3">
      <label htmlFor="enterprise.description" className="form-label">
        <strong>Description</strong>
      </label>
      <textarea
        id="enterprise.description"
        name="enterprise.description"
        className={`form-control ${errors.description ? 'is-invalid' : ''}`}
        value={formData.enterprise.description}
        onChange={handleChange}
      />
      {errors.description && <div className="invalid-feedback">{errors.description}</div>}
    </div>

    {/* Employee Count */}
    <div className="input-group mb-3">
      <label htmlFor="enterprise.employeeCount" className="form-label">
        <strong>Employee Count</strong>
      </label>
      <input
        type="number"
        id="enterprise.employeeCount"
        name="enterprise.employeeCount"
        className={`form-control ${errors.employeeCount ? 'is-invalid' : ''}`}
        value={formData.enterprise.employeeCount}
        onChange={handleChange}
      />
      {errors.employeeCount && <div className="invalid-feedback">{errors.employeeCount}</div>}
    </div>
  </>
)}

  
          <button type="submit" className="btn-submit">
            Register
          </button>
        </form>
  
        <div className="signup-footer">
          <p>Already Have an account?</p>
          <Link to="/login" className="btn-link">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Signup;
