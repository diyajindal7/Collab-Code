import { createContext, useContext, useState } from "react";

const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [code, setCode] = useState(`// Welcome to CollabCode 🚀

function hello() {
  console.log("Hello World");
}
`);

  const [stdin, setStdin] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  return (
    <EditorContext.Provider
      value={{
        code,
        setCode,
        stdin,
        setStdin,
        output,
        setOutput,
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