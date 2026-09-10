"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  chercherCliente,
  ajouterPassage,
  marquerRecompenseUtilisee,
} from "@/lib/scan-actions";
import type { ScanInfo, ScanResult } from "@/lib/types";

// Type minimal de l'instance html5-qrcode (import dynamique côté client).
type Html5QrcodeInstance = {
  start: (
    camera: { facingMode: string },
    config: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError: (msg: string) => void,
  ) => Promise<void>;
  stop: () => Promise<void>;
  clear: () => void;
};

const READER_ID = "qr-reader";

export default function Scanner() {
  const [info, setInfo] = useState<ScanInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [pending, startTransition] = useTransition();

  const scannerRef = useRef<Html5QrcodeInstance | null>(null);
  const busyRef = useRef(false); // évite les scans multiples en rafale

  // Applique le résultat d'une action serveur à l'état local.
  function appliquer(res: ScanResult) {
    if (res.ok) {
      setInfo(res.info);
      setError(null);
    } else {
      setError(res.error);
    }
  }

  async function stopScan() {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {
        // caméra déjà arrêtée : sans conséquence
      }
    }
  }

  async function startScan() {
    if (scannerRef.current) return;
    setCameraError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const instance = new Html5Qrcode(READER_ID) as unknown as Html5QrcodeInstance;
      scannerRef.current = instance;
      await instance.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (busyRef.current) return;
          busyRef.current = true;
          void (async () => {
            await stopScan();
            startTransition(async () => {
              appliquer(await chercherCliente(decodedText));
              busyRef.current = false;
            });
          })();
        },
        () => {
          // erreurs de décodage image par image : ignorées
        },
      );
    } catch {
      setCameraError(
        "Impossible d'accéder à la caméra. Autorise l'accès ou utilise la saisie manuelle.",
      );
      scannerRef.current = null;
    }
  }

  // Démarre la caméra tant qu'aucune cliente n'est affichée.
  useEffect(() => {
    if (!info) void startScan();
    return () => {
      void stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info]);

  function chercherManuel(e: React.FormEvent) {
    e.preventDefault();
    const code = manual.trim();
    if (!code) return;
    startTransition(async () => {
      appliquer(await chercherCliente(code));
      setManual("");
    });
  }

  function validerPassage() {
    if (!info) return;
    startTransition(async () => {
      appliquer(await ajouterPassage(info.clienteId));
    });
  }

  function utiliserRecompense() {
    if (!info) return;
    startTransition(async () => {
      appliquer(await marquerRecompenseUtilisee(info.clienteId));
    });
  }

  function nouvelleCliente() {
    setInfo(null);
    setError(null);
    // startScan() sera relancé par l'effet quand info repasse à null.
  }

  // --- Vue : caméra + saisie manuelle (aucune cliente sélectionnée) ---------
  if (!info) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Scanner</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vise le QR code de la carte de la cliente.
          </p>
        </div>

        <div
          id={READER_ID}
          className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl border border-border bg-black/5"
        />

        {cameraError && (
          <p className="text-sm text-danger" role="alert">
            {cameraError}
          </p>
        )}
        {error && (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        {/* Saisie manuelle en secours si le scan échoue */}
        <form
          onSubmit={chercherManuel}
          className="space-y-2 rounded-2xl border border-border bg-surface p-4"
        >
          <label htmlFor="manual" className="text-sm font-medium">
            Le scan ne marche pas ? Saisis le code
          </label>
          <div className="flex gap-2">
            <input
              id="manual"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Code de la carte"
              className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-60"
            >
              OK
            </button>
          </div>
        </form>
      </div>
    );
  }

  // --- Vue : fiche de la cliente après identification -----------------------
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Cliente</p>
          <h1 className="text-2xl font-bold text-primary">{info.prenom}</h1>
        </div>
        <button
          onClick={nouvelleCliente}
          className="text-sm text-muted-foreground underline"
        >
          Scanner une autre
        </button>
      </header>

      {/* Compteur de cases */}
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
          {info.recompensesDisponibles >= 1 ? (
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
      </section>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={validerPassage}
          disabled={pending}
          className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition active:scale-[0.99] disabled:opacity-60"
        >
          {pending ? "…" : "＋ Valider un passage"}
        </button>

        {info.recompensesDisponibles >= 1 && (
          <button
            onClick={utiliserRecompense}
            disabled={pending}
            className="w-full rounded-xl border border-success px-4 py-3 font-semibold text-success transition active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? "…" : "✓ Marquer la récompense utilisée"}
          </button>
        )}
      </div>

      {/* Historique des passages */}
      <section className="rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-semibold">Derniers passages</h2>
        {info.historique.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun passage pour l&apos;instant.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-border text-sm">
            {info.historique.map((p) => (
              <li key={p.id} className="py-2 text-muted-foreground">
                {new Date(p.created_at).toLocaleString("fr-FR", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-muted-foreground">
          {info.totalPassages} passage{info.totalPassages > 1 ? "s" : ""} au
          total.
        </p>
      </section>
    </div>
  );
}
