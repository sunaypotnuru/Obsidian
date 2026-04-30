import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageCircle, X, Send, Minimize2, Maximize2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useAuthStore } from "../../lib/store";
import { useTranslation } from "react-i18next";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export default function FloatingChatbot() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm your Netra AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuthStore();

  // Quick action buttons
  const quickActions = [
    { label: "Book Appointment", action: "book_appointment" },
    { label: "View My Scans", action: "view_scans" },
    { label: "Find Doctors", action: "find_doctors" },
    { label: "Check Symptoms", action: "check_symptoms" },
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(inputValue),
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes("appointment") || input.includes("book")) {
      return "I can help you book an appointment! Would you like to see available doctors or check your upcoming appointments?";
    } else if (input.includes("scan") || input.includes("eye")) {
      return "You can upload eye scans for anemia detection. Would you like to go to the scan page or view your previous scan results?";
    } else if (input.includes("doctor")) {
      return "I can help you find the right doctor. What specialty are you looking for? We have hematologists, general physicians, and ophthalmologists.";
    } else if (input.includes("symptom")) {
      return "Please describe your symptoms, and I'll try to help. Remember, I'm here to assist, but always consult with a healthcare professional for medical advice.";
    } else if (input.includes("hello") || input.includes("hi")) {
      return `Hello ${user?.name || "there"}! How can I assist you with your healthcare needs today?`;
    } else {
      return "I'm here to help! You can ask me about booking appointments, viewing scans, finding doctors, or checking symptoms. What would you like to know?";
    }
  };

  const handleQuickAction = (action: string) => {
    let message = "";
    switch (action) {
      case "book_appointment":
        message = "I want to book an appointment";
        break;
      case "view_scans":
        message = "Show me my scan results";
        break;
      case "find_doctors":
        message = "Help me find a doctor";
        break;
      case "check_symptoms":
        message = "I want to check my symptoms";
        break;
    }
    setInputValue(message);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-[#0D9488] to-[#0F766E] rounded-full shadow-2xl flex items-center justify-center z-50 hover:shadow-[#0D9488]/50 transition-shadow"
          >
            <MessageCircle className="w-7 h-7 text-white" />
            {/* Pulse animation */}
            <span className="absolute inset-0 rounded-full bg-[#0D9488] animate-ping opacity-20" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col ${
              isMinimized
                ? "bottom-6 right-6 w-80 h-16"
                : "bottom-6 right-6 w-96 h-[600px] md:w-[420px]"
            }`}
            style={{
              maxHeight: isMinimized ? "64px" : "calc(100vh - 100px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#0D9488] to-[#0F766E] rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{t('components.floating_chatbot.netra_ai_assistant', "Netra AI Assistant")}</h3>
                  <p className="text-xs text-white/80">{t('components.floating_chatbot.always_here_to_help_1', "Always here to help")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4 text-white" />
                  ) : (
                    <Minimize2 className="w-4 h-4 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          message.sender === "user"
                            ? "bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === "user"
                              ? "text-white/70"
                              : "text-gray-500"
                          }`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <span
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <span
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Quick Actions */}
                {messages.length <= 2 && (
                  <div className="px-4 pb-2">
                    <p className="text-xs text-gray-500 mb-2">{t('components.floating_chatbot.quick_actions_2', "Quick actions:")}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.action}
                          onClick={() => handleQuickAction(action.action)}
                          className="px-3 py-2 text-xs font-medium text-[#0D9488] bg-[#0D9488]/10 rounded-lg hover:bg-[#0D9488]/20 transition-colors"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder={t('components.floating_chatbot.type_your_message_placeholder_3', "Type your message...")}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className="bg-gradient-to-br from-[#0D9488] to-[#0F766E] text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
