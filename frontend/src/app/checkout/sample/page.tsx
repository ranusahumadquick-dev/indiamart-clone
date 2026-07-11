"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import { StateDropdown, CityDropdown } from "@/components/common/LocationDropdown";
import { resolveImageUrl } from "@/lib/imageUrl";
import toast from "react-hot-toast";
import Image from "next/image";
import {
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineBeaker,
  HiOutlineMapPin,
  HiOutlineDocumentText,
  HiOutlineCurrencyRupee,
  HiOutlineCheckBadge,
  HiMiniCheckCircle,
} from "react-icons/hi2";

interface Product {
  _id: string;
  name: string;
  images: { url: string }[];
  price: number;
  allowSamples?: boolean;
  samplePrice?: number;
  sampleMinQty?: number;
  sampleMaxQty?: number;
  sampleLeadTime?: string;
  minOrderQuantity?: number;
  priceUnit?: string;
  category?: { name: string } | string;
  seller: { _id: string; name: string; companyName: string; isVerified: boolean; city?: string };
}

declare global { interface Window { Razorpay: any; } }

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { num: 1 as Step, label: "Product", icon: HiOutlineBeaker },
  { num: 2 as Step, label: "Address", icon: HiOutlineMapPin },
  { num: 3 as Step, label: "Review", icon: HiOutlineDocumentText },
  { num: 4 as Step, label: "Payment", icon: HiOutlineCurrencyRupee },
];

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done = s.num < current;
        const active = s.num === current;
        return (
          <div key={s.num} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done ? "bg-green-500 text-white" : active ? "bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20" : "bg-gray-100 text-gray-400"
              }`}>
                {done ? <HiMiniCheckCircle className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-[11px] font-medium ${active ? "text-[var(--primary)]" : done ? "text-green-600" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-2 transition-all ${done ? "bg-green-400" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SampleCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [step, setStep] = useState<Step>(1);

  const [qty, setQty] = useState(1);
  const [address, setAddress] = useState({ street: "", city: "", state: "", pincode: "", country: "India" });
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "wallet" | null>(null);

  useEffect(() => {
    if (!productId) { router.push("/products"); return; }
    api.get(`/products/${productId}`)
      .then((res) => {
        const p = res.data.data;
        setProduct(p);
        const minQty = p.allowSamples && p.sampleMinQty ? p.sampleMinQty : (p.minOrderQuantity || 1);
        setQty(minQty);
      })
      .catch(() => { toast.error("Product not found"); router.push("/products"); })
      .finally(() => setLoading(false));
  }, [productId]);

  const unitPrice = product ? (product.allowSamples && product.samplePrice ? product.samplePrice : product.price) : 0;
  const minQty = product ? (product.allowSamples && product.sampleMinQty ? product.sampleMinQty : (product.minOrderQuantity || 1)) : 1;
  const maxQty = product ? (product.allowSamples && product.sampleMaxQty ? product.sampleMaxQty : 10000) : 10000;
  const total = unitPrice * qty;

  const validateStep1 = () => {
    if (!product) return false;
    if (qty < minQty) {
      toast.error(`Quantity must be at least ${minQty}`);
      return false;
    }
    if (qty > maxQty) {
      toast.error(`Maximum quantity is ${maxQty}`);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!address.street.trim()) {
      toast.error("Please enter street address");
      return false;
    }
    if (!address.city.trim()) {
      toast.error("Please enter city");
      return false;
    }
    if (!address.state.trim()) {
      toast.error("Please enter state");
      return false;
    }
    if (!address.pincode.trim()) {
      toast.error("Please enter pincode");
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      toast.error("Pincode must be exactly 6 digits");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handlePlaceOrder = async () => {
    if (!product) {
      toast.error("Product not found");
      return;
    }

    // Move to payment step
    setStep(4);
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!product) {
      toast.error("Product not found");
      return;
    }

    if (qty <= 0) {
      toast.error("Please enter valid quantity");
      return;
    }

    // Prepare order details to pass to payment page
    const orderDetails = {
      productId: product._id,
      productName: product.name,
      quantity: qty,
      unitPrice: unitPrice,
      totalAmount: total,
      sellerId: product.seller?._id,
      sellerName: product.seller.name,
      shippingAddress: {
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        country: address.country
      },
      buyerNote: note
    };

    // Store order details in session storage and navigate to payment page
    sessionStorage.setItem("pendingOrder", JSON.stringify(orderDetails));
    router.push(`/payment/${paymentMethod}`);
  };

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );
  if (!product) return null;

  const categoryName = typeof product.category === "object" ? (product.category as any)?.name : product.category;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep((step - 1) as Step) : router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 transition text-gray-500">
            <HiOutlineArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{product?.allowSamples ? "Request Sample" : "Place Order"}</h1>
            <p className="text-xs text-gray-400">{product.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <StepIndicator current={step} />

        {/* ── Step 1: Product + Quantity ─────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Product card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex gap-4 p-5">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.images?.[0]?.url ? (
                    <img src={resolveImageUrl(product.images[0].url)} alt={product.name} className="w-full h-full object-cover" />
                  ) : <HiOutlineBeaker className="w-8 h-8 m-auto mt-8 text-gray-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  {categoryName && <p className="text-xs text-[var(--primary)] font-semibold uppercase tracking-wide mb-1">{categoryName}</p>}
                  <p className="font-bold text-gray-900 leading-snug">{product.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-sm text-gray-500">{product.seller?.companyName || product.seller?.name}</p>
                    {product.seller?.isVerified && (
                      <span className="flex items-center gap-0.5 text-[10px] text-blue-600 font-semibold">
                        <HiOutlineCheckBadge className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>
                  {product.seller?.city && <p className="text-xs text-gray-400 mt-0.5">{product.seller.city}</p>}
                </div>
              </div>

              {/* Price info strip */}
              <div className="bg-green-50 border-t border-green-100 px-5 py-3 flex flex-wrap gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Unit Price</p>
                  <p className="text-base font-bold text-green-700">₹{unitPrice.toLocaleString()} / {product.priceUnit || "unit"}</p>
                </div>
                {product.sampleLeadTime && (
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Lead Time</p>
                    <p className="text-base font-bold text-gray-700">{product.sampleLeadTime}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Min Qty</p>
                  <p className="text-base font-bold text-gray-700">{minQty} units</p>
                </div>
              </div>
            </div>

            {/* Quantity selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Select Quantity</h2>
                {!product?.allowSamples && product?.minOrderQuantity && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                    Minimum: {product.minOrderQuantity} units
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQty(Math.max(minQty, qty - 1))}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                >−</button>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900">{qty}</p>
                  <p className="text-xs text-gray-400">units</p>
                </div>
                <button
                  onClick={() => setQty(Math.min(maxQty, qty + 1))}
                  className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] transition"
                >+</button>
                <div className="ml-4 pl-4 border-l border-gray-100">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-[var(--primary)]">₹{total.toLocaleString()}</p>
                </div>
              </div>
              {product.allowSamples && product.sampleMaxQty && product.sampleMinQty && product.sampleMaxQty <= 10 && (
                <div className="flex gap-2 mt-4">
                  {Array.from({ length: product.sampleMaxQty - product.sampleMinQty + 1 }, (_, i) => product.sampleMinQty! + i).map((n) => (
                    <button
                      key={n}
                      onClick={() => setQty(n)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold transition border-2 ${
                        qty === n ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]" : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}
                    >{n}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: HiOutlineShieldCheck, label: "Verified Seller", sub: "Quality assured" },
                { icon: HiOutlineTruck, label: "Free Delivery", sub: "As per seller terms" },
                { icon: HiOutlineCheckCircle, label: "Easy Returns", sub: "If not satisfied" },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                  <Icon className="w-5 h-5 text-green-500 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-gray-700">{label}</p>
                  <p className="text-[10px] text-gray-400">{sub}</p>
                </div>
              ))}
            </div>

            <button onClick={handleNext}
              className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[var(--primary-dark)] transition">
              Continue to Shipping
            </button>
          </div>
        )}

        {/* ── Step 2: Shipping Address ───────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-800 mb-5">Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">
                    Street / House No. <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    placeholder="123, MG Road, Near Market"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <StateDropdown label="State" value={address.state} onChange={(v) => setAddress({ ...address, state: v, city: "" })} required />
                </div>
                <div>
                  <CityDropdown label="City" value={address.city} onChange={(v) => setAddress({ ...address, city: v })} state={address.state} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Pincode <span className="text-red-400">*</span></label>
                  <input value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    placeholder="400001" maxLength={6}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Country</label>
                  <input value="India" disabled
                    className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <HiOutlineTruck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                {product.sampleLeadTime
                  ? <>Estimated delivery: <strong>{product.sampleLeadTime}</strong> after seller ships. </>
                  : "Delivery timeline as per seller's terms. "}
                Shipping charges apply as per seller's courier policy.
              </p>
            </div>

            <button onClick={handleNext}
              className="w-full bg-[var(--primary)] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[var(--primary-dark)] transition">
              Review Order
            </button>
          </div>
        )}

        {/* ── Step 3: Review & Confirm ───────────────── */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Product summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">Product</h2>
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {product.images?.[0]?.url && <img src={resolveImageUrl(product.images[0].url)} alt="" className="w-full h-full object-cover" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.seller?.companyName || product.seller?.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{qty} unit{qty > 1 ? "s" : ""} × ₹{unitPrice.toLocaleString()} = <strong>₹{total.toLocaleString()}</strong></p>
                </div>
              </div>
            </div>

            {/* Address summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">Ship To</h2>
                <button onClick={() => setStep(2)} className="text-xs text-[var(--primary)] hover:underline">Edit</button>
              </div>
              <div className="flex items-start gap-2">
                <HiOutlineMapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-sm text-gray-700">
                  {address.street}, {address.city}, {address.state} — {address.pincode}
                </p>
              </div>
            </div>

            {/* Special instructions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">Special Instructions <span className="text-gray-400 font-normal">(optional)</span></h2>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
                placeholder="Specific colour, grade, certification, or packing preferences..."
                maxLength={500}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[var(--primary)] resize-none" />
            </div>

            {/* Order total */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">Order Summary</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>₹{unitPrice.toLocaleString()} × {qty} units</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">As per seller</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total Payable</span>
                  <span className="text-[var(--primary)]">₹{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-50 space-y-1.5">
                <p className="text-xs text-gray-400 flex items-start gap-1.5">
                  <HiOutlineCurrencyRupee className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                  Payment is collected <strong>only after</strong> the seller accepts your request.
                </p>
                <p className="text-xs text-gray-400 flex items-start gap-1.5">
                  <HiOutlineShieldCheck className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                  Secured by Razorpay — 256-bit SSL encryption.
                </p>
              </div>
            </div>

            {/* What happens next */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">What happens next?</p>
              <div className="space-y-2">
                {[
                  "Your request is sent to the seller",
                  "Seller reviews & accepts (usually within 24h)",
                  "You pay securely via Razorpay",
                  "Seller ships your sample with tracking",
                  "Confirm delivery → place bulk order",
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</div>
                    <p className="text-xs text-blue-800">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handlePlaceOrder} disabled={placing}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-base hover:bg-green-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
              {placing ? "Placing Order..." : (
                <><HiOutlineBeaker className="w-5 h-5" /> {product.allowSamples ? "Send Sample Request" : "Place Order"} — ₹{total.toLocaleString()}</>
              )}
            </button>
          </div>
        )}

        {/* ── Step 4: Payment ─────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            {/* Select Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">Select Payment Method</h2>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: "upi", icon: "📱", label: "UPI", desc: "Google Pay, PhonePe, PayTM" },
                  { id: "card", icon: "💳", label: "Credit/Debit Card", desc: "Visa, Mastercard, RuPay" },
                  { id: "wallet", icon: "💰", label: "Wallet", desc: "PayTM, Amazon Pay" },
                  { id: "netbanking", icon: "🏦", label: "Net Banking", desc: "Direct Bank Transfer" },
                ].map((method: any) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={`p-4 rounded-xl border-2 transition text-left ${
                      paymentMethod === method.id
                        ? "border-[var(--primary)] bg-blue-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <p className="font-semibold text-sm text-gray-800">{method.label}</p>
                    <p className="text-xs text-gray-400 mt-1">{method.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-4">Order Summary</h2>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>₹{unitPrice.toLocaleString()} × {qty} units</span>
                  <span>₹{total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">As per seller</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total Payable</span>
                  <span className="text-[var(--primary)]">₹{total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <HiOutlineShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Secure Payment</p>
                  <p className="text-xs text-green-700 mt-1">Your payment is secured by Razorpay with 256-bit SSL encryption. Your card details are never stored.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button onClick={() => setStep(3)}
                className="flex-1 border border-gray-200 text-gray-700 py-3.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition">
                Back
              </button>
              <button onClick={handlePayment} disabled={placing || !paymentMethod}
                className="flex-1 bg-green-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-green-700 transition disabled:opacity-60">
                {placing ? "Processing..." : `Pay ₹${total.toLocaleString()}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SampleCheckoutPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<div className="p-10 text-center text-gray-400">Loading...</div>}>
        <SampleCheckoutContent />
      </Suspense>
    </ProtectedRoute>
  );
}
