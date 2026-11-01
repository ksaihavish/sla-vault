# SLA-Vault: A Blockchain-Based SaaS Performance Bond, Collateral Assurance, and Dispute-Aware Penalty Settlement Platform

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-blue.svg)](https://soliditylang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Network](https://img.shields.io/badge/EVM-Ethereum%20%7C%20Sepolia-orange)](https://sepolia.etherscan.io/)
[![Course](https://img.shields.io/badge/Course-CS2614%20Fundamentals%20of%20Blockchain-green)](https://rvu.edu.in)

> **CS2614 Fundamentals of Blockchain — Mini Project**  
> School of Computer Science and Engineering, RV University, Bengaluru  
> **Student Lead:** Kukkadapu Sai Havish (USN: `1RUA24CSE0212`)  

---

## 1. Executive Summary

In enterprise Software-as-a-Service (SaaS) and mission-critical cloud computing, Service Level Agreements (SLAs) define contractual availability standards (e.g., 99.9% uptime). However, traditional SLA enforcement suffers from acute information asymmetry and financial friction:
* **Unfunded Promises:** Providers do not lock funds; if an outage occurs, compensation depends entirely on provider goodwill.
* **Manual Claim Friction:** Affected clients must detect downtime, collect server logs, file support tickets, and wait 30–60 days.
* **Vendor Lock-In Credits:** Providers frequently issue restrictive future service credits instead of liquid financial refunds.

**SLA-Vault** replaces trust and manual claims with programmable smart contract logic:
1. **Pre-Funded Performance Bond:** Providers lock cryptocurrency/stablecoin collateral into an on-chain escrow vault (`SLAVault.sol`).
2. **Precision Telemetry Evaluation:** Independent monitoring agents feed signed metrics evaluated with integer basis points (10,000 BP = 100.00%).
3. **Dispute-Aware Challenge Window:** A 60-second challenge window allows providers to contest false-positive telemetry before funds move.
4. **Autonomous Liquidation:** If a breach is verified and unchallenged, the smart contract liquidates the exact contractual penalty directly into the customer's wallet in a single atomic transaction.

---

## 2. System Architecture

```
+-------------------------------------------------------------------------+
|                         ACTORS & INTERFACES                             |
|                                                                         |
|  [ SaaS Provider ]       [ Enterprise Customer ]      [ Oracle Monitor ]|
|   (Locks Bond)             (Receives Payout)          (Reports Uptime)  |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                       WEB DASHBOARD LAYER                               |
|   - Institutional FinTech UI (Slate / Navy / Crisp Off-White)           |
|   - Provider Vault Panel (Deposit / Withdraw / Health Buffer)           |
|   - SLA Registry Table & Form                                           |
|   - Telemetry Simulator (Healthy vs. Minor/Major Outage)                |
|   - Dispute Window & Settlement Trigger                                 |
+-------------------------------------------------------------------------+
                                    │
                    Web3 Provider / Ethers.js Calls
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                  SMART CONTRACT: SLAVault.sol                           |
|                                                                         |
|  1. depositCollateral()                                                 |
|     --> Increases providerCollateral balance in escrow                  |
|                                                                         |
|  2. createAgreement(customer, minUptimeBP, penalty)                     |
|     --> Verifies provider has sufficient collateral to back the SLA     |
|                                                                         |
|  3. submitTelemetry(slaId, observedUptimeBP, latencyMs)                  |
|     --> Compares observed uptime vs. target                             |
|     --> If breach: flags as Breached and starts 60s Challenge Window    |
|                                                                         |
|  4. challengeReport(slaId, reason) [Optional by Provider]               |
|     --> Flags report as Challenged; awaits Arbitrator review            |
|                                                                         |
|  5. executeSettlement(slaId)                                            |
|     --> Verifies challenge window has elapsed                           |
|     --> Deducts penalty from providerCollateral                         |
|     --> Payout transferred directly to customer address                 |
+-------------------------------------------------------------------------+
```

---

## 3. Project Structure

```
BLOCKCHAIN PROJECT/
├── contracts/
│   └── SLAVault.sol                  # Core Solidity smart contract (v0.8.20)
├── frontend/
│   ├── index.html                    # Clean Institutional FinTech Dashboard
│   ├── styles.css                    # Professional FinTech Design System
│   └── app.js                        # State machine & Ethers.js integration
├── run_demo.bat                      # One-click Windows demo launcher
├── sla_vault_demo.mp4                # Complete HD walkthrough video (YouTube-ready)
├── PROJECT_DOCUMENTATION.md          # Comprehensive Viva defense & technical guide
├── SLA_Vault_Final_Project_Report.docx# Official RV University formatted project report
└── README.md                         # Project overview and instructions
```

---

## 4. How to Run the Demo

### Method 1: Instant Standalone Demo (Recommended for Viva)
No Node.js packages, no MetaMask popups, no gas fees, 100% offline-ready:
1. Double-click `run_demo.bat` (or open `frontend/index.html` in Chrome/Edge).
2. The interactive simulation engine runs immediately in your browser.
3. Use the **Role Selector** (top right) to switch perspectives between SaaS Provider, Oracle Monitor, Enterprise Customer, and Arbitrator.

### Method 2: Live On-Chain with Remix IDE & MetaMask
1. Open [Remix Ethereum IDE](https://remix.ethereum.org).
2. Copy and paste `contracts/SLAVault.sol`.
3. Compile with Solidity `0.8.20`.
4. Deploy to `Remix VM` or `Injected Provider - MetaMask` (Sepolia Testnet).
5. Interact directly with `depositCollateral`, `createAgreement`, `submitTelemetry`, and `executeSettlement`.

---

## 5. Security & Gas Efficiency Considerations

* **Checks-Effects-Interactions:** In `executeSettlement()`, internal collateral balances are deducted *before* transferring ETH, preventing reentrancy attacks.
* **Integer Basis Points:** Expressing metrics as basis points (`9900 BP = 99.00%`) avoids floating-point precision errors on the EVM.
* **Gas Consumption:**
  * Deployment: ~840,210 gas
  * `depositCollateral()`: ~42,500 gas
  * `submitTelemetry()`: ~48,320 gas
  * `executeSettlement()`: ~38,150 gas

---

## 6. Team & Academic Credits

**Course:** CS2614 Fundamentals of Blockchain  
**School:** School of Computer Science and Engineering, RV University, Bengaluru  

| Team Member | USN | Contribution |
| :--- | :--- | :--- |
| **Kukkadapu Sai Havish** | **1RUA24CSE0212** | Smart Contract Core Architecture (`SLAVault.sol`), Collateral Escrow Mechanism, Telemetry Integration, and Core Documentation |
| **[Team Member 2]** | `[USN 2]` | Institutional FinTech Web Dashboard Development (`index.html`, `styles.css`), Role Switching UI, and Enterprise Styling |
| **[Team Member 3]** | `[USN 3]` | Frontend State Machine & Web3 Engine (`app.js`), Event Handling, Simulation Logic, and Ethers.js Wallet Connectivity |
| **[Team Member 4]** | `[USN 4]` | Test Scenario Modeling (Normal, Minor, and Major Outages), Gas Optimization, Security Analysis, and Literature Review |

---

## 7. License
This project is licensed under the MIT License.
