import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./VerifyEmail.css";

function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
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

    try {
      const response = await axios.post("http://localhost:3001/Frontend/verify-email", {
        email,
        verificationCode: code,
      });

      setMessage(response.data.message);

      // Redirect to login page after successful verification
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Erreur lors de la vérification.");
    }
  };

  return (
    <div className="verify-email-container">
      <h2>Vérification de l'Email</h2>
      <p>📩 Un code de vérification vous a été envoyé par email.</p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Votre Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          readOnly // Make the email field read-only if it's pre-filled
        />
        <input
          type="text"
          placeholder="Code de vérification"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit">Vérifier</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default VerifyEmail;