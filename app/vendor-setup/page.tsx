'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function VendorSetup() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [vendors, setVendors] = useState<{ id: string; name: string; teams: { id: string; name: string }[] }[]>([]);
  const [expandedVendors, setExpandedVendors] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [sentFlash, setSentFlash] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState('default');
  const [promptMode, setPromptMode] = useState<'manual' | 'automatic'>('manual');
  const [promptInterval, setPromptInterval] = useState(2);
  const [emailModal, setEmailModal] = useState<{ role: string; link: string } | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setClientName(localStorage.getItem('client') || 'Client');
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(saved === 'true');
    loadVendors();
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register('/sw.js');
      setNotifPermission(Notification.permission);
    }
  }, []);

  async function loadVendors() {
    const { data: shutdownData } = await supabase
      .from('shutdowns')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!shutdownData) return;

    const { data: tasks } = await supabase
      .from('tasks')
      .select('team, ops')
      .eq('shutdown_id', shutdownData.id);

    if (!tasks) return;

    // Collect all unique team names from tasks and ops
    const teamSet = new Set<string>();
    tasks.forEach((task: any) => {
      if (task.team) teamSet.add(task.team);
      if (task.ops) {
        task.ops.forEach((op: any) => {
          if (op.crew) teamSet.add(op.crew);
        });
      }
    });

    // Group teams by vendor (everything except the last word e.g. "T1")
    const vendorMap: Record<string, string[]> = {};
    teamSet.forEach(team => {
      const parts = team.trim().split(' ');
      const vendorName = parts.slice(0, -1).join(' ');
      if (!vendorMap[vendorName]) vendorMap[vendorName] = [];
      if (!vendorMap[vendorName].includes(team)) {
        vendorMap[vendorName].push(team);
      }
    });

    // Sort teams within each vendor
    const vendorList = Object.entries(vendorMap).map(([vendorName, teams]) => ({
      id: vendorName.toLowerCase().replace(/\s+/g, '-'),
      name: vendorName,
      teams: teams.sort().map(t => ({ id: t, name: t })),
    }));

    setVendors(vendorList);
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

  async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      const reg = await navigator.serviceWorker.ready;
      await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY
      });
    }
  }

  function toggleVendor(vendorId: string) {
    setExpandedVendors(prev =>
      prev.includes(vendorId) ? prev.filter(v => v !== vendorId) : [...prev, vendorId]
    );
  }

  function toggleTeam(teamId: string) {
    setSelectedTeams(prev =>
      prev.includes(teamId) ? prev.filter(t => t !== teamId) : [...prev, teamId]
    );
  }

  function getCombinedLink(name?: string, role?: string) {
    const base = window.location.origin;
    const client = localStorage.getItem('client') || '';
    let url = `${base}/vendor?teams=${encodeURIComponent(selectedTeams.join(','))}`;
    if (client) url += `&client=${client}`;
    if (name) url += `&name=${encodeURIComponent(name)}`;
    if (role) url += `&role=${encodeURIComponent(role)}`;
    return url;
  }

  function openEmailModal(role: string) {
    setEmailInput('');
    setFirstName('');
    setLastName('');
    setEmailModal({ role, link: getCombinedLink() });
  }

  async function sendEmail() {
    if (!emailInput || !firstName) return;
    const link = getCombinedLink(firstName, emailModal?.role);

    const { data: shutdownData } = await supabase
      .from('shutdowns')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (shutdownData) {
      await supabase.from('supervisors').upsert({
        name: firstName,
        role: emailModal?.role || '',
        team: selectedTeams.join(','),
        push_token: null,
        shutdown_id: shutdownData.id,
      }, { onConflict: 'name,shutdown_id' });
    }

    setSentFlash(`✓ Link sent to ${firstName} — ${emailInput}`);
    setTimeout(() => setSentFlash(null), 3000);
    setEmailModal(null);
    setEmailInput('');
    setFirstName('');
    setLastName('');
  }

  const menuItems = [
    { label: 'Overview', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', path: '/overview' },
    { label: 'Dashboard', icon: 'M3 3h18v18H3zM3 9h18M9 3v18', path: '/dashboard' },
    { label: 'Reports', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', path: '/reports' },
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
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .menu-item:hover { background: ${th.surface2} !important; }
        .menu-item-danger:hover { background: rgba(224,90,90,0.08) !important; }
        .vendor-row:hover { background: ${th.surface2} !important; }
        .send-btn:hover { border-color: #2ECC9A !important; color: #2ECC9A !important; background: rgba(46,204,154,0.06) !important; }
        input::placeholder { color: ${th.textMuted}; }
        select option { background: ${th.surface2}; color: ${th.textPrimary}; }
      `}</style>

      {/* Email Modal */}
      {emailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'grid', placeItems: 'center', zIndex: 999999 }} onClick={() => setEmailModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 12, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', color: th.textPrimary, marginBottom: 6 }}>
                Send to {emailModal.role} Supervisor
              </div>
              <div style={{ fontSize: 10, color: th.textSecondary, lineHeight: 1.6 }}>
                Enter the supervisor's email address to send their field access link.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                autoFocus
                style={{ flex: 1, background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8, padding: '12px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: th.textPrimary, outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                style={{ flex: 1, background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8, padding: '12px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: th.textPrimary, outline: 'none' }}
              />
            </div>
            <input
              type="email"
              placeholder="supervisor@company.com"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendEmail()}
              style={{ background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8, padding: '12px 14px', fontFamily: "'DM Mono', monospace", fontSize: 11, color: th.textPrimary, outline: 'none', width: '100%' }}
            />
            {firstName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, background: th.surface2, border: `1px solid rgba(46,204,154,0.2)`, borderRadius: 6, padding: '8px 12px', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2ECC9A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {getCombinedLink(firstName, emailModal.role)}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(getCombinedLink(firstName, emailModal.role))}
                  style={{ padding: '8px 12px', background: 'rgba(46,204,154,0.1)', border: '1px solid rgba(46,204,154,0.3)', borderRadius: 6, color: '#2ECC9A', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  Copy
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setEmailModal(null)} style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 8, color: th.textSecondary, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={sendEmail} style={{ flex: 1, padding: '10px', background: emailInput ? '#2ECC9A' : th.surface2, border: 'none', borderRadius: 8, color: emailInput ? '#040D0A' : th.textMuted, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: emailInput ? 'pointer' : 'not-allowed' }}>
                Send Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flash */}
      {sentFlash && (
        <div style={{ position: 'fixed', bottom: selectedTeams.length > 0 ? 140 : 32, left: '50%', transform: 'translateX(-50%)', background: th.surface, border: '1px solid #2ECC9A', borderRadius: 8, padding: '10px 20px', fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2ECC9A', zIndex: 99999, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease', whiteSpace: 'nowrap' }}>
          {sentFlash}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedTeams.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: th.surface, borderTop: '1px solid #2ECC9A', padding: '16px 32px', display: 'flex', flexDirection: 'column', gap: 12, zIndex: 9999, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#2ECC9A' }}>
              {selectedTeams.length} team{selectedTeams.length > 1 ? 's' : ''} selected
            </span>
            <button onClick={() => setSelectedTeams([])} style={{ padding: '6px 14px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 7, color: th.textSecondary, fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Clear
            </button>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => openEmailModal('DS')} style={{ flex: 1, padding: '8px 16px', background: 'transparent', border: '1px solid #2ECC9A', borderRadius: 7, color: '#2ECC9A', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Send to DS
            </button>
            <button onClick={() => openEmailModal('NS')} style={{ flex: 1, padding: '8px 16px', background: '#2ECC9A', border: 'none', borderRadius: 7, color: '#040D0A', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Send to NS
            </button>
          </div>
        </div>
      )}

      <div
        style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'DM Mono', monospace", color: th.textPrimary, background: th.bg, paddingBottom: selectedTeams.length > 0 ? 160 : 0 }}
        onClick={() => setMenuOpen(false)}
      >
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
          <div style={{ position: 'relative' }}>
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} style={{ padding: '8px 10px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 6, color: th.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {menuOpen && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 60, right: 20, background: th.surface, border: `1px solid ${th.border}`, borderRadius: 8, padding: 6, minWidth: 200, zIndex: 99999, boxShadow: '0 16px 48px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {menuItems.map(item => (
                  <div key={item.label} className="menu-item" onClick={() => item.path && router.push(item.path)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 5, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: th.textSecondary, cursor: 'pointer' }}>
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

        {/* Main */}
        <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
              Vendor Setup
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: th.textPrimary }}>
              Vendor Supervision <span style={{ color: '#2ECC9A' }}>Access</span>
            </div>
            <div style={{ fontSize: 10, color: th.textSecondary, marginTop: 8, lineHeight: 1.6 }}>
              Select teams and send a combined access link to DS or NS supervisors.
            </div>
          </div>

          {/* Notification permission */}
          {notifPermission !== 'granted' && (
            <div style={{ background: 'rgba(74,158,224,0.06)', border: '1px solid rgba(74,158,224,0.2)', borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A9EE0" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                <div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#4A9EE0', marginBottom: 4 }}>Enable Push Notifications</div>
                  <div style={{ fontSize: 10, color: th.textSecondary, lineHeight: 1.6 }}>Allow Sentient to send update prompts to this device.</div>
                </div>
              </div>
              <button onClick={requestNotificationPermission} style={{ padding: '8px 16px', background: '#4A9EE0', border: 'none', borderRadius: 7, color: '#fff', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Enable
              </button>
            </div>
          )}

          {/* Notification settings */}
          {notifPermission === 'granted' && (
            <div style={{ background: 'rgba(46,204,154,0.06)', border: '1px solid rgba(46,204,154,0.15)', borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#2ECC9A', boxShadow: '0 0 6px #2ECC9A' }}></div>
                <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2ECC9A' }}>Push Notifications Enabled</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => setPromptMode('manual')} style={{ padding: '6px 16px', borderRadius: 100, border: `1px solid ${promptMode === 'manual' ? '#2ECC9A' : th.border}`, background: promptMode === 'manual' ? 'rgba(46,204,154,0.1)' : 'transparent', color: promptMode === 'manual' ? '#2ECC9A' : th.textSecondary, fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  Manual
                </button>
                <button onClick={() => setPromptMode('automatic')} style={{ padding: '6px 16px', borderRadius: 100, border: `1px solid ${promptMode === 'automatic' ? '#2ECC9A' : th.border}`, background: promptMode === 'automatic' ? 'rgba(46,204,154,0.1)' : 'transparent', color: promptMode === 'automatic' ? '#2ECC9A' : th.textSecondary, fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  Automatic
                </button>
                {promptMode === 'automatic' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                    <span style={{ fontSize: 9, color: th.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>Every</span>
                    <select value={promptInterval} onChange={e => setPromptInterval(Number(e.target.value))} style={{ background: th.surface2, border: '1px solid #2ECC9A', borderRadius: 6, padding: '6px 10px', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#2ECC9A', outline: 'none', cursor: 'pointer' }}>
                      {Array.from({ length: 24 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={h}>{h} {h === 1 ? 'hr' : 'hrs'}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div style={{ fontSize: 9, color: th.textSecondary, letterSpacing: '0.08em' }}>
                {promptMode === 'manual'
                  ? 'Prompts will only be sent when you tap Send to DS or Send to NS.'
                  : `Prompts will be sent automatically every ${promptInterval} ${promptInterval === 1 ? 'hour' : 'hours'} to selected teams.`}
              </div>
            </div>
          )}

          {/* Vendor list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vendors.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: th.textMuted, fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>
                No teams found — upload a schedule first
              </div>
            ) : (
              vendors.map(vendor => {
                const isExpanded = expandedVendors.includes(vendor.id);
                return (
                  <div key={vendor.id} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div className="vendor-row" onClick={() => toggleVendor(vendor.id)} style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: isExpanded ? `1px solid ${th.border}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.06em', color: th.textPrimary }}>{vendor.name}</div>
                        <span style={{ padding: '2px 10px', background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 100, fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.textSecondary }}>{vendor.teams.length} Team{vendor.teams.length > 1 ? 's' : ''}</span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={th.textSecondary} strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>

                    {isExpanded && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {vendor.teams.map((team, idx) => {
                          const isSelected = selectedTeams.includes(team.id);
                          return (
                            <div key={team.id} style={{ padding: '16px 24px', borderBottom: idx < vendor.teams.length - 1 ? `1px solid ${th.border}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isSelected ? 'rgba(46,204,154,0.03)' : 'transparent', transition: 'background 0.15s' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div onClick={() => toggleTeam(team.id)} style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isSelected ? '#2ECC9A' : th.border}`, background: isSelected ? '#2ECC9A' : 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}>
                                  {isSelected && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#040D0A" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: th.textPrimary }}>{team.name}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={{ background: 'rgba(46,204,154,0.04)', border: '1px solid rgba(46,204,154,0.12)', borderRadius: 8, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ECC9A" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div style={{ fontSize: 10, color: th.textSecondary, lineHeight: 1.7 }}>
              Select teams using the checkboxes then send a combined access link to DS or NS supervisors via email.
            </div>
          </div>

        </main>

        <footer style={{ padding: '12px 32px', borderTop: `1px solid ${th.border}`, display: 'flex', justifyContent: 'space-between', flexShrink: 0, background: th.surface }}>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em' }}>SENTIENT V0.1 — MVP</span>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em' }}>SHUTDOWN PLANNING & EXECUTION PLATFORM</span>
        </footer>

      </div>
    </>
  );
}