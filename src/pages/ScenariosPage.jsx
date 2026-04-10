import { useState, useMemo } from "react";
import { useProgress } from "../context/ProgressContext";
import { useSession } from "../context/SessionContext";
import ScenarioCard from "../components/scenario/ScenarioCard";
import ScenarioForm from "../components/scenario/ScenarioForm";
import Modal from "../components/ui/Modal";
import { NavPill, NavPillSession } from "../components/layout/NavPill";
import { IcoHome, IcoPlusCircle, IcoEdit, IcoArrow, IcoCheck, IcoBlock } from "../components/ui/Icons";
import { IcoPlus } from "../components/ui/Icons";
import { useToast } from "../context/ToastContext";
import { useT } from "../context/LanguageContext";

function sortList(list, sortBy, sortDir) {
  return [...list].sort((a, b) => {
    if (sortBy === "number") return a.number - b.number;
    const diff = new Date(b.unlockedAt) - new Date(a.unlockedAt);
    return sortDir === "desc" ? -diff : diff;
  });
}

function sortUnlocked(list, sortBy, sortDir) {
  const priority = list.filter(s => s.priority);
  const normal   = list.filter(s => !s.priority);
  return [...sortList(priority, sortBy, sortDir), ...sortList(normal, sortBy, sortDir)];
}

function ScenariosPage() {
  const { activeSession, setActiveSession } = useSession();
  const { scenarios, addScenario, updateScenario, deleteScenario } = useProgress();
  const showToast = useToast();
  const t = useT();

  const SORT_OPTIONS = [
    { value: "unlock", label: t("scen_sort_date") },
    { value: "number", label: t("scen_sort_num") },
  ];

  const [sortBy, setSortBy] = useState("unlock");
  const [sortDir, setSortDir] = useState("asc");
  const [editingScenario, setEditingScenario] = useState(null);
  const [addingScenario,  setAddingScenario]  = useState(false);
  const [showFinished, setShowFinished] = useState(false);
  const [showBlocked,  setShowBlocked]  = useState(false);

  const unlockedAll = useMemo(() => sortUnlocked(scenarios.filter(s => !s.blockedAt && s.finishedAt === null), sortBy, sortDir), [scenarios, sortBy, sortDir]);
  const unlockedPriority = unlockedAll.filter(s => s.priority);
  const unlockedNormal   = unlockedAll.filter(s => !s.priority);
  const finished  = useMemo(() => sortList(scenarios.filter(s => !s.blockedAt && s.finishedAt !== null), sortBy, sortDir), [scenarios, sortBy, sortDir]);
  const blocked   = useMemo(() => sortList(scenarios.filter(s =>  s.blockedAt), sortBy, sortDir), [scenarios, sortBy, sortDir]);

  function handleSortClick(value) {
    if (value === "unlock") {
      if (sortBy === "unlock") setSortDir(d => d === "asc" ? "desc" : "asc");
      else { setSortBy("unlock"); setSortDir("asc"); }
    } else {
      setSortBy(value);
    }
  }

  function handleAddScenario(data) {
    addScenario(data.number, data.note, data.unlockedAt, data.unlockedBy ?? null);
    // Si session active, l'ajouter aux débloqués en session (pas aux joués)
    if (activeSession) {
      setActiveSession(prev => ({
        ...prev,
        unlockedDuringSession: [...(prev.unlockedDuringSession ?? []), { number: data.number, note: data.note ?? "", unlockedBy: data.unlockedBy ?? null }]
      }));
    }
    showToast(t("scen_added"));
    setAddingScenario(false);
  }

  return (
    <div className="h-screen flex items-stretch justify-between overflow-hidden">
      <div className="flex-shrink-0 flex items-center">
        <NavPill to="/" icon={<IcoHome />} label={t("nav_menu")} side="left" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-4">
        <div className="max-w-2xl mx-auto frost-block p-6">
          <div className="flex flex-col gap-7">

            {/* Débloqués */}
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="sect-label" style={{ marginBottom: 0 }}>{t("scen_unlocked")}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(42,58,80,0.5)", border: "1px solid var(--c-border)", color: "var(--c-muted)", fontFamily: "'Cinzel', serif" }}>
                  {unlockedAll.length}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  {SORT_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => handleSortClick(opt.value)}
                      className="text-xs px-2 py-1 rounded transition-all"
                      style={{
                        background: sortBy === opt.value ? "rgba(168,216,234,0.1)" : "none",
                        border: `1px solid ${sortBy === opt.value ? "var(--c-ice-dim)" : "var(--c-border)"}`,
                        color: sortBy === opt.value ? "var(--c-ice-dim)" : "var(--c-muted)",
                        cursor: "pointer", fontFamily: "'Cinzel', serif", letterSpacing: "0.05em",
                      }}>
                      {opt.label}{opt.value === "unlock" && sortBy === "unlock"
                        ? <span style={{ display: "inline-flex", alignItems: "center", transform: sortDir === "asc" ? "rotate(-90deg) scale(0.7)" : "rotate(90deg) scale(0.7)", verticalAlign: "middle" }}><IcoArrow /></span>
                        : ""}
                    </button>
                  ))}
                  <button onClick={() => setAddingScenario(true)} title="Ajouter un scénario"
                    className="flex items-center justify-center px-2 py-1 transition-colors"
                    style={{ background: "none", marginLeft: 6, border: "1px dashed var(--c-border)", borderRadius: 6, color: "var(--c-muted)", cursor: "pointer" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-ice-dim)"; e.currentTarget.style.color = "var(--c-ice-dim)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-border)"; e.currentTarget.style.color = "var(--c-muted)"; }}>
                    <IcoPlus />
                  </button>
                </div>
              </div>
              <div className="flex flex-col">
                {unlockedPriority.length > 0 && (
                  <>
                    <span className="px-3 pb-1 pt-0.5" style={{ fontSize: "0.62rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.18em", color: "var(--c-ice-dim)", textTransform: "uppercase" }}>
                      {t("scen_priority")}
                    </span>
                    {unlockedPriority.map(s => <ScenarioCard key={s.id} scenario={s} onEdit={setEditingScenario} />)}
                    {unlockedNormal.length > 0 && (
                      <>
                        <span className="px-3 pb-1 pt-2" style={{ fontSize: "0.62rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.18em", color: "var(--c-muted)", textTransform: "uppercase" }}>
                          {t("scen_others")}
                        </span>
                        {unlockedNormal.map(s => <ScenarioCard key={s.id} scenario={s} onEdit={setEditingScenario} />)}
                      </>
                    )}
                  </>
                )}
                {unlockedPriority.length === 0 && unlockedNormal.map(s => <ScenarioCard key={s.id} scenario={s} onEdit={setEditingScenario} />)}
                {unlockedAll.length === 0 && <p className="text-sm italic px-3" style={{ color: "var(--c-muted)" }}>{t("scen_none_unlocked")}</p>}
              </div>
            </div>

            <div className="divider-frost" />

            {/* Terminés */}
            <div>
              <button onClick={() => setShowFinished(v => !v)}
                className="flex items-center gap-2 w-full mb-2"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <span className="sect-label" style={{ marginBottom: 0, display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ display: "inline-flex", alignItems: "center" }}><IcoCheck /></span>{t("scen_finished")}</span>
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(42,58,80,0.5)", border: "1px solid var(--c-border)", color: "var(--c-muted)", fontFamily: "'Cinzel', serif" }}>
                  {finished.length}
                </span>
                <span style={{ marginLeft: "auto", color: "var(--c-dim)", display: "inline-flex", transition: "transform 0.2s", transform: showFinished ? "rotate(90deg)" : "rotate(0deg)" }}>
                  <IcoArrow />
                </span>
              </button>
              {showFinished && (
                <div className="flex flex-col">
                  {finished.map(s => <ScenarioCard key={s.id} scenario={s} onEdit={setEditingScenario} />)}
                  {finished.length === 0 && <p className="text-sm italic px-3" style={{ color: "var(--c-muted)" }}>{t("scen_none_finished")}</p>}
                </div>
              )}
            </div>

            {/* Bloqués */}
            {blocked.length > 0 && (
              <>
                <div className="divider-frost" />
                <div>
                  <button onClick={() => setShowBlocked(v => !v)}
                    className="flex items-center gap-2 w-full mb-2"
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                    <span className="sect-label" style={{ marginBottom: 0, display: "inline-flex", alignItems: "center", gap: 8 }}><span className="w-3 h-3 inline-flex"><IcoBlock /></span>{t("scen_blocked")}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(42,58,80,0.5)", border: "1px solid var(--c-border)", color: "var(--c-muted)", fontFamily: "'Cinzel', serif" }}>
                      {blocked.length}
                    </span>
                    <span style={{ marginLeft: "auto", color: "var(--c-dim)", display: "inline-flex", transition: "transform 0.2s", transform: showBlocked ? "rotate(90deg)" : "rotate(0deg)" }}>
                      <IcoArrow />
                    </span>
                  </button>
                  {showBlocked && (
                    <div className="flex flex-col">
                      {blocked.map(s => <ScenarioCard key={s.id} scenario={s} onEdit={setEditingScenario} />)}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center">
        {activeSession
          ? <NavPillSession startingDatetime={activeSession?.startingDatetime} side="right" />
          : <NavPill to="/new-session" icon={<IcoPlusCircle />} label={t("nav_newSession")} side="right" />
        }
      </div>

      {addingScenario && (
        <Modal onClose={() => setAddingScenario(false)}>
          <ScenarioForm onSubmit={handleAddScenario} />
        </Modal>
      )}
      {editingScenario && (
        <Modal onClose={() => setEditingScenario(null)}>
          <ScenarioForm
            initialData={editingScenario}
            onSubmit={data => {
              updateScenario(editingScenario.id, data);
              setActiveSession(prev => {
                if (!prev?.unlockedDuringSession?.some(s => s.number === editingScenario.number)) return prev;
                return { ...prev, unlockedDuringSession: prev.unlockedDuringSession.map(s =>
                  s.number === editingScenario.number ? { ...s, note: data.note ?? "" } : s
                )};
              });
              showToast(t("scen_updated"));
              setEditingScenario(null);
            }}
            onDelete={() => {
              const num = editingScenario.number;
              deleteScenario(editingScenario.id);
              setActiveSession(prev => {
                if (!prev?.unlockedDuringSession?.some(s => s.number === num)) return prev;
                return { ...prev, unlockedDuringSession: prev.unlockedDuringSession.filter(s => s.number !== num) };
              });
              showToast(t("scen_deleted"), "warning");
              setEditingScenario(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

export default ScenariosPage;
