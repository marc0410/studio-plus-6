# STUDIO PLUS — Plan d'implémentation du booking

> Plan pratique dérivé de `docs/Prompting-corrige.md`.
> Chaque étape doit être vérifiée avant de passer à la suivante.

## Étape 0 — État de référence

Objectif : partir d'une base reproductible.

- vérifier que `/reserver` existe dans l'App Router ;
- vérifier que `/api/studio` répond en local ;
- vérifier que les migrations Prisma passent sur le projet Supabase de développement ;
- vérifier que la connexion et la déconnexion fonctionnent ;
- noter les prestations, durées et tarifs actuellement utilisés.

Commandes :

```bash
npm install
npm run db:dev
npm run typecheck
npm run test
npm run build
```

Livrable : une branche locale qui démarre et dont les tests passent.

## Règle globale — Implémenter une tranche complète

Chaque fonctionnalité doit être livrée avec son flow complet :

1. route et page principale ;
2. layout et contrôle du rôle ;
3. navigation d'entrée et de sortie ;
4. loading et skeleton ;
5. état vide ;
6. erreur, timeout et bouton réessayer ;
7. succès et prochaine action ;
8. responsive mobile et desktop ;
9. tests d'accès et parcours utilisateur.

Il est interdit de livrer une API sans page utilisable, une page sans état
d'erreur, ou un bouton qui pointe vers une route non implémentée.

La direction artistique doit être vérifiée à chaque étape : palette Studio+,
logo officiel, boutons arrondis, typographie, contrastes, rythme visuel,
mobile-first et scroll vertical unique.

## Étape 0 bis — Installer la structure App Router

Objectif : établir toutes les destinations avant de remplir les fonctionnalités.

Créer les layouts et pages suivantes, même si certaines commencent par un état
vide contrôlé :

```text
app/
  (public)/page.tsx
  (public)/reserver/page.tsx
  (public)/connexion/page.tsx
  (public)/inscription/page.tsx
  (public)/mot-de-passe-oublie/page.tsx
  (client)/espace/page.tsx
  (client)/espace/reservations/page.tsx
  (client)/espace/reservations/[id]/page.tsx
  (client)/espace/projets/[id]/page.tsx
  equipe/page.tsx
  equipe/seances/page.tsx
  (manager)/gestion/page.tsx
  (manager)/gestion/reservations/page.tsx
  (manager)/gestion/statistiques/page.tsx
  (admin)/gestion/utilisateurs/page.tsx
  invite/[token]/page.tsx
  non-autorise/page.tsx
  erreur.tsx
  loading.tsx
  not-found.tsx
  indisponible/page.tsx
```

Chaque groupe reçoit son layout, sa navigation et son garde de rôle. Les
redirections sont documentées et testées avant de développer les écrans métier.

Livrable : aucune route principale ne renvoie vers une page blanche ou une URL
non définie.

## Étape 1 — Installer Supabase, Prisma et l'authentification

Objectif : mettre en place immédiatement la fondation persistante et les rôles.

- créer deux projets Supabase complètement séparés :
  - `studio-plus-dev` pour le développement et les données fictives ;
  - `studio-plus-prod` pour les vraies données du site ;
- ne jamais partager les URLs, clés ou bases entre ces deux environnements ;
- ajouter `DATABASE_URL`, `DIRECT_URL`, les clés Supabase et `APP_URL` ;
- ajouter `RESEND_API_KEY` uniquement dans l'environnement serveur ;
- configurer les variables séparément dans `.env.local` et dans Vercel ;
- ne jamais committer les fichiers `.env` ni les clés Supabase ;
- utiliser l'URL pooler (port `6543`, `pgbouncer=true`) pour `DATABASE_URL`
  côté application, et l'URL PostgreSQL directe (port `5432`) pour
  `DIRECT_URL` et les migrations ;
- configurer les mêmes variables séparément pour chaque projet Supabase ;
- installer et configurer Prisma selon la version réellement utilisée ;
- créer les modèles minimaux : profils, services, réservations, créneaux,
  paiements manuels, invitations et journal d'e-mails ; les sessions sont gérées
  par Supabase Auth ;
- créer `lib/prisma.ts`, `lib/supabase/client.ts` et `lib/supabase/server.ts` ;
- connecter Supabase Auth à l'espace connexion ;
- ajouter les rôles `ADMIN`, `MANAGER`, `STAFF`, `CLIENT` et `GUEST` ;
- protéger les layouts et les mutations avec `requireRole()` ;
- activer les règles RLS adaptées et ne jamais exposer la clé service ;
- ajouter un seed idempotent pour le catalogue et les paramètres uniquement ;
  les comptes et leurs rôles sont gérés par Supabase Auth et l'administration.

### Règle de migration des bases

Les migrations Prisma sont la seule source de vérité du schéma. Elles sont
créées et testées sur la base de développement, puis déployées sur la base de
production uniquement après validation :

```bash
# local : développement
npx prisma migrate dev --name init_booking
npx prisma db seed

# production : jamais migrate dev, jamais de seed de test
npx prisma migrate deploy
```

Le pipeline de production doit utiliser uniquement `migrate deploy`. Le seed
de test est interdit en production. Avant une migration modifiant ou supprimant
des colonnes, effectuer une sauvegarde de `studio-plus-prod` et vérifier la
migration sur une copie ou un environnement de staging.

Livrable : un utilisateur peut se connecter et accéder uniquement à son espace.

### Configuration concrète des environnements

1. Créer deux projets Supabase indépendants : `studio-plus-dev` et
   `studio-plus-prod`. Récupérer pour chacun son Project URL, sa clé
   publishable/anon, son URI de connexion pooler et son URI directe. Ne jamais
   copier la chaîne de connexion d'un projet dans l'autre.
2. En local, copier `.env.example` vers `.env.local` et y mettre uniquement les
   identifiants du projet dev. `DATABASE_URL` est l'URI pooler avec
   `?pgbouncer=true`; `DIRECT_URL` est l'URI directe. Les deux sont des secrets
   serveur et ne doivent pas porter le préfixe `NEXT_PUBLIC_`.
3. Sur Vercel, associer les variables dev aux environnements Preview et les
   variables prod à Production. Mettre `APP_URL` sur l'URL correspondante.
4. Appliquer d'abord les migrations au projet dev avec `npm run db:dev`, puis
   initialiser son catalogue avec `npm run db:seed`. Après validation, lancer
   `npm run db:deploy` sur la connexion prod. Ne jamais lancer le seed sur prod.
5. Après inscription du premier compte, promouvoir explicitement l'adresse
   choisie comme administrateur dans le SQL Editor du projet correspondant :

   ```sql
   UPDATE public.profiles SET role = 'ADMIN' WHERE email = 'admin@exemple.com';
   ```

   Répéter séparément sur dev/prod uniquement pour les administrateurs voulus.
   L'API d'administration empêche ensuite de retirer le dernier administrateur.
6. Dans Supabase Auth → URL Configuration, définir le Site URL de chaque
   environnement et autoriser son callback `/auth/callback` (local :
   `http://localhost:3000/auth/callback`; ajouter les domaines Preview et le
   domaine de production). Utiliser la page `/nouveau-mot-de-passe` pour le
   retour des liens de récupération.
7. Dans Resend, vérifier le domaine d'envoi et publier ses enregistrements DNS
   SPF/DKIM. Créer des clés API distinctes dev/prod et configurer
   `RESEND_API_KEY`, `EMAIL_FROM` (adresse sur le domaine vérifié) et
   `STUDIO_BOOKING_EMAIL` dans chaque environnement. Pour les liens contenus
   dans les courriels, définir `APP_URL` correctement. Les courriels Auth de
   confirmation/récupération utilisent le SMTP personnalisé de Supabase :
   configurer Resend comme SMTP dans Supabase Auth, indépendamment de la clé
   Resend utilisée par les notifications métier.

Variables attendues dans `.env.local` et Vercel : `APP_URL`, `DATABASE_URL`,
`DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`RESEND_API_KEY`, `EMAIL_FROM`, `STUDIO_BOOKING_EMAIL`. Pour les livrables privés
de la phase projet, ajouter `SUPABASE_SERVICE_ROLE_KEY` côté serveur uniquement
et `SUPABASE_STORAGE_BUCKET=studio-deliverables`; cette clé ne doit jamais être
ajoutée au navigateur. Créer le bucket en mode privé dans chaque projet Supabase.

Limite actuelle : les tables du booking ne migrent pas automatiquement les
anciennes données SQLite. Si la base existante contient des réservations à
conserver, exporter puis importer ces données de manière contrôlée avant le
basculement en production.

## Étape 1 bis — Valider les flows par rôle

Tester explicitement :

- visiteur → réservation → connexion → retour à la réservation ;
- `CLIENT` → `/espace`, sans accès à `/equipe` ou `/gestion` ;
- `STAFF` → `/equipe`, sans accès aux statistiques ni aux utilisateurs ;
- `MANAGER` → `/gestion`, sans gestion des rôles ;
- `ADMIN` → toutes les pages protégées ;
- token invité → `/invite/[token]`, sans compte ni accès aux espaces privés ;
- utilisateur non autorisé → `/non-autorise` avec retour fonctionnel ;
- session expirée → connexion avec conservation du contexte si possible.

Ajouter ces cas aux tests d'intégration avant d'ajouter les écrans secondaires.

## Étape 2 — Migrer le booking sans casser l'interface

Objectif : conserver le tunnel actuel tout en remplaçant sa source de données.

- garder le composant `BookingWizard` comme interface de transition ;
- faire appeler les services Prisma par les nouvelles routes ;
- conserver un adaptateur `/api/studio` temporaire si nécessaire, sans relâcher les contrôles de rôle et de statut ;
- migrer les données locales utiles ;
- vérifier catalogue, disponibilité et création de demande ;
- vérifier les droits d'accès client/manager.

Livrable : le booking fonctionne sur Vercel avec une base persistante.

## Étape 3 — Fiabiliser le contrat serveur

Objectif : faire du serveur la source de vérité.

- valider toutes les entrées de réservation ;
- recalculer durée et montant depuis la configuration serveur ;
- valider date, jour fermé et horaire ;
- vérifier les chevauchements dans une transaction ;
- retourner des erreurs `{ error, code }` cohérentes ;
- ajouter les tests de concurrence et de réservation invalide.

Livrable : les mêmes règles sont respectées depuis le navigateur, curl ou un
autre client.

Pour chaque endpoint, vérifier aussi les réponses 401, 403, 404, 409, 422 et
500, avec un message lisible côté interface.

## Étape 4 — Corriger le tunnel mobile

Objectif : rendre le parcours confortable sur téléphone.

- une colonne sous 768 px ;
- résumé sous le formulaire ;
- marges et espacements constants ;
- champs suffisamment grands pour le doigt ;
- boutons arrondis et largeur adaptée ;
- pas de `overflow-x` involontaire ;
- pas de double scroll dû à `h-screen` ou `overflow` imbriqués ;
- focus visible et ordre clavier cohérent ;
- états loading, empty, error et success testés visuellement.

Livrable : captures ou tests sur 375 px, 390 px, 768 px et desktop.

Prévoir les composants réutilisables `PageSkeleton`, `ListSkeleton`,
`EmptyState`, `ErrorState`, `SuccessState` et `AccessDeniedState`, avec les
tokens de la direction artistique. Le skeleton doit avoir la même géométrie que
le contenu final afin d'éviter les sauts de mise en page.

## Étape 5 — Corriger le retour connexion → réservation

Objectif : ne pas perdre le choix du client.

- encoder proprement `service`, `date` et `time` dans `return_to` ;
- refuser les URLs externes dans le retour ;
- restaurer les valeurs après connexion ;
- afficher une confirmation du créneau restauré ;
- tester le parcours visiteur puis connecté.

## Étape 6 — Ajouter la gestion minimale côté équipe

Objectif : permettre à l'équipe de traiter les demandes.

- afficher les demandes par statut ;
- confirmer ou annuler une demande ;
- protéger ces actions côté serveur ;
- conserver la date, l'heure, le client et les notes ;
- afficher les changements dans l'espace client ;
- journaliser les erreurs de gestion.

Ne pas construire encore le cockpit complet, le kanban avancé ou la gestion de
matériel.

Cette étape doit toutefois livrer la page pilote `/gestion` avec ses états
loading, vide, erreur et succès. Les cartes statistiques doivent être reliées à
des listes ou actions réelles.

## Étape 7 — Paiement sur place

Objectif : suivre les paiements sans intégrer de paiement en ligne.

- ajouter `paymentStatus`, `paymentMethod`, `amountPaid`, `paidAt` et
  `recordedBy` ;
- permettre à `MANAGER` ou `ADMIN` d'enregistrer espèces, Wave, Orange Money,
  MTN MoMo ou virement ;
- afficher le statut dans l'espace équipe et l'espace client ;
- journaliser chaque modification.

## Étape 8 — Statistiques essentielles

Objectif : fournir des indicateurs immédiatement utiles sans construire une BI.

- créer `/gestion/statistiques` ;
- protéger la page pour `ADMIN` et `MANAGER` ;
- afficher demandes, confirmations, annulations, chiffre encaissé, services les
  plus demandés, occupation simple, nouveaux et récurrents ;
- ajouter filtres période et service ;
- calculer côté serveur avec Prisma ;
- ne pas ajouter d’export CSV ni d’alertes : ils sont hors périmètre confirmé.

Prévoir loading/skeleton, aucun résultat pour une période vide, erreur de calcul,
et accès refusé pour `STAFF` et `CLIENT`.

## Étape 9 — Invitation podcast légère

Objectif : inviter un intervenant sans créer de compte.

- ajouter `GuestInvitation` liée à une réservation ;
- stocker uniquement le hash du token ;
- définir une expiration ;
- créer `/invite/[token]` ;
- permettre accepter, décliner et laisser une note ;
- limiter les données visibles et les tentatives ;
- tester token invalide, expiré et déjà utilisé.

Prévoir les pages d'état : invitation introuvable, invitation expirée, invitation
déjà traitée, réponse enregistrée et erreur réseau avec réessai.

## Étape 10 — Notifications et confirmation

Objectif : informer le client après chaque décision.

- créer un client Resend dans un module serveur dédié ;
- vérifier le domaine d'envoi dans Resend avant la production ;
- créer des templates e-mail Studio+ en HTML et texte brut ;
- envoyer l'e-mail de demande reçue ;
- envoyer l'e-mail de confirmation ou d'annulation ;
- envoyer l'e-mail d'invitation podcast ;
- préparer le lien WhatsApp sans bloquer l'envoi Resend ;
- fichier `.ics` après confirmation ;
- préférences de notification plus tard.

Règles obligatoires :

- `RESEND_API_KEY` ne doit jamais être importée dans un composant client ;
- les e-mails sont envoyés depuis une route serveur ou un service serveur ;
- une erreur Resend ne doit pas annuler une réservation enregistrée ;
- journaliser l'identifiant Resend, le destinataire, l'événement et l'erreur ;
- proposer `/gestion/emails` avec un bouton de réessai côté manager, une limite
  de trois tentatives et aucun stockage du jeton brut des liens d'invitation ;
- tester les e-mails avec une adresse de développement avant la production.

Livrable : chaque événement important possède un e-mail fiable, lisible sur
mobile et cohérent avec la direction artistique.

## Étape 11 — Podcast et invités avancés (implémenté, à valider)

Objectif : traiter le cas riche du podcast après stabilisation du cœur.

- ajouter les invités à une réservation ;
- générer un lien d'invitation aléatoire et expirant ;
- permettre accepter, décliner ou proposer un autre horaire ;
- enregistrer le consentement droit à l'image ;
- tester qu'un invité ne voit que sa propre fiche.

## Étape 12 — Projet, livrables et facture PDF (socle implémenté)

À réaliser seulement après validation des étapes précédentes :

- projet lié à une réservation confirmée ;
- timeline client simple ;
- tâches et notes internes côté équipe ;
- téléversement de livrables dans un bucket privé et téléchargements signés ;
- facture commerciale PDF Studio+ envoyée par e-mail ;
- aucun paiement en ligne, export CSV ou système d’alertes ;
- compléter les mentions légales et les règles de consentement avant la production.

## Règle de livraison par étape

Pour chaque étape :

1. décrire le changement ;
2. l'implémenter dans les fichiers concernés ;
3. lancer typecheck, tests et build ;
4. tester le parcours mobile ;
5. vérifier les erreurs serveur ;
6. créer un commit ciblé ;
7. ne passer à l'étape suivante qu'après validation.

La validation visuelle doit couvrir les pages pilotes, les écrans de chargement,
les erreurs, les états vides, les modales et les écrans mobiles. Une fonctionnalité
est considérée incomplète si son flow est interrompu par une route manquante,
une redirection incorrecte ou un état non traité.

## Commits recommandés

```text
chore: document current booking scope
feat: add supabase prisma foundation
feat: add role based app routing
fix: stabilize booking api contract
fix: improve mobile booking flow
fix: preserve booking state after login
feat: add manager booking review
feat: migrate bookings to persistent database
feat: add manual onsite payments
feat: add lightweight podcast invitations
feat: add essential booking statistics
feat: add booking notifications
feat: add podcast guest invitations
```
