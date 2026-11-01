import os
import subprocess
from PIL import Image, ImageDraw

# ── DESIGN TOKENS ──────────────────────────────────────────
BG         = (241, 245, 249)   # #f1f5f9
CARD       = (255, 255, 255)
BORDER     = (226, 232, 240)
BORDER_STR = (203, 213, 225)
NAVY       = (15, 23, 42)
NAVY2      = (30, 41, 59)
SLATE      = (100, 116, 139)
TEXT2      = (51, 65, 85)

GREEN_BG   = (220, 252, 231)
GREEN_FG   = (21, 128, 61)
GREEN_BD   = (134, 239, 172)

RED_BG     = (254, 226, 226)
RED_FG     = (185, 28, 28)
RED_BD     = (252, 165, 165)

AMBER_BG   = (254, 243, 199)
AMBER_FG   = (180, 83, 9)
AMBER_BD   = (252, 211, 77)

BLUE_BG    = (219, 234, 254)
BLUE_FG    = (29, 78, 216)

CODE_BG    = (15, 23, 42)
CODE_FG    = (148, 163, 184)
CODE_HL    = (226, 232, 240)
CODE_BLUE  = (96, 165, 250)

W, H = 1920, 1080
FPS  = 30

def load_font(path, size, fallback_size=None):
    from PIL import ImageFont
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        try:
            alt_paths = [
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/arialbd.ttf",
                "C:/Windows/Fonts/calibri.ttf",
                "C:/Windows/Fonts/segoeui.ttf",
            ]
            for ap in alt_paths:
                try:
                    return ImageFont.truetype(ap, fallback_size or size)
                except Exception:
                    continue
        except Exception:
            pass
        return ImageFont.load_default()

from PIL import ImageFont

FONT_TITLE    = load_font("C:/Windows/Fonts/arialbd.ttf",  52)
FONT_H2       = load_font("C:/Windows/Fonts/arialbd.ttf",  36)
FONT_H3       = load_font("C:/Windows/Fonts/arialbd.ttf",  26)
FONT_BODY     = load_font("C:/Windows/Fonts/arial.ttf",    22)
FONT_SMALL    = load_font("C:/Windows/Fonts/arial.ttf",    18)
FONT_MONO     = load_font("C:/Windows/Fonts/consola.ttf",  20)
FONT_MONO_SM  = load_font("C:/Windows/Fonts/consola.ttf",  16)
FONT_BADGE    = load_font("C:/Windows/Fonts/arialbd.ttf",  16)

def roundrect(draw, x1, y1, x2, y2, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle([x1, y1, x2, y2], radius=r, fill=fill, outline=outline, width=width)

def topbar(draw, step_label):
    # Bar background
    draw.rectangle([0, 0, W, 72], fill=CARD, outline=BORDER)
    draw.line([0, 72, W, 72], fill=BORDER, width=2)
    # SV logo
    roundrect(draw, 28, 18, 64, 54, 4, fill=NAVY)
    draw.text((38, 22), "SV", fill=CARD, font=FONT_H3)
    # Brand
    draw.text((78, 18), "SLA-Vault", fill=NAVY, font=FONT_H3)
    draw.text((215, 23), "FinTech Performance Bond Protocol", fill=SLATE, font=FONT_SMALL)
    draw.line([210, 28, 210, 52], fill=BORDER, width=1)
    # Step pill
    roundrect(draw, W-520, 22, W-28, 52, 20, fill=GREEN_BG, outline=GREEN_BD, width=1)
    draw.ellipse([W-508, 34, W-494, 48], fill=GREEN_FG)
    draw.text((W-488, 26), step_label, fill=GREEN_FG, font=FONT_BADGE)

def stat_card(draw, x, y, w, h, title, value, sub, val_color=NAVY):
    roundrect(draw, x, y, x+w, y+h, 8, fill=CARD, outline=BORDER, width=1)
    draw.text((x+18, y+16), title.upper(), fill=SLATE, font=FONT_SMALL)
    draw.text((x+18, y+44), value, fill=val_color, font=FONT_H2)
    draw.text((x+18, y+92), sub, fill=SLATE, font=FONT_SMALL)

def badge(draw, x, y, text, bg, fg, bd):
    w_text = draw.textlength(text, font=FONT_BADGE)
    rx1, rx2 = x, x + w_text + 20
    roundrect(draw, rx1, y-4, rx2, y+22, 4, fill=bg, outline=bd, width=1)
    draw.text((rx1+10, y), text, fill=fg, font=FONT_BADGE)
    return rx2

def panel(draw, x, y, w, h, title, badge_text):
    roundrect(draw, x, y, x+w, y+h, 8, fill=CARD, outline=BORDER, width=1)
    draw.rectangle([x+1, y+1, x+w-1, y+52], fill=(250, 251, 252))
    roundrect(draw, x, y, x+w, y+52, 8, fill=(250, 251, 252), outline=BORDER, width=1)
    draw.line([x+1, y+52, x+w-1, y+52], fill=BORDER, width=1)
    draw.text((x+18, y+16), title, fill=NAVY, font=FONT_H3)
    bw = draw.textlength(badge_text, font=FONT_BADGE) + 20
    roundrect(draw, x+w-bw-16, y+12, x+w-16, y+40, 4, fill=BORDER, outline=BORDER_STR, width=1)
    draw.text((x+w-bw-6, y+16), badge_text, fill=SLATE, font=FONT_BADGE)

def code_block(draw, x, y, w, h, lines):
    roundrect(draw, x, y, x+w, y+h, 6, fill=CODE_BG)
    for i, (color, text) in enumerate(lines):
        draw.text((x+18, y+14 + i*26), text, fill=color, font=FONT_MONO)

def audit_line(draw, x, y, time_str, text):
    draw.text((x, y), f"[{time_str}]", fill=SLATE, font=FONT_MONO_SM)
    draw.text((x+110, y), text, fill=CODE_FG, font=FONT_MONO_SM)

# ── FRAME GENERATORS ───────────────────────────────────────

def make_title(draw, progress):
    draw.rectangle([0, 0, W, H], fill=BG)
    topbar(draw, "Demo Engine: Live & Active")

    # Main card
    cx, cy, cw, ch = 200, 100, 1520, 920
    roundrect(draw, cx, cy, cx+cw, cy+ch, 12, fill=CARD, outline=BORDER, width=2)

    # Navy accent top strip
    roundrect(draw, cx, cy, cx+cw, cy+10, 12, fill=NAVY)
    draw.rectangle([cx, cy+6, cx+cw, cy+10], fill=NAVY)

    # Big logo area
    roundrect(draw, cx+60, cy+50, cx+140, cy+130, 6, fill=NAVY)
    draw.text((cx+76, cy+62), "SV", fill=CARD, font=FONT_TITLE)

    draw.text((cx+160, cy+55), "SLA-Vault", fill=NAVY, font=FONT_TITLE)
    draw.text((cx+160, cy+120), "A Blockchain-Based SaaS Performance Bond &", fill=SLATE, font=FONT_H3)
    draw.text((cx+160, cy+158), "Dispute-Aware Penalty Settlement Platform", fill=SLATE, font=FONT_H3)

    draw.line([cx+60, cy+210, cx+cw-60, cy+210], fill=BORDER, width=2)

    draw.text((cx+60, cy+236), "Course:     CS2614 Fundamentals of Blockchain — Mini Project", fill=TEXT2, font=FONT_BODY)
    draw.text((cx+60, cy+272), "Institute:  School of Computer Science & Engineering, RV University, Bengaluru", fill=TEXT2, font=FONT_BODY)
    draw.text((cx+60, cy+308), "Student:    Kukkadapu Sai Havish   (USN: 1RUA24CSE0212)", fill=NAVY, font=FONT_BODY)

    draw.line([cx+60, cy+360], fill=BORDER, width=1)

    # Highlights box
    roundrect(draw, cx+60, cy+390, cx+cw-60, cy+840, 8, fill=BG, outline=BORDER, width=1)
    draw.text((cx+86, cy+414), "Platform Highlights", fill=NAVY, font=FONT_H3)

    highlights = [
        (GREEN_FG, "Escrow-Backed Performance Bond — Providers lock collateral BEFORE creating service agreements."),
        (GREEN_FG, "Integer Basis-Point Precision — Uptime tracked as basis points (9900 BP = 99.00%) to avoid EVM rounding."),
        (GREEN_FG, "60-Second Dispute Challenge Window — Providers can contest false-positive telemetry before funds move."),
        (GREEN_FG, "Autonomous Liquidation — On verified breach, the smart contract pays the customer automatically."),
        (GREEN_FG, "Withdrawal Safeguard — Provider cannot drain collateral below the minimum reserve for active SLAs."),
    ]
    for i, (col, text) in enumerate(highlights):
        draw.text((cx+86, cy+466 + i*70), "✓", fill=col, font=FONT_H3)
        draw.text((cx+126, cy+470 + i*70), text, fill=TEXT2, font=FONT_BODY)

def make_architecture(draw):
    draw.rectangle([0, 0, W, H], fill=BG)
    topbar(draw, "1 of 5 — Protocol Architecture")
    draw.text((W//2, 100), "SLA-Vault System Architecture", fill=NAVY, font=FONT_TITLE, anchor="mm")
    draw.text((W//2, 145), "Three-layer decentralized application: Actors → Web Dashboard → Smart Contract", fill=SLATE, font=FONT_BODY, anchor="mm")

    # Layer 1: Actors
    for i, (actor, desc) in enumerate([
        ("SaaS Provider\n(CloudCorp)", "Locks bond\nCreates SLAs\nChallenges reports"),
        ("Oracle Monitor\n(Off-Chain Agent)", "Pings endpoints\nComputes uptime BP\nSubmits signed reports"),
        ("Enterprise Customer\n(FinBank)", "Holds SLA policy\nReceives instant payout\nZero claim filing"),
    ]):
        x = 120 + i * 600
        roundrect(draw, x, 185, x+500, 380, 8, fill=CARD, outline=BORDER_STR, width=2)
        draw.text((x+250, 238), actor, fill=NAVY, font=FONT_H3, anchor="mm")
        draw.line([x+40, 262, x+460, 262], fill=BORDER, width=1)
        draw.text((x+250, 310), desc, fill=SLATE, font=FONT_BODY, anchor="mm")

    draw.text((W//2, 420), "↓  Web3 / Ethers.js  ↓", fill=SLATE, font=FONT_BODY, anchor="mm")

    # Layer 2: Dashboard
    roundrect(draw, 200, 445, W-200, 525, 8, fill=BLUE_BG, outline=BLUE_FG, width=2)
    draw.text((W//2, 485), "Web Dashboard  (HTML / CSS / Vanilla JS / Ethers.js v6 — Runs fully offline)", fill=BLUE_FG, font=FONT_H3, anchor="mm")

    draw.text((W//2, 560), "↓  On-Chain Function Calls  ↓", fill=SLATE, font=FONT_BODY, anchor="mm")

    # Layer 3: Smart contract
    roundrect(draw, 80, 585, W-80, 1010, 8, fill=CARD, outline=NAVY, width=3)
    draw.text((W//2, 630), "Smart Contract: SLAVault.sol  (Solidity v0.8.20 — Ethereum / EVM)", fill=NAVY, font=FONT_H3, anchor="mm")
    draw.line([120, 650, W-120, 650], fill=BORDER, width=1)

    modules = [
        (GREEN_BG, GREEN_FG, GREEN_BD, "1. Collateral Escrow",  "depositCollateral()\nwithdrawCollateral()\nSolvency reserve check"),
        (BLUE_BG,  BLUE_FG,  (147,197,253), "2. SLA Registry",  "createAgreement()\nBasis-point uptime\nPenalty terms"),
        (AMBER_BG, AMBER_FG, AMBER_BD, "3. Dispute Engine",  "challengeReport()\nresolveDispute()\n60s challenge window"),
        (RED_BG,   RED_FG,   RED_BD,   "4. Settlement",      "executeSettlement()\nChecks-Effects-Interactions\nAutomatic payout"),
    ]
    for i, (bg, fg, bd, title, body) in enumerate(modules):
        x = 110 + i * 430
        roundrect(draw, x, 668, x+400, 990, 8, fill=bg, outline=bd, width=2)
        draw.text((x+200, 710), title, fill=fg, font=FONT_H3, anchor="mm")
        draw.line([x+20, 730, x+380, 730], fill=bd, width=1)
        draw.text((x+200, 830), body, fill=NAVY, font=FONT_BODY, anchor="mm")

def make_deposit_sla(draw):
    draw.rectangle([0, 0, W, H], fill=BG)
    topbar(draw, "2 of 5 — Provider Vault & SLA Creation")

    # Vault panel
    panel(draw, 60, 90, 860, 520, "Provider Performance Bond Vault", "Collateral Layer")
    roundrect(draw, 90, 160, 890, 290, 8, fill=BG, outline=BORDER, width=1)
    draw.text((110, 172), "CURRENT ESCROW BALANCE", fill=SLATE, font=FONT_SMALL)
    draw.text((110, 202), "10.00 ETH", fill=NAVY, font=FONT_TITLE)
    badge(draw, 110, 276, "Sufficient Collateral", GREEN_BG, GREEN_FG, GREEN_BD)
    draw.text((330, 277), "Reserve: 1.25 ETH required | Buffer: 800%", fill=SLATE, font=FONT_SMALL)

    draw.text((90, 315), "Key Principle:", fill=NAVY, font=FONT_H3)
    draw.text((90, 360), "Providers must lock collateral BEFORE creating SLAs.", fill=TEXT2, font=FONT_BODY)
    draw.text((90, 396), "The smart contract verifies providerCollateral ≥ penaltyPerBreach.", fill=TEXT2, font=FONT_BODY)
    draw.text((90, 432), "Withdrawals are blocked below the minimum active SLA reserve.", fill=TEXT2, font=FONT_BODY)

    code_block(draw, 90, 478, 810, 110, [
        (CODE_FG,   "function depositCollateral() external payable {"),
        (CODE_HL,   "  providerCollateral[msg.sender] += msg.value;"),
        (CODE_BLUE, "  emit CollateralDeposited(msg.sender, msg.value);"),
        (CODE_FG,   "}"),
    ])

    # SLA Registration Panel
    panel(draw, 960, 90, 900, 520, "Register New SLA Agreement", "Contract Layer")
    draw.text((982, 165), "Agreement successfully deployed on-chain:", fill=SLATE, font=FONT_BODY)

    fields = [
        ("SLA ID",          "#1"),
        ("Customer",         "0x94B...FinBank (Enterprise Tier 1)"),
        ("Target Uptime",    "99.00%  (9900 Basis Points on EVM)"),
        ("Penalty / Breach", "0.50 ETH  (deducted automatically)"),
        ("Status",           "Active — Fully Collateral-Backed"),
    ]
    for i, (label, val) in enumerate(fields):
        y = 215 + i*62
        draw.text((982, y), f"{label}:", fill=SLATE, font=FONT_BODY)
        draw.text((1200, y), val, fill=NAVY, font=FONT_H3)
        draw.line([982, y+42, 1830, y+42], fill=BORDER, width=1)

    # SLA table
    panel(draw, 60, 635, 1800, 380, "Active Service Level Agreements — On-Chain Registry", "2 Active")
    headers = ["SLA ID", "Provider", "Enterprise Customer", "Target Uptime", "Penalty / Breach", "Total Paid", "Status"]
    col_x   = [90, 190, 440, 810, 1050, 1290, 1510]
    for i, h in enumerate(headers):
        draw.text((col_x[i], 694), h.upper(), fill=SLATE, font=FONT_SMALL)
    draw.line([80, 720, 1840, 720], fill=BORDER, width=2)

    rows = [
        ("#1", "0x71C840...Provider", "0x94B...FinBank (Tier 1)",   "99.00% (9900 BP)", "0.50 ETH", "0.50 ETH", "ACTIVE"),
        ("#2", "0x71C840...Provider", "0x53E...HealthCare Corp",    "99.50% (9950 BP)", "0.75 ETH", "0.00 ETH", "ACTIVE"),
    ]
    for r, row in enumerate(rows):
        y = 736 + r * 56
        for i, val in enumerate(row):
            draw.text((col_x[i], y), val, fill=NAVY if i != 6 else TEXT2, font=FONT_BODY)
        if r == 0:
            badge(draw, col_x[6], 736, "ACTIVE", GREEN_BG, GREEN_FG, GREEN_BD)
        else:
            badge(draw, col_x[6], 792, "ACTIVE", GREEN_BG, GREEN_FG, GREEN_BD)
        draw.line([80, y+46, 1840, y+46], fill=BORDER, width=1)

def make_breach(draw, elapsed_secs):
    draw.rectangle([0, 0, W, H], fill=BG)
    topbar(draw, "3 of 5 — Telemetry Breach & 60s Challenge Window")

    # Oracle panel
    panel(draw, 60, 90, 860, 530, "Independent Telemetry & Oracle Feed", "Oracle Layer")
    draw.text((90, 165), "Oracle submitted signed performance report:", fill=SLATE, font=FONT_BODY)

    oracle_fields = [
        ("Target SLA",       "#1 — FinBank  |  99.00% required"),
        ("Observed Uptime",  "98.20%  (9820 Basis Points)"),
        ("Average Latency",  "380 ms"),
        ("Preset Used",      "Minor Outage  ⚠"),
        ("Report Timestamp", "14:12:33 UTC"),
    ]
    for i, (k, v) in enumerate(oracle_fields):
        y = 215 + i * 60
        draw.text((90, y), f"{k}:", fill=SLATE, font=FONT_BODY)
        draw.text((310, y), v, fill=NAVY, font=FONT_H3)
        draw.line([90, y+42, 890, y+42], fill=BORDER, width=1)

    code_block(draw, 90, 520, 810, 82, [
        (CODE_FG,  "submitTelemetry(slaId:1, uptimeBP:9820, ms:380)"),
        (CODE_HL,  "// 9820 < 9900  →  BREACH DETECTED"),
        (CODE_BLUE,"// Challenge window: block.timestamp + 60"),
    ])

    # Dispute & Settlement Panel
    panel(draw, 960, 90, 900, 530, "Dispute Window & Automated Settlement", "Arbitration Layer")

    # Breach alert box
    roundrect(draw, 982, 162, 1840, 360, 8, fill=RED_BG, outline=RED_BD, width=2)
    badge(draw, 992, 178, "BREACHED (98.20%)", RED_BG, RED_FG, RED_BD)
    draw.text((992, 226), "SLA #1 — 0x94B...FinBank (Enterprise Tier 1)", fill=RED_FG, font=FONT_H3)
    draw.text((992, 272), "Observed: 98.20%  <  Target: 99.00%  |  Latency: 380ms", fill=TEXT2, font=FONT_BODY)
    draw.text((992, 308), "Penalty due: 0.50 ETH  (automatically settled if unchallenged)", fill=TEXT2, font=FONT_BODY)

    remaining = max(0, 60 - int(elapsed_secs))
    timer_col = AMBER_FG if remaining > 0 else GREEN_FG
    timer_txt = f"Challenge window closes in: {remaining}s" if remaining > 0 else "Challenge window EXPIRED — settlement ready."
    roundrect(draw, 982, 374, 1840, 440, 8, fill=AMBER_BG, outline=AMBER_BD, width=1)
    draw.text((1002, 392), timer_txt, fill=timer_col, font=FONT_H3)

    draw.text((982, 460), "Fairness Guarantee:", fill=NAVY, font=FONT_H3)
    draw.text((982, 502), "Funds are NOT immediately seized. The provider has 60 seconds to challenge", fill=TEXT2, font=FONT_BODY)
    draw.text((982, 536), "erroneous or false-positive telemetry (e.g. upstream CDN anomaly).", fill=TEXT2, font=FONT_BODY)

    # Audit log
    panel(draw, 60, 640, 1800, 360, "Cryptographic Event Ledger & Audit Trail", "Immutable Logs")
    roundrect(draw, 80, 698, 1840, 980, 8, fill=CODE_BG)
    logs = [
        ("14:05:22", "CollateralDeposited: +10.00 ETH locked in escrow vault   Tx: 0x8a9f...32b"),
        ("14:07:45", "SLACreated: SLA #1 deployed — FinBank, 99.00% target, 0.50 ETH penalty   Tx: 0x2d3f...11c"),
        ("14:09:12", "SLACreated: SLA #2 deployed — HealthCare Corp, 99.50% target   Tx: 0x7b8e...92a"),
        ("14:12:33", "TelemetrySubmitted [BREACH]: SLA #1 — 98.20% < 99.00%. Challenge window opened (60s)   Tx: 0x3c1a...89f"),
    ]
    for i, (t, msg) in enumerate(logs):
        audit_line(draw, 100, 714 + i*56, t, msg)

def make_settlement(draw):
    draw.rectangle([0, 0, W, H], fill=BG)
    topbar(draw, "4 of 5 — Automated Liquidation & Customer Payout")

    # Left panel: settlement result
    panel(draw, 60, 90, 900, 540, "Settlement Execution: Penalty Liquidated", "Settlement Layer")
    roundrect(draw, 90, 162, 940, 610, 8, fill=GREEN_BG, outline=GREEN_BD, width=2)
    draw.text((500, 220), "Payout Successful", fill=GREEN_FG, font=FONT_TITLE, anchor="mm")

    draw.text((110, 280), "Provider collateral (before):", fill=TEXT2, font=FONT_BODY)
    draw.text((110, 316), "Penalty deducted:", fill=TEXT2, font=FONT_BODY)
    draw.text((110, 352), "Provider collateral (after):", fill=GREEN_FG, font=FONT_H3)
    draw.text((110, 402), "Customer received:", fill=GREEN_FG, font=FONT_H3)

    draw.text((600, 280), "10.00 ETH", fill=NAVY, font=FONT_BODY)
    draw.text((600, 316), "- 0.50 ETH", fill=RED_FG, font=FONT_H3)
    draw.line([110, 345, 890, 345], fill=GREEN_BD, width=1)
    draw.text((600, 352), "9.50 ETH", fill=GREEN_FG, font=FONT_TITLE)
    draw.text((600, 402), "+ 0.50 ETH  →  0x94B...FinBank", fill=GREEN_FG, font=FONT_H3)

    draw.line([110, 445, 890, 445], fill=GREEN_BD, width=1)
    draw.text((110, 466), "Security: Checks-Effects-Interactions pattern enforced.", fill=TEXT2, font=FONT_BODY)
    draw.text((110, 502), "  Balance debited BEFORE external transfer call.", fill=TEXT2, font=FONT_BODY)
    draw.text((110, 538), "  Reentrancy attack impossible.", fill=TEXT2, font=FONT_BODY)

    # Right panel: code trace
    panel(draw, 980, 90, 900, 540, "EVM Transaction Receipt", "On-Chain Proof")
    code_block(draw, 1010, 162, 840, 468, [
        (CODE_FG,   "[executeSettlement(slaId: 1)]"),
        ((85,170,85), ""),
        (CODE_FG,   "// 1. CHECK"),
        (CODE_HL,   "require(status == Breached)    ✓"),
        (CODE_HL,   "require(now > deadline)        ✓"),
        (CODE_HL,   "require(collateral >= penalty) ✓"),
        (CODE_FG,   ""),
        (CODE_FG,   "// 2. EFFECT (state updated first)"),
        (CODE_HL,   "collateral[provider] -= 0.50 ETH"),
        (CODE_HL,   "sla.totalPaid        += 0.50 ETH"),
        (CODE_HL,   "report.status = Settled"),
        (CODE_FG,   ""),
        (CODE_FG,   "// 3. INTERACTION (transfer last)"),
        (CODE_BLUE, "customer.call{value: 0.50 ETH}()"),
        (CODE_FG,   ""),
        (CODE_BLUE, "Tx: 0x5e2b...44a  |  Gas: 38,150"),
        (CODE_BLUE, "Status: 0x1  SUCCESS ✓"),
    ])

    # Stat cards
    cards = [
        ("PROVIDER COLLATERAL", "9.50 ETH", "Down 0.50 ETH from penalty"),
        ("SETTLED PENALTIES",   "0.50 ETH", "Automated zero-touch payout"),
        ("CUSTOMER RECEIVED",   "+0.50 ETH","Transferred to 0x94B...FinBank"),
        ("GAS COST",            "38,150",   "Execution: executeSettlement()"),
    ]
    for i, (t, v, s) in enumerate(cards):
        x = 60 + i * 470
        stat_card(draw, x, 656, 445, 130, t, v, s, GREEN_FG if i == 2 else NAVY)

    # Audit log
    panel(draw, 60, 812, 1800, 216, "Cryptographic Event Ledger", "Immutable Logs")
    roundrect(draw, 80, 870, 1840, 1010, 8, fill=CODE_BG)
    audit_line(draw, 100, 885, "14:13:40", "Challenge window expired. Settlement condition met for SLA #1.")
    audit_line(draw, 100, 913, "14:13:41", "PenaltySettled: 0.50 ETH deducted from vault. Transferred to 0x94B...FinBank  Tx: 0x5e2b...44a")
    audit_line(draw, 100, 941, "14:13:41", "Event: PenaltySettled(slaId:1, customer:0x94B..., amount:500000000000000000 wei)")
    audit_line(draw, 100, 969, "14:13:42", "Vault balance updated: 10.00 ETH → 9.50 ETH. Buffer 660% above reserve.")

def make_conclusion(draw):
    draw.rectangle([0, 0, W, H], fill=BG)
    topbar(draw, "5 of 5 — Summary & Conclusion")

    roundrect(draw, 200, 100, W-200, H-60, 12, fill=CARD, outline=BORDER, width=2)
    roundrect(draw, 200, 100, W-200, 110, 12, fill=NAVY)
    draw.rectangle([200, 106, W-200, 110], fill=NAVY)

    draw.text((W//2, 168), "SLA-Vault: Project Outcomes", fill=NAVY, font=FONT_TITLE, anchor="mm")
    draw.text((W//2, 216), "CS2614 Fundamentals of Blockchain   |   Mini Project Evaluation Summary", fill=SLATE, font=FONT_BODY, anchor="mm")
    draw.line([260, 248, W-260, 248], fill=BORDER, width=2)

    outcomes = [
        (GREEN_FG, "✓ Smart Contract Deployed (Solidity 0.8.20) — All functions verified on Remix/Sepolia."),
        (GREEN_FG, "✓ Pre-funded Collateral Escrow — Providers lock bonds before entering any agreement."),
        (GREEN_FG, "✓ Basis-Point Precision (9900 BP = 99.00%) — Integer arithmetic avoids EVM rounding errors."),
        (GREEN_FG, "✓ 60-Second Dispute Challenge Window — Fair arbitration before any liquidation occurs."),
        (GREEN_FG, "✓ Autonomous Penalty Settlement — Zero support tickets, zero manual billing intervention."),
        (GREEN_FG, "✓ Reentrancy-Safe — Checks-Effects-Interactions pattern enforced throughout."),
        (GREEN_FG, "✓ Withdrawal Guard — Collateral cannot drop below active SLA reserve requirements."),
    ]
    for i, (col, text) in enumerate(outcomes):
        draw.text((280, 276 + i*72), text, fill=TEXT2, font=FONT_BODY)
        draw.ellipse([258, 288 + i*72, 272, 302 + i*72], fill=col)

    roundrect(draw, 260, 800, W-260, 920, 8, fill=BG, outline=BORDER, width=1)
    draw.text((W//2, 838), "Presenter: Kukkadapu Sai Havish  |  USN: 1RUA24CSE0212", fill=NAVY, font=FONT_H3, anchor="mm")
    draw.text((W//2, 882), "GitHub: github.com/ksaihavish/sla-vault     Ready for Viva Voce & Q&A", fill=SLATE, font=FONT_BODY, anchor="mm")


# ── MAIN VIDEO PIPELINE ────────────────────────────────────

def generate_video():
    frames_dir = "video_frames_v2"
    os.makedirs(frames_dir, exist_ok=True)

    scenes = [
        # (generator_fn, extra_args, duration_seconds)
        ("title",        [], 8),
        ("architecture", [], 10),
        ("deposit_sla",  [], 10),
        ("breach",       [], 14),   # 14s so timer ticks from 60 → 46
        ("settlement",   [], 10),
        ("conclusion",   [], 8),
    ]

    frame_idx = 0
    total_frames = sum(s[2] * FPS for s in scenes)
    print(f"Generating {total_frames} frames across {len(scenes)} scenes...")

    for scene_name, args, duration in scenes:
        num_frames = duration * FPS
        for f in range(num_frames):
            img  = Image.new("RGB", (W, H), BG)
            draw = ImageDraw.Draw(img)

            if scene_name == "title":
                make_title(draw, f / num_frames)
            elif scene_name == "architecture":
                make_architecture(draw)
            elif scene_name == "deposit_sla":
                make_deposit_sla(draw)
            elif scene_name == "breach":
                elapsed = f / FPS          # seconds elapsed within this scene
                make_breach(draw, elapsed)
            elif scene_name == "settlement":
                make_settlement(draw)
            elif scene_name == "conclusion":
                make_conclusion(draw)

            out_path = os.path.join(frames_dir, f"frame_{frame_idx:05d}.png")
            img.save(out_path, optimize=False)
            frame_idx += 1

            if frame_idx % 60 == 0:
                print(f"  {frame_idx}/{total_frames} frames rendered...")

    print(f"All {frame_idx} frames rendered. Compiling with ffmpeg...")

    output = "sla_vault_demo.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(FPS),
        "-i", os.path.join(frames_dir, "frame_%05d.png"),
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        output
    ]
    subprocess.run(cmd, check=True)
    print(f"Video saved: {output}")

    # Cleanup frames
    for f in os.listdir(frames_dir):
        os.remove(os.path.join(frames_dir, f))
    os.rmdir(frames_dir)
    print("Temp frames cleaned up.")

if __name__ == "__main__":
    generate_video()
