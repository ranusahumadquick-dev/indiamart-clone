/**
 * Email Utility
 * Handles email sending using Nodemailer for various notifications
 */

const nodemailer = require('nodemailer');
const config = require('../config/email');

/**
 * Create transporter instance
 */
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: config.host,
    port: config.port,
    secure: config.secure, // true for 465, false for other ports
    auth: {
      user: config.auth.user,
      pass: config.auth.pass
    },
    tls: {
      rejectUnauthorized: false // For development
    }
  });
};

/**
 * Send email function
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 * @param {Array} options.attachments - File attachments (optional)
 * @param {string} options.from - Sender email (optional)
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const emailOptions = {
      from: options.from || config.defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || null,
      attachments: options.attachments || []
    };
    
    const info = await transporter.sendMail(emailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    return info;
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send welcome email
 * @param {Object} user - User object
 */
const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to BazaarConnect!';
  const text = `Hello ${user.name},\n\n\nWelcome to BazaarConnect, your trusted B2B marketplace platform!\n\n\nWe're excited to have you on board. Here's what you can do next:\n\n1. Complete your profile to get discovered\n2. List your products/services\n3. Connect with potential buyers\n4. Grow your business\n\n\nIf you need any help, feel free to reach out to our support team.\n\n\nBest regards,\nThe BazaarConnect Team`;
  
  const html = `
    <h2>Welcome to BazaarConnect, ${user.name}!</h2>
    <p>We're excited to have you on board!</p>
    <br>
    <h3>What's next?</h3>
    <ul>
      <li>Complete your profile to get discovered</li>
      <li>List your products/services</li>
      <li>Connect with potential buyers</li>
      <li>Grow your business</li>
    </ul>
    <br>
    <p>If you need any help, feel free to reach out to our support team.</p>
    <br>
    <p>Best regards,<br>The BazaarConnect Team</p>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send password reset email
 * @param {Object} user - User object
 * @param {string} resetToken - Password reset token
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const subject = 'Password Reset Request';
  
  const text = `Hello ${user.name},\n\n\nYou requested a password reset. Please click the following link to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour. If you didn't request this, please ignore this email.\n\n\nBest regards,\nThe BazaarConnect Team`;
  
  const html = `
    <h2>Password Reset Request</h2>
    <p>Hello ${user.name},</p>
    <p>You requested a password reset. Please click the button below to reset your password:</p>
    <br>
    <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Reset Password</a>
    <br><br>
    <p>This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
    <br>
    <p>Best regards,<br>The BazaarConnect Team</p>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send order confirmation email
 * @param {Object} user - User object
 * @param {Object} order - Order object
 */
const sendOrderConfirmationEmail = async (user, order) => {
  const subject = 'Order Confirmation - Order #' + order.orderNumber;
  
  const text = `Hello ${user.name},\n\n\nThank you for your order! Here are the details:\n\n\nOrder Number: ${order.orderNumber}\n\nItems:\n${order.items.map(item => `- ${item.name} (Quantity: ${item.quantity})`).join('\n')}\n\n\nTotal Amount: $${order.totalAmount}\n\nPayment Method: ${order.paymentMethod}\n\nOrder Date: ${new Date(order.createdAt).toLocaleDateString()}\n\n\nWe'll notify you once your order is shipped.\n\n\nBest regards,\nThe BazaarConnect Team`;
  
  const html = `
    <h2>Order Confirmation</h2>
    <p>Hello ${user.name},</p>
    <p>Thank you for your order!</p>
    <br>
    <h3>Order Details</h3>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <br>
    <h4>Items:</h4>
    <ul>
      ${order.items.map(item => `<li>${item.name} (Quantity: ${item.quantity})</li>`).join('')}
    </ul>
    <br>
    <p><strong>Total Amount:</strong> $${order.totalAmount}</p>
    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
    <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
    <br>
    <p>We'll notify you once your order is shipped.</p>
    <br>
    <p>Best regards,<br>The BazaarConnect Team</p>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send payment receipt email
 * @param {Object} user - User object
 * @param {Object} payment - Payment object
 */
const sendPaymentReceiptEmail = async (user, payment) => {
  const subject = 'Payment Receipt - Transaction #' + payment.transactionId;
  
  const text = `Hello ${user.name},\n\n\nYour payment has been processed successfully. Here are the details:\n\n\nTransaction ID: ${payment.transactionId}\n\nAmount: $${payment.amount}\n\nPayment Method: ${payment.method}\n\nDate: ${new Date(payment.createdAt).toLocaleDateString()}\n\n\nThank you for your business!\n\n\nBest regards,\nThe BazaarConnect Team`;
  
  const html = `
    <h2>Payment Receipt</h2>
    <p>Hello ${user.name},</p>
    <p>Your payment has been processed successfully.</p>
    <br>
    <h3>Payment Details</h3>
    <p><strong>Transaction ID:</strong> ${payment.transactionId}</p>
    <p><strong>Amount:</strong> $${payment.amount}</p>
    <p><strong>Payment Method:</strong> ${payment.method}</p>
    <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
    <br>
    <p>Thank you for your business!</p>
    <br>
    <p>Best regards,<br>The BazaarConnect Team</p>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send verification email
 * @param {Object} user - User object
 */
const sendVerificationEmail = async (user) => {
  const verificationToken = user.emailVerificationToken;
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  const subject = 'Verify Your Email Address';
  
  const text = `Hello ${user.name},\n\n\nPlease verify your email address by clicking the following link:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\n\nBest regards,\nThe BazaarConnect Team`;
  
  const html = `
    <h2>Verify Your Email Address</h2>
    <p>Hello ${user.name},</p>
    <p>Please verify your email address to complete your registration.</p>
    <br>
    <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Verify Email</a>
    <br><br>
    <p>This link will expire in 24 hours.</p>
    <br>
    <p>Best regards,<br>The BazaarConnect Team</p>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

/**
 * Send new inquiry notification to seller
 * @param {Object} seller - Seller object
 * @param {Object} buyer - Buyer object
 * @param {Object} inquiry - Inquiry object
 */
const sendNewInquiryNotification = async (seller, buyer, inquiry) => {
  const subject = 'New Inquiry from ' + buyer.name;
  
  const text = `Hello ${seller.name},\n\n\nYou have a new inquiry from ${buyer.name}:\n\n\nSubject: ${inquiry.subject}\n\nMessage: ${inquiry.message}\n\nProduct: ${inquiry.product ? inquiry.product.name : 'N/A'}\n\n\nPlease log in to your dashboard to respond.\n\n\nBest regards,\nThe BazaarConnect Team`;
  
  const html = `
    <h2>New Inquiry Notification</h2>
    <p>Hello ${seller.name},</p>
    <p>You have a new inquiry from ${buyer.name}.</p>
    <br>
    <h3>Inquiry Details</h3>
    <p><strong>Subject:</strong> ${inquiry.subject}</p>
    <p><strong>Message:</strong> ${inquiry.message}</p>
    <p><strong>Product:</strong> ${inquiry.product ? inquiry.product.name : 'N/A'}</p>
    <br>
    <p>Please log in to your dashboard to respond.</p>
    <br>
    <p>Best regards,<br>The BazaarConnect Team</p>
  `;
  
  await sendEmail({
    to: seller.email,
    subject,
    text,
    html
  });
};

/**
 * Send account suspension notification
 * @param {Object} user - User object
 * @param {string} reason - Suspension reason
 */
const sendAccountSuspensionEmail = async (user, reason) => {
  const subject = 'Account Suspension Notice';
  
  const text = `Hello ${user.name},\n\n\nYour account has been suspended. Reason: ${reason}\n\n\nPlease contact support for more information.\n\n\nBest regards,\nThe BazaarConnect Team`;
  
  const html = `
    <h2>Account Suspension Notice</h2>
    <p>Hello ${user.name},</p>
    <p>Your account has been suspended.</p>
    <br>
    <p><strong>Reason:</strong> ${reason}</p>
    <br>
    <p>Please contact support for more information.</p>
    <br>
    <p>Best regards,<br>The BazaarConnect Team</p>
  `;
  
  await sendEmail({
    to: user.email,
    subject,
    text,
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendPaymentReceiptEmail,
  sendVerificationEmail,
  sendNewInquiryNotification,
  sendAccountSuspensionEmail
};