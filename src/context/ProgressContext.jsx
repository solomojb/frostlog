import { createContext, useContext, useEffect, useState } from "react";
import { localISOString } from "../utils/dateUtils";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";

const ProgressContext = createContext();

function createBaseScenarios() {
    const now = localISOString();
    return [
        { id: crypto.randomUUID(), number: 0, finishedAt: null, note: "", unlockedAt: now, priority: false },
        { id: crypto.randomUUID(), number: 1, finishedAt: null, note: "", unlockedAt: now, priority: false },
    ];
}

export const ProgressProvider = ({ children }) => {
    const [campaignStarted, setCampaignStarted] = useState(() =>
        storage.getItem(KEYS.campaignStarted) === "true"
    );

    const [scenarios, setScenarios] = useState(() => {
        const stored = storage.getItem(KEYS.progress);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) return parsed;
        }
        return createBaseScenarios();
    });

    useEffect(() => { storage.setItem(KEYS.progress, JSON.stringify(scenarios)); }, [scenarios]);
    useEffect(() => { storage.setItem(KEYS.campaignStarted, String(campaignStarted)); }, [campaignStarted]);

    // ── Campagne ──────────────────────────────────────────────────────────────
    function startNewCampaign() {
        setScenarios(createBaseScenarios());
        setCampaignStarted(true);
        const existing = JSON.parse(storage.getItem(KEYS.campaignImport) ?? "{}");
        storage.setItem(KEYS.campaignImport, JSON.stringify({ ...existing, campaignStart: new Date().toISOString() }));
    }

    function markCampaignStarted() {
        setCampaignStarted(true);
    }

    // ── Scénarios ─────────────────────────────────────────────────────────────
    function addScenario(number, note, unlockedAt, unlockedBy = null) {
        if (!Number.isInteger(number) || number < 0) throw new Error("Le numéro du scénario doit être un entier positif");
        if (scenarios.some(s => s.number === number)) throw new Error("Scénario déjà débloqué");
        setScenarios(prev => [...prev, {
            id: crypto.randomUUID(), number, note,
            unlockedAt: unlockedAt ?? localISOString(),
            finishedAt: null, priority: false,
            unlockedBy: unlockedBy ?? null,
        }]);
    }

    function addScenariosBulk(items) {
        const now = new Date().toISOString();
        setScenarios(prev => {
            const existingNums = new Set(prev.map(s => s.number));
            const toAdd = items
                .filter(item => Number.isInteger(item.number) && item.number >= 0 && !existingNums.has(item.number))
                .map(item => ({
                    id: crypto.randomUUID(), number: item.number,
                    note: item.note ?? "", unlockedAt: item.unlockedAt ?? localISOString(),
                    finishedAt: item.finished ? now : null, priority: false,
                    unlockedBy: item.unlockedBy ?? null,
                }));
            const finishedNums = new Set(items.filter(i => i.finished).map(i => i.number));
            const updated = prev.map(s =>
                finishedNums.has(s.number) && s.finishedAt === null ? { ...s, finishedAt: now } : s
            );
            return [...updated, ...toAdd];
        });
    }

    function updateScenario(id, data) {
        setScenarios(prev => prev.map(s =>
            s.id === id ? { ...s, unlockedAt: data.unlockedAt, finishedAt: data.finishedAt, note: data.note, unlockedBy: data.unlockedBy ?? null } : s
        ));
    }

    function deleteScenario(id) {
        setScenarios(prev => {
            const updated = prev.filter(s => s.id !== id);
            return updated.length === 0 ? createBaseScenarios() : updated;
        });
    }

    function markAsFinished(id) {
        if (!scenarios.some(s => s.id === id)) throw new Error("Scénario introuvable");
        setScenarios(prev => prev.map(s =>
            s.id === id && s.finishedAt === null ? { ...s, finishedAt: new Date().toISOString(), priority: false } : s
        ));
    }

    function unmarkAsFinished(id) {
        if (!scenarios.some(s => s.id === id)) throw new Error("Scénario introuvable");
        setScenarios(prev => prev.map(s => s.id === id ? { ...s, finishedAt: null } : s));
    }

    function togglePriority(id) {
        setScenarios(prev => prev.map(s => s.id === id ? { ...s, priority: !s.priority } : s));
    }

    function blockScenario(id) {
        const sc = scenarios.find(s => s.id === id);
        if (!sc) throw new Error("Scénario introuvable");
        if (sc.unlockedAt && new Date() < new Date(sc.unlockedAt)) throw new Error("La date de blocage ne peut pas être avant la date de débloquage.");
        setScenarios(prev => prev.map(s =>
            s.id === id ? { ...s, blockedAt: new Date().toISOString(), finishedAt: null, priority: false } : s
        ));
    }

    function unblockScenario(id) {
        if (!scenarios.some(s => s.id === id)) throw new Error("Scénario introuvable");
        setScenarios(prev => prev.map(s => s.id === id ? { ...s, blockedAt: null } : s));
    }

    function resetCampaign() {
        storage.removeItem(KEYS.pastSessions);
        storage.removeItem(KEYS.activeSession);
        storage.removeItem(KEYS.campaignNotes);
        storage.removeItem(KEYS.campaignImport);
        storage.removeItem(KEYS.campaignImportFinished);
        storage.removeItem(KEYS.scenarioStatsSetup);
        storage.removeItem(KEYS.campaignStarted);
        setCampaignStarted(false);
        setScenarios(createBaseScenarios());
    }

    return (
        <ProgressContext.Provider value={{
            scenarios, campaignStarted,
            // campagne
            startNewCampaign, markCampaignStarted, resetCampaign,
            // scénarios
            addScenario, addScenariosBulk, updateScenario, deleteScenario,
            markAsFinished, unmarkAsFinished, togglePriority,
            blockScenario, unblockScenario,
        }}>
            {children}
        </ProgressContext.Provider>
    );
};

export const useProgress = () => useContext(ProgressContext);
