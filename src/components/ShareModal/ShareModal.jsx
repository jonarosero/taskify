import { useState, useEffect, useRef } from 'react'
import { Share2, Package, Cpu, CheckCircle, AlertCircle, FolderOpen, X, Loader, FileArchive, Download } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import './ShareModal.css'

export default function ShareModal({ isOpen, onClose }) {
  const [step, setStep]       = useState('choose') // choose | zipping | building | done | error
  const [mode, setMode]       = useState(null)     // 'zip' | 'exe'
  const [result, setResult]   = useState(null)
  const [log, setLog]         = useState([])
  const logRef = useRef(null)

  useEffect(() => {
    if (!isOpen) { setStep('choose'); setMode(null); setResult(null); setLog([]) }
  }, [isOpen])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const handleZip = async () => {
    setMode('zip')
    setStep('zipping')
    try {
      const res = await window.electronAPI?.createShareZip()
      if (res?.ok) {
        setResult(res)
        setStep('done')
      } else if (res?.reason === 'cancelled') {
        setStep('choose')
      } else {
        setResult(res)
        setStep('error')
      }
    } catch (e) {
      setResult({ reason: e.message })
      setStep('error')
    }
  }

  const handleExe = async () => {
    setMode('exe')
    setStep('building')
    setLog(['Iniciando construcción del instalador...'])

    if (window.electronAPI?.onBuildProgress) {
      window.electronAPI.onBuildProgress((data) => {
        setLog(l => [...l, data.trimEnd()])
      })
    }

    try {
      const res = await window.electronAPI?.buildInstaller()
      window.electronAPI?.offBuildProgress?.()
      if (res?.ok) {
        setResult(res)
        setStep('done')
      } else {
        setResult(res)
        setStep('error')
      }
    } catch (e) {
      window.electronAPI?.offBuildProgress?.()
      setResult({ reason: e.message })
      setStep('error')
    }
  }

  const openResult = () => {
    if (result?.path && window.electronAPI) {
      window.electronAPI.openFolder(result.path)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={step === 'zipping' || step === 'building' ? undefined : onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Share2 size={18} color="var(--blue-primary)" />
          Compartir Taskify
        </div>
      }
      size="md"
    >
      {/* ── Choose ── */}
      {step === 'choose' && (
        <div className="share-choose">
          <p className="share-desc">
            Elige cómo quieres compartir tu workspace de Taskify o generar un instalador.
          </p>

          <div className="share-options">
            {/* ZIP */}
            <button className="share-option" onClick={handleZip}>
              <div className="share-option-icon" style={{ background: '#F0E7FF', color: '#6F42C1' }}>
                <FileArchive size={28} />
              </div>
              <div className="share-option-info">
                <div className="share-option-title">Paquete ZIP</div>
                <div className="share-option-desc">
                  Crea un archivo <strong>.zip</strong> con tu workspace completo:
                  configuración global, perfiles, objetivos, proyectos y documentos.
                  <br /><br />
                  El destinatario puede descomprimirlo y elegir esa carpeta como workspace.
                  Rápido — segundos a pocos minutos según el tamaño de los documentos.
                </div>
                <div className="share-option-includes">
                  <span className="share-chip">config/</span>
                  <span className="share-chip">Project folders</span>
                  <span className="share-chip">taskify.project.json</span>
                </div>
              </div>
            </button>

            {/* EXE */}
            <button className="share-option" onClick={handleExe}>
              <div className="share-option-icon" style={{ background: '#E3FCEF', color: '#36B37E' }}>
                <Cpu size={28} />
              </div>
              <div className="share-option-info">
                <div className="share-option-title">Instalador .exe completo</div>
                <div className="share-option-desc">
                  Genera un instalador <strong>Windows Setup (.exe)</strong> que contiene
                   la aplicación completa. Tus datos quedan en el workspace elegido por cada usuario.
                  <br /><br />
                  El destinatario solo hace doble clic en el .exe para instalar.
                  Requiere Node.js. Proceso de 5–15 minutos.
                </div>
                <div className="share-option-includes">
                  <span className="share-chip">🖥️ App completa</span>
                  <span className="share-chip">Workspace local</span>
                  <span className="share-chip">📂 Proyectos</span>
                  <span className="share-chip">⚙️ Setup wizard</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Zipping ── */}
      {step === 'zipping' && (
        <div className="share-progress">
          <div className="share-spinner">
            <Loader size={40} className="animate-spin" style={{ color: '#6F42C1' }} />
          </div>
          <h3>Creando paquete ZIP...</h3>
          <p>Copiando datos y documentos del proyecto.<br />Esto puede tardar unos minutos según el tamaño.</p>
          <div className="share-progress-bar-wrap">
            <div className="share-progress-bar-anim" />
          </div>
        </div>
      )}

      {/* ── Building ── */}
      {step === 'building' && (
        <div className="share-progress">
          <div className="share-spinner">
            <Loader size={40} className="animate-spin" style={{ color: '#36B37E' }} />
          </div>
          <h3>Construyendo instalador .exe...</h3>
          <p>Compilando la aplicación con electron-builder.<br />Proceso de 5–15 minutos. No cierres la ventana.</p>
          <div className="share-progress-bar-wrap">
            <div className="share-progress-bar-anim" />
          </div>
          <div className="share-log" ref={logRef}>
            {log.map((line, i) => (
              <div key={i} className="share-log-line">{line}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {step === 'done' && (
        <div className="share-result share-result--ok">
          <CheckCircle size={52} color="#36B37E" />
          <h3>{mode === 'zip' ? 'ZIP creado exitosamente' : 'Instalador generado'}</h3>
          <p>
            {mode === 'zip'
              ? 'El archivo ZIP fue guardado en la ubicación elegida.'
              : 'El instalador está en la carpeta dist-electron/.'}
          </p>
          {result?.path && (
            <code className="share-path">{result.path}</code>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Button variant="primary" icon={<FolderOpen size={14} />} onClick={openResult}>
              Abrir carpeta
            </Button>
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {step === 'error' && (
        <div className="share-result share-result--error">
          <AlertCircle size={52} color="#FF5630" />
          <h3>Ocurrió un error</h3>
          <p>{result?.reason || 'Error desconocido'}</p>
          {mode === 'exe' && (
            <p className="share-hint-text">
              Para el instalador .exe asegúrate de tener Node.js instalado y
              ejecutar desde el directorio fuente de la aplicación.
            </p>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setStep('choose')}>
              Intentar de nuevo
            </Button>
            <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
