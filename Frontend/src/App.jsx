import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider } from "./context/AuthContext";   
import { GoogleOAuthProvider } from "@react-oauth/google";  // ✅ Import GoogleOAuthProvider

// Components
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

// Pages
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Service from "./pages/Service/Service";
import Why from "./pages/Why/Why";
import Team from "./pages/Team/Team";
import Login from "./login/Login";
import Signup from "./login/Signup";
import VerifyEmail from "./login/assets/VerifyEmail";
import VerifyEmailPending from "./login/assets/VerifyEmailPending";
import ForgotPassword from "./login/assets/ForgotPassword";
import ResetPassword from "./login/assets/ResetPassword";

const CLIENT_ID = "122105051479-dna9hfi1gskvlbobkhkpboiml67i4gl7.apps.googleusercontent.com"; // 🔴 Remplace par ton vrai Client ID Google

function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}> {/* ✅ Ajout ici */}
      <AuthProvider> 
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/service" element={<Service />} />
            <Route path="/why" element={<Why />} />
            <Route path="/team" element={<Team />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
            <Route path="/forgotPassword" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
