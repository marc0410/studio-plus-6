import { ProjectWorkspace } from "@/components/ProjectWorkspace";

export const dynamic = "force-dynamic";
export default async function ClientProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <main className="portal-page"><div className="portal-wrap"><ProjectWorkspace projectId={id} /></div></main>;
}
