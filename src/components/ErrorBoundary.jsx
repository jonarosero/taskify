import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  componentDidCatch(e, info) { console.error('ErrorBoundary caught:', e, info) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: 'var(--red)', fontFamily: 'monospace', background: 'var(--surface)', margin: 16, borderRadius: 8, border: '1px solid var(--red)' }}>
          <h3 style={{ marginBottom: 8 }}>Error de renderizado</h3>
          <pre style={{ fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error.toString()}
            {'\n'}
            {this.state.error.stack?.split('\n').slice(0,8).join('\n')}
          </pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 12, padding: '6px 14px', cursor: 'pointer' }}>
            Reintentar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
