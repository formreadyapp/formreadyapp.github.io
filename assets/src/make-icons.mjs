// Renders the logo SVGs into the PNGs that @capacitor/assets expects.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'

const logo = readFileSync('public/logo.svg')
const fg = readFileSync('assets/src/icon-foreground.svg')

await sharp(logo, { density: 384 }).resize(1024, 1024).png().toFile('assets/icon-only.png')
await sharp(fg, { density: 384 }).resize(1024, 1024).png().toFile('assets/icon-foreground.png')
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: '#3342f0' } }).png().toFile('assets/icon-background.png')

// Splash: logo mark centered on brand blue.
const mark = await sharp(fg, { density: 384 }).resize(900, 900).png().toBuffer()
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#3342f0' } })
  .composite([{ input: mark, gravity: 'center' }]).png().toFile('assets/splash.png')
await sharp({ create: { width: 2732, height: 2732, channels: 4, background: '#3342f0' } })
  .composite([{ input: mark, gravity: 'center' }]).png().toFile('assets/splash-dark.png')
console.log('icons ok')
