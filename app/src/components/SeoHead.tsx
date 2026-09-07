import { createEffect } from 'solid-js'
import { useLocation, useParams } from '@solidjs/router'
import { useI18n } from '../contexts/I18nContext'
import { PAGE_META } from '../data/structuredDataConfig'
import { SITE_URL } from '../config'
import frontierData from '../../../schema/frontier-topics.json'
import type { Lang } from '../i18n'

const topics = frontierData.topics as Array<{
  id: string
  label_ja: string
  label_en: string
  label_vi?: string
  description: string
  description_en?: string
  description_vi?: string
}>

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attr}="${key}"]`
  let el = document.head.querySelector(selector) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

function topicLabel(topic: (typeof topics)[number], lang: Lang) {
  if (lang === 'ja') return topic.label_ja || topic.label_en
  if (lang === 'vi') return topic.label_vi || topic.label_en
  return topic.label_en
}

function topicDesc(topic: (typeof topics)[number], lang: Lang) {
  if (lang === 'ja') return topic.description
  if (lang === 'vi') return topic.description_vi || topic.description_en || topic.description
  return topic.description_en || topic.description
}

/** Keeps title / description / OG / canonical in sync on client navigations. */
export function SeoHead() {
  const location = useLocation()
  const params = useParams<{ lang: string; id?: string; category?: string; awardId?: string }>()
  const { t } = useI18n()

  createEffect(() => {
    const lang = (params.lang || 'en') as Lang
    const pathWithoutLang = location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/dashboard'
    const segments = pathWithoutLang.split('/').filter(Boolean)
    const pageName = segments[0] || 'dashboard'
    const detailId = params.id || params.category || params.awardId || segments[1]

    let title = `${t('nav.dashboard')} | ${t('app.title')}`
    let description = t('dashboard.desc')

    const meta = PAGE_META[pageName]
    if (meta) {
      title = `${t(meta.nameKey)} | ${t('app.title')}`
      description = t(meta.descKey)
    }

    if (pageName === 'nobel' && detailId) {
      title = `${t(`nobelCategory.${detailId}`)} | ${t('app.title')}`
      description = t('nobel.desc')
    }

    if (pageName === 'tier1-awards' && detailId) {
      title = `${t(`tier1Award.${detailId}`)} | ${t('app.title')}`
      description = t('tier1.desc')
    }

    if (pageName === 'frontier-topics' && detailId) {
      const topic = topics.find((x) => x.id === detailId)
      if (topic) {
        title = `${topicLabel(topic, lang)} | ${t('app.title')}`
        description = topicDesc(topic, lang)
      }
    }

    const canonical = `${SITE_URL}/${lang}${pathWithoutLang}`
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:url', canonical)
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertLink('canonical', canonical)
  })

  return null
}
