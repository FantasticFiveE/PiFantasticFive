import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

// Authentication Components
import Signup from './login/signup';
import Login from './login/Login';
import Navbar from './login/navbar';
import ForgotPassword from './login/assets/ForgotPassword';
import ResetPassword from './login/assets/ResetPassword';
import VerifyEmail from './login/assets/VerifyEmail';
import VerifyEmailPending from './login/assets/VerifyEmailPending';

// Dashboard Components
import DashboardLayout from './Dashboard/layouts/DashboardLayout';
import ManageCandidates from './Dashboard/layouts/ManageCandidates';
import ManageEmployees from './Dashboard/layouts/ManageEmployees';
import ApplicationInfo from './Dashboard/components/Sections/ApplicationInfo';
import SideNav from './Dashboard/components/NavBars/SideNav';
import TopNav from './Dashboard/components/NavBars/TopNav';
import LoginPage from './Dashboard/layouts/LoginPage';
import SettingsPage from './Dashboard/layouts/SettingsPage';
import CalendarView from './Dashboard/layouts/CalendarView';
import AllJobs from './Dashboard/layouts/AllJobs';

function App() {
  return (
    <Router>
      <div className="app">
        {/* Top Navigation Bar (for Dashboard) */}
        <TopNav />

        <div className="row w-100 mt-4">
          {/* Side Navigation Bar (for Dashboard) */}
          <div className="col-1">
            <SideNav />
          </div>

          {/* Main Content Area */}
          <div className="col-11 p-0">
            <Routes>
              {/* Authentication Routes */}
              <Route path="/register" element={<Signup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/home" element={<Navbar />} />
              <Route path="/forgotPassword" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/verify-email-pending" element={<VerifyEmailPending />} />

              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<DashboardLayout />} />
              <Route path="/manage-candidates" element={<ManageCandidates />} />
              <Route path="/manage-employees" element={<ManageEmployees />} />
              <Route path="/application-info" element={<ApplicationInfo />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/jobs" element={<AllJobs />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;