"use client";

import { useState, useTransition } from "react";
import {
  ajouterPassage,
  marquerRecompenseUtilisee,
} from "@/lib/scan-actions";
import {
  retirerDernierPassage,
  reinitialiserMotDePasse,
  supprimerCliente,
} from "@/lib/admin-actions";
import type { ScanInfo, ScanResult } from "@/lib/types";

/**
 * Gestion d'une cliente côté admin : correction des points, réinitialisation
 * du mot de passe et suppression. L'état de la carte (`info`) est recalculé
 * côté serveur à chaque action et remplacé ici.
 */
export default function GestionCliente({
  clienteId,
  telephone,
  hasCompte,
  info: infoInitial,
}: {
  clienteId: string;
  telephone: string | null;
  hasCompte: boolean;
  info: ScanInfo;
}) {
  const [info, setInfo] = useState(infoInitial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function appliquer(res: ScanResult) {
    if (res.ok) {
      setInfo(res.info);
      setError(null);
    } else {
      setError(res.error);
    }
  }

  function lancer(action: () => Promise<ScanResult>) {
    startTransition(async () => appliquer(await action()));
  }

  const prete = info.recompensesDisponibles >= 1;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <header>
        <p className="text-sm text-muted-foreground">Cliente</p>
        <h1 className="text-2xl font-bold text-primary">{info.prenom}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {telephone ? telephone : "Pas de téléphone"}
          {" · "}
          {hasCompte ? "compte en ligne" : "sans compte"}
        </p>
      </header>

      {/* Cases du cycle courant */}
      <section className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: info.seuil }).map((_, i) => {
            const active = i < info.remplies;
            return (
              <div
                key={i}
                className={
                  "flex aspect-square items-center justify-center rounded-full border text-lg font-semibold " +
                  (active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-muted text-muted-foreground")
                }
              >
                {active ? "★" : ""}
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-center text-sm">
          {prete ? (
            <span className="font-semibold text-success">
              🎉 Récompense disponible : {info.valeurRecompense} €
              {info.recompensesDisponibles > 1
                ? ` (×${info.recompensesDisponibles})`
                : ""}
            </span>
          ) : (
            <>
              Encore{" "}
              <span className="font-semibold text-primary">
                {info.restants}
              </span>{" "}
              passage{info.restants > 1 ? "s" : ""} avant la récompense de{" "}
              <span className="font-semibold">{info.valeurRecompense} €</span>.
            </>
          )}
        </p>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {info.totalPassages} passage{info.totalPassages > 1 ? "s" : ""} au
          total.
        </p>
      </section>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {/* Corriger les points */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Corriger les points</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => lancer(() => ajouterPassage(clienteId))}
            disabled={pending}
            className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
          >
            ＋ Ajouter
          </button>
          <button
            onClick={() => lancer(() => retirerDernierPassage(clienteId))}
            disabled={pending || info.totalPassages === 0}
            className="rounded-xl border border-border px-4 py-3 font-semibold transition active:scale-[0.99] disabled:opacity-60"
          >
            − Retirer
          </button>
        </div>
        {prete && (
          <button
            onClick={() => lancer(() => marquerRecompenseUtilisee(clienteId))}
            disabled={pending}
            className="w-full rounded-xl border border-success px-4 py-3 font-semibold text-success transition active:scale-[0.99] disabled:opacity-60"
          >
            ✓ Marquer la récompense utilisée
          </button>
        )}
      </section>

      {/* Mot de passe */}
      <ResetMotDePasse
        clienteId={clienteId}
        hasCompte={hasCompte}
        disabled={pending}
      />

      {/* Suppression */}
      <SupprimerCliente clienteId={clienteId} prenom={info.prenom} />
    </div>
  );
}

/** Bloc de réinitialisation du mot de passe (compte cliente uniquement). */
function ResetMotDePasse({
  clienteId,
  hasCompte,
  disabled,
}: {
  clienteId: string;
  hasCompte: boolean;
  disabled: boolean;
}) {
  const [pwd, setPwd] = useState("");
  const [msg, setMsg] = useState<
    { ok: true; password: string } | { ok: false; error: string } | null
  >(null);
  const [pending, startTransition] = useTransition();

  if (!hasCompte) {
    return (
      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">Mot de passe</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cette cliente n&apos;a pas de compte en ligne.
        </p>
      </section>
    );
  }

  function soumettre(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await reinitialiserMotDePasse(clienteId, pwd);
      setMsg(res);
      if (res.ok) setPwd("");
    });
  }

  return (
    <section className="space-y-2 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold">Réinitialiser le mot de passe</h2>
      <form onSubmit={soumettre} className="flex gap-2">
        <input
          type="text"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Nouveau mot de passe (8+)"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={disabled || pending || pwd.trim().length < 8}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {pending ? "…" : "Changer"}
        </button>
      </form>
      {msg?.ok && (
        <p className="text-sm text-success">
          Nouveau mot de passe défini :{" "}
          <span className="font-mono font-semibold">{msg.password}</span>{" "}
          (communique-le à la cliente).
        </p>
      )}
      {msg && !msg.ok && (
        <p className="text-sm text-danger" role="alert">
          {msg.error}
        </p>
      )}
    </section>
  );
}

/** Bloc de suppression (confirmation en deux temps). */
function SupprimerCliente({
  clienteId,
  prenom,
}: {
  clienteId: string;
  prenom: string;
}) {
  const [confirme, setConfirme] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <section className="space-y-2 rounded-2xl border border-danger/40 bg-danger/5 p-4">
      <h2 className="text-sm font-semibold text-danger">Supprimer la cliente</h2>
      <p className="text-sm text-muted-foreground">
        Supprime définitivement {prenom}, sa carte, ses passages et son compte.
        Irréversible.
      </p>
      {confirme ? (
        <div className="flex gap-2">
          <button
            onClick={() =>
              startTransition(async () => {
                await supprimerCliente(clienteId);
              })
            }
            disabled={pending}
            className="rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Suppression…" : "Oui, supprimer définitivement"}
          </button>
          <button
            onClick={() => setConfirme(false)}
            disabled={pending}
            className="rounded-xl border border-border px-4 py-2 text-sm"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirme(true)}
          className="rounded-xl border border-danger px-4 py-2 text-sm font-semibold text-danger"
        >
          Supprimer…
        </button>
      )}
    </section>
  );
}
