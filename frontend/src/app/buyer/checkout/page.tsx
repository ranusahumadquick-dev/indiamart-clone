"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import {
  HiOutlineLockClosed, HiOutlineTag, HiOutlineTruck, HiOutlineReceiptPercent,
  HiOutlineCreditCard, HiOutlineDevicePhoneMobile, HiOutlineBuildingLibrary,
  HiOutlineWallet, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineShieldCheck,
  HiOutlineMapPin, HiOutlineChevronRight,
} from "react-icons/hi2";

declare global { interface Window { Razorpay: any; } }

const PAYMENT_METHODS = [
  { id: "upi",        label: "UPI",           icon: <HiOutlineDevicePhoneMobile className="w-5 h-5" />,  desc: "Google Pay, PhonePe, Paytm" },
  { id: "card",       label: "Card",          icon: <HiOutlineCreditCard className="w-5 h-5" />,          desc: "Credit / Debit Card" },
  { id: "netbanking", label: "Net Banking",   icon: <HiOutlineBuildingLibrary className="w-5 h-5" />,    desc: "All major banks" },
  { id: "wallet",     label: "Wallet",        icon: <HiOutlineWallet className="w-5 h-5" />,              desc: "Paytm, Mobikwik, Amazon Pay" },
];

const VALID_COUPONS: Record<string, string> = {
  SAVE10: "10% off your order",
  FLAT500: "Flat ₹500 off (min ₹2000)",
  SAVE5:   "5% off your order",
};

interface CartItem { productId: string; name: string; price: number; quantity: number; image?: string; }

function CheckoutContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState("upi");
  const [coupon, setCoupon] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ street: "", city: "", state: "", pincode: "" });
  const [breakdown, setBreakdown] = useState<any>(null);

  // Load cart from URL or localStorage
  useEffect(() => {
    const raw = params.get("items");
    if (raw) {
      try { setCartItems(JSON.parse(decodeURIComponent(raw))); } catch {}
    } else {
      const stored = localStorage.getItem("checkout_cart");
      if (stored) setCartItems(JSON.parse(stored));
    }

    // Load Razorpay script
    if (!document.getElementById("razorpay-script")) {
      const s = document.createElement("script");
      s.id = "razorpay-script";
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.head.appendChild(s);
    }
  }, []);

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const gst = Math.round(subtotal * 0.18);
  const shipping = subtotal >= 5000 ? 0 : 99;
  const discount = !coupon ? 0 :
    coupon === "SAVE10" ? Math.round(subtotal * 0.1) :
    coupon === "FLAT500" && subtotal >= 2000 ? 500 :
    coupon === "SAVE5" ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + gst + shipping - discount;

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (VALID_COUPONS[code]) {
      if (code === "FLAT500" && subtotal < 2000) {
        setCouponMsg({ text: "Min order ₹2000 for FLAT500", ok: false });
        return;
      }
      setCoupon(code);
      setCouponMsg({ text: `✓ ${VALID_COUPONS[code]}`, ok: true });
    } else {
      setCouponMsg({ text: "Invalid coupon code", ok: false });
    }
  };

  const handlePay = async () => {
    if (!address.city || !address.pincode) { toast.error("Please fill shipping address"); return; }
    if (!cartItems.length) { toast.error("Cart is empty"); return; }
    setLoading(true);
    try {
      const res = await api.post("/payments/checkout", {
        items: cartItems.map(i => ({ productId: i.productId, quantity: i.quantity })),
        shippingAddress: address,
        couponCode: coupon || undefined,
        paymentMethod: payMethod,
      });
      const { orderId, paymentId, amount, key } = res.data.data;

      const options = {
        key,
        amount,
        currency: "INR",
        name: "IndiaMART Clone",
        description: "B2B Marketplace Payment",
        order_id: orderId,
        prefill: {},
        config: {
          display: {
            blocks: {
              utib: { name: "Pay via " + payMethod.toUpperCase(), instruments: [{ method: payMethod }] },
              other: { name: "Other methods", instruments: [{ method: "card" }, { method: "netbanking" }] },
            },
            sequence: ["block.utib", "block.other"],
            preferences: { show_default_blocks: false },
          },
        },
        handler: async (response: any) => {
          try {
            const verify = await api.post("/payments/verify-checkout", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              paymentId,
            });
            localStorage.removeItem("checkout_cart");
            router.push(`/buyer/payment/success?orderId=${verify.data.data.order._id}&paymentId=${paymentId}`);
          } catch { router.push(`/buyer/payment/failed?paymentId=${paymentId}`); }
        },
        modal: { ondismiss: () => { setLoading(false); toast("Payment cancelled"); } },
        theme: { color: "#0052cc" },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to initiate payment");
      setLoading(false);
    }
  };

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
          <button onClick={() => router.push("/products")} className="mt-4 bg-[#0052cc] text-white px-6 py-2 rounded-xl font-semibold">Browse Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <HiOutlineLockClosed className="w-6 h-6 text-[#0052cc]" />
          <h1 className="text-2xl font-black text-gray-900">Secure Checkout</h1>
          <span className="ml-auto flex items-center gap-1.5 text-sm text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
            <HiOutlineShieldCheck className="w-4 h-4" /> SSL Secured
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* LEFT */}
          <div className="space-y-5">
            {/* Shipping Address */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineMapPin className="w-5 h-5 text-[#0052cc]" />
                <h2 className="font-black text-gray-900">Shipping Address</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "street", label: "Street / Area", span: true },
                  { key: "city",    label: "City *" },
                  { key: "state",   label: "State" },
                  { key: "pincode", label: "Pincode *" },
                ].map(f => (
                  <div key={f.key} className={f.span ? "sm:col-span-2" : ""}>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">{f.label}</label>
                    <input value={(address as any)[f.key]} onChange={e => setAddress(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none" />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineCreditCard className="w-5 h-5 text-[#0052cc]" />
                <h2 className="font-black text-gray-900">Payment Method</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map(m => (
                  <button key={m.id} onClick={() => setPayMethod(m.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition ${payMethod === m.id ? "border-[#0052cc] bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <span className={payMethod === m.id ? "text-[#0052cc]" : "text-gray-400"}>{m.icon}</span>
                    <div>
                      <p className={`text-sm font-bold ${payMethod === m.id ? "text-[#0052cc]" : "text-gray-700"}`}>{m.label}</p>
                      <p className="text-[10px] text-gray-400">{m.desc}</p>
                    </div>
                    {payMethod === m.id && <HiOutlineCheckCircle className="w-5 h-5 text-[#0052cc] ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <HiOutlineTag className="w-5 h-5 text-[#0052cc]" />
                <h2 className="font-black text-gray-900">Coupon Code</h2>
              </div>
              <div className="flex gap-3">
                <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon (SAVE10, FLAT500, SAVE5)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none uppercase" />
                <button onClick={applyCoupon} className="bg-[#0052cc] text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">Apply</button>
              </div>
              {couponMsg && (
                <p className={`mt-2 text-sm font-semibold flex items-center gap-1 ${couponMsg.ok ? "text-green-600" : "text-red-500"}`}>
                  {couponMsg.ok ? <HiOutlineCheckCircle className="w-4 h-4" /> : <HiOutlineXCircle className="w-4 h-4" />}
                  {couponMsg.text}
                </p>
              )}
            </div>
          </div>

          {/* RIGHT — Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-4">
              <h2 className="font-black text-gray-900 mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cartItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      {item.image
                        ? <img src={item.image} className="w-full h-full object-cover" alt="" />
                        : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span><span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1"><HiOutlineReceiptPercent className="w-3.5 h-3.5" /> GST (18%)</span>
                  <span>₹{gst.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span className="flex items-center gap-1"><HiOutlineTruck className="w-3.5 h-3.5" /> Shipping</span>
                  <span className={shipping === 0 ? "text-green-600 font-semibold" : ""}>
                    {shipping === 0 ? "FREE" : `₹${shipping}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold">
                    <span className="flex items-center gap-1"><HiOutlineTag className="w-3.5 h-3.5" /> Coupon ({coupon})</span>
                    <span>-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2.5 flex justify-between font-black text-gray-900 text-base">
                  <span>Total</span><span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button onClick={handlePay} disabled={loading}
                className="w-full mt-5 bg-[#0052cc] text-white py-3.5 rounded-xl font-black text-base hover:bg-blue-700 transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5" /> : <HiOutlineLockClosed className="w-5 h-5" />}
                {loading ? "Processing…" : `Pay ₹${total.toLocaleString("en-IN")}`}
              </button>

              <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-gray-400">
                {["Razorpay Secured", "256-bit SSL", "PCI DSS Compliant"].map(t => (
                  <span key={t} className="flex items-center gap-1">
                    <HiOutlineShieldCheck className="w-3 h-3" />{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute allowedRoles={["buyer", "seller", "premium", "admin"]}>
      <CheckoutContent />
    </ProtectedRoute>
  );
}
