import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutGrid, ListTodo, Map, BarChart2, FileText, Settings, BookOpen,
  ChevronDown, ChevronRight, CalendarDays,
  Home, PanelLeftClose, PanelLeft, Search, Terminal
} from 'lucide-react'
import { useStore } from '../../store/useStore'
import { getProgressPercent } from '../../utils/helpers'
import logoUrl from '../../assets/icon.png'
import './Sidebar.css'

const I18N = {
  es: { reports:'Reportes', roadmap:'Hoja de Ruta', board:'Tablero', backlog:'Backlog', documents:'Documentos', wiki:'Wiki', meetings:'Reuniones', terminal:'Agente IA', settings:'Configuracion', expand:'Expandir', collapse:'Colapsar', home:'Inicio - Proyectos', projects:'PROYECTOS', search:'Buscar proyecto...', noYear:'Sin fecha', noResults:'Sin resultados', config:'Configuracion' },
  en: { reports:'Reports', roadmap:'Roadmap', board:'Board', backlog:'Backlog', documents:'Documents', wiki:'Wiki', meetings:'Meetings', terminal:'AI Agent', settings:'Settings', expand:'Expand', collapse:'Collapse', home:'Home - Projects', projects:'PROJECTS', search:'Search project...', noYear:'No date', noResults:'No results', config:'Settings' },
}

const PROJECT_NAV = [
  { id: 'reports',   label: 'Reportes',         Icon: BarChart2  },
  { id: 'roadmap',   label: 'Hoja de Ruta',    Icon: Map        },
  { id: 'board',     label: 'Tablero',          Icon: LayoutGrid },
  { id: 'backlog',   label: 'Backlog',           Icon: ListTodo   },
  { id: 'documents', label: 'Documentos',        Icon: FileText   },
  { id: 'wiki',      label: 'Wiki',              Icon: BookOpen   },
  { id: 'meetings',  label: 'Reuniones',         Icon: CalendarDays },
  { id: 'terminal',  label: 'Agente IA',         Icon: Terminal  , conditional: 'agentEnabled' },
  { id: 'settings',  label: 'Configuración',     Icon: Settings   },
]

const YEAR_COLORS = {
  2026: '#6F42C1',
  2027: '#8F6AD8',
  2028: '#36B37E',
  2029: '#FF8B00',
  null: '#6B778C',
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { sidebarCollapsed, toggleSidebar, projectData, getProjectYear, getAllProjects, settings } = useStore()
  const t = I18N[settings.language || 'es'] || I18N.es
  const ALL_PROJECTS = getAllProjects()
  const [expandedProject, setExpandedProject] = useState(null)
  const [collapsedYears, setCollapsedYears] = useState({})
  const [search, setSearch] = useState('')

  const activeProjectId = location.pathname.match(/\/project\/([^/]+)/)?.[1]
  const activeView      = location.pathname.split('/').pop()

  const filtered = search.trim()
    ? ALL_PROJECTS.filter(p => {
        const name = (projectData[p.id]?.settings?.customName || p.name).toLowerCase()
        return name.includes(search.toLowerCase()) || p.key.toLowerCase().includes(search.toLowerCase())
      })
    : null  // null = show grouped by year

  const toggleProject = (id) => setExpandedProject(p => p === id ? null : id)
  const toggleYear = (yr) => setCollapsedYears(c => ({ ...c, [String(yr)]: !c[String(yr)] }))
  const isExpanded = (id) => expandedProject === id || activeProjectId === id

  const navToProject = (id, view = 'board') => navigate(`/project/${id}/${view}`)

  // Group by year when not searching
  const byYear = {}
  const yearKeys = [...new Set([...ALL_PROJECTS.map(p => getProjectYear(p.id)).filter(Boolean), null])]
    .sort((a, b) => (a === null ? 1 : b === null ? -1 : a - b))
  yearKeys.forEach(yr => { byYear[yr] = [] })
  ALL_PROJECTS.forEach(p => {
    const yr = getProjectYear(p.id)
    const key = yr || null
    byYear[key] = [...(byYear[key] || []), p]
  })

  const projectsToShow = filtered || []  // used in search mode
  const showYearGroups = !filtered

  const renderProjectItem = (project) => {
    const expanded = isExpanded(project.id)
    const pd = projectData[project.id]
    const progress = pd ? getProgressPercent(pd.issues || []) : 0
    const hasActiveSprint = pd?.sprints?.some(s => s.status === 'active')
    const isActive = activeProjectId === project.id
    const pSettings = pd?.settings || {}
    const displayName = pSettings.customName || project.name
    const tags = pSettings.tags || []

    return (
      <div key={project.id} className="sidebar-project-group">
        <button
          className={`sidebar-project-btn ${isActive ? 'active' : ''}`}
          onClick={() => { toggleProject(project.id); if (!expanded) navToProject(project.id) }}
        >
          <span className="sidebar-project-key" style={{ background: project.color }}>
            {project.key}
          </span>
          <span className="sidebar-project-name">{displayName}</span>
          {hasActiveSprint && <span className="sidebar-sprint-dot" title="Sprint activo" />}
          {tags.slice(0, 2).map(t => (
            <span key={t.id} className="sidebar-project-tag" style={{ background: t.color, title: t.label }} />
          ))}
          {expanded ? <ChevronDown size={10} className="sidebar-chevron" /> : <ChevronRight size={10} className="sidebar-chevron" />}
        </button>

        {expanded && (
          <div className="sidebar-project-subnav">
            {PROJECT_NAV.filter(nav => {
              if (!nav.conditional) return true
              if (nav.conditional === 'agentEnabled') return pSettings?.agentEnabled === true
              return true
            }).map(({ id, label, Icon }) => {
              const path = `/project/${project.id}/${id}`
              return (
                <button
                  key={id}
                  className={`sidebar-subnav-item ${location.pathname === path ? 'active' : ''}`}
                  onClick={() => navigate(path)}
                >
                  <Icon size={13} />
                  <span>{t[id] || label}</span>
                </button>
              )
            })}
            {progress > 0 && (
              <div className="sidebar-progress-wrap">
                <div className="sidebar-progress-bar">
                  <div className="sidebar-progress-fill" style={{ width: `${progress}%`, background: project.color }} />
                </div>
                <span className="sidebar-progress-pct">{progress}%</span>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ─── Collapsed sidebar ───────────────────────────────────────────────────
  if (sidebarCollapsed) {
    return (
      <aside className="sidebar sidebar--collapsed">
        <button className="sidebar-toggle" onClick={toggleSidebar} title={t.expand}>
          <PanelLeft size={17} />
        </button>
        <div className="sidebar-collapsed-list">
          <button className={`sidebar-icon-btn ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')} title={t.home}>
            <Home size={15} />
          </button>
          {ALL_PROJECTS.map(p => (
            <button key={p.id} className={`sidebar-icon-btn ${activeProjectId === p.id ? 'active' : ''}`}
              onClick={() => navToProject(p.id)} title={`${p.key} — ${p.name}`}>
              <span className="sidebar-project-dot" style={{ background: p.color }} />
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <button className="sidebar-icon-btn" onClick={() => navigate('/settings')} title={t.config}>
            <Settings size={14} />
          </button>
        </div>
      </aside>
    )
  }

  // ─── Full sidebar ────────────────────────────────────────────────────────
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <img className="sidebar-logo-img" src={logoUrl} alt="Taskify" />
          <div className="sidebar-logo-text">
            <span className="sidebar-logo-title">Taskify</span>
            <span className="sidebar-logo-sub">by jonarosero</span>
          </div>
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar} title={t.collapse}>
          <PanelLeftClose size={14} />
        </button>
      </div>

      {/* Home + global nav */}
      <nav className="sidebar-nav-section">
        <button className={`sidebar-nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={() => navigate('/')}>
          <Home size={14} />
          <span>{t.home}</span>
        </button>
        <button className={`sidebar-nav-item ${location.pathname === '/meetings' ? 'active' : ''}`} onClick={() => navigate('/meetings')}>
          <CalendarDays size={14} />
          <span>{t.meetings}</span>
        </button>
      </nav>

      {/* Section label + count */}
      <div className="sidebar-section-label">{t.projects} ({ALL_PROJECTS.length})</div>

      {/* Search */}
      <div className="sidebar-search">
        <Search size={11} className="sidebar-search-icon" />
        <input
          type="text"
          className="sidebar-search-input"
          placeholder={t.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Projects list */}
      <div className="sidebar-projects scroll-y">
        {search.trim() ? (
          // SEARCH RESULTS (flat list)
          <>
            {ALL_PROJECTS
              .filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.key.toLowerCase().includes(search.toLowerCase()))
              .map(renderProjectItem)
            }
          </>
        ) : (
          // YEAR GROUPS
          yearKeys.map(yr => {
            const projects = byYear[yr] || []
            if (projects.length === 0) return null
            const color = YEAR_COLORS[yr] || '#6B778C'
            const isCollapsed = collapsedYears[String(yr)]
            const yearLabel = yr ? String(yr) : t.noYear

            return (
              <div key={String(yr)} className="sidebar-year-group">
                <button
                  className="sidebar-year-header"
                  onClick={() => toggleYear(yr)}
                >
                  {isCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                  <span className="sidebar-year-chip" style={{ background: color }}>
                    {yearLabel}
                  </span>
                  <span className="sidebar-year-count">{projects.length}</span>
                </button>
                {!isCollapsed && (
                  <div className="sidebar-year-projects">
                    {projects.map(renderProjectItem)}
                  </div>
                )}
              </div>
            )
          })
        )}

        {search.trim() && ALL_PROJECTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.key.toLowerCase().includes(search.toLowerCase())).length === 0 && (
          <div className="sidebar-no-results">{t.noResults}</div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="sidebar-share-btn" onClick={() => navigate('/settings')}>
          <Settings size={13} />
          <span>{t.config}</span>
        </button>
        <div className="sidebar-version">Taskify · v1.0.0 · MIT License</div>
      </div>
    </aside>
  )
}
