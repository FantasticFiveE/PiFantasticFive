import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Signup.css';
import { FaUser, FaBuilding, FaEye, FaEyeSlash, FaFileUpload, FaSignInAlt } from 'react-icons/fa';
import.meta.env.VITE_BACKEND_URL
import.meta.env.VITE_SOCKET_URL

function Signup() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "CANDIDATE",
        resume: null,
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
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [resumeData, setResumeData] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('enterprise.')) {
            const key = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                enterprise: {
                    ...prev.enterprise,
                    [key]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({ ...prev, resume: e.target.files[0] }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name) newErrors.name = "Name is required.";
        if (!formData.email) newErrors.email = "Email is required.";
        if (!formData.password) newErrors.password = "Password is required.";

        if (formData.role === "ENTERPRISE") {
            const e = formData.enterprise;
            if (!e.name) newErrors.enterpriseName = "Enterprise name is required.";
            if (!e.industry) newErrors.industry = "Industry is required.";
            if (!e.location) newErrors.location = "Location is required.";
            if (!e.website) newErrors.website = "Website is required.";
            if (!e.description) newErrors.description = "Description is required.";
            if (!e.employeeCount) newErrors.employeeCount = "Employee count is required.";
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
            const formDataToSend = new FormData();
      
            // Common info
            formDataToSend.append('name', formData.name);
            formDataToSend.append('email', formData.email);
            formDataToSend.append('password', formData.password);
            formDataToSend.append('role', formData.role);
      
            if (formData.resume) {
                formDataToSend.append('resume', formData.resume);
            }
      
            // Enterprise info only if necessary
            if (formData.role === "ENTERPRISE") {
                formDataToSend.append('enterpriseName', formData.enterprise.name);
                formDataToSend.append('industry', formData.enterprise.industry);
                formDataToSend.append('location', formData.enterprise.location);
                formDataToSend.append('website', formData.enterprise.website);
                formDataToSend.append('description', formData.enterprise.description);
                formDataToSend.append('employeeCount', formData.enterprise.employeeCount);
            }
      
            const result = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/Frontend/register`, formDataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
            });

      
            setConfirmationMessage("A verification code has been sent to your email.");
      
            setTimeout(() => {
                navigate(`/verify-email?email=${formData.email}`);
            }, 3000);
        } catch (err) {
            console.error("❌ Registration error:", err.response?.data?.message || err.message);
            setErrors({ submit: err.response?.data?.message || "Registration error. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };
      
    const redirectToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="futuristic-signup-container">
            <div className="animated-bg-overlay"></div>
            <div className="animated-particles"></div>

            <div className="futuristic-signup-right">
                <div className="futuristic-signup-card tilt-effect">
                    <div className="card-glow"></div>
                    <h2 className="futuristic-signup-heading">Create Account</h2>

                    {confirmationMessage && <div className="futuristic-confirmation-message">{confirmationMessage}</div>}
                    {errors.submit && <div className="futuristic-error-message">{errors.submit}</div>}

                    <form className="futuristic-signup-form" onSubmit={handleSubmit}>
                        {/* Role selection */}
                        <div className="futuristic-form-group futuristic-role-group">
                            <div 
                                className={`futuristic-role-button ${formData.role === "CANDIDATE" ? "selected" : ""}`} 
                                onClick={() => setFormData({ ...formData, role: "CANDIDATE" })}
                            >
                                <FaUser className="role-icon" /> Candidate
                                <span className="btn-shine"></span>
                            </div>
                            <div 
                                className={`futuristic-role-button ${formData.role === "ENTERPRISE" ? "selected" : ""}`} 
                                onClick={() => setFormData({ ...formData, role: "ENTERPRISE" })}
                            >
                                <FaBuilding className="role-icon" /> Enterprise
                                <span className="btn-shine"></span>
                            </div>
                        </div>

                        <div className="input-field-container">
                            <input 
                                type="text" 
                                name="name" 
                                placeholder="Full Name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                className={errors.name ? "error-input" : ""}
                            />
                            <span className="input-focus-effect"></span>
                            {errors.name && <div className="input-error">{errors.name}</div>}
                        </div>

                        <div className="input-field-container">
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="Email" 
                                value={formData.email} 
                                onChange={handleChange}
                                className={errors.email ? "error-input" : ""}
                            />
                            <span className="input-focus-effect"></span>
                            {errors.email && <div className="input-error">{errors.email}</div>}
                        </div>

                        <div className="input-field-container password-container">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                placeholder="Password" 
                                value={formData.password} 
                                onChange={handleChange}
                                className={errors.password ? "error-input" : ""}
                            />
                            <span className="input-focus-effect"></span>
                            <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                            {errors.password && <div className="input-error">{errors.password}</div>}
                        </div>

                        {formData.role === "ENTERPRISE" && (
                            <div className="futuristic-enterprise-fields">
                                <div className="input-field-container">
                                    <input 
                                        type="text" 
                                        name="enterprise.name" 
                                        placeholder="Enterprise Name" 
                                        value={formData.enterprise.name} 
                                        onChange={handleChange}
                                        className={errors.enterpriseName ? "error-input" : ""}
                                    />
                                    <span className="input-focus-effect"></span>
                                    {errors.enterpriseName && <div className="input-error">{errors.enterpriseName}</div>}
                                </div>

                                <div className="enterprise-row">
                                    <div className="input-field-container half-width">
                                        <input 
                                            type="text" 
                                            name="enterprise.industry" 
                                            placeholder="Industry" 
                                            value={formData.enterprise.industry} 
                                            onChange={handleChange}
                                            className={errors.industry ? "error-input" : ""}
                                        />
                                        <span className="input-focus-effect"></span>
                                        {errors.industry && <div className="input-error">{errors.industry}</div>}
                                    </div>

                                    <div className="input-field-container half-width">
                                        <input 
                                            type="text" 
                                            name="enterprise.location" 
                                            placeholder="Location" 
                                            value={formData.enterprise.location} 
                                            onChange={handleChange}
                                            className={errors.location ? "error-input" : ""}
                                        />
                                        <span className="input-focus-effect"></span>
                                        {errors.location && <div className="input-error">{errors.location}</div>}
                                    </div>
                                </div>

                                <div className="input-field-container">
                                    <input 
                                        type="url" 
                                        name="enterprise.website" 
                                        placeholder="Website" 
                                        value={formData.enterprise.website} 
                                        onChange={handleChange}
                                        className={errors.website ? "error-input" : ""}
                                    />
                                    <span className="input-focus-effect"></span>
                                    {errors.website && <div className="input-error">{errors.website}</div>}
                                </div>

                                <div className="input-field-container">
                                    <textarea 
                                        name="enterprise.description" 
                                        placeholder="Description" 
                                        value={formData.enterprise.description} 
                                        onChange={handleChange}
                                        className={errors.description ? "error-input textarea-input" : "textarea-input"}
                                    ></textarea>
                                    <span className="input-focus-effect"></span>
                                    {errors.description && <div className="input-error">{errors.description}</div>}
                                </div>

                                <div className="input-field-container">
                                    <input 
                                        type="number" 
                                        name="enterprise.employeeCount" 
                                        placeholder="Employee Count" 
                                        value={formData.enterprise.employeeCount} 
                                        onChange={handleChange}
                                        className={errors.employeeCount ? "error-input" : ""}
                                    />
                                    <span className="input-focus-effect"></span>
                                    {errors.employeeCount && <div className="input-error">{errors.employeeCount}</div>}
                                </div>
                            </div>
                        )}

                        <div className="futuristic-form-group resume-upload">
                            <label htmlFor="resume" className="futuristic-file-upload-label">
                                <FaFileUpload className="upload-icon" /> Upload Resume (PDF)
                                <span className="upload-shine"></span>
                            </label>
                            <input 
                                type="file" 
                                id="resume" 
                                name="resume" 
                                accept="application/pdf" 
                                onChange={handleFileChange} 
                                className="futuristic-file-input" 
                            />
                            {formData.resume && (
                                <div className="file-selected">
                                    {formData.resume.name}
                                </div>
                            )}
                        </div>

                        <div className="button-container">
                            <button 
                                type="submit" 
                                className={`futuristic-signup-button ${isLoading ? 'loading' : ''}`} 
                                disabled={isLoading}
                            >
                                <span className="button-text">{isLoading ? "Creating Account..." : "Create Account"}</span>
                                <span className="button-3d-effect"></span>
                            </button>
                        </div>
                    </form>

                    {resumeData && (
                        <div className="resume-data">
                            <h3>📄 Extracted Resume Data</h3>
                            <p><strong>Email:</strong> {resumeData.email || "Not found"}</p>
                            <p><strong>Phone:</strong> {resumeData.phone || "Not found"}</p>
                            <p><strong>Skills:</strong> {resumeData.skills?.join(', ') || "Not found"}</p>
                            <p><strong>Languages:</strong> {resumeData.languages?.join(', ') || "Not found"}</p>
                        </div>
                    )}

                    <div className="login-redirect">
                        <p>Already have an account?</p>
                        <button 
                            type="button" 
                            className="futuristic-login-button" 
                            onClick={redirectToLogin}
                        >
                            <FaSignInAlt className="login-icon" /> Login
                            <span className="button-3d-effect"></span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Signup;