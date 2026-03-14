import { useState, useCallback } from 'react'
import { useStore } from './hooks/useStore'
import { InputPanel } from './components/InputPanel'
import { SummaryPanel } from './components/SummaryPanel'
import { TrashPanel } from './components/TrashPanel'
import { Toast } from './components/Toast'
import { UserIdPanel } from './components/UserIdPanel'

type Tab = 'input' | 'summary' | 'trash'
type ToastType = 'success' | 'undo' | null

export default function App() {
  const [tab, setTab] = useState<Tab>('input')
  const [toast, setToast] = useState<{ message: string; type: ToastType; onUndo?: () => void }>({
    message: '',
    type: null
  })

  const {
    state, loading, deletedJobs, addEntry, deleteEntry, restoreFromTrash,
    hardDelete, emptyTrashEntries, archiveAllEntries, addJob, removeJob,
    undoRemoveJob, updateJob, hardDeleteJob, hardDeleteAllJobs
  } = useStore()

  const showToast = useCallback((message: string, type: ToastType = 'success', onUndo?: () => void) => {
    setToast({ message, type, onUndo })
  }, [])

  const dismissToast = useCallback(() => setToast(p => ({ ...p, type: null })), [])

  function handleAddEntry(jobId: string, hours: number, transport: number, memo: string) {
    addEntry(jobId, hours, transport, memo)
    const income = Math.round((state.jobs.find(j => j.id === jobId)?.wage ?? 0) * hours)
    showToast(`追加しました ¥${(income + transport).toLocaleString()}`)
  }

  function handleDeleteEntry(id: number) {
    deleteEntry(id)
    showToast('ゴミ箱に移動しました')
  }

  async function handleRemoveJob(jobId: string) {
    const jobName = state.jobs.find(j => j.id === jobId)?.name ?? ''
    await removeJob(jobId)
    showToast(`${jobName} を削除しました`)
  }

  function handleUpdateJob(jobId: string, name: string, wage: number, color?: string) {
    updateJob(jobId, name, wage, color)
    showToast('保存しました')
  }

  return (
    <div className="min-vh-100 pb-5" style={{ background: '#f8f9fa' }}>
      <style>{`
        body { 
          background-color: #f0f2f5 !important; 
          color: #1a1d23;
          -webkit-font-smoothing: antialiased;
        }
        .card { 
          border-radius: 12px !important; 
          transition: background-color 0.2s ease !important;
        }

        .btn-submit-record {
          background: #2b3648;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px;
          font-weight: bold;
          letter-spacing: 0.05rem;
          width: 100%;
          transition: all 0.2s;
        }
        .btn-submit-record:hover {
          background: #1a202c;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .form-check-input:checked {
          background-color: #2b3648;
          border-color: #2b3648;
        }

        /* ギミック付きゴミ箱 */
        .trash-btn {
          --bin-color: #adb5bd; 
          --bin-hover-color: #e03131;
          position: relative; width: 32px; height: 32px; border: none; background: transparent;
          cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 0; transition: all 0.2s ease;
        }
        .trash-lid {
          width: 14px; height: 2px; background-color: var(--bin-color); position: relative;
          border-radius: 1px; transform-origin: left bottom; transition: all 0.2s ease; margin-bottom: 1px;
        }
        .trash-lid::before {
          content: ""; position: absolute; top: -2px; left: 50%; transform: translateX(-50%);
          width: 5px; height: 2px; background-color: var(--bin-color); border-radius: 1px 1px 0 0;
        }
        .trash-box {
          width: 12px; height: 14px; border: 2px solid var(--bin-color); border-top: none;
          border-radius: 0 0 3px 3px; position: relative; transition: all 0.2s ease;
        }
        .trash-btn:hover .trash-lid { --bin-color: var(--bin-hover-color); transform: translateY(-2px) rotate(-15deg); }
        .trash-btn:hover .trash-box { --bin-color: var(--bin-hover-color); }
        .trash-btn:active .trash-lid { transform: translateY(-5px) rotate(-45deg); }
        .trash-btn:active .trash-box { animation: bin-shake 0.1s infinite; }
        @keyframes bin-shake { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(1px); } }

        .nav-custom { background: #eee; padding: 4px; border-radius: 12px; display: flex; gap: 4px; }
        .nav-custom button { 
          flex: 1; border: none; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 14px;
          background: transparent; color: #888; transition: 0.2s;
        }
        .nav-custom button.active { background: #fff; color: #2b3648; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }






        /* 一括削除ボタンのホバー（ふわっと赤くなる） */
  .btn-batch-delete {
    color: #adb5bd;
    transition: all 0.2s;
    font-size: 10px;
    text-decoration: none;
  }
  .btn-batch-delete:hover {
    color: #e03131 !important;
    transform: translateY(-1px);
  }

  /* 復元ボタンのギミック (Restore Animation) */
  .restore-btn {
    --res-color: #adb5bd;
    --res-hover-color: #4dabf7;
    position: relative; width: 32px; height: 32px; border: none; background: transparent;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    padding: 0; transition: all 0.2s ease;
  }
  .restore-arrow {
    width: 16px; height: 16px;
    border: 2px solid var(--res-color);
    border-radius: 50%;
    border-top-color: transparent;
    position: relative;
    transition: all 0.3s ease;
  }
  .restore-arrow::before {
    content: ""; position: absolute; top: -1px; left: -1px;
    border-style: solid; border-width: 4px 0 4px 6px;
    border-color: transparent transparent transparent var(--res-color);
    transform: rotate(-45deg);
  }
  .restore-btn:hover .restore-arrow {
    --res-color: var(--res-hover-color);
    transform: rotate(-360deg);
  }
  .restore-btn:active .restore-arrow {
    transform: scale(1.2) rotate(-360deg);
  }
  
  /* 入力フォームの微調整 */
  .instant-input {
    border: 1px solid transparent;
    background: transparent;
    padding: 2px 5px;
    border-radius: 4px;
    transition: all 0.2s;
  }
  .instant-input:hover, .instant-input:focus {
    background: #fff;
    border-color: #eee;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
  }
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`}</style>

      <div className="container py-4" style={{ maxWidth: 480 }}>
        <h1 className="h5 fw-bold mb-4 px-2">収入管理</h1>

        <div className="nav-custom mb-4">
          <button className={tab === 'input' ? 'active' : ''} onClick={() => setTab('input')}>入力</button>
          <button className={tab === 'summary' ? 'active' : ''} onClick={() => setTab('summary')}>集計</button>
          <button className={tab === 'trash' ? 'active' : ''} onClick={() => setTab('trash')}>
            ゴミ箱 {state.trash.length + deletedJobs.length > 0 && `(${state.trash.length + deletedJobs.length})`}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5 text-muted small">読み込み中...</div>
        ) : (
          <div className="fade-in">
            {tab === 'input' && (
              // <InputPanel
              //   jobs={state.jobs}
              //   entries={state.entries}
              //   trash={state.trash}
              //   onAdd={handleAddEntry}
              //   onUpdate={() => { }} // Store側に updateEntry があればここに入れる
              //   onDelete={handleDeleteEntry}
              //   onClear={archiveAllEntries}
              // />
              <InputPanel
                jobs={state.jobs}
                entries={state.entries}
                trash={state.trash}
                onAdd={handleAddEntry}
                onUpdate={() => { }}
                onDelete={handleDeleteEntry}
                onClear={archiveAllEntries}
                onDeleteSelected={(ids) => {
                  ids.forEach(id => deleteEntry(id));
                  showToast(`${ids.length}件をゴミ箱に移動しました`);
                }}
              />
            )}
            {tab === 'summary' && (
              <>
                <SummaryPanel
                  jobs={state.jobs}
                  entries={state.entries}
                  onAddJob={addJob}
                  onRemoveJob={handleRemoveJob}
                  onUpdateJob={handleUpdateJob}
                  deletedJobs={deletedJobs}
                  onRestoreJob={(id) => undoRemoveJob(id, confirm("記録も復元しますか？"))}
                />
                <UserIdPanel onChanged={() => window.location.reload()} />
              </>
            )}
            {tab === 'trash' && (
              <TrashPanel
                trash={state.trash}
                jobs={state.jobs}
                archivedJobs={deletedJobs}
                onRestore={restoreFromTrash}
                onHardDelete={hardDelete}
                onRestoreJob={undoRemoveJob}
                onHardDeleteJob={hardDeleteJob}
                onEmptyTrashEntries={emptyTrashEntries}
                onEmptyJobs={hardDeleteAllJobs}
              />
            )}
          </div>
        )}
      </div>
      <Toast message={toast.message} type={toast.type} onUndo={toast.onUndo} onDismiss={dismissToast} />
    </div>
  )
}