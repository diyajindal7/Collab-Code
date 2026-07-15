import { useState } from "react";
import CodeReviewPanel from "./CodeReviewPanel";
import CodeExplainPanel from "./CodeExplainPanel";
import CodeFixPanel from "./CodeFixPanel";

const tabs = ["Review", "Explain", "Fix"];

export default function AiAssistantPanel({ language, selectedCode }) {
  const [activeTab, setActiveTab] = useState("Review");

  return (
    <div className="ai-assistant-panel">
      <div className="ai-assistant-tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Review" && (
        <CodeReviewPanel language={language} selectedCode={selectedCode} />
      )}

      {activeTab === "Explain" && (
        <CodeExplainPanel language={language} selectedCode={selectedCode} />
      )}

      {activeTab === "Fix" && (
        <CodeFixPanel language={language} selectedCode={selectedCode} />
      )}
    </div>
  );
}
