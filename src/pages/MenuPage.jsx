import { Link } from "react-router-dom";
import { useState } from "react";
import { useSession } from "../context/SessionContext";
import { NavPill, NavPillSession } from "../components/layout/NavPill";
import { IcoHistory, IcoPlusCircle } from "../components/ui/Icons";
import { GI, GI_FILTER, GIcon } from "../utils/gameIcons.jsx";
import { KEYS } from "../utils/storageKeys";
import storage from "../utils/storage";
import { useT } from "../context/LanguageContext";

function MenuLink({ to, icon, iconFilter, label, accent }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link to={to} style={{ textDecoration: "none", display: "block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      <div className="flex flex-col items-center px-4 py-2.5 gap-1.5">
        <div className="flex items-center gap-3">
          <GIcon src={icon} filter={hovered ? (iconFilter ?? GI_FILTER.white) : GI_FILTER.greyLight} size={22} />
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.9rem",
            letterSpacing: "0.08em",
            color: hovered ? (accent ?? "var(--c-ice)") : "var(--c-text)",
            transition: "color 0.15s",
          }}>
            {label}
          </span>
        </div>
        <div style={{
          width: "70%",
          height: "0.5px",
          background: hovered ? (accent ?? "var(--c-ice-dim)") : "transparent",
          transition: "background 0.15s",
        }} />
      </div>
    </Link>
  );
}

function MenuPage() {
  const { activeSession } = useSession();
  const combatInProgress = !!storage.getItem(KEYS.scenarioStatsSetup);
  const t = useT();

  return (
    <div className="min-h-screen flex items-center justify-between">
      <div className="flex-shrink-0 flex items-center">
        <NavPill to="/last-session" icon={<IcoHistory />} label={t("nav_pastSessions")} side="left" />
      </div>

      <div className="frost-block px-8 py-8 mx-auto flex flex-col items-center gap-7" style={{ minWidth: 380 }}>
        <div className="text-center">
          <h1 className="title-rune" style={{ fontSize: "1.2rem", letterSpacing: "0.25em", marginRight: "-0.25em" }}>{t("app_title")}</h1>
          <p className="text-xs mt-1" style={{ color: "var(--c-ice-dim)", fontFamily: "'Cinzel', serif", letterSpacing: "0.15em", fontSize: "0.65rem" }}>{t("app_subtitle")}</p>
        </div>

        <div className="divider-frost w-full" />

        <nav className="flex flex-col gap-2 items-center">
          <MenuLink to="/company"
            icon={GI.barracks} iconFilter={GI_FILTER.blue}
            accent="var(--c-ice-dim)"
            label={t("menu_company")} />
          <MenuLink to="/scenarios"
            icon={GI.treasureMap} iconFilter={GI_FILTER.yellow}
            accent="rgba(253,216,53,0.6)"
            label={t("menu_scenarios")} />
          {activeSession && (
            <MenuLink to="/scenario-stats"
              icon={GI.swordClash} iconFilter={GI_FILTER.red}
              accent="#e57373"
              label={combatInProgress ? t("menu_stats_active") : t("menu_combat_stats")} />
          )}
          <MenuLink to="/notes"
            icon={GI.scroll} iconFilter={GI_FILTER.sand}
            accent="rgba(210,180,140,0.7)"
            label={t("menu_notes")} />
        </nav>

        <div className="divider-frost w-full" />

        <Link to="/entry" className="text-xs transition-colors" style={{ color: "var(--c-muted)", fontFamily: "'Cinzel', serif", letterSpacing: "0.1em", textDecoration: "none" }}
          onMouseEnter={e => e.target.style.color = "var(--c-ice-dim)"} onMouseLeave={e => e.target.style.color = "var(--c-muted)"}>
          {t("menu_home")}
        </Link>
      </div>

      <div className="flex-shrink-0 flex items-center">
        {activeSession
          ? <NavPillSession startingDatetime={activeSession?.startingDatetime} side="right" />
          : <NavPill to="/new-session" icon={<IcoPlusCircle />} label={t("nav_newSession")} side="right" />
        }
      </div>
    </div>
  );
}

export default MenuPage;
