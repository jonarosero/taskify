import './Button.css'

export default function Button({
  children, variant = 'primary', size = 'md',
  onClick, disabled, type = 'button', icon, className = '', title, loading
}) {
  return (
    <button
      type={type}
      className={`btn btn--${variant} btn--${size} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading
        ? <span className="btn-spinner" />
        : icon && <span className="btn-icon">{icon}</span>
      }
      {children && <span>{children}</span>}
    </button>
  )
}
