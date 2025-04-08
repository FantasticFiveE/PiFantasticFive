import { createContext, useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
  
      // 🛡️ Vérifie que savedUser est une chaîne JSON valide
      if (savedUser && savedUser !== "undefined") {
        const parsedUser = JSON.parse(savedUser);
        if (token && parsedUser) {
          setIsAuthenticated(true);
          setUser(parsedUser);
        }
      }
    } catch (error) {
      console.error("Error reading from localStorage", error);
      // Si le JSON est corrompu, on le supprime pour éviter des erreurs futures
      localStorage.removeItem("user");
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
