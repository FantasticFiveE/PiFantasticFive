import { createContext, useState, useEffect, useContext } from "react";
import PropTypes from "prop-types";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ⏳ empêche les flashs

  const login = (userData, token) => {
    localStorage.setItem("token", token); // ✅ encore ici
    localStorage.setItem("user", JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };
  

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setUser(null);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    if (!token) {
      setLoading(false);
      return;
    }
  
    const checkAuth = async () => {
      try {
        const res = await fetch("http://localhost:3001/Frontend/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!res.ok) {
          logout();
        } else {
          const userData = await res.json();
          setIsAuthenticated(true);
          setUser(userData);
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };
  
    checkAuth();
  }, []);
  
  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
