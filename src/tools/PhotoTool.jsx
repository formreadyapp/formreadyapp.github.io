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
const isSignature = (id) => id === 'sign' || id === 'sign2'

// Turns grey or shadowed paper white and makes the ink a little darker,
// so signature scans pass form checks. Paper brightness is estimated from the image itself.
function whitenPaper(ctx, W, H, bg) {
  const data = ctx.getImageData(0, 0, W, H)
  const px = data.data
  let sum = 0
  for (let i = 0; i < px.length; i += 4) sum += 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
  const threshold = (sum / (px.length / 4)) * 0.82
  const r = parseInt(bg.slice(1, 3), 16), g = parseInt(bg.slice(3, 5), 16), b = parseInt(bg.slice(5, 7), 16)
  for (let i = 0; i < px.length; i += 4) {
    const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]
    if (lum > threshold) { px[i] = r; px[i + 1] = g; px[i + 2] = b } else {
      px[i] *= 0.7; px[i + 1] *= 0.7; px[i + 2] *= 0.7
    }
  }
  ctx.putImageData(data, 0, 0)
}

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
  const [clean, setClean] = useState(isSignature(start.id))
  const [dragged, setDragged] = useState(false)
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef(null)
  const stageRef = useRef(null)
  const drag = useRef(null)

  const W = Math.max(20, Math.min(2000, Number(w) || 0))
  const H = Math.max(20, Math.min(2000, Number(h) || 0))
  const sign = isSignature(presetId)

  // Zoom 1 fills the frame; the lowest zoom shows the whole picture.
  const minZoom = img
    ? Math.min(1, Math.min(W / img.width, H / img.height) / Math.max(W / img.width, H / img.height))
    : 1

  const pickPreset = (id) => {
    const p = PRESETS.find((x) => x.id === id)
    setPresetId(id); setW(p.w); setH(p.h); setKb(p.kb)
    setEditing(id === 'custom'); setOff({ x: 0, y: 0 }); setZoom(1)
    setClean(isSignature(id))
  }

  useEffect(() => {
    if (!img) return
    const c = canvasRef.current
    c.width = W; c.height = H
    const ctx = c.getContext('2d', { willReadFrequently: true })
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)
    const base = Math.max(W / img.width, H / img.height) * zoom
    const dw = img.width * base, dh = img.height * base
    const dx = (W - dw) / 2 + clamp(off.x, Math.abs(dw - W) / 2)
    const dy = (H - dh) / 2 + clamp(off.y, Math.abs(dh - H) / 2)
    ctx.drawImage(img, dx, dy, dw, dh)
    if (clean) whitenPaper(ctx, W, H, bg)

    // Show the result as large as the screen allows, even when it is only 140×60 pixels.
    const boxW = (stageRef.current?.clientWidth || 320) - 28
    const scale = Math.min(boxW / W, (window.innerHeight * 0.44) / H)
    c.style.width = `${Math.round(W * scale)}px`
    c.style.height = `${Math.round(H * scale)}px`

    let cancelled = false
    const timer = setTimeout(() => {
      compress(c, Number(kb) || 50).then((r) => { if (!cancelled) setResult(r) })
    }, 150)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [img, W, H, kb, bg, zoom, off, clean])

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setImg(await loadImage(f))
    setZoom(1); setOff({ x: 0, y: 0 }); setDragged(false)
    e.target.value = ''
  }

  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y }
    setDragged(true)
  }
  const onMove = (e) => {
    if (!drag.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const k = W / rect.width
    // Keep the stored position inside the limits, so dragging back responds at once.
    const s = Math.max(W / img.width, H / img.height) * zoom
    const mx = Math.abs(img.width * s - W) / 2, my = Math.abs(img.height * s - H) / 2
    setOff({
      x: clamp(drag.current.ox + (e.clientX - drag.current.x) * k, mx),
      y: clamp(drag.current.oy + (e.clientY - drag.current.y) * k, my)
    })
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

      <div className="stage" ref={stageRef}>
        {!img ? (
          <label className="empty">
            <input type="file" accept="image/*" onChange={onFile} />
            <span className="empty-ic"><I.Camera /></span>
            <b>{sign ? t.chooseSign : t.chooseCta}</b>
            <small>{sign ? t.signTip : t.presetNote}</small>
          </label>
        ) : (
          <>
            <div className="frame">
              <canvas ref={canvasRef}
                onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
              {!dragged && <span className="drag-hint"><I.Move /> {t.dragHint}</span>}
            </div>
            <div className="zoomrow">
              <I.Image style={{ width: 16, height: 16 }} />
              <input type="range" aria-label={t.zoom} min={minZoom.toFixed(2)} max="3" step="0.01" value={zoom} onChange={(e) => setZoom(+e.target.value)} />
              <I.Image style={{ width: 24, height: 24 }} />
            </div>
            <div className="toolrow">
              <label className="switch">
                <input type="checkbox" checked={clean} onChange={(e) => setClean(e.target.checked)} />
                <i /> {t.cleanPaper}
              </label>
              <label className="textbtn">
                <input type="file" accept="image/*" onChange={onFile} hidden />
                {t.changePhoto}
              </label>
            </div>
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

      <CtaBar t={t} busy={busy} willPay={willPay} onClick={onDownload} disabled={!img || !result}>
        {!img ? (
          <label className="cta">
            <input type="file" accept="image/*" onChange={onFile} hidden />
            {sign ? t.chooseSign : t.chooseCta}
          </label>
        ) : null}
      </CtaBar>
    </div>
  )
}
