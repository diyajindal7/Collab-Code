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
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [dirtyFiles, setDirtyFiles] = useState({});

  const resetEditor = () => {
    setCode("");
    setStdin("");
    setExecution(initialExecution);
    setIsRunning(false);
    setCurrentFile(null);
    setOpenFiles([]);
    setDirtyFiles({});
  };

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
        currentFile,
        setCurrentFile,
        openFiles,
        setOpenFiles,
        dirtyFiles,
        setDirtyFiles,
        resetEditor,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useEditor() {
  return useContext(EditorContext);
}
