import { useState } from 'react'
import { getUserId, setUserId } from '../lib/supabase'

interface Props { onChanged: () => void }

export function UserIdPanel({ onChanged }: Props) {
  const [currentId] = useState(getUserId())
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(currentId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleApply() {
    const trimmed = input.trim()
    if (!trimmed) return
    if (!confirm('ユーザーIDを変更しますか？')) return
    setUserId(trimmed)
    onChanged()
  }
  return (
    <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: 16, background: '#fff' }}>
      <div className="card-body p-4">
        <div className="d-flex align-items-center gap-2 mb-4">
          <div className="bg-primary bg-opacity-10 p-2 rounded-3">
            <i className="bi bi-cloud-arrow-down text-primary"></i>
          </div>
          <span className="fw-bold">データの同期・共有</span>
        </div>

        <div className="mb-4">
          <label className="form-label small text-secondary">あなたのユーザーID</label>
          <div className="input-group">
            <input readOnly className="form-control bg-light border-0 fw-bold"
              style={{ fontSize: 12, color: '#0d6efd' }} value={currentId} />
            <button 
              className={`btn px-3 fw-bold ${copied ? 'btn-success' : 'btn-primary'}`} 
              onClick={handleCopy}
              style={{ borderTopRightRadius: 10, borderBottomRightRadius: 10 }}
            >
              {copied ? <i className="bi bi-check-lg"></i> : <i className="bi bi-copy"></i>}
            </button>
          </div>
          <div className="text-muted mt-2" style={{ fontSize: 10 }}>
            ※ このIDを別の端末に入力すると、同じデータを共有できます
          </div>
        </div>

        <div className="pt-3 border-top border-light">
          <label className="form-label small text-secondary">別の端末と同期する</label>
          <div className="input-group">
            <input className="form-control bg-light border-0"
              style={{ fontSize: 12 }} 
              value={input} onChange={e => setInput(e.target.value)}
              placeholder="共有したい相手のIDを入力" />
            <button className="btn btn-dark px-3 fw-bold" onClick={handleApply} style={{ borderTopRightRadius: 10, borderBottomRightRadius: 10 }}>
              同期
            </button>
          </div>
          <p className="text-muted mt-2 mb-0" style={{ fontSize: 10 }}>
            <i className="bi bi-info-circle me-1"></i>適用するとページが更新されます
          </p>
        </div>
      </div>
    </div>
  )
}