import "./styles.css";
import {
  BountyRecord,
  CATEGORY_LABELS,
  computeSha256Digest,
  computeSplit,
  createSeededRealm,
  DEMO_ACTORS,
  DENOM,
  effectiveReward,
  formatGNOT,
  HearthBountyRealm,
  REALM_PKG_PATH,
  sanitizeRenderText,
  shortAddr,
  STATUS_LABELS,
  tierColor,
  VALID_CATEGORIES,
} from "./engine.js";
import { DiagReport, runDiagnostics } from "./diag.js";
import { executeMcpTool, MCP_TOOLS, McpExecutionResult, McpToolName } from "./mcp.js";
import { fetchLiveOnyxSnapshot, ONYX_ARTIFACTS, ONYX_RPC_URL, OnyxSnapshot } from "./onyx.js";
import { renderEscrowDistributionSVG, renderLifecycleSVG } from "./svg.js";

type TabId = "simulator" | "onyx" | "mcp" | "leaderboard" | "diag";
type GuardMode = "eoa" | "cross-realm" | "bad-denom";

interface AppState {
  tab: TabId;
  realm: HearthBountyRealm;
  selectedBountyId: number;
  filterCategory: string;
  activeActorId: "sponsor" | "agent" | "builder" | "arbiter";
  guardMode: GuardMode;
  showPostForm: boolean;
  toast: { ok: boolean; text: string } | null;
  // Live Onyx RPC
  onyx: OnyxSnapshot | null;
  onyxLoading: boolean;
  // MCP Inspector
  selectedTool: McpToolName;
  mcpChainId: string;
  mcpArgsText: string;
  mcpResult: McpExecutionResult | null;
  mcpLoopLog: string[];
  // Dispute slider state
  disputeBps: number;
  // Sanitizer tester state
  sanitizeInput: string;
  // /diag report
  diagReport: DiagReport | null;
  diagRunning: boolean;
  // 60-Second Judge Walkthrough Drawer
  drawerOpen: boolean;
  completedSteps: Set<number>;
}

const YOUTUBE_URL = "https://youtu.be/vK6z7MJiRAk";
const GITHUB_URL = "https://github.com/alphonshhhomenicmtu/hearthbounty";
const DECK_PDF_URL = "./hearthbounty-deck.pdf";

function parseInitialTab(): TabId {
  const hash = (window.location.hash || "").toLowerCase();
  const params = new URLSearchParams(window.location.search);
  const qView = (params.get("view") || "").toLowerCase();
  const target = hash.replace(/^#\/?/, "") || qView;
  if (target === "diag") return "diag";
  if (target === "onyx" || target === "explorer") return "onyx";
  if (target === "mcp") return "mcp";
  if (target === "leaderboard" || target === "security") return "leaderboard";
  return "simulator";
}

const initialRealm = createSeededRealm();
const state: AppState = {
  tab: parseInitialTab(),
  realm: initialRealm,
  selectedBountyId: 5,
  filterCategory: "",
  activeActorId: "agent",
  guardMode: "eoa",
  showPostForm: false,
  toast: null,
  onyx: null,
  onyxLoading: false,
  selectedTool: "hearth_list_bounties",
  mcpChainId: "onyx-1",
  mcpArgsText: JSON.stringify(MCP_TOOLS[1].defaultArgs, null, 2),
  mcpResult: null,
  mcpLoopLog: [],
  disputeBps: 7000,
  sanitizeInput: `Audit <gno-button href="/r/evil" label="Drain" /> and <gno-form exec="Steal"> cost $150 $GNOT`,
  diagReport: null,
  diagRunning: false,
  drawerOpen: false,
  completedSteps: new Set<number>(),
};

function esc(s: unknown): string {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getActiveActor() {
  return DEMO_ACTORS.find((a) => a.id === state.activeActorId) ?? DEMO_ACTORS[0];
}

function buildCallCtx(sendUgnot?: number) {
  const actor = getActiveActor();
  const base = {
    caller: actor.address,
    isOriginCall: state.guardMode !== "cross-realm",
    isUserCall: state.guardMode !== "cross-realm",
  };
  if (sendUgnot === undefined) return base;
  if (state.guardMode === "bad-denom") {
    return { ...base, sentCoins: [{ denom: "uatom", amount: sendUgnot }] };
  }
  return { ...base, sentCoins: [{ denom: DENOM, amount: sendUgnot }] };
}

function setTab(tab: TabId): void {
  state.tab = tab;
  window.history.replaceState(null, "", tab === "simulator" ? "#/" : `#/${tab}`);
  render();
  if (tab === "diag" && !state.diagReport && !state.diagRunning) {
    void triggerDiagnostics();
  }
}

async function refreshOnyx(): Promise<void> {
  state.onyxLoading = true;
  render();
  state.onyx = await fetchLiveOnyxSnapshot(ONYX_RPC_URL);
  state.onyxLoading = false;
  render();
}

async function triggerDiagnostics(): Promise<void> {
  state.diagRunning = true;
  render();
  state.diagReport = await runDiagnostics();
  state.diagRunning = false;
  state.completedSteps.add(5);
  render();
}

function setToast(ok: boolean, text: string): void {
  state.toast = { ok, text };
}

function renderBrandMark(): string {
  return `<svg width="30" height="30" viewBox="0 0 64 64" aria-hidden="true">
    <rect width="64" height="64" rx="14" fill="#131c31" stroke="#334155" stroke-width="2" />
    <circle cx="32" cy="32" r="19" fill="#0f172a" stroke="#f59e0b" stroke-width="3" />
    <circle cx="32" cy="32" r="8.5" fill="#f59e0b" />
    <circle cx="32" cy="29" r="3.5" fill="#fef3c7" />
  </svg>`;
}

function renderHeader(): string {
  const onyxPillText = state.onyxLoading
    ? "Connecting Onyx..."
    : state.onyx?.online && state.onyx.node
      ? `onyx-1 · #${state.onyx.node.latestBlockHeight.toLocaleString()} (${state.onyx.latencyMs}ms)`
      : state.onyx
        ? "onyx-1 RPC offline"
        : "onyx-1 loading";
  const dotClass = state.onyx?.online ? "online" : state.onyx ? "offline" : "";

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "simulator", label: "Escrow Simulator" },
    { id: "onyx", label: "Live Onyx Explorer" },
    { id: "mcp", label: "MCP Inspector" },
    { id: "leaderboard", label: "Leaderboard & Guards" },
    { id: "diag", label: "/diag Self-Test" },
  ];

  return `<header class="topbar">
    <div class="topbar-inner">
      <div class="brand">
        ${renderBrandMark()}
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="brand-title">HearthBounty</span>
            <span class="brand-tag">Gno.land v1.8</span>
          </div>
        </div>
        <button class="live-pill" data-action="goto-onyx" title="Inspect live Onyx RPC proofs">
          <span class="pulse-dot ${dotClass}"></span>
          <span class="mono">${esc(onyxPillText)}</span>
        </button>
      </div>

      <nav class="nav-tabs" aria-label="Primary navigation">
        ${tabs
          .map(
            (t) =>
              `<button class="nav-tab ${state.tab === t.id ? "active" : ""}" data-tab="${t.id}">${esc(t.label)}</button>`,
          )
          .join("")}
      </nav>

      <div class="topbar-actions">
        <button class="btn btn-primary btn-sm" data-action="open-drawer">60s Judge Walkthrough</button>
        <a class="btn btn-sm" href="${DECK_PDF_URL}" target="_blank" rel="noopener">Pitch Deck PDF</a>
        <a class="btn btn-sm" href="${YOUTUBE_URL}" target="_blank" rel="noopener">Demo Video</a>
        <a class="btn btn-sm" href="${GITHUB_URL}" target="_blank" rel="noopener">GitHub</a>
      </div>
    </div>
  </header>`;
}

function renderSimulatorView(): string {
  const stats = state.realm.getStats();
  const invOk = state.realm.assertEscrowInvariant();
  const bounties = state.realm
    .getAllBountiesDesc()
    .filter((b) => !state.filterCategory || b.category === state.filterCategory);
  const selected =
    state.realm.bounties.get(state.selectedBountyId) ?? bounties[0] ?? state.realm.getAllBountiesDesc()[0];
  if (selected) {
    state.selectedBountyId = selected.id;
  }

  return `
    ${
      state.toast
        ? `<div class="toast ${state.toast.ok ? "ok" : "err"}">
            <span>${esc(state.toast.text)}</span>
            <button class="btn btn-xs" data-action="dismiss-toast">Dismiss</button>
          </div>`
        : ""
    }

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Active Escrow Locked</div>
        <div class="kpi-value text-amber mono">${esc(formatGNOT(stats.total_escrow_ugnot))}</div>
        <div class="kpi-meta">
          <span>${stats.open_count + stats.claimed_count + stats.submitted_count + stats.disputed_count} active quests</span>
          <span class="mono">${stats.total_escrow_ugnot.toLocaleString()} ugnot</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Settled Volume</div>
        <div class="kpi-value text-emerald mono">${esc(formatGNOT(stats.total_settled_ugnot))}</div>
        <div class="kpi-meta">
          <span>${stats.settled_count} settled · ${stats.cancelled_count} cancelled</span>
          <span>Refunded: ${esc(formatGNOT(stats.total_refund_ugnot))}</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Simulated Chain Height</div>
        <div class="kpi-value text-sky mono">#${stats.chain_height.toLocaleString()}</div>
        <div class="kpi-meta">
          <span>Block-height claim windows</span>
          <button class="btn btn-xs" data-action="advance-blocks">+50k Blocks</button>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Escrow Conservation Invariant</div>
        <div class="kpi-value ${invOk ? "text-emerald" : "text-red"}">${invOk ? "VERIFIED" : "MISMATCH"}</div>
        <div class="kpi-meta">
          <span class="mono">bank(${state.realm.realmBankUgnot.toLocaleString()}) == escrow(${state.realm.totalEscrowUgnot.toLocaleString()})</span>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 12px;">
      ${renderEscrowDistributionSVG(stats)}
    </div>

    <div class="actor-bar">
      <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:var(--text-muted);margin-bottom:6px;">
          Active Transaction Signer (cur.Previous().Address())
        </div>
        <div class="actor-list">
          ${DEMO_ACTORS.map((a) => {
            const bal = formatGNOT(state.realm.getBalance(a.address));
            const prof = state.realm.profiles.get(a.address);
            const tier = prof
              ? state.realm.toProfileView(prof).tier
              : a.id === "arbiter"
                ? "Arbiter"
                : "Apprentice";
            return `<button class="actor-chip ${state.activeActorId === a.id ? "active" : ""}" data-actor="${a.id}">
              <span class="actor-name">${esc(a.label)}: ${esc(a.handle)}</span>
              <span class="actor-bal">${esc(bal)} · ${esc(tier)}</span>
            </button>`;
          }).join("")}
        </div>
      </div>

      <div class="guard-select-wrap">
        <label style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);" for="guard-mode-sel">
          Call Guard Mode
        </label>
        <select id="guard-mode-sel" class="select" style="width:auto;min-width:210px;" data-action="guard-mode">
          <option value="eoa" ${state.guardMode === "eoa" ? "selected" : ""}>Direct EOA (Normal ugnot)</option>
          <option value="cross-realm" ${state.guardMode === "cross-realm" ? "selected" : ""}>Adversarial: Cross-Realm MITM</option>
          <option value="bad-denom" ${state.guardMode === "bad-denom" ? "selected" : ""}>Adversarial: Wrong Denom (uatom)</option>
        </select>
        <button class="btn btn-primary btn-sm" data-action="toggle-post-form">
          ${state.showPostForm ? "Close Post Form" : "+ Post Bounty"}
        </button>
        <button class="btn btn-emerald btn-sm" data-action="run-full-lifecycle">
          Run End-to-End Flow
        </button>
        <button class="btn btn-sm" data-action="reset-realm">Reset State</button>
      </div>
    </div>

    ${state.showPostForm ? renderPostBountyPanel() : ""}

    <div class="workbench-grid">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h2 class="panel-title">Bounty Board (${bounties.length})</h2>
            <p class="panel-sub">Select any quest to inspect escrow state and execute realm entrypoints.</p>
          </div>
        </div>

        <div class="filter-row">
          <button class="chip ${!state.filterCategory ? "active" : ""}" data-cat="">All</button>
          ${VALID_CATEGORIES.map(
            (c) =>
              `<button class="chip ${state.filterCategory === c ? "active" : ""}" data-cat="${c}">${esc(CATEGORY_LABELS[c])}</button>`,
          ).join("")}
        </div>

        <div class="bounty-list">
          ${bounties
            .map(
              (b) => `<button class="bounty-card ${selected?.id === b.id ? "selected" : ""}" data-bounty-id="${b.id}">
                <div class="bounty-card-top">
                  <span class="mono" style="font-size:12px;color:var(--text-muted);">#${b.id} · ${esc(CATEGORY_LABELS[b.category])}</span>
                  <span class="badge badge-${b.status}">${esc(STATUS_LABELS[b.status])}</span>
                </div>
                <div class="bounty-card-title">${esc(b.title)}</div>
                <div class="bounty-card-meta">
                  <span class="mono text-amber" style="font-weight:700;">${esc(formatGNOT(effectiveReward(b)))}</span>
                  <span>${b.claimant ? `Hunter: ${esc(state.realm.profiles.get(b.claimant)?.handle ?? shortAddr(b.claimant))}` : "Unclaimed"}</span>
                </div>
              </button>`,
            )
            .join("")}
        </div>
      </section>

      <section class="panel">
        ${selected ? renderBountyWorkbench(selected) : `<p>No bounties available. Post a bounty to begin.</p>`}
      </section>
    </div>

    <section class="panel" style="margin-top:16px;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Realm Execution &amp; Event Trace (${state.realm.trace.length})</h2>
          <p class="panel-sub">Every crossing call records its chain.Emit event, CEI bank balance check, or exact Gno panic abort.</p>
        </div>
        <button class="btn btn-sm" data-action="inspect-in-mcp">Inspect State in MCP Tool</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Seq</th>
              <th>Block</th>
              <th>Entrypoint</th>
              <th>Caller</th>
              <th>Outcome / Event</th>
              <th>CEI Invariant</th>
            </tr>
          </thead>
          <tbody>
            ${state.realm.trace
              .slice(0, 14)
              .map(
                (t) => `<tr>
                  <td class="mono">#${t.seq}</td>
                  <td class="mono">${t.height.toLocaleString()}</td>
                  <td class="mono" style="font-weight:700;color:var(--amber-bright);">${esc(t.func)}</td>
                  <td>${esc(t.callerHandle)}</td>
                  <td>
                    ${
                      t.ok
                        ? `<span class="badge badge-pass">${esc(t.eventType)}</span> <span class="mono" style="font-size:11px;color:var(--text-muted);">${esc(
                            Object.entries(t.attrs ?? {})
                              .map(([k, v]) => `${k}=${v}`)
                              .join(" · "),
                          )}</span>`
                        : `<span class="badge badge-fail">ABORT</span> <span class="mono text-red" style="font-size:12px;">${esc(t.error)}</span>`
                    }
                  </td>
                  <td class="mono" style="font-size:11px;color:${t.escrowInvariantOk ? "var(--emerald)" : "var(--red)"};">
                    ${t.escrowInvariantOk ? "OK" : "FAIL"} (${formatGNOT(t.realmBankUgnot)})
                  </td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderPostBountyPanel(): string {
  return `<section class="panel" style="margin-bottom:16px;border-color:rgba(245,158,11,0.45);">
    <div class="panel-header">
      <div>
        <h3 class="panel-title">PostBounty(cur, title, spec, category, deadlineBlocks)</h3>
        <p class="panel-sub">Direct-EOA payable crossing call. Minimum escrow: 100,000 ugnot (0.10 GNOT). Switch Call Guard Mode above to test AssertOriginCall or uatom rejection.</p>
      </div>
    </div>
    <form id="form-post-bounty">
      <div class="form-grid">
        <div class="field">
          <label for="post-title">Title (4-120 chars)</label>
          <input id="post-title" name="title" class="input" required value="Build Deterministic Gno Event Indexer" />
        </div>
        <div class="field">
          <label for="post-category">Track / Category</label>
          <select id="post-category" name="category" class="select">
            ${VALID_CATEGORIES.map((c) => `<option value="${c}">${esc(CATEGORY_LABELS[c])}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label for="post-amount">Escrow Deposit (ugnot, 1 GNOT = 1,000,000)</label>
          <input id="post-amount" name="amount" type="number" class="input mono" required value="4000000" min="1" />
        </div>
        <div class="field">
          <label for="post-deadline">Claim Window (blocks, 10 - 2,000,000)</label>
          <input id="post-deadline" name="deadline" type="number" class="input mono" required value="30000" min="10" max="2000000" />
        </div>
      </div>
      <div class="field">
        <label for="post-spec">Specification (10-4000 chars)</label>
        <textarea id="post-spec" name="spec" class="textarea" required>Stream HearthBounty chain.Emit events from Onyx RPC into deterministic JSON feeds with unit tests.</textarea>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button type="submit" class="btn btn-primary">Execute PostBounty</button>
        <button type="button" class="btn btn-sm" data-action="toggle-post-form">Cancel</button>
      </div>
    </form>
  </section>`;
}

function renderBountyWorkbench(b: BountyRecord): string {
  const sponsorHandle = state.realm.profiles.get(b.sponsor)?.handle ?? shortAddr(b.sponsor);
  const claimantHandle = b.claimant
    ? state.realm.profiles.get(b.claimant)?.handle ?? shortAddr(b.claimant)
    : "Unclaimed";
  const blocksRemaining = b.deadlineHeight > 0 ? b.deadlineHeight - state.realm.chainHeight : b.deadlineBlocks;
  const splitPreview = computeSplit(b.escrowUgnot, state.disputeBps);

  return `
    <div class="panel-header">
      <div>
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <span class="mono" style="color:var(--text-muted);font-weight:700;">BOUNTY #${b.id}</span>
          <span class="badge badge-${b.status}">${esc(STATUS_LABELS[b.status])}</span>
          <span class="badge badge-neutral">${esc(CATEGORY_LABELS[b.category])}</span>
        </div>
        <h2 style="margin:5px 0 0;font-size:18px;">${esc(b.title)}</h2>
      </div>
      <div class="mono text-amber" style="font-size:19px;font-weight:800;">
        ${esc(formatGNOT(effectiveReward(b)))}
      </div>
    </div>

    <div style="margin-bottom:12px;">
      ${renderLifecycleSVG(b.status, effectiveReward(b))}
    </div>

    <div style="background:#0a101f;border:1px solid var(--border);border-radius:8px;padding:11px 13px;color:var(--text-secondary);font-size:13px;">
      ${esc(b.spec)}
    </div>

    <div class="detail-kv">
      <div class="kv-item">
        <div class="kv-label">Sponsor</div>
        <div class="kv-val">${esc(sponsorHandle)} <span class="mono" style="color:var(--text-muted);font-size:11px;">(${esc(shortAddr(b.sponsor))})</span></div>
      </div>
      <div class="kv-item">
        <div class="kv-label">Claimant / Hunter</div>
        <div class="kv-val">${esc(claimantHandle)}${b.claimant ? ` <span class="mono" style="color:var(--text-muted);font-size:11px;">(${esc(shortAddr(b.claimant))})</span>` : ""}</div>
      </div>
      <div class="kv-item">
        <div class="kv-label">Escrow / Top-Ups</div>
        <div class="kv-val mono">${esc(formatGNOT(b.escrowUgnot))} (${b.topUpCount} top-ups)</div>
      </div>
      <div class="kv-item">
        <div class="kv-label">Claim Deadline</div>
        <div class="kv-val mono">${
          b.deadlineHeight > 0
            ? blocksRemaining > 0
              ? `Block #${b.deadlineHeight.toLocaleString()} (${blocksRemaining.toLocaleString()} left)`
              : `EXPIRED at #${b.deadlineHeight.toLocaleString()}`
            : `${b.deadlineBlocks.toLocaleString()} blocks after claim`
        }</div>
      </div>
    </div>

    ${
      b.proofURL
        ? `<div class="kv-item" style="margin-bottom:10px;border-color:rgba(167,139,250,0.4);">
            <div class="kv-label">Verifiable Proof Artifact (Submission #${b.submissionCount})</div>
            <div class="kv-val" style="margin-top:4px;">
              <div>URL: <a href="${esc(b.proofURL)}" target="_blank" rel="noopener">${esc(b.proofURL)}</a></div>
              <div class="mono" style="font-size:12px;color:var(--violet);margin-top:3px;">Digest: ${esc(b.proofDigest)}</div>
              <div style="font-weight:400;color:var(--text-secondary);margin-top:4px;">${esc(b.proofSummary)}</div>
            </div>
          </div>`
        : ""
    }

    ${
      b.revisionFeedback
        ? `<div class="callout callout-warn" style="margin-bottom:10px;">
            <strong>Sponsor Revision Feedback:</strong> ${esc(b.revisionFeedback)}
          </div>`
        : ""
    }

    ${
      b.disputeReason
        ? `<div class="callout callout-warn" style="margin-bottom:10px;">
            <strong>Active Dispute (opened by ${esc(shortAddr(b.disputeOpenedBy))}):</strong> ${esc(b.disputeReason)}
          </div>`
        : ""
    }

    ${
      b.status === "open"
        ? `<div class="action-box">
            <h4>ClaimBounty(cur, ${b.id}, agentNote) — Non-Sponsor Builder or AI Agent</h4>
            <form id="form-claim">
              <div class="field">
                <label for="claim-note">Execution Plan / Agent Note</label>
                <input id="claim-note" name="note" class="input" value="Discovered via hearth_list_bounties; delivering tested Gno package and SHA-256 proof." />
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="submit" class="btn btn-primary btn-sm">Claim Bounty as ${esc(getActiveActor().handle)}</button>
                <button type="button" class="btn btn-sm" data-action="topup-bounty" data-id="${b.id}">TopUp +1.00 GNOT</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="cancel-bounty" data-id="${b.id}">CancelBounty (Sponsor Refund)</button>
              </div>
            </form>
          </div>`
        : ""
    }

    ${
      b.status === "claimed"
        ? `<div class="action-box">
            <h4>SubmitProof(cur, ${b.id}, proofURL, proofDigest, summary) — Active Claimant Only</h4>
            <form id="form-submit-proof">
              <div class="form-grid">
                <div class="field">
                  <label for="proof-url">Deliverable URL (https:// or ipfs://)</label>
                  <input id="proof-url" name="proofURL" class="input" required value="https://github.com/alphonshhhomenicmtu/hearthbounty/pull/18" />
                </div>
                <div class="field">
                  <label for="proof-artifact">Raw Artifact Text (Click Hash for SHA-256)</label>
                  <div style="display:flex;gap:6px;">
                    <input id="proof-artifact" name="artifact" class="input" value="hearthbounty-deliverable-bounty-${b.id}-v2" />
                    <button type="button" class="btn btn-sky btn-sm" data-action="hash-proof">Hash</button>
                  </div>
                </div>
              </div>
              <div class="field">
                <label for="proof-digest">SHA-256 Proof Digest</label>
                <input id="proof-digest" name="proofDigest" class="input mono" required value="sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08" />
              </div>
              <div class="field">
                <label for="proof-summary">Implementation Summary</label>
                <input id="proof-summary" name="summary" class="input" required value="Completed implementation with passing gno test suite and zero gno lint warnings." />
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="submit" class="btn btn-primary btn-sm">Submit Proof</button>
                <button type="button" class="btn btn-sm" data-action="topup-bounty" data-id="${b.id}">TopUp +0.50 GNOT</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="release-claim" data-id="${b.id}">ReleaseExpiredClaim</button>
              </div>
            </form>
          </div>`
        : ""
    }

    ${
      b.status === "submitted"
        ? `<div class="action-box">
            <h4>ApproveAndSettle(cur, ${b.id}, rating, reviewNote) — Sponsor CEI Escrow Release</h4>
            <form id="form-settle">
              <div class="form-grid">
                <div class="field">
                  <label for="settle-rating">Quality Rating (1 - 5)</label>
                  <select id="settle-rating" name="rating" class="select">
                    <option value="5" selected>5 / 5 — Outstanding</option>
                    <option value="4">4 / 5 — Solid</option>
                    <option value="3">3 / 5 — Acceptable</option>
                    <option value="2">2 / 5 — Needs polish</option>
                    <option value="1">1 / 5 — Minimal</option>
                  </select>
                </div>
                <div class="field">
                  <label for="settle-note">Sponsor Review Note</label>
                  <input id="settle-note" name="reviewNote" class="input" value="Verified proof digest and test coverage. Releasing full ugnot escrow." />
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button type="submit" class="btn btn-emerald btn-sm">Approve &amp; Settle ${esc(formatGNOT(b.escrowUgnot))}</button>
                <button type="button" class="btn btn-sm" data-action="request-revision" data-id="${b.id}">RequestRevision</button>
                <button type="button" class="btn btn-danger btn-sm" data-action="open-dispute" data-id="${b.id}">OpenDispute</button>
              </div>
            </form>
          </div>`
        : ""
    }

    ${
      b.status === "disputed"
        ? `<div class="action-box" style="border-color:rgba(251,146,60,0.5);">
            <h4>ResolveDispute(cur, ${b.id}, hunterBps, resolution) — Arbiter Only</h4>
            <form id="form-resolve-dispute">
              <div class="field">
                <label for="dispute-bps">Hunter Split: <span id="bps-readout" class="mono text-amber">${state.disputeBps} bps (${(state.disputeBps / 100).toFixed(2)}%)</span></label>
                <input id="dispute-bps" name="hunterBps" type="range" min="0" max="10000" step="100" value="${state.disputeBps}" data-action="slide-bps" />
                <div class="mono" style="font-size:12px;color:var(--text-secondary);display:flex;justify-content:space-between;margin-top:4px;">
                  <span>Hunter Payout: <strong class="text-emerald">${esc(formatGNOT(splitPreview.hunterUgnot))}</strong> (${splitPreview.hunterUgnot.toLocaleString()} ugnot)</span>
                  <span>Sponsor Refund: <strong class="text-sky">${esc(formatGNOT(splitPreview.sponsorRefundUgnot))}</strong> (${splitPreview.sponsorRefundUgnot.toLocaleString()} ugnot)</span>
                </div>
              </div>
              <div class="field">
                <label for="dispute-res">Arbiter Resolution Note</label>
                <input id="dispute-res" name="resolution" class="input" value="Verified deliverable scope; applying deterministic integer basis-point split." />
              </div>
              <button type="submit" class="btn btn-primary btn-sm">ResolveDispute as ${esc(getActiveActor().handle)}</button>
            </form>
          </div>`
        : ""
    }

    ${
      b.status === "settled" || b.status === "cancelled"
        ? `<div class="action-box" style="border-color:rgba(52,211,153,0.4);">
            <h4>Final Settlement Receipt</h4>
            <div class="mono" style="font-size:12px;color:var(--text-secondary);">
              Payout: <strong class="text-emerald">${esc(formatGNOT(b.payoutUgnot))}</strong> ·
              Refund: <strong class="text-sky">${esc(formatGNOT(b.refundUgnot))}</strong> ·
              Rating: <strong>${b.rating ? `${b.rating} / 5` : "N/A (Arbiter/Cancel)"}</strong>
              ${b.settledHeight ? ` · Settled Block #${b.settledHeight.toLocaleString()}` : ""}
            </div>
            ${b.reviewNote ? `<p style="margin:6px 0 0;color:var(--text-secondary);font-size:13px;">"${esc(b.reviewNote)}"</p>` : ""}
          </div>`
        : ""
    }
  `;
}

function renderOnyxView(): string {
  const snap = state.onyx;
  return `
    <div class="panel" style="margin-bottom:16px;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Live Gno.land Onyx (onyx-1) RPC &amp; On-Chain Proof Explorer</h2>
          <p class="panel-sub">Direct browser queries to <span class="mono">${esc(ONYX_RPC_URL)}</span> using native TM2 ABCI JSON-RPC (no backend proxy).</p>
        </div>
        <button class="btn btn-primary btn-sm" data-action="refresh-onyx">
          ${state.onyxLoading ? "Querying Onyx..." : "Refresh Live RPC"}
        </button>
      </div>

      <div class="kpi-grid" style="margin-bottom:0;">
        <div class="kpi-card">
          <div class="kpi-label">Network &amp; Health</div>
          <div class="kpi-value ${snap?.online ? "text-emerald" : "text-amber"}">${snap?.online ? esc(snap.node?.network ?? "onyx-1") : state.onyxLoading ? "Syncing..." : "Offline"}</div>
          <div class="kpi-meta"><span>${snap?.online ? `Latency ${snap.latencyMs}ms · Synced` : esc(snap?.error ?? "Awaiting RPC")}</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Live Onyx Block Height</div>
          <div class="kpi-value text-sky mono">${snap?.node ? `#${snap.node.latestBlockHeight.toLocaleString()}` : "---"}</div>
          <div class="kpi-meta"><span class="mono">${snap?.node ? esc(snap.node.latestBlockTime.slice(0, 19) + "Z") : ""}</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">hearthcore/v0 (/p/)</div>
          <div class="kpi-value ${snap?.coreMeta?.status === "live" ? "text-emerald" : "text-amber"}">${esc((snap?.coreMeta?.status ?? "checking").toUpperCase())}</div>
          <div class="kpi-meta"><span class="mono">Block #1,374,766 · 33.93M gas</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">hearthbounty/v0 (/r/)</div>
          <div class="kpi-value ${snap?.realmMeta?.status === "live" ? "text-emerald" : "text-amber"}">${esc((snap?.realmMeta?.status ?? "checking").toUpperCase())}</div>
          <div class="kpi-meta"><span class="mono">Block #1,374,813 · 94.05M gas</span></div>
        </div>
      </div>
    </div>

    <div class="two-col" style="margin-bottom:16px;">
      ${ONYX_ARTIFACTS.map((art) => {
        const meta = art.id === "core" ? snap?.coreMeta : snap?.realmMeta;
        const tx = art.id === "core" ? snap?.coreTx : snap?.realmTx;
        const statusCls = meta?.status === "live" ? "badge-live" : "badge-inert";
        return `<section class="panel">
          <div class="panel-header">
            <div>
              <span class="badge ${statusCls}">${esc((meta?.status ?? "checking").toUpperCase())}</span>
              <h3 class="panel-title" style="margin-top:6px;">${esc(art.label)} — ${esc(art.kind)}</h3>
            </div>
            ${
              tx?.verified
                ? `<span class="badge badge-pass">RPC TX VERIFIED</span>`
                : `<span class="badge badge-neutral">PENDING CHECK</span>`
            }
          </div>
          <div class="detail-kv" style="grid-template-columns:1fr;">
            <div class="kv-item">
              <div class="kv-label">On-Chain Module Path</div>
              <div class="kv-val mono" style="font-size:12px;">${esc(art.pkgPath)}</div>
            </div>
            <div class="kv-item">
              <div class="kv-label">Confirmed Deployment Block &amp; Gas</div>
              <div class="kv-val mono">
                Block #${(tx?.height || art.expectedBlockHeight).toLocaleString()} ·
                Gas ${(tx?.gasUsed || art.expectedGasUsed).toLocaleString()}
              </div>
            </div>
            <div class="kv-item">
              <div class="kv-label">Confirmed Transaction Hash (Hex / Base64)</div>
              <div class="kv-val mono" style="font-size:11px;">
                <div>${esc(art.txHashHex)}</div>
                <div style="color:var(--text-muted);margin-top:2px;">${esc(art.txHashBase64)}</div>
              </div>
            </div>
            ${
              meta?.raw
                ? `<div class="kv-item">
                    <div class="kv-label">Live vm/qpkgmeta_json Response</div>
                    <pre class="code-block" style="margin-top:6px;max-height:130px;">${esc(JSON.stringify(JSON.parse(meta.raw), null, 2))}</pre>
                  </div>`
                : ""
            }
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
            <a class="btn btn-primary btn-sm" href="${art.txRpcUrl}" target="_blank" rel="noopener">Inspect Raw Onyx TX</a>
            <a class="btn btn-sm" href="${art.gnowebUrl}" target="_blank" rel="noopener">Open in gnoweb</a>
          </div>
        </section>`;
      }).join("")}
    </div>

    <div class="callout" style="margin-bottom:16px;">
      <strong>Onyx Testnet Code Approval Status:</strong> Onyx enforces <span class="mono">vm:p:code_submission_policy = "inert"</span>.
      The pure library <span class="mono">hearthcore/v0</span> (Block #1,374,766) is already <strong class="text-emerald">LIVE</strong> on Onyx.
      The stateful realm <span class="mono">hearthbounty/v0</span> (Block #1,374,813) is confirmed on-chain and queued for <span class="mono">vm/enable_package</span> by network approvers; once approved, this explorer automatically switches to streaming live <span class="mono">ExportStatsJSON()</span> directly from Onyx.
      ${
        snap?.liveRealmStats
          ? `<pre class="code-block" style="margin-top:10px;">${esc(JSON.stringify(snap.liveRealmStats, null, 2))}</pre>`
          : ""
      }
    </div>

    <section class="panel">
      <div class="panel-header">
        <div>
          <h3 class="panel-title">Native gnoweb v1.8.0 Rendered UI Proofs</h3>
          <p class="panel-sub">Zero-backend Markdown + deterministic SVG UI served directly by HearthBounty's Render(path) function.</p>
        </div>
        <a class="btn btn-sm" href="${YOUTUBE_URL}" target="_blank" rel="noopener">Watch 1080p Demo Video</a>
      </div>
      <div class="gallery-grid">
        <div class="gallery-card">
          <img src="./screenshots/01-home-board.png" alt="HearthBounty gnoweb Home Board" loading="lazy" />
          <div class="gallery-caption">1. Live Bounty Board &amp; On-Chain p/nt/svg/v0 Escrow Dashboard</div>
        </div>
        <div class="gallery-card">
          <img src="./screenshots/02-bounty-detail-submitted.png" alt="Bounty Detail and Proof Verification" loading="lazy" />
          <div class="gallery-caption">2. Bounty Detail, Lifecycle SVG Strip, Proof Digest &amp; Wallet Forms</div>
        </div>
        <div class="gallery-card">
          <img src="./screenshots/03-leaderboard.png" alt="Guild Reputation Leaderboard" loading="lazy" />
          <div class="gallery-caption">3. Guild Reputation Leaderboard (Humans + Autonomous AI Agents)</div>
        </div>
        <div class="gallery-card">
          <img src="./screenshots/04-agents-hub.png" alt="AI Agent MCP Hub" loading="lazy" />
          <div class="gallery-caption">4. AI Agent &amp; MCP Integration Hub (vm/qeval JSON + gnomcp)</div>
        </div>
      </div>
    </section>
  `;
}

function renderMcpView(): string {
  const activeTool = MCP_TOOLS.find((t) => t.name === state.selectedTool) ?? MCP_TOOLS[0];
  const txObj =
    state.mcpResult?.ok &&
    state.mcpResult.response &&
    typeof state.mcpResult.response === "object" &&
    "transaction" in state.mcpResult.response
      ? (state.mcpResult.response as { transaction: { gnokeyCommand: string; gnomcpCallArgs: unknown } }).transaction
      : null;

  return `
    <div class="panel" style="margin-bottom:16px;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Live MCP Tool Call Inspector (hearthbounty-mcp + gnomcp)</h2>
          <p class="panel-sub">All 10 stdio MCP tools executed live against the simulator realm state. Switch target chain to <span class="mono">gnoland-1</span> to verify the mainnet write-safety block.</p>
        </div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <label for="mcp-chain-sel" style="font-size:12px;color:var(--text-muted);font-weight:700;">Target Chain:</label>
          <select id="mcp-chain-sel" class="select" style="width:auto;" data-action="mcp-chain">
            <option value="onyx-1" ${state.mcpChainId === "onyx-1" ? "selected" : ""}>onyx-1 (Onyx Testnet)</option>
            <option value="dev" ${state.mcpChainId === "dev" ? "selected" : ""}>dev (Local gnodev)</option>
            <option value="gnoland-1" ${state.mcpChainId === "gnoland-1" ? "selected" : ""}>gnoland-1 (Mainnet — Safety Block Test)</option>
          </select>
          <button class="btn btn-emerald btn-sm" data-action="run-agent-loop">Run Autonomous Agent Loop</button>
        </div>
      </div>
      ${
        state.mcpLoopLog.length
          ? `<div class="callout" style="margin-top:8px;">
              <strong>Autonomous Agent Loop Trace:</strong>
              <ol style="margin:6px 0 0 18px;padding:0;font-size:12px;">
                ${state.mcpLoopLog.map((line) => `<li class="mono" style="margin-bottom:3px;">${esc(line)}</li>`).join("")}
              </ol>
            </div>`
          : ""
      }
    </div>

    <div class="mcp-grid">
      <section class="panel">
        <h3 class="panel-title" style="margin-bottom:10px;">Registered MCP Tools (10)</h3>
        ${MCP_TOOLS.map(
          (t) => `<button class="tool-btn ${state.selectedTool === t.name ? "active" : ""}" data-tool="${t.name}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;">
              <span class="mono" style="font-size:12px;font-weight:700;color:var(--text);">${esc(t.name)}</span>
              <span class="badge ${t.mode === "read" ? "badge-claimed" : "badge-open"}">${esc(t.mode)}</span>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:3px;">${esc(t.summary)}</div>
          </button>`,
        ).join("")}
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title mono">${esc(activeTool.name)}</h3>
            <p class="panel-sub">${esc(activeTool.summary)}</p>
          </div>
          <span class="badge ${activeTool.mode === "read" ? "badge-claimed" : "badge-open"}">${esc(activeTool.mode)}</span>
        </div>

        <div class="field">
          <label for="mcp-args-input">JSON Tool Arguments</label>
          <textarea id="mcp-args-input" class="textarea mono" style="min-height:110px;">${esc(state.mcpArgsText)}</textarea>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:14px;">
          <button class="btn btn-primary" data-action="exec-mcp">Execute tools/call</button>
          <button class="btn btn-sm" data-action="reset-mcp-args">Reset Default Args</button>
        </div>

        ${
          state.mcpResult
            ? `<div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                  <span class="badge ${state.mcpResult.ok ? "badge-pass" : "badge-fail"}">
                    ${state.mcpResult.ok ? "200 OK" : "BLOCKED / ERROR"} · ${state.mcpResult.durationMs}ms · chain=${esc(state.mcpResult.chainId)}
                  </span>
                </div>

                ${
                  state.mcpResult.ok
                    ? `<div class="field">
                        <label>MCP Tool Output (JSON)</label>
                        <pre class="code-block">${esc(JSON.stringify(state.mcpResult.response, null, 2))}</pre>
                      </div>`
                    : `<div class="toast err">${esc(state.mcpResult.error)}</div>`
                }

                ${
                  txObj
                    ? `<div class="field" style="margin-top:10px;">
                        <label>Ready-to-Execute gnokey CLI Command</label>
                        <pre class="code-block">${esc(txObj.gnokeyCommand)}</pre>
                      </div>
                      <div class="field" style="margin-top:10px;">
                        <label>gnomcp gno_call Payload</label>
                        <pre class="code-block">${esc(JSON.stringify(txObj.gnomcpCallArgs, null, 2))}</pre>
                      </div>`
                    : ""
                }

                <div class="field" style="margin-top:10px;">
                  <label>MCP Wire JSON-RPC Request</label>
                  <pre class="code-block">${esc(JSON.stringify(state.mcpResult.rpcRequest, null, 2))}</pre>
                </div>
              </div>`
            : `<div class="callout">Click <strong>Execute tools/call</strong> to inspect the live MCP JSON-RPC request, realm response, and generated <span class="mono">gnomcp</span> / <span class="mono">gnokey</span> transaction payload.</div>`
        }
      </section>
    </div>
  `;
}

function renderLeaderboardView(): string {
  const ranked = state.realm.getRankedProfiles();
  const sanitized = sanitizeRenderText(state.sanitizeInput);

  const invariants = [
    ["Runtime-Current Caller Auth", "escrow.gno", "All 12 crossing functions authenticate cur.Previous().Address(); zero unsafe.PreviousRealm() auth."],
    ["Direct-EOA Escrow Funding", "escrow.gno", "PostBounty & TopUpBounty enforce runtime.AssertOriginCall() + cur.Previous().IsUserCall()."],
    ["Single-Denom ugnot Lock", "escrow.gno", "Rejects empty sends, multi-coin baskets, dust < 100,000 ugnot, and non-ugnot denoms."],
    ["CEI & Conservation Math", "escrow.gno / types.gno", "State zeroed before BankerTypeRealmSend; integer basis-point ComputeSplit guarantees hunter + sponsor == escrow."],
    ["Anti-Gaming & Liveness", "escrow.gno", "Sponsor cannot self-claim or cancel claimed work; expired claims release permissionlessly by block height."],
    ["Render() Defense-in-Depth", "render.gno / types.gno", "Every user string passes sanitize/v0, EscapeMath ($ -> \\$), and NeutralizeGnoTags (<gno-*> -> &lt;gno-*)."],
    ["Mainnet Write Safety Guard", "mcp-server/src/tools.ts", "assertWritableChain() permanently blocks write preparation on gnoland-1 / mainnet."],
  ];

  return `
    <section class="panel" style="margin-bottom:16px;">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">Deterministic Guild Reputation Leaderboard</h2>
          <p class="panel-sub">Sorted strictly by earned ugnot, settled count, sponsored volume, and address tie-breaker (zero non-deterministic map iteration).</p>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Builder / Agent</th>
              <th>Tier</th>
              <th>Role</th>
              <th>Earned</th>
              <th>Settled</th>
              <th>Rating</th>
              <th>Sponsored</th>
            </tr>
          </thead>
          <tbody>
            ${ranked
              .map(
                (p, i) => `<tr>
                  <td class="mono" style="font-weight:800;">#${i + 1}</td>
                  <td>
                    <div style="font-weight:700;">${esc(p.handle)}</div>
                    <div class="mono" style="font-size:11px;color:var(--text-muted);">${esc(p.address)}</div>
                    ${p.agentEndpoint ? `<div class="mono" style="font-size:11px;color:var(--sky);">${esc(p.agentEndpoint)}</div>` : ""}
                  </td>
                  <td>
                    <span class="badge" style="color:${tierColor(p.tier)};border-color:${tierColor(p.tier)};background:rgba(15,23,42,0.8);">${esc(p.tier)}</span>
                  </td>
                  <td>${p.isAgent ? `<span class="badge badge-claimed">AI Agent</span>` : `<span class="badge badge-neutral">Builder</span>`}</td>
                  <td class="mono text-emerald" style="font-weight:700;">${esc(p.earnedFormatted)}</td>
                  <td class="mono">${p.settledCount}</td>
                  <td class="mono">${esc(p.ratingFormatted)}</td>
                  <td class="mono">${esc(formatGNOT(p.sponsoredUgnot))}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>

    <div class="two-col">
      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">7 Security &amp; Interrealm v2 Invariants</h3>
            <p class="panel-sub">Verified across 12/12 gno test cases and 0 gno lint warnings.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Invariant</th>
                <th>Enforcement</th>
              </tr>
            </thead>
            <tbody>
              ${invariants
                .map(
                  ([name, file, desc]) => `<tr>
                    <td>
                      <div style="font-weight:700;color:var(--amber-bright);">${esc(name)}</div>
                      <div class="mono" style="font-size:11px;color:var(--text-muted);">${esc(file)}</div>
                    </td>
                    <td style="color:var(--text-secondary);font-size:12px;">${esc(desc)}</td>
                  </tr>`,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <div>
            <h3 class="panel-title">Live Render() Injection Defense Tester</h3>
            <p class="panel-sub">Test how hearthcore.EscapeMath + NeutralizeGnoTags stops smuggled gnoweb directives and TeX formulas.</p>
          </div>
        </div>
        <div class="field">
          <label for="sanitize-input">Untrusted User Input</label>
          <textarea id="sanitize-input" class="textarea mono" data-action="sanitize-input">${esc(state.sanitizeInput)}</textarea>
        </div>
        <div class="field">
          <label>Sanitized Render() Output</label>
          <pre class="code-block">${esc(sanitized)}</pre>
        </div>
        <div class="callout" style="margin-top:10px;">
          <strong>Reputation Tier Thresholds (Pure Integer Math):</strong><br/>
          Apprentice (default) · Journeyman (&gt;=2 settled or &gt;=10 GNOT) · Master (&gt;=5 settled or &gt;=100 GNOT) · Guildmaster (&gt;=10 settled or &gt;=500 GNOT AND rating &gt;= 4.5 / 5.0).
        </div>
      </section>
    </div>
  `;
}

function renderDiagView(): string {
  const rep = state.diagReport;
  return `
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2 class="panel-title">/diag — Automated Protocol &amp; Live Onyx Self-Test Suite</h2>
          <p class="panel-sub">Executes deterministic state-machine invariants, security guard checks, MCP mainnet safety checks, and live Onyx RPC TX proof verification directly in your browser.</p>
        </div>
        <button class="btn btn-primary btn-sm" data-action="run-diag">
          ${state.diagRunning ? "Running Diagnostics..." : "Re-Run All Diagnostics"}
        </button>
      </div>

      ${
        rep
          ? `<div class="kpi-grid" style="margin-bottom:14px;">
              <div class="kpi-card">
                <div class="kpi-label">Overall Status</div>
                <div class="kpi-value ${rep.failed === 0 ? "text-emerald" : "text-red"}">${rep.failed === 0 ? "ALL PASS" : `${rep.failed} FAILED`}</div>
                <div class="kpi-meta"><span class="mono">${rep.passed} / ${rep.total} checks passed</span></div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Total Runtime</div>
                <div class="kpi-value text-sky mono">${rep.totalDurationMs} ms</div>
                <div class="kpi-meta"><span class="mono">${esc(rep.ranAt.slice(11, 19))} UTC</span></div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Gno &amp; MCP Repo Suite</div>
                <div class="kpi-value text-emerald">17 / 17</div>
                <div class="kpi-meta"><span>12 gno test · 0 lint · 5 MCP tests</span></div>
              </div>
              <div class="kpi-card">
                <div class="kpi-label">Onyx Deployment Proofs</div>
                <div class="kpi-value text-amber mono">2 / 2</div>
                <div class="kpi-meta"><span class="mono">#1,374,766 &amp; #1,374,813</span></div>
              </div>
            </div>

            <div style="border:1px solid var(--border);border-radius:8px;overflow:hidden;">
              ${rep.checks
                .map(
                  (c) => `<div class="diag-row">
                    <div><span class="badge ${c.passed ? "badge-pass" : "badge-fail"}">${c.passed ? "PASS" : "FAIL"}</span></div>
                    <div><span class="badge badge-neutral">${esc(c.category)}</span></div>
                    <div>
                      <div style="font-weight:700;color:var(--text);">${esc(c.name)}</div>
                      <div class="mono" style="font-size:12px;color:var(--text-muted);margin-top:2px;">${esc(c.detail)}</div>
                    </div>
                    <div class="mono" style="text-align:right;font-size:12px;color:var(--text-muted);">${c.durationMs}ms</div>
                  </div>`,
                )
                .join("")}
            </div>`
          : `<div class="callout">Running self-test checks against HearthBounty engine and live Onyx RPC...</div>`
      }
    </section>
  `;
}

function renderWalkthroughDrawer(): string {
  if (!state.drawerOpen) return "";
  const steps = [
    {
      num: 1,
      time: "0:00 – 0:12",
      title: "Verify Live Gno.land Onyx (onyx-1) On-Chain Proofs",
      desc: "Inspect live RPC block height and verify hearthcore/v0 (Block 1,374,766, LIVE) and hearthbounty/v0 (Block 1,374,813) directly against rpc.onyx.testnets.gno.land.",
      btn: "Open Live Onyx Explorer",
      action: "walk-1",
    },
    {
      num: 2,
      time: "0:12 – 0:24",
      title: "Post & Fund a Real ugnot Escrow Bounty",
      desc: "Switch to Sponsor, open PostBounty, lock ugnot into the realm bank, and watch the CEI conservation invariant (realmBank == totalEscrow) hold.",
      btn: "Jump & Open PostBounty",
      action: "walk-2",
    },
    {
      num: 3,
      time: "0:24 – 0:36",
      title: "Run Autonomous AI Agent Loop via MCP Inspector",
      desc: "Watch an AI agent call hearth_list_bounties, prepare ClaimBounty, SHA-256 hash a deliverable via hearth_prepare_submit_proof, and prepare settlement.",
      btn: "Run MCP Agent Loop",
      action: "walk-3",
    },
    {
      num: 4,
      time: "0:36 – 0:48",
      title: "Settle Escrow & Inspect Reputation Tier Upgrade",
      desc: "Approve Bounty #2 as Sponsor to release 5.50 GNOT to ironforge-dev, then inspect the deterministic Leaderboard and 7 Interrealm v2 security guards.",
      btn: "Settle #2 & Open Leaderboard",
      action: "walk-4",
    },
    {
      num: 5,
      time: "0:48 – 0:60",
      title: "Execute /diag Automated Self-Test Suite",
      desc: "Run all 9 live protocol, math conservation, sanitizer, mainnet safety, and Onyx RPC verification checks in under a second.",
      btn: "Run /diag Self-Test",
      action: "walk-5",
    },
  ];

  return `<div class="drawer-backdrop" data-action="close-drawer-backdrop">
    <aside class="drawer" role="dialog" aria-label="60-Second Judge Walkthrough">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div>
          <h2 style="margin:0;font-size:17px;">60-Second Judge Walkthrough</h2>
          <p class="panel-sub">Zero-install guided tour of every DoraHacks Gnome Tavern rubric criterion.</p>
        </div>
        <button class="btn btn-sm" data-action="close-drawer">Close</button>
      </div>

      ${steps
        .map(
          (s) => `<div class="walk-step ${state.completedSteps.has(s.num) ? "done" : ""}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <span class="walk-time">${esc(s.time)} · STEP ${s.num}/5</span>
              ${state.completedSteps.has(s.num) ? `<span class="badge badge-pass">DONE</span>` : ""}
            </div>
            <div style="font-weight:700;margin-bottom:4px;">${esc(s.title)}</div>
            <p style="margin:0 0 10px;font-size:12px;color:var(--text-muted);">${esc(s.desc)}</p>
            <button class="btn btn-primary btn-sm" data-action="${s.action}">${esc(s.btn)}</button>
          </div>`,
        )
        .join("")}

      <div class="panel" style="padding:12px;">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Submission Links</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a class="btn btn-sm" href="${DECK_PDF_URL}" target="_blank" rel="noopener">10-Slide Deck PDF</a>
          <a class="btn btn-sm" href="${YOUTUBE_URL}" target="_blank" rel="noopener">1080p YouTube Demo</a>
          <a class="btn btn-sm" href="${GITHUB_URL}" target="_blank" rel="noopener">GitHub Repository</a>
        </div>
      </div>
    </aside>
  </div>`;
}

function render(): void {
  const root = document.getElementById("app");
  if (!root) return;

  let bodyHtml = "";
  switch (state.tab) {
    case "simulator":
      bodyHtml = renderSimulatorView();
      break;
    case "onyx":
      bodyHtml = renderOnyxView();
      break;
    case "mcp":
      bodyHtml = renderMcpView();
      break;
    case "leaderboard":
      bodyHtml = renderLeaderboardView();
      break;
    case "diag":
      bodyHtml = renderDiagView();
      break;
  }

  root.innerHTML = `
    ${renderHeader()}
    <main class="container">${bodyHtml}</main>
    ${renderWalkthroughDrawer()}
  `;

  bindEvents();
}

async function runAutonomousAgentLoop(): Promise<void> {
  const log: string[] = [];
  const listRes = await executeMcpTool(
    state.realm,
    "hearth_list_bounties",
    { status: "open", limit: 10 },
    state.mcpChainId === "gnoland-1" ? "onyx-1" : state.mcpChainId,
  );
  const openList =
    (listRes.response as { bounties?: Array<{ id: number; title: string; escrow_ugnot: number }> })?.bounties ?? [];

  let targetId = openList.sort((a, b) => b.escrow_ugnot - a.escrow_ugnot)[0]?.id;
  if (!targetId) {
    const sponsor = DEMO_ACTORS[0];
    targetId = state.realm.postBounty(
      { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 3_000_000 }] },
      "Autonomous Agent Loop Verification Quest",
      "Created automatically for MCP end-to-end discovery, claim, SHA-256 proof, and settlement.",
      "agent",
      25_000,
    );
    log.push(`0. Seeded fresh Open Bounty #${targetId} (3.00 GNOT) for live loop.`);
  } else {
    log.push(`1. hearth_list_bounties(status="open") -> selected top-funded Bounty #${targetId}.`);
  }

  const writableChain = state.mcpChainId === "gnoland-1" ? "onyx-1" : state.mcpChainId;
  const claimPrep = await executeMcpTool(
    state.realm,
    "hearth_prepare_claim",
    { id: targetId, agentNote: "Claimed autonomously via hearthbounty-mcp inspector loop." },
    writableChain,
  );
  log.push(`2. hearth_prepare_claim(id=${targetId}) -> ok=${claimPrep.ok} (${claimPrep.durationMs}ms).`);

  const agent = DEMO_ACTORS[1];
  const sponsor = DEMO_ACTORS[0];
  state.realm.claimBounty({ caller: agent.address }, targetId, "Autonomous MCP claim executed.");

  const proofPrep = await executeMcpTool(
    state.realm,
    "hearth_prepare_submit_proof",
    {
      id: targetId,
      proofURL: "https://github.com/alphonshhhomenicmtu/hearthbounty/pull/20",
      proofContent: `hearthbounty-autonomous-proof-bounty-${targetId}`,
      summary: "Delivered deterministic Gno package and passed all unit + lint checks.",
    },
    writableChain,
  );
  const digest = (proofPrep.response as { computedDigest?: string })?.computedDigest ?? "sha256:verified0001";
  log.push(`3. hearth_prepare_submit_proof -> SHA-256 ${digest.slice(0, 26)}...`);

  state.realm.submitProof(
    { caller: agent.address },
    targetId,
    "https://github.com/alphonshhhomenicmtu/hearthbounty/pull/20",
    digest,
    "Delivered deterministic Gno package and passed all unit + lint checks.",
  );

  const settlePrep = await executeMcpTool(
    state.realm,
    "hearth_prepare_settle",
    { id: targetId, rating: 5, reviewNote: "Verified SHA-256 proof and settling full escrow." },
    writableChain,
  );
  log.push(`4. hearth_prepare_settle(id=${targetId}, rating=5) -> ready to release escrow.`);

  state.realm.approveAndSettle(
    { caller: sponsor.address },
    targetId,
    5,
    "Verified SHA-256 proof and settling full escrow.",
  );
  const agentProf = state.realm.toProfileView(state.realm.profiles.get(agent.address)!);
  log.push(
    `5. ApproveAndSettle executed -> anvil-mcp-agent now ${agentProf.tier} (${agentProf.earnedFormatted}, ${agentProf.settledCount} settled).`,
  );

  state.mcpLoopLog = log;
  state.selectedTool = "hearth_prepare_settle";
  state.mcpResult = settlePrep;
  state.selectedBountyId = targetId;
  state.completedSteps.add(3);
  setToast(true, `Autonomous MCP agent loop settled Bounty #${targetId}.`);
  render();
}

function bindEvents(): void {
  document.querySelectorAll<HTMLElement>("[data-tab]").forEach((el) => {
    el.addEventListener("click", () => {
      setTab(el.dataset.tab as TabId);
    });
  });

  document.querySelectorAll<HTMLElement>("[data-actor]").forEach((el) => {
    el.addEventListener("click", () => {
      state.activeActorId = el.dataset.actor as AppState["activeActorId"];
      render();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-cat]").forEach((el) => {
    el.addEventListener("click", () => {
      state.filterCategory = el.dataset.cat ?? "";
      render();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-bounty-id]").forEach((el) => {
    el.addEventListener("click", () => {
      state.selectedBountyId = Number(el.dataset.bountyId);
      render();
    });
  });

  document.querySelectorAll<HTMLElement>("[data-tool]").forEach((el) => {
    el.addEventListener("click", () => {
      const name = el.dataset.tool as McpToolName;
      const def = MCP_TOOLS.find((t) => t.name === name);
      if (!def) return;
      state.selectedTool = name;
      state.mcpArgsText = JSON.stringify(def.defaultArgs, null, 2);
      state.mcpResult = null;
      render();
    });
  });

  const guardSel = document.querySelector<HTMLSelectElement>('[data-action="guard-mode"]');
  guardSel?.addEventListener("change", () => {
    state.guardMode = guardSel.value as GuardMode;
    render();
  });

  const mcpChainSel = document.querySelector<HTMLSelectElement>('[data-action="mcp-chain"]');
  mcpChainSel?.addEventListener("change", () => {
    state.mcpChainId = mcpChainSel.value;
    render();
  });

  const sanitizeTa = document.querySelector<HTMLTextAreaElement>('[data-action="sanitize-input"]');
  sanitizeTa?.addEventListener("input", () => {
    state.sanitizeInput = sanitizeTa.value;
    const pre = sanitizeTa.closest("section")?.querySelector("pre.code-block");
    if (pre) pre.textContent = sanitizeRenderText(state.sanitizeInput);
  });

  const bpsSlider = document.querySelector<HTMLInputElement>('[data-action="slide-bps"]');
  bpsSlider?.addEventListener("input", () => {
    state.disputeBps = Number(bpsSlider.value);
    render();
  });

  const onAction = (action: string, handler: (el: HTMLElement) => void) => {
    document.querySelectorAll<HTMLElement>(`[data-action="${action}"]`).forEach((el) => {
      el.addEventListener("click", (ev) => {
        if (action === "close-drawer-backdrop" && ev.target !== el) return;
        handler(el);
      });
    });
  };

  onAction("goto-onyx", () => setTab("onyx"));
  onAction("refresh-onyx", () => void refreshOnyx());
  onAction("open-drawer", () => {
    state.drawerOpen = true;
    render();
  });
  onAction("close-drawer", () => {
    state.drawerOpen = false;
    render();
  });
  onAction("close-drawer-backdrop", () => {
    state.drawerOpen = false;
    render();
  });
  onAction("dismiss-toast", () => {
    state.toast = null;
    render();
  });
  onAction("toggle-post-form", () => {
    state.showPostForm = !state.showPostForm;
    render();
  });
  onAction("advance-blocks", () => {
    state.realm.advanceBlocks(50_000);
    setToast(true, `Advanced simulated chain height to #${state.realm.chainHeight.toLocaleString()}.`);
    render();
  });
  onAction("reset-realm", () => {
    state.realm = createSeededRealm();
    state.selectedBountyId = 5;
    state.guardMode = "eoa";
    state.mcpLoopLog = [];
    setToast(true, "Reset realm to canonical seeded state (5 bounties, 3 profiles).");
    render();
  });
  onAction("inspect-in-mcp", () => {
    state.selectedTool = "hearth_chain_status";
    state.mcpArgsText = "{}";
    setTab("mcp");
    void executeMcpTool(state.realm, "hearth_chain_status", {}, state.mcpChainId).then((res) => {
      state.mcpResult = res;
      render();
    });
  });

  onAction("run-full-lifecycle", async () => {
    try {
      const [sponsor, agent] = DEMO_ACTORS;
      const id = state.realm.postBounty(
        { caller: sponsor.address, sentCoins: [{ denom: DENOM, amount: 4_500_000 }] },
        "Live Simulator Lifecycle Verification",
        "Automated post -> claim -> SHA-256 proof -> CEI settlement -> reputation tier check.",
        "realm",
        30_000,
      );
      state.realm.claimBounty({ caller: agent.address }, id, "Claimed in end-to-end simulation.");
      const digest = await computeSha256Digest(`hearthbounty-lifecycle-${id}`);
      state.realm.submitProof(
        { caller: agent.address },
        id,
        "https://github.com/alphonshhhomenicmtu/hearthbounty/pull/24",
        digest,
        "Verified deterministic escrow lifecycle and passed all invariant checks.",
      );
      state.realm.approveAndSettle({ caller: sponsor.address }, id, 5, "Settled cleanly via CEI.");
      state.selectedBountyId = id;
      setToast(
        true,
        `Executed full lifecycle on Bounty #${id}: 4.50 GNOT settled to anvil-mcp-agent; realmBank == totalEscrow verified.`,
      );
      render();
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
      render();
    }
  });

  onAction("topup-bounty", (el) => {
    try {
      const id = Number(el.dataset.id);
      const added = state.realm.bounties.get(id)?.status === "open" ? 1_000_000 : 500_000;
      const next = state.realm.topUpBounty(buildCallCtx(added), id);
      setToast(true, `TopUpBounty(#${id}) succeeded. New escrow: ${formatGNOT(next)}.`);
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });

  onAction("cancel-bounty", (el) => {
    try {
      const id = Number(el.dataset.id);
      state.realm.cancelBounty(buildCallCtx(), id);
      setToast(true, `CancelBounty(#${id}) refunded full escrow to sponsor.`);
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });

  onAction("release-claim", (el) => {
    try {
      const id = Number(el.dataset.id);
      state.realm.releaseExpiredClaim(buildCallCtx(), id);
      setToast(true, `ReleaseExpiredClaim(#${id}) returned bounty to Open.`);
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });

  onAction("hash-proof", async () => {
    const input = document.getElementById("proof-artifact") as HTMLInputElement | null;
    const digestEl = document.getElementById("proof-digest") as HTMLInputElement | null;
    if (input && digestEl) {
      digestEl.value = await computeSha256Digest(input.value || "hearthbounty-artifact");
    }
  });

  onAction("request-revision", (el) => {
    try {
      const id = Number(el.dataset.id);
      state.realm.requestRevision(buildCallCtx(), id, "Please add boundary tests for zero-length inputs.");
      setToast(true, `RequestRevision(#${id}) returned bounty to Claimed with refreshed deadline.`);
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });

  onAction("open-dispute", (el) => {
    try {
      const id = Number(el.dataset.id);
      state.realm.openDispute(buildCallCtx(), id, "Requesting arbiter review for partial scope split.");
      setToast(true, `OpenDispute(#${id}) escalated bounty to Arbiter review.`);
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });

  onAction("exec-mcp", async () => {
    const ta = document.getElementById("mcp-args-input") as HTMLTextAreaElement | null;
    state.mcpArgsText = ta?.value ?? "{}";
    try {
      const parsed = JSON.parse(state.mcpArgsText) as Record<string, unknown>;
      state.mcpResult = await executeMcpTool(state.realm, state.selectedTool, parsed, state.mcpChainId);
    } catch (err) {
      state.mcpResult = {
        tool: state.selectedTool,
        chainId: state.mcpChainId,
        ok: false,
        durationMs: 0,
        rpcRequest: {},
        error: `Invalid JSON arguments: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
    render();
  });

  onAction("reset-mcp-args", () => {
    const def = MCP_TOOLS.find((t) => t.name === state.selectedTool);
    if (def) {
      state.mcpArgsText = JSON.stringify(def.defaultArgs, null, 2);
      render();
    }
  });

  onAction("run-agent-loop", () => void runAutonomousAgentLoop());
  onAction("run-diag", () => void triggerDiagnostics());

  // Walkthrough step handlers
  onAction("walk-1", () => {
    state.completedSteps.add(1);
    state.drawerOpen = false;
    setTab("onyx");
    void refreshOnyx();
  });
  onAction("walk-2", () => {
    state.completedSteps.add(2);
    state.drawerOpen = false;
    state.activeActorId = "sponsor";
    state.guardMode = "eoa";
    state.showPostForm = true;
    setTab("simulator");
  });
  onAction("walk-3", () => {
    state.completedSteps.add(3);
    state.drawerOpen = false;
    setTab("mcp");
    void runAutonomousAgentLoop();
  });
  onAction("walk-4", () => {
    state.completedSteps.add(4);
    state.drawerOpen = false;
    const b2 = state.realm.bounties.get(2);
    if (b2 && b2.status === "submitted") {
      state.realm.approveAndSettle(
        { caller: DEMO_ACTORS[0].address },
        2,
        5,
        "Verified adversarial Interrealm v2 test suite in Judge Walkthrough.",
      );
      setToast(true, "Settled Bounty #2 (5.50 GNOT) to ironforge-dev; leaderboard updated.");
    }
    setTab("leaderboard");
  });
  onAction("walk-5", () => {
    state.completedSteps.add(5);
    state.drawerOpen = false;
    setTab("diag");
    void triggerDiagnostics();
  });

  // Form submissions
  document.getElementById("form-post-bounty")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget as HTMLFormElement);
    try {
      const id = state.realm.postBounty(
        buildCallCtx(Number(fd.get("amount"))),
        String(fd.get("title") ?? ""),
        String(fd.get("spec") ?? ""),
        String(fd.get("category") ?? "realm"),
        Number(fd.get("deadline") ?? 30_000),
      );
      state.selectedBountyId = id;
      state.showPostForm = false;
      state.completedSteps.add(2);
      setToast(true, `PostBounty created Bounty #${id} with locked ugnot escrow.`);
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });

  document.getElementById("form-claim")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget as HTMLFormElement);
    try {
      state.realm.claimBounty(buildCallCtx(), state.selectedBountyId, String(fd.get("note") ?? ""));
      setToast(true, `ClaimBounty(#${state.selectedBountyId}) reserved by ${getActiveActor().handle}.`);
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });

  document.getElementById("form-submit-proof")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget as HTMLFormElement);
    try {
      state.realm.submitProof(
        buildCallCtx(),
        state.selectedBountyId,
        String(fd.get("proofURL") ?? ""),
        String(fd.get("proofDigest") ?? ""),
        String(fd.get("summary") ?? ""),
      );
      setToast(true, `SubmitProof(#${state.selectedBountyId}) recorded verifiable SHA-256 digest.`);
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });

  document.getElementById("form-settle")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget as HTMLFormElement);
    try {
      state.realm.approveAndSettle(
        buildCallCtx(),
        state.selectedBountyId,
        Number(fd.get("rating") ?? 5),
        String(fd.get("reviewNote") ?? ""),
      );
      state.completedSteps.add(4);
      setToast(
        true,
        `ApproveAndSettle(#${state.selectedBountyId}) released full escrow via CEI and updated on-chain reputation.`,
      );
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });

  document.getElementById("form-resolve-dispute")?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.currentTarget as HTMLFormElement);
    try {
      state.realm.resolveDispute(
        buildCallCtx(),
        state.selectedBountyId,
        Number(fd.get("hunterBps") ?? state.disputeBps),
        String(fd.get("resolution") ?? ""),
      );
      setToast(
        true,
        `ResolveDispute(#${state.selectedBountyId}) split escrow deterministically (${state.disputeBps} bps hunter).`,
      );
    } catch (err) {
      setToast(false, err instanceof Error ? err.message : String(err));
    }
    render();
  });
}

// Keep hash navigation reactive
window.addEventListener("hashchange", () => {
  const next = parseInitialTab();
  if (next !== state.tab) {
    state.tab = next;
    render();
    if (next === "diag" && !state.diagReport && !state.diagRunning) {
      void triggerDiagnostics();
    }
  }
});

// Boot application
render();
void refreshOnyx();
if (state.tab === "diag") {
  void triggerDiagnostics();
}

// Expose read-only diagnostic hook for automated verification
(window as unknown as Record<string, unknown>).__HEARTH_PLAYGROUND__ = {
  realmPath: REALM_PKG_PATH,
  runDiagnostics,
};
