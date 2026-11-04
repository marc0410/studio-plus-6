# Configuration des plateformes — réservation Studio+

Guide opérationnel pour l'application actuelle (Next.js App Router, Supabase PostgreSQL/Auth/Storage, Prisma, Resend, ImageKit et Vercel). À effectuer dans cet ordre. Aucun paiement en ligne n'est utilisé : les paiements sont enregistrés manuellement, puis une facture PDF Studio+ peut être envoyée par e-mail.

> État du dépôt : le code compile, mais aucune connexion aux comptes externes n'a été vérifiée ici. Une configuration terminée ne remplace pas les essais de bout en bout décrits à la fin.

## 1. Préparer les environnements

Créer **deux projets Supabase indépendants** : `studio-plus-dev` (développement et Preview) et `studio-plus-prod` (production). Chacun doit avoir sa propre base, ses utilisateurs Auth, son bucket Storage et ses secrets. Ne jamais pointer un environnement Preview ou local vers la base de production.

Pour les liens envoyés par e-mail et la vérification d'origine du navigateur, `APP_URL` doit correspondre exactement à l'origine visitée, sans chemin ni barre finale :

| Environnement | Projet Supabase | `APP_URL` | Clés Resend |
| --- | --- | --- | --- |
| Local | dev | `http://localhost:3000` | développement |
| Preview Vercel | dev | URL Preview stable choisie | développement |
| Production Vercel | prod | `https://www.studioplusci.com` si c'est le domaine final | production |

Les déploiements Preview Vercel ont souvent des URL différentes. Comme cette application vérifie `APP_URL` sur plusieurs mutations, utiliser une **URL de branche stable** pour les essais, avec la même valeur dans Vercel Preview et la liste de redirection Supabase. Une autre URL Preview non configurée peut afficher le site mais refuser la réservation (`Origine non autorisée`). [Environnements Vercel](https://vercel.com/docs/environment-variables), [URL de redirection Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

## 2. Supabase : base PostgreSQL et clés

À répéter sur **dev puis prod**, en copiant les valeurs depuis **Connect** et **Project Settings → API Keys** du projet concerné :

1. Noter le Project URL (`NEXT_PUBLIC_SUPABASE_URL`) et la clé publishable/anon (`NEXT_PUBLIC_SUPABASE_ANON_KEY`). Ce projet utilise précisément ces noms de variables ; ne pas remplacer par un nom différent sans changer le code.
2. Copier la chaîne **Transaction pooler** pour `DATABASE_URL` (généralement port `6543`, avec `?pgbouncer=true`). C'est la connexion applicative côté Vercel.
3. Copier la chaîne **Direct** pour `DIRECT_URL` (port `5432`). C'est la connexion prioritaire de `prisma.config.ts` pour les migrations. Si votre machine ou environnement de migration ne dispose pas d'IPv6, la connexion directe peut échouer ; utiliser alors la chaîne **Session pooler** (port `5432`) comme valeur de `DIRECT_URL`, après vérification dans le tableau **Connect** du projet. Ne pas reconstruire le nom d'hôte à la main.
4. Copier la **service role/secret key** dans `SUPABASE_SERVICE_ROLE_KEY` côté serveur seulement. Elle sert aux URLs signées et à la vérification des livrables ; elle ne doit jamais être préfixée par `NEXT_PUBLIC_` ni placée dans le navigateur.
5. Vérifier que le mot de passe PostgreSQL est correctement encodé dans les URL de connexion si celui-ci contient `@`, `#`, `?`, `&` ou d'autres caractères réservés.

Ces modes de connexion et leur compatibilité IPv4/IPv6 sont décrits dans la [documentation Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres). Les tables applicatives sont créées par les migrations Prisma ; **ne pas créer manuellement un second schéma de réservation** dans le SQL Editor. Les migrations activent RLS sur les tables ; elles ne créent pas de politiques d’accès direct pour le navigateur. Les accès métier passent par les routes serveur et Prisma. La migration corrective `20261104010000_enable_rls_on_phase_tables` active aussi RLS sur les tables de projet et d’invitation créées dans les phases suivantes.

### Supabase Auth

Dans **Authentication → Providers / Sign In**, activer l'authentification **Email + mot de passe** et décider si la confirmation de l'e-mail est obligatoire. Pour un parcours réel, garder la confirmation activée avant d'ouvrir les inscriptions.

Dans **Authentication → URL Configuration** :

- Dev : Site URL `http://localhost:3000` ; ajouter `http://localhost:3000/auth/callback` et l'URL de callback de la Preview stable.
- Prod : Site URL `https://www.studioplusci.com` ; ajouter `https://www.studioplusci.com/auth/callback` (adapter si le domaine final change).
- Les liens d'inscription et de mot de passe oublié reviennent dans le code sur `/auth/callback`; le mot de passe est ensuite saisi sur `/nouveau-mot-de-passe`.
- L’activation des invitations d’équipe utilise un lien Studio+ dédié (`/auth/accept-invite`) contenant le jeton OTP Supabase ; la personne choisit son mot de passe après vérification. Ajouter aussi les origines locales, Preview et Production dans les URLs autorisées si la configuration Supabase les exige.
- Si les modèles d'e-mails Auth ont été personnalisés, vérifier qu'ils conservent la redirection demandée (`{{ .RedirectTo }}` lorsqu'elle est nécessaire), puis tester les deux liens. [Guide Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

### Supabase Storage — fichiers clients privés

Dans **Storage**, créer dans chaque projet un bucket nommé `studio-deliverables`, **privé**. Si un autre nom est choisi, le reporter dans `SUPABASE_STORAGE_BUCKET` pour l'environnement correspondant. Définir une taille maximale d'au moins **25 Mo** (la limite globale Storage doit aussi être ≥ 25 Mo) et, si les restrictions MIME du bucket sont utilisées, autoriser `application/pdf`, `image/jpeg`, `image/png`, `image/webp`. L'application n'accepte pas d'autres types. Ne pas rendre le bucket public et ne pas créer de politique donnant un accès anonyme aux objets. Les téléversements passent par un jeton temporaire, les téléchargements par un lien signé de 60 secondes. [Buckets privés](https://supabase.com/docs/guides/storage/buckets/fundamentals), [limites de taille](https://supabase.com/docs/guides/storage/uploads/file-limits).

Ce bucket est réservé aux éléments confidentiels : livrables de projet, documents de production et fichiers remis à un client. Les URLs des fichiers ne doivent jamais être enregistrées dans le contenu public du site. Le code vérifie le rôle et le projet avant de délivrer un lien signé temporaire.

Ne pas utiliser ce bucket pour les images de la page d'accueil, les photos de galerie ou les vidéos de présentation : ces médias sont publics et doivent être optimisés pour la diffusion.

## 2 bis. ImageKit — optionnel, intégration à brancher

Le code actuel n’utilise pas ImageKit : les médias publics sont servis depuis `public/`. Cette étape est donc facultative et ne bloque ni le lancement ni les parcours Supabase/Resend. Si l’équipe décide de migrer ses médias, ImageKit offre une médiathèque, des transformations et un CDN ; son plan gratuit affiche actuellement 3 Go de stockage DAM et 20 Go de bande passante mensuelle. Vérifier les plafonds avant de choisir ce service. [Plans ImageKit](https://imagekit.io/plans/).

### Créer l'espace ImageKit

1. Créer un compte ImageKit et un **Media Library** séparé pour chaque environnement si possible : `studio-plus-dev` et `studio-plus-prod`.
2. Dans l'espace dev, importer les médias de test uniquement. Dans prod, importer les médias validés et autorisés par Studio+.
3. Créer des dossiers cohérents :

   ```text
   /studio-plus/dev/hero
   /studio-plus/dev/services
   /studio-plus/dev/gallery
   /studio-plus/dev/projects
   /studio-plus/prod/hero
   /studio-plus/prod/services
   /studio-plus/prod/gallery
   /studio-plus/prod/projects
   ```

4. Activer l'optimisation automatique et servir les formats modernes quand ils sont disponibles (`auto`/WebP/AVIF selon la configuration ImageKit). Prévoir des variantes adaptées au mobile et au desktop ; ne pas charger une image originale lourde dans une carte mobile.
5. Ne pas publier une image client ou une vidéo contenant des personnes sans autorisation de diffusion. Le consentement de l'invitation podcast ne remplace pas automatiquement l'autorisation de publication dans une galerie marketing : confirmer les droits avec Studio+.
6. Pour les galeries qui doivent être accessibles seulement à certains clients, ne pas les placer dans ImageKit public : utiliser Supabase privé et des URLs signées.

### Variables ImageKit

Ajouter dans `.env.local` et dans Vercel les variables suivantes uniquement lorsque l'intégration ImageKit sera branchée dans le code :

```env
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/[IMAGEKIT_ID]
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=[IMAGEKIT_PUBLIC_KEY]
IMAGEKIT_PRIVATE_KEY=[IMAGEKIT_PRIVATE_KEY]
IMAGEKIT_UPLOAD_FOLDER=/studio-plus/dev
```

Pour Production, remplacer le dossier par `/studio-plus/prod` et utiliser l'espace/projet ImageKit de production. `IMAGEKIT_PRIVATE_KEY` reste strictement serveur ; elle ne doit jamais être préfixée par `NEXT_PUBLIC_`.

Important : dans l'état actuel du dépôt, les médias du site sont encore servis depuis `public/studio/assets` et les livrables privés utilisent Supabase. La création du compte ImageKit et l'ajout de ces variables ne déplacent pas automatiquement les images existantes. L'intégration ImageKit devra ensuite :

- remplacer les chemins publics des galeries par des URLs ImageKit ou un composant média centralisé ;
- fournir un upload signé côté serveur pour que la clé privée ne quitte jamais le serveur ;
- enregistrer dans la base les métadonnées nécessaires (chemin, titre, alt, type, ordre, visibilité) si les galeries doivent être administrables depuis Studio+ ;
- prévoir les états loading, erreur, image absente et fallback local ;
- conserver Supabase pour les fichiers privés et les liens clients.

Architecture retenue :

| Type de fichier | Plateforme | Accès |
| --- | --- | --- |
| Images/vidéos du site et galeries publiques | ImageKit | public, CDN, optimisé |
| Livrables d'un projet client | Supabase Storage | privé, contrôle de rôle, URL signée |
| Documents internes ou futurs fichiers sensibles | Supabase Storage | privé, jamais indexé publiquement |
| Logo, favicon et petits assets fondamentaux | dépôt `public/` | versionné avec le code |

## 3. Resend et DNS du domaine

1. Dans **Resend → Domains**, ajouter le domaine d'envoi choisi (`studioplusci.com` ou un sous-domaine dédié). Publier **les enregistrements DNS exacts fournis par Resend** chez le gestionnaire DNS du domaine (Vercel DNS, Cloudflare, registrar, etc.) et attendre le statut *Verified*. Ne pas écraser les enregistrements MX existants du domaine si une boîte e-mail fonctionne déjà. [Domaines vérifiés](https://resend.com/docs/dashboard/domains/introduction).
2. Créer une clé API Resend pour dev et une autre pour prod. Renseigner `RESEND_API_KEY` dans les variables serveur de chaque environnement. `EMAIL_FROM` doit utiliser une adresse sur le domaine vérifié, par exemple `Studio+ <notifications@studioplusci.com>` si cette adresse et ce domaine ont été retenus.
3. Renseigner `STUDIO_BOOKING_EMAIL` avec une **vraie boîte consultée par l'équipe** : les nouvelles demandes et les réponses aux invitations y sont envoyées. Cette variable ne crée pas de boîte e-mail.
4. Sur chaque projet Supabase, ouvrir **Authentication → Hooks → Send Email**, choisir un hook **HTTP**, puis renseigner l'URL de l'application correspondante : `https://<domaine-preview-stable>/api/auth/send-email` pour dev et `https://www.studioplusci.com/api/auth/send-email` pour prod (adapter au domaine final). Générer le secret du hook et définir la valeur complète `v1,whsec_...` dans `SEND_EMAIL_HOOK_SECRET` sur le déploiement Vercel correspondant, puis redéployer et activer le hook. La route vérifie la signature Supabase avant de transmettre le message à Resend. Le hook remplace le SMTP Supabase pour les e-mails Auth tant qu'il est activé ; les notifications métier continuent d'utiliser Resend côté serveur. [Hooks d'e-mail Supabase](https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook).
5. Vérifier que **Email** reste activé comme fournisseur dans Supabase Auth, puis tester une inscription et un e-mail de récupération avec de vraies boîtes. Vérifier le statut d'envoi dans Resend ainsi que les journaux Vercel et Supabase. En cas de panne du hook, le désactiver dans Supabase ; l'envoi revient au SMTP personnalisé s'il est configuré, sinon au fournisseur par défaut de Supabase.

Les e-mails métier concernés incluent : demande reçue, confirmation/annulation/replanification, invitations et réponses, facture PDF. En cas d'échec, l'équipe peut consulter `/gestion/emails` et relancer les messages qui disposent d'un contenu réessayable. Les liens d'invitation contenant un jeton ne sont volontairement pas conservés pour une relance automatique.

## 4. Vercel : projet et variables

Importer le dépôt Git dans Vercel avec le framework **Next.js**. Utiliser la version Node compatible avec `package.json` (**Node ≥ 22.18**). Le build du dépôt est `npm run build` ; ne pas ajouter `prisma migrate dev` au build Vercel. Associer le domaine de production retenu au déploiement Production et vérifier ses enregistrements DNS selon l'interface Vercel.

Dans **Project → Settings → Environment Variables**, renseigner les variables ci-dessous séparément pour **Preview** (dev) et **Production** (prod), puis redéployer après toute modification. `NEXT_PUBLIC_*` est intégré au build du client : changer sa valeur sans redéployer ne suffit pas. [Variables Vercel](https://vercel.com/docs/environment-variables).

| Variable | Preview | Production | Exposition |
| --- | --- | --- | --- |
| `APP_URL` | URL Preview stable | domaine final HTTPS | serveur |
| `DATABASE_URL` | pooler dev | pooler prod | secret serveur |
| `DIRECT_URL` | connexion migration dev | connexion migration prod | secret serveur ; non nécessaire à l'exécution des pages, mais utile pour les commandes Prisma |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet dev | URL du projet prod | publique |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé du projet dev | clé du projet prod | publique |
| `SUPABASE_SERVICE_ROLE_KEY` | clé du projet dev | clé du projet prod | **secret serveur** |
| `CRON_SECRET` | secret aléatoire dédié | secret aléatoire dédié | **secret serveur**, protège la tâche quotidienne |
| `BOOKING_REQUEST_TTL_HOURS` | `48` | `48` (ou valeur validée) | serveur ; borné de 24 à 168 h |
| `SUPABASE_STORAGE_BUCKET` | `studio-deliverables` | `studio-deliverables` | serveur |
| `RESEND_API_KEY` | clé dev | clé prod | **secret serveur** |
| `SEND_EMAIL_HOOK_SECRET` | secret du hook dev | secret du hook prod | **secret serveur**, signature des appels Supabase Auth |
| `EMAIL_FROM` | expéditeur vérifié | expéditeur vérifié | serveur |
| `STUDIO_BOOKING_EMAIL` | boîte de test de l'équipe | boîte de l'équipe | serveur |

Ne pas copier les clés prod dans Preview. Vérifier aussi que la branche de production de Vercel est celle voulue, et que les déploiements Preview n'utilisent pas le domaine de production comme `APP_URL`.

### Activité quotidienne Supabase (plan Free)

Le dépôt configure deux tâches Vercel quotidiennes, protégées par le même `CRON_SECRET` : à 09:00 UTC, `/api/cron/supabase-keepalive` fait une lecture légère de `profiles` pour générer une activité Supabase ; à 09:15 UTC, `/api/cron/expire-bookings` annule les demandes échues, libère leurs créneaux et envoie un e-mail au client. Vercel n’exécute les Cron que sur le déploiement Production, pas sur les déploiements Preview ; en dev/Preview, tester l’endpoint manuellement avec le secret dev. [Documentation Vercel Cron](https://vercel.com/docs/cron-jobs/quickstart).

Une demande attend au plus 48 h par défaut. `BOOKING_REQUEST_TTL_HOURS` permet une valeur de 24 à 168 h ; communiquer la durée retenue dans le parcours client si elle est modifiée. Vercel transmet `CRON_SECRET` dans l'en-tête `Authorization`. Supabase Free peut mettre en pause les projets ayant une faible activité sur une période de sept jours ; quelques requêtes quotidiennes suffisent souvent, mais ce n’est pas garanti. Le keepalive réduit ce risque sans pouvoir réveiller un projet déjà en pause. [Règles Supabase de mise en pause](https://supabase.com/docs/guides/platform/free-project-pausing).

## 5. Poste local et migrations Prisma

Créer `.env.local` **uniquement avec les valeurs du projet dev**, à partir de `.env.example`. Ce fichier est ignoré par Git. Ne pas publier de captures contenant les URL PostgreSQL, clés API ou jetons. Next.js lit `.env.local` pour `npm run dev`, mais les commandes Prisma lancées séparément doivent charger ce fichier explicitement : `prisma.config.ts` utilise `dotenv/config`, qui lit `.env` par défaut, pas automatiquement `.env.local`.

```bash
npm ci
node --env-file=.env.local ./node_modules/prisma/build/index.js migrate deploy
node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs prisma/seed.ts
npm run dev
```

Ces commandes initialisent **dev uniquement**. Le seed crée/actualise le catalogue des prestations et les paramètres initiaux, sans créer de comptes ni de réservations.

La migration `20261104000000_team_invites_expiring_bookings` ajoute les invitations internes et l'expiration des demandes, puis donne une échéance de 48 h aux anciennes demandes encore `REQUESTED`. `20261104010000_enable_rls_on_phase_tables` active RLS sur les tables des phases précédentes qui ne l’avaient pas encore, et `20261104020000_link_team_invitations_profiles` ajoute les contraintes de profils aux invitations. Appliquer les migrations d'abord sur dev, tester le parcours, puis les déployer sur prod avec les variables prod chargées explicitement.

Pour vérifier le schéma/code sans accès externe :

```bash
npm test
npm run typecheck
node --env-file=.env.local ./node_modules/prisma/build/index.js validate
npm run build
```

En production : sauvegarder la base si elle contient déjà des données, utiliser les **valeurs prod** dans un environnement de migration contrôlé, puis exécuter **uniquement** `prisma migrate deploy` (jamais `migrate dev` ni le seed de démonstration). Vérifier deux fois le Project Ref et le nom de l'environnement avant cette commande. La base prod ne doit jamais être copiée dans un fichier `.env.local` de développement. Si l'ancienne base SQLite contient des réservations à conserver, prévoir une migration de données séparée : Prisma ne les importe pas automatiquement.

## 6. Premier administrateur et rôles

1. Après les migrations, créer un compte via `/inscription`, puis confirmer l'adresse e-mail. Le profil est créé en rôle `CLIENT` au premier accès.
2. Dans le **SQL Editor du bon projet Supabase**, promouvoir seulement ce compte initial :

   ```sql
   UPDATE public.profiles
   SET role = 'ADMIN'
   WHERE email = 'adresse-admin@exemple.com';
   ```

3. Vérifier que **une ligne** a été modifiée et se reconnecter. Répéter séparément sur dev/prod pour les comptes voulus.
4. Depuis `/gestion/utilisateurs`, l'ADMIN peut attribuer `MANAGER`, `STAFF` ou `CLIENT` et désactiver un compte. L'invité (`GUEST` dans le plan fonctionnel) n'est **pas** un rôle de compte dans le schéma actuel : il répond via `/invite/[token]` sans espace privé.

Pages de contrôle : `CLIENT` → `/espace`, `STAFF` → `/equipe`, `MANAGER` → `/gestion`, `ADMIN` → gestion et utilisateurs. Un accès interdit doit aboutir à `/non-autorise` ou à une réponse 403/404 selon la route.

### Comptes de test et matrice d'accès

Les rôles sont gérés dans `public.profiles` et synchronisés avec l'utilisateur Supabase Auth. Le rôle `GUEST` n'est pas un compte enregistré : un invité utilise uniquement un jeton `/invite/[token]`. Ne pas créer de faux utilisateurs via Prisma : ils doivent exister dans Supabase Auth afin que les sessions et les cookies soient réalistes.

Créer les comptes de test **dans le projet dev uniquement**, avec des adresses contrôlées par l'équipe :

| Compte | Rôle | Parcours à tester |
| --- | --- | --- |
| `test-client-dev@...` | `CLIENT` | inscription, réservation, espace client, replanification, invités, projet et livrables visibles |
| `test-staff-dev@...` | `STAFF` | séances affectées, fiche séance, statuts, tâches et livrables ; aucun pilotage global |
| `test-manager-dev@...` | `MANAGER` | réservations, confirmation, affectation, paiements sur place, factures, statistiques et e-mails |
| `test-admin-dev@...` | `ADMIN` | tous les accès, utilisateurs et modification des rôles |

Après création et confirmation des comptes, attribuer les rôles dans le **SQL Editor du projet dev** :

```sql
UPDATE public.profiles SET role = 'CLIENT'  WHERE email = 'test-client-dev@exemple.com';
UPDATE public.profiles SET role = 'STAFF'   WHERE email = 'test-staff-dev@exemple.com';
UPDATE public.profiles SET role = 'MANAGER' WHERE email = 'test-manager-dev@exemple.com';
UPDATE public.profiles SET role = 'ADMIN'   WHERE email = 'test-admin-dev@exemple.com';
```

Pour automatiser la création de ces comptes sur la base **dev**, le dépôt contient aussi un seed Supabase Auth + Prisma. Il crée les quatre comptes de démonstration, confirme leurs e-mails et attribue leurs rôles. Il faut charger les variables dev et fournir un mot de passe de test de 12 caractères minimum :

```bash
SEED_DEMO_USERS=true SEED_ENV=dev SEED_DEFAULT_PASSWORD='MotDePasseDev-2026!' \
node --env-file=.env.local ./node_modules/tsx/dist/cli.mjs prisma/seed-demo-users.ts
```

Le script utilise `SUPABASE_SERVICE_ROLE_KEY` et doit donc rester une commande serveur locale ou CI privée. Il refuse de démarrer si `SEED_ENV` n'est pas exactement `dev` ou si `SEED_DEMO_USERS` n'est pas explicitement `true`. Il est volontairement interdit de l'ajouter au build Vercel ou de le lancer sur la base prod. Le script est idempotent : il réutilise les comptes existants et remet leurs profils aux rôles prévus.

Pour la **production**, créer seulement :

- un vrai compte administrateur Studio+ ;
- si nécessaire, un vrai compte manager et un vrai compte staff ;
- un compte client de validation identifiable, sans données de démonstration persistantes.

Ne pas créer les comptes `test-...-dev` dans la base production et ne pas lancer de seed de faux utilisateurs sur Vercel. Après chaque promotion de rôle, se déconnecter/reconnecter afin de tester une nouvelle session.

Matrice minimale à exécuter sur chaque environnement :

| Test | CLIENT | STAFF | MANAGER | ADMIN |
| --- | --- | --- | --- | --- |
| `/reserver` et création d'une demande | Oui | Non | Non | Non |
| `/espace` et projet du propriétaire | Oui | Non | Non | Non |
| `/equipe` et séances affectées | Non | Oui | Oui | Oui |
| `/gestion` et réservations globales | Non | Non | Oui | Oui |
| `/gestion/statistiques` | Non | Non | Oui | Oui |
| `/gestion/utilisateurs` | Non | Non | Non | Oui |
| `/invite/[token]` avec un jeton valide | Sans compte | Sans compte | Sans compte | Sans compte |

Pour chaque case interdite, vérifier à la fois la redirection de page et la réponse API (`401`, `403` ou `404` selon le cas). Pour le STAFF, vérifier surtout qu'une séance non affectée et le menu Gestion restent inaccessibles. Pour le CLIENT, vérifier qu'un autre client ne peut pas lire une réservation, un projet ou un livrable par changement manuel d'ID.

## 7. Vérification finale avant ouverture publique

- [ ] Les variables Preview pointent vers **dev** et Production vers **prod** ; les domaines et `APP_URL` correspondent.
- [ ] Les comptes de test dev existent pour CLIENT, STAFF, MANAGER et ADMIN ; la matrice d'accès a été exécutée sans utiliser de faux comptes en production.
- [ ] Les migrations sont appliquées sur dev, puis sur prod seulement après validation ; aucune erreur dans les logs Vercel.
- [ ] Inscription, confirmation e-mail, connexion, déconnexion et mot de passe oublié fonctionnent.
- [ ] Un client réserve ; le studio voit la demande, confirme le montant et le client reçoit l'e-mail.
- [ ] Deux demandes concurrentes pour le même créneau ne sont pas toutes deux acceptées.
- [ ] Replanification, annulation, affectation STAFF et visibilité par rôle fonctionnent.
- [ ] Une invitation est reçue, acceptée/refusée et visible dans l'espace client.
- [ ] Un membre de l'équipe téléverse un PDF ou une image (tester aussi un fichier > 4,5 Mo et ≤ 25 Mo) ; le client autorisé le télécharge ; un autre client ne le peut pas.
- [ ] Un paiement sur place est saisi, la facture PDF est reçue et les montants sont corrects.
- [ ] Les écrans d'erreur et de chargement sont lisibles sur mobile ; une Preview non autorisée ne reçoit pas les secrets prod.

**Limites connues :** aucun paiement en ligne ; les factures sont des documents Studio+ simples, non présentés comme certifiés FNE, et les mentions fiscales/officielles de l'entreprise restent à confirmer avant un usage comptable formel. Le texte de consentement image/voix des invitations doit être validé par Studio+ avant usage public. Les tests automatiques actuels couvrent surtout les règles de réservation ; les parcours Supabase, Storage et Resend exigent les essais réels ci-dessus.
