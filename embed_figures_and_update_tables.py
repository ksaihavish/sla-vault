import docx
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os

def embed_figures_and_tables():
    doc_path = "SLA_Vault_Final_Project_Report.docx"
    doc = docx.Document(doc_path)

    # 1. Update Figures 1 to 4
    figure_mappings = [
        ("Figure 1: System Architecture of the SLA-Vault Protocol", "fig1_system_architecture.png", 5.8),
        ("Figure 2: SLAVault Smart Contract Deployment on Remix / Testnet", "fig2_contract_deployment.png", 5.5),
        ("Figure 3: Telemetry Submission and Automated Payout Execution", "fig3_function_execution.png", 5.5),
        ("Figure 4: SLA-Vault Enterprise Web Dashboard and Event Ledger", "fig4_frontend_dashboard.png", 5.8)
    ]

    for caption_text, img_file, width_in in figure_mappings:
        if not os.path.exists(img_file):
            print(f"Warning: {img_file} not found.")
            continue
        for i, p in enumerate(doc.paragraphs):
            if caption_text in p.text:
                # Add picture paragraph right after the caption
                p_img = p.insert_paragraph_before()
                p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p_img.add_run()
                run.add_picture(img_file, width=Inches(width_in))
                print(f"Embedded {img_file} before caption: {caption_text[:30]}...")
                break

    # 2. Update Table 15: Balanced Team Contribution Split
    # Find Table 15
    for table in doc.tables:
        for r in table.rows:
            cells = [c.text.strip() for c in r.cells]
            if "Team member" in cells and "USN" in cells and "Contribution" in cells:
                # This is Table 15 (Team contribution)
                rows = table.rows
                if len(rows) >= 5:
                    # Row 1 (Student 1: Sai Havish)
                    rows[1].cells[0].text = "Kukkadapu Sai Havish"
                    rows[1].cells[1].text = "1RUA24CSE0212"
                    rows[1].cells[2].text = "Smart Contract Core Architecture (SLAVault.sol), Escrow & Collateral Mechanism, Telemetry Integration, and Core Documentation"

                    # Row 2 (Student 2)
                    rows[2].cells[0].text = "[Team Member 2]"
                    rows[2].cells[1].text = "[USN 2]"
                    rows[2].cells[2].text = "Institutional FinTech Web Dashboard Development (HTML/CSS), Role Switching Engine, and Enterprise UI Styling"

                    # Row 3 (Student 3)
                    rows[3].cells[0].text = "[Team Member 3]"
                    rows[3].cells[1].text = "[USN 3]"
                    rows[3].cells[2].text = "Frontend State Machine & Web3 Engine (app.js), Event Handling, Simulation Logic, and Ethers.js Wallet Connectivity"

                    # Row 4 (Student 4)
                    rows[4].cells[0].text = "[Team Member 4]"
                    rows[4].cells[1].text = "[USN 4]"
                    rows[4].cells[2].text = "Test Scenario Modeling (Normal, Minor, and Major Outages), Gas Optimization, Security Vulnerability Analysis, and Literature Review"

    # 3. Update Table 9 and Table 22 for Repository and Video links
    github_url = "https://github.com/ksaihavish/sla-vault"
    youtube_placeholder = "https://youtu.be/XXXXXXXXXX (Ready to upload sla_vault_demo.mp4)"

    for table in doc.tables:
        for r in table.rows:
            for cell in r.cells:
                if "[https://github.com/<username>/<repository>]" in cell.text:
                    cell.text = cell.text.replace("[https://github.com/<username>/<repository>]", github_url)
                if "[https://youtu.be/XXXXXXXX" in cell.text:
                    cell.text = youtube_placeholder
                if cell.text.strip() == "[URL]" and any("GitHub" in c.text for c in r.cells):
                    cell.text = github_url

    doc.save(doc_path)
    print("Document successfully updated with all 4 figures and balanced contribution table!")

if __name__ == "__main__":
    embed_figures_and_tables()
