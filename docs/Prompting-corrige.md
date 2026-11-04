# STUDIO PLUS — Spécification corrigée du booking

> Version 1.0 — novembre 2026
>
> Ce document remplace les parties trop ambitieuses ou contradictoires de
> `docs/Prompting.md` pour le périmètre actuellement développé. Il décrit ce
> qui doit être conservé, ce qui doit être simplifié et ce qui est reporté.

## 1. Décision produit

La priorité immédiate est de rendre la réservation fiable, claire et utilisable
sur mobile. Le tunnel doit permettre à un client de choisir une prestation, une
date, un horaire et d'envoyer sa demande sans être confronté à des fonctionnalités
non nécessaires.

Le booking actuel reste la base de travail. On l'améliore progressivement au
lieu de le remplacer par une nouvelle architecture complète.

## 2. État réel du projet

| Élément | État actuel | Décision |
|---|---|---|
| Framework | Next.js 16 App Router + TypeScript | Conserver |
| Page | `/reserver` | Conserver |
| API | `/api/studio` avec `GET`, `POST`, `PATCH`, `DELETE` | Conserver à court terme |
| Base | SQLite via `node:sqlite` | Remplacer immédiatement par Supabase PostgreSQL + Prisma |
| Authentification | Sessions applicatives + connexion | Reconnecter à Supabase Auth avec rôles serveur |
| Tunnel actuel | 3 étapes : projet, créneau, coordonnées | Conserver |
| Services | Podcast, shooting photo, production vidéo | Vérifier les tarifs et durées avec Studio Plus |
| Design | Identité sombre, rouge Studio+, interface mobile-first | Harmoniser et stabiliser |
| Notifications | Non finalisées | Invitation légère et e-mails essentiels après le cœur du booking |
| Paiement | Aucun paiement en ligne | Paiement sur place, enregistré manuellement |

## 3. Ce qui est conservé du document initial

- Le booking doit être mobile-first et en français.
- Les montants sont exprimés en FCFA, sans décimales.
- Les horaires doivent être calculés côté serveur.
- Un créneau occupé ne doit jamais pouvoir être réservé deux fois.
- La validation finale reste manuelle par l'équipe dans un premier temps.
- Les services photo, vidéo et podcast restent les trois offres principales.
- Le podcast reçoit une invitation légère via un lien sans compte.
- L'espace client pourra afficher les demandes et leur statut.
- La charte utilise principalement le noir, le blanc et le rouge `#EB0606`.
- Les boutons et contrôles doivent être arrondis, accessibles et utilisables au pouce.

## 4. Ce qui est retiré ou reporté

### Retiré de la première version

- Le tunnel obligatoire en cinq étapes : les options et le récapitulatif avancé
  ne sont pas nécessaires tant que les formules ne sont pas validées.
- Le paiement en ligne automatisé.
- La synchronisation Google Calendar bidirectionnelle.
- Le calcul de disponibilité par matériel et spécialité d'équipe.
- Le kanban complet de production.
- Les statistiques avancées, prévisions et règles décisionnelles complexes.
- La messagerie projet temps réel.
- La galerie de livrables lourds et les uploads vidéo.
- La PWA complète et l'application mobile native.

### Reporté après stabilisation

- Notifications WhatsApp et rappels automatisés.
- Consentement juridique avancé et fiche invité complète.
- Création automatique d'un projet après confirmation.
- Factures PDF et intégration de paiement en ligne.

### Ajouté immédiatement

- Supabase PostgreSQL comme base persistante.
- Deux bases Supabase séparées : une base de développement et une base de
  production, sans partage de données ni de clés.
- Prisma côté serveur pour les accès aux données.
- Supabase Auth pour la connexion et les sessions.
- Rôles minimaux `ADMIN`, `MANAGER`, `STAFF`, `CLIENT` et `GUEST`.
- Routing App Router séparé par espace et rôle.
- Paiement sur place enregistré manuellement : espèces, Wave, Orange Money,
  MTN MoMo ou virement.
- Statistiques essentielles : demandes, confirmées, annulées, chiffre encaissé,
  prestations les plus demandées et taux d'occupation simple.
- Invitation podcast légère : nom, e-mail ou WhatsApp, lien sécurisé, accepter
  ou décliner, sans création de compte.
- Resend pour les e-mails transactionnels, avec clé serveur et domaine vérifié.

## 5. Parcours cible de la première version

### Étape 1 — Choisir le projet

Afficher les prestations actives sous forme de cartes lisibles :

- nom de la prestation ;
- durée indicative ;
- prix ou « à confirmer » ;
- visuel léger ;
- sélection visible au clavier et au toucher.

### Étape 2 — Choisir le créneau

- sélectionner une date future ;
- exclure les jours fermés ;
- charger les créneaux réellement occupés par l'API ;
- générer les créneaux par pas de 30 minutes ;
- tenir compte de la durée de la prestation ;
- empêcher les horaires déjà passés ;
- afficher un état clair lorsqu'aucun créneau n'est disponible.

### Étape 3 — Envoyer la demande

- si le visiteur n'est pas connecté, l'envoyer vers `/connexion` en conservant
  `service`, `date` et `time` dans `return_to` ;
- demander nom, e-mail, téléphone, titre et détails ;
- afficher le résumé avant l'envoi ;
- créer une demande `requested` côté serveur ;
- afficher une confirmation avec la date, l'heure et la prestation.

Le texte doit préciser que le créneau et le montant sont confirmés par l'équipe
et qu'aucun paiement en ligne n'est effectué à ce stade.

## 6. Règles fonctionnelles actuelles

1. Le client ne peut pas envoyer une demande sans session.
2. Le serveur ne fait pas confiance au prix, à la durée ou au titre envoyés par
   le navigateur.
3. Une date invalide, passée ou fermée est refusée côté serveur.
4. Un horaire en conflit est refusé même si deux clients envoient leur demande
   presque simultanément.
5. Les informations personnelles ne doivent jamais apparaître dans les erreurs
   publiques.
6. Les erreurs API utilisent un message humain et un statut HTTP cohérent.
7. Le chargement, l'erreur et le succès sont visibles et accessibles.
8. Le formulaire ne doit pas provoquer de débordement horizontal sur mobile.

## 7. Design et responsive

- Fond principal noir ou presque noir ; ne pas laisser apparaître de gris délavé
  non prévu par la palette.
- Rouge principal : `#EB0606`.
- Texte courant : blanc ou gris clair avec contraste suffisant.
- Boutons : arrondis de manière cohérente sur toutes les pages.
- Sur mobile : une seule colonne, marges latérales de 16 à 24 px, boutons larges,
  champs de 44 px minimum de hauteur.
- Le résumé passe sous le formulaire sur mobile.
- Les étapes restent visibles sans réduire le texte au point de le rendre illisible.
- Aucun élément décoratif ne doit décaler le formulaire ou créer un scroll horizontal.
- Le scroll doit appartenir à la page ; éviter les conteneurs `h-screen` avec un
  deuxième scroll interne sauf nécessité démontrée.

## 8. Architecture, routing et rôles

### Routing App Router

```text
/app
  /(public)/page.tsx
  /(public)/reserver/page.tsx
  /(public)/connexion/page.tsx
  /(client)/espace/page.tsx
  /(client)/espace/reservations/[id]/page.tsx
  /equipe/page.tsx
  /equipe/seances/page.tsx
  /(manager)/gestion/page.tsx
  /(manager)/gestion/reservations/page.tsx
  /(manager)/gestion/statistiques/page.tsx
  /(manager)/gestion/emails/page.tsx
  /(admin)/gestion/utilisateurs/page.tsx
  /invite/[token]/page.tsx
  /api/services/route.ts
  /api/availability/route.ts
  /api/bookings/[id]/payments/route.ts
  /api/invitations/[token]/route.ts
  /api/stats/overview/route.ts
  /api/gestion/emails/route.ts
  /api/admin/users/route.ts
/lib
  /prisma.ts
  /supabase/client.ts
  /supabase/server.ts
  /auth.ts
/services
  /booking-service.ts
  /availability-service.ts
  /invitation-service.ts
  /stats-service.ts
/validators
  /booking.ts
  /invitation.ts
```

Les routes publiques ne doivent jamais exposer les données privées. Les routes
client vérifient la propriété de la réservation. Les routes équipe vérifient le
rôle côté serveur, et pas seulement dans l'interface.

### Séparation des bases

Le projet utilise deux projets Supabase indépendants :

| Environnement | Projet Supabase | Usage |
|---|---|---|
| Développement | `studio-plus-dev` | Tests locaux, seed, données fictives |
| Production | `studio-plus-prod` | Données réelles uniquement |

Les variables `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` doivent être
différentes dans chaque environnement. Les clés de développement ne doivent
jamais être utilisées par Vercel en production.

Les migrations Prisma sont versionnées dans Git puis appliquées séparément :

```bash
# développement
DATABASE_URL=... DIRECT_URL=... npx prisma migrate dev

# production, après validation
DATABASE_URL=... DIRECT_URL=... npx prisma migrate deploy
```

Le seed contient uniquement des données de test et ne doit jamais être exécuté
automatiquement sur la production. Une sauvegarde de production doit être faite
avant toute migration destructive.

### Rôles minimums

| Rôle | Accès minimum |
|---|---|
| `ADMIN` | Tout le système, utilisateurs, paramètres et statistiques |
| `MANAGER` | Réservations, planning, validation, paiements manuels, statistiques |
| `STAFF` | Agenda et réservations affectées, sans finances ni paramètres |
| `CLIENT` | Ses réservations, son statut et ses invitations |
| `GUEST` | Uniquement son invitation podcast via lien sécurisé |

Le rôle est contrôlé côté serveur par `requireRole()`. Les pages sont protégées
par middleware ou layout serveur, mais ces protections d'interface ne remplacent
jamais les contrôles dans les services et les mutations.

### Carte des pages et des flows

| Route | Accès | Fonction principale | Redirection prévue |
|---|---|---|---|
| `/` | Public | Présentation Studio+ | `/reserver` depuis les CTA |
| `/reserver` | Public puis `CLIENT` | Tunnel de réservation | `/connexion?return_to=...` si nécessaire |
| `/connexion` | Public | Connexion | Retour à `return_to` ou `/espace` |
| `/inscription` | Public | Création de compte client | `/reserver` ou `/espace` |
| `/mot-de-passe-oublie` | Public | Récupération d'accès | `/connexion` |
| `/espace` | `CLIENT` | Page pilote client | `/reserver`, réservations ou projet |
| `/espace/reservations` | `CLIENT` | Liste et statuts | `/espace/reservations/[id]` |
| `/espace/reservations/[id]` | `CLIENT` | Détail, annulation, invités | Retour `/espace/reservations` |
| `/espace/projets/[id]` | `CLIENT` | Timeline et livrables | Retour à la réservation |
| `/studio` | Public | Vitrine présentant le studio | `/reserver` depuis les CTA |
| `/equipe` | `STAFF` | Agenda et tâches affectées | `/connexion` si non connecté |
| `/gestion` | `MANAGER`, `ADMIN` | Page pilote équipe | `/gestion/reservations` |
| `/gestion/reservations` | `MANAGER`, `ADMIN` | Validation et planning | Détail ou retour à la liste |
| `/gestion/statistiques` | `MANAGER`, `ADMIN` | Indicateurs essentiels | Retour `/gestion` |
| `/gestion/emails` | `MANAGER`, `ADMIN` | Échecs et relance sécurisée des e-mails | Retour `/gestion` |
| `/gestion/utilisateurs` | `ADMIN` | Comptes et rôles | Retour `/gestion` |
| `/invite/[token]` | Invité avec token | Accepter ou décliner | État final de l'invitation |
| `/non-autorise` | Connecté sans droit | Expliquer l'accès refusé | Retour à son espace |
| `/erreur` | Tous | Erreur récupérable | Réessayer ou revenir à l'espace |
| `/indisponible` | Tous | Maintenance ou service indisponible | Réessayer plus tard |

### Règles de flow

1. Un visiteur peut consulter le site et commencer une réservation sans compte.
2. Une étape nécessitant une session redirige vers la connexion en conservant
   l'état de la réservation.
3. Après connexion, le client revient exactement à l'étape interrompue.
4. Un utilisateur connecté est redirigé vers son espace selon son rôle.
5. Un rôle insuffisant ne voit pas une page vide : il reçoit une page
   `/non-autorise` avec une action de retour.
6. Chaque mutation affiche une confirmation ou une erreur actionnable.
7. Chaque liste prévoit les états chargement, vide, erreur et données chargées.
8. Chaque flow possède une sortie : continuer, revenir, réessayer ou contacter
   l'équipe. Aucun bouton ne doit mener à une route inexistante.

### États obligatoires par page

Chaque page et chaque composant de données doit prévoir :

- `loading` : skeleton respectant la structure finale, sans écran blanc ;
- `empty` : message utile, contexte et CTA principal ;
- `error` : message humain, bouton réessayer et lien de sortie ;
- `unauthorized` : redirection ou page dédiée selon le contexte ;
- `success` : confirmation lisible et prochaine action ;
- `offline` ou timeout : conservation des données saisies et possibilité de
  réessayer.

Les skeletons ne doivent pas utiliser une animation agressive. Ils reprennent
les surfaces de la direction artistique : fond noir ou blanc selon l'espace,
bords arrondis, gris de contraste mesuré et accent rouge uniquement pour l'état
actif ou l'action principale.

### Pages pilotes

- `/espace` : prochain rendez-vous, état de la dernière demande, bouton Réserver,
  accès aux réservations et aux projets.
- `/equipe` : séances du jour, prochaines tâches, alertes et accès rapide à la
  fiche de réservation.
- `/gestion` : demandes à traiter, séances du jour, encaissements manuels,
  occupation simple et alertes actionnables.

Une page pilote ne doit pas être un simple tableau décoratif : chaque indicateur
doit conduire vers une liste ou une action vérifiable.

### Direction artistique non négociable

Chaque page ajoutée pendant l'implémentation doit respecter :

- palette Studio+ : noir, blanc, rouge `#EB0606`, bleu réservé aux données,
  orange réservé aux alertes ponctuelles ;
- logo officiel et version adaptée au fond ;
- typographie et hiérarchie cohérentes avec le site existant ;
- boutons arrondis, focus visible, zones tactiles de 44 px minimum ;
- aucun composant générique non adapté au ton Studio+ ;
- responsive mobile avant desktop ;
- scroll vertical unique, sans `h-screen` ou `overflow` qui casse le parcours ;
- contrastes et messages lisibles dans les états normaux et dégradés.

## 9. Données minimales nécessaires

### Services

`id`, `name`, `duration`, `price`, `image`, `active`.

### Réservation

`id`, `owner_id`, `service`, `title`, `date`, `time`, `duration`, `amount`,
`status`, `name`, `email`, `phone`, `notes`, `created_at`.

### Statuts

Pour la V1 : `requested`, `confirmed`, `cancelled`, `completed`.

Les états `pending`, `rescheduled`, `in_progress` et `no_show` seront ajoutés
quand les règles métier seront validées.

## 10. Statistiques minimales

La première version des statistiques reste volontairement simple :

- nombre de demandes par période ;
- réservations confirmées et annulées ;
- chiffre encaissé manuellement ;
- répartition par prestation ;
- taux d'occupation basé sur les créneaux ouverts ;
- nouveaux clients et clients récurrents.

Accès limité à `ADMIN` et `MANAGER`. Les données sont calculées côté serveur
avec Prisma et affichées dans `/gestion/statistiques`.

## 11. Invitation podcast légère

Après une réservation podcast, le client ou le manager peut ajouter un invité
avec son nom et son e-mail ou numéro WhatsApp. Le système crée un token aléatoire
à durée limitée, stocké haché en base.

La page `/invite/[token]` permet uniquement :

- voir le nom du podcast, la date et l'heure ;
- accepter l'invitation ;
- décliner l'invitation ;
- laisser une note courte.

La bio, la photo, les réseaux sociaux, le conducteur et le consentement juridique
complet restent prévus pour une phase ultérieure.

## 12. E-mails transactionnels avec Resend

Resend est utilisé pour les e-mails déclenchés par une action métier. La clé
`RESEND_API_KEY` reste uniquement côté serveur et n'est jamais exposée au
navigateur.

E-mails de la première version :

- demande de réservation reçue ;
- réservation confirmée ;
- réservation annulée ou modifiée ;
- invitation podcast ;
- réponse à une invitation ;
- récupération de compte si nécessaire.

Les templates utilisent le logo officiel, les couleurs Studio+, une version texte
accessible et un lien d'action clair. Le domaine d'envoi doit être vérifié dans
Resend avant la production, par exemple `notifications@studioplusci.com`.

Les envois sont déclenchés côté serveur après validation de l'action. Une erreur
Resend ne doit pas annuler une réservation déjà enregistrée : elle doit être
journalisée et affichée à l'équipe pour réessai.

## 13. Contrat API à stabiliser

- `GET /api/services` : catalogue public.
- `GET /api/availability?serviceId=&date=` : créneaux disponibles.
- `POST /api/bookings` : création d'une demande authentifiée.
- `PATCH /api/bookings/:id` : confirmation, modification ou annulation protégée.
- `POST /api/bookings/:id/payment` : enregistrement d'un paiement sur place.
- `POST /api/bookings/:id/invitations` : invitation podcast légère.
- `GET/POST /api/invitations/:token` : lecture et réponse de l'invité.
- `GET /api/stats/overview` : statistiques limitées à `ADMIN` et `MANAGER`.

Pendant la migration, `/api/studio` peut rester un adaptateur temporaire vers ces
services afin de ne pas casser le booking déjà développé.

À moyen terme, ces actions pourront être séparées en `/api/services`,
`/api/availability` et `/api/bookings`, mais cette séparation n'est pas requise
pour corriger le parcours actuel.

## 14. Critères d'acceptation

- `/reserver` se charge sans erreur 503.
- Le catalogue s'affiche même sur un écran mobile étroit.
- Le changement de prestation recalcule les horaires disponibles.
- Une date fermée ne propose aucun créneau.
- Une réservation passée ou en conflit est refusée côté serveur.
- Le retour depuis la connexion conserve le choix initial.
- Le formulaire ne déborde pas horizontalement.
- Le bouton de confirmation est utilisable au clavier et au toucher.
- La demande enregistrée est visible dans l'espace client.
- Les erreurs sont compréhensibles et proposent une action.

## 15. Décisions encore nécessaires

Avant d'ajouter les fonctions avancées, Studio Plus doit confirmer :

1. les durées et tarifs réels de chaque prestation ;
2. les jours et horaires exacts ;
3. la règle de confirmation manuelle ou automatique ;
4. la politique d'annulation et de replanification ;
5. la base persistante à utiliser en production ;
6. les coordonnées officielles et les canaux de notification.

