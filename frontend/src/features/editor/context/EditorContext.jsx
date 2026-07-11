import { createContext, useContext, useState } from "react";

const EditorContext = createContext();

const initialExecution = {
  output: "",
  outputType: "stdout",
  time: null,
  memory: null,
  status: null,
};

export function EditorProvider({ children }) {
  const [code, setCode] = useState(`// Welcome to CollabCode 🚀

function hello() {
  console.log("Hello World");
}
`);

  const [stdin, setStdin] = useState("");
  const [execution, setExecution] = useState(initialExecution);
  const [isRunning, setIsRunning] = useState(false);

  return (
    <EditorContext.Provider
      value={{
        code,
        setCode,
        stdin,
        setStdin,
        execution,
        setExecution,
        isRunning,
        setIsRunning,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  return useContext(EditorContext);
}