/**
 * Live Gno.land Onyx (onyx-1) RPC & On-Chain Proof Verifier.
 * Speaks native Tendermint/TM2 ABCI JSON-RPC directly from the browser
 * (rpc.onyx.testnets.gno.land serves Access-Control-Allow-Origin: *).
 */

import { CORE_PKG_PATH, DEPLOYER_NAMESPACE, REALM_PKG_PATH } from "./engine.js";

export const ONYX_RPC_URL = "https://rpc.onyx.testnets.gno.land:443";
export const ONYX_GNOWEB_URL = "https://onyx.testnets.gno.land";
export const ONYX_CHAIN_ID = "onyx-1";

export interface DeploymentArtifactSpec {
  id: "core" | "realm";
  label: string;
  kind: string;
  pkgPath: string;
  gnowebUrl: string;
  expectedBlockHeight: number;
  expectedGasUsed: number;
  txHashBase64: string;
  txHashHex: string;
  txRpcUrl: string;
}

export const ONYX_ARTIFACTS: DeploymentArtifactSpec[] = [
  {
    id: "core",
    label: "hearthcore/v0",
    kind: "Pure Package (/p/)",
    pkgPath: CORE_PKG_PATH,
    gnowebUrl: `${ONYX_GNOWEB_URL}/p/${DEPLOYER_NAMESPACE}/hearthcore/v0`,
    expectedBlockHeight: 1_374_766,
    expectedGasUsed: 33_928_050,
    txHashBase64: "VLLOf6ww1xr4Dw+UgYcF2Mls1Y2QBP2aDsXfgy2hyxo=",
    txHashHex: "0x54B2CE7FAC30D71AF80F0F94818705D8C96CD58D9004FD9A0EC5DF832DA1CB1A",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0x54B2CE7FAC30D71AF80F0F94818705D8C96CD58D9004FD9A0EC5DF832DA1CB1A`,
  },
  {
    id: "realm",
    label: "hearthbounty/v0",
    kind: "Stateful Realm (/r/)",
    pkgPath: REALM_PKG_PATH,
    gnowebUrl: `${ONYX_GNOWEB_URL}/r/${DEPLOYER_NAMESPACE}/hearthbounty/v0`,
    expectedBlockHeight: 1_374_813,
    expectedGasUsed: 94_047_145,
    txHashBase64: "uyaie8SBIqyLYrtwzYFdYjtRbPkztxVhV9FiVR6NC8U=",
    txHashHex: "0xBB26A27BC48122AC8B62BB70CD815D623B516CF933B7156157D162551E8D0BC5",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xBB26A27BC48122AC8B62BB70CD815D623B516CF933B7156157D162551E8D0BC5`,
  },
];

export interface LivePkgMeta {
  path: string;
  status: "live" | "inert" | "absent" | "unknown";
  creator?: string;
  height?: number;
  maxDeposit?: string;
  reason?: string;
  pending?: boolean;
  raw?: string;
}

export interface LiveTxProof {
  verified: boolean;
  height?: number;
  gasUsed?: number;
  gasWanted?: number;
  hash?: string;
  error?: string;
}

export interface OnyxSnapshot {
  fetchedAt: string;
  latencyMs: number;
  online: boolean;
  error?: string;
  node?: {
    network: string;
    moniker: string;
    latestBlockHeight: number;
    latestBlockTime: string;
    catchingUp: boolean;
  };
  coreMeta?: LivePkgMeta;
  realmMeta?: LivePkgMeta;
  coreTx?: LiveTxProof;
  realmTx?: LiveTxProof;
  liveRealmStats?: Record<string, unknown> | null;
}

function utf8ToHex(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64ToUtf8(b64: string): string {
  if (!b64) return "";
  if (typeof atob === "function") {
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(b64, "base64").toString("utf8");
}

async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs = 8_000,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetchImpl(url, { signal: controller.signal });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    return (await resp.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function queryOnyxAbci(
  path: string,
  data: string,
  rpcUrl = ONYX_RPC_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const qs = new URLSearchParams({
    path: `"${path}"`,
    data: `0x${utf8ToHex(data)}`,
  });
  const res = await fetchJsonWithTimeout<{
    result?: {
      response?: {
        ResponseBase?: { Error?: unknown; Data?: string | null; Log?: string };
        error?: unknown;
        data?: string | null;
        log?: string;
      };
    };
    error?: { message?: string; data?: string };
  }>(`${rpcUrl}/abci_query?${qs.toString()}`, 8_000, fetchImpl);

  if (res.error) {
    throw new Error(res.error.message ?? res.error.data ?? "ABCI error");
  }
  const base:
    | {
        Error?: unknown;
        Data?: string | null;
        Log?: string;
        error?: unknown;
        data?: string | null;
        log?: string;
      }
    | undefined = res.result?.response?.ResponseBase ?? res.result?.response;
  if (!base) throw new Error("Empty ABCI response");
  const abciErr = base.Error ?? base.error;
  if (abciErr) {
    throw new Error(base.Log ?? base.log ?? JSON.stringify(abciErr));
  }
  const b64 = base.Data ?? base.data ?? "";
  return b64 ? base64ToUtf8(b64) : "";
}

async function queryPkgMeta(
  pkgPath: string,
  rpcUrl = ONYX_RPC_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<LivePkgMeta> {
  try {
    const raw = await queryOnyxAbci("vm/qpkgmeta_json", pkgPath, rpcUrl, fetchImpl);
    if (!raw) {
      return { path: pkgPath, status: "absent" };
    }
    const parsed = JSON.parse(raw) as {
      path?: string;
      status?: string;
      creator?: string;
      height?: number;
      max_deposit?: string;
      reason?: string;
      pending?: boolean;
    };
    const st =
      parsed.status === "live" || parsed.status === "inert" || parsed.status === "absent"
        ? parsed.status
        : "unknown";
    return {
      path: parsed.path ?? pkgPath,
      status: st,
      creator: parsed.creator,
      height: parsed.height,
      maxDeposit: parsed.max_deposit,
      reason: parsed.reason,
      pending: parsed.pending,
      raw,
    };
  } catch {
    return { path: pkgPath, status: "unknown" };
  }
}

async function queryTxProof(
  txHashHex: string,
  rpcUrl = ONYX_RPC_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<LiveTxProof> {
  try {
    const res = await fetchJsonWithTimeout<{
      result?: {
        hash?: string;
        height?: string;
        tx_result?: {
          ResponseBase?: { Error?: unknown };
          GasWanted?: string;
          GasUsed?: string;
          gas_wanted?: string;
          gas_used?: string;
        };
      };
      error?: { message?: string; data?: string };
    }>(`${rpcUrl}/tx?hash=${encodeURIComponent(txHashHex)}`, 8_000, fetchImpl);

    if (res.error || !res.result) {
      return {
        verified: false,
        error: res.error?.message ?? res.error?.data ?? "TX not found",
      };
    }
    const txr = res.result.tx_result;
    const txErr = txr?.ResponseBase?.Error;
    return {
      verified: !txErr,
      height: Number(res.result.height ?? 0),
      gasUsed: Number(txr?.GasUsed ?? txr?.gas_used ?? 0),
      gasWanted: Number(txr?.GasWanted ?? txr?.gas_wanted ?? 0),
      hash: res.result.hash ?? txHashHex,
      ...(txErr ? { error: JSON.stringify(txErr) } : {}),
    };
  } catch (err) {
    return {
      verified: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function decodeQEvalString(raw: string): string {
  const trimmed = raw.trim();
  const m = trimmed.match(/^\(("[\s\S]*")\s+string\)$/);
  if (m) return JSON.parse(m[1]) as string;
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return JSON.parse(trimmed) as string;
  throw new Error("Unexpected vm/qeval tuple");
}

export async function fetchLiveOnyxSnapshot(
  rpcUrl = ONYX_RPC_URL,
  fetchImpl: typeof fetch = fetch,
): Promise<OnyxSnapshot> {
  const start = Date.now();
  try {
    const [statusRes, coreMeta, realmMeta, coreTx, realmTx] = await Promise.all([
      fetchJsonWithTimeout<{
        result?: {
          node_info?: { network?: string; moniker?: string };
          sync_info?: {
            latest_block_height?: string;
            latest_block_time?: string;
            catching_up?: boolean;
          };
        };
      }>(`${rpcUrl}/status`, 8_000, fetchImpl),
      queryPkgMeta(ONYX_ARTIFACTS[0].pkgPath, rpcUrl, fetchImpl),
      queryPkgMeta(ONYX_ARTIFACTS[1].pkgPath, rpcUrl, fetchImpl),
      queryTxProof(ONYX_ARTIFACTS[0].txHashHex, rpcUrl, fetchImpl),
      queryTxProof(ONYX_ARTIFACTS[1].txHashHex, rpcUrl, fetchImpl),
    ]);

    const info = statusRes.result?.node_info;
    const sync = statusRes.result?.sync_info;

    let liveRealmStats: Record<string, unknown> | null = null;
    if (realmMeta.status === "live") {
      try {
        const qevalRaw = await queryOnyxAbci(
          "vm/qeval",
          `${REALM_PKG_PATH}.ExportStatsJSON()`,
          rpcUrl,
          fetchImpl,
        );
        liveRealmStats = JSON.parse(decodeQEvalString(qevalRaw)) as Record<string, unknown>;
      } catch {
        liveRealmStats = null;
      }
    }

    return {
      fetchedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
      online: true,
      node: {
        network: info?.network ?? ONYX_CHAIN_ID,
        moniker: info?.moniker ?? "onyx-rpc",
        latestBlockHeight: Number(sync?.latest_block_height ?? 0),
        latestBlockTime: sync?.latest_block_time ?? "",
        catchingUp: Boolean(sync?.catching_up),
      },
      coreMeta,
      realmMeta,
      coreTx,
      realmTx,
      liveRealmStats,
    };
  } catch (err) {
    return {
      fetchedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
      online: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
