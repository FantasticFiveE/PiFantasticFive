import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './Dashboard/_styles/index.scss'; // Import Dashboard styles
import 'bootstrap-icons/font/bootstrap-icons.css'; // Import Bootstrap Icons

// Render the App component inside the root element
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);