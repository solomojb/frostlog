import { useState, useRef, useEffect } from "react";
import { useProgress } from "../../context/ProgressContext";
import { useCompany } from "../../context/CompanyContext";
import { IcoCheck, IcoTrash } from "../ui/Icons";
import { useT } from "../../context/LanguageContext";

const SECTION_REASONS = ["Écoulement du temps", "Création / amélioration bâtiment", "Retraite personnage", "Enveloppe", "Autre"];
const KNOWN_REASONS = new Set(SECTION_REASONS);

function initUB(ub) {
  const empty = { type: "", value: "", context: "", playerName: "", description: "", sectionReason: "", sectionReasonOther: "", sectionReasonDetail: "" };
  if (!ub) return empty;
  if (typeof ub === "number") return { ...empty, type: "scenario", value: String(ub) };
  const sr = ub.sectionReason ?? "";
  return {
    type: ub.type ?? "",
    value: String(ub.value ?? ""),
    context: ub.sectionContext ?? "",
    playerName: ub.playerName ?? "",
    description: ub.description ?? "",
    sectionReason: KNOWN_REASONS.has(sr) ? sr : (sr ? "Autre" : ""),
    sectionReasonOther: KNOWN_REASONS.has(sr) || !sr ? "" : sr,
    sectionReasonDetail: ub.sectionReasonDetail ?? "",
  };
}

function ScenarioForm({ initialData = null, onSubmit, onDelete, submitLabel = null, sessionDate = null }) {
  const { scenarios } = useProgress();
  const { company } = useCompany();
  const t = useT();
  const isEditMode = !!initialData;
  const [number, setNumber] = useState(initialData?.number ?? "");
  const [note, setNote] = useState(initialData?.note ?? "");
  const [unlockedAt, setUnlockedAt] = useState(
    initialData?.unlockedAt?.slice(0, 10) ??
    (sessionDate ? new Date(sessionDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
  );
  const [finishedAt, setFinishedAt] = useState(initialData?.finishedAt?.slice(0, 10) ?? "");
  const initUBData = initUB(initialData?.unlockedBy);
  const [unlockedByType, setUnlockedByType] = useState(initUBData.type);
  const [unlockedByValue, setUnlockedByValue] = useState(initUBData.value);
  const [unlockedByContext, setUnlockedByContext] = useState(initUBData.context);
  const [unlockedByPlayerName, setUnlockedByPlayerName] = useState(initUBData.playerName);
  const [unlockedByDescription, setUnlockedByDescription] = useState(initUBData.description);
  const [unlockedBySectionReason, setUnlockedBySectionReason] = useState(initUBData.sectionReason);
  const [unlockedBySectionReasonOther, setUnlockedBySectionReasonOther] = useState(initUBData.sectionReasonOther);
  const [unlockedBySectionReasonDetail, setUnlockedBySectionReasonDetail] = useState(initUBData.sectionReasonDetail);
  const [error, setError] = useState(null);
  const isFinished = finishedAt !== "";
  const textareaRef = useRef(null);

  const REASON_LABELS = {
    "Écoulement du temps": t("form_reason_time"),
    "Création / amélioration bâtiment": t("form_reason_building"),
    "Retraite personnage": t("form_reason_retire"),
    "Enveloppe": t("form_reason_envelope"),
    "Autre": t("form_reason_other"),
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, []);

  const n = Number(number);
  const isDuplicate = !isEditMode && number !== "" && Number.isInteger(n) && scenarios.some(s => s.number === n);

  function handleUBTypeChange(newType) {
    setUnlockedByType(newType);
    setUnlockedByValue("");
    setUnlockedByContext("");
    setUnlockedByPlayerName("");
    setUnlockedByDescription("");
    setUnlockedBySectionReason("");
    setUnlockedBySectionReasonOther("");
    setUnlockedBySectionReasonDetail("");
  }

  function buildUnlockedBy() {
    if (unlockedByType === "") return null;
    if (unlockedByType === "scenario") return unlockedByValue !== "" ? { type: "scenario", value: Number(unlockedByValue) } : null;
    if (unlockedByValue === "") return null;
    if (unlockedByType === "quete") {
      const obj = { type: "quete", value: unlockedByValue };
      if (unlockedByPlayerName) obj.playerName = unlockedByPlayerName;
      return obj;
    }
    if (unlockedByType === "evenement") {
      const obj = { type: "evenement", value: unlockedByValue };
      if (unlockedByDescription) obj.description = unlockedByDescription;
      return obj;
    }
    if (unlockedByType === "section") {
      const obj = { type: "section", value: unlockedByValue };
      if (unlockedByContext) obj.sectionContext = unlockedByContext;
      const finalReason = unlockedBySectionReason === "Autre"
        ? (unlockedBySectionReasonOther.trim() || "Autre")
        : unlockedBySectionReason;
      if (finalReason) obj.sectionReason = finalReason;
      if (unlockedBySectionReasonDetail.trim()) obj.sectionReasonDetail = unlockedBySectionReasonDetail.trim();
      return obj;
    }
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (finishedAt && unlockedAt && new Date(finishedAt) < new Date(unlockedAt)) {
      setError(t("form_date_error")); return;
    }
    if (!isEditMode) {
      const n = Number(number);
      if (scenarios.some(s => s.number === n)) { setError(t("form_duplicate_error", { n })); return; }
    }
    try {
      onSubmit({
        number: Number(number), note,
        unlockedAt: unlockedAt ? new Date(unlockedAt).toISOString() : new Date().toISOString(),
        finishedAt: finishedAt ? new Date(finishedAt).toISOString() : null,
        unlockedBy: buildUnlockedBy(),
      });
      setError(null);
    } catch (err) { setError(err.message); }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto scrollbar-hide">
      <h2 className="title-rune" style={{ fontSize: "1.1rem" }}>
        {isEditMode ? t("lbl_scenario", { n: number }) : t("form_scen_add")}
      </h2>

      <div className="flex gap-4">
        {!isEditMode && (
          <div className="flex flex-col gap-1" style={{ width: 80 }}>
            <span className="sect-label" style={{ marginBottom: 2 }}>{t("form_scen_num")}</span>
            <input type="number" value={number} onChange={e => setNumber(e.target.value)}
              className="input-frost text-center" min={0} max={999} placeholder={t("form_scen_num")}
              onInput={e => { if (e.target.value.length > 3) e.target.value = e.target.value.slice(0, 3); }}
              style={isDuplicate ? { borderColor: "#991b1b" } : {}} />
            {isDuplicate && <span className="text-xs" style={{ color: "#fca5a5" }}>{t("form_scen_duplicate")}</span>}
          </div>
        )}
        {!sessionDate && (
          <div className="flex flex-col gap-1 flex-1">
            <span className="sect-label" style={{ marginBottom: 2 }}>{t("form_scen_unlocked_at")}</span>
            <input type="date" value={unlockedAt} onChange={e => setUnlockedAt(e.target.value)} className="input-frost" />
          </div>
        )}
      </div>

      {isEditMode && isFinished && (
        <div className="flex flex-col gap-1">
          <span className="sect-label" style={{ marginBottom: 2 }}>{t("form_scen_finished_at")}</span>
          <input type="date" value={finishedAt} onChange={e => setFinishedAt(e.target.value)} className="input-frost" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        <span className="sect-label" style={{ marginBottom: 2 }}>{t("form_scen_note")}</span>
        <textarea ref={textareaRef} value={note} onChange={e => { setNote(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }} className="textarea-frost" rows={2} placeholder={t("form_scen_note_ph")} style={{ resize: "none", overflow: "hidden" }} />
      </div>

      <div className="divider-frost" />

      <div className="flex flex-col gap-2">
        <span className="sect-label" style={{ marginBottom: 2 }}>{t("form_scen_unlocked_by")}</span>
        <select value={unlockedByType} onChange={e => handleUBTypeChange(e.target.value)} className="select-frost">
          <option value="">{t("form_source_none")}</option>
          <option value="scenario">{t("form_source_scenario")}</option>
          <option value="quete">{t("form_source_quest")}</option>
          <option value="evenement">{t("form_source_event")}</option>
          <option value="section">{t("form_source_section")}</option>
        </select>

        {unlockedByType === "scenario" && (
          <select value={unlockedByValue} onChange={e => setUnlockedByValue(e.target.value)} className="select-frost">
            <option value="">{t("form_choose_scenario")}</option>
            {[...scenarios]
              .filter(s => !isEditMode || s.number !== Number(number))
              .sort((a, b) => a.number - b.number)
              .map(s => (
                <option key={s.id} value={s.number}>
                  {t("lbl_scenario", { n: s.number })}{s.note ? ` · ${s.note.slice(0, 40)}${s.note.length > 40 ? "…" : ""}` : ""}
                </option>
              ))}
          </select>
        )}

        {unlockedByType === "quete" && (
          <div className="flex gap-2">
            <input type="text" value={unlockedByValue} onChange={e => setUnlockedByValue(e.target.value)}
              className="input-frost" style={{ flex: 1 }} placeholder={t("form_quest_ph")} />
            <select value={unlockedByPlayerName} onChange={e => setUnlockedByPlayerName(e.target.value)} className="select-frost" style={{ width: "auto", flexShrink: 0 }}>
              <option value="">{t("form_player_ph")}</option>
              {company.members.map(m => (
                <option key={m.id} value={m.pseudo}>{m.pseudo}</option>
              ))}
            </select>
          </div>
        )}

        {unlockedByType === "evenement" && (
          <div className="flex gap-2">
            <input type="text" value={unlockedByValue} onChange={e => setUnlockedByValue(e.target.value)}
              className="input-frost" style={{ width: 130, flexShrink: 0 }} placeholder={t("form_event_ref_ph")} />
            <input type="text" value={unlockedByDescription} onChange={e => setUnlockedByDescription(e.target.value)}
              className="input-frost" style={{ flex: 1 }} placeholder={t("form_event_desc_ph")} />
          </div>
        )}

        {unlockedByType === "section" && (
          <>
            <div className="flex gap-2">
              <input type="text" value={unlockedByValue} onChange={e => setUnlockedByValue(e.target.value)}
                className="input-frost" style={{ width: 110, flexShrink: 0 }} placeholder={t("form_section_num_ph")} />
              <select value={unlockedBySectionReason} onChange={e => setUnlockedBySectionReason(e.target.value)} className="select-frost" style={{ flex: 1 }}>
                <option value="">{t("form_section_reason_ph")}</option>
                {SECTION_REASONS.map(r => <option key={r} value={r}>{REASON_LABELS[r] ?? r}</option>)}
              </select>
            </div>
            {unlockedBySectionReason === "Autre" && (
              <input type="text" value={unlockedBySectionReasonOther} onChange={e => setUnlockedBySectionReasonOther(e.target.value)}
                className="input-frost" placeholder={t("form_reason_detail_ph")} />
            )}
            {["Création / amélioration bâtiment", "Retraite personnage", "Enveloppe"].includes(unlockedBySectionReason) && (
              <input type="text" value={unlockedBySectionReasonDetail} onChange={e => setUnlockedBySectionReasonDetail(e.target.value)}
                className="input-frost" placeholder={
                  unlockedBySectionReason === "Création / amélioration bâtiment" ? t("form_detail_ph_building") :
                  unlockedBySectionReason === "Retraite personnage" ? t("form_detail_ph_retire") :
                  t("form_detail_ph_envelope")
                } />
            )}
            <input type="text" value={unlockedByContext} onChange={e => setUnlockedByContext(e.target.value)}
              className="input-frost" placeholder={t("form_context_ph")} />
          </>
        )}
      </div>

      {error && <div className="error-frost">{error}</div>}

      <div className="divider-frost" />
      <div className="flex gap-3 justify-between">
        {isEditMode && (
          <button type="button" onClick={onDelete} className="btn-frost btn-danger"><IcoTrash /> {t("btn_delete")}</button>
        )}
        <button type="submit" className="btn-frost btn-primary ml-auto"><IcoCheck /> {submitLabel ?? (isEditMode ? t("btn_update") : t("btn_add"))}</button>
      </div>
    </form>
  );
}
export default ScenarioForm;
