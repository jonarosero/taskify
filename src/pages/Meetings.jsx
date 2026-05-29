import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Clock, ExternalLink, Link, CheckCircle, Video, X, Calendar } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useStore } from '../store/useStore'
import Avatar from '../components/common/Avatar'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import ProjectHeader from '../components/layout/ProjectHeader'
import './Meetings.css'

const GCAL_BASE = 'https://calendar.google.com/calendar/render'

function toGCalDate(date, time) {
  if (!date) return ''
  const d = date.replace(/-/g, '')
  const t = (time || '09:00').replace(':', '') + '00'
  return `${d}T${t}`
}

function buildGCalUrl(meeting) {
  const start = toGCalDate(meeting.date, meeting.startTime)
  const end   = toGCalDate(meeting.date, meeting.endTime   || meeting.startTime)
  const desc  = encodeURIComponent(
    (meeting.description || '') + (meeting.meetUrl ? `\n\nEnlace: ${meeting.meetUrl}` : '')
  )
  const title = encodeURIComponent(meeting.title || 'Reunión')
  return `${GCAL_BASE}?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${desc}&ctz=America/Guayaquil`
}

const EMPTY_FORM = {
  title: '', date: '', startTime: '09:00', endTime: '10:00',
  projectId: '', description: '', attendees: [],
  meetUrl: '', location: '', recurrence: 'none',
}

export default function Meetings() {
  const { projectId } = useParams()   // undefined when accessed from /meetings
  const { meetings, saveMeeting, deleteMeeting, googleCalConfig, saveGoogleCalConfig, getAllProjects, setCurrentProject, profiles } = useStore()

  useEffect(() => { if (projectId) setCurrentProject(projectId) }, [projectId])
  const [modalOpen, setModalOpen]   = useState(false)
  const [editMeeting, setEditMeeting] = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [viewMode, setViewMode]     = useState('list')   // 'list' | 'calendar'
  const [calMonth, setCalMonth]     = useState(() => { const n = new Date(); return { y: n.getFullYear(), m: n.getMonth() } })
  const [gcalInput, setGcalInput]   = useState(googleCalConfig?.calendarId || '')
  const [showGcalConfig, setShowGcalConfig] = useState(false)
  const [saved, setSaved]           = useState(false)

  const allProjects = getAllProjects()
  const currentProject = projectId ? allProjects.find(p => p.id === projectId) : null

  // Filter meetings by project when inside a project route
  const filteredMeetings = projectId
    ? meetings.filter(m => m.projectId === projectId)
    : meetings

  const openCreate = () => {
    setEditMeeting(null)
    setForm({ ...EMPTY_FORM, projectId: projectId || '' })
    setModalOpen(true)
  }

  const openEdit = (m) => {
    setEditMeeting(m)
    setForm({ ...EMPTY_FORM, ...m, attendees: m.attendees || [] })
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.date) return
    const m = await saveMeeting({ ...form, id: editMeeting?.id })
    setModalOpen(false)
    // Auto-add to Google Calendar in browser if configured
    if (googleCalConfig?.autoOpen) {
      window.open(buildGCalUrl(m), '_blank')
    }
  }

  const openInGCal = (m) => window.open(buildGCalUrl(m), '_blank')

  const connectGCal = async () => {
    const config = { calendarId: gcalInput.trim(), connected: true, autoOpen: true }
    await saveGoogleCalConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setShowGcalConfig(false)
  }

  const setF = (f, v) => setForm(p => ({ ...p, [f]: v }))

  const toggleAttendee = (id) => setForm(p => ({
    ...p, attendees: p.attendees.includes(id) ? p.attendees.filter(a => a !== id) : [...p.attendees, id]
  }))

  // Sort and group meetings
  const sorted = [...filteredMeetings].sort((a, b) => {
    const da = new Date(`${a.date}T${a.startTime || '00:00'}`)
    const db = new Date(`${b.date}T${b.startTime || '00:00'}`)
    return da - db
  })

  const today = new Date().toISOString().slice(0,10)
  const upcoming = sorted.filter(m => m.date >= today)
  const past     = sorted.filter(m => m.date <  today)

  // Calendar grid
  const daysInMonth = new Date(calMonth.y, calMonth.m + 1, 0).getDate()
  const firstDay    = new Date(calMonth.y, calMonth.m, 1).getDay()
  const cells       = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  const getMeetingsForDay = (d) => {
    const ds = `${calMonth.y}-${String(calMonth.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    return sorted.filter(m => m.date === ds)
  }

  return (
    <div className="meet-page">
      {/* Header — project header if inside a project, global header otherwise */}
      {projectId
        ? <ProjectHeader projectId={projectId} extra={
            <Button variant="primary" icon={<Plus size={14} />} onClick={openCreate}>Nueva reunión</Button>
          } />
        : <div className="meet-header">
            <div>
              <h1 className="ph-title">Reuniones</h1>
              <p className="ph-subtitle">Todas las reuniones del equipo TI · Google Calendar</p>
            </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" icon={<Link size={13} />} onClick={() => setShowGcalConfig(s => !s)}>
              {googleCalConfig?.connected ? '✅ Google Calendar' : 'Conectar Google Calendar'}
            </Button>
            <div className="meet-view-toggle">
              <button className={`wiki-mode-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>Lista</button>
              <button className={`wiki-mode-btn ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>Calendario</button>
            </div>
            <Button variant="primary" icon={<Plus size={14} />} onClick={openCreate}>Nueva reunión</Button>
          </div>
          </div>
      }

      {/* Google Cal config banner */}
      {showGcalConfig && (
        <div className="meet-gcal-banner">
          <div className="meet-gcal-inner">
            <div style={{ flex: 1 }}>
              <strong>Google Calendar</strong> — Al crear una reunión, se abrirá automáticamente Google Calendar
              con el evento pre-llenado para que lo guardes con un clic.
              <br />
              <span style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 4, display: 'block' }}>
                Calendar ID (optional):
              </span>
            </div>
            <input
              style={{ width: 280 }}
              value={gcalInput}
              onChange={e => setGcalInput(e.target.value)}
              placeholder="tu@email.com"
            />
            <Button variant="primary" size="sm" onClick={connectGCal}>
              {saved ? '✅ Guardado' : 'Guardar'}
            </Button>
            <button className="meet-gcal-close" onClick={() => setShowGcalConfig(false)}><X size={16} /></button>
          </div>
        </div>
      )}

      <div className="meet-body scroll-y">
        {viewMode === 'list' ? (
          <div className="meet-list">
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <div>
                <div className="meet-section-title">Próximas ({upcoming.length})</div>
                {upcoming.map(m => <MeetingRow key={m.id} m={m} allProjects={allProjects} onEdit={openEdit} onDelete={deleteMeeting} onGCal={openInGCal} />)}
              </div>
            )}
            {/* Past */}
            {past.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="meet-section-title" style={{ opacity: 0.6 }}>Pasadas ({past.length})</div>
                {[...past].reverse().slice(0, 5).map(m => <MeetingRow key={m.id} m={m} allProjects={allProjects} onEdit={openEdit} onDelete={deleteMeeting} onGCal={openInGCal} past />)}
              </div>
            )}
            {meetings.length === 0 && (
              <div className="empty-state">
                <Calendar size={48} />
                <h3>Sin reuniones</h3>
                <p>Crea tu primera reunión y sincronízala con Google Calendar.</p>
                <Button variant="primary" icon={<Plus size={14} />} onClick={openCreate}>Nueva reunión</Button>
              </div>
            )}
          </div>
        ) : (
          /* Calendar view */
          <div className="meet-calendar">
            <div className="meet-cal-header">
              <button className="meet-cal-nav" onClick={() => setCalMonth(m => { const d = new Date(m.y, m.m-1,1); return { y: d.getFullYear(), m: d.getMonth() } })}>‹</button>
              <span className="meet-cal-title">{MONTHS[calMonth.m]} {calMonth.y}</span>
              <button className="meet-cal-nav" onClick={() => setCalMonth(m => { const d = new Date(m.y, m.m+1,1); return { y: d.getFullYear(), m: d.getMonth() } })}>›</button>
            </div>
            <div className="meet-cal-grid">
              {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                <div key={d} className="meet-cal-dow">{d}</div>
              ))}
              {cells.map((d, i) => {
                if (!d) return <div key={`empty-${i}`} className="meet-cal-cell meet-cal-cell--empty" />
                const dayMeetings = getMeetingsForDay(d)
                const ds = `${calMonth.y}-${String(calMonth.m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
                const isToday = ds === today
                return (
                  <div key={d} className={`meet-cal-cell ${isToday ? 'meet-cal-cell--today' : ''}`}>
                    <span className="meet-cal-day">{d}</span>
                    {dayMeetings.map(m => (
                      <div key={m.id} className="meet-cal-event" onClick={() => openEdit(m)}
                        title={`${m.startTime} ${m.title}`}>
                        {m.startTime} {m.title}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Meeting modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMeeting ? 'Editar reunión' : 'Nueva reunión'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancelar</Button>
            {editMeeting && (
              <Button variant="secondary" icon={<ExternalLink size={13} />} onClick={() => openInGCal(editMeeting)}>
                Ver en GCal
              </Button>
            )}
            <Button variant="primary" onClick={handleSave}>
              {editMeeting ? 'Guardar' : 'Crear reunión'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="form-label">Título <span style={{ color: 'var(--red)' }}>*</span></label>
            <input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Nombre de la reunión..." autoFocus />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">Fecha *</label>
              <input type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Inicio</label>
              <input type="time" value={form.startTime} onChange={e => setF('startTime', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Fin</label>
              <input type="time" value={form.endTime} onChange={e => setF('endTime', e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label">Proyecto relacionado</label>
            <select value={form.projectId} onChange={e => setF('projectId', e.target.value)}>
              <option value="">— Sin proyecto —</option>
              {allProjects.map(p => <option key={p.id} value={p.id}>{p.key} — {p.name}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Descripción / agenda</label>
            <textarea rows={3} value={form.description} onChange={e => setF('description', e.target.value)} placeholder="Puntos a tratar, objetivos de la reunión..." />
          </div>

          <div>
            <label className="form-label">Participantes</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {profiles.map(m => {
                const sel = form.attendees.includes(m.id)
                return (
                  <button key={m.id} type="button"
                    className={`pset-team-chip ${sel ? 'active' : ''}`}
                    style={sel ? { borderColor: m.color, background: m.color + '18', color: m.color } : {}}
                    onClick={() => toggleAttendee(m.id)}>
                    <Avatar memberId={m.id} size="xs" />
                    <span>{m.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label"><Video size={12} style={{ display: 'inline', marginRight: 4 }} />Enlace Meet/Zoom</label>
              <input value={form.meetUrl} onChange={e => setF('meetUrl', e.target.value)} placeholder="https://meet.google.com/..." />
            </div>
            <div>
              <label className="form-label">Ubicación</label>
              <input value={form.location} onChange={e => setF('location', e.target.value)} placeholder="Sala de reuniones / Virtual" />
            </div>
          </div>

          {googleCalConfig?.connected && (
            <div className="meet-gcal-note">
              <CheckCircle size={13} color="#36B37E" />
              Al guardar, se abrirá Google Calendar para añadir el evento a tu calendario.
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function MeetingRow({ m, allProjects, onEdit, onDelete, onGCal, past }) {
  const proj = allProjects.find(p => p.id === m.projectId)
  return (
    <div className={`meet-row ${past ? 'meet-row--past' : ''}`}>
      <div className="meet-row-date">
        <div className="meet-row-day">{m.date ? new Date(m.date + 'T12:00').getDate() : '—'}</div>
        <div className="meet-row-month">{m.date ? MONTHS[new Date(m.date + 'T12:00').getMonth()] : ''}</div>
      </div>
      <div className="meet-row-info">
        <div className="meet-row-title">{m.title}</div>
        <div className="meet-row-meta">
          <span><Clock size={11} /> {m.startTime}{m.endTime ? ` – ${m.endTime}` : ''}</span>
          {proj && <span style={{ color: proj.color, fontWeight: 600 }}>{proj.key}</span>}
          {m.location && <span>{m.location}</span>}
        </div>
        {(m.attendees || []).length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            {m.attendees.map(id => <Avatar key={id} memberId={id} size="xs" />)}
          </div>
        )}
      </div>
      <div className="meet-row-actions">
        {m.meetUrl && (
          <a href={m.meetUrl} target="_blank" rel="noreferrer" className="meet-action-btn" title="Unirse">
            <Video size={13} />
          </a>
        )}
        <button className="meet-action-btn" title="Google Calendar" onClick={() => onGCal(m)}>
          <ExternalLink size={13} />
        </button>
        <button className="meet-action-btn" title="Editar" onClick={() => onEdit(m)}>
          <Edit2 size={13} />
        </button>
        <button className="meet-action-btn meet-action-btn--danger" title="Eliminar" onClick={() => onDelete(m.id)}>
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
