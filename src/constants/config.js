export const ISSUE_TYPES = [
  { id: 'epic',    label: 'Épica',    color: '#6554C0', bgColor: '#EAE6FF' },
  { id: 'story',   label: 'Historia', color: '#36B37E', bgColor: '#E3FCEF' },
  { id: 'task',    label: 'Tarea',    color: '#6F42C1', bgColor: '#F0E7FF' },
  { id: 'bug',     label: 'Error',    color: '#FF5630', bgColor: '#FFEBE6' },
  { id: 'subtask', label: 'Subtarea', color: '#00B8D9', bgColor: '#E6FCFF' },
]

export const PRIORITIES = [
  { id: 'highest', label: 'Crítica',  color: '#FF5630' },
  { id: 'high',    label: 'Alta',     color: '#FF7452' },
  { id: 'medium',  label: 'Media',    color: '#FFAB00' },
  { id: 'low',     label: 'Baja',     color: '#4C9AFF' },
  { id: 'lowest',  label: 'Mínima',   color: '#4C9AFF' },
]

export const STATUSES = [
  { id: 'todo',       label: 'Por Hacer',    category: 'todo'       },
  { id: 'inprogress', label: 'En Progreso',  category: 'inprogress' },
  { id: 'review',     label: 'En Revisión',  category: 'review'     },
  { id: 'done',       label: 'Completado',   category: 'done'       },
]

export const BOARD_COLUMNS = [
  { id: 'todo',       label: 'Por Hacer',   limit: null },
  { id: 'inprogress', label: 'En Progreso', limit: 5    },
  { id: 'review',     label: 'En Revisión', limit: null },
  { id: 'done',       label: 'Completado',  limit: null },
]

export const PROJECT_STATUSES = [
  { id: 'planning',   label: 'Planificación', color: '#FFAB00' },
  { id: 'active',     label: 'En Ejecución',  color: '#36B37E' },
  { id: 'on_hold',    label: 'En Pausa',      color: '#FF8B00' },
  { id: 'completed',  label: 'Completado',    color: '#6F42C1' },
  { id: 'cancelled',  label: 'Cancelado',     color: '#FF5630' },
]

export const STORY_POINTS = [1, 2, 3, 5, 8, 13, 21, 34]

export const SPRINT_DURATION_WEEKS = [1, 2, 3, 4]
