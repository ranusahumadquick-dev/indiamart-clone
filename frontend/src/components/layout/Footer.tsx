import Link from "next/link";
import {
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineArrowRight,
} from "react-icons/hi2";

const Footer = () => {
  const year = new Date().getFullYear();

  const LINKS = {
    company: [
      { label: "About Us", href: "/help" },
      { label: "Careers", href: "/help" },
      { label: "Press & Media", href: "/help" },
      { label: "Investor Relations", href: "/help" },
      { label: "Blog & Insights", href: "/help" },
    ],
    buyers: [
      { label: "Browse Products", href: "/products" },
      { label: "Post Requirement", href: "/post-requirement" },
      { label: "Browse Categories", href: "/categories" },
      { label: "Find Suppliers", href: "/sellers" },
      { label: "Browse Services", href: "/services" },
      { label: "Compare Products", href: "/compare" },
    ],
    sellers: [
      { label: "Sell on IndiaMart", href: "/sell" },
      { label: "Seller Dashboard", href: "/seller/dashboard" },
      { label: "List Products", href: "/seller/products/new" },
      { label: "Seller Plans", href: "/seller/plans" },
      { label: "Seller Analytics", href: "/seller/analytics" },
    ],
    support: [
      { label: "Help Center", href: "/help" },
      { label: "Contact Support", href: "/help" },
      { label: "Privacy Policy", href: "/help" },
      { label: "Terms of Service", href: "/help" },
      { label: "Refund Policy", href: "/help" },
      { label: "Cookie Policy", href: "/help" },
    ],
  };

  return (
    <footer className="bg-[#0a0f1e] text-gray-400">

      {/* Trust Bar */}
      <div className="bg-[#0d1428] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { icon: "🏆", title: "25+ Years", sub: "Of trust & reliability" },
              { icon: "✅", title: "2M+ Verified", sub: "Suppliers on platform" },
              { icon: "🔒", title: "100% Secure", sub: "Buyer protection" },
              { icon: "⚡", title: "24/7 Support", sub: "Always here to help" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white text-sm font-bold leading-none">{item.title}</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10">

          {/* Brand Column */}
          <div className="lg:col-span-2">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-black text-lg px-2.5 py-1.5 rounded-xl shadow-lg">IM</div>
              <div>
                <span className="text-white font-black text-xl leading-none block">IndiaMart</span>
                <span className="text-[10px] text-gray-500 leading-none">B2B Marketplace</span>
              </div>
            </Link>

            <p className="text-sm text-gray-500 leading-relaxed mb-5 max-w-xs">
              India's largest B2B marketplace connecting 10M+ buyers with 2M+ verified suppliers & manufacturers since 1999.
            </p>

            {/* Contact */}
            <div className="space-y-2.5 text-sm mb-6">
              <div className="flex items-center gap-2.5 text-gray-500 hover:text-gray-300 transition">
                <HiOutlineMapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Noida, Uttar Pradesh, India - 201301</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-500 hover:text-gray-300 transition">
                <HiOutlinePhone className="w-4 h-4 text-blue-500 shrink-0" />
                <span>+91 9876543210</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-500 hover:text-gray-300 transition">
                <HiOutlineEnvelope className="w-4 h-4 text-blue-500 shrink-0" />
                <span>support@indiamart.in</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3">
              {[
                { label: "Facebook", icon: "f", color: "hover:bg-blue-600" },
                { label: "Twitter", icon: "𝕏", color: "hover:bg-gray-700" },
                { label: "LinkedIn", icon: "in", color: "hover:bg-blue-700" },
                { label: "YouTube", icon: "▶", color: "hover:bg-red-600" },
                { label: "Instagram", icon: "◉", color: "hover:bg-pink-600" },
              ].map((s, i) => (
                <button
                  key={i}
                  aria-label={s.label}
                  className={`w-9 h-9 bg-white/5 ${s.color} border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all text-xs font-bold hover:border-white/20`}
                >
                  {s.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Company</h4>
            <ul className="space-y-2.5">
              {LINKS.company.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 group">
                    <HiOutlineArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all text-blue-400" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Buyers */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">For Buyers</h4>
            <ul className="space-y-2.5">
              {LINKS.buyers.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 group">
                    <HiOutlineArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all text-blue-400" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">For Sellers</h4>
            <ul className="space-y-2.5">
              {LINKS.sellers.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 group">
                    <HiOutlineArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all text-blue-400" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4 tracking-wide">Support</h4>
            <ul className="space-y-2.5">
              {LINKS.support.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 group">
                    <HiOutlineArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all text-blue-400" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Popular Categories Bar */}
      <div className="border-t border-white/5 bg-[#080c1a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider shrink-0">Popular:</span>
            {[
              "Electronics", "Machinery", "Textiles", "Chemicals", "Food Products",
              "Steel & Metal", "Packaging", "Automotive", "Pharma", "Solar Energy",
            ].map((cat) => (
              <Link
                key={cat}
                href={`/products?category=${cat.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}`}
                className="text-[11px] text-gray-600 hover:text-blue-400 transition-colors"
              >
                {cat}
              </Link>
            )).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, <span key={`sep-${i}`} className="text-gray-700">·</span>, el], [])}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <p>© {year} IndiaMart B2B Marketplace. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Made with ❤️ in India 🇮🇳</span>
              <span>·</span>
              <Link href="/help" className="hover:text-gray-400 transition">Privacy</Link>
              <span>·</span>
              <Link href="/help" className="hover:text-gray-400 transition">Terms</Link>
              <span>·</span>
              <Link href="/help" className="hover:text-gray-400 transition">Cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
