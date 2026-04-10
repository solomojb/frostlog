import { KEYS } from "./storageKeys";
import storage from "./storage";

export function exportData() {
    const data = {
        version: 2,
        exportedAt: new Date().toISOString(),
        company:       JSON.parse(storage.getItem(KEYS.company)        ?? "null"),
        progress:      JSON.parse(storage.getItem(KEYS.progress)       ?? "[]"),
        pastSessions:  JSON.parse(storage.getItem(KEYS.pastSessions)   ?? "[]"),
        campaignImport:JSON.parse(storage.getItem(KEYS.campaignImport) ?? "null"),
        campaignNotes: storage.getItem(KEYS.campaignNotes) ?? "",
        campaignStarted: storage.getItem(KEYS.campaignStarted) ?? "false",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `frostlog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function applyImportedData(data) {
    if (data.company)       storage.setItem(KEYS.company,       JSON.stringify(data.company));
    if (data.progress)      storage.setItem(KEYS.progress,      JSON.stringify(data.progress));
    if (data.pastSessions)  storage.setItem(KEYS.pastSessions,  JSON.stringify(data.pastSessions));
    if (data.campaignImport)storage.setItem(KEYS.campaignImport,JSON.stringify(data.campaignImport));
    if (data.campaignNotes !== undefined) storage.setItem(KEYS.campaignNotes, data.campaignNotes);
    storage.setItem(KEYS.campaignStarted, "true");
    storage.removeItem(KEYS.activeSession);
    storage.removeItem(KEYS.scenarioStatsSetup);
    storage.setItem(KEYS.pendingToast, JSON.stringify({ key: "import_success", type: "success" }));
    window.location.href = "/";
}
