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

// Optional dynamic live status/tx metadata injected when onyx-v1-proofs.json exists
const proofsPath = path.join(ROOT, "docs", "onyx-v1-proofs.json");
const proofs = fs.existsSync(proofsPath)
  ? JSON.parse(fs.readFileSync(proofsPath, "utf8"))
  : {
      v1Status: "LIVE",
      guildStatus: "LIVE",
      seededTxSummary: "RegisterProfile, PostBounty, ClaimBounty, SubmitProof & ApproveAndSettle verified on onyx-1",
    };

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>HearthBounty V2.1 — Pitch Deck (Gnome Tavern Hackathon | Gno.land)</title>
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
    margin-bottom: 20px;
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
    font-size: 29px;
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
    font-size: 14.5px;
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
    padding: 16px 18px;
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
    font-size: 12.5px;
  }
  th, td {
    padding: 8px 10px;
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
    font-size: 13.5px;
    line-height: 1.5;
  }
  ul.clean li {
    margin-bottom: 5px;
  }
  .code-box {
    background: #050912;
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 8px;
    padding: 11px 13px;
    font-size: 11.5px;
    line-height: 1.48;
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
    height: 250px;
    object-fit: cover;
    object-position: top;
    display: block;
  }
  .shot-cap {
    padding: 7px 12px;
    font-size: 11.5px;
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
    <span class="pill pill-emerald">V2.1 Hardened · Onyx (onyx-1)</span>
  </div>

  <h1>HearthBounty v1</h1>
  <p style="font-size:21px;color:#cbd5e1;max-width:880px;margin-top:14px;line-height:1.4;">
    Hardened 1:1 <span class="mono">wugnot</span> Micro-Bounty Escrow, Per-Contributor Custody, Composable Guild Passports, and MCP AI Agent Bridge on Gno.land v1.8.0.
  </p>

  <div class="grid-4" style="margin-top:32px;">
    <div class="card card-amber">
      <div class="stat-num mono">3</div>
      <div class="stat-label">Composable Onyx Modules</div>
      <p style="font-size:12px;margin-top:5px;">hearthcore/v0 (/p/), hearthbounty/v1 (/r/), and consumer hearthguild/v0 (/r/)</p>
    </div>
    <div class="card card-emerald">
      <div class="stat-num mono">26 / 26</div>
      <div class="stat-label">Automated Tests Passing</div>
      <p style="font-size:12px;margin-top:5px;">16 gno test · 0 gno lint · 5 MCP wire tests · 5 Playground &amp; Breaker tests</p>
    </div>
    <div class="card card-sky">
      <div class="stat-num mono">12</div>
      <div class="stat-label">MCP AI Agent Tools</div>
      <p style="font-size:12px;margin-top:5px;">Native ABCI vm/qeval JSON + wugnot tx prep + gnoland-1 write block</p>
    </div>
    <div class="card">
      <div class="stat-num mono">4 / 4</div>
      <div class="stat-label">Audit Exploits Defended</div>
      <p style="font-size:12px;margin-top:5px;">H-1 donor custody, M-1 liveness timeouts, M-2 Unicode sanitizer, IR-v2 MITM</p>
    </div>
  </div>

  <div style="margin-top:26px;display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#94a3b8;" class="mono">
    <span>Playground &amp; Breaker Lab: https://alphonshhhomenicmtu.github.io/hearthbounty/</span>
    <span>·</span>
    <span>Demo: https://youtu.be/vK6z7MJiRAk</span>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — V2.1 Hardened Submission Deck</span>
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
    <span class="pill">Protocol &amp; Security Gap</span>
  </div>

  <div class="grid-2" style="flex:1;align-content:center;">
    <div class="card">
      <h3 style="color:#fbbf24;">1. Third-Party Crowd-Funding Custody Bugs</h3>
      <p>Naive escrow contracts pool sponsor deposits and external top-ups into one counter, allowing a malicious sponsor to cancel an open bounty and steal third-party contributions.</p>
      <ul class="clean">
        <li>External donors need direct on-chain refund custody, never sponsor custody.</li>
        <li>Claimants and donors must be blocked from washing top-ups into fake earnings.</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="color:#38bdf8;">2. Human-Only UIs Invisible to AI Coding Agents</h3>
      <p>Autonomous coding agents (Claude, Cursor, Gemini CLI) can write and test Gno realms, yet most dApps lack deterministic ABCI JSON query endpoints and testnet-safe transaction builders.</p>
      <ul class="clean">
        <li>Agents need structured RFC-8259 JSON via <span class="mono">vm/qeval</span> instead of brittle HTML scraping.</li>
        <li>Signing preparation must permanently refuse <span class="mono">gnoland-1</span> mainnet writes.</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="color:#a78bfa;">3. Hostage Submissions &amp; Unbounded Arbiter Power</h3>
      <p>Without deterministic block-height timeouts on review and dispute windows, a ghosting sponsor or conflicted arbiter can trap delivered work forever.</p>
      <ul class="clean">
        <li>Permissionless timeouts guarantee funds always clear cleanly on-chain.</li>
        <li>Conflict checks prevent an arbiter from ruling on their own bounties.</li>
      </ul>
    </div>
    <div class="card">
      <h3 style="color:#34d399;">4. Non-Composable Monolithic Realms</h3>
      <p>Single-contract demos cannot be imported by downstream DAOs, grant programs, or reputation gates — missing Gno.land's composable <span class="mono">/p/</span> + <span class="mono">/r/</span> builder model.</p>
      <ul class="clean">
        <li>HearthBounty ships <span class="mono">hearthcore/v0</span> + <span class="mono">hearthbounty/v1</span> + live consumer <span class="mono">hearthguild/v0</span>.</li>
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
      <h2>Hardened 1:1 wugnot Protocol + Dual Human &amp; AI Surfaces</h2>
    </div>
    <span class="pill pill-emerald">Zero chain/banker · GPAO-Clean</span>
  </div>

  <p style="font-size:15.5px;margin-bottom:18px;max-width:1080px;">
    HearthBounty v1 settles in official Genesis 1:1 <span class="mono">ugnot</span>-backed <span class="mono">wugnot</span> via non-crossing <span class="mono">gno.land/r/nt/grc20reg/v0</span> <span class="mono">RealmTeller</span> transfers — eliminating <span class="mono">chain/banker</span> and <span class="mono">chain/runtime/unsafe</span> from production code so Onyx's automated GPAO clears it to live HTTP 200.
  </p>

  <div class="grid-3" style="align-items:stretch;">
    <div class="card card-amber">
      <div class="stat-label" style="color:#fbbf24;">Surface A · Native gnoweb v1.8</div>
      <h3 style="margin-top:6px;">Paginated On-Chain UI</h3>
      <ul class="clean">
        <li>Multi-route <span class="mono">p/nt/mux/v0</span> interface (<span class="mono">:page/N</span>, <span class="mono">:post</span>, <span class="mono">:bounty/id</span>, <span class="mono">:leaderboard</span>, <span class="mono">:agents</span>).</li>
        <li>Deterministic SVG escrow chart, 4-stage lifecycle strip, and tier shields via <span class="mono">p/nt/svg/v0</span>.</li>
        <li>1-click <span class="mono">wugnot.Deposit</span>, <span class="mono">Approve</span>, and contextual <span class="mono">&lt;gno-form&gt;</span> wallet actions.</li>
      </ul>
    </div>
    <div class="card card-sky">
      <div class="stat-label" style="color:#38bdf8;">Surface B · Autonomous AI Agents</div>
      <h3 style="margin-top:6px;">12-Tool MCP Server + CLI</h3>
      <ul class="clean">
        <li>5 zero-reflection RFC-8259 <span class="mono">Export*JSON</span> endpoints queried via TM2 ABCI <span class="mono">vm/qeval</span>.</li>
        <li>12 stdio MCP tools in <span class="mono">hearthbounty-mcp</span> including <span class="mono">ExpireSubmission</span> &amp; <span class="mono">ExpireDispute</span>.</li>
        <li>Emits <span class="mono">wugnot</span> pre-steps + <span class="mono">gnomcp</span>/<span class="mono">gnokey</span> commands; blocks <span class="mono">gnoland-1</span> writes.</li>
      </ul>
    </div>
    <div class="card card-emerald">
      <div class="stat-label" style="color:#34d399;">Surface C · Composable Ecosystem</div>
      <h3 style="margin-top:6px;">Consumer Realm + Breaker Lab</h3>
      <ul class="clean">
        <li>Companion consumer <span class="mono">hearthguild/v0</span> imports both <span class="mono">hearthcore/v0</span> &amp; <span class="mono">hearthbounty/v1</span>.</li>
        <li>Zero-install Web Playground + 1-click Adversarial Breaker Lab (H-1, M-1, M-2, MITM).</li>
        <li>Live Onyx RPC Explorer &amp; automated <span class="mono">/diag</span> self-test verifying every claim.</li>
      </ul>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — V2.1 Solution Overview</span>
    <span class="mono">03 / 10</span>
  </div>
</section>

<!-- SLIDE 4: ARCHITECTURE -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">03 · System Architecture</div>
      <h2>Three-Module Composable Stack (/p/ + /r/ + Consumer /r/)</h2>
    </div>
    <span class="pill pill-sky">Builder Retention Import Gate</span>
  </div>

  <svg viewBox="0 0 1168 355" width="100%" style="margin-bottom:14px;">
    <rect x="0" y="0" width="1168" height="355" rx="14" fill="#0f172a" stroke="#334155" stroke-width="1.5" />

    <!-- Clients -->
    <rect x="22" y="22" width="278" height="142" rx="10" fill="#152036" stroke="#f59e0b" stroke-width="1.8" />
    <text x="38" y="48" fill="#fbbf24" font-size="11.5" font-weight="800">HUMAN BUILDERS &amp; SPONSORS</text>
    <text x="38" y="72" fill="#f8fafc" font-size="14.5" font-weight="700">gnoweb v1.8 + Adena Wallet</text>
    <text x="38" y="96" fill="#94a3b8" font-size="11.5">• Paginated Render(path) &amp; SVG</text>
    <text x="38" y="116" fill="#94a3b8" font-size="11.5">• wugnot Deposit -&gt; Approve -&gt; Post</text>
    <text x="38" y="136" fill="#94a3b8" font-size="11.5">• V2.1 Playground &amp; Breaker Lab</text>

    <rect x="22" y="190" width="278" height="142" rx="10" fill="#152036" stroke="#38bdf8" stroke-width="1.8" />
    <text x="38" y="216" fill="#38bdf8" font-size="11.5" font-weight="800">AUTONOMOUS AI AGENTS</text>
    <text x="38" y="240" fill="#f8fafc" font-size="14.5" font-weight="700">hearthbounty-mcp + gnomcp</text>
    <text x="38" y="264" fill="#94a3b8" font-size="11.5">• 12 stdio MCP tools + hearth-cli</text>
    <text x="38" y="284" fill="#94a3b8" font-size="11.5">• HTTPS-only SHA-256 proof hashing</text>
    <text x="38" y="304" fill="#94a3b8" font-size="11.5">• Mainnet gnoland-1 write block</text>

    <line x1="300" y1="93" x2="366" y2="128" stroke="#fbbf24" stroke-width="2" />
    <polygon points="366,128 354,118 351,130" fill="#fbbf24" />
    <line x1="300" y1="261" x2="366" y2="220" stroke="#38bdf8" stroke-width="2" />
    <polygon points="366,220 351,218 356,230" fill="#38bdf8" />

    <!-- Core Realm -->
    <rect x="370" y="22" width="382" height="310" rx="12" fill="#131e36" stroke="#a78bfa" stroke-width="2" />
    <text x="390" y="48" fill="#a78bfa" font-size="11.5" font-weight="800">HARDENED ESCROW REALM (/r/)</text>
    <text x="390" y="72" fill="#f8fafc" font-size="15.5" font-weight="800">r/g1x582...uuq4/hearthbounty/v1</text>

    <rect x="390" y="88" width="342" height="48" rx="7" fill="#0b1220" stroke="#334155" />
    <text x="404" y="109" fill="#e2e8f0" font-size="12.5" font-weight="700">escrow.gno — 14 Crossing Entrypoints</text>
    <text x="404" y="126" fill="#94a3b8" font-size="11">1:1 wugnot grc20reg · DonorShares · ExpireSubmission/Dispute</text>

    <rect x="390" y="146" width="342" height="48" rx="7" fill="#0b1220" stroke="#334155" />
    <text x="404" y="167" fill="#e2e8f0" font-size="12.5" font-weight="700">sanitize.gno — M-2 Unicode &amp; URL Defense</text>
    <text x="404" y="184" fill="#94a3b8" font-size="11">Byte-indexed ASCII NeutralizeGnoTags · HTTPS-only proof links</text>

    <rect x="390" y="204" width="342" height="48" rx="7" fill="#0b1220" stroke="#334155" />
    <text x="404" y="225" fill="#e2e8f0" font-size="12.5" font-weight="700">state.gno &amp; query.gno — AVL + 5 JSON APIs</text>
    <text x="404" y="242" fill="#94a3b8" font-size="11">Canonical realm_path, escrow_token, donor custody &amp; deadlines</text>

    <rect x="390" y="262" width="342" height="48" rx="7" fill="#0b1220" stroke="#334155" />
    <text x="404" y="283" fill="#e2e8f0" font-size="12.5" font-weight="700">render.gno — Paginated mux v0 UI (20/page)</text>
    <text x="404" y="300" fill="#94a3b8" font-size="11">net/url tx links (0 unsafe) · &lt;gno-form&gt; · p/nt/svg/v0 charts</text>

    <!-- Arrows right -->
    <line x1="752" y1="95" x2="824" y2="95" stroke="#34d399" stroke-width="2" />
    <polygon points="824,95 812,88 812,102" fill="#34d399" />

    <line x1="824" y1="242" x2="752" y2="242" stroke="#fbbf24" stroke-width="2" />
    <polygon points="752,242 764,235 764,249" fill="#fbbf24" />

    <!-- Pure Package -->
    <rect x="828" y="22" width="316" height="156" rx="12" fill="#132229" stroke="#34d399" stroke-width="2" />
    <text x="846" y="48" fill="#34d399" font-size="11.5" font-weight="800">PURE PACKAGE (/p/) · LIVE ON ONYX</text>
    <text x="846" y="70" fill="#f8fafc" font-size="15" font-weight="800">p/g1x582...uuq4/hearthcore/v0</text>
    <text x="846" y="94" fill="#cbd5e1" font-size="11.5">• ComputeSplit (0..10000 bps conservation)</text>
    <text x="846" y="114" fill="#cbd5e1" font-size="11.5">• ComputeTier, FormatGNOT &amp; EscapeMath</text>
    <text x="846" y="134" fill="#cbd5e1" font-size="11.5">• Zero-reflection RFC-8259 JSON &amp; SVG</text>
    <text x="846" y="156" fill="#34d399" font-size="11" font-weight="700">Imported by hearthbounty/v1 &amp; hearthguild/v0</text>

    <!-- Consumer Realm -->
    <rect x="828" y="192" width="316" height="140" rx="12" fill="#211c12" stroke="#f59e0b" stroke-width="2" />
    <text x="846" y="218" fill="#fbbf24" font-size="11.5" font-weight="800">COMPANION CONSUMER REALM (/r/)</text>
    <text x="846" y="240" fill="#f8fafc" font-size="15" font-weight="800">r/g1x582...uuq4/hearthguild/v0</text>
    <text x="846" y="264" fill="#cbd5e1" font-size="11.5">• Imports hearthcore/v0 + hearthbounty/v1</text>
    <text x="846" y="284" fill="#cbd5e1" font-size="11.5">• EndorseBuilder, CheckEligibility, Passport</text>
    <text x="846" y="304" fill="#cbd5e1" font-size="11.5">• Zero chain/banker · Zero runtime/unsafe</text>
  </svg>

  <div class="grid-3">
    <div class="card">
      <div class="stat-label">Genesis 1:1 wugnot Rail</div>
      <p style="font-size:12.5px;margin-top:4px;">Uses live Genesis <span class="mono">r/nt/grc20reg/v0</span> (<span class="mono">wugnot</span>) non-crossing <span class="mono">RealmTeller</span> so every GNOT stays 1:1 redeemable with zero <span class="mono">chain/banker</span> hold.</p>
    </div>
    <div class="card">
      <div class="stat-label">Deterministic AVL Storage</div>
      <p style="font-size:12.5px;margin-top:4px;">All bounties, profiles, and per-donor custody ledgers live in <span class="mono">avl.Tree</span> with immutable value-copy views.</p>
    </div>
    <div class="card">
      <div class="stat-label">Live On-Chain Import Proof</div>
      <p style="font-size:12.5px;margin-top:4px;"><span class="mono">hearthguild/v0</span> reads live <span class="mono">hearthbounty/v1</span> reputation and renders <span class="mono">hearthcore/v0</span> badges for DAO/grant gating.</p>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — Composable Architecture</span>
    <span class="mono">04 / 10</span>
  </div>
</section>

<!-- SLIDE 5: ESCROW STATE MACHINE & CONSERVATION -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">04 · Protocol Mechanics</div>
      <h2>Bounded Escrow Lifecycle, Per-Donor Custody &amp; Guild Tiers</h2>
    </div>
    <span class="pill">Exact Integer Conservation</span>
  </div>

  <svg viewBox="0 0 1168 188" width="100%" style="margin-bottom:14px;">
    <rect x="0" y="0" width="1168" height="188" rx="12" fill="#0f172a" stroke="#334155" stroke-width="1.5" />
    <rect x="28" y="26" width="205" height="62" rx="9" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
    <text x="130" y="52" text-anchor="middle" fill="#fbbf24" font-size="14" font-weight="800">1. OPEN</text>
    <text x="130" y="72" text-anchor="middle" fill="#94a3b8" font-size="11">PostBounty / DonorShares</text>

    <line x1="233" y1="57" x2="294" y2="57" stroke="#cbd5e1" stroke-width="2" />
    <polygon points="294,57 283,51 283,63" fill="#cbd5e1" />
    <text x="263" y="47" text-anchor="middle" fill="#94a3b8" font-size="10">Claim</text>

    <rect x="298" y="26" width="218" height="62" rx="9" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
    <text x="407" y="52" text-anchor="middle" fill="#38bdf8" font-size="14" font-weight="800">2. CLAIMED</text>
    <text x="407" y="72" text-anchor="middle" fill="#94a3b8" font-size="11">DeadlineHeight Active</text>

    <line x1="516" y1="57" x2="578" y2="57" stroke="#cbd5e1" stroke-width="2" />
    <polygon points="578,57 567,51 567,63" fill="#cbd5e1" />
    <text x="547" y="47" text-anchor="middle" fill="#94a3b8" font-size="10">HTTPS Proof</text>

    <rect x="582" y="26" width="234" height="62" rx="9" fill="#1e293b" stroke="#a78bfa" stroke-width="2" />
    <text x="699" y="52" text-anchor="middle" fill="#a78bfa" font-size="14" font-weight="800">3. SUBMITTED</text>
    <text x="699" y="72" text-anchor="middle" fill="#94a3b8" font-size="11">ReviewDeadlineHeight Active</text>

    <line x1="816" y1="57" x2="880" y2="57" stroke="#34d399" stroke-width="2.2" />
    <polygon points="880,57 869,51 869,63" fill="#34d399" />
    <text x="848" y="47" text-anchor="middle" fill="#34d399" font-size="10">Settle / Expire</text>

    <rect x="884" y="26" width="256" height="62" rx="9" fill="#122723" stroke="#34d399" stroke-width="2" />
    <text x="1012" y="52" text-anchor="middle" fill="#34d399" font-size="14" font-weight="800">4. SETTLED</text>
    <text x="1012" y="72" text-anchor="middle" fill="#cbd5e1" font-size="11">CEI wugnot Payout + Tier Update</text>

    <rect x="28" y="118" width="265" height="48" rx="8" fill="#23141b" stroke="#f87171" stroke-width="1.5" />
    <text x="160" y="140" text-anchor="middle" fill="#f87171" font-size="11.5" font-weight="700">CANCELLED (Open Only)</text>
    <text x="160" y="156" text-anchor="middle" fill="#cbd5e1" font-size="10.5">Direct refund to Sponsor + each Donor</text>

    <rect x="308" y="118" width="260" height="48" rx="8" fill="#172235" stroke="#64748b" stroke-width="1.5" />
    <text x="438" y="140" text-anchor="middle" fill="#cbd5e1" font-size="11.5" font-weight="700">ReleaseExpiredClaim / Revision</text>
    <text x="438" y="156" text-anchor="middle" fill="#94a3b8" font-size="10.5">Exact block release · clears stale proofs</text>

    <rect x="582" y="118" width="558" height="48" rx="8" fill="#291c12" stroke="#fb923c" stroke-width="1.5" />
    <text x="861" y="140" text-anchor="middle" fill="#fb923c" font-size="11.5" font-weight="700">DISPUTED -&gt; Non-Party Arbiter ResolveDispute OR Permissionless ExpireDispute (50/50)</text>
    <text x="861" y="156" text-anchor="middle" fill="#cbd5e1" font-size="10.5">Pro-rata refund splits to Sponsor and every external DonorShare</text>
  </svg>

  <div class="grid-2" style="flex:1;">
    <div class="card">
      <h3>Per-Contributor Pro-Rata Split Math (<span class="mono">escrow.gno</span>)</h3>
      <div class="code-box mono" style="margin-top:8px;">// Each contributor's refund is computed independently via ComputeSplit
_, sponsorRefund := hearthcore.ComputeSplit(b.SponsorFundedUgnot, hunterBps)
for each (donor, share) in b.DonorShares (sorted AVL order):
    _, dRefund := hearthcore.ComputeSplit(share, hunterBps)
hunterShare := escrow - (sponsorRefund + sum(dRefund))
// Exact conservation: hunterShare + sponsorRefund + sum(dRefund) == escrow</div>
      <p style="font-size:12.5px;margin-top:8px;">Zero float math, zero dust leaks, strict <span class="mono">wugnot.BalanceOf(realm) == base + totalEscrowUgnot</span>.</p>
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
      <p style="font-size:12px;margin-top:8px;color:#94a3b8;">Refunded cancellations decrement <span class="mono">SponsoredUgnot</span> so phantom sponsorship cannot game rankings.</p>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — State Machine &amp; Custody Math</span>
    <span class="mono">05 / 10</span>
  </div>
</section>

<!-- SLIDE 6: V2.1 SECURITY AUDIT FIXES -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">05 · V2.1 Security Engineering</div>
      <h2>Red-Team Audit Findings Resolved &amp; Proven with Regression Tests</h2>
    </div>
    <span class="pill pill-emerald">0 Lint Warnings · Breaker Lab Verified</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:24%;">Security Fix / Guarantee</th>
        <th style="width:22%;">Code Location</th>
        <th style="width:54%;">V2.1 Enforcement &amp; Regression Proof</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-weight:700;color:#f87171;">H-1 · Third-Party TopUp Theft</td>
        <td class="mono" style="font-size:11.5px;">escrow.gno / state.gno</td>
        <td>Per-contributor AVL <span class="mono">DonorShares</span> ledger (min <span class="mono">100k</span>, cap 20). <span class="mono">CancelBounty</span> refunds Sponsor strictly <span class="mono">SponsorFundedUgnot</span> and returns external shares directly to donors; blocks donor claim &amp; claimant self-top-up wash.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#fb923c;">M-1 · Hostage Escrow &amp; Conflict</td>
        <td class="mono" style="font-size:11.5px;">ExpireSubmission / ExpireDispute</td>
        <td>Permissionless <span class="mono">ExpireSubmission</span> settles 100% after <span class="mono">ReviewDeadlineHeight</span>; <span class="mono">ResolveDispute</span> blocks <span class="mono">caller == sponsor || claimant</span>; permissionless <span class="mono">ExpireDispute</span> splits 50/50 pro-rata after <span class="mono">DisputeDeadlineHeight</span>.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#fbbf24;">M-2 · Unicode Tag Bypass</td>
        <td class="mono" style="font-size:11.5px;">sanitize.gno / render.gno</td>
        <td>Byte-indexed ASCII case folding in <span class="mono">NeutralizeGnoTags</span> eliminates <span class="mono">strings.ToLower</span> byte expansion desync on <span class="mono">U+0130</span> (<span class="mono">'İ'</span>). <span class="mono">ValidateProofURL</span> enforces <span class="mono">https://</span> only.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#34d399;">Onyx GPAO Live Rail</td>
        <td class="mono" style="font-size:11.5px;">r/nt/grc20reg/v0</td>
        <td>Replaced <span class="mono">chain/banker</span> + <span class="mono">unsafe</span> with Genesis 1:1 <span class="mono">wugnot</span> <span class="mono">RealmTeller</span> transfers — zero <span class="mono">chain/banker</span> or <span class="mono">unsafe</span> across all production files.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#38bdf8;">Direct-EOA &amp; CEI Ordering</td>
        <td class="mono" style="font-size:11.5px;">PostBounty / TopUpBounty</td>
        <td>Enforces <span class="mono">runtime.AssertOriginCall()</span> + <span class="mono">cur.Previous().IsUserCall()</span> + CEI state zeroing before every <span class="mono">grc20reg.Transfer</span>.</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#a78bfa;">Mainnet Write Safety Guard</td>
        <td class="mono" style="font-size:11.5px;">mcp-server/src/tools.ts</td>
        <td><span class="mono">assertWritableChain()</span> permits write prep only on <span class="mono">dev</span> / <span class="mono">onyx-1</span> and permanently refuses <span class="mono">gnoland-1</span> mainnet.</td>
      </tr>
    </tbody>
  </table>

  <div class="slide-footer">
    <span>HearthBounty — Security Audit Fixes</span>
    <span class="mono">06 / 10</span>
  </div>
</section>

<!-- SLIDE 7: LIVE GNOWEB UI & ADVERSARIAL BREAKER LAB -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">06 · Product Experience</div>
      <h2>Native gnoweb UI + V2.1 Playground &amp; Adversarial Breaker Lab</h2>
    </div>
    <span class="pill">Zero-Install Judge Verification</span>
  </div>

  <div class="grid-2" style="margin-bottom:16px;">
    <div class="shot-frame">
      <img src="${shotBoard}" alt="HearthBounty Home Board in gnoweb" />
      <div class="shot-cap">Native gnoweb Board: On-chain p/nt/svg/v0 escrow chart, KPI frames &amp; track filters</div>
    </div>
    <div class="shot-frame">
      <img src="${shotDetail}" alt="Bounty Detail and Proof Card" />
      <div class="shot-cap">Bounty Detail: 4-stage lifecycle SVG, custody split, SHA-256 digest &amp; &lt;gno-form&gt; cards</div>
    </div>
  </div>

  <div class="grid-3">
    <div class="card card-amber">
      <h3>1-Click Adversarial Breaker Lab</h3>
      <p style="font-size:12.5px;">Run H-1 TopUp Theft, M-2 Unicode <span class="mono">'İ&lt;gno-form'</span> diff, MITM/<span class="mono">uatom</span> Guards, and M-1 Timeout/Conflict exploits directly in the browser.</p>
    </div>
    <div class="card card-sky">
      <h3>Live Multi-Realm Onyx Explorer</h3>
      <p style="font-size:12.5px;">Direct browser TM2 ABCI queries to <span class="mono">rpc.onyx.testnets.gno.land</span> verifying <span class="mono">hearthcore/v0</span>, <span class="mono">hearthbounty/v1</span>, <span class="mono">hearthguild/v0</span>, and seeded TXs.</p>
    </div>
    <div class="card card-emerald">
      <h3>60s Walkthrough + /diag</h3>
      <p style="font-size:12.5px;">Guided 5-step drawer plus 10 automated <span class="mono">/diag</span> checks proving math conservation, V2.1 security invariants, and live Onyx RPC proofs.</p>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — gnoweb UI &amp; Breaker Lab</span>
    <span class="mono">07 / 10</span>
  </div>
</section>

<!-- SLIDE 8: AI AGENT MCP WORKFLOW -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">07 · Autonomous AI Agent Bridge</div>
      <h2>hearthbounty-mcp: 12 Native MCP Tools Ready for gnomcp</h2>
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
          <tr><td class="mono" style="font-size:11.5px;">hearth_chain_status</td><td>Read</td><td>/status + qpkgmeta + ExportStatsJSON</td></tr>
          <tr><td class="mono" style="font-size:11.5px;">hearth_list_bounties</td><td>Read</td><td>Filtered ExportBountiesJSON via qeval</td></tr>
          <tr><td class="mono" style="font-size:11.5px;">hearth_get_bounty</td><td>Read</td><td>Spec, DonorShares &amp; timeout heights</td></tr>
          <tr><td class="mono" style="font-size:11.5px;">hearth_leaderboard / profile</td><td>Read</td><td>Deterministic roster &amp; agent cards</td></tr>
          <tr><td class="mono" style="font-size:11.5px;">hearth_render_page</td><td>Read</td><td>Raw gnoweb Markdown via vm/qrender</td></tr>
          <tr><td class="mono" style="font-size:11.5px;color:#fbbf24;">hearth_prepare_post_bounty</td><td>Prep</td><td>wugnot Deposit/Approve + PostBounty</td></tr>
          <tr><td class="mono" style="font-size:11.5px;color:#fbbf24;">hearth_prepare_claim</td><td>Prep</td><td>Verify open + build ClaimBounty tx</td></tr>
          <tr><td class="mono" style="font-size:11.5px;color:#fbbf24;">hearth_prepare_submit_proof</td><td>Prep</td><td>HTTPS-only + SHA-256 + SubmitProof</td></tr>
          <tr><td class="mono" style="font-size:11.5px;color:#fbbf24;">hearth_prepare_settle</td><td>Prep</td><td>Verify proof + ApproveAndSettle tx</td></tr>
          <tr><td class="mono" style="font-size:11.5px;color:#34d399;">hearth_prepare_expire_*</td><td>Prep</td><td>ExpireSubmission &amp; ExpireDispute txs</td></tr>
        </tbody>
      </table>
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;">
      <div class="shot-frame">
        <img src="${shotAgents}" alt="AI Agent MCP Hub" style="height:220px;" />
        <div class="shot-cap">On-Chain AI Agent Hub (:agents) documenting vm/qeval &amp; gnomcp pairing</div>
      </div>

      <div class="card card-sky">
        <h3>Live Stdio MCP Server vs Browser Emulator</h3>
        <div class="code-box mono" style="margin-top:6px;font-size:11px;"># Live Onyx stdio MCP server (real ABCI RPC queries)
cd mcp-server &amp;&amp; npm run build
HEARTH_RPC_URL=https://rpc.onyx.testnets.gno.land:443 \
HEARTH_CHAIN_ID=onyx-1 \
HEARTH_REALM_PATH=gno.land/r/g1x582...uuq4/hearthbounty/v1 \
npm run cli -- agent-demo</div>
      </div>
    </div>
  </div>

  <div class="slide-footer">
    <span>HearthBounty — 12-Tool MCP Workflow</span>
    <span class="mono">08 / 10</span>
  </div>
</section>

<!-- SLIDE 9: LIVE ONYX PROOFS & VERIFICATION -->
<section class="slide">
  <div class="slide-header">
    <div>
      <div class="eyebrow">08 · Verifiable On-Chain Proof</div>
      <h2>Live Gno.land Onyx (onyx-1) Deployments &amp; Test Scorecard</h2>
    </div>
    <span class="pill pill-emerald">Independently Verifiable via RPC</span>
  </div>

  <div class="card" style="margin-bottom:14px;">
    <h3>Confirmed Onyx Testnet Modules (Namespace: <span class="mono" style="color:#fbbf24;">g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4</span>)</h3>
    <table style="margin-top:8px;">
      <thead>
        <tr>
          <th>Artifact</th>
          <th>On-Chain Path</th>
          <th>Block</th>
          <th>Gas Used</th>
          <th>Status</th>
          <th>Confirmed TX Hash (Hex)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="font-weight:700;">Pure Core (/p/)</td>
          <td class="mono" style="font-size:11px;">p/g1x582...uuq4/hearthcore/v0</td>
          <td class="mono" style="color:#38bdf8;font-weight:700;">1,374,766</td>
          <td class="mono">33,928,050</td>
          <td><span class="pill pill-emerald" style="font-size:10.5px;padding:2px 8px;">LIVE</span></td>
          <td class="mono" style="font-size:10.5px;">0x54B2CE7FAC30...2DA1CB1A</td>
        </tr>
        <tr>
          <td style="font-weight:700;">Escrow Realm v1</td>
          <td class="mono" style="font-size:11px;">r/g1x582...uuq4/hearthbounty/v1</td>
          <td class="mono" style="color:#38bdf8;font-weight:700;">1,378,958</td>
          <td class="mono">126,117,131</td>
          <td><span class="pill pill-emerald" style="font-size:10.5px;padding:2px 8px;">${proofs.v1Status}</span></td>
          <td class="mono" style="font-size:10.5px;">0xEA7C4437B635...3CB52CFC</td>
        </tr>
        <tr>
          <td style="font-weight:700;">Consumer Realm</td>
          <td class="mono" style="font-size:11px;">r/g1x582...uuq4/hearthguild/v0</td>
          <td class="mono" style="color:#38bdf8;font-weight:700;">1,378,960</td>
          <td class="mono">17,437,231</td>
          <td><span class="pill ${proofs.guildStatus.startsWith("LIVE") ? "pill-emerald" : ""}" style="font-size:10.5px;padding:2px 8px;">${proofs.guildStatus}</span></td>
          <td class="mono" style="font-size:10.5px;">0xBFF689BC49A5...6BD4C75F</td>
        </tr>
      </tbody>
    </table>
    <p style="font-size:11.5px;margin-top:8px;color:#94a3b8;">
      Live seeded Onyx activity: <span class="mono" style="color:#cbd5e1;">${proofs.seededTxSummary}</span>. (Legacy <span class="mono">v0</span> at #1,374,813 superseded by <span class="mono">v1</span>.)
    </p>
  </div>

  <div class="grid-2" style="align-items:stretch;">
    <div class="card card-emerald">
      <h3>Automated Verification Scorecard (26 / 26)</h3>
      <ul class="clean">
        <li><strong class="mono" style="color:#34d399;">8 / 8</strong> <span class="mono">hearthcore/v0</span> Gno unit tests (split conservation, tiers, JSON, SVG).</li>
        <li><strong class="mono" style="color:#34d399;">7 / 7</strong> <span class="mono">hearthbounty/v1</span> integration &amp; adversarial tests (H-1, M-1, M-2, wugnot).</li>
        <li><strong class="mono" style="color:#34d399;">1 / 1</strong> <span class="mono">hearthguild/v0</span> companion consumer realm import &amp; endorsement test.</li>
        <li><strong class="mono" style="color:#34d399;">0</strong> <span class="mono">gno lint</span> errors or warnings across all packages and realms.</li>
        <li><strong class="mono" style="color:#34d399;">10 / 10</strong> TypeScript MCP (5) + Web Playground &amp; Breaker Lab (5) tests + <span class="mono">/diag</span>.</li>
      </ul>
    </div>

    <div class="shot-frame">
      <img src="${shotLeader}" alt="Guild Reputation Leaderboard" style="height:205px;" />
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
    <span class="pill pill-emerald">Import Gate Active Today</span>
  </div>

  <div class="grid-3" style="margin-bottom:18px;">
    <div class="card card-amber">
      <div class="stat-label" style="color:#fbbf24;">Month 1 · Live Onyx Guild</div>
      <h3 style="margin-top:6px;">Active Bounties &amp; npm MCP</h3>
      <ul class="clean">
        <li>Operate live community micro-bounties on <span class="mono">hearthbounty/v1</span> and builder passports on <span class="mono">hearthguild/v0</span>.</li>
        <li>Publish <span class="mono">hearthbounty-mcp</span> to npm for one-command <span class="mono">npx</span> integration with <span class="mono">gnomcp</span>.</li>
        <li>Release agent starter kits for Claude, Cursor, and Gemini CLI.</li>
      </ul>
    </div>

    <div class="card card-sky">
      <div class="stat-label" style="color:#38bdf8;">Months 2–3 · Mainnet Launch</div>
      <h3 style="margin-top:6px;">50+ Unique Addresses &amp; DAO Reuse</h3>
      <ul class="clean">
        <li>Deploy <span class="mono">hearthcore/v0</span>, <span class="mono">hearthbounty/v1</span>, and <span class="mono">hearthguild/v0</span> on Gno.land mainnet.</li>
        <li>Integrate <span class="mono">hearthguild.CheckEligibility</span> and <span class="mono">hearthcore</span> splits into partner realms.</li>
        <li>Transfer dispute arbitration to a DAO multisig via <span class="mono">SetArbiter</span>.</li>
      </ul>
    </div>

    <div class="card card-emerald">
      <div class="stat-label" style="color:#34d399;">Months 4–6 · Guild Scale</div>
      <h3 style="margin-top:6px;">100+ Builders &amp; Multi-GRC20</h3>
      <ul class="clean">
        <li>Add optional multi-milestone escrows and allowlisted GRC20 bounty tokens via <span class="mono">r/nt/grc20reg/v0</span>.</li>
        <li>Connect GraphQL indexer feeds for cross-realm reputation analytics.</li>
        <li>Run monthly community audit &amp; package bounty sprints with public releases.</li>
      </ul>
    </div>
  </div>

  <div class="card" style="background:#101a30;border-color:rgba(245,158,11,0.4);">
    <div style="display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;">
      <div>
        <div class="eyebrow" style="margin-bottom:4px;">Verify Everything Live Right Now</div>
        <div class="mono" style="font-size:12.5px;line-height:1.75;color:#f8fafc;">
          <div>Playground &amp; Breaker:  <span style="color:#fbbf24;">https://alphonshhhomenicmtu.github.io/hearthbounty/</span></div>
          <div>Onyx Realm v1 (LIVE):  <span style="color:#38bdf8;">https://onyx.testnets.gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthbounty/v1</span></div>
          <div>Consumer Guild Realm:  <span style="color:#34d399;">https://onyx.testnets.gno.land/r/g1x582angdzrqadgv4382j6y7ju6fj5wll6yuuq4/hearthguild/v0</span></div>
          <div>GitHub &amp; 1080p Demo:   <span style="color:#a78bfa;">github.com/alphonshhhomenicmtu/hearthbounty · youtu.be/vK6z7MJiRAk</span></div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:22px;font-weight:900;color:#fbbf24;">HearthBounty v1</div>
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
