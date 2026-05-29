import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Save, Eye, Edit3, FileText, Bold, Italic, List, Link, Hash } from 'lucide-react'
import { useStore } from '../store/useStore'
import ProjectHeader from '../components/layout/ProjectHeader'
import Button from '../components/common/Button'
import './Wiki.css'

// Simple markdown → HTML renderer
function renderMd(md) {
  if (!md) return '<p style="color:var(--text-subtle);font-style:italic">Sin contenido aún. Escribe en el editor.</p>'
  return md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^######\s(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/^\s*[-*]\s(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|u|o|l|p|h])(.+)$/gm, (m) => m.trim() ? `<p>${m}</p>` : '')
}

const TOOLBAR = [
  { label: '**B**', title: 'Negrita',    before: '**', after: '**' },
  { label: '_I_',   title: 'Cursiva',    before: '*',  after: '*'  },
  { label: '# H',   title: 'Título',     before: '# ', after: ''   },
  { label: '## H2', title: 'Subtítulo',  before: '## ',after: ''   },
  { label: '- L',   title: 'Lista',      before: '- ', after: ''   },
  { label: '---',   title: 'Separador',  before: '\n---\n', after: '' },
  { label: '[L]',   title: 'Enlace',     before: '[', after: '](url)' },
  { label: '`C`',   title: 'Código',     before: '`', after: '`'  },
]

export default function Wiki() {
  const { projectId } = useParams()
  const { setCurrentProject, projectData, saveWiki, getAllProjects } = useStore()

  useEffect(() => { setCurrentProject(projectId) }, [projectId])

  const allProjects = getAllProjects()
  const project = allProjects.find(p => p.id === projectId)
  const pd = projectData[projectId] || {}
  const pSettings = pd.settings || {}

  const [mode, setMode]         = useState('split')   // 'edit' | 'preview' | 'split'
  const [content, setContent]   = useState(pd.wiki || '')
  const [saved, setSaved]       = useState(true)
  const textareaRef = useRef(null)

  useEffect(() => {
    setContent(pd.wiki || '')
    setSaved(true)
  }, [projectId])

  const handleChange = (v) => { setContent(v); setSaved(false) }

  const handleSave = async () => {
    await saveWiki(projectId, content)
    setSaved(true)
  }

  const insertFormat = (before, after) => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart, end = ta.selectionEnd
    const sel = content.slice(start, end)
    const newContent = content.slice(0, start) + before + sel + after + content.slice(end)
    setContent(newContent)
    setSaved(false)
    setTimeout(() => {
      ta.focus()
      ta.selectionStart = start + before.length
      ta.selectionEnd   = start + before.length + sel.length
    }, 0)
  }

  const TEMPLATE = `# ${pSettings.customName || project?.name || 'Proyecto'}

## Resumen
Descripción general del proyecto.

## Objetivos
- Objetivo 1
- Objetivo 2

## Alcance
Qué incluye y qué no incluye este proyecto.

## Tecnologías
- Sistema 1
- Sistema 2

## Dependencias
Proyectos o sistemas relacionados.

## Notas
Información adicional relevante.
`

  return (
    <div className="wiki-page">
      <ProjectHeader
        projectId={projectId}
        extra={
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {!saved && <span className="wiki-unsaved">● Sin guardar</span>}
            <div className="wiki-mode-toggle">
              {[['edit','Editar'],['split','Dividir'],['preview','Vista']].map(([m,l]) => (
                <button key={m} className={`wiki-mode-btn ${mode === m ? 'active' : ''}`} onClick={() => setMode(m)}>{l}</button>
              ))}
            </div>
            {content === '' && (
              <Button variant="secondary" size="sm" onClick={() => { setContent(TEMPLATE); setSaved(false) }}>
                Usar plantilla
              </Button>
            )}
            <Button variant="primary" size="sm" icon={<Save size={13} />} onClick={handleSave} disabled={saved}>
              {saved ? 'Guardado' : 'Guardar'}
            </Button>
          </div>
        }
      />

      {/* Toolbar */}
      {(mode === 'edit' || mode === 'split') && (
        <div className="wiki-toolbar">
          {TOOLBAR.map(t => (
            <button key={t.label} className="wiki-tb-btn" title={t.title}
              onClick={() => insertFormat(t.before, t.after)}>
              {t.label}
            </button>
          ))}
          <span className="wiki-tb-hint">Markdown soportado</span>
        </div>
      )}

      {/* Editor area */}
      <div className={`wiki-body wiki-body--${mode}`}>
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            ref={textareaRef}
            className="wiki-editor"
            value={content}
            onChange={e => handleChange(e.target.value)}
            placeholder={`# ${project?.name || 'Proyecto'}\n\nEmpieza a escribir en Markdown...`}
            spellCheck={false}
          />
        )}
        {(mode === 'preview' || mode === 'split') && (
          <div
            className="wiki-preview"
            dangerouslySetInnerHTML={{ __html: renderMd(content) }}
          />
        )}
      </div>
    </div>
  )
}
