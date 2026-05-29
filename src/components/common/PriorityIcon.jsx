import { ChevronsUp, ChevronUp, Minus, ChevronDown, ChevronsDown } from 'lucide-react'

const PRIORITY_CONFIG = {
  highest: { Icon: ChevronsUp,   color: '#FF5630', label: 'Crítica' },
  high:    { Icon: ChevronUp,    color: '#FF7452', label: 'Alta'    },
  medium:  { Icon: Minus,        color: '#FFAB00', label: 'Media'   },
  low:     { Icon: ChevronDown,  color: '#4C9AFF', label: 'Baja'    },
  lowest:  { Icon: ChevronsDown, color: '#4C9AFF', label: 'Mínima'  },
}

export default function PriorityIcon({ priority = 'medium', size = 14, showLabel = false }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium
  const { Icon, color, label } = config

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title={label}>
      <Icon size={size} color={color} style={{ flexShrink: 0 }} />
      {showLabel && <span style={{ fontSize: 12, color }}>{label}</span>}
    </span>
  )
}
