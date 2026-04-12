'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const vendors = [
  {
    id: 'linkforce',
    name: 'Linkforce',
    totalTasks: 12,
    teams: [
      { id: 'linkforce-t1', name: 'Linkforce T1', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 4 },
      { id: 'linkforce-t2', name: 'Linkforce T2', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 5 },
      { id: 'linkforce-t3', name: 'Linkforce T3', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 3 },
    ],
  },
  {
    id: 'dge',
    name: 'DGE',
    totalTasks: 8,
    teams: [
      { id: 'dge-t1', name: 'DGE T1', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 4 },
      { id: 'dge-t2', name: 'DGE T2', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 4 },
    ],
  },
  {
    id: 'warrikal',
    name: 'Warrikal',
    totalTasks: 9,
    teams: [
      { id: 'warrikal-t1', name: 'Warrikal T1', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 5 },
      { id: 'warrikal-t2', name: 'Warrikal T2', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 4 },
    ],
  },
  {
    id: 'bundara',
    name: 'Bundara Ropes',
    totalTasks: 6,
    teams: [
      { id: 'bundara-t1', name: 'Bundara Ropes T1', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 6 },
    ],
  },
  {
    id: 'srg',
    name: 'SRG Electrical',
    totalTasks: 10,
    teams: [
      { id: 'srg-t1', name: 'SRG Electrical T1', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 5 },
      { id: 'srg-t2', name: 'SRG Electrical T2', ds: 'DS Supervisor', ns: 'NS Supervisor', tasks: 5 },
    ],
  },
];

export default function VendorSetup() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [generatedLinks, setGeneratedLinks] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sentFlash, setSentFlash] = useState<string | null>(null);

  useEffect(() => {
    setClientName(localStorage.getItem('client') || 'Client');
  }, []);

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

  function generateLink(teamId: string) {
    const base = window.location.origin;
    setGeneratedLinks(prev => ({ ...prev, [teamId]: `${base}/vendor?team=${teamId}` }));
  }

  function copyLink(teamId: string) {
    navigator.clipboard.writeText(generatedLinks[teamId]);
    setCopiedId(teamId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getCombinedLink() {
    const base = window.location.origin;
    return `${base}/vendor?teams=${selectedTeams.join(',')}`;
  }

  function copyCombinedLink(role: string) {
    const link = getCombinedLink();
    navigator.clipboard.writeText(link);
    setSentFlash(`Link copied for ${role} supervisors — ${selectedTeams.length} team${selectedTeams.length > 1 ? 's' : ''}`);
    setTimeout(() => setSentFlash(null), 3000);
  }

  function sendPrompt(label: string) {
    setSentFlash(`✓ Update prompt sent to ${label}`);
    setTimeout(() => setSentFlash(null), 3000);
  }

  const menuItems = [
    { label: 'Overview', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', path: '/overview' },
    { label: 'Dashboard', icon: 'M3 3h18v18H3zM3 9h18M9 3v18', path: '/dashboard' },
    { label: 'Reports', icon: 'M22 12h-4l-3 9L9 3l-3 9H2', path: null },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080C0F; }
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
        .menu-item:hover { background: #141B22 !important; }
        .menu-item-danger:hover { background: rgba(224,90,90,0.08) !important; }
        .vendor-row:hover { background: rgba(255,255,255,0.01) !important; }
        .send-btn:hover { border-color: #2ECC9A !important; color: #2ECC9A !important; background: rgba(46,204,154,0.06) !important; }
      `}</style>

      {/* Flash */}
      {sentFlash && (
        <div style={{ position: 'fixed', bottom: selectedTeams.length > 0 ? 90 : 32, left: '50%', transform: 'translateX(-50%)', background: '#0E1419', border: '1px solid #2ECC9A', borderRadius: 8, padding: '10px 20px', fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#2ECC9A', zIndex: 99999, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', animation: 'fadeIn 0.3s ease', whiteSpace: 'nowrap' }}>
          {sentFlash}
        </div>
      )}

      {/* Bulk action bar */}
      {selectedTeams.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0E1419', borderTop: '1px solid #2ECC9A', padding: '14px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 9999, animation: 'fadeIn 0.2s ease' }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#2ECC9A' }}>
            {selectedTeams.length} team{selectedTeams.length > 1 ? 's' : ''} selected
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setSelectedTeams([])}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #1E2A35', borderRadius: 7, color: '#5A7080', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Clear
            </button>
            <button
              onClick={() => copyCombinedLink('DS')}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2ECC9A', borderRadius: 7, color: '#2ECC9A', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy Link — DS
            </button>
            <button
              onClick={() => copyCombinedLink('NS')}
              style={{ padding: '8px 16px', background: '#2ECC9A', border: 'none', borderRadius: 7, color: '#040D0A', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
              Copy Link — NS
            </button>
          </div>
        </div>
      )}

      <div
        style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'DM Mono', monospace", color: '#E8EDF2', paddingBottom: selectedTeams.length > 0 ? 80 : 0 }}
        onClick={() => setMenuOpen(false)}
      >

        {/* Header */}
        <header style={{ padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1E2A35', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, border: '1.5px solid #2ECC9A', borderRadius: 5, display: 'grid', placeItems: 'center', background: 'rgba(46,204,154,0.1)' }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="#2ECC9A" strokeWidth="1.5">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"/>
                <circle cx="8" cy="8" r="2" fill="#2ECC9A" stroke="none"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.1 }}>
                Sentient <span style={{ color: '#2E4050', fontWeight: 400 }}>|</span> {clientName}
              </span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '6px', fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#2ECC9A', whiteSpace: 'nowrap' }}>Execution Intelligence</span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              style={{ padding: '8px 10px', background: 'transparent', border: '1px solid #1E2A35', borderRadius: 6, color: '#5A7080', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            {menuOpen && (
              <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 60, right: 20, background: '#0E1419', border: '1px solid #1E2A35', borderRadius: 8, padding: 6, minWidth: 200, zIndex: 99999, boxShadow: '0 16px 48px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {menuItems.map(item => (
                  <div key={item.label} className="menu-item"
                    onClick={() => item.path && router.push(item.path)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 5, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5A7080', cursor: 'pointer' }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={item.icon}/></svg>
                    {item.label}
                  </div>
                ))}
                <div style={{ height: 1, background: '#1E2A35', margin: '4px 0' }}></div>
                <div className="menu-item menu-item-danger"
                  onClick={() => router.push('/')}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 5, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#E05A5A', cursor: 'pointer' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                  New Session
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Page title */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
              Vendor Setup
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: '#E8EDF2' }}>
              Vendor Supervision <span style={{ color: '#2ECC9A' }}>Access</span>
            </div>
            <div style={{ fontSize: 10, color: '#5A7080', marginTop: 8, lineHeight: 1.6 }}>
              Select teams and copy a combined access link to send to DS or NS supervisors. Each link covers all selected teams in one view.
            </div>
          </div>

          {/* Vendor list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {vendors.map(vendor => {
              const isExpanded = expandedVendors.includes(vendor.id);
              return (
                <div key={vendor.id} style={{ background: '#0E1419', border: '1px solid #1E2A35', borderRadius: 10, overflow: 'hidden' }}>

                  {/* Vendor header row */}
                  <div
                    className="vendor-row"
                    onClick={() => toggleVendor(vendor.id)}
                    style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', borderBottom: isExpanded ? '1px solid #1E2A35' : 'none' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.06em', color: '#E8EDF2' }}>{vendor.name}</div>
                      <span style={{ padding: '2px 10px', background: '#141B22', border: '1px solid #1E2A35', borderRadius: 100, fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A7080' }}>
                        {vendor.totalTasks} Tasks
                      </span>
                      <span style={{ padding: '2px 10px', background: '#141B22', border: '1px solid #1E2A35', borderRadius: 100, fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5A7080' }}>
                        {vendor.teams.length} Team{vendor.teams.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5A7080" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {/* Teams */}
                  {isExpanded && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {vendor.teams.map((team, idx) => {
                        const isSelected = selectedTeams.includes(team.id);
                        const hasLink = !!generatedLinks[team.id];
                        return (
                          <div key={team.id} style={{ padding: '16px 24px', borderBottom: idx < vendor.teams.length - 1 ? '1px solid #1E2A35' : 'none', display: 'flex', flexDirection: 'column', gap: 12, background: isSelected ? 'rgba(46,204,154,0.03)' : 'transparent', transition: 'background 0.15s' }}>

                            {/* Team top row */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div
                                  onClick={() => toggleTeam(team.id)}
                                  style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isSelected ? '#2ECC9A' : '#1E2A35'}`, background: isSelected ? '#2ECC9A' : 'transparent', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                                >
                                  {isSelected && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#040D0A" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', color: '#E8EDF2' }}>{team.name}</div>
                                  <div style={{ fontSize: 9, color: '#2E4050', marginTop: 1 }}>{team.tasks} tasks assigned</div>
                                </div>
                              </div>

                              {/* Generate / copy individual link */}
                              {!hasLink ? (
                                <button
                                  className="send-btn"
                                  onClick={() => generateLink(team.id)}
                                  style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #1E2A35', borderRadius: 6, color: '#5A7080', fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                                  Generate Link
                                </button>
                              ) : (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <div style={{ maxWidth: 180, background: '#141B22', border: '1px solid rgba(46,204,154,0.2)', borderRadius: 6, padding: '6px 10px', fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#2ECC9A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {generatedLinks[team.id]}
                                  </div>
                                  <button
                                    onClick={() => copyLink(team.id)}
                                    style={{ padding: '6px 10px', background: copiedId === team.id ? 'rgba(46,204,154,0.12)' : 'transparent', border: `1px solid ${copiedId === team.id ? '#2ECC9A' : '#1E2A35'}`, borderRadius: 6, color: copiedId === team.id ? '#2ECC9A' : '#5A7080', fontFamily: "'Syne', sans-serif", fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
                                    {copiedId === team.id ? '✓' : 'Copy'}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* DS and NS send buttons */}
                            <div style={{ display: 'flex', gap: 8, paddingLeft: 26 }}>
                              <button
                                className="send-btn"
                                onClick={() => sendPrompt(`${team.name} DS — ${team.ds}`)}
                                style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: '1px solid #1E2A35', borderRadius: 6, color: '#5A7080', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ color: '#2E4050', fontSize: 8 }}>DS</span>
                                <span style={{ flex: 1, textAlign: 'left', color: '#E8EDF2' }}>{team.ds}</span>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                              </button>
                              <button
                                className="send-btn"
                                onClick={() => sendPrompt(`${team.name} NS — ${team.ns}`)}
                                style={{ flex: 1, padding: '8px 12px', background: 'transparent', border: '1px solid #1E2A35', borderRadius: 6, color: '#5A7080', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                <span style={{ color: '#2E4050', fontSize: 8 }}>NS</span>
                                <span style={{ flex: 1, textAlign: 'left', color: '#E8EDF2' }}>{team.ns}</span>
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                              </button>
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Info box */}
          <div style={{ background: 'rgba(46,204,154,0.04)', border: '1px solid rgba(46,204,154,0.12)', borderRadius: 8, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2ECC9A" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <div style={{ fontSize: 10, color: '#5A7080', lineHeight: 1.7 }}>
              Select multiple teams using the checkboxes then copy a single combined link for DS or NS supervisors. One link gives access to all selected teams in a single field view.
            </div>
          </div>

        </main>

        {/* Footer */}
        <footer style={{ padding: '12px 32px', borderTop: '1px solid #1E2A35', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: '#2E4050', letterSpacing: '0.1em' }}>SENTIENT V0.1 — MVP</span>
          <span style={{ fontSize: 10, color: '#2E4050', letterSpacing: '0.1em' }}>SHUTDOWN PLANNING & EXECUTION PLATFORM</span>
        </footer>

      </div>
    </>
  );
}