import React, { useState } from 'react';
import type { Job, Entry } from '../types';

type Props = {
  jobs: Job[];
  entries: Entry[];
  trash: Entry[];
  onAdd: (jobId: string, hours: number, transport: number, memo: string) => void;
  onUpdate: (id: number, jobId: string, hours: number, transport: number, memo: string) => void;
  onDelete: (id: number) => void;
  onClear: () => void;
  onDeleteSelected: (ids: number[]) => void; // App.tsx側で一括削除する関数を受け取る
};

export function InputPanel({ jobs, entries, onAdd, onClear, onUpdate, onDeleteSelected }: Props) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [jobId, setJobId] = useState('');
  const [h, setH] = useState('');
  const [m, setM] = useState('');
  const [transport, setTransport] = useState('');
  const [memo, setMemo] = useState('');

  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const blockInvalidChar = (e: React.KeyboardEvent) => {
    if (["-", "e", "E"].includes(e.key)) e.preventDefault();
  };

  // チェックボックスの切り替え
  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // 親の「編集開始」イベントを止める
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`${selectedIds.length}件の記録をゴミ箱に移動しますか？`)) {
      onDeleteSelected(selectedIds);
      setSelectedIds([]);
      setIsEditMode(false);
    }
  };

  const startEditing = (e: Entry) => {
    if (isEditMode) return;
    setEditingId(e.id);
    setJobId(e.jobId);
    setH(Math.floor(e.hours).toString());
    setM(Math.round((e.hours - Math.floor(e.hours)) * 60).toString());
    setTransport(e.transport.toString());
    setMemo(e.memo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = () => {
    if (!jobId || (!h && !m)) { alert('入力不足です'); return; }
    const totalHours = Number(h || 0) + (Number(m || 0) / 60);
    if (editingId) onUpdate(editingId, jobId, totalHours, Number(transport) || 0, memo);
    else onAdd(jobId, totalHours, Number(transport) || 0, memo);
    setEditingId(null); setJobId(''); setH(''); setM(''); setTransport(''); setMemo('');
  };

  return (
    <div className="animate__animated animate__fadeIn">
      {/* フォーム部分（変更なし） */}
      <div className={`card p-4 mb-4 shadow-sm border-0 ${editingId ? 'bg-light' : ''}`}>
        <div className="row g-3">
          <div className="col-12"><span className="fw-bold small text-secondary">バイト先</span>
            <select className="form-select" value={jobId} onChange={e => setJobId(e.target.value)}>
              <option value="">選択</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>
          <div className="col-12"><span className="fw-bold small text-secondary">時間</span>
            <div className="d-flex align-items-center gap-2">
              <input type="number" min="0" onKeyDown={blockInvalidChar} className="form-control text-center" style={{ width: 60 }} value={h} onChange={e => setH(e.target.value)} placeholder="0" />時
              <input type="number" min="0" max="59" onKeyDown={blockInvalidChar} className="form-control text-center" style={{ width: 60 }} value={m} onChange={e => setM(e.target.value)} placeholder="00" />分
            </div>
          </div>
          <div className="col-6"><span className="fw-bold small text-secondary">交通費</span>
            <input type="number" min="0" onKeyDown={blockInvalidChar} className="form-control" value={transport} onChange={e => setTransport(e.target.value)} />
          </div>
          <div className="col-6"><span className="fw-bold small text-secondary">メモ</span>
            <input type="text" className="form-control" value={memo} onChange={e => setMemo(e.target.value)} />
          </div>
          <button className={`btn w-100 py-2 fw-bold ${editingId ? 'btn-primary' : 'btn-dark'}`} onClick={handleSave}>{editingId ? '変更を保存' : '記録を保存'}</button>
          {editingId && <button className="btn btn-link text-secondary btn-sm" onClick={() => setEditingId(null)}>キャンセル</button>}
        </div>
      </div>

      {/* 履歴ヘッダー */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="fw-bold small text-secondary">履歴 ({entries.length})</span>
        <div className="d-flex gap-2">
          {!isEditMode && (
            <button className="btn btn-link btn-sm text-danger text-decoration-none fw-bold" onClick={() => onClear()}>一括削除</button>
          )}
        </div>
        <div className="d-flex gap-2">
          {isEditMode ? (
            <>
              <button
                className="btn btn-danger btn-sm fw-bold"
                onClick={handleBatchDelete}
                disabled={selectedIds.length === 0}
              >
                {selectedIds.length}件削除
              </button>
              <button className="btn btn-light btn-sm border" onClick={() => { setIsEditMode(false); setSelectedIds([]); }}>戻る</button>
            </>
          ) : (
            <button className="btn btn-outline-secondary btn-sm border-0" onClick={() => setIsEditMode(true)}>選択削除</button>
          )}
        </div>
      </div>

      {/* 履歴リスト */}
      <div className="d-flex flex-column gap-2">
        {entries.map(e => (
          <div
            key={e.id}
            className={`card border-0 shadow-sm ${selectedIds.includes(e.id) ? 'bg-light' : ''}`}
            onClick={() => isEditMode ? null : startEditing(e)}
            style={{ cursor: isEditMode ? 'default' : 'pointer' }}
          >
            <div className="card-body p-3 d-flex align-items-center gap-3">
              {isEditMode && (
                <input
                  type="checkbox"
                  className="form-check-input m-0"
                  checked={selectedIds.includes(e.id)}
                  onChange={() => { }} // onClick側で制御
                  onClick={(event) => toggleSelect(e.id, event)}
                />
              )}
              <div style={{ width: 4, height: 30, background: jobs.find(j => j.id === e.jobId)?.color || '#eee', borderRadius: 2 }} />
              <div className="flex-grow-1" onClick={(event) => isEditMode && toggleSelect(e.id, event)}>
                <div className="fw-bold small">{e.jobName}</div>
                <div className="text-muted small">{e.date} · ¥{e.income.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}