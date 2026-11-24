#!/usr/bin/env node
/**
 * Generates the 10-slide 16:9 executive pitch deck PDF at docs/hearthbounty-deck.pdf
 * and copies it to web/public/hearthbounty-deck.pdf using Chrome headless print-to-pdf.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SHOTS_DIR = path.join(ROOT, "docs", "screenshots");
const OUT_PDF = path.join(ROOT, "docs", "hearthbounty-deck.pdf");
const WEB_PDF = path.join(ROOT, "web", "public", "hearthbounty-deck.pdf");
const TMP_HTML = path.join(ROOT, "docs", ".deck-build.html");

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "google-chrome",
  "chromium",
];

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    if (c.startsWith("/") && fs.existsSync(c)) return c;
  }
  return "google-chrome";
}

function imgDataUri(filename) {
  const full = path.join(SHOTS_DIR, filename);
  const buf = fs.readFileSync(full);
  return `data:image/png;base64,${buf.toString("base64")}`;
}

const shotBoard = imgDataUri("01-home-board.png");
const shotDetail = imgDataUri("02-bounty-detail-submitted.png");
const shotLeader = imgDataUri("03-leaderboard.png");
const shotAgents = imgDataUri("04-agents-hub.png");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>HearthBounty — Pitch Deck (Gnome Tavern Hackathon | Gno.land)</title>
<style>
  @page {
    size: 1280px 720px;
    margin: 0;
  }
  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  html, body {
    margin: 0;
    padding: 0;
    background: #080d18;
    color: #f8fafc;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  .slide {
    width: 1280px;
    height: 720px;
    padding: 44px 56px 58px;
    background: #080d18;
    position: relative;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
    display: flex;
    flex-direction: column;
  }
  .slide:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  /* Subtle structural top accent rule */
  .slide::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 5px;
    background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 45%, #38bdf8 100%);
  }
  .slide-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 22px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.18);
    padding-bottom: 12px;
  }
  .eyebrow {
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1.4px;
    color: #fbbf24;
    margin-bottom: 4px;
  }
  h1 {
    margin: 0;
    font-size: 52px;
    font-weight: 900;
    letter-spacing: -1px;
    line-height: 1.08;
    color: #f8fafc;
  }
  h2 {
    margin: 0;
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.4px;
    color: #f8fafc;
  }
  h3 {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 700;
    color: #f8fafc;
  }
  p {
    margin: 0;
    color: #cbd5e1;
    font-size: 15px;
    line-height: 1.5;
  }
  .mono {
    font-family: "JetBrains Mono", "SFMono-Regular", Menlo, Consolas, monospace;
    font-variant-numeric: tabular-nums;
  }
  .slide-footer {
    position: absolute;
    left: 56px;
    right: 56px;
    bottom: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #64748b;
    border-top: 1px solid rgba(148, 163, 184, 0.14);
    padding-top: 8px;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
  }
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }
  .grid-4 {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
  }
  .card {
    background: #0f172a;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    padding: 18px 20px;
  }
  .card-amber {
    border-color: rgba(245, 158, 11, 0.48);
    background: linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, #0f172a 100%);
  }
  .card-emerald {
    border-color: rgba(52, 211, 153, 0.45);
    background: linear-gradient(180deg, rgba(52, 211, 153, 0.07) 0%, #0f172a 100%);
  }
  .card-sky {
    border-color: rgba(56, 189, 248, 0.42);
    background: linear-gradient(180deg, rgba(56, 189, 248, 0.07) 0%, #0f172a 100%);
  }
  .pill {
    display: inline-block;
    padding: 4px 11px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid rgba(245, 158, 11, 0.45);
    background: rgba(245, 158, 11, 0.14);
    color: #fbbf24;
  }
  .pill-emerald {
    border-color: rgba(52, 211, 153, 0.45);
    background: rgba(52, 211, 153, 0.14);
    color: #34d399;
  }
  .pill-sky {
    border-color: rgba(56, 189, 248, 0.45);
    background: rgba(56, 189, 248, 0.14);
    color: #38bdf8;
  }
  .stat-num {
    font-size: 28px;
    font-weight: 900;
    color: #fbbf24;
    margin-bottom: 4px;
  }
  .stat-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #94a3b8;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }
  th, td {
    padding: 9px 11px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    text-align: left;
    vertical-align: top;
  }
  th {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.7px;
    color: #94a3b8;
    background: rgba(255, 255, 255, 0.03);
  }
  td {
    color: #e2e8f0;
  }
  ul.clean {
    margin: 8px 0 0;
    padding-left: 18px;
    color: #cbd5e1;
    font-size: 14px;
    line-height: 1.55;
  }
  ul.clean li {
    margin-bottom: 6px;
  }
  .code-box {
    background: #050912;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 8px;
    padding: 12px 14px;
    font-size: 12px;
    line-height: 1.5;
    color: #e2e8f0;
    white-space: pre-wrap;
  }
  .shot-frame {
    border: 1px solid rgba(148, 163, 184, 0.28);
    border-radius: 10px;
    overflow: hidden;
    background: #0f172a;
  }
  .shot-frame img {
    width: 100%;
    height: 255px;
    object-fit: cover;
    object-position: top;
    display: block;
  }
  .shot-cap {
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 700;
    color: #cbd5e1;
    border-top: 1px solid rgba(148, 163, 184, 0.16);
  }
</style>
</head>
<body>

<!-- SLIDE 1: COVER -->
<section class="slide" style="justify-content:center;">
  <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
    <svg width="54" height="54" viewBox="0 0 64 64">
      <rect width="64" height="64" rx="14" fill="#131c31" stroke="#334155" stroke-width="2" />
      <circle cx="32" cy="32" r="20" fill="#0f172a" stroke="#f59e0b" stroke-width="3" />
      <circle cx="32" cy="32" r="9" fill="#f59e0b" />
      <circle cx="32" cy="29" r="3.8" fill="#fef3c7" />
    </svg>
    <span class="pill">DoraHacks · Gnome Tavern Hackathon | Gno.land</span>
    <span class="pill pill-emerald">Deployed on Onyx (onyx-1)</span>
  </div>

  <h1>HearthBounty</h1>
  <p style="font-size:22px;color:#cbd5e1;max-width:860px;margin-top:14px;line-height:1.4;">
    On-Chain Micro-Bounty Escrow, Verifiable Proof Registry, and AI Agent Guild built natively for Gno.land v1.8.0.
  </p>

  <div class="grid-4" style="margin-top:34px;">
    <div class="card card-amber">
      <div class="stat-num mono">2</div>
      <div class="stat-label">Onyx On-Chain Deployments</div>
      <p style="font-size:12px;margin-top:5px;">hearthcore/v0 (#1,374,766 LIVE) &amp; hearthbounty/v0 (#1,374,813)</p>
    </div>
    <div class="card card-emerald">
      <div class="stat-num mono">17 / 17</div>
      <div class="stat-label">Gno &amp; MCP Tests Passing</div>
      <p style="font-size:12px;margin-top:5px;">12/12 gno test · 0 gno lint warnings · 5/5 MCP protocol tests</p>
    </div>
    <div class="card card-sky">
      <div class="stat-num mono">10</div>
      <div class="stat-label">MCP AI Agent Tools</div>
      <p style="font-size:12px;margin-top:5px;">Native ABCI vm/qeval JSON + gnomcp &amp; gnokey tx preparation</p>
    </div>
    <div class="card">
      <div class="stat-num mono">0</div>
      <div class="stat-label">Off-Chain Backend Servers</div>
      <p style="font-size:12px;margin-top:5px;">Pure gnoweb v1.8 SVG + interactive forms + zero-install web playground</p>
    </div>
  </div>

  <div style="margin-top:28px;display:flex;gap:18px;flex-wrap:wrap;font-size:12px;color:#94a3b8;" class="mono">
    <span>Playground: https://alphonshhhomenicmtu.github.io/hearthbounty/</span>
    <span>·</span>
    <span>Demo: https://youtu.be/vK6z7MJiRAk</span>
    <span>·</span>
    <span>Repo: github.com/alphonshhhomenicmtu/hearthbounty</span>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — V2 Submission Deck</span>
    <span class="mono">01 / 10</span>
  </div>
</section>

<!-- SLIDE 2: THE PROBLEM -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">01 · Problem Statement</div>
      <h2>Why On-Chain Open-Source Bounties Break Today</h2>
    </div>
    <span class="pill">Market &amp; Protocol Gap</span>
  </div>

  <div class="grid-2" style="flex:1;align-content:center;">
    <div class="card">
      <h3 style="color:#fbbf24;">1. Fragile Off-Chain Coordination Stacks</h3>
      <p>Conventional bounty platforms depend on centralized databases, custodial wallets, and SaaS frontends. When an API server goes down, quest history, proof hashes, and builder reputation vanish.</p>
      <ul class="clean">
        <li>Escrow terms live off-chain while funds sit in opaque multisigs.</li>
        <li>No deterministic audit trail connecting code deliverables to payouts.</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="color:#38bdf8;">2. Human-Only UIs Invisible to AI Coding Agents</h3>
      <p>Autonomous coding agents (Claude, Cursor, Gemini CLI) can write and test Gno realms, yet existing dApps expose JavaScript-heavy DOMs with no structured on-chain discovery or safety-bounded tx preparation.</p>
      <ul class="clean">
        <li>Agents waste tokens scraping brittle HTML instead of querying JSON.</li>
        <li>Unbounded signing tools risk accidental writes on mainnet.</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="color:#a78bfa;">3. Unverifiable Proofs &amp; Stalled Claims</h3>
      <p>Without cryptographic deliverable digests and deterministic block-height timeouts, bounty hunters squat on open issues indefinitely while sponsors lack evidence during disputes.</p>
      <ul class="clean">
        <li>No standardized SHA-256 artifact hash pinned on-chain.</li>
        <li>No permissionless way to reclaim abandoned tasks.</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="color:#34d399;">4. Non-Composable Smart Contract Monoliths</h3>
      <p>Most hackathon contracts bundle financial math, formatting, and visuals inside one unimportable contract rather than publishing reusable pure packages for the wider ecosystem.</p>
      <ul class="clean">
        <li>Gno.land rewards composable <span class="mono">/p/</span> packages imported by other realms.</li>
      </ul>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — Problem Analysis</span>
    <span class="mono">02 / 10</span>
  </div>
</section>

<!-- SLIDE 3: THE SOLUTION -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">02 · Solution</div>
      <h2>One Gno.land Protocol, Two Native Surfaces</h2>
    </div>
    <span class="pill pill-emerald">Dual-Audience Architecture</span>
  </div>

  <p style="font-size:16px;margin-bottom:20px;max-width:1050px;">
    HearthBounty runs complete micro-bounty escrow, SHA-256 proof pinning, dispute arbitration, and guild reputation directly inside Gno.land state — serving both human developers in <span class="mono">gnoweb</span> and autonomous AI agents via Model Context Protocol (MCP).
  </p>

  <div class="grid-3" style="align-items:stretch;">
    <div class="card card-amber">
      <div class="stat-label" style="color:#fbbf24;">Surface A · Human Builders</div>
      <h3 style="margin-top:6px;">Zero-Backend gnoweb v1.8 UI</h3>
      <ul class="clean">
        <li>Multi-route interface via <span class="mono">p/nt/mux/v0</span> (<span class="mono">:post</span>, <span class="mono">:bounty/id</span>, <span class="mono">:leaderboard</span>, <span class="mono">:agents</span>).</li>
        <li>Deterministic on-chain SVG hero chart, 4-step lifecycle bar, and tier shields via <span class="mono">p/nt/svg/v0</span>.</li>
        <li>Contextual wallet-ready <span class="mono">&lt;gno-form&gt;</span> and <span class="mono">txlink</span> calls directly from Adena.</li>
      </ul>
    </div>
    <div class="card card-sky">
      <div class="stat-label" style="color:#38bdf8;">Surface B · Autonomous AI Agents</div>
      <h3 style="margin-top:6px;">MCP Server + Deterministic JSON</h3>
      <ul class="clean">
        <li>5 zero-reflection RFC-8259 <span class="mono">Export*JSON</span> functions queried over native TM2 ABCI <span class="mono">vm/qeval</span>.</li>
        <li>10 stdio MCP tools in <span class="mono">hearthbounty-mcp</span> plus <span class="mono">hearth-cli</span>.</li>
        <li>Emits <span class="mono">gnomcp</span> <span class="mono">gno_call</span> and <span class="mono">gnokey</span> commands; refuses writes on <span class="mono">gnoland-1</span> mainnet.</li>
      </ul>
    </div>
    <div class="card card-emerald">
      <div class="stat-label" style="color:#34d399;">Surface C · Judge &amp; Ecosystem Access</div>
      <h3 style="margin-top:6px;">Reusable /p/ Core + V2 Playground</h3>
      <ul class="clean">
        <li>Stateless <span class="mono">hearthcore/v0</span> pure package already LIVE on Onyx for other realms to import.</li>
        <li>Zero-install V2 Web Playground mirroring exact realm logic + live Onyx RPC verification.</li>
        <li>60-second Judge Walkthrough + automated <span class="mono">/diag</span> self-test suite.</li>
      </ul>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — Dual-Audience Solution</span>
    <span class="mono">03 / 10</span>
  </div>
</section>

<!-- SLIDE 4: ARCHITECTURE -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">03 · System Architecture</div>
      <h2>Composable /p/ + /r/ Protocol Stack on Gno.land v1.8.0</h2>
    </div>
    <span class="pill pill-sky">Modular On-Chain Design</span>
  </div>

  <svg viewBox="0 0 1168 355" width="100%" style="margin-bottom:16px;">
    <rect x="0" y="0" width="1168" height="355" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5" />

    <!-- Clients column -->
    <rect x="24" y="24" width="290" height="140" rx="10" fill="#152036" stroke="#f59e0b" stroke-width="1.8" />
    <text x="42" y="52" fill="#fbbf24" font-size="12" font-weight="800">HUMAN BUILDERS &amp; SPONSORS</text>
    <text x="42" y="76" fill="#f8fafc" font-size="15" font-weight="700">gnoweb v1.8 + Adena Wallet</text>
    <text x="42" y="100" fill="#94a3b8" font-size="12">• Native Render(path) HTML &amp; SVG</text>
    <text x="42" y="120" fill="#94a3b8" font-size="12">• &lt;gno-form&gt; MsgCall execution</text>
    <text x="42" y="140" fill="#94a3b8" font-size="12">• V2 Zero-Install Web Playground</text>

    <rect x="24" y="190" width="290" height="140" rx="10" fill="#152036" stroke="#38bdf8" stroke-width="1.8" />
    <text x="42" y="218" fill="#38bdf8" font-size="12" font-weight="800">AUTONOMOUS AI AGENTS</text>
    <text x="42" y="242" fill="#f8fafc" font-size="15" font-weight="700">hearthbounty-mcp + gnomcp</text>
    <text x="42" y="266" fill="#94a3b8" font-size="12">• 10 MCP tools over stdio + hearth-cli</text>
    <text x="42" y="286" fill="#94a3b8" font-size="12">• SHA-256 artifact proof hashing</text>
    <text x="42" y="306" fill="#94a3b8" font-size="12">• Testnet-only write safety guard</text>

    <!-- Arrows -->
    <line x1="314" y1="94" x2="390" y2="128" stroke="#fbbf24" stroke-width="2.2" />
    <polygon points="390,128 378,118 375,130" fill="#fbbf24" />
    <line x1="314" y1="260" x2="390" y2="218" stroke="#38bdf8" stroke-width="2.2" />
    <polygon points="390,218 375,216 380,228" fill="#38bdf8" />

    <!-- Stateful Realm -->
    <rect x="394" y="24" width="388" height="306" rx="12" fill="#131e36" stroke="#a78bfa" stroke-width="2" />
    <text x="414" y="52" fill="#a78bfa" font-size="12" font-weight="800">STATEFUL REALM (/r/)</text>
    <text x="414" y="76" fill="#f8fafc" font-size="16" font-weight="800">r/.../hearthbounty/v0</text>
    <rect x="414" y="92" width="348" height="48" rx="7" fill="#0b1220" stroke="#334155" />
    <text x="428" y="113" fill="#e2e8f0" font-size="13" font-weight="700">escrow.gno — 12 Crossing Entrypoints</text>
    <text x="428" y="130" fill="#94a3b8" font-size="11">Post, TopUp, Claim, Release, Proof, Revision, Settle, Dispute</text>

    <rect x="414" y="150" width="348" height="48" rx="7" fill="#0b1220" stroke="#334155" />
    <text x="428" y="171" fill="#e2e8f0" font-size="13" font-weight="700">state.gno — Unexported AVL &amp; seqid Storage</text>
    <text x="428" y="188" fill="#94a3b8" font-size="11">avl.Tree bounties &amp; profiles · zero unsorted map iteration</text>

    <rect x="414" y="208" width="348" height="48" rx="7" fill="#0b1220" stroke="#334155" />
    <text x="428" y="229" fill="#e2e8f0" font-size="13" font-weight="700">query.gno — 5 Deterministic JSON Exports</text>
    <text x="428" y="246" fill="#94a3b8" font-size="11">ExportStats, Bounties, Bounty, Leaderboard, Profile JSON</text>

    <rect x="414" y="266" width="348" height="48" rx="7" fill="#0b1220" stroke="#334155" />
    <text x="428" y="287" fill="#e2e8f0" font-size="13" font-weight="700">render.gno — mux v0 + sanitize/v0 UI</text>
    <text x="428" y="304" fill="#94a3b8" font-size="11">7 routes · &lt;gno-columns&gt;/&lt;gno-form&gt; · SVG hero &amp; badges</text>

    <!-- Arrow to Pure Package -->
    <line x1="782" y1="130" x2="846" y2="130" stroke="#34d399" stroke-width="2.2" />
    <polygon points="846,130 834,123 834,137" fill="#34d399" />

    <!-- Pure Package -->
    <rect x="850" y="24" width="294" height="190" rx="12" fill="#132229" stroke="#34d399" stroke-width="2" />
    <text x="870" y="52" fill="#34d399" font-size="12" font-weight="800">PURE PACKAGE (/p/) · LIVE ON ONYX</text>
    <text x="870" y="76" fill="#f8fafc" font-size="16" font-weight="800">p/.../hearthcore/v0</text>
    <text x="870" y="102" fill="#cbd5e1" font-size="12">• ComputeSplit (0..10000 bps math)</text>
    <text x="870" y="122" fill="#cbd5e1" font-size="12">• ComputeTier &amp; FormatGNOT</text>
    <text x="870" y="142" fill="#cbd5e1" font-size="12">• Zero-reflection RFC-8259 JSON</text>
    <text x="870" y="162" fill="#cbd5e1" font-size="12">• On-chain p/nt/svg/v0 charts</text>
    <text x="870" y="182" fill="#cbd5e1" font-size="12">• EscapeMath &amp; NeutralizeGnoTags</text>
    <text x="870" y="202" fill="#34d399" font-size="11" font-weight="700">Stateless · Importable by any realm</text>

    <!-- Stdlib -->
    <rect x="850" y="232" width="294" height="98" rx="10" fill="#0b1220" stroke="#475569" stroke-width="1.5" />
    <text x="870" y="257" fill="#94a3b8" font-size="11" font-weight="800">GNO v1.8.0 STDLIB &amp; p/nt/v0</text>
    <text x="870" y="280" fill="#cbd5e1" font-size="12">chain/banker · chain/runtime · avl/v0</text>
    <text x="870" y="300" fill="#cbd5e1" font-size="12">seqid/v0 · mux/v0 · svg/v0 · sanitize/v0</text>
    <text x="870" y="318" fill="#cbd5e1" font-size="12">moul/txlink/v0 · uassert/v0 · testutils/v0</text>
  </svg>

  <div class="grid-3">
    <div class="card">
      <div class="stat-label">Pure Package Reusability</div>
      <p style="font-size:13px;margin-top:4px;">Any DAO, grant realm, or marketplace on Gno.land can import <span class="mono">hearthcore/v0</span> for basis-point splits, JSON builders, and SVG visuals.</p>
    </div>
    <div class="card">
      <div class="stat-label">Deterministic Storage</div>
      <p style="font-size:13px;margin-top:4px;">All bounties and guild profiles live in <span class="mono">avl.Tree</span> with <span class="mono">seqid.ID</span> keys and immutable value-copy views (<span class="mono">BountyView</span>, <span class="mono">ProfileView</span>).</p>
    </div>
    <div class="card">
      <div class="stat-label">Namespace Portability</div>
      <p style="font-size:13px;margin-top:4px;">One command (<span class="mono">scripts/set-namespace.sh</span>) retargets every import path from local devnet to Onyx address or mainnet handle.</p>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — System Architecture</span>
    <span class="mono">04 / 10</span>
  </div>
</section>

<!-- SLIDE 5: ESCROW STATE MACHINE & CONSERVATION -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">04 · Protocol Mechanics</div>
      <h2>Deterministic Escrow Lifecycle, Split Math &amp; Guild Tiers</h2>
    </div>
    <span class="pill">Exact Integer Conservation</span>
  </div>

  <svg viewBox="0 0 1168 188" width="100%" style="margin-bottom:16px;">
    <rect x="0" y="0" width="1168" height="188" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
    <!-- Primary Happy Path -->
    <rect x="34" y="30" width="195" height="62" rx="9" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
    <text x="131" y="56" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="800">1. OPEN</text>
    <text x="131" y="76" text-anchor="middle" fill="#94a3b8" font-size="11">PostBounty / TopUp</text>

    <line x1="229" y1="61" x2="296" y2="61" stroke="#cbd5e1" stroke-width="2" />
    <polygon points="296,61 285,55 285,67" fill="#cbd5e1" />
    <text x="262" y="51" text-anchor="middle" fill="#94a3b8" font-size="10">Claim</text>

    <rect x="300" y="30" width="215" height="62" rx="9" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
    <text x="407" y="56" text-anchor="middle" fill="#38bdf8" font-size="14" font-weight="800">2. CLAIMED</text>
    <text x="407" y="76" text-anchor="middle" fill="#94a3b8" font-size="11">Block Deadline Active</text>

    <line x1="515" y1="61" x2="582" y2="61" stroke="#cbd5e1" stroke-width="2" />
    <polygon points="582,61 571,55 571,67" fill="#cbd5e1" />
    <text x="548" y="51" text-anchor="middle" fill="#94a3b8" font-size="10">Proof</text>

    <rect x="586" y="30" width="225" height="62" rx="9" fill="#1e293b" stroke="#a78bfa" stroke-width="2" />
    <text x="698" y="56" text-anchor="middle" fill="#a78bfa" font-size="14" font-weight="800">3. SUBMITTED</text>
    <text x="698" y="76" text-anchor="middle" fill="#94a3b8" font-size="11">URL + SHA-256 Digest</text>

    <line x1="811" y1="61" x2="884" y2="61" stroke="#34d399" stroke-width="2.2" />
    <polygon points="884,61 873,55 873,67" fill="#34d399" />
    <text x="848" y="51" text-anchor="middle" fill="#34d399" font-size="10">Settle</text>

    <rect x="888" y="30" width="246" height="62" rx="9" fill="#122723" stroke="#34d399" stroke-width="2" />
    <text x="1011" y="56" text-anchor="middle" fill="#34d399" font-size="14" font-weight="800">4. SETTLED</text>
    <text x="1011" y="76" text-anchor="middle" fill="#cbd5e1" font-size="11">CEI ugnot Payout + Tier Update</text>

    <!-- Branch states -->
    <rect x="34" y="122" width="230" height="44" rx="8" fill="#23141b" stroke="#f87171" stroke-width="1.5" />
    <text x="149" y="149" text-anchor="middle" fill="#f87171" font-size="12" font-weight="700">CANCELLED (Open Only Refund)</text>

    <rect x="300" y="122" width="245" height="44" rx="8" fill="#172235" stroke="#64748b" stroke-width="1.5" />
    <text x="422" y="149" text-anchor="middle" fill="#cbd5e1" font-size="12" font-weight="700">ReleaseExpiredClaim / Revision</text>

    <rect x="586" y="122" width="548" height="44" rx="8" fill="#291c12" stroke="#fb923c" stroke-width="1.5" />
    <text x="860" y="149" text-anchor="middle" fill="#fb923c" font-size="12" font-weight="700">DISPUTED -> Arbiter ResolveDispute(hunterBps 0..10000) -> Atomic Split &amp; Settle</text>
  </svg>

  <div class="grid-2" style="flex:1;">
    <div class="card">
      <h3>Overflow-Safe Basis-Point Split Math (<span class="mono">types.gno</span>)</h3>
      <div class="code-box mono" style="margin-top:10px;">q := escrowUgnot / 10000
r := escrowUgnot % 10000
hunterUgnot = q*int64(hunterBps) + (r*int64(hunterBps))/10000
sponsorRefundUgnot = escrowUgnot - hunterUgnot
// Invariant: hunterUgnot + sponsorRefundUgnot == escrowUgnot</div>
      <p style="font-size:13px;margin-top:10px;">Zero floating-point math. Tested up to <span class="mono">9,000,000,000,000,000 ugnot</span> with zero dust loss and strict balance invariant: <span class="mono">realmBank == initialBal + totalEscrowUgnot</span>.</p>
    </div>

    <div class="card">
      <h3>Pure Integer On-Chain Reputation Tiers</h3>
      <table style="margin-top:6px;">
        <thead>
          <tr><th>Tier</th><th>Threshold</th><th>Quality Gate</th></tr>
        </thead>
        <tbody>
          <tr><td style="color:#34d399;font-weight:700;">Apprentice</td><td>Default registered profile</td><td>Any</td></tr>
          <tr><td style="color:#38bdf8;font-weight:700;">Journeyman</td><td>&ge; 2 settled OR &ge; 10 GNOT</td><td>Any</td></tr>
          <tr><td style="color:#a78bfa;font-weight:700;">Master</td><td>&ge; 5 settled OR &ge; 100 GNOT</td><td>Any</td></tr>
          <tr><td style="color:#fbbf24;font-weight:700;">Guildmaster</td><td>&ge; 10 settled OR &ge; 500 GNOT</td><td>Rating &ge; 4.5 / 5.0</td></tr>
        </tbody>
      </table>
      <p style="font-size:12px;margin-top:8px;color:#94a3b8;">Both human builders and MCP AI agents compete on the same deterministic leaderboard.</p>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — State Machine &amp; Escrow Conservation</span>
    <span class="mono">05 / 10</span>
  </div>
</section>

<!-- SLIDE 6: SECURITY & INTERREALM V2 INVARIANTS -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">05 · Security Engineering</div>
      <h2>Seven Hardened Interrealm v2 &amp; Render Guarantees</h2>
    </div>
    <span class="pill pill-emerald">0 Lint Warnings · Adversarial Tests</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:24%;">Security Guarantee</th>
        <th style="width:26%;">Code Location</th>
        <th style="width:50%;">Enforced Invariant &amp; Adversarial Test Coverage</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight:700;color:#fbbf24;">1. Runtime-Current Caller Auth</td>
        <td class="mono" style="font-size:12px;">r/.../escrow.gno (12 funcs)</td>
        <td>Every crossing entrypoint takes <span class="mono">cur realm</span> and authenticates <span class="mono">cur.Previous().Address()</span>. Zero <span class="mono">unsafe.PreviousRealm()</span> auth calls.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#fbbf24;">2. Direct-EOA Payment Guard</td>
        <td class="mono" style="font-size:12px;">PostBounty / TopUpBounty</td>
        <td>Requires both <span class="mono">runtime.AssertOriginCall()</span> and <span class="mono">cur.Previous().IsUserCall()</span>; blocks cross-realm wrapper MITM calls and ephemeral <span class="mono">MsgRun</span> scripts.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#fbbf24;">3. Strict Single-Denom Lock</td>
        <td class="mono" style="font-size:12px;">requireSingleUgnotSend()</td>
        <td>Rejects zero coins, dust below <span class="mono">100,000 ugnot</span> (0.10 GNOT), multi-coin sends, and non-<span class="mono">ugnot</span> coins (e.g. <span class="mono">uatom</span>) so assets cannot be trapped.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#fbbf24;">4. CEI Settlement Ordering</td>
        <td class="mono" style="font-size:12px;">ApproveAndSettle / Resolve</td>
        <td>All escrow balances, status counters, and profiles mutate before <span class="mono">banker.BankerTypeRealmSend</span> executes coin transfers.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#fbbf24;">5. Anti-Gaming &amp; Liveness</td>
        <td class="mono" style="font-size:12px;">Claim / Cancel / Release</td>
        <td>Sponsors cannot self-claim or cancel claimed work. Stale claims unlock permissionlessly after <span class="mono">DeadlineHeight</span> blocks.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#fbbf24;">6. Render() Injection Defense</td>
        <td class="mono" style="font-size:12px;">render.gno / types.gno</td>
        <td>All user text passes <span class="mono">p/nt/markdown/sanitize/v0</span>, <span class="mono">EscapeMath</span> (<span class="mono">$</span> &rarr; <span class="mono">\\$</span>), and <span class="mono">NeutralizeGnoTags</span> (blocks smuggled <span class="mono">&lt;gno-button&gt;</span> / <span class="mono">&lt;gno-form&gt;</span>).</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#fbbf24;">7. Mainnet Write Safety Block</td>
        <td class="mono" style="font-size:12px;">mcp-server/src/tools.ts</td>
        <td><span class="mono">assertWritableChain()</span> permits write prep only on <span class="mono">dev</span> / <span class="mono">onyx-1</span> and permanently blocks <span class="mono">gnoland-1</span> mainnet.</td>
      </tr>
    </tbody>
  </table>

  <div class="slide-footer">
    <span>HearthBounty — Security &amp; Interrealm v2 Invariants</span>
    <span class="mono">06 / 10</span>
  </div>
</section>

<!-- SLIDE 7: LIVE GNOWEB UI & INTERACTIVE PLAYGROUND -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">06 · Product Experience</div>
      <h2>Native gnoweb v1.8.0 UI + V2 Zero-Install Web Playground</h2>
    </div>
    <span class="pill">Judge-Ready Experience</span>
  </div>

  <div class="grid-2" style="margin-bottom:16px;">
    <div class="shot-frame">
      <img src="${shotBoard}" alt="HearthBounty Home Board in gnoweb" />
      <div class="shot-cap">Native gnoweb Board: On-chain p/nt/svg/v0 escrow chart, KPI frames &amp; track filters</div>
    </div>
    <div class="shot-frame">
      <img src="${shotDetail}" alt="Bounty Detail and Proof Card" />
      <div class="shot-cap">Bounty Detail: 4-stage lifecycle SVG, SHA-256 proof digest &amp; contextual &lt;gno-form&gt; cards</div>
    </div>
  </div>

  <div class="grid-3">
    <div class="card card-amber">
      <h3>Live Onyx Explorer</h3>
      <p style="font-size:13px;">Direct browser queries to <span class="mono">rpc.onyx.testnets.gno.land</span> verifying live block height, <span class="mono">vm/qpkgmeta_json</span>, and confirmed TX hashes.</p>
    </div>
    <div class="card card-sky">
      <h3>Exact State Machine Mirror</h3>
      <p style="font-size:13px;">Interactive simulator mirrors all 12 Gno crossing functions, CEI bank balance checks, adversarial MITM/denom testing, and MCP tool calls.</p>
    </div>
    <div class="card card-emerald">
      <h3>60s Walkthrough + /diag</h3>
      <p style="font-size:13px;">Slide-over Judge Walkthrough drawer and one-click <span class="mono">/diag</span> self-test verify every invariant directly in the browser with zero local setup.</p>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — gnoweb UI &amp; Web Playground</span>
    <span class="mono">07 / 10</span>
  </div>
</section>

<!-- SLIDE 8: AI AGENT MCP WORKFLOW -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">07 · Autonomous AI Agent Bridge</div>
      <h2>hearthbounty-mcp: 10 Native MCP Tools Ready for gnomcp</h2>
    </div>
    <span class="pill pill-sky">Claude · Cursor · Gemini CLI</span>
  </div>

  <div class="grid-2" style="flex:1;align-items:start;">
    <div>
      <table>
        <thead>
          <tr><th>MCP Tool</th><th>Mode</th><th>On-Chain Action / Query</th></tr>
        </thead>
        <tbody>
          <tr><td class="mono" style="font-size:12px;">hearth_chain_status</td><td>Read</td><td>/status + qpkgmeta + ExportStatsJSON</td></tr>
          <tr><td class="mono" style="font-size:12px;">hearth_list_bounties</td><td>Read</td><td>Filtered ExportBountiesJSON via qeval</td></tr>
          <tr><td class="mono" style="font-size:12px;">hearth_get_bounty</td><td>Read</td><td>Full spec, proof &amp; escrow detail</td></tr>
          <tr><td class="mono" style="font-size:12px;">hearth_leaderboard</td><td>Read</td><td>Deterministic ranked builder/agent list</td></tr>
          <tr><td class="mono" style="font-size:12px;">hearth_get_profile</td><td>Read</td><td>Tier, rating &amp; MCP agent endpoint</td></tr>
          <tr><td class="mono" style="font-size:12px;">hearth_render_page</td><td>Read</td><td>Raw gnoweb Markdown via vm/qrender</td></tr>
          <tr><td class="mono" style="font-size:12px;color:#fbbf24;">hearth_prepare_post_bounty</td><td>Prep</td><td>PostBounty + ugnot escrow tx</td></tr>
          <tr><td class="mono" style="font-size:12px;color:#fbbf24;">hearth_prepare_claim</td><td>Prep</td><td>Verify open + build ClaimBounty tx</td></tr>
          <tr><td class="mono" style="font-size:12px;color:#fbbf24;">hearth_prepare_submit_proof</td><td>Prep</td><td>Auto-hash SHA-256 + SubmitProof tx</td></tr>
          <tr><td class="mono" style="font-size:12px;color:#fbbf24;">hearth_prepare_settle</td><td>Prep</td><td>Verify proof + ApproveAndSettle tx</td></tr>
        </tbody>
      </table>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;">
      <div class="shot-frame">
        <img src="${shotAgents}" alt="AI Agent MCP Hub" style="height:225px;" />
        <div class="shot-cap">On-Chain AI Agent Hub (:agents) documenting vm/qeval &amp; gnomcp pairing</div>
      </div>

      <div class="card card-sky">
        <h3>Autonomous Agent Loop (<span class="mono">hearth-cli agent-demo</span>)</h3>
        <div class="code-box mono" style="margin-top:6px;font-size:11.5px;">1. Query ExportBountiesJSON("open", "", 0, 20) via ABCI vm/qeval
2. Rank open quests by escrow_ugnot and match agent skills
3. Emit ClaimBounty payload (gnomcp gno_call + gnokey CLI)
4. Compute deterministic sha256:&lt;hex&gt; digest over deliverable
5. Prepare SubmitProof -> Sponsor calls ApproveAndSettle</div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — MCP AI Agent Workflow</span>
    <span class="mono">08 / 10</span>
  </div>
</section>

<!-- SLIDE 9: LIVE ONYX PROOFS & VERIFICATION -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">08 · Verifiable On-Chain Proof</div>
      <h2>Live Gno.land Onyx (onyx-1) Deployment &amp; Test Scorecard</h2>
    </div>
    <span class="pill pill-emerald">Independently Verifiable via RPC</span>
  </div>

  <div class="card" style="margin-bottom:16px;">
    <h3>Confirmed Onyx Testnet Transactions (Namespace: <span class="mono" style="color:#fbbf24;">g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4</span>)</h3>
    <table style="margin-top:8px;">
      <thead>
        <tr>
          <th>Artifact</th>
          <th>On-Chain Path</th>
          <th>Block</th>
          <th>Gas Used</th>
          <th>Onyx Status</th>
          <th>Confirmed TX Hash (Hex)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight:700;">Pure Package</td>
          <td class="mono" style="font-size:11.5px;">p/g1x582...uuq4/hearthcore/v0</td>
          <td class="mono" style="color:#38bdf8;font-weight:700;">1,374,766</td>
          <td class="mono">33,928,050</td>
          <td><span class="pill pill-emerald" style="font-size:11px;padding:2px 8px;">LIVE</span></td>
          <td class="mono" style="font-size:11px;">0x54B2CE7FAC30...2DA1CB1A</td>
        </tr>
        <tr>
          <td style="font-weight:700;">Stateful Realm</td>
          <td class="mono" style="font-size:11.5px;">r/g1x582...uuq4/hearthbounty/v0</td>
          <td class="mono" style="color:#38bdf8;font-weight:700;">1,374,813</td>
          <td class="mono">94,047,145</td>
          <td><span class="pill" style="font-size:11px;padding:2px 8px;">INERT (Queued)</span></td>
          <td class="mono" style="font-size:11px;">0xBB26A27BC481...1E8D0BC5</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size:12px;margin-top:10px;color:#94a3b8;">
      Onyx enforces <span class="mono">vm:p:code_submission_policy = "inert"</span>; <span class="mono">hearthcore/v0</span> is already approved and LIVE on-chain, and <span class="mono">hearthbounty/v0</span> is confirmed on-chain pending <span class="mono">vm/enable_package</span> by package approvers.
    </p>
  </div>

  <div class="grid-2" style="align-items:stretch;">
    <div class="card card-emerald">
      <h3>Automated Verification Scorecard</h3>
      <ul class="clean">
        <li><strong class="mono" style="color:#34d399;">8 / 8</strong> <span class="mono">hearthcore/v0</span> Gno unit tests (split conservation, tiers, JSON, SVG, validation).</li>
        <li><strong class="mono" style="color:#34d399;">4 / 4</strong> <span class="mono">hearthbounty/v0</span> Gno integration tests (lifecycle, expiry, dispute split, security guards, sanitized Render).</li>
        <li><strong class="mono" style="color:#34d399;">0</strong> <span class="mono">gno lint</span> errors or warnings across all packages and realms.</li>
        <li><strong class="mono" style="color:#34d399;">5 / 5</strong> TypeScript MCP unit &amp; InMemoryTransport wire-protocol tests.</li>
        <li><strong class="mono" style="color:#34d399;">4 / 4</strong> Web Playground unit tests + 9 live browser <span class="mono">/diag</span> checks.</li>
      </ul>
    </div>

    <div class="shot-frame">
      <img src="${shotLeader}" alt="Guild Reputation Leaderboard" style="height:215px;" />
      <div class="shot-cap">Deterministic Leaderboard (:leaderboard): Human Builders &amp; MCP AI Agents</div>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — On-Chain Proofs &amp; Verification</span>
    <span class="mono">09 / 10</span>
  </div>
</section>

<!-- SLIDE 10: ROADMAP & MAINNET RETENTION -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">09 · Execution Roadmap</div>
      <h2>6-Month Path to Mainnet, Adoption &amp; Builder Retention</h2>
    </div>
    <span class="pill pill-emerald">Mainnet &amp; Ecosystem Ready</span>
  </div>

  <div class="grid-3" style="margin-bottom:20px;">
    <div class="card card-amber">
      <div class="stat-label" style="color:#fbbf24;">Month 1 · Onyx Activation</div>
      <h3 style="margin-top:6px;">Live Testnet Guild Bounties</h3>
      <ul class="clean">
        <li>Enable <span class="mono">hearthbounty/v0</span> on Onyx via package approver queue and seed live community micro-bounties.</li>
        <li>Publish <span class="mono">hearthbounty-mcp</span> to npm for one-command <span class="mono">npx</span> installation alongside <span class="mono">gnomcp</span>.</li>
        <li>Ship open-source agent starter templates for Claude, Cursor, and Gemini CLI.</li>
      </ul>
    </div>

    <div class="card card-sky">
      <div class="stat-label" style="color:#38bdf8;">Months 2–3 · Mainnet Launch</div>
      <h3 style="margin-top:6px;">50+ Unique Addresses &amp; Realm Reuse</h3>
      <ul class="clean">
        <li>Deploy <span class="mono">hearthcore/v0</span> and <span class="mono">hearthbounty/v1</span> on Gno.land mainnet with registered handle namespace.</li>
        <li>Integrate <span class="mono">hearthcore/v0</span> escrow split &amp; SVG components into partner community realms.</li>
        <li>Upgrade single arbiter to DAO multisig / optimistic dispute committee via <span class="mono">SetArbiter</span>.</li>
      </ul>
    </div>

    <div class="card card-emerald">
      <div class="stat-label" style="color:#34d399;">Months 4–6 · Guild Scale</div>
      <h3 style="margin-top:6px;">100+ Builders, Milestones &amp; Indexer</h3>
      <ul class="clean">
        <li>Add multi-milestone escrows and GRC20 optional bounty token adapters while preserving single-denom safety per bounty.</li>
        <li>Connect Onyx/Mainnet GraphQL indexer feeds for cross-realm reputation portability.</li>
        <li>Monthly releases, public security reviews, and continuous community bounty sprints.</li>
      </ul>
    </div>
  </div>

  <div class="card" style="background:#101a30;border-color:rgba(245,158,11,0.4);">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;">
      <div>
        <div class="eyebrow" style="margin-bottom:4px;">Verify Everything Right Now (Zero Install)</div>
        <div class="mono" style="font-size:13px;line-height:1.75;color:#f8fafc;">
          <div>Interactive Playground: <span style="color:#fbbf24;">https://alphonshhhomenicmtu.github.io/hearthbounty/</span></div>
          <div>Onyx Realm (gnoweb):   <span style="color:#38bdf8;">https://onyx.testnets.gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v0</span></div>
          <div>GitHub Repository:     <span style="color:#34d399;">https://github.com/alphonshhhomenicmtu/hearthbounty</span></div>
          <div>1080p Demo Video:      <span style="color:#a78bfa;">https://youtu.be/vK6z7MJiRAk</span></div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:22px;font-weight:900;color:#fbbf24;">HearthBounty</div>
        <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Gnome Tavern Hackathon | Gno.land</div>
        <div class="mono" style="font-size:11px;color:#64748b;margin-top:4px;">MIT License · DoraHacks Build #51787</div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — Roadmap &amp; Links</span>
    <span class="mono">10 / 10</span>
  </div>
</section>

</body>
</html>
`;

fs.writeFileSync(TMP_HTML, html, "utf8");

const chrome = findChrome();
const tmpProfile = fs.mkdtempSync(path.join(os.tmpdir(), "hearth-pdf-"));
console.log(`Rendering 10-slide PDF with: ${chrome}`);
const res = spawnSync(
  chrome,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--no-first-run",
    "--disable-crash-reporter",
    "--disable-extensions",
    `--user-data-dir=${tmpProfile}`,
    "--print-to-pdf-no-header",
    `--print-to-pdf=${OUT_PDF}`,
    `file://${TMP_HTML}`,
  ],
  { stdio: "inherit", timeout: 45_000 },
);

fs.rmSync(TMP_HTML, { force: true });
fs.rmSync(tmpProfile, { recursive: true, force: true });

if (!fs.existsSync(OUT_PDF) || fs.statSync(OUT_PDF).size < 10_000) {
  throw new Error(`PDF generation failed (exit=${res.status})`);
}
const header = fs.readFileSync(OUT_PDF).subarray(0, 5).toString("ascii");
if (header !== "%PDF-") {
  throw new Error(`Generated file is not a valid PDF (header=${header})`);
}

fs.mkdirSync(path.dirname(WEB_PDF), { recursive: true });
fs.copyFileSync(OUT_PDF, WEB_PDF);

const stat = fs.statSync(OUT_PDF);
console.log(`Generated ${OUT_PDF} (${(stat.size / 1024).toFixed(1)} KB) and copied to ${WEB_PDF}`);
