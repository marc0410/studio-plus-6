import AcceptTeamInvite from "@/components/AcceptTeamInvite";

export const dynamic = "force-dynamic";
export default async function AcceptInvitePage({ searchParams }: { searchParams: Promise<{ token_hash?: string; next?: string }> }) {
  const params = await searchParams;
  const tokenHash = params.token_hash ?? "";
  const next = params.next === "/equipe" ? "/equipe" : "/gestion";
  if (!/^[A-Za-z0-9_-]{1,512}$/.test(tokenHash)) return <main id="contenu" className="portal-page"><div className="portal-wrap"><section className="portal-surface portal-auth-card"><div className="eyebrow"><i />Accès équipe</div><h1>Invitation invalide.</h1><p role="alert">Le lien d’invitation est invalide ou incomplet. Demandez une nouvelle invitation à votre administrateur.</p></section></div></main>;
  return <AcceptTeamInvite tokenHash={tokenHash} next={next} />;
}
