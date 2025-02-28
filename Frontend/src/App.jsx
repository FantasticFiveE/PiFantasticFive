import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Signup from './login/signup';
import Login from './login/Login';
import Navbar from './login/navbar';
import ForgotPassword from './login/assets/ForgotPassword';
import ResetPassword from './login/assets/ResetPassword';
import VerifyEmail from './login/assets/VerifyEmail';
import VerifyEmailPending from './login/assets/VerifyEmailPending';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Navbar />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;