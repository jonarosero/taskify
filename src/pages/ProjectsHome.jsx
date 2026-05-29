import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, FolderOpen, TrendingUp, LayoutGrid, Calendar, Plus, Target, Layers, Settings, Trash2, Edit2, Check, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import { PROJECT_STATUSES } from '../constants/config'
import { getMemberById } from '../constants/members'
import { getProgressPercent, countByStatus, generateId } from '../utils/helpers'
import Avatar from '../components/common/Avatar'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import NewProjectModal from '../components/NewProjectModal/NewProjectModal'
import './ProjectsHome.css'

const I18N = {
  es: { projects:'Proyectos', project:'proyecto', projectsLower:'proyectos', objectives:'Objetivos', newProject:'Nuevo proyecto', activeSprints:'Sprints activos', progress:'Avance global', totalIssues:'Issues totales', groupBy:'Agrupar por:', startYear:'Año de inicio', objective:'Objetivo', emptyTitle:'Aun no hay proyectos', emptyText:'Crea tu primer proyecto para empezar a organizar el trabajo.', createProject:'Crear proyecto', noObjective:'Sin objetivo', noDate:'Sin fecha', manageObjectives:'Gestionar objetivos', objectiveHelp:'Los objetivos sirven para agrupar proyectos. Puedes asignar un objetivo desde la configuracion de cada proyecto.', objectiveName:'Nombre del objetivo...', add:'Agregar', noObjectives:'Aun no hay objetivos. Agrega uno arriba.', close:'Cerrar', todo:'por hacer', inProgress:'en progreso', done:'completadas', noIssues:'Sin issues', unassigned:'Sin asignar' },
  en: { projects:'Projects', project:'project', projectsLower:'projects', objectives:'Objectives', newProject:'New project', activeSprints:'Active sprints', progress:'Global progress', totalIssues:'Total issues', groupBy:'Group by:', startYear:'Start year', objective:'Objective', emptyTitle:'No projects yet', emptyText:'Create your first project to start tracking work.', createProject:'Create project', noObjective:'No objective', noDate:'No date', manageObjectives:'Manage objectives', objectiveHelp:'Objectives are used to group projects. You can assign an objective to each project in its settings.', objectiveName:'Objective name...', add:'Add', noObjectives:'No objectives yet. Add one above.', close:'Close', todo:'todo', inProgress:'in progress', done:'done', noIssues:'No issues', unassigned:'Unassigned' },
}

const OBJECTIVE_ICONS = ['🎯', '🚀', '💡', '📈', '🛡️', '⚙️', '📦', '🧩', '✨', '🏁', '🔒', '🌱']

const YEAR_CONFIG = {
  2024: { label: '2024', color: '#6B778C', bg: '#F4F5F7' },
  2025: { label: '2025', color: '#00B8D9', bg: '#E6FCFF' },
  2026: { label: '2026', color: '#6F42C1', bg: '#F0E7FF' },
  2027: { label: '2027', color: '#8F6AD8', bg: '#F4EDFF' },
  2028: { label: '2028', color: '#36B37E', bg: '#E3FCEF' },
  2029: { label: '2029', color: '#FF8B00', bg: '#FFF0EB' },
  null: { label: 'Sin fecha', color: '#6B778C', bg: '#F4F5F7' },
}

export default function ProjectsHome() {
  const navigate = useNavigate()
  const { projectData, getProjectYear, getAllProjects, objectives, addObjective, updateObjective, deleteObjective, settings } = useStore()
  const t = I18N[settings.language || 'es'] || I18N.es
  const [groupBy, setGroupBy]         = useState('year')
  const [collapsedGroups, setCollapsedGroups] = useState({})
  const [showNewProject, setShowNewProject]   = useState(false)
  const [showManageObj, setShowManageObj]     = useState(false)

  const allProjects = getAllProjects()
  const toggleGroup = (key) => setCollapsedGroups(c => ({ ...c, [key]: !c[key] }))

  let totalIssues = 0, doneIssues = 0, activeSprints = 0
  allProjects.forEach(p => {
    const pd = projectData[p.id] || {}
    const iss = pd.issues || []
    totalIssues  += iss.length
    doneIssues   += iss.filter(i => i.status === 'done').length
    activeSprints += (pd.sprints || []).filter(s => s.status === 'active').length
  })

  const goToProject = (pid) => navigate(`/project/${pid}/board`)

  let groups = []

  if (groupBy === 'year') {
    const byYear = {}
    const yearKeys = [...new Set([...allProjects.map(p => getProjectYear(p.id)).filter(Boolean), null])]
      .sort((a, b) => (a === null ? 1 : b === null ? -1 : a - b))
    yearKeys.forEach(yr => { byYear[yr] = [] })
    allProjects.forEach(p => {
      const yr = getProjectYear(p.id)
      const key = yr || null
      byYear[key] = [...(byYear[key] || []), p]
    })
    groups = yearKeys
      .filter(yr => (byYear[yr] || []).length > 0)
      .map(yr => {
        const cfg = YEAR_CONFIG[yr] || YEAR_CONFIG[null]
        return { key: String(yr), label: yr ? cfg.label : t.noDate, color: cfg.color, bg: cfg.bg, projects: byYear[yr] }
      })
  } else {
    const byObj = {}
    allProjects.forEach(p => {
      const pd = projectData[p.id] || {}
      const obj = pd.settings?.strategicObjective || ''
      byObj[obj] = [...(byObj[obj] || []), p]
    })
    groups = Object.entries(byObj)
      .sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : a.localeCompare(b)))
      .map(([obj, projects]) => {
        const objDef = objectives.find(o => o.label === obj)
        const color = objDef?.color || '#6B778C'
        const icon  = objDef?.icon  || '📁'
        return { key: obj || 'none', label: obj || t.noObjective, color, bg: color + '18', icon, projects }
      })
  }

  return (
    <div className="ph-page">
      <div className="ph-header">
        <div>
          <h1 className="ph-title">{t.projects}</h1>
          <p className="ph-subtitle">{allProjects.length} {allProjects.length === 1 ? t.project : t.projectsLower}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" icon={<Settings size={14} />} onClick={() => setShowManageObj(true)}>
            {t.objectives}
          </Button>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowNewProject(true)}>
            {t.newProject}
          </Button>
        </div>
      </div>

      <div className="ph-stats-row">
        <div className="ph-stat">
          <div className="ph-stat-icon" style={{ background: '#F0E7FF', color: '#6F42C1' }}><FolderOpen size={18} /></div>
          <div><div className="ph-stat-num">{allProjects.length}</div><div className="ph-stat-lbl">{t.projects}</div></div>
        </div>
        <div className="ph-stat">
          <div className="ph-stat-icon" style={{ background: '#EAE6FF', color: '#6554C0' }}><LayoutGrid size={18} /></div>
          <div><div className="ph-stat-num">{activeSprints}</div><div className="ph-stat-lbl">{t.activeSprints}</div></div>
        </div>
        <div className="ph-stat">
          <div className="ph-stat-icon" style={{ background: '#E3FCEF', color: '#36B37E' }}><TrendingUp size={18} /></div>
          <div><div className="ph-stat-num">{totalIssues > 0 ? Math.round(doneIssues / totalIssues * 100) : 0}%</div><div className="ph-stat-lbl">{t.progress}</div></div>
        </div>
        <div className="ph-stat">
          <div className="ph-stat-icon" style={{ background: '#FFF0EB', color: '#FF8B00' }}><Calendar size={18} /></div>
          <div><div className="ph-stat-num">{totalIssues}</div><div className="ph-stat-lbl">{t.totalIssues}</div></div>
        </div>
      </div>

      <div className="ph-group-toggle">
        <span className="ph-toggle-label">{t.groupBy}</span>
        <button className={`ph-toggle-btn ${groupBy === 'year' ? 'active' : ''}`} onClick={() => setGroupBy('year')}>
          <Calendar size={13} /> {t.startYear}
        </button>
        <button className={`ph-toggle-btn ${groupBy === 'objective' ? 'active' : ''}`} onClick={() => setGroupBy('objective')}>
          <Target size={13} /> {t.objective}
        </button>
      </div>

      <div className="ph-content scroll-y">
        {allProjects.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <Layers size={48} />
            <h3>{t.emptyTitle}</h3>
            <p>{t.emptyText}</p>
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowNewProject(true)}>
              {t.createProject}
            </Button>
          </div>
        ) : (
          groups.map(group => {
            const isCollapsed = collapsedGroups[group.key]
            return (
              <div key={group.key} className="ph-year-group">
                <div className="ph-year-header" onClick={() => toggleGroup(group.key)}>
                  <button className="ph-year-toggle">
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  </button>
                  {group.icon && <span className="ph-group-icon">{group.icon}</span>}
                  <span className="ph-year-badge" style={{ background: group.bg, color: group.color, borderColor: group.color + '44' }}>
                    {group.label}
                  </span>
                  <span className="ph-year-count">{group.projects.length} {group.projects.length === 1 ? t.project : t.projectsLower}</span>
                </div>

                {!isCollapsed && (
                  <div className="ph-cards-grid">
                    {group.projects.map(project => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        pd={projectData[project.id]}
                        currentYear={getProjectYear(project.id)}
                        t={t}
                        onOpen={() => goToProject(project.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <NewProjectModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        onCreated={(p) => { setShowNewProject(false); navigate(`/project/${p.id}/board`) }}
      />

      <ManageObjectivesModal
        isOpen={showManageObj}
        onClose={() => setShowManageObj(false)}
        objectives={objectives}
        onAdd={addObjective}
        onUpdate={updateObjective}
        onDelete={deleteObjective}
        t={t}
      />
    </div>
  )
}

// ── Manage Objectives Modal ───────────────────────────────────────────────────
function ManageObjectivesModal({ isOpen, onClose, objectives, onAdd, onUpdate, onDelete, t }) {
  const [newLabel, setNewLabel] = useState('')
  const [newIcon,  setNewIcon]  = useState('🎯')
  const [newColor, setNewColor] = useState('#BD93F9')
  const [editing,  setEditing]  = useState(null)  // {id, label, icon, color}

  const handleAdd = async () => {
    if (!newLabel.trim()) return
    await onAdd({ label: newLabel.trim(), icon: newIcon, color: newColor })
    setNewLabel(''); setNewIcon('🎯'); setNewColor('#BD93F9')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.manageObjectives} size="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>
          {t.objectiveHelp}
        </p>

        {/* Add new */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={newIcon} onChange={e => setNewIcon(e.target.value)} style={{ width: 58, textAlign: 'center', fontSize: 18, padding: '4px' }}>
            {OBJECTIVE_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
          </select>
          <input value={newLabel} onChange={e => setNewLabel(e.target.value)}
            placeholder={t.objectiveName} style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
            style={{ width: 40, height: 36, padding: 2, border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer' }} />
          <Button variant="primary" icon={<Plus size={13} />} onClick={handleAdd}>{t.add}</Button>
        </div>

        {/* List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
          {objectives.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-subtle)', padding: '24px 0', fontSize: 13 }}>
              {t.noObjectives}
            </div>
          )}
          {objectives.map(obj => (
            <div key={obj.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
              {editing?.id === obj.id ? (
                <>
                  <select value={editing.icon} onChange={e => setEditing(v => ({...v, icon: e.target.value}))}
                    style={{ width: 48, textAlign: 'center', fontSize: 16, padding: '2px 4px' }}>
                    {OBJECTIVE_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                  <input value={editing.label} onChange={e => setEditing(v => ({...v, label: e.target.value}))}
                    style={{ flex: 1 }} />
                  <input type="color" value={editing.color} onChange={e => setEditing(v => ({...v, color: e.target.value}))}
                    style={{ width: 36, height: 30, padding: 2, border: 'none', cursor: 'pointer' }} />
                  <button onClick={async () => { await onUpdate(obj.id, editing); setEditing(null) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#50FA7B' }}><Check size={15} /></button>
                  <button onClick={() => setEditing(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)' }}><X size={15} /></button>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 16 }}>{obj.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{obj.label}</span>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: obj.color, flexShrink: 0 }} />
                  <button onClick={() => setEditing({ id: obj.id, label: obj.label, icon: obj.icon, color: obj.color })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: 2 }}><Edit2 size={13} /></button>
                  <button onClick={() => onDelete(obj.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5630', padding: 2 }}><Trash2 size={13} /></button>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'right' }}>
          <Button variant="secondary" onClick={onClose}>{t.close}</Button>
        </div>
      </div>
    </Modal>
  )
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, pd, currentYear, onOpen, t }) {
  const issues   = pd?.issues   || []
  const sprints  = pd?.sprints  || []
  const pSettings = pd?.settings || {}
  const progress  = getProgressPercent(issues)
  const counts    = countByStatus(issues)
  const profiles = useStore(s => s.profiles)
  const lead      = getMemberById(pSettings.lead, profiles)
  const statusCfg = PROJECT_STATUSES.find(s => s.id === (pSettings.status || 'planning'))
  const activeSprint = sprints.find(s => s.status === 'active')
  const tags = pSettings.tags || []

  return (
    <div className="ph-card">
      <div className="ph-card-bar" style={{ background: project.color }} />

      <div className="ph-card-body" onClick={onOpen}>
        <div className="ph-card-top">
          <span className="ph-card-key" style={{ color: project.color, borderColor: project.color + '55', background: project.color + '11' }}>
            {project.key}
          </span>
          <span className="ph-card-status" style={{ color: statusCfg?.color, background: statusCfg?.color + '18' }}>
            {statusCfg?.label}
          </span>
        </div>

        <h3 className="ph-card-name">{pSettings.customName || project.name}</h3>

        {tags.length > 0 && (
          <div className="ph-card-tags">
            {tags.slice(0, 3).map(t => (
              <span key={t.id} className="ph-card-tag" style={{ background: t.color + '18', color: t.color, borderColor: t.color + '44' }}>
                {t.label}
              </span>
            ))}
          </div>
        )}

        {activeSprint && (
          <div className="ph-card-sprint">
            <span className="ph-sprint-dot" />
            <span>{activeSprint.name}</span>
          </div>
        )}

        <div className="ph-card-progress">
          <div className="ph-prog-bar">
            <div className="ph-prog-fill" style={{ width: `${progress}%`, background: project.color }} />
          </div>
          <span className="ph-prog-pct">{progress}%</span>
        </div>

        <div className="ph-card-counts">
          {counts.todo > 0       && <span className="ph-cnt ph-cnt--todo">{counts.todo} {t.todo}</span>}
          {counts.inprogress > 0 && <span className="ph-cnt ph-cnt--prog">{counts.inprogress} {t.inProgress}</span>}
          {counts.done > 0       && <span className="ph-cnt ph-cnt--done">{counts.done} {t.done}</span>}
          {issues.length === 0   && <span className="ph-cnt ph-cnt--empty">{t.noIssues}</span>}
        </div>

        <div className="ph-card-footer">
          <div className="ph-card-lead">
            <Avatar memberId={pSettings.lead} size="xs" />
            <span>{lead?.name || t.unassigned}</span>
          </div>
          <span className="ph-card-total">{issues.length} issues</span>
        </div>
      </div>

      <div className="ph-card-move" onClick={e => e.stopPropagation()}>
        <span className="ph-move-btn"><Calendar size={11} />{currentYear ?? 'Sin fecha'}</span>
      </div>
    </div>
  )
}
