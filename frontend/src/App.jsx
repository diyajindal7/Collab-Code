import { name } from "@/test";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <h1 className="text-white text-5xl">
        Hello {name}
      </h1>
    </div>
  );
}

export default App;