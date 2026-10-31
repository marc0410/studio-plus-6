# Vérifications et périmètre de migration

- Compilation de production avec Next.js 16.3.4 après la migration React : réussie.
- Vérification TypeScript après la migration React : réussie.
- Services métier, accès SQLite et authentification migrés en TypeScript ; migration et scripts opérationnels configurés pour Node.js 22.18 ou ultérieur.
- Tests automatiques : validations de dates, connexion et expiration des sessions, déconnexion, refus des faux en-têtes d’identité, contrôle d’origine, création de réservation, rollback d’un conflit, accès propriétaire/invité/administrateur, tarifs, annulation et libération des créneaux.
- Les routes publiques, la réservation et l’espace client sont maintenant des composants React/TSX dans l’App Router.
- Le contrôle visuel dans un navigateur n’a pas encore été réalisé après cette migration. Vérifier les parcours à différentes tailles d’écran après `npm run dev`.

Les tests utilisent uniquement une base SQLite en mémoire, des comptes factices en `example.test` et des mots de passe de test. Ils ne touchent pas le site hébergé.
