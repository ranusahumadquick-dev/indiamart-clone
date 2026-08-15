"use client";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By accessing or using IndiaMart ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Platform. We may update these terms from time to time, and continued use of the Platform after changes constitutes acceptance of the revised terms.`,
  },
  {
    title: "2. Who Can Use the Platform",
    body: `IndiaMart is available to businesses and individuals who are at least 18 years old and capable of entering into legally binding contracts. Sellers must provide accurate business information, including GST details where applicable, and are responsible for the accuracy of their listings.`,
  },
  {
    title: "3. Buyer & Seller Accounts",
    body: `Users register as either a Buyer or a Seller. Sellers are responsible for the products/services they list, pricing accuracy, order fulfillment, and responding to buyer inquiries in good faith. Buyers are responsible for providing accurate contact and shipping information and for honoring commitments made during inquiries and orders.`,
  },
  {
    title: "4. Product Listings & Verification",
    body: `Sellers agree not to list prohibited, counterfeit, or illegal goods. IndiaMart reserves the right to review, approve, reject, or remove any listing at its discretion. A "TrustSEAL" or "Verified Seller" badge indicates the seller has completed our verification process; it is not a guarantee of product quality or seller conduct.`,
  },
  {
    title: "5. Payments & Transactions",
    body: `Where payments are processed through the Platform, they are handled via our third-party payment gateway partners. IndiaMart is not a party to the underlying sale of goods between buyer and seller unless explicitly stated. Subscription fees for seller plans are non-refundable except as required by law.`,
  },
  {
    title: "6. Prohibited Conduct",
    body: `Users may not: misrepresent their identity or business, post fraudulent listings or reviews, harass other users, attempt to circumvent platform fees, scrape or misuse platform data, or use the Platform for any unlawful purpose. Violations may result in account suspension or termination.`,
  },
  {
    title: "7. Intellectual Property",
    body: `All content on the Platform — including the IndiaMart name, logo, design, and software — is owned by IndiaMart or its licensors. Sellers retain ownership of their product content but grant IndiaMart a license to display it on the Platform for the purpose of operating the marketplace.`,
  },
  {
    title: "8. Limitation of Liability",
    body: `IndiaMart facilitates connections between buyers and sellers but is not responsible for the quality, safety, legality, or delivery of products listed by third-party sellers. To the maximum extent permitted by law, IndiaMart is not liable for indirect, incidental, or consequential damages arising from use of the Platform.`,
  },
  {
    title: "9. Account Suspension & Termination",
    body: `We may suspend or terminate accounts that violate these terms, engage in fraudulent activity, or remain inactive/incomplete for extended periods. Users may also request account deletion at any time through account settings.`,
  },
  {
    title: "10. Governing Law",
    body: `These Terms are governed by the laws of India. Any disputes arising from use of the Platform shall be subject to the exclusive jurisdiction of the courts in India.`,
  },
  {
    title: "11. Contact Us",
    body: `For questions about these Terms of Service, reach out via our Help Center or the support contact details listed there.`,
  },
];

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Terms of Service</h1>
          <p className="text-blue-100 text-sm">Last updated: July 2026</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-md p-6 md:p-10 space-y-8">
          <p className="text-gray-600 leading-relaxed">
            Welcome to IndiaMart. These Terms of Service ("Terms") govern your access to and use of our B2B
            marketplace platform. Please read them carefully before using the Platform.
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
