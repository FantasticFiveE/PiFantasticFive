import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    const [resumeData, setResumeData] = useState(null); // ✅ Stockage des données extraites du CV
    const navigate = useNavigate();

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

    const handleFileChange = (e) => {
        setFormData({ ...formData, resume: e.target.files[0] });
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name) newErrors.name = "Name is required.";
        if (!formData.email) newErrors.email = "Email is required.";
        if (!formData.password) newErrors.password = "Password is required.";

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

    const cleanFormData = (formData) => {
        if (formData.role !== "ENTERPRISE") {
            const cleanedData = { ...formData };
            delete cleanedData.enterprise;
            return cleanedData;
        }
        return formData;
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
            const cleanedData = cleanFormData(formData);
            const formDataToSend = new FormData();
            formDataToSend.append('name', cleanedData.name);
            formDataToSend.append('email', cleanedData.email);
            formDataToSend.append('password', cleanedData.password);
            formDataToSend.append('role', cleanedData.role);

            if (cleanedData.resume) {
                formDataToSend.append('resume', cleanedData.resume);
            }

            // 🚀 Envoie du formulaire d'inscription
            const result = await axios.post('http://localhost:3001/Frontend/register', formDataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setConfirmationMessage("A verification code has been sent to your email.");

            // ✅ Récupérer les données du CV après l'analyse par le backend
            if (cleanedData.resume) {
                const formDataResume = new FormData();
                formDataResume.append('resume', cleanedData.resume);

                const resumeResponse = await axios.post('http://127.0.0.1:5002/upload', formDataResume, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                setResumeData(resumeResponse.data); // 💾 Stocker les données du CV dans l'état
            }

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
                        {/* Role Selection */}
                        <div className="futuristic-form-group futuristic-role-group">
                            <div 
                                className={`futuristic-role-button ${formData.role === "CANDIDATE" ? "selected" : ""}`}
                                onClick={() => setFormData({ ...formData, role: "CANDIDATE" })}
                            >
                                <FaUser /> Candidate
                            </div>
                            <div 
                                className={`futuristic-role-button ${formData.role === "ENTERPRISE" ? "selected" : ""}`}
                                onClick={() => setFormData({ ...formData, role: "ENTERPRISE" })}
                            >
                                <FaBuilding /> Enterprise
                            </div>
                        </div>

                        <input type="text" placeholder="Full Name" name="name" value={formData.name} onChange={handleChange} />
                        <input type="email" placeholder="Email" name="email" value={formData.email} onChange={handleChange} />

                        <div className="password-container">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="Password" 
                                name="password" 
                                value={formData.password} 
                                onChange={handleChange} 
                            />
                            <span onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>

                        {/* Resume Upload */}
                        <div className="futuristic-form-group">
                            <label htmlFor="resume" className="futuristic-file-upload-label">
                                <FaFileUpload /> Upload Resume (PDF)
                            </label>
                            <input 
                                type="file" 
                                id="resume" 
                                name="resume" 
                                accept="application/pdf" 
                                onChange={handleFileChange} 
                                className="futuristic-file-input"
                            />
                        </div>

                        <button type="submit" className={`futuristic-signup-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>

                    {/* ✅ Affichage des données extraites du CV */}
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
