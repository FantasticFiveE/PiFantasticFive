import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ResetPassword.css";

const ResetPassword = () => {
    const { token } = useParams();
    const [formData, setFormData] = useState({ password: "" });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.password) {
            errors.password = "Password is required.";
        } else if (formData.password.length < 6) {
            errors.password = "Password must be at least 6 characters long.";
        }
        return errors;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        axios.post(`http://localhost:3001/reset-password/${token}`, {
            password: formData.password  // ✅ Correct field name
        })
        .then(() => {
            setMessage("✅ Password updated successfully!");
            setTimeout(() => navigate("/login"), 2000);
        })
        .catch((err) => {
            setMessage(err.response?.data?.message || "❌ An error occurred. Please try again.");
        });
    };

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <h2 className="reset-password-title">Reset Your Password</h2>
                <p className="reset-password-subtitle">Create a new password to access your account.</p>

                {message && <div className="reset-password-message">{message}</div>}

                <form onSubmit={handleSubmit} className="reset-password-form">
                    <div className="reset-password-input-group">
                        <label htmlFor="password" className="reset-password-label">New Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter new password"
                            className={`reset-password-input ${errors.password ? "error" : ""}`}
                            value={formData.password}
                            onChange={handleChange}
                        />
                        {errors.password && <div className="error-message">{errors.password}</div>}
                    </div>
                    <button type="submit" className="reset-password-button">Update Password</button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
