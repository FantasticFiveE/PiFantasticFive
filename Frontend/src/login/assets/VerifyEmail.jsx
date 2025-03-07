import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./VerifyEmail.css";
import { FaEnvelope, FaLock, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve email from query parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const emailParam = queryParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setMessage("");

    try {
      const response = await axios.post("http://localhost:3001/Frontend/verify-email", {
        email,
        verificationCode: code,
      });

      setStatus("success");
      setMessage("✅ Verification successful! Redirecting to login...");

      // Redirect to login page after successful verification
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setStatus("error");
      setMessage("❌ Incorrect code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h2 className="verify-email-title">Email Verification</h2>
        <p className="verify-email-subtitle">
          <FaEnvelope className="email-icon" /> A verification code has been sent to your email address.
        </p>

        <form className="verify-email-form" onSubmit={handleSubmit}>
          <div className="verify-email-input-container">
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              readOnly
              className="verify-email-input"
            />
          </div>

          <div className="verify-email-input-container">
            <FaLock className="input-icon" />
            <input
              type="text"
              placeholder="Verification Code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="verify-email-input"
            />
          </div>

          <button type="submit" className={`verify-email-button ${loading ? "loading" : ""}`} disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        {message && (
          <div className={`verify-email-message ${status === "success" ? "success" : "error"}`}>
            {status === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
