import { Button } from "@/components/ui/button";

export default function Toolbar({
  language,
  setLanguage,
  onRun,
  roomCode,
  isRunning,
}) {
  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert("Room code copied!");
  };

  return (
    <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-5 py-3">
      <h1 className="text-xl font-bold text-white">⚡ CollabCode</h1>

      <div className="flex gap-3">
        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="rounded bg-slate-800 px-3 py-2 text-white"
        >
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
        </select>

        <Button onClick={onRun} disabled={isRunning}>
          {isRunning ? "Running..." : "▶ Run"}
        </Button>

        <Button variant="secondary" onClick={copyRoomCode}>
          Copy Room Code
        </Button>
      </div>
    </div>
  );
}