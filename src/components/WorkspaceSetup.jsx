import { FolderOpen } from 'lucide-react'
import { useStore } from '../store/useStore'
import Button from './common/Button'

export default function WorkspaceSetup() {
  const { setupWorkspace } = useStore()

  return (
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center',
      background: 'var(--bg)', color: 'var(--text)', padding: 24,
    }}>
      <section style={{
        width: 'min(640px, 100%)', background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 32,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'var(--blue-primary)', color: 'var(--text-inverse)' }}>
            <FolderOpen size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, margin: 0 }}>Elige tu espacio de trabajo de Taskify</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-subtle)' }}>Taskify guarda tus datos en tu propia carpeta, no dentro del repositorio de la app.</p>
          </div>
        </div>
        <p style={{ color: 'var(--text-subtle)', lineHeight: 1.6, marginBottom: 20 }}>
          Selecciona una carpeta raiz. Taskify creara una carpeta <code>config/</code> para configuraciones globales,
          perfiles y objetivos. Cada proyecto tendra su propia carpeta con un archivo <code>taskify.project.json</code>.
        </p>
        <Button variant="primary" icon={<FolderOpen size={14} />} onClick={setupWorkspace}>
          Elegir carpeta de trabajo
        </Button>
      </section>
    </div>
  )
}
