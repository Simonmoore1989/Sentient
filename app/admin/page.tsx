'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const ADMIN_EMAIL = 'flooklimited@outlook.com';

type AuthUser = {
  id: string;
  email: string | null | undefined;
  created_at: string;
  last_sign_in_at: string | null;
};

type Shutdown = {
  id: string;
  client: string;
  revision: string;
  created_at: string;
  user_id: string;
};

export default function Admin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [shutdowns, setShutdowns] = useState<Shutdown[]>([]);
  const [createModal, setCreateModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(saved === 'true');

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== ADMIN_EMAIL) {
          router.replace('/login');
          return;
        }
        await Promise.allSettled([loadUsers(), loadShutdowns()]);
      } catch {
        router.replace('/login');
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin?type=users');
      const json = await res.json();
      console.log('[admin] loadUsers response:', json);
      if (json.error) {
        console.error('[admin] loadUsers error:', json.error);
      }
      if (json.users) {
        console.log('[admin] users loaded:', json.users.length);
        setUsers(json.users);
      }
    } catch (err) {
      console.error('[admin] loadUsers fetch failed:', err);
    }
  }

  async function loadShutdowns() {
    try {
      const res = await fetch('/api/admin?type=shutdowns');
      const json = await res.json();
      console.log('[admin] loadShutdowns response:', json);
      if (json.error) {
        console.error('[admin] loadShutdowns error:', json.error);
      }
      if (json.shutdowns) {
        console.log('[admin] shutdowns loaded:', json.shutdowns.length);
        setShutdowns(json.shutdowns);
      }
    } catch (err) {
      console.error('[admin] loadShutdowns fetch failed:', err);
    }
  }

  async function handleCreateUser() {
    if (!newEmail || !newPassword) return;
    setCreating(true);
    setCreateError('');
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword }),
    });
    const json = await res.json();
    setCreating(false);
    if (json.error) {
      setCreateError(json.error);
    } else {
      setCreateModal(false);
      setNewEmail('');
      setNewPassword('');
      await loadUsers();
    }
  }

  async function handleDeleteUser(userId: string) {
    if (!confirm('Delete this user and all their data?')) return;
    setDeletingId(userId);
    await fetch('/api/admin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setDeletingId(null);
    await loadUsers();
  }

  function toggleDark() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  }

  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  }

  function getUserEmail(userId: string | null | undefined) {
    if (!userId) return '—';
    const email = users.find(u => u.id === userId)?.email;
    if (email) return email;
    return userId.slice(0, 8) + '...';
  }

  const th = darkMode ? {
    bg: '#080C0F', surface: '#0E1419', surface2: '#141B22',
    border: '#1E2A35', textPrimary: '#E8EDF2', textSecondary: '#5A7080', textMuted: '#2E4050',
  } : {
    bg: '#F4F6F8', surface: '#FFFFFF', surface2: '#EDF0F3',
    border: '#D8DEE5', textPrimary: '#0D1318', textSecondary: '#4A5D6B', textMuted: '#8FA0AE',
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: th.bg, display: 'grid', placeItems: 'center', fontFamily: "'Space Grotesk', sans-serif", color: th.textMuted }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600&display=swap');`}</style>
        <span style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Verifying access...</span>
      </div>
    );
  }

  const statCard = (label: string, value: string | number, color: string) => (
    <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted, fontFamily: "'Space Grotesk', sans-serif" }}>{label}</div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color }}>{value}</div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
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
        .row-hover:hover { background: ${th.surface2} !important; }
        .delete-btn:hover { border-color: #E05A5A !important; color: #E05A5A !important; }
        input::placeholder { color: ${th.textMuted}; }
      `}</style>

      {/* Create User Modal */}
      {createModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'grid', placeItems: 'center', zIndex: 99999 }}
          onClick={() => { setCreateModal(false); setCreateError(''); }}>
          <div onClick={e => e.stopPropagation()} style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 12, padding: 28, width: '90%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: th.textPrimary, marginBottom: 6 }}>
                Create New User
              </div>
              <div style={{ fontSize: 10, color: th.textSecondary, lineHeight: 1.6, fontFamily: "'Space Grotesk', sans-serif" }}>
                The user will be created with email confirmation bypassed.
              </div>
            </div>
            <input
              type="email"
              placeholder="Email address"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              autoFocus
              style={{ background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8, padding: '12px 14px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: th.textPrimary, outline: 'none', width: '100%' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateUser()}
              style={{ background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8, padding: '12px 14px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, color: th.textPrimary, outline: 'none', width: '100%' }}
            />
            {createError && (
              <div style={{ fontSize: 10, color: '#E05A5A', fontFamily: "'Space Grotesk', sans-serif", background: 'rgba(224,90,90,0.08)', border: '1px solid rgba(224,90,90,0.2)', borderRadius: 6, padding: '8px 12px' }}>
                {createError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setCreateModal(false); setCreateError(''); }}
                style={{ flex: 1, padding: '10px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 8, color: th.textSecondary, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleCreateUser} disabled={!newEmail || !newPassword || creating}
                style={{ flex: 1, padding: '10px', background: newEmail && newPassword ? '#2ECC9A' : th.surface2, border: 'none', borderRadius: 8, color: newEmail && newPassword ? '#040D0A' : th.textMuted, fontFamily: "'Syne', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: newEmail && newPassword ? 'pointer' : 'not-allowed' }}>
                {creating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Space Grotesk', sans-serif", color: th.textPrimary, background: th.bg }}>

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
                Sentient <span style={{ color: th.textMuted, fontWeight: 400 }}>|</span> <span style={{ color: '#2ECC9A' }}>Admin</span>
              </span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '6px', fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#2ECC9A', whiteSpace: 'nowrap' }}>Execution Intelligence</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => router.push('/overview')}
              style={{ padding: '7px 14px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 6, color: th.textSecondary, fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
              ← Overview
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.textMuted }}>{darkMode ? 'Dark' : 'Light'}</span>
              <div onClick={toggleDark} style={{ width: 36, height: 20, background: darkMode ? th.surface2 : 'rgba(46,204,154,0.15)', border: `1px solid ${darkMode ? th.border : '#2ECC9A'}`, borderRadius: 100, position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
                <div style={{ position: 'absolute', top: 2, left: darkMode ? 2 : 16, width: 14, height: 14, borderRadius: '50%', background: darkMode ? th.textMuted : '#2ECC9A', transition: 'all 0.3s' }}></div>
              </div>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
              style={{ padding: '7px 14px', background: 'transparent', border: `1px solid rgba(224,90,90,0.3)`, borderRadius: 6, color: '#E05A5A', fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: 32, overflowY: 'auto' }}>

          {/* Page Title */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
              <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
              Platform Management
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: th.textPrimary }}>
              Admin <span style={{ color: '#2ECC9A' }}>Dashboard</span>
            </div>
          </div>

          {/* Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 480 }}>
            {statCard('Total Users', users.length, th.textPrimary)}
            {statCard('Total Shutdowns', shutdowns.length, '#2ECC9A')}
          </div>

          {/* Users Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Space Grotesk', sans-serif" }}>
                <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
                Registered Users
              </div>
              <button onClick={() => { setCreateModal(true); setCreateError(''); }}
                style={{ padding: '8px 16px', background: '#2ECC9A', border: 'none', borderRadius: 7, color: '#040D0A', fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                New User
              </button>
            </div>

            <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', padding: '10px 20px', borderBottom: `1px solid ${th.border}`, background: th.surface2 }}>
                {['Email', 'Created', 'Last Sign In', ''].map((h, i) => (
                  <div key={i} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted }}>{h}</div>
                ))}
              </div>
              {users.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: th.textMuted, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>No users found</div>
              ) : (
                users.map(user => (
                  <div key={user.id} className="row-hover"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', padding: '14px 20px', borderBottom: `1px solid ${th.border}`, alignItems: 'center', transition: 'background 0.15s' }}>
                    <div>
                      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 11, fontWeight: 500, color: th.textPrimary }}>{user.email ?? '—'}</div>
                      {user.email === ADMIN_EMAIL && (
                        <span style={{ fontSize: 8, color: '#2ECC9A', fontFamily: "'Syne', sans-serif", fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin</span>
                      )}
                    </div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: th.textSecondary }}>{fmtDate(user.created_at ?? null)}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: th.textSecondary }}>{fmtDate(user.last_sign_in_at)}</div>
                    <div>
                      {user.email !== ADMIN_EMAIL && (
                        <button
                          className="delete-btn"
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deletingId === user.id}
                          style={{ padding: '5px 10px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 5, color: th.textSecondary, fontFamily: "'Space Grotesk', sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s', opacity: deletingId === user.id ? 0.5 : 1 }}>
                          {deletingId === user.id ? '...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Shutdowns Section */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontFamily: "'Space Grotesk', sans-serif" }}>
              <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
              All Shutdowns
            </div>

            <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '10px 20px', borderBottom: `1px solid ${th.border}`, background: th.surface2 }}>
                {['Client', 'Revision', 'Created', 'Owner'].map((h, i) => (
                  <div key={i} style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 8, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: th.textMuted }}>{h}</div>
                ))}
              </div>
              {shutdowns.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: th.textMuted, fontFamily: "'Space Grotesk', sans-serif", fontSize: 11 }}>No shutdowns found</div>
              ) : (
                shutdowns.map(s => (
                  <div key={s.id} className="row-hover"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '14px 20px', borderBottom: `1px solid ${th.border}`, alignItems: 'center', transition: 'background 0.15s' }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 700, color: th.textPrimary }}>{s.client || '—'}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: '#2ECC9A', fontWeight: 600 }}>{s.revision || '—'}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: th.textSecondary }}>{fmtDate(s.created_at)}</div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, color: th.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {getUserEmail(s.user_id)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </main>

        <footer style={{ padding: '12px 32px', borderTop: `1px solid ${th.border}`, display: 'flex', justifyContent: 'space-between', flexShrink: 0, background: th.surface }}>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em', fontFamily: "'Space Grotesk', sans-serif" }}>SENTIENT V0.1 — MVP</span>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em', fontFamily: "'Space Grotesk', sans-serif" }}>ADMIN — PLATFORM MANAGEMENT</span>
        </footer>

      </div>
    </>
  );
}
