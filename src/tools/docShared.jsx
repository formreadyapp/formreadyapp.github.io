import { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { saveFile } from '../saveFile.js'
import { PRICE } from '../payments.js'

export const PAGE_W = 794 // A4 at 96 dpi
export const PAGE_H = 1123

// Shows the A4 page shrunk to fit the screen. Export captures it at full size.
export function ScaledPage({ children }) {
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => setScale(Math.min(1, (Math.min(document.documentElement.clientWidth, 560) - 40) / PAGE_W))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div className="page-frame" style={{ width: PAGE_W * scale, height: PAGE_H * scale }}>
      <div id="doc-scale" style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        {children}
      </div>
    </div>
  )
}

// Renders #doc-page to a one-page A4 PDF and saves it.
export async function exportPdf(filename) {
  const el = document.getElementById('doc-page')
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    onclone: (doc) => { doc.getElementById('doc-scale').style.transform = 'none' }
  })
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297)
  await saveFile(pdf.output('blob'), filename)
}

export function readPhoto(file, cb) {
  if (!file) return
  const r = new FileReader()
  r.onload = () => cb(String(r.result))
  r.readAsDataURL(file)
}

export function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>
}

// Fixed bar above the bottom nav holding the main action.
export function CtaBar({ t, busy, willPay, onClick, disabled, children }) {
  return (
    <div className="ctabar">
      {children || (
        <button className="cta" disabled={disabled || busy} onClick={onClick}>
          {busy ? t.working : willPay ? t.payCta.replace('{price}', PRICE) : t.download}
          {!busy && !willPay && <span className="freepill">{t.freeBadge}</span>}
        </button>
      )}
    </div>
  )
}

// Two-way switch: edit the form or see the page.
export function Segmented({ value, onChange, options }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.id} role="tab" aria-selected={value === o.id} className={value === o.id ? 'on' : ''}
          onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

export function Swatches({ value, onChange, options }) {
  return (
    <div className="swatches">
      {options.map((o) => (
        <button key={o.id} aria-label={o.id} className={value === o.id ? 'on' : ''}
          style={{ background: o.color }} onClick={() => onChange(o.id)} />
      ))}
    </div>
  )
}

// Collapsible form section.
export function Section({ title, open, onToggle, children }) {
  return (
    <section className={`acc ${open ? 'open' : ''}`}>
      <button className="acc-h" onClick={onToggle} aria-expanded={open}>{title}<i /></button>
      {open && <div className="acc-b">{children}</div>}
    </section>
  )
}
