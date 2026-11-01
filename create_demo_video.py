import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

def create_video():
    width, height = 1920, 1080
    fps = 30
    frames_dir = "video_frames"
    os.makedirs(frames_dir, exist_ok=True)

    # Color definitions (FinTech theme)
    bg_color = (248, 250, 252) # #F8FAFC
    navy = (15, 23, 42)        # #0F172A
    slate = (100, 116, 139)    # #64748B
    border_color = (226, 232, 240)
    emerald = (5, 150, 105)
    amber = (217, 119, 6)
    rose = (220, 38, 38)
    blue = (37, 99, 235)

    try:
        font_title = ImageFont.truetype("arialbd.ttf", 52)
        font_subtitle = ImageFont.truetype("arial.ttf", 28)
        font_body = ImageFont.truetype("arial.ttf", 24)
        font_mono = ImageFont.truetype("consola.ttf", 22)
        font_badge = ImageFont.truetype("arialbd.ttf", 18)
    except:
        font_title = font_subtitle = font_body = font_mono = font_badge = ImageFont.load_default()

    def draw_topbar(draw, step_text):
        draw.rectangle([(0, 0), (width, 80)], fill=(255, 255, 255), outline=border_color, width=2)
        # SV Logo
        draw.rectangle([(40, 18), (84, 62)], fill=navy)
        draw.text((48, 22), "SV", fill=(255, 255, 255), font=font_subtitle)
        draw.text((105, 24), "SLA-Vault  |  FinTech Performance Bond Protocol", fill=navy, font=font_subtitle)
        draw.text((width - 450, 26), f"Walkthrough: {step_text}", fill=emerald, font=font_body)

    scenes = [
        # Scene 1: Title Card (8 seconds = 240 frames)
        {"type": "title", "duration": 8},
        # Scene 2: Architecture Diagram (10 seconds = 300 frames)
        {"type": "architecture", "duration": 10},
        # Scene 3: Provider Deposit & SLA Creation (10 seconds = 300 frames)
        {"type": "deposit", "duration": 10},
        # Scene 4: Oracle Telemetry Breach (12 seconds = 360 frames)
        {"type": "breach", "duration": 12},
        # Scene 5: Automated Settlement Payout (12 seconds = 360 frames)
        {"type": "settlement", "duration": 12},
        # Scene 6: Conclusion (8 seconds = 240 frames)
        {"type": "conclusion", "duration": 8}
    ]

    frame_idx = 0

    print("Generating video frames...")

    for scene in scenes:
        stype = scene["type"]
        duration = scene["duration"]
        num_frames = duration * fps

        for f in range(num_frames):
            img = Image.new("RGB", (width, height), bg_color)
            draw = ImageDraw.Draw(img)

            if stype == "title":
                # Center card
                draw.rectangle([(200, 150), (1720, 930)], fill=(255, 255, 255), outline=border_color, width=3)
                draw.rectangle([(300, 220), (370, 290)], fill=navy)
                draw.text((312, 230), "SV", fill=(255, 255, 255), font=font_title)
                draw.text((400, 235), "SLA-Vault", fill=navy, font=font_title)
                draw.text((300, 320), "A Blockchain-Based SaaS Performance Bond, Collateral Assurance,\nand Dispute-Aware Penalty Settlement Platform", fill=blue, font=font_subtitle)

                draw.line([(300, 420), (1620, 420)], fill=border_color, width=2)

                draw.text((300, 460), "Academic Project: CS2614 Fundamentals of Blockchain (FinTech Minor)", fill=navy, font=font_subtitle)
                draw.text((300, 510), "Institution: School of Computer Science & Engineering, RV University, Bengaluru", fill=slate, font=font_body)
                draw.text((300, 560), "Student Lead: Kukkadapu Sai Havish (USN: 1RUA24CSE0212)", fill=navy, font=font_subtitle)

                # Key highlights
                draw.rectangle([(300, 640), (1620, 850)], fill=(241, 245, 249), outline=border_color, width=2)
                draw.text((340, 665), "Key Project Highlights:", fill=navy, font=font_subtitle)
                draw.text((340, 720), "• Escrow-Backed Performance Bond: Providers lock collateral before entering agreements", fill=slate, font=font_body)
                draw.text((340, 760), "• Integer Precision Basis-Point Metrics (10,000 BP = 100.00% uptime)", fill=slate, font=font_body)
                draw.text((340, 800), "• Autonomous Settlement: Parametric penalty liquidation with fair 60s dispute challenge window", fill=slate, font=font_body)

            elif stype == "architecture":
                draw_topbar(draw, "1. Protocol Architecture & Workflow")
                if os.path.exists("fig1_system_architecture.png"):
                    arch_img = Image.open("fig1_system_architecture.png")
                    arch_img = arch_img.resize((1500, 900))
                    img.paste(arch_img, (210, 120))

            elif stype == "deposit":
                draw_topbar(draw, "2. Provider Collateral Escrow & SLA Registry")
                # Left card: Provider Vault
                draw.rectangle([(150, 130), (900, 950)], fill=(255, 255, 255), outline=border_color, width=2)
                draw.text((190, 170), "Provider Performance Bond Vault", fill=navy, font=font_subtitle)
                draw.text((190, 220), "Current Escrow Balance: 10.00 ETH", fill=emerald, font=font_title)
                draw.text((190, 300), "Status: Sufficient Collateral (Buffer: 100%)", fill=emerald, font=font_body)

                draw.text((190, 380), "[Smart Contract Method Call]", fill=slate, font=font_body)
                code_box = """function depositCollateral() external payable {
    require(msg.value > 0, "Deposit > 0");
    providerCollateral[msg.sender] += msg.value;
    emit CollateralDeposited(msg.sender, msg.value);
}"""
                draw.text((190, 430), code_box, fill=navy, font=font_mono)

                # Right card: SLA Agreement
                draw.rectangle([(980, 130), (1770, 950)], fill=(255, 255, 255), outline=border_color, width=2)
                draw.text((1020, 170), "Registered Service Level Agreement", fill=navy, font=font_subtitle)
                draw.text((1020, 240), "SLA ID: #1", fill=blue, font=font_subtitle)
                draw.text((1020, 300), "Customer: 0x94B210...FinBank (Enterprise Tier 1)", fill=navy, font=font_body)
                draw.text((1020, 360), "Guaranteed Target Uptime: 99.00% (9900 BP)", fill=navy, font=font_body)
                draw.text((1020, 420), "Penalty per Incident: 0.50 ETH", fill=rose, font=font_subtitle)
                draw.text((1020, 480), "State: Active & Escrow-Backed", fill=emerald, font=font_body)

            elif stype == "breach":
                draw_topbar(draw, "3. Telemetry Breach & 60s Challenge Window")
                # Telemetry submission
                draw.rectangle([(150, 130), (1770, 950)], fill=(255, 255, 255), outline=rose, width=3)
                draw.text((200, 170), "Oracle Outage Telemetry Report", fill=rose, font=font_title)
                draw.text((200, 250), "Off-chain monitoring agent pings cloud service and records severe service degradation:", fill=slate, font=font_body)

                # Big breach alert card
                draw.rectangle([(200, 310), (1720, 520)], fill=(254, 242, 242), outline=rose, width=2)
                draw.text((240, 340), "ALERT: SLA #1 BREACH DETECTED", fill=rose, font=font_title)
                draw.text((240, 420), "Observed Uptime: 98.20%  <  Contract Target: 99.00%", fill=rose, font=font_subtitle)
                draw.text((240, 465), "Recorded Latency: 480ms  |  Liquidated Penalty Due: 0.50 ETH", fill=navy, font=font_body)

                # Challenge window box
                draw.rectangle([(200, 560), (1720, 880)], fill=(255, 251, 235), outline=amber, width=2)
                draw.text((240, 600), "Dispute & Challenge Period: Active (60s Window)", fill=amber, font=font_title)
                draw.text((240, 670), "• Fairness Rule: Funds are NOT immediately seized.", fill=navy, font=font_body)
                draw.text((240, 715), "• The SaaS Provider has 60 seconds to contest false-positive telemetry (e.g. upstream ISP DDoS).", fill=navy, font=font_body)
                draw.text((240, 760), "• If unchallenged or upheld by the Arbitrator, automated settlement proceeds.", fill=navy, font=font_body)

            elif stype == "settlement":
                draw_topbar(draw, "4. Autonomous Settlement & Customer Compensation")
                draw.rectangle([(150, 130), (1770, 950)], fill=(255, 255, 255), outline=emerald, width=3)
                draw.text((200, 170), "Settlement Execution: Payout Complete", fill=emerald, font=font_title)

                # Results grid
                draw.rectangle([(200, 250), (900, 500)], fill=(240, 253, 244), outline=emerald, width=2)
                draw.text((240, 290), "Provider Collateral Debited", fill=emerald, font=font_subtitle)
                draw.text((240, 360), "10.00 ETH  --->  9.50 ETH", fill=navy, font=font_title)
                draw.text((240, 430), "Exact 0.50 ETH penalty deducted from vault escrow", fill=slate, font=font_body)

                draw.rectangle([(980, 250), (1720, 500)], fill=(240, 253, 244), outline=emerald, width=2)
                draw.text((1020, 290), "Customer Indemnification", fill=emerald, font=font_subtitle)
                draw.text((1020, 360), "+0.50 ETH Transferred", fill=emerald, font=font_title)
                draw.text((1020, 430), "Transferred directly to FinBank wallet address", fill=slate, font=font_body)

                # Trace
                draw.rectangle([(200, 550), (1720, 890)], fill=(15, 23, 42))
                code_trace = """[BLOCKCHAIN EVENT LOG]
Timestamp:   14:14:10 UTC
Event:       PenaltySettled(slaId: 1, customer: 0x94B210...FinBank, amount: 0.50 ETH)
Tx Hash:     0x5e2b8109a1c8417e9234b01984210e82341a44a
Gas Used:    38,150 gas
Security:    Checks-Effects-Interactions Pattern Enforced (Reentrancy Immune)
Outcome:     Zero manual dispute friction. 100% solvency assurance achieved."""
                draw.text((240, 580), code_trace, fill=(56, 189, 248), font=font_mono)

            elif stype == "conclusion":
                draw.rectangle([(200, 150), (1720, 930)], fill=(255, 255, 255), outline=border_color, width=3)
                draw.text((300, 230), "Conclusion & Evaluation Summary", fill=navy, font=font_title)
                draw.text((300, 310), "CS2614 Fundamentals of Blockchain  |  Mini Project Evaluation", fill=blue, font=font_subtitle)

                draw.line([(300, 380), (1620, 380)], fill=border_color, width=2)

                draw.text((300, 430), "✓ Full Smart Contract Implementation in Solidity 0.8.20", fill=navy, font=font_subtitle)
                draw.text((300, 490), "✓ Pre-funded Escrow Performance Bond guarantees solvency", fill=navy, font=font_subtitle)
                draw.text((300, 550), "✓ Independent Telemetry with Basis-Point Precision (BP)", fill=navy, font=font_subtitle)
                draw.text((300, 610), "✓ 60-Second Dispute Challenge Window ensures fair arbitration", fill=navy, font=font_subtitle)
                draw.text((300, 670), "✓ Zero-touch automated liquidation reduces claim time from 60 days to seconds", fill=navy, font=font_subtitle)

                draw.rectangle([(300, 750), (1620, 860)], fill=(241, 245, 249), outline=border_color, width=2)
                draw.text((340, 785), "Presenter: Kukkadapu Sai Havish (USN: 1RUA24CSE0212)", fill=navy, font=font_subtitle)
                draw.text((340, 825), "Thank you! Ready for Viva Voce & Q&A.", fill=emerald, font=font_body)

            frame_file = os.path.join(frames_dir, f"frame_{frame_idx:05d}.png")
            img.save(frame_file)
            frame_idx += 1

    print(f"Generated {frame_idx} frames. Compiling MP4 video with ffmpeg...")

    output_video = "sla_vault_demo.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-framerate", str(fps),
        "-i", os.path.join(frames_dir, "frame_%05d.png"),
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-crf", "20",
        output_video
    ]
    subprocess.run(cmd, check=True)
    print(f"Video created successfully: {output_video}")

    # Clean up frames
    for f in os.listdir(frames_dir):
        os.remove(os.path.join(frames_dir, f))
    os.rmdir(frames_dir)
    print("Temporary frames cleaned up.")

if __name__ == "__main__":
    create_video()
