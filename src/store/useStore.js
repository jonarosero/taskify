import { create } from 'zustand'
import { DEFAULT_PROJECTS } from '../constants/projects'
import { loadData, saveData, getWorkspaceState, chooseProjectsRoot } from '../utils/storage'
import { generateId, today } from '../utils/helpers'

const DEFAULT_PROJECT_DATA = () => ({
  issues: [],
  sprints: [],
  epics: [],
  settings: {
    status:       'planning',
    description:  '',
    lead:         '',
    team:         [],
    department:   '',
    startDate:    null,
    endDate:      null,
    plannedYear:  null,
    tags:               [],
    customName:         '',
    customFolder:       '',
    priority:           'medium',
    budget:             '',
    notes:              '',
    strategicObjective: '',
    agentEnabled:       false,
    agentCommand:       'opencode',
  }
})

export const useStore = create((set, get) => ({
  // ── Global State ──────────────────────────────────────────────
  theme: 'light',
  sidebarCollapsed: false,
  currentProjectId: null,
  projectData: {},
  customProjects: [],
  meetings: [],
  googleCalConfig: null,
  issueModalOpen: false,
  editingIssue: null,
  defaultIssueStatus: 'todo',
  settings: { defaultAssignee: null },
  objectives: [],   // [{id, label, color, icon}]
  profiles: [],
  workspace: { configured: false, projectsRoot: null },
  initializing: true,

  getAllProjects: () => {
    const { customProjects } = get()
    return [...DEFAULT_PROJECTS, ...customProjects]
  },

  // ── Init ──────────────────────────────────────────────────────
  initStore: async () => {
    const workspace = await getWorkspaceState()
    if (!workspace.configured) {
      set({ workspace, initializing: false })
      return
    }
    const appSettings = await loadData('app_settings.json')
    if (appSettings) {
      set({ theme: appSettings.theme || 'light', settings: appSettings.settings || {} })
    }
    const customProjects  = (await loadData('custom_projects.json'))  || []
    const meetings        = (await loadData('meetings.json'))          || []
    const googleCalConfig = (await loadData('google_cal.json'))        || null
    const objectives      = (await loadData('objectives.json'))        || []
    const profiles        = (await loadData('profiles.json'))          || []
    set({ customProjects, meetings, googleCalConfig, objectives, profiles, workspace })

    const pd = {}
    const allProjects = [...DEFAULT_PROJECTS, ...customProjects]
    for (const proj of allProjects) {
      const data = await loadData(`project_${proj.id}.json`)
      pd[proj.id] = data || DEFAULT_PROJECT_DATA()
    }
    set({ projectData: pd, initializing: false })
  },

  setupWorkspace: async () => {
    const res = await chooseProjectsRoot()
    if (res?.ok) await get().initStore()
    return res
  },

  // ── Objectives ────────────────────────────────────────────────
  addObjective: async (obj) => {
    const newObj = { id: generateId('OBJ'), ...obj }
    const updated = [...get().objectives, newObj]
    set({ objectives: updated })
    await saveData('objectives.json', updated)
    return newObj
  },

  updateObjective: async (id, updates) => {
    const updated = get().objectives.map(o => o.id === id ? { ...o, ...updates } : o)
    set({ objectives: updated })
    await saveData('objectives.json', updated)
  },

  deleteObjective: async (id) => {
    const updated = get().objectives.filter(o => o.id !== id)
    set({ objectives: updated })
    await saveData('objectives.json', updated)
  },

  // ── Profiles ─────────────────────────────────────────────────
  addProfile: async (profile) => {
    const newProfile = { id: generateId('USR'), ...profile }
    const updated = [...get().profiles, newProfile]
    set({ profiles: updated })
    await saveData('profiles.json', updated)
    return newProfile
  },

  updateProfile: async (id, updates) => {
    const updated = get().profiles.map(p => p.id === id ? { ...p, ...updates } : p)
    set({ profiles: updated })
    await saveData('profiles.json', updated)
  },

  deleteProfile: async (id) => {
    const updated = get().profiles.filter(p => p.id !== id)
    set({ profiles: updated })
    await saveData('profiles.json', updated)
  },

  // ── Custom Projects ───────────────────────────────────────────
  addCustomProject: async (projectDef) => {
    const id = `CP${Date.now()}`
    const newProject = { ...projectDef, id, custom: true }
    const updated = [...get().customProjects, newProject]
    const pd = { ...get().projectData }
    pd[id] = DEFAULT_PROJECT_DATA()
    pd[id].settings = {
      ...pd[id].settings,
      customName:         newProject.name,
      description:        newProject.description || '',
      lead:               newProject.lead || '',
      department:         newProject.department || '',
      startDate:          newProject.startDate || null,
      endDate:            newProject.endDate || null,
      plannedYear:        newProject.defaultYear || null,
      priority:           newProject.priority || 'medium',
      strategicObjective: newProject.strategicObjective || '',
      budget:             newProject.budget || '',
      tags:               newProject.tags || [],
    }
    if (window.electronAPI?.createProjectFolder) {
      const res = await window.electronAPI.createProjectFolder(newProject.folder, newProject, pd[id])
      if (!res?.ok) throw new Error(res?.reason || 'Could not create project folder')
    }
    set({ customProjects: updated, projectData: pd })
    return newProject
  },

  // ── Meetings ──────────────────────────────────────────────────
  saveMeeting: async (meeting) => {
    const { meetings } = get()
    const id = meeting.id || `MTG-${Date.now()}`
    const m = { ...meeting, id }
    const updated = meetings.find(x => x.id === id)
      ? meetings.map(x => x.id === id ? m : x)
      : [...meetings, m]
    set({ meetings: updated })
    await saveData('meetings.json', updated)
    return m
  },

  deleteMeeting: async (id) => {
    const updated = get().meetings.filter(m => m.id !== id)
    set({ meetings: updated })
    await saveData('meetings.json', updated)
  },

  saveGoogleCalConfig: async (config) => {
    set({ googleCalConfig: config })
    await saveData('google_cal.json', config)
  },

  saveWiki: async (pid, content) => {
    set(s => ({
      projectData: { ...s.projectData, [pid]: { ...s.projectData[pid], wiki: content } }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },

  deleteCustomProject: async (id) => {
    await window.electronAPI?.deleteProjectRecord?.(id)
    const updated = get().customProjects.filter(p => p.id !== id)
    const pd = { ...get().projectData }
    delete pd[id]
    set({ customProjects: updated, projectData: pd })
  },

  // ── Theme ─────────────────────────────────────────────────────
  setTheme: async (theme) => {
    set({ theme })
    const { settings } = get()
    await saveData('app_settings.json', { theme, settings })
  },
  toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),

  updateSettings: async (updates) => {
    const settings = { ...get().settings, ...updates }
    set({ settings })
    await saveData('app_settings.json', { theme: get().theme, settings })
  },

  // ── Sidebar ───────────────────────────────────────────────────
  toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  // ── Project ───────────────────────────────────────────────────
  setCurrentProject: (id) => set({ currentProjectId: id }),

  getProjectData: (pid) => get().projectData[pid] || DEFAULT_PROJECT_DATA(),

  getProjectYear: (pid) => {
    const pd = get().projectData[pid]
    const startYear = pd?.settings?.startDate ? Number(String(pd.settings.startDate).slice(0, 4)) : null
    if (startYear) return startYear
    if (pd?.settings?.plannedYear !== undefined) return pd.settings.plannedYear
    return DEFAULT_PROJECTS.find(p => p.id === pid)?.defaultYear ?? null
  },

  moveProjectToYear: async (pid, year) => {
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: {
          ...s.projectData[pid],
          settings: { ...(s.projectData[pid]?.settings || {}), plannedYear: year }
        }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },

  updateProjectSettings: async (pid, updates) => {
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: { ...s.projectData[pid], settings: { ...s.projectData[pid].settings, ...updates } }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },

  // ── Issues ────────────────────────────────────────────────────
  openIssueModal: (editingIssue = null, defaultStatus = 'todo') =>
    set({ issueModalOpen: true, editingIssue, defaultIssueStatus: defaultStatus }),

  closeIssueModal: () => set({ issueModalOpen: false, editingIssue: null }),

  createIssue: async (pid, issueData) => {
    const allProjects = get().getAllProjects()
    const proj = allProjects.find(p => p.id === pid)
    const existingIssues = get().projectData[pid]?.issues || []
    const nextNum = existingIssues.length + 1
    const issue = {
      id: generateId('ISS'),
      key: `${proj?.key || pid}-${nextNum}`,
      projectId: pid,
      title: issueData.title || 'Untitled',
      description: issueData.description || '',
      type: issueData.type || 'task',
      status: issueData.status || 'todo',
      priority: issueData.priority || 'medium',
      assignee: issueData.assignee || null,
      reporter: issueData.reporter || null,
      sprintId: issueData.sprintId || null,
      epicId: issueData.epicId || null,
      storyPoints: issueData.storyPoints || null,
      labels: issueData.labels || [],
      dueDate: issueData.dueDate || null,
      startDate: issueData.startDate || null,
      createdAt: today(),
      updatedAt: today(),
      subtasks: [],
      comments: [],
    }
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: { ...s.projectData[pid], issues: [...(s.projectData[pid]?.issues || []), issue] }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
    return issue
  },

  updateIssue: async (pid, issueId, updates) => {
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: {
          ...s.projectData[pid],
          issues: s.projectData[pid].issues.map(i =>
            i.id === issueId ? { ...i, ...updates, updatedAt: today() } : i
          )
        }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },

  deleteIssue: async (pid, issueId) => {
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: { ...s.projectData[pid], issues: s.projectData[pid].issues.filter(i => i.id !== issueId) }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },

  moveIssue: async (pid, issueId, newStatus) => {
    await get().updateIssue(pid, issueId, { status: newStatus })
  },

  // ── Sprints ───────────────────────────────────────────────────
  createSprint: async (pid, sprintData) => {
    const sprints = get().projectData[pid]?.sprints || []
    const sprint = {
      id: generateId('SPR'),
      projectId: pid,
      name: sprintData.name || `Sprint ${sprints.length + 1}`,
      goal: sprintData.goal || '',
      startDate: sprintData.startDate || null,
      endDate: sprintData.endDate || null,
      status: 'planning',
      createdAt: today(),
    }
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: { ...s.projectData[pid], sprints: [...(s.projectData[pid]?.sprints || []), sprint] }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
    return sprint
  },

  updateSprint: async (pid, sprintId, updates) => {
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: {
          ...s.projectData[pid],
          sprints: s.projectData[pid].sprints.map(sp =>
            sp.id === sprintId ? { ...sp, ...updates } : sp
          )
        }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },

  deleteSprint: async (pid, sprintId) => {
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: {
          ...s.projectData[pid],
          sprints: s.projectData[pid].sprints.filter(sp => sp.id !== sprintId),
          issues: s.projectData[pid].issues.map(i =>
            i.sprintId === sprintId ? { ...i, sprintId: null } : i
          )
        }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },

  startSprint: async (pid, sprintId) => {
    await get().updateSprint(pid, sprintId, { status: 'active', startDate: today() })
  },

  completeSprint: async (pid, sprintId) => {
    await get().updateSprint(pid, sprintId, { status: 'completed' })
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: {
          ...s.projectData[pid],
          issues: s.projectData[pid].issues.map(i =>
            i.sprintId === sprintId && i.status !== 'done'
              ? { ...i, sprintId: null }
              : i
          )
        }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },

  assignIssueToSprint: async (pid, issueId, sprintId) => {
    await get().updateIssue(pid, issueId, { sprintId })
  },

  // ── Epics ─────────────────────────────────────────────────────
  createEpic: async (pid, epicData) => {
    const epic = {
      id: generateId('EPIC'),
      projectId: pid,
      title: epicData.title || 'New Epic',
      description: epicData.description || '',
      color: epicData.color || '#BD93F9',
      startDate: epicData.startDate || null,
      endDate: epicData.endDate || null,
      status: 'active',
      createdAt: today(),
    }
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: { ...s.projectData[pid], epics: [...(s.projectData[pid]?.epics || []), epic] }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
    return epic
  },

  updateEpic: async (pid, epicId, updates) => {
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: {
          ...s.projectData[pid],
          epics: s.projectData[pid].epics.map(e =>
            e.id === epicId ? { ...e, ...updates } : e
          )
        }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },

  deleteEpic: async (pid, epicId) => {
    set(s => ({
      projectData: {
        ...s.projectData,
        [pid]: {
          ...s.projectData[pid],
          epics: s.projectData[pid].epics.filter(e => e.id !== epicId),
          issues: s.projectData[pid].issues.map(i =>
            i.epicId === epicId ? { ...i, epicId: null } : i
          )
        }
      }
    }))
    await saveData(`project_${pid}.json`, get().projectData[pid])
  },
}))
