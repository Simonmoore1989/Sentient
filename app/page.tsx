'use client';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [client, setClient] = useState('');
  const [revision, setRevision] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const router = useRouter();

  const isReady = client && revision && file;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.csv')) setFile(f);
  }

  const fieldStyle: React.CSSProperties = {
    fontFamily: "'Syne', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#5A7080',
    width: '100%',
    background: '#141B22',
    borderRadius: 8,
    padding: '12px 16px',
    outline: 'none',
    display: 'block',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

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
            linear-gradient(rgba(46,204,154,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(46,204,154,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none; z-index: 0;
        }
        input::placeholder {
          color: #5A7080;
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          text-align: center;
          opacity: 1;
        }
        input:hover, input:focus {
          border-color: rgba(46,204,154,0.5) !important;
          box-shadow: 0 0 0 3px rgba(46,204,154,0.08) !important;
        }
        .upload-box:hover {
          border-color: rgba(46,204,154,0.5) !important;
          box-shadow: 0 0 0 3px rgba(46,204,154,0.08) !important;
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'DM Mono', monospace", color: '#E8EDF2' }}>

        {/* Header */}
        <header style={{ padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1E2A35' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 36, height: 36, border: '1.5px solid #2ECC9A', borderRadius: 7, display: 'grid', placeItems: 'center', background: 'rgba(46,204,154,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#2ECC9A" strokeWidth="1.5">
                <path d="M8 2L14 5.5V10.5L8 14L2 10.5V5.5L8 2Z"/>
                <circle cx="8" cy="8" r="2" fill="#2ECC9A" stroke="none"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1.1 }}>Sentient</span>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#2ECC9A', whiteSpace: 'nowrap', lineHeight: 1.2 }}>Execution Intelligence</span>
            </div>
          </div>
        </header>

        {/* Main */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
          <div style={{ width: '100%', maxWidth: 480 }}>
            <div style={{ background: '#0E1419', border: '1px solid #1E2A35', borderRadius: 12, padding: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Client */}
              <input
                type="text"
                placeholder="CLIENT"
                value={client}
                onChange={e => setClient(e.target.value)}
                style={{
                  ...fieldStyle,
                  border: `1px solid ${client ? 'rgba(46,204,154,0.3)' : '#1E2A35'}`,
                }}
              />

              {/* Revision */}
              <input
                type="text"
                placeholder="REVISION"
                value={revision}
                onChange={e => setRevision(e.target.value)}
                style={{
                  ...fieldStyle,
                  border: `1px solid ${revision ? 'rgba(46,204,154,0.3)' : '#1E2A35'}`,
                }}
              />

              {/* CSV Upload */}
              <div
                style={{ position: 'relative' }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={e => e.target.files && setFile(e.target.files[0])}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 1 }}
                />
                <div
                  className="upload-box"
                  style={{
                    ...fieldStyle,
                    border: `1px dashed ${file ? 'rgba(46,204,154,0.3)' : dragOver ? '#2ECC9A' : '#1E2A35'}`,
                    color: file ? '#2ECC9A' : '#5A7080',
                    cursor: 'pointer',
                  }}
                >
                  {file ? file.name.toUpperCase() : 'SCHEDULE UPLOAD'}
                </div>
              </div>

              {/* Execute */}
              <button
                disabled={!isReady}
                onClick={() => {
  localStorage.setItem('client', client);
  localStorage.setItem('revision', revision);
  if (file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const idx = {
        wo: headers.findIndex(h => h.toLowerCase().includes('order')),
        op: headers.findIndex(h => h.toLowerCase().includes('operation')),
        name: headers.findIndex(h => h.toLowerCase().includes('name')),
        start: headers.findIndex(h => h.toLowerCase() === 'start'),
        finish: headers.findIndex(h => h.toLowerCase() === 'finish'),
        duration: headers.findIndex(h => h.toLowerCase().includes('duration')),
        crew: headers.findIndex(h => h.toLowerCase().includes('crew')),
        complete: headers.findIndex(h => h.toLowerCase().includes('complete')),
      };

      const rawRows = lines.slice(1).map(line => {
        const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));
        return {
          wo: idx.wo >= 0 ? cols[idx.wo] : '',
          op: idx.op >= 0 ? cols[idx.op] : '',
          name: idx.name >= 0 ? cols[idx.name] : '',
          start: idx.start >= 0 ? cols[idx.start] : '',
          end: idx.finish >= 0 ? cols[idx.finish] : '',
          duration: idx.duration >= 0 ? cols[idx.duration] : '',
          crew: idx.crew >= 0 ? cols[idx.crew] : '',
          complete: idx.complete >= 0 ? cols[idx.complete] : '0',
        };
      }).filter(r => r.wo && r.name);

      // Group into WO parents with op line children
      const woMap: Record<string, any> = {};
      const woOrder: string[] = [];

      rawRows.forEach(row => {
        const isParent = !row.op || row.op === '';
        if (isParent) {
          if (!woMap[row.wo]) {
            woOrder.push(row.wo);
            woMap[row.wo] = {
              wo: row.wo,
              name: row.name,
              start: row.start,
              end: row.end,
              duration: row.duration,
              crew: row.crew,
              complete: parseFloat(row.complete) || 0,
              ops: [],
            };
          }
        } else {
          if (!woMap[row.wo]) {
            woOrder.push(row.wo);
            woMap[row.wo] = {
              wo: row.wo,
              name: row.wo,
              start: row.start,
              end: row.end,
              duration: row.duration,
              crew: row.crew,
              complete: 0,
              ops: [],
            };
          }
          woMap[row.wo].ops.push({
            op: row.op,
            name: row.name,
            start: row.start,
            end: row.end,
            duration: row.duration,
            crew: row.crew,
            progress: Math.round(parseFloat(row.complete) || 0),
          });
        }
      });

      // Build final tasks array
      const tasks = woOrder.map((wo, i) => {
        const w = woMap[wo];
        const progress = Math.round(w.complete);
        const status = progress === 100 ? 'COMPLETE' : progress > 0 ? 'IN PROGRESS' : 'PENDING';
        return {
          id: `T-${String(i + 1).padStart(3, '0')}`,
          wo: w.wo,
          name: w.name,
          start: w.start,
          end: w.end,
          duration: w.duration,
          team: w.crew,
          progress,
          status,
          ops: w.ops,
        };
      });

      localStorage.setItem('tasks', JSON.stringify(tasks));

// Save to Supabase
const { data: shutdown } = await supabase
  .from('shutdowns')
  .insert({ client, revision })
  .select()
  .single();

if (shutdown) {
  const shutdownId = shutdown.id;
  localStorage.setItem('shutdownId', shutdownId);

  const supabaseTasks = tasks.map(t => ({
    ...t,
    shutdown_id: shutdownId,
    client,
    revision,
    ops: t.ops || [],
  }));

  await supabase.from('tasks').insert(supabaseTasks);
}

router.push('/overview');
    };
    reader.readAsText(file);
  }
}}
                style={{
                  ...fieldStyle,
                  border: isReady ? 'none' : '1px solid #1E2A35',
                  background: isReady ? '#2ECC9A' : '#141B22',
                  color: isReady ? '#040D0A' : '#5A7080',
                  cursor: isReady ? 'pointer' : 'not-allowed',
                }}
              >
                EXECUTE
              </button>

            </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{ padding: '20px 40px', borderTop: '1px solid #1E2A35', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, color: '#2E4050', letterSpacing: '0.15em' }}>SENTIENT V0.1 — MVP</span>
          <span style={{ fontSize: 10, color: '#2E4050', letterSpacing: '0.1em' }}>SHUTDOWN PLANNING & EXECUTION PLATFORM</span>
        </footer>

      </div>
    </>
  );
}