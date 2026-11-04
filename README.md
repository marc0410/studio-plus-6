# Studio+

Application Studio+ construite avec Next.js 16, React 19, TypeScript, Supabase (Auth, PostgreSQL et Storage), Prisma et Resend. Les réservations sont confirmées manuellement et les paiements sont enregistrés par l’équipe ; aucun paiement en ligne n’est activé.

## Développement local

Prérequis : Node.js 22.18 ou supérieur et un projet Supabase **de développement**. Copier `.env.example` vers `.env.local`, puis renseigner les URL et clés de ce projet, ainsi que les secrets Resend et cron lorsque ces fonctions sont utilisées.

```bash
npm ci
cp .env.example .env.local
node --env-file=.env.local ./node_modules/prisma/build/index.js migrate deploy
npm run dev
```

Ouvrir `http://localhost:3000`. `npm run postinstall`/`npm run build` génère le client Prisma. Les migrations de schéma versionnées sont dans `prisma/migrations/` ; ne pas créer un second schéma manuellement dans le SQL Editor. Prisma lit `.env` par défaut, pas `.env.local` : pour les commandes Prisma locales, charger explicitement ce fichier avec `node --env-file=.env.local ...`. Pour appliquer une migration dans un environnement déployé, charger les variables de base et exécuter `npm run db:deploy`.

## Environnements et comptes

Utiliser des projets Supabase indépendants pour dev et production. Les variables Vercel Preview pointent vers dev ; seules les variables Production pointent vers prod. Définir `APP_URL` sur l’origine exacte de chaque environnement et autoriser les URLs de retour correspondantes dans Supabase Auth. Ne jamais utiliser la clé `SUPABASE_SERVICE_ROLE_KEY` dans un composant client ou une variable `NEXT_PUBLIC_*`.

Créer le premier compte administrateur via `/inscription`, confirmer son e-mail, puis promouvoir son profil dans le SQL Editor du **projet ciblé** :

```sql
UPDATE public.profiles
SET role = 'ADMIN'
WHERE email = 'admin@exemple.com';
```

Après connexion, un ADMIN peut inviter le personnel depuis `/gestion/utilisateurs`. Les comptes de test peuvent être créés avec `prisma/seed-demo-users.ts`, mais le script exige explicitement `SEED_ENV=dev` et refuse la production. Ne pas le lancer sur prod.

## Services externes

- **Supabase Auth** : e-mail + mot de passe, confirmation d’adresse et redirections `/auth/callback`. Le hook « Send Email » peut être configuré pour acheminer les e-mails Auth vers Resend ; `SEND_EMAIL_HOOK_SECRET` est le secret serveur correspondant.
- **Resend** : définir `RESEND_API_KEY`, `EMAIL_FROM` et, si souhaité, `STUDIO_BOOKING_EMAIL` pour les notifications à l’équipe.
- **Supabase Storage** : créer un bucket privé `studio-deliverables` (ou reporter le nom choisi dans `SUPABASE_STORAGE_BUCKET`). Les fichiers privés ne sont servis qu’après vérification d’accès.
- **Vercel Cron** : `vercel.json` planifie le keepalive quotidien et l’expiration des demandes. Configurer `CRON_SECRET` dans l’environnement Vercel ; une demande expire après 48 h par défaut. `BOOKING_REQUEST_TTL_HOURS` permet de choisir une durée entre 24 h et 168 h.
- **ImageKit** : variables documentées dans `.env.example` et `docs/Configuration-plateformes-booking.md` ; l’intégration peut rester désactivée tant que les médias ne l’utilisent pas.

Le guide [Configuration-plateformes-booking.md](docs/Configuration-plateformes-booking.md) décrit la configuration Supabase, Resend, Storage, Vercel, les rôles et les vérifications de bout en bout.

## Parcours principaux

- Réservation publique, créneaux et demandes côté client.
- Espaces client, équipe et gestion protégés selon le rôle.
- Réglages administrateur pour tarifs, durées, horaires hebdomadaires et fermetures exceptionnelles.
- Invitation interne, affectations de personnel, gestion des statuts et historique d’e-mails métier.
- Projets, livrables privés, paiements consignés manuellement et facture PDF.

Les limites et fonctions reportées sont suivies dans [Audit-limites-fonctionnelles.md](docs/Audit-limites-fonctionnelles.md) et [Fonctionnalites-prevues-plus-tard.md](docs/Fonctionnalites-prevues-plus-tard.md).

## Commandes

```bash
npm run dev             # serveur local
npm run typecheck       # vérification TypeScript
npm test                # tests automatisés
npm run build           # génération Prisma et build Next.js
npm run start           # serveur de production local
npm run db:deploy       # appliquer les migrations Prisma en environnement cible
```

## Structure

| Chemin | Rôle |
| --- | --- |
| `app/` | Pages App Router et routes API serveur |
| `components/` | Interfaces du site, réservation et espaces authentifiés |
| `lib/` | Règles métier, accès Prisma, Auth, e-mails et autorisations |
| `prisma/schema.prisma` | Modèle PostgreSQL applicatif |
| `prisma/migrations/` | Migrations versionnées |
| `docs/` | Guides de déploiement, d’architecture et limites fonctionnelles |
