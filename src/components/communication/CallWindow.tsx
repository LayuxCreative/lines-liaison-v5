import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share,
  Users,
  Settings,
} from "lucide-react";

interface CallParticipant {
  id: string;
  name: string;
  isAudioMuted: boolean;
  isVideoOff: boolean;
  stream?: MediaStream;
}

interface CallWindowProps {
  currentUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  isActive: boolean;
  onEndCall: () => void;
  onStartScreenShare: () => void;
  callType?: "audio" | "video" | null;
}

const CallWindow: React.FC<CallWindowProps> = ({
  currentUser,
  isActive,
  onEndCall,
  onStartScreenShare,
  callType = "video",
}) => {
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === "audio");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTime = useRef<number>(Date.now());

  useEffect(() => {
    if (isActive) {
      startCall();
      callStartTime.current = Date.now();
    } else {
      stopCall();
    }

    return () => {
      stopCall();
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      // Initialize with current user only
      const initialParticipants: CallParticipant[] = [
        {
          id: currentUser.id,
          name: currentUser.name,
          isAudioMuted: false,
          isVideoOff: false,
        },
      ];
      setParticipants(initialParticipants);

      // Update call duration every second
      const interval = setInterval(() => {
        setCallDuration(
          Math.floor((Date.now() - callStartTime.current) / 1000),
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isActive]);

  const startCall = async () => {
    try {
      const constraints = {
        audio: true,
        video: callType === "video",
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);

      if (localVideoRef.current && callType === "video") {
        localVideoRef.current.srcObject = stream;
      }


    } catch {
      // Error starting call
    }
  };

  const stopCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }


  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
    onStartScreenShare();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isActive) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <Phone className="mx-auto mb-4 text-gray-400" size={48} />
          <p className="text-gray-600 dark:text-gray-400">No active call</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Call Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 text-white">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold">Call in Progress</span>
          </div>
          <span className="text-sm text-gray-300">
            {formatDuration(callDuration)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {participants.length + 1} participants
          </span>
          <Users size={18} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4">
        {callType === "audio" ? (
          // Audio Call Interface
          <div className="flex flex-col items-center justify-center h-full">
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-teal-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone size={48} className="text-white" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                Audio Call
              </h3>
              <p className="text-gray-600">
                {participants.length + 1} participants connected
              </p>
            </div>

            {/* Audio Participants Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl">
              {/* Current User */}
              <div className="bg-white rounded-lg p-4 shadow-md text-center">
                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-white font-bold text-lg">
                    {currentUser?.name?.charAt(0) || "Y"}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800">You</p>
                <p className="text-xs text-gray-500">
                  {isAudioMuted ? "Muted" : "Speaking"}
                </p>
              </div>

              {/* Other Participants */}
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="bg-white rounded-lg p-4 shadow-md text-center"
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-white font-bold text-lg">
                      {participant.name.charAt(0)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">
                    {participant.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {participant.isAudioMuted ? "Muted" : "Speaking"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Video Call Interface
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {/* Local Video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                You {isAudioMuted && "(muted)"}
              </div>
              {isVideoOff && (
                <div className="absolute inset-0 bg-gray-700 flex items-center justify-center">
                  <div className="text-center text-white">
                    <VideoOff size={32} className="mx-auto mb-2" />
                    <p className="text-sm">Camera off</p>
                  </div>
                </div>
              )}
            </div>

            {/* Participant Videos */}
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="relative bg-gray-800 rounded-lg overflow-hidden"
              >
                {/* Video stream */}
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-2xl font-bold">
                        {participant.name.charAt(0)}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{participant.name}</p>
                  </div>
                </div>

                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {participant.name}
                  {participant.isAudioMuted && " (muted)"}
                </div>

                {participant.isVideoOff && (
                  <div className="absolute top-2 right-2">
                    <VideoOff size={16} className="text-white" />
                  </div>
                )}

                {participant.isAudioMuted && (
                  <div className="absolute top-2 left-2">
                    <MicOff size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Call Controls */}
      <div className="flex items-center justify-center p-6 bg-gray-800">
        <div className="flex items-center space-x-4">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-full transition-colors ${
              isAudioMuted
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-600 hover:bg-gray-700 text-white"
            }`}
            title={isAudioMuted ? "Unmute" : "Mute"}
          >
            {isAudioMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-full transition-colors ${
              isVideoOff
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-gray-600 hover:bg-gray-700 text-white"
            }`}
            title={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          {/* Screen Share */}
          <button
            onClick={handleScreenShare}
            className={`p-3 rounded-full transition-colors ${
              isScreenSharing
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-600 hover:bg-gray-700 text-white"
            }`}
            title={isScreenSharing ? "Stop sharing" : "Share screen"}
          >
            <Share size={20} />
          </button>

          {/* Settings */}
          <button
            className="p-3 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            title="End call"
          >
            <PhoneOff size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallWindow;
