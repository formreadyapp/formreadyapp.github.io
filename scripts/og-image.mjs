// Makes public/og-image.png (1200x630), the picture shown when the link is
// shared on WhatsApp, Facebook or X. Run once after changing the design:
//   node scripts/og-image.mjs
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const FONT = 'Segoe UI, DejaVu Sans, Arial, sans-serif'

const chips = ['Passport photo', 'Exam photo', 'Signature', 'Resume', 'Biodata']
let x = 80
const chipSvg = chips.map((c) => {
  const w = c.length * 15 + 44
  const s = `<rect x="${x}" y="470" width="${w}" height="54" rx="27" fill="#ffffff" fill-opacity="0.16"/>
    <text x="${x + w / 2}" y="505" text-anchor="middle" font-family="${FONT}" font-weight="600" font-size="26" fill="#ffffff">${c}</text>`
  x += w + 12
  return s
}).join('')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#3342f0"/>
  <text x="250" y="148" font-family="${FONT}" font-weight="800" font-size="64" fill="#ffffff">FormReady</text>
  <text x="80" y="290" font-family="${FONT}" font-weight="800" font-size="70" fill="#ffffff">Photo &amp; signature</text>
  <text x="80" y="378" font-family="${FONT}" font-weight="800" font-size="70" fill="#ffffff">ready for any form</text>
  <text x="80" y="436" font-family="${FONT}" font-size="30" fill="#dfe3ff">Exact size and KB limit, in seconds. Works on your phone.</text>
  ${chipSvg}
  <g transform="translate(930 150) rotate(-8)">
    <rect width="180" height="64" rx="14" fill="#ffb020"/>
    <text x="90" y="43" text-anchor="middle" font-family="${FONT}" font-weight="800" font-size="32" fill="#11142b">≤ 50 KB</text>
  </g>
</svg>`

const logo = await sharp(readFileSync(join(root, 'public', 'logo.svg')), { density: 300 }).resize(130, 130).png().toBuffer()
await sharp(Buffer.from(svg))
  .composite([{ input: logo, left: 90, top: 50 }])
  .png()
  .toFile(join(root, 'public', 'og-image.png'))
console.log('public/og-image.png written')
