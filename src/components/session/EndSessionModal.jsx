import { useState } from "react";
import Modal from "../ui/Modal";
import { IcoX, IcoCheck, IcoPlus, IcoPencil } from "../ui/Icons";
import ScenarioForm from "../scenario/ScenarioForm";
import { useT } from "../../context/LanguageContext";

function formatUnlockedBy(ub, t) {
  const UB_LABELS = { scenario: t("form_source_scenario"), quete: t("lbl_ub_quest"), evenement: t("lbl_ub_event"), section: t("lbl_ub_section") };
  if (!ub) return null;
  if (typeof ub === "number") return `${t("form_source_scenario")} ${ub}`;
  const label = UB_LABELS[ub.type] ?? ub.type;
  if (ub.type === "scenario") return `${label} ${ub.value}`;
  if (ub.value) return `${label} · ${ub.value}`;
  return label;
}

function EndSessionModal({ onConfirm, onClose, initialUnlocked = [], sessionDate }) {
  const t = useT();
  const [items, setItems] = useState(() =>
    initialUnlocked.map(s => ({
      id: crypto.randomUUID(),
      number: Number(s.number),
      note: s.note ?? "",
      unlockedBy: s.unlockedBy ?? null,
      fromSession: true,
    }))
  );
  const [editingId, setEditingId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [error, setError] = useState(null);

  const editingItem = editingId ? items.find(i => i.id === editingId) : null;
  const inFormView = isAddingNew || !!editingId;

  function handleAddSubmit(data) {
    const nonSessionNums = items.filter(i => !i.fromSession).map(i => i.number);
    if (nonSessionNums.includes(data.number)) {
      throw new Error(t("end_duplicate", { n: data.number }));
    }
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      number: data.number,
      note: data.note,
      unlockedBy: data.unlockedBy,
      fromSession: false,
    }]);
    setIsAddingNew(false);
  }

  function handleEditSubmit(data) {
    setItems(prev => prev.map(i =>
      i.id === editingId ? { ...i, note: data.note, unlockedBy: data.unlockedBy } : i
    ));
    setEditingId(null);
  }

  function handleConfirm() {
    setError(null);
    onConfirm(items.map(i => ({
      number: i.number,
      note: i.note,
      alreadyAdded: i.fromSession,
      unlockedBy: i.unlockedBy,
    })));
  }

  const modalOnClose = inFormView
    ? (isAddingNew ? () => setIsAddingNew(false) : () => setEditingId(null))
    : onClose;

  return (
    <Modal onClose={modalOnClose}>
      {inFormView ? (
        <ScenarioForm
          initialData={editingItem ? {
            number: editingItem.number,
            note: editingItem.note,
            unlockedBy: editingItem.unlockedBy,
          } : null}
          onSubmit={isAddingNew ? handleAddSubmit : handleEditSubmit}
          submitLabel={isAddingNew ? t("btn_add") : t("btn_update")}
          sessionDate={sessionDate}
        />
      ) : (
        <div className="flex flex-col gap-5 max-h-[80vh]">
          <div className="flex-shrink-0">
            <h2 className="title-rune mb-1" style={{ fontSize: "1.1rem" }}>{t("end_title")}</h2>
            <p className="text-sm" style={{ color: "var(--c-muted)" }}>{t("end_unlocked_hint")}</p>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto scrollbar-hide flex-1 pr-1">
            {items.length === 0 && (
              <p className="text-sm text-center italic" style={{ color: "var(--c-muted)" }}>{t("end_none_yet")}</p>
            )}

            {items.map(item => {
              const ubLabel = formatUnlockedBy(item.unlockedBy, t);
              return (
                <fieldset key={item.id} className="frost-inner flex-shrink-0" style={{ padding: "8px 12px 12px" }}>
                  {item.fromSession && (
                    <legend style={{ padding: "0 6px", marginLeft: 6, fontFamily: "'Cinzel', serif", fontSize: "0.5rem", letterSpacing: "0.12em", color: "var(--c-ice-dim)", textTransform: "uppercase" }}>{t("end_added_in_session")}</legend>
                  )}
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.9rem", color: "var(--c-ice-light)", flexShrink: 0 }}>
                      {t("lbl_scenario", { n: item.number })}
                    </span>
                    <div className="flex flex-col flex-1 min-w-0" style={{ gap: 1 }}>
                      {item.note && (
                        <span className="text-xs" style={{ color: "var(--c-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {item.note}
                        </span>
                      )}
                      {ubLabel && (
                        <span className="text-xs" style={{ color: "var(--c-dim)" }}>{ubLabel}</span>
                      )}
                    </div>
                    <button type="button" onClick={() => setEditingId(item.id)} className="btn-ghost-sm flex-shrink-0" title={t("btn_edit")}>
                      <IcoPencil />
                    </button>
                    {!item.fromSession && (
                      <button type="button" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="btn-ghost-sm flex-shrink-0" title={t("end_remove")}>
                        <IcoX />
                      </button>
                    )}
                  </div>
                </fieldset>
              );
            })}

            <button type="button" onClick={() => setIsAddingNew(true)}
              className="w-full flex items-center justify-center gap-2 py-2 transition-colors"
              style={{ background: "none", border: "1px dashed var(--c-border)", borderRadius: 8, color: "var(--c-muted)", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-ice-dim)"; e.currentTarget.style.color = "var(--c-ice-dim)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-border)"; e.currentTarget.style.color = "var(--c-muted)"; }}>
              <IcoPlus /> {t("form_scen_add")}
            </button>
          </div>

          {error && <div className="error-frost flex-shrink-0">{error}</div>}

          <div className="flex justify-between flex-shrink-0">
            <button type="button" onClick={onClose} className="btn-frost btn-cancel"><IcoX /> {t("btn_cancel")}</button>
            <button type="button" onClick={handleConfirm} className="btn-frost btn-primary"><IcoCheck /> {t("end_btn")}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default EndSessionModal;
