"use client";

const SECTIONS = [
  {
    title: "1. Information We Collect",
    body: `We collect information you provide directly — such as your name, email, phone number, company details, and GST number during registration — as well as information generated through your use of the Platform, like product inquiries, order history, chat messages, and browsing activity.`,
  },
  {
    title: "2. How We Use Your Information",
    body: `We use your information to operate the marketplace: creating and managing your account, connecting buyers with sellers, processing inquiries and orders, sending OTPs for verification, providing customer support, and improving the Platform. We may also use it to send relevant notifications about your account, orders, or messages.`,
  },
  {
    title: "3. Information Sharing",
    body: `When you send an inquiry or message to a seller (or buyer), your contact details relevant to that conversation are shared with the other party so they can respond. We do not sell your personal data to third parties. We may share data with service providers who help us operate the Platform (e.g. payment processors, SMS/email providers) strictly for that purpose.`,
  },
  {
    title: "4. Seller Verification Data",
    body: `Sellers who submit documents for verification (GST certificates, ITR certificates, business proofs) have that data reviewed by our admin team solely to confirm business legitimacy. Verification documents are stored securely and are not shared publicly.`,
  },
  {
    title: "5. Cookies & Local Storage",
    body: `We use browser local storage and session storage to keep you logged in, remember your guest-verification status, and improve your browsing experience. We do not use third-party advertising trackers.`,
  },
  {
    title: "6. Data Security",
    body: `We use industry-standard measures to protect your data, including password hashing, encrypted connections, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "7. Data Retention",
    body: `We retain your account information for as long as your account is active. If your account is deleted, certain records (like past orders or reviews) may be retained in an anonymized or restricted form for legal and record-keeping purposes.`,
  },
  {
    title: "8. Your Rights",
    body: `You can access and update most of your personal information directly from your account settings at any time. You may request account deletion, and you can control whether your WhatsApp number and other contact details are visible on your public seller profile.`,
  },
  {
    title: "9. Children's Privacy",
    body: `The Platform is intended for business use by users 18 years or older. We do not knowingly collect information from minors.`,
  },
  {
    title: "10. Changes to This Policy",
    body: `We may update this Privacy Policy from time to time to reflect changes in our practices. We will update the "Last updated" date at the top of this page when changes are made.`,
  },
  {
    title: "11. Contact Us",
    body: `If you have questions about this Privacy Policy or how your data is handled, please reach out via our Help Center.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-blue-100 text-sm">Last updated: July 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-10 space-y-8">
          <p className="text-gray-600 leading-relaxed">
            This Privacy Policy explains how IndiaMart collects, uses, and protects your information when you use
            our B2B marketplace platform as a buyer or seller.
          </p>

          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h2>
              <p className="text-gray-600 leading-relaxed text-sm">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
