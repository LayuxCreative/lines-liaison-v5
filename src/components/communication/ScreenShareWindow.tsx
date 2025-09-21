import React, { useState, useEffect, useRef } from "react";
import { Monitor, Square, Maximize, Minimize, Settings, X } from "lucide-react";

interface ScreenShareWindowProps {
  currentUser: {
    id: string;
    name: string;
  };
  onStopSharing: () => void;
}

const ScreenShareWindow: React.FC<ScreenShareWindowProps> = ({
  onStopSharing,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [shareType, setShareType] = useState<"screen" | "window" | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewers, setViewers] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mock viewers for demonstration
    setViewers(["John Doe", "Jane Smith", "Mike Johnson"]);
  }, []);

  const startScreenShare = async (type: "screen" | "window") => {
    try {
      const displayMediaOptions = {
        video: {
          cursor: "always" as const,
          displaySurface:
            type === "screen" ? ("monitor" as const) : ("window" as const),
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      };

      const stream =
        await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      setScreenStream(stream);
      setIsSharing(true);
      setShareType(type);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Listen for stream end (user stops sharing via browser)
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopScreenShare();
      });


    } catch (error) {
      console.error("Error starting screen share:", error);
      alert(
        "Failed to start screen sharing. Please make sure you grant permission.",
      );
    }
  };

  const stopScreenShare = () => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsSharing(false);
    setShareType(null);
    
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleStopAndExit = () => {
    stopScreenShare();
    onStopSharing();
  };

  if (!isSharing) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 p-8">
        <div className="text-center max-w-md">
          <Monitor className="mx-auto mb-6 text-gray-400" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Share Your Screen
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Choose what you'd like to share with other participants
          </p>

          <div className="space-y-4">
            <button
              onClick={() => startScreenShare("screen")}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Monitor size={20} />
              <span>Share Entire Screen</span>
            </button>

            <button
              onClick={() => startScreenShare("window")}
              className="w-full flex items-center justify-center space-x-3 p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Square size={20} />
              <span>Share Application Window</span>
            </button>
          </div>

          <button
            onClick={onStopSharing}
            className="mt-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-black">
      {/* Screen Share Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="font-semibold">
              Sharing {shareType === "screen" ? "Screen" : "Window"}
            </span>
          </div>
          <span className="text-sm text-gray-300">
            {viewers.length} viewers
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>

          <button
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>

          <button
            onClick={handleStopAndExit}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Stop sharing"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Screen Share Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full h-full max-w-6xl max-h-full">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain bg-gray-900 rounded-lg"
          />

          {/* Overlay Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-black bg-opacity-50 backdrop-blur-sm px-6 py-3 rounded-full">
              <span className="text-white text-sm">
                Sharing with {viewers.length} people
              </span>

              <button
                onClick={stopScreenShare}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Stop Sharing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Viewers List */}
      <div className="p-4 bg-gray-900 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <h4 className="text-white font-medium">Viewers ({viewers.length})</h4>
          <div className="flex items-center space-x-2">
            {viewers.slice(0, 3).map((viewer, index) => (
              <div
                key={index}
                className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium"
                title={viewer}
              >
                {viewer.charAt(0)}
              </div>
            ))}
            {viewers.length > 3 && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs">
                +{viewers.length - 3}
              </div>
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {viewers.map((viewer, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-gray-700 text-gray-300 rounded-full text-sm"
            >
              {viewer}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScreenShareWindow;
