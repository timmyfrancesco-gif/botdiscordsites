/**
 * Crypto helpers shared by tenant registration (main wallets) and the
 * tenant checkout (per-order temporary wallets). Uses BlockCypher, the same
 * provider the Discord bot uses, so addresses/keys are compatible with the
 * bot's sweep logic.
 */

export interface GeneratedWallet {
  address: string;
  privateKey: string;
  wif: string;
}

export interface GenerateWalletResult {
  wallet: GeneratedWallet | null;
  error?: string;
}

/**
 * Same as generateWallet, but reports WHY it failed (missing token, rate
 * limited, invalid token, etc.) instead of a silent null — needed so
 * checkout errors are actually diagnosable instead of a generic
 * "could not create payment wallet".
 */
export async function generateWalletVerbose(chain: "ltc" | "btc"): Promise<GenerateWalletResult> {
  const token = process.env.BLOCKCYPHER_TOKEN;
  if (!token) return { wallet: null, error: "BLOCKCYPHER_TOKEN is not configured on the server" };

  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/${chain}/main/addrs?token=${token}`,
      { method: "POST" }
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      let reason = `BlockCypher error ${res.status}`;
      if (res.status === 429) reason = "BlockCypher rate limit reached, try again shortly";
      else if (res.status === 401 || res.status === 403) reason = "BlockCypher token is invalid or unauthorized";
      console.error(`[generateWallet] ${chain} POST /addrs -> ${res.status}: ${body.slice(0, 300)}`);
      return { wallet: null, error: reason };
    }
    const data = await res.json();
    if (!data?.address) return { wallet: null, error: "BlockCypher response missing an address" };
    return {
      wallet: {
        address: data.address as string,
        privateKey: data.private as string,
        wif: data.wif as string,
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "network error";
    console.error(`[generateWallet] ${chain} request failed:`, msg);
    return { wallet: null, error: `Could not reach BlockCypher: ${msg}` };
  }
}

export async function generateWallet(chain: "ltc" | "btc"): Promise<GeneratedWallet | null> {
  return (await generateWalletVerbose(chain)).wallet;
}

/**
 * Current LTC price in EUR. Tries CoinGecko, then Binance (LTCEUR) as a
 * fallback. Returns null only if every source is unavailable so callers can
 * fail the order rather than quote a wrong amount.
 */
export async function getLtcPriceEur(): Promise<number | null> {
  // Primary: CoinGecko
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=eur",
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const price = data?.litecoin?.eur;
      if (typeof price === "number" && price > 0) return price;
    }
  } catch {
    // fall through to backup
  }

  // Backup: Binance spot
  try {
    const res = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=LTCEUR",
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const price = Number(data?.price);
      if (Number.isFinite(price) && price > 0) return price;
    }
  } catch {
    // give up
  }

  return null;
}

/**
 * Total amount (in LTC) ever received by an address, plus the highest
 * confirmation count seen. Used by the settle endpoint as a defense-in-depth
 * check that an order was actually paid. Returns null if the lookup fails.
 */
export async function getAddressReceived(
  chain: "ltc" | "btc",
  address: string
): Promise<{ receivedLtc: number; confirmations: number } | null> {
  const token = process.env.BLOCKCYPHER_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/${chain}/main/addrs/${address}?token=${token}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const litoshis = Number(data?.total_received ?? 0);
    if (!Number.isFinite(litoshis)) return null;
    // Highest confirmation count across recent txrefs
    let confirmations = 0;
    const refs = Array.isArray(data?.txrefs) ? data.txrefs : [];
    for (const r of refs) {
      const c = Number(r?.confirmations ?? 0);
      if (Number.isFinite(c) && c > confirmations) confirmations = c;
    }
    return { receivedLtc: litoshis / 1e8, confirmations };
  } catch {
    return null;
  }
}
