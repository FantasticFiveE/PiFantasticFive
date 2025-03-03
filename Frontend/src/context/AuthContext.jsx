import { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types"; // ✅ Importer PropTypes

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const savedUser = JSON.parse(localStorage.getItem("user"));

      if (token && savedUser) {
        setIsAuthenticated(true);
        setUser(savedUser);
      }
    } catch (error) {
      console.error("Error reading from localStorage", error);
    }
  }, []);

  const login = (userData, token) => {
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
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

// ✅ Définition des PropTypes pour éviter l'erreur ESLint
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
