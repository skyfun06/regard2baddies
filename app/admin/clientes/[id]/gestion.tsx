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
        <h1 className="y2k-display text-3xl text-primary">{info.prenom}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {telephone ? telephone : "Pas de téléphone"}
          {" · "}
          {hasCompte ? "compte en ligne" : "sans compte"}
        </p>
      </header>

      {/* Cases du cycle courant */}
      <section className="y2k-card p-6">
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: info.seuil }).map((_, i) => {
            const active = i < info.remplies;
            return (
              <div
                key={i}
                className={"y2k-slot" + (active ? " y2k-slot-on" : "")}
              >
                {active ? "✦" : ""}
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-center text-sm">
          {prete ? (
            <span className="font-semibold text-success">
              Récompense disponible : {info.valeurRecompense} €
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
        <h2 className="y2k-display text-base text-primary">Corriger les points</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => lancer(() => ajouterPassage(clienteId))}
            disabled={pending}
            className="y2k-btn px-4 py-3"
          >
            ＋ Ajouter
          </button>
          <button
            onClick={() => lancer(() => retirerDernierPassage(clienteId))}
            disabled={pending || info.totalPassages === 0}
            className="y2k-btn-outline px-4 py-3"
          >
            − Retirer
          </button>
        </div>
        {prete && (
          <button
            onClick={() => lancer(() => marquerRecompenseUtilisee(clienteId))}
            disabled={pending}
            className="y2k-btn-outline y2k-btn-success w-full px-4 py-3"
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
      <section className="y2k-card p-4">
        <h2 className="y2k-display text-base text-primary">Mot de passe</h2>
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
    <section className="y2k-card space-y-2 p-4">
      <h2 className="y2k-display text-base text-primary">Réinitialiser le mot de passe</h2>
      <form onSubmit={soumettre} className="flex gap-2">
        <input
          type="text"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="Nouveau mot de passe (8+)"
          autoComplete="off"
          className="y2k-input min-w-0 flex-1 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={disabled || pending || pwd.trim().length < 8}
          className="y2k-btn px-4 py-2 text-sm"
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
    <section className="space-y-2 rounded-2xl border border-danger/50 bg-danger/5 p-4">
      <h2 className="y2k-display text-base text-danger">Supprimer la cliente</h2>
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
            className="y2k-btn y2k-btn-danger px-4 py-2 text-sm"
          >
            {pending ? "Suppression…" : "Oui, supprimer définitivement"}
          </button>
          <button
            onClick={() => setConfirme(false)}
            disabled={pending}
            className="y2k-btn-outline px-4 py-2 text-sm"
          >
            Annuler
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirme(true)}
          className="y2k-btn-outline y2k-btn-danger px-4 py-2 text-sm"
        >
          Supprimer…
        </button>
      )}
    </section>
  );
}
