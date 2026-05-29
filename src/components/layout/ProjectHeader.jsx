import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutGrid, ListTodo, Map, BarChart2, FileText, Settings, Terminal, BookOpen, Calendar, ChevronRight, FolderOpen } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { openFolder } from '../../utils/storage'
import './ProjectHeader.css'

const STATIC_TABS = [
  { id: 'reports',   label: 'Reportes',       Icon: BarChart2  },
  { id: 'roadmap',   label: 'Hoja de Ruta',  Icon: Map        },
  { id: 'board',     label: 'Tablero',        Icon: LayoutGrid },
  { id: 'backlog',   label: 'Backlog',         Icon: ListTodo   },
  { id: 'documents', label: 'Documentos',      Icon: FileText   },
  { id: 'wiki',      label: 'Wiki',            Icon: BookOpen   },
  { id: 'meetings',  label: 'Reuniones',       Icon: Calendar   },
  { id: 'settings',  label: 'Configuración',   Icon: Settings   },
]

export default function ProjectHeader({ projectId, extra, compact = false }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { projectData, getAllProjects } = useStore()
  const allProjects = getAllProjects()

  const project   = allProjects.find(p => p.id === projectId)
  const pd        = projectData[projectId] || {}
  const pSettings   = pd.settings || {}
  const displayName = pSettings.customName || project?.name || ''
  const activeTab   = location.pathname.split('/').pop()
  const agentEnabled = pSettings.agentEnabled === true

  const TABS = agentEnabled
    ? [...STATIC_TABS.slice(0, -1), { id: 'terminal', label: 'Agente', Icon: Terminal }, STATIC_TABS[STATIC_TABS.length - 1]]
    : STATIC_TABS

  const projectFolder = pSettings.customFolder || project?.folder || ''

  // Tags from settings
  const tags = pSettings.tags || []

  return (
    <div className={`project-header ${compact ? 'project-header--compact' : ''}`}>
      <div className="project-header-top">
        <div className="project-header-breadcrumb">
          <button className="breadcrumb-home" onClick={() => navigate('/')}>Proyectos</button>
          <ChevronRight size={12} className="breadcrumb-sep" />
          <div className="breadcrumb-project">
            <span className="project-key-chip" style={{ background: project?.color || '#6F42C1' }}>
              {project?.key}
            </span>
            <span className="breadcrumb-name">{displayName}</span>
          </div>
          {/* Project tags */}
          {tags.slice(0, 3).map(tag => (
            <span key={tag.id} className="project-header-tag"
              style={{ background: tag.color + '20', color: tag.color, borderColor: tag.color + '55' }}>
              {tag.label}
            </span>
          ))}
        </div>

        <div className="project-header-actions">
          <button
            className="ph-action-btn"
            onClick={() => openFolder(projectFolder)}
            title={`Abrir carpeta: ${projectFolder}`}
          >
            <FolderOpen size={13} />
            <span>Carpeta</span>
          </button>
          {extra}
        </div>
      </div>

      <div className="project-header-tabs">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`project-tab ${activeTab === id ? 'project-tab--active' : ''}`}
            onClick={() => navigate(`/project/${projectId}/${id}`)}
          >
            <Icon size={13} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
