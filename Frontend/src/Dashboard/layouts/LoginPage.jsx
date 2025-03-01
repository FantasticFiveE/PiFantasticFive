import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heading, Subtitle } from "../components/UI/Typography";
import Button from "../components/UI/Button";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState(null); // Store admin data
  const [loading, setLoading] = useState(true); // Track loading state
  const navigate = useNavigate();

  // Fetch admin data from the backend
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const usersData = await response.json();

        // Find the admin user (role === "ADMIN")
        const adminData = usersData.find((user) => user.role === "ADMIN");
        if (!adminData) {
          throw new Error("Admin account not found");
        }

        setAdmin(adminData);
        setLoading(false);
      } catch (err) {
        setError("Error fetching admin data: " + err.message);
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    // Check if admin data is loaded
    if (!admin) {
      setError("Admin account not found.");
      return;
    }

    // Validate credentials
    if (email === admin.email && password === admin.password) {
      // Successful login
      setError("");

      // Save admin data to localStorage
      localStorage.setItem("admin", JSON.stringify(admin));

      // Redirect to the profile page
      navigate("/");
    } else {
      setError("Invalid email or password.");
    }
  };

  if (loading) {
    return <div>Loading admin data...</div>;
  }

  return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="card p-4 shadow" style={{ width: "400px" }}>
        <h2 className="text-center mb-4">Admin Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;