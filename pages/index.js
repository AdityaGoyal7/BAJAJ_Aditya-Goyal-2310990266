import { useState } from 'react';
import Head from 'next/head';

const DEFAULT_INPUT = `A->B, A->C, B->D, C->E, E->F, X->Y, Y->Z, Z->X, P->Q, Q->R, G->H, G->H, G->I, hello, 1->2, A->`;

function TreeNode({ label, children, isLast, depth }) {
  const hasKids = children && Object.keys(children).length > 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 22, height: 22, borderRadius: 6,
          background: depth === 0 ? '#1d4ed8' : '#dbeafe',
          color: depth === 0 ? '#fff' : '#1d4ed8',
          fontSize: '0.72rem', fontWeight: 700,
          fontFamily: "'JetBrains Mono', monospace",
          flexShrink: 0,
        }}>{label}</span>
        {hasKids && <span style={{ fontSize: '0.7rem', color: '#93c5fd' }}>▾</span>}
      </div>
      {hasKids && (
        <div style={{ paddingLeft: 14, borderLeft: '2px solid #dbeafe', marginLeft: 10, marginTop: 2, marginBottom: 2 }}>
          {Object.entries(children).map(([k, v], i, arr) => (
            <TreeNode key={k} label={k} children={v} isLast={i === arr.length - 1} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function renderTree(treeObj) {
  return Object.entries(treeObj).map(([key, val]) => (
    <TreeNode key={key} label={key} children={val} isLast depth={0} />
  ));
}

export default function Home() {
  const [input, setInput]     = useState(DEFAULT_INPUT);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setResult(null); setLoading(true);
    const data = input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    try {
      const res = await fetch('/api/bfhl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setResult(await res.json());
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>BFHL · Node Hierarchy Analyser</title>
        <meta name="description" content="Chitkara Full Stack Engineering Challenge — POST /bfhl" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
      </Head>

      <div className="root">

        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">B</div>
            <span className="logo-text">BFHL</span>
          </div>
          <nav className="sidebar-nav">
            <a className="nav-item active" href="#">
              <span className="nav-icon">⬡</span> Analyser
            </a>
          </nav>
          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">AG</div>
              <div className="user-info">
                <span className="user-name">Aditya Goyal</span>
                <span className="user-roll">2310990266</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">

          {/* top bar */}
          <header className="topbar">
            <div>
              <h1 className="page-title">Node Hierarchy Analyser</h1>
              <p className="page-sub">Chitkara Full Stack Challenge · Round 1</p>
            </div>
            <span className="topbar-badge">POST /bfhl</span>
          </header>

          {/* input section */}
          <section className="section">
            <form onSubmit={handleSubmit}>
              <label className="field-label">
                Node Edges <span className="field-hint">— comma or newline separated</span>
              </label>
              <textarea
                className="textarea"
                rows={4}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="A->B, A->C, B->D ..."
              />
              <button type="submit" className="btn" disabled={loading}>
                {loading
                  ? <><span className="spinner" />Processing…</>
                  : <>Run Analysis →</>}
              </button>
            </form>
          </section>

          {error && (
            <div className="error-bar">
              <span>⚠</span> {error}
            </div>
          )}

          {result && (
            <>
              {/* stats strip */}
              <div className="stats-strip">
                <div className="stat">
                  <span className="stat-val blue">{result.summary.total_trees}</span>
                  <span className="stat-key">Trees</span>
                </div>
                <div className="stat-divider" />
                <div className="stat">
                  <span className="stat-val red">{result.summary.total_cycles}</span>
                  <span className="stat-key">Cycles</span>
                </div>
                <div className="stat-divider" />
                <div className="stat">
                  <span className="stat-val blue">{result.summary.largest_tree_root || '—'}</span>
                  <span className="stat-key">Deepest Root</span>
                </div>
                <div className="stat-divider" />
                <div className="stat">
                  <span className="stat-val sm">{result.user_id}</span>
                  <span className="stat-key" style={{ textTransform: 'none', letterSpacing: 'normal', color: '#64748b', fontSize: '0.72rem', marginTop: '2px' }}>{result.email_id}</span>
                  <span className="stat-key" style={{ marginTop: '2px' }}>{result.college_roll_number}</span>
                </div>
              </div>

              {/* flags */}
              {(result.invalid_entries.length > 0 || result.duplicate_edges.length > 0) && (
                <section className="section flags-section">
                  <h2 className="section-title">Flagged Entries</h2>
                  <div className="flags-grid">
                    {result.invalid_entries.length > 0 && (
                      <div className="flag-block">
                        <div className="flag-head red">
                          <span className="flag-dot" />
                          Invalid <span className="flag-count">{result.invalid_entries.length}</span>
                        </div>
                        <div className="pills">
                          {result.invalid_entries.map((e, i) => (
                            <span key={i} className="pill pill-red">{e || '∅'}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.duplicate_edges.length > 0 && (
                      <div className="flag-block">
                        <div className="flag-head amber">
                          <span className="flag-dot amber" />
                          Duplicates <span className="flag-count">{result.duplicate_edges.length}</span>
                        </div>
                        <div className="pills">
                          {result.duplicate_edges.map((e, i) => (
                            <span key={i} className="pill pill-amber">{e}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* hierarchies */}
              <section className="section">
                <h2 className="section-title">
                  Hierarchies
                  <span className="count-badge">{result.hierarchies.length}</span>
                </h2>
                <div className="hier-grid">
                  {result.hierarchies.map((h, i) => (
                    <div key={i} className={`hier-card ${h.has_cycle ? 'cycle' : 'tree'}`}>
                      <div className="card-top">
                        <div className="root-badge">{h.root}</div>
                        <span className={`status-pill ${h.has_cycle ? 'cycle' : 'tree'}`}>
                          {h.has_cycle ? '⟳ Cycle' : `Depth ${h.depth}`}
                        </span>
                      </div>
                      {!h.has_cycle && h.tree && Object.keys(h.tree).length > 0 && (
                        <div className="card-tree">{renderTree(h.tree)}</div>
                      )}
                      {h.has_cycle && (
                        <p className="cycle-note">Cyclic structure — no linear tree</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* raw json */}
              <section className="section">
                <details className="raw-details">
                  <summary>View Raw JSON Response</summary>
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </details>
              </section>
            </>
          )}
        </main>
      </div>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #f8faff;
          color: #0f172a;
          min-height: 100vh;
        }

        /* ── LAYOUT ── */
        .root {
          display: flex;
          min-height: 100vh;
        }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          background: #1d4ed8;
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          position: sticky;
          top: 0;
          height: 100vh;
        }

        .sidebar-logo {
          display: flex; align-items: center; gap: 10px;
          margin-bottom: 36px; padding: 0 4px;
        }
        .logo-mark {
          width: 32px; height: 32px; border-radius: 8px;
          background: #fff; color: #1d4ed8;
          font-weight: 800; font-size: 1rem;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text { color: #fff; font-weight: 800; font-size: 1.1rem; letter-spacing: -0.5px; }

        .sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 8px;
          color: #93c5fd; font-size: 0.85rem; font-weight: 500;
          text-decoration: none; transition: background .15s, color .15s;
          cursor: pointer;
        }
        .nav-item:hover { background: rgba(255,255,255,.1); color: #fff; }
        .nav-item.active { background: rgba(255,255,255,.15); color: #fff; font-weight: 600; }
        .nav-icon { font-size: 1rem; }

        .sidebar-footer { border-top: 1px solid rgba(255,255,255,.15); padding-top: 16px; }
        .user-chip { display: flex; align-items: center; gap: 10px; }
        .user-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: #fff; color: #1d4ed8;
          font-size: 0.72rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .user-info { display: flex; flex-direction: column; min-width: 0; }
        .user-name { color: #fff; font-size: 0.82rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .user-roll { color: #93c5fd; font-size: 0.7rem; font-family: 'JetBrains Mono', monospace; }

        /* ── MAIN ── */
        .main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* TOPBAR */
        .topbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 32px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap; gap: 10px;
        }
        .page-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
        .page-sub   { font-size: 0.78rem; color: #64748b; margin-top: 2px; }
        .topbar-badge {
          background: #eff6ff; color: #1d4ed8;
          border: 1px solid #bfdbfe;
          border-radius: 6px; padding: 4px 12px;
          font-size: 0.75rem; font-weight: 700;
          font-family: 'JetBrains Mono', monospace;
        }

        /* SECTION */
        .section {
          padding: 24px 32px;
          border-bottom: 1px solid #f1f5f9;
        }

        /* FIELD */
        .field-label { display: block; font-weight: 700; font-size: 0.88rem; margin-bottom: 8px; }
        .field-hint  { font-weight: 400; color: #94a3b8; font-size: 0.78rem; }

        .textarea {
          width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px;
          padding: 12px 14px; font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem; color: #0f172a; background: #f8faff;
          resize: vertical; outline: none; transition: border-color .2s;
          line-height: 1.7;
        }
        .textarea:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,.1); }

        .btn {
          margin-top: 12px;
          padding: 11px 28px;
          background: #1d4ed8; color: #fff;
          border: none; border-radius: 8px;
          font-size: 0.9rem; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px;
          transition: background .2s, transform .15s;
          box-shadow: 0 2px 8px rgba(29,78,216,.3);
        }
        .btn:hover:not(:disabled) { background: #1e40af; transform: translateY(-1px); }
        .btn:disabled { opacity: .55; cursor: not-allowed; }

        .spinner {
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
          border-radius: 50%; animation: spin .65s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ERROR */
        .error-bar {
          margin: 0 32px 0;
          background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
          border-radius: 8px; padding: 12px 16px;
          font-size: 0.86rem; font-weight: 500;
          display: flex; align-items: center; gap: 8px;
        }

        /* STATS STRIP */
        .stats-strip {
          display: flex; align-items: center;
          padding: 0 32px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
          gap: 0;
        }
        .stat {
          display: flex; flex-direction: column; align-items: center;
          padding: 16px 28px; gap: 3px;
        }
        .stat-divider { width: 1px; background: #e2e8f0; height: 36px; flex-shrink: 0; }
        .stat-val { font-size: 1.4rem; font-weight: 800; letter-spacing: -0.5px; line-height: 1; }
        .stat-val.blue { color: #1d4ed8; }
        .stat-val.red  { color: #dc2626; }
        .stat-val.sm   { font-size: 0.82rem; letter-spacing: 0; font-family: 'JetBrains Mono', monospace; }
        .stat-key { font-size: 0.68rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }

        /* SECTION TITLE */
        .section-title {
          font-size: 0.9rem; font-weight: 700; color: #0f172a;
          margin-bottom: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .count-badge {
          background: #eff6ff; color: #1d4ed8;
          border-radius: 99px; padding: 1px 8px;
          font-size: 0.72rem; font-weight: 700;
        }

        /* FLAGS */
        .flags-section { background: #fffbeb; border-color: #fef3c7; }
        .flags-grid { display: flex; flex-wrap: wrap; gap: 16px; }
        .flag-block { display: flex; flex-direction: column; gap: 8px; min-width: 180px; }
        .flag-head {
          display: flex; align-items: center; gap: 6px;
          font-size: 0.78rem; font-weight: 700; color: #0f172a;
        }
        .flag-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #dc2626; flex-shrink: 0;
        }
        .flag-dot.amber { background: #d97706; }
        .flag-count {
          background: #fee2e2; color: #dc2626;
          border-radius: 99px; padding: 0 6px;
          font-size: 0.68rem;
        }
        .flag-head.amber .flag-count { background: #fef3c7; color: #92400e; }
        .pills { display: flex; flex-wrap: wrap; gap: 5px; }
        .pill {
          padding: 2px 9px; border-radius: 5px;
          font-family: 'JetBrains Mono', monospace; font-size: 0.76rem; font-weight: 600;
        }
        .pill-red   { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
        .pill-amber { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }

        /* HIER GRID */
        .hier-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
          gap: 12px;
        }

        .hier-card {
          border-radius: 12px;
          padding: 16px;
          border: 1.5px solid #e2e8f0;
          background: #fff;
          transition: box-shadow .2s, transform .2s;
        }
        .hier-card:hover { box-shadow: 0 4px 16px rgba(29,78,216,.1); transform: translateY(-1px); }
        .hier-card.tree  { border-color: #bfdbfe; }
        .hier-card.cycle { border-color: #fecaca; background: #fff9f9; }

        .card-top {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 12px; gap: 6px;
        }
        .root-badge {
          width: 32px; height: 32px; border-radius: 8px;
          background: #1d4ed8; color: #fff;
          font-size: 0.95rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          font-family: 'JetBrains Mono', monospace;
          flex-shrink: 0;
        }
        .hier-card.cycle .root-badge { background: #dc2626; }

        .status-pill {
          border-radius: 99px; padding: 2px 9px;
          font-size: 0.68rem; font-weight: 700;
          white-space: nowrap;
        }
        .status-pill.tree  { background: #eff6ff; color: #1d4ed8; }
        .status-pill.cycle { background: #fef2f2; color: #dc2626; }

        .card-tree { border-top: 1px solid #f1f5f9; padding-top: 10px; }
        .cycle-note { font-size: 0.76rem; color: #94a3b8; font-style: italic; border-top: 1px solid #fef2f2; padding-top: 10px; line-height: 1.5; }

        /* RAW JSON */
        .raw-details {
          border: 1px solid #e2e8f0; border-radius: 10px;
          padding: 14px 18px; background: #fff;
        }
        .raw-details summary {
          font-size: 0.82rem; font-weight: 600; color: #1d4ed8;
          cursor: pointer; user-select: none;
        }
        .raw-details pre {
          margin-top: 12px; font-family: 'JetBrains Mono', monospace;
          font-size: 0.73rem; color: #334155;
          background: #f8faff; border-radius: 8px;
          padding: 14px; overflow-x: auto;
          white-space: pre-wrap; word-break: break-all; line-height: 1.7;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .sidebar { display: none; }
          .topbar  { padding: 16px 20px; }
          .section { padding: 20px; }
          .stats-strip { padding: 0 20px; }
          .error-bar   { margin: 0 20px; }
          .stat { padding: 14px 16px; }
          .hier-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .hier-grid { grid-template-columns: 1fr; }
          .stats-strip { flex-direction: column; align-items: flex-start; }
          .stat-divider { width: 100%; height: 1px; }
          .stat { align-items: flex-start; padding: 10px 0; }
        }
      `}</style>
    </>
  );
}
