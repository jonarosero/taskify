const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getWorkspaceState: ()                    => ipcRenderer.invoke('get-workspace-state'),
  chooseProjectsRoot: ()                   => ipcRenderer.invoke('choose-projects-root'),
  scanProjects:      ()                    => ipcRenderer.invoke('scan-projects'),
  loadData:          (filename)            => ipcRenderer.invoke('load-data',           filename),
  saveData:          (filename, data)      => ipcRenderer.invoke('save-data',           filename, data),
  openFolder:        (folderPath)          => ipcRenderer.invoke('open-folder',         folderPath),
  openFile:          (folder, filename)    => ipcRenderer.invoke('open-file',           folder, filename),
  listProjectFiles:  (projectFolder)       => ipcRenderer.invoke('list-project-files',  projectFolder),
  getProjectsDir:    ()                    => ipcRenderer.invoke('get-projects-dir'),
  getWorkspace:      ()                    => ipcRenderer.invoke('get-workspace'),
  // Embedded PTY terminal
  ptyCreate:         (opts)          => ipcRenderer.invoke('pty-create',  opts),
  ptyInput:          (id, data)      => ipcRenderer.send('pty-input',     { id, data }),
  ptyResize:         (id, cols, rows)=> ipcRenderer.invoke('pty-resize',  { id, cols, rows }),
  ptyDestroy:        (id)            => ipcRenderer.invoke('pty-destroy',  id),
  onPtyData:         (cb)            => ipcRenderer.on('pty-data',  (_, d) => cb(d)),
  onPtyExit:         (cb)            => ipcRenderer.on('pty-exit',  (_, d) => cb(d)),
  offPtyListeners:   ()              => { ipcRenderer.removeAllListeners('pty-data'); ipcRenderer.removeAllListeners('pty-exit') },
  // New project
  createProjectFolder:   (folderName, project, projectData) => ipcRenderer.invoke('create-project-folder',  folderName, project, projectData),
  deleteProjectFolder:   (folderName)          => ipcRenderer.invoke('delete-project-folder',  folderName),
  deleteProjectRecord:   (projectId)           => ipcRenderer.invoke('delete-project-record',  projectId),
  // Desktop notifications
  showNotification: (opts) => ipcRenderer.invoke('show-notification', opts),
  // Terminal / Agent
  checkTool:             (tool)                => ipcRenderer.invoke('check-tool',               tool),
  openTerminalInFolder:  (folder, opts)        => ipcRenderer.invoke('open-terminal-in-folder',  folder, opts),
  // Excel Backlog
  saveExcelBase64:   (b64, name)           => ipcRenderer.invoke('save-excel-base64',  b64, name),
  openExcelBase64:   ()                    => ipcRenderer.invoke('open-excel-base64'),
  // Share
  createShareZip:    ()                    => ipcRenderer.invoke('create-share-zip'),
  buildInstaller:    ()                    => ipcRenderer.invoke('build-installer'),
  onBuildProgress:   (cb)                  => ipcRenderer.on('build-progress', (_, d) => cb(d)),
  offBuildProgress:  ()                    => ipcRenderer.removeAllListeners('build-progress'),
})
