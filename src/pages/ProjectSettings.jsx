import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Save, Plus, X, FolderOpen, Tag, Users, Calendar, FileText, Settings, UserPlus, Trash2, Terminal, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { makeInitials } from '../constants/members'
import { PROJECT_STATUSES } from '../constants/config'
import ProjectHeader from '../components/layout/ProjectHeader'
import Button from '../components/common/Button'
import Avatar from '../components/common/Avatar'
import Modal  from '../components/common/Modal'
import { openFolder } from '../utils/storage'
import './ProjectSettings.css'

const TAG_COLORS = [
  '#6F42C1','#8F6AD8','#6554C0','#36B37E','#FF5630','#FF8B00',
  '#FFAB00','#00B8D9','#875A7B','#00875A','#172B4D',
]

export default function ProjectSettings() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { projectData, setCurrentProject, updateProjectSettings, deleteCustomProject, customProjects, getAllProjects, objectives, profiles, addProfile, deleteProfile } = useStore()

  useEffect(() => { setCurrentProject(projectId) }, [projectId])

  const allProjects = getAllProjects()
  const project  = allProjects.find(p => p.id === projectId)
  const pd       = projectData[projectId] || {}
  const saved    = pd.settings || {}

  const [form, setForm] = useState({
    customName:         '',
    description:        '',
    lead:               '',
    team:               [],
    extraMembers:       [],
    department:         '',
    status:             'planning',
    startDate:          '',
    endDate:            '',
    plannedYear:        project?.defaultYear ?? 2026,
    tags:               [],
    customFolder:       '',
    priority:           'medium',
    budget:             '',
    notes:              '',
    strategicObjective: '',
  })
  const [saving, setSaving]           = useState(false)
  const [saved2, setSaved2]           = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteMode, setDeleteMode]   = useState('keep')   // 'keep' | 'folder'
  const [deleting, setDeleting]       = useState(false)
  const isCustomProject = customProjects.some(p => p.id === projectId)
  const [newTag, setNewTag]           = useState({ label: '', color: '#6F42C1' })
  const [showTagForm, setShowTagForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [newMember, setNewMember]     = useState({ name: '', role: '', area: '', color: '#6F42C1' })

  // Load from store
  useEffect(() => {
    if (saved) {
      setForm(f => ({
        ...f,
        customName:      saved.customName      || '',
        description:     saved.description     || '',
        lead:            saved.lead            || '',
        team:            saved.team            || [],
        extraMembers:    saved.extraMembers    || [],
        department:      saved.department      || '',
        status:          saved.status          || 'planning',
        startDate:       saved.startDate       || '',
        endDate:         saved.endDate         || '',
        plannedYear:     saved.plannedYear     !== undefined ? saved.plannedYear : (project?.defaultYear ?? 2026),
        tags:            saved.tags            || [],
        customFolder:       saved.customFolder       || '',
        priority:           saved.priority           || 'medium',
        budget:             saved.budget             || '',
        notes:              saved.notes              || '',
        strategicObjective: saved.strategicObjective || '',
        agentEnabled:       saved.agentEnabled  ?? false,
        agentCommand:       saved.agentCommand  || 'opencode',
      }))
    }
  }, [projectId])

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const toggleTeamMember = (id) => {
    setForm(f => ({
      ...f,
      team: f.team.includes(id) ? f.team.filter(m => m !== id) : [...f.team, id]
    }))
  }

  const addTag = () => {
    if (!newTag.label.trim()) return
    const tag = { id: `tag-${Date.now()}`, label: newTag.label.trim(), color: newTag.color }
    setForm(f => ({ ...f, tags: [...f.tags, tag] }))
    setNewTag({ label: '', color: TAG_COLORS[(form.tags.length + 1) % TAG_COLORS.length] })
    setShowTagForm(false)
  }

  const removeTag = (id) => setForm(f => ({ ...f, tags: f.tags.filter(t => t.id !== id) }))

  const addExtraMember = () => {
    if (!newMember.name.trim()) return
    addProfile({
      name: newMember.name.trim(),
      role: newMember.role.trim(),
      area: newMember.area.trim(),
      initials: makeInitials(newMember.name),
      color: newMember.color,
    })
    setNewMember({ name: '', role: '', area: '', color: TAG_COLORS[(profiles.length || 0) % TAG_COLORS.length] })
    setShowMemberForm(false)
  }

  const removeExtraMember = (id) => deleteProfile(id)

  const handleSave = async () => {
    setSaving(true)
    const updates = {
      ...form,
      plannedYear: form.plannedYear === '' ? null : form.plannedYear,
    }
    await updateProjectSettings(projectId, updates)
    setSaving(false)
    setSaved2(true)
    setTimeout(() => setSaved2(false), 2500)
  }

  const effectiveName   = form.customName   || project?.name   || ''
  const effectiveFolder = form.customFolder || project?.folder || ''

  const handleDelete = async () => {
    if (deleteInput !== 'eliminar') return
    setDeleting(true)
    if (deleteMode === 'folder' && window.electronAPI?.deleteProjectFolder) {
      await window.electronAPI.deleteProjectFolder(effectiveFolder)
    }
    // For non-custom projects, just clear the data
    if (!isCustomProject) {
      await updateProjectSettings(projectId, { ...form, _cleared: true })
      setDeleteModal(false)
      setDeleting(false)
      return
    }
    if (isCustomProject) await deleteCustomProject(projectId)
    navigate('/')
  }

  return (
    <div className="pset-page">
      <ProjectHeader
        projectId={projectId}
        extra={
          <Button
            variant="primary"
            icon={<Save size={14} />}
            onClick={handleSave}
            loading={saving}
          >
            {saved2 ? '¡Guardado!' : 'Guardar cambios'}
          </Button>
        }
      />

      <div className="pset-body scroll-y">
        <div className="pset-grid">

          {/* ── Información general ── */}
          <section className="pset-section">
            <div className="pset-section-header">
              <FileText size={16} />
              <h2>Información general</h2>
            </div>

            <div className="pset-field">
              <label className="pset-label">Nombre del proyecto</label>
              <input
                type="text"
                value={form.customName}
                onChange={e => set('customName', e.target.value)}
                placeholder={project?.name}
              />
              <span className="pset-hint">Deja vacío para usar el nombre original: <em>{project?.name}</em></span>
            </div>

            <div className="pset-field">
              <label className="pset-label">Descripción</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe los objetivos, alcance y contexto del proyecto..."
              />
            </div>

            <div className="pset-row">
              <div className="pset-field">
                <label className="pset-label">Estado del proyecto</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}>
                  {PROJECT_STATUSES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div className="pset-field">
                <label className="pset-label">Prioridad</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                  <option value="critical">Crítica</option>
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
                </select>
              </div>
            </div>

            <div className="pset-field">
              <label className="pset-label">Área / Departamento requirente</label>
              <input
                type="text"
                value={form.department}
                onChange={e => set('department', e.target.value)}
                placeholder="Ej: Operaciones, Comercial, Finanzas..."
              />
            </div>

            <div className="pset-field">
              <label className="pset-label">Objetivo estratégico TI</label>
              <select value={form.strategicObjective} onChange={e => set('strategicObjective', e.target.value)}>
                <option value="">— Sin asignar —</option>
                {objectives.map(o => <option key={o.id} value={o.label}>{o.icon ? `${o.icon} ` : ''}{o.label}</option>)}
              </select>
              {form.strategicObjective && (
                <span className="pset-hint">Aligned with a custom objective from your workspace config.</span>
              )}
            </div>

            <div className="pset-field">
              <label className="pset-label">Notas internas</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Observaciones, dependencias, riesgos conocidos..."
              />
            </div>
          </section>

          {/* ── Planificación ── */}
          <section className="pset-section">
            <div className="pset-section-header">
              <Calendar size={16} />
              <h2>Planificación</h2>
            </div>

            <div className="pset-field">
              <label className="pset-label">Agrupación por año</label>
              <span className="pset-hint">
                Taskify agrupa el proyecto automaticamente usando el año de la fecha de inicio.
              </span>
            </div>

            <div className="pset-row">
              <div className="pset-field">
                <label className="pset-label">Fecha de inicio esperada</label>
                <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
              </div>
              <div className="pset-field">
                <label className="pset-label">Fecha de fin esperada</label>
                <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
              </div>
            </div>

            <div className="pset-field">
              <label className="pset-label">Presupuesto estimado</label>
              <input
                type="text"
                value={form.budget}
                onChange={e => set('budget', e.target.value)}
                placeholder="Ej: $15,000 USD / 12,000 EUR"
              />
            </div>
          </section>

          {/* ── Equipo ── */}
          <section className="pset-section">
            <div className="pset-section-header">
              <Users size={16} />
              <h2>Equipo del proyecto</h2>
            </div>

            <div className="pset-field">
              <label className="pset-label">Jefe / Líder del proyecto</label>
              <div className="pset-member-grid">
                {profiles.length === 0 && <span className="pset-hint">No people yet. Create a person below first.</span>}
                {profiles.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    className={`pset-member-card ${form.lead === m.id ? 'active' : ''}`}
                    onClick={() => set('lead', m.id)}
                    style={form.lead === m.id ? { borderColor: m.color, background: m.color + '12' } : {}}
                  >
                    <Avatar memberId={m.id} size="md" />
                    <div className="pset-member-info">
                      <span className="pset-member-name">{m.name}</span>
                      <span className="pset-member-role">{m.role}</span>
                    </div>
                    {form.lead === m.id && (
                      <span className="pset-leader-badge" style={{ background: m.color }}>Líder</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="pset-field">
              <label className="pset-label">Equipo asignado</label>
              <div className="pset-team-grid">
                {profiles.map(m => {
                  const inTeam = form.team.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      className={`pset-team-chip ${inTeam ? 'active' : ''}`}
                      onClick={() => toggleTeamMember(m.id)}
                      style={inTeam ? { borderColor: m.color, background: m.color + '18', color: m.color } : {}}
                    >
                      <Avatar memberId={m.id} size="xs" />
                      <span>{m.name}</span>
                      {inTeam ? <X size={12} /> : <Plus size={12} />}
                    </button>
                  )
                })}
              </div>
            </div>
            {/* Extra / external members */}
            <div className="pset-field">
              <label className="pset-label">Personal adicional / externos</label>
              <span className="pset-hint" style={{ marginBottom: 8, display: 'block' }}>
                Stakeholders, responsables de área u otras personas involucradas que no son del equipo TI.
              </span>

              {/* List of extra members */}
              {profiles.length > 0 && (
                <div className="pset-extra-members">
                  {profiles.map(m => (
                    <div key={m.id} className="pset-extra-member-row">
                      <span className="pset-extra-avatar" style={{ background: m.color }}>
                        {m.initials}
                      </span>
                      <div className="pset-extra-member-info">
                        <span className="pset-member-name">{m.name}</span>
                        <span className="pset-member-role">
                          {m.role}{m.area ? ` · ${m.area}` : ''}
                        </span>
                      </div>
                      <button className="pset-tag-remove pset-icon-btn" onClick={() => removeExtraMember(m.id)}>
                        <Trash2 size={13} style={{ color: 'var(--red)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add member button */}
              <button className="pset-add-tag-btn" style={{ marginTop: 8 }} onClick={() => setShowMemberForm(s => !s)}>
                <UserPlus size={13} /> Agregar persona
              </button>

              {/* Add member form */}
              {showMemberForm && (
                <div className="pset-tag-form" style={{ marginTop: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="pset-label">Nombre completo *</label>
                      <input
                        type="text"
                        value={newMember.name}
                        onChange={e => setNewMember(f => ({ ...f, name: e.target.value }))}
                        placeholder="Ej: Carlos Mendoza"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="pset-label">Cargo / Rol</label>
                      <input
                        type="text"
                        value={newMember.role}
                        onChange={e => setNewMember(f => ({ ...f, role: e.target.value }))}
                        placeholder="Ej: Gerente de Operaciones"
                      />
                    </div>
                    <div>
                      <label className="pset-label">Área / Departamento</label>
                      <input
                        type="text"
                        value={newMember.area}
                        onChange={e => setNewMember(f => ({ ...f, area: e.target.value }))}
                        placeholder="Ej: Operaciones, Comercial..."
                      />
                    </div>
                    <div>
                      <label className="pset-label">Color de avatar</label>
                      <div className="pset-color-row" style={{ marginTop: 6 }}>
                        {TAG_COLORS.map(c => (
                          <button
                            key={c} type="button"
                            className={`pset-color-dot ${newMember.color === c ? 'active' : ''}`}
                            style={{ background: c }}
                            onClick={() => setNewMember(f => ({ ...f, color: c }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <Button variant="primary" size="sm" onClick={addExtraMember}>Agregar</Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowMemberForm(false)}>Cancelar</Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Tags ── */}
          <section className="pset-section">
            <div className="pset-section-header">
              <Tag size={16} />
              <h2>Etiquetas del proyecto</h2>
            </div>
            <span className="pset-hint" style={{ marginBottom: 12, display: 'block' }}>
              Las etiquetas aparecen en el sidebar y en la tarjeta del proyecto para clasificación rápida.
            </span>

            <div className="pset-tags-list">
              {form.tags.map(tag => (
                <span key={tag.id} className="pset-tag" style={{ background: tag.color + '20', color: tag.color, borderColor: tag.color + '55' }}>
                  {tag.label}
                  <button className="pset-tag-remove" onClick={() => removeTag(tag.id)}>
                    <X size={11} />
                  </button>
                </span>
              ))}
              <button className="pset-add-tag-btn" onClick={() => setShowTagForm(s => !s)}>
                <Plus size={13} /> Nueva etiqueta
              </button>
            </div>

            {showTagForm && (
              <div className="pset-tag-form">
                <input
                  type="text"
                  value={newTag.label}
                  onChange={e => setNewTag(f => ({ ...f, label: e.target.value }))}
                  placeholder="Nombre de la etiqueta..."
                  onKeyDown={e => e.key === 'Enter' && addTag()}
                  autoFocus
                  style={{ flex: 1 }}
                />
                <div className="pset-color-row">
                  {TAG_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`pset-color-dot ${newTag.color === c ? 'active' : ''}`}
                      style={{ background: c }}
                      onClick={() => setNewTag(f => ({ ...f, color: c }))}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="primary" size="sm" onClick={addTag}>Agregar</Button>
                  <Button variant="secondary" size="sm" onClick={() => setShowTagForm(false)}>Cancelar</Button>
                </div>
              </div>
            )}
          </section>

          {/* ── Agente IA ── */}
          <section className="pset-section">
            <div className="pset-section-header">
              <Terminal size={16} />
              <h2>Agente IA / Terminal</h2>
            </div>

            <div className="pset-field">
              <div className="pset-agent-toggle">
                <label className="pset-agent-label">
                  <input
                    type="checkbox"
                    checked={form.agentEnabled}
                    onChange={e => set('agentEnabled', e.target.checked)}
                  />
                  <span>Habilitar pestaña de Agente IA en este proyecto</span>
                </label>
              </div>
              <span className="pset-hint">
                Cuando está activo, aparece la pestaña <strong>Agente</strong> en la barra de navegación del proyecto.
                El agente podrá acceder únicamente a la carpeta de este proyecto.
              </span>
            </div>

            {form.agentEnabled && (
              <div className="pset-field">
                <label className="pset-label">Comando del agente</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['opencode','claude','cursor','aider','custom'].map(cmd => (
                    <button key={cmd} type="button"
                      className={`pset-year-btn ${form.agentCommand === cmd ? 'active' : ''}`}
                      onClick={() => set('agentCommand', cmd)} style={{ fontSize: 12 }}>
                      {cmd}
                    </button>
                  ))}
                </div>
                {form.agentCommand === 'custom' && (
                  <input style={{ marginTop: 8 }}
                    value={''} onChange={e => set('agentCommand', e.target.value)}
                    placeholder="Escribe el comando..." />
                )}
                <span className="pset-hint">
                  El agente debe estar instalado en tu equipo para funcionar.<br />
                  <strong>opencode</strong>: <code>npm install -g opencode-ai</code> ·
                  <strong> claude</strong>: <code>npm install -g @anthropic-ai/claude-code</code> ·
                  <strong> aider</strong>: <code>pip install aider-install && aider-install</code>
                </span>
              </div>
            )}
          </section>

          {/* ── Carpeta ── */}
          <section className="pset-section">
            <div className="pset-section-header">
              <FolderOpen size={16} />
              <h2>Carpeta del proyecto</h2>
            </div>

            <div className="pset-field">
              <label className="pset-label">Ruta de la carpeta</label>
              <div className="pset-folder-row">
                <input
                  type="text"
                  value={form.customFolder}
                  onChange={e => set('customFolder', e.target.value)}
                  placeholder={project?.folder}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<FolderOpen size={13} />}
                  onClick={() => openFolder(effectiveFolder)}
                >
                  Abrir
                </Button>
              </div>
              <span className="pset-hint">
                Relative to your selected Taskify workspace. Default: <code>{project?.folder}</code>
              </span>
            </div>

            <div className="pset-folder-info">
              <div className="pset-info-row">
                <span>Clave del proyecto</span>
                <code>{project?.key}</code>
              </div>
              <div className="pset-info-row">
                <span>ID interno</span>
                <code>{project?.id}</code>
              </div>
              <div className="pset-info-row">
                <span>Carpeta activa</span>
                <code>{effectiveFolder}</code>
              </div>
            </div>
          </section>

        {/* ── Zona de peligro ── */}
          <section className="pset-section pset-section--danger">
            <div className="pset-section-header" style={{ color: 'var(--red)' }}>
              <AlertTriangle size={16} />
              <h2 style={{ color: 'var(--text)' }}>Zona de peligro</h2>
            </div>
            <div className="pset-danger-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>Eliminar proyecto</div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 3 }}>
                  {isCustomProject
                    ? 'Elimina el proyecto de Taskify. Puedes mantener o borrar la carpeta de archivos.'
                    : 'Este proyecto solo se puede limpiar, no eliminar del sistema.'}
                </div>
              </div>
              <Button
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={() => { setDeleteInput(''); setDeleteModal(true) }}
              >
                {isCustomProject ? 'Eliminar proyecto' : 'Limpiar datos'}
              </Button>
            </div>
          </section>

        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)' }}>
            <AlertTriangle size={18} /> Confirmar eliminación
          </div>
        }
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteModal(false)}>Cancelar</Button>
            <Button
              variant="danger"
              icon={<Trash2 size={14} />}
              onClick={handleDelete}
              loading={deleting}
              disabled={deleteInput !== 'eliminar'}
            >
              {isCustomProject ? 'Eliminar proyecto' : 'Limpiar datos del proyecto'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ padding: '12px 14px', background: '#FFEBE6', borderRadius: 'var(--radius)', border: '1px solid #FFBDAD', fontSize: 13, color: '#DE350B', lineHeight: 1.5 }}>
            {isCustomProject
              ? <>Esta acción <strong>no se puede deshacer</strong>. Se eliminará el proyecto <strong>"{effectiveName}"</strong> y todos sus issues, sprints y datos.</>
              : <>Se limpiarán todos los issues, sprints y datos del proyecto <strong>"{effectiveName}"</strong>.</>
            }
          </div>

          {isCustomProject && (
            <div>
              <label className="pset-label">¿Qué hacer con la carpeta de archivos?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="deleteMode" value="keep" checked={deleteMode === 'keep'} onChange={() => setDeleteMode('keep')} />
                  <span><strong>Mantener carpeta</strong> — Solo eliminar el proyecto en Taskify</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13 }}>
                  <input type="radio" name="deleteMode" value="folder" checked={deleteMode === 'folder'} onChange={() => setDeleteMode('folder')} style={{ marginTop: 2 }} />
                  <span>
                    <strong style={{ color: 'var(--red)' }}>Eliminar carpeta y archivos</strong>
                    <br /><span style={{ color: 'var(--text-subtle)', fontSize: 12 }}>Borrará permanentemente <code>{effectiveFolder}/</code> con todo su contenido.</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="pset-label">Escribe <strong>eliminar</strong> para confirmar</label>
            <input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value.toLowerCase())}
              placeholder="eliminar"
              autoFocus
              style={{ borderColor: deleteInput === 'eliminar' ? 'var(--red)' : undefined }}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
