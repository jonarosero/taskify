import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { FileText, FileSpreadsheet, FileImage, File, FolderOpen, RefreshCw, ExternalLink, Folder } from 'lucide-react'
import { useStore } from '../store/useStore'
import ProjectHeader from '../components/layout/ProjectHeader'
import Button from '../components/common/Button'
import { openFolder, openFile, listProjectFiles } from '../utils/storage'
import './Documents.css'

const FILE_TYPES = {
  pdf:   { Icon: FileText,        color: '#FF5630', bg: '#FFEBE6', label: 'PDF'    },
  docx:  { Icon: FileText,        color: '#6F42C1', bg: '#F0E7FF', label: 'Word'   },
  doc:   { Icon: FileText,        color: '#6F42C1', bg: '#F0E7FF', label: 'Word'   },
  xlsx:  { Icon: FileSpreadsheet, color: '#36B37E', bg: '#E3FCEF', label: 'Excel'  },
  xls:   { Icon: FileSpreadsheet, color: '#36B37E', bg: '#E3FCEF', label: 'Excel'  },
  csv:   { Icon: FileSpreadsheet, color: '#36B37E', bg: '#E3FCEF', label: 'CSV'    },
  png:   { Icon: FileImage,       color: '#FF8B00', bg: '#FFF0EB', label: 'Imagen' },
  jpg:   { Icon: FileImage,       color: '#FF8B00', bg: '#FFF0EB', label: 'Imagen' },
  jpeg:  { Icon: FileImage,       color: '#FF8B00', bg: '#FFF0EB', label: 'Imagen' },
  pptx:  { Icon: FileText,        color: '#FF7452', bg: '#FFEBE6', label: 'PPT'    },
  ppt:   { Icon: FileText,        color: '#FF7452', bg: '#FFEBE6', label: 'PPT'    },
  ipynb: { Icon: FileText,        color: '#6554C0', bg: '#EAE6FF', label: 'Jupyter'},
  md:    { Icon: FileText,        color: '#6B778C', bg: '#F4F5F7', label: 'MD'     },
  txt:   { Icon: FileText,        color: '#6B778C', bg: '#F4F5F7', label: 'TXT'    },
}

function getExt(name) { return (name.split('.').pop() || '').toLowerCase() }
function getTypeCfg(name) { return FILE_TYPES[getExt(name)] || { Icon: File, color: '#6B778C', bg: '#F4F5F7', label: getExt(name).toUpperCase() || 'FILE' } }
function fmtSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function Documents() {
  const { projectId } = useParams()
  const { setCurrentProject, projectData, getAllProjects } = useStore()
  const [files, setFiles]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('')
  const [viewFolder, setViewFolder] = useState(null)  // drill into subfolder

  useEffect(() => { setCurrentProject(projectId) }, [projectId])

  const project = getAllProjects().find(p => p.id === projectId)
  const pd = projectData[projectId] || {}
  const pSettings = pd.settings || {}
  const effectiveFolder = pSettings.customFolder || project?.folder || ''

  const load = async () => {
    setLoading(true)
    try {
      const list = await listProjectFiles(effectiveFolder)
      setFiles(list || [])
    } catch {
      setFiles([])
    }
    setLoading(false)
  }

  useEffect(() => { if (project) load() }, [projectId, effectiveFolder])

  // Filtered files
  const displayed = files.filter(f => {
    const name = typeof f === 'string' ? f : f.name
    if (filter && !name.toLowerCase().includes(filter.toLowerCase())) return false
    return true
  })

  // Group by folder
  const groups = {}
  displayed.forEach(f => {
    const key = f.folder || ''
    if (!groups[key]) groups[key] = []
    groups[key].push(f)
  })

  const handleOpen = (f) => {
    const name = typeof f === 'string' ? f : f.name
    openFile(effectiveFolder, name)
  }

  const handleOpenFolder = () => {
    openFolder(effectiveFolder)
  }

  // Count by type
  const typeCounts = {}
  displayed.forEach(f => {
    const name = typeof f === 'string' ? f : f.name
    const cfg = getTypeCfg(name)
    typeCounts[cfg.label] = (typeCounts[cfg.label] || 0) + 1
  })

  return (
    <div className="docs-page">
      <ProjectHeader
        projectId={projectId}
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={load}>
              Actualizar
            </Button>
            <Button variant="secondary" size="sm" icon={<FolderOpen size={13} />} onClick={handleOpenFolder}>
              Abrir carpeta
            </Button>
          </div>
        }
      />

      <div className="docs-body scroll-y">
        {/* Path bar */}
        <div className="docs-path-bar">
          <FolderOpen size={14} style={{ color: 'var(--blue-primary)', flexShrink: 0 }} />
          <code className="docs-path">{effectiveFolder}</code>
          <span className="docs-file-count">{files.length} archivo{files.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw size={36} className="animate-spin" style={{ opacity: 0.4 }} />
            <p>Leyendo archivos del proyecto...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={52} />
            <h3>Carpeta vacía</h3>
            <p>
              No hay archivos en la carpeta de este proyecto.<br />
              Agrega documentos en:<br />
              <code style={{ fontSize: 11 }}>{effectiveFolder}/</code>
            </p>
            <Button variant="primary" icon={<FolderOpen size={14} />} onClick={handleOpenFolder}>
              Abrir en explorador
            </Button>
          </div>
        ) : (
          <div className="docs-content">
            {/* Filter + type chips */}
            <div className="docs-toolbar">
              <input
                type="text"
                placeholder="Filtrar archivos..."
                value={filter}
                onChange={e => setFilter(e.target.value)}
                style={{ maxWidth: 280 }}
              />
              <div className="docs-type-chips">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <span key={type} className="docs-type-chip">{type} <strong>{count}</strong></span>
                ))}
              </div>
            </div>

            {/* Files grouped by subfolder */}
            {Object.entries(groups).map(([folderName, folderFiles]) => (
              <div key={folderName} className="docs-group">
                {folderName && (
                  <div className="docs-folder-label">
                    <Folder size={13} style={{ color: 'var(--yellow)' }} />
                    <span>{folderName}</span>
                    <span className="docs-folder-count">{folderFiles.length}</span>
                  </div>
                )}
                <div className="docs-file-list">
                  {folderFiles.map((f, i) => {
                    const name = typeof f === 'string' ? f : f.name
                    const size = typeof f === 'object' ? f.size : null
                    const { Icon, color, bg, label } = getTypeCfg(name)
                    const displayName = folderName ? name.replace(`${folderName}/`, '') : name
                    return (
                      <div key={i} className="docs-file-row" onClick={() => handleOpen(f)}>
                        <div className="docs-file-icon" style={{ background: bg, color }}>
                          <Icon size={18} />
                        </div>
                        <div className="docs-file-info">
                          <span className="docs-file-name" title={name}>{displayName}</span>
                          <div className="docs-file-meta">
                            <span className="docs-file-type" style={{ color }}>{label}</span>
                            {size > 0 && <span className="docs-file-size">{fmtSize(size)}</span>}
                          </div>
                        </div>
                        <button
                          className="docs-open-btn"
                          onClick={e => { e.stopPropagation(); handleOpen(f) }}
                          title="Abrir archivo"
                        >
                          <ExternalLink size={13} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
