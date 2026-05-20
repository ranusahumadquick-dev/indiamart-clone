/**
 * Email Configuration
 * Configuration for email sending using Nodemailer
 */

module.exports = {
  // Email provider settings (currently using Gmail for development)
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  },
  
  // Default sender information
  defaultFrom: process.env.EMAIL_FROM || 'noreply@bazaarconnect.com',
  
  // Email templates (for future use)
  templates: {
    welcome: {
      subject: 'Welcome to BazaarConnect!',
      template: 'welcome-email'
    },
    passwordReset: {
      subject: 'Password Reset Request',
      template: 'password-reset'
    },
    orderConfirmation: {
      subject: 'Order Confirmation',
      template: 'order-confirmation'
    },
    paymentReceipt: {
      subject: 'Payment Receipt',
      template: 'payment-receipt'
    },
    verification: {
      subject: 'Verify Your Email Address',
      template: 'email-verification'
    }
  },
  
  // Email service configuration
  service: process.env.EMAIL_SERVICE || 'gmail',
  
  // Custom headers
  headers: {
    'X-Priority': '1',
    'X-Mailer': 'BazaarConnect-Mailer'
  }
};