import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, X, Info } from "lucide-react";
import { ToastMessage } from "../../lib/types";

interface SimpleToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

const getIcon = (type: ToastMessage["type"]) => {
  switch (type) {
    case "success":
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case "info":
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const getColors = (type: ToastMessage["type"]) => {
  switch (type) {
    case "success":
      return "border-green-200 bg-green-50";
    case "error":
      return "border-red-200 bg-red-50";
    case "info":
      return "border-blue-200 bg-blue-50";
  }
};

const getPositionClasses = (position: SimpleToastProps["position"]) => {
  switch (position) {
    case "top-left":
      return "top-4 left-4";
    case "bottom-right":
      return "bottom-4 right-4";
    case "bottom-left":
      return "bottom-4 left-4";
    default:
      return "top-4 right-4";
  }
};

export const SimpleToast: React.FC<SimpleToastProps> = ({
  messages,
  onRemove,
  position = "top-right",
}) => {
  useEffect(() => {
    messages.forEach((message) => {
      const duration = message.duration || 5000;
      const timer = setTimeout(() => {
        onRemove(message.id);
      }, duration);

      return () => clearTimeout(timer);
    });
  }, [messages, onRemove]);

  return (
    <div className={`fixed z-50 ${getPositionClasses(position)} space-y-2`}>
      <AnimatePresence>
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{
              opacity: 0,
              x: position.includes("right") ? 300 : -300,
              scale: 0.8,
            }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: position.includes("right") ? 300 : -300,
              scale: 0.8,
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`
              max-w-sm w-full border rounded-lg shadow-lg p-4
              ${getColors(message.type)}
            `}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">{getIcon(message.type)}</div>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900">
                  {message.title}
                </h4>
                {message.message && (
                  <p className="text-sm text-gray-600 mt-1">
                    {message.message}
                  </p>
                )}
              </div>

              <button
                onClick={() => onRemove(message.id)}
                className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SimpleToast;
