import { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export function ChatProvider({ children }) {

  const [messages, setMessages] = useState([]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => useContext(ChatContext);
