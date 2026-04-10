import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { useCompany } from "../context/CompanyContext";
import { IcoCheck, IcoX, IcoArrow } from "../components/ui/Icons";
import { useT } from "../context/LanguageContext";

function NewCampaignPage() {
    const navigate = useNavigate();
    const { startNewCampaign } = useProgress();
    const { setCompanyName, addMember } = useCompany();
    const t = useT();

    const [name, setName] = useState("");
    const [members, setMembers] = useState(["", "", "", ""]);
    const [count, setCount] = useState(3);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);

    function handleSubmit() {
        if (!name.trim()) { setError(t("newcamp_name_required")); return; }
        const filled = members.slice(0, count).map(p => p.trim());
        if (filled.some(p => !p)) { setError(t("newcamp_pseudos_required", { n: count })); return; }
        if (filled.length < 2) { setError(t("newcamp_min_members")); return; }
        const unique = new Set(filled.map(p => p.toLowerCase()));
        if (unique.size !== filled.length) { setError(t("newcamp_duplicate_pseudo")); return; }
        startNewCampaign();
        setCompanyName(name.trim());
        filled.forEach(p => addMember(p));
        setDone(true);
    }

    if (done) {
        return (
            <div className="h-screen flex items-center justify-center px-4">
                <div className="frost-block p-10 text-center flex flex-col gap-6 items-center" style={{ width: "100%", maxWidth: 480 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(74,122,155,0.15)", border: "1px solid var(--c-ice-dim)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--c-ice)" }}>
                        <IcoCheck />
                    </div>
                    <div>
                        <h2 className="title-rune mb-2" style={{ fontSize: "1.1rem" }}>{t("newcamp_created")}</h2>
                        <p className="text-sm" style={{ color: "var(--c-muted)" }}>
                            {t("newcamp_char_hint")}
                        </p>
                    </div>
                    <button onClick={() => navigate("/")} className="btn-frost btn-primary px-8"><IcoArrow /> {t("btn_access_campaign")}</button>
                </div>
            </div>
        );
    }

    const canSubmit = name.trim() && members.slice(0, count).every(p => p.trim());

    return (
        <div className="overflow-y-auto scrollbar-hide">
            <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
            <div className="frost-block p-8 flex flex-col gap-5" style={{ width: "100%", maxWidth: 480 }}>
                <div className="text-center pb-2">
                    <h1 className="title-rune" style={{ fontSize: "1.6rem", letterSpacing: "0.3em", marginRight: "-0.3em" }}>{t("app_title")}</h1>
                    <p className="text-xs mt-1" style={{ color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif", letterSpacing: "0.15em" }}>{t("app_subtitle")}</p>
                </div>

                <div>
                    <h2 className="title-rune mb-1" style={{ fontSize: "1rem" }}>{t("newcamp_title")}</h2>
                    <p className="text-xs" style={{ color: "var(--c-muted)" }}>{t("newcamp_hint")}</p>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="sect-label" style={{ marginBottom: 2 }}>{t("newcamp_company_name")}</span>
                    <input value={name} onChange={e => { setName(e.target.value); setError(null); }} className="input-frost" placeholder={t("newcamp_company_ph")}  />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="sect-label" style={{ marginBottom: 0 }}>{t("newcamp_members")}</span>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setCount(c => Math.max(2, c - 1))}
                                className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
                                style={{ background: "rgba(168,216,234,0.06)", border: "1px solid var(--c-border)", color: "var(--c-muted)", cursor: "pointer" }}>−</button>
                            <span className="text-xl font-bold w-6 text-center" style={{ color: "var(--c-ice)", fontFamily: "'Cinzel', serif" }}>{count}</span>
                            <button type="button" onClick={() => setCount(c => Math.min(4, c + 1))}
                                className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
                                style={{ background: "rgba(74,122,155,0.2)", border: "1px solid var(--c-ice-dim)", color: "var(--c-ice)", cursor: "pointer" }}>+</button>
                        </div>
                    </div>
                    {Array.from({ length: count }).map((_, i) => (
                        <input key={i} value={members[i] ?? ""}
                            onChange={e => { const a = [...members]; a[i] = e.target.value; setMembers(a); setError(null); }}
                            className="input-frost" placeholder={t("lbl_player", { n: i + 1 })}  />
                    ))}
                </div>

                {error && <div className="error-frost">{error}</div>}

                <div className="flex gap-3">
                    <button onClick={() => navigate("/entry")} className="btn-frost btn-cancel flex-1 justify-center">
                        <IcoX /> {t("btn_cancel")}
                    </button>
                    <button onClick={handleSubmit}
                        className={`btn-frost flex-1 justify-center ${canSubmit ? "btn-primary" : ""}`}
                        style={!canSubmit ? { borderColor: "var(--c-border)", color: "var(--c-dim)", cursor: "not-allowed" } : {}}>
                        <IcoCheck /> {t("btn_create")}
                    </button>
                </div>
            </div>
            </div>
        </div>
    );
}

export default NewCampaignPage;
