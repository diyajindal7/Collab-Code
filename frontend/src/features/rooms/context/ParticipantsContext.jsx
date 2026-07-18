import { createContext, useContext, useState } from "react";

const ParticipantsContext = createContext();

export function ParticipantsProvider({ children }) {
  const [participants, setParticipants] = useState([]);

  return (
    <ParticipantsContext.Provider
      value={{
        participants,
        setParticipants,
      }}
    >
      {children}
    </ParticipantsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useParticipants = () => useContext(ParticipantsContext);
