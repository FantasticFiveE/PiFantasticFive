import { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar/Navbar';
import Footer from '../components/Footer/Footer';
import { io } from 'socket.io-client';

const socket = io("http://localhost:3001", {
  path: "/socket.io/",
  transports: ["websocket"],
});

const CandidateMessages = () => {
  const [messages, setMessages] = useState([]);

  const candidateId = localStorage.getItem("userId");

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/api/messages/${candidateId}`);
        setMessages(res.data);
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();

    // 🔔 Listen for real-time notifications for this user
    socket.on(`notification-${candidateId}`, (data) => {
      alert(data.message); // or use toast for a better UI
      fetchMessages();     // re-fetch updated messages
    });

    return () => {
      socket.off(`notification-${candidateId}`);
    };
  }, [candidateId]);

  return (
    <>
      <Navbar />
      <div className="messages-container">
        <h2>Your Messages</h2>
        {messages.length === 0 ? (
          <p>No messages received yet.</p>
        ) : (
          <ul className="messages-list">
            {messages.map((msg) => (
              <li key={msg._id} className="message-card">
                <h4>📩 {msg.subject}</h4>
                <p><strong>From:</strong> {msg.senderName}</p>
                <p>{msg.message}</p>
                <span className="timestamp">{new Date(msg.timestamp).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Footer />
    </>
  );
};

export default CandidateMessages;
