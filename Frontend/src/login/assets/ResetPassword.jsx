import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const { token } = useParams(); // Retrieve the token from the URL
  const [formData, setFormData] = useState({
    password: "",
  });
  
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const navigate = useNavigate();  // Navigate to another page after reset if needed

  // Handle changes in the form fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate the form
  const validateForm = () => {
    const errors = {};
    if (!formData.password) {
      errors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long.";
    }
    return errors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }

    // Send request to reset the password using the token
    axios
      .post(`http://localhost:3001/reset-password/${token}`, { password: formData.password })
      .then((result) => {
        console.log(result);
        setMessage("✅ Password updated successfully!");
        setTimeout(() => {
          navigate('/login'); // Redirect to login after successful password update
        }, 2000); // Redirect after 2 seconds
      })
      .catch((err) => {
        console.error(err);
        setMessage("❌ An error occurred. Please try again.");
      });
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-form">
        <h2 className="reset-password-header">Reset Password</h2>

        {message && <div className="message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="password" className="form-label">
              <strong>New Password</strong>
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter new password"
              autoComplete="off"
              name="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <div className="invalid-feedback">{errors.password}</div>}
          </div>

          <button type="submit" className="btn-submit">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
