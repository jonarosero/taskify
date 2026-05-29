import { useStore } from '../../store/useStore'
import { getMemberById } from '../../constants/members'
import './Avatar.css'

export default function Avatar({ memberId, size = 'md', showName = false, className = '' }) {
  const profiles = useStore(s => s.profiles)
  const member = getMemberById(memberId, profiles)
  if (!member) {
    return (
      <div className={`avatar avatar--${size} avatar--unknown ${className}`} title="Sin asignar">
        ?
      </div>
    )
  }

  return (
    <div className={`avatar-wrapper ${className}`}>
      <div
        className={`avatar avatar--${size}`}
        style={{ background: member.color }}
        title={member.name}
      >
        {member.initials}
      </div>
      {showName && <span className="avatar-name">{member.name}</span>}
    </div>
  )
}
