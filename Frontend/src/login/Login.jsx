import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import React from "react";
import "./Login.css";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = await axios.post(
        "http://localhost:3001/Frontend/login",
        formData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (result.data.status) {
        localStorage.setItem("token", result.data.token);
        const userRole = result.data.role || "CANDIDATE";
        localStorage.setItem("role", userRole);

        if (userRole === "ENTERPRISE") {
          navigate("/enterprise-dashboard");
        } else {
          navigate("/home");
        }
      } else {
        setError(result.data.message || "Email or password is incorrect!");
        if (result.data.emailVerified === false) {
          navigate("/verify-email");
        }
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Unable to login.");
    }
  };

  

  return (
      <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
        <div className="bg-white p-3 rounded w-25">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="mb-3">
              <label htmlFor="email">
                <strong>Email</strong>
              </label>
              <input
                type="email"
                id="email"
                placeholder="Enter Email"
                autoComplete="off"
                name="email"
                className="form-control rounded-0"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="password">
                <strong>Password</strong>
              </label>
              <input
                type="password"
                id="password"
                placeholder="Enter Password"
                name="password"
                className="form-control rounded-0"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 rounded-0">
              Login
            </button>

            <Link to="/forgotPassword">Forgot Password</Link>

            <p>Don't Have an Account?</p>
            <Link
              to="/register"
              className="btn btn-default border w-100 bg-light rounded-0"
            >
              Sign Up
            </Link>

            
          </form>
        </div>
      </div>
    
  );
}

export default Login;
