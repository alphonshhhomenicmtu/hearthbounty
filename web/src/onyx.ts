/**
 * Live Gno.land Onyx (onyx-1) RPC & On-Chain Proof Verifier.
 * Speaks native Tendermint/TM2 ABCI JSON-RPC directly from the browser
 * (rpc.onyx.testnets.gno.land serves Access-Control-Allow-Origin: *).
 */

import {
  CORE_PKG_PATH,
  DEPLOYER_NAMESPACE,
  GUILD_PKG_PATH,
  LEGACY_V0_PKG_PATH,
  REALM_PKG_PATH,
} from "./engine.js";

export const ONYX_RPC_URL = "https://rpc.onyx.testnets.gno.land:443";
export const ONYX_GNOWEB_URL = "https://onyx.testnets.gno.land";
export const ONYX_CHAIN_ID = "onyx-1";

export interface DeploymentArtifactSpec {
  id: "core" | "v1" | "guild" | "v0_legacy";
  label: string;
  kind: string;
  pkgPath: string;
  gnowebUrl: string;
  expectedBlockHeight: number;
  expectedGasUsed: number;
  txHashBase64: string;
  txHashHex: string;
  txRpcUrl: string;
  note: string;
  legacy?: boolean;
}

export interface SeededTxSpec {
  label: string;
  func: string;
  blockHeight: number;
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
    note: "Stateless integer split math, tier engine, RFC-8259 JSON builder, and deterministic p/nt/svg/v0 charts.",
  },
  {
    id: "v1",
    label: "hearthbounty/v1",
    kind: "Hardened Escrow Realm (/r/)",
    pkgPath: REALM_PKG_PATH,
    gnowebUrl: `${ONYX_GNOWEB_URL}/r/${DEPLOYER_NAMESPACE}/hearthbounty/v1`,
    expectedBlockHeight: 1_378_958,
    expectedGasUsed: 126_117_131,
    txHashBase64: "6nxEN7Y1zA36gpW5sf132RE7ASyobn4KTlJZcjy1LPw=",
    txHashHex: "0xEA7C4437B635CC0DFA8295B9B1FD77D9113B012CA86E7E0A4E5259723CB52CFC",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xEA7C4437B635CC0DFA8295B9B1FD77D9113B012CA86E7E0A4E5259723CB52CFC`,
    note: "V2.1 production realm: 1:1 wugnot grc20reg escrow (zero chain/banker), H-1 per-donor custody, M-1 review/dispute timeouts, M-2 Unicode-safe sanitizer.",
  },
  {
    id: "guild",
    label: "hearthguild/v0",
    kind: "Companion Consumer Realm (/r/)",
    pkgPath: GUILD_PKG_PATH,
    gnowebUrl: `${ONYX_GNOWEB_URL}/r/${DEPLOYER_NAMESPACE}/hearthguild/v0`,
    expectedBlockHeight: 1_378_960,
    expectedGasUsed: 17_437_231,
    txHashBase64: "v/aJvEmlmvVsyFosn7DHsO1E8iQoaqhpFrN1IWvUx18=",
    txHashHex: "0xBFF689BC49A59AF56CC85A2C9FB0C7B0ED44F224286AA86916B375216BD4C75F",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xBFF689BC49A59AF56CC85A2C9FB0C7B0ED44F224286AA86916B375216BD4C75F`,
    note: "Composable builder passport & peer endorsement realm importing both hearthcore/v0 and hearthbounty/v1.",
  },
  {
    id: "v0_legacy",
    label: "hearthbounty/v0 (Legacy)",
    kind: "Superseded Prototype (/r/)",
    pkgPath: LEGACY_V0_PKG_PATH,
    gnowebUrl: `${ONYX_GNOWEB_URL}/r/${DEPLOYER_NAMESPACE}/hearthbounty/v0`,
    expectedBlockHeight: 1_374_813,
    expectedGasUsed: 94_047_145,
    txHashBase64: "uyaie8SBIqyLYrtwzYFdYjtRbPkztxVhV9FiVR6NC8U=",
    txHashHex: "0xBB26A27BC48122AC8B62BB70CD815D623B516CF933B7156157D162551E8D0BC5",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xBB26A27BC48122AC8B62BB70CD815D623B516CF933B7156157D162551E8D0BC5`,
    note: "Superseded by hearthbounty/v1. Remains inert on Onyx because automated GPAO holds realms importing chain/banker for manual review.",
    legacy: true,
  },
];

// Confirmed live Onyx (onyx-1) transactions against Genesis wugnot and live hearthbounty/v1.
export const ONYX_SEEDED_TXS: SeededTxSpec[] = [
  {
    label: "1. Wrap 10.00 GNOT into Genesis wugnot",
    func: "wugnot.Deposit",
    blockHeight: 1_379_191,
    txHashHex: "0x102266AD74577A10CD9A4A7AF622D596FA37D77E54DAE1BE957FD0448594D403",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0x102266AD74577A10CD9A4A7AF622D596FA37D77E54DAE1BE957FD0448594D403`,
  },
  {
    label: "2. Approve hearthbounty/v1 escrow spender",
    func: "wugnot.Approve",
    blockHeight: 1_379_193,
    txHashHex: "0x85D97BB7F76B0DD6F3F6321AB8D1825B8E7310F427243EFE4A34EC972CBC5A63",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0x85D97BB7F76B0DD6F3F6321AB8D1825B8E7310F427243EFE4A34EC972CBC5A63`,
  },
  {
    label: "3. Register sponsor profile (tavern-keeper)",
    func: "RegisterProfile",
    blockHeight: 1_380_051,
    txHashHex: "0xF89F4B56F4D0B269E8F925446A8D03D63D8EB7E53A0F18217180BD4BFD0504CA",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xF89F4B56F4D0B269E8F925446A8D03D63D8EB7E53A0F18217180BD4BFD0504CA`,
  },
  {
    label: "4. Register AI agent profile (anvil-onyx-agent)",
    func: "RegisterProfile",
    blockHeight: 1_380_053,
    txHashHex: "0xAA36855F276B94A086B3FCF3A7A51DE73CA96D54D590188B18271B8913D403E2",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xAA36855F276B94A086B3FCF3A7A51DE73CA96D54D590188B18271B8913D403E2`,
  },
  {
    label: "5. Post Bounty #1 (2.00 GNOT · Core Realm)",
    func: "PostBounty",
    blockHeight: 1_380_073,
    txHashHex: "0xCCE5FF6BD22AA0829F9C07CB1BE1F6F0492C18B0863327FFC3DDD1BB4FE01085",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xCCE5FF6BD22AA0829F9C07CB1BE1F6F0492C18B0863327FFC3DDD1BB4FE01085`,
  },
  {
    label: "6. Claim Bounty #1 (anvil-onyx-agent)",
    func: "ClaimBounty",
    blockHeight: 1_380_075,
    txHashHex: "0x66AE74C793D1BD0D05E4A64B7EB5E6939B1F2A2A15039C67EBFA3C5AF8F58E5D",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0x66AE74C793D1BD0D05E4A64B7EB5E6939B1F2A2A15039C67EBFA3C5AF8F58E5D`,
  },
  {
    label: "7. Submit HTTPS + SHA-256 Proof #1",
    func: "SubmitProof",
    blockHeight: 1_380_077,
    txHashHex: "0xEE156C2C0A62AB613111A9A9A82E1DBA259977C8B754FD9F3C6CC221BDF7F39B",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xEE156C2C0A62AB613111A9A9A82E1DBA259977C8B754FD9F3C6CC221BDF7F39B`,
  },
  {
    label: "8. Approve & Settle Bounty #1 (2.00 GNOT, 5/5)",
    func: "ApproveAndSettle",
    blockHeight: 1_380_079,
    txHashHex: "0xE9FC6F60D756D81A660E0FD19DBF5425B0926290B10FC240ADB88F603EB0E965",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xE9FC6F60D756D81A660E0FD19DBF5425B0926290B10FC240ADB88F603EB0E965`,
  },
  {
    label: "9. Post Bounty #2 (3.50 GNOT · Security Audit)",
    func: "PostBounty",
    blockHeight: 1_380_081,
    txHashHex: "0xCCCF3879482425A60A76407D374D85BEC2D410F5743D5678751217738AB2EF2C",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xCCCF3879482425A60A76407D374D85BEC2D410F5743D5678751217738AB2EF2C`,
  },
  {
    label: "10. Claim Bounty #2 (anvil-onyx-agent)",
    func: "ClaimBounty",
    blockHeight: 1_380_082,
    txHashHex: "0xB047F67DD93D75B7ACBC7AD3B9B9BBA6BEC02825CFAD10C0979E324AB3D2D708",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0xB047F67DD93D75B7ACBC7AD3B9B9BBA6BEC02825CFAD10C0979E324AB3D2D708`,
  },
  {
    label: "11. Submit Proof #2 (Awaiting Sponsor Review)",
    func: "SubmitProof",
    blockHeight: 1_380_084,
    txHashHex: "0x7B69C8415C8F9084E63630AF2BDBCC4BB01FC548B140A91C474EA12DAA277CC4",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0x7B69C8415C8F9084E63630AF2BDBCC4BB01FC548B140A91C474EA12DAA277CC4`,
  },
  {
    label: "12. Post Bounty #3 (2.50 GNOT · Open AI Track)",
    func: "PostBounty",
    blockHeight: 1_380_085,
    txHashHex: "0x0A08B7CCFB78C527F71F7EFD04B1F64E7991A55218CC177CED4BB911CEBBE0D9",
    txRpcUrl: `${ONYX_RPC_URL}/tx?hash=0x0A08B7CCFB78C527F71F7EFD04B1F64E7991A55218CC177CED4BB911CEBBE0D9`,
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
  metas: Record<DeploymentArtifactSpec["id"], LivePkgMeta>;
  txs: Record<DeploymentArtifactSpec["id"], LiveTxProof>;
  liveV1Stats?: Record<string, unknown> | null;
  liveV1Bounties?: Record<string, unknown> | null;
  liveGuildRenderPreview?: string | null;
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
  const base = res.result?.response?.ResponseBase ?? res.result?.response;
  if (!base) throw new Error("Empty ABCI response");
  const abciErr = (base as { Error?: unknown; error?: unknown }).Error ?? (base as { error?: unknown }).error;
  if (abciErr) {
    const log = (base as { Log?: string; log?: string }).Log ?? (base as { log?: string }).log;
    throw new Error(log ?? JSON.stringify(abciErr));
  }
  const b64 = (base as { Data?: string | null; data?: string | null }).Data ?? (base as { data?: string | null }).data ?? "";
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
  const emptyMetas = {} as Record<DeploymentArtifactSpec["id"], LivePkgMeta>;
  const emptyTxs = {} as Record<DeploymentArtifactSpec["id"], LiveTxProof>;

  try {
    const [statusRes, metaList, txList] = await Promise.all([
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
      Promise.all(ONYX_ARTIFACTS.map((a) => queryPkgMeta(a.pkgPath, rpcUrl, fetchImpl))),
      Promise.all(ONYX_ARTIFACTS.map((a) => queryTxProof(a.txHashHex, rpcUrl, fetchImpl))),
    ]);

    ONYX_ARTIFACTS.forEach((a, i) => {
      emptyMetas[a.id] = metaList[i];
      emptyTxs[a.id] = txList[i];
    });

    const info = statusRes.result?.node_info;
    const sync = statusRes.result?.sync_info;

    let liveV1Stats: Record<string, unknown> | null = null;
    let liveV1Bounties: Record<string, unknown> | null = null;
    if (emptyMetas.v1?.status === "live") {
      try {
        const [statsRaw, bountiesRaw] = await Promise.all([
          queryOnyxAbci("vm/qeval", `${REALM_PKG_PATH}.ExportStatsJSON()`, rpcUrl, fetchImpl),
          queryOnyxAbci("vm/qeval", `${REALM_PKG_PATH}.ExportBountiesJSON("", "", 0, 10)`, rpcUrl, fetchImpl),
        ]);
        liveV1Stats = JSON.parse(decodeQEvalString(statsRaw)) as Record<string, unknown>;
        liveV1Bounties = JSON.parse(decodeQEvalString(bountiesRaw)) as Record<string, unknown>;
      } catch {
        liveV1Stats = null;
      }
    }

    let liveGuildRenderPreview: string | null = null;
    if (emptyMetas.guild?.status === "live") {
      try {
        const rendered = await queryOnyxAbci("vm/qrender", `${GUILD_PKG_PATH}:`, rpcUrl, fetchImpl);
        liveGuildRenderPreview = rendered.slice(0, 600);
      } catch {
        liveGuildRenderPreview = null;
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
      metas: emptyMetas,
      txs: emptyTxs,
      liveV1Stats,
      liveV1Bounties,
      liveGuildRenderPreview,
    };
  } catch (err) {
    return {
      fetchedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
      online: false,
      error: err instanceof Error ? err.message : String(err),
      metas: emptyMetas,
      txs: emptyTxs,
    };
  }
}
