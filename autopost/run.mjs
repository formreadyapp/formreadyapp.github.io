// Daily Instagram auto-post.
//
//   node autopost/run.mjs --dry            render today's post to autopost/out/, print caption, post nothing
//   node autopost/run.mjs --dry --day 3    same, for a chosen day number
//   node autopost/run.mjs                  render, then publish to Instagram (needs the env vars below)
//
// Env vars for publishing:
//   IG_ACCESS_TOKEN  Instagram access token with the instagram_business_content_publish permission
//   IG_USER_ID       optional, found automatically from the token
//   IMAGE_BASE_URL   Public URL folder where autopost/out/ is reachable, no trailing slash
//   GRAPH_VERSION    optional, default v23.0

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { renderPost } from './render.mjs'
import { renderFood } from './brands/minutesofwow/render.mjs'

const here = dirname(fileURLToPath(import.meta.url))

// BRAND picks the post list and design: formready (app tips) or minutesofwow (food products).
const BRAND = process.env.BRAND || 'formready'
const BRANDS = {
  formready: { posts: join(here, 'posts.json'), render: renderPost },
  minutesofwow: {
    posts: join(here, 'brands', 'minutesofwow', 'posts.json'),
    render: renderFood,
    cta: '🛒 Order on Amazon: link in bio\n📦 Bulk & retail orders: WhatsApp us (number in bio)\n🚚 Delivery across India'
  }
}
if (!BRANDS[BRAND]) {
  console.error(`Unknown BRAND "${BRAND}"`)
  process.exit(1)
}
let posts = JSON.parse(readFileSync(BRANDS[BRAND].posts, 'utf8'))

// Minutes of Wow alternates product posts with recipe posts.
if (BRAND === 'minutesofwow') {
  const recipes = JSON.parse(readFileSync(join(here, 'brands', 'minutesofwow', 'recipes.json'), 'utf8'))
  const mixed = []
  for (let i = 0; i < Math.max(posts.length, recipes.length); i++) {
    if (posts[i]) mixed.push(posts[i])
    if (recipes[i]) mixed.push(recipes[i])
  }
  posts = mixed
}

function recipeCaption(p) {
  return `${p.name} 🍳\n\nYou need:\n${p.ingredients.map((x) => '• ' + x).join('\n')}\n\nHow to make:\n${p.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nMade with Minutes of Wow ${p.product}.`
}
const args = process.argv.slice(2)
const dry = args.includes('--dry')
const dayArg = args.indexOf('--day')

// Same post for the whole day, a different one tomorrow, no state to store.
// Days are counted in India time, the same calendar the workflow uses.
const IST_OFFSET_MS = 5.5 * 3600 * 1000
const dayNumber = dayArg >= 0 ? Number(args[dayArg + 1]) : Math.floor((Date.now() + IST_OFFSET_MS) / 86400000)
const index = ((dayNumber % posts.length) + posts.length) % posts.length
const post = posts[index]
const cta = BRANDS[BRAND].cta ? `\n\n${BRANDS[BRAND].cta}` : ''
const caption = `${post.caption || recipeCaption(post)}${cta}\n\n${post.tags.map((t) => '#' + t).join(' ')}`

const outDir = join(here, 'out')
mkdirSync(outDir, { recursive: true })
const file = `${BRAND}-${index}.png`
writeFileSync(join(outDir, file), await BRANDS[BRAND].render(post, index))
console.log(`Rendered ${file}: ${post.title || post.name}`)

if (dry) {
  console.log('\n--- caption ---\n' + caption)
  process.exit(0)
}

const { IG_ACCESS_TOKEN, IMAGE_BASE_URL } = process.env
const version = process.env.GRAPH_VERSION || 'v23.0'
// "Instagram API with Instagram login" tokens use graph.instagram.com.
// Set IG_API_HOST=graph.facebook.com if you use a Facebook Page token instead.
const host = process.env.IG_API_HOST || 'graph.instagram.com'
if (!IG_ACCESS_TOKEN || !IMAGE_BASE_URL) {
  console.error('Missing IG_ACCESS_TOKEN or IMAGE_BASE_URL')
  process.exit(1)
}

const base = `https://${host}/${version}`

async function call(path, params, method = 'POST') {
  const url = new URL(`${base}/${path}`)
  const init = { method }
  if (method === 'GET') {
    for (const [k, v] of Object.entries({ ...params, access_token: IG_ACCESS_TOKEN })) url.searchParams.set(k, v)
  } else {
    init.body = new URLSearchParams({ ...params, access_token: IG_ACCESS_TOKEN })
  }
  const res = await fetch(url, init)
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(`Instagram API: ${JSON.stringify(json.error || json)}`)
  return json
}

// Account ID: use IG_USER_ID if you set it, otherwise ask Instagram who the token belongs to.
let IG_USER_ID = process.env.IG_USER_ID
if (!IG_USER_ID) {
  const me = await call('me', { fields: 'user_id,username' }, 'GET')
  IG_USER_ID = me.user_id || me.id
  console.log(`Posting as @${me.username}`)
}

// 1) Create the media container from the public image URL.
const imageUrl = `${IMAGE_BASE_URL}/${file}`
const container = await call(`${IG_USER_ID}/media`, { image_url: imageUrl, caption })

// 2) Wait until Instagram has fetched and processed the image.
for (let i = 0; i < 15; i++) {
  const { status_code } = await call(container.id, { fields: 'status_code' }, 'GET')
  if (status_code === 'FINISHED') break
  if (status_code === 'ERROR' || status_code === 'EXPIRED') throw new Error(`Container status: ${status_code}`)
  await new Promise((r) => setTimeout(r, 4000))
}

// 3) Publish.
const published = await call(`${IG_USER_ID}/media_publish`, { creation_id: container.id })
console.log(`Published to Instagram, media id ${published.id}`)
