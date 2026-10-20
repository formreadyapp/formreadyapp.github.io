// Daily Instagram auto-post.
//
//   node autopost/run.mjs --dry            render today's post to autopost/out/, print caption, post nothing
//   node autopost/run.mjs --dry --day 3    same, for a chosen day number
//   node autopost/run.mjs                  render, then publish to Instagram (needs the env vars below)
//
// Env vars for publishing:
//   IG_USER_ID       Instagram business account ID (digits)
//   IG_ACCESS_TOKEN  Page access token with instagram_content_publish permission
//   IMAGE_BASE_URL   Public URL folder where autopost/out/ is reachable, no trailing slash
//   GRAPH_VERSION    optional, default v23.0

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { renderPost } from './render.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const posts = JSON.parse(readFileSync(join(here, 'posts.json'), 'utf8'))
const args = process.argv.slice(2)
const dry = args.includes('--dry')
const dayArg = args.indexOf('--day')

// Same post for the whole day, a different one tomorrow, no state to store.
const dayNumber = dayArg >= 0 ? Number(args[dayArg + 1]) : Math.floor(Date.now() / 86400000)
const index = ((dayNumber % posts.length) + posts.length) % posts.length
const post = posts[index]
const caption = `${post.caption}\n\n${post.tags.map((t) => '#' + t).join(' ')}`

const outDir = join(here, 'out')
mkdirSync(outDir, { recursive: true })
const file = `post-${index}.png`
writeFileSync(join(outDir, file), await renderPost(post, index))
console.log(`Rendered ${file}: ${post.title}`)

if (dry) {
  console.log('\n--- caption ---\n' + caption)
  process.exit(0)
}

const { IG_USER_ID, IG_ACCESS_TOKEN, IMAGE_BASE_URL } = process.env
const version = process.env.GRAPH_VERSION || 'v23.0'
if (!IG_USER_ID || !IG_ACCESS_TOKEN || !IMAGE_BASE_URL) {
  console.error('Missing IG_USER_ID, IG_ACCESS_TOKEN or IMAGE_BASE_URL')
  process.exit(1)
}

const base = `https://graph.facebook.com/${version}`

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
