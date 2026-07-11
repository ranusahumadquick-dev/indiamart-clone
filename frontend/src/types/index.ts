export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: "buyer" | "seller" | "admin" | "premium";
  companyName?: string;
  avatar?: string;
  isVerified?: boolean;
  businessType?: string;
  gstNumber?: string;
  profileCompleted?: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  priceUnit?: string;
  comparePrice?: number;
  category: string | { _id: string; name: string };
  seller?: { _id: string; name: string; companyName?: string; isVerified?: boolean };
  images: { url: string; alt?: string }[] | string[];
  isActive: boolean;
  allowSamples?: boolean;
  samplePrice?: number;
  sampleMinQty?: number;
  sampleMaxQty?: number;
  sampleLeadTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SampleRequest {
  _id: string;
  buyer: { _id: string; name: string; email: string; phone: string };
  seller: { _id: string; name: string; companyName?: string };
  product: { _id: string; name: string; images: { url: string }[] };
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: "pending" | "accepted" | "rejected" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded";
  paymentId?: string;
  conversation?: string;
  shippingAddress: { street: string; city: string; state: string; pincode: string; country?: string };
  buyerNote?: string;
  sellerNote?: string;
  rejectionReason?: string;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  buyer: { _id: string; name: string; email: string; phone: string };
  seller: { _id: string; name: string; companyName?: string };
  sampleRequest?: string;
  items: { product: string; name: string; image?: string; qty: number; unitPrice: number; total: number }[];
  totalAmount: number;
  currency: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  paymentId?: string;
  paymentStatus: "pending" | "paid" | "refunded";
  shippingAddress: { street: string; city: string; state: string; pincode: string };
  trackingInfo?: { trackingNumber?: string; courier?: string; estimatedDelivery?: string };
  createdAt: string;
}

export interface Conversation {
  _id: string;
  participants: { _id: string; name: string; avatar?: string }[];
  product?: { _id: string; name: string; images: { url: string }[] };
  type: "inquiry" | "sample" | "general";
  lastMessage?: string;
  lastMessageAt?: string;
  myUnread: number;
  isActive: boolean;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: { _id: string; name: string; avatar?: string };
  text: string;
  type: "text" | "quote" | "sample_request" | "system";
  readBy: string[];
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Inquiry {
  _id: string;
  productId: string;
  buyerId: string;
  sellerId: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  amount: number;
  currency: string;
  paymentFor: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  cancelledAt?: string;
}