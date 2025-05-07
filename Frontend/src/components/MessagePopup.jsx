import { useEffect, useRef, useState } from "react";
import "./MessagePopup.css";
import axios from "axios";

const MessagePopup = ({ socket, selectedUser, onClose, currentUserId }) => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [error, setError] = useState(null);
  const chatEndRef = useRef(null);
  const [isBotTyping, setIsBotTyping] = useState(false);

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
        setError(null);
      } catch (err) {
        console.error("Error loading messages", err);
        setError("Failed to load messages. Please try again.");
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
      // Add user message immediately
      setMessages((prev) => [...prev, messageObj]);
      setNewMsg("");
      setError(null);

      // Save to database
      await axios.post(
        "http://localhost:3001/api/messages/send",
        messageObj,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      // If sending to bot, get bot response
      if (selectedUser._id === 'bot') {
        setIsBotTyping(true);

        const res = await axios.post(
          "http://localhost:3001/api/messages/bot/interaction",
          { userId: currentUserId, message: newMsg },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        const botResponse = {
          from: 'bot',
          to: currentUserId,
          text: res.data.reply,
          timestamp: new Date()
        };

        // Add bot response to messages
        setMessages((prev) => [...prev, botResponse]);
        setIsBotTyping(false);

        // Save bot message to database
        await axios.post(
          "http://localhost:3001/api/messages/send",
          botResponse,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        // Emit bot response via socket
        socket.emit("send-message", botResponse);
      } else {
        // Regular message to human
        socket.emit("send-message", messageObj);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setIsBotTyping(false);
      setError("Failed to send message. Please try again.");
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
            src={selectedUser.picture || (selectedUser._id === 'bot' ? "/images/bot-avatar.png" : "/images/avatar-placeholder.png")}
            alt={selectedUser.name}
            className="popup-avatar"
          />
          <span>
            {selectedUser._id === 'bot' ? (
              <>NextBot Assistant <span className="bot-badge">AI</span></>
            ) : (
              `Chat with ${selectedUser.name}`
            )}
          </span>
        </div>
        <button onClick={onClose} className="close-button">✖</button>
      </div>
      <div className="popup-body">
        {error && <div className="error-message">{error}</div>}
        {messages.length === 0 ? (
          <div className="no-messages">
            {selectedUser._id === 'bot' ? (
              <>
                <p>Hello! I'm NextBot 🤖</p>
                <p>Ask me about job applications, interviews, or profile tips!</p>
                <div className="bot-quick-questions">
                  <button onClick={() => { setNewMsg("How do I apply for jobs?"); sendMessage(); }}>
                    How to apply?
                  </button>
                  <button onClick={() => { setNewMsg("Interview tips"); sendMessage(); }}>
                    Interview tips
                  </button>
                  <button onClick={() => { setNewMsg("Profile help"); sendMessage(); }}>
                    Profile help
                  </button>
                </div>
              </>
            ) : (
              <p>No messages yet. Say hello! 👋</p>
            )}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`msg ${msg.from === currentUserId ? "sent" : "received"} ${
                msg.from === 'bot' ? "bot-msg" : ""
              }`}
            >
              <div className="msg-content">
                {msg.text.split('\n').map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
              <div className="msg-time">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                {msg.from === 'bot' && <span className="bot-indicator">AI</span>}
              </div>
            </div>
          ))
        )}
        {isBotTyping && (
          <div className="msg received bot-msg">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="popup-footer">
        <textarea
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            selectedUser._id === 'bot'
              ? "Ask me about jobs, applications, or interviews..."
              : "Type a message..."
          }
          rows={1}
        />
        <button onClick={sendMessage} className="send-button">
          Send
        </button>
      </div>
    </div>
  );
};

export default MessagePopup;