import './Badge.css'

export default function Badge({ status, label, color, size = 'md' }) {
  if (status) {
    return <span className={`badge badge--status badge--${status} badge--${size}`}>{label}</span>
  }
  return (
    <span
      className={`badge badge--custom badge--${size}`}
      style={color ? { background: color + '22', color, borderColor: color + '44' } : {}}
    >
      {label}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  return <span className={`badge badge--priority badge--${priority}`}>{priorityLabel(priority)}</span>
}

function priorityLabel(p) {
  const labels = { highest: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja', lowest: 'Mínima' }
  return labels[p] || p
}
