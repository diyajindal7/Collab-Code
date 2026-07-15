import { useState } from "react";
import CodeReviewPanel from "./CodeReviewPanel";
import CodeExplainPanel from "./CodeExplainPanel";
import CodeFixPanel from "./CodeFixPanel";

const tabs = ["Review", "Explain", "Fix"];

export default function AiAssistantPanel({ language, selectedCode }) {
  const [activeTab, setActiveTab] = useState("Review");

  return (
  <div className="flex h-full flex-col bg-slate-950">
    <div className="flex border-b border-slate-700 bg-slate-900">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActiveTab(tab)}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === tab
              ? "border-b-2 border-blue-500 bg-slate-800 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

    <div className="flex-1 overflow-hidden">
      {activeTab === "Review" && (
        <CodeReviewPanel
          language={language}
          selectedCode={selectedCode}
        />
      )}

      {activeTab === "Explain" && (
        <CodeExplainPanel
          language={language}
          selectedCode={selectedCode}
        />
      )}

      {activeTab === "Fix" && (
        <CodeFixPanel
          language={language}
          selectedCode={selectedCode}
        />
      )}
    </div>
  </div>
);
}