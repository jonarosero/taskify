export const TEAM_MEMBERS = []

export const getMemberById = (id, members = TEAM_MEMBERS) => members.find(m => m.id === id)

export function makeMemberId(name) {
  const slug = String(name || '')
    .trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  return `${slug || 'person'}-${Date.now()}`
}

export function makeInitials(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'
}
