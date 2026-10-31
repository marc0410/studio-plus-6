# Prompt UI : landing page Studio Plus (sections 2 à 6), version affinée

> À coller tel quel dans un outil de génération de code ou de design (Claude, Cursor, v0, Lovable, etc.), ou à donner à un développeur front-end.
> La section 1 (Hero) est traitée à part. Ce prompt couvre la suite de la page : visite du plateau, avant/après, histoires de clients, quiz et estimateur, puis tarifs, FAQ, réservation et contact.
> **Fil rouge : chaque effet, chaque composant et chaque mot doit venir de l'univers d'un studio photo, vidéo et podcast.** Aucun effet décoratif sans lien avec ce monde.

---

## 1. Rôle et mission

Tu es directeur artistique et développeur front-end senior, spécialisé dans les sites immersifs de niveau agence (références : sites primés Awwwards, Codrops, GSAP Showcase). Tu conçois la suite de la landing page de **Studio Plus**, studio audiovisuel basé à Abidjan (Cocody Angré Nouveau CHU) : shooting photo (mariage, portrait, couple, corporate), **podcast audio**, **podcast vidéo** et production vidéo. Slogan : « Votre partenaire créatif ».

Objectif : **donner envie de réserver**. Le visiteur doit sentir la qualité du studio (image, lumière, son) avant de lire un tarif, puis passer à l'action sans friction, le plus souvent depuis un téléphone.

**Règle d'or** : le niveau « premium » ne vient pas du nombre de packages installés, mais de la qualité d'exécution : direction artistique, typographie, cohérence des animations, fluidité mobile, performance, accessibilité, parcours de conversion. On installe peu, on exécute très bien.

---

## 2. Vision générale

### 2.1 Le concept : la page est un plateau de tournage

La page se lit comme une production. Chaque section est une « scène » qui reprend un moment du travail d'un studio :

| Scène | Section | Moment du studio | Rôle pour le visiteur |
|---|---|---|---|
| Le plateau | 2. Visite du plateau | Repérage et mise en lumière | Entrer dans le studio |
| La post-production | 3. Avant / après | Retouche, étalonnage, mixage son | Voir la valeur du travail |
| Les rushes | 4. Histoires de clients | Projets livrés, extraits de tournage | Se projeter avec de vrais clients |
| Le briefing | 5. Quiz et estimateur | Brief de production, feuille de service | Choisir sa formule et son budget |
| Le générique | 6. Tarifs, FAQ, réservation, contact | Plan de travail, générique de fin | Réserver |

### 2.2 Vocabulaire visuel du studio (à utiliser, avec parcimonie)

| Élément du studio | Traduction à l'écran |
|---|---|
| Viseur de caméra | Cadre avec coins, point REC rouge, timecode, indicateur de mise au point |
| Témoin « ON AIR » (tally) | Pastille rouge allumée quand un élément est « en direct » ou actif |
| Clap de cinéma | Bandeau rayé noir et blanc en tête de carte, qui « claque » à l'activation |
| Forme d'onde audio | Lecteur de podcast, séparateurs, indicateur de chargement |
| VU-mètre et faders de console | Curseurs de l'estimateur, jauge de budget |
| Timeline de montage | Frise d'étapes de retouche, grille de disponibilités de réservation |
| Feuille de service (call sheet) | Résultat du quiz : récapitulatif de la production |
| Softbox, gélatines de couleur | Sélecteur d'ambiance lumineuse |
| Mise au point (focus pull, rack focus) | Passage du flou au net entre deux plans |
| Diaphragme | Icône du logo : transition, progression, loader |
| Coupes de montage (fondu enchaîné, iris, volet) | Transitions entre scènes |

### 2.3 La modernité recherchée

- **Image, vidéo et son d'abord.** Visuels grand format, texte court, jamais de blocs denses.
- **Typographie comme élément visuel.** Très grands titres, interlignes serrés, contraste fort avec le texte courant.
- **Grille asymétrique.** Décaler, chevaucher, laisser respirer ; les images débordent de leur colonne.
- **Profondeur réelle.** Plusieurs plans à vitesses différentes, flou de mise au point, grain léger, ombres douces. L'impression d'une scène en trois dimensions.
- **Sobriété.** Une idée mémorable par section ; le reste reste calme.
- **Identité forte.** Fond sombre dominant, accent rouge de la marque, motif africain de la charte en texture ou séparateur très discret.

### 2.4 Rappels de marque (sans entrer dans le détail des couleurs)

- Palette principale : noir, blanc, rouge. Bleu et orange seulement ponctuellement (charte).
- Typographie : **Gilroy** partout ; **Authentica** (script) en touches très rares (un mot ou une courte phrase par section au maximum). Prévoir une police de secours proche de Gilroy si la licence web n'est pas disponible.
- Logo : jamais déformé, recoloré ni détouré ; respecter la zone de protection (hauteur du S). Version blanche ou noire sur les photos ; version avec baseline et icône multicolore réservée aux vidéos.
- Les éléments de HUD (viseur, timecode, REC) utilisent le rouge de la marque avec modération : ils restent un accent, pas un décor.

---

## 3. Boîte à outils : packages et usages précis

### 3.1 Priorités

| Priorité | Packages |
|---|---|
| **Indispensable** | Next.js + TypeScript, Tailwind CSS, **GSAP + ScrollTrigger** (+ `@gsap/react`), **Motion** |
| **Élevée** | **Lenis**, GSAP SplitText, GSAP Flip, Embla Carousel, Radix UI, React Hook Form + Zod |
| **Ciblée (un usage précis chaque)** | **Three.js** avec React Three Fiber et Drei (un seul moment 3D), OGL (distorsion d'image), Wavesurfer.js (formes d'onde), Vidstack ou Mux Player (lecteur vidéo), `@use-gesture/react`, GSAP DrawSVG, MorphSVG, CustomEase, Observer |
| **Optionnelle** | Howler.js (sons d'interface), Rive ou Lottie (diaphragme animé), Spline (maquette 3D rapide), GSAP ScrambleText, MotionPath, Draggable, Barba.js ou View Transitions API (pages de détail), Sanity ou Payload CMS (contenu éditable) |
| **Qualité et suivi** | Playwright + axe-core (tests et accessibilité), Lighthouse et Web Vitals (performance), Sentry et Vercel Analytics (erreurs et audience) |

> Ne pas installer toute la liste. Charger le lourd (3D, WebGL, audio) à la demande, uniquement sur la section qui l'utilise. Éviter les doublons : une seule bibliothèque d'animation par rôle (pas d'Anime.js en plus de GSAP et Motion).

Installation de base :

```bash
npm install gsap @gsap/react lenis motion \
  embla-carousel-react @radix-ui/react-accordion @radix-ui/react-tabs \
  @radix-ui/react-slider @radix-ui/react-radio-group \
  react-hook-form zod zustand @use-gesture/react lucide-react
```

Packages ciblés, à ajouter seulement si la section correspondante est construite :

```bash
npm install three @react-three/fiber @react-three/drei   # moment 3D du micro
npm install ogl                                          # distorsion d'image (optionnel)
npm install wavesurfer.js                                # formes d'onde (sections 3 et 4)
npm install @vidstack/react                              # lecteur vidéo personnalisé
npm install howler                                       # sons d'interface (optionnel, désactivés par défaut)
```

Vérifier la licence en vigueur de GSAP et de ses plugins avant la mise en production.

### 3.2 Répartition des rôles

Règle d'or : **ne jamais animer la même propriété avec deux bibliothèques.**

| Rôle | Outil |
|---|---|
| Pilote du défilement | Lenis |
| Tout ce qui dépend du scroll (épinglage, scrub, parallaxe, masques, compteurs) | GSAP + ScrollTrigger |
| Tout ce qui répond à une action (clic, glisser, choix, ouverture) | Motion |
| Changement de disposition entre deux états (onglets, ouverture de détail) | GSAP Flip ou animations de layout de Motion |
| Effets d'image en WebGL | OGL ou Three.js, un seul canvas partagé |
| Son | Wavesurfer.js (affichage), Web Audio API ou Howler.js (lecture) |

### 3.3 Lenis : le défilement « caméra sur rail »

**À quoi il sert ici** : un défilement doux et inertiel donne l'impression d'un travelling. Il est la base de toutes les animations au scroll.

Mise en place avec GSAP :

```js
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ autoRaf: false, lerp: 0.1 });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Règles d'usage :
- Un seul `Lenis` global, créé au montage de l'application et détruit au démontage.
- `lenis.stop()` à l'ouverture d'un panneau plein écran (histoire de client, lecteur vidéo), `lenis.start()` à la fermeture.
- Attribut `data-lenis-prevent` sur tout conteneur qui doit défiler seul (feuille inférieure mobile, liste interne).
- Boutons de réservation : `lenis.scrollTo("#reservation", { duration: 1.4 })` pour un défilement guidé.
- Désactiver Lenis si `prefers-reduced-motion` est actif. Sur tactile, garder le défilement natif (comportement par défaut de Lenis) pour la fluidité.

### 3.4 Motion (ex-Framer Motion) : les interactions de la régie

**À quoi il sert ici** : tout ce que la personne touche. Choix d'une réponse, ouverture d'une question, glissement d'une poignée, changement d'onglet, apparition d'un résultat.

```jsx
import { motion, AnimatePresence, MotionConfig } from "motion/react";

<MotionConfig reducedMotion="user">
  <AnimatePresence mode="wait">
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
    >
      {/* question du quiz, étape du formulaire */}
    </motion.div>
  </AnimatePresence>
</MotionConfig>
```

Usages attendus :
- `AnimatePresence` pour les transitions de questions, d'étapes de formulaire et d'onglets.
- Animations de layout partagées (`layoutId`) : la carte choisie du quiz qui s'agrandit, la carte d'histoire qui s'ouvre en plein écran.
- `drag` avec `useMotionValue` et `useTransform` : poignée de comparaison, faders de l'estimateur.
- Ressorts amortis pour tout ce qui doit paraître physique (faders, infobulles de matériel).
- `MotionConfig reducedMotion="user"` au niveau racine pour respecter les préférences d'accessibilité.

### 3.5 GSAP et ses plugins : le moteur de scène

| Plugin | Usage sur Studio Plus |
|---|---|
| **ScrollTrigger** | Épinglage des scènes, timelines liées au scroll, parallaxe, empilement de cartes, générique de fin |
| **SplitText** | Un titre par section en lignes masquées ; interdit sur les textes courants |
| **Flip** | Réorganisation fluide des packs au changement d'onglet, passage d'une vignette à l'histoire détaillée |
| **DrawSVG** | Tracé de la timeline de montage (section 3) et du viseur (coins du cadre) à l'entrée |
| **MorphSVG** | Le diaphragme du logo qui se transforme en icône « lecture » pour les boutons vidéo |
| **CustomEase** | Une courbe signature (« studioOut ») réutilisée par toutes les révélations pour une cohérence de rythme |
| **Observer** | Navigation par molette ou balayage entre les décors de la section 2 (un cran à la fois) |
| **ScrambleText** | Optionnel : timecode et créneaux horaires qui se « décodent » à l'apparition |
| **MotionPath, Draggable** | Optionnels, seulement si un besoin précis apparaît |

Dans React : hook `useGSAP` avec `scope`, nettoyage au démontage, et `gsap.matchMedia()` pour séparer desktop, mobile et `prefers-reduced-motion`.

### 3.6 Three.js (React Three Fiber + Drei) : un seul moment 3D, et il doit être justifié

**Principe** : la 3D n'est pas une décoration. Elle est utilisée **une seule fois**, pour un objet qui n'existe que dans un studio : **le micro de podcast**.

**Le moment** (section 2, décor « Salle podcast et vidéo ») :
- Un modèle 3D de micro sur bras articulé (glTF compressé, moins de 1,5 Mo, texture légère), au centre du visuel du décor.
- Il tourne lentement avec le scroll (rotation liée à la progression) et réagit au curseur (légère inclinaison).
- Il est éclairé par des **softboxes virtuelles** (composants `Lightformer` de Drei dans un `Environment`) dont l'une suit le curseur : le visiteur « déplace la lumière » comme sur un vrai plateau. Reflets métalliques sur le micro, voile de poussière lumineuse en arrière-plan.
- Le témoin « ON AIR » s'allume en rouge quand ce décor est actif.

**Conditions de chargement** :
- Import dynamique sans rendu serveur (`dynamic(() => import("./MicroScene"), { ssr: false })`), déclenché seulement quand la section approche de l'écran.
- Activé uniquement si : écran large, pas de `prefers-reduced-motion`, pas de mode économie de données, GPU correct. Sinon : image statique du micro avec la même composition.
- Un seul canvas sur la page. `frameloop="demand"` quand le micro est hors écran.

**Optionnel (OGL)** : distorsion liquide légère sur les images au survol et lors du changement de décor, avec un petit canvas WebGL dédié. Si Three.js est déjà retenu, réaliser cet effet avec le même canvas plutôt que d'ajouter OGL. Si le budget de performance est serré, garder uniquement le micro 3D.

### 3.7 Autres packages et leur place

- **Embla Carousel** : défilement horizontal tactile des packs (mobile), des vignettes de matériel et des miniatures de photos.
- **`@use-gesture/react`** : inclinaison au curseur (desktop), gestes de balayage, drag avec inertie.
- **Wavesurfer.js** : formes d'onde réelles pour le comparateur de son (section 3) et le lecteur de podcast (section 4).
- **Vidstack ou Mux Player** : lecteur vidéo personnalisé aux couleurs du studio, avec commandes minimales.
- **Radix UI** : accordéon (FAQ), onglets, curseurs et boutons radio accessibles. Ils fournissent le clavier et les rôles ARIA, Motion et GSAP ajoutent le mouvement.
- **React Hook Form + Zod** : formulaire de réservation validé, messages d'erreur précis.
- **Zustand** : état partagé du quiz, de l'estimateur et du formulaire (les réponses préremplissent la réservation).
- **Lucide ou Phosphor** : pictogrammes cohérents (un seul jeu).
- **Howler.js (optionnel)** : trois sons d'interface au maximum (déclic d'obturateur, clic de fader, clap de fin), **coupés par défaut**, activables par un bouton « Son ».
- **Sanity ou Payload (optionnel)** : textes, packs, FAQ, histoires et portfolio modifiables par l'équipe sans développeur.

---

## 4. Système de mouvement

### 4.1 Le langage du mouvement : cinéma et studio

| Geste de cinéma | Traduction technique |
|---|---|
| **Travelling** | Défilement Lenis, parallaxe légère |
| **Mise au point (rack focus)** | Un plan passe du flou au net, l'autre du net au flou (`filter: blur()` sur peu d'éléments) |
| **Iris** | `clip-path: circle()` qui s'ouvre ou se ferme depuis un point |
| **Volet (wipe)** | `clip-path: inset()` qui balaie l'image |
| **Fondu enchaîné** | Opacité croisée entre deux visuels |
| **Push-in (zoom lent)** | Échelle de 1 à 1,06 sur plusieurs secondes sur un visuel actif |
| **Balayage de lumière** | Dégradé clair qui traverse un élément une seule fois |
| **Clap** | Rotation courte du bras du clap puis arrêt net |

### 4.2 Profondeur : les techniques à utiliser

1. **Parallaxe multi-plans** : trois couches par visuel (fond, sujet, premier plan flou). Écarts modérés (10 à 25 %), `scrub: true`.
2. **Épinglage de scène** : la section reste fixe pendant que le contenu change, comme un plan-séquence.
3. **Masques en iris** : révélation de visuels en écho au diaphragme du logo.
4. **Flou de mise au point** : sur 2 ou 3 éléments simultanés au maximum.
5. **Inclinaison au curseur** : 4 à 6 degrés maximum, avec `gsap.quickTo`. Désactivée sur tactile.
6. **Empilement de cartes** : la carte précédente rétrécit et s'assombrit quand la suivante arrive.
7. **Titre en lignes masquées** (SplitText) : un seul titre par section.
8. **Grain et vignette** : calque de bruit à 3 à 5 % d'opacité sur les fonds sombres.
9. **Lumière interactive** : un halo qui suit le curseur, comme une source de lumière mobile sur le plateau (desktop uniquement).

### 4.3 Le diaphragme comme fil conducteur

- **Transition entre scènes** : iris, utilisé seulement entre les scènes 1 et 2, et pour le générique.
- **Progression** : lamelles SVG qui s'ouvrent à chaque étape du quiz.
- **Loader** : diaphragme animé pendant les chargements.
- **Bouton lecture** : le diaphragme se transforme en triangle « play » (MorphSVG), clin d'œil à l'icône du logo.

### 4.4 Sobriété du mouvement

- **Un seul moment signature par section.** Pas de fondu-glissement systématique sur chaque bloc, pas d'effet de survol sur chaque carte.
- Les animations sans action de l'utilisateur servent à attirer l'œil sur l'élément le plus important. Celles qui répondent à une action montrent clairement ce qui a changé.
- Durées : 0,3 à 0,6 s pour les interactions, 0,8 à 1,4 s pour les révélations de scène. Une courbe signature unique (« studioOut ») pour toutes les révélations GSAP, ressorts amortis côté Motion.

### 4.5 Son (optionnel, jamais imposé)

- Désactivé par défaut. Un bouton « Son » dans l'en-tête active les sons d'interface, mémorisé pour la session.
- Trois sons maximum, très courts et discrets : déclic d'obturateur (repères de matériel), clic de fader (estimateur), clap (générique).
- Les extraits audio du comparateur de son et du lecteur de podcast ne se lancent **jamais** automatiquement.

---

## 5. Spécifications section par section

> Convention des schémas : `[IMG]` image ou vidéo, `[T]` texte, `[BTN]` bouton. Les schémas montrent le placement desktop (grille de 12 colonnes). Le mobile est décrit à part.

---

### Section 2 : Visite du plateau (viseur et console de lumière)

**Rôle** : faire entrer le visiteur dans le studio, lui montrer les décors et le matériel, lui faire sentir la qualité de l'éclairage.

**Titre proposé** : « Entrez sur le plateau »
**Texte d'appui** : « Trois décors, une lumière qui change tout. Choisissez l'ambiance, explorez le matériel. »

**Packages** : GSAP (ScrollTrigger, Observer, SplitText, DrawSVG), Lenis, Motion, `@use-gesture/react`, Three.js avec R3F et Drei (micro 3D), OGL optionnel.

**Structure : scène épinglée de 100 vh, avec contenu changeant**

```
┌────────────────────────────────────────────────────────────────┐
│  Titre (col 1-5)                                                │
│                                                                 │
│  ┌─ Décors ──────────┐   ┌─────── Visuel dans un viseur ──────┐ │
│  │ ● Plateau mariage │   │ ┌                              ┐   │ │
│  │ ○ Fond studio     │   │ ● REC            00:00:12:05     │   │ │
│  │ ○ Salle podcast   │   │      [IMG décor, 3 couches]      │   │ │
│  │   et vidéo        │   │       ◉ repère     ◉ repère      │   │ │
│  └───────────────────┘   │ └                              ┘   │ │
│  (col 1-4, collant)      └─────────(col 5-12, déborde)────────┘ │
│                                                                 │
│   Console de lumière :  ◯ Violet  ◯ Rouge  ◯ Blanc chaud        │
│                         Intensité ▭▭▭◉▭▭                        │
└────────────────────────────────────────────────────────────────┘
```

**Placement**
- Titre et texte en haut à gauche, colonnes 1 à 5.
- Liste des 3 décors à gauche, collante pendant l'épinglage. Le décor actif a un témoin rouge allumé.
- Visuel principal sur les colonnes 5 à 12, **qui déborde à droite** (bord perdu).
- **Cadre de viseur** par-dessus le visuel : quatre coins en trait fin (tracés avec DrawSVG à l'entrée), point REC rouge qui clignote lentement, timecode au coin supérieur droit.
- Console de lumière : barre flottante arrondie, centrée sous le visuel, translucide avec léger flou d'arrière-plan.
- Motif africain très discret derrière le titre, qui dérive lentement à l'horizontale pendant le scroll.

**Comportement**
1. **Épinglage** : environ 300 vh de scroll. Chaque tiers fait passer au décor suivant (timeline ScrollTrigger scrubée). **Observer** permet aussi de changer de décor d'un cran à la molette ou au balayage.
2. **Timecode vivant** : le timecode avance avec la progression du scroll dans la scène (de 00:00:00:00 à environ 00:00:30:00), via `onUpdate`.
3. **Changement de décor** : mise au point (rack focus) : l'ancien visuel devient flou et recule (échelle 1 → 0,96), le nouveau s'ouvre en iris depuis le centre puis devient net. Le titre d'état (« Salle podcast et vidéo ») sort et rentre en lignes masquées.
4. **Parallaxe 3 plans** : fond (bouge peu), sujet ou mobilier (moyen), premier plan flou comme un pied de lumière (bouge le plus).
5. **Console de lumière** : au clic sur une gélatine, la lumière du plateau change (calque de couleur en `mix-blend-mode: soft-light`, teinte animée par Motion en 0,5 s). Un curseur d'intensité règle la luminosité du calque. Idéalement, fournir de vraies photos par ambiance et faire un fondu enchaîné, plus crédible que la teinte seule.
6. **Repères de matériel** (3 à 4 par décor) : points cliquables avec **étiquettes de style viseur** (trait fin, petit rectangle de données). Au clic, une infobulle s'ouvre en ressort (Motion) et explique **ce que cela apporte au client**, pas la fiche technique. Exemple : « Éclairage doux : peau naturelle, sans ombres dures. »
7. **Moment signature** : dans le décor « Salle podcast et vidéo », le **micro 3D** (voir 3.6) apparaît, le témoin « ON AIR » s'allume, et la softbox suit le curseur.
8. **Curseur personnalisé** (desktop) : cercle avec le mot « Explorer » au-dessus du visuel.

**Mobile**
- Pas d'épinglage : les décors s'empilent verticalement en cartes plein écran, parallaxe réduite, cadre de viseur conservé (léger).
- Micro 3D remplacé par une image statique.
- Console de lumière fixée en bas de l'écran pendant la section.
- Repères de matériel : toucher pour ouvrir une feuille inférieure (attribut `data-lenis-prevent`).

**Contenu à fournir** : 3 photos par décor (ou images détourées en couches), 4 textes courts de matériel, 3 variantes d'ambiance par décor, modèle 3D du micro.

---

### Section 3 : Avant / Après (post-production et étalonnage)

**Rôle** : justifier la valeur du travail de post-production : retouche photo, étalonnage vidéo, mixage et mastering du son.

**Titre proposé** : « Du brut au final »
**Texte d'appui** : « Faites glisser : voyez ce que nos retoucheurs, monteurs et ingénieurs du son ajoutent. »

**Packages** : Motion (drag, AnimatePresence), GSAP (ScrollTrigger, Flip, DrawSVG), Wavesurfer.js, Radix Tabs, Lenis.

**Structure : titre à gauche, comparateur dominant à droite, frise de montage dessous**

```
┌────────────────────────────────────────────────────────────────┐
│  Titre (col 1-4)          ┌─────── Comparateur ───────┐         │
│  Texte                    │  BRUT   │▌ ◁ ▷ ▐│  FINAL  │         │
│                           │  [IMG]  │       │ [IMG]   │         │
│  Onglets :                │         │       │         │         │
│  Portrait · Mariage ·     └────────(col 5-12)─────────┘         │
│  Vidéo · Podcast (son)                                          │
│                           ┌─ Timeline de montage ─────────────┐ │
│  Notes :                  │ Brut ▭ Lumière ▭ Peau ▭ Étalonn. ▭ │ │
│  « Lumière douce »        │ ▲ tête de lecture = la poignée     │ │
│  « Peau naturelle »       └────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

**Placement**
- Comparateur très grand, colonnes 5 à 12, qui **chevauche légèrement le titre** (1 à 2 colonnes, titre en `z-index` inférieur).
- Onglets sous le titre, à gauche (Radix Tabs).
- **Timeline de montage** sous le comparateur : pistes tracées en fin trait (DrawSVG à l'entrée), segments par étape. La **tête de lecture** est reliée à la poignée du comparateur.

**Comportement par onglet**
1. **Portrait et Mariage** : photo brute à gauche, photo retouchée à droite ; `clip-path: inset()` piloté par la position de la poignée (Motion, `useMotionValue`).
2. **Vidéo** : deux flux vidéo synchronisés (même extrait de 5 à 8 s, en boucle, sans son) : l'un « plat » (brut), l'autre étalonné. Le volet balaie les deux. Mention discrète « Étalonnage » sur le côté étalonné.
3. **Podcast (son)** : deux **formes d'onde** réelles (Wavesurfer.js) l'une au-dessus de l'autre : prise brute (irrégulière, bruitée) et version mixée et masterisée (équilibrée, nette). Un interrupteur **A / B** bascule entre les deux extraits audio de 15 secondes sur un bouton lecture explicite. La lecture ne démarre jamais seule.
4. **Entrée guidée** : à l'entrée dans l'écran, la poignée balaie automatiquement de 0 à 55 % (GSAP lié au scroll) pour montrer qu'on peut agir. Elle s'arrête dès que la personne la touche.
5. **Poignée** : cercle avec le diaphragme du logo en pictogramme, qui tourne légèrement selon la position. Glissable à la souris et au doigt.
6. **Frise d'étapes** (Brut, Lumière, Peau, Étalonnage, Final) : un clic place la tête de lecture sur cette étape et affiche l'image intermédiaire (fondu). Raconte la post-production plutôt qu'un simple avant/après.
7. **Changement d'onglet** : réorganisation avec Flip, la nouvelle paire entre en iris.
8. **Annotations** : 2 ou 3 repères légers qui apparaissent quand la poignée passe devant (« Lumière douce sur le visage », « Voix nettoyée, souffle supprimé »).
9. **Accessibilité** : poignée en `role="slider"` avec `aria-valuenow`, contrôlable aux flèches du clavier. Le contrôle A/B du son est un vrai interrupteur accessible.

**Mobile**
- Comparateur pleine largeur, poignée avec zone de toucher de 44 px minimum. Onglets en défilement horizontal.
- Scroll vertical bloqué seulement pendant le glissement horizontal.
- Vidéos : un seul flux affiché à la fois avec bascule, pour économiser les données.

**Contenu à fournir** : 3 paires de photos au cadrage identique, 4 versions intermédiaires pour la première, 1 extrait vidéo brut et étalonné, 1 extrait audio brut et masterisé.

---

### Section 4 : Histoires de clients (les rushes)

**Rôle** : remplacer les témoignages classiques par des études de cas visuelles qui prouvent les résultats : un mariage, un portrait ou une entreprise, un podcast.

**Titre proposé** : « Leurs histoires, nos images »
**Format de chaque histoire** : le besoin, le tournage, le résultat.

**Packages** : GSAP (ScrollTrigger, Flip, SplitText), Motion (`layoutId`, AnimatePresence), Vidstack ou Mux Player, Wavesurfer.js, Embla, Lenis (arrêt à l'ouverture du plein écran), Barba.js ou View Transitions API (page de détail, optionnel).

**Structure : cartes plein écran empilées en sticky (3 histoires), chacune ouvrant sur un clap**

```
Carte (épinglée, plein écran)
┌────────────────────────────────────────────────────────────────┐
│ ▨▨▨▨▨▨▨▨▨▨ CLAP : PRODUCTION · SCÈNE · PRISE · DATE ▨▨▨▨▨▨▨▨▨▨ │
├──────────────────────────────────────────────┬─────────────────┤
│ [IMG ou VIDÉO principale, col 1-7]           │ Nom du client    │
│                                              │ Type de projet   │
│   ┌──────┐ ┌──────┐  (petites images          │                  │
│   │ IMG  │ │ IMG  │   flottantes qui          │ Le besoin   (T)  │
│   └──────┘ └──────┘   chevauchent)            │ Le tournage (T)  │
│                                              │ Le résultat (T)  │
│   Podcast : CAM 1 · CAM 2 · CAM 3 + onde audio│ « Citation »     │
│                                              │ Délai · Livrables│
│                                              │ [BTN] Voir plus  │
└──────────────────────────────────────────────┴─────────────────┘
La carte suivante arrive par-dessus ; la précédente se réduit et s'assombrit.
```

**Placement**
- Bandeau de clap en tête de carte : rayures noir et blanc, mentions Production (nom du client), Scène (type de projet), Prise (numéro de l'histoire, seule numérotation autorisée car il s'agit d'une vraie séquence), Date.
- Image ou vidéo principale à gauche sur 7 colonnes, pleine hauteur, bord perdu à gauche.
- 2 ou 3 petites images flottantes, décalées, qui chevauchent la principale, avec parallaxe à vitesses différentes.
- Colonne de texte à droite, colonnes 8 à 12, alignée à gauche, centrée verticalement.
- **Alternance** : l'histoire 2 inverse la disposition, l'histoire 3 revient à la première.
- Citation du client en grand, avec un mot en Authentica au maximum.

**Comportement**
1. **Moment signature : le clap.** Quand une carte devient active, le bras du clap se referme d'un coup (rotation courte, arrêt net), avec le déclic sonore optionnel. C'est le seul effet d'entrée de la section.
2. **Empilement** : cartes en sticky. Quand la suivante arrive, la précédente passe à `scale: 0.94`, s'assombrit et se floute légèrement.
3. **Histoire « podcast » : régie multicaméra.** La zone média propose trois angles de caméra (CAM 1, CAM 2, CAM 3). Un clic bascule d'un angle à l'autre, comme sur une table de mixage vidéo : le témoin rouge s'allume sur la caméra active et la coupe est franche. Sous la vidéo, une forme d'onde (Wavesurfer.js) suit la lecture.
4. **Vidéo au survol** (desktop) pour les autres histoires : une boucle muette de quelques secondes remplace la photo, chargée à la demande. Sur mobile : bouton lecture explicite (diaphragme qui se transforme en « play »).
5. **Indicateurs chiffrés** qui se comptent de 0 à la valeur à l'activation de la carte (GSAP, `snap` sur les entiers) : « Livré en 5 jours », « 142 photos », « 3 caméras ».
6. **Indicateur latéral** : fine barre verticale avec le nom du client actif. Elle représente une vraie progression.
7. **« Voir plus »** : l'image principale s'agrandit en panneau plein écran avec animation de layout partagée (`layoutId` de Motion ou Flip). Lenis est suspendu pendant l'ouverture, avec bouton de fermeture visible et touche Échap.
8. **Lecteur vidéo** : Vidstack ou Mux Player, commandes minimales, couleurs du studio, sous-titres si disponibles.

**Mobile**
- Cartes sticky en format vertical : média en haut (55 % de la hauteur), texte dessous.
- Images flottantes retirées, parallaxe limitée.
- Régie multicaméra conservée sous forme de trois boutons sous la vidéo.

**Contenu à fournir** : 3 clients réels avec autorisation, 4 à 6 photos chacun, une courte vidéo, une citation. Pour le podcast : un extrait multicaméra (3 angles synchronisés) et l'audio correspondant.

---

### Section 5 : Quiz « Quelle production pour vous ? » et estimateur (le briefing)

**Rôle** : aider le visiteur à choisir, capter un contact qualifié, et donner un ordre de grandeur de prix sans qu'il ait à demander.

**Titre proposé** : « Votre brief en 1 minute »
**Texte d'appui** : « Trois questions, et nous préparons la feuille de service qui vous correspond. »

**Packages** : Motion (layout, AnimatePresence, drag, ressorts), GSAP (compteur, iris), Zustand, Radix (RadioGroup, Slider), React Hook Form + Zod, `@use-gesture/react`, Howler.js optionnel (clic de fader).

**Structure : scène centrée, une question à la fois**

```
┌────────────────────────────────────────────────────────────────┐
│                       Titre (centré)                            │
│                                                                 │
│            ◐ diaphragme de progression                          │
│                                                                 │
│     Question (T, grand, centré)                                 │
│                                                                 │
│   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐         │
│   │ [IMG]   │   │ [IMG]   │   │ [IMG]   │   │ [IMG]   │         │
│   │ Photo   │   │ Podcast │   │ Podcast │   │ Vidéo   │         │
│   │ shooting│   │ audio   │   │ vidéo   │   │ marque  │         │
│   └─────────┘   └─────────┘   └─────────┘   └─────────┘         │
│                                                                 │
│                    ← Retour        Continuer                    │
└────────────────────────────────────────────────────────────────┘
```

**Les 3 questions**
1. « Que voulez-vous produire ? » (shooting photo, podcast audio, podcast vidéo, vidéo de marque ou d'événement)
2. « Quel style vous ressemble ? » (naturel et lumineux, élégant et contrasté, traditionnel et coloré, créatif et audacieux)
3. « Quel budget avez-vous en tête ? » (3 tranches en FCFA, ou « Je ne sais pas encore »)

**Résultat : la feuille de service**

```
┌────────────────────────────────────────────────────────────────┐
│ FEUILLE DE SERVICE                          Studio Plus         │
│ ─────────────────────────────────────────────────────────────── │
│ Production : Pack « Signature » (T, grand)                      │
│                                                                 │
│ [IMG ambiance]     Lieu : Studio Plus, Cocody Angré             │
│                    Équipe · Durée · Livrables (liste courte)    │
│                    Estimation :  150 000 – 220 000 FCFA          │
│                    Jauge de budget ▮▮▮▮▮▮▯▯▯▯  (segments LED)    │
│                                                                 │
│   Ajuster :  Durée ▭▭▭◉▭   Personnes ▭◉▭▭▭   Options ☐ ☐ ☐       │
│                                                                 │
│     [BTN] Réserver ce pack      [BTN] Recevoir le devis sur     │
│                                       WhatsApp                  │
└────────────────────────────────────────────────────────────────┘
```

**Comportement**
1. **Cartes de choix** : zones tactiles larges avec photo en arrière-plan. Au survol, la photo se rapproche et la carte s'incline de quelques degrés. Au clic, la carte choisie s'agrandit (animation de layout partagée) pendant que les autres s'estompent, puis la question suivante apparaît.
2. **Transitions de questions** : `AnimatePresence` en mode `wait`, sortie vers la gauche, entrée depuis la droite avec ressort amorti. Retour inverse le sens.
3. **Diaphragme de progression** : SVG à 6 lamelles qui s'ouvre d'un cran par réponse. À la dernière, il s'ouvre complètement et **révèle le résultat en iris**.
4. **Feuille de service** : elle apparaît comme un document de production avec un léger balayage de lumière, le prix se compte de 0 à la valeur. La fourchette est toujours affichée comme **fourchette**, jamais comme prix fixe.
5. **Estimateur en console** : les curseurs ont l'apparence de **faders de console de mixage** (glissable à la souris et au doigt, ressort amorti, clic sonore optionnel). La jauge de budget est un **VU-mètre à segments** qui se remplit en proportion de la fourchette.
6. **Sans blocage** : la fourchette s'affiche **avant** de demander le moindre contact. Le contact (WhatsApp ou e-mail) n'est demandé que pour envoyer le devis détaillé.
7. **Données** : les réponses du quiz et de l'estimateur partent vers une base (Airtable ou Notion en première version) et préremplissent le formulaire de réservation (section 6). C'est la première brique de la future plateforme de gestion du studio.
8. **Accessibilité** : chaque question est un groupe de boutons radio navigable au clavier (Radix), focus visible, progression annoncée aux lecteurs d'écran.

**Mobile**
- Cartes en grille 2 colonnes, question en haut, Retour et Continuer fixés en bas.
- Faders avec zone de toucher agrandie, prix affiché en bandeau collant en bas de l'écran.

**Contenu à fournir** : 4 visuels de choix, règles de tarification (prix de base et options, modifiables sans toucher au code), textes des packs.

---

### Section 6 : Conversion et générique (tarifs, FAQ, réservation, contact)

**Rôle** : transformer l'envie en réservation, puis clôturer la page comme un film.

**Packages** : Radix (Tabs, Accordion), Motion, GSAP (ScrollTrigger, Flip, MorphSVG), Embla (packs sur mobile), React Hook Form + Zod, Lenis (`scrollTo` vers la réservation), Howler.js optionnel (clap de fin).

#### 6A. Offres et tarifs

```
┌────────────────────────────────────────────────────────────────┐
│ Titre (col 1-6)              Onglets : Photo · Podcast audio ·   │
│                              Podcast vidéo · Vidéo (col 7-12)   │
│                                                                 │
│  ┌────────┐   ┌───────────────┐   ┌────────┐                    │
│  │ Pack 1 │   │    Pack 2     │   │ Pack 3 │                    │
│  │        │   │ (mis en avant,│   │        │                    │
│  │ prix   │   │  plus grand)  │   │ prix   │                    │
│  │ liste  │   │ prix · liste  │   │ liste  │                    │
│  │ [BTN]  │   │ [BTN]         │   │ [BTN]  │                    │
│  └────────┘   └───────────────┘   └────────┘                    │
│                                                                 │
│   [BTN] Télécharger le catalogue Shooting / Podcast (PDF)        │
└────────────────────────────────────────────────────────────────┘
```

- 3 packs par service. Le pack central est plus grand et légèrement surélevé, avec un contour rouge discret.
- Chaque carte porte une photo du matériel utilisé (caméra, micro) tirée des catalogues du studio.
- Changement d'onglet : réorganisation des cartes avec Flip, contenu en fondu court.
- Survol (desktop) : inclinaison de 3 degrés, visuel en parallaxe. Aucun effet sur mobile.
- Prix en FCFA avec séparateur de milliers, modalités d'acompte, paiement par mobile money.
- Liens vers les deux catalogues existants (Shooting et Podcast).

#### 6B. FAQ (« En coulisses »)

```
┌────────────────────────────────────────────────────────────────┐
│ Titre « Questions fréquentes »     Accordéon (col 6-12)         │
│ (col 1-4, collant)                 ▸ Quel est le délai de       │
│ « Une autre question ? »             livraison ?                │
│ [BTN] WhatsApp                     ▸ Faut-il verser un acompte ?│
│                                    ▸ Vous déplacez-vous ?       │
│                                    ▸ Combien de retouches ?     │
│                                    ▸ Quels moyens de paiement ? │
└────────────────────────────────────────────────────────────────┘
```

- Titre et bouton WhatsApp collants à gauche pendant que l'accordéon défile à droite.
- Radix Accordion pour l'accessibilité, Motion pour l'animation de hauteur (`height: auto`), flèche qui tourne, texte en fondu court. Une seule question ouverte à la fois.
- Ajouter les questions propres au studio : durée d'une session podcast, matériel fourni, fichiers livrés (audio, vidéo, formats), location du studio à l'heure.

#### 6C. Réservation et contact (avec grille de disponibilités en timeline)

```
┌────────────────────────────────────────────────────────────────┐
│  Formulaire en étapes (col 1-7)       │ Carte d'infos (col 8-12)│
│  ┌─────────────────────────────┐      │ ┌────────────────────┐  │
│  │ 1 Projet  2 Créneau  3 Vous │      │ │ [Carte / plan]     │  │
│  │                             │      │ │ Adresse            │  │
│  │ Étape 2 : timeline          │      │ │ Horaires lun-sam   │  │
│  │ 8h30 ▭▭▮▮▭▭▭▮▮▮▭▭ 20h       │      │ │ [BTN] WhatsApp     │  │
│  │  libre / réservé            │      │ │ Téléphone · E-mail │  │
│  │ [BTN] Continuer             │      │ └────────────────────┘  │
│  └─────────────────────────────┘      │                         │
└────────────────────────────────────────────────────────────────┘
```

- Formulaire en 3 étapes avec barre de progression (vraie séquence, numérotation justifiée) : projet et occasion, créneau et budget, coordonnées et message.
- **Étape « créneau » : une timeline de disponibilités** façon planning de montage. Une règle horizontale de 8 h 30 à 20 h, des blocs libres et réservés, que l'on sélectionne en faisant glisser. Au départ avec des données simulées ou saisies à la main, ensuite alimentée par l'agenda réel du studio (étape de la future plateforme).
- Les réponses du quiz préremplissent le formulaire.
- `AnimatePresence` entre les étapes, validation en direct avec messages clairs (« Entrez un numéro WhatsApp valide », jamais « Erreur »).
- À l'envoi : le bouton devient « Demande envoyée », le diaphragme se ferme puis se rouvre, un message indique le délai de réponse.
- Carte d'infos collante à droite : adresse (Abidjan, Cocody Angré Nouveau CHU), horaires (lundi au samedi, 8 h 30 à 20 h), WhatsApp, téléphone, e-mail.
- Les données partent vers la base (Airtable ou Notion) et déclenchent une notification à l'équipe.

#### 6D. Générique de fin

- Une scène sombre qui se ferme en iris, avec une phrase de clôture : « C'est dans la boîte. À vous de jouer. » et un dernier bouton de réservation.
- Défilement lent de type générique (ScrollTrigger) : équipe, réseaux sociaux, adresse, mentions légales, avec le motif africain en filigrane. Clap sonore optionnel.
- Pied de page : logo version blanche avec baseline, réseaux (Facebook, Instagram, LinkedIn, TikTok), mentions légales, adresse du site.

**Mobile pour toute la section 6**
- Packs en défilement horizontal avec accroche (Embla), le pack central visible par défaut.
- Bouton « Réserver » fixé en bas de l'écran pendant toute la section.
- Carte d'infos sous le formulaire, boutons d'appel et WhatsApp en pleine largeur.
- Timeline de disponibilités en défilement horizontal avec créneaux de 44 px minimum.

---

## 6. Système de mise en page global

- **Grille** : 12 colonnes, marges latérales de 24 px sur mobile, 64 à 96 px sur desktop. Texte courant limité à 65 à 75 caractères par ligne.
- **Alignement** : texte à gauche partout, sauf le quiz et le générique (centrés). Pas de texte justifié.
- **Échelle typographique fluide** (`clamp()`) : titres de scène très grands, sous-titres moyens, texte courant de 16 à 18 px avec interlignage généreux.
- **Espacement vertical** : 120 à 200 px entre scènes sur desktop. Le vide fait partie du design.
- **Arrondis et ombres** : hiérarchisés, pas identiques partout. Cohérents avec le logo, plutôt francs que très ronds.
- **Boutons** : un principal rouge, un secondaire à contour blanc. Même libellé d'action dans tout le parcours (« Réserver »). Libellés précis : « Réserver ce pack », « Recevoir le devis sur WhatsApp », pas « Soumettre ».

---

## 7. Responsive, performance, accessibilité, qualité

### Responsive
- Concevoir **mobile d'abord** : la majorité des visiteurs viendront d'un téléphone.
- Sur tactile ou écran étroit : supprimer épinglages complexes, inclinaisons au curseur, curseur personnalisé et 3D. Conserver une animation d'entrée simple par section.
- `gsap.matchMedia()` pour séparer clairement les comportements.

### Performance (connexions mobiles variables)
- Images en AVIF ou WebP via `next/image`, tailles adaptées, chargement différé sous la ligne de flottaison.
- Vidéos courtes (moins de 10 s en boucle), MP4 ou WebM compressés avec image d'aperçu, chargées à la demande, jamais avec son automatique.
- Respecter le mode économie de données : plus de vidéos de fond, 3D désactivée, animations réduites.
- N'animer que `transform` et `opacity` (et `clip-path` avec parcimonie). Éviter d'animer dimensions et ombres.
- Charger la 3D, le WebGL et l'audio à la demande, uniquement quand leur section approche.
- Objectif : 60 images par seconde sur un Android de milieu de gamme, score Lighthouse mobile supérieur à 85.

### Accessibilité
- Respecter `prefers-reduced-motion` : parallaxe, épinglage, iris et 3D remplacés par des fondus courts et des images statiques.
- Toutes les interactions (comparateur, quiz, FAQ, formulaire, onglets, régie multicaméra, timeline de créneaux) fonctionnent au clavier, avec focus visible.
- Contrastes suffisants, surtout pour le texte sur les photos (dégradé sombre sous le texte).
- Textes alternatifs descriptifs ; sous-titres ou transcription pour les extraits audio et vidéo.
- Aucune information essentielle transmise uniquement par le mouvement, le son ou la couleur.

### Qualité et suivi
- **Playwright** pour tester les parcours critiques (quiz complet, envoi du formulaire, changement d'onglet), **axe-core** pour l'accessibilité automatique.
- **Lighthouse et Web Vitals** pour la performance, avec contrôle avant chaque mise en production.
- **Sentry** pour les erreurs, **Vercel Analytics** (ou équivalent) pour l'audience et les points d'abandon du quiz et du formulaire.

---

## 8. Sources d'inspiration

À consulter pour comprendre **comment** les meilleurs studios construisent leurs interactions, pas pour copier :

| Source | Utilité |
|---|---|
| Awwwards (awwwards.com) | Sites primés, analyse d'interactions, catégories nominées |
| Codrops (tympanus.net/codrops) | Tutoriels et démos WebGL, scroll, transitions, effets de survol |
| GSAP Showcase (gsap.com/showcase) | Sites réels utilisant GSAP et ses plugins |
| Godly (godly.website) | Collection d'interfaces très travaillées |
| landing.love et CSS Design Awards | Landing pages primées, bons exemples de conversion |

Références à étudier pour leur approche de la scène, de la 3D et du scroll : Active Theory, Locomotive, Phantom.

**Comment chercher** : se concentrer sur les univers proches du nôtre (photographie, production vidéo, studio d'enregistrement, podcast, musique, cinéma). Mots-clés utiles : *photography studio*, *film production*, *audio*, *podcast*, *cinematic scroll*, *camera*, *light*.

**Ce qu'il faut en retirer** :
- Les mécanismes (épinglage, masque, parallaxe, rythme des transitions), pas les identités visuelles.
- Les choix de typographie et de composition qui servent un propos, pas la décoration.
- Ce qui reste fluide sur mobile. Un effet admirable sur grand écran mais lourd sur téléphone n'est pas retenu.

**Règle** : aucune copie d'un site existant, ni de ses visuels, textes, animations signature ou code. S'inspirer d'une technique, la réinterpréter dans l'univers de Studio Plus.

---

## 9. À éviter absolument

- Faire apparaître chaque bloc par un fondu-glissement identique : c'est l'effet « site généré ».
- Empiler des cartes toutes identiques, avec la même ombre et le même arrondi.
- Étiqueter chaque section par une petite mention en majuscules espacées au-dessus du titre.
- Numéroter des éléments qui ne forment pas une séquence.
- Mettre en couleur un seul mot dans chaque titre.
- Charger la 3D, le WebGL ou l'audio sur tout le site « pour faire moderne ».
- Ajouter un effet sans lien avec le monde du studio (particules génériques, dégradés flottants, formes abstraites).
- Utiliser des photos de banque d'images : uniquement les vraies photos, vidéos et sons du studio.
- Lancer du son ou une vidéo avec son sans action explicite.
- Bloquer le scroll de façon agressive ou ralentir la page pour un effet.
- Modifier, recolorer ou déformer le logo.

---

## 10. Livrables attendus

1. Le code complet de la page (sections 2 à 6), un composant React par section, un sous-composant par bloc.
2. Un fichier de configuration central : textes, packs et prix, questions du quiz, règles de l'estimateur, créneaux, médias.
3. Les animations GSAP regroupées par section, avec nettoyage au démontage ; la courbe signature « studioOut » définie une seule fois.
4. Le moment 3D du micro en import dynamique avec repli statique.
5. Une version mobile fonctionnelle avec les simplifications décrites.
6. Un README listant : packages installés et rôle de chacun, comment modifier contenus et prix, comment brancher quiz, estimateur et formulaire sur Airtable ou Notion, comment tester (Playwright, axe-core, Lighthouse).

## 11. Critères de réussite

- Le visiteur comprend en moins de 10 secondes que Studio Plus est un vrai studio photo, vidéo et podcast, professionnel et chaleureux.
- Chaque section a **un** moment mémorable, et rien d'autre ne distrait.
- Chaque effet peut être expliqué par un geste ou un objet du studio.
- Du premier scroll à la demande de réservation : moins de 2 minutes, par le quiz ou par le formulaire direct.
- La page reste fluide et lisible sur un téléphone d'entrée de gamme, avec ou sans son, avec ou sans animations.
- Tout élément interactif est utilisable sans souris.
