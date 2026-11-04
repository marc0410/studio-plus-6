# Studio+ 

Application Studio+ sous Next.js 16, React 19 et TypeScript. Les pages publiques, le parcours de réservation et l’espace client utilisent maintenant l’App Router et des composants React. L’API Next.js, SQLite, les sessions et l’administration des tarifs restent intégrés.

## Démarrage

Installer **Node.js 22.18 ou supérieur** (Node 24 recommandé). Le moteur Node utilise le retrait natif des types TypeScript pour exécuter les scripts SQLite et de création de comptes.

```bash
npm ci
cp .env.example .env.local
npm run db:setup
npm run user:create -- vous@exemple.com "Votre nom" --admin
npm run dev
```

Le mot de passe est demandé dans le terminal avec saisie masquée. Utiliser au moins 12 caractères. Aucun mot de passe de démonstration ni compte précréé n’est fourni. Sous Windows, copier `.env.example` vers `.env.local` avec l’explorateur ou `Copy-Item .env.example .env.local`.

Ouvrir **http://localhost:3000**, puis **Mon espace → Se connecter**. L’administrateur accède à **Tarifs & horaires** et peut confirmer les demandes de séance.

Pour créer un compte intervenant ou invité :

```bash
npm run user:create -- invite@exemple.com "Prénom Nom"
```

L’adresse du compte doit correspondre à celle ajoutée dans les participants d’une séance. Les comptes sont provisionnés par l’opérateur : pas d’inscription publique sans vérification d’e-mail. Si un mot de passe est oublié, aucune procédure automatique de récupération n’est incluse.

## Ce qui est inclus

- Accueil, présentation du studio, galerie des projets et filtres.
- Visite interactive du plateau, éclairages d’ambiance et brief guidé en trois questions.
- Galerie de supports et mises en situation issus de l’identité visuelle Studio+.
- Showcase vidéo avec ruban de pellicule 3D, scrubbing au scroll, parallax et lecture en modale.
- FAQ et chemin direct vers le parcours de réservation.
- Page de prestations et tarifs, parcours de réservation en trois étapes.
- Calendrier mensuel, liste des séances et panneau de détail.
- Participants, invitations `.ics`, confirmation et annulation des demandes.
- Paramètres administrateur pour les montants, durées et horaires.
- API Next.js, SQLite persistante, migrations et sessions côté serveur.
- Photos, logos, polices de substitution et bibliothèques d’animation locales.
- Tests de réservation, accès, conflits de créneaux, sessions et connexion.

## Architecture réelle

Ce projet lance **le serveur officiel Next.js 16.3.4**, avec React 19, TypeScript et App Router. Il n’utilise ni Vinext ni Cloudflare Workers. Le site hébergé précédemment reste inchangé.

Chaque écran est une route de l’App Router : `/`, `/studio`, `/projets`, `/tarifs`, `/reserver`, `/espace`, `/connexion` et `/deconnexion`. L’interface est construite avec React/TSX et les styles globaux sont dans `app/globals.css`. Les médias de marque restent servis depuis `public/studio/assets/`.

| Emplacement | Contenu |
| --- | --- |
| `app/` | Routes, layout, métadonnées et styles globaux Next.js |
| `components/` | En-tête, visite du plateau, quiz, tarifs, galerie, réservation et espace client en TSX |
| `app/connexion/`, `app/deconnexion/` | Pages React d’authentification |
| `app/api/studio/route.ts` | Réservations, participants, disponibilités, configuration |
| `app/api/auth/` | Connexion et déconnexion |
| `public/studio/assets/` | Images, logos et police locale |
| `lib/studio-domain.ts` | Validations métier, services et horaires par défaut |
| `lib/database.ts` | Adaptateur SQLite et transactions |
| `lib/auth.ts` | Comptes, mots de passe scrypt et sessions |
| `migrations/` | Schéma SQL, application séquentielle et versionnée |
| `scripts/` | Initialisation et création des comptes |
| `tests/` | Tests isolés, sans données réelles |

## Tarifs et contenus à compléter

Les montants exacts du catalogue n’étaient pas disponibles : ils affichent **Tarif à confirmer**. L’administrateur peut les saisir. Les durées initiales sont de 60 minutes pour podcast/photo et 120 minutes pour vidéo ; les horaires proposés sont 9h–18h, du lundi au samedi. Ils sont explicitement provisoires tant que l’administrateur ne les valide pas.

Les médias disponibles ne comprennent pas de paires avant/après de la même prise ni de témoignages clients vérifiables. La page présente donc une étape de direction visuelle et des supports Studio+, sans les faire passer pour des retouches comparées ou des projets clients. Aucun témoignage ni nom de client n’est affiché. Les invitations sont des fichiers à transmettre manuellement : pas d’envoi d’e-mail, pas de synchronisation Google/Outlook et pas de paiement intégré. Les demandes bloquent provisoirement un créneau jusqu’à confirmation ou annulation manuelle ; elles n’expirent pas automatiquement.

## Données et accès

Par défaut, les données sont stockées dans `data/studio.sqlite` (ignoré par Git). Les comptes, sessions et réservations de la version hébergée ne sont pas exportés. Cette copie commence avec une base vide.

Une réservation appartient à son créateur. L’administrateur voit toutes les séances ; un invité voit celles associées à son adresse de compte, en lecture seule. L’ajout d’un participant ne crée pas son compte et n’envoie pas de message.

Les sessions expirent après sept jours, sont stockées sous forme hachée et utilisent un cookie HttpOnly/SameSite. Les requêtes de modification vérifient l’origine. Les anciens en-têtes d’authentification ChatGPT ne sont jamais utilisés. Limitation locale des tentatives de connexion : huit par adresse et par fenêtre de quinze minutes.

La planification considère **un seul espace physique partagé**, avec des blocs de trente minutes. Les conflits se règlent dans une transaction SQLite avec contrainte d’unicité.

## Build et hébergement

```bash
npm test
npm run typecheck
npm run build
npm start
```

Configuration destinée à **un serveur Node unique avec disque persistant**, par exemple un VPS. Définir `APP_URL` avec l’origine HTTPS publique exacte en production. Les cookies de session utilisent alors l’attribut Secure. Les commandes `dev` et `start` appliquent les migrations avant de lancer Next.js ; le build ne crée pas de données.

Sauvegarder la base avec une méthode SQLite adaptée au mode WAL (API backup ou arrêt du processus et copie cohérente des fichiers). Ne pas utiliser cette configuration SQLite sur un système de fichiers éphémère ou partager un fichier SQLite entre plusieurs instances. Pour un déploiement serverless, remplacer l’adaptateur par une base persistante adaptée avant mise en service.

Les dépendances sont verrouillées dans `package-lock.json`. Les dossiers `node_modules`, `.next`, les secrets et les bases locales ne font pas partie de l’archive.

## Identité visuelle et médias

Couleurs : rouge `#EB0606`, noir `#020202`, blanc `#FFFFFF`. Les logos et supports de marque proviennent de l’identité visuelle fournie. Gilroy est la police officielle, Authentica la secondaire ; les fichiers licenciés n’étaient pas disponibles. Le site utilise Gilroy lorsqu’elle est installée, puis Manrope embarquée. Ajouter les fichiers web licenciés pour une correspondance typographique exacte.

L’image `hero-microphone.webp` est une illustration générée et ne documente pas un équipement réel vérifié. Les autres images montrent les supports et scènes extraits des documents fournis. Les animations de défilement utilisent GSAP ScrollTrigger et Lenis ; les interactions de l’interface restent construites en React et CSS. Consulter `THIRD_PARTY.md` pour les bibliothèques.

Documentation Next.js utilisée pour la configuration : https://nextjs.org/docs/app/getting-started/installation et https://nextjs.org/docs/app/getting-started/deploying.

## Showcase et recherche de fichiers

Après le Hero, la section d’accueil (`components/StudioReel.tsx`) déroule une seule scène en bois dans un unique pin ScrollTrigger : dispersion des objets, recherche, Studio, Savoir-faire, Instants et Final Cut. `components/useScrollScatter.ts` crée la timeline maîtresse et son pin ; `components/showcase/useShowcaseTimeline.ts` y branche les étapes suivantes, avec les labels `search`, `studio`, `craft`, `moments` et `finalcut`. Les hooks d’étape sont dans `components/showcase/`.

Les huit fichiers de recherche se modifient dans `data/objects.ts`. Les fiches des étapes suivantes sont dans `data/showcase.ts`. Les composants partagés — polaroïd, pellicule, dossiers, étiquettes, navigation et modale — sont dans `components/showcase/ShowcasePrimitives.tsx`. Les cartes filtrent en direct après la frappe animée ; clic ou clavier ouvre leurs détails. Les fichiers vidéo utilisés dans la recherche restent des URL de démonstration, à remplacer par les fichiers du projet ; la galerie Instants utilise les visuels locaux disponibles jusqu’à réception de vraies vidéos.

Les paramètres de durée du pin, zoom caméra, parallaxe, stagger, accent, nombre d’objets et obscurcissement du Final Cut sont centralisés dans `data/showcase-tokens.ts`. En mouvement réduit, le pin est désactivé et les étapes sont empilées verticalement sur la même identité de table. Les styles sont dans `app/studio-reel.css` et `app/showcase-primitives.css`.
