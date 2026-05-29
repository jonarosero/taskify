const isElectron = () => typeof window !== 'undefined' && !!window.electronAPI

export async function loadData(filename) {
  if (isElectron()) return await window.electronAPI.loadData(filename)
  try { return JSON.parse(localStorage.getItem(`taskify:${filename}`)) } catch { return null }
}

export async function saveData(filename, data) {
  if (isElectron()) return await window.electronAPI.saveData(filename, data)
  try { localStorage.setItem(`taskify:${filename}`, JSON.stringify(data)); return true } catch { return false }
}

export async function getWorkspaceState() {
  if (isElectron()) return await window.electronAPI.getWorkspaceState()
  return { configured: true, projectsRoot: 'Browser localStorage' }
}

export async function chooseProjectsRoot() {
  if (isElectron()) return await window.electronAPI.chooseProjectsRoot()
  return { ok: true, projectsRoot: 'Browser localStorage' }
}

export async function scanProjects() {
  if (isElectron()) return await window.electronAPI.scanProjects()
  return []
}

export async function openFolder(folderPath) {
  if (isElectron()) return await window.electronAPI.openFolder(folderPath)
  console.log('openFolder (no electron):', folderPath)
}

export async function openFile(projectFolder, filename) {
  if (isElectron()) return await window.electronAPI.openFile(projectFolder, filename)
}

export async function listProjectFiles(projectFolder) {
  if (isElectron()) return await window.electronAPI.listProjectFiles(projectFolder)
  return []
}
