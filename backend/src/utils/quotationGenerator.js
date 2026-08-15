import PDFDocument from 'pdfkit';

const INDENT = 50;

export async function generateQuotationPDF(quotationData) {
  const {
    inquiryId,
    sellerName,
    sellerEmail,
    sellerPhone,
    sellerCompany,
    buyerName,
    buyerCompany,
    productName,
    quantity,
    unitPrice,
    deliveryDate,
    paymentTerms,
    notes,
    validUntil,
  } = quotationData;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('QUOTATION', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(11).font('Helvetica').text(`Quote ID: QT-${inquiryId.toString().slice(-8)}`, { align: 'center' });
      doc.moveDown(1);

      // Seller details
      doc.fontSize(12).font('Helvetica-Bold').text(sellerCompany || sellerName);
      doc.fontSize(10).font('Helvetica').text(sellerEmail);
      doc.text(sellerPhone);
      doc.moveDown(0.5);

      // Date info
      doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleDateString()}`);
      if (validUntil) {
        doc.text(`Valid Until: ${new Date(validUntil).toLocaleDateString()}`);
      }
      doc.moveDown(0.8);

      // Bill to
      doc.fontSize(11).font('Helvetica-Bold').text('Bill To:');
      doc.fontSize(10).font('Helvetica').text(buyerName);
      if (buyerCompany) doc.text(buyerCompany);
      doc.moveDown(0.8);

      // Quotation table
      doc.fontSize(11).font('Helvetica-Bold');
      const tableTop = doc.y;
      const col1 = INDENT;
      const col2 = INDENT + 200;
      const col3 = INDENT + 300;
      const col4 = INDENT + 400;

      // Header row
      doc.text('Product', col1, tableTop, { width: 180, align: 'left' });
      doc.text('Qty', col2, tableTop, { width: 80, align: 'right' });
      doc.text('Unit Price', col3, tableTop, { width: 80, align: 'right' });
      doc.text('Total', col4, tableTop, { width: 80, align: 'right' });

      // Draw line
      doc.moveTo(INDENT, doc.y + 5).lineTo(530, doc.y + 5).stroke();
      doc.moveDown(0.8);

      // Data row
      const total = quantity * unitPrice;
      doc.fontSize(10).font('Helvetica');
      doc.text(productName, col1, doc.y, { width: 180, align: 'left' });
      doc.text(quantity.toString(), col2, doc.y - 14, { width: 80, align: 'right' });
      doc.text(`₹${unitPrice.toFixed(2)}`, col3, doc.y + 14 - 14, { width: 80, align: 'right' });
      doc.text(`₹${total.toFixed(2)}`, col4, doc.y + 28 - 14, { width: 80, align: 'right' });

      doc.moveDown(1.5);

      // Draw line
      doc.moveTo(INDENT, doc.y).lineTo(530, doc.y).stroke();
      doc.moveDown(0.3);

      // Total
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total Amount:', col3, doc.y, { width: 80, align: 'right' });
      doc.text(`₹${total.toFixed(2)}`, col4, doc.y - 14, { width: 80, align: 'right' });
      doc.moveDown(1.2);

      // Terms section
      doc.fontSize(11).font('Helvetica-Bold').text('Terms & Conditions:');
      doc.fontSize(10).font('Helvetica');
      if (paymentTerms) {
        doc.text(`Payment Terms: ${paymentTerms}`);
      }
      if (deliveryDate) {
        doc.text(`Estimated Delivery: ${new Date(deliveryDate).toLocaleDateString()}`);
      }
      if (notes) {
        doc.moveDown(0.3);
        doc.text(`Additional Notes:\n${notes}`, { align: 'left' });
      }

      doc.moveDown(1);

      // Footer
      doc.fontSize(9).font('Helvetica').fillColor('#666');
      doc.text('This is a generated quotation. Please contact the seller for any clarifications.', { align: 'center' });
      doc.text('IndiaMart B2B Marketplace', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
