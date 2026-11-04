# Audit fonctionnel de Studio+ — limites et feuille de route

Audit initial : 4 novembre 2026 · mise à jour après corrections : 4 novembre 2026  
Périmètre : pages App Router, composants d’interface, routes API, autorisations et schéma Prisma présents dans le dépôt. Cet audit décrit le code ; il ne vérifie pas la configuration des comptes Supabase, Resend ou Vercel.

## Résumé

Les parcours principaux existent : demande de réservation, confirmation manuelle, espace client, espace équipe, affectation du personnel, suivi de projet, livrables privés et facture PDF envoyée par e-mail. Les pages s’appuient sur des contrôles de rôle côté serveur.

Les corrections retenues dans cette passe sont livrées ou explicitement bornées ci-dessous. Les sujets encore ouverts sont :

1. L02 ne couvre encore que tarifs, durées, horaires hebdomadaires et fermetures datées ; les champs éditoriaux et l’état actif du catalogue restent codés ;
2. L03 envoie un e-mail lors d’une affectation ou d’un retrait, mais pas encore lors de chaque déplacement, annulation ou changement de brief ;
3. L04 expire les demandes après 48 h (réglable de 24 à 168 h), sans rappel avant expiration ni action de prolongation ;
4. L06 bloque les chevauchements de séance, mais ne gère pas les congés et horaires individuels ;
5. la suppression/export de compte dans L07 reste reportée à cette passe ;
6. les fonctions conditionnelles L08 (messagerie) et L11 (CMS) sont reportées à la demande du Studio+.

## Inventaire des pages auditées

| Espace | Pages | État constaté |
| --- | --- | --- |
| Site public | `/`, `/studio`, `/projets`, `/tarifs` | Pages de présentation et catalogue ; contenus principalement définis dans le code. |
| Réservation | `/reserver` | Choix d’une prestation, date/créneau et envoi d’une demande ; la confirmation reste manuelle. |
| Authentification | `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/nouveau-mot-de-passe` | Connexion, inscription avec confirmation e-mail et récupération du mot de passe. |
| Client | `/espace`, `/espace/projets/[id]` | Consultation des séances, annulation ou proposition de changement, participants, suivi de projet et livrables visibles. |
| Invité externe | `/invite/[token]` | Réponse à une invitation ponctuelle liée à une séance ; ce parcours ne crée pas de compte interne. |
| Personnel | `/equipe`, `/equipe/seances`, fiches et projets affectés | Consultation des séances affectées et des informations de préparation. |
| Gestion | `/gestion`, `/gestion/reservations`, `/gestion/statistiques`, `/gestion/emails` | Traitement des demandes, paiements saisis manuellement, affectations, projets, facture PDF et échecs d’e-mail. |
| Administration | `/gestion/utilisateurs` | Modification du rôle et activation/désactivation des comptes existants. |

## Limites relevées et travaux à créer

### P1 — À traiter pour rendre l’exploitation fluide

#### L01 — Invitation et création d’un compte interne

**État : livré.** L’admin peut inviter ou renvoyer une invitation, et révoquer une invitation en attente. Le lien utilise un jeton d’activation Supabase vérifié par une page dédiée ; l’invitation expire après sept jours. La clé admin reste côté serveur.

**Pages concernées :** `/gestion/utilisateurs`, `/inscription`  
**Constat :** l’administrateur peut changer le rôle d’un compte existant, mais ne peut ni créer le compte Auth, ni envoyer une invitation interne depuis l’interface. Le chemin actuel est : la personne s’inscrit comme cliente, confirme son e-mail, puis un admin lui attribue `STAFF` ou `MANAGER`.

**À créer :** formulaire « Inviter un membre » réservé à `ADMIN`, création/invitation via Supabase Auth, attribution initiale du rôle choisi, e-mail d’activation, statut « invitation en attente », possibilité de renvoyer ou révoquer l’invitation. Ne jamais exposer la clé Supabase Admin au navigateur.

**Acceptation :** l’admin peut inviter une adresse qui n’a pas de compte ; la personne reçoit un lien, définit son mot de passe, puis arrive dans l’espace correspondant à son rôle. Une invitation expirée ou déjà utilisée affiche un état clair.

#### L02 — Écran d’administration des tarifs et horaires

**État : partiellement livré.** L’admin peut modifier tarif, durée, horaires hebdomadaires et fermetures exceptionnelles ; la validation serveur bloque les dates fermées dans le parcours de réservation. L’édition du nom, de la description, de l’image, de l’étiquette et de l’état actif des prestations reste à faire.

**Pages concernées :** `/gestion` et `/tarifs`  
**Constat :** l’API historique `/api/studio` accepte une configuration, mais aucune page de gestion ne permet à l’admin de la modifier. Le catalogue conserve exactement trois identifiants de prestation (`podcast`, `photo`, `video`). Les champs éditoriaux du catalogue sont repris des valeurs par défaut ; l’interface ne permet pas de les administrer.

**À créer :** écran admin pour tarifs, durées, heures d’ouverture et jours hebdomadaires de fermeture ; ajouter l’édition du nom, de la description, de l’étiquette, de l’image et de l’état actif. Prévoir des fermetures exceptionnelles par date (jours fériés, congés, maintenance). Si Studio+ veut de nouvelles prestations, remplacer la contrainte actuelle des trois prestations fixes par une gestion complète du catalogue.

**Acceptation :** toute modification est persistée, visible sur `/tarifs` et appliquée à `/reserver` ; les données invalides sont refusées côté serveur ; les fermetures exceptionnelles retirent les créneaux correspondants.

#### L03 — Notification des membres affectés

**État : partiellement livré.** Un e-mail métier est envoyé lors d’une affectation et d’un retrait. L’envoi est consigné et son échec n’annule pas l’affectation. Les notifications de déplacement, annulation et changement de brief ne sont pas encore câblées.

**Pages concernées :** gestion des réservations et `/equipe`  
**Constat :** `ADMIN` et `MANAGER` peuvent affecter ou retirer un compte `STAFF` actif à une séance. L’affectation n’envoie pas d’e-mail au membre et n’apparaît pas dans une boîte de notifications interne.

**À créer :** notification d’affectation, de retrait, de déplacement, d’annulation et de changement de brief ; inclure un lien vers la fiche de séance. Enregistrer le résultat de l’envoi et proposer un renvoi contrôlé.

**Acceptation :** une affectation confirmée informe le bon membre ; une réaffectation informe la personne sortante et la nouvelle personne ; l’échec d’envoi ne supprime pas l’affectation et reste visible à l’équipe.

#### L04 — Expiration des demandes qui bloquent un créneau

**État : partiellement livré.** Une demande expire par défaut après 48 heures (variable `BOOKING_REQUEST_TTL_HOURS`, bornée entre 24 et 168 h). Un cron quotidien l’annule, libère ses créneaux et envoie un e-mail au client ; le parcours de création nettoie les expirations avant d’insérer une nouvelle demande, et la disponibilité traite immédiatement un créneau expiré comme libre. Les anciennes demandes sont rétro-remplies lors de la migration. Pas de rappel ni de prolongation manuelle pour le moment.

**Pages concernées :** `/reserver`, `/gestion/reservations`  
**Constat :** les créneaux des réservations `REQUESTED` sont considérés occupés. Aucun délai ni tâche automatique ne libère une demande oubliée ; le studio doit la confirmer ou l’annuler manuellement.

**À créer :** délai d’expiration configurable, rappel avant expiration, tâche planifiée qui annule proprement les demandes expirées et libère leurs créneaux. Prévoir une action admin pour prolonger une demande.

**Acceptation :** une demande expire selon la règle affichée au client, libère le créneau sans intervention, conserve un historique et envoie les notifications prévues.

#### L05 — Recherche et navigation dans les réservations

**État : livré.** Recherche par nom/e-mail/téléphone/titre/référence, filtres de statut, dates, prestation et membre, et pagination serveur par 20 résultats sont disponibles dans `/gestion/reservations`.

**Pages concernées :** `/gestion/reservations`  
**Constat :** les filtres disponibles sont « Toutes », « À traiter », « Confirmées » et « Annulées ». Les séances en cours, terminées et absences sont accessibles seulement dans « Toutes ». La route renvoie au maximum 500 réservations et l’écran ne propose ni recherche, ni période, ni pagination.

**À créer :** recherche par nom/e-mail/téléphone/référence, filtres par période, prestation, statut et membre affecté, filtres explicites pour les statuts restants et pagination serveur. Ajouter une vue calendrier si elle est utile aux opérations quotidiennes.

**Acceptation :** aucun résultat n’est perdu au-delà de la limite actuelle ; les filtres peuvent être combinés et conservés dans l’URL ; l’écran reste utilisable sur mobile.

### P2 — À planifier selon les besoins opérationnels

#### L06 — Disponibilités du personnel et conflits d’affectation

**État : partiellement livré.** L’affectation détecte les chevauchements avec les autres séances actives du même jour. Les horaires de travail, congés et dérogations explicites restent à modéliser.

**Pages concernées :** `/gestion/reservations`, `/equipe`  
**Constat :** l’affectation vérifie que le profil est actif et a le rôle `STAFF`, mais ne contrôle pas les horaires, congés ou autres séances de cette personne. Le planning de réservation modélise un seul espace physique partagé.

**À créer :** horaires et indisponibilités par membre, contrôle de chevauchement à l’affectation, et si nécessaire gestion de plusieurs salles/équipements. Permettre de visualiser les conflits avant validation.

**Acceptation :** une affectation conflictuelle est signalée et ne peut pas être validée sans dérogation explicite ; les ressources réservées sont contrôlées transactionnellement.

#### L07 — Édition du profil et des identifiants

**État : édition du profil livrée ; suppression/export reportés pour cette passe.** Les espaces client et équipe permettent de modifier nom, téléphone, adresse (avec confirmation Supabase) et mot de passe. L’export/suppression, la politique de conservation et l’audit des suppressions restent ouverts.

**Pages concernées :** `/espace`, `/equipe`, administration des utilisateurs  
**Constat :** l’utilisateur ne dispose pas d’un écran pour modifier son nom, son téléphone ou son adresse e-mail. La récupération du mot de passe existe, mais aucun espace de paramètres de compte n’est présent. La désactivation d’un profil bloque les accès applicatifs aux requêtes protégées ; elle ne supprime pas le compte Supabase Auth.

**À créer :** paramètres de profil, changement d’adresse avec confirmation Supabase, changement de mot de passe en session, et procédure d’export/suppression du compte conforme à la politique de conservation Studio+.

**Acceptation :** les changements d’identité sont vérifiés, synchronisés dans `profiles` et auditables ; la désactivation et la suppression ont des comportements documentés pour les réservations et factures déjà enregistrées.

#### L08 — Conversation client-équipe et suivi des échanges

**État : reporté à la demande du Studio+.**

**Pages concernées :** `/espace`, pages de projet, `/gestion/projets/[id]`  
**Constat :** l’équipe peut ajouter des notes internes ou visibles côté client. Il n’existe pas de fil de conversation client-équipe avec réponses, pièces jointes ou notifications ; les échanges passent par e-mail ou téléphone.

**À créer :** si le besoin est confirmé, fil de messages par réservation/projet, distinction interne/partagé, notification, pièces jointes et historique horodaté. Définir les règles de conservation avant mise en œuvre.

#### L09 — Historique et diagnostic des e-mails

**État : partiellement livré.** Historique paginé et filtrable par statut/destinataire/type, incluant succès/échecs et envois Auth via Resend ; identifiant Resend visible. Les URL et jetons ne sont pas stockés dans les journaux. Certains événements métier ou envois opérés hors de ce serveur ne seront pas présents.

**Pages concernées :** `/gestion/emails`  
**Constat :** la page affiche au plus 50 envois métier en échec, pas les envois réussis. Les e-mails Auth envoyés directement par le hook Supabase → Resend ne sont pas enregistrés dans `EmailDelivery`. Les invitations participant contiennent un jeton à usage unique et ne sont pas relançables telles quelles ; il faut créer un nouveau lien.

**À créer :** historique complet avec filtres et pagination, identifiant Resend, distinction e-mail métier/Auth, statut livré/échec, et procédure sécurisée de renvoi qui régénère les jetons d’invitation au lieu de réutiliser un ancien lien.

**Acceptation :** aucun jeton réutilisable n’est conservé dans les journaux ; les données personnelles visibles sont limitées aux rôles autorisés ; un renvoi génère une nouvelle clé d’idempotence et une nouvelle URL quand nécessaire.

#### L10 — Statistiques avec périodes et définitions cohérentes

**État : partiellement livré.** Un sélecteur de mois est disponible ; les statuts opérationnels sont distingués, la définition des clients actifs est affichée, et les encaissements sont explicitement rattachés à leur mois de paiement. Les comparaisons de périodes restent hors scope.

**Pages concernées :** `/gestion`, `/gestion/statistiques`  
**Constat :** la page de statistiques affiche le mois courant seulement et n’a pas de sélecteur de période. L’API peut recevoir un mois, mais l’interface ne l’expose pas. Le compteur « Clients actifs » correspond aux clients ayant une réservation datée dans le mois, y compris les réservations annulées ; la définition peut donc surprendre. Le tableau de bord affiche l’encaissé total, tandis que la page statistiques affiche l’encaissé du mois.

**À créer :** clarifier et afficher les définitions des métriques ; distinguer demandes, séances confirmées/annulées et montants convenus/encaissés/solde. Un sélecteur de mois peut être ajouté si Studio+ en confirme le besoin ; les comparaisons de périodes restent hors périmètre actuel.

**Acceptation :** filtres de période reflétés dans les calculs, mêmes définitions entre tableau de bord et statistiques, chiffres recoupables avec les réservations et paiements.

#### L11 — Gestion éditoriale des pages publiques

**État : reporté à la demande du Studio+ ; le contenu public reste édité dans le code.**

**Pages concernées :** `/`, `/studio`, `/projets`, `/tarifs`  
**Constat :** les textes, FAQ, scènes et projets de présentation sont principalement définis dans les composants ou modules de données. Une mise à jour éditoriale nécessite une modification du code et un déploiement. Les projets suivis dans l’espace client ne constituent pas le portfolio public.

**À créer :** soit conserver intentionnellement un site édité par développeur, soit mettre en place un CMS ou un panneau éditorial avec brouillon, prévisualisation, publication et gestion des médias. Ne pas afficher de témoignages ou projets clients sans validation et autorisation.

#### L12 — Documentation de démarrage alignée sur l’architecture actuelle

**État : livré.** Le README décrit maintenant Supabase/Prisma/Resend/Vercel, les commandes présentes et le parcours d’installation.

**Documents concernés :** `README.md`, guides de configuration  
**Constat :** le README décrit encore l’ancienne architecture SQLite et des commandes de provisionnement de comptes qui ne correspondent plus aux scripts présents. Le guide de configuration actuel décrit Supabase, Prisma et Vercel ; les deux sources peuvent conduire une personne à initialiser ou déployer le mauvais système.

**À créer :** remettre le README en cohérence avec l’architecture Supabase/Prisma actuelle, les vrais scripts `package.json`, les parcours d’environnements dev/prod, le hook Resend et les prérequis de migration. Archiver ou identifier clairement les instructions héritées.

**Acceptation :** une personne qui suit seulement le README peut installer, configurer un environnement de développement, appliquer les migrations, démarrer le site et retrouver le guide de déploiement sans utiliser SQLite ni une commande inexistante.

### Fonctions explicitement hors périmètre confirmé

Le document `docs/Fonctionnalites-prevues-plus-tard.md` indique que ces fonctions ne sont pas prévues à ce stade ; elles ne sont donc pas présentées ici comme des défauts à corriger :

- paiement ou acompte en ligne, remboursements et intégration de paiement ;
- export CSV et alertes automatiques ;
- rapports BI avancés et comparaisons de périodes ;
- suppression/archivage/versionnage des livrables et gestion des vidéos volumineuses ;
- certification fiscale FNE ou calcul automatique des taxes.

Le consentement image/voix des invités est techniquement enregistré et révocable. Son texte doit être confirmé par Studio+ avant usage public ; le document de phase précise que le texte actuel n’est pas un avis juridique.

## Ordre de réalisation suggéré

1. **Livré dans cette passe :** L01 invitation, L05 recherche/pagination, paramètres L07, suivi L09, et documentation L12.
2. **À compléter :** édition complète du catalogue L02, notifications étendues L03, rappel/prolongation L04, planning individuel L06 et comparaisons L10.
3. **Reporté à la demande du Studio+ :** messagerie L08, CMS L11 et suppression/export de compte L07.

Chaque lot doit inclure ses contrôles d’accès par rôle, états de chargement/erreur/vide, validation serveur et tests de parcours avant déploiement.

## Références du dépôt

- Rôles et redirections : `lib/roles.ts`, `lib/current-profile.ts`, `lib/supabase-auth.ts`.
- Utilisateurs : `app/gestion/utilisateurs/page.tsx`, `components/AdminUsers.tsx`, `app/api/admin/users/route.ts`.
- Configuration historique : `app/api/studio/route.ts`, `lib/studio-domain.ts`; lecture publique : `app/api/services/route.ts`.
- Réservations et filtres : `components/ManagerBookings.tsx`, `app/api/bookings/route.ts`, `app/api/bookings/[id]/route.ts`.
- Affectations et équipe : `app/api/bookings/[id]/staff/route.ts`, `app/equipe/page.tsx`, `app/equipe/seances/page.tsx`.
- E-mails : `components/EmailDeliveryManager.tsx`, `app/api/gestion/emails/route.ts`, `lib/email.ts`, `app/api/auth/send-email/route.ts`.
- Phases déjà livrées et périmètre exclu : `docs/Fonctionnalites-prevues-plus-tard.md`.

