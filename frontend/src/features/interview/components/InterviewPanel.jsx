import { useEffect, useMemo, useRef, useState } from "react";
import socket from "@/features/editor/socket";
import {
  deleteInterviewRecording,
  getInterviewRecordings,
} from "@/features/rooms/services/recordingService";
import { Button } from "@/components/ui/button";
import { useInterviewMedia } from "../hooks/useInterviewMedia";
import InterviewControls from "./InterviewControls";
import VideoTile from "./VideoTile";

const defaultQuestion = {
  title: "",
  statement: "",
  examples: "",
  constraints: "",
  expectedComplexity: "",
};

const defaultEvaluation = {
  communication: 0,
  problemSolving: 0,
  coding: 0,
  optimization: 0,
  debugging: 0,
  rating: 0,
  recommendation: "pending",
  feedback: "",
};

const getUploadsUrl = (relativeUrl) => {
  const baseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
  return `${baseUrl}${relativeUrl}`;
};

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
};

const calculateRemainingSeconds = (state) => {
  const durationSeconds = (state.duration || 45) * 60;

  if (!state.startedAt || state.status === "waiting") {
    return durationSeconds;
  }

  if (state.status === "completed") {
    return 0;
  }

  const now = state.status === "paused" && state.pausedAt ? new Date(state.pausedAt).getTime() : Date.now();
  const elapsedMs =
    now - new Date(state.startedAt).getTime() - (state.totalPausedMs || 0);

  return Math.ceil(durationSeconds - elapsedMs / 1000);
};

export default function InterviewPanel({ roomCode, role, initialState }) {
  const [interviewState, setInterviewState] = useState({
    status: initialState?.status || "waiting",
    duration: initialState?.duration || 45,
    startedAt: initialState?.startedAt || null,
    pausedAt: initialState?.pausedAt || null,
    totalPausedMs: initialState?.totalPausedMs || 0,
    notes: initialState?.notes || "",
    evaluation: initialState?.evaluation || defaultEvaluation,
    question: initialState?.question || defaultQuestion,
  });
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    calculateRemainingSeconds(interviewState)
  );
  const [notesDraft, setNotesDraft] = useState(interviewState.notes || "");
  const [evaluationDraft, setEvaluationDraft] = useState(
    interviewState.evaluation || defaultEvaluation
  );
  const [questionDraft, setQuestionDraft] = useState(
    interviewState.question || defaultQuestion
  );
  const [recordings, setRecordings] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const notesAutosaveRef = useRef(null);

  const media = useInterviewMedia({
    roomCode,
    role,
  });

  const remotePeerList = useMemo(
    () => Object.values(media.remotePeers),
    [media.remotePeers]
  );

  const interviewerCanEdit = role === "interviewer";
  const candidateScreenPeer = remotePeerList.find(
    (peer) => media.participantStatuses[peer.socketId]?.screen
  );

  const loadRecordings = async () => {
    try {
      setRecordingsLoading(true);
      const data = await getInterviewRecordings(roomCode);
      setRecordings(data.recordings || []);
    } catch (error) {
      console.error(error);
    } finally {
      setRecordingsLoading(false);
    }
  };

  useEffect(() => {
    const handleState = (nextState) => {
      setInterviewState((currentState) => ({
        ...currentState,
        ...nextState,
        evaluation: {
          ...defaultEvaluation,
          ...(nextState.evaluation || {}),
        },
        question: {
          ...defaultQuestion,
          ...(nextState.question || {}),
        },
      }));
      setNotesDraft(nextState.notes || "");
      setEvaluationDraft({
        ...defaultEvaluation,
        ...(nextState.evaluation || {}),
      });
      setQuestionDraft({
        ...defaultQuestion,
        ...(nextState.question || {}),
      });
    };

    socket.on("interview:state", handleState);
    socket.on("interview-started", handleState);
    socket.on("interview-paused", handleState);
    socket.on("interview-resumed", handleState);
    socket.on("interview-ended", handleState);

    return () => {
      socket.off("interview:state", handleState);
      socket.off("interview-started", handleState);
      socket.off("interview-paused", handleState);
      socket.off("interview-resumed", handleState);
      socket.off("interview-ended", handleState);
    };
  }, []);

  useEffect(() => {
    setRemainingSeconds(calculateRemainingSeconds(interviewState));

    if (interviewState.status !== "active") {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      setRemainingSeconds(calculateRemainingSeconds(interviewState));
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [interviewState]);

  useEffect(() => {
    loadRecordings();
  }, [roomCode]);

  useEffect(() => {
    if (media.recordingState === "saved") {
      loadRecordings();
    }
  }, [media.recordingState]);

  useEffect(() => {
    if (
      interviewerCanEdit &&
      interviewState.status === "active" &&
      remainingSeconds <= 0
    ) {
      socket.emit("end-interview", {
        roomCode,
      });
    }
  }, [interviewerCanEdit, interviewState.status, remainingSeconds, roomCode]);

  const emitControl = (event, payload = {}) => {
    socket.emit(event, {
      roomCode,
      ...payload,
    });
  };

  const saveNotes = () => {
    emitControl("interview:notes:update", {
      notes: notesDraft,
    });
  };

  const saveEvaluation = () => {
    emitControl("interview:evaluation:update", {
      evaluation: evaluationDraft,
    });
  };

  const saveQuestion = () => {
    emitControl("interview:question:update", {
      question: questionDraft,
    });
  };

  const handleDeleteRecording = async (recordingId) => {
    const shouldDelete = window.confirm("Delete this recording?");

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteInterviewRecording(recordingId);
      await loadRecordings();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!interviewerCanEdit) return undefined;

    if (notesDraft === interviewState.notes) {
      return undefined;
    }

    if (notesAutosaveRef.current) {
      window.clearTimeout(notesAutosaveRef.current);
    }

    notesAutosaveRef.current = window.setTimeout(() => {
      saveNotes();
    }, 1000);

    return () => {
      if (notesAutosaveRef.current) {
        window.clearTimeout(notesAutosaveRef.current);
      }
    };
  }, [interviewerCanEdit, notesDraft, interviewState.notes]);

  return (
    <div className="border-b border-slate-700 bg-slate-950 px-5 py-4 text-white">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-blue-300">
            Technical Interview
          </h2>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="capitalize">Role: {role}</span>
            <span className="capitalize">Status: {interviewState.status}</span>
            <span>Timer: {formatTime(remainingSeconds)}</span>
            <span className="capitalize">Network: {media.networkStatus}</span>
            <span className="capitalize">
              Recording: {media.recordingState}
            </span>
          </div>
        </div>

        <InterviewControls
          status={interviewState.status}
          isInterviewer={interviewerCanEdit}
          onStart={() => emitControl("start-interview")}
          onPause={() => emitControl("pause-interview")}
          onResume={() => emitControl("resume-interview")}
          onEnd={() => emitControl("end-interview")}
          onExtend={(minutes) => emitControl("interview:extend", { minutes })}
          onSkipQuestion={() => emitControl("interview:question:skip")}
          onFinish={() => emitControl("finish-interview")}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <VideoTile
              stream={media.localStream}
              label={role === "interviewer" ? "Interviewer Camera" : "Candidate Camera"}
              muted
            />
            {remotePeerList.map((peer) => (
              <VideoTile
                key={peer.socketId}
                stream={peer.stream}
                label={peer.user?.name || "Participant Camera"}
              />
            ))}
          </div>

          {interviewerCanEdit && candidateScreenPeer?.stream && (
            <VideoTile
              stream={candidateScreenPeer.stream}
              label="Candidate Screen"
              isScreen
            />
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={media.startCamera}>
              {media.localStream ? "Restart Camera" : "Start Camera"}
            </Button>
            <Button variant="secondary" onClick={media.toggleMic}>
              {media.localStatus.mic ? "Mute Mic" : "Unmute Mic"}
            </Button>
            <Button variant="secondary" onClick={media.toggleCamera}>
              {media.localStatus.camera ? "Camera Off" : "Camera On"}
            </Button>
            {role === "candidate" && (
              <Button
                variant="secondary"
                onClick={
                  media.screenStream
                    ? media.stopScreenShare
                    : media.startScreenShare
                }
              >
                {media.screenStream ? "Stop Sharing" : "Share Screen"}
              </Button>
            )}
            <Button
              variant="secondary"
              disabled={media.recordingState === "uploading"}
              onClick={media.startRecording}
            >
              Start Recording
            </Button>
            <Button
              variant="secondary"
              disabled={media.recordingState !== "recording"}
              onClick={media.pauseRecording}
            >
              Pause Recording
            </Button>
            <Button
              variant="secondary"
              disabled={media.recordingState !== "paused"}
              onClick={media.resumeRecording}
            >
              Resume Recording
            </Button>
            <Button
              variant="secondary"
              disabled={
                !["recording", "paused"].includes(media.recordingState)
              }
              onClick={media.stopRecording}
            >
              Stop Recording
            </Button>
          </div>

          {media.mediaError && (
            <p className="rounded border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {media.mediaError}
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">
                Participant Status
              </h3>
              <div className="space-y-2 text-sm text-slate-300">
                <p>
                  You: camera {media.localStatus.camera ? "on" : "off"}, mic{" "}
                  {media.localStatus.mic ? "on" : "off"}, screen{" "}
                  {media.localStatus.screen ? "sharing" : "off"}, speaking{" "}
                  {media.localStatus.speaking ? "yes" : "no"}, recording{" "}
                  {media.localStatus.recording}
                </p>
                {Object.entries(media.participantStatuses)
                  .filter(([socketId]) => socketId !== "local")
                  .map(([socketId, status]) => (
                    <p key={socketId}>
                      {status.user?.name || "Participant"}: camera{" "}
                      {status.camera ? "on" : "off"}, mic{" "}
                      {status.mic ? "on" : "off"}, screen{" "}
                      {status.screen ? "sharing" : "off"}, speaking{" "}
                      {status.speaking ? "yes" : "no"}, recording{" "}
                      {status.recording || "idle"}
                    </p>
                  ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-200">
                Recordings
              </h3>
              <p className="mb-2 text-xs text-slate-400">
                Status: {media.recordingState}
              </p>
              {media.localRecordingUrl && (
                <video
                  controls
                  src={media.localRecordingUrl}
                  className="mb-2 max-h-40 w-full rounded bg-black"
                />
              )}
              {recordingsLoading ? (
                <p className="text-sm text-slate-400">Loading recordings...</p>
              ) : (
                <div className="space-y-2">
                  {recordings.map((recording) => (
                    <div
                      key={recording._id}
                      className="rounded border border-slate-800 p-2"
                    >
                      <video
                        controls
                        src={getUploadsUrl(recording.url)}
                        className="mb-2 max-h-40 w-full rounded bg-black"
                      />
                      <a
                        className="text-sm text-blue-300 hover:text-blue-200"
                        href={getUploadsUrl(recording.url)}
                        download={recording.filename}
                      >
                        Download recording
                      </a>
                      <Button
                        className="ml-3"
                        variant="destructive"
                        onClick={() => handleDeleteRecording(recording._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                  {!recordings.length && (
                    <p className="text-sm text-slate-400">No recordings yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
            <h3 className="mb-3 text-sm font-semibold text-slate-200">
              Coding Question
            </h3>
            {interviewerCanEdit ? (
              <div className="space-y-2">
                <input
                  className="w-full rounded bg-slate-800 px-3 py-2 text-sm"
                  placeholder="Problem title"
                  value={questionDraft.title}
                  onChange={(event) =>
                    setQuestionDraft((currentQuestion) => ({
                      ...currentQuestion,
                      title: event.target.value,
                    }))
                  }
                />
                {[
                  "statement",
                  "examples",
                  "constraints",
                  "expectedComplexity",
                ].map((field) => (
                  <textarea
                    key={field}
                    className="h-20 w-full rounded bg-slate-800 px-3 py-2 text-sm"
                    placeholder={field}
                    value={questionDraft[field]}
                    onChange={(event) =>
                      setQuestionDraft((currentQuestion) => ({
                        ...currentQuestion,
                        [field]: event.target.value,
                      }))
                    }
                  />
                ))}
                <Button onClick={saveQuestion}>Save Question</Button>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-slate-300">
                <h4 className="font-semibold text-white">
                  {interviewState.question?.title || "Question pending"}
                </h4>
                <p className="whitespace-pre-wrap">
                  {interviewState.question?.statement || "Waiting for interviewer."}
                </p>
                <p className="whitespace-pre-wrap">
                  <span className="font-medium text-slate-100">Examples: </span>
                  {interviewState.question?.examples || "None yet"}
                </p>
                <p className="whitespace-pre-wrap">
                  <span className="font-medium text-slate-100">
                    Constraints:{" "}
                  </span>
                  {interviewState.question?.constraints || "None yet"}
                </p>
                <p className="whitespace-pre-wrap">
                  <span className="font-medium text-slate-100">
                    Expected Complexity:{" "}
                  </span>
                  {interviewState.question?.expectedComplexity || "Not specified"}
                </p>
              </div>
            )}
          </div>

          {interviewerCanEdit && (
            <>
              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                <h3 className="mb-3 text-sm font-semibold text-slate-200">
                  Interviewer Notes
                </h3>
                <textarea
                  className="h-32 w-full rounded bg-slate-800 px-3 py-2 text-sm"
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                />
                <Button className="mt-2" onClick={saveNotes}>
                  Save Notes Now
                </Button>
              </div>

              <div className="rounded-lg border border-slate-700 bg-slate-900 p-3">
                <h3 className="mb-3 text-sm font-semibold text-slate-200">
                  Candidate Evaluation
                </h3>
                <div className="space-y-2">
                  {[
                    ["communication", "Communication"],
                    ["problemSolving", "Problem Solving"],
                    ["coding", "Coding"],
                    ["optimization", "Optimization"],
                    ["debugging", "Debugging"],
                    ["rating", "Overall Rating"],
                  ].map(([field, label]) => (
                    <label key={field} className="block text-sm text-slate-300">
                      <span className="mb-1 block">{label}</span>
                      <input
                        className="w-full rounded bg-slate-800 px-3 py-2 text-sm"
                        min="0"
                        max="5"
                        type="number"
                        value={evaluationDraft[field]}
                        onChange={(event) =>
                          setEvaluationDraft((currentEvaluation) => ({
                            ...currentEvaluation,
                            [field]: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                  ))}
                  <select
                    className="w-full rounded bg-slate-800 px-3 py-2 text-sm"
                    value={evaluationDraft.recommendation}
                    onChange={(event) =>
                      setEvaluationDraft((currentEvaluation) => ({
                        ...currentEvaluation,
                        recommendation: event.target.value,
                      }))
                    }
                  >
                    <option value="pending">Pending</option>
                    <option value="strong-hire">Strong Hire</option>
                    <option value="hire">Hire</option>
                    <option value="no-hire">No Hire</option>
                  </select>
                  <textarea
                    className="h-24 w-full rounded bg-slate-800 px-3 py-2 text-sm"
                    value={evaluationDraft.feedback}
                    onChange={(event) =>
                      setEvaluationDraft((currentEvaluation) => ({
                        ...currentEvaluation,
                        feedback: event.target.value,
                      }))
                    }
                  />
                  <Button onClick={saveEvaluation}>Save Evaluation</Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
