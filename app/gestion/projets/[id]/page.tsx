import { ProjectWorkspace } from "@/components/ProjectWorkspace";

export const dynamic = "force-dynamic";
export default async function ManagedProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectWorkspace projectId={id} canManage />;
}
