import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import './Signup.css';
import { FaUser, FaBuilding, FaEye, FaEyeSlash } from 'react-icons/fa';

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
    const [confirmationMessage, setConfirmationMessage] = useState("");
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
            const cleanedData = cleanFormData(formData); // Nettoyage
            const result = await axios.post('http://localhost:3001/Frontend/register', cleanedData);
            console.log(result);

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

            <div className="futuristic-signup-left">
                <div className="futuristic-signup-left-content floating-brand fade-in-left">
                    <img 
                        src="/images/nexthire.png"
                        alt="NextHire Logo"
                        className="futuristic-company-logo"
                        onError={(e) => { e.target.src = 'https://placehold.co/80x80'; }}
                    />
                    <h1 className="futuristic-signup-brand">NextHire</h1>
                    <p className="futuristic-signup-text">
                        Join our platform to connect with opportunities and talents in a seamless experience.
                    </p>
                </div>
            </div>

            <div className="futuristic-signup-right">
                <div className="futuristic-signup-card float-up fade-in-right">
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

                        {/* Standard Fields */}
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

                        {/* Enterprise Fields */}
                        {formData.role === "ENTERPRISE" && (
                            <>
                                <input type="text" placeholder="Enterprise Name" name="enterprise.name" value={formData.enterprise.name} onChange={handleChange} />
                                <input type="text" placeholder="Industry" name="enterprise.industry" value={formData.enterprise.industry} onChange={handleChange} />
                                <input type="text" placeholder="Location" name="enterprise.location" value={formData.enterprise.location} onChange={handleChange} />
                                <input type="text" placeholder="Website" name="enterprise.website" value={formData.enterprise.website} onChange={handleChange} />
                                <textarea placeholder="Description" name="enterprise.description" value={formData.enterprise.description} onChange={handleChange}></textarea>
                                <input type="number" placeholder="Employee Count" name="enterprise.employeeCount" value={formData.enterprise.employeeCount} onChange={handleChange} />
                            </>
                        )}

                        <button type="submit" className={`futuristic-signup-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                            {isLoading ? "Creating Account..." : "Create Account"}
                        </button>

                        <p>Already have an account? <Link to="/login">Login now</Link></p>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Signup;
