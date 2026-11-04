"use client";

import { track } from "@vercel/analytics";

/**
 * Product analytics taxonomy. Keep properties categorical and non-identifying:
 * never pass emails, names, phone numbers, tokens, notes, IDs, or file names.
 */
export type StudioAnalyticsEvent =
  | "auth_flow_viewed"
  | "signup_submitted"
  | "signup_completed"
  | "login_submitted"
  | "login_completed"
  | "logout_completed"
  | "password_recovery_submitted"
  | "password_recovery_completed"
  | "password_updated"
  | "booking_started"
  | "booking_cta_clicked"
  | "project_brief_started"
  | "project_brief_answered"
  | "project_brief_completed"
  | "booking_step_viewed"
  | "booking_service_selected"
  | "booking_date_selected"
  | "booking_slot_selected"
  | "booking_submitted"
  | "booking_completed"
  | "project_viewed"
  | "project_task_updated"
  | "project_task_created"
  | "project_note_created"
  | "deliverable_upload_completed"
  | "deliverable_download_started"
  | "guest_invitation_viewed"
  | "guest_invitation_responded"
  | "booking_reschedule_requested"
  | "booking_cancelled_by_client"
  | "booking_participant_invited"
  | "booking_participant_removed"
  | "team_invitation_activated"
  | "account_profile_updated"
  | "account_email_change_requested"
  | "account_password_updated"
  | "booking_status_updated"
  | "booking_payment_recorded"
  | "booking_schedule_change_decided"
  | "booking_staff_assignment_changed"
  | "booking_invoice_sent"
  | "team_member_invited"
  | "team_invitation_action_completed"
  | "admin_user_access_updated"
  | "studio_settings_updated";

type SafeProperties = Record<string, string | number | boolean>;

export function trackStudioEvent(event: StudioAnalyticsEvent, properties?: SafeProperties) {
  track(event, properties);
}
