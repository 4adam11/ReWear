# ReWear demo script (about 10 minutes)

## Before the demo

1. Start MongoDB, then the API (`cd server && npm run dev`) and the site (`cd client && npm run dev`).
2. Add `DEMO_PASSWORD=<something 8+ characters>` to `server/.env`, then run `cd server && npm run demo-accounts`.
   This creates three accounts that all use that password:
   - `buyer@rewear.local` (Priya Buyer)
   - `seller@rewear.local` (Kabir Seller)
   - `admin@rewear.local` (ReWear Admin)
3. Open the site in two browser windows (one normal, one private) so you can be two people at once.

## 1. Shopping (buyer)

- Home page: occasion tiles, "Fresh on ReWear", rentals row.
- Search "saree", filter by **Rent only** and a size, sort by price. Show the URL keeps the filters.
- Open a product: photos, seller rating, Rent/Buy prices, the booking calendar with booked days greyed out.
- Show the seller's shop page from "Visit the seller's shop" (rating breakdown and reviews).

## 2. Listing an item (seller) and admin approval

- As **seller**: Sell → upload a clothing photo. The local AI check blocks explicit images and flags non-clothing ones.
- The listing is **In review**, not public.
- As **admin**: Admin panel → Review queue → approve (or reject with a reason the seller sees).
- Show the **Activity log**: every admin decision with who and when.

## 3. Make an offer

- As **buyer** on the seller's item: **Make an offer** below the price.
- As **seller**: Offers → Offers on your items → **Counter**.
- As **buyer**: accept the counter. The product page and bag now use the agreed price for 48 hours.

## 4. Order workflow

- Buyer: checkout with a saved address, cash on delivery → order confirmation.
- Seller: Orders to fulfil → **Accept** → **Mark as shipped** (courier + tracking number).
- Buyer: My orders shows the progress bar and tracking → **I've received it** → **Complete order**.
- Buyer: **Rate the seller** (stars + comment). The rating appears on the shop page and product cards.
- Every step sends an alert to the other person (bell icon).

## 5. Problem reports (disputes)

- On a shipped or delivered order, buyer clicks **Report a problem** (e.g. "Not as described").
- The order can't be completed while the report is open.
- Admin → **Problem reports** → write a decision → **Refund the buyer** or **Reject report**.
  Both sides are notified, and the decision is in the activity log.

## 6. Admin overview

- Counts of listings by status, users, orders and sales value.
- Charts for the last 30 days: orders, sales value, new listings, new users.

## What's not in this version

- Online payment (UPI and card show "Coming soon"; Razorpay test mode is the next step).
- Emails (alerts are in-app only).
