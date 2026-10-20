import { useState } from 'react'
import { ScaledPage, exportPdf, readPhoto, Field, CtaBar, Segmented, Swatches, Section } from './docShared.jsx'
import * as I from '../icons.jsx'

const emptyEdu = () => ({ school: '', place: '', year: '' })
const emptyExp = () => ({ role: '', company: '', period: '', details: '' })
const COLORS = [
  { id: 'green', color: '#1a6b4f' },
  { id: 'blue', color: '#1c4f9c' },
  { id: 'dark', color: '#2b2b33' }
]

export default function ResumeTool({ t, authorize, willPay }) {
  const r = t.resume
  const [view, setView] = useState('details')
  const [open, setOpen] = useState('basic')
  const [d, setD] = useState({
    name: 'Rahul Sharma', title: 'Sales Executive', phone: '98765 43210', email: 'rahul@example.com',
    address: 'Hyderabad, Telangana', summary: 'Hardworking and friendly fresher looking for a role where I can learn and grow.',
    skills: 'MS Office, Communication, Teamwork', languages: 'Hindi, English, Telugu'
  })
  const [edu, setEdu] = useState([{ school: 'B.Com', place: 'Osmania University', year: '2024' }])
  const [exp, setExp] = useState([])
  const [photo, setPhoto] = useState('')
  const [style, setStyle] = useState('green')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setD({ ...d, [k]: e.target.value })
  const upd = (list, setList, i, k) => (e) => setList(list.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))
  const toggle = (id) => setOpen(open === id ? '' : id)

  const onDownload = async () => {
    setBusy(true)
    try {
      if (await authorize()) await exportPdf(`resume-${(d.name || 'me').replace(/\s+/g, '-')}.pdf`)
    } finally { setBusy(false) }
  }

  const skills = d.skills.split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <div className="screen">
      <Segmented value={view} onChange={setView} options={[{ id: 'details', label: t.seg.details }, { id: 'preview', label: t.seg.preview }]} />

      {view === 'details' && (
        <>
          <Section title={t.personal} open={open === 'basic'} onToggle={() => toggle('basic')}>
            <Field label={r.name}><input value={d.name} onChange={set('name')} /></Field>
            <Field label={r.title}><input value={d.title} onChange={set('title')} /></Field>
            <Field label={r.phone}><input value={d.phone} onChange={set('phone')} inputMode="tel" /></Field>
            <Field label={r.email}><input value={d.email} onChange={set('email')} inputMode="email" /></Field>
            <Field label={r.address}><input value={d.address} onChange={set('address')} /></Field>
            <Field label={r.photo}>
              <label className="upload"><input type="file" accept="image/*" hidden onChange={(e) => readPhoto(e.target.files?.[0], setPhoto)} />
                <I.Camera /> {photo ? t.changePhoto : t.chooseCta}</label>
            </Field>
            <Field label={r.summary}><textarea rows="3" value={d.summary} onChange={set('summary')} /></Field>
          </Section>

          <Section title={r.education} open={open === 'edu'} onToggle={() => toggle('edu')}>
            {edu.map((e, i) => (
              <div className="group" key={i}>
                <Field label={r.school}><input value={e.school} onChange={upd(edu, setEdu, i, 'school')} /></Field>
                <Field label={r.place}><input value={e.place} onChange={upd(edu, setEdu, i, 'place')} /></Field>
                <Field label={r.year}><input value={e.year} onChange={upd(edu, setEdu, i, 'year')} inputMode="numeric" /></Field>
                <button className="textbtn danger" onClick={() => setEdu(edu.filter((_, j) => j !== i))}><I.Trash /> {t.remove}</button>
              </div>
            ))}
            <button className="addbtn" onClick={() => setEdu([...edu, emptyEdu()])}><I.Plus /> {r.education}</button>
          </Section>

          <Section title={r.experience} open={open === 'exp'} onToggle={() => toggle('exp')}>
            {exp.map((e, i) => (
              <div className="group" key={i}>
                <Field label={r.role}><input value={e.role} onChange={upd(exp, setExp, i, 'role')} /></Field>
                <Field label={r.company}><input value={e.company} onChange={upd(exp, setExp, i, 'company')} /></Field>
                <Field label={r.period}><input value={e.period} onChange={upd(exp, setExp, i, 'period')} /></Field>
                <Field label={r.details}><textarea rows="2" value={e.details} onChange={upd(exp, setExp, i, 'details')} /></Field>
                <button className="textbtn danger" onClick={() => setExp(exp.filter((_, j) => j !== i))}><I.Trash /> {t.remove}</button>
              </div>
            ))}
            <button className="addbtn" onClick={() => setExp([...exp, emptyExp()])}><I.Plus /> {r.experience}</button>
          </Section>

          <Section title={r.skills.replace(/ \(.*\)/, '')} open={open === 'skills'} onToggle={() => toggle('skills')}>
            <Field label={r.skills}><input value={d.skills} onChange={set('skills')} /></Field>
            <Field label={r.languages}><input value={d.languages} onChange={set('languages')} /></Field>
          </Section>

          <div className="stylerow"><span>{t.template}</span><Swatches value={style} onChange={setStyle} options={COLORS} /></div>
        </>
      )}

      {/* Always mounted so PDF export works from either tab. */}
      <div className={view === 'preview' ? 'previewbox' : 'previewbox offscreen'}>
        <ScaledPage>
          <div id="doc-page" className={`resume ${style}`}>
            {/* Left column: photo, contact, skills, languages. Right column: the story. */}
            <aside className="r-side">
              {photo && <img src={photo} alt="" className="r-photo" />}
              <h3>{r.contact}</h3>
              {d.phone && <p>{d.phone}</p>}
              {d.email && <p className="r-break">{d.email}</p>}
              {d.address && <p>{d.address}</p>}
              {skills.length > 0 && <>
                <h3>{r.skills.replace(/ \(.*\)/, '')}</h3>
                <ul>{skills.map((s) => <li key={s}>{s}</li>)}</ul>
              </>}
              {d.languages && <><h3>{r.languages}</h3><p>{d.languages}</p></>}
            </aside>
            <section className="r-main">
              <h1>{d.name}</h1>
              {d.title && <h2>{d.title}</h2>}
              {d.summary && <><h3>{r.summary}</h3><p>{d.summary}</p></>}
              {exp.length > 0 && <h3>{r.experience}</h3>}
              {exp.map((e, i) => (
                <div className="r-item" key={i}>
                  <p className="r-row"><b>{e.role}</b>{e.period && <span>{e.period}</span>}</p>
                  {e.company && <p className="sub">{e.company}</p>}
                  {e.details && <p>{e.details}</p>}
                </div>
              ))}
              {edu.length > 0 && <h3>{r.education}</h3>}
              {edu.map((e, i) => (
                <div className="r-item" key={i}>
                  <p className="r-row"><b>{e.school}</b>{e.year && <span>{e.year}</span>}</p>
                  {e.place && <p className="sub">{e.place}</p>}
                </div>
              ))}
            </section>
          </div>
        </ScaledPage>
      </div>

      <CtaBar t={t} busy={busy} willPay={willPay} onClick={onDownload} />
    </div>
  )
}
