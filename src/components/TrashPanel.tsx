import type { Entry, Job } from '../types';

interface Props {
  trash: Entry[];
  jobs: Job[];
  archivedJobs: Job[];
  onRestore: (id: number) => void;
  onHardDelete: (id: number) => void;
  onRestoreJob: (id: string, restoreEntries: boolean) => void;
  onHardDeleteJob: (id: string) => void;
  onEmptyTrashEntries: () => void;
  onEmptyJobs: () => void;
}

export function TrashPanel({
  trash, jobs, archivedJobs, onRestore, onHardDelete,
  onRestoreJob, onHardDeleteJob, onEmptyTrashEntries, onEmptyJobs
}: Props) {
  return (
    <div className="animate__animated animate__fadeIn">
      <h2 className="h6 fw-bold mb-4 text-secondary">
        <i className="bi bi-trash3-fill me-2"></i>ゴミ箱
      </h2>

      <div className="d-flex flex-column gap-4">
        {/* バイト先セクション */}
        {archivedJobs.length > 0 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <span className="badge bg-secondary-subtle text-secondary fw-bold" style={{ fontSize: 10 }}>削除されたバイト先</span>
              <button className="btn btn-batch-delete fw-bold" onClick={onEmptyJobs}>バイト先をすべて消去</button>
            </div>
            {archivedJobs.map(j => (
              <div key={j.id} className="card border-0 shadow-sm mb-2">
                <div className="card-body p-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-3">
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: j.color }} />
                    <span className="fw-bold small">{j.name}</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    {/* 復元ギミック */}
                    <button className="restore-btn" title="復元" onClick={() => {
                      const res = confirm(`「${j.name}」を復元しますか？\n\n【OK】過去の記録もすべて戻す\n【キャンセル】バイト先設定のみ戻す`);
                      onRestoreJob(j.id, res);
                    }}>
                      <div className="restore-arrow"></div>
                    </button>
                    {/* ゴミ箱ギミック */}
                    <button className="trash-btn" title="完全削除" onClick={() => confirm(`「${j.name}」を完全に消去しますか？`) && onHardDeleteJob(j.id)}>
                      <div className="trash-lid"></div>
                      <div className="trash-box"></div>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 記録セクション */}
        {trash.length > 0 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2 px-1">
              <span className="badge bg-secondary-subtle text-secondary fw-bold" style={{ fontSize: 10 }}>削除された記録</span>
              <button className="btn btn-batch-delete fw-bold" onClick={onEmptyTrashEntries}>記録をすべて消去</button>
            </div>
            <div className="d-flex flex-column gap-2">
              {trash.map(e => (
                <div key={e.id} className="card border-0 shadow-sm">
                  <div className="card-body p-3 d-flex align-items-center gap-3">
                    <div style={{ width: 4, height: 35, background: jobs.find(j => j.id === e.jobId)?.color || '#eee', borderRadius: 2 }} />
                    <div className="flex-grow-1 min-w-0">
                      <div className="fw-bold small text-truncate">{e.jobName}</div>
                      <div className="text-muted" style={{ fontSize: 10 }}>{e.date} · ¥{e.income.toLocaleString()}</div>
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button className="restore-btn" title="復元" onClick={() => onRestore(e.id)}>
                        <div className="restore-arrow"></div>
                      </button>
                      <button className="trash-btn" title="完全削除" onClick={() => confirm("記録を完全に消去しますか？") && onHardDelete(e.id)}>
                        <div className="trash-lid"></div>
                        <div className="trash-box"></div>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}