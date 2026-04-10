# Frostlog — Contexte projet pour Claude Code

## Stack
- React + Vite + Tailwind CSS
- 100% frontend, localStorage uniquement
- Objectif futur : build desktop via Tauri
- Recharts pour les graphiques

## Structure src/
```
src/
  App.jsx                          # Routes principales
  main.jsx
  index.css                        # Variables CSS + classes utilitaires
  context/
    ProgressContext.jsx            # Scénarios + état campagne (useProgress)
    SessionContext.jsx             # Session active + endSession (useSession)
  guards/
    CampaignGuard.jsx
    SessionGuard.jsx
  pages/
    EntryPage.jsx                  # Accueil / import / nouvelle campagne
    MenuPage.jsx                   # Menu principal
    CompanyPage.jsx                # Compagnie + membres + stats globales
    ChartsPage.jsx                 # Graphiques (barres sessions, camemberts scénarios, radars combat)
    LastSessionPage.jsx            # Historique sessions passées
    ActiveSessionPage.jsx
    NewSessionPage.jsx
    ScenariosPage.jsx
    ScenarioStatsPage.jsx          # Tracker de combat en session
    NotesPage.jsx
    ImportCampaignPage.jsx
  components/
    layout/
      AppLayout.jsx
      NavPill.jsx                  # NavPill, NavPillSession, IconHome, IconHistory, IconPlus, IconEdit
    session/
      ActiveSessionForm.jsx
      EndSessionModal.jsx
      NewSessionForm.jsx
    scenario/
      ScenarioCard.jsx
      ScenarioForm.jsx
    ui/
      Modal.jsx                    # Fermeture Echap + clic extérieur
      CombatIcons.jsx              # Non utilisé, ignorer
  utils/
    dateUtils.js                   # localISOString, localISOStringToMinute
    gameIcons.jsx                  # GI (chemins SVG), GI_FILTER (filtres CSS), GIcon (composant)
```

## Design system

### Variables CSS (index.css)
```css
--c-ice          /* blanc glacé — titres */
--c-ice-light    /* texte principal clair */
--c-ice-dim      /* accents, bordures actives */
--c-surface      /* fond des blocs */
--c-border       /* bordures neutres */
--c-text         /* texte courant */
--c-muted        /* texte secondaire */
--c-dim          /* texte très atténué */
```

### Classes utilitaires
- `frost-block` — bloc principal (fond + bordure + radius)
- `frost-inner` — bloc imbriqué plus sombre
- `title-rune` — titre Cinzel majuscules espacées
- `sect-label` — label de section (small caps)
- `input-frost`, `select-frost`, `textarea-frost` — inputs stylisés
- `btn-frost` + `btn-primary` / `btn-save` / `btn-cancel` / `btn-danger` — boutons
- `btn-ghost-sm` — petit bouton fantôme (icône seule)
- `stat-block`, `stat-value` — blocs de statistiques
- `badge-victory`, `badge-defeat` — badges résultat
- `divider-frost` — séparateur
- `scrollbar-hide` — masquer la scrollbar
- `error-frost` — message d'erreur

### Typographie
- Titres : `'Cinzel', serif`
- Corps : `'Crimson Pro', serif`

### Icônes game-icons (GIcon)
Fichiers SVG dans `/assets/icons/`. Colorisation via filtres CSS.
```js
import { GI, GI_FILTER, GIcon } from "../utils/gameIcons.jsx";
// Usage : <GIcon src={GI.swords} filter={GI_FILTER.red} size={16} />
```
Icônes disponibles : `swords`, `shieldImpact`, `crossMark`, `heart`, `skull`, `dreadSkull`, `crownSkull`, `crown`, `shield`, `machete`, `calendar`, `clock`, `hourglass`, `angel`, `tripleSkull`, `barracks`, `scroll`, `treasureMap`, `swordClash`, `pirateGrave`

Filtres disponibles : `red`, `blue`, `green`, `white`, `yellow`, `greyLight`, `sand`, `pink`

Conventions couleurs :
- Dégâts infligés → rouge (`GI.swords`, `GI_FILTER.red`)
- Dégâts subis → bleu (`GI.shieldImpact`, `GI_FILTER.blue`)
- Soins → vert (`GI.heart`, `GI_FILTER.green`)
- Normaux → blanc (`GI.skull`, `GI_FILTER.white`)
- Élites → jaune (`GI.dreadSkull`, `GI_FILTER.yellow`)
- Boss → rouge (`GI.crownSkull`, `GI_FILTER.red`)
- Couronne MVP → jaune (`GI.crown`, `GI_FILTER.yellow`)
- Titre DPS → rouge (`GI.machete`, `GI_FILTER.red`)
- Titre Tank → bleu (`GI.shield`, `GI_FILTER.blue`)
- Titre Heal → vert (`GI.angel`, `GI_FILTER.green`)
- Titre Bourreau → blanc (`GI.tripleSkull`, `GI_FILTER.white`)

- Calendrier / horloge / sablier → gris clair (`GI.calendar` / `GI.clock` / `GI.hourglass`, `GI_FILTER.greyLight`)

### Icônes personnages (classes Frosthaven)
Fichiers PNG dans `/assets/char_icones/fh-{id}-bw-icon.png`
Filtre CSS pour colorisation : `invert(0.6) sepia(1) saturate(2) hue-rotate(180deg)`
IDs : bannerspear, blinkblade, boneshaper, crashing-tide, deathwalker, deepwraith, drifter, frozen-fist, geminate, hive, infuser, metal-mosaic, pain-conduit, pyroclast, shattersong, snowdancer, trapper

---

## Structure des données (localStorage)

### `"progress"` — scénarios
```js
[{ id, number, finishedAt, note, unlockedAt, priority, blockedAt, unlockedBy }]
// unlockedBy: { type: "scenario"|"quete"|"evenement"|"section", value: number|string, sectionContext?: string } | null
// Rétrocompat : unlockedBy peut être un number (ancien format) → normaliser via normalizeUB()
// normalizeUB(ub) : if (!ub) return null; if (typeof ub === "number") return { type: "scenario", value: ub }; return ub;
```

### `"activeSession"` — session en cours
```js
{
  startingDatetime,           // ISO string local
  presentMemberIds: [],       // IDs des membres présents
  scenarios: [{
    id, number, result,       // result: "victory" | "defeat" | null
    playerStats: [{
      damageDealt, damageTaken, healingDone,
      kills: { normal, elite, boss }
    }],
    memberIds: [],            // IDs dans le même ordre que playerStats
    hasBoss: bool
  }],
  unlockedDuringSession: [{ number, note }]
}
```

### `"pastSessions"` — sessions terminées
Même structure qu'activeSession, plus :
```js
{
  endingDatetime,
  unlockedScenarios: [],
  memberSnapshot: {
    [memberId]: {
      pseudo: string,
      activeCharacter: string | null,  // perso joué lors de cette session
      charIcon: string | null
    }
    // Ancien format (rétrocompat) : memberSnapshot[id] = "pseudo" (string)
  }
}
```

### `"company"` — compagnie
```js
{
  name: string,
  members: [{
    id, pseudo,
    activeCharacter: string | null,
    charIcon: string | null,         // id de l'icône (ex: "blinkblade")
    retiredCharacters: [{
      name, charIcon, retiredAt      // retiredAt: ISO string
    }]
  }]
}
```

### `"campaignImport"` — données importées
```js
{ campaignStart, sessionCount, avgDurationMs, winRate, importedAt }
```

### `"campaignNotes"` — string
### `"campaignStarted"` — `"true"` | `"false"`
### `"scenarioStatsSetup"` — setup en cours du tracker de combat

---

## Conventions de code

### Navigation (NavPill)
```jsx
<NavPill to="/company" icon={<IconHome />} label="Menu" side="left" />
<NavPillSession startingDatetime={...} side="right" />  // avec chrono live
```

### Layout de page standard
```jsx
<div className="h-screen flex items-stretch justify-between overflow-hidden">
  <div className="flex-shrink-0 flex items-center">
    <NavPill to="/" icon={<IconHome />} label="Menu" side="left" />
  </div>
  <div className="flex-1 overflow-y-auto scrollbar-hide py-6 px-4">
    {/* contenu */}
  </div>
  <div style={{ width: 72, flexShrink: 0 }} />  {/* espace droite sans NavPill */}
</div>
```

### Modal
```jsx
import Modal from "../components/ui/Modal";
// Fermeture auto sur Échap et clic extérieur
<Modal onClose={() => setOpen(false)}>
  {/* contenu */}
</Modal>
```

### Calculs stats récurrents
```js
// Score Bourreau
function killScore(kills) {
  return (kills?.normal ?? 0) + (kills?.elite ?? 0) * 2 + (kills?.boss ?? 0) * 3;
}

// Résolution nom depuis snapshot (rétrocompat)
function resolveName(sc, idx, company, session) {
  const id = sc.memberIds?.[idx] ?? session?.presentMemberIds?.[idx];
  if (id) {
    const snap = session?.memberSnapshot?.[id];
    if (snap) return typeof snap === "string" ? snap : snap.pseudo;
    const m = company?.members?.find(m => m.id === id);
    if (m) return m.pseudo;
  }
  return sc.playerNames?.[idx] ?? `J${idx + 1}`;
}

// Merger activeSession pour stats temps réel
const storedSessions = JSON.parse(localStorage.getItem("pastSessions") ?? "[]");
const pastSessions = activeSession
  ? [...storedSessions, { ...activeSession, endingDatetime: new Date().toISOString() }]
  : storedSessions;
```

---

## Titres des joueurs
Calculés depuis les stats cumulées sur toutes les sessions.
Affichés via GIcon, pas d'emojis.
- **DPS** — `GI.machete` / `GI_FILTER.red` — dégâts infligés les plus élevés
- **Tank** — `GI.shield` / `GI_FILTER.blue` — dégâts subis les plus élevés
- **Heal** — `GI.angel` / `GI_FILTER.green` — soins prodigués les plus élevés
- **Bourreau** — `GI.tripleSkull` / `GI_FILTER.white` — meilleur score kills (normal×1 · élite×2 · boss×3)

---

## Fonctionnalités terminées
- ✅ Système Compagnie complet (membres, persos, retraites, charIcons)
- ✅ Sessions : nouvelle session, session active, fin de session avec détection doublons
- ✅ ScenarioStatsPage : tracker de combat avec hold-to-repeat, +/+5, mode lecture
- ✅ LastSessionPage : navigation sessions, sélecteur, suppression, MVP, titres
- ✅ ScenariosPage : tri, priorité, blocage, ajout/édition
- ✅ CompanyPage : cartes membres épurées, bouton œil → modale fiche joueur avec stats par perso
- ✅ ChartsPage : graphique barres sessions, camemberts scénarios, radars combat (Recharts)
- ✅ NotesPage : sauvegarde auto + manuelle
- ✅ Import/Export JSON (version 2)
- ✅ memberSnapshot enrichi : pseudo + activeCharacter + charIcon (rétrocompat string)

## Fonctionnalités à venir
- 🔲 Traduction complète EN/FR
- 🔲 Build Tauri desktop (le ctrl+molette natif fonctionne dans Tauri webview)
