import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { useProgress } from "../context/ProgressContext";
import { useCompany } from "../context/CompanyContext";
import { GI, GI_FILTER, GIcon } from "../utils/gameIcons.jsx";
import { TITLE_BY_KEY } from "../utils/titles.jsx";
import { NavPill, NavPillSession } from "../components/layout/NavPill";
import { IcoHome } from "../components/ui/Icons";
import { useToast } from "../context/ToastContext";
import { killScore, computeMVP, computeMVPScores } from "../utils/statUtils";
import { useHoldButton } from "../hooks/useHoldButton";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";
import { useT, useLanguage } from "../context/LanguageContext";

import { IcoCheck, IcoX, IcoTrash, IcoEye, IcoUndo, IcoRedo } from "../components/ui/Icons";
import Modal from "../components/ui/Modal";

// ── Configs ───────────────────────────────────────────────────────────────────
const STAT_CONFIG = {
  damageDealt: { label: "Infligés",  iconSrc: () => GI.swords,      iconFilter: GI_FILTER.red,       color: "#e57373", bg: "rgba(229,115,115,0.08)", border: "rgba(229,115,115,0.3)", rgb: "229,115,115" },
  damageTaken: { label: "Subis",     iconSrc: () => GI.shieldImpact,iconFilter: GI_FILTER.blue,       color: "#64b5f6", bg: "rgba(100,181,246,0.08)", border: "rgba(100,181,246,0.3)", rgb: "100,181,246" },
  healingDone: { label: "Soins",     iconSrc: () => GI.heart,       iconFilter: GI_FILTER.pink,      color: "#81c784", bg: "rgba(129,199,132,0.08)", border: "rgba(129,199,132,0.3)", rgb: "129,199,132" },
};
const KILL_CONFIG = {
  normal: { label: "Normaux", color: "#c8d8e0", bg: "rgba(200,216,224,0.06)", border: "rgba(200,216,224,0.2)", rgb: "200,216,224", iconSrc: () => GI.skull,      iconFilter: GI_FILTER.white,  iconSize: 16 },
  elite:  { label: "Élites",  color: "#ffd54f", bg: "rgba(255,213,79,0.06)",  border: "rgba(255,213,79,0.2)",  rgb: "255,213,79",  iconSrc: () => GI.dreadSkull, iconFilter: GI_FILTER.yellow, iconSize: 16 },
  boss:   { label: "Boss",    color: "#e57373", bg: "rgba(229,115,115,0.06)", border: "rgba(229,115,115,0.2)", rgb: "229,115,115", iconSrc: () => GI.crownSkull, iconFilter: GI_FILTER.red,    iconSize: 16 },
};

const RULES_KEY = KEYS.combatRules;
const RULES_DEFAULT_FR = `Ces règles sont indicatives, à chaque groupe de décider.

Nos règles :
• Les dégâts entre alliés et les dégâts infligés à soi-même ne comptent pas.
• Tout ce qu'inflige, subit ou soigne une invocation compte pour son invocateur.
• Dégâts infligés : APRÈS réduction par la valeur du bouclier ennemi. On ne compte que les dégâts effectivement encaissés (pas les dégâts en excès au-delà des PV restants de l'ennemi). Si un ennemi est exécuté via une action "tuez un ennemi", on prend en compte les PV qu'il lui restait à ce moment-là.
• Dégâts subis : AVANT réduction par sa valeur de bouclier (pour que les tanks soient mis en valeur).
• TOUTES les sources de dégâts infligés et subis (sauf par un allié ou par soi-même) sont prises en compte (ex. riposte, blessure, piège...).
• Les objectifs qui doivent être détruits ou tués comptent comme des monstres d'élites pour le compteur de kills.`;

const RULES_DEFAULT_EN = `These rules are guidelines — each group decides for themselves.

Our rules:
• Damage between allies and self-inflicted damage don't count.
• Everything an summon deals, takes, or heals counts for its summoner.
• Damage dealt: AFTER reduction by the enemy's shield value. Only damage actually absorbed counts (not excess damage beyond the enemy's remaining HP). If an enemy is killed by a "kill an enemy" action, count the HP it had left at that moment.
• Damage taken: BEFORE reduction by your own shield value (to highlight tanks).
• ALL sources of damage dealt and taken (except from an ally or yourself) count (e.g. retaliate, wound, trap...).
• Objectives that must be destroyed or killed count as elite monsters for the kill counter.`;

function loadRules(lang) {
  return storage.getItem(RULES_KEY) ?? (lang === "en" ? RULES_DEFAULT_EN : RULES_DEFAULT_FR);
}
function saveRules(text) {
  storage.setItem(RULES_KEY, text);
}

// ── Édition règles (setup) ─────────────────────────────────────────────────────
function RulesEditor({ rules, onSave }) {
  const t = useT();
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(rules);
  const textareaRef = useRef(null);

  function handleOpen() { setDraft(rules); setOpen(true); }
  function handleSave() { onSave(draft); setOpen(false); }
  function handleReset() { setDraft(lang === "en" ? RULES_DEFAULT_EN : RULES_DEFAULT_FR); }

  useEffect(() => {
    if (open && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [open]);

  if (!open) {
    return (
      <button onClick={handleOpen} className="btn-frost btn-cancel" style={{ fontSize: "0.8rem", padding: "5px 12px" }}>
        {t("combat_define_rules")}
      </button>
    );
  }

  return (
    <Modal onClose={() => setOpen(false)}>
      <div className="flex flex-col gap-4 max-h-[80vh] overflow-y-auto scrollbar-hide">
        <h3 className="title-rune" style={{ fontSize: "1rem" }}>{t("combat_rules_title")}</h3>
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={e => { setDraft(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
          className="textarea-frost w-full scrollbar-hide"
          style={{ fontSize: "0.8rem", lineHeight: 1.65, resize: "none", minHeight: 120, maxHeight: "55vh", overflowY: "auto" }}
        />
        <div className="flex items-center justify-between gap-2">
          <button onClick={handleReset}
            className="text-xs underline"
            style={{ background: "none", border: "none", color: "var(--c-muted)", cursor: "pointer" }}>
            {t("combat_rules_default")}
          </button>
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="btn-frost btn-cancel" style={{ fontSize: "0.8rem", padding: "4px 12px" }}>{t("btn_cancel")}</button>
            <button onClick={handleSave} className="btn-frost btn-save" style={{ fontSize: "0.8rem", padding: "4px 12px" }}>{t("btn_save")}</button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── Tooltip règles — fixed, ne déplace rien ───────────────────────────────────
function RulesButton({ rules }) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const tooltipRef = useRef(null);

  function handleMouseEnter() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setVisible(true);
  }

  function handleWheel(e) {
    if (tooltipRef.current) {
      tooltipRef.current.scrollTop += e.deltaY;
      e.preventDefault();
    }
  }

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={() => setVisible(false)} onWheel={handleWheel}>
      <button ref={btnRef}
        className="text-xs px-2.5 py-1 rounded"
        style={{
          background: visible ? "rgba(168,216,234,0.08)" : "none",
          border: "1px solid var(--c-border)",
          color: visible ? "var(--c-ice-dim)" : "var(--c-muted)",
          cursor: "default",
          fontFamily: "'Cinzel', serif",
          letterSpacing: "0.06em",
        }}>
        {t("lbl_rules")}
      </button>
      {visible && (
        <div ref={tooltipRef} style={{
          position: "fixed",
          top: pos.top,
          right: pos.right,
          zIndex: 9999,
          width: 420,
          maxHeight: "60vh",
          overflowY: "auto",
          pointerEvents: "none",
        }}
          className="frost-block p-4 scrollbar-hide">
          <p className="whitespace-pre-wrap" style={{ color: "var(--c-muted)", fontSize: "0.78rem", lineHeight: 1.65 }}>
            {rules}
          </p>
        </div>
      )}
    </div>
  );
}


// ── StatRow — en ligne, icônes à la place de + et +5 ─────────────────────────
function StatRow({ statKey, value, onAdjust, readOnly, isLeader, onBeforeAdjust, onInteractionEnd, badge, onFinalize }) {
  const cfg = STAT_CONFIG[statKey];
  const t = useT();
  const statLabel = { damageDealt: t("combat_damage_dealt"), damageTaken: t("combat_damage_taken"), healingDone: t("combat_healing") }[statKey] ?? cfg.label;
  const [flash, setFlash] = useState(null);
  const [holdingPlus, setHoldingPlus] = useState(false);

  function fire(delta, type) {
    if (readOnly) return;
    onAdjust(delta);
    setFlash(type);
    setTimeout(() => setFlash(null), type === "plus5" ? 350 : 220);
  }

  const holdMinusBase = useHoldButton(() => fire(-1, "minus"));
  const holdMinus = {
    ...holdMinusBase,
    onMouseDown: (e) => { onBeforeAdjust?.(); holdMinusBase.onMouseDown(e); },
    onMouseUp:   (e) => { holdMinusBase.onMouseUp(e); onInteractionEnd?.(); },
    onMouseLeave:(e) => { holdMinusBase.onMouseLeave(e); onInteractionEnd?.(); },
    onTouchStart:(e) => { onBeforeAdjust?.(); holdMinusBase.onTouchStart(e); },
    onTouchEnd:  (e) => { holdMinusBase.onTouchEnd(e); onInteractionEnd?.(); },
  };
  const holdPlusBase = useHoldButton(() => fire(1, "plus1"));
  const holdPlus = {
    ...holdPlusBase,
    onMouseDown: (e) => { onBeforeAdjust?.(); setHoldingPlus(true); holdPlusBase.onMouseDown(e); },
    onMouseUp:   (e) => { setHoldingPlus(false); holdPlusBase.onMouseUp(e); onInteractionEnd?.(); },
    onMouseLeave:(e) => { setHoldingPlus(false); holdPlusBase.onMouseLeave(e); onInteractionEnd?.(); },
    onTouchStart:(e) => { onBeforeAdjust?.(); setHoldingPlus(true); holdPlusBase.onTouchStart(e); },
    onTouchEnd:  (e) => { setHoldingPlus(false); holdPlusBase.onTouchEnd(e); onInteractionEnd?.(); },
  };

  const showLeader = isLeader && value > 0;

  const R = 13, C = 82;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{
        position: "relative",
        background: cfg.bg,
        border: `1px solid ${showLeader ? cfg.color : cfg.border}`,
        boxShadow: showLeader ? `0 0 6px rgba(${cfg.rgb},0.25)` : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
      }}>
      {badge && (
        <span key={badge.actionKey} onClick={onFinalize} style={{
          position: "absolute", top: -12, right: -12, zIndex: 10,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: R * 2 + 4, height: R * 2 + 4, cursor: "pointer",
        }}>
          <svg width={R * 2 + 4} height={R * 2 + 4} style={{ position: "absolute", top: 0, left: 0 }}>
            <circle cx={R + 2} cy={R + 2} r={R} fill="none"
              stroke={cfg.color} strokeWidth={1.5} opacity={0.55} strokeDasharray={C}
              style={{ strokeDashoffset: 0, animation: `consume-ring ${GROUP_TIMEOUT_MS}ms linear forwards`, transform: `rotate(-90deg)`, transformOrigin: `${R + 2}px ${R + 2}px` }} />
          </svg>
          <span style={{
            background: cfg.color, color: "#0a1220", borderRadius: "50%",
            fontSize: "0.5rem", fontWeight: "bold", fontFamily: "'Cinzel', serif", lineHeight: 1,
            width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", boxShadow: "0 0 4px rgba(0,0,0,0.4)", position: "relative", zIndex: 1,
          }}>
            {badge.delta > 0 ? `+${badge.delta}` : badge.delta}
          </span>
        </span>
      )}
      <span className="flex-shrink-0"><GIcon src={cfg.iconSrc()} filter={cfg.iconFilter} size={16} title={statLabel} /></span>
      <span className="text-sm flex-1" style={{ color: cfg.color }}>{statLabel}</span>
      <span className="font-bold tabular-nums"
        style={{
          color: cfg.color,
          fontFamily: "'Cinzel', serif",
          fontSize: flash === "plus5" ? "1.15rem" : flash ? "1.1rem" : "1rem",
          display: "inline-block",
          minWidth: 32,
          textAlign: "center",
          transform: flash === "plus5" ? "scale(1.5) translateY(-3px)" : flash === "plus1" ? "scale(1.25)" : "scale(1)",
          textShadow: flash === "plus5" ? `0 0 12px ${cfg.color}, 0 0 24px ${cfg.color}` : flash === "plus1" ? `0 0 6px ${cfg.color}` : showLeader ? `0 0 8px rgba(${cfg.rgb},0.6)` : "none",
          transition: flash === "plus5" ? "all 0.2s cubic-bezier(0.34,1.56,0.64,1)" : "all 0.12s ease",
        }}>
        {value}
      </span>
      {!readOnly && (
        <div className="flex items-center gap-1">
          <button type="button" {...holdMinus}
            className="w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center"
            style={{ background: "rgba(168,216,234,0.04)", border: "1px solid var(--c-border)", color: "var(--c-dim)", cursor: "pointer", userSelect: "none" }}>
            −
          </button>
          <button type="button" {...holdPlus}
            className="w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center"
            style={{
              "--ring-color": `rgba(${cfg.rgb},0.45)`,
              background: flash === "plus1" ? cfg.color : cfg.bg,
              border: `1px solid ${cfg.border}`,
              color: flash === "plus1" ? "#0a1220" : cfg.color,
              cursor: "pointer",
              transform: flash === "plus1" ? "scale(1.3)" : "scale(1)",
              boxShadow: flash === "plus1" ? `0 0 8px ${cfg.color}` : "none",
              animation: holdingPlus && !flash ? "hold-ring 400ms ease-out forwards" : "none",
              transition: "all 0.12s ease",
              userSelect: "none",
            }}>
            +
          </button>
          <button type="button" onClick={() => { onBeforeAdjust?.(); fire(5, "plus5"); onInteractionEnd?.(); }}
            className="flex items-center justify-center font-bold transition-all"
            style={{
              background: flash === "plus5" ? cfg.color : `rgba(${cfg.rgb},0.25)`,
              border: `1px solid ${cfg.color}`,
              color: flash === "plus5" ? "#0a1220" : cfg.color,
              cursor: "pointer",
              transform: flash === "plus5" ? "scale(1.25)" : "scale(1)",
              boxShadow: flash === "plus5" ? `0 0 14px ${cfg.color}, 0 0 28px rgba(${cfg.rgb},0.4)` : "none",
              transition: flash === "plus5" ? "all 0.15s cubic-bezier(0.34,1.56,0.64,1)" : "all 0.12s ease",
              userSelect: "none",
              borderRadius: "6px",
              width: 32, height: 28, fontSize: "1rem", fontWeight: 600,
            }}>
            +5
          </button>
        </div>
      )}
    </div>
  );
}

// ── KillRow ───────────────────────────────────────────────────────────────────
function KillRow({ killKey, value, onAdjust, readOnly, onBeforeAdjust, onInteractionEnd, badge, onFinalize }) {
  const cfg = KILL_CONFIG[killKey];
  const t = useT();
  const killLabel = { normal: t("combat_kills_normal"), elite: t("combat_kills_elite"), boss: t("combat_kills_boss") }[killKey] ?? cfg.label;
  const [flash, setFlash] = useState(false);

  function fire(delta) {
    if (readOnly) return;
    onAdjust(delta);
    if (delta > 0) { setFlash(true); setTimeout(() => setFlash(false), 220); }
  }

  const R = 13, C = 82;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{
        position: "relative",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        transition: "border-color 0.3s",
      }}>
      {badge && (
        <span key={badge.actionKey} onClick={onFinalize} style={{
          position: "absolute", top: -12, right: -12, zIndex: 10,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: R * 2 + 4, height: R * 2 + 4, cursor: "pointer",
        }}>
          <svg width={R * 2 + 4} height={R * 2 + 4} style={{ position: "absolute", top: 0, left: 0 }}>
            <circle cx={R + 2} cy={R + 2} r={R} fill="none"
              stroke={cfg.color} strokeWidth={1.5} opacity={0.55} strokeDasharray={C}
              style={{ strokeDashoffset: 0, animation: `consume-ring ${GROUP_TIMEOUT_MS}ms linear forwards`, transform: `rotate(-90deg)`, transformOrigin: `${R + 2}px ${R + 2}px` }} />
          </svg>
          <span style={{
            background: cfg.color, color: "#0a1220", borderRadius: "50%",
            fontSize: "0.5rem", fontWeight: "bold", fontFamily: "'Cinzel', serif", lineHeight: 1,
            width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", boxShadow: "0 0 4px rgba(0,0,0,0.4)", position: "relative", zIndex: 1,
          }}>
            {badge.delta > 0 ? `+${badge.delta}` : badge.delta}
          </span>
        </span>
      )}
      <span className="flex-shrink-0" style={{ width: 16, display: "inline-flex", justifyContent: "center" }}><GIcon src={cfg.iconSrc()} filter={cfg.iconFilter} size={cfg.iconSize ?? 16} title={killLabel} /></span>
      <span className="text-sm flex-1" style={{ color: cfg.color }}>{killLabel}</span>
      <span className="text-base font-bold w-8 text-center tabular-nums"
        style={{
          color: cfg.color,
          fontFamily: "'Cinzel', serif",
          display: "inline-block",
          transform: flash ? "scale(1.3)" : "scale(1)",
          transition: "transform 0.12s ease",
        }}>
        {value}
      </span>
      {!readOnly && (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => { onBeforeAdjust?.(); fire(-1); onInteractionEnd?.(); }}
            className="w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center"
            style={{ background: "rgba(168,216,234,0.04)", border: "1px solid var(--c-border)", color: "var(--c-dim)", cursor: "pointer" }}>−</button>
          <button type="button" onClick={() => { onBeforeAdjust?.(); fire(1); onInteractionEnd?.(); }}
            className="w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center transition-all"
            style={{
              background: flash ? cfg.color : "rgba(168,216,234,0.06)",
              border: `1px solid ${flash ? cfg.color : "var(--c-border)"}`,
              color: flash ? "#0a1220" : "var(--c-muted)",
              cursor: "pointer",
              transform: flash ? "scale(1.2)" : "scale(1)",
              transition: "all 0.12s ease",
            }}>+</button>
        </div>
      )}
    </div>
  );
}

// ── Tooltip raccourcis clavier ─────────────────────────────────────────────────
function UndoButton({ onUndo, disabled, undoStack, currentAction, playerNames }) {
  const t = useT();
  const ACTION_LABELS = {
    damageDealt: t("combat_damage_dealt"),
    damageTaken: t("combat_damage_taken"),
    healingDone: t("combat_healing"),
    kill_normal: t("combat_kills_normal"),
    kill_elite:  t("combat_kills_elite"),
    kill_boss:   t("combat_kills_boss"),
  };
  const [flash, setFlash] = useState(false);
  const [hovering, setHovering] = useState(false);
  const btnRef = useRef(null);
  const tooltipRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  function handleClick() {
    if (disabled && !currentAction) return;
    onUndo();
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  }

  function handleMouseEnter() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, left: r.left + r.width / 2 });
    }
    setHovering(true);
  }

  function handleWheel(e) {
    if (tooltipRef.current) {
      e.preventDefault();
      tooltipRef.current.scrollTop += e.deltaY;
    }
  }

  const hasAnything = !!currentAction || undoStack.length > 0;
  const history = [
    ...undoStack.map(e => e.action),
    ...(currentAction ? [{ ...currentAction, isCurrent: true }] : []),
  ].reverse();

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={() => setHovering(false)} onWheel={handleWheel} className="flex items-center" style={{ position: "relative" }}>
      <button ref={btnRef} onClick={handleClick} disabled={!hasAnything}
        className="btn-ghost-sm" title={t("shortcut_undo")}
        style={{
          opacity: hasAnything ? 1 : 0.25,
          cursor: hasAnything ? "pointer" : "not-allowed",
          color: hasAnything ? "var(--c-ice)" : undefined,
          filter: hasAnything ? "drop-shadow(0 0 4px rgba(168,216,234,0.5))" : undefined,
          transform: flash ? "scale(1.3)" : "scale(1)",
          transition: flash ? "transform 0.07s cubic-bezier(0.34,1.56,0.64,1)" : "transform 0.1s ease",
        }}>
        <span style={{ transform: "scale(1.5)", display: "inline-flex" }}><IcoUndo /></span>
      </button>
      {hovering && hasAnything && (
        <div ref={tooltipRef} style={{
          position: "fixed", top: pos.top, left: pos.left, transform: "translateX(-50%)",
          zIndex: 9999, minWidth: 230, pointerEvents: "none",
          maxHeight: "60vh", overflowY: "auto",
        }} className="frost-block p-3 scrollbar-hide">
          <p className="sect-label" style={{ marginBottom: 8, fontSize: "0.65rem" }}>{t("stats_history")}</p>
          <div className="flex flex-col gap-1.5">
            {history.map((a, i) => {
              const meta = ACTION_META[a.kind];
              if (!meta) return null;
              const name = playerNames[a.playerIdx] ?? `J${a.playerIdx + 1}`;
              return (
                <div key={i} className="flex items-center gap-2" style={{ opacity: a.isCurrent ? 1 : 0.6 }}>
                  {a.isCurrent && <span style={{ width: 4, height: 4, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />}
                  {!a.isCurrent && <span style={{ width: 4, flexShrink: 0 }} />}
                  <GIcon src={meta.src()} filter={meta.filter} size={13} />
                  <span style={{ color: meta.color, fontSize: "0.75rem", fontFamily: "'Cinzel', serif", flex: 1 }}>{ACTION_LABELS[a.kind] ?? meta.label}</span>
                  <span style={{ color: "var(--c-muted)", fontSize: "0.7rem" }}>{name}</span>
                  <span style={{ color: meta.color, fontSize: "0.75rem", fontFamily: "'Cinzel', serif", fontWeight: "bold", minWidth: 28, textAlign: "right" }}>
                    {a.delta > 0 ? `+${a.delta}` : a.delta}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function RedoButton({ onRedo }) {
  const t = useT();
  const [flash, setFlash] = useState(false);
  function handleClick() {
    onRedo();
    setFlash(true);
    setTimeout(() => setFlash(false), 150);
  }
  return (
    <button onClick={handleClick} className="btn-ghost-sm" title={t("shortcut_redo")}
      style={{
        color: "var(--c-ice)",
        filter: "drop-shadow(0 0 4px rgba(168,216,234,0.5))",
        transform: flash ? "scale(1.3)" : "scale(1)",
        transition: flash ? "transform 0.07s cubic-bezier(0.34,1.56,0.64,1)" : "transform 0.1s ease",
      }}>
      <span style={{ transform: "scale(1.1)", display: "inline-flex" }}><IcoRedo /></span>
    </button>
  );
}

const ACTION_META = {
  damageDealt: { label: "Infligés",  color: "#e57373", src: () => GI.swords,       filter: GI_FILTER.red   },
  damageTaken: { label: "Subis",     color: "#64b5f6", src: () => GI.shieldImpact, filter: GI_FILTER.blue  },
  healingDone: { label: "Soins",     color: "#81c784", src: () => GI.heart,        filter: GI_FILTER.pink  },
  kill_normal: { label: "Normal",    color: "#c8d8e0", src: () => GI.skull,        filter: GI_FILTER.white },
  kill_elite:  { label: "Élite",     color: "#ffd54f", src: () => GI.dreadSkull,   filter: GI_FILTER.yellow},
  kill_boss:   { label: "Boss",      color: "#e57373", src: () => GI.crownSkull,   filter: GI_FILTER.red   },
};


function ShortcutsButton() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ bottom: 0, left: 0 });

  function handleMouseEnter() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setVisible(true);
  }

  const rows = [
    { keys: ["1", "–", "4"], desc: t("shortcut_select") },
    { keys: ["Esc"], desc: t("shortcut_deselect") },
    { keys: ["D"], desc: t("shortcut_dmg_dealt") },
    { keys: ["S"], desc: t("shortcut_dmg_taken") },
    { keys: ["H"], desc: t("shortcut_healing") },
    { keys: ["N"], desc: t("shortcut_normal") },
    { keys: ["E"], desc: t("shortcut_elite") },
    { keys: ["B"], desc: t("shortcut_boss_key") },
    { keys: ["Ctrl", "Z"], desc: t("shortcut_undo") },
    { keys: ["Ctrl", "Y"], desc: t("shortcut_redo") },
  ];

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={() => setVisible(false)}>
      <button ref={btnRef}
        className="btn-ghost-sm"
        style={{ fontSize: "0.85rem", width: 26, height: 26, color: "var(--c-dim)", cursor: "default" }}>
        ⌨
      </button>
      {visible && (
        <div style={{
          position: "fixed",
          top: pos.top,
          right: pos.right,
          zIndex: 9999,
          minWidth: 260,
          pointerEvents: "none",
        }} className="frost-block p-3">
          <p className="sect-label" style={{ marginBottom: 8, fontSize: "0.65rem" }}>{t("stats_shortcuts")}</p>
          <div className="flex flex-col gap-1.5">
            {rows.map(({ keys, desc }, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex items-center gap-1 flex-shrink-0" style={{ minWidth: 80 }}>
                  {keys.map((k, j) => (
                    <span key={j} style={{
                      fontFamily: "monospace", fontSize: "0.7rem",
                      background: "rgba(168,216,234,0.08)", border: "1px solid var(--c-border)",
                      borderRadius: 3, padding: "1px 5px", color: "var(--c-ice-dim)",
                    }}>{k}</span>
                  ))}
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--c-muted)" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const GROUP_TIMEOUT_MS = 5000;

// ── Constantes ────────────────────────────────────────────────────────────────
const EMPTY_PLAYER_STATS = (hasBoss) => ({
  damageDealt: 0, damageTaken: 0, healingDone: 0,
  kills: { normal: 0, elite: 0, ...(hasBoss ? { boss: 0 } : {}) },
  exhausted: false,
});
const SETUP_KEY = KEYS.scenarioStatsSetup;

// ── Page ──────────────────────────────────────────────────────────────────────
function ScenarioStatsPage() {
  const navigate = useNavigate();
  const showToast = useToast();
  const t = useT();
  const { lang } = useLanguage();
  const { activeSession, setActiveSession } = useSession();
  const { scenarios: globalScenarios } = useProgress();
  const { company } = useCompany();
  const sessionScenarios = (activeSession?.scenarios?.filter(s => s.number !== "") ?? [])
    .filter(s => globalScenarios.some(gs => gs.number === s.number));

  // Membres présents dans la session
  const presentMembers = (activeSession?.presentMemberIds ?? [])
    .map(id => company?.members?.find(m => m.id === id))
    .filter(Boolean);
  // Fallback si pas de membres (vieilles sessions)
  const hasPresentMembers = presentMembers.length >= 2;
  const trackedScenarios = sessionScenarios.filter(s => s.playerStats && s.playerStats.length > 0);

  const savedSetup = (() => {
    const raw = storage.getItem(SETUP_KEY);
    if (!raw) return null;
    try {
      const p = JSON.parse(raw);
      return activeSession?.scenarios?.some(s => s.id === p.scenarioId) ? p : null;
    } catch { return null; }
  })();

  const [rules, setRules]                           = useState(() => loadRules(lang));
  const [phase, setPhase]                           = useState(savedSetup ? "tracker" : "setup");
  const [readOnly, setReadOnly]                     = useState(false);
  const [confirmCancel, setConfirmCancel]           = useState(false);
  const [pickingResult, setPickingResult]           = useState(false);
  const [confirmDeleteId, setConfirmDeleteId]       = useState(null);
  const [setupError, setSetupError]                 = useState(null);
  const [startHovered, setStartHovered]             = useState(false);
  const untracked = sessionScenarios.filter(s => !s.playerStats?.length);
  const autoScenarioId = !savedSetup && untracked.length === 1 ? untracked[0].id : "";
  const autoMemberIds  = !savedSetup && hasPresentMembers ? (activeSession?.presentMemberIds ?? []) : [];
  const [selectedScenarioId, setSelectedScenarioId] = useState(savedSetup?.scenarioId ?? autoScenarioId);
  const [playerCount, setPlayerCount]               = useState(savedSetup?.playerCount ?? 2);
  const [playerNames, setPlayerNames]               = useState(savedSetup?.playerNames ?? ["", ""]);
  // IDs membres sélectionnés pour le tracker
  // orderedMemberIds[i] = id membre en position i, null = absent
  const [orderedMemberIds, setOrderedMemberIds]     = useState(savedSetup?.memberIds ?? autoMemberIds);
  const [hasBoss, setHasBoss]                       = useState(savedSetup?.hasBoss ?? false);
  const [playersStats, setPlayersStats]             = useState(() => {
    if (!savedSetup || !activeSession) return [];
    return activeSession.scenarios?.find(s => s.id === savedSetup.scenarioId)?.playerStats ?? [];
  });
  const [undoStack, setUndoStack]                   = useState([]);
  const [redoStack, setRedoStack]                   = useState([]);
  const [currentAction, setCurrentAction]           = useState(null);
  const [currentActionKey, setCurrentActionKey]     = useState(0);
  const [activePlayerIdx, setActivePlayerIdx]       = useState(null);
  const pendingGroupRef  = useRef(null);
  const playersStatsRef  = useRef([]);
  const kbRef = useRef({});

  function handleReviewScenario(sc) {
    setSelectedScenarioId(sc.id);
    setPlayerCount(sc.playerStats.length);
    // Résoudre les noms et ids depuis playerStats (nouveau format) ou memberIds (rétrocompat)
    const ids = sc.playerStats.map((ps, i) => ps.memberId ?? sc.memberIds?.[i] ?? null);
    const resolvedNames = ids.some(Boolean)
      ? ids.map(id => id ? (company?.members?.find(m => m.id === id)?.pseudo ?? id) : `Joueur`)
      : (sc.playerNames ?? sc.playerStats.map((_, i) => `Joueur ${i + 1}`));
    setPlayerNames(resolvedNames);
    setOrderedMemberIds(ids);
    setHasBoss(sc.hasBoss ?? false);
    setPlayersStats(sc.playerStats);
    setReadOnly(true);
    setPhase("tracker");
  }

  function handleDeleteCombat(scenarioId) {
    setActiveSession(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s =>
        s.id === scenarioId ? { ...s, playerStats: undefined, playerNames: undefined, hasBoss: undefined } : s
      )
    }));
    if (scenarioId === selectedScenarioId) storage.removeItem(SETUP_KEY);
    setConfirmDeleteId(null);
    showToast(t("combat_deleted"), "warning");
  }

  function handleStartTracking() {
    if (!selectedScenarioId) return;
    const sc = activeSession?.scenarios?.find(s => s.id === selectedScenarioId);
    if (sc?.playerStats?.length > 0) {
      setSetupError(t("stats_error_has_stats"));
      return;
    }
    if (hasPresentMembers) {
      const filled = orderedMemberIds.filter(Boolean);
      if (filled.length < 1) { setSetupError(t("stats_error_no_player")); return; }
      if (new Set(filled).size !== filled.length) { setSetupError(t("stats_error_duplicate")); return; }
    } else {
      if (playerNames.some(n => n.trim() === "")) { setSetupError(t("stats_error_names")); return; }
    }
    setSetupError(null);
    const memberIds = hasPresentMembers ? orderedMemberIds.filter(Boolean) : [];
    const names = hasPresentMembers
      ? memberIds.map(id => company?.members?.find(m => m.id === id)?.pseudo ?? id)
      : playerNames.slice(0, playerCount);
    const stats = names.map(() => EMPTY_PLAYER_STATS(hasBoss));
    setPlayersStats(stats);
    setPlayerNames(names);
    setOrderedMemberIds(memberIds);
    setReadOnly(false);
    setConfirmCancel(false);
    storage.setItem(SETUP_KEY, JSON.stringify({ scenarioId: selectedScenarioId, playerCount: names.length, playerNames: names, memberIds, hasBoss }));
    setPhase("tracker");
  }

  function handleDone(result) {
    setActiveSession(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s =>
        s.id === selectedScenarioId ? { ...s, result } : s
      )
    }));
    storage.removeItem(SETUP_KEY);
    showToast(t("combat_save"));
    navigate("/");
  }

  function handleCancelConfirmed() {
    setActiveSession(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s =>
        s.id === selectedScenarioId ? { ...s, playerStats: undefined } : s
      )
    }));
    storage.removeItem(SETUP_KEY);
    setPhase("setup");
    setSelectedScenarioId("");
    setPlayersStats([]);
    setConfirmCancel(false);
    setReadOnly(false);
  }

  function pushUndo() {} // no-op — grouping handled in recordAdjust
  function resetUndoPush() {}

  function finalizeGroup() {
    const p = pendingGroupRef.current;
    if (!p) return;
    clearTimeout(p.timerId);
    setUndoStack(prev => [...prev, { snapshot: p.snapshotBefore, action: { playerIdx: p.playerIdx, kind: p.kind, delta: p.delta } }]);
    pendingGroupRef.current = null;
    setCurrentAction(null);
  }

  function recordAdjust(playerIdx, kind, actualDelta) {
    const pending = pendingGroupRef.current;
    const sameGroup = pending
      && pending.playerIdx === playerIdx
      && pending.kind === kind;
    if (sameGroup) {
      clearTimeout(pending.timerId);
      const newDelta = pending.delta + actualDelta;
      if (newDelta === 0) {
        setPlayersStats(pending.snapshotBefore);
        pendingGroupRef.current = null;
        setCurrentAction(null);
        return;
      }
      const timerId = setTimeout(finalizeGroup, GROUP_TIMEOUT_MS);
      pendingGroupRef.current = { ...pending, delta: newDelta, timerId };
      setCurrentAction({ playerIdx, kind, delta: newDelta });
      setCurrentActionKey(k => k + 1);
    } else {
      if (pending) {
        clearTimeout(pending.timerId);
        setUndoStack(prev => [...prev, { snapshot: pending.snapshotBefore, action: { playerIdx: pending.playerIdx, kind: pending.kind, delta: pending.delta } }]);
      }
      setRedoStack([]);
      const snapshotBefore = playersStatsRef.current;
      const timerId = setTimeout(finalizeGroup, GROUP_TIMEOUT_MS);
      pendingGroupRef.current = { playerIdx, kind, delta: actualDelta, snapshotBefore, timerId };
      setCurrentAction({ playerIdx, kind, delta: actualDelta });
      setCurrentActionKey(k => k + 1);
    }
  }

  function adjustStat(playerIdx, field, delta) {
    const cur = playersStatsRef.current[playerIdx]?.[field] ?? 0;
    const actual = Math.max(0, cur + delta) - cur;
    setPlayersStats(prev => prev.map((p, i) => i === playerIdx ? { ...p, [field]: Math.max(0, (p[field] ?? 0) + delta) } : p));
    if (actual !== 0) recordAdjust(playerIdx, field, actual);
  }
  function adjustKill(playerIdx, type, delta) {
    const cur = playersStatsRef.current[playerIdx]?.kills?.[type] ?? 0;
    const actual = Math.max(0, cur + delta) - cur;
    setPlayersStats(prev => prev.map((p, i) => i === playerIdx ? { ...p, kills: { ...p.kills, [type]: Math.max(0, (p.kills?.[type] ?? 0) + delta) } } : p));
    if (actual !== 0) recordAdjust(playerIdx, `kill_${type}`, actual);
  }
  function toggleExhausted(playerIdx) {
    setPlayersStats(prev => prev.map((p, i) => i === playerIdx ? { ...p, exhausted: !p.exhausted } : p));
  }
  function handleUndo() {
    const pending = pendingGroupRef.current;
    if (pending) {
      clearTimeout(pending.timerId);
      setRedoStack(prev => [...prev, { snapshotBefore: pending.snapshotBefore, snapshotAfter: playersStatsRef.current, action: { playerIdx: pending.playerIdx, kind: pending.kind, delta: pending.delta } }]);
      setPlayersStats(pending.snapshotBefore);
      pendingGroupRef.current = null;
      setCurrentAction(null);
    } else if (undoStack.length > 0) {
      const entry = undoStack[undoStack.length - 1];
      setRedoStack(prev => [...prev, { snapshotBefore: entry.snapshot, snapshotAfter: playersStatsRef.current, action: entry.action }]);
      setPlayersStats(entry.snapshot);
      setUndoStack(s => s.slice(0, -1));
    }
  }

  function handleRedo() {
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    setPlayersStats(entry.snapshotAfter);
    setUndoStack(prev => [...prev, { snapshot: entry.snapshotBefore, action: entry.action }]);
    setRedoStack(s => s.slice(0, -1));
  }

  useEffect(() => {
    if (phase !== "tracker" || readOnly || !selectedScenarioId || !activeSession || playersStats.length === 0) return;
    setActiveSession(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s =>
        s.id === selectedScenarioId ? { ...s, playerStats: playersStats.map((ps, i) => orderedMemberIds[i] ? { memberId: orderedMemberIds[i], ...ps } : ps), playerNames, hasBoss } : s
      )
    }));
  }, [playersStats]);

  // kbRef + playersStatsRef — toujours à jour sans recréer le listener
  useEffect(() => {
    kbRef.current = { adjustStat, adjustKill, handleUndo, handleRedo, activePlayerIdx, playerNames, readOnly, setActivePlayerIdx };
    playersStatsRef.current = playersStats;
  });

  useEffect(() => {
    if (phase !== "tracker") return;
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      const { adjustStat, adjustKill, handleUndo, handleRedo, activePlayerIdx, playerNames, readOnly, setActivePlayerIdx: setIdx } = kbRef.current;
      if (readOnly) return;
      const k = e.key;
      if (k === "Escape") { setIdx(null); return; }
      const digitIdx = k >= "1" && k <= "4" ? parseInt(k) - 1
        : e.code.startsWith("Digit") ? parseInt(e.code.slice(5)) - 1
        : e.code.startsWith("Numpad") ? parseInt(e.code.slice(6)) - 1
        : -1;
      if (digitIdx >= 0 && digitIdx <= 3) {
        if (digitIdx < playerNames.length) setIdx(digitIdx);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "z") { e.preventDefault(); handleUndo(); return; }
      if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === "y") { e.preventDefault(); handleRedo(); return; }
      if (activePlayerIdx === null) return;
      const delta = e.shiftKey ? 5 : 1;
      if (k.toLowerCase() === "d") { e.preventDefault(); pushUndo(); adjustStat(activePlayerIdx, "damageDealt", delta); resetUndoPush(); }
      else if (k.toLowerCase() === "s") { e.preventDefault(); pushUndo(); adjustStat(activePlayerIdx, "damageTaken", delta); resetUndoPush(); }
      else if (k.toLowerCase() === "h") { e.preventDefault(); pushUndo(); adjustStat(activePlayerIdx, "healingDone", delta); resetUndoPush(); }
      else if (k === "n") { e.preventDefault(); pushUndo(); adjustKill(activePlayerIdx, "normal", 1); resetUndoPush(); }
      else if (k === "e") { e.preventDefault(); pushUndo(); adjustKill(activePlayerIdx, "elite", 1); resetUndoPush(); }
      else if (k === "b") { e.preventDefault(); pushUndo(); adjustKill(activePlayerIdx, "boss", 1); resetUndoPush(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  function handlePlayerCountChange(count) {
    const n = Math.max(1, Math.min(4, count));
    setPlayerCount(n);
    setPlayerNames(prev => { const arr = [...prev]; while (arr.length < n) arr.push(""); return arr.slice(0, n); });
  }

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    const canStart = selectedScenarioId && (hasPresentMembers ? orderedMemberIds.filter(Boolean).length >= 2 : playerNames.filter(n => n.trim() !== "").length >= 2);
    return (
      <div className="h-screen flex items-stretch justify-between overflow-hidden">
        <div className="flex-shrink-0 flex items-center">
          <NavPill to="/" icon={<IcoHome />} label={t("nav_menu")} side="left" />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="min-h-full flex flex-col items-center justify-center py-6 px-4">
          <div className="w-full max-w-md flex flex-col gap-5">

            {/* Combats enregistrés */}
            {trackedScenarios.length > 0 && (
              <div className="frost-block p-5">
                <span className="sect-label block mb-3">{t("stats_saved_section")}</span>
                <div className="flex flex-col gap-2">
                  {trackedScenarios.map(sc => (
                    <div key={sc.id}>
                      {confirmDeleteId === sc.id ? (
                        <div className="frost-inner px-4 py-3 flex items-center justify-between gap-3">
                          <span className="text-xs" style={{ color: "var(--c-muted)" }}>{t("stats_delete_confirm", { n: sc.number })}</span>
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => handleDeleteCombat(sc.id)}
                              className="btn-frost btn-danger" style={{ fontSize: "0.75rem", padding: "3px 8px" }}>
                              {t("btn_yes")}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)}
                              className="btn-frost btn-cancel" style={{ fontSize: "0.75rem", padding: "3px 8px" }}>
                              {t("btn_no")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="frost-inner px-4 py-3 flex items-center gap-2"
                          style={{ border: "1px solid var(--c-border)" }}>
                          <button onClick={() => handleReviewScenario(sc)}
                            className="flex items-center justify-between flex-1 text-left"
                            style={{ background: "none", border: "none", cursor: "pointer" }}>
                            <div>
                              <span style={{ fontFamily: "'Cinzel', serif", color: "var(--c-ice-light)", fontSize: "0.85rem" }}>
                                {t("lbl_scenario", { n: sc.number })}
                              </span>
                            </div>
                            <span className="w-3.5 h-3.5 flex-shrink-0 ml-4" style={{ color: "var(--c-ice-dim)" }} title="Visualiser les stats"><IcoEye /></span>
                          </button>
                          <button onClick={() => setConfirmDeleteId(sc.id)}
                            className="btn-ghost-sm flex-shrink-0" title="Supprimer les stats"
                            style={{ color: "var(--c-muted)" }}>
                            <span className="w-3.5 h-3.5"><IcoTrash /></span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Setup nouveau combat */}
            <div className="frost-block p-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="title-rune" style={{ fontSize: "1.25rem" }}>{t("menu_combat_stats")}</h2>
                <RulesEditor rules={rules} onSave={text => { setRules(text); saveRules(text); }} />
              </div>
              <p className="text-sm italic mb-5 -mt-3" style={{ color: "var(--c-muted)" }}>
                {t("stats_hint")}
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="sect-label" style={{ marginBottom: 4 }}>{t("sess_scenario_lbl")}</span>
                  {sessionScenarios.length === 0 ? (
                    <p className="text-sm italic" style={{ color: "var(--c-muted)" }}>
                      {t("stats_no_scenario")}{" "}<Link to="/active-session" style={{ color: "var(--c-ice)" }}>{t("stats_add_scenario_link")}</Link>
                    </p>
                  ) : (
                    <div className="relative">
                      <select value={selectedScenarioId} onChange={e => { setSelectedScenarioId(e.target.value); setSetupError(null); }} className="select-frost">
                        <option value="" disabled>{t("sess_choose_scenario")}</option>
                        {sessionScenarios.map(s => <option key={s.id} value={s.id}>{t("lbl_scenario", { n: s.number })}</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div onClick={() => setHasBoss(v => !v)}
                    className="w-11 h-6 rounded-full flex items-center px-1 transition-colors"
                    style={{ background: hasBoss ? "rgba(74,122,155,0.5)" : "rgba(30,45,66,0.8)", border: "1px solid var(--c-border)", cursor: "pointer" }}>
                    <div className="w-4 h-4 rounded-full bg-white transition-transform" style={{ transform: hasBoss ? "translateX(20px)" : "translateX(0)" }} />
                  </div>
                  <span className="text-sm" style={{ color: "var(--c-text)" }}>{t("stats_boss")}</span>
                </label>

                {hasPresentMembers ? (
                  <div className="flex flex-col gap-2">
                    <span className="sect-label" style={{ marginBottom: 4 }}>{t("stats_player_order")}</span>
                    <p className="text-xs" style={{ color: "var(--c-muted)" }}>{t("stats_player_order_hint")}</p>
                    {presentMembers.map((_, slotIdx) => {
                      const currentId = orderedMemberIds[slotIdx] ?? "";
                      return (
                        <div key={slotIdx} className="relative flex items-center gap-2">
                          <span className="text-xs flex-shrink-0" style={{ color: "var(--c-muted)", fontFamily: "'Cinzel', serif", width: 72 }}>
                            {t("lbl_player", { n: slotIdx + 1 })}
                          </span>
                          <div className="relative flex-1">
                            <select
                              value={currentId}
                              onChange={e => {
                                const newId = e.target.value;
                                setOrderedMemberIds(prev => {
                                  const arr = [...prev];
                                  while (arr.length <= slotIdx) arr.push("");
                                  // Si le joueur est déjà dans un autre slot, on switche
                                  const otherIdx = arr.findIndex((id, i) => id === newId && i !== slotIdx);
                                  if (otherIdx !== -1) arr[otherIdx] = arr[slotIdx] ?? "";
                                  arr[slotIdx] = newId;
                                  return arr;
                                });
                              }}
                              className="select-frost">
                              <option value="">{t("stats_choose_player")}</option>
                              {presentMembers.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.pseudo}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-2">
                      <span className="sect-label" style={{ marginBottom: 4 }}>{t("stats_player_count")}</span>
                      <div className="flex items-center gap-4">
                        <button type="button" onClick={() => handlePlayerCountChange(playerCount - 1)}
                          className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
                          style={{ background: "rgba(168,216,234,0.06)", border: "1px solid var(--c-border)", color: "var(--c-muted)", cursor: "pointer" }}>−</button>
                        <span className="text-xl font-bold w-6 text-center" style={{ color: "var(--c-ice)", fontFamily: "'Cinzel', serif" }}>{playerCount}</span>
                        <button type="button" onClick={() => handlePlayerCountChange(playerCount + 1)}
                          className="w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center"
                          style={{ background: "rgba(74,122,155,0.2)", border: "1px solid var(--c-ice-dim)", color: "var(--c-ice)", cursor: "pointer" }}>+</button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className="sect-label" style={{ marginBottom: 4 }}>{t("stats_player_names")}</span>
                      {playerNames.map((name, idx) => (
                        <input key={idx} type="text" value={name}
                          onChange={e => { const arr = [...playerNames]; arr[idx] = e.target.value; setPlayerNames(arr); }}
                          placeholder={t("lbl_player", { n: idx + 1 })} className="input-frost" />
                      ))}
                    </div>
                  </>
                )}

              </div>
              {setupError && <div className="error-frost mt-3">{setupError}</div>}
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={handleStartTracking} disabled={!canStart}
                  className={`btn-frost justify-center ${canStart ? "btn-primary" : ""}`}
                  style={!canStart
                    ? { borderColor: "var(--c-border)", color: "var(--c-dim)", cursor: "not-allowed" }
                    : startHovered ? { borderColor: "rgba(229,115,115,0.6)", color: "#e57373", transition: "all 0.15s" }
                    : { transition: "all 0.15s" }}
                  onMouseEnter={() => canStart && setStartHovered(true)}
                  onMouseLeave={() => setStartHovered(false)}>
                  {canStart && <GIcon src={GI.swordClash} filter={startHovered ? GI_FILTER.red : GI_FILTER.white} size={15} />}
                  {t("stats_start")}
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center">
          <NavPillSession startingDatetime={activeSession?.startingDatetime} side="right" />
        </div>
      </div>
    );
  }

  // ── TRACKER ────────────────────────────────────────────────────────────────
  const selectedScenario = sessionScenarios.find(s => s.id === selectedScenarioId);
  const trackerMaxWidth = playerNames.length * 368 + Math.max(0, playerNames.length - 1) * 14 + 46;

  // Leaders par stat (highlight du meilleur si > 0)
  function getLeaders(getVal) {
    if (!playersStats.length) return new Set();
    const vals = playersStats.map(getVal);
    const max = Math.max(...vals);
    if (max === 0) return new Set();
    return new Set(vals.reduce((acc, v, i) => v === max ? [...acc, i] : acc, []));
  }
  const ldDmg   = getLeaders(p => p.damageDealt ?? 0);
  const ldTank  = getLeaders(p => p.damageTaken ?? 0);
  const ldHeal  = getLeaders(p => p.healingDone ?? 0);
  const ldKills = getLeaders(p => killScore(p.kills));

  // MVP temps réel
  const { mvpIdx, mvpScores } = (() => {
    const scores = computeMVPScores(playersStats);
    if (!scores.length) return { mvpIdx: null, mvpScores: [] };
    const sorted = scores.map((s, i) => ({ i, s })).sort((a, b) => b.s - a.s);
    const idx = sorted.length >= 2 && sorted[0].s === sorted[1].s ? null : sorted[0].i;
    return { mvpIdx: idx, mvpScores: scores };
  })();

  // Totaux globaux
  const totals = playersStats.reduce((acc, p) => ({
    damageDealt: acc.damageDealt + (p.damageDealt ?? 0),
    damageTaken: acc.damageTaken + (p.damageTaken ?? 0),
    healingDone: acc.healingDone + (p.healingDone ?? 0),
    kills: {
      normal: acc.kills.normal + (p.kills?.normal ?? 0),
      elite:  acc.kills.elite  + (p.kills?.elite  ?? 0),
      boss:   acc.kills.boss   + (p.kills?.boss   ?? 0),
    }
  }), { damageDealt: 0, damageTaken: 0, healingDone: 0, kills: { normal: 0, elite: 0, boss: 0 } });
  return (
    <div className="h-screen flex items-stretch justify-between overflow-hidden">
      <div className="flex-shrink-0 flex items-center">
        <NavPill to="/" icon={<IcoHome />} label={t("nav_menu")} side="left" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="min-h-full flex flex-col items-center justify-center py-6 px-4">
          <div className="frost-block p-5 w-full" style={{ maxWidth: trackerMaxWidth }}>

            {/* Header */}
            <div className="grid items-center mb-5" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
              <h2 className="title-rune" style={{ fontSize: "1.1rem" }}>
                {t("lbl_scenario", { n: selectedScenario?.number })}
                {readOnly && (
                  <span className="ml-2 text-xs" style={{ color: "var(--c-muted)", fontFamily: "inherit", fontWeight: "normal" }}>
                    {t("stats_read_mode")}
                  </span>
                )}
              </h2>
              <div className="flex items-center justify-center">
                {!readOnly && (
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <UndoButton
                      onUndo={handleUndo}
                      disabled={!currentAction && undoStack.length === 0}
                      undoStack={undoStack}
                      currentAction={currentAction}
                      playerNames={playerNames}
                      />
                    {redoStack.length > 0 && (
                      <div style={{ position: "absolute", left: "100%", top: 0, bottom: 0, marginLeft: 2, display: "flex", alignItems: "center" }}>
                        <RedoButton onRedo={handleRedo} />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2">
                {!readOnly && <><ShortcutsButton /><RulesButton rules={rules} /></>}
              </div>
            </div>

            {/* Grille joueurs */}
            <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 flex-wrap justify-center">
              {playerNames.map((name, playerIdx) => {
                const titleIcons = [
                  ldDmg.size === 1 && ldDmg.has(playerIdx) && TITLE_BY_KEY.dps,
                  ldTank.size === 1 && ldTank.has(playerIdx) && TITLE_BY_KEY.tank,
                  ldHeal.size === 1 && ldHeal.has(playerIdx) && TITLE_BY_KEY.heal,
                  ldKills.size === 1 && ldKills.has(playerIdx) && killScore(playersStats[playerIdx]?.kills) > 0 && TITLE_BY_KEY.bourreau,
                ].filter(Boolean);
                const exhausted = playersStats[playerIdx]?.exhausted ?? playersStats[playerIdx]?.died ?? false;
                return (
                <fieldset key={playerIdx} className="frost-inner flex flex-col gap-2"
                  style={{
                    position: "relative",
                    minWidth: 276, flex: "0 0 auto",
                    padding: titleIcons.length === 0 ? "16px 16px 16px" : "4px 16px 16px",
                    marginTop: titleIcons.length === 0 ? 7 : 0,
                    border: activePlayerIdx === playerIdx && !readOnly ? "1px solid var(--c-ice-dim)" : "1px solid var(--c-border)",
                    boxShadow: activePlayerIdx === playerIdx && !readOnly ? "0 0 10px rgba(168,216,234,0.12)" : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s, opacity 0.2s",
                    borderRadius: 10,
                    opacity: exhausted ? 0.45 : 1,
                  }}>
                  {titleIcons.length > 0 && (
                    <legend style={{ padding: "0 4px", margin: "0 auto", display: "flex", alignItems: "center", gap: 4 }}>
                      {titleIcons.map((titleDef, j) => <GIcon key={j} src={titleDef.src} filter={titleDef.filter} size={20} title={t(`title_${titleDef.key}`)} />)}
                    </legend>
                  )}
                  <div className="flex items-center justify-between pb-2 mb-1" style={{ borderBottom: "1px solid var(--c-border)" }}>
                    <div style={{ width: 24 }} />
                    <div className="flex items-center gap-1.5">
                      {mvpIdx === playerIdx && (
                        <div className="flex flex-col items-center" style={{ gap: 1 }}>
                          <GIcon src={GI.crown} filter={GI_FILTER.yellow} size={18} title={t("title_mvp")} />
                          {mvpScores[playerIdx] != null && (
                            <span style={{ fontSize: "0.55rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", color: "#fdd835", lineHeight: 1 }}>
                              {mvpScores[playerIdx].toFixed(2)}
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex flex-col items-center" style={{ gap: 1 }}>
                        <h3 className="text-sm text-center"
                          style={{ fontFamily: "'Cinzel', serif", color: mvpIdx === playerIdx ? "#fdd835" : "var(--c-ice-light)" }}>
                          {name}
                        </h3>
                        {mvpIdx !== playerIdx && mvpScores[playerIdx] != null && (
                          <span style={{ fontSize: "0.55rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", color: "var(--c-muted)", lineHeight: 1 }}>
                            {mvpScores[playerIdx].toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    {!readOnly ? (
                      <button type="button" onClick={() => toggleExhausted(playerIdx)}
                        title={exhausted ? t("stats_alive") : t("stats_exhaust")}
                        className="btn-ghost-sm"
                        style={{ opacity: exhausted ? 1 : 0.3, transition: "opacity 0.2s", padding: 2 }}>
                        <GIcon src={GI.pirateGrave} filter={exhausted ? GI_FILTER.red : GI_FILTER.greyLight} size={18} />
                      </button>
                    ) : (
                      <div style={{ width: 24 }}>
                        {exhausted && <GIcon src={GI.pirateGrave} filter={GI_FILTER.red} size={18} title="Épuisé" />}
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-widest mt-1 mb-1"
                    style={{ color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif" }}>{t("stats_combat_header")}</p>
                  <div className="flex flex-col gap-2">
                    {["damageDealt", "damageTaken", "healingDone"].map(key => (
                      <StatRow key={key} statKey={key}
                        value={playersStats[playerIdx]?.[key] ?? 0}
                        onAdjust={delta => adjustStat(playerIdx, key, delta)}
                        readOnly={readOnly}
                        isLeader={key === "damageDealt" ? ldDmg.has(playerIdx) : key === "damageTaken" ? ldTank.has(playerIdx) : ldHeal.has(playerIdx)}
                        onBeforeAdjust={pushUndo}
                        onInteractionEnd={resetUndoPush}
                        badge={currentAction?.playerIdx === playerIdx && currentAction?.kind === key ? { delta: currentAction.delta, actionKey: currentActionKey } : null}
                        onFinalize={finalizeGroup} />
                    ))}
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-widest mt-3 mb-1"
                    style={{ color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif" }}>{t("stats_kills_header")}</p>
                  <div className="flex flex-col gap-1.5 rounded-lg"
                    style={{
                      border: ldKills.size === 1 && ldKills.has(playerIdx) && killScore(playersStats[playerIdx]?.kills) > 0
                        ? "1px solid rgba(200,216,224,0.4)" : "1px solid transparent",
                      boxShadow: ldKills.size === 1 && ldKills.has(playerIdx) && killScore(playersStats[playerIdx]?.kills) > 0
                        ? "0 0 6px rgba(200,216,224,0.15)" : "none",
                      padding: "4px",
                      transition: "border-color 0.3s, box-shadow 0.3s",
                    }}>
                    {["normal", "elite", ...(hasBoss ? ["boss"] : [])].map(key => (
                      <KillRow key={key} killKey={key}
                        value={playersStats[playerIdx]?.kills?.[key] ?? 0}
                        onAdjust={delta => adjustKill(playerIdx, key, delta)}
                        readOnly={readOnly}
                        isLeader={false}
                        onBeforeAdjust={pushUndo}
                        onInteractionEnd={resetUndoPush}
                        badge={currentAction?.playerIdx === playerIdx && currentAction?.kind === `kill_${key}` ? { delta: currentAction.delta, actionKey: currentActionKey } : null}
                        onFinalize={finalizeGroup} />
                    ))}
                  </div>
                </fieldset>
                );
              })}
            </div>
            </div>

            {/* Totaux globaux */}
            <div className="flex items-center justify-center gap-2 flex-wrap mt-4 pt-3" style={{ borderTop: "1px solid var(--c-border)" }}>
              {[
                { v: totals.damageDealt, src: GI.swords,       f: GI_FILTER.red    },
                { v: totals.damageTaken, src: GI.shieldImpact,  f: GI_FILTER.blue   },
                { v: totals.healingDone, src: GI.heart,         f: GI_FILTER.green  },
                { v: totals.kills.normal, src: GI.skull,        f: GI_FILTER.white,  s: 11, label: t("combat_kills_normal") },
                { v: totals.kills.elite,  src: GI.dreadSkull,   f: GI_FILTER.yellow, s: 14, label: t("combat_kills_elite")  },
                ...(hasBoss ? [{ v: totals.kills.boss, src: GI.crownSkull, f: GI_FILTER.red, s: 14, label: t("combat_kills_boss") }] : []),
              ].map(({ v, src, f, s, label }, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded"
                  style={{ background: "rgba(168,216,234,0.04)", border: "1px solid var(--c-border)" }}>
                  <GIcon src={src} filter={f} size={s ?? 14} title={label} />
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.82rem", color: "var(--c-ice-light)", fontWeight: "bold" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-4 relative" style={{ minHeight: 36 }}>
              {!readOnly ? (
                <div className="flex items-center justify-between gap-3">
                  {/* Gauche — Annuler */}
                  <div className="flex items-center justify-start">
                    {confirmCancel ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs" style={{ color: "var(--c-muted)" }}>{t("stats_confirm_cancel")}</span>
                        <button onClick={handleCancelConfirmed} className="btn-frost btn-danger" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
                          <span className="w-3.5 h-3.5"><IcoCheck /></span> {t("btn_yes")}
                        </button>
                        <button onClick={() => setConfirmCancel(false)} className="btn-frost btn-cancel" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
                          <span className="w-3.5 h-3.5"><IcoX /></span> {t("btn_no")}
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmCancel(true)} className="btn-frost btn-cancel" style={{ fontSize: "0.85rem", padding: "5px 14px" }}>
                        <span className="w-3.5 h-3.5"><IcoX /></span> {t("btn_cancel")}
                      </button>
                    )}
                  </div>
                  {/* Droite — Terminer */}
                  <div className="flex items-center justify-end">
                    {pickingResult ? (
                      <div className="flex items-center gap-2 flex-wrap justify-end">
                        <span className="text-xs" style={{ color: "var(--c-muted)" }}>{t("stats_result")}</span>
                        <button onClick={() => handleDone("victory")} className="btn-frost btn-primary" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
                          {t("lbl_victory")}
                        </button>
                        <button onClick={() => handleDone("defeat")} className="btn-frost btn-danger" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
                          {t("lbl_defeat")}
                        </button>
                        <button onClick={() => setPickingResult(false)} className="btn-frost btn-cancel" style={{ fontSize: "0.8rem", padding: "4px 10px" }}>
                          <span className="w-3.5 h-3.5"><IcoX /></span>
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setPickingResult(true)} className="btn-frost btn-primary" style={{ fontSize: "0.85rem", padding: "5px 14px" }}>
                        <span className="w-3.5 h-3.5"><IcoCheck /></span> {t("stats_finish")}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button onClick={() => { setPhase("setup"); setReadOnly(false); }} className="btn-cancel self-start text-xs transition-colors underline">
                  {t("stats_back")}
                </button>
              )}
            </div>

          </div>
        </div>
        </div>
      <div className="flex-shrink-0 flex items-center">
        <NavPillSession startingDatetime={activeSession?.startingDatetime} side="right" />
      </div>
    </div>
  );
}

export default ScenarioStatsPage;
