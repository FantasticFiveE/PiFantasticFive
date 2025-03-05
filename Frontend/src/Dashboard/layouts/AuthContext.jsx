import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Track authentication state

  // Login function
  const login = async (email, password) => {
    try {
      // Call your API to authenticate the user
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthenticated(true); // Update authentication state
        localStorage.setItem("admin", JSON.stringify(data.user)); // Store user data in localStorage

        // Update last login timestamp
        await updateLastLogin(data.user._id);
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      console.error("Login Error:", error);
    }
  };

  // Function to update last login timestamp
  const updateLastLogin = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/last-login`, {
        method: "PUT",
      });

      if (!response.ok) {
        throw new Error("Failed to update last login");
      }

      const data = await response.json();
      console.log("Last login updated:", data);
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  };

  // Logout function
  const logout = () => {
    setIsAuthenticated(false); // Update authentication state
    localStorage.removeItem("admin"); // Remove user data from localStorage
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);