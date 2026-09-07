import { createSignal, createEffect, Show } from 'solid-js'
import { useParams, Navigate } from '@solidjs/router'
import { I18nProvider } from '../contexts/I18nContext'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { Hreflang } from './Hreflang'
import { SeoHead } from './SeoHead'
import { StructuredData } from './StructuredData'
import { SUPPORTED_LANGS, persistLang } from '../i18n'
import type { Lang } from '../i18n'
import styles from './Layout.module.css'

export function Layout(props: { children?: import('solid-js').JSX.Element }) {
  const params = useParams<{ lang: string }>()
  const [sidebarOpen, setSidebarOpen] = createSignal(false)

  const validLang = () => {
    const lang = params.lang
    return lang && SUPPORTED_LANGS.includes(lang as Lang)
  }

  createEffect(() => {
    const lang = params.lang
    if (lang && SUPPORTED_LANGS.includes(lang as Lang)) {
      document.documentElement.lang = lang
      persistLang(lang as Lang)
    }
  })

  return (
    <Show when={validLang()} fallback={<Navigate href="/en/dashboard" />}>
      <I18nProvider locale={() => params.lang as Lang}>
        <div class={styles.layout}>
          <Hreflang />
          <SeoHead />
          <StructuredData />
          <Sidebar isOpen={sidebarOpen()} onClose={() => setSidebarOpen(false)} />
          <div class={styles.main}>
            <Header onMenuClick={() => setSidebarOpen(true)} />
            <main class={styles.content}>
              {props.children}
            </main>
          </div>
          <Show when={sidebarOpen()}>
            <button
              type="button"
              class={styles.overlay}
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            />
          </Show>
        </div>
      </I18nProvider>
    </Show>
  )
}
