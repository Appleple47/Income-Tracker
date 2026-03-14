import { useEffect, useRef } from 'react'

interface ToastProps {
  message: string
  type: 'success' | 'undo' | null
  onUndo?: () => void
  onDismiss: () => void
  duration?: number
}

export function Toast({ message, type, onUndo, onDismiss, duration = 4000 }: ToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!type) return
    if (timerRef.current) clearTimeout(timerRef.current)
    if (progressRef.current) {
      progressRef.current.style.transition = 'none'
      progressRef.current.style.width = '100%'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (progressRef.current) {
          progressRef.current.style.transition = `width ${duration}ms linear`
          progressRef.current.style.width = '0%'
        }
      }))
    }
    timerRef.current = setTimeout(onDismiss, duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [type, message, duration, onDismiss])

  if (!type) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, minWidth: 260, animation: 'slideUp .25s ease',
    }}>
      <div className={`card border-0 shadow-lg ${type === 'undo' ? 'border-danger' : 'border-success'}`}
        style={{ background: '#1e1e2e', overflow: 'hidden' }}>
        <div className="card-body py-2 px-3 d-flex align-items-center gap-3">
          <span className="small text-light flex-grow-1">{message}</span>
          {type === 'undo' && onUndo && (
            <button className="btn btn-danger btn-sm py-0" onClick={() => { onUndo(); onDismiss() }}>
              取り消し
            </button>
          )}
        </div>
        <div ref={progressRef} style={{
          height: 3, background: type === 'undo' ? '#dc3545' : '#198754',
          width: '100%',
        }} />
      </div>
    </div>
  )
}
