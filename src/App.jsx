import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react'
import { strings } from './i18n.js'
import { PRICE, DEMO_MODE, PAY_MODE, upiLink, hasFreeTry, requestPayment } from './payments.js'
import * as I from './icons.jsx'

// Each tool loads only when opened, so the home screen appears quickly.
const PhotoTool = lazy(() => import('./tools/PhotoTool.jsx'))
const ResumeTool = lazy(() => import('./tools/ResumeTool.jsx'))
const BiodataTool = lazy(() => import('./tools/BiodataTool.jsx'))

const NAV = [
  { id: 'home', icon: I.Home },
  { id: 'photo', icon: I.Camera },
  { id: 'resume', icon: I.Doc },
  { id: 'biodata', icon: I.Ring }
]

// Links from the search pages open a tool directly, e.g. ?tool=photo&kb=20&w=200&h=230
function readLink() {
  const p = new URLSearchParams(window.location.search)
  const tool = ['photo', 'resume', 'biodata'].includes(p.get('tool')) ? p.get('tool') : null
  const num = (k) => (Number(p.get(k)) > 0 ? Number(p.get(k)) : null)
  const size = num('kb') ? { w: num('w'), h: num('h'), kb: num('kb') } : null
  return { tool, preset: p.get('preset'), size, lang: p.get('lang') === 'hi' ? 'hi' : null }
}

export default function App() {
  const [link] = useState(readLink)
  const [lang, setLang] = useState(() => {
    if (link.lang) return link.lang
    try { return localStorage.getItem('formready_lang') || 'en' } catch { return 'en' }
  })
  const [screen, setScreen] = useState(link.tool || 'home')
  const [preset, setPreset] = useState(link.preset || (link.size ? 'custom' : 'passport'))
  const [sheet, setSheet] = useState(false)
  const [toast, setToast] = useState(false)
  const resolver = useRef(null)
  const t = strings[lang]

  const toggleLang = () => {
    const next = lang === 'en' ? 'hi' : 'en'
    setLang(next)
    try { localStorage.setItem('formready_lang', next) } catch { /* ignore */ }
  }

  const confirmUi = useCallback(
    () => new Promise((resolve) => { resolver.current = resolve; setSheet(true) }),
    []
  )
  const closeSheet = (ok) => { setSheet(false); resolver.current?.(ok) }
  const authorize = useCallback(async (toolId) => {
    try {
      return await requestPayment(toolId, confirmUi)
    } catch {
      setToast(true)
      setTimeout(() => setToast(false), 4500)
      return false
    }
  }, [confirmUi])

  const open = (id, presetId) => {
    if (presetId) setPreset(presetId)
    setScreen(id)
    window.scrollTo(0, 0)
  }

  const toolProps = (id) => ({ t, lang, authorize: () => authorize(id), willPay: !hasFreeTry(id) })

  return (
    <div className="shell">
      {screen === 'home' ? (
        <Home t={t} lang={lang} onLang={toggleLang} open={open} />
      ) : (
        <>
          <header className="bar">
            <h1>{t.nav[screen]}</h1>
            <button className="pill" onClick={toggleLang}>{t.language}</button>
          </header>
          <Suspense fallback={<p className="loading">{t.working}</p>}>
            {screen === 'photo' && (
              <PhotoTool key={preset} {...toolProps('photo')} initialPreset={preset}
                initialSize={preset === 'custom' ? link.size : null} />
            )}
            {screen === 'resume' && <ResumeTool {...toolProps('resume')} />}
            {screen === 'biodata' && <BiodataTool {...toolProps('biodata')} />}
          </Suspense>
        </>
      )}

      <nav className="nav" aria-label="Main">
        {NAV.map(({ id, icon: Icon }) => (
          <button key={id} className={screen === id ? 'on' : ''} onClick={() => open(id)}
            aria-current={screen === id ? 'page' : undefined}>
            <span className="nav-ic"><Icon /></span>
            <span>{t.nav[id]}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="toast" role="alert">{t.payFailed}</div>}

      {sheet && (
        <div className="scrim" onClick={() => closeSheet(false)}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="grab" />
            <div className="amount"><small>₹</small>{PRICE}</div>
            <h2>{t.payTitle}</h2>
            <p>{t.payNote}</p>
            {DEMO_MODE && <p className="demo">{t.demoPay}</p>}
            {PAY_MODE === 'upi' ? (
              <UpiPanel t={t} onPaid={() => closeSheet(true)} />
            ) : (
              <button className="cta" onClick={() => closeSheet(true)}>{t.payCta.replace('{price}', PRICE)}</button>
            )}
            <button className="quiet" onClick={() => closeSheet(false)}>{t.cancel}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// UPI payment: tap to open any UPI app, or scan the QR from another phone.
// The user then enters the 12-digit UTR from their payment receipt.
function UpiPanel({ t, onPaid }) {
  const [qr, setQr] = useState('')
  const [utr, setUtr] = useState('')
  const link = upiLink()
  const valid = /^\d{12}$/.test(utr)

  useEffect(() => {
    import('qrcode').then(({ default: QRCode }) =>
      QRCode.toDataURL(link, { width: 360, margin: 1, color: { dark: '#11142b', light: '#ffffff' } })
    ).then(setQr)
  }, [link])

  const confirm = () => {
    try {
      const log = JSON.parse(localStorage.getItem('formready_utrs') || '[]')
      log.push({ utr, at: new Date().toISOString() })
      localStorage.setItem('formready_utrs', JSON.stringify(log))
    } catch { /* storage blocked */ }
    onPaid()
  }

  return (
    <div className="upi">
      <a className="cta" href={link}>{t.upiOpen}</a>
      {qr && <img className="upi-qr" src={qr} alt="UPI QR code" />}
      <p className="upi-or">{t.upiScan}</p>
      <label className="field">
        <span>{t.upiUtr}</span>
        <input inputMode="numeric" maxLength={12} placeholder="123456789012" value={utr}
          onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))} />
      </label>
      <button className="cta" disabled={!valid} onClick={confirm}>{t.upiDone}</button>
    </div>
  )
}

function Home({ t, onLang, open }) {
  const tiles = [
    { id: 'photo', p: 'passport', icon: I.Person, name: t.home.passport, sub: '35×45 mm', tone: 'a' },
    { id: 'photo', p: 'exam', icon: I.Image, name: t.home.exam, sub: '≤ 50 KB', tone: 'b' },
    { id: 'photo', p: 'sign', icon: I.Pen, name: t.home.sign, sub: '≤ 20 KB', tone: 'c' },
    { id: 'resume', icon: I.Doc, name: t.home.resume, sub: 'PDF', tone: 'd' },
    { id: 'biodata', icon: I.Ring, name: t.home.biodata, sub: 'PDF', tone: 'e' }
  ]
  return (
    <>
      <header className="bar home-bar">
        <div className="brand"><img className="logo" src="./logo.svg" alt="" />FormReady</div>
        <button className="pill" onClick={onLang}>{t.language}</button>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h2>{t.home.headline}</h2>
          <p>{t.home.sub}</p>
          <button className="cta light" onClick={() => open('photo', 'passport')}>{t.home.start}</button>
        </div>
        <div className="viewfinder" aria-hidden="true">
          <div className="vf-photo"><span className="vf-head" /><span className="vf-body" /></div>
          <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
          <span className="stamp">≤ 50 KB</span>
        </div>
      </section>

      <h3 className="sec">{t.home.what}</h3>
      <div className="tiles">
        {tiles.map((x) => {
          const Icon = x.icon
          return (
            <button key={x.name} className={`tile ${x.tone}`} onClick={() => open(x.id, x.p)}>
              <span className="tile-ic"><Icon /></span>
              <b>{x.name}</b>
              <small>{x.sub}</small>
            </button>
          )
        })}
      </div>

      <ul className="trust">
        <li><I.Lock /> {t.home.t1}</li>
        <li><I.Check /> {t.home.t2}</li>
        <li><I.Check /> {t.price}</li>
      </ul>

      <h3 className="sec">{t.home.howTitle}</h3>
      <ol className="how">
        {t.home.how.map((s) => <li key={s}>{s}</li>)}
      </ol>

      <h3 className="sec">{t.home.faqTitle}</h3>
      <div className="faq">
        {t.home.faq.map(({ q, a }) => (
          <details key={q}>
            <summary>{q}</summary>
            <p>{a}</p>
          </details>
        ))}
      </div>

      <h3 className="sec">{t.home.guidesTitle}</h3>
      <ul className="guides">
        {GUIDES.map(([slug, label]) => <li key={slug}><a href={`./${slug}/`}>{label}</a></li>)}
      </ul>
    </>
  )
}

// The search pages built by scripts/seo-pages.mjs.
const GUIDES = [
  ['resize-photo-to-20kb', 'Resize photo to 20 KB'],
  ['resize-photo-to-50kb', 'Resize photo to 50 KB'],
  ['resize-photo-to-100kb', 'Resize photo to 100 KB'],
  ['resize-signature-online', 'Resize signature online'],
  ['passport-size-photo-maker', 'Passport size photo maker'],
  ['compress-photo-for-exam-form', 'Compress photo for exam form'],
  ['resume-maker-pdf', 'Resume maker (PDF)'],
  ['marriage-biodata-maker', 'Marriage biodata maker'],
  ['photo-size-kam-kaise-kare', 'फोटो का साइज़ कम कैसे करें']
]
