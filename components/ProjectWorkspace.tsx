"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { PortalError } from "@/components/PortalErrorState";
import { PortalSkeleton } from "@/components/PortalStates";
import styles from "@/components/ProjectWorkspace.module.css";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { trackStudioEvent } from "@/lib/analytics";
import { PortalThemeToggle } from "@/components/PortalThemeToggle";

type Project = {
  id: string; title: string; status: string;
  booking: { title: string; date: string; time: string; status: string; name: string };
  tasks: { id: string; title: string; description: string; status: string }[];
  notes: { id: string; content: string; internal: boolean; createdAt: string }[];
  deliverables: { id: string; name: string; createdAt: string }[];
};

export function ProjectWorkspace({ projectId, canManage = false }: { projectId: string; canManage?: boolean }) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const viewed = useRef(false);
  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Projet inaccessible.");
      setProject(data.project);
      if (!viewed.current) {
        viewed.current = true;
        trackStudioEvent("project_viewed", { audience: canManage ? "team" : "client" });
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Impossible de charger le projet."); }
  }, [projectId]);
  useEffect(() => { void load(); }, [load]);

  async function updateTask(taskId: string, status: string) {
    setBusy(true); setFeedback("");
    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ taskId, status }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Modification impossible.");
      trackStudioEvent("project_task_updated", { status });
      setFeedback("Étape mise à jour."); await load();
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : "Modification impossible."); }
    finally { setBusy(false); }
  }

  async function add(kind: "task" | "note", event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true); setFeedback("");
    try {
      const response = await fetch(`/api/projects/${projectId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(kind === "task" ? { kind, title: form.get("title"), content: form.get("content") } : { kind, content: form.get("content"), internal: form.get("internal") === "on" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Enregistrement impossible.");
      trackStudioEvent(kind === "task" ? "project_task_created" : "project_note_created");
      formElement.reset(); setFeedback(kind === "task" ? "Étape ajoutée." : "Note ajoutée."); await load();
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : "Enregistrement impossible."); }
    finally { setBusy(false); }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const file = new FormData(formElement).get("file");
    if (!(file instanceof File)) return;
    setBusy(true); setFeedback("");
    try {
      const input = { name: file.name, contentType: file.type, size: file.size };
      const grantResponse = await fetch(`/api/projects/${projectId}/deliverables`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const grant = await grantResponse.json();
      if (!grantResponse.ok) throw new Error(grant.error || "Téléversement impossible.");
      const { error: uploadError } = await createSupabaseBrowserClient().storage.from(grant.bucket).uploadToSignedUrl(grant.path, grant.token, file, { contentType: file.type });
      if (uploadError) throw new Error(`Téléversement impossible : ${uploadError.message}`);
      const response = await fetch(`/api/projects/${projectId}/deliverables`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...input, path: grant.path }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Le fichier a été transmis, mais son partage n’a pas pu être confirmé.");
      trackStudioEvent("deliverable_upload_completed", { file_type: file.type || "unknown" });
      formElement.reset(); setFeedback("Livrable partagé avec le client."); await load();
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : "Téléversement impossible."); }
    finally { setBusy(false); }
  }

  async function download(deliverableId: string) {
    setFeedback("");
    try {
      const response = await fetch(`/api/projects/${projectId}/deliverables/${deliverableId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Téléchargement indisponible.");
      trackStudioEvent("deliverable_download_started");
      window.location.assign(data.url);
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : "Téléchargement indisponible."); }
  }

  if (error) return <PortalError title={error} retry={() => void load()} />;
  if (!project) return <PortalSkeleton rows={5} />;
  const finished = project.tasks.filter(task => task.status === "DONE").length;
  return <section>
    <div className="portal-topline"><span>Studio+ / Projet</span><PortalThemeToggle /></div>
    <header className="portal-heading"><div><div className="eyebrow"><i />Suivi de projet</div><h1>{project.title}.</h1></div><p>{project.booking.date} · {project.booking.time} · {finished}/{project.tasks.length} étapes terminées</p></header>
    {feedback && <p className="portal-status" role="status">{feedback}</p>}
    <div className="portal-surface"><h2>Votre timeline</h2>
      {project.tasks.length === 0 ? <p className="portal-note">Les étapes du projet seront ajoutées par l’équipe.</p> : <ol className={styles.timeline}>{project.tasks.map((task, index) => <li key={task.id} data-status={task.status}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{task.title}</strong>{task.description && <p>{task.description}</p>}<small>{task.status === "DONE" ? "Terminée" : task.status === "IN_PROGRESS" ? "En cours" : "À venir"}</small></div>{canManage && <select aria-label={`État : ${task.title}`} value={task.status} disabled={busy} onChange={event => void updateTask(task.id, event.target.value)}><option value="TODO">À faire</option><option value="IN_PROGRESS">En cours</option><option value="DONE">Terminée</option></select>}</li>)}</ol>}
      <h2 style={{ marginTop: 36 }}>Livrables</h2>{project.deliverables.length ? project.deliverables.map(file => <button key={file.id} className={styles.deliverable} type="button" onClick={() => void download(file.id)}>{file.name}<span>Télécharger ↗</span></button>) : <p className="portal-note">Aucun livrable partagé pour le moment.</p>}
      {canManage && <div className={styles.tools}><form className="portal-inline-form" onSubmit={event => void upload(event)}><label>Partager un livrable (PDF, JPG, PNG, WEBP · 25 Mo max.)<input type="file" name="file" required accept="application/pdf,image/jpeg,image/png,image/webp" /></label><button className="portal-action" disabled={busy}>Téléverser et partager</button></form><form className="portal-inline-form" onSubmit={event => void add("task", event)}><label>Nouvelle étape<input required minLength={2} maxLength={140} name="title" /></label><label>Détail facultatif<input maxLength={2000} name="content" /></label><button className="portal-action" disabled={busy}>Ajouter une étape</button></form><form className="portal-inline-form" onSubmit={event => void add("note", event)}><label>Note projet<textarea required maxLength={3000} name="content" /></label><label className={styles.check}><input type="checkbox" name="internal" defaultChecked />Note interne à l’équipe</label><button className="portal-action secondary" disabled={busy}>Ajouter une note</button></form></div>}
      {project.notes.map(note => <p key={note.id} className="portal-note">{note.content}</p>)}
    </div>
  </section>;
}
