import { useMemo, useState, useEffect } from 'react';
import { WashiProvider, WashiFrame, WashiUI } from '@washi-ui/react';
import { MockAdapter } from './adapters/MockAdapter';

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Washi UI</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      color: #e5e7eb;
    }

    main {
      text-align: center;
      padding: 2rem;
      max-width: 560px;
      width: 100%;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 1rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    h1 {
      margin: 0;
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.02em;
    }

    .tagline {
      margin: 0.75rem 0 2.5rem;
      font-size: 1.0625rem;
      color: #6b7280;
      line-height: 1.5;
    }

    .cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .card {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 1rem 1.25rem;
      background: #111;
      border: 1px solid #222;
      border-radius: 12px;
      color: #d1d5db;
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 500;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }

    .card:hover {
      border-color: #667eea;
      background: #13103a;
      color: #fff;
    }

    .badge {
      margin-top: 2.5rem;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: #111;
      border: 1px solid #222;
      border-radius: 100px;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #28ca41;
    }
  </style>
</head>
<body>
  <main>
    <div class="logo">
      <div class="logo-icon">📌</div>
      <h1>Washi</h1>
    </div>
    <p class="tagline">Pin-based HTML commenting for modern web apps.</p>
    <div class="cards">
      <a class="card" href="#">
        📖 Docs
      </a>
      <a class="card" href="#">
        ⭐ GitHub
      </a>
    </div>
    <div class="badge">
      <span class="dot"></span>
      v0.1.0 — open source
    </div>
  </main>
</body>
</html>`;

function trafficDot(color: string): React.CSSProperties {
  return {
    display: 'inline-block',
    width: 12,
    height: 12,
    borderRadius: '50%',
    backgroundColor: color,
    flexShrink: 0,
  };
}

export default function App() {
  const adapter = useMemo(() => new MockAdapter('washi-demo-comments'), []);
  const [editorCode, setEditorCode] = useState(DEFAULT_HTML);
  const [previewCode, setPreviewCode] = useState(DEFAULT_HTML);

  useEffect(() => {
    const t = setTimeout(() => setPreviewCode(editorCode), 800);
    return () => clearTimeout(t);
  }, [editorCode]);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Left pane — live preview with Washi overlay */}
      <div
        style={{
          flex: '1 1 50%',
          transform: 'translateZ(0)',
          overflow: 'hidden',
          borderRight: '1px solid #1a1a1a',
          position: 'relative',
        }}
      >
        <WashiProvider adapter={adapter}>
          <WashiFrame
            srcDoc={previewCode}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
          <WashiUI position="bottom-right" />
        </WashiProvider>
      </div>

      {/* Right pane — code editor */}
      <div
        style={{
          flex: '1 1 50%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
        }}
      >
        {/* Window chrome bar */}
        <div
          style={{
            backgroundColor: '#111',
            borderBottom: '1px solid #222',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <span style={trafficDot('#ff5f57')} />
          <span style={trafficDot('#ffbd2e')} />
          <span style={trafficDot('#28ca41')} />
          <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: 'auto' }}>
            index.html
          </span>
        </div>

        {/* Code textarea */}
        <textarea
          value={editorCode}
          onChange={(e) => setEditorCode(e.target.value)}
          spellCheck={false}
          style={{
            flex: 1,
            width: '100%',
            padding: '20px 24px',
            backgroundColor: '#0d0d0d',
            color: '#e5e7eb',
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, Monaco, monospace",
            fontSize: '0.8125rem',
            lineHeight: 1.7,
            border: 'none',
            outline: 'none',
            resize: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}
