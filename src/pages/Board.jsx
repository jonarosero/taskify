import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable, closestCorners
} from '@dnd-kit/core'
import { Plus, Trash2, Edit2, MoreHorizontal, Users } from 'lucide-react'
import { useStore } from '../store/useStore'
import { BOARD_COLUMNS } from '../constants/config'
import Avatar from '../components/common/Avatar'
import IssueTypeIcon from '../components/common/IssueTypeIcon'
import PriorityIcon from '../components/common/PriorityIcon'
import Badge from '../components/common/Badge'
import IssueModal from '../components/IssueModal/IssueModal'
import Button from '../components/common/Button'
import ProjectHeader from '../components/layout/ProjectHeader'
import './Board.css'

export default function Board() {
  const { projectId } = useParams()
  const { projectData, setCurrentProject, moveIssue, deleteIssue, openIssueModal, getAllProjects, profiles } = useStore()
  const [activeIssue, setActiveIssue] = useState(null)
  const [filterAssignee, setFilterAssignee] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => { setCurrentProject(projectId) }, [projectId])

  const project = getAllProjects().find(p => p.id === projectId)
  const pd = projectData[projectId] || { issues: [], sprints: [] }
  const activeSprint = pd.sprints?.find(s => s.status === 'active')

  let boardIssues = (pd.issues || []).filter(i =>
    activeSprint ? i.sprintId === activeSprint.id : true
  )
  if (filterAssignee) boardIssues = boardIssues.filter(i => i.assignee === filterAssignee)
  if (filterType)     boardIssues = boardIssues.filter(i => i.type === filterType)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragStart = ({ active }) => {
    setActiveIssue((pd.issues || []).find(i => i.id === active.id) || null)
  }
  const handleDragEnd = ({ active, over }) => {
    setActiveIssue(null)
    if (!over) return
    const issue = (pd.issues || []).find(i => i.id === active.id)
    if (issue && BOARD_COLUMNS.find(c => c.id === over.id) && issue.status !== over.id) {
      moveIssue(projectId, issue.id, over.id)
    }
  }

  const assignedIds = [...new Set((pd.issues || []).map(i => i.assignee).filter(Boolean))]

  return (
    <div className="board-page">
      <ProjectHeader
        projectId={projectId}
        extra={
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => openIssueModal(null, 'todo')}>
            Crear issue
          </Button>
        }
      />

      {/* Sprint info bar */}
      {activeSprint && (
        <div className="board-sprint-bar">
          <span className="sprint-active-dot" />
          <strong>{activeSprint.name}</strong>
          {activeSprint.goal && <span className="board-sprint-goal-text">— {activeSprint.goal}</span>}
          {activeSprint.endDate && <span className="board-sprint-end">Fin: {activeSprint.endDate}</span>}
        </div>
      )}

      {/* Filters */}
      <div className="board-filters">
        <div className="board-filters-left">
          {/* Avatar filter buttons */}
          <button
            className={`filter-avatar-btn ${!filterAssignee ? 'active' : ''}`}
            onClick={() => setFilterAssignee('')}
            title="Todos"
          >
            <Users size={14} />
          </button>
          {assignedIds.map(id => {
            const m = profiles.find(t => t.id === id)
            return (
              <button
                key={id}
                className={`filter-avatar-btn ${filterAssignee === id ? 'active' : ''}`}
                onClick={() => setFilterAssignee(filterAssignee === id ? '' : id)}
                title={m?.name}
                style={filterAssignee === id ? { outline: `2px solid ${m?.color}` } : {}}
              >
                <Avatar memberId={id} size="xs" />
              </button>
            )
          })}

          <div className="board-filter-divider" />

          <select className="board-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="epic">Épica</option>
            <option value="story">Historia</option>
            <option value="task">Tarea</option>
            <option value="bug">Error</option>
          </select>

          {(filterAssignee || filterType) && (
            <button className="board-filter-clear" onClick={() => { setFilterAssignee(''); setFilterType('') }}>
              Limpiar filtros
            </button>
          )}
        </div>
        <span className="board-issue-count">{boardIssues.length} issues</span>
      </div>

      {/* Kanban */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board-columns scroll-x">
          {BOARD_COLUMNS.map(col => (
            <BoardColumn
              key={col.id}
              column={col}
              issues={boardIssues.filter(i => i.status === col.id)}
              projectColor={project?.color}
              onCreateIssue={() => openIssueModal(null, col.id)}
              onEditIssue={(issue) => openIssueModal(issue)}
              onDeleteIssue={(id) => deleteIssue(projectId, id)}
            />
          ))}
        </div>
        <DragOverlay>
          {activeIssue && <IssueCardOverlay issue={activeIssue} />}
        </DragOverlay>
      </DndContext>

      <IssueModal />
    </div>
  )
}

function BoardColumn({ column, issues, onCreateIssue, onEditIssue, onDeleteIssue }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const isAtLimit = column.limit && issues.length >= column.limit

  return (
    <div
      ref={setNodeRef}
      className={`board-column ${isOver ? 'board-column--over' : ''} ${isAtLimit ? 'board-column--limit' : ''}`}
    >
      <div className="board-column-header">
        <div className="board-column-title">
          <Badge status={column.id} label={column.label} />
          <span className="board-column-count">{issues.length}</span>
          {column.limit && <span className="board-column-limit" title="WIP limit">/{column.limit}</span>}
        </div>
        <button className="board-column-add" onClick={onCreateIssue} title="Crear issue">
          <Plus size={14} />
        </button>
      </div>

      <div className="board-column-body scroll-y">
        {issues.map(issue => (
          <DraggableCard
            key={issue.id}
            issue={issue}
            onEdit={() => onEditIssue(issue)}
            onDelete={() => onDeleteIssue(issue.id)}
          />
        ))}
        {issues.length === 0 && (
          <div className="board-column-empty">Arrastra issues aquí</div>
        )}
      </div>
    </div>
  )
}

function DraggableCard({ issue, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: issue.id })
  const [menuOpen, setMenuOpen] = useState(false)
  const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.4 : 1 } : {}

  return (
    <div ref={setNodeRef} style={style} {...attributes} className={`issue-card-wrapper ${isDragging ? 'dragging' : ''}`}>
      <div className="issue-card" {...listeners}>
        <div className="issue-card-header">
          <div className="issue-card-icons">
            <IssueTypeIcon type={issue.type} size={13} />
            <PriorityIcon priority={issue.priority} size={12} />
          </div>
          <button
            className="issue-card-menu-btn"
            onClick={e => { e.stopPropagation(); setMenuOpen(s => !s) }}
            onPointerDown={e => e.stopPropagation()}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>

        <p className="issue-card-title">{issue.title}</p>

        {issue.labels?.length > 0 && (
          <div className="issue-card-labels">
            {issue.labels.slice(0, 3).map(l => (
              <span key={l} className="issue-card-label">{l}</span>
            ))}
          </div>
        )}

        <div className="issue-card-footer">
          <span className="issue-card-key">{issue.key}</span>
          <div className="issue-card-meta">
            {issue.storyPoints && <span className="issue-card-points">{issue.storyPoints}</span>}
            {issue.assignee && <Avatar memberId={issue.assignee} size="xs" />}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="issue-card-dropdown" onPointerDown={e => e.stopPropagation()}>
          <button className="dropdown-item" onClick={() => { onEdit(); setMenuOpen(false) }}>
            <Edit2 size={13} /> Editar
          </button>
          <div className="dropdown-divider" />
          <button className="dropdown-item" style={{ color: 'var(--red)' }} onClick={() => { onDelete(); setMenuOpen(false) }}>
            <Trash2 size={13} /> Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

function IssueCardOverlay({ issue }) {
  return (
    <div className="issue-card issue-card--overlay">
      <div className="issue-card-header">
        <div className="issue-card-icons">
          <IssueTypeIcon type={issue.type} size={13} />
          <PriorityIcon priority={issue.priority} size={12} />
        </div>
      </div>
      <p className="issue-card-title">{issue.title}</p>
      <div className="issue-card-footer">
        <span className="issue-card-key">{issue.key}</span>
        <div className="issue-card-meta">
          {issue.storyPoints && <span className="issue-card-points">{issue.storyPoints}</span>}
          {issue.assignee && <Avatar memberId={issue.assignee} size="xs" />}
        </div>
      </div>
    </div>
  )
}
