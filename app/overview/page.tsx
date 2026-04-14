'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Overview() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientName, setClientName] = useState('');
  const [revision, setRevision] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setClientName(localStorage.getItem('client') || 'Client');
    setRevision(localStorage.getItem('revision') || 'Revision');
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(saved === 'true');
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menu-container')) setMenuOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  }

  const th = darkMode ? {
    bg: '#080C0F', surface: '#0E1419', surface2: '#141B22',
    border: '#1E2A35', textPrimary: '#E8EDF2', textSecondary: '#5A7080', textMuted: '#2E4050',
  } : {
    bg: '#F4F6F8', surface: '#FFFFFF', surface2: '#EDF0F3',
    border: '#D8DEE5', textPrimary: '#0D1318', textSecondary: '#4A5D6B', textMuted: '#8FA0AE',
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W;
    canvas.height = H;
    const pad = { left: 32, right: 16, top: 16, bottom: 20 };
    const cW = W - pad.left - pad.right;
    const cH = H - pad.top - pad.bottom;
    function sCurve(t: number) { return 1 / (1 + Math.exp(-8 * (t - 0.5))); }
    function norm(t: number) { const lo = sCurve(0), hi = sCurve(1); return (sCurve(t) - lo) / (hi - lo); }
    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      const y = pad.top + cH - v * cH;
      ctx.beginPath(); ctx.strokeStyle = 'rgba(30,42,53,0.8)'; ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cW, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '9px DM Mono, monospace'; ctx.fillStyle = 'rgba(46,64,80,0.9)'; ctx.textAlign = 'right';
      ctx.fillText(Math.round(v * 100) + '%', pad.left - 6, y + 3);
    });
    const planned: { x: number; y: number }[] = [];
    for (let i = 0; i <= 100; i++) { const t = i / 100; planned.push({ x: pad.left + t * cW, y: pad.top + cH - norm(t) * cH }); }
    ctx.beginPath(); ctx.strokeStyle = 'rgba(90,112,128,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    planned.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke(); ctx.setLineDash([]);
    const todayT = 0.38, deficit = 0.09;
    const actual: { x: number; y: number }[] = [];
    for (let i = 0; i <= Math.round(todayT * 100); i++) {
      const t = i / 100; const p = norm(t); const a = Math.max(0, p - deficit * Math.sin(Math.PI * t));
      actual.push({ x: pad.left + t * cW, y: pad.top + cH - a * cH });
    }
    ctx.beginPath(); actual.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    for (let i = actual.length - 1; i >= 0; i--) ctx.lineTo(planned[i].x, planned[i].y);
    ctx.closePath(); ctx.fillStyle = 'rgba(224,90,90,0.08)'; ctx.fill();
    ctx.beginPath(); ctx.strokeStyle = '#4A9EE0'; ctx.lineWidth = 2;
    actual.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)); ctx.stroke();
    const last = actual[actual.length - 1];
    ctx.beginPath(); ctx.arc(last.x, last.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#4A9EE0'; ctx.fill();
    ctx.beginPath(); ctx.arc(last.x, last.y, 7, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(74,158,224,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.strokeStyle = 'rgba(46,204,154,0.4)'; ctx.lineWidth = 1;
    ctx.moveTo(last.x, pad.top); ctx.lineTo(last.x, pad.top + cH); ctx.stroke();
    ctx.font = '7px Syne, sans-serif'; ctx.fillStyle = '#2ECC9A'; ctx.textAlign = 'center';
    ctx.fillText('TODAY', last.x, pad.top - 4);
  }, [darkMode]);

  const card = (label: string, value: string, color: string, sub: string) => (
    <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 8, padding: '16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted }}>{label}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 9, color: th.textMuted, letterSpacing: '0.05em' }}>{sub}</div>
    </div>
  );

  const menuItems = [
    { label: 'Dashboard', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', path: '/dashboard' },
    { label: 'Upload New Schedule', icon: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12', path: '/' },
    { label: 'Reports', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', path: null },
    { label: 'Vendor Setup', icon: 'M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71', path: '/vendor-setup' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${th.bg}; }
        body::before {
          content: '';
          position: fixed; inset: 0;
          background-image:
            linear-gradient(rgba(46,204,154,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(46,204,154,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none; z-index: 0;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .menu-item:hover { background: ${th.surface2} !important; }
        .menu-item-danger:hover { background: rgba(224,90,90,0.08) !important; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'DM Mono', monospace", color: th.textPrimary, background: th.bg }}
        onClick={() => setMenuOpen(false)}>

        {/* Header */}
        <header style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${th.border}`, flexShrink: 0, background: th.surface }}>
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

          <div className="menu-container" style={{ position: 'relative' }}>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{ padding: '8px 10px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 6, color: th.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {menuOpen && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 60, right: 20, background: th.surface, border: `1px solid ${th.border}`, borderRadius: 8, padding: 6, minWidth: 200, zIndex: 99999, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {menuItems.map(item => (
                  <div key={item.label} className="menu-item"
                    onClick={() => { if (item.path) router.push(item.path); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 5, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: th.textSecondary, cursor: 'pointer' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={item.icon}/></svg>
                    {item.label}
                  </div>
                ))}
                <div style={{ height: 1, background: th.border, margin: '4px 0' }}></div>
                <div className="menu-item menu-item-danger" onClick={() => router.push('/')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 5, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E05A5A', cursor: 'pointer' }}>
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

        {/* Main */}
        <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto' }}>

          {/* Shutdown title */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
              Shutdown Overview
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: th.textPrimary }}>
              <span>{revision.slice(0, -4)}</span><span style={{ color: '#2ECC9A' }}>{revision.slice(-4)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              {[['12 May 06:00', 'Start'], ['19 May 18:00', 'Finish'], ['168 hrs', 'Duration'], ['1,840 hrs', 'Total Resource Hours']].map(([val, label]) => (
                <div key={label} style={{ fontSize: 10, color: th.textSecondary, letterSpacing: '0.1em' }}>
                  <strong style={{ color: th.textPrimary, fontWeight: 500 }}>{val}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* AI Briefing */}
          <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 8, padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 14, borderBottom: `1px solid ${th.border}`, marginBottom: 16 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ECC9A', boxShadow: '0 0 6px #2ECC9A', animation: 'pulse 2s infinite', flexShrink: 0 }}></div>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textPrimary }}>AI Briefing</span>
              <span style={{ fontSize: 9, color: th.textMuted, letterSpacing: '0.15em', marginLeft: 8 }}>EXECUTION INTELLIGENCE — COMING SOON</span>
              <button onClick={() => window.location.reload()} style={{ marginLeft: 'auto', padding: '4px 10px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 5, color: th.textSecondary, fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Refresh
              </button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: th.textPrimary, marginBottom: 8 }}>{getGreeting()}, welcome back.</div>
              <div style={{ fontSize: 11, color: th.textSecondary, lineHeight: 1.7, letterSpacing: '0.02em' }}>
                <span style={{ color: '#2ECC9A', fontWeight: 600 }}>{revision}</span> is underway for <span style={{ color: th.textPrimary }}>{clientName}</span>. You are currently <span style={{ color: '#E05A5A', fontWeight: 600 }}>22.4 hrs behind</span> planned schedule. Review the S-Curve below and use AI recommendations to reflow your schedule before entering the dashboard.
              </div>
            </div>
            <div style={{ opacity: 0.35, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {['T-005 SAG Mill delay impacting 3 downstream tasks — recommend pulling T-008 forward to Day 5.', 'Linkforce T2 overallocated Days 3–4. Consider redistributing 2 tasks to T3.', 'At current pace, final commissioning at risk by 14 hours. Schedule compression recommended.'].map((txt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 10, color: th.textSecondary, lineHeight: 1.5 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#2ECC9A', flexShrink: 0, marginTop: 5 }}></div>
                  {txt}
                </div>
              ))}
            </div>
            <div style={{ paddingTop: 14, borderTop: `1px solid ${th.border}` }}>
              <button disabled style={{ width: '100%', padding: '11px 16px', background: 'transparent', border: '1px solid #2ECC9A', borderRadius: 8, color: '#2ECC9A', fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'not-allowed', opacity: 0.35, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Reflow Schedule Based on AI Recommendations
              </button>
              <div style={{ fontSize: 9, color: th.textMuted, textAlign: 'center', marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Available once Execution Intelligence is active</div>
            </div>
          </div>

          {/* Stats */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
              Task Summary
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {card('Complete', '91', '#2ECC9A', '37% of total')}
              {card('In Progress', '44', '#4A9EE0', '18% of total')}
              {card('Delayed', '12', '#E05A5A', '5% of total')}
              {card('Yet To Start', '101', th.textSecondary, '41% of total')}
            </div>
          </div>

          {/* S-Curve */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
              S-Curve — Planned vs Actual
            </div>
            <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 8, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: th.textMuted, letterSpacing: '0.1em' }}>12 MAY</span>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: th.textMuted }}><div style={{ width: 18, height: 1, borderTop: '1.5px dashed #5A7080' }}></div>Planned</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: th.textMuted }}><div style={{ width: 18, height: 2, background: '#4A9EE0', borderRadius: 1 }}></div>Actual</div>
                </div>
                <span style={{ fontSize: 9, color: th.textMuted, letterSpacing: '0.1em' }}>19 MAY</span>
              </div>
              <div style={{ position: 'relative', height: 120 }}>
                <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
              </div>
              <div style={{ marginTop: 12, background: 'rgba(224,90,90,0.06)', border: '1px solid rgba(224,90,90,0.15)', borderRadius: 5, padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#E05A5A' }}>⚠ Schedule Deficit</span>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, color: '#E05A5A' }}>−22.4 hrs behind planned</span>
              </div>
            </div>
          </div>

          {/* Critical Path */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
              Critical Path
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'T-005', name: 'SAG Mill Liner Change', team: 'Linkforce T2', status: 'Delayed', color: '#E05A5A', bg: 'rgba(224,90,90,0.12)' },
                { id: 'T-003', name: 'Main Drive Bearing Replacement', team: 'Linkforce T1', status: 'In Progress', color: '#4A9EE0', bg: 'rgba(74,158,224,0.12)' },
                { id: 'T-012', name: 'Final Commissioning & Handover', team: 'Linkforce T3', status: 'Yet To Start', color: '#5A7080', bg: 'rgba(90,112,128,0.12)' },
              ].map(t => (
                <div key={t.id} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 6, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 9, color: th.textMuted, letterSpacing: '0.08em', fontFamily: "'DM Mono', monospace" }}>{t.id}</div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 600, color: th.textPrimary, marginTop: 2 }}>{t.name}</div>
                    <div style={{ fontSize: 9, color: th.textMuted, marginTop: 2 }}>{t.team}</div>
                  </div>
                  <div style={{ background: t.bg, color: t.color, fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4 }}>{t.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Enter Dashboard */}
          <button onClick={() => router.push('/dashboard')} style={{ width: '100%', padding: 15, background: '#2ECC9A', color: '#040D0A', border: 'none', borderRadius: 8, fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: 'pointer' }}>
            Enter Dashboard →
          </button>

        </main>

        <footer style={{ padding: '12px 32px', borderTop: `1px solid ${th.border}`, display: 'flex', justifyContent: 'space-between', flexShrink: 0, background: th.surface }}>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em' }}>SENTIENT V0.1 — MVP</span>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em' }}>SHUTDOWN PLANNING & EXECUTION PLATFORM</span>
        </footer>

      </div>
    </>
  );
}