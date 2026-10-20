# FormReady – launch checklist

## Run the website locally
    npm install
    npm run dev

## 1. Website payments (Razorpay: UPI, cards, netbanking, wallets)
1. Create a Razorpay account and finish KYC: https://razorpay.com
2. Copy `.env.example` to `.env` and set `VITE_RAZORPAY_KEY_ID=rzp_live_xxxxx` (use `rzp_test_` first).
3. `npm run build`, then upload the `dist` folder to any static host (Netlify, Vercel, Cloudflare Pages).
   Without a key the site runs in DEMO mode (fake payment).

Note: this checks payment on the user's device only. For stronger protection, add a small server that
creates Razorpay orders and verifies the signature before unlocking a download.

## 2. Android app payments (Google Play Billing)
Play requires its own billing for digital goods inside the app (UPI/Razorpay are not allowed there).
1. Create a Google Play Developer account ($25 one time).
2. Play Console > your app > Monetize > In-app products > Create product:
   - Product ID: `download_10`  (must match `PLAY_PRODUCT_ID` in `src/payments.js`)
   - Type: one-time (consumable), price ₹10.
3. Billing only works from a build uploaded to a Play testing track (Internal testing), with your
   account added as a licensed tester.

## 3. Build the Android app
1. Install Android Studio.
2. `npm run android:sync` then `npx cap open android`.
3. Build > Generate Signed App Bundle (AAB). Keep the keystore file and password safe.
4. Upload the AAB in Play Console.

## 4. Play Store listing
- App name (max 30 chars): `FormReady: Photo Resizer`
- Short description: Passport photo, exam form photo and signature resizer. Resume and biodata maker.
- Needs: privacy policy URL, 2+ phone screenshots, 512x512 icon (`assets/icon-only.png`).
