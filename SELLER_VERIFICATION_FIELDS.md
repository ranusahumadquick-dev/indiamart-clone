# `isVerified` vs `sellerStatus`

Two separate fields on the `User` model. They look similar but answer two different questions and must not be conflated.

## `sellerStatus`

**Question it answers:** "Has this seller been reviewed and approved by admin?"

- Type: enum — `"pending" | "under_review" | "approved" | "rejected"`
- Relationship: **admin ↔ seller only**. Buyers never see this field and never interact with it.
- Lifecycle:
  1. `pending` — seller just registered, hasn't submitted documents yet.
  2. `under_review` — seller uploaded ITR / CA certificate / bank statement, waiting on admin.
  3. `approved` — admin reviewed and accepted. Seller can now publish products live.
  4. `rejected` — admin reviewed and declined. `sellerStatusNote` carries the reason.
- **This is the only field that gates publishing.** `createProduct` / `updateProduct` check `sellerStatus === "approved"` before allowing a product's status to be anything other than `"draft"`. Nothing else controls this.
- Set by: `sellerVerifyController.js` (`adminApproveSeller`, `adminRejectSeller`, doc-upload, registration) and shown on the seller's own dashboard (`seller/dashboard/page.tsx`) and the admin review pages (`admin/users`, `admin/seller-verification`).

## `isVerified`

**Question it answers:** "Should buyers see this seller as a trusted/verified seller?"

- Type: boolean.
- Relationship: **admin ↔ buyer-facing badge**. This is what powers the "✓ Verified" / TrustSEAL badge shown on product cards, seller storefronts, chat, wishlist, compare, etc. — everywhere a buyer looks at a seller.
- Admin can flip it on/off at will, independent of everything else — it's a manual trust signal, not an automated one.
- **Constraint:** `isVerified` can only be `true` if `sellerStatus === "approved"`. A seller who hasn't been approved has "no sense of `isVerified`" — the badge must never show for them. Enforced in `adminController.js`'s `verifyUser`: setting `isVerified: true` on a seller whose `sellerStatus` isn't `"approved"` is rejected with a 400.
- Approving a seller (`sellerStatus → "approved"`) does **not** automatically grant this badge — it's a separate, deliberate admin action taken afterward via the Verify/Unverify toggle. Rejecting a seller (`sellerStatus → "rejected"`) does clear `isVerified` back to `false`, since the constraint above must always hold.
- Has **zero** effect on whether a seller can publish products.

## Quick mental model

| | `sellerStatus` | `isVerified` |
|---|---|---|
| Who it's for | Admin ↔ Seller | Admin ↔ Buyer |
| Controls | Can seller publish live? | Does seller show a trust badge to buyers? |
| Values | pending / under_review / approved / rejected | true / false |
| Set by | Onboarding pipeline (doc review) | Admin, manually, anytime — but only while approved |
| Buyer-visible? | Never | Yes (badge) |

`sellerStatus` is the gate. `isVerified` is a badge layered on top of an already-open gate — it can never be true while the gate is shut.
