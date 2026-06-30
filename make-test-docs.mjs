import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

function makePDF(title, lines) {
  const stream = [
    "BT",
    "/F1 15 Tf",
    `72 760 Td (${esc(title)}) Tj`,
    "/F1 10 Tf",
    ...lines.map((l, i) => `72 ${730 - i * 20} Td (${esc(l)}) Tj`),
    "ET"
  ].join("\n");

  const streamBytes = Buffer.from(stream, "latin1");
  const len = streamBytes.length;

  // Build objects as Buffers with exact byte positions
  const header   = Buffer.from("%PDF-1.4\n");
  const obj1     = Buffer.from(`1 0 obj\n<</Type/Catalog/Pages 2 0 R>>\nendobj\n`);
  const obj2     = Buffer.from(`2 0 obj\n<</Type/Pages/Kids[3 0 R]/Count 1>>\nendobj\n`);
  const obj3     = Buffer.from(`3 0 obj\n<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>\nendobj\n`);
  const obj4     = Buffer.concat([
    Buffer.from(`4 0 obj\n<</Length ${len}>>\nstream\n`),
    streamBytes,
    Buffer.from(`\nendstream\nendobj\n`)
  ]);
  const obj5     = Buffer.from(`5 0 obj\n<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>\nendobj\n`);

  // Calculate exact byte offsets
  let pos = header.length;
  const o1 = pos; pos += obj1.length;
  const o2 = pos; pos += obj2.length;
  const o3 = pos; pos += obj3.length;
  const o4 = pos; pos += obj4.length;
  const o5 = pos; pos += obj5.length;

  const xrefPos = pos;

  const xref = Buffer.from(
    `xref\n0 6\n` +
    `0000000000 65535 f \n` +
    `${String(o1).padStart(10,"0")} 00000 n \n` +
    `${String(o2).padStart(10,"0")} 00000 n \n` +
    `${String(o3).padStart(10,"0")} 00000 n \n` +
    `${String(o4).padStart(10,"0")} 00000 n \n` +
    `${String(o5).padStart(10,"0")} 00000 n \n` +
    `trailer\n<</Size 6/Root 1 0 R>>\nstartxref\n${xrefPos}\n%%EOF\n`
  );

  return Buffer.concat([header, obj1, obj2, obj3, obj4, obj5, xref]);
}

function esc(s) {
  return s.replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");
}

const OUT = "c:/Users/RANU/Desktop/indiamart/frontend/public/test-docs";
mkdirSync(OUT, { recursive: true });

// 1. ITR Document
writeFileSync(join(OUT, "ITR_Document_AY2023-24.pdf"), makePDF(
  "INCOME TAX RETURN - AY 2023-24",
  [
    "Taxpayer: CORTECH SYSTEMS PRIVATE LIMITED",
    "PAN Number: AAPFU0939F",
    "Assessment Year: 2023-2024",
    "Form Type: ITR-6",
    " ",
    "INCOME DETAILS",
    "Gross Total Income: Rs. 45,00,000",
    "Taxable Income: Rs. 38,50,000",
    "Tax Paid: Rs. 8,00,000",
    "Status: FILED SUCCESSFULLY",
    " ",
    "Acknowledgement No: 123456789012345",
    "Date of Filing: 31-07-2023",
    " ",
    "Income Tax Department | Government of India",
    "*** TEST DOCUMENT FOR INDIAMART B2B PLATFORM ***",
  ]
));
console.log("✅ ITR_Document_AY2023-24.pdf");

// 2. CA Certificate
writeFileSync(join(OUT, "CA_Certificate_Turnover.pdf"), makePDF(
  "CHARTERED ACCOUNTANT CERTIFICATE",
  [
    "To Whomsoever It May Concern",
    " ",
    "This certifies that: CORTECH SYSTEMS PRIVATE LIMITED",
    "GSTIN: 27AAPFU0939F1ZV",
    "Address: B-12, Industrial Area, Mumbai - 400001",
    " ",
    "ANNUAL TURNOVER CERTIFICATE",
    "FY 2022-23:  Rs. 45,00,000  (Forty Five Lakhs)",
    "FY 2021-22:  Rs. 38,00,000  (Thirty Eight Lakhs)",
    "FY 2020-21:  Rs. 28,00,000  (Twenty Eight Lakhs)",
    " ",
    "Certified as per audited financial records.",
    " ",
    "CA: Rajesh Kumar Sharma",
    "Membership No: 123456 | Firm: Sharma & Associates",
    "Date: 15-04-2024 | UDIN: 24123456ABCDEF1234",
    " ",
    "*** TEST DOCUMENT FOR INDIAMART B2B PLATFORM ***",
  ]
));
console.log("✅ CA_Certificate_Turnover.pdf");

// 3. Bank Statement
writeFileSync(join(OUT, "Bank_Statement_Q1_2024.pdf"), makePDF(
  "STATE BANK OF INDIA - ACCOUNT STATEMENT",
  [
    "Account Holder: CORTECH SYSTEMS PVT LTD",
    "Account No: XXXX XXXX XXXX 5678",
    "IFSC: SBIN0001234 | Branch: Mumbai Main",
    "Period: 01-Jan-2024 to 31-Mar-2024",
    " ",
    "ACCOUNT SUMMARY",
    "Opening Balance:   Rs.  2,45,000",
    "Total Credits (+): Rs. 18,50,000",
    "Total Debits (-):  Rs. 15,20,000",
    "Closing Balance:   Rs.  5,75,000",
    " ",
    "TRANSACTIONS",
    "20-Jan  Customer Payment     +Rs. 3,50,000",
    "18-Feb  Customer Payment     +Rs. 4,20,000",
    "10-Mar  Customer Payment     +Rs. 5,50,000",
    "05-Feb  Supplier Payment     -Rs. 2,80,000",
    "15-Jan  GST Payment          -Rs. 1,20,000",
    " ",
    "SBI Verified Digital Statement",
    "*** TEST DOCUMENT FOR INDIAMART B2B PLATFORM ***",
  ]
));
console.log("✅ Bank_Statement_Q1_2024.pdf");

console.log(`\n📁 Saved to: ${OUT}`);
console.log("Download from: http://localhost:3000/test-docs/ITR_Document_AY2023-24.pdf");
