'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const tasks = [
  { id:'T-001', wo:'WO-4421', name:'Isolation & Lockout', area:'Electrical', team:'Linkforce T1', status:'COMPLETE', start:'12 May 06:00', end:'13 May 22:00', duration:'16h', progress:100, deps:[] },
  { id:'T-002', wo:'WO-4422', name:'Vessel Internal Inspection', area:'Pressure Systems', team:'Linkforce T2', status:'COMPLETE', start:'13 May 06:00', end:'14 May 14:00', duration:'8h', progress:100, deps:['T-001'] },
  { id:'T-003', wo:'WO-4423', name:'Main Drive Bearing Replacement', area:'Mechanical', team:'Linkforce T1', status:'IN PROGRESS', start:'14 May 06:00', end:'16 May 14:00', duration:'32h', progress:62, deps:['T-001','T-002'] },
  { id:'T-004', wo:'WO-4424', name:'Conveyor Belt Tensioner Service', area:'Mechanical', team:'Linkforce T2', status:'IN PROGRESS', start:'14 May 06:00', end:'15 May 18:00', duration:'12h', progress:40, deps:['T-001'] },
  { id:'T-005', wo:'WO-4425', name:'SAG Mill Liner Change', area:'Grinding', team:'Linkforce T2', status:'DELAYED', start:'13 May 06:00', end:'17 May 06:00', duration:'48h', progress:28, deps:['T-002','T-003'] },
  { id:'T-006', wo:'WO-4426', name:'Pump Station Overhaul', area:'Hydraulics', team:'Linkforce T3', status:'DELAYED', start:'15 May 06:00', end:'16 May 00:00', duration:'18h', progress:10, deps:['T-003'] },
  { id:'T-007', wo:'WO-4427', name:'Electrical Panel Upgrade', area:'Electrical', team:'Linkforce T1', status:'IN PROGRESS', start:'14 May 06:00', end:'15 May 16:00', duration:'10h', progress:75, deps:['T-001'] },
  { id:'T-008', wo:'WO-4428', name:'Crusher Jaw Plate Swap', area:'Crushing', team:'Linkforce T2', status:'PENDING', start:'16 May 06:00', end:'17 May 20:00', duration:'14h', progress:0, deps:['T-005'] },
  { id:'T-009', wo:'WO-4429', name:'Tailings Line Flush & Test', area:'Process', team:'Linkforce T3', status:'PENDING', start:'17 May 06:00', end:'18 May 12:00', duration:'6h', progress:0, deps:['T-004','T-006'] },
  { id:'T-010', wo:'WO-4430', name:'Gearbox Oil Change — Unit 3', area:'Mechanical', team:'Linkforce T1', status:'COMPLETE', start:'12 May 06:00', end:'13 May 10:00', duration:'4h', progress:100, deps:[] },
  { id:'T-011', wo:'WO-4431', name:'Fire Suppression Test', area:'Safety', team:'Linkforce T2', status:'PENDING', start:'18 May 06:00', end:'18 May 09:00', duration:'3h', progress:0, deps:['T-007','T-009'] },
  { id:'T-012', wo:'WO-4432', name:'Final Commissioning & Handover', area:'Management', team:'Linkforce T3', status:'PENDING', start:'19 May 06:00', end:'19 May 14:00', duration:'8h', progress:0, deps:['T-008','T-009','T-011'] },
];

const statusMap: Record<string, { label: string; color: string; bg: string; glow?: string }> = {
  'COMPLETE':    { label: 'Complete',     color: '#2ECC9A', bg: 'rgba(46,204,154,0.12)' },
  'IN PROGRESS': { label: 'In Progress',  color: '#4A9EE0', bg: 'rgba(74,158,224,0.12)', glow: '#4A9EE0' },
  'DELAYED':     { label: 'Delayed',      color: '#E05A5A', bg: 'rgba(224,90,90,0.12)',  glow: '#E05A5A' },
  'PENDING':     { label: 'Yet To Start', color: '#5A7080', bg: 'rgba(90,112,128,0.12)' },
};

const unique = (key: 'id' | 'name' | 'team') => [...new Set(tasks.map(t => t[key]))].sort();

type ColFilter = { id: string[]; name: string[]; team: string[] };

function ColDropdown({ col, filters, setFilters, openCol, setOpenCol }: {
  col: 'id' | 'name' | 'team';
  filters: ColFilter;
  setFilters: (f: ColFilter) => void;
  openCol: string | null;
  setOpenCol: (c: string | null) => void;
}) {
  const [search, setSearch] = useState('');
  const isOpen = openCol === col;
  const values = unique(col).filter(v => v.toLowerCase().includes(search.toLowerCase()));
  const selected = filters[col];
  const isActive = selected.length > 0;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpenCol(isOpen ? null : col); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: isActive ? '#2ECC9A' : '#2E4050', padding: 0 }}
      >
        {col.toUpperCase()}
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      {isOpen && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', background: '#0E1419', border: '1px solid #1E2A35', borderRadius: 8, padding: 8, minWidth: 200, zIndex: 99999, boxShadow: '0 16px 48px rgba(0,0,0,0.8)' }}>
          <input
            autoFocus
            type="text"
            placeholder={`Search ${col}...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', background: '#141B22', border: '1px solid #1E2A35', borderRadius: 5, padding: '7px 10px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#E8EDF2', outline: 'none', marginBottom: 6 }}
          />
          <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {values.map(v => {
              const checked = selected.includes(v);
              return (
                <div
                  key={v}
                  onClick={() => {
                    const next = checked ? selected.filter(x => x !== v) : [...selected, v];
                    setFilters({ ...filters, [col]: next });
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 5, cursor: 'pointer', background: checked ? 'rgba(46,204,154,0.06)' : 'transparent', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: checked ? '#2ECC9A' : '#5A7080' }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: 3, border: `1px solid ${checked ? '#2ECC9A' : '#1E2A35'}`, background: checked ? '#2ECC9A' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    {checked && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#040D0A" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  {v}
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: '1px solid #1E2A35', marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
            <button onClick={() => setFilters({ ...filters, [col]: [] })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2E4050' }}>Clear</button>
            <button onClick={() => setOpenCol(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2ECC9A' }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openCol, setOpenCol] = useState<string | null>(null);
  const [colFilters, setColFilters] = useState<ColFilter>({ id: [], name: [], team: [] });
  const [clientName, setClientName] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setClientName(localStorage.getItem('client') || 'Client');
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(saved === 'true');
  }, []);

  const filtered = tasks.filter(t => {
    const matchFilter = activeFilter === 'ALL' || t.status === activeFilter ||
      (activeFilter === 'CRITICAL' && ['T-003','T-005','T-009','T-012'].includes(t.id));
    const matchSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.team.toLowerCase().includes(search.toLowerCase());
    const matchId   = colFilters.id.length   === 0 || colFilters.id.includes(t.id);
    const matchName = colFilters.name.length  === 0 || colFilters.name.includes(t.name);
    const matchTeam = colFilters.team.length  === 0 || colFilters.team.includes(t.team);
    return matchFilter && matchSearch && matchId && matchName && matchTeam;
  });

  const menuItems = [
    { label: 'Overview', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', path: '/overview' },
    { label: 'Upload New Schedule', icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12', path: '/' },
    { label: 'Reports', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', path: null },
    { label: 'Vendor Setup', icon: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71', path: '/vendor-setup' },
  ];

  // Light/dark theme values
  const t = darkMode ? {
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
        html, body { height: 100%; background: ${t.bg}; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .filter-btn:hover { border-color: #2ECC9A !important; color: #2ECC9A !important; }
        .task-row:hover { background: ${t.surface} !important; }
        .menu-item:hover { background: ${t.surface2} !important; }
        .menu-item-danger:hover { background: rgba(224,90,90,0.08) !important; }
      `}</style>

      <div
        style={{ position: 'relative', zIndex: 1, height: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'DM Mono', monospace", color: t.textPrimary, background: t.bg }}
        onClick={() => { setMenuOpen(false); setOpenCol(null); }}
      >

        {/* Header */}
        <header style={{ padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}`, flexShrink: 0, background: t.headerBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, border: '1.5px solid #2ECC9A', borderRadius: 5, display: 'grid', placeItems: 'center', background: 'rgba(46,204,154,0.1)' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#2ECC9A" strokeWidth="1.5">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"/>
                <circle cx="8" cy="8" r="2" fill="#2ECC9A" stroke="none"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.1, color: t.textPrimary }}>
                Sentient <span style={{ color: t.textMuted, fontWeight: 400 }}>|</span> {clientName}
              </span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '6px', fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#2ECC9A', whiteSpace: 'nowrap' }}>Execution Intelligence</span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{ padding: '8px 10px', background: 'transparent', border: `1px solid ${t.border}`, borderRadius: 6, color: t.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {menuOpen && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 60, right: 20, background: t.menuBg, border: `1px solid ${t.border}`, borderRadius: 8, padding: 6, minWidth: 200, zIndex: 99999, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {menuItems.map(item => (
                  <div key={item.label} className="menu-item"
                    onClick={() => { if (item.path) router.push(item.path); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 5, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.textSecondary, cursor: 'pointer' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={item.icon}/></svg>
                    {item.label}
                  </div>
                ))}
                <div style={{ height: 1, background: t.border, margin: '4px 0' }}></div>
                <div className="menu-item menu-item-danger"
                  onClick={() => router.push('/')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 5, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E05A5A', cursor: 'pointer' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  New Session
                </div>
                <div style={{ height: 1, background: t.border, margin: '4px 0' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: t.textSecondary }}>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                  <div onClick={() => {
  const next = !darkMode;
  setDarkMode(next);
  localStorage.setItem('darkMode', String(next));
}} style={{ width: 40, height: 22, background: darkMode ? '#141B22' : 'rgba(46,204,154,0.15)', border: `1px solid ${darkMode ? t.border : '#2ECC9A'}`, borderRadius: 100, position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
                    <div style={{ position: 'absolute', top: 2, left: darkMode ? 2 : 20, width: 16, height: 16, borderRadius: '50%', background: darkMode ? t.textMuted : '#2ECC9A', transition: 'all 0.3s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Stats Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: `1px solid ${t.border}`, flexShrink: 0, background: t.bg }}>
          {[
            { label: 'Total Tasks', value: '248', color: t.textPrimary, bar: t.textMuted, width: '100%' },
            { label: 'Complete', value: '91', color: '#2ECC9A', bar: '#2ECC9A', width: '37%' },
            { label: 'In Progress', value: '44', color: '#4A9EE0', bar: '#4A9EE0', width: '18%' },
            { label: 'Delayed', value: '12', color: '#E05A5A', bar: '#E05A5A', width: '5%' },
            { label: 'Yet To Start', value: '101', color: t.textSecondary, bar: t.textMuted, width: '41%' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '14px 24px', borderRight: i < 4 ? `1px solid ${t.border}` : 'none' }}>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.textMuted, marginBottom: 4 }}>{s.label}</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ height: 2, background: t.border, borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: s.width, background: s.bar, borderRadius: 2 }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${t.border}`, flexShrink: 0, gap: 16, background: t.bg }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'All', value: 'ALL' },
              { label: 'In Progress', value: 'IN PROGRESS' },
              { label: 'Delayed', value: 'DELAYED' },
              { label: 'Critical Path', value: 'CRITICAL' },
              { label: 'Yet To Start', value: 'PENDING' },
            ].map(f => (
              <button
                key={f.value}
                className="filter-btn"
                onClick={() => setActiveFilter(f.value)}
                style={{
                  padding: '5px 14px',
                  border: `1px solid ${activeFilter === f.value ? '#2ECC9A' : t.border}`,
                  borderRadius: 100,
                  color: activeFilter === f.value ? '#2ECC9A' : t.textSecondary,
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  cursor: 'pointer',
                  background: activeFilter === f.value ? 'rgba(46,204,154,0.08)' : 'transparent',
                } as React.CSSProperties}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 6, padding: '7px 12px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: t.textPrimary, outline: 'none', width: 200 }}
          />
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflowY: 'auto', background: t.bg }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.border}`, position: 'sticky', top: 0, background: t.bg, zIndex: 2 }}>
                <th style={{ padding: '12px 16px 12px 32px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                  <ColDropdown col="id" filters={colFilters} setFilters={setColFilters} openCol={openCol} setOpenCol={setOpenCol} />
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.textMuted, whiteSpace: 'nowrap' }}>WO</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                  <ColDropdown col="name" filters={colFilters} setFilters={setColFilters} openCol={openCol} setOpenCol={setOpenCol} />
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                  <ColDropdown col="team" filters={colFilters} setFilters={setColFilters} openCol={openCol} setOpenCol={setOpenCol} />
                </th>
                {['Status', 'Start / Finish', 'Duration', 'Dependencies'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.textMuted, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const s = statusMap[task.status] || statusMap['PENDING'];
                return (
                  <tr key={task.id} className="task-row" style={{ borderBottom: `1px solid ${t.border}`, cursor: 'pointer' }}>
                    <td style={{ padding: '14px 16px 14px 32px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: t.textMuted }}>{task.id}</td>
                    <td style={{ padding: '14px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: t.textMuted }}>{task.wo}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 600, color: t.textPrimary }}>{task.name}</div>
                      <div style={{ fontSize: 10, color: t.textMuted, marginTop: 2 }}>{task.area}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, color: t.textSecondary, letterSpacing: '0.08em' }}>{task.team}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ position: 'relative', width: 160, height: 18, borderRadius: 4, overflow: 'hidden', background: t.surface2 }}>
                        <div style={{ position: 'absolute', inset: 0, width: `${task.progress}%`, background: s.bg, borderRadius: 4 }}></div>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 8px', gap: 5 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.color, boxShadow: s.glow ? `0 0 4px ${s.glow}` : 'none', animation: s.glow ? 'pulse 2s infinite' : 'none', flexShrink: 0 }}></div>
                          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: s.color }}>{s.label} — {task.progress}%</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 11, color: t.textSecondary }}>{task.start} / {task.end}</td>
                    <td style={{ padding: '14px 16px', fontFamily: "'DM Mono', monospace", fontSize: 10, color: t.textSecondary }}>{task.duration}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {task.deps.length > 0 ? task.deps.map(d => (
                        <span key={d} style={{ display: 'inline-block', padding: '2px 7px', background: t.surface2, border: `1px solid ${t.border}`, borderRadius: 4, fontFamily: "'DM Mono', monospace", fontSize: 9, color: t.textMuted, marginRight: 3 }}>{d}</span>
                      )) : <span style={{ fontSize: 10, color: t.textMuted }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <footer style={{ padding: '10px 32px', borderTop: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', flexShrink: 0, background: t.bg }}>
          <span style={{ fontSize: 10, color: t.textMuted, letterSpacing: '0.1em' }}>SENTIENT V0.1 — MVP</span>
          <span style={{ fontSize: 10, color: t.textMuted, letterSpacing: '0.1em' }}>Showing {filtered.length} of {tasks.length} tasks</span>
        </footer>

      </div>
    </>
  );
}