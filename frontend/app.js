/**
 * SLA-Vault Application Engine
 * Implements full state machine corresponding to SLAVault.sol.
 * Runs instantly in interactive simulation mode, with optional MetaMask Web3 connectivity.
 */

// --- INITIAL STATE & DEMO DATA ---
const state = {
  providerCollateral: 10.0, // in ETH
  role: 'provider', // 'provider' | 'oracle' | 'customer' | 'owner'
  roles: {
    provider: { name: 'SaaS Provider (CloudCorp)', address: '0x71C840...Provider' },
    oracle:   { name: 'Oracle / Monitor Agent',  address: '0x32A491...Oracle' },
    customer: { name: 'Customer (FinBank)',      address: '0x94B210...Customer' },
    owner:    { name: 'Vault Arbitrator / Owner',address: '0x10E894...Arbitrator' }
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
  telemetryCount: 14,
  settledPenalties: 0.50,
  activeReport: {
    slaId: 1,
    observedUptime: 97.40,
    latency: 480,
    timestamp: Date.now(),
    challengeDeadline: Date.now() + 60000, // 60 seconds from now
    status: 'Breached' // 'Compliant' | 'Breached' | 'Challenged' | 'Settled'
  },
  auditLogs: [
    { time: '14:02:10', text: 'Vault initialized with Oracle at <strong>0x32A491...Oracle</strong>' },
    { time: '14:05:22', text: 'CollateralDeposited: Provider deposited <strong>10.00 ETH</strong> (Tx: 0x8a9f...32b)' },
    { time: '14:07:45', text: 'SLACreated: SLA #1 established for FinBank with <strong>99.00%</strong> target' },
    { time: '14:09:12', text: 'SLACreated: SLA #2 established for HealthCare Corp with <strong>99.50%</strong> target' },
    { time: '14:12:00', text: 'TelemetrySubmitted: SLA #1 observed <strong>97.40%</strong>. Status: <strong>Breached</strong>' }
  ]
};

// --- DOM REFERENCES ---
const el = {
  roleSelector: document.getElementById('roleSelector'),
  accountAddress: document.getElementById('accountAddress'),
  modeIndicator: document.getElementById('modeIndicator'),
  modeText: document.getElementById('modeText'),
  btnConnectWeb3: document.getElementById('btnConnectWeb3'),

  statCollateral: document.getElementById('statCollateral'),
  statCollateralSub: document.getElementById('statCollateralSub'),
  statActiveSLAs: document.getElementById('statActiveSLAs'),
  statTelemetryCount: document.getElementById('statTelemetryCount'),
  statSettledPenalties: document.getElementById('statSettledPenalties'),

  providerVaultBalance: document.getElementById('providerVaultBalance'),
  collateralHealthBadge: document.getElementById('collateralHealthBadge'),
  depositAmount: document.getElementById('depositAmount'),
  withdrawAmount: document.getElementById('withdrawAmount'),
  btnDepositCollateral: document.getElementById('btnDepositCollateral'),
  btnWithdrawCollateral: document.getElementById('btnWithdrawCollateral'),

  slaCustomer: document.getElementById('slaCustomer'),
  slaUptime: document.getElementById('slaUptime'),
  slaPenalty: document.getElementById('slaPenalty'),
  btnCreateSLA: document.getElementById('btnCreateSLA'),

  telemetrySlaSelect: document.getElementById('telemetrySlaSelect'),
  observedUptime: document.getElementById('observedUptime'),
  observedLatency: document.getElementById('observedLatency'),
  presetHealthy: document.getElementById('presetHealthy'),
  presetMinorBreach: document.getElementById('presetMinorBreach'),
  presetSevereBreach: document.getElementById('presetSevereBreach'),
  btnSubmitTelemetry: document.getElementById('btnSubmitTelemetry'),

  activeReportBox: document.getElementById('activeReportBox'),
  activeReportTitle: document.getElementById('activeReportTitle'),
  activeReportBadge: document.getElementById('activeReportBadge'),
  activeReportMeta: document.getElementById('activeReportMeta'),
  activeReportTimer: document.getElementById('activeReportTimer'),
  btnChallengeReport: document.getElementById('btnChallengeReport'),
  btnResolveDispute: document.getElementById('btnResolveDispute'),
  btnExecuteSettlement: document.getElementById('btnExecuteSettlement'),

  slaTableBody: document.getElementById('slaTableBody'),
  auditLog: document.getElementById('auditLog')
};

// --- TIME FORMAT HELPER ---
function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

// --- LOGGING ENGINE ---
function addAuditLog(text) {
  const entry = { time: getTimestamp(), text: text };
  state.auditLogs.unshift(entry);
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

// --- RENDER STATS & UI ---
function renderUI() {
  // Update Top Stats
  el.statCollateral.innerText = `${state.providerCollateral.toFixed(2)} ETH`;
  el.providerVaultBalance.innerText = `${state.providerCollateral.toFixed(2)} ETH`;
  el.statActiveSLAs.innerText = state.slas.filter(s => s.status === 'Active').length;
  el.statTelemetryCount.innerText = state.telemetryCount;
  el.statSettledPenalties.innerText = `${state.settledPenalties.toFixed(2)} ETH`;

  // Calculate required reserve (sum of penalties for active SLAs)
  const totalRequiredReserve = state.slas.reduce((acc, s) => acc + s.penalty, 0);
  if (state.providerCollateral < totalRequiredReserve) {
    el.collateralHealthBadge.className = 'badge badge-danger';
    el.collateralHealthBadge.innerText = 'Under-Collateralized';
    el.statCollateralSub.innerText = `Warning: Minimum buffer is ${totalRequiredReserve.toFixed(2)} ETH`;
    el.statCollateralSub.style.color = '#dc2626';
  } else {
    el.collateralHealthBadge.className = 'badge badge-success';
    el.collateralHealthBadge.innerText = 'Sufficient Collateral';
    el.statCollateralSub.innerText = `Collateral Buffer: Safe (${(state.providerCollateral / totalRequiredReserve * 100).toFixed(0)}%)`;
    el.statCollateralSub.style.color = 'var(--text-muted)';
  }

  // Render SLA Table
  el.slaTableBody.innerHTML = state.slas.map(s => `
    <tr>
      <td><strong>#${s.id}</strong></td>
      <td><span style="font-family: monospace;">${s.provider}</span></td>
      <td><strong>${s.customer}</strong></td>
      <td>${s.targetUptime.toFixed(2)}%</td>
      <td>${s.penalty.toFixed(2)} ETH</td>
      <td>${s.totalPaid.toFixed(2)} ETH</td>
      <td><span class="badge ${s.status === 'Active' ? 'badge-success' : 'badge-neutral'}">${s.status}</span></td>
    </tr>
  `).join('');

  // Update SLA select options
  el.telemetrySlaSelect.innerHTML = state.slas.map(s => `
    <option value="${s.id}">SLA #${s.id} - ${s.customer} (Target: ${s.targetUptime.toFixed(2)}% | Penalty: ${s.penalty.toFixed(2)} ETH)</option>
  `).join('');

  // Render Active Telemetry / Dispute Box
  renderActiveReport();
}

function renderActiveReport() {
  const r = state.activeReport;
  if (!r) {
    el.activeReportTitle.innerText = 'No Active Breaches in Dispute Window';
    el.activeReportBadge.className = 'badge badge-success';
    el.activeReportBadge.innerText = 'System Healthy';
    el.activeReportMeta.innerText = 'All services compliant with guaranteed performance bounds.';
    el.activeReportTimer.innerText = 'No dispute timer running.';
    el.btnChallengeReport.disabled = true;
    el.btnResolveDispute.disabled = true;
    el.btnExecuteSettlement.disabled = true;
    return;
  }

  const sla = state.slas.find(s => s.id === r.slaId) || state.slas[0];
  el.activeReportTitle.innerText = `Latest Report: SLA #${r.slaId} (${sla.customer})`;

  if (r.status === 'Breached') {
    el.activeReportBadge.className = 'badge badge-danger';
    el.activeReportBadge.innerText = `Breached (${r.observedUptime.toFixed(2)}%)`;
    el.activeReportMeta.innerText = `Recorded Latency: ${r.latency}ms | Target: ${sla.targetUptime.toFixed(2)}% | Penalty Due: ${sla.penalty.toFixed(2)} ETH`;
    el.btnChallengeReport.disabled = false;
    el.btnResolveDispute.disabled = true;
  } else if (r.status === 'Challenged') {
    el.activeReportBadge.className = 'badge badge-warning';
    el.activeReportBadge.innerText = 'Contested / Under Dispute';
    el.activeReportMeta.innerText = `Provider challenged telemetry data. Awaiting Arbitrator resolution.`;
    el.btnChallengeReport.disabled = true;
    el.btnResolveDispute.disabled = false;
  } else if (r.status === 'Settled') {
    el.activeReportBadge.className = 'badge badge-neutral';
    el.activeReportBadge.innerText = 'Penalty Settled';
    el.activeReportMeta.innerText = `Penalty of ${sla.penalty.toFixed(2)} ETH liquidated & paid out to customer.`;
    el.btnChallengeReport.disabled = true;
    el.btnResolveDispute.disabled = true;
    el.btnExecuteSettlement.disabled = true;
  } else if (r.status === 'Compliant') {
    el.activeReportBadge.className = 'badge badge-success';
    el.activeReportBadge.innerText = `Compliant (${r.observedUptime.toFixed(2)}%)`;
    el.activeReportMeta.innerText = `Observed performance satisfies target ${sla.targetUptime.toFixed(2)}%. No penalty.`;
    el.btnChallengeReport.disabled = true;
    el.btnResolveDispute.disabled = true;
    el.btnExecuteSettlement.disabled = true;
  }

  updateTimerCountdown();
}

function updateTimerCountdown() {
  const r = state.activeReport;
  if (!r || r.status === 'Settled' || r.status === 'Compliant') {
    el.activeReportTimer.innerText = 'Dispute timer idle.';
    el.activeReportTimer.style.color = 'var(--text-muted)';
    el.btnExecuteSettlement.disabled = true;
    return;
  }

  const remaining = Math.max(0, Math.ceil((r.challengeDeadline - Date.now()) / 1000));
  if (remaining > 0) {
    el.activeReportTimer.innerText = `Challenge Window Closes in: ${remaining}s`;
    el.activeReportTimer.style.color = 'var(--amber-600)';
    el.btnExecuteSettlement.disabled = true; // Cannot settle while window is still open!
  } else {
    el.activeReportTimer.innerText = `Challenge Window Expired: Ready for Automated Settlement`;
    el.activeReportTimer.style.color = 'var(--emerald-600)';
    if (r.status === 'Breached') {
      el.btnExecuteSettlement.disabled = false;
    }
  }
}

// Timer tick every second
setInterval(updateTimerCountdown, 1000);

// --- USER ACTIONS ---

// Role Selection
el.roleSelector.addEventListener('change', (e) => {
  state.role = e.target.value;
  const current = state.roles[state.role];
  el.accountAddress.innerText = current.address;
  addAuditLog(`Role switched to <strong>${current.name}</strong> (${current.address})`);
});

// Deposit Collateral
el.btnDepositCollateral.addEventListener('click', () => {
  const amt = parseFloat(el.depositAmount.value);
  if (isNaN(amt) || amt <= 0) {
    alert('Please enter a valid deposit amount greater than 0.');
    return;
  }
  state.providerCollateral += amt;
  addAuditLog(`CollateralDeposited: Provider added <strong>${amt.toFixed(2)} ETH</strong>. Vault balance: <strong>${state.providerCollateral.toFixed(2)} ETH</strong>`);
  renderUI();
});

// Withdraw Collateral
el.btnWithdrawCollateral.addEventListener('click', () => {
  const amt = parseFloat(el.withdrawAmount.value);
  if (isNaN(amt) || amt <= 0) {
    alert('Please enter a valid withdrawal amount.');
    return;
  }
  if (amt > state.providerCollateral) {
    alert('Cannot withdraw more than current collateral balance.');
    return;
  }
  state.providerCollateral -= amt;
  addAuditLog(`CollateralWithdrawn: Provider withdrew <strong>${amt.toFixed(2)} ETH</strong>. Remaining balance: <strong>${state.providerCollateral.toFixed(2)} ETH</strong>`);
  el.withdrawAmount.value = '';
  renderUI();
});

// Create SLA Agreement
el.btnCreateSLA.addEventListener('click', () => {
  const customer = el.slaCustomer.value.trim();
  const uptime = parseFloat(el.slaUptime.value);
  const penalty = parseFloat(el.slaPenalty.value);

  if (!customer) {
    alert('Please enter a customer address or label.');
    return;
  }
  if (isNaN(uptime) || uptime <= 0 || uptime > 100) {
    alert('Target uptime must be between 0.01% and 100%.');
    return;
  }
  if (isNaN(penalty) || penalty <= 0) {
    alert('Penalty must be greater than 0.');
    return;
  }

  const newId = state.slas.length + 1;
  const newSLA = {
    id: newId,
    provider: state.roles.provider.address,
    customer: customer,
    targetUptime: uptime,
    penalty: penalty,
    totalPaid: 0.00,
    status: 'Active'
  };

  state.slas.push(newSLA);
  addAuditLog(`SLACreated: New SLA #${newId} registered for <strong>${customer}</strong> (Target: ${uptime.toFixed(2)}%, Penalty: ${penalty.toFixed(2)} ETH)`);
  renderUI();
});

// Evaluation Presets for Telemetry
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

// Submit Telemetry Report
el.btnSubmitTelemetry.addEventListener('click', () => {
  const slaId = parseInt(el.telemetrySlaSelect.value);
  const sla = state.slas.find(s => s.id === slaId);
  const uptime = parseFloat(el.observedUptime.value);
  const latency = parseInt(el.observedLatency.value);

  if (isNaN(uptime) || isNaN(latency)) {
    alert('Please enter valid telemetry numbers.');
    return;
  }

  state.telemetryCount++;
  const isBreached = uptime < sla.targetUptime;
  const newStatus = isBreached ? 'Breached' : 'Compliant';

  state.activeReport = {
    slaId: slaId,
    observedUptime: uptime,
    latency: latency,
    timestamp: Date.now(),
    challengeDeadline: Date.now() + 60000, // 60s window
    status: newStatus
  };

  if (isBreached) {
    addAuditLog(`TelemetrySubmitted: SLA #${slaId} breach detected! Observed: <strong>${uptime.toFixed(2)}%</strong> < Required ${sla.targetUptime.toFixed(2)}%. Challenge window opened (60s).`);
  } else {
    addAuditLog(`TelemetrySubmitted: SLA #${slaId} healthy. Observed: <strong>${uptime.toFixed(2)}%</strong> >= Required ${sla.targetUptime.toFixed(2)}%. Compliant.`);
  }

  renderUI();
});

// Challenge Report (Provider action)
el.btnChallengeReport.addEventListener('click', () => {
  if (!state.activeReport || state.activeReport.status !== 'Breached') {
    alert('Can only challenge breached reports.');
    return;
  }
  state.activeReport.status = 'Challenged';
  addAuditLog(`TelemetryChallenged: Provider disputed Report for SLA #${state.activeReport.slaId}. Reason: "Upstream CloudFlare DDoS, false positive telemetry". Status marked Challenged.`);
  renderUI();
});

// Resolve Dispute (Arbitrator action)
el.btnResolveDispute.addEventListener('click', () => {
  if (!state.activeReport || state.activeReport.status !== 'Challenged') {
    alert('No report is currently under challenge.');
    return;
  }

  const uphold = confirm('Arbitrator Decision:\nClick OK to UPHOLD the breach (penalize provider).\nClick CANCEL to DISMISS the breach (pardon provider).');
  if (uphold) {
    state.activeReport.status = 'Breached';
    state.activeReport.challengeDeadline = Date.now() - 1000; // Expire deadline immediately to enable payout
    addAuditLog(`DisputeResolved: Arbitrator UPHELD the breach for SLA #${state.activeReport.slaId}. Telemetry confirmed valid.`);
  } else {
    state.activeReport.status = 'Compliant';
    addAuditLog(`DisputeResolved: Arbitrator DISMISSED the breach for SLA #${state.activeReport.slaId}. Telemetry rejected as anomaly.`);
  }

  renderUI();
});

// Execute Settlement (Automatic Liquidation & Payout)
el.btnExecuteSettlement.addEventListener('click', () => {
  const r = state.activeReport;
  if (!r || r.status !== 'Breached') {
    alert('Report must be in Breached status to execute settlement.');
    return;
  }
  if (Date.now() < r.challengeDeadline) {
    alert('Challenge window is still active! Must wait for challenge deadline to expire.');
    return;
  }

  const sla = state.slas.find(s => s.id === r.slaId);
  if (state.providerCollateral < sla.penalty) {
    alert('CRITICAL: Provider collateral is insufficient to cover the penalty!');
    addAuditLog(`SettlementFailed: Provider collateral (${state.providerCollateral.toFixed(2)} ETH) < Penalty (${sla.penalty.toFixed(2)} ETH)`);
    return;
  }

  // Deduct penalty from provider collateral
  state.providerCollateral -= sla.penalty;
  sla.totalPaid += sla.penalty;
  state.settledPenalties += sla.penalty;
  r.status = 'Settled';

  addAuditLog(`PenaltySettled: Liquidated <strong>${sla.penalty.toFixed(2)} ETH</strong> from provider collateral and transferred to <strong>${sla.customer}</strong> (Tx: 0x5e2b...44a)`);
  renderUI();
});

// --- OPTIONAL WEB3 / METAMASK CONNECTION ---
el.btnConnectWeb3.addEventListener('click', async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      el.accountAddress.innerText = `${account.slice(0, 6)}...${account.slice(-4)}`;
      el.modeText.innerText = 'Connected: Web3 / MetaMask';
      el.modeIndicator.style.borderColor = 'var(--blue-600)';
      el.btnConnectWeb3.innerText = 'Connected';
      el.btnConnectWeb3.disabled = true;
      addAuditLog(`Web3Connected: Successfully linked MetaMask account <strong>${account}</strong>`);
    } catch (err) {
      alert(`MetaMask connection error: ${err.message}`);
    }
  } else {
    alert('No Web3 wallet (like MetaMask) detected. The application is running seamlessly in Interactive Simulation Mode!');
  }
});

// --- INITIAL LOAD ---
renderUI();
renderAuditLogs();
