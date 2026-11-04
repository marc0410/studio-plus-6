"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { PortalEmpty, PortalSkeleton } from "@/components/PortalStates";
import { PortalError } from "@/components/PortalErrorState";

type User = { id: string; email: string; fullName: string; role: "ADMIN" | "MANAGER" | "STAFF" | "CLIENT"; isActive: boolean; invitation: { status: string; expiresAt: string; acceptedAt: string | null } | null };
const roles: User["role"][] = ["ADMIN", "MANAGER", "STAFF", "CLIENT"];

export function AdminUsers() {
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Chargement impossible.");
      setUsers(data.users);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Impossible de charger les comptes."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function update(user: User, patch: Partial<Pick<User, "role" | "isActive">>) {
    setBusy(user.id); setFeedback("");
    try {
      const response = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: user.id, ...patch }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Modification impossible.");
      setFeedback("Les accès ont été mis à jour.");
      await load();
    } catch (caught) { setFeedback(caught instanceof Error ? caught.message : "Modification impossible."); }
    finally { setBusy(""); }
  }

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setInviteBusy(true); setFeedback(""); setError("");
    try {
      const response = await fetch("/api/admin/team-invitations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: values.get("name"), email: values.get("email"), role: values.get("role") }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Invitation impossible.");
      setFeedback(data.message); form.reset(); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Invitation impossible."); }
    finally { setInviteBusy(false); }
  }

  async function invitationAction(user: User, action: "resend" | "revoke") {
    if (action === "revoke" && !window.confirm(`Révoquer l’invitation de ${user.fullName} ?`)) return;
    setBusy(user.id); setFeedback(""); setError("");
    try {
      const response = await fetch("/api/admin/team-invitations", {
        method: action === "revoke" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "revoke" ? { userId: user.id } : { resendUserId: user.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Action impossible.");
      setFeedback(data.message); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Action impossible."); }
    finally { setBusy(""); }
  }

  if (error && !users) return <PortalError title={error} retry={() => void load()} />;
  if (!users) return <PortalSkeleton rows={5} />;
  return <section><header className="portal-heading"><div><div className="eyebrow"><i />Administration</div><h1>Les accès Studio+.</h1></div><p>Invitez les membres de l’équipe et gérez les rôles. Les permissions sont appliquées côté serveur.</p></header>
    {feedback && <p className="portal-status" role="status">{feedback}</p>}{error && <p className="portal-status" role="alert">{error}</p>}
    <form className="portal-surface portal-invite-form" onSubmit={event => void invite(event)}><h2>Inviter un membre interne</h2><label>Nom complet<input name="name" required minLength={2} maxLength={100} /></label><label>E-mail professionnel<input type="email" name="email" required maxLength={180} /></label><label>Rôle<select name="role"><option value="STAFF">STAFF — équipe</option><option value="MANAGER">MANAGER — gestion</option></select></label><button className="portal-action" disabled={inviteBusy}>{inviteBusy ? "Création…" : "Envoyer l’invitation"}</button></form>
      <h2 style={{ marginTop: 36 }}>Comptes et accès</h2><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Personne</th><th>E-mail</th><th>Rôle</th><th>Invitation</th><th>Accès</th></tr></thead><tbody>{users.map(user => { const pending = user.invitation?.status === "PENDING"; const expired = pending && new Date(user.invitation!.expiresAt).getTime() <= Date.now(); return <tr key={user.id}><td>{user.fullName}</td><td>{user.email}</td><td><select aria-label={`Rôle de ${user.fullName}`} value={user.role} disabled={busy === user.id} onChange={event => void update(user, { role: event.target.value as User["role"] })}>{roles.map(role => <option key={role} value={role}>{role}</option>)}</select></td><td>{pending ? <>{expired ? "Expirée" : "En attente"} <button className="portal-action secondary" disabled={busy === user.id} onClick={() => void invitationAction(user, "resend")}>Renvoyer</button> <button className="portal-action secondary" disabled={busy === user.id} onClick={() => void invitationAction(user, "revoke")}>Révoquer</button></> : user.invitation?.status === "ACCEPTED" ? "Acceptée" : user.invitation?.status === "REVOKED" ? "Révoquée" : "—"}</td><td><button className="portal-action secondary" disabled={busy === user.id} onClick={() => void update(user, { isActive: !user.isActive })}>{user.isActive ? "Désactiver" : "Réactiver"}</button></td></tr>; })}</tbody></table></div>
  </section>;
}
