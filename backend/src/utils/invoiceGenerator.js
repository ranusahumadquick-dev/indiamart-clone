/**
 * Invoice Generator Utility
 * Generates HTML invoices for subscription payments
 */

const generateSellerInvoice = (payment, seller, subscription, plan) => {
  const invoiceDate = payment.completedAt || new Date();
  const formattedDate = invoiceDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  // Calculate GST if seller has GST number
  const gstRate = 18; // 18% IGST for simplicity
  const baseAmount = payment.amount;
  const gstAmount = seller.gstNumber ? (baseAmount * gstRate) / 100 : 0;
  const totalAmount = baseAmount + gstAmount;

  const renewalDate = subscription ? new Date(subscription.renewalDate || subscription.endDate)
    .toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'N/A';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            line-height: 1.6;
          }

          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            background: white;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
          }

          .company-info {
            flex: 1;
          }

          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #1a56db;
            margin-bottom: 5px;
          }

          .company-details {
            font-size: 12px;
            color: #666;
            margin-top: 10px;
          }

          .invoice-details {
            text-align: right;
            flex: 1;
          }

          .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #1a56db;
            margin-bottom: 10px;
          }

          .invoice-meta {
            font-size: 12px;
            color: #666;
            margin: 3px 0;
          }

          .invoice-number {
            font-weight: bold;
            color: #333;
            margin-top: 5px;
          }

          .billing-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
          }

          .billing-box h3 {
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
            font-weight: 600;
          }

          .billing-box p {
            font-size: 14px;
            margin: 4px 0;
            color: #333;
          }

          .billing-box strong {
            display: block;
            font-size: 16px;
            margin-top: 8px;
            color: #1a56db;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }

          thead {
            background: #f8f9fa;
            border-top: 2px solid #e0e0e0;
            border-bottom: 2px solid #e0e0e0;
          }

          th {
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            color: #666;
            letter-spacing: 0.5px;
          }

          td {
            padding: 15px 12px;
            font-size: 14px;
            border-bottom: 1px solid #f0f0f0;
          }

          tbody tr:last-child td {
            border-bottom: 2px solid #e0e0e0;
          }

          .amount-right {
            text-align: right;
          }

          .summary {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 40px;
          }

          .summary-box {
            width: 350px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 14px;
            border-bottom: 1px solid #f0f0f0;
          }

          .summary-row.total {
            border-bottom: 2px solid #333;
            font-weight: bold;
            font-size: 16px;
            padding: 15px 0;
            margin-top: 10px;
          }

          .summary-row.total .amount {
            color: #1a56db;
          }

          .notes {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 4px;
            margin-bottom: 30px;
            font-size: 12px;
            color: #666;
          }

          .notes h4 {
            margin-bottom: 10px;
            color: #333;
          }

          .footer {
            border-top: 2px solid #f0f0f0;
            padding-top: 20px;
            text-align: center;
            color: #999;
            font-size: 11px;
          }

          .payment-method {
            background: #e8f5e9;
            padding: 12px;
            border-left: 4px solid #4caf50;
            margin-bottom: 20px;
            font-size: 13px;
          }

          .badge {
            display: inline-block;
            padding: 4px 8px;
            background: #dbeafe;
            color: #1e40af;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="company-info">
              <div class="company-name">IndiaMart</div>
              <div class="company-details">
                <p>Email: support@indiamart.com</p>
                <p>Website: www.indiamart.com</p>
                <p>GST: 18AABCU0001R1Z0</p>
              </div>
            </div>
            <div class="invoice-details">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-meta">Invoice Date: ${formattedDate}</div>
              <div class="invoice-meta">Order ID: ${payment.razorpayOrderId}</div>
              <div class="invoice-number">${payment.invoiceNumber || 'INV-PENDING'}</div>
            </div>
          </div>

          <!-- Billing Information -->
          <div class="billing-section">
            <div class="billing-box">
              <h3>Bill To</h3>
              <strong>${seller.companyName || seller.name}</strong>
              <p>${seller.email}</p>
              <p>${seller.gstNumber ? 'GST: ' + seller.gstNumber : ''}</p>
            </div>
            <div class="billing-box">
              <h3>Subscription Details</h3>
              <p><strong>Plan:</strong> ${plan.name}</p>
              <p><strong>Renewal Date:</strong> ${renewalDate}</p>
              <p><strong>Duration:</strong> ${plan.duration} days</p>
            </div>
          </div>

          <!-- Items Table -->
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Quantity</th>
                <th class="amount-right">Unit Price</th>
                <th class="amount-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${plan.name} - Subscription for ${plan.duration} days</td>
                <td style="text-align: center;">1</td>
                <td class="amount-right">₹${payment.amount.toLocaleString('en-IN')}</td>
                <td class="amount-right">₹${payment.amount.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <!-- Summary -->
          <div class="summary">
            <div class="summary-box">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span class="amount">₹${baseAmount.toLocaleString('en-IN')}</span>
              </div>
              ${gstAmount > 0 ? `
              <div class="summary-row">
                <span>IGST (18%):</span>
                <span class="amount">₹${gstAmount.toFixed(2)}</span>
              </div>
              ` : ''}
              <div class="summary-row total">
                <span>Total Amount:</span>
                <span class="amount">₹${totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="payment-method">
            <strong>Payment Method:</strong> Razorpay (Online Payment Gateway)
            <br/>
            <strong>Payment ID:</strong> ${payment.razorpayPaymentId || 'Processing'}
          </div>

          <!-- Notes -->
          <div class="notes">
            <h4>Important Information</h4>
            <ul style="margin-left: 20px; margin-top: 10px;">
              <li>This invoice is a digital receipt for your subscription payment.</li>
              <li>Your plan features will be active immediately after successful payment.</li>
              <li>The subscription will auto-renew unless you cancel it before the renewal date.</li>
              <li>For queries, contact support@indiamart.com</li>
            </ul>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Thank you for subscribing to IndiaMart! This is an electronically generated invoice.</p>
            <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export { generateSellerInvoice };
