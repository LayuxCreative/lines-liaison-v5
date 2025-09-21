import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  Users,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import WebRTCService, { type EventHandler } from "../../services/webrtc/WebRTCService";
import SocketService, { type SocketEventHandler } from "../../services/chat/SocketService";
import type SimplePeer from "simple-peer";

export interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  stream?: MediaStream;
  isSpeaking?: boolean;
  connectionQuality: "excellent" | "good" | "poor" | "disconnected";
}

export interface CallState {
  isActive: boolean;
  isIncoming: boolean;
  callType: "audio" | "video";
  roomId: string;
  participants: CallParticipant[];
  duration: number;
  isRecording: boolean;
}

interface CallManagerProps {
  socketService: SocketService;
  webrtcService: WebRTCService;
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  onCallEnd?: () => void;
  onCallStart?: (roomId: string, type: "audio" | "video") => void;
  className?: string;
}

const CallManager: React.FC<CallManagerProps> = ({
  socketService,
  webrtcService,
  currentUser,
  onCallEnd,
  className = "",
}) => {
  const [callState, setCallState] = useState<CallState>({
    isActive: false,
    isIncoming: false,
    callType: "audio",
    roomId: "",
    participants: [],
    duration: 0,
    isRecording: false,
  });

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    callerId: string;
    callerName: string;
    roomId: string;
    type: "audio" | "video";
  } | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<{ [key: string]: HTMLVideoElement }>({});
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize call timer
  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }

    callTimerRef.current = setInterval(() => {
      setCallState((prev) => ({
        ...prev,
        duration: prev.duration + 1,
      }));
    }, 1000);
  }, []);

  const stopCallTimer = useCallback(() => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  }, []);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Socket event handlers
  useEffect(() => {
    const handleIncomingCall = (data: {
      callerId: string;
      callerName: string;
      roomId: string;
      type: "audio" | "video";
    }) => {
      setIncomingCall(data);
    };

    const handleCallAccepted = () => {
      setCallState((prev) => ({
        ...prev,
        isActive: true,
        isIncoming: false,
      }));
      startCallTimer();
    };

    const handleCallRejected = () => {
      setIncomingCall(null);
      endCall();
    };

    const handleCallEnded = () => {
      endCall();
    };

    const handleWebRTCSignal = (data: {
      from: string;
      to: string;
      signal: SimplePeer.SignalData;
    }) => {
      if (data.to === currentUser.id) {
        webrtcService.handleSignal(data.from, data.signal);
      }
    };

    socketService.on("incomingCall", handleIncomingCall as SocketEventHandler);
    socketService.on("callAccepted", handleCallAccepted as SocketEventHandler);
    socketService.on("callRejected", handleCallRejected as SocketEventHandler);
    socketService.on("callEnded", handleCallEnded as SocketEventHandler);
    socketService.on("webrtcSignal", handleWebRTCSignal as SocketEventHandler);

    return () => {
      socketService.off("incomingCall", handleIncomingCall as SocketEventHandler);
      socketService.off("callAccepted", handleCallAccepted as SocketEventHandler);
      socketService.off("callRejected", handleCallRejected as SocketEventHandler);
      socketService.off("callEnded", handleCallEnded as SocketEventHandler);
      socketService.off("webrtcSignal", handleWebRTCSignal as SocketEventHandler);
    };
  }, [socketService, webrtcService, currentUser.id, startCallTimer]);

  // WebRTC event handlers
  useEffect(() => {
    const handleLocalStream = (stream: MediaStream) => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    };

    const handleRemoteStream = (peerId: string, stream: MediaStream) => {
      const videoElement = remoteVideosRef.current[peerId];
      if (videoElement) {
        videoElement.srcObject = stream;
      }

      // Update participant with stream
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.map((p) =>
          p.id === peerId ? { ...p, stream } : p,
        ),
      }));
    };

    const handlePeerDisconnected = (peerId: string) => {
      setCallState((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.id !== peerId),
      }));
      delete remoteVideosRef.current[peerId];
    };

    const handleSignalNeeded = (peerId: string, signal: SimplePeer.SignalData) => {
      socketService.sendSignal(peerId, signal);
    };

    webrtcService.on("localStream", handleLocalStream as EventHandler);
    webrtcService.on("remoteStream", handleRemoteStream as EventHandler);
    webrtcService.on("peerDisconnected", handlePeerDisconnected as EventHandler);
    webrtcService.on("signalNeeded", handleSignalNeeded as EventHandler);

    return () => {
      webrtcService.off("localStream", handleLocalStream as EventHandler);
      webrtcService.off("remoteStream", handleRemoteStream as EventHandler);
      webrtcService.off("peerDisconnected", handlePeerDisconnected as EventHandler);
      webrtcService.off("signalNeeded", handleSignalNeeded as EventHandler);
    };
  }, [webrtcService, socketService]);



  // Accept incoming call
  const acceptCall = async () => {
    if (!incomingCall) return;

    try {
      await webrtcService.startCall(incomingCall.roomId, {
        video: incomingCall.type === "video",
        audio: true,
      });

      setCallState({
        isActive: true,
        isIncoming: true,
        callType: incomingCall.type,
        roomId: incomingCall.roomId,
        participants: [],
        duration: 0,
        isRecording: false,
      });

      socketService.acceptCall(incomingCall.roomId);
      setIncomingCall(null);
      startCallTimer();
    } catch (error) {
      console.error("Failed to accept call:", error);
      alert(
        "Failed to accept call. Please check your camera and microphone permissions.",
      );
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    if (!incomingCall) return;

    socketService.rejectCall(incomingCall.roomId);
    setIncomingCall(null);
  };

  // End call
  const endCall = () => {
    webrtcService.endCall();

    if (callState.isActive) {
      socketService.endCall(callState.roomId);
    }

    setCallState({
      isActive: false,
      isIncoming: false,
      callType: "audio",
      roomId: "",
      participants: [],
      duration: 0,
      isRecording: false,
    });

    setLocalStream(null);
    setIsScreenSharing(false);
    stopCallTimer();
    onCallEnd?.();
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // Toggle screen sharing
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await webrtcService.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await webrtcService.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error("Failed to toggle screen share:", error);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // This would typically control the output volume
  };

  // Render incoming call notification
  const renderIncomingCall = () => {
    if (!incomingCall) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Users className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Incoming {incomingCall.type} call
            </h3>
            <p className="text-gray-600 mb-6">
              {incomingCall.callerName} is calling you
            </p>
            <div className="flex space-x-4">
              <button
                onClick={rejectCall}
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
              >
                <PhoneOff className="w-5 h-5 mr-2" />
                Decline
              </button>
              <button
                onClick={acceptCall}
                className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <Phone className="w-5 h-5 mr-2" />
                Accept
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render active call interface
  const renderActiveCall = () => {
    if (!callState.isActive) return null;

    return (
      <div className="fixed inset-0 bg-gray-900 z-50">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold">
              {callState.callType === "video" ? "Video Call" : "Audio Call"}
            </h2>
            <span className="text-sm text-gray-300">
              {formatDuration(callState.duration)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-300">
              {callState.participants.length + 1} participants
            </span>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4">
          {callState.callType === "video" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
              {/* Local video */}
              <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  You {!isVideoEnabled && "(Video Off)"}
                </div>
              </div>

              {/* Remote videos */}
              {callState.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="relative bg-gray-800 rounded-lg overflow-hidden"
                >
                  <video
                    ref={(el) => {
                      if (el) remoteVideosRef.current[participant.id] = el;
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {participant.name}{" "}
                    {!participant.isVideoEnabled && "(Video Off)"}
                  </div>
                  <div
                    className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                      participant.connectionQuality === "excellent"
                        ? "bg-green-500"
                        : participant.connectionQuality === "good"
                          ? "bg-yellow-500"
                          : participant.connectionQuality === "poor"
                            ? "bg-red-500"
                            : "bg-gray-500"
                    }`}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-16 h-16" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Audio Call</h3>
                <p className="text-gray-300">
                  {callState.participants.length + 1} participants connected
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-800 p-4">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={toggleAudio}
              className={`p-3 rounded-full transition-colors ${
                isAudioEnabled
                  ? "bg-gray-600 hover:bg-gray-500"
                  : "bg-red-600 hover:bg-red-500"
              } text-white`}
            >
              {isAudioEnabled ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </button>

            {callState.callType === "video" && (
              <button
                onClick={toggleVideo}
                className={`p-3 rounded-full transition-colors ${
                  isVideoEnabled
                    ? "bg-gray-600 hover:bg-gray-500"
                    : "bg-red-600 hover:bg-red-500"
                } text-white`}
              >
                {isVideoEnabled ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <VideoOff className="w-6 h-6" />
                )}
              </button>
            )}

            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-full transition-colors ${
                isScreenSharing
                  ? "bg-blue-600 hover:bg-blue-500"
                  : "bg-gray-600 hover:bg-gray-500"
              } text-white`}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-6 h-6" />
              ) : (
                <Monitor className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition-colors ${
                isMuted
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-gray-600 hover:bg-gray-500"
              } text-white`}
            >
              {isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={endCall}
              className="p-3 bg-red-600 hover:bg-red-700 rounded-full transition-colors text-white"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {renderIncomingCall()}
      {renderActiveCall()}
    </div>
  );
};

export default CallManager;
