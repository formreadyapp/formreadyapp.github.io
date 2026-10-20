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

// Rough text width (wide enough for the Linux fonts on GitHub's servers).
const textWidth = (s, size) => s.length * size * 0.62

// Recipe card: title, small product photo, ingredients and numbered steps.
async function renderRecipe(post) {
  const photo = await sharp(join(here, 'img', post.image))
    .resize(260, 260, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer()

  const parts = []
  const titleLines = wrap(post.name, 16)
  parts.push(`<text x="90" y="250" font-family="${SERIF}" font-weight="700" font-size="62" fill="${C.ink}">${titleLines.map((l, i) => `<tspan x="90" dy="${i ? 70 : 0}">${esc(l)}</tspan>`).join('')}</text>`)

  let y = Math.max(250 + titleLines.length * 70 + 40, 470)
  parts.push(`<text x="90" y="${y}" font-family="${SANS}" font-weight="700" font-size="34" fill="${C.green}">You need</text>`)
  y += 50
  for (const item of post.ingredients) {
    parts.push(`<circle cx="104" cy="${y - 10}" r="6" fill="${C.red}"/><text x="126" y="${y}" font-family="${SANS}" font-size="31" fill="${C.ink}">${esc(item)}</text>`)
    y += 46
  }
  y += 28
  parts.push(`<text x="90" y="${y}" font-family="${SANS}" font-weight="700" font-size="34" fill="${C.green}">How to make</text>`)
  y += 50
  post.steps.forEach((step, i) => {
    const lines = wrap(step, 44)
    parts.push(`<circle cx="108" cy="${y - 10}" r="20" fill="${C.green}"/><text x="108" y="${y}" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="24" fill="#fff">${i + 1}</text>`)
    parts.push(`<text x="146" y="${y}" font-family="${SANS}" font-size="31" fill="${C.ink}">${lines.map((l, j) => `<tspan x="146" dy="${j ? 40 : 0}">${esc(l)}</tspan>`).join('')}</text>`)
    y += lines.length * 40 + 18
  })

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
  <rect width="1080" height="1350" fill="${C.bg}"/>
  <text x="90" y="100" font-family="${SERIF}" font-style="italic" font-weight="700" font-size="44" fill="${C.red}">Minutes of Wow</text>
  <rect x="90" y="128" width="150" height="50" rx="25" fill="${C.chip}"/>
  <text x="165" y="162" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="28" fill="${C.green}">Recipe</text>
  <rect x="700" y="60" width="300" height="300" rx="28" fill="${C.card}"/>
  ${parts.join('\n  ')}
  <rect x="0" y="1190" width="1080" height="160" fill="${C.red}"/>
  <text x="540" y="1258" text-anchor="middle" font-family="${SANS}" font-weight="700" font-size="${fitSize('Made with Minutes of Wow ' + post.product, 38, 960)}" fill="#ffffff">Made with Minutes of Wow ${esc(post.product)}</text>
  <text x="540" y="1312" text-anchor="middle" font-family="${SANS}" font-size="32" fill="#ffe3df">Order on Amazon · Link in bio</text>
</svg>`

  return sharp(Buffer.from(svg))
    .composite([{ input: photo, left: 720, top: 80 }])
    .png()
    .toBuffer()
}

// Largest font size (up to max) that keeps one line of text within width.
const fitSize = (s, max, width) => Math.min(max, Math.floor(width / (s.length * 0.62)))

export async function renderFood(post) {
  if (post.type === 'recipe') return renderRecipe(post)
  const photo = await sharp(join(here, 'img', post.image))
    .resize(860, 610, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .png()
    .toBuffer()

  const nameLines = wrap(post.name, 24)
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
