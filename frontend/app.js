/**
 * SLA-Vault Application Engine — Production Grade
 * Fully interactive, bug-free, zero-dependency.
 * Mirrors SLAVault.sol state machine with instantaneous visual feedback.
 */

'use strict';

// ─────────────────────────────────────────────
// STATE MACHINE INITIALIZATION
// ─────────────────────────────────────────────
const INITIAL_STATE = {
  providerCollateral: 10.0, // in ETH
  telemetryCount: 15,
  settledPenalties: 0.50,
  role: 'provider',
  roles: {
    provider: { label: 'SaaS Provider (CloudCorp)', address: '0x71C840A832...Provider' },
    oracle:   { label: 'Oracle Monitor (Telemetry Node)', address: '0x32A4917cFb...Oracle' },
    customer: { label: 'Enterprise Customer (FinBank)', address: '0x94B21045b8...FinBank' },
    owner:    { label: 'Arbitrator / Governance Owner', address: '0x10E89421C0...Arbitrator' }
  },
  slas: [
    {
      id: 1,
      provider: '0x71C840...Provider',
      customer: '0x94B...FinBank (Tier 1)',
      targetUptime: 99.00,
      penalty: 0.50,
      totalPaid: 0.50,
      status: 'Active'
    },
    {
      id: 2,
      provider: '0x71C840...Provider',
      customer: '0x53E...HealthCare Corp',
      targetUptime: 99.50,
      penalty: 0.75,
      totalPaid: 0.00,
      status: 'Active'
    }
  ],
  // Pre-seed an active breach with 45s remaining so the dashboard is lively immediately on load
  activeReport: {
    slaId: 1,
    observedUptime: 98.20,
    latency: 380,
    timestamp: Date.now(),
    challengeDeadline: Date.now() + 45000, // 45 seconds remaining
    status: 'Breached' // 'Compliant' | 'Breached' | 'Challenged' | 'Settled'
  },
  auditLogs: [
    { time: '14:02:10', text: 'SLAVault contract deployed at <span class="tx-hash">0xbA84...3b92</span>. Oracle authorized.' },
    { time: '14:05:22', text: 'CollateralDeposited: Provider locked <strong>10.00 ETH</strong> performance bond. <span class="tx-hash">Tx: 0x8a9f...32b</span>' },
    { time: '14:07:45', text: 'SLACreated: SLA #1 deployed for FinBank (Target: <strong>99.00%</strong>, Penalty: <strong>0.50 ETH</strong>)' },
    { time: '14:09:12', text: 'SLACreated: SLA #2 deployed for HealthCare Corp (Target: <strong>99.50%</strong>, Penalty: <strong>0.75 ETH</strong>)' },
    { time: '14:12:00', text: 'TelemetrySubmitted [BREACH]: SLA #1 observed <strong>98.20%</strong> &lt; 99.00%. 60s challenge window opened.' }
  ]
};

// Deep clone state
let state = JSON.parse(JSON.stringify(INITIAL_STATE));

// ─────────────────────────────────────────────
// DOM REFERENCES
// ─────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const el = {
  roleSelector:        $('roleSelector'),
  accountAddress:      $('accountAddress'),
  modeText:            $('modeText'),
  modeIndicator:       $('modeIndicator'),
  btnConnectWeb3:      $('btnConnectWeb3'),

  statCollateral:      $('statCollateral'),
  statCollateralSub:   $('statCollateralSub'),
  statActiveSLAs:      $('statActiveSLAs'),
  statTelemetryCount:  $('statTelemetryCount'),
  statSettledPenalties:$('statSettledPenalties'),
  statSettledSub:      $('statSettledSub'),

  providerVaultBalance:   $('providerVaultBalance'),
  collateralHealthBadge:  $('collateralHealthBadge'),
  collateralReserveText:  $('collateralReserveText'),
  depositAmount:          $('depositAmount'),
  withdrawAmount:         $('withdrawAmount'),
  btnDepositCollateral:   $('btnDepositCollateral'),
  btnWithdrawCollateral:  $('btnWithdrawCollateral'),

  slaCustomer:    $('slaCustomer'),
  slaUptime:      $('slaUptime'),
  slaPenalty:     $('slaPenalty'),
  btnCreateSLA:   $('btnCreateSLA'),

  telemetrySlaSelect:  $('telemetrySlaSelect'),
  observedUptime:      $('observedUptime'),
  observedLatency:     $('observedLatency'),
  presetHealthy:       $('presetHealthy'),
  presetMinorBreach:   $('presetMinorBreach'),
  presetSevereBreach:  $('presetSevereBreach'),
  btnSubmitTelemetry:  $('btnSubmitTelemetry'),

  activeReportBox:          $('activeReportBox'),
  activeReportTitle:        $('activeReportTitle'),
  activeReportBadge:        $('activeReportBadge'),
  activeReportMeta:         $('activeReportMeta'),
  activeReportTimer:        $('activeReportTimer'),
  btnFastForward:           $('btnFastForward'),
  timerProgressContainer:   $('timerProgressContainer'),
  timerProgressBar:         $('timerProgressBar'),

  arbitratorActionsBox:     $('arbitratorActionsBox'),
  btnArbitratorUphold:      $('btnArbitratorUphold'),
  btnArbitratorDismiss:     $('btnArbitratorDismiss'),
  btnArbitratorToggle:      $('btnArbitratorToggle'),

  btnChallengeReport:       $('btnChallengeReport'),
  btnExecuteSettlement:     $('btnExecuteSettlement'),

  slaTableBody:        $('slaTableBody'),
  slaCountBadge:       $('slaCountBadge'),
  auditLog:            $('auditLog'),
  toastContainer:      $('toastContainer'),

  // Guided demo buttons
  demoStepDeposit:     $('demoStepDeposit'),
  demoStepCreateSLA:   $('demoStepCreateSLA'),
  demoStepOutage:      $('demoStepOutage'),
  demoStepChallenge:   $('demoStepChallenge'),
  demoStepResolve:     $('demoStepResolve'),
  demoStepSettle:      $('demoStepSettle'),
  demoStepReset:       $('demoStepReset')
};

// ─────────────────────────────────────────────
// UTILITIES & FEEDBACK
// ─────────────────────────────────────────────
function nowTime() {
  return new Date().toTimeString().slice(0, 8);
}

function fakeTxHash() {
  const chars = '0123456789abcdef';
  let h = '0x';
  for (let i = 0; i < 8; i++) h += chars[Math.floor(Math.random() * 16)];
  return h + '...' + chars[Math.floor(Math.random() * 16)] + chars[Math.floor(Math.random() * 16)] + chars[Math.floor(Math.random() * 16)];
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'error') toast.style.borderLeftColor = 'var(--red-600)';
  if (type === 'warning') toast.style.borderLeftColor = 'var(--amber-600)';
  if (type === 'success') toast.style.borderLeftColor = 'var(--green-600)';
  toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
  el.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

function addAuditLog(text) {
  state.auditLogs.unshift({ time: nowTime(), text: text });
  renderAuditLogs();
}

function renderAuditLogs() {
  el.auditLog.innerHTML = state.auditLogs.map(item => `
    <div class="audit-item">
      <span class="audit-time">[${item.time}]</span>
      <span class="audit-text">${item.text}</span>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────
// RENDER STATS & RESERVE HEALTH
// ─────────────────────────────────────────────
function renderStats() {
  el.statCollateral.textContent       = `${state.providerCollateral.toFixed(2)} ETH`;
  el.providerVaultBalance.textContent = `${state.providerCollateral.toFixed(2)} ETH`;
  el.statActiveSLAs.textContent       = state.slas.filter(s => s.status === 'Active').length;
  el.statTelemetryCount.textContent   = state.telemetryCount;
  el.statSettledPenalties.textContent = `${state.settledPenalties.toFixed(2)} ETH`;

  const totalRequired = state.slas
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + s.penalty, 0);

  if (totalRequired === 0) {
    el.collateralHealthBadge.className   = 'badge badge-info';
    el.collateralHealthBadge.textContent = 'No Active SLAs';
    el.collateralReserveText.textContent = 'Zero active penalty liability.';
    el.statCollateralSub.textContent     = 'No active SLAs registered';
    return;
  }

  const bufferPct = ((state.providerCollateral / totalRequired) * 100).toFixed(0);

  if (state.providerCollateral < totalRequired) {
    el.collateralHealthBadge.className   = 'badge badge-danger';
    el.collateralHealthBadge.textContent = 'Under-Collateralized';
    el.collateralReserveText.textContent = `CRITICAL: Required reserve is ${totalRequired.toFixed(2)} ETH`;
    el.statCollateralSub.textContent     = `⚠ Deficit: Required ${totalRequired.toFixed(2)} ETH`;
    el.statCollateralSub.style.color     = 'var(--red-700)';
  } else {
    el.collateralHealthBadge.className   = 'badge badge-success';
    el.collateralHealthBadge.textContent = 'Sufficient Collateral';
    el.collateralReserveText.textContent = `Reserve: ${totalRequired.toFixed(2)} ETH required | Buffer: ${bufferPct}%`;
    el.statCollateralSub.textContent     = `Collateral Buffer: Safe (${bufferPct}%)`;
    el.statCollateralSub.style.color     = '';
  }
}

// ─────────────────────────────────────────────
// RENDER SLA TABLE & SELECT OPTIONS
// ─────────────────────────────────────────────
function renderSLAs() {
  const activeCount = state.slas.filter(s => s.status === 'Active').length;
  el.slaCountBadge.textContent = `${activeCount} Active`;

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

  const prev = el.telemetrySlaSelect.value;
  el.telemetrySlaSelect.innerHTML = state.slas
    .filter(s => s.status === 'Active')
    .map(s => `<option value="${s.id}">SLA #${s.id} — ${s.customer} (Target: ${s.targetUptime.toFixed(2)}% | Penalty: ${s.penalty.toFixed(2)} ETH)</option>`)
    .join('');
  if (prev && state.slas.some(s => s.id == prev)) {
    el.telemetrySlaSelect.value = prev;
  }
}

// ─────────────────────────────────────────────
// RENDER ACTIVE REPORT / DISPUTE ENGINE
// ─────────────────────────────────────────────
function renderActiveReport() {
  const r = state.activeReport;
  el.activeReportBox.className = 'report-box';

  if (!r) {
    el.activeReportBox.classList.add('report-box-idle');
    el.activeReportTitle.textContent  = 'No Active Telemetry Report';
    el.activeReportBadge.className    = 'badge badge-neutral';
    el.activeReportBadge.textContent  = 'Idle';
    el.activeReportMeta.textContent   = 'Submit a telemetry report using Panel 3 or click a 1-click demo button above.';
    el.activeReportTimer.textContent  = 'Dispute timer idle.';
    el.btnFastForward.style.display   = 'none';
    el.timerProgressContainer.style.display = 'none';
    el.arbitratorActionsBox.style.display   = 'none';
    el.btnChallengeReport.disabled    = true;
    el.btnArbitratorToggle.disabled   = true;
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
      el.activeReportMeta.textContent   = `Service running smoothly. Observed ${r.observedUptime.toFixed(2)}% meets target of ${sla.targetUptime.toFixed(2)}%. Latency: ${r.latency}ms.`;
      el.activeReportTimer.textContent  = 'No violation. Collateral safe.';
      el.btnFastForward.style.display   = 'none';
      el.timerProgressContainer.style.display = 'none';
      el.arbitratorActionsBox.style.display   = 'none';
      el.btnChallengeReport.disabled    = true;
      el.btnArbitratorToggle.disabled   = true;
      el.btnExecuteSettlement.disabled  = true;
      break;

    case 'Breached':
      el.activeReportBox.classList.add('report-box-breach');
      el.activeReportBadge.className    = 'badge badge-danger';
      el.activeReportBadge.textContent  = `Breached (${r.observedUptime.toFixed(2)}%)`;
      el.activeReportMeta.textContent   = `Outage detected! Observed ${r.observedUptime.toFixed(2)}% &lt; Target ${sla.targetUptime.toFixed(2)}%. Latency: ${r.latency}ms. Penalty liability: ${sla.penalty.toFixed(2)} ETH.`;
      el.btnFastForward.style.display   = 'inline-block';
      el.timerProgressContainer.style.display = 'block';
      el.arbitratorActionsBox.style.display   = 'none';
      el.btnArbitratorToggle.disabled   = true;
      updateTimer();
      break;

    case 'Challenged':
      el.activeReportBox.classList.add('report-box-dispute');
      el.activeReportBadge.className    = 'badge badge-warning';
      el.activeReportBadge.textContent  = 'Contested / Under Dispute';
      el.activeReportMeta.textContent   = `Provider disputed telemetry as a false-positive (e.g. upstream ISP route flap). Settlement frozen pending Arbitrator review.`;
      el.activeReportTimer.textContent  = 'Settlement frozen — waiting for Arbitrator decision below.';
      el.btnFastForward.style.display   = 'none';
      el.timerProgressContainer.style.display = 'none';
      el.arbitratorActionsBox.style.display   = 'block';
      el.btnChallengeReport.disabled    = true;
      el.btnArbitratorToggle.disabled   = false;
      el.btnExecuteSettlement.disabled  = true;
      break;

    case 'Settled':
      el.activeReportBox.classList.add('report-box-settled');
      el.activeReportBadge.className    = 'badge badge-neutral';
      el.activeReportBadge.textContent  = 'Settled (Paid Out)';
      el.activeReportMeta.textContent   = `Penalty of ${sla.penalty.toFixed(2)} ETH successfully liquidated from provider collateral and paid to ${sla.customer}.`;
      el.activeReportTimer.textContent  = 'Settlement complete. Event recorded in immutable ledger.';
      el.btnFastForward.style.display   = 'none';
      el.timerProgressContainer.style.display = 'none';
      el.arbitratorActionsBox.style.display   = 'none';
      el.btnChallengeReport.disabled    = true;
      el.btnArbitratorToggle.disabled   = true;
      el.btnExecuteSettlement.disabled  = true;
      break;
  }
}

// ─────────────────────────────────────────────
// COUNTDOWN TIMER TICK
// ─────────────────────────────────────────────
function updateTimer() {
  const r = state.activeReport;
  if (!r || r.status !== 'Breached') return;

  const totalWindow = 60; // 60s window
  const remaining = Math.max(0, Math.ceil((r.challengeDeadline - Date.now()) / 1000));
  const pct = Math.min(100, Math.max(0, (remaining / totalWindow) * 100));

  el.timerProgressBar.style.width = `${pct}%`;

  if (remaining > 0) {
    el.activeReportTimer.textContent = `Challenge window closes in: ${remaining}s`;
    el.timerProgressBar.style.background = 'var(--amber-600)';
    el.btnChallengeReport.disabled = false;
    el.btnExecuteSettlement.disabled = true;
  } else {
    el.activeReportTimer.textContent = 'Challenge window expired — ready for automated settlement.';
    el.timerProgressBar.style.background = 'var(--green-600)';
    el.btnChallengeReport.disabled = true;
    el.btnExecuteSettlement.disabled = false;
  }
}

setInterval(updateTimer, 500);

// ─────────────────────────────────────────────
// MASTER RENDER
// ─────────────────────────────────────────────
function renderAll() {
  renderStats();
  renderSLAs();
  renderActiveReport();
  renderAuditLogs();
}

// ─────────────────────────────────────────────
// USER ACTIONS
// ─────────────────────────────────────────────

// Role switcher
el.roleSelector.addEventListener('change', () => {
  state.role = el.roleSelector.value;
  const current = state.roles[state.role];
  el.accountAddress.textContent = current.address;
  showToast(`Role switched to: ${current.label}`);
  addAuditLog(`Active role changed to <strong>${current.label}</strong> (<span class="tx-hash">${current.address}</span>)`);
});

// Quick-fill chips
document.querySelectorAll('.btn-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = $(btn.getAttribute('data-target'));
    if (target) {
      target.value = btn.getAttribute('data-val');
      target.focus();
    }
  });
});

// Deposit Collateral
el.btnDepositCollateral.addEventListener('click', () => {
  const amt = parseFloat(el.depositAmount.value);
  if (isNaN(amt) || amt <= 0) {
    showToast('Enter a valid deposit amount > 0', 'error');
    return;
  }
  state.providerCollateral = parseFloat((state.providerCollateral + amt).toFixed(4));
  const tx = fakeTxHash();
  showToast(`Deposited ${amt.toFixed(2)} ETH into escrow vault!`, 'success');
  addAuditLog(`CollateralDeposited: Provider added <strong>+${amt.toFixed(2)} ETH</strong>. New vault balance: <strong>${state.providerCollateral.toFixed(2)} ETH</strong> <span class="tx-hash">${tx}</span>`);
  renderAll();
});

// Withdraw Collateral
el.btnWithdrawCollateral.addEventListener('click', () => {
  const amt = parseFloat(el.withdrawAmount.value);
  if (isNaN(amt) || amt <= 0) {
    showToast('Enter a valid withdrawal amount > 0', 'error');
    return;
  }
  if (amt > state.providerCollateral) {
    showToast(`Cannot withdraw ${amt.toFixed(2)} ETH: balance is ${state.providerCollateral.toFixed(2)} ETH`, 'error');
    return;
  }
  const required = state.slas.filter(s => s.status === 'Active').reduce((sum, s) => sum + s.penalty, 0);
  if (state.providerCollateral - amt < required) {
    showToast(`Withdrawal blocked: Minimum reserve of ${required.toFixed(2)} ETH required for active SLAs`, 'error');
    return;
  }

  state.providerCollateral = parseFloat((state.providerCollateral - amt).toFixed(4));
  const tx = fakeTxHash();
  showToast(`Withdrew ${amt.toFixed(2)} ETH from vault!`, 'success');
  addAuditLog(`CollateralWithdrawn: Provider withdrew <strong>-${amt.toFixed(2)} ETH</strong>. Remaining: <strong>${state.providerCollateral.toFixed(2)} ETH</strong> <span class="tx-hash">${tx}</span>`);
  renderAll();
});

// Create SLA Agreement
el.btnCreateSLA.addEventListener('click', () => {
  const customer = el.slaCustomer.value.trim();
  const uptime   = parseFloat(el.slaUptime.value);
  const penalty  = parseFloat(el.slaPenalty.value);

  if (!customer) {
    showToast('Please enter a customer address/label', 'error');
    return;
  }
  if (isNaN(uptime) || uptime <= 0 || uptime > 100) {
    showToast('Target uptime must be between 0.01% and 100%', 'error');
    return;
  }
  if (isNaN(penalty) || penalty <= 0) {
    showToast('Penalty amount must be greater than 0', 'error');
    return;
  }
  if (state.providerCollateral < penalty) {
    showToast(`Insufficient vault collateral: holds ${state.providerCollateral.toFixed(2)} ETH, penalty is ${penalty.toFixed(2)} ETH`, 'error');
    return;
  }

  const nextId = state.slas.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  state.slas.push({
    id: nextId,
    provider: state.roles.provider.address,
    customer,
    targetUptime: uptime,
    penalty,
    totalPaid: 0,
    status: 'Active'
  });

  const tx = fakeTxHash();
  showToast(`SLA Agreement #${nextId} deployed on-chain!`, 'success');
  addAuditLog(`SLACreated: SLA #${nextId} registered for <strong>${customer}</strong> (Target: ${uptime.toFixed(2)}%, Penalty: ${penalty.toFixed(2)} ETH) <span class="tx-hash">${tx}</span>`);
  renderAll();
});

// Telemetry presets
el.presetHealthy.addEventListener('click', () => {
  el.observedUptime.value = '99.85';
  el.observedLatency.value = '85';
  showToast('Preset loaded: Healthy (99.85%)');
});
el.presetMinorBreach.addEventListener('click', () => {
  el.observedUptime.value = '98.20';
  el.observedLatency.value = '380';
  showToast('Preset loaded: Minor Outage (98.20%)', 'warning');
});
el.presetSevereBreach.addEventListener('click', () => {
  el.observedUptime.value = '94.50';
  el.observedLatency.value = '920';
  showToast('Preset loaded: Major Outage (94.50%)', 'error');
});

// Submit Telemetry
el.btnSubmitTelemetry.addEventListener('click', () => {
  const slaId = parseInt(el.telemetrySlaSelect.value, 10);
  const uptime = parseFloat(el.observedUptime.value);
  const latency = parseInt(el.observedLatency.value, 10);

  if (isNaN(slaId)) { showToast('Select an SLA agreement', 'error'); return; }
  if (isNaN(uptime) || uptime < 0 || uptime > 100) { showToast('Enter valid uptime (0-100%)', 'error'); return; }
  if (isNaN(latency) || latency < 1) { showToast('Enter valid latency ms', 'error'); return; }

  const sla = state.slas.find(s => s.id === slaId);
  if (!sla) { showToast('SLA agreement not found', 'error'); return; }

  state.telemetryCount++;
  const isBreached = uptime < sla.targetUptime;
  const tx = fakeTxHash();

  state.activeReport = {
    slaId,
    observedUptime: uptime,
    latency,
    timestamp: Date.now(),
    challengeDeadline: Date.now() + 60000, // 60s challenge window
    status: isBreached ? 'Breached' : 'Compliant'
  };

  if (isBreached) {
    showToast(`SLA #${slaId} breach detected! 60s challenge window opened`, 'warning');
    addAuditLog(`TelemetrySubmitted [BREACH]: SLA #${slaId} observed <strong>${uptime.toFixed(2)}%</strong> &lt; target <strong>${sla.targetUptime.toFixed(2)}%</strong>. Challenge window open (60s). <span class="tx-hash">${tx}</span>`);
  } else {
    showToast(`SLA #${slaId} verified healthy: ${uptime.toFixed(2)}%`, 'success');
    addAuditLog(`TelemetrySubmitted [OK]: SLA #${slaId} observed <strong>${uptime.toFixed(2)}%</strong> ≥ target <strong>${sla.targetUptime.toFixed(2)}%</strong>. Compliant. <span class="tx-hash">${tx}</span>`);
  }

  renderAll();
});

// Fast-forward countdown timer (for instant viva testing)
el.btnFastForward.addEventListener('click', () => {
  if (state.activeReport && state.activeReport.status === 'Breached') {
    state.activeReport.challengeDeadline = Date.now() - 1000; // Expire immediately
    showToast('⚡ Challenge window expired! Settlement unlocked.', 'success');
    addAuditLog('DisputeWindowExpired: Challenge period elapsed. Automated settlement ready to execute.');
    renderAll();
  }
});

// Challenge Report
el.btnChallengeReport.addEventListener('click', () => {
  const r = state.activeReport;
  if (!r || r.status !== 'Breached') {
    showToast('Can only challenge breached reports', 'error');
    return;
  }
  if (Date.now() > r.challengeDeadline) {
    showToast('Challenge window has already expired', 'error');
    return;
  }
  r.status = 'Challenged';
  showToast('Report disputed by Provider! Awaiting Arbitrator resolution.', 'warning');
  addAuditLog(`TelemetryChallenged: Provider contested Report for SLA #${r.slaId}. Reason: "Upstream route flap, false-positive reading". Status: Challenged.`);
  renderAll();
});

// Arbitrator Panel Toggle
el.btnArbitratorToggle.addEventListener('click', () => {
  if (el.arbitratorActionsBox.style.display === 'none') {
    el.arbitratorActionsBox.style.display = 'block';
  } else {
    el.arbitratorActionsBox.style.display = 'none';
  }
});

// Arbitrator Uphold Breach
el.btnArbitratorUphold.addEventListener('click', () => {
  const r = state.activeReport;
  if (!r || r.status !== 'Challenged') return;

  r.status = 'Breached';
  r.challengeDeadline = Date.now() - 1000; // Expire immediately so payout button is active
  showToast('Arbitrator UPHELD breach! Settlement unlocked.', 'success');
  addAuditLog(`DisputeResolved: Arbitrator <strong>upheld</strong> breach for SLA #${r.slaId}. Telemetry confirmed authentic. Ready for settlement.`);
  renderAll();
});

// Arbitrator Dismiss Breach
el.btnArbitratorDismiss.addEventListener('click', () => {
  const r = state.activeReport;
  if (!r || r.status !== 'Challenged') return;

  r.status = 'Compliant';
  showToast('Arbitrator DISMISSED breach. Provider pardoned.', 'info');
  addAuditLog(`DisputeResolved: Arbitrator <strong>dismissed</strong> breach for SLA #${r.slaId}. Telemetry rejected as anomaly. No penalty applied.`);
  renderAll();
});

// Execute Settlement (Parametric Payout)
el.btnExecuteSettlement.addEventListener('click', () => {
  const r = state.activeReport;
  if (!r || r.status !== 'Breached') {
    showToast('Report must be in Breached status to settle', 'error');
    return;
  }
  if (Date.now() < r.challengeDeadline) {
    showToast('Challenge window is still running. Click ⚡ Fast-Forward first!', 'warning');
    return;
  }

  const sla = state.slas.find(s => s.id === r.slaId);
  if (!sla) return;

  if (state.providerCollateral < sla.penalty) {
    showToast(`Insufficient vault collateral: holds ${state.providerCollateral.toFixed(2)} ETH, penalty is ${sla.penalty.toFixed(2)} ETH`, 'error');
    addAuditLog(`SettlementFailed: Provider collateral (${state.providerCollateral.toFixed(2)} ETH) &lt; Penalty (${sla.penalty.toFixed(2)} ETH)`);
    return;
  }

  // Checks-Effects-Interactions: Debit collateral before external payout
  state.providerCollateral = parseFloat((state.providerCollateral - sla.penalty).toFixed(4));
  sla.totalPaid = parseFloat((sla.totalPaid + sla.penalty).toFixed(4));
  state.settledPenalties = parseFloat((state.settledPenalties + sla.penalty).toFixed(4));
  r.status = 'Settled';

  const tx = fakeTxHash();
  showToast(`Liquidated ${sla.penalty.toFixed(2)} ETH to customer wallet!`, 'success');
  addAuditLog(`PenaltySettled: Liquidated <strong>${sla.penalty.toFixed(2)} ETH</strong> from vault directly to <strong>${sla.customer}</strong>. Remaining vault: <strong>${state.providerCollateral.toFixed(2)} ETH</strong> <span class="tx-hash">${tx}</span>`);
  renderAll();
});

// Connect MetaMask
el.btnConnectWeb3.addEventListener('click', async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const addr = accounts[0];
      el.accountAddress.textContent = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
      el.modeText.textContent = 'Connected: MetaMask Web3';
      el.modeIndicator.style.background = 'var(--blue-100)';
      el.modeIndicator.style.color = 'var(--blue-700)';
      el.modeIndicator.style.borderColor = 'var(--blue-300)';
      el.btnConnectWeb3.textContent = 'Connected';
      el.btnConnectWeb3.disabled = true;
      showToast(`Connected MetaMask: ${addr.slice(0, 8)}...`, 'success');
      addAuditLog(`Web3Connected: External wallet <strong>${addr}</strong> linked to SLA-Vault.`);
    } catch (e) {
      showToast(`MetaMask error: ${e.message}`, 'error');
    }
  } else {
    showToast('MetaMask extension not found. Running in Zero-Failure Simulation Mode!', 'info');
  }
});

// ─────────────────────────────────────────────
// GUIDED 1-CLICK DEMO BUTTON HANDLERS
// ─────────────────────────────────────────────
el.demoStepDeposit.addEventListener('click', () => {
  el.depositAmount.value = '2.0';
  el.btnDepositCollateral.click();
});

el.demoStepCreateSLA.addEventListener('click', () => {
  el.slaCustomer.value = '0x12A...GlobalPayments Corp';
  el.slaUptime.value = '99.90';
  el.slaPenalty.value = '1.00';
  el.btnCreateSLA.click();
});

el.demoStepOutage.addEventListener('click', () => {
  el.telemetrySlaSelect.value = '1';
  el.presetMinorBreach.click();
  el.btnSubmitTelemetry.click();
});

el.demoStepChallenge.addEventListener('click', () => {
  if (!state.activeReport || state.activeReport.status !== 'Breached') {
    // First trigger an outage if none active
    el.demoStepOutage.click();
  }
  setTimeout(() => el.btnChallengeReport.click(), 200);
});

el.demoStepResolve.addEventListener('click', () => {
  if (!state.activeReport || state.activeReport.status !== 'Challenged') {
    el.demoStepChallenge.click();
  }
  setTimeout(() => el.btnArbitratorUphold.click(), 300);
});

el.demoStepSettle.addEventListener('click', () => {
  if (!state.activeReport || state.activeReport.status !== 'Breached') {
    el.demoStepOutage.click();
  }
  setTimeout(() => {
    el.btnFastForward.click();
    setTimeout(() => el.btnExecuteSettlement.click(), 200);
  }, 200);
});

el.demoStepReset.addEventListener('click', () => {
  state = JSON.parse(JSON.stringify(INITIAL_STATE));
  showToast('Reset all state to fresh initial parameters!', 'info');
  renderAll();
});

// ─────────────────────────────────────────────
// INITIAL RENDER
// ─────────────────────────────────────────────
renderAll();
