import { createContext, useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user"); // Get user data as string

      if (savedUser) {
        const parsedUser = JSON.parse(savedUser); // Parse only if exists
        if (token && parsedUser) {
          setIsAuthenticated(true);
          setUser(parsedUser); // Set user data properly
        }
      }
    } catch (error) {
      console.error("Error reading from localStorage", error);
    }
  }, []);

  const login = (userData, token) => {
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData)); // Store user data as JSON
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error("Error saving to localStorage", error);
    }
  };

  const logout = () => {
    try {
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (error) {
      console.error("Error removing from localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
