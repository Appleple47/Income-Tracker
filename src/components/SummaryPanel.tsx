import { useState, useEffect, memo } from 'react'
import type { Job, Entry } from '../types'


interface Props {
  jobs: Job[]
  entries: Entry[]
  onAddJob: () => void
  onRemoveJob: (jobId: string) => void
  onUpdateJob: (jobId: string, name: string, wage: number, color?: string) => void
  onRestoreJob: (jobId: string) => void
  deletedJobs: Job[]
}

const JobRow = memo(({ job, onUpdate, onRemove, canDelete }: {
  job: Job,
  onUpdate: (id: string, name: string, wage: number, color: string) => void,
  onRemove: (id: string) => void,
  canDelete: boolean
}) => {
  const [tempName, setTempName] = useState(job.name)
  const [tempWage, setTempWage] = useState(String(job.wage))

  useEffect(() => {
    setTempName(job.name)
    setTempWage(String(job.wage))
  }, [job.name, job.wage])

  const handleBlur = () => {
    const finalWage = parseInt(tempWage) || 0

    // trim() して空なら、保存せずに表示を元の名前に戻す
    const trimmedName = tempName.trim()

    if (trimmedName === "") {
      setTempName(job.name) // 入力欄を元の名前に戻す
      return
    }

    // 値が変わっている場合のみ保存
    if (trimmedName !== job.name || finalWage !== job.wage) {
      onUpdate(job.id, trimmedName, finalWage, job.color)
    }
  }

  return (
    <div className="mb-4">
      <div className="d-flex gap-2 align-items-center">
        <input
          type="color"
          className="form-control form-control-color border-0 p-0 bg-transparent"
          style={{ width: 32, height: 32, cursor: 'pointer', flexShrink: 0 }}
          value={job.color}
          onChange={e => onUpdate(job.id, tempName, parseInt(tempWage) || 0, e.target.value)}
        />

        <input
          className="form-control form-control-sm fw-bold"
          value={tempName}
          onChange={e => setTempName(e.target.value)}
          onBlur={handleBlur} // ここで空チェックが走る
          placeholder="バイト名"
        />

        <div className="input-group input-group-sm w-50">
          <span className="input-group-text bg-light">¥</span>
          <input
            type="number"
            className="form-control"
            value={tempWage}
            onChange={e => setTempWage(e.target.value)}
            onBlur={handleBlur}
          />
        </div>

        <button
          className="trash-btn"
          onClick={() => onRemove(job.id)}
          disabled={!canDelete}
        >
          <div className="trash-lid"></div>
          <div className="trash-box"></div>
        </button>
      </div>
    </div>
  )
})

export function SummaryPanel({ jobs, entries, onAddJob, onRemoveJob, onUpdateJob }: Props) {
  // 総収入の計算
  const totalIncome = entries.reduce((s, e) => s + e.income, 0)
  const totalTransport = entries.reduce((s, e) => s + e.transport, 0)
  const grand = totalIncome + totalTransport

  return (
    <div className="animate__animated animate__fadeIn">
      {/* 収入表示カード（レイアウト維持） */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="text-secondary small fw-bold">今月の総収入</span>
          </div>
          <div className="d-flex align-items-baseline gap-1">
            <h2 className="fw-bold mb-0" style={{ fontSize: '2.4rem' }}>¥{grand.toLocaleString()}</h2>
          </div>
          <div className="mt-3 p-2 bg-light rounded-3 d-flex justify-content-around text-center">
            <div>
              <div className="text-muted small">給与</div>
              <div className="fw-bold">¥{totalIncome.toLocaleString()}</div>
            </div>
            <div className="border-start"></div>
            <div>
              <div className="text-muted small">交通費</div>
              <div className="fw-bold text-primary">¥{totalTransport.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* バイト先タイル（レイアウト維持） */}
      {/* バイト先タイル */}
      <div className="row g-3 mb-4">
        {jobs.map(job => {
          // このバイト先だけの記録を抽出
          const jobEntries = entries.filter(e => e.jobId === job.id);

          // 給与のみの合計
          const jobIncome = jobEntries.reduce((s, e) => s + e.income, 0);
          // 交通費のみの合計
          const jobTransport = jobEntries.reduce((s, e) => s + e.transport, 0);

          // 総時間を計算
          const totalHours = jobEntries.reduce((s, e) => s + e.hours, 0);
          const h = Math.floor(totalHours);
          const m = Math.round((totalHours - h) * 60);

          return (
            <div key={job.id} className="col-6">
              <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <div className="card-body p-3">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div style={{ width: 12, height: 12, borderRadius: '3px', background: job.color }}></div>
                    <span className="small fw-bold text-truncate">{job.name}</span>
                  </div>

                  <div className="h5 fw-bold mb-0">¥{(jobIncome + jobTransport).toLocaleString()}</div>

                  <div className="d-flex flex-column" style={{ fontSize: '10px' }}>
                    {jobIncome + jobTransport > 0 && (
                      <span className="text-muted">
                        収入(¥{jobIncome.toLocaleString()})＋交通費(¥{jobTransport.toLocaleString()})
                      </span>
                    )}
                    <span className="text-primary fw-bold">
                      {h}h {m > 0 ? `${m}m` : ''}
                    </span>
                    {/* 個別の交通費を表示 */}
                  </div>

                  <div className="text-muted mt-1" style={{ fontSize: '10px' }}>
                    <i className="bi bi-clock me-1"></i>{jobEntries.length}件
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 設定エディタ */}
      <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px' }}>
        <div className="card-body p-4">
          <div className="d-flex align-items-center gap-2 mb-4">
            <i className="bi bi-gear-fill text-primary"></i>
            <span className="fw-bold">バイト一覧</span>
          </div>

          {jobs.map(job => (
            <JobRow
              key={job.id}
              job={job}
              onUpdate={onUpdateJob}
              onRemove={onRemoveJob}
              canDelete={jobs.length > 1}
            />
          ))}

          <button
            className="btn btn-light btn-sm w-100 border fw-bold mt-2 py-2"
            onClick={onAddJob}
            style={{ borderRadius: '10px' }}
          >
            + バイト先を追加
          </button>
        </div>
      </div>
    </div>
  )
}