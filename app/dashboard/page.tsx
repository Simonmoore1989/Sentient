'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const statusMap: Record<string, { label: string; color: string; bg: string; glow?: string }> = {
  'COMPLETE':    { label: 'Complete',     color: '#2ECC9A', bg: 'rgba(46,204,154,0.12)' },
  'IN PROGRESS': { label: 'In Progress',  color: '#4A9EE0', bg: 'rgba(74,158,224,0.12)', glow: '#4A9EE0' },
  'DELAYED':     { label: 'Delayed',      color: '#E05A5A', bg: 'rgba(224,90,90,0.12)',  glow: '#E05A5A' },
  'PENDING':     { label: 'Yet To Start', color: '#5A7080', bg: 'rgba(90,112,128,0.12)' },
};

export default function Dashboard() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setClientName(localStorage.getItem('client') || 'Client');
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(saved === 'true');
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) setTasks(JSON.parse(storedTasks));
  }, []);

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  }

  function toggleExpand(id: string) {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  const filtered = tasks.filter(t => {
    const matchFilter = activeFilter === 'ALL' || t.status === activeFilter;
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.wo.toLowerCase().includes(search.toLowerCase()) ||
      (t.team && t.team.toLowerCase().includes(search.toLowerCase())) ||
      (t.ops && t.ops.some((op: any) => op.name.toLowerCase().includes(search.toLowerCase())));
    return matchFilter && matchSearch;
  });

  const total = tasks.length;
  const complete = tasks.filter(t => t.status === 'COMPLETE').length;
  const inProgress = tasks.filter(t => t.status === 'IN PROGRESS').length;
  const delayed = tasks.filter(t => t.status === 'DELAYED').length;
  const pending = tasks.filter(t => t.status === 'PENDING').length;

  const menuItems = [
    { label: 'Overview', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', path: '/overview' },
    { label: 'Upload New Schedule', icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12', path: '/' },
    { label: 'Reports', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', path: '/reports' },
    { label: 'Vendor Setup', icon: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71', path: '/vendor-setup' },
  ];

  const th = darkMode ? {
    bg: '#080C0F', surface: '#0E1419', surface2: '#141B22',
    border: '#1E2A35', textPrimary: '#E8EDF2', textSecondary: '#5A7080', textMuted: '#2E4050',
    headerBg: '#080C0F', menuBg: '#0E1419',
  } : {
    bg: '#F4F6F8', surface: '#FFFFFF', surface2: '#EDF0F3',
    border: '#D8DEE5', textPrimary: '#0D1318', textSecondary: '#4A5D6B', textMuted: '#8FA0AE',
    headerBg: '#FFFFFF', menuBg: '#FFFFFF',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; background: ${th.bg}; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .filter-btn:hover { border-color: #2ECC9A !important; color: #2ECC9A !important; }
        .wo-row:hover { background: ${th.surface} !important; }
        .op-row:hover { background: ${darkMode ? '#0a1018' : '#f0f2f5'} !important; }
        .menu-item:hover { background: ${th.surface2} !important; }
        .menu-item-danger:hover { background: rgba(224,90,90,0.08) !important; }
      `}</style>

      <div
        style={{ position: 'relative', zIndex: 1, height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'DM Mono', monospace", color: th.textPrimary, background: th.bg }}
        onClick={() => setMenuOpen(false)}
      >
        {/* Header */}
        <header style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${th.border}`, flexShrink: 0, background: th.headerBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, border: '1.5px solid #2ECC9A', borderRadius: 5, display: 'grid', placeItems: 'center', background: 'rgba(46,204,154,0.1)' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#2ECC9A" strokeWidth="1.5">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"/>
                <circle cx="8" cy="8" r="2" fill="#2ECC9A" stroke="none"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.1, color: th.textPrimary }}>
                Sentient <span style={{ color: th.textMuted, fontWeight: 400 }}>|</span> {clientName}
              </span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '6px', fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#2ECC9A', whiteSpace: 'nowrap' }}>Execution Intelligence</span>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} style={{ padding: '8px 10px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 6, color: th.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {menuOpen && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 60, right: 20, background: th.menuBg, border: `1px solid ${th.border}`, borderRadius: 8, padding: 6, minWidth: 200, zIndex: 99999, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {menuItems.map(item => (
                  <div key={item.label} className="menu-item"
                    onClick={() => { if (item.path) router.push(item.path); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 5, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: th.textSecondary, cursor: 'pointer' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={item.icon}/></svg>
                    {item.label}
                  </div>
                ))}
                <div style={{ height: 1, background: th.border, margin: '4px 0' }}></div>
                <div className="menu-item menu-item-danger" onClick={() => router.push('/')} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 5, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E05A5A', cursor: 'pointer' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  New Session
                </div>
                <div style={{ height: 1, background: th.border, margin: '4px 0' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: th.textSecondary }}>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                  <div onClick={toggleDark} style={{ width: 40, height: 22, background: darkMode ? th.surface2 : 'rgba(46,204,154,0.15)', border: `1px solid ${darkMode ? th.border : '#2ECC9A'}`, borderRadius: 100, position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
                    <div style={{ position: 'absolute', top: 2, left: darkMode ? 2 : 20, width: 16, height: 16, borderRadius: '50%', background: darkMode ? th.textMuted : '#2ECC9A', transition: 'all 0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: `1px solid ${th.border}`, flexShrink: 0, background: th.bg }}>
          {[
            { label: 'Total WOs', value: String(total), color: th.textPrimary, bar: th.textMuted, width: '100%' },
            { label: 'Complete', value: String(complete), color: '#2ECC9A', bar: '#2ECC9A', width: `${total ? Math.round(complete/total*100) : 0}%` },
            { label: 'In Progress', value: String(inProgress), color: '#4A9EE0', bar: '#4A9EE0', width: `${total ? Math.round(inProgress/total*100) : 0}%` },
            { label: 'Delayed', value: String(delayed), color: '#E05A5A', bar: '#E05A5A', width: `${total ? Math.round(delayed/total*100) : 0}%` },
            { label: 'Yet To Start', value: String(pending), color: th.textSecondary, bar: th.textMuted, width: `${total ? Math.round(pending/total*100) : 0}%` },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 24px', borderRight: i < 4 ? `1px solid ${th.border}` : 'none' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ height: 2, background: th.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: s.width, background: s.bar, borderRadius: 2 }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${th.border}`, flexShrink: 0, gap: 16, background: th.bg }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'All', value: 'ALL' },
              { label: 'In Progress', value: 'IN PROGRESS' },
              { label: 'Delayed', value: 'DELAYED' },
              { label: 'Yet To Start', value: 'PENDING' },
            ].map(f => (
              <button key={f.value} className="filter-btn" onClick={() => setActiveFilter(f.value)}
                style={{ padding: '5px 14px', border: `1px solid ${activeFilter === f.value ? '#2ECC9A' : th.border}`, borderRadius: 100, color: activeFilter === f.value ? '#2ECC9A' : th.textSecondary, fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer', background: activeFilter === f.value ? 'rgba(46,204,154,0.08)' : 'transparent' } as React.CSSProperties}>
                {f.label}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Search WO, task or crew..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 6, padding: '7px 12px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: th.textPrimary, outline: 'none', width: 240 }} />
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', background: th.bg }}>
          {tasks.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.4 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={th.textMuted} strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: th.textMuted, letterSpacing: '0.1em' }}>No schedule loaded</div>
              <div style={{ fontSize: 10, color: th.textMuted }}>Upload a CSV on the setup page to get started</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${th.border}`, position: 'sticky', top: 0, background: th.bg, zIndex: 2 }}>
                  <th style={{ padding: '12px 16px 12px 32px', width: 40 }}></th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted, whiteSpace: 'nowrap' }}>WO</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted }}>Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted, whiteSpace: 'nowrap' }}>Crew</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted, whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted, whiteSpace: 'nowrap' }}>Start / Finish</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted, whiteSpace: 'nowrap' }}>Duration</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((task: any) => {
                  const s = statusMap[task.status] || statusMap['PENDING'];
                  const isExpanded = expanded.includes(task.id);
                  const hasOps = task.ops && task.ops.length > 0;
                  return (
                    <>
                      {/* WO Parent Row */}
                      <tr key={task.id} className="wo-row"
                        onClick={() => hasOps && toggleExpand(task.id)}
                        style={{ borderBottom: `1px solid ${th.border}`, cursor: hasOps ? 'pointer' : 'default', background: isExpanded ? th.surface : 'transparent' }}>
                        <td style={{ padding: '14px 16px 14px 32px', width: 40 }}>
                          {hasOps && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={th.textMuted} strokeWidth="2"
                              style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                              <polyline points="6 9 12 15 18 9"/>
                            </svg>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, fontWeight: 700, color: '#2ECC9A', whiteSpace: 'nowrap' }}>{task.wo}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 800, color: th.textPrimary }}>{task.name}</div>
                          {hasOps && <div style={{ fontSize: 9, color: th.textMuted, marginTop: 2 }}>{task.ops.length} operation{task.ops.length > 1 ? 's' : ''}</div>}
                        </td>
                        <td style={{ padding: '14px 16px', fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, color: th.textSecondary }}>{task.team}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ position: 'relative', width: 160, height: 18, borderRadius: 4, overflow: 'hidden', background: th.surface2 }}>
                            <div style={{ position: 'absolute', inset: 0, width: `${task.progress}%`, background: s.bg, borderRadius: 4 }}></div>
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 5 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, boxShadow: s.glow ? `0 0 4px ${s.glow}` : 'none', animation: s.glow ? 'pulse 2s infinite' : 'none', flexShrink: 0 }}></div>
                              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color }}>{s.label} — {task.progress}%</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 11, color: th.textSecondary, whiteSpace: 'nowrap' }}>{task.start} / {task.end}</td>
                        <td style={{ padding: '14px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: th.textSecondary }}>{task.duration}</td>
                      </tr>

                      {/* Op Lines */}
                      {isExpanded && hasOps && task.ops.map((op: any, oi: number) => {
                        const opProgress = op.progress || 0;
                        const opStatus = opProgress === 100 ? 'COMPLETE' : opProgress > 0 ? 'IN PROGRESS' : 'PENDING';
                        const os = statusMap[opStatus];
                        return (
                          <tr key={`${task.id}-op-${oi}`} className="op-row"
                            style={{ borderBottom: `1px solid ${th.border}`, background: darkMode ? 'rgba(14,20,25,0.8)' : 'rgba(237,240,243,0.8)' }}>
                            <td style={{ padding: '10px 16px 10px 32px' }}></td>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: th.textMuted, background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 4, padding: '2px 6px' }}>
                                OP {op.op}
                              </span>
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 600, color: th.textSecondary, paddingLeft: 12, borderLeft: `2px solid ${th.border}` }}>{op.name}</div>
                            </td>
                            <td style={{ padding: '10px 16px', fontFamily: "'Syne', sans-serif", fontSize: 9, color: th.textMuted }}>{op.crew}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <div style={{ position: 'relative', width: 140, height: 16, borderRadius: 4, overflow: 'hidden', background: th.surface2 }}>
                                <div style={{ position: 'absolute', inset: 0, width: `${opProgress}%`, background: os.bg, borderRadius: 4 }}></div>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 6px', gap: 4 }}>
                                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: os.color, flexShrink: 0 }}></div>
                                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: os.color }}>{os.label} — {opProgress}%</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '10px 16px', fontSize: 10, color: th.textMuted, whiteSpace: 'nowrap' }}>{op.start} / {op.end}</td>
                            <td style={{ padding: '10px 16px', fontFamily: "'DM Mono', monospace", fontSize: 9, color: th.textMuted }}>{op.duration}</td>
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <footer style={{ padding: '10px 32px', borderTop: `1px solid ${th.border}`, display: 'flex', justifyContent: 'space-between', flexShrink: 0, background: th.bg }}>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em' }}>SENTIENT V0.1 — MVP</span>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em' }}>Showing {filtered.length} of {tasks.length} WOs</span>
        </footer>

      </div>
    </>
  );
}