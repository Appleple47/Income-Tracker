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
  onDeleteSelected: (ids: number[]) => void;
};

export function InputPanel({ jobs, entries, trash, onAdd, onClear, onUpdate, onDeleteSelected }: Props) {
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

  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
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

    // ここで親(App.tsx)の関数を呼ぶだけ！
    if (editingId) {
      onUpdate(editingId, jobId, totalHours, Number(transport) || 0, memo);
    } else {
      onAdd(jobId, totalHours, Number(transport) || 0, memo);
    }

    setEditingId(null); setJobId(''); setH(''); setM(''); setTransport(''); setMemo('');
  };

  return (
    <div className="animate__animated animate__fadeIn">
      {/* 入力フォーム部分 */}
      <div className={`card p-4 mb-4 shadow-sm border-0 ${editingId ? 'bg-light' : ''}`}>
        <div className="row g-3">
          <div className="col-12"><span className="fw-bold small text-secondary">バイト先</span>
            <select className="form-select" value={jobId} onChange={e => setJobId(e.target.value)}>
              <option value="">選択</option>
              {jobs.map(j => <option key={j.id} value={j.id}>{j.name}</option>)}
            </select>
          </div>
          <div className="col-12"><span className="fw-bold small text-secondary">時間</span>
            <div className="d-flex align-items-center gap-2">
              <input type="number" min="0" onKeyDown={blockInvalidChar} className="form-control text-center" style={{ width: 60 }} value={h} onChange={e => setH(e.target.value)} placeholder="0" />時
              <input
                type="number"
                min="0"
                max="59"
                onKeyDown={blockInvalidChar}
                className="form-control text-center"
                style={{ width: 60 }}
                value={m}
                onChange={e => {
                  const val = e.target.value;
                  // 空文字（バックスペースで消した時）は許可し、
                  // 数字が入った場合は 0〜59 の範囲に収める
                  if (val === '') {
                    setM('');
                  } else {
                    const num = parseInt(val, 10);
                    if (num > 59) setM('59');
                    else if (num < 0) setM('0');
                    else setM(num.toString());
                  }
                }}
                placeholder="00"
              />分
            </div>
          </div>
          <div className="col-12">
            <span className="fw-bold small text-secondary">交通費</span>
            <div className="input-group">
              <span className="input-group-text">¥</span>
              <input type="number" min="0" onKeyDown={blockInvalidChar} className="form-control" value={transport} onChange={e => setTransport(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div className="col-12">
            <span className="fw-bold small text-secondary">メモ</span>
            <textarea className="form-control" rows={2} value={memo} onChange={e => setMemo(e.target.value)} placeholder="勤務日、勤務内容..." />
          </div>
          <button className={`btn w-100 py-2 fw-bold ${editingId ? 'btn-primary' : 'btn-dark'}`} onClick={handleSave}>{editingId ? '変更を保存' : '記録を保存'}</button>
          {editingId && <button className="btn btn-link text-secondary btn-sm" onClick={() => setEditingId(null)}>キャンセル</button>}
        </div>
      </div>

      {/* 履歴部分 */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <span className="fw-bold small text-secondary">履歴 ({entries.length})</span>
        <div className="d-flex gap-2">
          {isEditMode ? (
            <>
              <button className="btn btn-danger btn-sm fw-bold" onClick={handleBatchDelete} disabled={selectedIds.length === 0}>{selectedIds.length}件削除</button>
              <button className="btn btn-light btn-sm border" onClick={() => { setIsEditMode(false); setSelectedIds([]); }}>戻る</button>
            </>
          ) : (
            <>
              <button className="btn btn-link btn-sm text-danger text-decoration-none fw-bold" onClick={() => onClear()}>一括削除</button>
              <button className="btn btn-outline-secondary btn-sm border-0" onClick={() => setIsEditMode(true)}>選択削除</button>
            </>
          )}
        </div>
      </div>

      <div className="d-flex flex-column gap-2">
        {entries.map(e => (
          <div key={e.id} className={`card border-0 shadow-sm ${selectedIds.includes(e.id) ? 'bg-light' : ''}`} onClick={() => isEditMode ? null : startEditing(e)} style={{ cursor: isEditMode ? 'default' : 'pointer' }}>
            <div className="card-body p-3 d-flex align-items-center gap-3" style={{ minWidth: 0 }}>
              {isEditMode && <input type="checkbox" className="form-check-input m-0" checked={selectedIds.includes(e.id)} onChange={() => { }} onClick={(event) => toggleSelect(e.id, event)} />}
              <div style={{ width: 4, alignSelf: 'stretch', background: jobs.find(j => j.id === e.jobId)?.color || '#dee2e6', borderRadius: 2, flexShrink: 0 }} />
              <div className="flex-grow-1" style={{ minWidth: 0 }} onClick={(event) => isEditMode && toggleSelect(e.id, event)}>
                <div className="d-flex justify-content-between align-items-start">
                  <div className="fw-bold small text-truncate">{e.jobName}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{e.date}</div>
                </div>
                <div className="fw-bold my-1">¥{(e.income + e.transport).toLocaleString()}<span className="text-muted fw-normal ms-2" style={{ fontSize: '0.7rem' }}>(内訳: 収入¥{e.income.toLocaleString()} + 交通¥{e.transport.toLocaleString()})</span></div>
                {e.memo && <div className="text-muted small text-truncate"><i className="bi bi-chat-left-text me-1"></i>{e.memo}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}