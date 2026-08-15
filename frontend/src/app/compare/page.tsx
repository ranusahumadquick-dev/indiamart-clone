"use client";
import { resolveImageUrl } from '@/lib/imageUrl';

import Link from "next/link";
import Image from "next/image";
import { useCompare } from "@/contexts/CompareContext";
import {
  HiOutlineArrowsRightLeft,
  HiXMark,
  HiOutlineShieldCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineMapPin,
  HiStar,
  HiOutlineStar,
  HiOutlineShoppingBag,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineBeaker,
} from "@/lib/icons";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        i < Math.floor(rating)
          ? <HiStar key={i} className="w-4 h-4 text-amber-400" />
          : <HiOutlineStar key={i} className="w-4 h-4 text-gray-300" />
      ))}
      <span className="ml-1 text-sm font-medium text-gray-700">{rating > 0 ? rating.toFixed(1) : "—"}</span>
    </div>
  );
}

const COMPARE_ROWS = [
  { label: "Price", key: "price", render: (p: any) => formatINR(p.price) },
  { label: "Compare Price", key: "comparePrice", render: (p: any) => p.comparePrice ? <span className="line-through text-gray-400">{formatINR(p.comparePrice)}</span> : <span className="text-gray-300">—</span> },
  { label: "Per Unit", key: "priceUnit", render: (p: any) => p.priceUnit || "Piece" },
  { label: "Min. Order Qty", key: "minOrderQuantity", render: (p: any) => p.minOrderQuantity ? `${p.minOrderQuantity} ${p.priceUnit || "Pc"}` : "—" },
  { label: "Category", key: "category", render: (p: any) => p.category || "—" },
  { label: "Rating", key: "averageRating", render: (p: any) => <StarRow rating={p.averageRating || 0} /> },
  { label: "Reviews", key: "numReviews", render: (p: any) => p.numReviews > 0 ? `${p.numReviews} reviews` : "No reviews" },
  { label: "Location", key: "location", render: (p: any) => [p.city, p.state].filter(Boolean).join(", ") || "—" },
  { label: "Seller", key: "companyName", render: (p: any) => p.companyName || "—" },
  {
    label: "Verified Seller",
    key: "isVerified",
    render: (p: any) =>
      p.isVerified
        ? <span className="flex items-center gap-1 text-blue-600 font-medium text-sm"><HiOutlineCheckCircle className="w-4 h-4" />Verified</span>
        : <span className="flex items-center gap-1 text-gray-400 text-sm"><HiOutlineXCircle className="w-4 h-4" />Not Verified</span>,
  },
  {
    label: "Sample Available",
    key: "allowSamples",
    render: (p: any) =>
      p.allowSamples
        ? <span className="flex items-center gap-1 text-green-600 font-medium text-sm"><HiOutlineBeaker className="w-4 h-4" />Yes {p.samplePrice ? `— ₹${p.samplePrice}` : ""}</span>
        : <span className="text-gray-400 text-sm">—</span>,
  },
];

export default function ComparePage() {
  const { items, removeItem, clearItems } = useCompare();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <HiOutlineArrowsRightLeft className="w-16 h-16 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-700">Nothing to compare</h1>
        <p className="text-gray-500 text-center max-w-sm">
          Browse products and click the compare icon on any product card to add it here. You can compare up to 4 products.
        </p>
        <Link href="/products" className="bg-[var(--primary)] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[var(--primary-dark)] transition flex items-center gap-2">
          <HiOutlineShoppingBag className="w-5 h-5" />
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HiOutlineArrowsRightLeft className="w-7 h-7 text-[var(--primary)]" />
              Product Comparison
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">Comparing {items.length} product{items.length > 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clearItems}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition"
            >
              Clear All
            </button>
            <Link href="/products" className="text-sm text-[var(--primary)] hover:underline">
              + Add more products
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <colgroup>
                <col className="w-36" />
                {items.map((p) => <col key={p._id} />)}
                {Array.from({ length: 4 - items.length }).map((_, i) => <col key={`e-${i}`} />)}
              </colgroup>

              {/* Product Header Row */}
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50">
                    Product
                  </th>
                  {items.map((product) => (
                    <th key={product._id} className="px-4 py-4 align-top border-l border-gray-100">
                      <div className="flex flex-col items-center gap-2 relative">
                        {/* Remove button */}
                        <button
                          onClick={() => removeItem(product._id)}
                          className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full p-0.5 text-gray-400 hover:text-red-500 hover:border-red-300 transition shadow-sm"
                        >
                          <HiXMark className="w-3.5 h-3.5" />
                        </button>

                        {/* Product Image */}
                        <Link href={`/products/${product._id}`}>
                          <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mx-auto">
                            <Image
                              src={product.images?.[0]?.url || "/placeholder.svg"}
                              alt={product.name}
                              width={96}
                              height={96}
                              className="object-cover w-full h-full hover:scale-105 transition-transform"
                              unoptimized={product.images?.[0]?.url?.startsWith("http")}
                            />
                          </div>
                        </Link>

                        {/* Name */}
                        <Link href={`/products/${product._id}`} className="block">
                          <p className="text-sm font-semibold text-gray-800 text-center hover:text-blue-700 transition line-clamp-2 leading-snug">
                            {product.name}
                          </p>
                        </Link>

                        {/* Verified badge */}
                        {product.isVerified && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold">
                            <HiOutlineShieldCheck className="w-3 h-3" />
                            TrustSEAL
                          </span>
                        )}
                      </div>
                    </th>
                  ))}

                  {/* Empty slots */}
                  {Array.from({ length: 4 - items.length }).map((_, i) => (
                    <th key={`empty-header-${i}`} className="px-4 py-4 border-l border-gray-100">
                      <div className="flex flex-col items-center justify-center h-32 text-center">
                        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center mx-auto mb-2">
                          <span className="text-3xl text-gray-200">+</span>
                        </div>
                        <Link href="/products" className="text-xs text-[var(--primary)] hover:underline">
                          Add product
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Comparison Rows */}
              <tbody>
                {COMPARE_ROWS.map((row, ri) => (
                  <tr
                    key={row.key}
                    className={`border-b border-gray-50 last:border-0 ${ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-500 bg-gray-50 border-r border-gray-100 sticky left-0">
                      {row.label}
                    </td>
                    {items.map((product) => (
                      <td key={product._id} className="px-4 py-3.5 text-sm text-gray-700 text-center border-l border-gray-100">
                        {row.render(product)}
                      </td>
                    ))}
                    {Array.from({ length: 4 - items.length }).map((_, i) => (
                      <td key={`empty-row-${i}`} className="px-4 py-3.5 border-l border-gray-100 bg-gray-50/30" />
                    ))}
                  </tr>
                ))}

                {/* Action Row */}
                <tr className="bg-gray-50">
                  <td className="px-4 py-4 text-sm font-medium text-gray-500 sticky left-0" />
                  {items.map((product) => (
                    <td key={product._id} className="px-4 py-4 border-l border-gray-100">
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/products/${product._id}`}
                          className="w-full text-center text-sm font-semibold text-[var(--primary)] border border-[var(--primary)] rounded-lg py-2 hover:bg-blue-50 transition"
                        >
                          View Details
                        </Link>
                        <Link
                          href={`/products/${product._id}#inquiry`}
                          className="w-full flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-orange-500 rounded-lg py-2 hover:bg-orange-600 transition"
                        >
                          <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
                          Contact Seller
                        </Link>
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: 4 - items.length }).map((_, i) => (
                    <td key={`empty-action-${i}`} className="px-4 py-4 border-l border-gray-100" />
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Prices and availability may vary. Contact sellers directly for latest quotes.
        </p>
      </div>
    </div>
  );
}
