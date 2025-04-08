import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const location = useLocation();
    const token = localStorage.getItem("token");
    
    console.log("Current token:", token);

    if (!token) {
        console.log("No token found, redirecting to login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    let user;
    try {
        user = jwtDecode(token);
        console.log("Decoded user:", user);
        // Store user role in localStorage for easy access
        localStorage.setItem('userRole', user.role);
    } catch (error) {
        console.error("Token decode error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        console.log(`Role ${user.role} not in allowed roles:`, allowedRoles);
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default ProtectedRoute;