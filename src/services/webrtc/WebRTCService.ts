import SimplePeer from "simple-peer";

export interface PeerConnection {
  id: string;
  peer: SimplePeer.Instance;
  stream?: MediaStream;
  isInitiator: boolean;
}

export interface CallOptions {
  video: boolean;
  audio: boolean;
  screen?: boolean;
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  constraints: MediaStreamConstraints;
}

export type EventHandler = (...args: unknown[]) => void;

class WebRTCService {
  private peers: Map<string, PeerConnection> = new Map();
  private localStream: MediaStream | null = null;
  private config: WebRTCConfig;
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  constructor() {
    this.config = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        // Add TURN servers for production
        // {
        //   urls: 'turn:your-turn-server.com:3478',
        //   username: 'username',
        //   credential: 'password'
        // }
      ],
      constraints: {
        video: {
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          frameRate: { min: 15, ideal: 30, max: 60 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      },
    };
  }

  // Event handling
  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: EventHandler) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, ...args: unknown[]) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }

  // Media stream management
  async getUserMedia(options: CallOptions): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: options.video ? this.config.constraints.video : false,
        audio: options.audio ? this.config.constraints.audio : false,
      };

      // Add timeout for getUserMedia
      const mediaPromise = navigator.mediaDevices.getUserMedia(constraints);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Media access timeout')), 10000);
      });

      this.localStream = await Promise.race([mediaPromise, timeoutPromise]);
      this.emit("localStream", this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('Failed to access media devices:', error);
      
      // Try fallback with reduced constraints
      if (options.video) {
        try {
          console.log('Trying fallback with audio only...');
          const fallbackConstraints: MediaStreamConstraints = {
            video: false,
            audio: options.audio ? this.config.constraints.audio : false,
          };
          
          this.localStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
          this.emit("localStream", this.localStream);
          return this.localStream;
        } catch (fallbackError) {
          console.error('Fallback media access failed:', fallbackError);
        }
      }
      
      throw new Error("Failed to access camera/microphone");
    }
  }

  async getDisplayMedia(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      this.emit("screenShare", stream);
      return stream;
    } catch {
      throw new Error("Failed to access screen sharing");
    }
  }

  // Peer connection management
  createPeer(
    peerId: string,
    isInitiator: boolean,
    stream?: MediaStream,
  ): SimplePeer.Instance {
    const peer = new SimplePeer({
      initiator: isInitiator,
      trickle: false,
      config: {
        iceServers: this.config.iceServers,
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      },
      stream: stream || this.localStream || undefined,
      channelConfig: {
        ordered: true,
      },
      offerOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      },
      answerOptions: {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      }
    });

    const peerConnection: PeerConnection = {
      id: peerId,
      peer,
      stream,
      isInitiator,
    };

    this.peers.set(peerId, peerConnection);

    // Set up connection timeout
    const connectionTimeout = setTimeout(() => {
      console.error(`Peer connection timeout for ${peerId}`);
      this.emit("peerError", { peerId, error: new Error('Connection timeout') });
      this.endCall(peerId);
    }, 30000); // 30 second timeout

    // Handle peer events
    peer.on("signal", (data) => {
      this.emit("signal", { peerId, signal: data });
    });

    peer.on("connect", () => {
      clearTimeout(connectionTimeout);
      console.log(`Peer connected: ${peerId}`);
      this.emit("peerConnected", peerId);
    });

    peer.on("data", (data: Buffer | string) => {
      this.emit("data", { peerId, data });
    });

    peer.on("stream", (remoteStream: MediaStream) => {
      clearTimeout(connectionTimeout);
      peerConnection.stream = remoteStream;
      this.emit("remoteStream", { peerId, stream: remoteStream });
    });

    peer.on("error", (error: Error) => {
      clearTimeout(connectionTimeout);
      console.error(`Peer error for ${peerId}:`, error);
      this.emit("peerError", { peerId, error });
    });

    peer.on("close", () => {
      this.peers.delete(peerId);
      this.emit("peerDisconnected", peerId);
    });

    return peer;
  }

  // Signal handling
  handleSignal(peerId: string, signal: SimplePeer.SignalData) {
    const peerConnection = this.peers.get(peerId);
    if (peerConnection) {
      peerConnection.peer.signal(signal);
    }
  }

  // Call management
  async startCall(peerId: string, options: CallOptions): Promise<void> {
    const stream = await this.getUserMedia(options);
    this.createPeer(peerId, true, stream);
    this.emit("callStarted", { peerId, options });
  }

  async answerCall(
    peerId: string,
    signal: SimplePeer.SignalData,
    options: CallOptions,
  ): Promise<void> {
    const stream = await this.getUserMedia(options);
    const peer = this.createPeer(peerId, false, stream);
    peer.signal(signal);
    this.emit("callAnswered", { peerId, options });
  }

  endCall(peerId?: string): void {
    if (peerId) {
      const peerConnection = this.peers.get(peerId);
      if (peerConnection) {
        peerConnection.peer.destroy();
        this.peers.delete(peerId);
      }
    } else {
      // End all calls
      this.peers.forEach((peerConnection) => {
        peerConnection.peer.destroy();
      });
      this.peers.clear();
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.emit("callEnded", peerId);
  }

  // Media controls
  toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.emit("audioToggled", audioTrack.enabled);
        return audioTrack.enabled;
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.emit("videoToggled", videoTrack.enabled);
        return videoTrack.enabled;
      }
    }
    return false;
  }

  async switchCamera(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        // Get available video devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput",
        );

        if (videoDevices.length > 1) {
          // Switch to next camera
          const currentDeviceId = videoTrack.getSettings().deviceId;
          const currentIndex = videoDevices.findIndex(
            (device) => device.deviceId === currentDeviceId,
          );
          const nextIndex = (currentIndex + 1) % videoDevices.length;
          const nextDevice = videoDevices[nextIndex];

          // Stop current track
          videoTrack.stop();

          // Get new stream with different camera
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: nextDevice.deviceId },
            audio: false,
          });

          // Replace video track in all peer connections
          const newVideoTrack = newStream.getVideoTracks()[0];
          this.localStream.removeTrack(videoTrack);
          this.localStream.addTrack(newVideoTrack);

          this.peers.forEach((peerConnection) => {
            const pc = (peerConnection.peer as unknown as { _pc?: RTCPeerConnection })._pc;
            const sender = pc?.getSenders()
              .find((s: RTCRtpSender) => s.track && s.track.kind === "video");
            if (sender) {
              sender.replaceTrack(newVideoTrack);
            }
          });

          this.emit("cameraSwitch", nextDevice.label);
        }
      }
    }
  }

  // Screen sharing
  async startScreenShare(): Promise<MediaStream> {
    const screenStream = await this.getDisplayMedia();

    // Replace video track in all peer connections
    const videoTrack = screenStream.getVideoTracks()[0];
    this.peers.forEach((peerConnection) => {
      const pc = (peerConnection.peer as unknown as { _pc?: RTCPeerConnection })._pc;
      const sender = pc?.getSenders()
        .find((s: RTCRtpSender) => s.track && s.track.kind === "video");
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    // Handle screen share end
    videoTrack.onended = () => {
      this.stopScreenShare();
    };

    this.emit("screenShareStarted", screenStream);
    return screenStream;
  }

  async stopScreenShare(): Promise<void> {
    // Get camera stream back
    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: this.config.constraints.video,
      audio: false,
    });

    const videoTrack = cameraStream.getVideoTracks()[0];

    // Replace screen share track with camera track
    this.peers.forEach((peerConnection) => {
      const pc = (peerConnection.peer as unknown as { _pc?: RTCPeerConnection })._pc;
      const sender = pc?.getSenders()
        .find((s: RTCRtpSender) => s.track && s.track.kind === "video");
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    // Update local stream
    if (this.localStream) {
      const oldVideoTrack = this.localStream.getVideoTracks()[0];
      if (oldVideoTrack) {
        this.localStream.removeTrack(oldVideoTrack);
        oldVideoTrack.stop();
      }
      this.localStream.addTrack(videoTrack);
    }

    this.emit("screenShareStopped");
  }

  // Utility methods
  getPeers(): PeerConnection[] {
    return Array.from(this.peers.values());
  }

  getPeer(peerId: string): PeerConnection | undefined {
    return this.peers.get(peerId);
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  isCallActive(): boolean {
    return this.peers.size > 0;
  }

  // Cleanup
  destroy(): void {
    this.endCall();
    this.eventHandlers.clear();
  }
}

export default WebRTCService;
