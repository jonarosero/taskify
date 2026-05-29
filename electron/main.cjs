const { app, BrowserWindow, ipcMain, shell, dialog, Notification } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')
const { exec, spawn } = require('child_process')

const ELECTRON_DIR = __dirname
const APP_DIR = path.join(ELECTRON_DIR, '..')
const DIST_INDEX = path.join(APP_DIR, 'dist', 'index.html')
const USER_SETTINGS_FILE = path.join(app.getPath('userData'), 'taskify-app.json')
const PROJECT_FILE = 'taskify.project.json'
const CONFIG_DIR = 'config'

const hasDist = fs.existsSync(DIST_INDEX)
const isDev = process.env.NODE_ENV === 'development' && !hasDist

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true })
}

function readJson(filePath, fallback = null) {
  try {
    if (!fs.existsSync(filePath)) return fallback
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    console.error('readJson:', filePath, e.message)
    return fallback
  }
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function readAppSettings() {
  return readJson(USER_SETTINGS_FILE, {}) || {}
}

function writeAppSettings(settings) {
  writeJson(USER_SETTINGS_FILE, settings)
}

function getProjectsRoot() {
  return readAppSettings().projectsRoot || null
}

function getConfigPath(filename) {
  const root = getProjectsRoot()
  if (!root) return null
  return path.join(root, CONFIG_DIR, filename)
}

function getProjectFileById(projectId) {
  const root = getProjectsRoot()
  if (!root || !fs.existsSync(root)) return null
  const entries = fs.readdirSync(root, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === CONFIG_DIR) continue
    const filePath = path.join(root, entry.name, PROJECT_FILE)
    const payload = readJson(filePath)
    if (payload?.project?.id === projectId) return filePath
  }
  return null
}

function projectPayloadToData(payload) {
  return {
    issues: payload.issues || [],
    sprints: payload.sprints || [],
    epics: payload.epics || [],
    wiki: payload.wiki || '',
    settings: payload.settings || {},
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1080,
    minHeight: 680,
    title: 'Taskify',
    webPreferences: {
      preload: path.join(ELECTRON_DIR, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: '#282A36',
    icon: path.join(APP_DIR, 'public', 'icon.png'),
    show: false,
    autoHideMenuBar: true,
  })

  win.once('ready-to-show', () => { win.show(); win.focus() })
  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(DIST_INDEX)
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('get-workspace-state', () => {
  const projectsRoot = getProjectsRoot()
  return { configured: !!projectsRoot && fs.existsSync(projectsRoot), projectsRoot }
})

ipcMain.handle('choose-projects-root', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Choose your Taskify workspace folder',
    properties: ['openDirectory', 'createDirectory'],
  })
  if (canceled || !filePaths.length) return { ok: false, reason: 'cancelled' }

  const projectsRoot = filePaths[0]
  ensureDir(projectsRoot)
  ensureDir(path.join(projectsRoot, CONFIG_DIR))
  for (const [filename, initial] of Object.entries({
    'settings.json': { theme: 'light', settings: { defaultAssignee: null }, workspaceVersion: 1 },
    'profiles.json': [],
    'objectives.json': [],
  })) {
    const filePath = path.join(projectsRoot, CONFIG_DIR, filename)
    if (!fs.existsSync(filePath)) writeJson(filePath, initial)
  }
  writeAppSettings({ ...readAppSettings(), projectsRoot })
  return { ok: true, projectsRoot }
})

ipcMain.handle('get-projects-dir', () => getProjectsRoot())
ipcMain.handle('get-profiles-dir', () => getConfigPath('profiles.json'))
ipcMain.handle('get-workspace', () => getProjectsRoot())

ipcMain.handle('scan-projects', () => {
  const root = getProjectsRoot()
  if (!root || !fs.existsSync(root)) return []
  return fs.readdirSync(root, { withFileTypes: true })
    .filter(d => d.isDirectory() && d.name !== CONFIG_DIR)
    .map(d => d.name)
})

ipcMain.handle('load-data', (_, filename) => {
  const root = getProjectsRoot()
  if (!root) return null

  if (filename === 'custom_projects.json') {
    return fs.readdirSync(root, { withFileTypes: true })
      .filter(d => d.isDirectory() && d.name !== CONFIG_DIR)
      .map(d => readJson(path.join(root, d.name, PROJECT_FILE)))
      .filter(Boolean)
      .map(payload => ({ ...payload.project, folder: payload.project?.folder || path.basename(path.dirname(getProjectFileById(payload.project?.id) || '')) }))
  }
  if (filename === 'app_settings.json') return readJson(getConfigPath('settings.json'), null)
  if (filename === 'profiles.json') return readJson(getConfigPath('profiles.json'), [])
  if (filename === 'objectives.json') return readJson(getConfigPath('objectives.json'), [])
  if (filename === 'meetings.json') return readJson(getConfigPath('meetings.json'), [])
  if (filename === 'google_cal.json') return readJson(getConfigPath('google_cal.json'), null)

  const projectMatch = filename.match(/^project_(.+)\.json$/)
  if (projectMatch) {
    const filePath = getProjectFileById(projectMatch[1])
    const payload = filePath ? readJson(filePath) : null
    return payload ? projectPayloadToData(payload) : null
  }
  return null
})

ipcMain.handle('save-data', (_, filename, data) => {
  const root = getProjectsRoot()
  if (!root) return false

  if (filename === 'custom_projects.json') return true
  if (filename === 'app_settings.json') { writeJson(getConfigPath('settings.json'), data); return true }
  if (filename === 'profiles.json') { writeJson(getConfigPath('profiles.json'), data); return true }
  if (filename === 'objectives.json') { writeJson(getConfigPath('objectives.json'), data); return true }
  if (filename === 'meetings.json') { writeJson(getConfigPath('meetings.json'), data); return true }
  if (filename === 'google_cal.json') { writeJson(getConfigPath('google_cal.json'), data); return true }

  const projectMatch = filename.match(/^project_(.+)\.json$/)
  if (projectMatch) {
    const filePath = getProjectFileById(projectMatch[1])
    if (!filePath) return false
    const existing = readJson(filePath, {}) || {}
    writeJson(filePath, { ...existing, ...data, project: existing.project, updatedAt: new Date().toISOString() })
    return true
  }
  return false
})

ipcMain.handle('open-folder', (_, folderPath) => {
  const root = getProjectsRoot()
  if (!root) return
  const resolved = path.isAbsolute(folderPath) ? folderPath : path.join(root, folderPath)
  if (fs.existsSync(resolved)) shell.openPath(resolved)
  else shell.openPath(root)
})

ipcMain.handle('list-project-files', (_, projectFolder) => {
  const root = getProjectsRoot()
  if (!root) return []
  const fullPath = path.join(root, projectFolder)
  if (!fs.existsSync(fullPath)) return []
  const files = []
  for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === PROJECT_FILE) continue
    const entryPath = path.join(fullPath, entry.name)
    if (entry.isFile()) {
      const stat = fs.statSync(entryPath)
      files.push({ name: entry.name, size: stat.size, isDir: false })
    } else if (entry.isDirectory()) {
      for (const sf of fs.readdirSync(entryPath, { withFileTypes: true })) {
        if (!sf.name.startsWith('.') && sf.isFile()) {
          const stat = fs.statSync(path.join(entryPath, sf.name))
          files.push({ name: `${entry.name}/${sf.name}`, size: stat.size, isDir: false, folder: entry.name })
        }
      }
    }
  }
  return files
})

ipcMain.handle('open-file', (_, projectFolder, filename) => {
  const root = getProjectsRoot()
  if (!root) return
  const filePath = path.join(root, projectFolder, filename)
  if (fs.existsSync(filePath)) shell.openPath(filePath)
})

let pty = null
try { pty = require('node-pty-prebuilt-multiarch') } catch(e) { console.warn('pty:', e.message) }
const ptys = {}

ipcMain.handle('pty-create', (event, { cwd, cols, rows }) => {
  const root = getProjectsRoot() || os.homedir()
  cols = cols || 120; rows = rows || 35
  const resolved = path.isAbsolute(cwd || '') ? cwd : path.join(root, cwd || '')
  const ensured = fs.existsSync(resolved) ? resolved : root
  const id = 'pty-' + Date.now()
  const send = (data) => { if (!event.sender.isDestroyed()) event.sender.send('pty-data', { id, data }) }

  const spawnPipe = () => {
    const encoded = Buffer.from(
      '[Console]::OutputEncoding=[System.Text.Encoding]::UTF8;' +
      'Set-Location $env:TASKIFY_PATH;' +
      'Write-Host "";' +
      'Write-Host "  Taskify Terminal" -ForegroundColor Cyan;' +
      'Write-Host ("  Folder: "+$env:TASKIFY_PATH) -ForegroundColor Yellow;' +
      'Write-Host "  Usa: claude / opencode / cursor ." -ForegroundColor Green;' +
      'Write-Host "";',
      'utf16le').toString('base64')
    const ps = spawn('powershell.exe', ['-NoLogo', '-NoExit', '-EncodedCommand', encoded], {
      cwd: ensured, stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, TASKIFY_PATH: ensured }
    })
    ptys[id] = { fb: true, proc: ps }
    ps.stdout.on('data', d => send(d.toString('utf8')))
    ps.stderr.on('data', d => send(d.toString('utf8')))
    ps.on('exit', code => { if (!event.sender.isDestroyed()) event.sender.send('pty-exit', { id, exitCode: code }); delete ptys[id] })
    return { ok: true, id, mode: 'pipe' }
  }

  if (pty) {
    let proc
    try {
      proc = pty.spawn('cmd.exe', [], {
        name: 'xterm-256color', cols, rows, cwd: ensured,
        env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor', TASKIFY_PATH: ensured }
      })
    } catch(e) { return spawnPipe() }
    ptys[id] = proc
    proc.onData(data => send(data))
    proc.onExit(({ exitCode }) => { if (!event.sender.isDestroyed()) event.sender.send('pty-exit', { id, exitCode }); delete ptys[id] })
    setTimeout(() => { try { proc.write('cls\r\n') } catch {} }, 400)
    return { ok: true, id, mode: 'pty' }
  }
  return spawnPipe()
})

ipcMain.on('pty-input', (_, { id, data }) => {
  const p = ptys[id]
  if (!p) return
  if (p.fb) { if (p.proc.stdin.writable) p.proc.stdin.write(data, 'utf8') }
  else try { p.write(data) } catch {}
})

ipcMain.handle('pty-resize', (_, { id, cols, rows }) => {
  const p = ptys[id]
  if (p && !p.fb) try { p.resize(cols, rows) } catch {}
})

ipcMain.handle('pty-destroy', (_, id) => {
  const p = ptys[id]
  if (p) { try { if (p.fb) { p.proc.stdin.end(); p.proc.kill() } else p.kill() } catch {} }
  delete ptys[id]
})

ipcMain.handle('show-notification', (_, { title, body, urgency }) => {
  if (!Notification.isSupported()) return
  new Notification({ title: title || 'Taskify', body: body || '', silent: urgency !== 'critical' }).show()
})

ipcMain.handle('delete-project-folder', async (_, folderName) => {
  const root = getProjectsRoot()
  if (!root || !folderName) return { ok: false, reason: 'Missing workspace or folder name' }
  const fullPath = path.join(root, folderName)
  if (!fs.existsSync(fullPath)) return { ok: true }
  try { fs.rmSync(fullPath, { recursive: true, force: true }); return { ok: true } }
  catch (e) { return { ok: false, reason: e.message } }
})

ipcMain.handle('delete-project-record', async (_, projectId) => {
  const filePath = getProjectFileById(projectId)
  if (!filePath) return { ok: true }
  try { fs.rmSync(filePath, { force: true }); return { ok: true } }
  catch (e) { return { ok: false, reason: e.message } }
})

ipcMain.handle('create-project-folder', async (_, folderName, project = null, projectData = null) => {
  const root = getProjectsRoot()
  if (!root) return { ok: false, reason: 'Choose a Taskify workspace first.' }
  if (!folderName || !/^[\w\-. ]+$/.test(folderName)) return { ok: false, reason: 'Invalid folder name.' }
  const fullPath = path.join(root, folderName)
  if (fs.existsSync(fullPath)) return { ok: false, reason: `Folder "${folderName}" already exists.` }
  try {
    fs.mkdirSync(fullPath, { recursive: true })
    ensureDir(path.join(fullPath, 'documents'))
    ensureDir(path.join(fullPath, 'attachments'))
    if (project) {
      writeJson(path.join(fullPath, PROJECT_FILE), {
        project: { ...project, folder: folderName },
        ...(projectData || { issues: [], sprints: [], epics: [], settings: {} }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } else {
      fs.writeFileSync(path.join(fullPath, 'README.md'), `# ${folderName.replace(/_/g, ' ')}\n\nProject folder created by Taskify.\n`, 'utf-8')
    }
    return { ok: true, path: fullPath }
  } catch (e) {
    return { ok: false, reason: e.message }
  }
})

ipcMain.handle('check-tool', async (_, tool) => new Promise(resolve => exec(`where ${tool}`, (err) => resolve(!err))))

ipcMain.handle('open-terminal-in-folder', async (_, projectFolder, options = {}) => {
  const root = getProjectsRoot()
  if (!root) return { ok: false, reason: 'Choose a Taskify workspace first.' }
  const fullPath = path.join(root, projectFolder)
  ensureDir(fullPath)
  const { mode = 'terminal', agentCommand = 'claude' } = options
  let cmd = ''
  if (mode === 'claude') cmd = `start "Claude Code - ${projectFolder}" cmd /k "cd /d "${fullPath}" && echo. && echo Taskify - Claude Code agent && echo Folder: ${fullPath} && echo. && ${agentCommand}"`
  else if (mode === 'powershell') cmd = `start "Terminal - ${projectFolder}" powershell -NoExit -Command "Set-Location '${fullPath}'; Write-Host 'Taskify Terminal' -ForegroundColor Cyan; Write-Host 'Project: ${projectFolder}' -ForegroundColor Green"`
  else if (mode === 'vscode') cmd = `code "${fullPath}"`
  else cmd = `start "Terminal - ${projectFolder}" cmd /k "cd /d "${fullPath}" && echo Taskify - Project terminal && echo."`
  return new Promise(resolve => exec(cmd, (err) => resolve({ ok: !err, reason: err?.message })))
})

ipcMain.handle('save-excel-base64', async (_, b64, defaultName) => {
  const { canceled, filePath: savePath } = await dialog.showSaveDialog({
    title: 'Export backlog',
    defaultPath: path.join(app.getPath('desktop'), defaultName || 'backlog.xlsx'),
    filters: [{ name: 'Excel', extensions: ['xlsx'] }],
  })
  if (canceled || !savePath) return { ok: false }
  try { fs.writeFileSync(savePath, Buffer.from(b64, 'base64')); shell.showItemInFolder(savePath); return { ok: true, path: savePath } }
  catch (e) { return { ok: false, reason: e.message } }
})

ipcMain.handle('open-excel-base64', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Import issues from Excel',
    filters: [{ name: 'Excel / CSV', extensions: ['xlsx', 'xls', 'csv'] }],
    properties: ['openFile'],
  })
  if (canceled || !filePaths.length) return null
  try { return fs.readFileSync(filePaths[0]).toString('base64') } catch { return null }
})

ipcMain.handle('create-share-zip', async () => {
  const root = getProjectsRoot()
  if (!root) return { ok: false, reason: 'Choose a Taskify workspace first.' }
  const { canceled, filePath: savePath } = await dialog.showSaveDialog({
    title: 'Save Taskify workspace package',
    defaultPath: path.join(app.getPath('desktop'), `Taskify-Workspace-${_dateStamp()}.zip`),
    filters: [{ name: 'ZIP archive', extensions: ['zip'] }],
  })
  if (canceled || !savePath) return { ok: false, reason: 'cancelled' }
  await _psZip(root, savePath)
  return { ok: true, path: savePath }
})

ipcMain.handle('build-installer', async (event) => new Promise((resolve) => {
  const proc = spawn('npm', ['run', 'dist:win'], { cwd: APP_DIR, shell: true, env: { ...process.env } })
  let log = ''
  proc.stdout.on('data', d => { const s = d.toString(); log += s; event.sender.send('build-progress', s) })
  proc.stderr.on('data', d => { const s = d.toString(); log += s; event.sender.send('build-progress', s) })
  proc.on('close', (code) => {
    if (code === 0) { const outDir = path.join(APP_DIR, 'dist-electron'); resolve({ ok: true, path: outDir }); shell.openPath(outDir) }
    else resolve({ ok: false, reason: `exit code ${code}`, log })
  })
  proc.on('error', (e) => resolve({ ok: false, reason: e.message }))
}))

function _dateStamp() {
  return new Date().toISOString().slice(0, 10)
}

function _psZip(sourceDir, destZip) {
  return new Promise((resolve, reject) => {
    const src = sourceDir.replace(/'/g, "''")
    const dest = destZip.replace(/'/g, "''")
    const cmd = `powershell -NoProfile -Command "Compress-Archive -Path '${src}\\*' -DestinationPath '${dest}' -Force"`
    exec(cmd, { timeout: 120000 }, (err) => err ? reject(err) : resolve())
  })
}
