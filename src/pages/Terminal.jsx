import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { RotateCcw, Maximize2, Minimize2, ExternalLink } from 'lucide-react'
import { useStore } from '../store/useStore'
import ProjectHeader from '../components/layout/ProjectHeader'
import EmbeddedTerminal from '../components/EmbeddedTerminal/EmbeddedTerminal'
import './Terminal.css'

const AGENT_INFO = {
  claude:    { name: 'Claude Code',   install: 'npm install -g @anthropic-ai/claude-code', url: 'https://claude.ai/code'         },
  opencode:  { name: 'OpenCode',      install: 'npm install -g opencode-ai',                url: 'https://opencode.ai'            },
  cursor:    { name: 'Cursor',        install: null,                                         url: 'https://cursor.com'             },
  aider:     { name: 'Aider',         install: 'pip install aider-install && aider-install', url: 'https://aider.chat'            },
  custom:    { name: 'Agente custom', install: null,                                         url: null                             },
}

export default function Terminal() {
  const { projectId } = useParams()
  const { setCurrentProject, projectData, getAllProjects } = useStore()

  useEffect(() => { setCurrentProject(projectId) }, [projectId])

  const allProjects  = getAllProjects()
  const project      = allProjects.find(p => p.id === projectId)
  const pd           = projectData[projectId] || {}
  const pSettings    = pd.settings || {}
  const agentEnabled = pSettings.agentEnabled !== false
  const agentCmd     = pSettings.agentCommand || 'opencode'

  const effectiveFolder = pSettings.customFolder || project?.folder || ''
  const projectPath     = effectiveFolder

  const [termKey,    setTermKey]    = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const agentMeta = AGENT_INFO[agentCmd] || AGENT_INFO.custom

  if (!agentEnabled) {
    return (
      <div className="term-page">
        <ProjectHeader projectId={projectId} />
        <div className="term-disabled">
          <div className="term-disabled-icon">{'>'}_</div>
          <h3>Agente IA no habilitado</h3>
          <p>
            Activa el agente en <strong>Configuración</strong> del proyecto.<br />
            Al habilitarlo puedes trabajar con <strong>claude</strong>, <strong>opencode</strong>,
            <strong> cursor</strong> u otros agentes directamente sobre los archivos del proyecto.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`term-page ${fullscreen ? 'term-page--fullscreen' : ''}`}>
      {!fullscreen && <ProjectHeader projectId={projectId} compact />}

      {/* Minimal top bar */}
      <div className="term-topbar">
        <span className="term-topbar-path">
          <strong>{agentMeta.name}</strong>
          <span className="term-topbar-sep">·</span>
          <code>{projectPath}</code>
        </span>

        <div className="term-topbar-actions">
          {/* Install hint */}
          {agentMeta.install && (
            <span className="term-install-hint" title={`Instalar: ${agentMeta.install}`}>
              <code>{agentCmd}</code> — si no está instalado: <code>{agentMeta.install}</code>
            </span>
          )}
          {agentMeta.url && (
            <a className="term-ext-link" href={agentMeta.url} target="_blank" rel="noreferrer" title="Sitio oficial">
              <ExternalLink size={12} />
            </a>
          )}
          <button className="term-icon-btn" onClick={() => setTermKey(k => k + 1)} title="Nueva terminal">
            <RotateCcw size={13} />
          </button>
          <button className="term-icon-btn" onClick={() => setFullscreen(f => !f)} title="Pantalla completa">
            {fullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Embedded terminal — full height */}
      <div className="term-embed-area">
        <EmbeddedTerminal key={termKey} cwd={projectPath} />
      </div>
    </div>
  )
}
