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

export const useParticipants = () => useContext(ParticipantsContext);