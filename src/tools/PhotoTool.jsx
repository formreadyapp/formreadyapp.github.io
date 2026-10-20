import { useEffect, useRef, useState } from 'react'
import { saveFile } from '../saveFile.js'
import { CtaBar } from './docShared.jsx'
import * as I from '../icons.jsx'

// Typical sizes only. Exams differ, so every value stays editable.
const PRESETS = [
  { id: 'passport', label: 'Passport', w: 413, h: 531, kb: 200 },
  { id: 'exam', label: 'Exam photo', w: 200, h: 230, kb: 50 },
  { id: 'exam20', label: '3.5×4.5 cm', w: 354, h: 453, kb: 100 },
  { id: 'sign', label: 'Signature', w: 140, h: 60, kb: 20 },
  { id: 'sign2', label: 'Signature L', w: 200, h: 80, kb: 30 },
  { id: 'custom', label: 'Custom', w: 300, h: 400, kb: 100 }
]

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

const toBlob = (canvas, q) => new Promise((res) => canvas.toBlob(res, 'image/jpeg', q))

// Binary-search JPEG quality to land under the KB limit.
async function compress(canvas, maxKB) {
  const limit = maxKB * 1024
  let lo = 0.05, hi = 0.95
  let best = await toBlob(canvas, lo)
  if (best.size > limit) return { blob: best, ok: false }
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2
    const b = await toBlob(canvas, mid)
    if (b.size <= limit) { best = b; lo = mid } else { hi = mid }
  }
  return { blob: best, ok: true }
}

const clamp = (v, m) => Math.max(-m, Math.min(m, v))

export default function PhotoTool({ t, authorize, willPay, initialPreset, initialSize }) {
  const base = PRESETS.find((p) => p.id === initialPreset) || PRESETS[0]
  const start = initialSize
    ? { ...base, w: initialSize.w || base.w, h: initialSize.h || base.h, kb: initialSize.kb }
    : base
  const [img, setImg] = useState(null)
  const [presetId, setPresetId] = useState(start.id)
  const [w, setW] = useState(start.w)
  const [h, setH] = useState(start.h)
  const [kb, setKb] = useState(start.kb)
  const [bg, setBg] = useState('#ffffff')
  const [zoom, setZoom] = useState(1)
  const [off, setOff] = useState({ x: 0, y: 0 }) // pan, in output pixels
  const [editing, setEditing] = useState(false)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef(null)
  const drag = useRef(null)

  const W = Math.max(20, Math.min(2000, Number(w) || 0))
  const H = Math.max(20, Math.min(2000, Number(h) || 0))

  const pickPreset = (id) => {
    const p = PRESETS.find((x) => x.id === id)
    setPresetId(id); setW(p.w); setH(p.h); setKb(p.kb)
    setEditing(id === 'custom'); setOff({ x: 0, y: 0 })
  }

  useEffect(() => {
    if (!img) return
    const c = canvasRef.current
    c.width = W; c.height = H
    const ctx = c.getContext('2d')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    const base = Math.max(W / img.width, H / img.height) * zoom
    const dw = img.width * base, dh = img.height * base
    const dx = (W - dw) / 2 + clamp(off.x, Math.max(0, (dw - W) / 2))
    const dy = (H - dh) / 2 + clamp(off.y, Math.max(0, (dh - H) / 2))
    ctx.drawImage(img, dx, dy, dw, dh)

    let cancelled = false
    const timer = setTimeout(() => {
      compress(c, Number(kb) || 50).then((r) => { if (!cancelled) setResult(r) })
    }, 150)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [img, W, H, kb, bg, zoom, off])

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImg(await loadImage(f))
    setZoom(1); setOff({ x: 0, y: 0 })
    e.target.value = ''
  }

  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }
  }
  const onMove = (e) => {
    if (!drag.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const k = W / rect.width
    setOff({ x: drag.current.ox + (e.clientX - drag.current.x) * k, y: drag.current.oy + (e.clientY - drag.current.y) * k })
  }
  const onUp = () => { drag.current = null }

  const onDownload = async () => {
    if (!result) return
    setBusy(true)
    try {
      if (await authorize()) await saveFile(result.blob, `formready-${presetId}-${W}x${H}.jpg`)
    } finally { setBusy(false) }
  }

  const kbNow = result ? (result.blob.size / 1024).toFixed(1) : null
  const aspect = `${W} / ${H}`

  return (
    <div className="screen">
      <div className="chips" role="radiogroup" aria-label={t.preset}>
        {PRESETS.map((p) => (
          <button key={p.id} role="radio" aria-checked={presetId === p.id}
            className={presetId === p.id ? 'on' : ''} onClick={() => pickPreset(p.id)}>{p.label}</button>
        ))}
      </div>

      <div className="specline">
        <span><b>{W} × {H}</b> px · max <b>{kb}</b> KB</span>
        <button className="textbtn" onClick={() => setEditing(!editing)}>{t.editSize}</button>
      </div>

      {editing && (
        <div className="editgrid">
          <label><span>{t.width}</span><input type="number" inputMode="numeric" value={w} onChange={(e) => { setW(e.target.value); setPresetId('custom') }} /></label>
          <label><span>{t.height}</span><input type="number" inputMode="numeric" value={h} onChange={(e) => { setH(e.target.value); setPresetId('custom') }} /></label>
          <label><span>{t.maxKB}</span><input type="number" inputMode="numeric" value={kb} onChange={(e) => { setKb(e.target.value); setPresetId('custom') }} /></label>
          <label><span>{t.bg}</span><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></label>
        </div>
      )}

      <div className="stage">
        {!img ? (
          <label className="empty">
            <input type="file" accept="image/*" onChange={onFile} />
            <span className="empty-ic"><I.Camera /></span>
            <b>{t.chooseCta}</b>
            <small>{t.presetNote}</small>
          </label>
        ) : (
          <>
            <div className="frame" style={{ aspectRatio: aspect, maxHeight: '44vh' }}>
              <canvas ref={canvasRef}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
              <span className="drag-hint"><I.Move /> {t.dragHint}</span>
            </div>
            <div className="zoomrow">
              <I.Image style={{ width: 16, height: 16 }} />
              <input type="range" aria-label={t.zoom} min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(+e.target.value)} />
              <I.Image style={{ width: 24, height: 24 }} />
            </div>
            <label className="textbtn center">
              <input type="file" accept="image/*" onChange={onFile} hidden />
              {t.changePhoto}
            </label>
          </>
        )}
      </div>

      {img && result && (
        <div className={`sizechip ${result.ok ? 'ok' : 'bad'}`}>
          {result.ok ? <I.Check /> : null}
          <span>{kbNow} KB <em>/ {kb} KB</em></span>
          {!result.ok && <small>{t.tooBig}</small>}
        </div>
      )}

      <CtaBar t={t} busy={busy} willPay={willPay} onClick={onDownload} disabled={!img || !result}
        note={willPay ? null : t.freeBadge}>
        {!img ? (
          <label className="cta">
            <input type="file" accept="image/*" onChange={onFile} hidden />
            {t.chooseCta}
          </label>
        ) : null}
      </CtaBar>
    </div>
  )
}
