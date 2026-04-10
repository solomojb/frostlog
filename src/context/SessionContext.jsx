import { createContext, useContext, useEffect, useState } from "react";
import { localISOString } from "../utils/dateUtils";
import { useCompany } from "./CompanyContext";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const { company } = useCompany();

  const [activeSession, setActiveSession] = useState(() => {
    const stored = storage.getItem(KEYS.activeSession);
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (activeSession) {
      storage.setItem(KEYS.activeSession, JSON.stringify(activeSession));
    } else {
      storage.removeItem(KEYS.activeSession);
    }
  }, [activeSession]);

  function endSession(unlockedScenarioNumbers) {
    if (!activeSession) return;

    // Snapshot enrichi : pseudo + perso actif + icône au moment de la fin de session
    // Permet de retrouver quel perso chaque joueur jouait lors de cette session
    const memberSnapshot = {};
    for (const m of (company?.members ?? [])) {
      memberSnapshot[m.id] = {
        pseudo:          m.pseudo,
        activeCharacter: m.activeCharacter ?? null,
        charIcon:        m.charIcon ?? null,
      };
    }

    const finishedSession = {
      ...activeSession,
      endingDatetime: localISOString(),
      unlockedScenarios: unlockedScenarioNumbers ?? [],
      memberSnapshot,
      // Nettoyage : on ne garde pas playerNames, les noms sont résolus via memberIds + snapshot
      scenarios: (activeSession.scenarios ?? []).map(({ playerNames, ...sc }) => sc),
    };

    const stored = storage.getItem(KEYS.pastSessions);
    const past = stored ? JSON.parse(stored) : [];
    storage.setItem(KEYS.pastSessions, JSON.stringify([...past, finishedSession]));
    storage.removeItem(KEYS.scenarioStatsSetup);

    setActiveSession(null);
  }

  return (
    <SessionContext.Provider value={{ activeSession, setActiveSession, endSession }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  return useContext(SessionContext);
};