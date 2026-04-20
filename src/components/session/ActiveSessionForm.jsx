import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import { useProgress } from "../../context/ProgressContext";
import { useCompany } from "../../context/CompanyContext";
import { useNavigate } from "react-router-dom";
import { localISOString } from "../../utils/dateUtils";
import { KEYS } from "../../utils/storageKeys";
import storage from "../../utils/storage";
import EndSessionModal from "./EndSessionModal";
import SelectFrost from "../ui/SelectFrost";
import Modal from "../ui/Modal";
import ScenarioForm from "../scenario/ScenarioForm";
import { IcoX, IcoCheck, IcoSave, IcoPlus, IcoUnlock, IcoPencil } from "../ui/Icons";
import { GI, GI_FILTER, GIcon } from "../../utils/gameIcons.jsx";
import { useToast } from "../../context/ToastContext";
import { useT } from "../../context/LanguageContext";

function StatsLink() {
  const t = useT();
  const [hov, setHov] = useState(false);
  return (
    <Link to="/scenario-stats"
      className="flex-shrink-0"
      title={t("menu_combat_stats")}
      style={{ display: "flex", alignItems: "center" }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}>
      <GIcon src={GI.swordClash} filter={hov ? GI_FILTER.red : GI_FILTER.greyLight} size={18} title={t("menu_combat_stats")} />
    </Link>
  );
}

function ActiveSessionForm() {
  const { activeSession, setActiveSession, endSession } = useSession();
  const navigate = useNavigate();
  const showToast = useToast();
  const t = useT();
  const { scenarios, addScenario, updateScenario, deleteScenario, markAsFinished } = useProgress();
  const { company } = useCompany();
  const presentMembers = (activeSession?.presentMemberIds ?? []).map(id => company?.members?.find(m => m.id === id)).filter(Boolean);
  const availableScenarios = scenarios.filter(s => s.finishedAt === null && !s.blockedAt);

  const [startingDatetime, setStartingDatetime] = useState("");
  const [scenariosInSession, setScenariosInSession] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [editingUnlocked, setEditingUnlocked] = useState(null);
  const [endError, setEndError] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [unlockedDuringSession, setUnlockedDuringSession] = useState([]);

  useEffect(() => {
    if (activeSession) {
      setStartingDatetime(activeSession.startingDatetime);
      setScenariosInSession(activeSession.scenarios.map(s => ({
        id: s.id ?? crypto.randomUUID(),
        number: s.number,
        result: s.result ?? null
      })));
      setUnlockedDuringSession(activeSession.unlockedDuringSession ?? []);
    }
  }, []);

  function saveSession(datetime, scenarios) {
    setActiveSession(prev => ({
      ...prev, startingDatetime: datetime,
      scenarios: scenarios.map(s => {
        const existing = prev.scenarios?.find(ps => ps.id === s.id) ?? {};
        return { ...existing, ...s };
      })
    }));
    setIsDirty(false);
  }

  function handleUpdateSession(e) {
    e.preventDefault();
    saveSession(startingDatetime, scenariosInSession);
  }

  function markDirty() { setIsDirty(true); }

  function handleCancelSession() { storage.removeItem(KEYS.scenarioStatsSetup); setActiveSession(null); showToast(t("sess_cancelled_toast"), "warning"); navigate("/"); }
  function handleAddScenario() { setScenariosInSession(prev => [...prev, { id: crypto.randomUUID(), number: "", result: null }]); }
  function handleRemoveScenario(id) {
    const updated = scenariosInSession.filter(s => s.id !== id);
    setScenariosInSession(updated);
    setActiveSession(prev => ({
      ...prev,
      scenarios: prev.scenarios?.filter(s => s.id !== id) ?? [],
    }));
    markDirty();
  }

  function handleRemoveUnlocked(number) {
    const updated = unlockedDuringSession.filter(s => s.number !== number);
    setUnlockedDuringSession(updated);
    setScenariosInSession(prev => prev.map(s => s.number === number ? { ...s, number: "", result: null } : s));
    setActiveSession(prev => ({
      ...prev,
      unlockedDuringSession: updated,
      scenarios: prev.scenarios?.map(s => s.number === number ? { ...s, number: "", result: null } : s),
    }));
    const sc = scenarios.find(s => s.number === number);
    if (sc) try { deleteScenario(sc.id); } catch {}
    showToast(t("sess_scen_deleted"), "warning");
  }

  function handleEditUnlocked(data) {
    const sc = scenarios.find(s => s.number === editingUnlocked.number);
    if (sc) updateScenario(sc.id, { ...data, finishedAt: sc.finishedAt });
    const updated = unlockedDuringSession.map(s =>
      s.number === editingUnlocked.number ? { ...s, note: data.note, unlockedBy: data.unlockedBy ?? null } : s
    );
    setUnlockedDuringSession(updated);
    setActiveSession(prev => ({ ...prev, unlockedDuringSession: updated }));
    showToast(t("sess_scen_updated"));
    setEditingUnlocked(null);
  }

  function handleUnlockScenario(data) {
    try { addScenario(data.number, data.note, data.unlockedAt, data.unlockedBy ?? null); } catch {}
    const newUnlocked = { number: data.number, note: data.note ?? "", unlockedBy: data.unlockedBy ?? null };
    const updatedUnlocked = [...unlockedDuringSession, newUnlocked];
    setUnlockedDuringSession(updatedUnlocked);
    setActiveSession(prev => ({
      ...prev,
      unlockedDuringSession: updatedUnlocked,
    }));
    showToast(t("sess_scen_added"));
    setShowUnlockModal(false);
  }

  function handleTryEndSession() {
    const missingResult  = scenariosInSession.filter(s => s.result === null && s.number !== "");
    const missingScenario = scenariosInSession.filter(s => s.number === "" && s.result !== null);
    const completed = scenariosInSession.filter(s => s.number !== "" && s.result !== null);
    if (startingDatetime && new Date(startingDatetime) > new Date()) {
      setEndError(t("sess_err_future")); return;
    }
    if (completed.length === 0) { setEndError(t("sess_err_no_result")); return; }
    if (missingResult.length > 0) { setEndError(t("sess_err_missing_result")); return; }
    if (missingScenario.length > 0) { setEndError(t("sess_err_missing_scen")); return; }
    setEndError(null);
    setActiveSession(prev => ({
      ...prev, startingDatetime,
      scenarios: scenariosInSession.map(s => {
        const existing = prev.scenarios?.find(ps => ps.id === s.id) ?? {};
        return { ...existing, ...s };
      })
    }));
    setShowEndModal(true);
  }

  function handleEndSession(unlockedItems) {
    for (const s of scenariosInSession) {
      if (s.result === "victory" && s.number !== "") {
        const ps = scenarios.find(p => p.number === s.number);
        if (ps && ps.finishedAt === null) markAsFinished(ps.id);
      }
    }
    for (const item of unlockedItems) {
      if (!item.alreadyAdded) {
        try { addScenario(item.number, item.note ?? "", localISOString(), item.unlockedBy ?? null); } catch {}
      }
    }
    endSession(unlockedItems);
    showToast(t("sess_ended"));
    navigate("/");
  }

  return (
    <>
    <form onSubmit={handleUpdateSession} className="flex flex-col gap-6">
      {/* Membres présents */}
      {presentMembers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presentMembers.map(m => (
            <span key={m.id} className="text-xs px-2.5 py-1 rounded-full"
              style={{ background: "rgba(168,216,234,0.08)", border: "1px solid var(--c-ice-dim)", color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}>
              {m.pseudo}
            </span>
          ))}
        </div>
      )}
      {/* Date */}
      <div className="flex flex-col gap-2">
        <span className="sect-label" style={{ marginBottom: 4 }}>{t("sess_start_date")}</span>
        <input type="datetime-local" value={startingDatetime} onChange={e => { setStartingDatetime(e.target.value); markDirty(); }} className="input-frost" />
      </div>

      {/* Scénarios joués */}
      <div className="flex flex-col gap-3">
        <span className="sect-label" style={{ marginBottom: 0 }}>{t("sess_played")}</span>

        {scenariosInSession.map(s => (
          <div key={s.id} className="frost-inner p-3">
            <div className="flex items-center gap-3">
              {(() => {
                const scData = activeSession?.scenarios?.find(sc => sc.id === s.id);
                const hasStats = scData?.playerStats?.length > 0;
                const setupRaw = storage.getItem(KEYS.scenarioStatsSetup);
                const inProgress = (() => { try { return JSON.parse(setupRaw)?.scenarioId === s.id; } catch { return false; } })();
                const locked = hasStats || inProgress;
                return (
                  <SelectFrost
                    value={s.number}
                    disabled={locked}
                    onChange={e => { setScenariosInSession(prev =>
                      prev.map(sc => sc.id === s.id ? { ...sc, number: Number(e.target.value) } : sc)
                    ); markDirty(); }}
                    style={locked ? { flex: 1, opacity: 0.6, cursor: "not-allowed" } : { flex: 1 }}
                  >
                    <option value="" disabled>{t("sess_choose_scenario")}</option>
                    {availableScenarios.map(sc => {
                      return <option key={sc.id} value={sc.number}>{sc.priority ? "★ " : ""}{sc.number}{sc.note ? ` · ${sc.note}` : ""}</option>;
                    })}
                  </SelectFrost>
                );
              })()}
              <div className="flex gap-4 flex-shrink-0">
                {["victory", "defeat"].map(v => (
                  <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: "var(--c-text)" }}>
                    <input type="radio" name={`result-${s.id}`} value={v}
                      checked={s.result === v}
                      onChange={() => { setScenariosInSession(prev =>
                        prev.map(sc => sc.id === s.id ? { ...sc, result: v } : sc)
                      ); markDirty(); }}
                      style={{ accentColor: "var(--c-ice-dim)" }}
                    />
                    {v === "victory" ? t("lbl_victory") : t("lbl_defeat")}
                  </label>
                ))}
              </div>
              <StatsLink />
              {(() => {
                const sc = activeSession?.scenarios?.find(sc => sc.id === s.id);
                const hasStats = sc?.playerStats?.length > 0;
                const setupRaw = storage.getItem(KEYS.scenarioStatsSetup);
                const inProgress = (() => { try { return JSON.parse(setupRaw)?.scenarioId === s.id; } catch { return false; } })();
                if (inProgress || hasStats) {
                  return (
                    <span className="text-xs flex-shrink-0" style={{ color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif", letterSpacing: "0.04em" }}>
                      {inProgress ? t("sess_stats_active") : t("sess_stats_saved")}
                    </span>
                  );
                }
                return (
                  <button type="button" onClick={() => handleRemoveScenario(s.id)} className="btn-ghost-sm flex-shrink-0" title={t("sess_remove_scen")}>
                    <IcoX />
                  </button>
                );
              })()}
            </div>
          </div>
        ))}

        <button type="button" onClick={handleAddScenario}
          className="w-full flex items-center justify-center gap-2 py-2 transition-colors"
          style={{ background: "none", border: "1px dashed var(--c-border)", borderRadius: 8, color: "var(--c-muted)", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-ice-dim)"; e.currentTarget.style.color = "var(--c-ice-dim)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-border)"; e.currentTarget.style.color = "var(--c-muted)"; }}>
          <IcoPlus /> {t("form_scen_add")}
        </button>
      </div>

      {/* Scénarios débloqués en cours de session */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="sect-label" style={{ marginBottom: 0 }}>{t("sess_unlocked")}</span>
          <button type="button" onClick={() => setShowUnlockModal(true)}
            className="btn-frost btn-save" style={{ padding: "4px 10px", fontSize: "0.8rem" }}>
            <IcoUnlock /> {t("btn_unlock")}
          </button>
        </div>
        {unlockedDuringSession.length === 0 ? (
          <p className="text-xs italic" style={{ color: "var(--c-muted)" }}>{t("lbl_none_yet")}</p>
        ) : (
          <div className="flex flex-col gap-1">
            {unlockedDuringSession.map((s, i) => (
              <div key={i} className="frost-inner px-3 py-2 flex items-start gap-2">
                <div className="flex flex-col gap-0.5 flex-1">
                  <span style={{ color: "var(--c-ice)", fontFamily: "'Cinzel', serif", fontSize: "0.8rem" }}>{t("lbl_scenario", { n: s.number })}</span>
                  {s.note && <span className="text-xs" style={{ color: "var(--c-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{s.note}</span>}
                </div>
                <button type="button" onClick={() => setEditingUnlocked(s)} className="btn-ghost-sm" title={t("btn_edit")} style={{ flexShrink: 0 }}>
                  <IcoPencil />
                </button>
                <button type="button" onClick={() => handleRemoveUnlocked(s.number)} className="btn-ghost-sm" title={t("sess_remove_scen")} style={{ color: "var(--c-muted)", flexShrink: 0 }}>
                  <IcoX />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {endError && <div className="error-frost">{endError}</div>}
      <div className="divider-frost" />

      {/* Actions */}
      <div className="flex justify-between gap-4">
        {confirmCancel ? (
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--c-muted)" }}>{t("sess_cancel_confirm")}</span>
            <button type="button" onClick={handleCancelSession} className="btn-frost btn-danger" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
              <IcoCheck /> {t("btn_yes")}
            </button>
            <button type="button" onClick={() => setConfirmCancel(false)} className="btn-frost btn-cancel" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
              <IcoX /> {t("btn_no")}
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmCancel(true)} className="btn-frost btn-cancel">
            <IcoX /> {t("btn_cancel")}
          </button>
        )}
        <div className="flex gap-2">
          {isDirty ? (
            <button type="submit" className="btn-frost btn-save">
              <IcoSave /> {t("btn_save")}
            </button>
          ) : (
            <span className="text-sm flex items-center gap-1.5 mr-2" style={{ color: "var(--c-muted)" }}>
              <IcoCheck /> {t("lbl_saved")}
            </span>
          )}
          <button type="button" onClick={handleTryEndSession} className="btn-frost btn-primary">
            <IcoCheck /> {t("sess_end")}
          </button>
        </div>
      </div>
    </form>

    {showEndModal && (
      <EndSessionModal
        onConfirm={handleEndSession}
        onClose={() => setShowEndModal(false)}
        initialUnlocked={unlockedDuringSession}
        sessionDate={activeSession?.startingDatetime}
      />
    )}

    {editingUnlocked && (
      <Modal onClose={() => setEditingUnlocked(null)}>
        <ScenarioForm
          initialData={{ number: editingUnlocked.number, note: editingUnlocked.note, unlockedBy: editingUnlocked.unlockedBy }}
          onSubmit={handleEditUnlocked}
          onDelete={() => { handleRemoveUnlocked(editingUnlocked.number); setEditingUnlocked(null); }}
          submitLabel={t("btn_update")}
          sessionDate={activeSession?.startingDatetime}
        />
      </Modal>
    )}

    {showUnlockModal && (
      <Modal onClose={() => setShowUnlockModal(false)}>
        <ScenarioForm
          onSubmit={handleUnlockScenario}
          submitLabel={t("btn_unlock")}
          sessionDate={activeSession?.startingDatetime}
        />
      </Modal>
    )}
    </>
  );
}

export default ActiveSessionForm;
