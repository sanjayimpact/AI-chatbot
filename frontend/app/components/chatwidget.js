"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Mic } from "lucide-react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Typewriter animation
  const typeEffect = (text) => {
    let i = 0;
    setTypingText("");
    const interval = setInterval(() => {
      if (i < text.length) {
        setTypingText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
        setMessages((prev) => [...prev, { role: "assistant", content: text }]);
        setTypingText("");
      }
    }, 20);
  };

  // Speech recognition setup
  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Sorry, your browser doesn't support speech recognition.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const domain = window.location.hostname;
    const userMessage = { role: "user", content: `${input} (from ${domain})` };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      const data = await res.json();
      console.log(data);
      const reply = data.reply || "No response.";
      typeEffect(reply);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating chat icon */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-indigo-600 hover:to-blue-500 text-white p-4 rounded-full shadow-2xl transition-transform transform hover:scale-110"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-16 right-0 w-96 h-[480px] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-200 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg flex justify-between items-center">
              <span>AI Chatbot 🤖</span>
              <span className="text-xs opacity-80">{window.location.hostname}</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm bg-gray-50">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl max-w-[80%] break-words ${
                    m.role === "user"
                      ? "bg-blue-100 ml-auto text-right"
                      : "bg-white text-left border border-gray-200 shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              ))}

              {typingText && (
                <div className="bg-white border border-gray-200 shadow-sm p-3 rounded-xl max-w-[80%] text-left">
                  {typingText}
                  <span className="inline-block w-1 h-4 bg-blue-500 ml-1 animate-blink" />
                </div>
              )}

              {loading && !typingText && (
                <div className="text-gray-400 text-sm italic">Assistant is thinking...</div>
              )}
            </div>

            {/* Input area */}
            <div className="p-3 border-t flex items-center gap-2 bg-white">
              <button
                onClick={isRecording ? stopListening : startListening}
                className={`p-2 rounded-full transition ${
                  isRecording ? "bg-red-500" : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                <Mic className="w-5 h-5" />
              </button>

              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type or speak your message..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
