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
      setMessage("✅ Vérification réussie ! Redirection vers la connexion...");

      // Redirect to login page after successful verification
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setStatus("error");
      setMessage("❌ Code incorrect. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h2 className="verify-email-title">Vérification de l'Email</h2>
        <p className="verify-email-subtitle">
          <FaEnvelope className="email-icon" /> Un code de vérification a été envoyé à votre adresse email.
        </p>

        <form className="verify-email-form" onSubmit={handleSubmit}>
          <div className="verify-email-input-container">
            <input
              type="email"
              placeholder="Votre Email"
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
              placeholder="Code de vérification"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="verify-email-input"
            />
          </div>

          <button type="submit" className={`verify-email-button ${loading ? "loading" : ""}`} disabled={loading}>
            {loading ? "Vérification en cours..." : "Vérifier"}
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
