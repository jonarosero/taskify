import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return isValid(d) ? format(d, 'dd MMM yyyy', { locale: es }) : '—'
  } catch { return '—' }
}

export const formatRelative = (dateStr) => {
  if (!dateStr) return ''
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr
    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true, locale: es }) : ''
  } catch { return '' }
}

export const toISODate = (date) => {
  if (!date) return null
  try { return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM-dd') }
  catch { return null }
}

export const today = () => format(new Date(), 'yyyy-MM-dd')

export const generateId = (prefix = 'ID') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

export const slugify = (str) =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export const getInitials = (name) => {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export const countByStatus = (issues) => {
  const counts = { todo: 0, inprogress: 0, review: 0, done: 0 }
  issues.forEach(i => { if (counts[i.status] !== undefined) counts[i.status]++ })
  return counts
}

export const getProgressPercent = (issues) => {
  if (!issues.length) return 0
  const done = issues.filter(i => i.status === 'done').length
  return Math.round((done / issues.length) * 100)
}

export const sortByPriority = (issues) => {
  const order = { highest: 0, high: 1, medium: 2, low: 3, lowest: 4 }
  return [...issues].sort((a, b) => (order[a.priority] ?? 2) - (order[b.priority] ?? 2))
}
