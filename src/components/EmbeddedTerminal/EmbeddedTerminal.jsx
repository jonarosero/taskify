import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import './EmbeddedTerminal.css'

const T = {
  dracula: { bg:'#282A36', fg:'#F8F8F2', cursor:'#BD93F9', sel:'rgba(189,147,249,0.3)', label:'Dracula'      },
  jira:    { bg:'#1D2125', fg:'#C7D1DB', cursor:'#4C9AFF', sel:'rgba(76,154,255,0.3)',  label:'Oscuro Jira'  },
  github:  { bg:'#0D1117', fg:'#E6EDF3', cursor:'#58A6FF', sel:'rgba(88,166,255,0.25)', label:'GitHub Dark'  },
  light:   { bg:'#FAFBFC', fg:'#24292F', cursor:'#6F42C1', sel:'rgba(111,66,193,0.2)',   label:'Claro'        },
  monokai: { bg:'#272822', fg:'#F8F8F2', cursor:'#FD971F', sel:'rgba(253,151,31,0.25)', label:'Monokai'      },
  matrix:  { bg:'#001100', fg:'#00FF41', cursor:'#00FF41', sel:'rgba(0,255,65,0.2)',    label:'Matrix'       },
  ocean:   { bg:'#1B2B34', fg:'#CDD3DE', cursor:'#62B3B2', sel:'rgba(98,179,178,0.25)', label:'Ocean'        },
}

function xtermTheme(k) {
  const t = T[k] || T.dracula
  return { background:t.bg, foreground:t.fg, cursor:t.cursor, cursorAccent:t.bg, selectionBackground:t.sel }
}

export default function EmbeddedTerminal({ cwd }) {
  // Defaults: Dracula, 13px
  const themeKey = 'dracula'   // Dracula fijo — cambio de tema pendiente de fix xterm
  const [fontSize,  setFontSize] = useState(13)
  const [status, setStatus] = useState('connecting')
  const [mode, setMode] = useState(null)   // 'pty' | 'pipe'

  const containerRef = useRef(null)
  const termRef      = useRef(null)
  const fitRef       = useRef(null)
  const ptyIdRef     = useRef(null)

  // ── Create terminal + PTY once (only when cwd changes) ────────────────────
  useEffect(() => {
    if (!containerRef.current || !window.electronAPI?.ptyCreate) {
      setStatus('error'); return
    }
    setStatus('connecting')

    const term = new Terminal({
      cursorBlink:       true,
      cursorStyle:       'bar',
      scrollback:        5000,
      fontFamily:        '"Cascadia Code","JetBrains Mono","Fira Code",Consolas,monospace',
      fontSize:          fontSize,
      lineHeight:        1.45,
      allowTransparency: false,
      convertEol:        false,
      theme:             xtermTheme(themeKey),
    })

    const fitAddon   = new FitAddon()
    const linksAddon = new WebLinksAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(linksAddon)
    term.open(containerRef.current)
    // Multiple fit() calls to ensure correct dimensions after layout settles
    requestAnimationFrame(() => {
      try { fitAddon.fit() } catch {}
      setTimeout(() => { try { fitAddon.fit() } catch {} }, 120)
      setTimeout(() => { try { fitAddon.fit() } catch {} }, 400)
    })

    termRef.current = term
    fitRef.current  = fitAddon

    const { cols, rows } = term
    window.electronAPI.ptyCreate({ cwd, cols, rows }).then(result => {
      if (!result?.ok) {
        term.writeln('\x1b[31mError: ' + (result?.reason || 'desconocido') + '\x1b[0m')
        setStatus('error'); return
      }
      ptyIdRef.current = result.id
      setMode(result.mode)
      setStatus('ready')

      window.electronAPI.onPtyData(({ id, data }) => {
        if (id === result.id) term.write(data)
      })
      window.electronAPI.onPtyExit(({ id }) => {
        if (id === result.id) {
          term.writeln('\r\n\x1b[33m[Terminal cerrada — clic en "Nueva terminal"]\x1b[0m')
          setStatus('exited')
        }
      })
      term.onData(data => {
        // Fix backspace in pipe mode: xterm sends \x7f, PowerShell needs \x08
        const out = (result.mode === 'pipe' && data === '\x7f') ? '\x08' : data
        window.electronAPI.ptyInput(result.id, out)
      })
    })

    const ro = new ResizeObserver(() => {
      try { fitAddon.fit() } catch {}
      if (ptyIdRef.current) {
        const { cols, rows } = term
        window.electronAPI.ptyResize(ptyIdRef.current, cols, rows)
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      window.electronAPI.offPtyListeners()
      if (ptyIdRef.current) {
        window.electronAPI.ptyDestroy(ptyIdRef.current)
        ptyIdRef.current = null
      }
      try { term.dispose() } catch {}
      termRef.current = null
      fitRef.current  = null
    }
  }, [cwd])  // ← only cwd triggers full recreation

  // ── Update theme IN-PLACE (no session interruption) ───────────────────────
  useEffect(() => {
    if (!termRef.current) return
    termRef.current.options.theme = xtermTheme(themeKey)
    // Update the xterm viewport background via DOM
    const viewport = containerRef.current?.querySelector('.xterm-viewport')
    if (viewport) viewport.style.background = T[themeKey]?.bg || T.dracula.bg
  }, [themeKey])

  // ── Update font size in-place ─────────────────────────────────────────────
  useEffect(() => {
    if (!termRef.current) return
    termRef.current.options.fontSize = fontSize
    try { fitRef.current?.fit() } catch {}
  }, [fontSize])

  const t = T[themeKey] || T.dracula

  return (
    <div className="eterm-wrap" style={{ background: t.bg }}>
      {/* Status bar */}
      <div className="eterm-status-bar" style={{ background: t.bg === '#FAFBFC' ? '#f0f0f0' : '#161A1D' }}>
        <span className={`eterm-dot eterm-dot--${status}`} />
        <span className="eterm-status-text" style={{ color: t.bg === '#FAFBFC' ? '#555' : '#8696A7' }}>
          {status === 'connecting' && 'Iniciando...'}
          {status === 'ready'      && cwd}
          {status === 'exited'     && 'Terminal cerrada'}
          {status === 'error'      && 'Error al iniciar'}
        </span>

        <div className="eterm-controls">
          <button className="eterm-ctrl-btn" style={{ color: t.fg, borderColor: t.cursor + '44' }}
            onClick={() => setFontSize(s => Math.max(9, s - 1))}>A-</button>
          <span className="eterm-font-size" style={{ color: t.fg }}>{fontSize}px</span>
          <button className="eterm-ctrl-btn" style={{ color: t.fg, borderColor: t.cursor + '44' }}
            onClick={() => setFontSize(s => Math.min(22, s + 1))}>A+</button>
        </div>

        <span style={{ fontSize: 11, color: t.cursor, fontFamily: 'monospace' }}>🎨 {t.label}</span>
      </div>

      {/* Terminal container */}
      <div ref={containerRef} className="eterm-container" style={{ background: t.bg }} />
    </div>
  )
}
