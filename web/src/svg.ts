/**
 * Deterministic inline SVG renderers mirroring hearthcore/v0/visuals.gno.
 */

import { BoardStats, BountyStatus, formatGNOT, STATUS_LABELS } from "./engine.js";

function escXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderEscrowDistributionSVG(stats: BoardStats): string {
  const barW = 792;
  const total =
    stats.open_count + stats.claimed_count + stats.submitted_count + stats.disputed_count + stats.settled_count;
  let segments = "";
  if (total > 0) {
    const wOpen = Math.floor((barW * stats.open_count) / total);
    const wClaimed = Math.floor((barW * stats.claimed_count) / total);
    const wSubmitted = Math.floor((barW * (stats.submitted_count + stats.disputed_count)) / total);
    const wSettled = stats.settled_count === 0 ? 0 : Math.max(0, barW - wOpen - wClaimed - wSubmitted);
    let x = 24;
    if (wOpen > 0) {
      segments += `<rect x="${x}" y="18" width="${wOpen}" height="18" rx="4" fill="#f59e0b" />`;
      x += wOpen;
    }
    if (wClaimed > 0) {
      segments += `<rect x="${x}" y="18" width="${wClaimed}" height="18" fill="#38bdf8" />`;
      x += wClaimed;
    }
    if (wSubmitted > 0) {
      segments += `<rect x="${x}" y="18" width="${wSubmitted}" height="18" fill="#a78bfa" />`;
      x += wSubmitted;
    }
    if (wSettled > 0) {
      segments += `<rect x="${x}" y="18" width="${wSettled}" height="18" rx="4" fill="#34d399" />`;
    }
  }

  return `<svg viewBox="0 0 840 72" width="100%" role="img" aria-label="On-chain escrow status distribution" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="840" height="72" rx="10" fill="#0b1220" stroke="#1e293b" stroke-width="1.5" />
    <rect x="24" y="18" width="${barW}" height="18" rx="5" fill="#1e293b" />
    ${segments}
    <circle cx="30" cy="54" r="5" fill="#f59e0b" />
    <text x="41" y="58" fill="#cbd5e1" font-size="12" font-weight="600" font-family="ui-sans-serif,system-ui,sans-serif">Open: ${stats.open_count}</text>
    <circle cx="155" cy="54" r="5" fill="#38bdf8" />
    <text x="166" y="58" fill="#cbd5e1" font-size="12" font-weight="600" font-family="ui-sans-serif,system-ui,sans-serif">Claimed: ${stats.claimed_count}</text>
    <circle cx="295" cy="54" r="5" fill="#a78bfa" />
    <text x="306" y="58" fill="#cbd5e1" font-size="12" font-weight="600" font-family="ui-sans-serif,system-ui,sans-serif">Submitted / Disputed: ${stats.submitted_count + stats.disputed_count}</text>
    <circle cx="515" cy="54" r="5" fill="#34d399" />
    <text x="526" y="58" fill="#cbd5e1" font-size="12" font-weight="600" font-family="ui-sans-serif,system-ui,sans-serif">Settled: ${stats.settled_count}</text>
    <text x="816" y="58" text-anchor="end" fill="#64748b" font-size="11" font-weight="600" font-family="ui-monospace,monospace">p/nt/svg/v0 mirror</text>
  </svg>`;
}

export function renderLifecycleSVG(status: BountyStatus, rewardUgnot: number): string {
  const steps = ["1. OPEN", "2. CLAIMED", "3. SUBMITTED", "4. SETTLED"];
  const idxMap: Record<BountyStatus, number> = {
    open: 0,
    claimed: 1,
    submitted: 2,
    disputed: 2,
    settled: 3,
    cancelled: -1,
  };
  const activeIdx = idxMap[status];

  const nodes = steps
    .map((label, i) => {
      const cx = 66 + i * 155;
      let fill = "#1e293b";
      let stroke = "#475569";
      let textColor = "#94a3b8";
      if (status === "cancelled") {
        stroke = "#ef4444";
      } else if (status === "disputed" && i === 2) {
        fill = "#f97316";
        stroke = "#fdba74";
        textColor = "#f8fafc";
      } else if (activeIdx >= 0 && i < activeIdx) {
        fill = "#10b981";
        stroke = "#34d399";
        textColor = "#e2e8f0";
      } else if (activeIdx === i) {
        fill = "#f59e0b";
        stroke = "#fde68a";
        textColor = "#f8fafc";
      }
      const numColor = activeIdx < i || status === "cancelled" ? "#cbd5e1" : "#0f172a";
      return `
        <circle cx="${cx}" cy="40" r="15" fill="${fill}" stroke="${stroke}" stroke-width="2.5" />
        <text x="${cx}" y="45" text-anchor="middle" fill="${numColor}" font-size="13" font-weight="800" font-family="ui-sans-serif,system-ui,sans-serif">${i + 1}</text>
        <text x="${cx}" y="76" text-anchor="middle" fill="${textColor}" font-size="11" font-weight="700" letter-spacing="0.5" font-family="ui-sans-serif,system-ui,sans-serif">${label}</text>
      `;
    })
    .join("");

  return `<svg viewBox="0 0 800 98" width="100%" role="img" aria-label="Bounty lifecycle status" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="800" height="98" rx="10" fill="#0b1220" stroke="#334155" stroke-width="1.5" />
    <rect x="66" y="38" width="465" height="4" rx="2" fill="#334155" />
    ${nodes}
    <rect x="598" y="18" width="182" height="62" rx="9" fill="#131c31" stroke="#f59e0b" stroke-width="1.8" />
    <text x="614" y="39" fill="#94a3b8" font-size="10" font-weight="700" letter-spacing="0.7" font-family="ui-sans-serif,system-ui,sans-serif">STATUS: ${escXml(STATUS_LABELS[status].toUpperCase())}</text>
    <text x="614" y="65" fill="#fbbf24" font-size="17" font-weight="800" font-family="ui-monospace,monospace">${escXml(formatGNOT(rewardUgnot))}</text>
  </svg>`;
}
