import { BookOpen, CheckSquare, Bug, Layers, GitBranch } from 'lucide-react'

const TYPE_CONFIG = {
  epic:    { Icon: Layers,      color: '#6554C0', bg: '#EAE6FF' },
  story:   { Icon: BookOpen,    color: '#36B37E', bg: '#E3FCEF' },
  task:    { Icon: CheckSquare, color: '#6F42C1', bg: '#F0E7FF' },
  bug:     { Icon: Bug,         color: '#FF5630', bg: '#FFEBE6' },
  subtask: { Icon: GitBranch,   color: '#00B8D9', bg: '#E6FCFF' },
}

export default function IssueTypeIcon({ type = 'task', size = 14, showBg = false }) {
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.task
  const { Icon, color, bg } = config

  if (showBg) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size + 8, height: size + 8, borderRadius: 4,
        background: bg, flexShrink: 0
      }}>
        <Icon size={size} color={color} />
      </span>
    )
  }

  return <Icon size={size} color={color} style={{ flexShrink: 0 }} />
}
