// Minutes of Wow product post: 1080x1350, product photo on a kraft/cream card
// with the brand's red and green. Uses the product photos in ./img.
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

const C = { bg: '#f6ecd9', card: '#ffffff', red: '#c4161c', green: '#1f4d2b', ink: '#2a1d14', chip: '#e3eedd' }
const SERIF = 'Georgia, DejaVu Serif, serif'
const SANS = 'Segoe UI, DejaVu Sans, Arial, sans-serif'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function wrap(text, max) {
  const lines = []
  let line = ''
  for (const word of text.split(/\s+/)) {
    if ((line + ' ' + word).trim().length > max) { lines.push(line); line = word } else { line = (line + ' ' + word).trim() }
  }
  if (line) lines.push(line)
  return lines
}

// Rough text width so badge chips fit their labels.
const textWidth = (s, size) => s.length * size * 0.56

export async function renderFood(post) {
  const photo = await sharp(join(here, 'img', post.image))
    .resize(860, 610, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer()

  const nameLines = wrap(post.name, 26)
  const nameY = 858
  const lineY = nameY + nameLines.length * 64 + 14

  // Badge chips flow left to right and wrap to a second row if they run out of width.
  let x = 90
  let y = lineY + 40
  const chips = post.badges.map((b) => {
    const w = textWidth(b, 30) + 48
    if (x + w > 990) { x = 90; y += 70 }
    const svg = `<rect x="${x}" y="${y}" width="${w}" height="56" rx="28" fill="${C.chip}"/>
      <text x="${x + w / 2}" y="${y + 38}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="30" fill="${C.green}">${esc(b)}</text>`
    x += w + 14
    return svg
  }).join('')

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
  <rect width="1080" height="1350" fill="${C.bg}"/>
  <text x="540" y="112" text-anchor="middle" font-family="${SERIF}" font-style="italic" font-weight="700" font-size="58" fill="${C.red}">Minutes of Wow</text>
  <rect x="90" y="150" width="900" height="650" rx="36" fill="${C.card}"/>
  <text x="90" y="${nameY}" font-family="${SERIF}" font-weight="700" font-size="58" fill="${C.ink}">${nameLines.map((l, i) => `<tspan x="90" dy="${i ? 64 : 0}">${esc(l)}</tspan>`).join('')}</text>
  <text x="90" y="${lineY}" font-family="${SANS}" font-size="34" fill="${C.green}">${esc(post.line)}</text>
  ${chips}
  <rect x="0" y="1190" width="1080" height="160" fill="${C.red}"/>
  <text x="540" y="1258" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="40" fill="#ffffff">Order on Amazon · Link in bio</text>
  <text x="540" y="1312" text-anchor="middle" font-family="${SANS}" font-size="32" fill="#ffe3df">Bulk &amp; retail orders on WhatsApp</text>
</svg>`

  return sharp(Buffer.from(svg))
    .composite([{ input: photo, left: 110, top: 170 }])
    .png()
    .toBuffer()
}
