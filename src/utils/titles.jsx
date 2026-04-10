import { GI, GI_FILTER, GIcon } from "./gameIcons.jsx";

export const TITLE_DEFS = [
  { key: "mvp",      src: GI.crown,       filter: GI_FILTER.yellow, label: "Champion", desc: "Meilleure contribution globale" },
  { key: "dps",      src: GI.machete,     filter: GI_FILTER.red,    label: "Boucher",  desc: "Dégâts infligés les plus élevés" },
  { key: "tank",     src: GI.shield,      filter: GI_FILTER.blue,   label: "Rempart",  desc: "Dégâts subis les plus élevés" },
  { key: "heal",     src: GI.angel,       filter: GI_FILTER.green,  label: "Gardien",  desc: "Soins prodigués les plus élevés" },
  { key: "bourreau", src: GI.tripleSkull, filter: GI_FILTER.white,  label: "Assassin", desc: <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>Score kills (<GIcon src={GI.skull} filter={GI_FILTER.white} size={11}/>×1 · <GIcon src={GI.dreadSkull} filter={GI_FILTER.yellow} size={11}/>×2 · <GIcon src={GI.crownSkull} filter={GI_FILTER.red} size={11}/>×3)</span> },
];

// Lookup par clé
export const TITLE_BY_KEY = Object.fromEntries(TITLE_DEFS.map(d => [d.key, d]));
