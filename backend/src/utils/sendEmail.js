import nodemailer from "nodemailer";

// Simple sendEmail helper using SMTP credentials from .env
// Environment variables required: EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, FROM_EMAIL

export async function sendEmail({ to, subject, html, text }) {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.FROM_EMAIL || user;

  if (!host || !port || !user || !pass) {
    // If email not configured, skip sending but log
    console.warn("Email not configured. Skipping sendEmail. Args:", { to, subject });
    return null;
  }

  const transporter = nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text: text || "",
    html: html || text || "",
  });

  return info;
}
