/**
 * App.js — Pipeline Studio
 * Clean, purposeful top bar. No fake OS chrome.
 */

import { PipelineToolbar } from './toolbar';
import { PipelineUI }      from './ui';
import { SubmitButton }    from './submit';
import './styles/app.css';

function App() {
  return (
    <div className="app">

      {/* ── Top navigation bar ── */}
      <header className="app__topbar">

        {/* Left: brand */}
        <div className="app__brand">
          <div className="app__brand-icon">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
              <rect x="8" y="1" width="5" height="5" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="1" y="8" width="5" height="5" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="8" y="8" width="5" height="5" rx="1.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
          <span className="app__brand-name">Pipeline Studio</span>
        </div>

        <div className="app__topbar-sep" />

        {/* Center: breadcrumb */}
        <div className="app__breadcrumb">
          <span className="app__breadcrumb-item app__breadcrumb-item--muted">Workspace</span>
          <span className="app__breadcrumb-chevron">›</span>
          <span className="app__breadcrumb-item">Untitled Pipeline</span>
        </div>

        <div className="app__spacer" />

        {/* Right: status + actions */}
        <div className="app__topbar-right">
          <div className="app__status">
            <span className="app__status-dot" />
            <span className="app__status-label">Draft</span>
          </div>
        </div>

      </header>

      {/* ── Horizontal node palette ── */}
      <PipelineToolbar />

      {/* ── Canvas ── */}
      <div className="app__canvas">
        <PipelineUI />
      </div>

      {/* ── Submit bar ── */}
      <SubmitButton />

    </div>
  );
}

export default App;