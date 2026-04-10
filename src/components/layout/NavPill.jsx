import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { IcoEdit } from "../ui/Icons";
import { useT } from "../../context/LanguageContext";

export function NavPill({ to, icon, label, side }) {
  return (
    <Link to={to} className={side === "left" ? "nav-pill-l" : "nav-pill-r"}>
      {icon}
      <span className="nav-pill-label">{label}</span>
    </Link>
  );
}

// ── Chrono helper ─────────────────────────────────────────────────────────────
function formatElapsed(startIso) {
  if (!startIso) return null;
  const diff = Date.now() - new Date(startIso).getTime();
  if (diff < 0) return "<1mn";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (diff < 60000) return "<1mn";
  if (h >= 24) return ">24h";
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  return `${m}mn`;
}

// ── NavPill session active avec chrono ────────────────────────────────────────
export function NavPillSession({ startingDatetime, side }) {
  const t = useT();
  const [elapsed, setElapsed] = useState(() => formatElapsed(startingDatetime));

  useEffect(() => {
    const id = setInterval(() => setElapsed(formatElapsed(startingDatetime)), 1000);
    return () => clearInterval(id);
  }, [startingDatetime]);

  return (
    <Link to="/active-session" className={side === "left" ? "nav-pill-l" : "nav-pill-r"}>
      <IcoEdit />
      <span className="nav-pill-label">{t("nav_activeSession")}</span>
      {elapsed && (
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.58rem",
          color: "var(--c-ice-dim)",
          letterSpacing: "0.06em",
          marginTop: -2,
          tabularNums: true,
        }}>
          {elapsed}
        </span>
      )}
    </Link>
  );
}
