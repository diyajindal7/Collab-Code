import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import socket from "@/features/editor/socket";
import {
  createFile,
  createFolder,
  deleteFileItem,
  getFileTree,
  renameFileItem,
  updateFileContent,
} from "../services/fileService";

const RECENT_FILES_LIMIT = 6;

const languageByExtension = {
  c: "c",
  cpp: "cpp",
  css: "css",
  html: "html",
  java: "java",
  js: "javascript",
  json: "javascript",
  jsx: "javascript",
  md: "markdown",
  py: "python",
  ts: "typescript",
  tsx: "typescript",
};

const projectTemplates = {
  React: [
    {
      name: "package.json",
      content:
        '{\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  },\n  "dependencies": {\n    "@vitejs/plugin-react": "latest",\n    "vite": "latest",\n    "react": "latest",\n    "react-dom": "latest"\n  },\n  "devDependencies": {}\n}\n',
      language: "javascript",
    },
    {
      name: "src",
      type: "folder",
      children: [
        {
          name: "App.jsx",
          content:
            'export default function App() {\n  return <h1>CollabCode AI</h1>;\n}\n',
          language: "javascript",
        },
        {
          name: "main.jsx",
          content:
            'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App.jsx";\n\ncreateRoot(document.getElementById("root")).render(<App />);\n',
          language: "javascript",
        },
      ],
    },
  ],
  Node: [
    {
      name: "package.json",
      content:
        '{\n  "scripts": {\n    "start": "node server.js"\n  },\n  "dependencies": {\n    "express": "latest"\n  }\n}\n',
      language: "javascript",
    },
    {
      name: "server.js",
      content:
        'const express = require("express");\nconst app = express();\n\napp.get("/", (req, res) => res.json({ ok: true }));\napp.listen(3000, () => console.log("Server running on 3000"));\n',
      language: "javascript",
    },
  ],
  Python: [
    {
      name: "main.py",
      content: 'def main():\n    print("Hello from CollabCode AI")\n\nmain()\n',
      language: "python",
    },
    {
      name: "requirements.txt",
      content: "# Add Python dependencies here\n",
      language: "text",
    },
  ],
};

const getItemId = (item) => item._id || item.id;

const flattenItems = (items) =>
  items.flatMap((item) => [
    item,
    ...(item.children ? flattenItems(item.children) : []),
  ]);

const inferLanguage = (fileName) => {
  const extension = fileName.split(".").pop()?.toLowerCase();
  return languageByExtension[extension] || "text";
};

const serializeProject = (items) =>
  items.map((item) => {
    const serialized = {
      name: item.name,
      type: item.type,
    };

    if (item.type === "file") {
      serialized.language = item.language;
      serialized.content = item.content || "";
    }

    if (item.children?.length) {
      serialized.children = serializeProject(item.children);
    }

    return serialized;
  });

export default function FileExplorer({
  roomCode,
  selectedFile,
  onOpenFile,
  onTreeChange = () => {},
}) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [recentFiles, setRecentFiles] = useState([]);
  const uploadInputRef = useRef(null);

  const broadcastTreeChange = () => {
    socket.emit("pair:file-tree-changed", {
      roomCode,
    });
  };

  const flatItems = useMemo(() => flattenItems(files), [files]);
  const visibleItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return files;
    }

    return flatItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [files, flatItems, searchTerm]);

  useEffect(() => {
    if (!roomCode) return;

    const storedRecentFiles = localStorage.getItem(`recent-files:${roomCode}`);

    if (storedRecentFiles) {
      queueMicrotask(() => {
        setRecentFiles(JSON.parse(storedRecentFiles));
      });
    }
  }, [roomCode]);

  const loadFiles = useCallback(async () => {
    if (!roomCode) return;

    try {
      setLoading(true);
      const data = await getFileTree(roomCode);
      setFiles(data.files || []);
      onTreeChange(data.files || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [onTreeChange, roomCode]);

  useEffect(() => {
    queueMicrotask(() => {
      loadFiles();
    });
  }, [loadFiles]);

  useEffect(() => {
    const handleTreeChanged = () => {
      loadFiles();
    };

    socket.on("pair:file-tree-changed", handleTreeChanged);

    return () => {
      socket.off("pair:file-tree-changed", handleTreeChanged);
    };
  }, [loadFiles]);

  const rememberRecentFile = (file) => {
    if (!file || file.type !== "file") return;

    setRecentFiles((currentRecentFiles) => {
      const nextRecentFiles = [
        file,
        ...currentRecentFiles.filter(
          (recentFile) => getItemId(recentFile) !== getItemId(file)
        ),
      ].slice(0, RECENT_FILES_LIMIT);

      localStorage.setItem(
        `recent-files:${roomCode}`,
        JSON.stringify(nextRecentFiles)
      );

      return nextRecentFiles;
    });
  };

  const handleOpenFile = (file) => {
    rememberRecentFile(file);
    onOpenFile(file);
  };

  const findItem = (items, itemId) => {
    for (const item of items) {
      if (getItemId(item) === itemId) {
        return item;
      }

      if (item.children) {
        const foundItem = findItem(item.children, itemId);

        if (foundItem) {
          return foundItem;
        }
      }
    }

    return null;
  };

  const toggleFolder = (items, folderId) =>
    items.map((item) => {
      if (getItemId(item) === folderId) {
        return {
          ...item,
          expanded: !item.expanded,
        };
      }

      if (item.children) {
        return {
          ...item,
          children: toggleFolder(item.children, folderId),
        };
      }

      return item;
    });

  const handleToggleFolder = (folderId) => {
    setFiles((currentFiles) => toggleFolder(currentFiles, folderId));
  };

  const createTemplateItems = async (items, parent = null) => {
    for (const item of items) {
      if (item.type === "folder") {
        const data = await createFolder(roomCode, {
          name: item.name,
          parent,
        });

        await createTemplateItems(item.children || [], data.folder._id);
        continue;
      }

      const data = await createFile(roomCode, {
        name: item.name,
        parent,
        language: item.language || inferLanguage(item.name),
      });

      await updateFileContent(data.file._id, {
        content: item.content || "",
        language: item.language || inferLanguage(item.name),
      });
    }
  };

  const handleNewFile = async () => {
    const enteredName = prompt("Enter file name");

    if (!enteredName || !enteredName.trim()) {
      return;
    }

    const selectedItem = findItem(files, selectedFile);

    try {
      const data = await createFile(roomCode, {
        name: enteredName.trim(),
        parent: selectedItem?.type === "folder" ? selectedItem._id : null,
        language: inferLanguage(enteredName.trim()),
      });

      await loadFiles();
      broadcastTreeChange();
      handleOpenFile(data.file);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNewFolder = async () => {
    const enteredName = prompt("Enter folder name");

    if (!enteredName || !enteredName.trim()) {
      return;
    }

    const selectedItem = findItem(files, selectedFile);

    try {
      await createFolder(roomCode, {
        name: enteredName.trim(),
        parent: selectedItem?.type === "folder" ? selectedItem._id : null,
      });

      await loadFiles();
      broadcastTreeChange();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRename = async () => {
    const selectedItem = findItem(files, selectedFile);

    if (!selectedItem) {
      return;
    }

    const enteredName = prompt("Enter new name", selectedItem.name);

    if (
      !enteredName ||
      !enteredName.trim() ||
      enteredName.trim() === selectedItem.name
    ) {
      return;
    }

    try {
      await renameFileItem(selectedItem._id, enteredName.trim());
      await loadFiles();
      broadcastTreeChange();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async () => {
    const selectedItem = findItem(files, selectedFile);

    if (!selectedItem) {
      return;
    }

    const shouldDelete = window.confirm(`Delete "${selectedItem.name}"?`);

    if (!shouldDelete) {
      return;
    }

    try {
      await deleteFileItem(selectedItem._id);
      await loadFiles();
      broadcastTreeChange();
    } catch (error) {
      console.error(error);
    }
  };

  const handleTemplateSelect = async (event) => {
    const templateName = event.target.value;

    if (!templateName) {
      return;
    }

    try {
      await createTemplateItems(projectTemplates[templateName]);
      await loadFiles();
      broadcastTreeChange();
    } catch (error) {
      console.error(error);
    } finally {
      event.target.value = "";
    }
  };

  const uploadFiles = async (uploadedFiles) => {
    if (!uploadedFiles.length) {
      return;
    }

    const selectedItem = findItem(files, selectedFile);
    const parent = selectedItem?.type === "folder" ? selectedItem._id : null;

    try {
      for (const uploadedFile of uploadedFiles) {
        const content = await uploadedFile.text();
        const language = inferLanguage(uploadedFile.name);
        const data = await createFile(roomCode, {
          name: uploadedFile.name,
          parent,
          language,
        });

        await updateFileContent(data.file._id, {
          content,
          language,
        });
      }

      await loadFiles();
      broadcastTreeChange();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUploadFiles = async (event) => {
    try {
      await uploadFiles(Array.from(event.target.files || []));
    } finally {
      event.target.value = "";
    }
  };

  const handleDropUpload = async (event) => {
    event.preventDefault();
    setIsDraggingUpload(false);
    await uploadFiles(Array.from(event.dataTransfer.files || []));
  };

  const handleDownloadProject = () => {
    const projectBlob = new Blob(
      [JSON.stringify(serializeProject(files), null, 2)],
      {
        type: "application/json",
      }
    );
    const downloadUrl = URL.createObjectURL(projectBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = `${roomCode || "project"}-workspace.json`;
    downloadLink.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const renderFileTree = (items, depth = 0) =>
    items.map((item) => {
      const itemId = getItemId(item);
      const isFolder = item.type === "folder";
      const isSelected = selectedFile === itemId;

      return (
        <div key={itemId}>
          <button
            type="button"
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-all duration-200 ${
              isSelected
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
            style={{ paddingLeft: `${12 + depth * 16}px` }}
            onClick={() => {
              if (isFolder && !searchTerm) {
                handleToggleFolder(itemId);
                return;
              }

              if (!isFolder) {
                handleOpenFile(item);
              }
            }}
          >
            <span>
              {isFolder
                ? item.expanded
                  ? "\uD83D\uDCC2"
                  : "\uD83D\uDCC1"
                : "\uD83D\uDCC4"}
            </span>
            <span className="truncate">{item.name}</span>
          </button>

          {isFolder && !searchTerm && item.expanded && item.children && (
            <div>{renderFileTree(item.children, depth + 1)}</div>
          )}
        </div>
      );
    });

  return (
    <div
      className={`flex h-full flex-col border-r text-slate-100 transition-colors ${
        isDraggingUpload
          ? "border-blue-500 bg-blue-950/40"
          : "border-slate-700 bg-slate-950"
      }`}
      onDragLeave={() => setIsDraggingUpload(false)}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDraggingUpload(true);
      }}
      onDrop={handleDropUpload}
    >
      <div className="border-b border-slate-700 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
          Explorer
        </h2>
        <input
          className="mt-3 w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500"
          value={searchTerm}
          placeholder="Search files"
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {loading ? (
          <p className="px-3 py-2 text-sm text-slate-400">Loading files...</p>
        ) : visibleItems.length ? (
          renderFileTree(visibleItems)
        ) : (
          <p className="px-3 py-2 text-sm text-slate-400">
            {searchTerm ? "No matching files." : "No files yet."}
          </p>
        )}

        {!searchTerm && recentFiles.length > 0 && (
          <div className="mt-4 border-t border-slate-800 pt-3">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Recent
            </p>
            {recentFiles.map((file) => (
              <button
                key={getItemId(file)}
                type="button"
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-white"
                onClick={() => handleOpenFile(file)}
              >
                <span>{"\uD83D\uDCC4"}</span>
                <span className="truncate">{file.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-700 p-3">
        <input
          ref={uploadInputRef}
          className="hidden"
          multiple
          type="file"
          onChange={handleUploadFiles}
        />

        <select
          className="w-full rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white outline-none hover:bg-slate-700"
          defaultValue=""
          onChange={handleTemplateSelect}
        >
          <option value="" disabled>
            Project Template
          </option>
          {Object.keys(projectTemplates).map((templateName) => (
            <option key={templateName} value={templateName}>
              {templateName}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          onClick={handleNewFile}
        >
          + File
        </button>

        <button
          type="button"
          className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          onClick={handleNewFolder}
        >
          + Folder
        </button>

        <button
          type="button"
          className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          onClick={handleRename}
        >
          Rename
        </button>

        <button
          type="button"
          className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
          onClick={handleDelete}
        >
          Delete
        </button>

        <button
          type="button"
          className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          onClick={() => uploadInputRef.current?.click()}
        >
          Upload
        </button>

        <button
          type="button"
          className="flex-1 rounded bg-slate-800 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
          onClick={handleDownloadProject}
        >
          Download
        </button>
      </div>
    </div>
  );
}
