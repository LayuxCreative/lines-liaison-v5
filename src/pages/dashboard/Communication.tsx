import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Search,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  User,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { activityLogger } from "../../utils/activityLogger";

const Communication: React.FC = () => {
  const { user } = useAuth();
  const { getProjectsByUser } = useData();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  if (!user) return null;

  const userProjects = getProjectsByUser(user.id, user.role);

  // Messages will be loaded from Supabase via DataContext
  const messages: Array<{
    id: string;
    content: string;
    sender: string;
    senderRole: string;
    projectId: string;
    projectName: string;
    timestamp: Date;
    attachments: string[];
  }> = [];

  const filteredMessages = messages.filter((message) => {
    const matchesProject =
      selectedProject === "all" || message.projectId === selectedProject;
    const matchesSearch =
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProject && matchesSearch;
  });

  const handleSendMessage = async () => {
    if (messageText.trim()) {
      try {
        await activityLogger.log("communication_message_send", "info", "Sending communication message", {
          selectedProject,
          messageLength: messageText.trim().length
        });
        
        // Handle message sending logic here
        console.log("Sending message:", messageText);
        setMessageText("");
        
        await activityLogger.log("communication_message_send", "success", "Communication message sent successfully", {
          selectedProject
        });
      } catch (error) {
        console.error("Error sending message:", error);
        await activityLogger.log("communication_message_send", "error", "Failed to send communication message", {
          selectedProject,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Communication</h1>
          <p className="text-gray-600 mt-2">
            {user.role === "client"
              ? "Stay connected with your project team"
              : "Communicate with team members and clients"}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Projects
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedProject("all")}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedProject === "all"
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "hover:bg-gray-50"
                  }`}
                >
                  All Projects
                </button>
                {userProjects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedProject === project.id
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="truncate text-sm font-medium">
                      {project.name}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {project.status}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-3"
          >
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Chat Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedProject === "all"
                        ? "All Messages"
                        : userProjects.find((p) => p.id === selectedProject)
                            ?.name || "Project Messages"}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {filteredMessages.length} messages
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Search */}
                <div className="mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === user.name ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md ${
                        message.sender === user.name
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      } rounded-lg p-4`}
                    >
                      {message.sender !== user.name && (
                        <div className="flex items-center space-x-2 mb-2">
                          <User className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {message.sender}
                          </span>
                          <span className="text-xs opacity-75 capitalize">
                            ({message.senderRole})
                          </span>
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      {message.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {message.attachments.map((attachment: string, index: number) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2 text-xs"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{attachment}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-75">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {selectedProject !== "all" && (
                          <span className="text-xs opacity-75">
                            {message.projectName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Communication;
