import { Button } from "@/components/ui/button";

export default function InterviewControls({
  status,
  isInterviewer,
  onStart,
  onPause,
  onResume,
  onEnd,
  onExtend,
  onSkipQuestion,
  onFinish,
}) {
  if (!isInterviewer) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "waiting" && <Button onClick={onStart}>Start</Button>}
      {status === "active" && (
        <Button variant="secondary" onClick={onPause}>
          Pause
        </Button>
      )}
      {status === "paused" && <Button onClick={onResume}>Resume</Button>}
      {status !== "completed" && (
        <>
          <Button variant="secondary" onClick={() => onExtend(5)}>
            +5 Min
          </Button>
          <Button variant="secondary" onClick={onSkipQuestion}>
            Skip Question
          </Button>
          <Button variant="destructive" onClick={onEnd}>
            End
          </Button>
          <Button variant="destructive" onClick={onFinish}>
            Finish
          </Button>
        </>
      )}
    </div>
  );
}
