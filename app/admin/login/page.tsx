'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

const ADMIN_EMAIL = 'flooklimited@outlook.com';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const th = {
    bg: '#080C0F', surface: '#0E1419', surface2: '#141B22',
    border: '#1E2A35', textPrimary: '#E8EDF2', textSecondary: '#5A7080', textMuted: '#2E4050',
  };

  async function handleSignIn() {
    if (!email || !password) return;
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.session) {
      setLoading(false);
      setError('Invalid email or password');
      return;
    }

    if (data.user.email !== ADMIN_EMAIL) {
      await supabase.auth.signOut();
      setLoading(false);
      setError('Access denied');
      return;
    }

    router.push('/admin');
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
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
        input::placeholder { color: #2E4050; }
        input:focus { border-color: rgba(46,204,154,0.4) !important; outline: none; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', fontFamily: "'Space Grotesk', sans-serif" }}>

        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div style={{ width: 48, height: 48, border: '1.5px solid #2ECC9A', borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(46,204,154,0.08)' }}>
            <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="#2ECC9A" strokeWidth="1.5">
              <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"/>
              <circle cx="8" cy="8" r="2" fill="#2ECC9A" stroke="none"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: th.textPrimary }}>Sentient</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#2ECC9A', marginTop: 2 }}>Admin Access</div>
          </div>
        </div>

        {/* Card */}
        <div style={{ width: '100%', maxWidth: 400, background: th.surface, border: `1px solid ${th.border}`, borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              style={{ background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8, padding: '12px 14px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 300, color: th.textPrimary, width: '100%', letterSpacing: '0.04em' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              style={{ background: th.surface2, border: `1px solid ${th.border}`, borderRadius: 8, padding: '12px 14px', fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 300, color: th.textPrimary, width: '100%', letterSpacing: '0.04em' }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 11, color: '#E05A5A', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.04em', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading || !email || !password}
            style={{ width: '100%', padding: 14, background: loading ? 'rgba(46,204,154,0.5)' : '#2ECC9A', border: 'none', borderRadius: 10, color: '#040D0A', fontFamily: "'Syne', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4 }}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div style={{ height: 1, background: th.border }}></div>

          <a href="/login" style={{ fontSize: 10, fontWeight: 300, color: th.textSecondary, textAlign: 'center', letterSpacing: '0.06em', textDecoration: 'none', cursor: 'pointer' }}>
            ← Back to main login
          </a>
        </div>

        <div style={{ marginTop: 32, fontSize: 9, fontWeight: 300, color: th.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Sentient V0.1 — Shutdown Planning & Execution
        </div>

      </div>
    </>
  );
}
