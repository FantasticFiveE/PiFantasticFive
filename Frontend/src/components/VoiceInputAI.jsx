import React, { useState } from "react";

const VoiceInputAI = ({ onTextChange }) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  let recognition = null;

  if (window.SpeechRecognition || window.webkitSpeechRecognition) {
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US"; // You can change to "fr-FR" for French

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event) => {
      const voiceText = event.results[0][0].transcript;
      console.log("🎤 Voice Input Recognized:", voiceText);
      setText(voiceText);
      handleCorrection(voiceText);
    };
  } else {
    console.warn("⚠️ Speech recognition not supported in this browser.");
  }

  const handleCorrection = async (text) => {
    if (!text.trim()) return;
  
    console.log("🛠 Sending to AI for correction:", text);
  
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
  
      const response = await fetch(`${backendUrl}/api/openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API Error:", errorText);
        return;
      }
  
      const data = await response.json();
      console.log("✅ AI Corrected Text:", data.correctedText);
  
      // Only update text ONCE to avoid loops
      setText(data.correctedText);
      onTextChange(data.correctedText);
    } catch (error) {
      console.error("❌ Error calling AI:", error);
    }
  };
  

  const handleVoiceInput = () => {
    if (recognition) {
      isListening ? recognition.stop() : recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Speak or type..."
      />
      <button onClick={handleVoiceInput}>
        {isListening ? "🎙️ Listening..." : "🎤 Speak"}
      </button>
    </div>
  );
};

export default VoiceInputAI;
