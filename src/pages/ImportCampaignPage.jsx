import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { useCompany } from "../context/CompanyContext";
import { IcoCheck, IcoX, IcoArrow, IcoPlus } from "../components/ui/Icons";
import NumberInput from "../components/ui/NumberInput";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";
import { useT } from "../context/LanguageContext";

function ImportCampaignPage() {
    const navigate = useNavigate();
    const { scenarios, addScenariosBulk, markCampaignStarted } = useProgress();
    const { company, setCompanyName, addMember } = useCompany();
    const t = useT();
    const existingNumbers = new Set(scenarios.map(s => s.number));
    const today = new Date().toISOString().slice(0, 10);

    const [companyName, setCompanyNameLocal] = useState(company?.name ?? "");
    const [companyMembers, setCompanyMembers] = useState(() => {
        const base = company?.members?.length >= 2 ? company.members.map(m => m.pseudo) : [];
        while (base.length < 4) base.push("");
        return base;
    });
    const [memberCount, setMemberCount] = useState(
        company?.members?.length >= 2 ? company.members.length : 3
    );
    const [campaignStart, setCampaignStart] = useState("");
    const [sessionCount, setSessionCount] = useState("");
    const [avgDurationH, setAvgDurationH] = useState("");
    const [winRate, setWinRate] = useState("");
    const [finishedNums, setFinishedNums] = useState([{ id: crypto.randomUUID(), number: "" }]);
    const [unlockedNums, setUnlockedNums] = useState([{ id: crypto.randomUUID(), number: "" }]);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const [autoFocusFinished, setAutoFocusFinished] = useState(false);
    const [autoFocusUnlocked, setAutoFocusUnlocked] = useState(false);

    function addRow(setter) { setter(prev => [...prev, { id: crypto.randomUUID(), number: "" }]); }
    function removeRow(setter, id) { setter(prev => prev.filter(r => r.id !== id)); }
    function updateRow(setter, id, value) { setter(prev => prev.map(r => r.id === id ? { ...r, number: value } : r)); }

    function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        if (!campaignStart) { setError(t("import_date_required")); return; }

        const finishedValid = finishedNums.filter(r => r.number !== "");
        const unlockedValid = unlockedNums.filter(r => r.number !== "");
        const allNums = [...finishedValid, ...unlockedValid].map(r => Number(r.number));
        const unique = new Set(allNums);
        if (unique.size !== allNums.length) { setError(t("import_duplicate")); return; }
        for (const n of allNums) {
            if (existingNumbers.has(n) && n !== 0 && n !== 1) {
                setError(t("import_already_exists", { n })); return;
            }
        }

        const avgMs = Number(avgDurationH || 0) * 3600000;
        const wr = winRate !== "" ? Math.min(100, Math.max(0, Number(winRate))) : null;

        storage.setItem(KEYS.campaignImport, JSON.stringify({
            campaignStart: new Date(campaignStart).toISOString(),
            sessionCount: Number(sessionCount) || 0,
            avgDurationMs: avgMs || null,
            winRate: wr,
            importedAt: new Date().toISOString(),
        }));

        // Sauvegarder/mettre à jour la compagnie
        const filledMembers = companyMembers.slice(0, memberCount).map(p => p.trim()).filter(Boolean);
        if (companyName.trim()) setCompanyName(companyName.trim());
        // Ajouter les membres qui n'existent pas encore
        const existingPseudos = new Set((company?.members ?? []).map(m => m.pseudo.toLowerCase()));
        filledMembers.forEach(p => {
            if (!existingPseudos.has(p.toLowerCase())) addMember(p);
        });

        const startIso = new Date(campaignStart).toISOString();

        addScenariosBulk([
            ...finishedValid.map(r => ({ number: Number(r.number), note: "", unlockedAt: startIso, finished: true })),
            ...unlockedValid.map(r => ({ number: Number(r.number), note: "", unlockedAt: startIso, finished: false })),
        ]);

        markCampaignStarted();
        setDone(true);
    }

    if (done) {
        return (
            <div className="h-screen flex items-center justify-center px-4">
                <div className="frost-block p-10 text-center flex flex-col gap-6 items-center" style={{ maxWidth: 400 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(74,122,155,0.15)", border: "1px solid var(--c-ice-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-ice)" }}>
                        <IcoCheck />
                    </div>
                    <div>
                        <h2 className="title-rune mb-2" style={{ fontSize: "1.1rem" }}>{t("import_success")}</h2>
                        <p className="text-sm" style={{ color: "var(--c-muted)" }}>
                            {t("newcamp_char_hint")}
                        </p>
                    </div>
                    <button onClick={() => navigate("/")} className="btn-frost btn-primary px-8"><IcoArrow /> {t("btn_access_campaign")}</button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-y-auto scrollbar-hide">
            <form onSubmit={handleSubmit}>
                <div className="max-w-2xl mx-auto flex flex-col gap-5 py-6 px-4">

                    <div className="frost-block p-7">
                        <h2 className="title-rune mb-1" style={{ fontSize: "1.25rem" }}>{t("import_title")}</h2>
                        <p className="text-sm mb-6" style={{ color: "var(--c-muted)" }}>
                            {t("import_hint")}
                        </p>

                    {/* Compagnie */}
                    <div className="flex flex-col gap-2 mb-5">
                        <span className="sect-label" style={{ marginBottom: 2 }}>{t("import_company_name")}</span>
                        <input
                            value={companyName}
                            onChange={e => setCompanyNameLocal(e.target.value)}
                            className="input-frost"
                            placeholder={t("import_company_ph")}
                                                    />
                    </div>

                    <div className="flex flex-col gap-2 mb-5">
                        <div className="flex items-center justify-between mb-1">
                            <span className="sect-label" style={{ marginBottom: 0 }}>{t("import_members")}</span>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => setMemberCount(c => Math.max(2, c - 1))}
                                    className="w-6 h-6 rounded-full text-sm flex items-center justify-center"
                                    style={{ background: "none", border: "1px solid var(--c-border)", color: "var(--c-muted)", cursor: "pointer" }}>−</button>
                                <span style={{ color: "var(--c-ice)", fontFamily: "'Cinzel', serif", fontSize: "0.9rem" }}>{memberCount}</span>
                                <button type="button" onClick={() => setMemberCount(c => Math.min(4, c + 1))}
                                    className="w-6 h-6 rounded-full text-sm flex items-center justify-center"
                                    style={{ background: "none", border: "1px solid var(--c-border)", color: "var(--c-muted)", cursor: "pointer" }}>+</button>
                            </div>
                        </div>
                        {companyMembers.slice(0, memberCount).map((pseudo, i) => (
                            <input key={i} value={pseudo}
                                onChange={e => { const arr = [...companyMembers]; arr[i] = e.target.value; setCompanyMembers(arr); }}
                                className="input-frost" placeholder={t("lbl_player", { n: i + 1 })}  />
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 mb-5">
                            <span className="sect-label" style={{ marginBottom: 4 }}>{t("import_start_date")}</span>
                            <input type="date" value={campaignStart} onChange={e => setCampaignStart(e.target.value)}
                                max={today} className="input-frost" style={{ maxWidth: 220 }} />
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <div className="flex flex-col gap-2">
                                <span className="sect-label" style={{ marginBottom: 4 }}>{t("import_session_count")}</span>
                                <NumberInput value={sessionCount} onChange={setSessionCount} min={0} placeholder={t("import_session_ph")} style={{ width: 90 }} />
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="sect-label" style={{ marginBottom: 4 }}>{t("import_avg_duration")}</span>
                                <div className="flex items-center gap-2">
                                    <NumberInput value={avgDurationH} onChange={setAvgDurationH} min={0} max={24} placeholder={t("import_duration_ph")} style={{ width: 90 }} />
                                    <span style={{ color: "var(--c-muted)", fontSize: "0.85rem" }}>{t("import_hours")}</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <span className="sect-label" style={{ marginBottom: 4 }}>{t("import_win_rate")}</span>
                                <div className="flex items-center gap-2">
                                    <NumberInput value={winRate} onChange={setWinRate} min={0} max={100} placeholder={t("import_win_ph")} style={{ width: 90 }} />
                                    <span style={{ color: "var(--c-muted)", fontSize: "0.85rem" }}>{t("import_percent")}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="frost-block p-7">
                        <span className="sect-label">{t("import_finished")}</span>
                        <p className="text-xs mb-4" style={{ color: "var(--c-muted)" }}>{t("import_finished_hint")}</p>
                        <div className="flex flex-col gap-2">
                            {finishedNums.map((r, i) => (
                                <div key={r.id} className="flex items-center gap-3">
                                    <NumberInput value={r.number} onChange={v => updateRow(setFinishedNums, r.id, v)} min={0} placeholder={t("import_scenario_num_ph")} style={{ maxWidth: 150 }}
                                        autoFocus={autoFocusFinished && i === finishedNums.length - 1}
                                        onFocus={() => setAutoFocusFinished(false)}
                                        onKeyDown={e => { if (e.key === "Tab" && !e.shiftKey && i === finishedNums.length - 1) { e.preventDefault(); addRow(setFinishedNums); setAutoFocusFinished(true); } }} />
                                    <button type="button" tabIndex={-1} onClick={() => removeRow(setFinishedNums, r.id)} className="btn-ghost-sm"><IcoX /></button>
                                </div>
                            ))}
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => addRow(setFinishedNums)}
                                    className="flex items-center justify-center py-1.5 transition-colors"
                                    style={{ background: "none", border: "1px dashed var(--c-border)", borderRadius: 8, color: "var(--c-muted)", cursor: "pointer", width: 150 }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-ice-dim)"; e.currentTarget.style.color = "var(--c-ice-dim)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-border)"; e.currentTarget.style.color = "var(--c-muted)"; }}>
                                    <IcoPlus />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="frost-block p-7">
                        <span className="sect-label">{t("import_unlocked")}</span>
                        <p className="text-xs mb-4" style={{ color: "var(--c-muted)" }}>{t("import_unlocked_hint")}</p>
                        <div className="flex flex-col gap-2">
                            {unlockedNums.map((r, i) => (
                                <div key={r.id} className="flex items-center gap-3">
                                    <NumberInput value={r.number} onChange={v => updateRow(setUnlockedNums, r.id, v)} min={0} placeholder={t("import_scenario_num_ph")} style={{ maxWidth: 150 }}
                                        autoFocus={autoFocusUnlocked && i === unlockedNums.length - 1}
                                        onFocus={() => setAutoFocusUnlocked(false)}
                                        onKeyDown={e => { if (e.key === "Tab" && !e.shiftKey && i === unlockedNums.length - 1) { e.preventDefault(); addRow(setUnlockedNums); setAutoFocusUnlocked(true); } }} />
                                    <button type="button" tabIndex={-1} onClick={() => removeRow(setUnlockedNums, r.id)} className="btn-ghost-sm"><IcoX /></button>
                                </div>
                            ))}
                            <div className="flex items-center gap-3">
                                <button type="button" onClick={() => addRow(setUnlockedNums)}
                                    className="flex items-center justify-center py-1.5 transition-colors"
                                    style={{ background: "none", border: "1px dashed var(--c-border)", borderRadius: 8, color: "var(--c-muted)", cursor: "pointer", width: 150 }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-ice-dim)"; e.currentTarget.style.color = "var(--c-ice-dim)"; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-border)"; e.currentTarget.style.color = "var(--c-muted)"; }}>
                                    <IcoPlus />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="frost-block p-5">
                        {error && <div className="error-frost mb-4">{error}</div>}
                        <div className="flex justify-between">
                            <button type="button" onClick={() => navigate("/entry")} className="btn-frost btn-cancel"><IcoX /> {t("btn_cancel")}</button>
                            <button type="submit" className="btn-frost btn-primary"><IcoCheck /> {t("import_btn")}</button>
                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}

export default ImportCampaignPage;
