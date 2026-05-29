// No built-in projects. Taskify loads user projects from the selected workspace.
export const DEFAULT_PROJECTS = []

export const PLAN_YEARS = [2024, 2025, 2026, 2027, 2028, 2029, null]

export const getProjectById  = (id)  => DEFAULT_PROJECTS.find(p => p.id === id)
export const getProjectByKey = (key) => DEFAULT_PROJECTS.find(p => p.key === key)
