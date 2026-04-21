'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function VendorField() {
  const searchParams = useSearchParams();
  const teamsParam = searchParams.get('teams') || searchParams.get('team') || '';
  const teamIds = teamsParam.split(',').filter(Boolean);

  const [tasks, setTasks] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [updates, setUpdates] = useState<Record<string, { progress: number; note: string; status: string; showSlider: boolean }>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const holdTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    async function loadTasks() {
      const { data: shutdownData } = await supabase
        .from('shutdowns')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let allTasks: any[] = [];

      if (shutdownData) {
        const { data: supabaseTasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('shutdown_id', shutdownData.id);
        if (supabaseTasks) allTasks = supabaseTasks;
      } else {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) allTasks = JSON.parse(storedTasks);
      }

      const filtered = allTasks.filter((t: any) =>
        teamIds.some(id => {
          const teamName = id.replace(/-/g, ' ').toLowerCase();
          return t.team && t.team.toLowerCase().includes(teamName.split(' ').slice(0, 2).join(' '));
        })
      );

      setTasks(filtered);

      const initialUpdates: Record<string, any> = {};
      filtered.forEach((t: any) => {
        initialUpdates[t.id] = { progress: t.progress || 0, note: '', status: t.status || 'PENDING', showSlider: false };
        if (t.ops) {
          t.ops.forEach((op: any, i: number) => {
            initialUpdates[`${t.id}-op-${i}`] = { progress: op.progress || 0, note: '', status: op.status || 'PENDING', showSlider: false };
          });
        }
      });
      setUpdates(initialUpdates);
      setLoading(false);
    }

    loadTasks();
  }, []);

  function calculateOnTrackProgress(start: string, end: string): number {
    try {
      const parseDate = (str: string) => {
        const parts = str.split(/[/ :]/).map(Number);
        return new Date(parts[2], parts[1] - 1, parts[0], parts[3] || 0, parts[4] || 0);
      };
      const startDate = parseDate(start);
      const endDate = parseDate(end);
      const now = new Date();
      const total = endDate.getTime() - startDate.getTime();
      const elapsed = now.getTime() - startDate.getTime();
      const pct = Math.round((elapsed / total) * 100);
      return Math.min(100, Math.max(0, pct));
    } catch {
      return 0;
    }
  }

  function handleOnTrackPress(key: string, start: string, end: string) {
    holdTimers.current[key] = setTimeout(() => {
      setUpdates(prev => ({ ...prev, [key]: { ...prev[key], showSlider: true, status: 'IN PROGRESS' } }));
    }, 500);
  }

  function handleOnTrackRelease(key: string, start: string, end: string) {
    if (holdTimers.current[key]) {
      clearTimeout(holdTimers.current[key]);
      delete holdTimers.current[key];
    }
    setUpdates(prev => {
      if (prev[key]?.showSlider) return prev;
      const pct = calculateOnTrackProgress(start, end);
      return { ...prev, [key]: { ...prev[key], progress: pct, status: 'IN PROGRESS', showSlider: false } };
    });
  }

  function toggleExpand(id: string) {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function submitWO(taskId: string) {
    const update = updates[taskId];
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newProgress = update.progress;
    const newStatus = update.status === 'DELAYED' ? 'DELAYED' : newProgress === 100 ? 'COMPLETE' : newProgress > 0 ? 'IN PROGRESS' : 'PENDING';

    await supabase
      .from('tasks')
      .update({ progress: newProgress, status: newStatus })
      .eq('id', taskId)
      .eq('shutdown_id', task.shutdown_id);

    setSubmitted(prev => ({ ...prev, [taskId]: true }));
    setTimeout(() => setSubmitted(prev => ({ ...prev, [taskId]: false })), 3000);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080C0F; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        textarea::placeholder { color: #2E4050; font-family: 'DM Mono', monospace; font-size: 11px; }
        textarea { resize: none; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #1E2A35; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%; background: #2ECC9A; cursor: pointer; box-shadow: 0 0 8px rgba(46,204,154,0.4); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080C0F', fontFamily: "'DM Mono', monospace", color: '#E8EDF2', paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ background: '#0E1419', borderBottom: '1px solid #1E2A35', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, border: '1.5px solid #2ECC9A', borderRadius: 4, display: 'grid', placeItems: 'center', background: 'rgba(46,204,154,0.1)' }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#2ECC9A" strokeWidth="1.5">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"/>
                <circle cx="8" cy="8" r="2" fill="#2ECC9A" stroke="none"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>Sentient</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2ECC9A' }}>Field Supervision</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: '#E8EDF2' }}>{timeStr}</div>
            <div style={{ fontSize: 9, color: '#2E4050', letterSpacing: '0.1em' }}>{dateStr}</div>
          </div>
        </div>

        {/* Filter bar */}
<div style={{ padding: '12px 16px', display: 'flex', gap: 8, borderBottom: '1px solid #1E2A35', background: '#0E1419' }}>
  {[
    { label: 'All', value: 'ALL' },
    { label: 'In Progress', value: 'IN PROGRESS' },
    { label: 'Not Started', value: 'PENDING' },
    { label: 'Complete', value: 'COMPLETE' },
  ].map(f => (
    <button
      key={f.value}
      onClick={() => setFilter(f.value)}
      style={{ flex: 1, padding: '7px 4px', border: `1px solid ${filter === f.value ? '#2ECC9A' : '#1E2A35'}`, borderRadius: 6, background: filter === f.value ? 'rgba(46,204,154,0.1)' : 'transparent', color: filter === f.value ? '#2ECC9A' : '#2E4050', fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
      {f.label}
    </button>
  ))}
</div>

{/* Content */}
<div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: '#2E4050', fontSize: 11 }}>Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, opacity: 0.4 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2E4050" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: '#2E4050', letterSpacing: '0.1em', textAlign: 'center' }}>No tasks assigned to your team</div>
            </div>
          ) : (
            tasks.filter((task: any) => filter === 'ALL' || task.status === filter).map((task: any) => {
              const woKey = task.id;
              const woUpdate = updates[woKey] || { progress: task.progress || 0, note: '', status: task.status || 'PENDING', showSlider: false };
              const isExpanded = expanded.includes(woKey);
              const isSubmitted = submitted[woKey];
              const progress = woUpdate.progress;
              const progressColor = woUpdate.status === 'DELAYED' ? '#E05A5A' : progress === 100 ? '#2ECC9A' : progress > 0 ? '#4A9EE0' : '#5A7080';
              const hasOps = task.ops && task.ops.length > 0;

              return (
                <div key={task.id} style={{ background: '#0E1419', border: `1px solid ${isSubmitted ? '#2ECC9A' : '#1E2A35'}`, borderRadius: 12, overflow: 'hidden', animation: 'fadeIn 0.3s ease', transition: 'border-color 0.3s' }}>

                  {/* WO Header */}
                  <div onClick={() => toggleExpand(woKey)} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2ECC9A', background: 'rgba(46,204,154,0.1)', border: '1px solid rgba(46,204,154,0.2)', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>{task.wo}</span>
                        <span style={{ fontSize: 9, color: '#2E4050', whiteSpace: 'nowrap' }}>{task.team}</span>
                      </div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800, color: '#E8EDF2', lineHeight: 1.3 }}>{task.name}</div>
                      {hasOps && (
                        <div style={{ fontSize: 9, color: '#2E4050', marginTop: 4 }}>{task.ops.length} operation{task.ops.length > 1 ? 's' : ''}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: progressColor }}>{progress}%</div>
                        <div style={{ fontSize: 8, color: '#2E4050' }}>{task.start}</div>
                        <div style={{ fontSize: 8, color: '#2E4050' }}>→ {task.end}</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2E4050" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid #1E2A35' }}>

                      {/* Op Lines */}
                      {hasOps && (
                        <div style={{ borderBottom: '1px solid #1E2A35' }}>
                          {task.ops.map((op: any, oi: number) => {
                            const opKey = `${task.id}-op-${oi}`;
                            const opUpdate = updates[opKey] || { progress: op.progress || 0, note: '', status: 'PENDING', showSlider: false };
                            const opProgress = opUpdate.progress;
                            const opColor = opUpdate.status === 'DELAYED' ? '#E05A5A' : opProgress === 100 ? '#2ECC9A' : opProgress > 0 ? '#4A9EE0' : '#5A7080';

                            return (
                              <div key={opKey} style={{ padding: '12px 16px', borderBottom: oi < task.ops.length - 1 ? '1px solid #141B22' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2E4050', background: '#141B22', border: '1px solid #1E2A35', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>OP {op.op}</span>
                                      {op.crew && op.crew !== task.team && (
                                        <span style={{ fontSize: 9, color: '#2E4050' }}>{op.crew}</span>
                                      )}
                                    </div>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 600, color: '#5A7080' }}>{op.name}</div>
                                  </div>
                                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: opColor, marginLeft: 12 }}>{opProgress}%</span>
                                </div>

                                {/* Manual slider — shows on hold */}
                                {opUpdate.showSlider && (
                                  <div style={{ marginBottom: 12, padding: '10px 0' }}>
                                    <input
                                      type="range" min={0} max={100} step={5} value={opProgress}
                                      onChange={e => setUpdates(prev => ({ ...prev, [opKey]: { ...prev[opKey], progress: Number(e.target.value) } }))}
                                      style={{ accentColor: '#2ECC9A' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                      <span style={{ fontSize: 8, color: '#2E4050' }}>0%</span>
                                      <span style={{ fontSize: 8, color: '#2ECC9A', fontWeight: 700 }}>{opProgress}%</span>
                                      <span style={{ fontSize: 8, color: '#2E4050' }}>100%</span>
                                    </div>
                                  </div>
                                )}

                                {/* Status buttons */}
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button
                                    onTouchStart={() => handleOnTrackPress(opKey, op.start, op.end)}
                                    onTouchEnd={() => handleOnTrackRelease(opKey, op.start, op.end)}
                                    onMouseDown={() => handleOnTrackPress(opKey, op.start, op.end)}
                                    onMouseUp={() => handleOnTrackRelease(opKey, op.start, op.end)}
                                    style={{ flex: 1, padding: '8px 4px', background: opUpdate.status === 'IN PROGRESS' ? 'rgba(74,158,224,0.15)' : 'transparent', border: `1px solid ${opUpdate.status === 'IN PROGRESS' ? '#4A9EE0' : '#1E2A35'}`, borderRadius: 6, color: opUpdate.status === 'IN PROGRESS' ? '#4A9EE0' : '#2E4050', fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                                    On Track
                                  </button>
                                  <button
                                    onClick={() => setUpdates(prev => ({ ...prev, [opKey]: { ...prev[opKey], status: 'DELAYED', showSlider: false } }))}
                                    style={{ flex: 1, padding: '8px 4px', background: opUpdate.status === 'DELAYED' ? 'rgba(224,90,90,0.15)' : 'transparent', border: `1px solid ${opUpdate.status === 'DELAYED' ? '#E05A5A' : '#1E2A35'}`, borderRadius: 6, color: opUpdate.status === 'DELAYED' ? '#E05A5A' : '#2E4050', fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                                    Delay
                                  </button>
                                  <button
                                    onClick={() => setUpdates(prev => ({ ...prev, [opKey]: { ...prev[opKey], progress: opProgress === 100 ? 0 : 100, status: opProgress === 100 ? 'PENDING' : 'COMPLETE', showSlider: false } }))}
                                    style={{ flex: 1, padding: '8px 4px', background: opUpdate.status === 'COMPLETE' || opProgress === 100 ? 'rgba(46,204,154,0.15)' : 'transparent', border: `1px solid ${opUpdate.status === 'COMPLETE' || opProgress === 100 ? '#2ECC9A' : '#1E2A35'}`, borderRadius: 6, color: opUpdate.status === 'COMPLETE' || opProgress === 100 ? '#2ECC9A' : '#2E4050', fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                                    Complete
                                  </button>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Note */}
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E2A35' }}>
                        <textarea
                          rows={2}
                          placeholder="Add a note — delays, issues, anything relevant..."
                          value={woUpdate.note}
                          onChange={e => setUpdates(prev => ({ ...prev, [woKey]: { ...prev[woKey], note: e.target.value } }))}
                          style={{ width: '100%', background: '#141B22', border: '1px solid #1E2A35', borderRadius: 8, padding: '10px 12px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#E8EDF2', outline: 'none', lineHeight: 1.5 }}
                        />
                      </div>

                      {/* Submit */}
                      <div style={{ padding: '12px 16px' }}>
                        <button
                          onClick={() => submitWO(woKey)}
                          style={{ width: '100%', padding: '14px', background: isSubmitted ? 'rgba(46,204,154,0.15)' : '#2ECC9A', border: isSubmitted ? '1px solid #2ECC9A' : 'none', borderRadius: 10, color: isSubmitted ? '#2ECC9A' : '#040D0A', fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}>
                          {isSubmitted ? '✓ Update Submitted' : 'Submit Update'}
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export default function VendorPage() {
  return (
    <Suspense fallback={<div style={{ background: '#080C0F', minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#2ECC9A', fontFamily: 'DM Mono, monospace', fontSize: 12 }}>Loading...</div>}>
      <VendorField />
    </Suspense>
  );
}