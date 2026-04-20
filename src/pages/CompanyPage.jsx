import { useState, useMemo, useRef } from "react";
import { useProgress } from "../context/ProgressContext";
import { useCompany } from "../context/CompanyContext";
import { GI, GI_FILTER, GIcon } from "../utils/gameIcons.jsx";
import { TITLE_DEFS, TITLE_BY_KEY } from "../utils/titles.jsx";
import { useSession } from "../context/SessionContext";
import { NavPill, NavPillSession } from "../components/layout/NavPill";
import { IcoHome } from "../components/ui/Icons";
import Modal from "../components/ui/Modal";
import { IcoPlus, IcoPlusCircle, IcoPencil, IcoCheck, IcoX, IcoRetire, IcoEye } from "../components/ui/Icons";
import { useToast } from "../context/ToastContext";
import { formatDurationMs, useDateFormatters } from "../utils/dateUtils";
import { killScore, computeMVPScores } from "../utils/statUtils";
import { useT } from "../context/LanguageContext";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts";



const CHAR_ICONS = [
  { id: "bannerspear",   label: "Bannerspear",    src: "/assets/char_icones/fh-banner-spear-bw-icon.png" },
  { id: "blinkblade",    label: "Blinkblade",     src: "/assets/char_icones/fh-blinkblade-bw-icon.png" },
  { id: "boneshaper",    label: "Boneshaper",     src: "/assets/char_icones/fh-boneshaper-bw-icon.png" },
  { id: "crashing-tide", label: "Crashing Tide",  src: "/assets/char_icones/fh-crashing-tide-bw-icon.png" },
  { id: "deathwalker",   label: "Deathwalker",    src: "/assets/char_icones/fh-deathwalker-bw-icon.png" },
  { id: "deepwraith",    label: "Deepwraith",     src: "/assets/char_icones/fh-deepwraith-bw-icon.png" },
  { id: "drifter",       label: "Drifter",        src: "/assets/char_icones/fh-drifter-bw-icon.png" },
  { id: "frozen-fist",   label: "Frozen Fist",    src: "/assets/char_icones/fh-frozen-fist-bw-icon.png" },
  { id: "geminate",      label: "Geminate",       src: "/assets/char_icones/fh-geminate-bw-icon.png" },
  { id: "hive",          label: "Hive",           src: "/assets/char_icones/fh-hive-bw-icon.png" },
  { id: "infuser",       label: "Infuser",        src: "/assets/char_icones/fh-infuser-bw-icon.png" },
  { id: "metal-mosaic",  label: "Metal Mosaic",   src: "/assets/char_icones/fh-metal-mosaic-bw-icon.png" },
  { id: "pain-conduit",  label: "Pain Conduit",   src: "/assets/char_icones/fh-pain-conduit-bw-icon.png" },
  { id: "pyroclast",     label: "Pyroclast",      src: "/assets/char_icones/fh-pyroclast-bw-icon.png" },
  { id: "shattersong",   label: "Shattersong",    src: "/assets/char_icones/fh-shattersong-bw-icon.png" },
  { id: "snowdancer",    label: "Snowdancer",     src: "/assets/char_icones/fh-snowdancer-bw-icon.png" },
  { id: "trapper",       label: "Trapper",        src: "/assets/char_icones/fh-trapper-bw-icon.png" },
];

// ── Alias local (formatDurationMs ne dépend pas de la locale) ────────────────
const fmtDuration = formatDurationMs;

// ── Couleurs & constantes charts ──────────────────────────────────────────────
const C = {
  ice:    "#a8d8ea",
  iceDim: "#5b9ab5",
  muted:  "#7a9ab0",
  dim:    "#3a5a70",
  border: "rgba(100,160,190,0.15)",
  red:    "#e57373",
  green:  "#81c784",
  yellow: "#fdd835",
};
const PLAYER_COLORS = ["#a8d8ea", "#81c784", "#fdd835", "#ce93d8"];

// ── Badge Titres avec tooltip ────────────────────────────────────────────────
function TitlesBadge() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const btnRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  return (
    <div className="relative inline-flex"
      onMouseEnter={() => {
        if (btnRef.current) {
          const r = btnRef.current.getBoundingClientRect();
          setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
        }
        setVisible(true);
      }}
      onMouseLeave={() => setVisible(false)}>
      <span ref={btnRef}
        className="text-xs px-1.5 py-0.5 rounded cursor-default"
        style={{ background: "rgba(168,216,234,0.08)", border: "1px solid var(--c-border)", color: "var(--c-muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", fontSize: "0.6rem" }}>
        {t("company_titles_hint")}
      </span>
      {visible && (
        <div style={{ position: "fixed", top: pos.top, right: pos.right, zIndex: 9999, minWidth: 210, pointerEvents: "none" }}
          className="frost-block p-3 flex flex-col gap-2">
          {TITLE_DEFS.map(def => (
              <div key={def.key} className="flex items-start gap-2">
                <GIcon src={def.src} filter={def.filter} size={16} />
                <div className="flex flex-col">
                  <span style={{ color: "var(--c-ice-light)", fontFamily: "'Cinzel', serif", fontSize: "0.7rem" }}>{t(`title_${def.key}`)}</span>
                  <span style={{ color: "var(--c-muted)", fontSize: "0.65rem" }}>{t(`title_${def.key}_desc`)}</span>
                </div>
              </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ── Composants charts ─────────────────────────────────────────────────────────
function FrostTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="frost-block p-3 flex flex-col gap-1" style={{ fontSize: "0.8rem", minWidth: 120 }}>
      {label && <span style={{ color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif", marginBottom: 4 }}>{label}</span>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.fill || p.color, display: "inline-block", flexShrink: 0 }} />
          <span style={{ color: "var(--c-muted)" }}>{p.name}</span>
          <span style={{ color: "var(--c-ice-light)", fontFamily: "'Cinzel', serif", marginLeft: "auto" }}>
            {formatter ? formatter(p.value, p.name) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
function ChartSection({ title, children, note }) {
  return (
    <div className="frost-block p-6 flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <h2 className="title-rune" style={{ fontSize: "1rem" }}>{title}</h2>
        {note && <span style={{ fontSize: "0.7rem", color: "var(--c-dim)", fontStyle: "italic" }}>{note}</span>}
      </div>
      {children}
    </div>
  );
}
function Pill({ label, value, note }) {
  return (
    <div className="frost-inner px-4 py-2 flex flex-col items-center justify-center gap-0.5 text-center">
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.1rem", color: "var(--c-ice-light)" }}>{value}</span>
      <span style={{ fontSize: "0.65rem", color: "var(--c-muted)", letterSpacing: "0.06em" }}>{label}</span>
      {note && <span style={{ fontSize: "0.6rem", color: "var(--c-dim)", fontStyle: "italic" }}>{note}</span>}
    </div>
  );
}

// ── PlayerCard (même style que LastSessionPage) ───────────────────────────────
function PlayerCard({ name: _name, ps, hasBoss: _hasBoss, title: _title }) {
  const t = useT();
  return (
    <div className="frost-inner p-3 flex flex-col gap-2" style={{ minWidth: 130 }}>
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
            <span style={{ color: "var(--c-muted)", display:"flex", alignItems:"center", gap:4 }}><GIcon src={GI.crownSkull} filter={GI_FILTER.red} size={18} /> {t("combat_kills_boss")}</span>
            <span style={{ color: "#e57373", fontFamily: "'Cinzel', serif" }}>{ps.kills?.boss ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--c-muted)", display:"flex", alignItems:"center", gap:4 }}><GIcon src={GI.dreadSkull} filter={GI_FILTER.yellow} size={18} /> {t("combat_kills_elite")}</span>
            <span style={{ color: "#ffd54f", fontFamily: "'Cinzel', serif" }}>{ps.kills?.elite ?? 0}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: "var(--c-muted)", display:"flex", alignItems:"center", gap:4 }}><span style={{ width: 18, display: "inline-flex", justifyContent: "center" }}><GIcon src={GI.skull} filter={GI_FILTER.white} size={16} /></span> {t("combat_kills_normal")}</span>
            <span style={{ color: "var(--c-text)", fontFamily: "'Cinzel', serif" }}>{ps.kills?.normal ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Bloc stats dépliable par personnage ──────────────────────────────────────
function CharStatsBlock({ label, iconSrc, isActive, retiredDate, ps, hasBoss, defaultOpen = false, combatCount, titleCounts }) {
  const t = useT();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="frost-inner overflow-hidden" style={{ opacity: isActive ? 1 : 0.75 }}>
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3"
        style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
        {iconSrc && (
          <img src={iconSrc} alt="" style={{ width: 20, height: 20, objectFit: "contain",
            filter: "invert(0.6) sepia(1) saturate(2) hue-rotate(180deg)", opacity: isActive ? 0.85 : 0.5, flexShrink: 0 }} />
        )}
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem",
          color: isActive ? "var(--c-ice-light)" : "var(--c-muted)", flex: 1 }}>
          {label}
        </span>
        {isActive && (
          <span style={{ fontSize: "0.6rem", color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em" }}>{t("company_active")}</span>
        )}
        {combatCount > 0 && <span style={{ fontSize: "0.65rem", color: "var(--c-dim)" }}>{combatCount} combat{combatCount > 1 ? "s" : ""}</span>}
        {retiredDate && (
          <span style={{ fontSize: "0.7rem", color: "var(--c-dim)" }}>{retiredDate}</span>
        )}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 flex-shrink-0"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", color: "var(--c-dim)", marginLeft: 4 }}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {open && ps && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          {titleCounts && <TitleCountRow counts={titleCounts} />}
          <PlayerCard ps={ps} hasBoss={hasBoss} />
        </div>
      )}
      {open && !ps && (
        <p className="px-4 pb-3" style={{ color: "var(--c-dim)", fontSize: "0.8rem", fontStyle: "italic" }}>
          {t("company_no_stats")}
        </p>
      )}
    </div>
  );
}

// ── Modale stats membre ───────────────────────────────────────────────────────
function TitleCountRow({ counts }) {
  if (!counts) return null;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  const defs = TITLE_DEFS;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {defs.filter(d => counts[d.key] > 0).map(d => (
        <span key={d.key} className="flex items-center gap-1" style={{ fontSize: "0.7rem", color: "var(--c-muted)" }}>
          <GIcon src={d.src} filter={d.filter} size={18} title={d.label} />
          ×{counts[d.key]}
        </span>
      ))}
    </div>
  );
}

function MemberStatsModal({ member, memberStats, memberStatsByChar = {}, isGlobalMvp, mvpScore, combatCount, combatCountByChar, titleCount, titleCountByChar, onClose }) {
  const t = useT();
  const globalPs = memberStats ? {
    damageDealt: memberStats.dmg,
    damageTaken: memberStats.taken,
    healingDone: memberStats.heal,
    kills: { normal: memberStats.killsNormal, elite: memberStats.killsElite, boss: memberStats.killsBoss },
  } : null;
  const hasBossGlobal = (memberStats?.killsBoss ?? 0) > 0;

  const hasActive  = !!member.activeCharacter;
  const hasRetired = member.retiredCharacters?.length > 0;
  const hasAnyChar = hasActive || hasRetired;

  // Construire les stats par perso pour affichage
  // memberStatsByChar = { charName: { dmg, taken, heal, kills, killsNormal, killsElite, killsBoss, charIcon } }
  function getCharPs(charName) {
    const entry = charName ? memberStatsByChar[charName] : memberStatsByChar["_unknown"];
    if (!entry) return null;
    return {
      damageDealt: entry.dmg,
      damageTaken: entry.taken,
      healingDone: entry.heal,
      kills: { normal: entry.killsNormal, elite: entry.killsElite, boss: entry.killsBoss },
    };
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-5 max-h-[80vh]">
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {mvpScore != null && (
            <div className="flex flex-col items-center gap-0.5">
              {isGlobalMvp && <GIcon src={GI.crown} filter={GI_FILTER.yellow} size={18} title={t("title_mvp")} />}
              <span style={{
                fontSize: "0.62rem", fontFamily: "'Cinzel', serif", letterSpacing: "0.12em",
                color: isGlobalMvp ? "#fdd835" : "var(--c-muted)",
                lineHeight: 1,
              }}>{mvpScore.toFixed(2)}</span>
            </div>
          )}
          <h2 className="title-rune" style={{ fontSize: "1.1rem" }}>{member.pseudo}</h2>
          {combatCount > 0 && <span style={{ fontSize: "0.7rem", color: "var(--c-dim)" }}>{combatCount} combat{combatCount > 1 ? "s" : ""}</span>}
        </div>
        {titleCount && <TitleCountRow counts={titleCount} />}

        <div className="flex flex-col gap-5 overflow-y-auto scrollbar-hide flex-1">
        {/* Personnage actif + retraités avec stats dépliables par perso */}
        {hasAnyChar && (
          <div className="flex flex-col gap-2">
            <span className="sect-label" style={{ marginBottom: 0 }}>{t("company_characters")}</span>

            {hasActive && (() => {
              const ps = getCharPs(member.activeCharacter);
              const charKey = member.activeCharacter ?? "_unknown";
              return (
                <CharStatsBlock
                  label={member.activeCharacter}
                  iconSrc={member.charIcon ? CHAR_ICONS.find(ci => ci.id === member.charIcon)?.src : null}
                  isActive={true}
                  ps={ps}
                  hasBoss={(memberStatsByChar[member.activeCharacter]?.killsBoss ?? 0) > 0}
                  combatCount={combatCountByChar[charKey] ?? 0}
                  titleCounts={titleCountByChar[charKey] ?? null}
                  defaultOpen={true}
                />
              );
            })()}

            {hasRetired && [...member.retiredCharacters].sort((a, b) => new Date(b.retiredAt) - new Date(a.retiredAt)).map((rc, i) => {
              const ps = getCharPs(rc.name);
              const charKey = rc.name ?? "_unknown";
              return (
                <CharStatsBlock
                  key={i}
                  label={rc.name}
                  iconSrc={rc.charIcon ? CHAR_ICONS.find(ci => ci.id === rc.charIcon)?.src : null}
                  isActive={false}
                  retiredDate={rc.retiredAt
                    ? new Date(rc.retiredAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
                    : null}
                  ps={ps}
                  hasBoss={(memberStatsByChar[rc.name]?.killsBoss ?? 0) > 0}
                  combatCount={combatCountByChar[charKey] ?? 0}
                  titleCounts={titleCountByChar[charKey] ?? null}
                  defaultOpen={false}
                />
              );
            })}
          </div>
        )}

        {/* Stats globales en bas */}
        {globalPs && (
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline gap-2">
              <span className="sect-label" style={{ marginBottom: 0 }}>{t("company_global")}</span>
              <span style={{ fontSize: "0.65rem", color: "var(--c-dim)", fontStyle: "italic" }}>{t("company_global_note")}</span>
            </div>
            <CharStatsBlock
              label={t("company_cumul")}
              iconSrc={null}
              isActive={false}
              ps={globalPs}
              hasBoss={hasBossGlobal}
              defaultOpen={false}
            />
          </div>
        )}

        {!globalPs && !hasAnyChar && (
          <p style={{ color: "var(--c-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
            {t("company_no_data")}
          </p>
        )}
        </div>
      </div>
    </Modal>
  );
}

// ── Carte membre ──────────────────────────────────────────────────────────────
function MemberCard({ member, memberStats, memberStatsByChar = {}, titles, isGlobalMvp, mvpScore, combatCount, combatCountByChar, titleCount, titleCountByChar, onEdit }) {
  const t = useT();
  const [statsOpen, setStatsOpen] = useState(false);
  const memberTitles = titles ?? [];
  const legendTitles = memberTitles.filter(tk => tk !== "mvp");
  const charIconSrc = member.charIcon
    ? CHAR_ICONS.find(ci => ci.id === member.charIcon)?.src
    : null;

  return (
    <>
      <fieldset style={{
          background: "rgba(168,216,234,0.025)", borderRadius: 10, padding: "12px 16px",
          border: isGlobalMvp ? "1px solid rgba(234,179,8,0.25)" : "1px solid var(--c-border)",
          display: "flex", flexDirection: "column", gap: 12, minInlineSize: 0,
          ...(legendTitles.length === 0 ? { marginTop: "9px" } : {}),
        }}>
        {legendTitles.length > 0 && (
          <legend style={{ padding: "0 6px", margin: "0 auto", display: "flex", alignItems: "center", gap: 6 }}>
            {legendTitles.map((tk, i) => {
              const def = TITLE_DEFS.find(d => d.key === tk);
              if (!def) return null;
              return <GIcon key={i} src={def.src} filter={def.filter} size={20} title={t(`title_${tk}`)} />;
            })}
          </legend>
        )}

        {/* Nom + boutons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {isGlobalMvp && <GIcon src={GI.crown} filter={GI_FILTER.yellow} size={20} title={t("title_mvp")} />}
            <span style={{ fontFamily: "'Cinzel', serif", color: isGlobalMvp ? "#fdd835" : "var(--c-ice-light)", fontSize: "0.9rem", wordBreak: "break-word" }}>
              {member.pseudo}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => setStatsOpen(true)} className="btn-ghost-sm" title={t("company_player_card")}><IcoEye /></button>
            <button onClick={() => onEdit(member)} className="btn-ghost-sm" title={t("btn_edit")}><IcoPencil /></button>
          </div>
        </div>

        {/* Personnage actif */}
        {member.activeCharacter && (
          <div className="flex items-center gap-1.5">
            {charIconSrc && (
              <img src={charIconSrc} alt="" style={{ width: 16, height: 16, objectFit: "contain", opacity: 0.75, filter: "invert(0.6) sepia(1) saturate(2) hue-rotate(180deg)" }} />
            )}
            <span style={{ fontSize: "0.7rem", color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif", wordBreak: "break-all" }}>
              {member.activeCharacter}
            </span>
          </div>
        )}

      </fieldset>

      {statsOpen && (
        <MemberStatsModal
          member={member}
          memberStats={memberStats}
          memberStatsByChar={memberStatsByChar}
          isGlobalMvp={isGlobalMvp}
          mvpScore={mvpScore}
          combatCount={combatCount}
          combatCountByChar={combatCountByChar}
          titleCount={titleCount}
          titleCountByChar={titleCountByChar}
          onClose={() => setStatsOpen(false)}
        />
      )}
    </>
  );
}

// ── CharIcon selector ─────────────────────────────────────────────────────────
function CharIconSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {CHAR_ICONS.map(ci => (
        <button key={ci.id} type="button" onClick={() => onChange(value === ci.id ? "" : ci.id)}
          title={ci.label}
          className="w-8 h-8 rounded flex items-center justify-center transition-all"
          style={{
            background: value === ci.id ? "rgba(168,216,234,0.15)" : "rgba(168,216,234,0.03)",
            border: `1px solid ${value === ci.id ? "var(--c-ice-dim)" : "var(--c-border)"}`,
            cursor: "pointer",
          }}>
          <img src={ci.src} alt={ci.label} style={{ width: 20, height: 20, objectFit: "contain", opacity: value === ci.id ? 0.9 : 0.4, filter: "invert(0.6) sepia(1) saturate(2) hue-rotate(180deg)" }} />
        </button>
      ))}
    </div>
  );
}

// ── Modal édition membre ──────────────────────────────────────────────────────
function MemberEditModal({ member, onClose, onSave, onRetire, onRemove, isInActiveSession }) {
  const t = useT();
  const [pseudo, setPseudo] = useState(member.pseudo);
  const [error, setError] = useState(null);
  const [character, setCharacter] = useState(member.activeCharacter ?? "");
  const [charIcon, setCharIcon] = useState(member.charIcon ?? "");
  const [newCharacter, setNewCharacter] = useState("");
  const [newCharIcon, setNewCharIcon] = useState("");
  const [retireMode, setRetireMode] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(!!(member.activeCharacter || member.charIcon));

  function handleSave() {
    if (!pseudo.trim()) { setError(t("company_pseudo_required")); return; }
    onSave(member.id, pseudo.trim(), character.trim() || null, charIcon || null);
    onClose();
  }
  function handleRetire() {
    onRetire(member.id, newCharacter.trim() || null, newCharIcon || null);
    onClose();
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col gap-5">
        <h2 className="title-rune mb-1" style={{ fontSize: "1rem" }}>{member.pseudo}</h2>

        {!retireMode ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="sect-label" style={{ marginBottom: 2 }}>{t("company_pseudo")}</span>
              <input value={pseudo} onChange={e => { setPseudo(e.target.value); setError(null); }}
                className="input-frost" placeholder={t("company_pseudo_ph")} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="sect-label" style={{ marginBottom: 2 }}>{t("company_active_char")}</span>
              {editingCharacter ? (
                <>
                  <input value={character} onChange={e => setCharacter(e.target.value)} className="input-frost" placeholder={t("company_char_ph")} autoFocus />
                  <CharIconSelector value={charIcon} onChange={setCharIcon} />
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-xs italic" style={{ color: "var(--c-dim)" }}>{t("company_char_none")}</span>
                  <button type="button" onClick={() => setEditingCharacter(true)}
                    style={{
                      border: "1px dashed var(--c-border)", borderRadius: 6,
                      background: "none", color: "var(--c-muted)", cursor: "pointer",
                      padding: "2px 10px", fontSize: "0.8rem", lineHeight: 1.6,
                    }}>+</button>
                </div>
              )}
            </div>
            {member.activeCharacter && (
              <button onClick={() => setRetireMode(true)} className="btn-frost btn-save self-start" style={{ fontSize: "0.8rem" }}>
                <IcoRetire /> {t("company_retire_btn")}
              </button>
            )}
            <div className="divider-frost" />
            {error && <div className="error-frost">{error}</div>}
            <div className="flex justify-between items-center">
              {confirmRemove ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--c-muted)" }}>{t("company_remove_confirm")}</span>
                  <button onClick={() => { if (isInActiveSession) { setConfirmRemove(false); setError(t("company_in_session_err")); } else { onRemove(member.id); onClose(); } }} className="btn-frost btn-danger" style={{ fontSize: "0.75rem", padding: "3px 8px" }}>{t("btn_yes")}</button>
                  <button onClick={() => setConfirmRemove(false)} className="btn-frost btn-cancel" style={{ fontSize: "0.75rem", padding: "3px 8px" }}>{t("btn_no")}</button>
                </div>
              ) : (
                <button onClick={() => setConfirmRemove(true)} className="btn-ghost-sm text-xs" style={{ color: "var(--c-dim)" }}>
                  {t("company_remove_btn")}
                </button>
              )}
              <button onClick={handleSave} className="btn-frost btn-primary">
                <IcoCheck /> {t("btn_save")}
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-sm mb-1" style={{ color: "var(--c-text)" }}>
                {t("company_retire_msg", { charName: member.activeCharacter })}
              </p>
              <p className="text-xs" style={{ color: "var(--c-muted)" }}>{t("company_retire_hint")}</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="sect-label" style={{ marginBottom: 2 }}>{t("company_new_char")}</span>
              <input value={newCharacter} onChange={e => setNewCharacter(e.target.value)} className="input-frost" placeholder={t("company_char_ph")} />
              <CharIconSelector value={newCharIcon} onChange={setNewCharIcon} />
            </div>
            <div className="flex gap-3 justify-between">
              <button onClick={() => setRetireMode(false)} className="btn-frost btn-cancel"><IcoX /> {t("btn_cancel")}</button>
              <button onClick={handleRetire} className="btn-frost btn-primary"><IcoCheck /> {t("company_retire_confirm")}</button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
function CompanyPage() {
  const t = useT();
  const { formatDate: fmtDateFull, formatDateShort: fmtDate } = useDateFormatters();
  const { scenarios } = useProgress();
  const { company, setCompanyName, addMember, updateMemberPseudo,
    setMemberCharacter, setMemberCharIcon, retireMemberCharacter, removeMember } = useCompany();
  const { activeSession } = useSession();
  const showToast = useToast();

  const [editingMember, setEditingMember] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  const [newMemberPseudo, setNewMemberPseudo] = useState("");
  const [newMemberChar, setNewMemberChar] = useState("");
  const [newMemberCharIcon, setNewMemberCharIcon] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(company?.name ?? "");
  const [addError, setAddError] = useState(null);

  function handleSaveName() {
    if (nameInput.trim()) { setCompanyName(nameInput.trim()); setEditingName(false); }
  }
  function handleAddMember() {
    if (!newMemberPseudo.trim()) { setAddError(t("company_pseudo_required")); return; }
    const exists = company?.members?.some(m => m.pseudo.toLowerCase() === newMemberPseudo.trim().toLowerCase());
    if (exists) { setAddError(t("company_pseudo_exists")); return; }
    const id = addMember(newMemberPseudo.trim());
    if (newMemberChar.trim()) setMemberCharacter(id, newMemberChar.trim());
    if (newMemberCharIcon) setMemberCharIcon(id, newMemberCharIcon);
    setNewMemberPseudo(""); setNewMemberChar(""); setNewMemberCharIcon(""); setAddError(null); setAddingMember(false);
    showToast(t("company_added"));
  }
  function handleSaveMember(id, pseudo, character, charIcon) {
    updateMemberPseudo(id, pseudo);
    setMemberCharacter(id, character);
    setMemberCharIcon(id, charIcon);
    showToast(t("company_updated"));
  }

  // ── Agrégation sessions + charts + titres membres ─────────────────────────
  const { imp, memberStats, memberStatsByChar, memberTitles, sessions, scenarioStats, memberCombatStats, globalMvpId, mvpScoreById, combatCountPerMember, combatCountPerChar, titleCountPerMember, titleCountPerChar } = useMemo(() => {
    const storedSessions = (() => { try { return JSON.parse(storage.getItem(KEYS.pastSessions) ?? "[]"); } catch { return []; } })();
    const imp = (() => { try { return JSON.parse(storage.getItem(KEYS.campaignImport) ?? "null"); } catch { return null; } })();
    const members = company?.members ?? [];
    const sessions = activeSession
      ? [...storedSessions, {
          ...activeSession,
          endingDatetime: new Date().toISOString(),
          memberSnapshot: (activeSession.presentMemberIds ?? []).reduce((acc, id) => {
            const m = members.find(mb => mb.id === id);
            if (m) acc[id] = { pseudo: m.pseudo, activeCharacter: m.activeCharacter ?? null, charIcon: m.charIcon ?? null };
            return acc;
          }, {}),
        }]
      : storedSessions;

    // Agrégation par membre (cartes + radars)
    const memberAgg = {};
    const memberAggByChar = {};
    for (const session of sessions) {
      for (const sc of (session.scenarios ?? [])) {
        if (!sc.playerStats) continue;
        sc.playerStats.forEach((ps, i) => {
          const key = ps?.memberId ?? sc.memberIds?.[i] ?? sc.playerNames?.[i];
          if (!key) return;
          const snap = session?.memberSnapshot?.[key];
          const charName = snap && typeof snap === "object" ? (snap.activeCharacter ?? null) : null;
          const charIcon = snap && typeof snap === "object" ? (snap.charIcon ?? null) : null;
          if (!memberAgg[key]) memberAgg[key] = { dmg: 0, taken: 0, heal: 0, kills: 0, killsNormal: 0, killsElite: 0, killsBoss: 0 };
          memberAgg[key].dmg         += ps.damageDealt ?? 0;
          memberAgg[key].taken       += ps.damageTaken ?? 0;
          memberAgg[key].heal        += ps.healingDone ?? 0;
          memberAgg[key].killsNormal += ps.kills?.normal ?? 0;
          memberAgg[key].killsElite  += ps.kills?.elite  ?? 0;
          memberAgg[key].killsBoss   += ps.kills?.boss   ?? 0;
          memberAgg[key].kills       += killScore(ps.kills);
          const charKey = charName ?? "_unknown";
          if (!memberAggByChar[key]) memberAggByChar[key] = {};
          if (!memberAggByChar[key][charKey])
            memberAggByChar[key][charKey] = { charName, charIcon, dmg: 0, taken: 0, heal: 0, kills: 0, killsNormal: 0, killsElite: 0, killsBoss: 0 };
          memberAggByChar[key][charKey].dmg         += ps.damageDealt ?? 0;
          memberAggByChar[key][charKey].taken        += ps.damageTaken ?? 0;
          memberAggByChar[key][charKey].heal         += ps.healingDone ?? 0;
          memberAggByChar[key][charKey].killsNormal  += ps.kills?.normal ?? 0;
          memberAggByChar[key][charKey].killsElite   += ps.kills?.elite  ?? 0;
          memberAggByChar[key][charKey].killsBoss    += ps.kills?.boss   ?? 0;
          memberAggByChar[key][charKey].kills        += killScore(ps.kills);
        });
      }
    }

    // Titres globaux (actuels)
    const entries = Object.entries(memberAgg);
    function bestUnique(sorted, key) {
      const top = sorted[0];
      if (!top || top[1][key] <= 0) return null;
      if (sorted.length >= 2 && sorted[1][1][key] === top[1][key]) return null;
      return top;
    }
    const bestDps   = bestUnique([...entries].sort((a, b) => b[1].dmg   - a[1].dmg),   "dmg");
    const bestTank  = bestUnique([...entries].sort((a, b) => b[1].taken - a[1].taken), "taken");
    const bestHeal  = bestUnique([...entries].sort((a, b) => b[1].heal  - a[1].heal),  "heal");
    const bestKills = bestUnique([...entries].sort((a, b) => b[1].kills - a[1].kills), "kills");
    // MVP global (score composite sur agrégats totaux)
    const aggForMvp = entries.map(([, agg]) => ({ damageDealt: agg.dmg, damageTaken: agg.taken, healingDone: agg.heal, kills: { normal: agg.killsNormal, elite: agg.killsElite, boss: agg.killsBoss } }));
    const mvpRawScores = computeMVPScores(aggForMvp);
    const mvpEntries = entries.map(([id], i) => ({ id, score: mvpRawScores[i] })).sort((a, b) => b.score - a.score);
    const globalMvpId = mvpEntries.length >= 2 && mvpEntries[0].score === mvpEntries[1].score ? null : (mvpEntries[0]?.id ?? null);
    const mvpScoreById = Object.fromEntries(mvpEntries.map(e => [e.id, e.score]));

    const titlesByMember = {};
    if (globalMvpId) { titlesByMember[globalMvpId] = ["mvp"]; }
    if (bestDps)   { if (!titlesByMember[bestDps[0]])   titlesByMember[bestDps[0]]   = []; titlesByMember[bestDps[0]].push("dps"); }
    if (bestTank)  { if (!titlesByMember[bestTank[0]])  titlesByMember[bestTank[0]]  = []; titlesByMember[bestTank[0]].push("tank"); }
    if (bestHeal)  { if (!titlesByMember[bestHeal[0]])  titlesByMember[bestHeal[0]]  = []; titlesByMember[bestHeal[0]].push("heal"); }
    if (bestKills) { if (!titlesByMember[bestKills[0]]) titlesByMember[bestKills[0]] = []; titlesByMember[bestKills[0]].push("bourreau"); }

    // Combats trackés & titres par session par membre/perso
    const combatCountPerMember = {};
    const combatCountPerChar   = {};
    const titleCountPerMember  = {};
    const titleCountPerChar    = {};
    for (const session of sessions) {
      for (const sc of (session.scenarios ?? [])) {
        if (!sc.playerStats?.length) continue;
        const n = sc.playerStats.length;
        // Comptage combats
        sc.playerStats.forEach((ps, idx) => {
          const memberId = ps.memberId ?? sc.memberIds?.[idx];
          if (!memberId) return;
          combatCountPerMember[memberId] = (combatCountPerMember[memberId] ?? 0) + 1;
          const snap = session.memberSnapshot?.[memberId];
          const charKey = (snap && typeof snap === "object" ? snap.activeCharacter : null) ?? "_unknown";
          if (!combatCountPerChar[memberId]) combatCountPerChar[memberId] = {};
          combatCountPerChar[memberId][charKey] = (combatCountPerChar[memberId][charKey] ?? 0) + 1;
        });
        // Titres par scénario (pas de titre si égalité ou valeur nulle)
        if (n < 2) continue;
        const totals = sc.playerStats.map(ps => ({
          dmg: ps.damageDealt ?? 0, taken: ps.damageTaken ?? 0,
          heal: ps.healingDone ?? 0, kills: killScore(ps.kills),
        }));
        function bestIdx(key) {
          const sorted = [...totals.map((item,i) => ({i,v:item[key]}))].sort((a,b)=>b.v-a.v);
          if (sorted[0].v === 0) return null;
          if (sorted.length >= 2 && sorted[0].v === sorted[1].v) return null;
          return sorted[0].i;
        }
        // MVP per scenario
        const mvpRaw = computeMVPScores(sc.playerStats);
        const mvpSorted = mvpRaw.map((s,i)=>({i,s})).sort((a,b)=>b.s-a.s);
        const mvpIdx = mvpSorted.length>=2 && mvpSorted[0].s===mvpSorted[1].s ? null : mvpSorted[0].i;
        const awards = [["dps",bestIdx("dmg")],["tank",bestIdx("taken")],["heal",bestIdx("heal")],["bourreau",bestIdx("kills")],["mvp",mvpIdx]];
        for (const [titleKey, idx] of awards) {
          if (idx === null) continue;
          const memberId = sc.playerStats?.[idx]?.memberId ?? sc.memberIds?.[idx];
          if (!memberId) continue;
          if (!titleCountPerMember[memberId]) titleCountPerMember[memberId] = { dps:0, tank:0, heal:0, bourreau:0, mvp:0 };
          titleCountPerMember[memberId][titleKey]++;
          const snap = session.memberSnapshot?.[memberId];
          const charKey = (snap && typeof snap === "object" ? snap.activeCharacter : null) ?? "_unknown";
          if (!titleCountPerChar[memberId]) titleCountPerChar[memberId] = {};
          if (!titleCountPerChar[memberId][charKey]) titleCountPerChar[memberId][charKey] = { dps:0, tank:0, heal:0, bourreau:0, mvp:0 };
          titleCountPerChar[memberId][charKey][titleKey]++;
        }
      }
    }

    // Stats scénarios (charts)
    const unlocked  = scenarios.filter(s => !s.blockedAt && s.finishedAt === null).length;
    const finished  = scenarios.filter(s => s.finishedAt !== null).length;
    const blocked   = scenarios.filter(s => s.blockedAt).length;
    const allPlayed = sessions.flatMap(s => (s.scenarios ?? []).filter(sc => sc.number !== ""));
    const realVictories = allPlayed.filter(s => s.result === "victory").length;
    const realDefeats   = allPlayed.filter(s => s.result === "defeat").length;
    const importedFinished = Math.max(0, finished - realVictories);
    const importDefeats = (imp?.winRate != null && imp.winRate > 0 && importedFinished > 0)
      ? Math.round(importedFinished * (100 - imp.winRate) / imp.winRate) : 0;

    // Stats combat par membre (radars)
    const memberCombatStats = members.map(m => ({
      name: m.pseudo,
      ...(memberAgg[m.id] ?? { dmg: 0, taken: 0, heal: 0, killsNormal: 0, killsElite: 0, killsBoss: 0 }),
    }));

    return {
      imp,
      memberStats: memberAgg,
      memberStatsByChar: memberAggByChar,
      memberTitles: titlesByMember,
      sessions,
      scenarioStats: { unlocked, finished, blocked, victories: realVictories + importedFinished, defeats: realDefeats + importDefeats, importedFinished },
      memberCombatStats,
      globalMvpId,
      mvpScoreById,
      combatCountPerMember,
      combatCountPerChar,
      titleCountPerMember,
      titleCountPerChar,
    };
  }, [scenarios, company, activeSession]);

  const sessionChartData = useMemo(() =>
    sessions
      .filter(s => s.startingDatetime && s.endingDatetime)
      .map((s, i) => ({
        idx: i + 1,
        date: fmtDate(s.startingDatetime),
        dureeMs: new Date(s.endingDatetime) - new Date(s.startingDatetime),
        dureeH: Math.round((new Date(s.endingDatetime) - new Date(s.startingDatetime)) / 360000) / 10,
      }))
      .filter(s => s.dureeMs > 0),
  [sessions, fmtDate]);

  const avgMs     = sessionChartData.length ? sessionChartData.reduce((a, b) => a + b.dureeMs, 0) / sessionChartData.length : 0;
  const longestMs = sessionChartData.length ? Math.max(...sessionChartData.map(s => s.dureeMs)) : 0;
  const totalMs   = sessionChartData.reduce((a, s) => a + s.dureeMs, 0);
  const importMs  = (imp?.avgDurationMs ?? 0) * (imp?.sessionCount ?? 0);
  const totalImportH  = Math.round((totalMs + importMs) / 3600000);
  const totalSessions = sessionChartData.length + (imp?.sessionCount ?? 0);

  // ── Données charts ─────────────────────────────────────────────────────────
  const resultPieData = [
    { name: t("lbl_victory"), value: scenarioStats.victories, fill: C.green },
    { name: t("lbl_defeat"),  value: scenarioStats.defeats,   fill: C.red },
  ].filter(d => d.value > 0);

  const scenarioTotal = scenarioStats.finished + scenarioStats.unlocked + scenarioStats.blocked;


  const statDealt = t("combat_damage_dealt");
  const statTaken = t("combat_damage_taken");
  const statHeal  = t("combat_healing");

  const damageBarData = [
    { stat: statDealt, ...Object.fromEntries(memberCombatStats.map(m => [m.name, m.dmg]))   },
    { stat: statTaken, ...Object.fromEntries(memberCombatStats.map(m => [m.name, m.taken])) },
    { stat: statHeal,  ...Object.fromEntries(memberCombatStats.map(m => [m.name, m.heal]))  },
  ];

  const KILLS_CATS = [
    { key: "killsNormal", label: t("combat_kills_normal"), color: "var(--c-text)",  icon: GI.skull,       filter: GI_FILTER.white,  iconSize: 16 },
    { key: "killsElite",  label: t("combat_kills_elite"),  color: "#ffd54f",        icon: GI.dreadSkull,  filter: GI_FILTER.yellow, iconSize: 18 },
    { key: "killsBoss",   label: t("combat_kills_boss"),   color: "#e57373",        icon: GI.crownSkull,  filter: GI_FILTER.red,    iconSize: 18 },
    { key: "kills",       label: t("chart_score"),         color: C.iceDim,         icon: GI.tripleSkull, filter: GI_FILTER.white,  iconSize: 18 },
  ];


  const hasResults    = resultPieData.length > 0;
  const hasCombatData = memberCombatStats.some(m => m.dmg > 0 || m.killsNormal > 0);

  const members = company?.members ?? [];

  return (
    <div className="h-screen flex items-stretch justify-between overflow-hidden">
      <div className="flex-shrink-0 flex items-center">
        <NavPill to="/" icon={<IcoHome />} label={t("nav_menu")} side="left" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-4">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">

          {/* ── Compagnie ── */}
          <div className="frost-block p-7">
            <div className="flex items-center justify-between mb-6">
              {editingName ? (
                <div className="flex items-center gap-2 flex-1">
                  <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                    className="input-frost flex-1" placeholder={t("company_name_ph")} />
                  <button onClick={handleSaveName} className="btn-ghost-sm" title={t("btn_save")} style={{ color: "var(--c-ice-dim)" }}><IcoCheck /></button>
                  <button onClick={() => setEditingName(false)} className="btn-ghost-sm" title={t("btn_cancel")}><IcoX /></button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="title-rune" style={{ fontSize: "1.3rem" }}>{company?.name || t("company_default_name")}</h1>
                  <button onClick={() => { setNameInput(company?.name ?? ""); setEditingName(true); }} className="btn-ghost-sm" title={t("company_edit_name")}><IcoPencil /></button>
                </div>
              )}
            </div>

            {/* Membres */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="sect-label" style={{ marginBottom: 0 }}>{t("company_members")}</span>
                <TitlesBadge />
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {members.map(m => (
                  <MemberCard key={m.id} member={m}
                    memberStats={memberStats[m.id] ?? null}
                    memberStatsByChar={memberStatsByChar[m.id] ?? {}}
                    titles={memberTitles[m.id] ?? []}
                    isGlobalMvp={globalMvpId === m.id}
                    mvpScore={mvpScoreById[m.id] ?? null}
                    combatCount={combatCountPerMember[m.id] ?? 0}
                    combatCountByChar={combatCountPerChar[m.id] ?? {}}
                    titleCount={titleCountPerMember[m.id] ?? null}
                    titleCountByChar={titleCountPerChar[m.id] ?? {}}
                    onEdit={setEditingMember} />
                ))}
                <button onClick={() => setAddingMember(true)}
                    className="frost-inner p-4 flex flex-col items-center justify-center gap-2 transition-all"
                    style={{ border: "1px dashed var(--c-border)", background: "none", cursor: "pointer", minHeight: 80, color: "var(--c-dim)" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--c-ice-dim)"; e.currentTarget.style.color = "var(--c-ice-dim)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--c-border)"; e.currentTarget.style.color = "var(--c-dim)"; }}>
                    <IcoPlus />
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.1em" }}>{t("company_add")}</span>
                  </button>
              </div>
            </div>
          </div>

          {/* ── Sessions ── */}
          <ChartSection
            title={t("chart_sessions")}
            note={imp?.sessionCount > 0 ? t("chart_estimates") : undefined}
          >
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <Pill label={t("chart_start")} value={fmtDateFull(imp?.campaignStart)} />
                <Pill label={t("chart_last_session")} value={fmtDateFull(sessions[sessions.length - 1]?.startingDatetime)} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Pill label={t("chart_total_sessions")} value={totalSessions}
                  note={imp?.sessionCount > 0 ? t("chart_estimated_n", { n: imp.sessionCount }) : undefined} />
                <Pill label={t("chart_total_hours")} value={`${totalImportH}h`} />
                <Pill label={t("chart_avg_duration")} value={fmtDuration(avgMs)} />
                <Pill label={t("chart_longest")} value={longestMs > 0 ? fmtDuration(longestMs) : "—"} />
              </div>
            </div>
          </ChartSection>

          {/* ── Scénarios ── */}
          <ChartSection title={t("chart_scenarios")} note={imp?.winRate != null ? t("chart_estimates") : undefined}>
            {scenarioTotal === 0 && !hasResults ? (
              <p className="text-sm italic text-center py-4" style={{ color: "var(--c-muted)" }}>{t("chart_no_data")}</p>
            ) : (
              <div className="flex flex-col gap-6">

                {/* Scénarios — 3 blocs */}
                {scenarioTotal > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    <Pill label={t("chart_finished")} value={scenarioStats.finished} />
                    <Pill label={t("chart_available")} value={scenarioStats.unlocked} />
                    {scenarioStats.blocked > 0
                      ? <Pill label={t("chart_blocked")} value={scenarioStats.blocked} />
                      : <div />}
                  </div>
                )}

                {/* Camembert victoires/défaites */}
                {hasResults && (() => {
                  const RADIAN = Math.PI / 180;
                  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    if (percent < 0.08) return null;
                    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + r * Math.cos(-midAngle * RADIAN);
                    const y = cy + r * Math.sin(-midAngle * RADIAN);
                    return (
                      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
                        style={{ fontSize: "0.7rem", fontFamily: "'Cinzel', serif" }}>
                        {Math.round(percent * 100)}%
                      </text>
                    );
                  };
                  return (
                    <div style={{ display: "grid", gridTemplateColumns: "80px 160px 80px", alignItems: "center", margin: "0 auto" }}>
                      <span style={{ color: C.green, fontSize: "0.8rem", fontFamily: "'Cinzel', serif", textAlign: "right", paddingRight: 12 }}>
                        {t("chart_victories", { n: scenarioStats.victories })}
                      </span>
                      <div className="flex flex-col items-center">
                        <span style={{ fontSize: "0.75rem", color: "var(--c-muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}>{t("chart_results")}</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--c-dim)" }}>
                          {t("chart_played_n", { n: scenarioStats.victories + scenarioStats.defeats })}
                          {scenarioStats.importedFinished > 0 && <span style={{ fontStyle: "italic" }}> ({t("chart_estimated_played_n", { n: scenarioStats.importedFinished })})</span>}
                        </span>
                        <PieChart width={160} height={160} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                          <Pie data={resultPieData} cx={80} cy={80} innerRadius={45} outerRadius={72}
                            dataKey="value" label={renderLabel} labelLine={false} isAnimationActive={false}
                            startAngle={90} endAngle={450}>
                            {resultPieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                          </Pie>
                        </PieChart>
                      </div>
                      <span style={{ color: C.red, fontSize: "0.8rem", fontFamily: "'Cinzel', serif", textAlign: "left", paddingLeft: 12 }}>
                        {t("chart_defeats", { n: scenarioStats.defeats })}
                      </span>
                    </div>
                  );
                })()}

              </div>
            )}
          </ChartSection>

          {/* ── Combat ── */}
          {hasCombatData && (
            <ChartSection title={t("chart_combat")}>

              {/* Barres groupées dégâts & soins */}
              <span style={{ fontSize: "0.75rem", color: "var(--c-muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em" }}>{t("chart_damage_label")}</span>
              <ResponsiveContainer width="100%" height={185}>
                <BarChart data={damageBarData} margin={{ top: 4, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="stat" axisLine={false} tickLine={false} height={32}
                    tick={({ x, y, payload }) => {
                      const cfg = {
                        [statDealt]: { color: "#e57373", icon: GI.swords,       filter: GI_FILTER.red   },
                        [statTaken]: { color: "#64b5f6", icon: GI.shieldImpact, filter: GI_FILTER.blue  },
                        [statHeal]:  { color: "#81c784", icon: GI.heart,        filter: GI_FILTER.green },
                      }[payload.value] ?? {};
                      return (
                        <foreignObject x={x - 32} y={y + 2} width={64} height={22}>
                          <div xmlns="http://www.w3.org/1999/xhtml"
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3, color: cfg.color, fontSize: 11 }}>
                            <img src={cfg.icon} style={{ width: 11, height: 11, filter: cfg.filter }} />
                            {payload.value}
                          </div>
                        </foreignObject>
                      );
                    }}
                  />
                  <YAxis width={36} tick={{ fill: C.muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<FrostTooltip />} isAnimationActive={false} />
                  {memberCombatStats.map((m, i) => (
                    <Bar key={m.name} dataKey={m.name} fill={PLAYER_COLORS[i % PLAYER_COLORS.length]}
                      radius={[3, 3, 0, 0]} fillOpacity={0.85} />
                  ))}
                </BarChart>
              </ResponsiveContainer>

              {/* Légende joueurs */}
              <div className="flex gap-4 flex-wrap">
                {memberCombatStats.map((m, i) => (
                  <div key={m.name} className="flex items-center gap-1.5 text-xs">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: PLAYER_COLORS[i % PLAYER_COLORS.length], display: "inline-block" }} />
                    <span style={{ color: C.muted }}>{m.name}</span>
                  </div>
                ))}
              </div>

              {/* Leaderboard kills */}
              <span style={{ fontSize: "0.75rem", color: "var(--c-muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.06em", marginTop: 8 }}>{t("chart_kills_label")}</span>
              <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${KILLS_CATS.length}, 1fr)` }}>
                {KILLS_CATS.map(cat => {
                  const sorted = [...memberCombatStats].sort((a, b) => b[cat.key] - a[cat.key]);
                  return (
                    <div key={cat.key} className="frost-inner p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <span style={{ width: 18, display: "inline-flex", justifyContent: "center" }}><GIcon src={cat.icon} filter={cat.filter} size={cat.iconSize ?? 18} /></span>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: C.muted, letterSpacing: "0.08em" }}>{cat.label.toUpperCase()}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {sorted.map((m, i) => (
                          <div key={m.name} className="flex items-center justify-between text-xs">
                            <span style={{ color: i === 0 && m[cat.key] > 0 ? "var(--c-ice-light)" : C.muted }}>{m.name}</span>
                            <span style={{ fontFamily: "'Cinzel', serif", color: i === 0 && m[cat.key] > 0 ? cat.color : C.dim }}>{m[cat.key]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

            </ChartSection>
          )}

        </div>
      </div>

      <div className="flex-shrink-0 flex items-center">
        {activeSession
          ? <NavPillSession startingDatetime={activeSession.startingDatetime} side="right" />
          : <NavPill to="/new-session" icon={<IcoPlusCircle />} label={t("nav_newSession")} side="right" />
        }
      </div>

      {addingMember && (
        <Modal onClose={() => { setAddingMember(false); setAddError(null); setNewMemberPseudo(""); setNewMemberChar(""); setNewMemberCharIcon(""); }}>
          <div className="flex flex-col gap-5">
            <h2 className="title-rune mb-1" style={{ fontSize: "1rem" }}>{t("company_new_member")}</h2>
            <div className="flex flex-col gap-2">
              <span className="sect-label" style={{ marginBottom: 2 }}>{t("company_pseudo")} *</span>
              <input value={newMemberPseudo}
                onChange={e => { setNewMemberPseudo(e.target.value); setAddError(null); }}
                onKeyDown={e => e.key === "Enter" && handleAddMember()}
                className="input-frost" placeholder={t("company_pseudo_ph")} autoFocus />
            </div>
            <div className="flex flex-col gap-2">
              <span className="sect-label" style={{ marginBottom: 2 }}>{t("company_optional_char")}</span>
              <input value={newMemberChar} onChange={e => setNewMemberChar(e.target.value)}
                className="input-frost" placeholder={t("company_char_ph")} />
              <CharIconSelector value={newMemberCharIcon} onChange={setNewMemberCharIcon} />
            </div>
            {addError && <div className="error-frost">{addError}</div>}
            <div className="flex gap-3 justify-between">
              <button onClick={() => { setAddingMember(false); setAddError(null); setNewMemberPseudo(""); setNewMemberChar(""); setNewMemberCharIcon(""); }} className="btn-frost btn-cancel">
                <IcoX /> {t("btn_cancel")}
              </button>
              <button onClick={handleAddMember} className="btn-frost btn-primary">
                <IcoCheck /> {t("btn_add")}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editingMember && (
        <MemberEditModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleSaveMember}
          onRetire={(id, c, i) => { retireMemberCharacter(id, c, i); showToast(t("company_retired")); }}
          onRemove={(id) => { removeMember(id); showToast(t("company_removed"), "warning"); }}
          isInActiveSession={activeSession?.presentMemberIds?.includes(editingMember?.id) ?? false}
        />
      )}
    </div>
  );
}

export default CompanyPage;
