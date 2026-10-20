// Generates simple, fast pages that answer common Google searches
// ("resize photo to 20 KB", "marriage biodata maker" ...). Each page links
// into the app with the right tool and size already filled in.
// Runs before every build (see "prebuild" in package.json). Output goes to public/.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SITE = 'https://formreadyapp.github.io'
const pub = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const PAGES = [
  {
    slug: 'resize-photo-to-20kb',
    title: 'Resize Photo to 20 KB Online, Free First Download | FormReady',
    h1: 'Resize your photo to 20 KB',
    desc: 'Make a photo under 20 KB in seconds for exam and job forms. Set the exact width, height and KB limit. Works on your phone, nothing is uploaded.',
    cta: 'Resize photo to 20 KB',
    link: '?tool=photo&w=200&h=230&kb=20',
    intro: 'Many online application forms reject photos that are larger than 20 KB. FormReady shrinks your photo to the size you need without making it blurry, by reducing the quality only as much as necessary.',
    steps: ['Tap the button below and choose your photo.', 'Check the width and height asked in your form (you can change them).', 'Drag the photo to centre your face.', 'Download. The file size is shown before you download.']
  },
  {
    slug: 'resize-photo-to-50kb',
    title: 'Resize Photo to 50 KB Online for Exam Forms | FormReady',
    h1: 'Resize your photo to 50 KB',
    desc: 'Reduce a photo to under 50 KB with the exact pixel size your exam or job form asks for. Fast, simple, works on any phone.',
    cta: 'Resize photo to 50 KB',
    link: '?tool=photo&w=200&h=230&kb=50',
    intro: 'A photo between 20 KB and 50 KB is a common requirement in exam and job applications. FormReady lets you set the maximum KB, width and height, and shows the final size before you download.',
    steps: ['Tap the button and pick a photo from your gallery.', 'Set the width and height from your form notice.', 'Move the photo so your face is centred.', 'Download the JPG and upload it to your form.']
  },
  {
    slug: 'resize-photo-to-100kb',
    title: 'Resize Photo to 100 KB Online | FormReady',
    h1: 'Resize your photo to 100 KB',
    desc: 'Compress a photo to under 100 KB for online forms and applications. Choose width, height and background colour.',
    cta: 'Resize photo to 100 KB',
    link: '?tool=photo&w=354&h=453&kb=100',
    intro: 'Phone photos are often 2 to 5 MB, far too large for most forms. FormReady reduces your photo to under 100 KB and the exact dimensions you need.',
    steps: ['Tap the button and choose your photo.', 'Change the width and height if your form asks for a different size.', 'Drag and zoom to fit your face in the frame.', 'Download the ready file.']
  },
  {
    slug: 'resize-signature-online',
    title: 'Resize Signature to 10 KB or 20 KB Online | FormReady',
    h1: 'Resize your signature for online forms',
    desc: 'Make your signature image the right size and under 10 KB to 20 KB for exam and job applications. Sign on paper, take a photo, resize.',
    cta: 'Resize my signature',
    link: '?tool=photo&preset=sign',
    intro: 'Forms usually ask for a small, wide signature image with a strict KB limit. Sign on plain white paper with a dark pen, take a clear photo, and FormReady will crop and compress it.',
    steps: ['Sign on white paper with a black or dark blue pen.', 'Take a straight photo of the signature in good light.', 'Tap the button, choose the photo, and drag to centre the signature.', 'Check the KB limit in your form and download.']
  },
  {
    slug: 'passport-size-photo-maker',
    title: 'Passport Size Photo Maker Online (35×45 mm) | FormReady',
    h1: 'Passport size photo maker',
    desc: 'Make a 35×45 mm passport size photo from any picture on your phone. White background, exact size, ready to download.',
    cta: 'Make passport photo',
    link: '?tool=photo&preset=passport',
    intro: 'Make a passport size photo at 35×45 mm (413×531 pixels) from a photo on your phone. Use a plain light wall behind you and face a window for even light.',
    steps: ['Take a photo against a plain light background.', 'Tap the button and choose the photo.', 'Zoom and drag so your face fills the frame.', 'Download your passport size photo.']
  },
  {
    slug: 'compress-photo-for-exam-form',
    title: 'Compress Photo for Exam Form, Exact Size and KB | FormReady',
    h1: 'Compress your photo for an exam form',
    desc: 'Get your exam form photo to the exact width, height and KB limit. Edit every value to match your exam notification.',
    cta: 'Prepare exam photo',
    link: '?tool=photo&preset=exam',
    intro: 'Every exam publishes its own photo rules: size in pixels or centimetres, a KB range and a file type. Read your notification first, then set the same values in FormReady. Every value can be edited.',
    steps: ['Find the photo size and KB limit in your exam notification.', 'Tap the button and enter those values with "Edit size".', 'Choose your photo and centre your face.', 'Download and upload to the exam portal.']
  },
  {
    slug: 'resume-maker-pdf',
    title: 'Free Resume Maker, Download PDF on Your Phone | FormReady',
    h1: 'Make a resume PDF on your phone',
    desc: 'Fill in your details and download a clean one-page resume PDF. Simple templates for freshers and job seekers.',
    cta: 'Make my resume',
    link: '?tool=resume',
    intro: 'Make a simple, professional resume without a computer. Add your contact details, education, experience and skills, choose a colour, and download a one-page PDF.',
    steps: ['Tap the button and fill in your details.', 'Add your education and experience.', 'Switch to Preview to check the page.', 'Download the PDF and send it to employers.']
  },
  {
    slug: 'marriage-biodata-maker',
    title: 'Marriage Biodata Maker, Download PDF | FormReady',
    h1: 'Marriage biodata maker',
    desc: 'Make a neat marriage biodata with photo in minutes. Personal, family and contact details in a clean PDF, in English or Hindi.',
    cta: 'Make biodata',
    link: '?tool=biodata',
    intro: 'Create a tidy marriage biodata with your photo, personal details, education, work and family information. Choose a colour and download a ready-to-share PDF.',
    steps: ['Tap the button and add your photo and name.', 'Fill in personal, education and family details.', 'Pick a style and check the preview.', 'Download the PDF and share it with family.']
  },
  {
    slug: 'photo-size-kam-kaise-kare',
    lang: 'hi',
    title: 'फोटो का साइज़ KB में कम कैसे करें | FormReady',
    h1: 'फोटो का साइज़ KB में कम करें',
    desc: 'परीक्षा और नौकरी फॉर्म के लिए फोटो को 20 KB, 50 KB या 100 KB में बदलें। सही चौड़ाई और ऊँचाई के साथ, अपने फोन पर।',
    cta: 'फोटो का साइज़ कम करें',
    link: '?tool=photo&preset=exam&lang=hi',
    intro: 'ऑनलाइन फॉर्म अक्सर तय KB सीमा से बड़ी फोटो स्वीकार नहीं करते। FormReady आपकी फोटो को सही साइज़ और KB में बदल देता है, और डाउनलोड से पहले फ़ाइल साइज़ दिखाता है।',
    steps: ['अपनी परीक्षा की सूचना में फोटो का साइज़ और KB सीमा देखें।', 'नीचे बटन दबाएँ और "साइज़ बदलें" में वही मान डालें।', 'फोटो चुनें और चेहरे को बीच में रखें।', 'डाउनलोड करें और फॉर्म में अपलोड करें।']
  }
]

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Question-and-answer data for search engines, built from the page's own text.
function faqSchema(p) {
  const hi = p.lang === 'hi'
  const qa = [
    [hi ? `${p.h1}?` : `How do I ${p.h1.charAt(0).toLowerCase()}${p.h1.slice(1)}?`, p.steps.join(' ')],
    [hi ? 'क्या यह मुफ़्त है?' : 'Is it free?', hi ? 'हर टूल में पहला डाउनलोड मुफ़्त है, फिर ₹10 प्रति डाउनलोड।' : 'Your first download in each tool is free, then ₹10 per download.'],
    [hi ? 'क्या मेरी फोटो अपलोड होती है?' : 'Are my files uploaded?', hi ? 'नहीं, सब कुछ आपके फोन पर ही होता है।' : 'No. Everything happens on your phone; nothing is uploaded.']
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }))
  }
}

function page(p) {
  const hi = p.lang === 'hi'
  const others = PAGES.filter((o) => o.slug !== p.slug)
    .map((o) => `<li><a href="../${o.slug}/">${esc(o.h1)}</a></li>`).join('')
  return `<!doctype html>
<html lang="${hi ? 'hi' : 'en'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<link rel="canonical" href="${SITE}/${p.slug}/">
<link rel="icon" type="image/svg+xml" href="../logo.svg">
<meta property="og:type" content="website">
<meta property="og:site_name" content="FormReady">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${SITE}/${p.slug}/">
<meta property="og:image" content="${SITE}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">${JSON.stringify(faqSchema(p))}</script>
<style>
:root{--blue:#3342f0;--ink:#11142b;--muted:#5f6484;--bg:#f2f4fb}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans Devanagari',sans-serif}
main{max-width:640px;margin:0 auto;padding:20px 16px 48px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;color:var(--ink);text-decoration:none}
.brand img{width:34px;height:34px}
h1{font-size:32px;line-height:1.15;margin:28px 0 12px;letter-spacing:-.02em}
.lead{color:var(--muted)}
.cta{display:block;text-align:center;background:var(--blue);color:#fff;text-decoration:none;font-weight:700;font-size:18px;padding:16px;border-radius:16px;margin:24px 0}
.card{background:#fff;border-radius:18px;padding:18px 20px;box-shadow:0 0 0 1px #e2e5f1 inset;margin:18px 0}
h2{font-size:20px;margin:0 0 8px}ol{margin:0;padding-left:22px}li{margin:6px 0}
.more a{color:var(--blue)}footer{color:var(--muted);font-size:14px;margin-top:28px}
</style>
</head>
<body>
<main>
<a class="brand" href="../"><img src="../logo.svg" alt="">FormReady</a>
<h1>${esc(p.h1)}</h1>
<p class="lead">${esc(p.desc)}</p>
<a class="cta" href="../${p.link}">${esc(p.cta)}</a>
<div class="card"><p>${esc(p.intro)}</p></div>
<div class="card"><h2>${hi ? 'कैसे करें' : 'How it works'}</h2><ol>${p.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>
<div class="card"><h2>${hi ? 'ज़रूरी बातें' : 'Good to know'}</h2><ul>
<li>${hi ? 'आपकी फ़ाइलें आपके फोन में ही रहती हैं, कुछ भी अपलोड नहीं होता।' : 'Your files stay on your phone. Nothing is uploaded.'}</li>
<li>${hi ? 'हर टूल में पहला डाउनलोड मुफ़्त, फिर ₹10 प्रति डाउनलोड।' : 'Your first download in each tool is free, then ₹10 per download.'}</li>
<li>${hi ? 'नियम परीक्षा के अनुसार बदलते हैं, हमेशा अपनी आधिकारिक सूचना देखें।' : 'Rules differ between forms, so always check your official notification.'}</li>
</ul></div>
<div class="card more"><h2>${hi ? 'और टूल' : 'More tools'}</h2><ul>${others}</ul></div>
<footer>FormReady · <a href="../">${hi ? 'ऐप खोलें' : 'Open the app'}</a></footer>
</main>
</body>
</html>
`
}

for (const p of PAGES) {
  const dir = join(pub, p.slug)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'index.html'), page(p))
}

const today = new Date().toISOString().slice(0, 10)
const urls = ['', ...PAGES.map((p) => `${p.slug}/`)]
writeFileSync(join(pub, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}/${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`)
writeFileSync(join(pub, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)
console.log(`SEO pages: ${PAGES.length} written`)
