/**
 * SLA-Vault Application Engine — Fully Debugged & Rewritten
 *
 * Mirrors the SLAVault.sol state machine exactly:
 *   1. depositCollateral()    → provider locks ETH into escrow
 *   2. createAgreement()      → register SLA with customer, target uptime, penalty
 *   3. submitTelemetry()      → oracle posts uptime; breach opens 60s challenge window
 *   4. challengeReport()      → provider contests within challenge window
 *   5. resolveDispute()       → arbitrator upholds or dismisses challenge
 *   6. executeSettlement()    → after window expires, deduct penalty and pay customer
 *   7. withdrawCollateral()   → provider withdraws excess balance
 */

'use strict';

// ─────────────────────────────────────────────
// APPLICATION STATE
// ─────────────────────────────────────────────
const state = {
  providerCollateral: 10.0,   // ETH locked in escrow vault
  telemetryCount: 14,
  settledPenalties: 0.50,

  role: 'provider',
  roles: {
    provider: { label: 'SaaS Provider (CloudCorp)',     address: '0x71C840...Provider' },
    oracle:   { label: 'Oracle / Telemetry Monitor',    address: '0x32A491...Oracle'   },
    customer: { label: 'Enterprise Customer (FinBank)',  address: '0x94B210...FinBank'  },
    owner:    { label: 'Arbitrator / Vault Owner',       address: '0x10E894...Arbitrator' }
  },

  slas: [
    { id: 1, provider: '0x71C840...Provider', customer: '0x94B...FinBank (Tier 1)',   targetUptime: 99.00, penalty: 0.50, totalPaid: 0.50, status: 'Active' },
    { id: 2, provider: '0x71C840...Provider', customer: '0x53E...HealthCare Corp',    targetUptime: 99.50, penalty: 0.75, totalPaid: 0.00, status: 'Active' }
  ],

  // null means no active report
  activeReport: null,

  auditLogs: [
    { time: '14:02:10', text: 'Vault deployed. Oracle set to <strong>0x32A491...Oracle</strong>' },
    { time: '14:05:22', text: 'CollateralDeposited: <strong>10.00 ETH</strong> locked. <span class="tx-hash">Tx: 0x8a9f...32b</span>' },
    { time: '14:07:45', text: 'SLACreated: Agreement #1 — FinBank, target <strong>99.00%</strong>, penalty <strong>0.50 ETH</strong>' },
    { time: '14:09:12', text: 'SLACreated: Agreement #2 — HealthCare Corp, target <strong>99.50%</strong>, penalty <strong>0.75 ETH</strong>' },
    { time: '14:11:30', text: 'PenaltySettled: <strong>0.50 ETH</strong> paid to 0x94B...FinBank for historical SLA #1 breach. <span class="tx-hash">Tx: 0x3c1a...89f</span>' }
  ]
};

// ─────────────────────────────────────────────
// DOM ELEMENT REFERENCES
// ─────────────────────────────────────────────
const el = {
  roleSelector:        document.getElementById('roleSelector'),
  accountAddress:      document.getElementById('accountAddress'),
  modeText:            document.getElementById('modeText'),
  modeIndicator:       document.getElementById('modeIndicator'),
  btnConnectWeb3:      document.getElementById('btnConnectWeb3'),

  statCollateral:      document.getElementById('statCollateral'),
  statCollateralSub:   document.getElementById('statCollateralSub'),
  statActiveSLAs:      document.getElementById('statActiveSLAs'),
  statTelemetryCount:  document.getElementById('statTelemetryCount'),
  statSettledPenalties:document.getElementById('statSettledPenalties'),

  providerVaultBalance:   document.getElementById('providerVaultBalance'),
  collateralHealthBadge:  document.getElementById('collateralHealthBadge'),
  collateralReserveText:  document.getElementById('collateralReserveText'),
  depositAmount:          document.getElementById('depositAmount'),
  withdrawAmount:         document.getElementById('withdrawAmount'),
  btnDepositCollateral:   document.getElementById('btnDepositCollateral'),
  btnWithdrawCollateral:  document.getElementById('btnWithdrawCollateral'),

  slaCustomer:    document.getElementById('slaCustomer'),
  slaUptime:      document.getElementById('slaUptime'),
  slaPenalty:     document.getElementById('slaPenalty'),
  btnCreateSLA:   document.getElementById('btnCreateSLA'),

  telemetrySlaSelect:  document.getElementById('telemetrySlaSelect'),
  observedUptime:      document.getElementById('observedUptime'),
  observedLatency:     document.getElementById('observedLatency'),
  presetHealthy:       document.getElementById('presetHealthy'),
  presetMinorBreach:   document.getElementById('presetMinorBreach'),
  presetSevereBreach:  document.getElementById('presetSevereBreach'),
  btnSubmitTelemetry:  document.getElementById('btnSubmitTelemetry'),

  activeReportBox:      document.getElementById('activeReportBox'),
  activeReportTitle:    document.getElementById('activeReportTitle'),
  activeReportBadge:    document.getElementById('activeReportBadge'),
  activeReportMeta:     document.getElementById('activeReportMeta'),
  activeReportTimer:    document.getElementById('activeReportTimer'),
  btnChallengeReport:   document.getElementById('btnChallengeReport'),
  btnResolveDispute:    document.getElementById('btnResolveDispute'),
  btnExecuteSettlement: document.getElementById('btnExecuteSettlement'),

  slaTableBody: document.getElementById('slaTableBody'),
  slaCountBadge: document.getElementById('slaCountBadge'),
  auditLog:     document.getElementById('auditLog')
};

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
function nowTime() {
  return new Date().toTimeString().slice(0, 8);
}

function fakeHash() {
  const chars = '0123456789abcdef';
  let h = '0x';
  for (let i = 0; i < 8; i++) h += chars[Math.floor(Math.random() * 16)];
  return h + '...' + chars[Math.floor(Math.random() * 16)] + chars[Math.floor(Math.random() * 16)] + chars[Math.floor(Math.random() * 16)];
}

function log(html) {
  state.auditLogs.unshift({ time: nowTime(), text: html });
  renderAuditLog();
}

// ─────────────────────────────────────────────
// RENDER: AUDIT LOG
// ─────────────────────────────────────────────
function renderAuditLog() {
  el.auditLog.innerHTML = state.auditLogs.map(item =>
    `<div class="audit-item">
      <span class="audit-time">[${item.time}]</span>
      <span class="audit-text">${item.text}</span>
    </div>`
  ).join('');
}

// ─────────────────────────────────────────────
// RENDER: TOP STAT CARDS
// ─────────────────────────────────────────────
function renderStats() {
  el.statCollateral.textContent       = `${state.providerCollateral.toFixed(2)} ETH`;
  el.providerVaultBalance.textContent = `${state.providerCollateral.toFixed(2)} ETH`;
  el.statActiveSLAs.textContent       = state.slas.filter(s => s.status === 'Active').length;
  el.statTelemetryCount.textContent   = state.telemetryCount;
  el.statSettledPenalties.textContent = `${state.settledPenalties.toFixed(2)} ETH`;

  // Collateral health check
  const totalRequired = state.slas
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + s.penalty, 0);

  if (totalRequired === 0) {
    el.collateralHealthBadge.className   = 'badge badge-info';
    el.collateralHealthBadge.textContent = 'No Active SLAs';
    el.collateralReserveText.textContent = 'No reserve required yet.';
    el.statCollateralSub.textContent     = 'No active SLAs to back.';
    el.statCollateralSub.style.color     = '';
    return;
  }

  const bufferPct = (state.providerCollateral / totalRequired * 100).toFixed(0);

  if (state.providerCollateral < totalRequired) {
    el.collateralHealthBadge.className   = 'badge badge-danger';
    el.collateralHealthBadge.textContent = 'Under-Collateralized';
    el.collateralReserveText.textContent = `Minimum required: ${totalRequired.toFixed(2)} ETH`;
    el.statCollateralSub.textContent     = `⚠ Below minimum reserve (${totalRequired.toFixed(2)} ETH required)`;
    el.statCollateralSub.style.color     = '#b91c1c';
  } else {
    el.collateralHealthBadge.className   = 'badge badge-success';
    el.collateralHealthBadge.textContent = 'Sufficient Collateral';
    el.collateralReserveText.textContent = `Reserve: ${totalRequired.toFixed(2)} ETH required | Buffer: ${bufferPct}%`;
    el.statCollateralSub.textContent     = `Buffer: ${bufferPct}% above minimum reserve`;
    el.statCollateralSub.style.color     = '';
  }
}

// ─────────────────────────────────────────────
// RENDER: SLA TABLE
// ─────────────────────────────────────────────
function renderSLATable() {
  const active = state.slas.filter(s => s.status === 'Active').length;
  el.slaCountBadge.textContent = `${active} Active`;

  el.slaTableBody.innerHTML = state.slas.map(s => `
    <tr>
      <td><strong>#${s.id}</strong></td>
      <td class="mono">${s.provider}</td>
      <td><strong>${s.customer}</strong></td>
      <td>${s.targetUptime.toFixed(2)}% <small style="color:var(--text-muted)">(${Math.round(s.targetUptime * 100)} BP)</small></td>
      <td>${s.penalty.toFixed(2)} ETH</td>
      <td>${s.totalPaid.toFixed(2)} ETH</td>
      <td><span class="badge ${s.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${s.status}</span></td>
    </tr>
  `).join('');
}

// ─────────────────────────────────────────────
// RENDER: TELEMETRY SELECT (keeps selection stable)
// ─────────────────────────────────────────────
function renderSLASelect() {
  const prevVal = el.telemetrySlaSelect.value;
  el.telemetrySlaSelect.innerHTML = state.slas
    .filter(s => s.status === 'Active')
    .map(s => `<option value="${s.id}">SLA #${s.id} — ${s.customer} (Target: ${s.targetUptime.toFixed(2)}% | Penalty: ${s.penalty.toFixed(2)} ETH)</option>`)
    .join('');
  if (prevVal) el.telemetrySlaSelect.value = prevVal;
}

// ─────────────────────────────────────────────
// RENDER: ACTIVE REPORT BOX (state machine display)
// ─────────────────────────────────────────────
function renderActiveReport() {
  const r = state.activeReport;

  // Reset box style
  el.activeReportBox.className = 'report-box';

  if (!r) {
    el.activeReportBox.classList.add('report-box-idle');
    el.activeReportTitle.textContent  = 'No active telemetry report';
    el.activeReportBadge.className    = 'badge badge-neutral';
    el.activeReportBadge.textContent  = 'Idle';
    el.activeReportMeta.textContent   = 'Submit a telemetry report using the Oracle panel to begin.';
    el.activeReportTimer.textContent  = 'Dispute timer idle.';
    el.activeReportTimer.style.color  = '#64748b';
    el.btnChallengeReport.disabled    = true;
    el.btnResolveDispute.disabled     = true;
    el.btnExecuteSettlement.disabled  = true;
    return;
  }

  const sla = state.slas.find(s => s.id === r.slaId) || state.slas[0];
  el.activeReportTitle.textContent = `Latest Report: SLA #${r.slaId} — ${sla.customer}`;

  switch (r.status) {
    case 'Compliant':
      el.activeReportBox.classList.add('report-box-ok');
      el.activeReportBadge.className    = 'badge badge-success';
      el.activeReportBadge.textContent  = `Compliant (${r.observedUptime.toFixed(2)}%)`;
      el.activeReportMeta.textContent   = `Observed ${r.observedUptime.toFixed(2)}% uptime meets target of ${sla.targetUptime.toFixed(2)}%. No penalty triggered. Latency: ${r.latency}ms.`;
      el.activeReportTimer.textContent  = 'No dispute required — all SLAs satisfied.';
      el.activeReportTimer.style.color  = '#15803d';
      el.btnChallengeReport.disabled    = true;
      el.btnResolveDispute.disabled     = true;
      el.btnExecuteSettlement.disabled  = true;
      break;

    case 'Breached':
      el.activeReportBox.classList.add('report-box-breach');
      el.activeReportBadge.className    = 'badge badge-danger';
      el.activeReportBadge.textContent  = `Breached (${r.observedUptime.toFixed(2)}%)`;
      el.activeReportMeta.textContent   = `Observed ${r.observedUptime.toFixed(2)}% uptime is below target of ${sla.targetUptime.toFixed(2)}%. Latency: ${r.latency}ms. Penalty due: ${sla.penalty.toFixed(2)} ETH.`;
      el.btnChallengeReport.disabled    = false;
      el.btnResolveDispute.disabled     = true;
      break;

    case 'Challenged':
      el.activeReportBox.classList.add('report-box-dispute');
      el.activeReportBadge.className    = 'badge badge-warning';
      el.activeReportBadge.textContent  = 'Contested';
      el.activeReportMeta.textContent   = `Provider challenged this breach report. Settlement is frozen. Awaiting Arbitrator decision.`;
      el.activeReportTimer.textContent  = 'Settlement frozen — awaiting dispute resolution.';
      el.activeReportTimer.style.color  = '#b45309';
      el.btnChallengeReport.disabled    = true;
      el.btnResolveDispute.disabled     = false;
      el.btnExecuteSettlement.disabled  = true;
      break;

    case 'Settled':
      el.activeReportBox.classList.add('report-box-settled');
      el.activeReportBadge.className    = 'badge badge-neutral';
      el.activeReportBadge.textContent  = 'Settled';
      el.activeReportMeta.textContent   = `Penalty of ${sla.penalty.toFixed(2)} ETH has been liquidated and transferred to ${sla.customer}.`;
      el.activeReportTimer.textContent  = 'Settlement complete. Collateral updated.';
      el.activeReportTimer.style.color  = '#64748b';
      el.btnChallengeReport.disabled    = true;
      el.btnResolveDispute.disabled     = true;
      el.btnExecuteSettlement.disabled  = true;
      break;
  }

  // Only tick the countdown timer for Breached state
  if (r.status === 'Breached') {
    tickTimer();
  }
}

// ─────────────────────────────────────────────
// TIMER: Runs every second, only when Breached
// ─────────────────────────────────────────────
function tickTimer() {
  const r = state.activeReport;
  if (!r || r.status !== 'Breached') return;

  const remaining = Math.max(0, Math.ceil((r.challengeDeadline - Date.now()) / 1000));

  if (remaining > 0) {
    el.activeReportTimer.textContent = `Challenge window closes in: ${remaining}s`;
    el.activeReportTimer.style.color = '#b45309';
    el.btnExecuteSettlement.disabled = true;
  } else {
    el.activeReportTimer.textContent = 'Challenge window expired — ready for automated settlement.';
    el.activeReportTimer.style.color = '#15803d';
    el.btnExecuteSettlement.disabled = false;  // Enable settlement now!
  }
}

setInterval(tickTimer, 1000);

// ─────────────────────────────────────────────
// MASTER RENDER
// ─────────────────────────────────────────────
function renderAll() {
  renderStats();
  renderSLATable();
  renderSLASelect();
  renderActiveReport();
  renderAuditLog();
}

// ─────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────

// Role selector
el.roleSelector.addEventListener('change', () => {
  state.role = el.roleSelector.value;
  const r = state.roles[state.role];
  el.accountAddress.textContent = r.address;
  log(`Role switched → <strong>${r.label}</strong> <span class="tx-hash">${r.address}</span>`);
});

// Deposit collateral
el.btnDepositCollateral.addEventListener('click', () => {
  const amt = parseFloat(el.depositAmount.value);
  if (!amt || amt <= 0) { alert('Enter a valid deposit amount greater than zero.'); return; }

  state.providerCollateral = parseFloat((state.providerCollateral + amt).toFixed(4));
  log(`CollateralDeposited: +<strong>${amt.toFixed(2)} ETH</strong>. New vault balance: <strong>${state.providerCollateral.toFixed(2)} ETH</strong> <span class="tx-hash">${fakeHash()}</span>`);
  renderAll();
});

// Withdraw collateral
el.btnWithdrawCollateral.addEventListener('click', () => {
  const amt = parseFloat(el.withdrawAmount.value);
  if (!amt || amt <= 0) { alert('Enter a valid withdrawal amount greater than zero.'); return; }
  if (amt > state.providerCollateral) { alert(`Cannot withdraw ${amt.toFixed(2)} ETH — current balance is only ${state.providerCollateral.toFixed(2)} ETH.`); return; }

  // Prevent withdrawing below required reserve
  const required = state.slas.filter(s => s.status === 'Active').reduce((sum, s) => sum + s.penalty, 0);
  if (state.providerCollateral - amt < required) {
    alert(`Withdrawal blocked: Remaining balance (${(state.providerCollateral - amt).toFixed(2)} ETH) would be below the minimum required reserve (${required.toFixed(2)} ETH) for active SLAs.`);
    return;
  }

  state.providerCollateral = parseFloat((state.providerCollateral - amt).toFixed(4));
  el.withdrawAmount.value = '';
  log(`CollateralWithdrawn: -<strong>${amt.toFixed(2)} ETH</strong>. Remaining balance: <strong>${state.providerCollateral.toFixed(2)} ETH</strong> <span class="tx-hash">${fakeHash()}</span>`);
  renderAll();
});

// Create SLA agreement
el.btnCreateSLA.addEventListener('click', () => {
  const customer = el.slaCustomer.value.trim();
  const uptime   = parseFloat(el.slaUptime.value);
  const penalty  = parseFloat(el.slaPenalty.value);

  if (!customer)                            { alert('Enter a customer address or label.'); return; }
  if (isNaN(uptime) || uptime <= 0 || uptime > 100) { alert('Uptime must be between 0.01% and 100%.'); return; }
  if (isNaN(penalty) || penalty <= 0)       { alert('Penalty must be greater than zero.'); return; }
  if (state.providerCollateral < penalty)   { alert(`Insufficient collateral. Vault holds ${state.providerCollateral.toFixed(2)} ETH but penalty is ${penalty.toFixed(2)} ETH.`); return; }

  const id = state.slas.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  state.slas.push({ id, provider: state.roles.provider.address, customer, targetUptime: uptime, penalty, totalPaid: 0, status: 'Active' });
  log(`SLACreated: Agreement #${id} deployed for <strong>${customer}</strong> — target <strong>${uptime.toFixed(2)}%</strong>, penalty <strong>${penalty.toFixed(2)} ETH</strong> <span class="tx-hash">${fakeHash()}</span>`);
  renderAll();
});

// Quick presets
el.presetHealthy.addEventListener('click', () => {
  el.observedUptime.value = '99.85';
  el.observedLatency.value = '85';
});
el.presetMinorBreach.addEventListener('click', () => {
  el.observedUptime.value = '98.20';
  el.observedLatency.value = '380';
});
el.presetSevereBreach.addEventListener('click', () => {
  el.observedUptime.value = '94.50';
  el.observedLatency.value = '920';
});

// Submit telemetry
el.btnSubmitTelemetry.addEventListener('click', () => {
  const slaId  = parseInt(el.telemetrySlaSelect.value, 10);
  const uptime = parseFloat(el.observedUptime.value);
  const latency = parseInt(el.observedLatency.value, 10);

  if (isNaN(slaId))   { alert('Select a valid SLA.'); return; }
  if (isNaN(uptime) || uptime < 0 || uptime > 100) { alert('Enter a valid uptime percentage (0–100).'); return; }
  if (isNaN(latency) || latency < 1) { alert('Enter a valid latency in milliseconds.'); return; }

  const sla = state.slas.find(s => s.id === slaId);
  if (!sla) { alert('Selected SLA not found.'); return; }

  state.telemetryCount++;
  const isBreached = uptime < sla.targetUptime;

  state.activeReport = {
    slaId,
    observedUptime: uptime,
    latency,
    timestamp: Date.now(),
    challengeDeadline: Date.now() + 60000,
    status: isBreached ? 'Breached' : 'Compliant'
  };

  if (isBreached) {
    log(`TelemetrySubmitted [BREACH]: SLA #${slaId} — observed <strong>${uptime.toFixed(2)}%</strong> &lt; required <strong>${sla.targetUptime.toFixed(2)}%</strong>. Latency: ${latency}ms. Challenge window opened (60s). <span class="tx-hash">${fakeHash()}</span>`);
  } else {
    log(`TelemetrySubmitted [OK]: SLA #${slaId} — observed <strong>${uptime.toFixed(2)}%</strong> ≥ required <strong>${sla.targetUptime.toFixed(2)}%</strong>. Latency: ${latency}ms. Status: Compliant. <span class="tx-hash">${fakeHash()}</span>`);
  }

  renderAll();
});

// Challenge report
el.btnChallengeReport.addEventListener('click', () => {
  const r = state.activeReport;
  if (!r || r.status !== 'Breached') { alert('Only a Breached report can be challenged.'); return; }
  if (Date.now() > r.challengeDeadline) { alert('Challenge window has already expired.'); return; }

  r.status = 'Challenged';
  log(`TelemetryChallenged: Provider disputed telemetry for SLA #${r.slaId}. Reason: "Upstream CDN anomaly — false positive reading". Settlement frozen pending arbitrator decision.`);
  renderAll();
});

// Resolve dispute
el.btnResolveDispute.addEventListener('click', () => {
  const r = state.activeReport;
  if (!r || r.status !== 'Challenged') { alert('No report is currently under dispute.'); return; }

  const uphold = confirm('Arbitrator Decision\n\nClick OK to UPHOLD the breach (penalty will proceed).\nClick Cancel to DISMISS the breach (provider is pardoned).');

  if (uphold) {
    r.status = 'Breached';
    r.challengeDeadline = Date.now() - 1;   // Expire immediately so settlement is available at once
    log(`DisputeResolved: Arbitrator <strong>upheld</strong> breach for SLA #${r.slaId}. Telemetry data confirmed valid. Settlement now available.`);
  } else {
    r.status = 'Compliant';
    log(`DisputeResolved: Arbitrator <strong>dismissed</strong> breach for SLA #${r.slaId}. Telemetry flagged as anomalous. No penalty applied.`);
  }

  renderAll();
});

// Execute settlement
el.btnExecuteSettlement.addEventListener('click', () => {
  const r = state.activeReport;
  if (!r || r.status !== 'Breached') { alert('Report must be in Breached status to settle.'); return; }
  if (Date.now() < r.challengeDeadline) { alert('Challenge window is still open. Wait for it to expire before settling.'); return; }

  const sla = state.slas.find(s => s.id === r.slaId);
  if (!sla) { alert('Associated SLA not found.'); return; }
  if (state.providerCollateral < sla.penalty) {
    log(`SettlementFailed: Insufficient collateral — vault holds <strong>${state.providerCollateral.toFixed(2)} ETH</strong> but penalty is <strong>${sla.penalty.toFixed(2)} ETH</strong>.`);
    alert(`Cannot settle — vault balance (${state.providerCollateral.toFixed(2)} ETH) is less than the penalty (${sla.penalty.toFixed(2)} ETH).`);
    return;
  }

  // Deduct BEFORE transfer (Checks-Effects-Interactions pattern — reentrancy safe)
  state.providerCollateral  = parseFloat((state.providerCollateral - sla.penalty).toFixed(4));
  sla.totalPaid             = parseFloat((sla.totalPaid + sla.penalty).toFixed(4));
  state.settledPenalties    = parseFloat((state.settledPenalties + sla.penalty).toFixed(4));
  r.status = 'Settled';

  const txHash = fakeHash();
  log(`PenaltySettled: <strong>${sla.penalty.toFixed(2)} ETH</strong> liquidated from provider vault and transferred to <strong>${sla.customer}</strong>. Remaining vault: <strong>${state.providerCollateral.toFixed(2)} ETH</strong>. <span class="tx-hash">${txHash}</span>`);
  renderAll();
});

// MetaMask / Web3 connection (optional — dashboard works fully without it)
el.btnConnectWeb3.addEventListener('click', async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0];
      const short = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      el.accountAddress.textContent = short;
      el.modeText.textContent       = 'MetaMask Connected';
      el.modeIndicator.className    = 'mode-pill';
      el.modeIndicator.style.background   = '#dbeafe';
      el.modeIndicator.style.color        = '#1d4ed8';
      el.modeIndicator.style.borderColor  = '#93c5fd';
      el.modeIndicator.querySelector('.dot').style.background = '#1d4ed8';
      el.btnConnectWeb3.textContent = 'Connected';
      el.btnConnectWeb3.disabled    = true;
      log(`Web3Connected: MetaMask account <strong>${addr}</strong> linked to dashboard.`);
    } catch (err) {
      alert(`MetaMask error: ${err.message}`);
    }
  } else {
    alert('MetaMask not detected.\n\nThe dashboard is running in Interactive Simulation Mode — all functionality works without MetaMask.');
  }
});

// ─────────────────────────────────────────────
// INITIALISE
// ─────────────────────────────────────────────
renderAll();
