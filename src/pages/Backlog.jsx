import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Play, CheckCircle, Trash2, Edit2, ChevronDown, ChevronRight, MoreHorizontal, Download, Upload, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import { useStore } from '../store/useStore'
import Avatar from '../components/common/Avatar'
import IssueTypeIcon from '../components/common/IssueTypeIcon'
import PriorityIcon from '../components/common/PriorityIcon'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import IssueModal from '../components/IssueModal/IssueModal'
import ProjectHeader from '../components/layout/ProjectHeader'
import { today } from '../utils/helpers'
import './Backlog.css'

export default function Backlog() {
  const { projectId } = useParams()
  const {
    projectData, setCurrentProject,
    createSprint, updateSprint, deleteSprint, startSprint, completeSprint,
    assignIssueToSprint, deleteIssue, openIssueModal, getAllProjects
  } = useStore()

  useEffect(() => { setCurrentProject(projectId) }, [projectId])

  const project   = getAllProjects().find(p => p.id === projectId)

  // ── Excel Export ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    const rows = issues.map(i => ({
      'Clave':       i.key        || '',
      'Tipo':        { epic:'Épica', story:'Historia', task:'Tarea', bug:'Error', subtask:'Subtarea' }[i.type] || i.type,
      'Título':      i.title      || '',
      'Descripción': i.description|| '',
      'Estado':      { todo:'Por Hacer', inprogress:'En Progreso', review:'En Revisión', done:'Completado' }[i.status] || i.status,
      'Prioridad':   { highest:'Crítica', high:'Alta', medium:'Media', low:'Baja', lowest:'Mínima' }[i.priority] || i.priority,
      'Asignado':    i.assignee   || '',
      'Sprint':      (sprints.find(s => s.id === i.sprintId)?.name) || 'Backlog',
      'Puntos':      i.storyPoints ?? '',
      'Etiquetas':   (i.labels || []).join(', '),
      'Fecha Inicio':i.startDate  || '',
      'Fecha Fin':   i.dueDate    || '',
      'Creado':      i.createdAt  || '',
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    // Column widths
    ws['!cols'] = [
      {wch:10},{wch:10},{wch:40},{wch:50},{wch:14},{wch:10},
      {wch:18},{wch:20},{wch:8},{wch:20},{wch:12},{wch:12},{wch:12}
    ]
    XLSX.utils.book_append_sheet(wb, ws, 'Backlog')

    // Metadata sheet
    const meta = XLSX.utils.aoa_to_sheet([
      ['Proyecto', project?.name || projectId],
      ['Clave',    project?.key  || ''],
      ['Exportado','2026-05-29'],
      ['Total issues', issues.length],
      [''],
      ['Columnas válidas para importar:'],
      ['Tipo', 'Épica / Historia / Tarea / Error / Subtarea'],
      ['Estado','Por Hacer / En Progreso / En Revisión / Completado'],
      ['Prioridad','Crítica / Alta / Media / Baja / Mínima'],
    ])
    XLSX.utils.book_append_sheet(wb, meta, 'Info')

    const b64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' })
    if (window.electronAPI) {
      await window.electronAPI.saveExcelBase64(b64, `Backlog-${project?.key || projectId}.xlsx`)
    }
  }

  // ── Excel Import ──────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!window.electronAPI) return
    const bufArray = await window.electronAPI.openExcelBase64()
    if (!bufArray) return

    const wb = XLSX.read(bufArray, { type: 'base64' })
    const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('backlog')) || wb.SheetNames[0]
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName])

    const TYPE_MAP  = { 'épica':'epic','epica':'epic','historia':'story','tarea':'task','error':'bug','subtarea':'subtask' }
    const STATUS_MAP= { 'por hacer':'todo','en progreso':'inprogress','en revisión':'review','en revision':'review','completado':'done' }
    const PRI_MAP   = { 'crítica':'highest','critica':'highest','alta':'high','media':'medium','baja':'low','mínima':'lowest','minima':'lowest' }

    let created = 0
    for (const row of rows) {
      const title = row['Título'] || row['Titulo'] || row['title'] || ''
      if (!title.trim()) continue
      const typeRaw   = (row['Tipo']      || 'task').toLowerCase()
      const statusRaw = (row['Estado']    || 'por hacer').toLowerCase()
      const priRaw    = (row['Prioridad'] || 'media').toLowerCase()
      await createIssue(projectId, {
        title:       title.trim(),
        description: row['Descripción'] || row['Descripcion'] || '',
        type:        TYPE_MAP[typeRaw]   || 'task',
        status:      STATUS_MAP[statusRaw] || 'todo',
        priority:    PRI_MAP[priRaw]     || 'medium',
        storyPoints: row['Puntos'] ? Number(row['Puntos']) : null,
        labels:      row['Etiquetas'] ? String(row['Etiquetas']).split(',').map(l=>l.trim()).filter(Boolean) : [],
        startDate:   row['Fecha Inicio'] || null,
        dueDate:     row['Fecha Fin']    || null,
      })
      created++
    }
    alert(`✅ ${created} issues importados correctamente.`)
  }
  const pd = projectData[projectId] || { issues: [], sprints: [] }
  const issues = pd.issues || []
  const sprints = (pd.sprints || []).filter(s => s.status !== 'completed')

  const [collapsed, setCollapsed] = useState({})
  const [sprintModal, setSprintModal] = useState(false)
  const [editSprint, setEditSprint] = useState(null)
  const [sprintForm, setSprintForm] = useState({ name: '', goal: '', startDate: '', endDate: '' })
  const [dragOver, setDragOver] = useState(null)

  const backlogIssues = issues.filter(i => !i.sprintId)
  const getSprintIssues = sid => issues.filter(i => i.sprintId === sid)
  const toggleCollapse = id => setCollapsed(c => ({ ...c, [id]: !c[id] }))

  const openSprintModal = (sprint = null) => {
    setEditSprint(sprint)
    setSprintForm(sprint
      ? { name: sprint.name, goal: sprint.goal || '', startDate: sprint.startDate || '', endDate: sprint.endDate || '' }
      : { name: `Sprint ${sprints.length + 1}`, goal: '', startDate: today(), endDate: '' }
    )
    setSprintModal(true)
  }

  const handleSprintSave = async () => {
    if (editSprint) await updateSprint(projectId, editSprint.id, sprintForm)
    else await createSprint(projectId, sprintForm)
    setSprintModal(false)
  }

  const handleDragStart = (e, issueId) => e.dataTransfer.setData('issueId', issueId)
  const handleDrop = async (e, targetSprintId) => {
    const id = e.dataTransfer.getData('issueId')
    if (id) await assignIssueToSprint(projectId, id, targetSprintId)
    setDragOver(null)
  }

  return (
    <div className="backlog-page">
      <ProjectHeader
        projectId={projectId}
        extra={
          <div style={{ display: 'flex', gap: 6 }}>
            <Button variant="secondary" size="sm" icon={<Upload size={13} />} onClick={handleImport} title="Importar issues desde Excel">
              Importar
            </Button>
            <Button variant="secondary" size="sm" icon={<Download size={13} />} onClick={handleExport} title="Exportar backlog a Excel">
              Exportar
            </Button>
            <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={() => openSprintModal()}>
              Sprint
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={() => openIssueModal(null, 'todo')}>
              Crear issue
            </Button>
          </div>
        }
      />

      <div className="backlog-body scroll-y">
        {/* Active + Planning sprints */}
        {sprints.map(sprint => {
          const sprintIssues = getSprintIssues(sprint.id)
          const doneCount = sprintIssues.filter(i => i.status === 'done').length
          const isCollapsed = collapsed[sprint.id]
          const isActive = sprint.status === 'active'

          return (
            <div
              key={sprint.id}
              className={`sprint-section ${isActive ? 'sprint-section--active' : ''} ${dragOver === sprint.id ? 'sprint-section--over' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragOver(sprint.id) }}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => handleDrop(e, sprint.id)}
            >
              <div className="sprint-header">
                <button className="sprint-toggle" onClick={() => toggleCollapse(sprint.id)}>
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                </button>
                <div className="sprint-info">
                  {isActive && <span className="sprint-active-dot" />}
                  <span className="sprint-name-text">{sprint.name}</span>
                  {isActive && <span className="sprint-active-badge">ACTIVO</span>}
                  {sprint.startDate && sprint.endDate && (
                    <span className="sprint-dates">{sprint.startDate} → {sprint.endDate}</span>
                  )}
                </div>
                <div className="sprint-counts">
                  <span>{sprintIssues.length} issues</span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{doneCount} hechos</span>
                </div>
                <div className="sprint-actions">
                  {isActive
                    ? <Button variant="secondary" size="xs" icon={<CheckCircle size={12} />} onClick={() => completeSprint(projectId, sprint.id)}>
                        Completar
                      </Button>
                    : <Button variant="success" size="xs" icon={<Play size={12} />} onClick={() => startSprint(projectId, sprint.id)}>
                        Iniciar
                      </Button>
                  }
                  <button className="sprint-icon-btn" onClick={() => openSprintModal(sprint)} title="Editar"><Edit2 size={13} /></button>
                  <button className="sprint-icon-btn sprint-icon-btn--danger" onClick={() => deleteSprint(projectId, sprint.id)} title="Eliminar"><Trash2 size={13} /></button>
                </div>
              </div>

              {sprint.goal && !isCollapsed && (
                <div className="sprint-goal-bar">
                  <strong>Meta:</strong> {sprint.goal}
                </div>
              )}

              {!isCollapsed && (
                <div className="sprint-issues">
                  {sprintIssues.length === 0
                    ? <div className="backlog-drop-hint">Arrastra issues aquí para agregarlos al sprint</div>
                    : sprintIssues.map(issue => (
                        <BacklogIssueRow
                          key={issue.id}
                          issue={issue}
                          onEdit={() => openIssueModal(issue)}
                          onDelete={() => deleteIssue(projectId, issue.id)}
                          onDragStart={e => handleDragStart(e, issue.id)}
                        />
                      ))
                  }
                </div>
              )}
            </div>
          )
        })}

        {/* Product Backlog */}
        <div
          className={`sprint-section sprint-section--backlog ${dragOver === 'backlog' ? 'sprint-section--over' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver('backlog') }}
          onDragLeave={() => setDragOver(null)}
          onDrop={e => handleDrop(e, null)}
        >
          <div className="sprint-header">
            <button className="sprint-toggle" onClick={() => toggleCollapse('backlog')}>
              {collapsed['backlog'] ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className="sprint-info">
              <span className="sprint-name-text">Backlog del producto</span>
            </div>
            <div className="sprint-counts">
              <span>{backlogIssues.length} issues sin sprint</span>
            </div>
            <div className="sprint-actions">
              <Button variant="secondary" size="xs" icon={<Plus size={12} />} onClick={() => openIssueModal(null, 'todo')}>
                Agregar issue
              </Button>
            </div>
          </div>

          {!collapsed['backlog'] && (
            <div className="sprint-issues">
              {backlogIssues.length === 0
                ? <div className="backlog-drop-hint">El backlog está vacío. Crea el primer issue.</div>
                : backlogIssues.map(issue => (
                    <BacklogIssueRow
                      key={issue.id}
                      issue={issue}
                      onEdit={() => openIssueModal(issue)}
                      onDelete={() => deleteIssue(projectId, issue.id)}
                      onDragStart={e => handleDragStart(e, issue.id)}
                    />
                  ))
              }
            </div>
          )}
        </div>

        <div style={{ height: 24 }} />
      </div>

      {/* Sprint modal */}
      <Modal
        isOpen={sprintModal}
        onClose={() => setSprintModal(false)}
        title={editSprint ? 'Editar sprint' : 'Nuevo sprint'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSprintModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSprintSave}>{editSprint ? 'Guardar' : 'Crear sprint'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="form-label">Nombre del sprint</label>
            <input value={sprintForm.name} onChange={e => setSprintForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="form-label">Meta del sprint</label>
            <textarea value={sprintForm.goal} onChange={e => setSprintForm(f => ({ ...f, goal: e.target.value }))} rows={2} placeholder="¿Qué objetivo tiene este sprint?" /></div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><label className="form-label">Inicio</label>
              <input type="date" value={sprintForm.startDate} onChange={e => setSprintForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div style={{ flex: 1 }}><label className="form-label">Fin</label>
              <input type="date" value={sprintForm.endDate} onChange={e => setSprintForm(f => ({ ...f, endDate: e.target.value }))} /></div>
          </div>
        </div>
      </Modal>

      <IssueModal />
    </div>
  )
}

function BacklogIssueRow({ issue, onEdit, onDelete, onDragStart }) {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div className="backlog-issue-row" draggable onDragStart={onDragStart}>
      <div className="backlog-issue-left">
        <span className="drag-handle">⠿</span>
        <IssueTypeIcon type={issue.type} size={13} />
        <span className="backlog-issue-key">{issue.key}</span>
        <span className="backlog-issue-title">{issue.title}</span>
        {issue.labels?.slice(0,2).map(l => (
          <span key={l} className="backlog-label">{l}</span>
        ))}
      </div>
      <div className="backlog-issue-right">
        <PriorityIcon priority={issue.priority} size={13} />
        <Badge status={issue.status} label={{ todo: 'Por hacer', inprogress: 'En progreso', review: 'Revisión', done: 'Hecho' }[issue.status]} size="sm" />
        {issue.storyPoints != null && <span className="backlog-points">{issue.storyPoints}</span>}
        {issue.assignee && <Avatar memberId={issue.assignee} size="xs" />}
        <div style={{ position: 'relative' }}>
          <button className="backlog-issue-menu" onClick={() => setMenuOpen(s => !s)}>
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="issue-card-dropdown" style={{ right: 0, top: 28 }}>
              <button className="dropdown-item" onClick={() => { onEdit(); setMenuOpen(false) }}><Edit2 size={13} /> Editar</button>
              <div className="dropdown-divider" />
              <button className="dropdown-item" style={{ color: 'var(--red)' }} onClick={() => { onDelete(); setMenuOpen(false) }}><Trash2 size={13} /> Eliminar</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
