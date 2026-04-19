'use client';
import { supabase } from '../../lib/supabase';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function VendorField() {
  const searchParams = useSearchParams();
  const teamsParam = searchParams.get('teams') || searchParams.get('team') || '';
  const teamIds = teamsParam.split(',').filter(Boolean);

  const [tasks, setTasks] = useState<any[]>([]);
  const [updates, setUpdates] = useState<Record<string, { progress: number; note: string; submitted: boolean }>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadTasks() {
      // Try Supabase first
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
        // Fall back to localStorage
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
        initialUpdates[t.id] = { progress: t.progress || 0, note: '' };
        if (t.ops) {
          t.ops.forEach((op: any, i: number) => {
            initialUpdates[`${t.id}-op-${i}`] = { progress: op.progress || 0, note: '' };
          });
        }
      });
      setUpdates(initialUpdates);
    }

    loadTasks();
  }, []);

  async function submitWO(taskId: string) {
    const update = updates[taskId];
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newProgress = update.progress;
    const newStatus = newProgress === 100 ? 'COMPLETE' : newProgress > 0 ? 'IN PROGRESS' : 'PENDING';

    await supabase
      .from('tasks')
      .update({ progress: newProgress, status: newStatus })
      .eq('id', taskId)
      .eq('shutdown_id', task.shutdown_id);

    setSubmitted(prev => ({ ...prev, [taskId]: true }));
    setTimeout(() => {
      setSubmitted(prev => ({ ...prev, [taskId]: false }));
    }, 3000);
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
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: #1E2A35; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: #2ECC9A; cursor: pointer; box-shadow: 0 0 8px rgba(46,204,154,0.4); }
        textarea::placeholder { color: #2E4050; font-family: 'DM Mono', monospace; font-size: 11px; }
        textarea { resize: none; }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#080C0F', fontFamily: "'DM Mono', monospace", color: '#E8EDF2', paddingBottom: 40 }}>

        {/* Header */}
        <div style={{ background: '#0E1419', borderBottom: '1px solid #1E2A35', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, border: '1.5px solid #2ECC9A', borderRadius: 4, display: 'grid', placeItems: 'center', background: 'rgba(46,204,154,0.1)' }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#2ECC9A" strokeWidth="1.5">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"/>
                <circle cx="8" cy="8" r="2" fill="#2ECC9A" stroke="none"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>Sentient</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2ECC9A' }}>Field View</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: '#E8EDF2' }}>{timeStr}</div>
            <div style={{ fontSize: 9, color: '#2E4050', letterSpacing: '0.1em' }}>{dateStr}</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {tasks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, opacity: 0.4 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2E4050" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: '#2E4050', letterSpacing: '0.1em', textAlign: 'center' }}>No tasks assigned to your team</div>
            </div>
          ) : (
            tasks.map((task: any) => {
              const woKey = task.id;
              const woUpdate = updates[woKey] || { progress: task.progress || 0, note: '' };
              const isSubmitted = submitted[woKey];
              const progress = woUpdate.progress;
              const progressColor = progress === 100 ? '#2ECC9A' : progress > 0 ? '#4A9EE0' : '#5A7080';

              return (
                <div key={task.id} style={{ background: '#0E1419', border: `1px solid ${isSubmitted ? '#2ECC9A' : '#1E2A35'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.3s', animation: 'fadeIn 0.3s ease' }}>

                  {/* WO Header */}
                  <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #1E2A35' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#2ECC9A', marginBottom: 4 }}>{task.wo}</div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: '#E8EDF2', lineHeight: 1.3 }}>{task.name}</div>
                        <div style={{ fontSize: 9, color: '#2E4050', marginTop: 4 }}>{task.team}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: '#2E4050' }}>Due</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#5A7080' }}>{task.end}</div>
                      </div>
                    </div>
                  </div>

                  {/* Op Lines */}
                  {task.ops && task.ops.length > 0 && (
                    <div style={{ borderBottom: '1px solid #1E2A35' }}>
                      {task.ops.map((op: any, oi: number) => {
                        const opKey = `${task.id}-op-${oi}`;
                        const opUpdate = updates[opKey] || { progress: op.progress || 0, note: '' };
                        const opProgress = opUpdate.progress;
                        const opColor = opProgress === 100 ? '#2ECC9A' : opProgress > 0 ? '#4A9EE0' : '#5A7080';

                        return (
                          <div key={opKey} style={{ padding: '12px 16px', borderBottom: oi < task.ops.length - 1 ? '1px solid #141B22' : 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                              <div>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2E4050', background: '#141B22', border: '1px solid #1E2A35', borderRadius: 4, padding: '2px 6px', marginRight: 8 }}>OP {op.op}</span>
                                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 600, color: '#5A7080' }}>{op.name}</span>
                              </div>
                              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 800, color: opColor }}>{opProgress}%</span>
                            </div>

                            {/* Op progress slider */}
                            <div style={{ marginBottom: 8 }}>
                              <input
                                type="range"
                                min={0}
                                max={100}
                                step={5}
                                value={opProgress}
                                onChange={e => setUpdates(prev => ({
                                  ...prev,
                                  [opKey]: { ...prev[opKey], progress: Number(e.target.value) }
                                }))}
                                style={{ accentColor: opColor }}
                              />
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                                <span style={{ fontSize: 8, color: '#2E4050' }}>0%</span>
                                <span style={{ fontSize: 8, color: '#2E4050' }}>50%</span>
                                <span style={{ fontSize: 8, color: '#2E4050' }}>100%</span>
                              </div>
                            </div>

                            {/* Quick complete button */}
                            <button
                              onClick={() => setUpdates(prev => ({ ...prev, [opKey]: { ...prev[opKey], progress: 100 } }))}
                              style={{ padding: '5px 12px', background: opProgress === 100 ? 'rgba(46,204,154,0.15)' : 'transparent', border: `1px solid ${opProgress === 100 ? '#2ECC9A' : '#1E2A35'}`, borderRadius: 6, color: opProgress === 100 ? '#2ECC9A' : '#2E4050', fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                              {opProgress === 100 ? '✓ Complete' : 'Mark Complete'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* WO Overall Progress */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #1E2A35' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A7080' }}>Overall WO Progress</div>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: progressColor }}>{progress}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={progress}
                      onChange={e => setUpdates(prev => ({
                        ...prev,
                        [woKey]: { ...prev[woKey], progress: Number(e.target.value) }
                      }))}
                      style={{ accentColor: progressColor }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 8, color: '#2E4050' }}>0%</span>
                      <span style={{ fontSize: 8, color: '#2E4050' }}>50%</span>
                      <span style={{ fontSize: 8, color: '#2E4050' }}>100%</span>
                    </div>
                  </div>

                  {/* Note */}
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E2A35' }}>
                    <textarea
                      rows={2}
                      placeholder="Add a note — delays, issues, anything relevant..."
                      value={woUpdate.note}
                      onChange={e => setUpdates(prev => ({
                        ...prev,
                        [woKey]: { ...prev[woKey], note: e.target.value }
                      }))}
                      style={{ width: '100%', background: '#141B22', border: '1px solid #1E2A35', borderRadius: 8, padding: '10px 12px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#E8EDF2', outline: 'none', lineHeight: 1.5 }}
                    />
                  </div>

                  {/* Submit */}
                  <div style={{ padding: '12px 16px' }}>
                    <button
                      onClick={() => submitWO(woKey)}
                      style={{ width: '100%', padding: '13px', background: isSubmitted ? 'rgba(46,204,154,0.15)' : '#2ECC9A', border: isSubmitted ? '1px solid #2ECC9A' : 'none', borderRadius: 10, color: isSubmitted ? '#2ECC9A' : '#040D0A', fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }}>
                      {isSubmitted ? '✓ Update Submitted' : 'Submit Update'}
                    </button>
                  </div>

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