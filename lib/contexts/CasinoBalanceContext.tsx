"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { casino } from "@/lib/casino/client";
import { useAuth } from "@/lib/hooks/useAuth";

interface CasinoBalanceValue {
  balanceCents: number | null;
  testMode: boolean;
  loading: boolean;
  refresh: () => void;
  setBalance: (cents: number) => void;
  faucet: () => Promise<void>;
}

const CasinoBalanceContext = createContext<CasinoBalanceValue>({
  balanceCents: null,
  testMode: true,
  loading: false,
  refresh: () => {},
  setBalance: () => {},
  faucet: async () => {},
});

export function CasinoBalanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balanceCents, setBalanceCents] = useState<number | null>(null);
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!user) {
      setBalanceCents(null);
      return;
    }
    setLoading(true);
    casino
      .getBalance()
      .then((b) => {
        setBalanceCents(b.balanceCents);
        setTestMode(b.testMode);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // Fetch once when the user logs in. Games keep the value fresh locally by
  // calling setBalance with the balance the API already returns per action —
  // no polling, no refetch per bet.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const faucet = useCallback(async () => {
    try {
      const r = await casino.faucet();
      setBalanceCents(r.balanceCents);
    } catch {
      /* capped / disabled */
    }
  }, []);

  return (
    <CasinoBalanceContext.Provider
      value={{ balanceCents, testMode, loading, refresh, setBalance: setBalanceCents, faucet }}
    >
      {children}
    </CasinoBalanceContext.Provider>
  );
}

export function useCasinoBalance() {
  return useContext(CasinoBalanceContext);
}
