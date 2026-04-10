import { useState, useEffect, useRef } from "react";
import { NavPill } from "../components/layout/NavPill";
import { IcoHome } from "../components/ui/Icons";
import { IcoSave, IcoCheck } from "../components/ui/Icons";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";
import { useT } from "../context/LanguageContext";
const SAVE_DELAY = 600;

function NotesPage() {
  const t = useT();
  const [text, setText] = useState(() => storage.getItem(KEYS.campaignNotes) ?? "");
  const [saveStatus, setSaveStatus] = useState("saved");
  const timerRef = useRef(null);

  function save(value) {
    setSaveStatus("saving");
    storage.setItem(KEYS.campaignNotes, value);
    setSaveStatus("saved");
  }

  function handleChange(e) {
    const value = e.target.value;
    setText(value);
    setSaveStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => save(value), SAVE_DELAY);
  }

  function handleManualSave() {
    if (timerRef.current) clearTimeout(timerRef.current);
    save(text);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const statusLabel = {
    saved:   { text: t("notes_saved"),   color: "#4ade80" },
    pending: { text: t("notes_unsaved"), color: "#facc15" },
    saving:  { text: t("notes_saving"),  color: "var(--c-muted)" },
  }[saveStatus];

  return (
    <div className="h-screen flex items-stretch justify-between overflow-hidden">
      <div className="flex-shrink-0 flex items-center">
        <NavPill to="/" icon={<IcoHome />} label={t("nav_menu")} side="left" />
      </div>

      <div className="flex-1 overflow-hidden py-6 px-4 flex items-stretch">
        <div className="w-full max-w-2xl mx-auto frost-block p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="title-rune" style={{ fontSize: "1.25rem" }}>{t("notes_title")}</h2>
            <div className="flex items-center gap-4">
              {saveStatus === "saved" ? (
                <span className="text-sm flex items-center gap-1.5" style={{ color: "var(--c-muted)" }}>
                  <IcoCheck /> {statusLabel.text}
                </span>
              ) : (
                <button type="button" onClick={handleManualSave}
                  className="btn-frost btn-save" style={{ padding: "5px 12px", fontSize: "0.85rem" }}>
                  <IcoSave /> {t("btn_save")}
                </button>
              )}
            </div>
          </div>
          <textarea
            value={text}
            onChange={handleChange}
            placeholder={t("notes_placeholder")}
            className="textarea-frost flex-1 scrollbar-hide"
            style={{ flex: 1 }}
          />
        </div>
      </div>

      <div style={{ width: 58, flexShrink: 0 }} />
    </div>
  );
}
export default NotesPage;
