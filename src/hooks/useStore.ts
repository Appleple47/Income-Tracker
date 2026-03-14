import { useState, useEffect, useCallback } from 'react'
import { getSupabaseWithUser, getUserId } from '../lib/supabase'
import type { AppState, Job, Entry } from '../types'

const JOB_COLORS = ['#0d6efd', '#198754', '#dc3545', '#fd7e14', '#6f42c1', '#0dcaf0', '#20c997', '#ffc107']
const DEFAULT_JOBS: Job[] = [
  { id: 'j1', name: 'バイト1', wage: 1200, color: '#0d6efd', position: 0 },
  { id: 'j2', name: 'バイト2', wage: 1050, color: '#198754', position: 1 },
]
const EMPTY_STATE: AppState = { jobs: [], entries: [], trash: [] }
function db() { return getSupabaseWithUser() }

// --- API Helpers ---
async function fetchJobs(): Promise<Job[]> {
  const { data } = await db().from('jobs').select('*').order('position');
  return data?.map((r: any) => ({ id: r.id, name: r.name, wage: r.wage, color: r.color, position: r.position })) || [];
}
async function fetchEntries(): Promise<{ active: Entry[]; trash: Entry[] }> {
  // created_at で降順に取得
  const { data } = await db().from('entries').select('*').order('created_at', { ascending: false });

  if (!data) return { active: [], trash: [] };

  const all: Entry[] = data.map((r: any) => ({
    id: Number(r.id), // 明示的に数値変換
    jobId: r.job_id,
    jobName: r.job_name,
    hours: Number(r.hours),
    wage: r.wage,
    income: r.income,
    transport: r.transport,
    memo: r.memo,
    date: r.date,
    deleted: r.deleted,
    deletedAt: r.deleted_at ?? undefined,
  }));

  return { active: all.filter(e => !e.deleted), trash: all.filter(e => e.deleted) };
}
async function upsertJobs(jobs: Job[]) {
  const uid = getUserId();
  await db().from('jobs').upsert(jobs.map(j => ({ id: j.id, user_id: uid, name: j.name, wage: j.wage, color: j.color, position: j.position })));
}
async function fetchDeletedJobs(): Promise<Job[]> {
  const { data } = await db().from('deleted_jobs').select('*').order('deleted_at', { ascending: false });
  return data?.map((r: any) => ({ id: r.id, name: r.name, wage: r.wage, color: r.color, position: r.position })) || [];
}
async function saveDeletedJob(job: Job) {
  const uid = getUserId();
  await db().from('deleted_jobs').upsert({ id: job.id, user_id: uid, name: job.name, wage: job.wage, color: job.color, position: job.position });
}
async function removeDeletedJob(jobId: string) {
  await db().from('deleted_jobs').delete().eq('id', jobId);
}

export function useStore() {
  const [state, setState] = useState<AppState>(EMPTY_STATE)
  const [loading, setLoading] = useState(true)
  const [deletedJobs, setDeletedJobs] = useState<Job[]>([])

  useEffect(() => {
    async function load() {
      setLoading(true);
      let jobs = await fetchJobs();
      if (jobs.length === 0) { await upsertJobs(DEFAULT_JOBS); jobs = DEFAULT_JOBS; }
      const { active, trash } = await fetchEntries();
      const dj = await fetchDeletedJobs();
      setState({ jobs, entries: active, trash });
      setDeletedJobs(dj);
      setLoading(false);
    }
    load();
  }, [])

  const addEntry = useCallback(async (jobId: string, hours: number, transport: number, memo: string) => {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const uid = getUserId();

    // 保存失敗を防ぐため、DBの型に厳密に合わせる
    const { data, error } = await db()
      .from('entries')
      .insert({
        user_id: uid,
        job_id: jobId,
        job_name: job.name,
        hours: hours, // numeric
        wage: job.wage, // integer
        income: Math.round(job.wage * hours), // integer
        transport: transport || 0, // integer
        memo: memo || '', // text
        date: new Date().toISOString().split('T')[0], // yyyy-mm-dd
        deleted: false
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase Error:", error);
      alert(`保存に失敗しました: ${error.message}`);
      return;
    }

    if (data) {
      // DBから返ってきた本物の ID を使って state を更新
      const entry: Entry = {
        id: data.id,
        jobId: data.job_id,
        jobName: data.job_name,
        hours: Number(data.hours),
        wage: data.wage,
        income: data.income,
        transport: data.transport,
        memo: data.memo,
        date: data.date,
        deleted: data.deleted
      };
      setState(prev => ({ ...prev, entries: [entry, ...prev.entries] }));
    }
  }, [state.jobs])

  const deleteEntry = useCallback(async (id: number) => {
    const now = new Date().toISOString();
    const entry = state.entries.find(e => e.id === id);
    if (!entry) return;
    await db().from('entries').update({ deleted: true, deleted_at: now }).eq('id', id);
    setState(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id), trash: [{ ...entry, deleted: true, deletedAt: now }, ...prev.trash] }));
  }, [state.entries])

  const restoreFromTrash = useCallback(async (id: number) => {
    const entry = state.trash.find(e => e.id === id);
    if (!entry) return;
    await db().from('entries').update({ deleted: false, deleted_at: null }).eq('id', id);
    setState(prev => ({ ...prev, entries: [{ ...entry, deleted: false, deletedAt: undefined }, ...prev.entries], trash: prev.trash.filter(e => e.id !== id) }));
  }, [state.trash])

  const hardDelete = useCallback(async (id: number) => {
    await db().from('entries').delete().eq('id', id);
    setState(prev => ({ ...prev, trash: prev.trash.filter(e => e.id !== id) }));
  }, [])

  const undoRemoveJob = useCallback(async (jobId: string, restoreEntries: boolean) => {
    const job = deletedJobs.find(j => j.id === jobId);
    if (!job) return;
    if (state.jobs.some(j => j.name === job.name)) { alert("同名のバイトがあるため復旧不可"); return; }

    await upsertJobs([job]);
    await removeDeletedJob(jobId);

    if (restoreEntries) {
      await db().from('entries').update({ job_id: job.id, job_name: job.name, deleted: false, deleted_at: null })
        .eq('job_id', '__deleted__').eq('job_name', job.name + '（削除済み）');
    }

    setState(prev => {
      let newEntries = [...prev.entries];
      let newTrash = [...prev.trash];
      if (restoreEntries) {
        const toRestore = prev.trash.filter(e => e.jobName === job.name + '（削除済み）');
        const restored = toRestore.map(e => ({ ...e, jobId: job.id, jobName: job.name, deleted: false, deletedAt: undefined }));
        newEntries = [...restored, ...newEntries].sort((a, b) => b.id - a.id);
        newTrash = prev.trash.filter(e => e.jobName !== job.name + '（削除済み）');
      }
      return { ...prev, jobs: [...prev.jobs, job].sort((a, b) => a.position - b.position), entries: newEntries, trash: newTrash };
    });
    setDeletedJobs(prev => prev.filter(j => j.id !== jobId));
  }, [deletedJobs, state.jobs, state.trash])

  const hardDeleteJob = useCallback(async (jobId: string) => {
    await removeDeletedJob(jobId);
    setDeletedJobs(prev => prev.filter(j => j.id !== jobId));
  }, [])

  const hardDeleteAllJobs = useCallback(async () => {
    if (!confirm("保管中のすべてのバイト先を完全に削除しますか？")) return;
    const uid = getUserId();
    await db().from('deleted_jobs').delete().eq('user_id', uid);
    setDeletedJobs([]);
  }, [])

  const emptyTrashEntries = useCallback(async () => {
    if (!confirm("ゴミ箱内のすべての記録を完全に削除しますか？")) return;
    const deletePromises = state.trash.map(e => db().from('entries').delete().eq('id', e.id));
    await Promise.all(deletePromises);
    setState(prev => ({ ...prev, trash: [] }));
  }, [state.trash])

  const archiveAllEntries = useCallback(async () => {
    if (!confirm("すべての履歴をゴミ箱に移動しますか？")) return;
    const now = new Date().toISOString();
    await db().from('entries').update({ deleted: true, deleted_at: now }).eq('deleted', false);
    setState(prev => ({ ...prev, trash: [...prev.entries.map(e => ({ ...e, deleted: true, deletedAt: now })), ...prev.trash], entries: [] }));
  }, [state.entries])

  const addJob = useCallback(async () => {
    const { data: active } = await db().from('jobs').select('name');
    const { data: deleted } = await db().from('deleted_jobs').select('name');
    const all = [...(active || []), ...(deleted || [])];
    let max = 0;
    all.forEach(r => { const m = String(r.name).match(/(\d+)$/); if (m) max = Math.max(max, parseInt(m[1])); });
    const newName = `バイト${max + 1}`;
    const newJob: Job = { id: `j_${Date.now()}`, name: newName, wage: 1000, color: JOB_COLORS[state.jobs.length % JOB_COLORS.length], position: state.jobs.length };
    await upsertJobs([newJob]);
    setState(prev => ({ ...prev, jobs: [...prev.jobs, newJob] }));
  }, [state.jobs.length])

  const removeJob = useCallback(async (jobId: string) => {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;
    await db().from('jobs').delete().eq('id', jobId);
    await saveDeletedJob(job);
    setState(prev => ({
      ...prev,
      jobs: prev.jobs.filter(j => j.id !== jobId),
      entries: prev.entries.map(e => e.jobId === jobId ? { ...e, jobId: '__deleted__', jobName: e.jobName + '（削除済み）' } : e),
      trash: prev.trash.map(e => e.jobId === jobId ? { ...e, jobId: '__deleted__', jobName: e.jobName + '（削除済み）' } : e)
    }));
    setDeletedJobs(prev => [job, ...prev]);
  }, [state.jobs])

  const updateJob = useCallback(async (jobId: string, name: string, wage: number, color?: string) => {
    const isDup = state.jobs.some(j => j.id !== jobId && j.name === name) || deletedJobs.some(j => j.name === name);
    if (isDup) { alert("名前が重複しています"); return; }
    const updated = state.jobs.map(j => j.id === jobId ? { ...j, name, wage, ...(color ? { color } : {}) } : j);
    await upsertJobs(updated);
    setState(prev => ({ ...prev, jobs: updated }));
  }, [state.jobs, deletedJobs])
  const updateEntry = useCallback(async (id: number, jobId: string, hours: number, transport: number, memo: string) => {
    const job = state.jobs.find(j => j.id === jobId);
    if (!job) return;

    const income = Math.round(job.wage * hours);
    // DB更新
    const { error } = await db()
      .from('entries')
      .update({
        job_id: jobId,
        job_name: job.name,
        hours,
        income,
        transport,
        memo
      })
      .eq('id', id);

    if (error) {
      alert("更新に失敗しました");
    } else {
      // State更新
      setState(prev => ({
        ...prev,
        entries: prev.entries.map(e => e.id === id ? {
          ...e, jobId, jobName: job.name, hours, income, transport, memo
        } : e)
      }));
    }
  }, [state.jobs]);
  return {
    state, loading, deletedJobs, addEntry, deleteEntry, archiveAllEntries, restoreFromTrash, hardDelete,
    emptyTrashEntries, addJob, removeJob, hardDeleteJob, hardDeleteAllJobs, undoRemoveJob, updateJob, JOB_COLORS, updateEntry
  }
}