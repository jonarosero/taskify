import { useEffect, useRef } from 'react'
import { useStore } from '../store/useStore'

const NOTIFY_MINUTES = [15, 5, 1]  // notify 15min, 5min, 1min before

function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function currentMinutes() {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}

export default function useMeetingNotifier() {
  const { meetings } = useStore()
  const notifiedRef = useRef(new Set())

  useEffect(() => {
    if (!window.electronAPI?.showNotification) return

    const check = () => {
      const today   = todayStr()
      const nowMins = currentMinutes()

      meetings.forEach(m => {
        if (m.date !== today) return
        if (!m.startTime) return

        const meetMins = timeToMinutes(m.startTime)
        const diffMins = meetMins - nowMins

        NOTIFY_MINUTES.forEach(alertBefore => {
          const key = `${m.id}-${alertBefore}`
          // Fire notification if we're within 30 seconds of the alert time
          if (diffMins <= alertBefore && diffMins > alertBefore - 1 && !notifiedRef.current.has(key)) {
            notifiedRef.current.add(key)

            let body = ''
            if (alertBefore === 1)  body = `Empieza en 1 minuto — ${m.startTime}`
            else                     body = `Empieza en ${alertBefore} minutos — ${m.startTime}`
            if (m.location)          body += ` · ${m.location}`

            window.electronAPI.showNotification({
              title:   `📅 ${m.title}`,
              body,
              urgency: alertBefore <= 1 ? 'critical' : 'normal',
            })
          }
        })

        // Also notify AT the meeting time
        const startKey = `${m.id}-start`
        if (diffMins <= 0 && diffMins > -1 && !notifiedRef.current.has(startKey)) {
          notifiedRef.current.add(startKey)
          window.electronAPI.showNotification({
            title:   `🔔 Reunión ahora: ${m.title}`,
            body:    m.meetUrl ? `Unirse: ${m.meetUrl}` : (m.location || m.startTime || ''),
            urgency: 'critical',
          })
        }
      })
    }

    // Check every 30 seconds
    const interval = setInterval(check, 30000)
    check()  // also check immediately

    return () => clearInterval(interval)
  }, [meetings])
}
