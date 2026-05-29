import { useState } from 'react'
import { FolderPlus, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import Modal from '../common/Modal'
import Button from '../common/Button'
import './NewProjectModal.css'

const PROJECT_COLORS = [
  '#6F42C1','#8F6AD8','#6554C0','#36B37E','#FF5630','#FF8B00',
  '#FFAB00','#00B8D9','#875A7B','#172B4D','#00875A',
]

function toFolderName(num, name) {
  const clean = name.trim()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')  // remove accents
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 40)
  return `${num}_${clean}`
}

export default function NewProjectModal({ isOpen, onClose, onCreated }) {
  const { addCustomProject, getAllProjects, objectives, profiles } = useStore()

  const [step, setStep]     = useState('form')  // form | creating | done | error
  const [error, setError]   = useState('')
  const [createdProject, setCreatedProject] = useState(null)

  const allProjects = getAllProjects()
  const nextNum = allProjects.length + 1

  const [form, setForm] = useState({
    name:               '',
    key:                '',
    color:              '#6F42C1',
    defaultYear:        null,
    description:        '',
    department:         '',
    lead:               '',
    startDate:          '',
    endDate:            '',
    priority:           'medium',
    strategicObjective: '',
    budget:             '',
    createFolder:       true,
    customFolderName:   '',
  })

  const set = (f, v) => setForm(prev => {
    const next = { ...prev, [f]: v }
    // Auto-generate key from name (first letters uppercase)
    if (f === 'name' && !prev.key) {
      const words = v.trim().split(/\s+/).filter(Boolean)
      next.key = words.slice(0, 3).map(w => w[0]).join('').toUpperCase().slice(0, 5)
    }
    // Auto-generate folder name
    if ((f === 'name' || f === 'customFolderName') && !prev.customFolderName) {
      next.customFolderName = toFolderName(nextNum, v)
    }
    return next
  })

  const handleCreate = async () => {
    if (!form.name.trim()) { setError('El nombre del proyecto es obligatorio.'); return }
    if (!form.key.trim())  { setError('La clave del proyecto es obligatoria.'); return }
    if (allProjects.some(p => p.key === form.key.toUpperCase())) {
      setError(`Key "${form.key.toUpperCase()}" already exists.`); return
    }

    setStep('creating')
    setError('')

    const folderName = form.customFolderName || toFolderName(nextNum, form.name)

    const tags = []

    let newProject
    try {
      newProject = await addCustomProject({
        key:                form.key.toUpperCase(),
        folder:             folderName,
        name:               form.name.trim(),
        color:              form.color,
        defaultYear:        form.defaultYear,
        description:        form.description,
        department:         form.department,
        lead:               form.lead,
        startDate:          form.startDate || null,
        endDate:            form.endDate   || null,
        priority:           form.priority,
        strategicObjective: form.strategicObjective,
        budget:             form.budget,
        tags,
      })
    } catch (e) {
      setError(e.message)
      setStep('error')
      return
    }

    setCreatedProject(newProject)
    setStep('done')
    onCreated?.(newProject)
  }

  const handleClose = () => {
    setStep('form')
    setError('')
    setForm({
      name:'', key:'', color:'#6F42C1', defaultYear:null, description:'',
      department:'', lead:'', startDate:'', endDate:'',
      priority:'medium', strategicObjective:'', budget:'', createFolder:true, customFolderName:'',
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'creating' ? undefined : handleClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderPlus size={18} color="var(--blue-primary)" />
          Nuevo proyecto
        </div>
      }
      size="lg"
      footer={step === 'form' ? (
        <>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" icon={<FolderPlus size={14} />} onClick={handleCreate}>
            Crear proyecto
          </Button>
        </>
      ) : null}
    >
      {/* ── Form ── */}
      {step === 'form' && (
        <div className="npm-form">
          {error && <div className="npm-error"><AlertCircle size={14} />{error}</div>}

          <div className="npm-row">
            <div className="npm-field npm-field--grow">
              <label className="npm-label">Nombre del proyecto <span className="npm-req">*</span></label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Website Redesign" autoFocus />
            </div>
            <div className="npm-field npm-field--sm">
              <label className="npm-label">Clave <span className="npm-req">*</span></label>
              <input value={form.key} onChange={e => set('key', e.target.value.toUpperCase().slice(0,6))}
                placeholder="WR" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: 1 }} />
            </div>
          </div>

          {/* Color */}
          <div className="npm-field">
            <label className="npm-label">Color del proyecto</label>
            <div className="npm-colors">
              {PROJECT_COLORS.map(c => (
                <button key={c} type="button" className={`npm-color-dot ${form.color === c ? 'active' : ''}`}
                  style={{ background: c }} onClick={() => set('color', c)} />
              ))}
            </div>
          </div>

          <div className="npm-field">
            <label className="npm-label">Descripcion</label>
            <textarea rows={2} value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="De que trata este proyecto?" />
          </div>

          <div className="npm-row">
            <div className="npm-field">
              <label className="npm-label">Departamento / Equipo</label>
              <input value={form.department} onChange={e => set('department', e.target.value)}
                placeholder="e.g. Engineering, Marketing..." />
            </div>
            <div className="npm-field">
              <label className="npm-label">Lider del proyecto</label>
              <select value={form.lead} onChange={e => set('lead', e.target.value)}>
                <option value="">Sin asignar</option>
                {profiles.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="npm-row">
            <div className="npm-field">
              <label className="npm-label">Prioridad</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                <option value="highest">Critica</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
          </div>

          <div className="npm-row">
            <div className="npm-field">
              <label className="npm-label">Start date</label>
              <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="npm-field">
              <label className="npm-label">End date</label>
              <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          <div className="npm-field">
            <label className="npm-label">Objetivo</label>
            <select value={form.strategicObjective} onChange={e => set('strategicObjective', e.target.value)}>
              <option value="">— Ninguno —</option>
              {objectives.map(o => <option key={o.id} value={o.label}>{o.icon} {o.label}</option>)}
            </select>
          </div>

          <div className="npm-field">
            <label className="npm-label">Presupuesto estimado</label>
            <input value={form.budget} onChange={e => set('budget', e.target.value)}
              placeholder="e.g. $10,000 USD" />
          </div>

          {/* Folder config */}
          <div className="npm-folder-section">
            <div className="npm-folder-header">
              <input type="checkbox" id="createFolder" checked={form.createFolder}
                onChange={e => set('createFolder', e.target.checked)} />
              <label htmlFor="createFolder" className="npm-folder-label">
                 Crear carpeta en tu workspace de Taskify
              </label>
            </div>
            {form.createFolder && (
              <div className="npm-folder-preview">
                <span>Nombre de carpeta:</span>
                <input value={form.customFolderName || toFolderName(nextNum, form.name)}
                  onChange={e => set('customFolderName', e.target.value)}
                  placeholder={toFolderName(nextNum, form.name)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }} />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Creating ── */}
      {step === 'creating' && (
        <div className="npm-status">
          <Loader size={40} className="animate-spin" style={{ color: 'var(--blue-primary)' }} />
          <h3>Creando proyecto...</h3>
          <p>Generando carpeta y configuracion inicial.</p>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div className="npm-status">
          <CheckCircle size={52} color="#36B37E" />
          <h3>Proyecto creado!</h3>
          <p>
            <strong>{createdProject?.name}</strong> se creo correctamente.
            {form.createFolder && <><br />Carpeta: <code>{createdProject?.folder}</code></>}
          </p>
          <Button variant="primary" onClick={handleClose}>Ir al proyecto</Button>
        </div>
      )}

      {/* ── Error ── */}
      {step === 'error' && (
        <div className="npm-status">
          <AlertCircle size={52} color="#FF5630" />
          <h3>Error al crear proyecto</h3>
          <p>{error}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => setStep('form')}>Volver</Button>
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
