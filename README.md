# Taskify — Open Source Project Management

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-31-blue.svg)](https://www.electronjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://react.dev/)
[![Built with Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)

**Taskify** is a desktop project management app inspired by Jira — built with Electron + React. No login required, fully offline, single-user. Great for freelancers, small teams, and personal project tracking.

---

## Features

- **Kanban Board** — drag-and-drop issues across Todo / In Progress / Review / Done columns
- **Backlog** — manage and prioritize your issue backlog with sprint assignment
- **Roadmap** — timeline view of epics and sprints across your project
- **Reports** — burndown charts, velocity tracking, issue breakdowns with Recharts
- **Documents** — per-project document storage and viewer
- **Wiki** — rich markdown wiki per project
- **Meetings** — schedule meetings with desktop notifications and reminders
- **Embedded AI Terminal** — run AI coding agents (opencode, claude, etc.) in a built-in terminal
- **Strategic Objectives** — user-configurable objectives to group and categorize projects
- **User-owned Workspace** — choose where projects and settings are stored on first launch
- **Profiles** — create your own people/profiles and assign them to projects, issues, and meetings
- **Dark Theme (Dracula)** — beautiful purple/green Dracula color palette
- **Light Theme** — clean Jira-style light blue theme


---

## Download

Pre-built installers are available on the [Releases page](https://github.com/jonarosero/taskify/releases):

| Platform | File |
|----------|------|
| Windows  | `Taskify-Setup-1.0.0.exe` |
| macOS    | `Taskify-1.0.0.dmg` |
| Linux    | `Taskify-1.0.0.AppImage` / `taskify_1.0.0_amd64.deb` |

---

## Installation from Source

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/jonarosero/taskify.git
cd taskify

# 2. Install dependencies
npm install

# 3. Rebuild native modules for Electron
npm run rebuild  # or: npx electron-rebuild

# 4. Start in development mode
npm run dev
```

The app will open automatically. Vite serves the frontend on port 5173 and Electron loads it.

---

## Build for Distribution

```bash
# Windows (x64 installer)
npm run dist:win

# macOS (DMG)
npm run dist:mac

# Linux (AppImage + deb)
npm run dist:linux

# All platforms (requires platform-specific tools)
npm run dist
```

Output files are placed in `dist-electron/`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 31 |
| Frontend | React 18 + Vite 5 |
| State management | Zustand |
| Routing | React Router v6 |
| Drag & drop | dnd-kit |
| Charts | Recharts |
| Terminal | xterm.js + node-pty |
| Icons | Lucide React |
| Spreadsheet export | SheetJS (xlsx) |
| Date utilities | date-fns |

---

## Project Structure

```
taskify/
├── electron/
│   ├── main.cjs          # Electron main process
│   └── preload.cjs       # Context bridge (IPC)
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── common/       # Button, Modal, Avatar, etc.
│   │   ├── layout/       # Sidebar, ProjectHeader
│   │   └── NewProjectModal/
│   ├── constants/
│   │   ├── config.js     # Issue types, statuses, priorities
│   │   ├── members.js    # Default team members
│   │   └── projects.js   # Built-in project list (empty by default)
│   ├── pages/            # Route-level page components
│   │   ├── ProjectsHome.jsx
│   │   ├── Board.jsx
│   │   ├── Backlog.jsx
│   │   ├── Roadmap.jsx
│   │   ├── Reports.jsx
│   │   ├── Documents.jsx
│   │   ├── Wiki.jsx
│   │   ├── Meetings.jsx
│   │   ├── Terminal.jsx
│   │   └── ProjectSettings.jsx
│   ├── store/
│   │   └── useStore.js   # Global Zustand store
│   ├── utils/
│   │   ├── helpers.js
│   │   └── storage.js    # IPC-based JSON persistence
│   └── index.css         # CSS variables (light + Dracula dark)
├── data/                 # Kept empty; user data lives in the selected workspace
├── build/                # App icons
├── package.json
└── README.md
```

---

## Data Storage

Taskify stores all user data as JSON files in a workspace folder selected by the user on first launch. The repository does not contain sample projects, profiles, or runtime data.

- The app remembers the selected workspace path in Electron's `userData` directory.
- Global workspace files are stored in `<workspace>/config/`.
- Each project stores its own data in `<workspace>/<project-folder>/taskify.project.json`.

Example workspace:

```text
Taskify Workspace/
├── config/
│   ├── settings.json
│   ├── profiles.json
│   └── objectives.json
├── Website Redesign/
│   ├── taskify.project.json
│   ├── documents/
│   └── attachments/
└── Mobile App/
    ├── taskify.project.json
    ├── documents/
    └── attachments/
```

This makes Taskify portable and easy to back up with Git, OneDrive, Dropbox, Google Drive, or any folder sync tool.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

Please follow the existing code style and keep changes focused.

---

## License

MIT License — see [LICENSE](LICENSE) for details.

Copyright (c) 2026 [jonarosero](https://github.com/jonarosero)
