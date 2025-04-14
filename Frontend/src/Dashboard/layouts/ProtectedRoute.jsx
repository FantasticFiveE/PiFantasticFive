import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth(); // ✅ Contexte
  const location = useLocation();

  if (loading) return null; // ⏳ ou un spinner

  const token = localStorage.getItem("token");
  console.log("🔐 Token at ProtectedRoute:", token);

  if (!isAuthenticated || !token) {
    console.warn("No token or not authenticated, redirecting...");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let decoded;
  try {
    decoded = jwtDecode(token);
  } catch (error) {
    console.error("Invalid token:", error);
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
    console.warn("Access denied for role:", decoded.role);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
