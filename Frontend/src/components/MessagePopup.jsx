import { useEffect, useRef, useState } from "react";
import "./MessagePopup.css";
import axios from "axios";

const MessagePopup = ({ socket, selectedUser, onClose, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const chatEndRef = useRef(null);

  // Load chat history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3001/api/messages/history/${currentUserId}/${selectedUser._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`
            }
          }
        );
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Error loading messages", err);
      }
    };

    if (selectedUser?._id && currentUserId) {
      fetchMessages();
    }
  }, [selectedUser._id, currentUserId]);

  // Listen for incoming messages
  useEffect(() => {
    const handleMessage = (msg) => {
      if (
        (msg.from === currentUserId && msg.to === selectedUser._id) ||
        (msg.from === selectedUser._id && msg.to === currentUserId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("receive-message", handleMessage);
    return () => socket.off("receive-message", handleMessage);
  }, [socket, selectedUser._id, currentUserId]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a message
  const sendMessage = async () => {
    if (!newMsg.trim()) return;

    const messageObj = {
      from: currentUserId,
      to: selectedUser._id,
      text: newMsg,
      timestamp: new Date(),
    };

    try {
      // Save to database
      await axios.post(
        "http://localhost:3001/api/messages/send",
        messageObj,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json"
          }
        }
      );

      // Emit via socket
      socket.emit("send-message", messageObj);
      
      // Add to local state
      setMessages((prev) => [...prev, messageObj]);
      setNewMsg("");
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Failed to send message");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="message-popup">
      <div className="popup-header">
        <div className="popup-user-info">
          <img 
            src={selectedUser.picture || "/images/avatar-placeholder.png"} 
            alt={selectedUser.name} 
            className="popup-avatar"
          />
          <span>Chat with {selectedUser.name}</span>
        </div>
        <button onClick={onClose} className="close-button">✖</button>
      </div>
      <div className="popup-body">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`msg ${msg.from === currentUserId ? "sent" : "received"}`}
            >
              <div className="msg-content">{msg.text}</div>
              <div className="msg-time">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="popup-footer">
        <textarea
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
        />
        <button onClick={sendMessage} className="send-button">Send</button>
      </div>
    </div>
  );
};

export default MessagePopup;