import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
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
  const navigate = useNavigate();

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
      if (!formData.matriculeFiscale)
        newErrors.matriculeFiscale = "Matricule Fiscale is required.";
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

    try {
      const result = await axios.post("http://localhost:3001/Frontend/register", formData);
      console.log(result);
      navigate("/login");
    } catch (err) {
      if (err.response && err.response.data) {
        setErrors({ api: err.response.data.message || "An error occurred. Please try again." });
      } else {
        setErrors({ api: "An error occurred. Please try again later." });
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form-container">
        <h2 className="signup-header">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group mb-3">
            <label htmlFor="role" className="form-label"><strong>Role</strong></label>
            <select name="role" className="form-select" value={formData.role} onChange={handleChange}>
              <option value="candidat">Candidat</option>
              <option value="entreprise">Entreprise</option>
            </select>
          </div>

          <div className="input-group mb-3">
            <label htmlFor="name" className="form-label"><strong>Name</strong></label>
            <input type="text" id="name" name="name" className={`form-control ${errors.name ? "is-invalid" : ""}`} value={formData.name} onChange={handleChange} required />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="input-group mb-3">
            <label htmlFor="email" className="form-label"><strong>Email</strong></label>
            <input type="email" id="email" name="email" className={`form-control ${errors.email ? "is-invalid" : ""}`} value={formData.email} onChange={handleChange} required />
            {errors.email && <div className="invalid-feedback">{errors.email}</div>}
          </div>

          <div className="input-group mb-3">
            <label htmlFor="password" className="form-label"><strong>Password</strong></label>
            <input type="password" id="password" name="password" className={`form-control ${errors.password ? "is-invalid" : ""}`} value={formData.password} onChange={handleChange} required />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          {formData.role === "entreprise" && (
            <>
              <div className="input-group mb-3">
                <label htmlFor="matriculeFiscale" className="form-label"><strong>Matricule Fiscale</strong></label>
                <input type="text" id="matriculeFiscale" name="matriculeFiscale" className="form-control" value={formData.matriculeFiscale} onChange={handleChange} required />
              </div>
            </>
          )}

          <button type="submit" className="btn-submit">Register</button>
          {errors.api && <div className="alert alert-danger">{errors.api}</div>}
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
