"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { casino, eur, type FootballMatch, type FootballBet } from "@/lib/casino/client";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCasinoBalance } from "@/lib/contexts/CasinoBalanceContext";

type Sel = "home" | "draw" | "away";

export default function Football() {
  const { user } = useAuth();
  const { balanceCents, setBalance } = useCasinoBalance();
  const [matches, setMatches] = useState<FootballMatch[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [bets, setBets] = useState<FootballBet[]>([]);
  const [slip, setSlip] = useState<{ match: FootballMatch; sel: Sel } | null>(null);
  const [stake, setStake] = useState("1.00");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    casino
      .footballMatches()
      .then((r) => {
        setMatches(r.matches);
        setConfigured(r.configured);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Errore"));
    casino.footballMyBets().then((r) => setBets(r.bets)).catch(() => {});
  }, [user]);

  async function placeBet() {
    if (!slip) return;
    setError(null);
    const stakeCents = Math.round(parseFloat(stake) * 100);
    if (!Number.isFinite(stakeCents) || stakeCents < 10) {
      setError("Puntata minima €0.10");
      return;
    }
    setBusy(true);
    try {
      const r = await casino.footballBet(slip.match.fixtureId, slip.sel, stakeCents);
      setBalance(r.balanceCents);
      setFlash(`Scommessa piazzata · possibile vincita ${eur(r.bet.potentialCents)}`);
      setTimeout(() => setFlash(null), 6000);
      setSlip(null);
      casino.footballMyBets().then((res) => setBets(res.bets)).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-border bg-background-elevated/40 p-8 text-center">
        <p className="text-sm text-muted">Accedi per scommettere.</p>
        <Link href="/login" className="mt-4 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-background">Accedi</Link>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-sm text-muted">
        Le scommesse calcio non sono ancora configurate (manca la chiave API-Football).
      </div>
    );
  }

  const selLabel = (m: FootballMatch, s: Sel) => (s === "home" ? m.home : s === "away" ? m.away : "Pareggio");

  return (
    <div className="flex flex-col gap-5">
      {flash && <p className="rounded-xl bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-300">{flash}</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}

      {/* Matches */}
      <div className="flex flex-col gap-3">
        {matches === null ? (
          <p className="text-sm text-muted">Caricamento partite…</p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-muted">Nessuna partita in programma al momento.</p>
        ) : (
          matches.map((m) => (
            <div key={m.fixtureId} className="rounded-2xl border border-border bg-background-elevated/40 p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-muted">
                <span>{m.league}</span>
                <span>{m.kickoff ? new Date(m.kickoff).toLocaleString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">{m.home}</span>
                <span className="text-xs text-muted">vs</span>
                <span className="text-sm font-bold text-foreground">{m.away}</span>
              </div>
              {m.odds ? (
                <div className="grid grid-cols-3 gap-2">
                  {(["home", "draw", "away"] as Sel[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => { setSlip({ match: m, sel: s }); setError(null); }}
                      className={`flex flex-col items-center rounded-xl border px-2 py-2 transition-colors ${
                        slip?.match.fixtureId === m.fixtureId && slip.sel === s
                          ? "border-accent bg-accent-soft"
                          : "border-border bg-background/60 hover:border-accent/40"
                      }`}
                    >
                      <span className="text-[10px] uppercase tracking-wide text-muted">{s === "home" ? "1" : s === "draw" ? "X" : "2"}</span>
                      <span className="text-sm font-bold text-foreground">{m.odds![s].toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-muted">Quote non disponibili</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Bet slip */}
      {slip && (
        <div className="sticky bottom-4 rounded-2xl border border-accent/40 bg-background p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{selLabel(slip.match, slip.sel)}</p>
              <p className="text-xs text-muted">{slip.match.home} vs {slip.match.away} · quota {slip.match.odds![slip.sel].toFixed(2)}</p>
            </div>
            <button type="button" onClick={() => setSlip(null)} className="text-muted hover:text-foreground">✕</button>
          </div>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-border bg-background/60">
            <span className="flex items-center pl-4 text-accent">€</span>
            <input
              type="number"
              step="0.10"
              min="0.10"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="w-full bg-transparent px-3 py-3 text-sm text-foreground outline-none"
            />
            <div className="flex items-center px-3 text-xs text-muted">
              vincita {eur(Math.floor((parseFloat(stake) || 0) * 100 * slip.match.odds![slip.sel]))}
            </div>
          </div>
          <button
            type="button"
            onClick={placeBet}
            disabled={busy}
            className="mt-3 w-full rounded-full bg-accent py-3 text-sm font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "…" : "Piazza scommessa"}
          </button>
        </div>
      )}

      {/* My bets */}
      {bets.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-foreground">Le tue scommesse</h3>
          <div className="flex flex-col gap-2">
            {bets.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-border bg-background-elevated/30 px-4 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-foreground">{b.home} vs {b.away}</p>
                  <p className="text-xs text-muted">{b.selection === "home" ? "1" : b.selection === "draw" ? "X" : "2"} @ {b.odds.toFixed(2)} · {eur(b.stakeCents)}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  b.status === "won" ? "bg-emerald-500/15 text-emerald-400" :
                  b.status === "lost" ? "bg-rose-500/15 text-rose-400" :
                  "bg-amber-500/15 text-amber-400"
                }`}>
                  {b.status === "won" ? `Vinta +${eur(b.payoutCents)}` : b.status === "lost" ? "Persa" : "In corso"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
