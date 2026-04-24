// Chemins vers les icônes game-icons dans /assets/icons/
export const GI = {
  swords:       "/assets/icons/crossed-swords.svg",
  crossMark:    "/assets/icons/cross-mark.svg",
  shieldImpact: "/assets/icons/shield-impact.svg",
  heart:        "/assets/icons/glass-heart.svg",
  skull:        "/assets/icons/death-skull.svg",
  dreadSkull:   "/assets/icons/dread-skull.svg",
  crownSkull:   "/assets/icons/crowned-skull.svg",
  crown:        "/assets/icons/crown.svg",
  shield:       "/assets/icons/bordered-shield.svg",
  machete:      "/assets/icons/machete.svg",
  calendar:     "/assets/icons/calendar.svg",
  clock:        "/assets/icons/alarm-clock.svg",
  hourglass:    "/assets/icons/hourglass.svg",
  angel:        "/assets/icons/angel-outfit.svg",
  tripleSkull:  "/assets/icons/triple-skulls.svg",
  barracks:     "/assets/icons/barracks-tent.svg",
  scroll:       "/assets/icons/scroll-unfurled.svg",
  treasureMap:  "/assets/icons/treasure-map.svg",
  swordClash:   "/assets/icons/sword-clash.svg",
  pirateGrave:  "/assets/icons/pirate-grave.svg",
};

// Filtres CSS pour coloriser des SVG noirs
// Générés via https://codepen.io/sosuke/pen/Pjoqqp (black -> target color)
export const GI_FILTER = {
  red:       "brightness(0) saturate(100%) invert(23%) sepia(97%) saturate(1200%) hue-rotate(340deg) brightness(110%)",
  blue:      "brightness(0) saturate(100%) invert(42%) sepia(80%) saturate(600%) hue-rotate(195deg) brightness(105%)",
  green:     "brightness(0) saturate(100%) invert(65%) sepia(30%) saturate(600%) hue-rotate(90deg) brightness(100%)",
  white:     "brightness(0) saturate(100%) invert(100%) brightness(95%)",
  yellow:    "brightness(0) saturate(100%) invert(90%) sepia(50%) saturate(800%) hue-rotate(5deg) brightness(110%)",
  greyLight: "brightness(0) saturate(100%) invert(75%) sepia(5%) saturate(200%) hue-rotate(180deg) brightness(95%)",
  sand:      "brightness(0) saturate(100%) invert(70%) sepia(30%) saturate(400%) hue-rotate(20deg) brightness(100%)",
  pink:      "brightness(0) saturate(100%) invert(60%) sepia(50%) saturate(700%) hue-rotate(290deg) brightness(110%)",
};

const assetPath = (path) => {
  return `${import.meta.env.BASE_URL}${path}`;
};
// Composant React pour afficher une icône game-icons
// Usage : <GIcon src={GI.swords} filter={GI_FILTER.blue} size={16} />
export function GIcon({ src, filter, size = 16, style = {}, className = "", title }) {
  return (
    <img
      src={assetPath(src)}
      alt={title ?? ""}
      title={title}
      style={{ width: size, height: size, objectFit: "contain", filter, ...style }}
      className={className}
    />
  );
}
