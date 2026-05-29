import { useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import useMeetingNotifier from './hooks/useMeetingNotifier'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useStore } from './store/useStore'
import WorkspaceSetup from './components/WorkspaceSetup'
import Layout from './components/layout/Layout'
import ProjectsHome    from './pages/ProjectsHome'
import Board           from './pages/Board'
import Backlog         from './pages/Backlog'
import Roadmap         from './pages/Roadmap'
import Reports         from './pages/Reports'
import Documents       from './pages/Documents'
import ProjectSettings from './pages/ProjectSettings'
import Terminal        from './pages/Terminal'
import Wiki            from './pages/Wiki'
import Meetings        from './pages/Meetings'
import AppSettings     from './pages/AppSettings'

export default function App() {
  const { theme, initStore, workspace, initializing, settings } = useStore()

  useEffect(() => { initStore() }, [])
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme) }, [theme])
  useEffect(() => { document.documentElement.setAttribute('lang', settings.language || 'es') }, [settings.language])
  useMeetingNotifier()

  if (initializing) return null
  if (!workspace.configured) return <WorkspaceSetup />

  return (
    <HashRouter>
      <Layout>
        <ErrorBoundary>
          <Routes>
            <Route path="/"                                 element={<ProjectsHome />}    />
            <Route path="/project/:projectId/board"         element={<Board />}           />
            <Route path="/project/:projectId/backlog"       element={<Backlog />}         />
            <Route path="/project/:projectId/roadmap"       element={<Roadmap />}         />
            <Route path="/project/:projectId/reports"       element={<Reports />}         />
            <Route path="/project/:projectId/documents"     element={<Documents />}       />
            <Route path="/project/:projectId/settings"      element={<ProjectSettings />} />
            <Route path="/project/:projectId/terminal"      element={<Terminal />}        />
            <Route path="/project/:projectId/wiki"          element={<Wiki />}            />
            <Route path="/project/:projectId/meetings"      element={<Meetings />}        />
            <Route path="/meetings"                         element={<Meetings />}        />
            <Route path="/settings"                         element={<AppSettings />}     />
            <Route path="*"                                 element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </Layout>
    </HashRouter>
  )
}
