import { lazy, Suspense, type Component } from 'solid-js'
import { Router, Route, Navigate } from '@solidjs/router'
import { Layout } from './components/Layout'

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard }))
)
const NobelPrizes = lazy(() =>
  import('./pages/NobelPrizes').then((m) => ({ default: m.NobelPrizes }))
)
const Tier1Awards = lazy(() =>
  import('./pages/Tier1Awards').then((m) => ({ default: m.Tier1Awards }))
)
const Awards = lazy(() =>
  import('./pages/Awards').then((m) => ({ default: m.Awards }))
)
const FrontierTopics = lazy(() =>
  import('./pages/FrontierTopics').then((m) => ({ default: m.FrontierTopics }))
)
const FrontierTopicDetail = lazy(() =>
  import('./pages/FrontierTopicDetail').then((m) => ({ default: m.FrontierTopicDetail }))
)
const Institutions = lazy(() =>
  import('./pages/Institutions').then((m) => ({ default: m.Institutions }))
)
const Schema = lazy(() =>
  import('./pages/Schema').then((m) => ({ default: m.Schema }))
)
const Sitemap = lazy(() =>
  import('./pages/Sitemap').then((m) => ({ default: m.Sitemap }))
)

function LazyPage(props: { component: Component }) {
  const Comp = props.component
  return (
    <Suspense fallback={<div style={{ padding: '1.25rem', color: '#64748b' }}>Loading…</div>}>
      <Comp />
    </Suspense>
  )
}

export default function App() {
  return (
    <Router>
      <Route path="/" component={() => <Navigate href="/en/dashboard" />} />
      <Route path="/:lang" component={Layout}>
        <Route path="/" component={() => <Navigate href="dashboard" />} />
        <Route path="dashboard" component={() => <LazyPage component={Dashboard} />} />
        <Route path="nobel" component={() => <LazyPage component={NobelPrizes} />} />
        <Route path="nobel/:category" component={() => <LazyPage component={NobelPrizes} />} />
        <Route path="tier1-awards" component={() => <LazyPage component={Tier1Awards} />} />
        <Route path="tier1-awards/:awardId" component={() => <LazyPage component={Tier1Awards} />} />
        <Route path="awards" component={() => <LazyPage component={Awards} />} />
        <Route path="frontier-topics" component={() => <LazyPage component={FrontierTopics} />} />
        <Route path="frontier-topics/:id" component={() => <LazyPage component={FrontierTopicDetail} />} />
        <Route path="institutions" component={() => <LazyPage component={Institutions} />} />
        <Route path="schema" component={() => <LazyPage component={Schema} />} />
        <Route path="sitemap" component={() => <LazyPage component={Sitemap} />} />
      </Route>
      <Route path="*404" component={() => <Navigate href="/en/dashboard" />} />
    </Router>
  )
}
