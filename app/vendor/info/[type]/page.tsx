'use client';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const INFO_PAGES: Record<string, { label: string; icon: string }> = {
  contacts:  { label: 'Contact List',      icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  training:  { label: 'Training Schedule', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 12h6M9 16h4' },
  bus:       { label: 'Bus Schedule',      icon: 'M3 9h18M3 13h18M8 19v2M16 19v2' },
  flights:   { label: 'Flight Times',      icon: 'M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z' },
  'plant-map': { label: 'Plant Map',       icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 10m-3 0a3 3 0 106 0 3 3 0 00-6 0' },
  'camp-map':  { label: 'Camp Map',        icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2zM9 22V12h6v10' },
};

export default function InfoPage() {
  const router = useRouter();
  const params = useParams();
  const type = params?.type as string;
  const page = INFO_PAGES[type];

  const [darkMode, setDarkMode] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(saved === 'true');
  }, []);

  const th = darkMode ? {
    bg: '#080C0F', surface: '#0E1419', surface2: '#141B22',
    border: '#1E2A35', textPrimary: '#E8EDF2', textSecondary: '#5A7080', textMuted: '#2E4050',
  } : {
    bg: '#F4F6F8', surface: '#FFFFFF', surface2: '#EDF0F3',
    border: '#D8DEE5', textPrimary: '#0D1318', textSecondary: '#4A5D6B', textMuted: '#8FA0AE',
  };

  if (!page) {
    return (
      <div style={{ minHeight: '100vh', background: th.bg, display: 'grid', placeItems: 'center', color: th.textMuted, fontFamily: 'sans-serif' }}>
        Page not found
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: ${th.bg}; }
      `}</style>

      <div style={{ minHeight: '100vh', background: th.bg, fontFamily: "'Space Grotesk', sans-serif", color: th.textPrimary }}>

        {/* Header */}
        <div style={{ background: th.surface, borderBottom: `1px solid ${th.border}`, padding: '14px 16px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.back()}
            style={{ padding: '6px 8px', background: 'transparent', border: `1px solid ${th.border}`, borderRadius: 6, color: th.textSecondary, cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 20, height: 20, border: '1.5px solid #2ECC9A', borderRadius: 4, display: 'grid', placeItems: 'center', background: 'rgba(46,204,154,0.1)' }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="#2ECC9A" strokeWidth="1.5">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"/>
                <circle cx="8" cy="8" r="2" fill="#2ECC9A" stroke="none"/>
              </svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1, color: th.textPrimary }}>
                {page.label}
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2ECC9A' }}>Field Supervision</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 57px)', gap: 20, opacity: 0.5 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={th.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={page.icon}/>
          </svg>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, color: th.textSecondary, textAlign: 'center', letterSpacing: '0.05em' }}>
            {page.label}
          </div>
          <div style={{ fontSize: 10, color: th.textMuted, textAlign: 'center', lineHeight: 1.7, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: "'Space Grotesk', sans-serif" }}>
            Content coming soon
          </div>
        </div>

      </div>
    </>
  );
}
