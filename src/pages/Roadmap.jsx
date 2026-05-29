import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Trash2, Edit2, CalendarDays } from 'lucide-react'
import { useStore } from '../store/useStore'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import IssueTypeIcon from '../components/common/IssueTypeIcon'
import ProjectHeader from '../components/layout/ProjectHeader'
import { today } from '../utils/helpers'
import { format, eachMonthOfInterval, parseISO, differenceInDays, isValid } from 'date-fns'
import { es } from 'date-fns/locale'
import './Roadmap.css'

const EPIC_COLORS = ['#6F42C1','#8F6AD8','#36B37E','#FF8B00','#FF5630','#00B8D9','#FFAB00','#875A7B']

export default function Roadmap() {
  const { projectId } = useParams()
  const { projectData, setCurrentProject, createEpic, updateEpic, deleteEpic, getAllProjects } = useStore()

  useEffect(() => { setCurrentProject(projectId) }, [projectId])

  const project = getAllProjects().find(p => p.id === projectId)
  const pd = projectData[projectId] || { epics: [], issues: [] }
  const epics = pd.epics || []
  const issues = pd.issues || []

  const [epicModal, setEpicModal] = useState(false)
  const [editEpic, setEditEpic] = useState(null)
  const [epicForm, setEpicForm] = useState({ title: '', description: '', color: '#6554C0', startDate: '', endDate: '' })

  const timelineStart = new Date('2026-01-01')
  const timelineEnd   = new Date('2029-12-31')
  const totalDays = differenceInDays(timelineEnd, timelineStart)
  const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd })
  const LABEL_WIDTH = 280

  const pctOf = (dateStr) => {
    if (!dateStr) return null
    try {
      const d = parseISO(dateStr)
      if (!isValid(d)) return null
      const days = differenceInDays(d, timelineStart)
      return Math.max(0, Math.min(100, (days / totalDays) * 100))
    } catch { return null }
  }

  const openEpicModal = (epic = null) => {
    setEditEpic(epic)
    setEpicForm(epic
      ? { title: epic.title, description: epic.description || '', color: epic.color || '#6554C0', startDate: epic.startDate || '', endDate: epic.endDate || '' }
      : { title: '', description: '', color: EPIC_COLORS[epics.length % EPIC_COLORS.length], startDate: today(), endDate: '' }
    )
    setEpicModal(true)
  }

  const handleSave = async () => {
    if (!epicForm.title.trim()) return
    if (editEpic) await updateEpic(projectId, editEpic.id, epicForm)
    else await createEpic(projectId, epicForm)
    setEpicModal(false)
  }

  const todayPct = pctOf(today())

  return (
    <div className="roadmap-page">
      <ProjectHeader
        projectId={projectId}
        extra={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => openEpicModal()}>
            Nueva épica
          </Button>
        }
      />

      {epics.length === 0 ? (
        <div className="empty-state" style={{ flex: 1 }}>
          <CalendarDays size={56} />
          <h3>Sin épicas aún</h3>
          <p>Crea épicas para visualizar el cronograma del proyecto en el período 2026–2029.</p>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => openEpicModal()}>Crear primera épica</Button>
        </div>
      ) : (
        <div className="roadmap-scroll-area scroll-x">
          <div className="roadmap-inner" style={{ minWidth: `${LABEL_WIDTH + months.length * 88}px` }}>

            {/* Month header */}
            <div className="roadmap-month-header">
              <div className="roadmap-label-cell" />
              {months.map(m => (
                <div key={m.toISOString()} className="roadmap-month-cell">
                  {format(m, 'MMM yy', { locale: es })}
                </div>
              ))}
            </div>

            {/* Epics */}
            <div className="roadmap-epics scroll-y" style={{ flex: 1 }}>
              {epics.map(epic => {
                const startPct = pctOf(epic.startDate)
                const endPct   = pctOf(epic.endDate)
                const epicIssues = issues.filter(i => i.epicId === epic.id)
                const doneCount  = epicIssues.filter(i => i.status === 'done').length
                const pct = epicIssues.length > 0 ? Math.round(doneCount / epicIssues.length * 100) : null

                return (
                  <div key={epic.id} className="roadmap-epic-row">
                    {/* Label */}
                    <div className="roadmap-label-cell roadmap-epic-label">
                      <div className="roadmap-epic-name">
                        <IssueTypeIcon type="epic" size={12} />
                        <span>{epic.title}</span>
                      </div>
                      <div className="roadmap-epic-actions">
                        {pct !== null && <span className="roadmap-pct-badge">{pct}%</span>}
                        <span className="roadmap-issue-count">{epicIssues.length}</span>
                        <button className="sprint-icon-btn" onClick={() => openEpicModal(epic)} title="Editar"><Edit2 size={11} /></button>
                        <button className="sprint-icon-btn sprint-icon-btn--danger" onClick={() => deleteEpic(projectId, epic.id)} title="Eliminar"><Trash2 size={11} /></button>
                      </div>
                    </div>

                    {/* Timeline area */}
                    <div className="roadmap-timeline-area" style={{ position: 'relative' }}>
                      {/* Grid lines */}
                      {months.map(m => (
                        <div key={m.toISOString()} className="roadmap-grid-cell" />
                      ))}

                      {/* Epic bar */}
                      {startPct !== null && endPct !== null && (
                        <div
                          className="roadmap-bar"
                          style={{
                            left: `${startPct}%`,
                            width: `${Math.max(endPct - startPct, 0.5)}%`,
                            background: epic.color,
                          }}
                          title={`${epic.title}\n${epic.startDate} → ${epic.endDate}`}
                        >
                          <span className="roadmap-bar-label">{epic.title}</span>
                          {pct !== null && <span className="roadmap-bar-pct">{pct}%</span>}
                        </div>
                      )}

                      {/* Issue dots */}
                      {epicIssues.map(issue => {
                        const p = pctOf(issue.dueDate || issue.startDate)
                        if (p === null) return null
                        return (
                          <div
                            key={issue.id}
                            className={`roadmap-issue-dot roadmap-issue-dot--${issue.status}`}
                            style={{ left: `calc(${p}% - 4px)` }}
                            title={`${issue.key}: ${issue.title}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Today line — positioned over the whole chart area */}
              {todayPct !== null && (
                <div
                  className="roadmap-today-line"
                  style={{ left: `calc(${LABEL_WIDTH}px + ${todayPct}% * (100% - ${LABEL_WIDTH}px) / 100)` }}
                >
                  <span className="roadmap-today-label">Hoy</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Epic modal */}
      <Modal
        isOpen={epicModal}
        onClose={() => setEpicModal(false)}
        title={editEpic ? 'Editar épica' : 'Nueva épica'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEpicModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave}>{editEpic ? 'Guardar' : 'Crear'}</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label className="form-label">Título de la épica</label>
            <input value={epicForm.title} onChange={e => setEpicForm(f => ({ ...f, title: e.target.value }))} autoFocus /></div>
          <div><label className="form-label">Descripción</label>
            <textarea value={epicForm.description} onChange={e => setEpicForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div>
            <label className="form-label">Color</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {EPIC_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setEpicForm(f => ({ ...f, color: c }))}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: epicForm.color === c ? '3px solid var(--text)' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}><label className="form-label">Inicio</label>
              <input type="date" value={epicForm.startDate} onChange={e => setEpicForm(f => ({ ...f, startDate: e.target.value }))} /></div>
            <div style={{ flex: 1 }}><label className="form-label">Fin</label>
              <input type="date" value={epicForm.endDate} onChange={e => setEpicForm(f => ({ ...f, endDate: e.target.value }))} /></div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
