import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import socket from "@/features/editor/socket";
import { uploadInterviewRecording } from "@/features/rooms/services/recordingService";

const getIceServers = () => {
  const servers = [{ urls: "stun:stun.l.google.com:19302" }];
  const turnUrl = import.meta.env.VITE_TURN_URL;

  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME || "",
      credential: import.meta.env.VITE_TURN_CREDENTIAL || "",
    });
  }

  return servers;
};

const peerConfig = {
  iceServers: getIceServers(),
};

const createEmptyStatus = () => ({
  camera: false,
  mic: false,
  screen: false,
  speaking: false,
  recording: "idle",
});

export const useInterviewMedia = ({ roomCode, role }) => {
  const [localStream, setLocalStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState({});
  const [participantStatuses, setParticipantStatuses] = useState({});
  const [recordingState, setRecordingState] = useState("idle");
  const [localRecordingUrl, setLocalRecordingUrl] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [networkStatus, setNetworkStatus] = useState("disconnected");
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const pendingIceCandidatesRef = useRef({});
  const recordingStartedAtRef = useRef(null);
  const recordingPausedAtRef = useRef(null);
  const recordingPausedMsRef = useRef(0);
  const audioContextRef = useRef(null);
  const speakingIntervalRef = useRef(null);
  const lastSpeakingRef = useRef(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  }, []);

  const localStatus = useMemo(() => {
    const audioTrack = localStream?.getAudioTracks()[0];
    const videoTrack = localStream?.getVideoTracks()[0];

    return {
      camera: Boolean(videoTrack?.enabled),
      mic: Boolean(audioTrack?.enabled),
      screen: Boolean(screenStream),
      speaking: Boolean(participantStatuses.local?.speaking),
      recording: participantStatuses.local?.recording || recordingState,
    };
  }, [
    localStream,
    participantStatuses.local?.recording,
    participantStatuses.local?.speaking,
    recordingState,
    screenStream,
  ]);

  const emitMediaStatus = useCallback(
    (status) => {
      socket.emit("media:status", {
        roomCode,
        status,
      });
    },
    [roomCode]
  );

  const updateLocalStatus = useCallback(
    (statusPatch) => {
      setParticipantStatuses((currentStatuses) => {
        const nextStatus = {
          ...(currentStatuses.local || createEmptyStatus()),
          ...statusPatch,
        };

        emitMediaStatus(nextStatus);

        return {
          ...currentStatuses,
          local: nextStatus,
        };
      });
    },
    [emitMediaStatus]
  );

  const syncTracksToPeer = useCallback((peerConnection) => {
    const desiredTracks = [
      ...(localStreamRef.current?.getTracks() || []),
      ...(screenStreamRef.current?.getTracks() || []),
    ];
    const senders = peerConnection.getSenders();

    desiredTracks.forEach((track) => {
      const existingSender = senders.find(
        (sender) => sender.track?.kind === track.kind && sender.track?.label === track.label
      );

      if (existingSender) {
        existingSender.replaceTrack(track);
        return;
      }

      const sourceStream =
        localStreamRef.current?.getTracks().includes(track)
          ? localStreamRef.current
          : screenStreamRef.current;

      peerConnection.addTrack(track, sourceStream);
    });

    senders.forEach((sender) => {
      if (
        sender.track &&
        !desiredTracks.some((track) => track.id === sender.track.id)
      ) {
        peerConnection.removeTrack(sender);
      }
    });
  }, []);

  const createPeerConnection = useCallback(
    (socketId) => {
      if (peerConnectionsRef.current[socketId]) {
        return peerConnectionsRef.current[socketId];
      }

      const peerConnection = new RTCPeerConnection(peerConfig);
      peerConnectionsRef.current[socketId] = peerConnection;

      syncTracksToPeer(peerConnection);

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("webrtc:ice-candidate", {
            to: socketId,
            candidate: event.candidate,
          });
        }
      };

      peerConnection.ontrack = (event) => {
        const [stream] = event.streams;

        setRemotePeers((currentPeers) => ({
          ...currentPeers,
          [socketId]: {
            ...(currentPeers[socketId] || {}),
            socketId,
            stream,
          },
        }));
      };

      peerConnection.onconnectionstatechange = () => {
        setNetworkStatus(peerConnection.connectionState);

        if (
          ["closed", "failed", "disconnected"].includes(
            peerConnection.connectionState
          )
        ) {
          setRemotePeers((currentPeers) => {
            const nextPeers = { ...currentPeers };
            delete nextPeers[socketId];
            return nextPeers;
          });
        }
      };

      peerConnection.oniceconnectionstatechange = () => {
        setNetworkStatus(peerConnection.iceConnectionState);
      };

      return peerConnection;
    },
    [syncTracksToPeer]
  );

  const renegotiatePeers = useCallback(async () => {
    await Promise.all(
      Object.keys(peerConnectionsRef.current).map(async (socketId) => {
        const peerConnection = peerConnectionsRef.current[socketId];

        if (!peerConnection || peerConnection.signalingState === "closed") {
          return;
        }

        syncTracksToPeer(peerConnection);
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("webrtc:offer", {
          to: socketId,
          offer,
        });
      })
    );
  }, [syncTracksToPeer]);

  const startCamera = useCallback(async () => {
    try {
      setMediaError("");
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      updateLocalStatus({
        camera: true,
        mic: true,
      });

      socket.emit("webrtc:join", {
        roomCode,
        user,
      });
      setNetworkStatus("connecting");
      await renegotiatePeers();
    } catch (error) {
      console.error(error);
      setMediaError("Camera or microphone permission was denied.");
    }
  }, [renegotiatePeers, roomCode, updateLocalStatus, user]);

  const toggleMic = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];

    if (!audioTrack) return;

    audioTrack.enabled = !audioTrack.enabled;
    updateLocalStatus({
      mic: audioTrack.enabled,
    });
  }, [updateLocalStatus]);

  const toggleCamera = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];

    if (!videoTrack) return;

    videoTrack.enabled = !videoTrack.enabled;
    updateLocalStatus({
      camera: videoTrack.enabled,
    });
  }, [updateLocalStatus]);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = stream;
      setScreenStream(stream);
      updateLocalStatus({
        screen: true,
      });

      stream.getVideoTracks()[0].onended = () => {
        screenStreamRef.current = null;
        setScreenStream(null);
        updateLocalStatus({
          screen: false,
        });
        renegotiatePeers();
      };

      await renegotiatePeers();
    } catch (error) {
      console.error(error);
      setMediaError("Screen sharing could not be started.");
    }
  }, [renegotiatePeers, updateLocalStatus]);

  const stopScreenShare = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current = null;
    setScreenStream(null);
    updateLocalStatus({
      screen: false,
    });
    renegotiatePeers();
  }, [renegotiatePeers, updateLocalStatus]);

  const startRecording = useCallback(() => {
    const streams = [localStreamRef.current, screenStreamRef.current].filter(
      Boolean
    );

    if (
      !streams.length ||
      ["recording", "paused"].includes(mediaRecorderRef.current?.state)
    ) {
      return;
    }

    const combinedStream = new MediaStream(
      streams.flatMap((stream) => stream.getTracks())
    );

    recordedChunksRef.current = [];
    const recorder = MediaRecorder.isTypeSupported("video/webm")
      ? new MediaRecorder(combinedStream, {
          mimeType: "video/webm",
        })
      : new MediaRecorder(combinedStream);

    mediaRecorderRef.current = recorder;
      setRecordingState("recording");
      updateLocalStatus({
        recording: "recording",
      });
      recordingStartedAtRef.current = Date.now();
      recordingPausedAtRef.current = null;
      recordingPausedMsRef.current = 0;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, {
        type: "video/webm",
      });

      if (!blob.size) {
        setRecordingState("idle");
        updateLocalStatus({
          recording: "idle",
        });
        return;
      }

      setLocalRecordingUrl(URL.createObjectURL(blob));
      setRecordingState("uploading");
      updateLocalStatus({
        recording: "uploading",
      });

      const durationSeconds = recordingStartedAtRef.current
        ? Math.max(
            0,
            Math.round(
              (Date.now() -
                recordingStartedAtRef.current -
                recordingPausedMsRef.current) /
                1000
            )
          )
        : 0;

      try {
        await uploadInterviewRecording(roomCode, blob, {
          durationSeconds,
        });
        setRecordingState("saved");
        updateLocalStatus({
          recording: "saved",
        });
      } catch (error) {
        console.error(error);
        setRecordingState("failed");
        updateLocalStatus({
          recording: "failed",
        });
      }
    };

    recorder.start(1000);
  }, [roomCode, updateLocalStatus]);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current?.state === "recording" ||
      mediaRecorderRef.current?.state === "paused"
    ) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "recording") return;

    mediaRecorderRef.current.pause();
    recordingPausedAtRef.current = Date.now();
    setRecordingState("paused");
    updateLocalStatus({
      recording: "paused",
    });
  }, [updateLocalStatus]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== "paused") return;

    if (recordingPausedAtRef.current) {
      recordingPausedMsRef.current += Date.now() - recordingPausedAtRef.current;
    }

    recordingPausedAtRef.current = null;
    mediaRecorderRef.current.resume();
    setRecordingState("recording");
    updateLocalStatus({
      recording: "recording",
    });
  }, [updateLocalStatus]);

  const teardown = useCallback(() => {
    if (
      mediaRecorderRef.current?.state === "recording" ||
      mediaRecorderRef.current?.state === "paused"
    ) {
      mediaRecorderRef.current.stop();
    }

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    screenStreamRef.current?.getTracks().forEach((track) => track.stop());
    Object.values(peerConnectionsRef.current).forEach((peerConnection) => {
      peerConnection.close();
    });

    peerConnectionsRef.current = {};
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setLocalStream(null);
    setScreenStream(null);
    setRemotePeers({});
    setNetworkStatus("disconnected");
    updateLocalStatus(createEmptyStatus());
    socket.emit("webrtc:leave", {
      roomCode,
    });
  }, [roomCode, updateLocalStatus]);

  useEffect(() => {
    const handlePeers = async (peers) => {
      await Promise.all(
        peers.map(async ({ socketId, user: peerUser }) => {
          const peerConnection = createPeerConnection(socketId);
          setRemotePeers((currentPeers) => ({
            ...currentPeers,
            [socketId]: {
              ...(currentPeers[socketId] || {}),
              socketId,
              user: peerUser,
            },
          }));

          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.emit("webrtc:offer", {
            to: socketId,
            offer,
          });
        })
      );
    };

    const handleUserJoined = ({ socketId, user: peerUser }) => {
      createPeerConnection(socketId);
      setRemotePeers((currentPeers) => ({
        ...currentPeers,
        [socketId]: {
          ...(currentPeers[socketId] || {}),
          socketId,
          user: peerUser,
        },
      }));
    };

    const handleOffer = async ({ from, offer, user: peerUser }) => {
      const peerConnection = createPeerConnection(from);
      setRemotePeers((currentPeers) => ({
        ...currentPeers,
        [from]: {
          ...(currentPeers[from] || {}),
          socketId: from,
          user: peerUser,
        },
      }));
      await peerConnection.setRemoteDescription(offer);
      await Promise.all(
        (pendingIceCandidatesRef.current[from] || []).map((candidate) =>
          peerConnection.addIceCandidate(candidate)
        )
      );
      pendingIceCandidatesRef.current[from] = [];
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      socket.emit("webrtc:answer", {
        to: from,
        answer,
      });
    };

    const handleAnswer = async ({ from, answer }) => {
      const peerConnection = peerConnectionsRef.current[from];

      if (!peerConnection) return;

      await peerConnection.setRemoteDescription(answer);
      await Promise.all(
        (pendingIceCandidatesRef.current[from] || []).map((candidate) =>
          peerConnection.addIceCandidate(candidate)
        )
      );
      pendingIceCandidatesRef.current[from] = [];
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      const peerConnection = peerConnectionsRef.current[from];

      if (!candidate) return;

      if (!peerConnection) {
        pendingIceCandidatesRef.current[from] = [
          ...(pendingIceCandidatesRef.current[from] || []),
          candidate,
        ];
        return;
      }

      if (!peerConnection.remoteDescription) {
        pendingIceCandidatesRef.current[from] = [
          ...(pendingIceCandidatesRef.current[from] || []),
          candidate,
        ];
        return;
      }

      await peerConnection.addIceCandidate(candidate);
    };

    const handleUserLeft = ({ socketId }) => {
      peerConnectionsRef.current[socketId]?.close();
      delete peerConnectionsRef.current[socketId];
      setRemotePeers((currentPeers) => {
        const nextPeers = { ...currentPeers };
        delete nextPeers[socketId];
        return nextPeers;
      });
    };

    const handleMediaStatus = ({ socketId, user: peerUser, status }) => {
      setParticipantStatuses((currentStatuses) => ({
        ...currentStatuses,
        [socketId]: {
          ...(currentStatuses[socketId] || createEmptyStatus()),
          ...status,
          user: peerUser,
        },
      }));
    };

    const handleReconnect = () => {
      if (!localStreamRef.current) return;

      socket.emit("webrtc:join", {
        roomCode,
        user,
      });
      setNetworkStatus("reconnecting");
    };

    socket.on("webrtc:peers", handlePeers);
    socket.on("webrtc:user-joined", handleUserJoined);
    socket.on("webrtc:offer", handleOffer);
    socket.on("webrtc:answer", handleAnswer);
    socket.on("webrtc:ice-candidate", handleIceCandidate);
    socket.on("webrtc:user-left", handleUserLeft);
    socket.on("media:status", handleMediaStatus);
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("webrtc:peers", handlePeers);
      socket.off("webrtc:user-joined", handleUserJoined);
      socket.off("webrtc:offer", handleOffer);
      socket.off("webrtc:answer", handleAnswer);
      socket.off("webrtc:ice-candidate", handleIceCandidate);
      socket.off("webrtc:user-left", handleUserLeft);
      socket.off("media:status", handleMediaStatus);
      socket.off("connect", handleReconnect);
    };
  }, [createPeerConnection, roomCode, user]);

  useEffect(() => {
    if (!localStream) return undefined;

    const audioTrack = localStream.getAudioTracks()[0];

    if (!audioTrack) return undefined;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(
      new MediaStream([audioTrack])
    );
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    audioContextRef.current = audioContext;
    source.connect(analyser);

    speakingIntervalRef.current = window.setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      const average =
        dataArray.reduce((total, value) => total + value, 0) / dataArray.length;
      const speaking = average > 12 && audioTrack.enabled;

      if (speaking !== lastSpeakingRef.current) {
        lastSpeakingRef.current = speaking;
        updateLocalStatus({
          speaking,
        });
      }
    }, 500);

    return () => {
      window.clearInterval(speakingIntervalRef.current);
      audioContext.close();
    };
  }, [localStream, updateLocalStatus]);

  useEffect(() => teardown, [teardown]);

  return {
    localStream,
    screenStream,
    remotePeers,
    participantStatuses,
    localStatus,
    recordingState,
    localRecordingUrl,
    mediaError,
    networkStatus,
    isInterviewer: role === "interviewer",
    startCamera,
    toggleMic,
    toggleCamera,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    teardown,
  };
};
