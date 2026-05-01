'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function getCookie(name: string): string {
  return document.cookie.split('; ').reduce((r, v) => {
    const parts = v.split('=');
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, '');
}

function VendorField() {
  const searchParams = useSearchParams();

  const rawTeams = decodeURIComponent(searchParams.get('teams') || searchParams.get('team') || '');
  const rawName = searchParams.get('name') || '';
  const rawRole = searchParams.get('role') || '';
  const rawClient = decodeURIComponent(searchParams.get('client') || '');

  useEffect(() => {
    if (rawName) setCookie('supervisor_name', rawName);
    if (rawTeams) setCookie('supervisor_teams', rawTeams);
    if (rawRole) setCookie('supervisor_role', rawRole);
    if (rawClient) setCookie('supervisor_client', rawClient);
  }, [rawName, rawTeams, rawRole, rawClient]);

  const teamsParam = rawTeams || getCookie('supervisor_teams');
  const teamIds = teamsParam.split(',').filter(Boolean);
  const supervisorName = rawName || getCookie('supervisor_name');
  const supervisorRole = rawRole || getCookie('supervisor_role');
  const clientParam = rawClient || getCookie('supervisor_client');

  const [tasks, setTasks] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [updates, setUpdates] = useState<Record<string, { progress: number; note: string; status: string; showSlider: boolean }>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [pushRegistered, setPushRegistered] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [delayPanel, setDelayPanel] = useState<Record<string, { reason: string; hours: number }>>({});
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });
  const [showInfo, setShowInfo] = useState(false);
  const [notifModalDismissed, setNotifModalDismissed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
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
        teamIds.some(id => t.team && t.team.toLowerCase() === id.toLowerCase())
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

    if (getCookie('notifications_granted')) {
      setPushRegistered(true);
    }
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

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
      return Math.min(99, Math.max(0, pct));
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

    let newProgress = update.progress;
    let updatedOps = task.ops || [];

    if (task.ops && task.ops.length > 0) {
      updatedOps = task.ops.map((op: any, i: number) => {
        const opKey = `${taskId}-op-${i}`;
        const opUpdate = updates[opKey];
        return opUpdate ? { ...op, progress: opUpdate.progress, status: opUpdate.status } : op;
      });

      const totalOpProgress = updatedOps.reduce((sum: number, op: any) => sum + (op.progress || 0), 0);
      newProgress = Math.round(totalOpProgress / updatedOps.length);
    }

    const anyOpDelayed = task.ops && task.ops.some((_: any, i: number) => {
      const opKey = `${taskId}-op-${i}`;
      return updates[opKey]?.status === 'DELAYED';
    });

    const newStatus = anyOpDelayed ? 'DELAYED' : update.status === 'DELAYED' ? 'DELAYED' : newProgress === 100 ? 'COMPLETE' : newProgress > 0 ? 'IN PROGRESS' : 'PENDING';

    const updatedOpsWithDelay = updatedOps.map((op: any, i: number) => {
      const opKey = `${taskId}-op-${i}`;
      const delay = delayPanel[opKey];
      if (delay) {
        return { ...op, delayReason: delay.reason, delayHours: delay.hours };
      }
      return op;
    });

    const { error } = await supabase
      .from('tasks')
      .update({ progress: newProgress, status: newStatus, ops: updatedOpsWithDelay })
      .eq('id', taskId)
      .eq('shutdown_id', task.shutdown_id);

    console.log('Supabase update result — status:', newStatus, 'error:', error);

    setSubmitted(prev => ({ ...prev, [taskId]: true }));
    setTimeout(() => setSubmitted(prev => ({ ...prev, [taskId]: false })), 3000);
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });

  const th = darkMode ? {
    bg: '#080C0F', surface: '#0E1419', surface2: '#141B22',
    border: '#1E2A35', textPrimary: '#E8EDF2', textSecondary: '#5A7080', textMuted: '#2E4050',
  } : {
    bg: '#F4F6F8', surface: '#FFFFFF', surface2: '#EDF0F3',
    border: '#D8DEE5', textPrimary: '#0D1318', textSecondary: '#4A5D6B', textMuted: '#8FA0AE',
  };

  const isStandalone = typeof window !== 'undefined' && (window.navigator as any).standalone;
  const showNotifModal = isStandalone && !pushRegistered && !notifModalDismissed && !getCookie('notifications_granted');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${th.bg}; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        textarea::placeholder { color: ${th.textMuted}; font-family: 'DM Mono', monospace; font-size: 11px; }
        textarea { resize: none; }
        input[type=range] { -webkit-appearance: none; width: 100%; height: 4px; border-radius: 2px; background: ${th.border}; outline: none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 28px; height: 28px; border-radius: 50%; background: #2ECC9A; cursor: pointer; box-shadow: 0 0 8px rgba(46,204,154,0.4); }
        input[type=range].delay-slider::-webkit-slider-thumb { background: #E05A5A; box-shadow: 0 0 8px rgba(224,90,90,0.4); }
      `}</style>

      {/* Notification Permission Modal */}
{showNotifModal && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'grid', placeItems: 'center' }}>
    <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: 24, width: '90%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, border: '1.5px solid #4A9EE0', borderRadius: 8, display: 'grid', placeItems: 'center', background: 'rgba(74,158,224,0.1)', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A9EE0" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
        </div>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800, color: th.textPrimary }}>Enable Notifications</div>
          <div style={{ fontSize: 10, color: th.textSecondary, marginTop: 2 }}>Stay updated on field changes</div>
        </div>
      </div>
      <button
        onClick={async () => {
          setNotifModalDismissed(true);
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            try {
              const reg = await navigator.serviceWorker.ready;
              const existing = await reg.pushManager.getSubscription();
              const subscription = existing || await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_KEY!)
              });
              const { data: shutdownData } = await supabase.from('shutdowns').select('id').order('created_at', { ascending: false }).limit(1).single();
              if (shutdownData) {
                await supabase.from('supervisors').upsert({
                  name: supervisorName,
                  role: supervisorRole,
                  team: teamsParam,
                  push_token: JSON.stringify(subscription),
                  shutdown_id: shutdownData.id,
                }, { onConflict: 'name,shutdown_id' });
              }
              setPushRegistered(true);
              setCookie('notifications_granted', 'true', 365);
            } catch (err) {
              console.log('Push registration failed:', err);
alert('Push failed: ' + JSON.stringify(err));
            }
          }
          setNotifModalDismissed(true);
        }}
        style={{ width: '100%', padding: '12px', background: '#4A9EE0', border: 'none', borderRadius: 8, color: '#fff', fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
        Enable
      </button>
    </div>
  </div>
)}

      <div style={{ minHeight: '100vh', background: th.bg, fontFamily: "'DM Mono', monospace", color: th.textPrimary, paddingBottom: 40 }} onClick={() => { setMenuOpen(false); setShowInfo(false); }}>

        {/* Header */}
        <div style={{ background: th.surface, borderBottom: `1px solid ${th.border}`, padding: '14px 16px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, border: '1.5px solid #2ECC9A', borderRadius: 4, display: 'grid', placeItems: 'center', background: 'rgba(46,204,154,0.1)' }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#2ECC9A" strokeWidth="1.5">
                  <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"/>
                  <circle cx="8" cy="8" r="2" fill="#2ECC9A" stroke="none"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1, color: th.textPrimary }}>
                  Sentient {clientParam && <span style={{ color: th.textMuted, fontWeight: 400 }}>| {clientParam}</span>}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2ECC9A' }}>Field Supervision</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: th.textPrimary }}>{timeStr}</div>
                <div style={{ fontSize: 9, color: th.textMuted }}>{dateStr}</div>
              </div>
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                  style={{ padding: '6px 8px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 6, color: th.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                </button>
                {menuOpen && (
                  <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 70, right: 16, background: th.surface, border: `1px solid ${th.border}`, borderRadius: 10, padding: 8, minWidth: 200, zIndex: 99999, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 6 }} onClick={e => e.stopPropagation()}>
                      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.textSecondary }}>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                      <div onClick={() => {
                        const next = !darkMode;
                        setDarkMode(next);
                        localStorage.setItem('darkMode', String(next));
                      }} style={{ width: 40, height: 22, background: darkMode ? th.surface2 : 'rgba(46,204,154,0.15)', border: `1px solid ${darkMode ? th.border : '#2ECC9A'}`, borderRadius: 100, position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
                        <div style={{ position: 'absolute', top: 2, left: darkMode ? 2 : 20, width: 16, height: 16, borderRadius: '50%', background: darkMode ? th.textMuted : '#2ECC9A', transition: 'all 0.3s' }}></div>
                      </div>
                    </div>
                    <div style={{ height: 1, background: th.border }}></div>
                    <div
                      onClick={() => { setShowInfo(true); setMenuOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 6, cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.textSecondary }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      Shutdown Info
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {supervisorName && (
            <div style={{ background: 'rgba(46,204,154,0.06)', border: '1px solid rgba(46,204,154,0.15)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800, color: th.textPrimary }}>
                {getGreeting()}, {supervisorName}
              </div>
              {supervisorRole && (
                <div style={{ fontSize: 9, color: '#2ECC9A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{supervisorRole} Supervisor</div>
              )}
            </div>
          )}
        </div>

        {showInfo && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99999, display: 'grid', placeItems: 'center' }} onClick={() => setShowInfo(false)}>
            <div onClick={e => e.stopPropagation()} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: 24, width: '90%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: th.textPrimary }}>Shutdown Info</div>
                <button onClick={() => setShowInfo(false)} style={{ background: 'transparent', border: 'none', color: th.textMuted, cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
              {['Contact List', 'Training Schedule', 'Bus Schedule', 'Flight Times', 'Plant Map', 'Camp Map'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8, cursor: 'pointer' }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: th.textSecondary }}>{item}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={th.textMuted} strokeWidth="2" style={{ marginLeft: 'auto' }}><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}
              <div style={{ fontSize: 9, color: th.textMuted, textAlign: 'center', letterSpacing: '0.1em' }}>DOCUMENTS COMING SOON</div>
            </div>
          </div>
        )}

        <div style={{ padding: '10px 16px', display: 'flex', gap: 8, borderBottom: `1px solid ${th.border}`, background: th.surface }}>
          {[
            { label: 'All', value: 'ALL' },
            { label: 'In Progress', value: 'IN PROGRESS' },
            { label: 'Not Started', value: 'PENDING' },
            { label: 'Complete', value: 'COMPLETE' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{ flex: 1, padding: '7px 4px', border: `1px solid ${filter === f.value ? '#2ECC9A' : th.border}`, borderRadius: 6, background: filter === f.value ? 'rgba(46,204,154,0.1)' : 'transparent', color: filter === f.value ? '#2ECC9A' : th.textMuted, fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: th.textMuted, fontSize: 11 }}>Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 12, opacity: 0.4 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={th.textMuted} strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: th.textMuted, letterSpacing: '0.1em', textAlign: 'center' }}>No tasks assigned to your team</div>
            </div>
          ) : (
            tasks
              .filter((task: any) => filter === 'ALL' || task.status === filter)
              .map((task: any) => {
                const woKey = task.id;
                const woUpdate = updates[woKey] || { progress: task.progress || 0, note: '', status: task.status || 'PENDING', showSlider: false };
                const isExpanded = expanded.includes(woKey);
                const isSubmitted = submitted[woKey];
                const hasOps = task.ops && task.ops.length > 0;
                const progress = hasOps
                  ? Math.round(task.ops.reduce((sum: number, _op: any, i: number) => {
                      const opKey = `${task.id}-op-${i}`;
                      const opUpdate = updates[opKey];
                      return sum + (opUpdate ? opUpdate.progress : (_op.progress || 0));
                    }, 0) / task.ops.length)
                  : woUpdate.progress;
                const progressColor = woUpdate.status === 'DELAYED' ? '#E05A5A' : progress === 100 ? '#2ECC9A' : progress > 0 ? '#4A9EE0' : th.textMuted;

                return (
                  <div key={task.id} style={{ background: th.surface, border: `1px solid ${isSubmitted ? '#2ECC9A' : th.border}`, borderRadius: 12, overflow: 'hidden', animation: 'fadeIn 0.3s ease', transition: 'border-color 0.3s' }}>
                    <div onClick={() => toggleExpand(woKey)} style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2ECC9A', background: 'rgba(46,204,154,0.1)', border: '1px solid rgba(46,204,154,0.2)', borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>{task.wo}</span>
                          <span style={{ fontSize: 9, color: th.textMuted, whiteSpace: 'nowrap' }}>{task.team}</span>
                        </div>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800, color: th.textPrimary, lineHeight: 1.3 }}>{task.name}</div>
                        {hasOps && (
                          <div style={{ fontSize: 9, color: th.textMuted, marginTop: 4 }}>{task.ops.length} operation{task.ops.length > 1 ? 's' : ''}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: progressColor }}>{progress}%</div>
                          <div style={{ fontSize: 8, color: th.textMuted }}>{task.start}</div>
                          <div style={{ fontSize: 8, color: th.textMuted }}>→ {task.end}</div>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={th.textMuted} strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ borderTop: `1px solid ${th.border}` }}>
                        {hasOps && (
                          <div style={{ borderBottom: `1px solid ${th.border}` }}>
                            {task.ops.map((op: any, oi: number) => {
                              const opKey = `${task.id}-op-${oi}`;
                              const opUpdate = updates[opKey] || { progress: op.progress || 0, note: '', status: 'PENDING', showSlider: false };
                              const opProgress = opUpdate.progress;
                              const opColor = opUpdate.status === 'DELAYED' ? '#E05A5A' : opProgress === 100 ? '#2ECC9A' : opProgress > 0 ? '#4A9EE0' : th.textMuted;

                              return (
                                <div key={opKey} style={{ padding: '12px 16px', borderBottom: oi < task.ops.length - 1 ? `1px solid ${th.surface2}` : 'none' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: th.textMuted, background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 4, padding: '2px 6px', whiteSpace: 'nowrap' }}>OP {op.op}</span>
                                        {op.crew && op.crew !== task.team && (
                                          <span style={{ fontSize: 9, color: th.textMuted }}>{op.crew}</span>
                                        )}
                                      </div>
                                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 600, color: th.textSecondary }}>{op.name}</div>
                                    </div>
                                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: opColor, marginLeft: 12 }}>{opProgress}%</span>
                                  </div>

                                  {opUpdate.showSlider && (
                                    <div style={{ marginBottom: 12, padding: '10px 12px', background: th.surface2, borderRadius: 8, border: `1px solid ${th.border}` }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.textSecondary }}>Set Progress</span>
                                        <button
                                          onClick={() => setUpdates(prev => ({ ...prev, [opKey]: { ...prev[opKey], showSlider: false } }))}
                                          style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>
                                          Done
                                        </button>
                                      </div>
                                      <input
                                        type="range" min={0} max={100} step={5} value={opProgress}
                                        onChange={e => setUpdates(prev => ({ ...prev, [opKey]: { ...prev[opKey], progress: Number(e.target.value), status: 'IN PROGRESS' } }))}
                                        style={{ accentColor: '#2ECC9A' }}
                                      />
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                        <span style={{ fontSize: 8, color: th.textMuted }}>0%</span>
                                        <span style={{ fontSize: 8, color: '#2ECC9A', fontWeight: 700 }}>{opProgress}%</span>
                                        <span style={{ fontSize: 8, color: th.textMuted }}>100%</span>
                                      </div>
                                    </div>
                                  )}

                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button
                                      onTouchStart={() => handleOnTrackPress(opKey, op.start, op.end)}
                                      onTouchEnd={() => handleOnTrackRelease(opKey, op.start, op.end)}
                                      onMouseDown={() => handleOnTrackPress(opKey, op.start, op.end)}
                                      onMouseUp={() => handleOnTrackRelease(opKey, op.start, op.end)}
                                      style={{ flex: 1, padding: '8px 4px', background: opUpdate.status === 'IN PROGRESS' ? 'rgba(74,158,224,0.15)' : 'transparent', border: `1px solid ${opUpdate.status === 'IN PROGRESS' ? '#4A9EE0' : th.border}`, borderRadius: 6, color: opUpdate.status === 'IN PROGRESS' ? '#4A9EE0' : th.textMuted, fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                                      On Track
                                    </button>
                                    <button
                                      onClick={() => {
                                        setUpdates(prev => ({ ...prev, [opKey]: { ...prev[opKey], status: 'DELAYED', showSlider: false } }));
                                        setDelayPanel(prev => ({ ...prev, [opKey]: prev[opKey] || { reason: '', hours: 1 } }));
                                      }}
                                      style={{ flex: 1, padding: '8px 4px', background: opUpdate.status === 'DELAYED' ? 'rgba(224,90,90,0.15)' : 'transparent', border: `1px solid ${opUpdate.status === 'DELAYED' ? '#E05A5A' : th.border}`, borderRadius: 6, color: opUpdate.status === 'DELAYED' ? '#E05A5A' : th.textMuted, fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                                      Delay
                                    </button>
                                    <button
                                      onClick={() => setUpdates(prev => ({ ...prev, [opKey]: { ...prev[opKey], progress: opProgress === 100 ? 0 : 100, status: opProgress === 100 ? 'PENDING' : 'COMPLETE', showSlider: false } }))}
                                      style={{ flex: 1, padding: '8px 4px', background: opUpdate.status === 'COMPLETE' || opProgress === 100 ? 'rgba(46,204,154,0.15)' : 'transparent', border: `1px solid ${opUpdate.status === 'COMPLETE' || opProgress === 100 ? '#2ECC9A' : th.border}`, borderRadius: 6, color: opUpdate.status === 'COMPLETE' || opProgress === 100 ? '#2ECC9A' : th.textMuted, fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>
                                      Complete
                                    </button>
                                  </div>

                                  {opUpdate.status === 'DELAYED' && delayPanel[opKey] !== undefined && (
                                    <div style={{ marginTop: 10, padding: '12px', background: 'rgba(224,90,90,0.06)', border: '1px solid rgba(224,90,90,0.2)', borderRadius: 8 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E05A5A' }}>Delay Details</span>
                                        <button
                                          onClick={() => {
                                            setDelayPanel(prev => { const n = { ...prev }; delete n[opKey]; return n; });
                                            setUpdates(prev => ({ ...prev, [opKey]: { ...prev[opKey], status: 'PENDING' } }));
                                          }}
                                          style={{ background: 'transparent', border: 'none', color: th.textMuted, cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>
                                          Cancel
                                        </button>
                                      </div>
                                      <textarea
                                        rows={2}
                                        placeholder="Reason for delay..."
                                        value={delayPanel[opKey]?.reason || ''}
                                        onChange={e => setDelayPanel(prev => ({ ...prev, [opKey]: { ...prev[opKey], reason: e.target.value } }))}
                                        style={{ width: '100%', background: th.surface2, border: '1px solid rgba(224,90,90,0.2)', borderRadius: 6, padding: '8px 10px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: th.textPrimary, outline: 'none', lineHeight: 1.5, marginBottom: 12, resize: 'none' }}
                                      />
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.textSecondary }}>Delay Duration</span>
                                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: '#E05A5A' }}>{delayPanel[opKey]?.hours || 1}h</span>
                                      </div>
                                      <input
                                        type="range"
                                        className="delay-slider"
                                        min={0.5} max={48} step={0.5}
                                        value={delayPanel[opKey]?.hours || 1}
                                        onChange={e => setDelayPanel(prev => ({ ...prev, [opKey]: { ...prev[opKey], hours: Number(e.target.value) } }))}
                                      />
                                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                        <span style={{ fontSize: 8, color: th.textMuted }}>0.5h</span>
                                        <span style={{ fontSize: 8, color: th.textMuted }}>48h</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

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