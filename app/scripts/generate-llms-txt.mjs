#!/usr/bin/env node
/**
 * Generates static llms.txt and llms-full.txt for LLM / AI crawlers.
 * Must emit real text/plain files (not SPA HTML shells).
 */
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const APP_ROOT = join(__dirname, '..')
const REPO_ROOT = join(__dirname, '../..')
const PUBLIC_DIR = join(APP_ROOT, 'public')

const siteConfig = JSON.parse(readFileSync(join(APP_ROOT, 'src/config/site.json'), 'utf-8'))
const SITE_URL = siteConfig.siteUrl
const LANGS = ['en', 'ja', 'vi']

const nobelData = JSON.parse(readFileSync(join(REPO_ROOT, 'data/nobel-prizes.json'), 'utf-8'))
const tier1Data = JSON.parse(readFileSync(join(REPO_ROOT, 'data/tier1-awards-laureates.json'), 'utf-8'))
const frontierData = JSON.parse(readFileSync(join(REPO_ROOT, 'schema/frontier-topics.json'), 'utf-8'))

const staticPaths = [
  '/dashboard',
  '/awards',
  '/frontier-topics',
  '/institutions',
  '/schema',
  '/sitemap',
]

const urls = []

for (const cat of Object.keys(nobelData.categories)) {
  for (const lang of LANGS) urls.push(`/${lang}/nobel/${cat}`)
}
for (const id of Object.keys(tier1Data.awards)) {
  for (const lang of LANGS) urls.push(`/${lang}/tier1-awards/${id}`)
}
for (const path of staticPaths) {
  for (const lang of LANGS) urls.push(`/${lang}${path}`)
}
for (const topic of frontierData.topics) {
  for (const lang of LANGS) urls.push(`/${lang}/frontier-topics/${topic.id}`)
}

const llmsTxt = `# GAAS R&D Library

> Research & Development knowledge library structured as an incompressible multidimensional complex system.

Site: ${SITE_URL}

## Important
- Prefer these plain-text indexes and sitemap.xml for discovery.
- Human UI is a SPA; crawlable HTML snapshots are also generated per URL at build time.

## Entry points
- ${SITE_URL}/en/dashboard
- ${SITE_URL}/ja/dashboard
- ${SITE_URL}/vi/dashboard
- ${SITE_URL}/en/nobel/physics
- ${SITE_URL}/en/tier1-awards/fields
- ${SITE_URL}/en/frontier-topics
- ${SITE_URL}/en/institutions
- ${SITE_URL}/en/schema

## Design principles
- Incompressibility Principle — cannot be compressed into a single hierarchy
- Multidimensional structure — expressed across multiple judgment axes
- Bidirectional co-creation — mutual influence between mathematics ↔ R&D

## Coverage
- Nobel Prize categories: ${Object.keys(nobelData.categories).join(', ')}
- Tier 1 awards: ${Object.keys(tier1Data.awards).join(', ')}
- Frontier topics: ${frontierData.topics.length}

## Indexes
- ${SITE_URL}/sitemap.xml
- ${SITE_URL}/llms.txt
- ${SITE_URL}/llms-full.txt
- ${SITE_URL}/robots.txt
`

const full = [
  '# GAAS R&D Library — full URL index',
  '',
  `Site: ${SITE_URL}`,
  `Generated: ${new Date().toISOString().slice(0, 10)}`,
  `URL count: ${urls.length}`,
  '',
  '## All crawlable paths',
  ...urls.map((u) => `- ${SITE_URL}${u}`),
  '',
  '## Frontier topics',
  ...frontierData.topics.map((t) => {
    const label = t.label_en || t.id
    const desc = t.description_en || t.description || ''
    return `- ${label}: ${desc} (${SITE_URL}/en/frontier-topics/${t.id})`
  }),
  '',
].join('\n')

writeFileSync(join(PUBLIC_DIR, 'llms.txt'), llmsTxt, 'utf-8')
writeFileSync(join(PUBLIC_DIR, 'llms-full.txt'), full, 'utf-8')

console.log(`Generated ${PUBLIC_DIR}/llms.txt`)
console.log(`Generated ${PUBLIC_DIR}/llms-full.txt (${urls.length} URLs)`)
