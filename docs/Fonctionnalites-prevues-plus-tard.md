# Studio+ — Phases booking : livré, limites et suite

Ce document remplace la liste d’options initialement reportées. Il décrit le
périmètre retenu et ce qui doit encore être configuré avant une mise en service
complète. Aucun paiement en ligne, export CSV ou système d’alertes n’est prévu.

## Phase 1 — Planning et règles de séance

Implémenté : le client propose un autre créneau depuis son espace ; le studio
l’accepte ou le refuse ; la séance ne change qu’après validation. L’historique
reste visible, et l’ancien créneau est libéré lors de l’approbation. L’équipe
peut démarrer une séance, signaler une absence ou la terminer selon les
transitions autorisées. Le téléchargement `.ics` et l’annulation restent
disponibles.

Limite : les changements de séance et statuts dépendent de la migration Prisma
de cette phase. Tester les conflits de créneaux sur la base de développement
avant la production.

## Phase 2 — Invitation podcast enrichie

Implémenté : réponse accepter/refuser, note, courte bio, un lien social,
proposition d’horaire, consentement image/voix facultatif et révocable, aperçu
des réponses dans l’espace client, notification e-mail au studio si
`STUDIO_BOOKING_EMAIL` est configuré. Les jetons restent hachés en base et
expirent.

À finaliser avant usage public du consentement : vérifier le texte d’autorisation
(supports, finalités, durée, retrait et conservation) avec Studio+ et l’adapter
aux conditions réelles. Le champ actuel est une base technique, pas un avis
juridique.

## Phase 3 — Projets, tâches et livrables

Implémenté : un projet et ses étapes de départ sont créés à la confirmation de
la réservation. Le client consulte sa timeline ; l’équipe gère les étapes et les
notes internes/partagées. Les PDF et images sont envoyés directement du navigateur
vers un bucket privé Supabase, avec un jeton de téléversement temporaire délivré
seulement à un membre autorisé ; le serveur vérifie ensuite le fichier avant de
le partager. Le téléchargement passe par une vérification du rôle/propriétaire/
affectation puis une URL signée de 60 secondes. Ce parcours évite la limite de
4,5 Mo des fonctions Vercel pour les requêtes entrantes.

Configuration indispensable dans chaque projet Supabase (dev et prod) :

1. Créer un bucket Storage nommé `studio-deliverables` et le laisser **privé**.
2. Ajouter `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local` pour dev et dans les
   variables serveur Vercel pour l’environnement concerné. Ne jamais préfixer
   cette clé par `NEXT_PUBLIC_`, la committer ou l’exposer dans le navigateur.
3. Définir `SUPABASE_STORAGE_BUCKET=studio-deliverables` (ou choisir un nom
   identique dans le bucket et l’environnement).
4. Appliquer la migration Prisma de la phase et vérifier upload/téléchargement
   avec un membre assigné, un client propriétaire et un compte non autorisé.

Formats acceptés : PDF, JPG, PNG, WEBP ; taille maximale : 25 Mo. Les vidéos
volumineuses, versions multiples et suppression/archivage des fichiers restent
à concevoir si elles deviennent nécessaires.

## Phase 4 — Statistiques essentielles

Les statistiques existantes restent en place. Le périmètre confirmé exclut
expressément l’export CSV et les alertes. Les rapports BI, comparaisons de
périodes et indicateurs avancés ne sont pas implémentés.

## Phase 5 — Facture Studio+ par e-mail

Implémenté : depuis une réservation confirmée, l’équipe peut préparer une
facture PDF avec logo Studio+, référence interne, client, prestation, date,
montant convenu, paiements sur place enregistrés et solde. Le PDF est joint à un
e-mail Resend. L’émission n’encaisse rien et aucun moyen de paiement en ligne
n’est proposé.

Cette facture est un document commercial généré par Studio+ ; elle n’est pas
présentée comme certifiée FNE. Avant la production, Studio+ doit confirmer et
fournir les mentions de l’entreprise à faire figurer (raison sociale, adresse
officielle, contacts, identifiants et régime/taxes applicables). Le modèle actuel
ne calcule pas de taxe ni de ventilation fiscale. Les paiements doivent être
saisis dans l’espace de gestion avant l’envoi pour que le reçu reflète les
montants déjà encaissés.

Configuration e-mail : vérifier le domaine et l’adresse `EMAIL_FROM` dans Resend
et renseigner `RESEND_API_KEY` sur chaque environnement. Si Resend échoue,
l’e-mail est visible dans `/gestion/emails` ; l’équipe peut relancer l’envoi.

Hors périmètre confirmé : paiement en ligne, acompte en ligne, remboursement,
webhooks de paiement et intégration FNE.

## Phase 6 — API et routing

Routes spécialisées ajoutées :

```text
GET/POST  /api/bookings
GET       /api/services
GET       /api/availability?date=YYYY-MM-DD
GET/PATCH /api/bookings/[id]
GET/POST  /api/bookings/[id]/schedule
GET/POST/DELETE /api/bookings/[id]/invitations
GET/POST/DELETE /api/bookings/[id]/staff
POST      /api/bookings/[id]/payments
POST      /api/bookings/[id]/invoice
GET/POST/PATCH /api/projects/[id]
POST/PATCH /api/projects/[id]/deliverables
GET       /api/projects/[id]/deliverables/[deliverableId]
```

Les écrans du tunnel de réservation, du catalogue, de la gestion et de l’espace
client utilisent les nouveaux contrats. `/api/studio` est conservée comme
adaptateur de compatibilité pour les anciens liens/intégrations ; ne la supprimer
qu’après vérification de ses consommateurs résiduels. Chaque route privée
contrôle l’identité, le rôle et l’appartenance à la réservation/projet côté
serveur. Les URL Storage sont temporaires et privées.

## Déploiement et contrôle

- Garder deux projets Supabase distincts : développement et production, avec des
  variables, clés, bases et buckets séparés.
- Appliquer les migrations d’abord sur Supabase dev ; faire un parcours complet
  par rôle puis déployer sur la production avec `prisma migrate deploy`.
- Vérifier sur dev : réservation, indisponibilité d’un créneau, replanification,
  réponse d’invité, transitions équipe, confidentialité des projets, livrable
  privé et facture PDF jointe.
- Configurer Resend et le bucket privé dans chaque environnement ; aucune de ces
  clés ne doit être présente dans le navigateur.
- Les erreurs, états de chargement, listes vides et refus d’accès restent
  explicites ; les actions ne doivent pas annoncer un succès si la mutation ou
  l’envoi a échoué.
