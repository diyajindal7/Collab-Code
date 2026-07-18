import api from "@/lib/axios";

export const uploadInterviewRecording = async (
  roomCode,
  recordingBlob,
  metadata = {}
) => {
  const { data } = await api.post(
    `/recordings/interviews/${roomCode}`,
    recordingBlob,
    {
      headers: {
        "Content-Type": "video/webm",
        "X-Recording-Name": `interview-${roomCode}.webm`,
        "X-Recording-Duration": String(metadata.durationSeconds || 0),
      },
    }
  );
  return data;
};

export const getInterviewRecordings = async (roomCode) => {
  const { data } = await api.get(`/recordings/interviews/${roomCode}`);
  return data;
};

export const deleteInterviewRecording = async (recordingId) => {
  const { data } = await api.delete(`/recordings/interviews/${recordingId}`);
  return data;
};
