-- These tables are accessed only by trusted server routes through Prisma.
-- Enable RLS so the Supabase Data API cannot expose them to client roles.
ALTER TABLE "booking_schedule_changes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "studio_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project_deliverables" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "studio_invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "team_invitations" ENABLE ROW LEVEL SECURITY;
