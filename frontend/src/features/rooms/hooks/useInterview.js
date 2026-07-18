import { useCallback, useEffect, useRef, useState } from "react";
import socket from "@/features/editor/socket";

export default function useInterview(roomCode, stopRecording = () => {}) {
  const [interviewState, setInterviewState] = useState(null);
  const [interviewStatus, setInterviewStatus] = useState("waiting");
  const [interviewRole, setInterviewRole] = useState("candidate");
  const [duration, setDuration] = useState(45);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const interviewTimerRef = useRef(null);

  useEffect(() => {
    const handleInterviewStarted = ({ status }) => {
      setInterviewStatus(status);
      setTimeRemaining(duration * 60);
    };

    const handleInterviewState = (state) => {
      setInterviewState(state);
      setInterviewStatus(state.status || "waiting");
      setDuration(state.duration || duration);
    };

    const handleInterviewRole = ({ role }) => {
      setInterviewRole(role);
    };

    const handleInterviewEnded = ({ status }) => {
      setInterviewStatus(status);

      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current);
        interviewTimerRef.current = null;
      }

      setTimeRemaining(0);
    };

    const handleInterviewPaused = ({ status }) => {
      setInterviewStatus(status);
    };

    const handleInterviewResumed = ({ status }) => {
      setInterviewStatus(status);
    };

    socket.on("interview:state", handleInterviewState);
    socket.on("interview-started", handleInterviewStarted);
    socket.on("interview-paused", handleInterviewPaused);
    socket.on("interview-resumed", handleInterviewResumed);
    socket.on("interview-role", handleInterviewRole);
    socket.on("interview-ended", handleInterviewEnded);

    return () => {
      socket.off("interview:state", handleInterviewState);
      socket.off("interview-started", handleInterviewStarted);
      socket.off("interview-paused", handleInterviewPaused);
      socket.off("interview-resumed", handleInterviewResumed);
      socket.off("interview-role", handleInterviewRole);
      socket.off("interview-ended", handleInterviewEnded);
      stopRecording();
    };
  }, [duration, roomCode, stopRecording]);

  useEffect(() => {
    if (interviewTimerRef.current) {
      clearInterval(interviewTimerRef.current);
      interviewTimerRef.current = null;
    }

    if (interviewStatus !== "active") return undefined;

    interviewTimerRef.current = setInterval(() => {
      setTimeRemaining((currentTime) => {
        if (currentTime <= 1) {
          clearInterval(interviewTimerRef.current);
          interviewTimerRef.current = null;
          socket.emit("end-interview", {
            roomCode,
          });
          return 0;
        }

        return currentTime - 1;
      });
    }, 1000);

    return () => {
      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current);
        interviewTimerRef.current = null;
      }
    };
  }, [interviewStatus, roomCode]);

  const startInterview = useCallback(() => {
    socket.emit("start-interview", {
      roomCode,
    });
  }, [roomCode]);

  const pauseInterview = useCallback(() => {
    socket.emit("pause-interview", {
      roomCode,
    });
  }, [roomCode]);

  const resumeInterview = useCallback(() => {
    socket.emit("resume-interview", {
      roomCode,
    });
  }, [roomCode]);

  const finishInterview = useCallback(() => {
    socket.emit("finish-interview", {
      roomCode,
    });
  }, [roomCode]);

  return {
    interviewState,
    setInterviewState,
    interviewRole,
    interviewStatus,
    setInterviewStatus,
    timeRemaining,
    setTimeRemaining,
    duration,
    setDuration,
    startInterview,
    pauseInterview,
    resumeInterview,
    finishInterview,
  };
}
