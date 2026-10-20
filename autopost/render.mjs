// Turns a post from posts.json into a 1080x1350 PNG (Instagram portrait size).
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const logoSvg = readFileSync(join(here, '..', 'public', 'logo.svg'))

const THEMES = [
  { bg: '#3342f0', title: '#ffffff', body: '#dfe3ff', pill: '#ffb020', pillText: '#11142b' },
  { bg: '#11142b', title: '#ffffff', body: '#c9cde6', pill: '#3342f0', pillText: '#ffffff' },
  { bg: '#ffb020', title: '#11142b', body: '#3a2d00', pill: '#11142b', pillText: '#ffffff' }
]

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

function tspans(lines, x, lineHeight) {
  return lines.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${esc(l)}</tspan>`).join('')
}

export async function renderPost(post, index = 0) {
  const th = THEMES[index % THEMES.length]
  const titleLines = wrap(post.title, 20)
  const bodyLines = wrap(post.body, 36)
  const titleSize = titleLines.length > 3 ? 70 : 84
  const titleY = 400
  const bodyY = titleY + titleLines.length * (titleSize * 1.15) + 70

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
  <rect width="1080" height="1350" fill="${th.bg}"/>
  <text x="90" y="${titleY}" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-weight="800" font-size="${titleSize}" fill="${th.title}">${tspans(titleLines, 90, titleSize * 1.15)}</text>
  <text x="90" y="${bodyY}" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-size="46" fill="${th.body}">${tspans(bodyLines, 90, 66)}</text>
  <rect x="90" y="1130" width="520" height="92" rx="46" fill="${th.pill}"/>
  <text x="350" y="1189" text-anchor="middle" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-weight="700" font-size="40" fill="${th.pillText}">Link in bio</text>
</svg>`

  const logo = await sharp(logoSvg, { density: 300 }).resize(130, 130).png().toBuffer()
  const wordmark = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="130">
    <text x="0" y="88" font-family="Segoe UI, DejaVu Sans, Arial, sans-serif" font-weight="800" font-size="62" fill="${th.title}">FormReady</text></svg>`)

  return sharp(Buffer.from(svg))
    .composite([
      { input: logo, left: 90, top: 100 },
      { input: wordmark, left: 245, top: 100 }
    ])
    .png()
    .toBuffer()
}
