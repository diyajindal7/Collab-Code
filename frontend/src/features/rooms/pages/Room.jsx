import { useParams } from "react-router-dom";
import CodeEditor from "@/features/editor/components/CodeEditor";

export default function Room() {
  const { roomCode } = useParams();

  return (
    <div className="min-h-screen bg-slate-950">

      <nav className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white border-b">

        <h1 className="text-xl font-bold">
          ⚡ CollabCode
        </h1>

        <div>

          Room :
          <span className="font-bold ml-2">
            {roomCode}
          </span>

        </div>

      </nav>

      <CodeEditor />

    </div>
  );
}