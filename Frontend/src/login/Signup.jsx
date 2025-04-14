import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './Signup.css';
import { FaUser, FaBuilding, FaEye, FaEyeSlash, FaFileUpload } from 'react-icons/fa';

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

    const cleanFormData = () => {
        const cleaned = { ...formData };
        if (cleaned.role !== "ENTERPRISE") {
            delete cleaned.enterprise;
        }
        return cleaned;
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
      
          // Infos communes à tous
          formDataToSend.append('name', formData.name);
          formDataToSend.append('email', formData.email);
          formDataToSend.append('password', formData.password);
          formDataToSend.append('role', formData.role);
      
          if (formData.resume) {
            formDataToSend.append('resume', formData.resume); // <-- le CV est bien envoyé ✅
          }
      
          // Ajoute les infos entreprise seulement si ENTERPRISE
          if (formData.role === "ENTERPRISE") {
            formDataToSend.append('enterpriseName', formData.enterprise.name);
            formDataToSend.append('industry', formData.enterprise.industry);
            formDataToSend.append('location', formData.enterprise.location);
            formDataToSend.append('website', formData.enterprise.website);
            formDataToSend.append('description', formData.enterprise.description);
            formDataToSend.append('employeeCount', formData.enterprise.employeeCount);
          }
      
          const result = await axios.post('http://localhost:3001/Frontend/register', formDataToSend, {
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
      
    

    return (
        <div className="futuristic-signup-container">
            <div className="animated-bg-overlay"></div>

            <div className="futuristic-signup-right">
                <div className="futuristic-signup-card">
                    <h2 className="futuristic-signup-heading">Create Account</h2>

                    {confirmationMessage && <div className="futuristic-confirmation-message">{confirmationMessage}</div>}
                    {errors.submit && <div className="futuristic-error-message">{errors.submit}</div>}

                    <form className="futuristic-signup-form" onSubmit={handleSubmit}>
                        {/* Role selection */}
                        <div className="futuristic-form-group futuristic-role-group">
                            <div className={`futuristic-role-button ${formData.role === "CANDIDATE" ? "selected" : ""}`} onClick={() => setFormData({ ...formData, role: "CANDIDATE" })}>
                                <FaUser /> Candidate
                            </div>
                            <div className={`futuristic-role-button ${formData.role === "ENTERPRISE" ? "selected" : ""}`} onClick={() => setFormData({ ...formData, role: "ENTERPRISE" })}>
                                <FaBuilding /> Enterprise
                            </div>
                        </div>

                        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} />
                        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />

                        <div className="password-container">
                            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} />
                            <span onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>

                        {formData.role === "ENTERPRISE" && (
                            <div className="futuristic-enterprise-fields">
                                <input type="text" name="enterprise.name" placeholder="Enterprise Name" value={formData.enterprise.name} onChange={handleChange} />
                                <input type="text" name="enterprise.industry" placeholder="Industry" value={formData.enterprise.industry} onChange={handleChange} />
                                <input type="text" name="enterprise.location" placeholder="Location" value={formData.enterprise.location} onChange={handleChange} />
                                <input type="url" name="enterprise.website" placeholder="Website" value={formData.enterprise.website} onChange={handleChange} />
                                <textarea name="enterprise.description" placeholder="Description" value={formData.enterprise.description} onChange={handleChange}></textarea>
                                <input type="number" name="enterprise.employeeCount" placeholder="Employee Count" value={formData.enterprise.employeeCount} onChange={handleChange} />
                            </div>
                        )}

                        <div className="futuristic-form-group">
                            <label htmlFor="resume" className="futuristic-file-upload-label">
                                <FaFileUpload /> Upload Resume (PDF)
                            </label>
                            <input type="file" id="resume" name="resume" accept="application/pdf" onChange={handleFileChange} className="futuristic-file-input" />
                        </div>

                        <button type="submit" className={`futuristic-signup-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </button>
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
                </div>
            </div>
        </div>
    );
}

export default Signup;
