import { useState } from 'react'
import { ScaledPage, exportPdf, readPhoto, Field, CtaBar, Segmented, Swatches, Section } from './docShared.jsx'
import * as I from '../icons.jsx'

const GROUPS = [
  { id: 'personal', keys: ['dob', 'tob', 'pob', 'height', 'complexion'] },
  { id: 'faith', keys: ['religion', 'caste', 'gotra', 'rashi'] },
  { id: 'work', keys: ['education', 'occupation', 'income'] },
  { id: 'family', keys: ['father', 'mother', 'siblings', 'address', 'contact'] }
]
const FIELDS = GROUPS.flatMap((g) => g.keys)
const COLORS = [
  { id: 'maroon', color: '#7a1f2b' },
  { id: 'gold', color: '#a87414' },
  { id: 'teal', color: '#0f6b6b' }
]

export default function BiodataTool({ t, authorize, willPay, lang }) {
  const b = t.biodata
  const [view, setView] = useState('details')
  const [open, setOpen] = useState('personal')
  const [d, setD] = useState({ name: '' })
  const [photo, setPhoto] = useState('')
  const [blessing, setBlessing] = useState(true)
  const [style, setStyle] = useState('maroon')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setD({ ...d, [k]: e.target.value })
  const toggle = (id) => setOpen(open === id ? '' : id)

  const onDownload = async () => {
    setBusy(true)
    try {
      if (await authorize()) await exportPdf(`biodata-${(d.name || 'me').replace(/\s+/g, '-')}.pdf`)
    } finally { setBusy(false) }
  }

  return (
    <div className="screen">
      <Segmented value={view} onChange={setView} options={[{ id: 'details', label: t.seg.details }, { id: 'preview', label: t.seg.preview }]} />

      {view === 'details' && (
        <>
          <div className="namecard">
            <label className="avatar">
              <input type="file" accept="image/*" hidden onChange={(e) => readPhoto(e.target.files?.[0], setPhoto)} />
              {photo ? <img src={photo} alt="" /> : <I.Camera />}
            </label>
            <div className="nc-fields">
              <Field label={b.name}><input value={d.name} onChange={set('name')} /></Field>
              <label className="switch">
                <input type="checkbox" checked={blessing} onChange={(e) => setBlessing(e.target.checked)} />
                <i /> {b.header}
              </label>
            </div>
          </div>

          {GROUPS.map((g) => (
            <Section key={g.id} title={t.biodataGroups[g.id]} open={open === g.id} onToggle={() => toggle(g.id)}>
              {g.keys.map((k) => (
                <Field key={k} label={b[k]}><input value={d[k] || ''} onChange={set(k)} /></Field>
              ))}
            </Section>
          ))}

          <div className="stylerow"><span>{t.template}</span><Swatches value={style} onChange={setStyle} options={COLORS} /></div>
        </>
      )}

      <div className={view === 'preview' ? 'previewbox' : 'previewbox offscreen'}>
        <ScaledPage>
          <div id="doc-page" className={`biodata ${style}`}>
            {blessing && <p className="blessing">॥ श्री गणेशाय नमः ॥</p>}
            <h1>{lang === 'hi' ? 'विवाह बायोडाटा' : 'Marriage Biodata'}</h1>
            <div className="b-top">
              <h2>{d.name || b.name}</h2>
              {photo && <img src={photo} alt="" className="b-photo" />}
            </div>
            <table>
              <tbody>
                {FIELDS.filter((k) => d[k]).map((k) => (
                  <tr key={k}><th>{b[k]}</th><td>{d[k]}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScaledPage>
      </div>

      <CtaBar t={t} busy={busy} willPay={willPay} onClick={onDownload} note={willPay ? null : t.freeBadge} />
    </div>
  )
}
