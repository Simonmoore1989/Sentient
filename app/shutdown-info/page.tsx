'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  {
    slug: 'contacts',
    label: 'Contact List',
    icon: (
      <>
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </>
    ),
  },
  {
    slug: 'training',
    label: 'Training Schedule',
    icon: (
      <>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <path d="M9 12h6M9 16h4"/>
      </>
    ),
  },
  {
    slug: 'bus',
    label: 'Bus Schedule',
    icon: (
      <>
        <rect x="3" y="4" width="18" height="13" rx="2"/>
        <path d="M3 9h18M3 13h18M8 19v2M16 19v2M8 17h-.01M16 17h-.01"/>
      </>
    ),
  },
  {
    slug: 'flights',
    label: 'Flight Times',
    icon: (
      <>
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
      </>
    ),
  },
  {
    slug: 'plant-map',
    label: 'Plant Map',
    icon: (
      <>
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </>
    ),
  },
  {
    slug: 'camp-map',
    label: 'Camp Map',
    icon: (
      <>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </>
    ),
  },
];

export default function ShutdownInfo() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [clientName, setClientName] = useState('');
  const [shutdownId, setShutdownId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});

  useEffect(() => {
    setClientName(localStorage.getItem('client') || 'Client');
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) setDarkMode(saved === 'true');
    loadShutdown();
  }, []);

  async function loadShutdown() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('shutdowns')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setShutdownId(data.id);
      checkUploaded(data.id);
    }
  }

  async function checkUploaded(sid: string) {
    // Try the DB table first
    const { data, error } = await supabase
      .from('shutdown_documents')
      .select('category, file_name')
      .eq('shutdown_id', sid);

    if (!error && data && data.length > 0) {
      const fileMap: Record<string, string> = {};
      for (const row of data) fileMap[row.category] = row.file_name;
      setUploadedFiles(fileMap);
      return;
    }

    // Fall back: list storage folders directly
    const results = await Promise.all(
      CATEGORIES.map(async (cat) => {
        const { data: files } = await supabase.storage
          .from('shutdown-docs')
          .list(`${sid}/${cat.slug}`);
        return { slug: cat.slug, file: files?.[0] ?? null };
      })
    );
    const fileMap: Record<string, string> = {};
    for (const r of results) {
      if (r.file) fileMap[r.slug] = r.file.name;
    }
    setUploadedFiles(fileMap);
  }

  async function handleUpload(slug: string, file: File) {
    if (!shutdownId) return;

    setUploading(prev => ({ ...prev, [slug]: true }));

    try {
      const storagePath = `${shutdownId}/${slug}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('shutdown-docs')
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError.message);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('shutdown-docs')
        .getPublicUrl(storagePath);

      const fileUrl = urlData.publicUrl;

      // Best-effort DB write — don't block the UI on it
      await supabase.from('shutdown_documents').delete()
        .eq('shutdown_id', shutdownId).eq('category', slug);
      const { error: dbError } = await supabase
        .from('shutdown_documents')
        .insert({ shutdown_id: shutdownId, category: slug, file_url: fileUrl, file_name: file.name });
      if (dbError) console.warn('shutdown_documents insert failed:', dbError.message);

      // UI always updates after a successful storage upload
      setUploadedFiles(prev => ({ ...prev, [slug]: file.name }));
    } finally {
      setUploading(prev => ({ ...prev, [slug]: false }));
    }
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
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .upload-card { transition: border-color 0.2s; }
        .upload-card:hover { border-color: rgba(46,204,154,0.25) !important; }
        .upload-btn:hover { border-color: #2ECC9A !important; color: #2ECC9A !important; background: rgba(46,204,154,0.06) !important; }
        .back-btn:hover { color: #2ECC9A !important; }
      `}</style>

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
                Sentient <span style={{ color: th.textMuted, fontWeight: 400 }}>|</span> {clientName}
              </span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '6px', fontWeight: 700, letterSpacing: '0.32em', textTransform: 'uppercase', color: '#2ECC9A', whiteSpace: 'nowrap' }}>Execution Intelligence</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: th.textMuted }}>{darkMode ? 'Dark' : 'Light'}</span>
              <div onClick={toggleDark} style={{ width: 36, height: 20, background: darkMode ? th.surface2 : 'rgba(46,204,154,0.15)', border: `1px solid ${darkMode ? th.border : '#2ECC9A'}`, borderRadius: 100, position: 'relative', cursor: 'pointer', transition: 'all 0.3s' }}>
                <div style={{ position: 'absolute', top: 2, left: darkMode ? 2 : 16, width: 14, height: 14, borderRadius: '50%', background: darkMode ? th.textMuted : '#2ECC9A', transition: 'all 0.3s' }}></div>
              </div>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} style={{ padding: '7px 14px', background: 'transparent', border: `1px solid rgba(224,90,90,0.3)`, borderRadius: 6, color: '#E05A5A', fontFamily: "'Space Grotesk', sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer' }}>
              Sign Out
            </button>
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', gap: 28, overflowY: 'auto' }}>

          {/* Back button */}
          <button
            className="back-btn"
            onClick={() => router.push('/overview')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: th.textSecondary, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0, width: 'fit-content', transition: 'color 0.2s' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back to Overview
          </button>

          {/* Page title */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#2ECC9A', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>
              <div style={{ width: 16, height: 1, background: '#2ECC9A' }}></div>
              Shutdown Documents
            </div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: th.textPrimary }}>
              Shutdown <span style={{ color: '#2ECC9A' }}>Information</span>
            </div>
            <div style={{ fontSize: 11, color: th.textSecondary, marginTop: 10, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.6 }}>
              Upload reference documents for field supervisors. Files are accessible from the Vendor Field view. Accepted formats: PDF and images.
            </div>
          </div>

          {/* Upload Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {CATEGORIES.map(cat => {
              const filename = uploadedFiles[cat.slug];
              const isUploaded = !!filename;
              const isLoading = uploading[cat.slug];

              return (
                <div
                  key={cat.slug}
                  className="upload-card"
                  style={{
                    background: th.surface,
                    border: `1px solid ${isUploaded ? 'rgba(46,204,154,0.3)' : th.border}`,
                    borderRadius: 10,
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Icon + title */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      display: 'grid',
                      placeItems: 'center',
                      background: isUploaded ? 'rgba(46,204,154,0.1)' : th.surface2,
                      border: `1px solid ${isUploaded ? 'rgba(46,204,154,0.2)' : th.border}`,
                      flexShrink: 0,
                      transition: 'all 0.2s',
                    }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isUploaded ? '#2ECC9A' : th.textSecondary} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {cat.icon}
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: th.textPrimary, letterSpacing: '0.02em', lineHeight: 1.3 }}>
                        {cat.label}
                      </div>
                      {isUploaded ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2ECC9A', boxShadow: '0 0 5px rgba(46,204,154,0.8)', flexShrink: 0 }}></div>
                          <span style={{ fontSize: 9, color: '#2ECC9A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Uploaded</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 9, color: th.textMuted, fontFamily: "'Space Grotesk', sans-serif", marginTop: 4, letterSpacing: '0.05em' }}>No file uploaded</div>
                      )}
                    </div>
                  </div>

                  {/* Filename display */}
                  {isUploaded && filename && (
                    <div style={{ padding: '7px 10px', background: 'rgba(46,204,154,0.06)', border: '1px solid rgba(46,204,154,0.15)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 7 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2ECC9A" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span style={{ fontSize: 10, color: th.textSecondary, fontFamily: "'Space Grotesk', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {filename}
                      </span>
                    </div>
                  )}

                  {/* Upload button */}
                  <label style={{ display: 'block', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      style={{ display: 'none' }}
                      disabled={isLoading}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(cat.slug, file);
                        e.target.value = '';
                      }}
                    />
                    <div
                      className="upload-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 7,
                        padding: '10px 14px',
                        background: 'transparent',
                        border: `1px solid ${th.border}`,
                        borderRadius: 7,
                        color: isLoading ? th.textMuted : th.textSecondary,
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 9,
                        fontWeight: 600,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase' as const,
                        transition: 'all 0.2s',
                        opacity: isLoading ? 0.5 : 1,
                        userSelect: 'none' as const,
                      }}
                    >
                      {isLoading ? (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                            <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                            <path d="M12 2a10 10 0 0110 10" strokeLinecap="round"/>
                          </svg>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                          </svg>
                          {isUploaded ? 'Replace File' : 'Upload File'}
                        </>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>

        </main>

        <footer style={{ padding: '12px 32px', borderTop: `1px solid ${th.border}`, display: 'flex', justifyContent: 'space-between', flexShrink: 0, background: th.surface }}>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em', fontFamily: "'Space Grotesk', sans-serif" }}>SENTIENT V0.1 — MVP</span>
          <span style={{ fontSize: 10, color: th.textMuted, letterSpacing: '0.1em', fontFamily: "'Space Grotesk', sans-serif" }}>SHUTDOWN PLANNING & EXECUTION PLATFORM</span>
        </footer>

      </div>
    </>
  );
}
