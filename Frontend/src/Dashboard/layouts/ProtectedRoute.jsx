import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAdminLoggedIn = localStorage.getItem("admin"); // Check if admin is logged in

  if (!isAdminLoggedIn) {
    // If not logged in, redirect to login
    return <Navigate to="/dashboard/login" replace />;
  }

  // If logged in, render the children (protected component)
  return children;
};

export default ProtectedRoute;