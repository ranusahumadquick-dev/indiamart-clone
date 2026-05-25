/**
 * Invoice Email Template
 * HTML email template for invoice delivery
 */

const invoiceEmailTemplate = (seller, payment, plan, subscription, invoiceUrl) => {
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
            background: #f5f5f5;
          }

          .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }

          .header {
            background: linear-gradient(135deg, #1a56db 0%, #0d47a1 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }

          .header h1 {
            font-size: 28px;
            margin-bottom: 5px;
          }

          .header p {
            opacity: 0.9;
            font-size: 14px;
          }

          .content {
            padding: 30px;
          }

          .greeting {
            margin-bottom: 20px;
            font-size: 16px;
          }

          .greeting strong {
            color: #1a56db;
          }

          .invoice-box {
            background: #f8f9fa;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }

          .invoice-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
            font-size: 14px;
          }

          .invoice-row:last-child {
            border-bottom: none;
          }

          .invoice-row.highlight {
            background: white;
            font-weight: bold;
            color: #1a56db;
            font-size: 16px;
            padding: 15px;
            margin: 0 -20px;
            padding-left: 20px;
            padding-right: 20px;
          }

          .invoice-label {
            color: #666;
          }

          .invoice-value {
            font-weight: 600;
            color: #333;
          }

          .plan-details {
            background: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
          }

          .plan-details h3 {
            color: #2e7d32;
            margin-bottom: 10px;
            font-size: 14px;
          }

          .plan-details ul {
            margin-left: 20px;
            margin-top: 8px;
          }

          .plan-details li {
            margin: 5px 0;
            font-size: 13px;
            color: #333;
          }

          .button-container {
            text-align: center;
            margin: 30px 0;
          }

          .download-btn {
            display: inline-block;
            padding: 12px 30px;
            background: #1a56db;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 600;
            font-size: 14px;
          }

          .download-btn:hover {
            background: #0d47a1;
          }

          .info-box {
            background: #fff3e0;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            color: #e65100;
          }

          .info-box strong {
            color: #e65100;
          }

          .features-list {
            list-style: none;
            margin: 15px 0;
          }

          .features-list li {
            padding: 8px 0;
            font-size: 14px;
            color: #333;
          }

          .features-list li:before {
            content: "✓ ";
            color: #4caf50;
            font-weight: bold;
            margin-right: 8px;
          }

          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #999;
            border-top: 1px solid #e0e0e0;
          }

          .footer p {
            margin: 5px 0;
          }

          .footer a {
            color: #1a56db;
            text-decoration: none;
          }

          .footer a:hover {
            text-decoration: underline;
          }

          .divider {
            height: 1px;
            background: #e0e0e0;
            margin: 20px 0;
          }

          .highlight-text {
            color: #1a56db;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>Payment Successful!</h1>
            <p>Your IndiaMart subscription invoice is ready</p>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Greeting -->
            <div class="greeting">
              Hello <strong>${seller.name || 'Seller'}</strong>,
            </div>

            <p>Thank you for subscribing to the <span class="highlight-text">${plan.name}</span> plan on IndiaMart. Your payment has been processed successfully, and your subscription is now active.</p>

            <!-- Invoice Details Box -->
            <div class="invoice-box">
              <div class="invoice-row">
                <span class="invoice-label">Invoice Number:</span>
                <span class="invoice-value">${payment.invoiceNumber}</span>
              </div>
              <div class="invoice-row">
                <span class="invoice-label">Plan:</span>
                <span class="invoice-value">${plan.name}</span>
              </div>
              <div class="invoice-row">
                <span class="invoice-label">Amount Paid:</span>
                <span class="invoice-value">₹${payment.amount.toLocaleString('en-IN')}</span>
              </div>
              <div class="invoice-row">
                <span class="invoice-label">Payment Date:</span>
                <span class="invoice-value">${new Date(payment.completedAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}</span>
              </div>
              <div class="invoice-row">
                <span class="invoice-label">Renewal Date:</span>
                <span class="invoice-value">${renewalDate}</span>
              </div>
              <div class="invoice-row highlight">
                <span>Status:</span>
                <span style="color: #4caf50;">✓ PAID</span>
              </div>
            </div>

            <!-- Plan Features -->
            <div class="plan-details">
              <h3>Your ${plan.name} Plan Includes:</h3>
              <ul style="list-style: none; margin-left: 0;">
                ${plan.features.slice(0, 5).map(feature => `<li style="margin-left: 20px; position: relative; padding-left: 15px;">
                  <span style="position: absolute; left: 0; color: #4caf50;">✓</span>
                  ${feature}
                </li>`).join('')}
              </ul>
            </div>

            <!-- Download Invoice Button -->
            <div class="button-container">
              <a href="${invoiceUrl}" class="download-btn">📥 Download Invoice</a>
            </div>

            <!-- Important Info -->
            <div class="info-box">
              <strong>📌 Important:</strong>
              <ul style="list-style: none; margin-top: 8px; margin-left: 0;">
                <li>✓ Your plan features are active immediately</li>
                <li>✓ Auto-renewal is enabled (you'll receive a reminder before renewal)</li>
                <li>✓ You can cancel anytime without penalties</li>
              </ul>
            </div>

            <div class="divider"></div>

            <!-- Next Steps -->
            <p style="margin: 20px 0; font-size: 14px;">
              <strong>Next Steps:</strong>
            </p>
            <ol style="margin-left: 20px; font-size: 14px;">
              <li>Log in to your seller dashboard</li>
              <li>Start adding products (your new limit applies immediately)</li>
              <li>Manage your subscription anytime from Billing section</li>
            </ol>

            <div class="divider"></div>

            <!-- Contact Support -->
            <p style="margin: 20px 0; font-size: 14px;">
              Need help? Contact our support team at <strong>support@indiamart.com</strong> or reply to this email.
            </p>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>© 2025 IndiaMart. All rights reserved.</p>
            <p>
              <a href="https://indiamart.com">Website</a> •
              <a href="https://indiamart.com/help">Help Center</a> •
              <a href="https://indiamart.com/contact">Contact Us</a>
            </p>
            <p style="margin-top: 15px; opacity: 0.7;">
              This is an automated email. Please do not reply to this address.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

export { invoiceEmailTemplate };
