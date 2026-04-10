import { useState, useRef, useEffect } from "react";
import { useProgress } from "../../context/ProgressContext";
import { IcoPencil, IcoCheck, IcoUndo, IcoBlock, IcoStar, IcoLink } from "../ui/Icons";
import { useT } from "../../context/LanguageContext";

function normalizeUB(ub) {
  if (!ub) return null;
  if (typeof ub === "number") return { type: "scenario", value: ub };
  return ub;
}

function MiniScenarioRow({ scenario }) {
  const t = useT();
  const isFinished = scenario.finishedAt !== null;
  const isBlocked  = !!scenario.blockedAt;
  return (
    <div className="flex items-start gap-2 px-2 py-1 rounded">
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1.5">
          {isFinished && <span style={{ color: "var(--c-muted)", display: "inline-flex" }}><IcoCheck /></span>}
          {isBlocked  && <span style={{ color: "var(--c-muted)", display: "inline-flex" }}><IcoBlock /></span>}
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.78rem", flexShrink: 0, color: "var(--c-ice-light)" }}>
            {t("lbl_scenario", { n: scenario.number })}
          </span>
        </div>
        {scenario.note && (
          <span style={{ fontSize: "0.72rem", color: "var(--c-muted)" }}>
            {scenario.note}
          </span>
        )}
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, onEdit }) {
  const { scenarios, markAsFinished, unmarkAsFinished, blockScenario, unblockScenario, togglePriority } = useProgress();
  const t = useT();
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showChain, setShowChain] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [blockError, setBlockError] = useState(null);

  const ubNorm = normalizeUB(scenario.unlockedBy);
  const parent   = ubNorm?.type === "scenario" ? scenarios.find(s => s.number === ubNorm.value) : null;
  const children = scenarios.filter(s => { const cub = normalizeUB(s.unlockedBy); return cub?.type === "scenario" && cub?.value === scenario.number; });
  const siblings = ubNorm?.type === "scenario" ? scenarios.filter(s => { const sub = normalizeUB(s.unlockedBy); return sub?.type === "scenario" && sub?.value === ubNorm.value && s.id !== scenario.id; }) : [];
  const hasScenarioChain = !!parent || children.length > 0 || siblings.length > 0;
  const hasNonScenarioSource = ubNorm && ubNorm.type !== "scenario";
  const showLinkBtn = hasScenarioChain || hasNonScenarioSource;

  const UB_LABELS = {
    quete: t("form_source_quest"),
    evenement: t("form_source_event"),
    section: t("lbl_ub_section"),
  };

  const noteRef = useRef(null);

  useEffect(() => {
    if (noteRef.current) {
      setIsTruncated(noteRef.current.scrollWidth > noteRef.current.clientWidth);
    }
  }, [scenario.note]);

  const isFinished = scenario.finishedAt !== null;
  const isBlocked  = !!scenario.blockedAt;
  const isPriority = !!scenario.priority;

  const date = isBlocked
    ? new Date(scenario.blockedAt).toLocaleDateString("fr-FR")
    : isFinished
    ? new Date(scenario.finishedAt).toLocaleDateString("fr-FR")
    : new Date(scenario.unlockedAt).toLocaleDateString("fr-FR");

  return (
    <div className="flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Chronologie au-dessus */}
      {showChain && (parent || siblings.length > 0 || hasNonScenarioSource) && (
        <>
          <div style={{ marginLeft: 44, paddingLeft: 12, borderLeft: "1px solid var(--c-border)", marginTop: 6 }}>
            {/* Source non-scénario */}
            {hasNonScenarioSource && (
              <>
                <span style={{ display: "block", fontSize: "0.6rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.12em", color: "var(--c-muted)", textTransform: "uppercase", padding: "4px 2px 2px" }}>
                  {t("card_unlocked_by")}
                </span>
                <div className="flex flex-col px-2 py-1" style={{ gap: 2 }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--c-ice-light)", fontFamily: "'Cinzel', serif" }}>
                    {UB_LABELS[ubNorm.type] ?? ubNorm.type}{ubNorm.value ? (ubNorm.type === "section" ? ` ${ubNorm.value}` : ` · ${ubNorm.value}`) : ""}
                  </span>
                  {ubNorm.type === "quete" && ubNorm.playerName && (
                    <span style={{ fontSize: "0.7rem", color: "var(--c-muted)", fontStyle: "italic" }}>
                      {t("card_player", { name: ubNorm.playerName })}
                    </span>
                  )}
                  {ubNorm.type === "evenement" && ubNorm.description && (
                    <span style={{ fontSize: "0.78rem", color: "var(--c-ice-dim)", fontStyle: "italic" }}>
                      {ubNorm.description}
                    </span>
                  )}
                  {ubNorm.type === "section" && ubNorm.sectionReason && (
                    <span style={{ fontSize: "0.78rem", color: "var(--c-dim)", fontStyle: "italic" }}>
                      {ubNorm.sectionReason}{ubNorm.sectionReasonDetail ? ` · ${ubNorm.sectionReasonDetail}` : ""}
                    </span>
                  )}
                  {ubNorm.type === "section" && ubNorm.sectionContext && (
                    <span style={{ fontSize: "0.72rem", color: "var(--c-muted)" }}>
                      {ubNorm.sectionContext}
                    </span>
                  )}
                </div>
              </>
            )}
            {/* Parent scénario */}
            {parent && (
              <>
                <span style={{ display: "block", fontSize: "0.6rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.12em", color: "var(--c-muted)", textTransform: "uppercase", padding: "4px 2px 2px" }}>
                  {t("card_unlocked_by")}
                </span>
                <MiniScenarioRow scenario={parent} />
              </>
            )}
            {siblings.length > 0 && (
              <>
                <span style={{ display: "block", fontSize: "0.6rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.12em", color: "var(--c-muted)", textTransform: "uppercase", padding: "6px 2px 2px" }}>
                  {t("card_unlocked_same_time")}
                </span>
                {siblings.map(s => <MiniScenarioRow key={s.id} scenario={s} />)}
              </>
            )}
          </div>
          <div style={{ marginLeft: 44, height: 6, borderLeft: "1px solid var(--c-border)" }} />
        </>
      )}

      <div className={`flex ${expanded ? "items-start" : "items-center"} gap-3 px-3 py-2 rounded-lg`}
        style={{
          borderLeft: isPriority ? "2px solid var(--c-ice-dim)" : "2px solid transparent",
          background: hovered || showChain ? "rgba(168,216,234,0.04)" : "transparent",
          transition: "background 0.15s",
        }}>

        {/* Étoile priorité / placeholder */}
        {!isFinished && !isBlocked ? (
          <button onClick={() => togglePriority(scenario.id)}
            title={isPriority ? t("card_priority_remove") : t("card_priority_add")}
            style={{ background: "none", border: "none", cursor: "pointer", color: isPriority ? "var(--c-ice)" : "var(--c-dim)", padding: 0, flexShrink: 0, display: "flex", transform: "scale(0.75)" }}>
            <IcoStar filled={isPriority} />
          </button>
        ) : (
          <div style={{ width: 14, flexShrink: 0 }} />
        )}

        {/* Numéro */}
        <span style={{
          fontFamily: "'Cinzel', serif", fontSize: "0.9rem", minWidth: 26, flexShrink: 0,
          color: isFinished || isBlocked ? "var(--c-muted)" : "var(--c-ice-light)",
        }}>
          {scenario.number}
        </span>

        {/* Note */}
        <span
          ref={noteRef}
          onClick={(isTruncated || expanded) && scenario.note ? () => setExpanded(e => !e) : undefined}
          style={{
            flex: 1, color: scenario.note ? "var(--c-muted)" : "var(--c-dim)", fontSize: "0.82rem",
            overflow: "hidden", textOverflow: expanded ? "unset" : "ellipsis",
            whiteSpace: expanded ? "normal" : "nowrap",
            fontStyle: !scenario.note ? "italic" : "normal",
            cursor: (isTruncated || expanded) && scenario.note ? "pointer" : "default",
            wordBreak: expanded ? "break-word" : "normal",
          }}>
          {scenario.note || t("card_no_note")}
        </span>

        {/* Bouton chronologie */}
        {showLinkBtn && (
          <button onClick={() => setShowChain(v => !v)}
            className="btn-ghost-sm flex-shrink-0"
            title={t("card_links")}
            style={{ color: showChain ? "var(--c-ice-dim)" : "var(--c-dim)" }}>
            <IcoLink />
          </button>
        )}

        {/* Date */}
        <span style={{
          fontSize: "0.67rem", color: "var(--c-dim)", flexShrink: 0,
          fontFamily: "'Cinzel', serif", letterSpacing: "0.03em",
        }}>
          {date}
        </span>

        {/* Actions */}
        <div className="flex gap-1 flex-shrink-0">
          {!isBlocked ? (
            <>
              <button onClick={() => onEdit(scenario)} className="btn-ghost-sm" title={t("btn_edit")}><IcoPencil /></button>
              {!isFinished ? (
                <>
                  <button onClick={() => markAsFinished(scenario.id)} className="btn-ghost-sm" title={t("card_mark_done")} style={{ color: "var(--c-ice-dim)" }}><IcoCheck /></button>
                  <button onClick={() => { try { blockScenario(scenario.id); setBlockError(null); } catch(e) { setBlockError(e.message); } }} className="btn-ghost-sm" title={t("card_block")}><IcoBlock /></button>
                </>
              ) : (
                <button onClick={() => unmarkAsFinished(scenario.id)} className="btn-ghost-sm" title={t("card_resume")}><IcoUndo /></button>
              )}
            </>
          ) : hovered ? (
            <>
              <button onClick={() => onEdit(scenario)} className="btn-ghost-sm" title={t("btn_edit")}><IcoPencil /></button>
              <button onClick={() => unblockScenario(scenario.id)} className="btn-ghost-sm" title={t("btn_unlock")} style={{ color: "var(--c-ice-dim)" }}><IcoUndo /></button>
            </>
          ) : <div style={{ width: 52 }} />}
        </div>
      </div>

      {/* Enfants (chronologie en-dessous) */}
      {showChain && children.length > 0 && (
        <>
          <div style={{ marginLeft: 44, height: 6, borderLeft: "1px solid var(--c-border)" }} />
          <div style={{ marginLeft: 44, paddingLeft: 12, borderLeft: "1px solid var(--c-border)", marginBottom: 6 }}>
            <span style={{ display: "block", fontSize: "0.6rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.12em", color: "var(--c-muted)", textTransform: "uppercase", padding: "4px 2px 2px" }}>
              {t("card_has_unlocked")}
            </span>
            {children.map(child => (
              <MiniScenarioRow key={child.id} scenario={child} />
            ))}
          </div>
        </>
      )}

      {blockError && <div className="error-frost text-xs mx-3 mb-1">{blockError}</div>}
    </div>
  );
}

export default ScenarioCard;
