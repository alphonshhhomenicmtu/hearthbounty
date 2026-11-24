/**
 * Native Tendermint/TM2 ABCI JSON-RPC client for Gno.land nodes
 * (supports local gnodev `dev` and Onyx testnet `onyx-1`).
 */

export interface NodeStatus {
  network: string;
  moniker: string;
  latestBlockHeight: number;
  latestBlockTime: string;
  catchingUp: boolean;
}

export interface PackageMeta {
  status: "live" | "inert" | "absent" | "unknown";
  raw: string;
}

export interface RpcClientOptions {
  rpcUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Normalizes a Gno RPC URL by stripping trailing slashes.
 */
export function normalizeRpcUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/**
 * Decodes the Gno vm/qeval tuple return format for a single string result,
 * e.g. `("{\"total_bounties\":1}" string)` -> `{"total_bounties":1}`.
 */
export function decodeQEvalStringResult(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/^\(("[\s\S]*")\s+string\)$/);
  if (match) {
    return JSON.parse(match[1]) as string;
  }
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed) as string;
  }
  throw new Error(`Unexpected vm/qeval string output: ${trimmed.slice(0, 160)}`);
}

/**
 * Quotes a string argument safely for Gno vm/qeval expression syntax.
 */
export function quoteGnoExprString(value: string): string {
  return JSON.stringify(value);
}

export class GnoRpcClient {
  readonly rpcUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(options: RpcClientOptions) {
    this.rpcUrl = normalizeRpcUrl(options.rpcUrl);
    this.timeoutMs = options.timeoutMs ?? 12_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getStatus(): Promise<NodeStatus> {
    const res = await this.fetchJson<{
      result?: {
        node_info?: { network?: string; moniker?: string };
        sync_info?: {
          latest_block_height?: string;
          latest_block_time?: string;
          catching_up?: boolean;
        };
      };
      error?: { message?: string; data?: string };
    }>(`${this.rpcUrl}/status`);

    if (res.error) {
      throw new Error(`RPC /status error: ${res.error.message ?? res.error.data ?? "unknown"}`);
    }
    const info = res.result?.node_info;
    const sync = res.result?.sync_info;
    return {
      network: info?.network ?? "unknown",
      moniker: info?.moniker ?? "unknown",
      latestBlockHeight: Number(sync?.latest_block_height ?? 0),
      latestBlockTime: sync?.latest_block_time ?? "",
      catchingUp: Boolean(sync?.catching_up),
    };
  }

  async abciQuery(path: string, data: string): Promise<string> {
    const hexData = Buffer.from(data, "utf8").toString("hex");
    const qs = new URLSearchParams({
      path: `"${path}"`,
      data: `0x${hexData}`,
    });
    const res = await this.fetchJson<{
      result?: {
        response?: {
          ResponseBase?: {
            Error?: unknown;
            Data?: string | null;
            Log?: string;
          };
          error?: unknown;
          data?: string | null;
          log?: string;
        };
      };
      error?: { message?: string; data?: string };
    }>(`${this.rpcUrl}/abci_query?${qs.toString()}`);

    if (res.error) {
      throw new Error(`ABCI RPC error (${path}): ${res.error.message ?? res.error.data ?? "unknown"}`);
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
    if (!base) {
      throw new Error(`Empty ABCI query response for ${path}`);
    }

    const abciErr = base.Error ?? base.error;
    const abciLog = base.Log ?? base.log ?? "";
    if (abciErr) {
      const detail = typeof abciErr === "string" ? abciErr : JSON.stringify(abciErr);
      throw new Error(`ABCI query failed (${path}): ${abciLog || detail}`);
    }

    const b64 = base.Data ?? base.data ?? "";
    if (!b64) {
      return "";
    }
    return Buffer.from(b64, "base64").toString("utf8");
  }

  async queryPackageMeta(pkgPath: string): Promise<PackageMeta> {
    try {
      const raw = await this.abciQuery("vm/qpkgmeta_json", pkgPath);
      if (!raw) {
        return { status: "absent", raw: "" };
      }
      const parsed = JSON.parse(raw) as { status?: string };
      const st = parsed.status;
      if (st === "live" || st === "inert" || st === "absent") {
        return { status: st, raw };
      }
      return { status: "unknown", raw };
    } catch {
      return { status: "unknown", raw: "" };
    }
  }

  async queryRender(pkgPath: string, subPath = ""): Promise<string> {
    const cleanSub = subPath.replace(/^\/+/, "");
    return this.abciQuery("vm/qrender", `${pkgPath}:${cleanSub}`);
  }

  async queryEvalString(pkgPath: string, expr: string): Promise<string> {
    const raw = await this.abciQuery("vm/qeval", `${pkgPath}.${expr}`);
    return decodeQEvalStringResult(raw);
  }

  async queryEvalJSON<T>(pkgPath: string, expr: string): Promise<T> {
    const str = await this.queryEvalString(pkgPath, expr);
    return JSON.parse(str) as T;
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const resp = await this.fetchImpl(url, { signal: controller.signal });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} fetching ${url}`);
      }
      return (await resp.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }
}
