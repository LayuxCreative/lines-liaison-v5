import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Monitor,
  MonitorOff,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Square,
} from "lucide-react";

export interface ScreenShareSession {
  id: string;
  userId: string;
  userName: string;
  isActive: boolean;
  stream?: MediaStream;
  type: "screen" | "window" | "tab";
  title?: string;
  startTime: Date;
  viewers: string[];
}

interface ScreenShareManagerProps {
  currentUser: {
    id: string;
    name: string;
  };
  onScreenShareStart?: (session: ScreenShareSession) => void;
  onScreenShareStop?: (sessionId: string) => void;
  onViewerJoin?: (sessionId: string, userId: string) => void;
  onViewerLeave?: (sessionId: string, userId: string) => void;
  className?: string;
}

const ScreenShareManager: React.FC<ScreenShareManagerProps> = ({
  currentUser,
  onScreenShareStart,
  onScreenShareStop,
  onViewerJoin,
  onViewerLeave,
  className = "",
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [currentSession, setCurrentSession] =
    useState<ScreenShareSession | null>(null);
  const [availableSessions] = useState<
    ScreenShareSession[]
  >([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [shareOptions, setShareOptions] = useState({
    includeAudio: true,
    quality: "high" as "low" | "medium" | "high",
  });

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const resetTimeout = () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(true);
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      };

      const handleMouseMove = () => resetTimeout();
      const handleKeyPress = () => resetTimeout();

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("keydown", handleKeyPress);
      resetTimeout();

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("keydown", handleKeyPress);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    } else {
      setShowControls(true);
    }
  }, [isFullscreen]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Start screen sharing
  const startScreenShare = async (
    type: "screen" | "window" | "tab" = "screen",
  ) => {
    try {
      const constraints = {
        video: {
          width: {
            ideal:
              shareOptions.quality === "high"
                ? 1920
                : shareOptions.quality === "medium"
                  ? 1280
                  : 720,
          },
          height: {
            ideal:
              shareOptions.quality === "high"
                ? 1080
                : shareOptions.quality === "medium"
                  ? 720
                  : 480,
          },
          frameRate: { ideal: shareOptions.quality === "high" ? 30 : 15 },
        },
        audio: shareOptions.includeAudio,
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Handle stream end (user stops sharing via browser UI)
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        stopScreenShare();
      });

      const session: ScreenShareSession = {
        id: `session_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        isActive: true,
        stream,
        type,
        startTime: new Date(),
        viewers: [],
      };

      setCurrentSession(session);
      setIsSharing(true);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      onScreenShareStart?.(session);
    } catch (error) {
      console.error("Failed to start screen sharing:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          alert(
            "Screen sharing permission denied. Please allow screen sharing and try again.",
          );
        } else if (error.name === "NotSupportedError") {
          alert("Screen sharing is not supported in this browser.");
        } else {
          alert("Failed to start screen sharing. Please try again.");
        }
      }
    }
  };

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (currentSession?.stream) {
      currentSession.stream.getTracks().forEach((track) => track.stop());
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (currentSession) {
      onScreenShareStop?.(currentSession.id);
    }

    setCurrentSession(null);
    setIsSharing(false);
    setIsFullscreen(false);
  }, [currentSession, onScreenShareStop]);

  // Join screen share session
  const joinSession = (sessionId: string) => {
    setSelectedSession(sessionId);
    onViewerJoin?.(sessionId, currentUser.id);
  };

  // Leave screen share session
  const leaveSession = () => {
    if (selectedSession) {
      onViewerLeave?.(selectedSession, currentUser.id);
      setSelectedSession(null);
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error("Failed to toggle fullscreen:", error);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    setIsMuted(!isMuted);
    // This would typically control the audio output
  };

  // Format duration
  const formatDuration = (startTime: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Render sharing controls
  const renderSharingControls = () => {
    if (!isSharing || !currentSession) return null;

    return (
      <div
        className={`absolute top-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Sharing Screen</span>
            </div>
            <span className="text-sm text-gray-300">
              {formatDuration(currentSession.startTime)}
            </span>
            <span className="text-sm text-gray-300">
              {currentSession.viewers.length} viewers
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full transition-colors ${
                isMuted
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-600 hover:bg-gray-700 rounded-full transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={stopScreenShare}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <Square className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render viewing controls
  const renderViewingControls = () => {
    if (!selectedSession) return null;

    const session = availableSessions.find((s) => s.id === selectedSession);
    if (!session) return null;

    return (
      <div
        className={`absolute top-4 left-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">
              Viewing {session.userName}'s screen
            </span>
            <span className="text-sm text-gray-300">
              {formatDuration(session.startTime)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleAudio}
              className={`p-2 rounded-full transition-colors ${
                isMuted
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-gray-600 hover:bg-gray-700"
              }`}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-gray-600 hover:bg-gray-700 rounded-full transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="w-4 h-4" />
              ) : (
                <Maximize className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={leaveSession}
              className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <MonitorOff className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render start screen share options
  const renderStartOptions = () => {
    if (isSharing || selectedSession) return null;

    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <div className="text-center">
          <Monitor className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            Screen Sharing
          </h3>
          <p className="text-gray-500 mb-6">
            Share your screen with others or view shared screens
          </p>
        </div>

        {/* Share options */}
        <div className="bg-white rounded-lg border p-6 w-full max-w-md">
          <h4 className="font-semibold mb-4">Share your screen</h4>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="includeAudio"
                checked={shareOptions.includeAudio}
                onChange={(e) =>
                  setShareOptions((prev) => ({
                    ...prev,
                    includeAudio: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <label htmlFor="includeAudio" className="text-sm">
                Include system audio
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Quality</label>
              <select
                value={shareOptions.quality}
                onChange={(e) =>
                  setShareOptions((prev) => ({
                    ...prev,
                    quality: e.target.value as "low" | "medium" | "high",
                  }))
                }
                className="w-full border rounded-md px-3 py-2 text-sm"
              >
                <option value="low">Low (720p)</option>
                <option value="medium">Medium (1280p)</option>
                <option value="high">High (1080p)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => startScreenShare("screen")}
                className="flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Monitor className="w-5 h-5" />
                <span>Share Entire Screen</span>
              </button>
              <button
                onClick={() => startScreenShare("window")}
                className="flex items-center justify-center space-x-2 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Square className="w-5 h-5" />
                <span>Share Application Window</span>
              </button>
            </div>
          </div>
        </div>

        {/* Available sessions */}
        {availableSessions.length > 0 && (
          <div className="bg-white rounded-lg border p-6 w-full max-w-md">
            <h4 className="font-semibold mb-4">Available screen shares</h4>
            <div className="space-y-2">
              {availableSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Monitor className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{session.userName}</p>
                      <p className="text-xs text-gray-500">
                        {session.viewers.length} viewers •{" "}
                        {formatDuration(session.startTime)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => joinSession(session.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className={`relative bg-gray-100 ${className}`}>
      {/* Video display */}
      {(isSharing || selectedSession) && (
        <div className="relative w-full h-full bg-black">
          {isSharing && (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          )}
          {selectedSession && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          )}

          {renderSharingControls()}
          {renderViewingControls()}
        </div>
      )}

      {/* Start options */}
      {renderStartOptions()}
    </div>
  );
};

export default ScreenShareManager;
