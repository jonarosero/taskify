import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { ISSUE_TYPES, PRIORITIES, STORY_POINTS } from '../../constants/config'
import Modal from '../common/Modal'
import Button from '../common/Button'
import Avatar from '../common/Avatar'
import IssueTypeIcon from '../common/IssueTypeIcon'
import PriorityIcon from '../common/PriorityIcon'
import './IssueModal.css'

const EMPTY_FORM = {
  title: '', description: '', type: 'task', status: 'todo',
  priority: 'medium', assignee: '', reporter: '',
  sprintId: '', epicId: '', storyPoints: '', dueDate: '', startDate: '', labels: ''
}

export default function IssueModal() {
  const {
    issueModalOpen, editingIssue, closeIssueModal,
    currentProjectId, projectData, defaultIssueStatus,
    createIssue, updateIssue, getAllProjects, profiles
  } = useStore()

  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const pid = currentProjectId
  const pData = projectData[pid] || { sprints: [], epics: [], issues: [] }
  const activeSprints = pData.sprints?.filter(s => s.status !== 'completed') || []

  useEffect(() => {
    if (issueModalOpen) {
      if (editingIssue) {
        setForm({
          title: editingIssue.title || '',
          description: editingIssue.description || '',
          type: editingIssue.type || 'task',
          status: editingIssue.status || 'todo',
          priority: editingIssue.priority || 'medium',
          assignee: editingIssue.assignee || '',
          reporter: editingIssue.reporter || '',
          sprintId: editingIssue.sprintId || '',
          epicId: editingIssue.epicId || '',
          storyPoints: editingIssue.storyPoints ?? '',
          dueDate: editingIssue.dueDate || '',
          startDate: editingIssue.startDate || '',
          labels: (editingIssue.labels || []).join(', '),
        })
      } else {
        setForm({ ...EMPTY_FORM, status: defaultIssueStatus })
      }
    }
  }, [issueModalOpen, editingIssue, defaultIssueStatus])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setSaving(true)
    const data = {
      ...form,
      storyPoints: form.storyPoints !== '' ? Number(form.storyPoints) : null,
      labels: form.labels ? form.labels.split(',').map(l => l.trim()).filter(Boolean) : [],
      assignee: form.assignee || null,
      sprintId: form.sprintId || null,
      epicId: form.epicId || null,
      dueDate: form.dueDate || null,
      startDate: form.startDate || null,
    }
    if (editingIssue) {
      await updateIssue(pid, editingIssue.id, data)
    } else {
      await createIssue(pid, data)
    }
    setSaving(false)
    closeIssueModal()
  }

  const project = getAllProjects().find(p => p.id === pid)

  return (
    <Modal
      isOpen={issueModalOpen}
      onClose={closeIssueModal}
      title={editingIssue ? `Editar: ${editingIssue.key}` : `Crear issue — ${project?.key || ''}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={closeIssueModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit} loading={saving}>
            {editingIssue ? 'Guardar cambios' : 'Crear issue'}
          </Button>
        </>
      }
    >
      <form className="issue-form" onSubmit={handleSubmit}>
        {/* Type + Priority row */}
        <div className="issue-form-row">
          <div className="issue-form-group issue-form-group--half">
            <label className="issue-form-label">Tipo</label>
            <div className="issue-type-select">
              {ISSUE_TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`issue-type-btn ${form.type === t.id ? 'active' : ''}`}
                  onClick={() => set('type', t.id)}
                  style={form.type === t.id ? { borderColor: t.color, background: t.bgColor } : {}}
                >
                  <IssueTypeIcon type={t.id} size={13} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="issue-form-group issue-form-group--quarter">
            <label className="issue-form-label">Prioridad</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITIES.map(p => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="issue-form-group issue-form-group--quarter">
            <label className="issue-form-label">Puntos</label>
            <select value={form.storyPoints} onChange={e => set('storyPoints', e.target.value)}>
              <option value="">—</option>
              {STORY_POINTS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* Title */}
        <div className="issue-form-group">
          <label className="issue-form-label">Título <span className="required">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Resumen del issue..."
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div className="issue-form-group">
          <label className="issue-form-label">Descripción</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Describe el issue en detalle..."
            rows={4}
          />
        </div>

        {/* Status + Sprint */}
        <div className="issue-form-row">
          <div className="issue-form-group issue-form-group--half">
            <label className="issue-form-label">Estado</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="todo">Por Hacer</option>
              <option value="inprogress">En Progreso</option>
              <option value="review">En Revisión</option>
              <option value="done">Completado</option>
            </select>
          </div>

          <div className="issue-form-group issue-form-group--half">
            <label className="issue-form-label">Sprint</label>
            <select value={form.sprintId} onChange={e => set('sprintId', e.target.value)}>
              <option value="">Backlog (sin sprint)</option>
              {activeSprints.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignee + Reporter */}
        <div className="issue-form-row">
          <div className="issue-form-group issue-form-group--half">
            <label className="issue-form-label">Asignado a</label>
            <div className="member-select">
              <button
                type="button"
                className={`member-option ${!form.assignee ? 'active' : ''}`}
                onClick={() => set('assignee', '')}
              >
                <span className="member-unassigned">?</span>
                <span>Sin asignar</span>
              </button>
              {profiles.map(m => (
                <button
                  key={m.id}
                  type="button"
                  className={`member-option ${form.assignee === m.id ? 'active' : ''}`}
                  onClick={() => set('assignee', m.id)}
                >
                  <Avatar memberId={m.id} size="xs" />
                  <span>{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="issue-form-group issue-form-group--half">
            <label className="issue-form-label">Reportado por</label>
            <select value={form.reporter} onChange={e => set('reporter', e.target.value)}>
              <option value="">Unassigned</option>
              {profiles.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Epic */}
        {pData.epics?.length > 0 && (
          <div className="issue-form-group">
            <label className="issue-form-label">Épica</label>
            <select value={form.epicId} onChange={e => set('epicId', e.target.value)}>
              <option value="">Sin épica</option>
              {pData.epics.map(ep => (
                <option key={ep.id} value={ep.id}>{ep.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Dates */}
        <div className="issue-form-row">
          <div className="issue-form-group issue-form-group--half">
            <label className="issue-form-label">Fecha inicio</label>
            <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
          </div>
          <div className="issue-form-group issue-form-group--half">
            <label className="issue-form-label">Fecha límite</label>
            <input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
          </div>
        </div>

        {/* Labels */}
        <div className="issue-form-group">
          <label className="issue-form-label">Etiquetas <span className="issue-form-hint">(separadas por coma)</span></label>
          <input
            type="text"
            value={form.labels}
            onChange={e => set('labels', e.target.value)}
            placeholder="ej: frontend, api, urgente"
          />
        </div>
      </form>
    </Modal>
  )
}
