import { useCallback, useRef, useState } from "react";
import { uploadInterviewRecording } from "../services/recordingService";

export default function useRecording(roomCode) {
  const [recordingStatus, setRecordingStatus] = useState("");
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      recordingStreamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (mediaRecorderRef.current?.state === "recording") {
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      const microphoneStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const combinedStream = new MediaStream([
        ...screenStream.getVideoTracks(),
        ...screenStream.getAudioTracks(),
        ...microphoneStream.getAudioTracks(),
      ]);

      recordedChunksRef.current = [];
      recordingStreamRef.current = combinedStream;

      const mediaRecorder = new MediaRecorder(combinedStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordingBlob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        if (!recordingBlob.size) {
          return;
        }

        try {
          setRecordingStatus("Uploading recording...");
          await uploadInterviewRecording(roomCode, recordingBlob);
          setRecordingStatus("Recording uploaded");
        } catch (error) {
          console.error(error);
          setRecordingStatus("Recording upload failed");
        }
      };

      screenStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Recording failed:", error);
    }
  }, [roomCode, stopRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingStatus("Recording paused");
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingStatus("Recording");
    }
  }, []);

  return {
    recordingStatus,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
