import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor } from "@/features/editor/context/EditorContext";
import socket from "@/features/editor/socket";
import { updateFileContent } from "@/features/files/services/fileService";

export default function useWorkspace(roomCode, language, setLanguage, pairState) {
  const [saveStatus, setSaveStatus] = useState("Saved");
  const autoSaveTimeoutRef = useRef(null);
  const saveRequestIdRef = useRef(0);
  const {
    code,
    setCode,
    currentFile,
    setCurrentFile,
    openFiles,
    setOpenFiles,
    dirtyFiles,
    setDirtyFiles,
  } = useEditor();

  const openFile = useCallback(
    (file, options = {}) => {
      if (!file || file.type !== "file") return;

      setCurrentFile(file);
      setLanguage(file.language || language);
      setCode(file.content || "");
      setOpenFiles((currentFiles) => {
        const exists = currentFiles.some(
          (openFile) => openFile._id === file._id
        );

        if (exists) return currentFiles;

        return [...currentFiles, file];
      });
      setSaveStatus("Saved");

      if (!options.remote && pairState.enabled) {
        socket.emit("pair:file-opened", {
          roomCode,
          file,
          openFiles: [
            ...openFiles.filter((openFile) => openFile._id !== file._id),
            file,
          ],
        });
      }
    },
    [
      language,
      openFiles,
      pairState.enabled,
      roomCode,
      setCode,
      setCurrentFile,
      setLanguage,
      setOpenFiles,
    ]
  );

  const closeFile = useCallback(
    (fileId) => {
      setOpenFiles((currentFiles) =>
        currentFiles.filter((file) => file._id !== fileId)
      );
      setDirtyFiles((currentDirtyFiles) => {
        const updatedDirtyFiles = { ...currentDirtyFiles };
        delete updatedDirtyFiles[fileId];
        return updatedDirtyFiles;
      });

      if (currentFile?._id === fileId) {
        const nextFile = openFiles.find((file) => file._id !== fileId);
        if (nextFile) {
          openFile(nextFile);
        } else {
          setCurrentFile(null);
          setCode("");
        }
      }
    },
    [
      currentFile?._id,
      openFile,
      openFiles,
      setCode,
      setCurrentFile,
      setDirtyFiles,
      setOpenFiles,
    ]
  );

  useEffect(() => {
    if (!currentFile?._id) return undefined;

    if ((currentFile.content || "") === code && currentFile.language === language) {
      return undefined;
    }

    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;

    queueMicrotask(() => {
      setSaveStatus("Saving...");
      setDirtyFiles((currentDirtyFiles) => ({
        ...currentDirtyFiles,
        [currentFile._id]: true,
      }));
    });

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await updateFileContent(currentFile._id, {
          content: code,
          language,
        });

        if (saveRequestIdRef.current !== requestId) {
          return;
        }

        setSaveStatus("Saved");
        setDirtyFiles((currentDirtyFiles) => ({
          ...currentDirtyFiles,
          [currentFile._id]: false,
        }));
        setOpenFiles((currentFiles) =>
          currentFiles.map((file) =>
            file._id === currentFile._id ? data.file : file
          )
        );
        setCurrentFile(data.file);
      } catch (error) {
        if (saveRequestIdRef.current !== requestId) {
          return;
        }

        console.error(error);
        setSaveStatus("Save failed");
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [
    code,
    currentFile?.content,
    currentFile?.language,
    currentFile?._id,
    language,
    setCurrentFile,
    setDirtyFiles,
    setOpenFiles,
  ]);

  return {
    currentFile,
    openFiles,
    dirtyFiles,
    saveStatus,
    setOpenFiles,
    openFile,
    closeFile,
  };
}
