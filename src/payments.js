// Payment layer. Every paid download goes through requestPayment().
//
//  - Android app  -> Google Play Billing (required by Play for digital goods).
//                    Create an in-app product with ID `download_10`, price ₹10,
//                    in Play Console > Monetize > In-app products.
//  - Website      -> Razorpay Checkout (UPI, cards, netbanking, wallets).
//                    Put your key in .env as VITE_RAZORPAY_KEY_ID=rzp_live_xxx
//  - No key set   -> DEMO mode: payment is simulated (development only).

import { Capacitor } from '@capacitor/core'

export const PRICE = 10
export const PLAY_PRODUCT_ID = 'download_10'

const RZP_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID
const IS_NATIVE = Capacitor.isNativePlatform()

// Your own UPI ID (for example yourname@okhdfcbank). Website only: Play Store
// rules do not allow UPI/QR payments for digital goods inside the Android app.
export const UPI_ID = import.meta.env.VITE_UPI_ID
export const UPI_NAME = import.meta.env.VITE_UPI_NAME || 'FormReady'

export const PAY_MODE = IS_NATIVE ? 'play' : UPI_ID ? 'upi' : RZP_KEY ? 'razorpay' : 'demo'
export const DEMO_MODE = PAY_MODE === 'demo'

export function upiLink() {
  const p = new URLSearchParams({ pa: UPI_ID, pn: UPI_NAME, am: String(PRICE), cu: 'INR', tn: 'FormReady download' })
  return `upi://pay?${p.toString()}`
}

const FREE_KEY = 'formready_free_used'

function read(key) {
  try { return localStorage.getItem(key) } catch { return null }
}
function write(key, value) {
  try { localStorage.setItem(key, value) } catch { /* storage blocked */ }
}

export function hasFreeTry(toolId) {
  return read(`${FREE_KEY}_${toolId}`) !== '1'
}

export function markFreeUsed(toolId) {
  write(`${FREE_KEY}_${toolId}`, '1')
}

// ---- Google Play Billing (Android app) ----
async function chargePlay() {
  const { NativePurchases, PURCHASE_TYPE } = await import('@capgo/native-purchases')
  const { isBillingSupported } = await NativePurchases.isBillingSupported()
  if (!isBillingSupported) throw new Error('billing-unavailable')
  try {
    await NativePurchases.purchaseProduct({
      productIdentifier: PLAY_PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
      isConsumable: true // consumed after purchase so it can be bought again
    })
    return true
  } catch (e) {
    if (/cancel/i.test(String(e?.message || e))) return false
    throw e
  }
}

// ---- Razorpay Checkout (website) ----
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload = resolve
    s.onerror = () => reject(new Error('razorpay-load'))
    document.head.appendChild(s)
  })
}

async function chargeRazorpay() {
  await loadRazorpay()
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      key: RZP_KEY,
      amount: PRICE * 100, // paise
      currency: 'INR',
      name: 'FormReady',
      description: 'Download',
      theme: { color: '#3342f0' },
      handler: () => resolve(true),
      modal: { ondismiss: () => resolve(false) }
    })
    rzp.on('payment.failed', () => reject(new Error('payment-failed')))
    rzp.open()
  })
}

async function charge() {
  if (PAY_MODE === 'play') return chargePlay()
  if (PAY_MODE === 'upi') return true // the UPI sheet already collected the UTR
  if (PAY_MODE === 'razorpay') return chargeRazorpay()
  return true // demo
}

// Resolves true if the user may download now. `confirmUi` shows the pay sheet.
// Throws on a real payment error; resolves false if the user cancelled.
export async function requestPayment(toolId, confirmUi) {
  if (hasFreeTry(toolId)) {
    markFreeUsed(toolId)
    return true
  }
  const ok = await confirmUi()
  if (!ok) return false
  return charge()
}
