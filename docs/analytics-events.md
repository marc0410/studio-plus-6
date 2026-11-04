# Événements Analytics Studio+

Les pages vues sont collectées par Vercel Analytics. Les événements personnalisés utilisent `trackStudioEvent` dans `lib/analytics.ts`. Les noms sont en `snake_case`, décrivent une action terminée ou une étape atteinte, et les propriétés restent catégorielles.

| Étape | Événements |
| --- | --- |
| Découverte | `booking_cta_clicked` |
| Brief de production | `project_brief_started`, `project_brief_answered`, `project_brief_completed` |
| Accès | `auth_flow_viewed`, `signup_submitted`, `signup_completed`, `login_submitted`, `login_completed`, `logout_completed`, `password_recovery_submitted`, `password_recovery_completed`, `password_updated` |
| Réservation | `booking_started`, `booking_step_viewed`, `booking_service_selected`, `booking_date_selected`, `booking_slot_selected`, `booking_submitted`, `booking_completed` |
| Espace client et projet | `project_viewed`, `booking_reschedule_requested`, `booking_cancelled_by_client`, `booking_participant_invited`, `booking_participant_removed`, `project_task_updated`, `project_task_created`, `project_note_created`, `deliverable_upload_completed`, `deliverable_download_started` |
| Invitation | `guest_invitation_viewed`, `guest_invitation_responded`, `team_invitation_activated` |
| Compte | `account_profile_updated`, `account_email_change_requested`, `account_password_updated` |
| Gestion Studio+ | `booking_status_updated`, `booking_payment_recorded`, `booking_schedule_change_decided`, `booking_staff_assignment_changed`, `booking_invoice_sent`, `team_member_invited`, `team_invitation_action_completed`, `admin_user_access_updated`, `studio_settings_updated` |

Ne jamais ajouter de nom, e-mail, téléphone, texte libre, nom de fichier, jeton, identifiant de réservation ou identifiant de compte dans les événements. La route publique `/invite/[token]` est normalisée avant l’envoi des pages vues et les query strings sont supprimées. Les événements donnent une lecture du parcours et de ses conversions, pas un historique nominatif par compte. Pour un suivi utilisateur nominatif, il faut choisir et documenter séparément une solution d’analytics produit et sa politique de confidentialité.
