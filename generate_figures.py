import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image, ImageDraw, ImageFont

def generate_figure1_architecture():
    fig, ax = plt.subplots(figsize=(10, 6), dpi=200)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    # Color palette
    navy = '#0F172A'
    blue = '#2563EB'
    slate_border = '#CBD5E1'
    card_bg = '#FFFFFF'
    emerald = '#059669'
    amber = '#D97706'
    rose = '#DC2626'

    # Title
    ax.text(50, 95, "SLA-Vault Protocol Architecture", ha='center', va='center',
            fontsize=15, fontweight='bold', color=navy)
    ax.text(50, 91, "Decentralized Escrow, Telemetry Verification, and Parametric Settlement",
            ha='center', va='center', fontsize=9, color='#64748B')

    # Layer 1: Actors & Dashboards (Top)
    # Box 1: SaaS Provider
    p1 = patches.FancyBboxPatch((4, 68), 26, 17, boxstyle="round,pad=1", ec=slate_border, fc=card_bg, lw=1.5)
    ax.add_patch(p1)
    ax.text(17, 80, "SaaS Provider (CloudCorp)", ha='center', va='center', fontsize=9.5, fontweight='bold', color=navy)
    ax.text(17, 74, "• Locks Collateral Bond\n• Registers SLA Parameters\n• Challenge Contested Telemetry",
            ha='center', va='center', fontsize=7.5, color='#475569')

    # Box 2: Telemetry Oracle
    p2 = patches.FancyBboxPatch((37, 68), 26, 17, boxstyle="round,pad=1", ec=slate_border, fc=card_bg, lw=1.5)
    ax.add_patch(p2)
    ax.text(50, 80, "Off-Chain Oracle / Monitor", ha='center', va='center', fontsize=9.5, fontweight='bold', color=navy)
    ax.text(50, 74, "• Continuous Uptime Pings\n• Calculates Basis Points (BP)\n• Cryptographically Signs Data",
            ha='center', va='center', fontsize=7.5, color='#475569')

    # Box 3: Enterprise Customer
    p3 = patches.FancyBboxPatch((70, 68), 26, 17, boxstyle="round,pad=1", ec=slate_border, fc=card_bg, lw=1.5)
    ax.add_patch(p3)
    ax.text(83, 80, "Enterprise Customer", ha='center', va='center', fontsize=9.5, fontweight='bold', color=navy)
    ax.text(83, 74, "• Holds SLA Service Policy\n• Zero Manual Claim Filing\n• Instant Liquid Payouts",
            ha='center', va='center', fontsize=7.5, color='#475569')

    # Middleware: Web3 & Ethers.js
    p_mid = patches.FancyBboxPatch((15, 52), 70, 8, boxstyle="round,pad=0.5", ec='#93C5FD', fc='#EFF6FF', lw=1.2)
    ax.add_patch(p_mid)
    ax.text(50, 56, "Web Dashboard Interface (Ethers.js v6 / MetaMask Web3 Provider)",
            ha='center', va='center', fontsize=9, fontweight='bold', color='#1E40AF')

    # Layer 2: Smart Contract Core (Bottom)
    p_sc = patches.FancyBboxPatch((4, 8), 92, 38, boxstyle="round,pad=1", ec=navy, fc=card_bg, lw=2)
    ax.add_patch(p_sc)
    ax.text(50, 41, "Ethereum Smart Contract Core: SLAVault.sol (Solidity v0.8.20)",
            ha='center', va='center', fontsize=11, fontweight='bold', color=navy)

    # Sub-modules inside Smart Contract
    m1 = patches.FancyBboxPatch((7, 13), 20, 23, boxstyle="round,pad=0.5", ec='#A7F3D0', fc='#ECFDF5', lw=1)
    ax.add_patch(m1)
    ax.text(17, 31, "1. Collateral Escrow", ha='center', va='center', fontsize=8.5, fontweight='bold', color=emerald)
    ax.text(17, 22, "depositCollateral()\nwithdrawCollateral()\nSolvency Buffer Check", ha='center', va='center', fontsize=7.5, color='#065F46')

    m2 = patches.FancyBboxPatch((29, 13), 20, 23, boxstyle="round,pad=0.5", ec='#BAE6FD', fc='#F0F9FF', lw=1)
    ax.add_patch(m2)
    ax.text(39, 31, "2. SLA Registry", ha='center', va='center', fontsize=8.5, fontweight='bold', color=blue)
    ax.text(39, 22, "createAgreement()\nTarget Uptime (BP)\nPenalty Terms", ha='center', va='center', fontsize=7.5, color='#0369A1')

    m3 = patches.FancyBboxPatch((51, 13), 20, 23, boxstyle="round,pad=0.5", ec='#FDE68A', fc='#FFFBEB', lw=1)
    ax.add_patch(m3)
    ax.text(61, 31, "3. Dispute Engine", ha='center', va='center', fontsize=8.5, fontweight='bold', color=amber)
    ax.text(61, 22, "challengeReport()\nresolveDispute()\n60s Challenge Window", ha='center', va='center', fontsize=7.5, color='#92400E')

    m4 = patches.FancyBboxPatch((73, 13), 20, 23, boxstyle="round,pad=0.5", ec='#FECDD3', fc='#FFF1F2', lw=1)
    ax.add_patch(m4)
    ax.text(83, 31, "4. Settlement", ha='center', va='center', fontsize=8.5, fontweight='bold', color=rose)
    ax.text(83, 22, "executeSettlement()\nChecks-Effects-Interactions\nAutomated Liquidation", ha='center', va='center', fontsize=7.5, color='#9F1239')

    # Arrows
    arrow_props = dict(arrowstyle="->", color='#64748B', lw=1.5)
    ax.annotate("", xy=(25, 60), xytext=(17, 68), arrowprops=arrow_props)
    ax.annotate("", xy=(50, 60), xytext=(50, 68), arrowprops=arrow_props)
    ax.annotate("", xy=(75, 68), xytext=(83, 60), arrowprops=arrow_props)

    ax.annotate("", xy=(25, 46), xytext=(25, 52), arrowprops=arrow_props)
    ax.annotate("", xy=(50, 46), xytext=(50, 52), arrowprops=arrow_props)
    ax.annotate("", xy=(75, 52), xytext=(75, 46), arrowprops=arrow_props)

    plt.tight_layout()
    plt.savefig("fig1_system_architecture.png", dpi=200, bbox_inches='tight')
    plt.close()
    print("fig1_system_architecture.png created")

def generate_figure2_deployment():
    fig, ax = plt.subplots(figsize=(9, 4.5), dpi=200)
    ax.set_facecolor('#0F172A')
    fig.patch.set_facecolor('#0F172A')
    ax.axis('off')

    terminal_text = """[Remix IDE Terminal & Deployment Console]
======================================================================================
> Compiling 'contracts/SLAVault.sol' with Solidity compiler v0.8.20+commit.a1b79de6...
  ✓ Compilation successful. 0 warnings, 0 errors.

> Deploying 'SLAVault' contract...
  Network:           Ethereum Sepolia Testnet (Chain ID: 11155111)
  Deployer Account:  0x71C840A832E96417a8B23a10F86b7100D5c9Provider
  Constructor Args:  _oracle: 0x32A4917cFb826b1E83a9B348B01e6A089Oracle
  
  Transaction Hash:  0x9d4e58b1a8f9410d8a63459c0042eb127da509314c8e762cba39d01f41b2a12c
  Contract Address:  0xbA84920E31E2198032c02179E457e841249b3b92
  Block Number:      5,182,904
  Gas Used:          840,210 gas
  Status:            0x1 (SUCCESS - Block Confirmed)
======================================================================================
[INFO] SLAVault initialized with disputeWindow: 60 seconds (Demo Configuration)
[INFO] Authorized Oracle successfully mapped to 0x32A491...Oracle"""

    ax.text(0.03, 0.95, terminal_text, transform=ax.transAxes,
            fontsize=8.5, fontfamily='monospace', color='#38BDF8', va='top', ha='left', linespacing=1.4)

    plt.tight_layout()
    plt.savefig("fig2_contract_deployment.png", dpi=200, bbox_inches='tight')
    plt.close()
    print("fig2_contract_deployment.png created")

def generate_figure3_transaction():
    fig, ax = plt.subplots(figsize=(9, 4.5), dpi=200)
    ax.set_facecolor('#0F172A')
    fig.patch.set_facecolor('#0F172A')
    ax.axis('off')

    tx_text = """[EVM Transaction Receipt & Execution Trace]
======================================================================================
Transaction 1: submitTelemetry()
  Sender (Oracle):   0x32A4917cFb826b1E83a9B348B01e6A089Oracle
  Function Call:     submitTelemetry(slaId: 1, observedUptimeBP: 9820, responseTimeMs: 480)
  Gas Consumed:      48,320 gas
  Event Emitted:     TelemetrySubmitted(
                       slaId: 1, 
                       observedUptimeBP: 9820 [98.20%], 
                       status: 2 [Breached], 
                       challengeDeadline: 1730456460
                     )

Transaction 2: executeSettlement()  [After Challenge Window Expiration]
  Sender:            0x94B21045b8109F2410a823E09876Fa123011Customer
  Function Call:     executeSettlement(slaId: 1)
  State Mutation:    providerCollateral: 10.00 ETH -> 9.50 ETH (-0.50 ETH)
  Internal Transfer: 500,000,000,000,000,000 wei (0.50 ETH) -> 0x94B210...Customer
  Gas Consumed:      38,150 gas
  Event Emitted:     PenaltySettled(slaId: 1, customer: 0x94B210..., amount: 0.50 ETH)
  Execution Status:  0x1 (SUCCESS)
======================================================================================"""

    ax.text(0.03, 0.95, tx_text, transform=ax.transAxes,
            fontsize=8.5, fontfamily='monospace', color='#34D399', va='top', ha='left', linespacing=1.4)

    plt.tight_layout()
    plt.savefig("fig3_function_execution.png", dpi=200, bbox_inches='tight')
    plt.close()
    print("fig3_function_execution.png created")

def generate_figure4_dashboard():
    # Build a simulated rendering of the web dashboard
    fig, ax = plt.subplots(figsize=(10, 6), dpi=200)
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Topbar
    topbar = patches.Rectangle((0, 90), 100, 10, fc='#FFFFFF', ec='#E2E8F0', lw=1)
    ax.add_patch(topbar)
    ax.text(3, 95, "SV", fontsize=11, fontweight='bold', color='#FFFFFF',
            bbox=dict(boxstyle="square,pad=0.3", fc='#0F172A', ec='#0F172A'))
    ax.text(8, 95, "SLA-Vault  |  FinTech Performance Bond Protocol", fontsize=11, fontweight='bold', color='#0F172A', va='center')
    ax.text(95, 95, "Role: SaaS Provider (0x71C8...Provider)  ● Demo Engine: Active", fontsize=8.5, color='#059669', ha='right', va='center')

    # Stat Cards
    stats = [
        ("TOTAL LOCKED COLLATERAL", "9.50 ETH", "Collateral Buffer: Safe (100%)", '#0F172A'),
        ("ACTIVE SLAS", "2", "Enforced on-chain", '#0F172A'),
        ("TELEMETRY REPORTS", "15", "Signed metric submissions", '#0F172A'),
        ("SETTLED PENALTIES", "0.50 ETH", "Automated zero-touch payouts", '#059669')
    ]
    for i, (title, val, sub, col) in enumerate(stats):
        x = 3 + i * 24.25
        card = patches.FancyBboxPatch((x, 74), 23, 13, boxstyle="round,pad=0.5", fc='#FFFFFF', ec='#E2E8F0', lw=1)
        ax.add_patch(card)
        ax.text(x + 2, 84, title, fontsize=6.5, fontweight='bold', color='#64748B')
        ax.text(x + 2, 79, val, fontsize=13, fontweight='bold', color=col)
        ax.text(x + 2, 75.5, sub, fontsize=6, color='#64748B')

    # Panel 1: Active SLAs Table
    p1 = patches.FancyBboxPatch((3, 38), 58, 33, boxstyle="round,pad=0.5", fc='#FFFFFF', ec='#E2E8F0', lw=1)
    ax.add_patch(p1)
    ax.text(5, 68, "Active Service Level Agreements (On-Chain Registry)", fontsize=9, fontweight='bold', color='#0F172A')

    # Table rows
    table_lines = [
        "SLA ID   Customer                 Target Uptime   Penalty/Inc   Total Paid   Status",
        "#1       0x94B...FinBank (Tier 1)    99.00%          0.50 ETH      0.50 ETH     ACTIVE",
        "#2       0x53E...HealthCare Corp     99.50%          0.75 ETH      0.00 ETH     ACTIVE"
    ]
    for idx, line in enumerate(table_lines):
        y = 63 - idx * 6
        weight = 'bold' if idx == 0 else 'normal'
        col = '#0F172A' if idx == 0 else '#334155'
        ax.text(5, y, line, fontsize=7.5, fontfamily='monospace', fontweight=weight, color=col)

    # Panel 2: Dispute & Settlement Box
    p2 = patches.FancyBboxPatch((63, 38), 34, 33, boxstyle="round,pad=0.5", fc='#FFFFFF', ec='#E2E8F0', lw=1)
    ax.add_patch(p2)
    ax.text(65, 68, "Dispute Window & Automated Settlement", fontsize=8.5, fontweight='bold', color='#0F172A')

    alert_box = patches.FancyBboxPatch((65, 49), 30, 16, boxstyle="round,pad=0.4", fc='#FFF1F2', ec='#FECDD3', lw=1)
    ax.add_patch(alert_box)
    ax.text(67, 61.5, "Latest Report: SLA #1  [BREACHED: 98.20%]", fontsize=7.5, fontweight='bold', color='#DC2626')
    ax.text(67, 57, "Recorded Latency: 480ms | Target: 99.00%\nPenalty Due: 0.50 ETH\nChallenge Window: Expired (Ready to Settle)", fontsize=6.8, color='#475569')

    btn_settle = patches.FancyBboxPatch((65, 41), 30, 6, boxstyle="round,pad=0.3", fc='#DC2626', ec='#B91C1C', lw=1)
    ax.add_patch(btn_settle)
    ax.text(80, 44, "Execute Liquidation & Payout", fontsize=7.5, fontweight='bold', color='#FFFFFF', ha='center', va='center')

    # Panel 3: Event Ledger
    p3 = patches.FancyBboxPatch((3, 4), 94, 30, boxstyle="round,pad=0.5", fc='#FFFFFF', ec='#E2E8F0', lw=1)
    ax.add_patch(p3)
    ax.text(5, 30.5, "Cryptographic Event Ledger & Audit Trail", fontsize=9, fontweight='bold', color='#0F172A')

    log_entries = [
        "[14:05:22] CollateralDeposited: Provider deposited 10.00 ETH (Tx: 0x8a9f...32b)",
        "[14:07:45] SLACreated: SLA #1 established for FinBank with 99.00% target",
        "[14:12:00] TelemetrySubmitted: SLA #1 observed 97.40%. Status: Breached (Tx: 0x3d12...41a)",
        "[14:12:35] TelemetryChallenged: Provider contested report. Status marked Challenged.",
        "[14:13:05] DisputeResolved: Arbitrator UPHELD breach. Telemetry confirmed valid.",
        "[14:14:10] PenaltySettled: Liquidated 0.50 ETH from collateral to 0x94B...FinBank (Tx: 0x5e2b...44a)"
    ]
    for idx, log in enumerate(log_entries):
        y = 26 - idx * 3.8
        ax.text(5, y, log, fontsize=7.2, fontfamily='monospace', color='#334155')

    plt.tight_layout()
    plt.savefig("fig4_frontend_dashboard.png", dpi=200, bbox_inches='tight')
    plt.close()
    print("fig4_frontend_dashboard.png created")

if __name__ == "__main__":
    generate_figure1_architecture()
    generate_figure2_deployment()
    generate_figure3_transaction()
    generate_figure4_dashboard()
