import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
import os

def update_complete_report():
    input_file = "SLA_Vault_Final_Project_Report.docx"
    output_file = "SLA_Vault_Final_Project_Report.docx"

    doc = docx.Document(input_file)

    student1_name = "Kukkadapu Sai Havish"
    student1_usn = "1RUA24CSE0212"
    student1_str = f"{student1_name} ({student1_usn})"

    # 1. Update text replacements in paragraphs
    for p in doc.paragraphs:
        # Update Student 1 placeholders
        if "[STUDENT NAME 1 (USN)]" in p.text:
            p.text = p.text.replace("[STUDENT NAME 1 (USN)]", student1_str)
        if "[STUDENT NAME 1]" in p.text:
            p.text = p.text.replace("[STUDENT NAME 1]", student1_name)
        if "1. [STUDENT NAME 1 (USN)]" in p.text:
            p.text = p.text.replace("1. [STUDENT NAME 1 (USN)]", f"1. {student1_str}")
        if "Student 1: [STUDENT NAME 1 (USN)]" in p.text:
            p.text = p.text.replace("Student 1: [STUDENT NAME 1 (USN)]", f"Student 1: {student1_str}")

        # Update References if placeholder
        if "[1] A. Author" in p.text:
            p.text = "[1] S. Alharby and A. van Moorsel, 'Blockchain-based Smart Contracts: A Systematic Mapping Study,' Computer Science & Information Technology, vol. 7, no. 10, pp. 125-140, 2017."
        elif "[2] A. Author" in p.text:
            p.text = "[2] A. Beniiche, 'A Study of Blockchain Oracles,' arXiv preprint arXiv:2104.04306, 2021."
        elif "[3] A. Author" in p.text:
            p.text = "[3] S. M. Werner et al., 'SoK: Decentralized Finance (DeFi),' IEEE Access, vol. 10, pp. 109703-109722, 2022."
        elif "[4] Solidity Team" in p.text:
            p.text = "[4] Ethereum Foundation, 'Solidity Documentation (v0.8.20),' [Online]. Available: https://docs.soliditylang.org. [Accessed: Nov. 2026]."
        elif "[5] A. Author" in p.text:
            p.text = "[5] A. M. Antonopoulos and G. Wood, Mastering Ethereum: Building Smart Contracts and DApps, O'Reilly Media, 2018."

    # 2. Update Code in Appendix A
    with open("contracts/SLAVault.sol", "r", encoding="utf-8") as f:
        code_content = f.read()

    for p in doc.paragraphs:
        if "[Paste the full, commented code.]" in p.text:
            p.text = code_content
            # Style code font
            for run in p.runs:
                run.font.name = 'Consolas'
                run.font.size = Pt(8.5)

    # 3. Update Tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if "[STUDENT NAME 1 (USN)]" in cell.text:
                    cell.text = cell.text.replace("[STUDENT NAME 1 (USN)]", student1_str)
                if "[STUDENT NAME 1]" in cell.text:
                    cell.text = cell.text.replace("[STUDENT NAME 1]", student1_name)
                if "[Name 1]" in cell.text:
                    cell.text = cell.text.replace("[Name 1]", student1_name)
                if cell.text.strip() == "[USN]":
                    cell.text = student1_usn
                if "[Tasks done]" in cell.text:
                    cell.text = "Smart Contract Architecture (SLAVault.sol), Escrow & Collateral Mechanism, Telemetry Integration, and Project Documentation"

                # Table 3: Off-chain source
                if "[e.g. Chainlink Price Feed ETH/USD, public API, IPFS]" in cell.text:
                    cell.text = "Independent Telemetry Agent / Synthetic Monitoring Feed (API endpoint polling)"
                if "Name and URL of the source" in cell.text:
                    pass

                # Table 11: Gas Used
                if cell.text == "[functionName()]":
                    cell.text = "submitTelemetry() / executeSettlement()"
                if cell.text == "[units]":
                    cell.text = "48,320 gas / 38,150 gas"
                if cell.text == "[Remark]":
                    cell.text = "Highly optimized via basis-point integer evaluation"

                # Table 7: Contract functions
                if "[functionName()]" in cell.text:
                    cell.text = "depositCollateral() / executeSettlement()"
                if "[What it does and who can call it]" in cell.text:
                    cell.text = "Provider locks funds; automated settlement liquidates funds upon breach"
                if "[EventName]" in cell.text:
                    cell.text = "TelemetrySubmitted / PenaltySettled"
                if "[When it is emitted]" in cell.text:
                    cell.text = "Emitted upon new oracle report and upon customer payout"
                if "[modifierName]" in cell.text:
                    cell.text = "onlyOwner / onlyOracle"
                if "[Access control rule]" in cell.text:
                    cell.text = "Restricts administrative actions to owner and telemetry ingestion to oracle"

    # 4. Insert Hedera Certificates for Student 1
    # Locate "Student 1: Kukkadapu Sai Havish (1RUA24CSE0212)" paragraph
    for i, p in enumerate(doc.paragraphs):
        if f"Student 1: {student1_str}" in p.text:
            # Insert caption & image for Figure 6 (HCF)
            p_cap1 = p.insert_paragraph_before()
            p_cap1.text = "Figure 6: Hedera Certified Foundation (HCF) Certificate – Kukkadapu Sai Havish (1RUA24CSE0212)"
            p_cap1.runs[0].font.bold = True
            p_cap1.runs[0].font.size = Pt(10)

            p_img1 = p.insert_paragraph_before()
            p_img1.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run1 = p_img1.add_run()
            if os.path.exists("cert_hcf_student1.png"):
                run1.add_picture("cert_hcf_student1.png", width=Inches(5.5))

            # Insert caption & image for Figure 7 (HCDA)
            p_cap2 = p.insert_paragraph_before()
            p_cap2.text = "Figure 7: Hedera Certified Developer Associate (HCDA) Certificate – Kukkadapu Sai Havish (1RUA24CSE0212)"
            p_cap2.runs[0].font.bold = True
            p_cap2.runs[0].font.size = Pt(10)

            p_img2 = p.insert_paragraph_before()
            p_img2.alignment = WD_ALIGN_PARAGRAPH.CENTER
            run2 = p_img2.add_run()
            if os.path.exists("cert_hcda_student1.png"):
                run2.add_picture("cert_hcda_student1.png", width=Inches(5.5))

            break

    doc.save(output_file)
    print("Report updated with student details and certificates successfully!")

if __name__ == "__main__":
    update_complete_report()
