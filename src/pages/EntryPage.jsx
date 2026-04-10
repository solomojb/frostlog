import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useProgress } from "../context/ProgressContext";
import { useCompany } from "../context/CompanyContext";
import { exportData, applyImportedData } from "../utils/campaignExport";
import { useSession } from "../context/SessionContext";
import { IcoPlusCircle as IcoPlus, IcoPlay, IcoDownload, IcoUpload, IcoTrash, IcoCheck, IcoX, IcoArrow } from "../components/ui/Icons";
import { useToast } from "../context/ToastContext";
import { useLanguage, useT } from "../context/LanguageContext";

const isTauri = typeof window !== "undefined" && !!window.__TAURI_INTERNALS__;

// ── Contrôles sous le card ───────────────────────────────────────────────────
function EntryControls() {
    const { lang, setLanguage } = useLanguage();
    const t = useT();

    async function handleClose() {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        await getCurrentWindow().close();
    }

    const btn = {
        background: "transparent",
        border: "1px solid var(--c-border)",
        borderRadius: 5,
        color: "var(--c-muted)",
        cursor: "pointer",
        fontSize: "0.68rem",
        fontFamily: "'Cinzel', serif",
        letterSpacing: "0.06em",
        padding: "2px 8px",
        lineHeight: 1.6,
    };

    return (
        <div style={{ position: "absolute", top: 12, left: 16, right: 16, display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
            <button style={{ ...btn, pointerEvents: "auto" }} onClick={() => setLanguage(lang === "fr" ? "en" : "fr")}>
                {lang === "fr" ? "EN" : "FR"}
            </button>
            {isTauri && (
                <button style={{ ...btn, pointerEvents: "auto" }} onClick={handleClose}>
                    {t("wc_close")}
                </button>
            )}
        </div>
    );
}

// ── Layout commun ────────────────────────────────────────────────────────────
function Wrapper({ children }) {
    return (
        <div className="scrollbar-hide" style={{ position: "fixed", inset: 0, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ margin: "auto", padding: "2rem 1rem", width: "100%", maxWidth: 480 }}>
                {children}
            </div>
        </div>
    );
}

function Header() {
    const t = useT();
    return (
        <div className="text-center pb-2">
            <h1 className="title-rune" style={{ fontSize: "1.6rem", letterSpacing: "0.3em", marginRight: "-0.3em" }}>{t("app_title")}</h1>
            <p className="text-xs mt-1" style={{ color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif", letterSpacing: "0.15em" }}>
                {t("app_subtitle")}
            </p>
        </div>
    );
}

// ── Composant principal ──────────────────────────────────────────────────────
function EntryPage() {
    const navigate = useNavigate();
    const { campaignStarted, resetCampaign } = useProgress();
    const { resetCompany } = useCompany();
    const { setActiveSession } = useSession();
    const showToast = useToast();
    const t = useT();

    const [view, setView] = useState("home");
    const [importError, setImportError] = useState(null);
    const fileInputRef = useRef(null);

    function handleDelete() {
        setActiveSession(null);
        resetCampaign();
        resetCompany();
        setView("home");
        showToast(t("entry_deleted"), "warning");
    }

    function handleFileImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                if (!data.version || !data.progress) {
                    setImportError(t("entry_invalid_file"));
                    return;
                }
                applyImportedData(data);
            } catch {
                setImportError(t("entry_invalid_json"));
            }
        };
        reader.readAsText(file);
    }

    function renderContent() {
        if (view === "confirm-delete") return (
            <div className="frost-block p-8 w-full flex flex-col gap-6 items-center text-center" style={{ position: "relative" }}>
                <EntryControls />
                <Header />
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(127,29,29,0.3)", border: "1px solid #991b1b", display: "flex", alignItems: "center", justifyContent: "center", color: "#e57373" }}>
                    <IcoTrash />
                </div>
                <div>
                    <h2 className="title-rune mb-2" style={{ fontSize: "1rem" }}>{t("entry_delete_title")}</h2>
                    <p className="text-sm" style={{ color: "var(--c-muted)" }}>{t("entry_delete_warning")}</p>
                </div>
                <div className="flex gap-3 w-full">
                    <button onClick={() => setView("home")} className="btn-frost btn-cancel flex-1 justify-center"><IcoX /> {t("btn_cancel")}</button>
                    <button onClick={handleDelete} className="btn-frost btn-danger flex-1 justify-center"><IcoTrash /> {t("btn_delete")}</button>
                </div>
            </div>
        );

        if (campaignStarted) return (
            <div className="frost-block p-8 w-full flex flex-col gap-5" style={{ position: "relative" }}>
                <EntryControls />
                <Header />
                <button onClick={() => navigate("/")}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
                    style={{ background: "rgba(168,216,234,0.06)", border: "1px solid var(--c-ice-dim)", cursor: "pointer", color: "var(--c-ice-light)" }}>
                    <div className="flex items-center gap-3">
                        <IcoPlay />
                        <div className="text-left">
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem", letterSpacing: "0.08em" }}>{t("entry_resume")}</div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--c-muted)" }}>{t("entry_resume_desc")}</div>
                        </div>
                    </div>
                    <IcoArrow />
                </button>
                <div className="divider-frost" />
                <div className="flex flex-col gap-3">
                    <button onClick={exportData} className="btn-frost btn-save w-full justify-center gap-3">
                        <IcoDownload /> {t("entry_export")}
                    </button>
                    <button onClick={() => setView("confirm-delete")} className="btn-frost btn-danger w-full justify-center gap-3">
                        <IcoTrash /> {t("entry_delete_campaign")}
                    </button>
                </div>
            </div>
        );

        if (view === "existing") return (
            <div className="frost-block p-8 w-full flex flex-col gap-5" style={{ position: "relative" }}>
                <EntryControls />
                <Header />
                <div>
                    <h2 className="title-rune mb-1" style={{ fontSize: "1rem" }}>{t("entry_resume_campaign")}</h2>
                    <p className="text-xs" style={{ color: "var(--c-muted)" }}>{t("entry_choose_method")}</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => navigate("/import-campaign")}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
                        style={{ background: "rgba(168,216,234,0.06)", border: "1px solid var(--c-ice-dim)", cursor: "pointer", color: "var(--c-ice-light)" }}>
                        <div className="flex items-center gap-3">
                            <IcoCheck />
                            <div className="text-left">
                                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem", letterSpacing: "0.08em" }}>{t("entry_manual")}</div>
                                <div className="text-xs mt-0.5" style={{ color: "var(--c-muted)" }}>{t("entry_manual_desc")}</div>
                            </div>
                        </div>
                        <IcoArrow />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
                        style={{ background: "rgba(168,216,234,0.02)", border: "1px solid var(--c-border)", cursor: "pointer", color: "var(--c-text)" }}>
                        <div className="flex items-center gap-3">
                            <IcoUpload />
                            <div className="text-left">
                                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem", letterSpacing: "0.08em" }}>{t("entry_import_json")}</div>
                                <div className="text-xs mt-0.5" style={{ color: "var(--c-muted)" }}>{t("entry_import_json_desc")}</div>
                            </div>
                        </div>
                        <IcoArrow />
                    </button>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" />
                </div>
                {importError && <div className="error-frost">{importError}</div>}
                <button onClick={() => { setView("home"); setImportError(null); }}
                    className="btn-cancel self-start text-xs transition-colors underline">
                    {t("btn_back")}
                </button>
            </div>
        );

        // home (default)
        return (
            <div className="frost-block p-8 w-full flex flex-col gap-4" style={{ position: "relative" }}>
                <EntryControls />
                <Header />
                <button onClick={() => navigate("/new-campaign")}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
                    style={{ background: "rgba(168,216,234,0.06)", border: "1px solid var(--c-ice-dim)", cursor: "pointer", color: "var(--c-ice-light)" }}>
                    <div className="flex items-center gap-3">
                        <IcoPlus />
                        <div className="text-left">
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem", letterSpacing: "0.08em" }}>{t("entry_new_campaign")}</div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--c-muted)" }}>{t("entry_new_campaign_desc")}</div>
                        </div>
                    </div>
                    <IcoArrow />
                </button>
                <div className="divider-frost" />
                <button onClick={() => setView("existing")}
                    className="w-full flex items-center justify-between px-5 py-4 rounded-xl transition-all"
                    style={{ background: "rgba(168,216,234,0.02)", border: "1px solid var(--c-border)", cursor: "pointer", color: "var(--c-text)" }}>
                    <div className="flex items-center gap-3">
                        <IcoUpload />
                        <div className="text-left">
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem", letterSpacing: "0.08em" }}>{t("entry_existing")}</div>
                            <div className="text-xs mt-0.5" style={{ color: "var(--c-muted)" }}>{t("entry_existing_desc")}</div>
                        </div>
                    </div>
                    <IcoArrow />
                </button>
            </div>
        );
    }

    return (
        <Wrapper>{renderContent()}</Wrapper>
    );
}

export default EntryPage;
