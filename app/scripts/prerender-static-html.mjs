#!/usr/bin/env node
/**
 * Writes per-route HTML snapshots under dist/ so crawlers get real content
 * without executing JS. Firebase Hosting serves these before SPA rewrite.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP_ROOT = join(__dirname, '..')
const REPO_ROOT = join(__dirname, '../..')
const DIST_DIR = join(APP_ROOT, 'dist')
const DIST_INDEX = join(DIST_DIR, 'index.html')
const SITEMAP_PATH = join(DIST_DIR, 'sitemap.xml')

const siteConfig = JSON.parse(readFileSync(join(APP_ROOT, 'src/config/site.json'), 'utf-8'))
const SITE_URL = siteConfig.siteUrl
const LANGS = ['en', 'ja', 'vi']

const locales = {
  en: JSON.parse(readFileSync(join(APP_ROOT, 'src/locales/en.json'), 'utf-8')),
  ja: JSON.parse(readFileSync(join(APP_ROOT, 'src/locales/ja.json'), 'utf-8')),
  vi: JSON.parse(readFileSync(join(APP_ROOT, 'src/locales/vi.json'), 'utf-8')),
}

const nobelData = JSON.parse(readFileSync(join(REPO_ROOT, 'data/nobel-prizes.json'), 'utf-8'))
const tier1Data = JSON.parse(readFileSync(join(REPO_ROOT, 'data/tier1-awards-laureates.json'), 'utf-8'))
const frontierData = JSON.parse(readFileSync(join(REPO_ROOT, 'schema/frontier-topics.json'), 'utf-8'))

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function readLocs(xml) {
  const urls = []
  const re = /<loc>(.*?)<\/loc>/g
  let m
  while ((m = re.exec(xml)) !== null) urls.push(m[1])
  return urls
}

function pathFromUrl(loc) {
  try {
    return new URL(loc).pathname || '/'
  } catch {
    return '/'
  }
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

function getByPath(obj, dotted) {
  return dotted.split('.').reduce((acc, key) => (acc && acc[key] != null ? acc[key] : ''), obj)
}

function t(lang, key) {
  return getByPath(locales[lang] || locales.en, key) || getByPath(locales.en, key) || key
}

function topicLabel(topic, lang) {
  if (lang === 'ja') return topic.label_ja || topic.label_en || topic.id
  if (lang === 'vi') return topic.label_vi || topic.label_en || topic.id
  return topic.label_en || topic.id
}

function topicDesc(topic, lang) {
  if (lang === 'ja') return topic.description || topic.description_en || ''
  if (lang === 'vi') return topic.description_vi || topic.description_en || topic.description || ''
  return topic.description_en || topic.description || ''
}

function pageMeta(pathname) {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean)
  const lang = LANGS.includes(parts[0]) ? parts[0] : 'en'
  const segs = LANGS.includes(parts[0]) ? parts.slice(1) : parts
  const page = segs[0] || 'dashboard'
  const id = segs[1]
  const appTitle = t(lang, 'app.title')

  let title = `${t(lang, 'nav.dashboard')} | ${appTitle}`
  let description = t(lang, 'dashboard.desc')
  const body = []

  if (page === 'dashboard') {
    title = `${t(lang, 'dashboard.title')} | ${appTitle}`
    description = t(lang, 'dashboard.desc')
    body.push(`<h1>${escapeHtml(t(lang, 'dashboard.title'))}</h1>`)
    body.push(`<p>${escapeHtml(description)}</p>`)
    body.push('<ul>')
    body.push(`<li>${escapeHtml(t(lang, 'dashboard.principle1'))}</li>`)
    body.push(`<li>${escapeHtml(t(lang, 'dashboard.principle2'))}</li>`)
    body.push(`<li>${escapeHtml(t(lang, 'dashboard.principle3'))}</li>`)
    body.push('</ul>')
  } else if (page === 'nobel') {
    const catKey = id ? `nobelCategory.${id}` : 'nav.nobel'
    const catName = id ? t(lang, catKey) : t(lang, 'nav.nobel')
    title = `${catName} | ${appTitle}`
    description = t(lang, 'nobel.desc')
    body.push(`<h1>${escapeHtml(catName)}</h1>`)
    body.push(`<p>${escapeHtml(description)}</p>`)
    if (id && nobelData.categories[id]) {
      const entries = nobelData.categories[id].slice(0, 12)
      body.push('<ul>')
      for (const e of entries) {
        const names = (e.laureates || []).join(', ')
        body.push(`<li>${escapeHtml(`${e.year}: ${names}`)}</li>`)
      }
      body.push('</ul>')
    } else {
      body.push('<ul>')
      for (const cat of Object.keys(nobelData.categories)) {
        body.push(`<li><a href="/${lang}/nobel/${cat}">${escapeHtml(t(lang, `nobelCategory.${cat}`))}</a></li>`)
      }
      body.push('</ul>')
    }
  } else if (page === 'tier1-awards') {
    const award = id ? tier1Data.awards[id] : null
    const awardName = award
      ? lang === 'ja'
        ? award.label_ja || award.label_en
        : award.label_en || award.label_ja
      : t(lang, 'nav.tier1')
    title = `${awardName} | ${appTitle}`
    description = t(lang, 'tier1.desc')
    body.push(`<h1>${escapeHtml(awardName)}</h1>`)
    body.push(`<p>${escapeHtml(description)}</p>`)
    if (award?.entries?.length) {
      body.push('<ul>')
      for (const e of award.entries.slice(0, 12)) {
        const names = (e.laureates || []).join(', ')
        body.push(`<li>${escapeHtml(`${e.year}: ${names}`)}</li>`)
      }
      body.push('</ul>')
    } else {
      body.push('<ul>')
      for (const [aid, a] of Object.entries(tier1Data.awards)) {
        const name = lang === 'ja' ? a.label_ja || a.label_en : a.label_en || a.label_ja
        body.push(`<li><a href="/${lang}/tier1-awards/${aid}">${escapeHtml(name)}</a></li>`)
      }
      body.push('</ul>')
    }
  } else if (page === 'frontier-topics') {
    const topic = id ? frontierData.topics.find((x) => x.id === id) : null
    if (topic) {
      title = `${topicLabel(topic, lang)} | ${appTitle}`
      description = topicDesc(topic, lang)
      body.push(`<h1>${escapeHtml(topicLabel(topic, lang))}</h1>`)
      body.push(`<p>${escapeHtml(description)}</p>`)
      if (topic.breakthrough_reason_en || topic.breakthrough_reason) {
        const reason =
          lang === 'ja'
            ? topic.breakthrough_reason
            : lang === 'vi'
              ? topic.breakthrough_reason_vi || topic.breakthrough_reason_en
              : topic.breakthrough_reason_en || topic.breakthrough_reason
        body.push(`<h2>${escapeHtml(t(lang, 'frontier.breakthroughReason'))}</h2>`)
        body.push(`<p>${escapeHtml(reason)}</p>`)
      }
      if (Array.isArray(topic.top_institutions) && topic.top_institutions.length) {
        body.push(`<h2>${escapeHtml(t(lang, 'frontier.topInstitutions'))}</h2>`)
        body.push(`<p>${escapeHtml(topic.top_institutions.join(', '))}</p>`)
      }
    } else {
      title = `${t(lang, 'frontier.title')} | ${appTitle}`
      description = t(lang, 'frontier.desc')
      body.push(`<h1>${escapeHtml(t(lang, 'frontier.title'))}</h1>`)
      body.push(`<p>${escapeHtml(description)}</p>`)
      body.push('<ul>')
      for (const topic of frontierData.topics) {
        body.push(
          `<li><a href="/${lang}/frontier-topics/${topic.id}">${escapeHtml(topicLabel(topic, lang))}</a></li>`
        )
      }
      body.push('</ul>')
    }
  } else if (page === 'awards') {
    title = `${t(lang, 'awards.title')} | ${appTitle}`
    description = t(lang, 'awards.desc')
    body.push(`<h1>${escapeHtml(t(lang, 'awards.title'))}</h1>`)
    body.push(`<p>${escapeHtml(description)}</p>`)
  } else if (page === 'institutions') {
    title = `${t(lang, 'institutions.title')} | ${appTitle}`
    description = t(lang, 'institutions.desc')
    body.push(`<h1>${escapeHtml(t(lang, 'institutions.title'))}</h1>`)
    body.push(`<p>${escapeHtml(description)}</p>`)
  } else if (page === 'schema') {
    title = `${t(lang, 'schema.title')} | ${appTitle}`
    description = t(lang, 'schema.desc')
    body.push(`<h1>${escapeHtml(t(lang, 'schema.title'))}</h1>`)
    body.push(`<p>${escapeHtml(description)}</p>`)
    body.push('<ul>')
    body.push(`<li>${escapeHtml(t(lang, 'schema.principle1'))}</li>`)
    body.push(`<li>${escapeHtml(t(lang, 'schema.principle2'))}</li>`)
    body.push(`<li>${escapeHtml(t(lang, 'schema.principle3'))}</li>`)
    body.push('</ul>')
  } else if (page === 'sitemap') {
    title = `${t(lang, 'sitemap.title')} | ${appTitle}`
    description = t(lang, 'sitemap.desc')
    body.push(`<h1>${escapeHtml(t(lang, 'sitemap.title'))}</h1>`)
    body.push(`<p>${escapeHtml(description)}</p>`)
  }

  body.push('<nav aria-label="Main sections">')
  body.push(`<a href="/${lang}/dashboard">${escapeHtml(t(lang, 'nav.dashboard'))}</a> · `)
  body.push(`<a href="/${lang}/nobel/physics">${escapeHtml(t(lang, 'nav.nobel'))}</a> · `)
  body.push(`<a href="/${lang}/frontier-topics">${escapeHtml(t(lang, 'nav.frontierTopics'))}</a> · `)
  body.push(`<a href="/${lang}/institutions">${escapeHtml(t(lang, 'nav.institutions'))}</a>`)
  body.push('</nav>')
  body.push('<p>')
  body.push(`<a href="${SITE_URL}/sitemap.xml">sitemap.xml</a> · `)
  body.push(`<a href="${SITE_URL}/llms.txt">llms.txt</a> · `)
  body.push(`<a href="${SITE_URL}/llms-full.txt">llms-full.txt</a>`)
  body.push('</p>')

  return { lang, title, description, bodyHtml: body.join('\n'), pathWithoutLang: `/${segs.join('/')}` || '/dashboard' }
}

function hreflangLinks(pathWithoutLang) {
  const links = LANGS.map(
    (l) =>
      `<link rel="alternate" hreflang="${l}" href="${escapeHtml(`${SITE_URL}/${l}${pathWithoutLang}`)}" />`
  )
  links.push(
    `<link rel="alternate" hreflang="x-default" href="${escapeHtml(`${SITE_URL}/en${pathWithoutLang}`)}" />`
  )
  return links.join('\n    ')
}

function jsonLd(meta, routePath) {
  const data = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'TANAAKK',
      url: 'https://www.tanaakk.com/',
      logo: `${SITE_URL}/gaas-logo.png`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'GAAS R&D Library',
      url: SITE_URL,
      inLanguage: ['en', 'ja', 'vi'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: meta.title,
      description: meta.description,
      url: `${SITE_URL}${routePath}`,
      inLanguage: meta.lang,
    },
  ]
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`
}

function fallbackSection(meta) {
  return `
<section id="prerender-fallback" style="max-width:900px;margin:0 auto;padding:24px 16px;line-height:1.65;color:#0f172a">
${meta.bodyHtml}
</section>`
}

if (!existsSync(DIST_INDEX) || !existsSync(SITEMAP_PATH)) {
  console.error('Missing dist/index.html or dist/sitemap.xml. Run vite build first.')
  process.exit(1)
}

const indexTemplate = readFileSync(DIST_INDEX, 'utf-8')
const sitemap = readFileSync(SITEMAP_PATH, 'utf-8')
const paths = [...new Set(readLocs(sitemap).map(pathFromUrl).filter(Boolean))]

let generated = 0
for (const p of paths) {
  if (/\.[a-z0-9]+$/i.test(p)) continue
  const routePath = p === '' ? '/' : p
  const meta = pageMeta(routePath)
  // Write foo/bar.html so Firebase cleanUrls can serve /foo/bar without SPA rewrite.
  const outFile =
    routePath === '/'
      ? join(DIST_DIR, 'index.html')
      : join(DIST_DIR, `${routePath.replace(/^\//, '')}.html`)

  ensureDir(dirname(outFile))

  const canonical = `${SITE_URL}${routePath}`
  let html = indexTemplate
  html = html.replace(/<html\s+lang="[^"]*"/i, `<html lang="${meta.lang}"`)
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`)

  // Replace or inject description / OG / canonical.
  if (/<meta\s+name="description"/i.test(html)) {
    html = html.replace(
      /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`
    )
  }
  if (/property="og:title"/i.test(html)) {
    html = html.replace(
      /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:title" content="${escapeHtml(meta.title)}" />`
    )
  }
  if (/property="og:description"/i.test(html)) {
    html = html.replace(
      /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:description" content="${escapeHtml(meta.description)}" />`
    )
  }
  if (/property="og:url"/i.test(html)) {
    html = html.replace(
      /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
      `<meta property="og:url" content="${escapeHtml(canonical)}" />`
    )
  }
  if (/rel="canonical"/i.test(html)) {
    html = html.replace(
      /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
      `<link rel="canonical" href="${escapeHtml(canonical)}" />`
    )
  }

  html = html.replace(
    '</head>',
    `    ${hreflangLinks(meta.pathWithoutLang)}
    ${jsonLd(meta, routePath)}
    <style>.js #prerender-fallback{display:none!important}</style>
    <script>document.documentElement.classList.add('js')</script>
  </head>`
  )
  html = html.replace('<div id="root"></div>', `<div id="root"></div>${fallbackSection(meta)}`)

  writeFileSync(outFile, html, 'utf-8')
  generated++
}

console.log(`Prerendered crawl snapshots: ${generated} routes`)
