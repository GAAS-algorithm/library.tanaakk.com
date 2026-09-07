import { createResource, Show } from 'solid-js'

type Katex = typeof import('katex').default

let katexPromise: Promise<Katex> | null = null

function loadKatex(): Promise<Katex> {
  if (!katexPromise) {
    katexPromise = Promise.all([
      import('katex'),
      import('katex/dist/katex.min.css'),
    ]).then(([mod]) => mod.default)
  }
  return katexPromise
}

type Props = {
  content: string
  displayMode?: boolean
  class?: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderMixedContent(
  katex: Katex,
  content: string,
  displayMode: boolean | undefined
): string {
  const displayRegex = /\$\$([^$]+)\$\$/g
  const inlineRegex = /\$([^$]+)\$/g

  const allMatches: { type: 'display' | 'inline'; start: number; end: number; latex: string }[] = []
  let match: RegExpExecArray | null

  while ((match = displayRegex.exec(content)) !== null) {
    allMatches.push({
      type: 'display',
      start: match.index,
      end: match.index + match[0].length,
      latex: match[1],
    })
  }
  while ((match = inlineRegex.exec(content)) !== null) {
    allMatches.push({
      type: 'inline',
      start: match.index,
      end: match.index + match[0].length,
      latex: match[1],
    })
  }

  allMatches.sort((a, b) => a.start - b.start)
  if (allMatches.length === 0) return escapeHtml(content)

  let result = ''
  let pos = 0
  for (const m of allMatches) {
    if (m.start > pos) result += escapeHtml(content.slice(pos, m.start))
    try {
      result += katex.renderToString(m.latex, {
        throwOnError: false,
        displayMode: m.type === 'display' || (displayMode ?? false),
        output: 'html',
      })
    } catch {
      result += escapeHtml('$' + m.latex + '$')
    }
    pos = m.end
  }
  if (pos < content.length) result += escapeHtml(content.slice(pos))
  return result
}

/**
 * LaTeX を含む文字列をレンダリング。
 * katex は初回利用時のみ動的ロードする。
 */
export function Latex(props: Props) {
  const [html] = createResource(
    () => ({ content: props.content, displayMode: props.displayMode }),
    async ({ content, displayMode }) => {
      if (!content || content === '—') return escapeHtml(content || '')
      const katex = await loadKatex()
      return renderMixedContent(katex, content, displayMode)
    }
  )

  return (
    <Show
      when={!html.loading && html()}
      fallback={<span class={props.class}>{props.content}</span>}
    >
      <span class={props.class} innerHTML={html() || ''} />
    </Show>
  )
}

/**
 * 文字列から LaTeX 部分とテキスト部分を分離。
 * formula_latex が指定されていればそれを優先。
 */
export function extractFormulaParts(
  content: string | null | undefined,
  formulaLatex?: string | null
): { text: string; latex: string | null } {
  if (formulaLatex) {
    const text = content ? content.replace(/\$[^$]*\$|\$\$[^$]*\$\$/g, '').trim() || '—' : '—'
    return { text: text || '—', latex: formulaLatex }
  }
  if (!content || content === '—') return { text: '—', latex: null }
  const displayMatch = content.match(/\$\$([^$]+)\$\$/)
  const inlineMatch = content.match(/\$([^$]+)\$/)
  const latex = displayMatch?.[1] ?? inlineMatch?.[1] ?? null
  const text = content.replace(/\$[^$]*\$|\$\$[^$]*\$\$/g, '').trim() || '—'
  return { text, latex }
}

/**
 * LaTeX のみをディスプレイモードでレンダリング（数式専用列用）
 */
export function LatexFormula(props: { latex: string; class?: string }) {
  const [html] = createResource(
    () => props.latex,
    async (latex) => {
      const katex = await loadKatex()
      try {
        return katex.renderToString(latex, {
          throwOnError: false,
          displayMode: true,
          output: 'html',
        })
      } catch {
        return escapeHtml(latex)
      }
    }
  )

  return (
    <Show
      when={!html.loading && html()}
      fallback={<div class={props.class}>{props.latex}</div>}
    >
      <div class={props.class} innerHTML={html() || ''} />
    </Show>
  )
}
