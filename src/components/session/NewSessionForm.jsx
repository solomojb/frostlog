import { useState } from "react";
import { localISOStringToMinute } from "../../utils/dateUtils";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../../context/SessionContext";
import { useProgress } from "../../context/ProgressContext";
import { useCompany } from "../../context/CompanyContext";
import { IcoCheck } from "../ui/Icons";
import { useToast } from "../../context/ToastContext";
import { useT } from "../../context/LanguageContext";

function NewSessionForm() {
  const now = localISOStringToMinute();
  const { scenarios } = useProgress();
  const { company } = useCompany();
  const { setActiveSession } = useSession();
  const navigate = useNavigate();
  const showToast = useToast();
  const t = useT();

  const availableScenarios = scenarios.filter(s => s.finishedAt === null && !s.blockedAt);
  const members = company?.members ?? [];

  const [startingDatetime, setStartingDatetime] = useState(now);
  const [scenariosInSession, setScenariosInSession] = useState(() => {
    const priority = scenarios.filter(s => s.finishedAt === null && !s.blockedAt).find(s => s.priority);
    return [{ id: crypto.randomUUID(), number: priority?.number ?? "", result: null }];
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [error, setError] = useState(null);

  function toggleMember(id) {
    setSelectedMemberIds(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!startingDatetime) { setError(t("sess_start_required")); return; }
    if (selectedMemberIds.length < 2) { setError(t("sess_min_players")); return; }
    setActiveSession({ startingDatetime, scenarios: scenariosInSession, presentMemberIds: selectedMemberIds });
    setError(null);
    showToast(t("sess_started"));
    navigate("/");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">

      {/* Joueurs présents */}
      <div className="flex flex-col gap-2">
        <span className="sect-label" style={{ marginBottom: 4 }}>{t("sess_present_members")}</span>
        {members.length === 0 ? (
          <p className="text-sm italic" style={{ color: "var(--c-muted)" }}>
            {t("sess_no_members")}{" "}
            <Link to="/company" style={{ color: "var(--c-ice)" }}>{t("sess_no_members_link")}</Link>
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {members.map(m => {
              const selected = selectedMemberIds.includes(m.id);
              return (
                <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-left"
                  style={{
                    background: selected ? "rgba(168,216,234,0.1)" : "rgba(168,216,234,0.02)",
                    border: `1px solid ${selected ? "var(--c-ice-dim)" : "var(--c-border)"}`,
                    cursor: "pointer",
                  }}>
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: selected ? "var(--c-ice-dim)" : "none", border: `1px solid ${selected ? "var(--c-ice-dim)" : "var(--c-muted)"}` }}>
                    {selected && <IcoCheck />}
                  </div>
                  <span style={{ color: selected ? "var(--c-ice-light)" : "var(--c-text)", fontFamily: "'Cinzel', serif", fontSize: "0.85rem" }}>
                    {m.pseudo}
                  </span>
                  {m.activeCharacter && (
                    <span className="text-xs ml-auto" style={{ color: "var(--c-muted)", wordBreak: "break-all" }}>{m.activeCharacter}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Date */}
      <div className="flex flex-col gap-2">
        <span className="sect-label" style={{ marginBottom: 4 }}>{t("sess_start_date")}</span>
        <input type="datetime-local" value={startingDatetime} onChange={e => setStartingDatetime(e.target.value)} className="input-frost" />
      </div>

      {/* Scénario */}
      <div className="flex flex-col gap-2">
        <span className="sect-label" style={{ marginBottom: 4 }}>{t("sess_scenario_lbl")}</span>
        <div className="relative">
          <select
            value={scenariosInSession[0]?.number ?? ""}
            onChange={e => setScenariosInSession([{ ...scenariosInSession[0], number: Number(e.target.value) }])}
            className="select-frost">
            <option value="" disabled>{t("sess_choose_scenario")}</option>
            {availableScenarios.map(s => {
              const note = s.note ? s.note.slice(0, 48) + (s.note.length > 48 ? "…" : "") : "";
              const label = `${s.priority ? "★ " : ""}${s.number}${note ? ` · ${note}` : ""}`;
              return <option key={s.id} value={s.number}>{label}</option>;
            })}
          </select>
        </div>
        <Link to="/scenarios" className="self-end text-xs transition-colors underline underline-offset-2" style={{ color: "var(--c-muted)" }}
          onMouseEnter={e => e.target.style.color = "var(--c-ice)"} onMouseLeave={e => e.target.style.color = "var(--c-muted)"}>
          {t("sess_available_scen")}
        </Link>
      </div>

      {error && <div className="error-frost">{error}</div>}

      <button type="submit" className="btn-frost btn-primary mt-2 self-center px-10">
        <IcoCheck /> {t("sess_validate")}
      </button>
    </form>
  );
}

export default NewSessionForm;
