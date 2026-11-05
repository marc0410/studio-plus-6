# Studio+ : sous-domaines, incohérences, solutions et démarche

> **Statut : proposition de configuration validée pour revue, pas encore implémentée.** La lecture du dépôt montre que les exemples de code ci-dessous sont des pistes et non du code prêt à copier. La décision exécutable retenue pour le premier déploiement est consignée dans `docs/Architecture-sous-domaines-Studio-Plus.md`.

**Stack :** un seul projet Next.js (App Router) · un dépôt · déploiement Vercel · Supabase (Auth, PostgreSQL, Storage) · Prisma
**Cible :** `www`, `app`, `team`, `admin` sur `studioplusci.com`
**Date :** 5 novembre 2026

Ce document recense :
1. les décisions à trancher avant de coder ;
2. les incohérences du document d’architecture d’origine ;
3. les erreurs ou oublis de ma proposition précédente (code compris) ;
4. les risques complémentaires ;
5. la démarche à suivre, la configuration cible, le code corrigé et la matrice de tests.

Niveaux de gravité : **Bloquant** (ne fonctionnera pas ou crée une faille), **Important** (comportement incorrect ou risque réel), **Mineur** (clarté, confort).

---

## 1. Synthèse

| # | Problème | Gravité | Solution courte |
| --- | --- | --- | --- |
| I-01 | Sessions séparées recommandées, mais connexion décrite seulement sur `app` | Bloquant | Exposer la connexion sur chaque espace (ou choisir le SSO) |
| I-02 | Redirection post-connexion vers l’espace du rôle : la session n’existe pas sur l’autre hôte | Bloquant | Une connexion par hôte + contrôle du rôle autorisé sur cet hôte |
| I-03 | `/reserver` sur `www` « pour un compte connecté », mais la session client vit sur `app` | Bloquant | Une seule adresse canonique pour `/reserver` |
| I-04 | « L’API peut être appelée depuis les différents sous-domaines » | Important | Appels same-origin uniquement, pas de CORS |
| I-05 | `/auth/accept-invite` routé sur `team` seulement, mais invitations admin/manager « `admin` ou `team` » | Important | Décider l’hôte par rôle et router la page sur cet hôte |
| I-06 | Hôtes dev/staging mentionnés mais jamais définis | Important | Définir les noms et variables par environnement |
| I-07 | « Redirection vers l’hôte canonique **ou** 404 » | Mineur | Choisir une règle unique |
| I-08 | Critères de validation à adapter (tests par hôte) | Mineur | Voir matrice, section 9 |
| I-09 | « pas par Dynamic DNS » : formulation confuse | Mineur | Simples enregistrements DNS vers Vercel |
| C-01 | Mon `resolve()` laisse passer sur `www` toutes les pages existantes (`/connexion`, `/auth/callback`, …) | Bloquant | Liste blanche stricte sur `www` |
| C-02 | Mon `AUTH` autorise `/auth/*` entier sur tous les hôtes | Important | Liste de chemins par hôte |
| C-03 | `carryCookies` : en-têtes de cache non copiés, cookies rafraîchis non transmis au rendu en cas de rewrite | Important | Copier les en-têtes, passer `{ request }` au rewrite |
| C-04 | Hôte inconnu → 404 avant tout : peut casser webhooks, crons, previews | Important | Lister ce qui appelle l’API et sur quel hôte |
| C-05 | Validation d’origine : liste seule, sans lien avec l’hôte de la requête | Important | Origine autorisée **et** égale à l’hôte courant |
| C-06 | Liste Supabase incomplète, flux PKCE lié à l’hôte d’origine | Important | Callback sur l’hôte qui a initié le flux |
| C-07 | Anciens liens (e-mails déjà envoyés, favoris) cassés après bascule | Important | Redirections temporaires depuis `www` |
| R-01 | Contrôles de rôle uniquement dans les layouts | Important | Contrôler aussi dans chaque page, route API et couche d’accès aux données |

---

## 2. Décisions à trancher avant de coder

### D1. Sessions séparées ou SSO
- **Recommandé : sessions séparées** (cookies propres à chaque hôte). Plus simple à sécuriser.
- Conséquence directe : **chaque espace a sa propre page de connexion** (voir I-01).
- SSO (`domain: .studioplusci.com`) : à ne choisir que si l’expérience produit l’exige vraiment. Il faut alors auditer `Secure`, `HttpOnly`, `SameSite`, le renouvellement et le risque de partage entre sous-domaines (un sous-domaine compromis lit le cookie).

### D2. Où vit `/reserver`
- **Recommandé :** adresse canonique unique sur `app`. Sur `www`, les boutons « Réserver » pointent vers `https://app.studioplusci.com/reserver` et `www/reserver` redirige vers `app`.
- Alternative : `www/reserver` reste un formulaire public sans compte (capture de demande), et la création de réservation liée à un compte se fait sur `app`. Dans ce cas, ce sont deux pages différentes avec deux noms différents.

### D3. Page de connexion et « hub » public
- Chaque espace garde sa connexion : `app/connexion`, `team/connexion`, `admin/connexion`.
- Option : créer sur `www` une page `/acces` qui propose trois liens (client, équipe, administration). C’est ce que le document d’origine appelle « page publique de connexion ». Ne pas réutiliser `/connexion` sur `www` pour éviter la confusion avec la vraie connexion.

### D4. Noms des hôtes dev/staging
Proposition (un seul niveau, simple pour les certificats et le DNS) :
`dev-www`, `dev-app`, `dev-team`, `dev-admin` + `.studioplusci.com`, rattachés à la branche `staging` (Preview) et connectés à Supabase **dev**.
Local : `www.localhost:3000`, `app.localhost:3000`, etc.

### D5. Hôte des invitations d’équipe
- Recommandé : l’hôte dépend du rôle invité. `STAFF` → `team`, `MANAGER`/`ADMIN` → `admin`.
- Il faut alors router `/auth/accept-invite` sur `team` **et** `admin`, et l’ajouter aux URL autorisées Supabase des deux.

### D6. Mauvais hôte
- **Recommandé :** chemins internes (`/espace`, `/equipe`, `/gestion`) demandés directement → redirection vers l’hôte canonique (307 pendant les tests, 308 ensuite). Tout le reste non prévu → 404.

### D7. Rôle non autorisé sur l’hôte où il s’est connecté
Exemple : un `CLIENT` se connecte sur `team`. Comme les sessions sont séparées, on ne peut pas simplement le rediriger vers `app` (il n’y serait pas connecté).
- **Recommandé :** déconnexion immédiate sur cet hôte + message « Ce compte n’a pas accès à cet espace. Utilisez app.studioplusci.com », avec lien.

---

## 3. Incohérences du document d’architecture d’origine

### I-01. Sessions séparées vs connexion uniquement sur `app` — Bloquant
**Constat.** Le document recommande des sessions propres à chaque sous-domaine, mais le tableau ne route `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/nouveau-mot-de-passe` et `/auth/callback` que sur `app`. Un `STAFF` qui se connecte sur `app` aura un cookie valable sur `app` seulement, et arrivera déconnecté sur `team`.
**Solution.** Router `/connexion`, `/mot-de-passe-oublie`, `/nouveau-mot-de-passe` et `/auth/callback` sur `app`, `team` et `admin`. `/inscription` reste sur `app` uniquement (les comptes équipe se créent par invitation).

### I-02. Redirection post-connexion par rôle — Bloquant
**Constat.** « Après authentification chaque rôle doit être envoyé vers son espace » suppose une session commune. Avec des sessions séparées, rediriger un `STAFF` connecté sur `app` vers `team` l’envoie sur une page protégée sans session.
**Solution.** Après connexion, comparer le rôle à la liste des rôles autorisés sur l’hôte courant (voir code section 8). Autorisé → page d’accueil de l’hôte. Non autorisé → déconnexion + message (D7).

### I-03. `/reserver` en double — Bloquant
**Constat.** `www/reserver` est décrit comme « création d’une réservation par un compte client connecté », alors que la session client est sur `app`. Un client connecté sur `app` sera anonyme sur `www`. De plus, la même page sur deux hôtes crée du contenu dupliqué (SEO) et deux règles d’accès à maintenir.
**Solution.** Voir D2. Une adresse canonique, l’autre redirige.

### I-04. API appelée depuis plusieurs sous-domaines — Important
**Constat.** Le document dit que `/api/*` « peut être appelée depuis les différents sous-domaines si les cookies et contrôles d’origine sont configurés ». Avec des cookies propres à chaque hôte, un appel de `www` vers `app/api` n’emporte aucune session, et exigerait en plus du CORS avec `credentials`.
**Solution.** Chaque espace appelle `/api/...` en **chemin relatif sur son propre hôte** (same-origin). Pas de CORS. La validation d’origine exige que l’`Origin` soit celui de l’hôte courant (voir C-05).

### I-05. Invitations équipe et hôte d’acceptation — Important
**Constat.** Le texte dit « invitations d’administrateurs/managers → `admin` ou `team` selon le rôle », mais le tableau ne route `/auth/accept-invite` que sur `team`.
**Solution.** Voir D5. Mettre le tableau de routage et la liste Supabase en cohérence.

### I-06. Hôtes dev/staging non définis — Important
**Constat.** Le document parle de domaines dev/staging sur Preview, mais la table de routage ne contient que les hôtes de production. Le proxy a besoin d’une table d’hôtes par environnement.
**Solution.** Voir D4 et la configuration section 7.

### I-07. « Redirection ou 404 » — Mineur
Le document laisse le choix. Trancher (D6) pour que les tests soient déterministes.

### I-08. Critères de validation — Mineur
« Un `CLIENT` ne peut pas ouvrir `/equipe` ou `/gestion` » : avec les redirections, il faut tester **sur chaque hôte**, avec chemin interne et chemin visible, connecté et non connecté. Voir matrice section 9.

### I-09. « Dynamic DNS » — Mineur
Cette mention est confuse : il n’y a aucun DNS dynamique. Ce sont de simples enregistrements (CNAME ou A) donnés par Vercel pour chaque sous-domaine ; Next.js fait le routage HTTP.

---

## 4. Corrections à ma proposition précédente

### C-01. Fuite des pages sur `www` — Bloquant
**Problème.** Dans `resolve()`, pour `www`, tout chemin non listé renvoyait `pass`. Or `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/auth/callback`, etc. existent dans le projet : ils auraient été servis sur `www`.
**Solution.** `www` doit avoir une **liste blanche stricte** ; tout le reste est 404 (ou redirection temporaire, voir C-07). Code corrigé en section 8.

### C-02. Chemins d’authentification trop larges — Important
**Problème.** `AUTH` contenait `/auth` : `/auth/accept-invite` devenait accessible sur `app`, et `/auth/callback` sur tous les hôtes sans distinction.
**Solution.** Chemins exacts par hôte (voir `PUBLIC` dans le code corrigé).

### C-03. Cookies Supabase et rewrite — Important
**Problème 1.** `carryCookies` copie les cookies mais pas les en-têtes (par exemple `Cache-Control`) que certaines versions de `@supabase/ssr` ajoutent pour éviter qu’un CDN mette en cache une réponse portant des cookies d’authentification.
**Problème 2.** Quand le proxy rafraîchit le jeton puis fait un **rewrite**, les composants serveur peuvent encore lire l’ancien cookie de la requête entrante, ce qui crée des déconnexions aléatoires quand le jeton de rafraîchissement tourne.
**Solution.** Copier aussi les en-têtes pertinents, et passer `{ request }` au rewrite pour transmettre les cookies mis à jour. À valider avec ta version de `@supabase/ssr` (voir section 10).

### C-04. Hôte inconnu → 404 systématique — Important
**Problème.** Mon proxy renvoie 404 pour tout hôte non listé, **avant** le traitement de `/api`. Cela peut casser :
- les webhooks entrants (e-mail, paiement, Supabase) s’ils sont configurés sur une URL `*.vercel.app` ;
- des tâches planifiées Vercel ;
- les URL de déploiement Preview individuelles.
**Solution.** Inventorier tout ce qui appelle `/api` depuis l’extérieur et fixer pour chacun un hôte canonique (par exemple `www` ou `app`). Ne pas ouvrir de joker : ajouter les hôtes précis. Vérifier dans la documentation Vercel sur quelle URL les crons sont appelés (section 10).

### C-05. Validation d’origine incomplète — Important
**Problème.** Une simple liste d’origines autorisées accepterait `Origin: https://team...` sur une requête arrivée sur `app`.
**Solution.** Exiger que l’origine soit dans la liste **et** que son hôte égale l’hôte de la requête (same-origin). Pour une mutation sans `Origin`, refuser.

### C-06. Supabase : redirections et PKCE — Important
**Problème.** Le flux PKCE stocke un « code verifier » dans un cookie de l’hôte qui a lancé la demande. Si l’e-mail ramène sur un autre hôte, l’échange du code échoue.
**Solution.**
- Le `redirectTo` doit toujours pointer vers l’hôte qui a initié le flux (inscription client → `app`, réinitialisation lancée sur `team` → `team`).
- Ajouter à Supabase les URL exactes pour chaque hôte : `/auth/callback` sur `app`, `team`, `admin` ; `/auth/accept-invite` sur `team` et `admin` (selon D5). Dev et prod séparément, **y compris** les URL locales (`http://app.localhost:3000/auth/callback`) côté dev.
- Les e-mails envoyés directement par Supabase (confirmation, reset) utilisent le `redirectTo` fourni et, à défaut, le **Site URL**. Toujours passer `redirectTo` explicitement.

### C-07. Anciens liens — Important
**Problème.** Des e-mails de confirmation ou d’invitation déjà envoyés, des favoris et des liens partagés pointent vers l’ancien hôte (`/espace`, `/connexion`, `/auth/callback`…). Avec la liste blanche stricte de `www`, ils tomberaient en 404.
**Solution.** Pendant une période de transition (par exemple 60 jours), sur `www` : `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/nouveau-mot-de-passe`, `/auth/callback`, `/reserver` → redirection vers `app` ; `/auth/accept-invite` → `team` (ou `admin`). Les chemins `/espace`, `/equipe`, `/gestion` sont déjà couverts par la règle « chemin interne → hôte canonique ». Les sessions existantes seront perdues : prévenir les utilisateurs.

---

## 5. Risques complémentaires

### R-01. Contrôles de rôle dans les layouts seulement — Important
Next.js ne ré-exécute pas forcément un layout à chaque navigation côté client (rendu partiel). Un contrôle placé uniquement dans `layout.tsx` n’est pas une garantie.
**Action.** Vérifier session + rôle + propriété :
- dans chaque page sensible ;
- dans chaque route API et Server Action ;
- idéalement dans une couche d’accès aux données unique (`getCurrentUser()`, `requireRole(...)`, `requireOwnership(...)`).
Les pages `/utilisateurs` et `/reglages` doivent vérifier `ADMIN` **elles-mêmes**, puisque le layout `gestion` laisse entrer `MANAGER`.

### R-02. Prisma contourne la RLS Supabase
Prisma se connecte avec un rôle qui ne passe pas par la RLS. L’autorisation côté application est donc la seule barrière pour les requêtes Prisma. Activer tout de même la RLS sur les tables accessibles via PostgREST ou le client Supabase, et servir les fichiers privés par URL signée de courte durée.

### R-03. Server Actions
Si le projet utilise des Server Actions, Next.js compare lui-même `Origin` et `Host`. Cela fonctionne avec les rewrites (l’hôte reste celui du navigateur) ; à tester sur Preview. Ne pas ajouter de joker dans `serverActions.allowedOrigins`.

### R-04. SEO, robots et URL canoniques
- Seul `www` doit être indexé. `app`, `team`, `admin` : `noindex` (en-tête `X-Robots-Tag: noindex, nofollow` posé par le proxy ou `next.config`) et `robots.txt` avec `Disallow: /` selon l’hôte.
- `metadataBase`, `sitemap`, `og:url` : dériver de l’hôte, pas d’`APP_URL`.
- Attention : le matcher exclut les fichiers `.txt`/`.xml`. Si `robots.txt` est généré par `app/robots.ts`, il n’est pas vu par le proxy ; lire l’hôte dans `robots.ts` (via `headers()`).

### R-05. Jetons d’invitation
En plus de la normalisation Analytics déjà prévue : `Referrer-Policy: no-referrer` et `noindex` sur `/invite/:token` et `/auth/accept-invite`, pour éviter la fuite du jeton par l’en-tête `Referer`.

### R-06. Analytics et chemins visibles
Avec les rewrites, le chemin vu dans le navigateur (`/projets/123`) diffère du chemin interne (`/espace/projets/123`). Vérifier ce que Vercel Analytics enregistre et s’assurer que ni jeton ni identifiant de projet ou de réservation ne sort dans les URL ou événements.

### R-07. Liens internes et navigation entre hôtes
- `<Link href="/parametres">` à l’intérieur d’un espace, `href` absolu (`spaceUrl(...)`) pour changer d’espace.
- Les anciens liens (`/espace/parametres`) continuent de fonctionner via la redirection, mais déclenchent un aller-retour supplémentaire : à nettoyer.
- `router.push()` vers une URL absolue d’un autre hôte provoque une navigation complète ; c’est le comportement attendu.

### R-08. Cache et CDN
Ne jamais mettre en cache public une réponse qui dépend de la session. Vérifier qu’aucune page des espaces privés n’est rendue statiquement avec des données utilisateur.

### R-09. Apex et certificats
Rediriger `studioplusci.com` vers `www` depuis la configuration des domaines Vercel. Un certificat par sous-domaine suffit ; pas besoin de joker.

---

## 6. Démarche à suivre

### Phase 0 : décisions (0,5 jour)
- [ ] Trancher D1 à D7.
- [ ] Mettre à jour le document d’architecture (tableau de routage corrigé).
- [ ] Inventorier ce qui appelle `/api` de l’extérieur (webhooks, crons) et leur hôte.

### Phase 1 : socle de configuration (0,5 jour)
- [ ] Créer `lib/hosts.ts` (table d’hôtes par environnement, `spaceFromHost`, `spaceUrl`, `allowedOrigins`).
- [ ] Définir les variables `NEXT_PUBLIC_HOST_*` en local, Preview et Production.
- [ ] Remplacer progressivement `APP_URL` par `spaceUrl(...)` (e-mails, callbacks, `ROLE_HOME`, sitemap, métadonnées).

### Phase 2 : routage (1 jour)
- [ ] Créer `lib/routing.ts` (fonction pure) **et ses tests Vitest d’abord**.
- [ ] Brancher `proxy.ts` : hôte → réécriture, cookies et en-têtes Supabase conservés, `/api` jamais réécrit.
- [ ] Tester en local sur `app.localhost:3000`, `team.localhost:3000`, etc.

### Phase 3 : authentification (1 à 2 jours)
- [ ] Exposer connexion, mot de passe oublié, nouveau mot de passe et callback sur `app`, `team`, `admin`.
- [ ] Contrôle « rôle autorisé sur cet hôte » après connexion (D7).
- [ ] `safeNext()` partout où un paramètre `next` est lu.
- [ ] `redirectTo` explicite sur chaque appel Supabase Auth.
- [ ] Page `/acces` sur `www` si D3 retenu.

### Phase 4 : sécurité API (1 jour)
- [ ] `isAllowedOrigin(req)` centralisé, appliqué à toutes les mutations.
- [ ] Contrôles de rôle et de propriété dans chaque route API, page sensible et Server Action (R-01).
- [ ] Pages `ADMIN` seulement : vérification explicite.

### Phase 5 : e-mails, liens, SEO (1 jour)
- [ ] Liens d’e-mails par parcours : confirmation et reset → hôte initiateur ; invitation équipe → `team` ou `admin` (D5) ; invité de séance → `www`.
- [ ] `Referrer-Policy` et `noindex` sur les pages à jeton.
- [ ] `noindex` + `robots` sur `app`, `team`, `admin`.
- [ ] Mettre à jour les `<Link>` internes.

### Phase 6 : Preview (1 jour)
- [ ] Supabase **dev** : Site URL et Redirect URLs exacts (hôtes dev et locaux).
- [ ] Vercel : domaines dev/staging rattachés à la branche, variables Preview vers Supabase dev uniquement.
- [ ] Déroulement complet de la matrice de tests (section 9).
- [ ] Redirections en **307** pendant cette phase.

### Phase 7 : production
- [ ] Domaines Production dans Vercel, enregistrements DNS exactement comme affichés.
- [ ] Variables Production vers Supabase **prod** uniquement ; URL Supabase prod.
- [ ] Redirections temporaires de compatibilité (C-07) actives.
- [ ] Mise en production hors heures de pointe ; vérification manuelle des quatre hôtes.
- [ ] Après stabilisation : passer les redirections de chemins internes en 308 et retirer les redirections de compatibilité à l’échéance prévue.

### Retour arrière
Garder la possibilité de désactiver le routage par hôte (variable d’environnement qui court-circuite la logique d’hôte dans le proxy) et conserver l’ancien hôte opérationnel pendant la transition.

---

## 7. Configuration cible

### Variables d’environnement
```bash
# Production
NEXT_PUBLIC_HOST_WWW=www.studioplusci.com
NEXT_PUBLIC_HOST_APP=app.studioplusci.com
NEXT_PUBLIC_HOST_TEAM=team.studioplusci.com
NEXT_PUBLIC_HOST_ADMIN=admin.studioplusci.com

# Preview / staging (exemple, à adapter à D4)
NEXT_PUBLIC_HOST_WWW=dev-www.studioplusci.com
NEXT_PUBLIC_HOST_APP=dev-app.studioplusci.com
NEXT_PUBLIC_HOST_TEAM=dev-team.studioplusci.com
NEXT_PUBLIC_HOST_ADMIN=dev-admin.studioplusci.com

# Local (.env.local)
NEXT_PUBLIC_HOST_WWW=www.localhost:3000
NEXT_PUBLIC_HOST_APP=app.localhost:3000
NEXT_PUBLIC_HOST_TEAM=team.localhost:3000
NEXT_PUBLIC_HOST_ADMIN=admin.localhost:3000
```
Les variables Supabase (URL, clés) et `DATABASE_URL` : Preview et local → dev ; Production → prod. Ne jamais les croiser.

### Supabase Auth → URL Configuration (chaque projet séparément)
**Production**
- Site URL : `https://app.studioplusci.com`
- Redirect URLs :
  - `https://app.studioplusci.com/auth/callback`
  - `https://team.studioplusci.com/auth/callback`
  - `https://team.studioplusci.com/auth/accept-invite`
  - `https://admin.studioplusci.com/auth/callback`
  - `https://admin.studioplusci.com/auth/accept-invite` (si D5)

**Dev** : mêmes chemins sur les hôtes `dev-*` et sur `*.localhost:3000`. Pas de `*` large.

### Vercel
1. Settings → Domains : ajouter les quatre hôtes de production (environnement Production) et les quatre hôtes dev (Preview, rattachés à la branche `staging`).
2. Chez le registrar : créer les enregistrements **exactement** comme affichés par Vercel.
3. Configurer la redirection `studioplusci.com` → `www.studioplusci.com`.
4. Variables par environnement (Production / Preview).

---

## 8. Code corrigé

### `lib/hosts.ts`
```ts
export type Space = 'www' | 'app' | 'team' | 'admin';
export type Role = 'CLIENT' | 'STAFF' | 'MANAGER' | 'ADMIN';

export const HOSTS: Record<Space, string> = {
  www: process.env.NEXT_PUBLIC_HOST_WWW!,
  app: process.env.NEXT_PUBLIC_HOST_APP!,
  team: process.env.NEXT_PUBLIC_HOST_TEAM!,
  admin: process.env.NEXT_PUBLIC_HOST_ADMIN!,
};

export function spaceFromHost(host: string | null): Space | null {
  const h = host?.toLowerCase();
  return (Object.keys(HOSTS) as Space[]).find((s) => HOSTS[s] === h) ?? null;
}

export function spaceUrl(space: Space, path = '/') {
  const proto = HOSTS[space].includes('localhost') ? 'http' : 'https';
  return `${proto}://${HOSTS[space]}${path}`;
}

export const allowedOrigins = () =>
  (Object.keys(HOSTS) as Space[]).map((s) => spaceUrl(s, ''));

// Rôles autorisés à utiliser chaque espace
export const ROLES_BY_SPACE: Record<Space, Role[]> = {
  www: [],
  app: ['CLIENT'],
  team: ['STAFF', 'MANAGER', 'ADMIN'],
  admin: ['MANAGER', 'ADMIN'],
};

// Espace d'accueil par rôle (remplace ROLE_HOME)
export const HOME_SPACE: Record<Role, Space> = {
  CLIENT: 'app',
  STAFF: 'team',
  MANAGER: 'admin',
  ADMIN: 'admin',
};
```

### `lib/routing.ts` (corrigé : C-01, C-02, C-07)
```ts
import type { Space } from './hosts';

export type Result =
  | { type: 'pass' }
  | { type: 'rewrite'; path: string }
  | { type: 'redirect'; space: Space; path: string }
  | { type: 'notfound' };

const INTERNAL = { app: '/espace', team: '/equipe', admin: '/gestion' } as const;

const LOGIN = ['/connexion', '/mot-de-passe-oublie', '/nouveau-mot-de-passe'];

// Chemins servis tels quels, par hôte (liste blanche stricte)
const PUBLIC: Record<Space, string[]> = {
  www: ['/', '/studio', '/tarifs', '/projets', '/invite', '/acces'],
  app: [...LOGIN, '/inscription', '/auth/callback', '/reserver'],
  team: [...LOGIN, '/auth/callback', '/auth/accept-invite'],
  admin: [...LOGIN, '/auth/callback', '/auth/accept-invite'],
};

// Redirections temporaires depuis www pour les anciens liens (C-07)
const LEGACY_FROM_WWW: { path: string; space: Space }[] = [
  { path: '/connexion', space: 'app' },
  { path: '/inscription', space: 'app' },
  { path: '/mot-de-passe-oublie', space: 'app' },
  { path: '/nouveau-mot-de-passe', space: 'app' },
  { path: '/auth/callback', space: 'app' },
  { path: '/reserver', space: 'app' },
  { path: '/auth/accept-invite', space: 'team' },
];

const match = (p: string, pathname: string) =>
  p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/');

export function resolve(space: Space, pathname: string): Result {
  // 1. Chemin interne demandé directement : hôte canonique
  for (const s of ['app', 'team', 'admin'] as const) {
    const prefix = INTERNAL[s];
    if (match(prefix, pathname)) {
      return { type: 'redirect', space: s, path: pathname.slice(prefix.length) || '/' };
    }
  }

  // 2. Chemin public de l'hôte
  if (PUBLIC[space].some((p) => match(p, pathname))) return { type: 'pass' };

  // 3. www : anciens liens, sinon 404 (jamais de passage implicite)
  if (space === 'www') {
    const legacy = LEGACY_FROM_WWW.find((l) => match(l.path, pathname));
    if (legacy) return { type: 'redirect', space: legacy.space, path: pathname };
    return { type: 'notfound' };
  }

  // 4. app / team / admin : réécriture vers l'espace interne
  return { type: 'rewrite', path: INTERNAL[space] + (pathname === '/' ? '' : pathname) };
}
```

### `proxy.ts` (corrigé : C-03, C-04)
```ts
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy'; // code existant
import { spaceFromHost, spaceUrl } from '@/lib/hosts';
import { resolve } from '@/lib/routing';

const FORWARDED_HEADERS = ['cache-control', 'expires', 'pragma'];

function withSession(session: NextResponse, res: NextResponse) {
  session.cookies.getAll().forEach((c) => res.cookies.set(c));
  FORWARDED_HEADERS.forEach((h) => {
    const v = session.headers.get(h);
    if (v) res.headers.set(h, v);
  });
  return res;
}

export async function proxy(request: NextRequest) {
  const space = spaceFromHost(request.headers.get('host'));
  if (!space) return new NextResponse('Not found', { status: 404 });

  const { pathname, search } = request.nextUrl;
  const session = await updateSession(request);

  // API : jamais réécrites, autorisations dans les routes elles-mêmes
  if (pathname.startsWith('/api')) return session;

  const r = resolve(space, pathname);

  if (r.type === 'pass') return session;

  if (r.type === 'redirect') {
    // 307 pendant les tests ; passer à 308 après validation
    const res = NextResponse.redirect(spaceUrl(r.space, r.path + search), 307);
    return withSession(session, res);
  }

  const url = request.nextUrl.clone();
  url.pathname = r.type === 'notfound' ? '/introuvable-404' : r.path; // chemin inexistant => 404 Next
  // { request } : transmet au rendu les cookies rafraîchis par updateSession
  return withSession(session, NextResponse.rewrite(url, { request }));
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)'],
};
```

### Validation d’origine same-origin (C-05)
```ts
// lib/security.ts
import { allowedOrigins } from './hosts';

export function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false; // mutation sans Origin : refusée
  if (!allowedOrigins().includes(origin)) return false;
  return new URL(origin).host === req.headers.get('host'); // same-origin uniquement
}

// Paramètre "next" : chemin relatif uniquement, jamais de redirection ouverte
export function safeNext(next: string | null, fallback = '/'): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback;
  if (/[\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
```

### Contrôle du rôle après connexion (I-02, D7)
```ts
// Dans le callback/serveur de connexion, avec l'espace courant déduit de l'hôte
import { ROLES_BY_SPACE, spaceFromHost, spaceUrl, HOME_SPACE, type Role } from '@/lib/hosts';

export async function afterLogin(host: string | null, role: Role, supabase: SupabaseClient) {
  const space = spaceFromHost(host);
  if (space && ROLES_BY_SPACE[space].includes(role)) {
    return { ok: true as const, redirect: '/' }; // accueil de l'hôte courant
  }
  await supabase.auth.signOut(); // session séparée : on ne peut pas "transférer"
  return {
    ok: false as const,
    message: 'Ce compte n’a pas accès à cet espace.',
    correctUrl: spaceUrl(HOME_SPACE[role], '/connexion'),
  };
}
```

### Contrôle de rôle dans chaque page et route (R-01)
```ts
// lib/auth/guards.ts : à appeler dans pages, routes API et Server Actions
export async function requireRole(allowed: Role[]) {
  const user = await getCurrentUser();          // session Supabase + rôle en base
  if (!user) redirect('/connexion');
  if (!allowed.includes(user.role)) notFound(); // ou 403 pour les API
  return user;
}
// Pages /utilisateurs et /reglages : await requireRole(['ADMIN']);
```

---

## 9. Matrice de tests

### Routage
| Hôte | Requête | Résultat attendu |
| --- | --- | --- |
| `www` | `/`, `/studio`, `/tarifs`, `/projets` | Page publique |
| `www` | `/connexion` | Redirection vers `app` (transition) puis 404 |
| `www` | `/espace/parametres` | Redirection vers `app/parametres` |
| `www` | `/equipe`, `/gestion` | Redirection vers `team/` et `admin/` |
| `www` | `/page-inexistante` | 404 |
| `app` | `/` | Espace client (URL reste `/`) |
| `app` | `/equipe/seances` | Redirection vers `team/seances` |
| `app` | `/inscription` | Page d’inscription |
| `team` | `/inscription` | 404 |
| `team` | `/auth/accept-invite` | Page d’activation |
| `admin` | `/utilisateurs` | Page, accessible `ADMIN` seulement |
| inconnu / `*.vercel.app` non déclaré | n’importe quoi | 404 |

### Accès (par hôte, connecté et non connecté, chemin visible et interne)
- `CLIENT` : refus sur `team` et `admin` ; ne voit que ses propres réservations et projets (changer l’ID dans l’URL et dans l’API).
- `STAFF` : seulement les séances affectées ; refus sur `admin`.
- `MANAGER` : accès `admin`, refus sur `/utilisateurs` et `/reglages`, y compris par l’API.
- `ADMIN` : accès complet.
- Connexion d’un `CLIENT` sur `team` : déconnexion + message + lien vers `app`.

### Authentification
- Inscription → e-mail → retour sur `app/auth/callback` → session valide sur `app`.
- Mot de passe oublié lancé sur `team` → retour sur `team`.
- Invitation `STAFF` → `team` ; invitation `MANAGER`/`ADMIN` → hôte choisi en D5.
- Jeton de rafraîchissement : rester connecté plusieurs heures sur un espace avec rewrites, sans déconnexion aléatoire.
- Paramètre `next=//evil.com`, `next=https://evil.com`, `next=/\evil.com` → repli sur `/`.

### API
- Mutation depuis le bon hôte : OK.
- Mutation avec `Origin` d’un autre sous-domaine, ou sans `Origin` : refusée.
- Mêmes restrictions de rôle et de propriété que les pages, avec un ID appartenant à un autre utilisateur.

### Environnements
- Preview : seulement Supabase dev, liens d’e-mails vers les hôtes dev.
- Production : seulement Supabase prod.

### Confidentialité
- Aucune requête Analytics ne contient de jeton d’invitation, d’e-mail, de nom, de téléphone ni d’ID de réservation ou de projet.
- Pages à jeton : `Referrer-Policy: no-referrer` et `noindex` présents.
- `app`, `team`, `admin` : `X-Robots-Tag: noindex` et `robots.txt` restrictif.

---

## 10. Points à vérifier dans ton dépôt et ta documentation

Je n’ai pas accès à ton code : ces points sont à confirmer plutôt qu’à supposer.

1. **`@supabase/ssr`** : version utilisée, et ce que `updateSession` renvoie (en-têtes de cache, mise à jour de `request.cookies`). Adapter `withSession` et le `NextResponse.rewrite(url, { request })` en conséquence.
2. **Next.js** : confirmer que la version utilise bien `proxy.ts` (nom et signature exportée selon ta version) et son runtime.
3. **Crons et webhooks Vercel/Supabase/e-mail** : sur quelle URL ils appellent ton application, et si l’hôte est dans ta table d’hôtes.
4. **Server Actions** : présence ou non ; test de l’origine sur Preview.
5. **Vercel Analytics** : chemin enregistré (visible ou interne) pour les routes dynamiques.
6. **Layouts existants** : vérifier que `app/espace/layout.tsx` contrôle bien `CLIENT`, et que les pages `ADMIN` seulement ont leur propre contrôle.
7. **`ROLE_HOME`, `APP_URL`** : lister toutes les occurrences (`grep -rn "APP_URL\|ROLE_HOME"`) pour ne rien oublier.
8. **Documentation Vercel** : affectation d’un domaine à une branche et variables d’environnement par branche (comportement actuel de l’interface).
