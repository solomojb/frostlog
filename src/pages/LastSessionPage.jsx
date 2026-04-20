import { useState } from "react";
import { NavPill } from "../components/layout/NavPill";
import { IcoHome, IcoArrow } from "../components/ui/Icons";
import { GI, GI_FILTER, GIcon } from "../utils/gameIcons.jsx";
import { TITLE_BY_KEY } from "../utils/titles.jsx";
import { IcoChevronDown } from "../components/ui/Icons";
import { useToast } from "../context/ToastContext";
import { useCompany } from "../context/CompanyContext";
import { useDateFormatters } from "../utils/dateUtils";
import { resolveName, resolveChar, computeMVP, computeMVPScores, computeTitles, aggregateSessionStats } from "../utils/statUtils";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";
import { useT } from "../context/LanguageContext";

function PlayerCard({ ps, hasBoss }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--c-muted)", display:"flex", alignItems:"center", gap:4 }}><GIcon src={GI.swords} filter={GI_FILTER.red} size={18} /> {t("combat_damage_dealt")}</span>
        <span style={{ color: "#e57373", fontFamily: "'Cinzel', serif" }}>{ps.damageDealt ?? 0}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--c-muted)", display:"flex", alignItems:"center", gap:4 }}><GIcon src={GI.shieldImpact} filter={GI_FILTER.blue} size={18} /> {t("combat_damage_taken")}</span>
        <span style={{ color: "#64b5f6", fontFamily: "'Cinzel', serif" }}>{ps.damageTaken ?? 0}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: "var(--c-muted)", display:"flex", alignItems:"center", gap:4 }}><GIcon src={GI.heart} filter={GI_FILTER.green} size={18} /> {t("combat_healing")}</span>
        <span style={{ color: "#81c784", fontFamily: "'Cinzel', serif" }}>{ps.healingDone ?? 0}</span>
      </div>
      <div style={{ borderTop: "1px solid var(--c-border)", marginTop: 2, paddingTop: 4 }} className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--c-muted)", display:"flex", alignItems:"center", gap:4 }}><span style={{ width: 18, display: "inline-flex", justifyContent: "center" }}><GIcon src={GI.skull} filter={GI_FILTER.white} size={16} /></span> {t("combat_kills_normal")}</span>
          <span style={{ color: "var(--c-text)", fontFamily: "'Cinzel', serif" }}>{ps.kills?.normal ?? 0}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--c-muted)", display:"flex", alignItems:"center", gap:4 }}><GIcon src={GI.dreadSkull} filter={GI_FILTER.yellow} size={18} /> {t("combat_kills_elite")}</span>
          <span style={{ color: "#ffd54f", fontFamily: "'Cinzel', serif" }}>{ps.kills?.elite ?? 0}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span style={{ color: "var(--c-muted)", display:"flex", alignItems:"center", gap:4 }}><GIcon src={GI.crownSkull} filter={GI_FILTER.red} size={18} /> {t("combat_kills_boss")}</span>
          <span style={{ color: "#e57373", fontFamily: "'Cinzel', serif" }}>{ps.kills?.boss ?? 0}</span>
        </div>
      </div>
    </div>
  );
}



function ScenarioStats({ sc, session, company }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  if (!sc.playerStats?.length) return null;
  const titles = computeTitles(sc.playerStats);
  const names = sc.playerStats.map((_, i) => resolveName(sc, i, company, session));
  const chars = sc.playerStats.map((_, i) => resolveChar(sc, i, company, session));
  const mvpName = computeMVP(sc.playerStats, names);
  return (
    <div className="flex flex-col gap-2">
      <button onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1 text-xs self-start"
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-ice-dim)" }}>
        <span style={{ display: "inline-flex", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}><IcoChevronDown /></span>
        {t("last_combat_stats")}
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${sc.playerStats.length}, 1fr)`, gap: 8 }}>
          {sc.playerStats.map((ps, i) => (
            <fieldset key={i} className="flex flex-col gap-2" style={{
              minWidth: 0,
              background: "rgba(168,216,234,0.025)",
              border: "1px solid var(--c-border)",
              borderRadius: 10,
              padding: "4px 12px 8px",
              ...(!titles[i]?.length ? { marginTop: 7, paddingTop: 12 } : {}),
            }}>
              {titles[i]?.length > 0 && (
                <legend style={{ padding: "0 4px", margin: "0 auto", display: "flex", alignItems: "center", gap: 4 }}>
                  {titles[i].map((tKey, j) => {
                    const def = TITLE_BY_KEY[tKey];
                    return def ? <GIcon key={j} src={def.src} filter={def.filter} size={16} title={t(`title_${tKey}`)} /> : null;
                  })}
                </legend>
              )}
              <div className="flex items-center justify-between" style={{ borderBottom: "1px solid var(--c-border)", paddingBottom: 6, marginBottom: 2 }}>
                <div className="flex items-center gap-1.5">
                  {mvpName && names[i] === mvpName && <GIcon src={GI.crown} filter={GI_FILTER.yellow} size={16} title={t("title_mvp")} />}
                  <div className="flex flex-col">
                    <span style={{ fontFamily: "'Cinzel', serif", color: mvpName && names[i] === mvpName ? "#fdd835" : "var(--c-ice-light)", fontSize: "0.8rem", wordBreak: "break-word" }}>{names[i]}</span>
                    {chars[i] && <span style={{ fontFamily: "'Cinzel', serif", color: "var(--c-muted)", fontSize: "0.6rem", wordBreak: "break-all" }}>{chars[i]}</span>}
                  </div>
                </div>
                {(ps.exhausted ?? ps.died) && <GIcon src={GI.pirateGrave} filter={GI_FILTER.red} size={16} title="Épuisé" />}
              </div>
              <PlayerCard ps={ps} hasBoss={sc.hasBoss} />
            </fieldset>
          ))}
        </div>
      )}
    </div>
  );
}

function ScenarioRow({ s, session, company }) {
  const t = useT();
  return (
    <div className="frost-inner p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'Cinzel', serif", color: "var(--c-ice-light)", fontSize: "0.85rem" }}>
          {t("lbl_scenario", { n: s.number })}
        </span>
        {s.result && (
          <span className={s.result === "victory" ? "badge-victory" : "badge-defeat"}>
            {s.result === "victory" ? t("lbl_victory") : t("lbl_defeat")}
          </span>
        )}
      </div>
      <ScenarioStats sc={s} session={session} company={company} />
    </div>
  );
}

function SessionView({ session, company }) {
  const t = useT();
  const { formatDate, formatTime, formatDuration } = useDateFormatters();
  if (!session) return <p className="text-sm italic text-center py-8" style={{ color: "var(--c-muted)" }}>{t("last_none")}</p>;

  const allStats = session.scenarios?.filter(s => s.playerStats?.length > 0) ?? [];
  let mvpName = null;
  let titlesByMemberId = {};
  let mvpScoreById = {};
  if (allStats.length > 0) {
    const aggById = aggregateSessionStats(session);
    const memberIds = Object.keys(aggById);
    const aggArr = memberIds.map(id => aggById[id]);
    const names = memberIds.map(id => {
      const snap = session.memberSnapshot?.[id];
      return snap ? (typeof snap === "string" ? snap : snap.pseudo) : id;
    });
    mvpName = computeMVP(aggArr, names);
    const sessionTitles = computeTitles(aggArr);
    const mvpScores = computeMVPScores(aggArr);
    memberIds.forEach((id, i) => {
      if (sessionTitles[i]) titlesByMemberId[id] = sessionTitles[i];
      mvpScoreById[id] = mvpScores[i];
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--c-muted)" }}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><GIcon src={GI.calendar} filter={GI_FILTER.greyLight} size={16} title="Date"/>{formatDate(session.startingDatetime)}</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><GIcon src={GI.clock} filter={GI_FILTER.greyLight} size={16} title="Horaires"/>{formatTime(session.startingDatetime)} <span style={{ display: "flex", transform: "scale(0.7)" }}><IcoArrow /></span> {formatTime(session.endingDatetime)}</span>
        {session.endingDatetime && <span style={{display:"flex",alignItems:"center",gap:4}}><GIcon src={GI.hourglass} filter={GI_FILTER.greyLight} size={16} title="Durée"/>{formatDuration(session.startingDatetime, session.endingDatetime)}</span>}
      </div>

      {session.presentMemberIds?.length > 0 && (() => {
        const members = session.presentMemberIds.map(id => {
          const snap = session.memberSnapshot?.[id];
          const pseudo = snap ? (typeof snap === "string" ? snap : snap.pseudo) : id;
          const charIcon = snap && typeof snap !== "string" ? snap.charIcon : null;
          const activeCharacter = snap && typeof snap !== "string" ? snap.activeCharacter : null;
          return { id, pseudo, charIcon, activeCharacter };
        });
        const sorted = [...members].sort((a, b) => (mvpScoreById[b.id] ?? 0) - (mvpScoreById[a.id] ?? 0));
        return (
          <div className="flex flex-wrap items-end gap-2">
            {sorted.map(m => {
              const isMvp = mvpName && m.pseudo === mvpName;
              const titles = titlesByMemberId[m.id] ?? [];
              return (
                <fieldset key={m.id} style={{
                  background: "rgba(168,216,234,0.04)",
                  border: `1px solid ${isMvp ? "rgba(234,179,8,0.25)" : "var(--c-border)"}`,
                  borderRadius: 8,
                  padding: "4px 12px 6px",
                  ...(titles.length === 0 ? { marginTop: 7 } : {}),
                }}>
                  {titles.length > 0 && (
                    <legend style={{ padding: "0 4px", margin: "0 auto", display: "flex", alignItems: "center", gap: 4 }}>
                      {titles.map((tKey, j) => {
                        const def = TITLE_BY_KEY[tKey];
                        return def ? <GIcon key={j} src={def.src} filter={def.filter} size={18} title={t(`title_${tKey}`)} /> : null;
                      })}
                    </legend>
                  )}
                  <div className="flex items-center gap-1.5">
                    {isMvp && <GIcon src={GI.crown} filter={GI_FILTER.yellow} size={20} title={t("title_mvp")} />}
                    <div className="flex flex-col">
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.8rem", color: isMvp ? "#fdd835" : "var(--c-text)" }}>{m.pseudo}</span>
                      {m.activeCharacter && <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", color: "var(--c-muted)" }}>{m.activeCharacter}</span>}
                    </div>
                  </div>
                </fieldset>
              );
            })}
          </div>
        );
      })()}

      {session.scenarios?.filter(s => s.number !== "").length > 0 && (
        <div>
          <span className="sect-label">{t("last_played")}</span>
          <div className="flex flex-col gap-2 mt-2">
            {session.scenarios.filter(s => s.number !== "").map((s, i) => (
              <ScenarioRow key={i} s={s} session={session} company={company} />
            ))}
          </div>
        </div>
      )}

      {session.unlockedScenarios?.length > 0 && (
        <div>
          <span className="sect-label">{t("last_unlocked")}</span>
          <div className="flex flex-col gap-2 mt-2">
            {session.unlockedScenarios.map((s, i) => (
              <div key={i} className="frost-inner px-3 py-2 flex flex-col gap-0.5">
                <span style={{ color: "var(--c-ice)", fontFamily: "'Cinzel', serif", fontSize: "0.8rem" }}>{t("lbl_scenario", { n: s.number })}</span>
                {s.note && <span className="text-xs" style={{ color: "var(--c-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{s.note}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LastSessionPage() {
  const showToast = useToast();
  const { company } = useCompany();
  const t = useT();
  const { formatDate, formatTime } = useDateFormatters();

  const [pastSessions, setPastSessions] = useState(() => {
    try { return JSON.parse(storage.getItem(KEYS.pastSessions) ?? "[]"); } catch { return []; }
  });

  // Sessions du plus ancien au plus récent (index max = dernière)
  const allSessions = [...pastSessions];

  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, pastSessions.length - 1));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const currentSession = allSessions[selectedIndex] ?? null;

  function handleDelete() {
    const pastIdx = selectedIndex;
    const updated = pastSessions.filter((_, i) => i !== pastIdx);
    storage.setItem(KEYS.pastSessions, JSON.stringify(updated));
    setPastSessions(updated);
    setSelectedIndex(Math.max(0, updated.length - 1));
    setConfirmDelete(false);
    showToast(t("last_deleted"), "warning");
  }

  const total = allSessions.length;

  return (
    <div className="h-screen flex items-stretch justify-between overflow-hidden">
      <div style={{ width: 65, flexShrink: 0 }} />

      <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">

          {total > 0 && (
            <div className="frost-block px-4 py-2 flex items-center gap-3">
              <button onClick={() => { setSelectedIndex(i => Math.max(0, i - 1)); setConfirmDelete(false); }}
                disabled={selectedIndex === 0}
                title={t("last_prev")}
                className="btn-ghost-sm w-8 h-8 rounded-full disabled:opacity-30"><span style={{ transform: "rotate(180deg)", display: "flex" }}><IcoArrow /></span></button>

              {/* Sélecteur rapide */}
              <div className="relative flex-1 text-center">
                <button onClick={() => setShowPicker(p => !p)}
                  className="text-sm w-full text-center"
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-muted)" }}>
                  {t("last_session_n", { n: selectedIndex + 1, total })}
                  {selectedIndex === total - 1 && <span className="ml-2 badge-victory">{t("last_last_badge")}</span>}
                  <span className="ml-1" style={{ color: "var(--c-muted)", fontSize: "0.7rem" }}>▾</span>
                </button>
                {showPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 frost-block py-1 scrollbar-hide"
                    style={{ maxHeight: 260, overflowY: "auto" }}>
                    {[...allSessions].reverse().map((s, reversedI) => { const i = allSessions.length - 1 - reversedI; return (
                      <button key={i}
                        onClick={() => { setSelectedIndex(i); setShowPicker(false); setConfirmDelete(false); }}
                        className="w-full text-left px-4 py-2 text-xs transition-colors"
                        style={{
                          background: i === selectedIndex ? "rgba(168,216,234,0.08)" : "none",
                          border: "none", cursor: "pointer",
                          color: i === selectedIndex ? "var(--c-ice)" : "var(--c-text)",
                          fontFamily: "'Cinzel', serif",
                        }}>
                        {`${formatDate(s.startingDatetime)} — ${formatTime(s.startingDatetime)}`}
                        {i === allSessions.length - 1 && <span className="ml-2" style={{ color: "var(--c-ice-dim)", fontSize: "0.6rem" }}>{t("last_last_badge").toUpperCase()}</span>}
                      </button>
                    )})
                  }</div>
                )}
              </div>

              <button onClick={() => { setSelectedIndex(i => Math.min(total - 1, i + 1)); setConfirmDelete(false); }}
                disabled={selectedIndex === total - 1}
                title={t("last_next")}
                className="btn-ghost-sm w-8 h-8 rounded-full disabled:opacity-30"><IcoArrow /></button>
            </div>
          )}

          <div className="frost-block p-6">
            <div className="flex items-start justify-between mb-6">
              <h2 className="title-rune" style={{ fontSize: "1.25rem" }}>
                {total === 0 ? t("last_title")
                  : selectedIndex === total - 1 ? t("last_last_title")
                  : t("last_session_date", { date: formatDate(currentSession?.startingDatetime) })}
              </h2>
              {currentSession && !confirmDelete && (
                <button onClick={() => setConfirmDelete(true)} className="text-xs"
                  style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer", textDecoration: "underline" }}>
                  {t("last_delete")}
                </button>
              )}
              {confirmDelete && (
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: "var(--c-muted)" }}>{t("last_confirm_delete")}</span>
                  <button onClick={handleDelete} className="btn-frost btn-danger" style={{ padding: "3px 10px", fontSize: "0.8rem" }}>{t("btn_yes")}</button>
                  <button onClick={() => setConfirmDelete(false)} className="btn-frost btn-cancel" style={{ padding: "3px 10px", fontSize: "0.8rem" }}>{t("btn_no")}</button>
                </div>
              )}
            </div>
            <SessionView session={currentSession} company={company} />
          </div>

        </div>
      </div>

      <div className="flex-shrink-0 flex items-center">
        <NavPill to="/" icon={<IcoHome />} label={t("nav_menu")} side="right" />
      </div>
    </div>
  );
}

export default LastSessionPage;
