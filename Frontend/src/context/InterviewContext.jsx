import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // This is the correct import

const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  // Use the useAuth hook instead of useContext(AuthContext)
  const { user } = useAuth(); // Changed this line
  
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInterviews = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const res = await axios.get(`/api/users/${user._id}/interviews`);
      setInterviews(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'CANDIDATE') {
      fetchInterviews();
    }
  }, [user]);

  return (
    <InterviewContext.Provider value={{ interviews, loading, error, fetchInterviews }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => useContext(InterviewContext);