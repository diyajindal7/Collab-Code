import { Button } from "@/components/ui/button";

export default function Toolbar({
  language,
  setLanguage,
  onRun,
  roomCode,
}) {

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    alert("Room code copied!");
  };

  return (
    <div className="flex items-center justify-between bg-slate-900 border-b border-slate-700 px-5 py-3">

      <h1 className="text-white font-bold text-xl">
        ⚡ CollabCode
      </h1>

      <div className="flex gap-3">

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded px-3 py-2 bg-slate-800 text-white"
        >
          <option value="javascript">JavaScript</option>
          <option value="java">Java</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="c">C</option>
        </select>

        <Button onClick={onRun}>
          ▶ Run
        </Button>

        <Button
          variant="secondary"
          onClick={copyRoomCode}
        >
          Copy Room Code
        </Button>

      </div>

    </div>
  );
}