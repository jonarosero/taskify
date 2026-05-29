import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts'
import { useStore } from '../store/useStore'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import IssueTypeIcon from '../components/common/IssueTypeIcon'
import PriorityIcon from '../components/common/PriorityIcon'
import ProjectHeader from '../components/layout/ProjectHeader'
import { getProgressPercent } from '../utils/helpers'
import './Reports.css'

const COLORS = {
  todo: '#DFE1E6', inprogress: '#6F42C1', review: '#8F6AD8', done: '#36B37E',
  epic: '#8F6AD8', story: '#36B37E', task: '#6F42C1', bug: '#FF5630', subtask: '#00B8D9',
  highest: '#FF5630', high: '#FF7452', medium: '#FFAB00', low: '#4C9AFF', lowest: '#4C9AFF',
}

const TOOLTIP_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  fontSize: 12,
  color: 'var(--text)',
}

const AXIS_STYLE = { fontSize: 11, fill: 'var(--text-subtle)' }

export default function Reports() {
  const { projectId } = useParams()
  const { projectData, setCurrentProject, getAllProjects, profiles } = useStore()

  useEffect(() => { setCurrentProject(projectId) }, [projectId])

  const project = getAllProjects().find(p => p.id === projectId)
  const pd = projectData[projectId] || { issues: [], sprints: [], epics: [] }
  const issues  = pd.issues  || []
  const sprints = pd.sprints || []
  const epics   = pd.epics   || []

  const done    = issues.filter(i => i.status === 'done').length
  const bugs    = issues.filter(i => i.type === 'bug').length
  const totPts  = issues.reduce((s, i) => s + (i.storyPoints || 0), 0)
  const donePts = issues.filter(i => i.status === 'done').reduce((s, i) => s + (i.storyPoints || 0), 0)
  const progress = getProgressPercent(issues)

  const statusData = [
    { name: 'Por hacer',    value: issues.filter(i => i.status === 'todo').length,       color: COLORS.todo       },
    { name: 'En progreso',  value: issues.filter(i => i.status === 'inprogress').length, color: COLORS.inprogress },
    { name: 'En revisión',  value: issues.filter(i => i.status === 'review').length,     color: COLORS.review     },
    { name: 'Completado',   value: issues.filter(i => i.status === 'done').length,       color: COLORS.done       },
  ].filter(d => d.value > 0)

  const typeData = ['task','story','bug','epic','subtask'].map(t => ({
    name: { task: 'Tarea', story: 'Historia', bug: 'Error', epic: 'Épica', subtask: 'Subtarea' }[t],
    count: issues.filter(i => i.type === t).length,
    color: COLORS[t],
  })).filter(d => d.count > 0)

  const priorityData = ['highest','high','medium','low','lowest'].map(p => ({
    name: { highest: 'Crítica', high: 'Alta', medium: 'Media', low: 'Baja', lowest: 'Mínima' }[p],
    count: issues.filter(i => i.priority === p).length,
    color: COLORS[p],
  })).filter(d => d.count > 0)

  const memberData = profiles.map(m => ({
    name: m.name,
    total: issues.filter(i => i.assignee === m.id).length,
    done:  issues.filter(i => i.assignee === m.id && i.status === 'done').length,
    color: m.color,
  })).filter(d => d.total > 0)

  const velocityData = sprints.filter(s => s.status === 'completed' || s.status === 'active').map(s => {
    const si = issues.filter(i => i.sprintId === s.id)
    return {
      name: s.name,
      comprometidos: si.reduce((sum, i) => sum + (i.storyPoints || 0), 0),
      completados: si.filter(i => i.status === 'done').reduce((sum, i) => sum + (i.storyPoints || 0), 0),
    }
  })

  return (
    <div className="reports-page">
      <ProjectHeader projectId={projectId} />

      <div className="reports-body scroll-y">
        {/* KPIs */}
        <div className="reports-kpis">
          <KpiCard label="Issues totales"   value={issues.length}                color="#6F42C1" />
          <KpiCard label="Completados"       value={`${done}/${issues.length}`}  sub={`${progress}% avance`} color="#36B37E" />
          <KpiCard label="Bugs activos"      value={bugs}                         color="#FF5630" />
          <KpiCard label="Story points"      value={`${donePts}/${totPts}`}       sub="completados" color="#6554C0" />
          <KpiCard label="Sprints activos"   value={sprints.filter(s=>s.status==='active').length}  color="#FF8B00" />
          <KpiCard label="Épicas"            value={epics.length}                 color="#00B8D9" />
        </div>

        {issues.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <h3>Sin datos aún</h3>
            <p>Crea issues en el backlog o tablero para ver los reportes y métricas.</p>
          </div>
        ) : (
          <>
            <div className="reports-row">
              {statusData.length > 0 && (
                <div className="report-card">
                  <div className="report-card-title">Estado de issues</div>
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}
                        label={({ name, percent }) => `${(percent*100).toFixed(0)}%`} labelLine={false}>
                        {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {typeData.length > 0 && (
                <div className="report-card">
                  <div className="report-card-title">Tipos de issues</div>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={typeData} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={AXIS_STYLE} />
                      <YAxis tick={AXIS_STYLE} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Issues" radius={[4,4,0,0]}>
                        {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {priorityData.length > 0 && (
                <div className="report-card">
                  <div className="report-card-title">Por prioridad</div>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={priorityData} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={AXIS_STYLE} />
                      <YAxis tick={AXIS_STYLE} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Bar dataKey="count" name="Issues" radius={[4,4,0,0]}>
                        {priorityData.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="reports-row">
              {memberData.length > 0 && (
                <div className="report-card report-card--wide">
                  <div className="report-card-title">Carga de trabajo por miembro</div>
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={memberData} margin={{ top: 4, right: 16, left: -24, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={AXIS_STYLE} />
                      <YAxis tick={AXIS_STYLE} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="total" name="Asignados" fill="#DEEBFF" radius={[4,4,0,0]} />
                      <Bar dataKey="done"  name="Completados" fill="#36B37E" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {velocityData.length > 0 && (
                <div className="report-card report-card--wide">
                  <div className="report-card-title">Velocidad por sprint (story points)</div>
                  <ResponsiveContainer width="100%" height={210}>
                    <AreaChart data={velocityData} margin={{ top: 4, right: 16, left: -24, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={AXIS_STYLE} />
                      <YAxis tick={AXIS_STYLE} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="comprometidos" name="Comprometidos" stroke="#6F42C1" fill="#F0E7FF" strokeWidth={2} />
                      <Area type="monotone" dataKey="completados"   name="Completados"   stroke="#36B37E" fill="#E3FCEF"  strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Issues table */}
            <div className="report-card" style={{ marginBottom: 24 }}>
              <div className="report-card-title">Últimos issues ({Math.min(issues.length, 20)} de {issues.length})</div>
              <div style={{ overflowX: 'auto' }}>
                <table className="issues-table">
                  <thead>
                    <tr>
                      <th>Key</th><th>Tipo</th><th>Título</th><th>Prioridad</th><th>Estado</th><th>Asignado</th><th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...issues].reverse().slice(0, 20).map(issue => (
                      <tr key={issue.id}>
                        <td><code className="table-key">{issue.key}</code></td>
                        <td><IssueTypeIcon type={issue.type} size={13} /></td>
                        <td className="table-title">{issue.title}</td>
                        <td><PriorityIcon priority={issue.priority} size={13} showLabel /></td>
                        <td>
                          <Badge status={issue.status} size="sm" label={
                            { todo: 'Por hacer', inprogress: 'Progreso', review: 'Revisión', done: 'Hecho' }[issue.status]
                          } />
                        </td>
                        <td>
                          {issue.assignee
                            ? <Avatar memberId={issue.assignee} size="xs" showName />
                            : <span className="table-unassigned">—</span>
                          }
                        </td>
                        <td><span className="table-points">{issue.storyPoints ?? '—'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, color }) {
  return (
    <div className="kpi-card">
      <div className="kpi-value" style={{ color }}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      <div className="kpi-label">{label}</div>
    </div>
  )
}
