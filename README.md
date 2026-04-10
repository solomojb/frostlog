# Frostlog

🇫🇷 [Français](#français) · 🇬🇧 [English](#english)

---

## Français

> *« Attendez, ce scénario il a été débloqué comment déjà ? »*

Ce moment en début de session où personne ne se souvient plus de rien : pourquoi ce scénario est disponible, ce qu'il s'est passé avant, d'où il vient dans l'histoire... **Frostlog** est né de cette frustration.

Et tant qu'à faire, je me suis dit que ce serait cool d'avoir des stats globales liées à la campagne et surtout des stats liées aux combats. Pour l'avoir testé, ça ajoute une petite dimension compétitive au jeu qui est franchement fun.

### Fonctionnalités

- **Gestion de campagne** — démarrez une nouvelle campagne ou reprenez une en cours (import des scénarios déjà joués, estimation du nombre de session, du temps moyen par session du taux de victoire etc...), exportez et importez votre sauvegarde au format JSON
- **Suivi des scénarios** — visualisez l'arbre de déblocage, l'origine de chaque scénario (autre scénario, quête, événement...), ses notes et son historique
- **Sessions de jeu** — enregistrez chaque session, les scénarios joués, les scénarios débloqués, les résultats victoire/défaite, et consultez l'historique des sessions passées
- **Stats**
  - *De combat* — dégâts infligés, dégâts subis, soins, kills par type d'ennemi, par scénario au sein d'une session en cours, pour chaque joueur
  - *De campagne* — date de début, nombre de sessions, heures totales, durée moyenne et session la plus longue, scénarios terminés/disponibles/bloqués, taux de victoires et défaites
- **Titres** — Champion, Boucher, Rempart, Gardien, Assassin : un classement par scénario, par session et en global pour savoir qui mérite quoi
- **Compagnie** — gérez vos membres, leurs personnages actifs, leurs retraites
- **Notes de campagne** — un espace libre pour noter tout ce que vous ne voulez pas oublier
- **Bilingue** — interface disponible en français et en anglais

### Screenshots

| | |
|---|---|
| ![](docs/screenshots/company.png) | ![](docs/screenshots/graphs.png) |
| ![](docs/screenshots/scenarios.png) | ![](docs/screenshots/past_sessions.png) |
| ![](docs/screenshots/new_session.png) | ![](docs/screenshots/active_session.png) |
| ![](docs/screenshots/setup_combat.png) | ![](docs/screenshots/combat.png) |

### Téléchargement

Rendez-vous dans les [Releases](https://github.com/Martensq/frostlog/releases) pour télécharger le dernier installeur Windows.

### Stack technique

Construit avec React, Vite, Tailwind CSS et Tauri. Toutes les données sont stockées localement dans un fichier JSON sur votre machine, aucune connexion réseau requise.

### Support

Si vous aimez l'app, vous pouvez me soutenir ici :
[☕ Buy me a coffee](https://buymeacoffee.com/martensq)

---

## English

> *"Wait, how did we unlock this scenario again?"*

That moment at the start of a session when nobody remembers anything — why this scenario is available, what happened before, where it fits in the story... **Frostlog** was born out of that frustration.

And while I was at it, I figured it'd be cool to have campaign-wide stats and, above all, per-combat stats. Having tested it, it adds a fun little competitive edge to the game.

### Features

- **Campaign management** — start a fresh campaign or pick up an ongoing one (import already played scenarios, estimated session count, average duration, win rate, etc.), export and import your save file as JSON
- **Scenario tracking** — visualize the unlock tree, the origin of each scenario (another scenario, quest, event...), notes and history
- **Game sessions** — log each session, scenarios played, scenarios unlocked, victory/defeat outcomes, and browse the history of past sessions
- **Stats**
  - *Combat* — damage dealt, damage taken, healing done, kills by enemy type, per scenario within an active session, per player
  - *Campaign* — start date, total sessions, total hours, average session duration and longest session, finished/available/blocked scenarios, win and defeat rates
- **Titles** — Champion, Butcher, Rampart, Guardian, Assassin: a per-scenario, per-session and global ranking so everyone knows where they stand
- **Company** — manage your members, their active characters, their retirements
- **Campaign notes** — a free-form space to write down everything you don't want to forget
- **Bilingual** — interface available in French and English

### Screenshots

| | |
|---|---|
| ![](docs/screenshots/company.png) | ![](docs/screenshots/graphs.png) |
| ![](docs/screenshots/scenarios.png) | ![](docs/screenshots/past_sessions.png) |
| ![](docs/screenshots/new_session.png) | ![](docs/screenshots/active_session.png) |
| ![](docs/screenshots/setup_combat.png) | ![](docs/screenshots/combat.png) |

### Download

Head to the [Releases](https://github.com/Martensq/frostlog/releases) page to download the latest Windows installer.

### Tech stack

Built with React, Vite, Tailwind CSS and Tauri. All data is stored locally in a JSON file on your machine, no network connection required.

### Support

If you enjoy the app, you can support me here:
[☕ Buy me a coffee](https://buymeacoffee.com/martensq)
