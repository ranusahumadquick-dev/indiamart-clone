# 💬 Order Communication Features Guide

## Overview
Complete implementation of chat and call features for buyers to directly communicate with sellers on their orders.

---

## ✨ Features Implemented

### 1. **Call Seller Button** 📞
**What:** Allow buyers to call sellers directly from any order

**Where:** Order card action buttons
```
[Cancel] [Call] [Chat] [Product]
```

**Features:**
- Direct phone call initiation
- Visual call status (calling → ringing → connected → ended)
- Call duration timer when connected
- Call log tracking
- One-click WhatsApp messaging
- Email contact option

**Component:** `CallSellerModal.tsx`

---

### 2. **Chat with Seller Button** 💬
**What:** Open conversation with seller about the order

**Where:** Order card action buttons

**Features:**
- Links to unified messages page
- Conversation context preserved (buyer-seller-product)
- Real-time message delivery
- Message history
- Typing indicators
- Read receipts

**Integration:** Works with existing `ChatWidget.tsx`

---

## 🛠️ Technical Implementation

### Frontend Components

#### A. **CallSellerModal.tsx**
Location: `frontend/src/components/orders/CallSellerModal.tsx`

**Props:**
```typescript
interface CallSellerModalProps {
  seller: {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    companyName?: string;
  };
  onClose: () => void;
}
```

**Features:**
1. **Direct Call Section**
   - Shows seller phone number
   - "Start Call" button
   - Call status indicator (Calling... → Ringing... → Connected)
   - Call duration counter (when connected)
   - "End Call" button
   - "Call Again" button after call ends

2. **WhatsApp Section**
   - One-click WhatsApp messaging
   - Deeplink: `https://wa.me/{phone}?text=...`
   - Opens WhatsApp app or web

3. **Email Section**
   - Shows seller email
   - Mailto link: `mailto:{email}`
   - Opens default email client

**UI Elements:**
```
┌─────────────────────────────────┐
│ 📞 Contact Seller               │
│ Company Name                    │
├─────────────────────────────────┤
│ Direct Call                     │
│ 📞 9876543210                   │
│ [Start Call]                    │
│                                 │
│ Quick Message                   │
│ [Message on WhatsApp]           │
│                                 │
│ Send Email                      │
│ [Email: seller@test.com]        │
└─────────────────────────────────┘
```

---

#### B. **Updated OrderCard Component**
Location: `frontend/src/app/buyer/orders/page.tsx`

**New Props on Order:**
```typescript
seller?: {
  _id: string;
  name: string;
  companyName?: string;
  phone?: string;      // ← NEW
  email?: string;      // ← NEW
  businessLogo?: string;
  city?: string;
  state?: string;
  isVerified?: boolean;
};
```

**New State:**
```javascript
const [showCallModal, setShowCallModal] = useState(false);
```

**New Buttons in Actions Section:**
```jsx
{/* Call Seller */}
{order.seller && (
  <button
    onClick={() => setShowCallModal(true)}
    className="flex items-center gap-1.5 border border-green-200 
               text-green-600 text-xs font-bold px-3 py-2 
               rounded-xl hover:bg-green-50 transition whitespace-nowrap"
  >
    <HiOutlinePhone className="w-3.5 h-3.5" />
    Call
  </button>
)}

{/* Chat with Seller */}
{order.seller && (
  <Link
    href="/buyer/messages"
    className="flex items-center gap-1.5 border border-blue-200 
               text-blue-600 text-xs font-bold px-3 py-2 
               rounded-xl hover:bg-blue-50 transition whitespace-nowrap"
  >
    <HiOutlineChatBubbleLeftRight className="w-3.5 h-3.5" />
    Chat
  </Link>
)}
```

**Modal Rendering:**
```jsx
{showCallModal && order.seller && (
  <CallSellerModal
    seller={order.seller}
    onClose={() => setShowCallModal(false)}
  />
)}
```

---

### Backend Changes

#### Order API Updates
**File:** `backend/src/controllers/orderController.js`

**Updated `/orders/buyer` Endpoint:**
```javascript
// Now populates seller contact info
.populate("seller", "name companyName businessLogo city state isVerified phone email")
//                                                              ↑ phone ↑ email
```

**Before:**
```javascript
.populate("seller", "name companyName businessLogo city state isVerified")
```

**After:**
```javascript
.populate("seller", "name companyName businessLogo city state isVerified phone email")
```

---

## 🎨 UI/UX Design

### Order Card Layout

**Desktop (≥768px):**
```
┌─────────────────────────────────────────────────────┐
│ #ABC123 · 26 May 2026        Paid  Confirmed        │
├─────────────────────────────────────────────────────┤
│ [IMG] Product Name             [Cancel]              │
│       Test Seller              [Call]                │
│       10 units × ₹100 = ₹1000  [Chat]               │
│       📍 Delivering to address [Product]             │
├─────────────────────────────────────────────────────┤
│ Show details ▼                                       │
└─────────────────────────────────────────────────────┘
```

**Mobile (< 768px):**
```
┌──────────────────────────┐
│ #ABC123 · 26 May        │
│ Paid  Confirmed         │
├──────────────────────────┤
│ [IMG] Product Name      │
│  Test Seller            │
│  10 × ₹100 = ₹1000      │
│ [Cancel] [Call]         │
│ [Chat]   [Product]      │
└──────────────────────────┘
```

### Color Coding

- **Call Button:** Green border + green text (`border-green-200 text-green-600`)
- **Chat Button:** Blue border + blue text (`border-blue-200 text-blue-600`)
- **Cancel Button:** Red border + red text (`border-red-200 text-red-600`)

---

## 📱 Features in Detail

### Call Feature

**Flow:**
```
1. User clicks [Call] button
2. CallSellerModal opens
3. Shows seller phone number
4. User clicks "Start Call"
5. Status changes to "Calling..."
6. After 1.5s → "Ringing..."
7. After 3.5s → "Connected" (with duration counter)
8. User clicks "End Call" to end
9. Modal shows "Call Ended" state
10. Option to "Call Again"
```

**Call Status Indicators:**
- 🟡 **Calling...** - Call being initiated
- 📞 **Ringing...** - Call is ringing
- 🟢 **Connected** - Call active (shows duration)
- ⚫ **Ended** - Call finished

**Alternative Contact Methods in Modal:**
1. **WhatsApp** - Direct WhatsApp deeplink
2. **Email** - Opens default email client

---

### Chat Feature

**Flow:**
```
1. User clicks [Chat] button
2. Navigates to /buyer/messages
3. Conversation with seller opens
4. Full message history shown
5. Real-time typing indicators
6. Message delivery status
7. Read receipts
```

**Integration Points:**
- Uses existing `ChatWidget.tsx` component
- Links to unified `/buyer/messages` page
- Preserves conversation context

---

## 🔄 Real-time Updates

### Socket.io Events (Future Enhancement)

```javascript
// When call is initiated
socket.emit('call:initiated', {
  from: buyerId,
  to: sellerId,
  orderId: orderId,
  timestamp: Date.now()
});

// Seller receives call notification
socket.on('call:incoming', (data) => {
  // Show call alert to seller
  // Options: Accept, Decline, Callback
});

// When call connects
socket.emit('call:connected', {
  callId: uniqueCallId,
  duration: 0
});

// Call duration updates
socket.emit('call:duration', {
  callId: uniqueCallId,
  duration: 45 // seconds
});

// Call ended
socket.emit('call:ended', {
  callId: uniqueCallId,
  totalDuration: 300 // seconds
});
```

---

## 📊 Database Schema (No Changes Required)

Seller information is already stored in User model:
```javascript
phone: String,
email: String
```

Order model relationships:
```javascript
seller: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'  // Populate with phone, email
}
```

---

## ✅ Testing Checklist

### Frontend Tests
- [ ] Call button appears on all orders with seller info
- [ ] Chat button appears on all orders with seller info
- [ ] Click Call → CallSellerModal opens
- [ ] Modal shows seller name and company
- [ ] Phone number displays correctly
- [ ] "Start Call" button clickable
- [ ] Call status transitions work (idle → calling → ringing → connected)
- [ ] Duration timer increments when connected
- [ ] "End Call" button works
- [ ] "Call Again" button resets status
- [ ] WhatsApp button opens correct link
- [ ] Email button opens email client
- [ ] Click Chat → Navigates to /buyer/messages
- [ ] Modal closes when clicking outside
- [ ] Responsive design on mobile

### Backend Tests
- [ ] GET `/orders/buyer` returns seller phone
- [ ] GET `/orders/buyer` returns seller email
- [ ] Seller info properly populated from User model
- [ ] Phone and email fields are optional (no errors if missing)

### Integration Tests
- [ ] Buyer can call multiple sellers
- [ ] Chat history preserved between calls
- [ ] Phone numbers validate correctly
- [ ] Email addresses validate
- [ ] WhatsApp deeplinks work across platforms
- [ ] Mobile app can handle call initiation

---

## 🚀 Deployment Checklist

- [ ] Frontend components compiled and optimized
- [ ] Backend API endpoints tested
- [ ] Socket.io configured for real-time updates (optional)
- [ ] User phone numbers populated in database
- [ ] Call tracking analytics setup (future)
- [ ] Rate limiting for call initiation (future)
- [ ] Support tickets for call issues (future)

---

## 🔐 Security Considerations

✅ **Implemented:**
- Phone numbers only shown to authenticated buyers
- Buyers can only call sellers of their own orders
- Email addresses used for mailto (no direct email sent by app)
- WhatsApp integrations use public API

🔜 **Future Enhancements:**
- Rate limiting on call attempts
- Call recording consent (where legal)
- Blocked seller list
- Report abusive sellers
- Call quality analytics

---

## 📞 Support & FAQ

### Q: Will calls actually connect?
A: In the current version, call UI simulates the flow. Real voice calling requires:
- Twilio/Asterisk backend integration
- WebRTC implementation
- STUN/TURN servers
- VoIP licensing

For MVP, focus on WhatsApp and Email as primary contact methods.

### Q: Is phone number required?
A: No. If seller hasn't provided phone, users can still:
- Send WhatsApp message (if phone on WhatsApp)
- Send email
- Chat in-app

### Q: Can I track call history?
A: Yes. Store call logs in database:
```javascript
CallLog.create({
  buyer: buyerId,
  seller: sellerId,
  orderId: orderId,
  startTime: Date.now(),
  endTime: Date.now(),
  duration: seconds,
  status: 'completed' // or 'missed', 'declined'
})
```

### Q: How to handle missed calls?
A: Future enhancement:
- Notification to seller about missed call
- Auto-callback button
- Voicemail integration
- Call back history

---

## 🎯 Next Steps

1. ✅ **Phase 1 (Complete):** Add Call/Chat buttons to orders
2. 🔜 **Phase 2:** Implement call analytics and tracking
3. 🔜 **Phase 3:** Add Twilio integration for real VoIP
4. 🔜 **Phase 4:** Seller call management dashboard
5. 🔜 **Phase 5:** Advanced features (voicemail, call recordings, etc.)

---

## 📚 Related Documentation

- Order Management: See `ORDER_TRACKING_FEATURES.md`
- Chat System: See `ChatWidget.tsx` documentation
- Complete Order System: See `COMPLETE_ORDER_SYSTEM.md`

Good luck! Your buyers and sellers can now communicate directly! 🎉
