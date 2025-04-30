import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import { AuthProvider } from "./context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

// Dashboard (Back Office) Components
import DashboardLayout from "./Dashboard/layouts/DashboardLayout";
import ManageCandidates from "./Dashboard/layouts/ManageCandidates";
import ManageEmployees from "./Dashboard/layouts/ManageEmployees";
import ApplicationInfo from "./Dashboard/components/Sections/ApplicationInfo";
import SideNav from "./Dashboard/components/NavBars/SideNav";
import TopNav from "./Dashboard/components/NavBars/TopNav";
import LoginPage from "./Dashboard/layouts/LoginPage";
import SettingsPage from "./Dashboard/layouts/SettingsPage";
import CalendarView from "./Dashboard/layouts/CalendarView";
import AllJobs from "./Dashboard/layouts/AllJobs";

// Front Office Pages
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
import Profile from "./profileFront/profile";
import EditProfile from "./profileFront/EditProfile";
import VideoCallPage from "./interview/VideoCall";
import ProtectedRoute from "./Dashboard/layouts/ProtectedRoute";
import EntrepriseProfile from "./pages/Entreprise/EntrepriseProfile";
import JobDetails from "./pages/JobDetails/JobDetails";
import QuizPage from "./pages/Quiz/QuizPage";
import CandidateProfile from "./pages/Candidate/CandidateProfile";
import CandidateMessages from './pages/CandidateMessages';


// ✅ Google Client ID
const CLIENT_ID = "122105051479-dna9hfi1gskvlbobkhkpboiml67i4gl7.apps.googleusercontent.com";




// ✅ OpenAI API Key Validation
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "❌ Clé API non chargée !";
console.log("🔑 OpenAI API Key Loaded:", OPENAI_API_KEY);
if (!OPENAI_API_KEY) {
  console.error("❌ OpenAI API Key is missing. Check your .env file!");
} else {
  console.log("🔑 OpenAI API Key Loaded");
}

// ✅ Dashboard Layout Wrapper
const DashboardLayoutWrapper = () => (
  <div className="app">
    <TopNav />
    <div className="row w-100 mt-4">
      <div className="col-1">
        <SideNav />
      </div>
      <div className="col-11 p-0">
        <Outlet />
      </div>
    </div>
  </div>
);

function App() {
  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Front Office Routes */}
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
            <Route path="/job/:id" element={<JobDetails />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/edit-profile/:id" element={<EditProfile />} />
            <Route path="/entreprise/:id" element={<EntrepriseProfile />} />
            <Route path="/interview/:interviewId" element={<VideoCallPage />} />
            <Route path="/quiz/:jobId" element={<QuizPage />} />
            <Route path="/candidate/:id" element={<CandidateProfile />} />
            <Route path="/messages" element={<CandidateMessages />} />

            {/* Back Office Routes (Protected) */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardLayoutWrapper /></ProtectedRoute>}>
              <Route index element={<DashboardLayout />} />
              <Route path="manage-candidates" element={<ManageCandidates />} />
              <Route path="manage-employees" element={<ManageEmployees />} />
              <Route path="application-info" element={<ApplicationInfo />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="calendar" element={<CalendarView />} />
              <Route path="jobs" element={<AllJobs />} />
            </Route>

            {/* Dashboard Login Route */}
            <Route path="/dashboard/login" element={<LoginPage />} />

            {/* Redirect Unknown Routes to Home */}
            <Route path="*" element={<Navigate to="/home" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
