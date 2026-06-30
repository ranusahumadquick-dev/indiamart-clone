/**
 * Test Document Generator
 * Creates sample ITR, CA Certificate, and Bank Statement for testing
 * Run: node create-test-docs.js
 */

const fs = require("fs");
const path = require("path");

// ── Simple PDF-like content (text encoded as PDF) ─────────────────────────────
function makePDF(title, lines) {
  // Minimal valid PDF structure
  const content = lines.join("\n");
  const pdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
  /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length ${content.length + 200} >>
stream
BT
/F1 14 Tf
50 750 Td
(${title}) Tj
/F1 10 Tf
0 -30 Td
${lines.map(l => `(${l.replace(/[()\\]/g, "\\$&")}) Tj\n0 -18 Td`).join("\n")}
ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
trailer << /Size 6 /Root 1 0 R >>
startxref
0
%%EOF`;
  return pdf;
}

// ── 1. ITR Document ───────────────────────────────────────────────────────────
const itr = makePDF("INCOME TAX RETURN - AY 2023-24", [
  "PAN: AAPFU0939F",
  "Name: CORTECH SYSTEMS PRIVATE LIMITED",
  "Assessment Year: 2023-2024",
  "Form Type: ITR-6 (Companies)",
  "",
  "INCOME DETAILS",
  "Gross Total Income: Rs. 45,00,000",
  "Total Income: Rs. 38,50,000",
  "Tax Payable: Rs. 8,00,000",
  "Tax Paid: Rs. 8,00,000",
  "",
  "STATUS: Filed Successfully",
  "Acknowledgement No: 123456789012345",
  "Date of Filing: 31/07/2023",
  "",
  "This is a computer generated document.",
  "Income Tax Department, Government of India",
]);

fs.writeFileSync(path.join(__dirname, "ITR_Document_AY2023-24.pdf"), itr);
console.log("✅ Created: ITR_Document_AY2023-24.pdf");

// ── 2. CA Certificate ─────────────────────────────────────────────────────────
const ca = makePDF("CHARTERED ACCOUNTANT CERTIFICATE", [
  "CA CERTIFICATE OF ANNUAL TURNOVER",
  "",
  "To Whomsoever It May Concern",
  "",
  "This is to certify that M/s CORTECH SYSTEMS PRIVATE LIMITED",
  "having GSTIN: 27AAPFU0939F1ZV",
  "registered at: B-12, Industrial Area, Mumbai - 400001",
  "",
  "has achieved the following turnover:",
  "",
  "Financial Year 2022-23: Rs. 45,00,000 (Forty Five Lakhs)",
  "Financial Year 2021-22: Rs. 38,00,000 (Thirty Eight Lakhs)",
  "Financial Year 2020-21: Rs. 28,00,000 (Twenty Eight Lakhs)",
  "",
  "The above figures are as per the audited accounts.",
  "",
  "CA: Rajesh Kumar Sharma",
  "M.No: 123456",
  "Firm: Sharma & Associates, Chartered Accountants",
  "Date: 15/04/2024",
  "UDIN: 24123456ABCDEF1234",
]);

fs.writeFileSync(path.join(__dirname, "CA_Certificate_Turnover.pdf"), ca);
console.log("✅ Created: CA_Certificate_Turnover.pdf");

// ── 3. Bank Statement ─────────────────────────────────────────────────────────
const bank = makePDF("BANK STATEMENT - LAST 3 MONTHS", [
  "STATE BANK OF INDIA",
  "CURRENT ACCOUNT STATEMENT",
  "",
  "Account Holder: CORTECH SYSTEMS PVT LTD",
  "Account No: XXXX XXXX 5678",
  "IFSC: SBIN0001234",
  "Branch: Mumbai Main Branch",
  "Period: 01/01/2024 to 31/03/2024",
  "",
  "TRANSACTION SUMMARY",
  "Opening Balance: Rs. 2,45,000",
  "Total Credits: Rs. 18,50,000",
  "Total Debits: Rs. 15,20,000",
  "Closing Balance: Rs. 5,75,000",
  "",
  "Top Transactions:",
  "15/01 - GST Payment - Dr Rs. 1,20,000",
  "20/01 - Customer Payment - Cr Rs. 3,50,000",
  "05/02 - Supplier Payment - Dr Rs. 2,80,000",
  "18/02 - Customer Payment - Cr Rs. 4,20,000",
  "10/03 - Customer Payment - Cr Rs. 5,50,000",
  "",
  "This is a digitally verified statement.",
  "State Bank of India - Internet Banking",
]);

fs.writeFileSync(path.join(__dirname, "Bank_Statement_Q1_2024.pdf"), bank);
console.log("✅ Created: Bank_Statement_Q1_2024.pdf");

console.log("\n📁 All test documents created in: test-docs/");
console.log("Upload these files in the seller registration documents step.");
