import { useEffect, useState } from 'react'
import { FolderOpen, Moon, Sun, Share2, Users, Target, Languages, Plus, Trash2, Save } from 'lucide-react'
import { useStore } from '../store/useStore'
import { makeInitials } from '../constants/members'
import Button from '../components/common/Button'
import ShareModal from '../components/ShareModal/ShareModal'
import './ProjectsHome.css'
import './ProjectSettings.css'

const COLORS = ['#6F42C1', '#8F6AD8', '#B392F0', '#50FA7B', '#FF79C6', '#FFB86C', '#8BE9FD', '#FF5555']
const ICONS = ['🎯', '🚀', '💡', '📈', '🛡️', '⚙️', '📦', '🧩', '✨', '🏁', '🔒', '🌱']
const I18N = {
  es: { title:'Configuracion', subtitle:'Ajustes globales del workspace de Taskify', folder:'Carpeta de trabajo', current:'Workspace actual', move:'Mover / cambiar carpeta', appearance:'Apariencia', light:'Modo claro', dark:'Modo oscuro Dracula', language:'Idioma', save:'Guardar cambios', saved:'Cambios guardados', languageHint:'El idioma cambia la plantilla principal de la interfaz entre español e ingles.', share:'Compartir', shareOpen:'Abrir opciones de compartir', profiles:'Perfiles', name:'Nombre', role:'Rol', create:'Crear', noProfiles:'No hay perfiles. Crea las personas que trabajaran en tus proyectos.', objectives:'Objetivos', objectiveName:'Nombre del objetivo' },
  en: { title:'Settings', subtitle:'Global settings for your Taskify workspace', folder:'Workspace folder', current:'Current workspace', move:'Move / change folder', appearance:'Appearance', light:'Light mode', dark:'Dracula dark mode', language:'Language', save:'Save changes', saved:'Changes saved', languageHint:'Language switches the main interface template between Spanish and English.', share:'Share', shareOpen:'Open sharing options', profiles:'Profiles', name:'Name', role:'Role', create:'Create', noProfiles:'No profiles yet. Create the people who will work on your projects.', objectives:'Objectives', objectiveName:'Objective name' },
}

export default function AppSettings() {
  const {
    theme, setTheme, workspace, setupWorkspace, profiles, addProfile, deleteProfile,
    objectives, addObjective, deleteObjective, settings, updateSettings,
  } = useStore()
  const [showShare, setShowShare] = useState(false)
  const [person, setPerson] = useState({ name: '', role: '', email: '', color: COLORS[0] })
  const [objective, setObjective] = useState({ label: '', icon: '🎯', color: COLORS[0] })
  const [languageDraft, setLanguageDraft] = useState(settings.language || 'es')
  const [saved, setSaved] = useState(false)
  const t = I18N[settings.language || 'es'] || I18N.es

  useEffect(() => setLanguageDraft(settings.language || 'es'), [settings.language])

  const saveLanguage = async () => {
    await updateSettings({ language: languageDraft })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const createPerson = async () => {
    if (!person.name.trim()) return
    await addProfile({
      ...person,
      name: person.name.trim(),
      initials: makeInitials(person.name),
    })
    setPerson({ name: '', role: '', email: '', color: COLORS[(profiles.length + 1) % COLORS.length] })
  }

  const createObjective = async () => {
    if (!objective.label.trim()) return
    await addObjective({ ...objective, label: objective.label.trim() })
    setObjective({ label: '', icon: '🎯', color: COLORS[(objectives.length + 1) % COLORS.length] })
  }

  return (
    <div className="ph-page">
      <div className="ph-header">
        <div>
          <h1 className="ph-title">{t.title}</h1>
          <p className="ph-subtitle">{t.subtitle}</p>
        </div>
      </div>

      <div className="ph-content scroll-y" style={{ display: 'grid', gap: 16, paddingBottom: 32 }}>
        <section className="pset-section">
          <div className="pset-section-header"><FolderOpen size={16} /><h2>{t.folder}</h2></div>
          <p className="pset-hint">{t.current}: <code>{workspace.projectsRoot || 'Sin configurar'}</code></p>
          <Button variant="secondary" icon={<FolderOpen size={14} />} onClick={setupWorkspace}>{t.move}</Button>
        </section>

        <section className="pset-section">
          <div className="pset-section-header"><Sun size={16} /><h2>{t.appearance}</h2></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant={theme === 'light' ? 'primary' : 'secondary'} icon={<Sun size={14} />} onClick={() => setTheme('light')}>{t.light}</Button>
            <Button variant={theme === 'dark' ? 'primary' : 'secondary'} icon={<Moon size={14} />} onClick={() => setTheme('dark')}>{t.dark}</Button>
          </div>
        </section>

        <section className="pset-section">
          <div className="pset-section-header"><Languages size={16} /><h2>{t.language}</h2></div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select value={languageDraft} onChange={e => setLanguageDraft(e.target.value)} style={{ maxWidth: 260 }}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
          <Button variant="primary" icon={<Save size={13} />} onClick={saveLanguage}>{saved ? t.saved : t.save}</Button>
          </div>
          <p className="pset-hint">{t.languageHint}</p>
        </section>

        <section className="pset-section">
          <div className="pset-section-header"><Share2 size={16} /><h2>{t.share}</h2></div>
          <Button variant="secondary" icon={<Share2 size={14} />} onClick={() => setShowShare(true)}>{t.shareOpen}</Button>
        </section>

        <section className="pset-section">
          <div className="pset-section-header"><Users size={16} /><h2>{t.profiles}</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 8, alignItems: 'center' }}>
            <input value={person.name} onChange={e => setPerson(p => ({ ...p, name: e.target.value }))} placeholder={t.name} />
            <input value={person.role} onChange={e => setPerson(p => ({ ...p, role: e.target.value }))} placeholder={t.role} />
            <input value={person.email} onChange={e => setPerson(p => ({ ...p, email: e.target.value }))} placeholder="Email" />
            <input type="color" value={person.color} onChange={e => setPerson(p => ({ ...p, color: e.target.value }))} style={{ height: 36 }} />
            <Button variant="primary" icon={<Plus size={13} />} onClick={createPerson}>{t.create}</Button>
          </div>
          <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
            {profiles.length === 0 && <p className="pset-hint">{t.noProfiles}</p>}
            {profiles.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--border)', borderRadius: 6, padding: 8 }}>
                <span style={{ background: p.color, color: '#fff', borderRadius: 6, width: 28, height: 28, display: 'grid', placeItems: 'center', fontWeight: 700 }}>{p.initials}</span>
                <strong style={{ flex: 1 }}>{p.name}</strong>
                <span className="pset-hint">{p.role}</span>
                <button className="pset-tag-remove pset-icon-btn" onClick={() => deleteProfile(p.id)}><Trash2 size={14} style={{ color: 'var(--red)' }} /></button>
              </div>
            ))}
          </div>
        </section>

        <section className="pset-section">
          <div className="pset-section-header"><Target size={16} /><h2>{t.objectives}</h2></div>
          <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto auto', gap: 8, alignItems: 'center' }}>
            <select value={objective.icon} onChange={e => setObjective(o => ({ ...o, icon: e.target.value }))} style={{ fontSize: 18 }}>
              {ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
            </select>
            <input value={objective.label} onChange={e => setObjective(o => ({ ...o, label: e.target.value }))} placeholder={t.objectiveName} />
            <input type="color" value={objective.color} onChange={e => setObjective(o => ({ ...o, color: e.target.value }))} style={{ height: 36 }} />
            <Button variant="primary" icon={<Save size={13} />} onClick={createObjective}>Guardar</Button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
            {objectives.map(o => (
              <span key={o.id} className="pset-tag" style={{ background: o.color + '18', color: o.color, borderColor: o.color + '55' }}>
                {o.icon} {o.label}
                <button className="pset-tag-remove" onClick={() => deleteObjective(o.id)}><Trash2 size={11} /></button>
              </span>
            ))}
          </div>
        </section>
      </div>

      <ShareModal isOpen={showShare} onClose={() => setShowShare(false)} />
    </div>
  )
}
