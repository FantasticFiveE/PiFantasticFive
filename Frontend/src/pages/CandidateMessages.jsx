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
        if (Array.isArray(res.data.messages)) {
          setMessages(res.data.messages);
        } else {
          setMessages(res.data); // fallback if structure is flat
        }
      } catch (err) {
        console.error("❌ Error fetching messages:", err);
      }
    };

    fetchMessages();

    socket.on(`notification-${candidateId}`, (data) => {
      alert(data.message);
      fetchMessages(); // Refresh messages
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
              <li key={msg._id || Math.random()} className="message-card">
                <h4>📩 {msg.subject || 'No Subject'}</h4>
                <p><strong>From:</strong> {msg.senderName || msg.from}</p>
                <p>{msg.message || msg.text}</p>
                <span className="timestamp">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ''}
                </span>
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
