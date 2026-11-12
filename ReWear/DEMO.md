# ReWear demo script (about 12 minutes)

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
- Type "red sar" in the search box: suggestions appear as you type (arrow keys and Enter work), and recent searches show when the box is empty.
- Search "saree", filter by **Rent only** and a size, sort by price. Show the URL keeps the filters.
- Open a product: photos, seller rating, Rent/Buy prices, the booking calendar with booked days greyed out.
- Click the photo for the full-screen viewer, then open **Size guide** (the item's own measurements plus a size chart).
- Go back to the home page: the item now appears under **Recently viewed**.
- Show the seller's shop page from "Visit the seller's shop" (rating breakdown and reviews).

## 2. Listing an item (seller) and admin approval

- As **seller**: Sell → upload a clothing photo. The local AI check blocks explicit images and flags non-clothing ones.
- Type a title such as "Red bridal lehenga": the occasion switches to Wedding by itself. With no keyword in the title, the photo decides (Indian wear → Ethnic, western wear → Casual).
- Add fabric and measurements (optional).
- The listing is **In review**, not public.
- As **admin**: Admin panel → Review queue → approve (or reject with a reason the seller sees).
- Show the **Activity log**: every admin decision with who and when.

## 3. Ask the seller (chat)

- As **buyer** on the seller's item: **Ask the seller a question** and send a message.
- As **seller**: the chat icon in the header shows an unread count; open **Messages** and reply.
- Back as buyer: the reply appears in the open chat within a few seconds, without reloading.

## 4. Make an offer

- As **buyer** on the seller's item: **Make an offer** below the price.
- As **seller**: Offers → Offers on your items → **Counter**.
- As **buyer**: accept the counter. The product page and bag now use the agreed price for 48 hours.

## 5. Order workflow

- Buyer: checkout with a saved address, cash on delivery → a warm brand-coloured band sweeps across and the order confirmation appears behind it (skipped if the computer has reduced motion turned on).
- Seller: Orders to fulfil → **Accept** → **Mark as shipped** (courier + tracking number).
- Buyer: My orders shows the progress bar and tracking → **I've received it** → **Complete order**.
- Buyer: **Rate the seller** (stars + comment). The rating appears on the shop page and product cards.
- Every step sends an alert to the other person (bell icon).
- Cancelling or completing an order asks first in a ReWear dialog, and results show as a small note at the bottom of the screen (no browser pop-ups).

## 6. Problem reports (disputes)

- On a shipped or delivered order, buyer clicks **Report a problem** (e.g. "Not as described").
- The order can't be completed while the report is open.
- Admin → **Problem reports** → write a decision → **Refund the buyer** or **Reject report**.
  Both sides are notified, and the decision is in the activity log.

## 7. Report a listing and verified sellers

- As **buyer** on any live item: **Report it** under the details (fake, misdescribed, not allowed...). Reporting twice is refused politely.
- As **admin**: **Reported listings** groups reports per item → **Take listing down** (the seller sees the reason) or **Dismiss**.
- As **seller**: Account → **Verified seller** shows a checklist (mobile number, an approved listing, account a day old) → **Ask to be verified**.
- As **admin**: **Seller verification** shows the seller's record → **Approve badge**. The blue tick now shows on their cards, product pages and shop.

## 8. Seller stats and earnings

- As **seller**: My listings shows views (one per person per day), wishlist saves and questions for each item.
- Account menu → **Earnings**: earned, on the way, average per order, a 12-month chart, sales vs rentals, and a CSV download.

## 9. Admin overview

- Counts of listings by status, users, orders and sales value, plus banners for open reports and verification requests.
- Charts for the last 30 days: orders, sales value, new listings, new users.

## 10. Brand kit

- Footer → **Brand kit** (`/brand`): logo files to download, the colour palette (click a swatch to copy it, with its contrast rating), type, components, motion (press **Play it** to see the milestone sweep), photography, icons and voice.
- The same rules are written down in `DESIGN.md` for anyone building the site; the colours on the page are read straight from the Tailwind config, so the two can't drift apart.

## 11. On a phone

- Open the site at phone width (browser dev tools, or a real phone on the same Wi-Fi): Home, Shop, Sell, Saved and Bag sit in a tab bar at the bottom, with live counts.
- Share a ReWear link in WhatsApp: the preview shows the ReWear card (`og-image.png`). This needs the site on a public address with `VITE_SITE_URL` set.
- In a production build (`npm run build && npm run preview`), turn off Wi-Fi and open a page: a ReWear "You're offline" page appears instead of the browser error, and it reloads by itself when the connection is back.

## What's not in this version

- Online payment (UPI and card show "Coming soon"; Razorpay test mode is the next step).
- Emails (alerts are in-app only).
