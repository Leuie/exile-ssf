import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Automatically recover when Cloudflare deploys fresh hashed JS chunks while a user has an older tab open
function triggerSafeReloadOnce(): boolean {
  try {
    const key = 'exile_ssf_chunk_reload_at';
    const last = Number(sessionStorage.getItem(key) || '0');
    const now = Date.now();
    if (now - last > 12000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
      return true;
    }
  } catch {
    window.location.reload();
    return true;
  }
  return false;
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  triggerSafeReloadOnce();
});

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error || 'Unexpected error');
    return { hasError: true, message: msg };
  }

  componentDidCatch(error: unknown) {
    const msg = error instanceof Error ? error.message : String(error || '');
    const isChunkError =
      /dynamically imported module|importing a module script|chunkloaderror|loading chunk|failed to fetch/i.test(
        msg
      );
    if (isChunkError) {
      triggerSafeReloadOnce();
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#090d16] text-slate-200 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full rounded-2xl border border-indigo-500/30 bg-slate-900/90 p-6 text-center space-y-4 shadow-2xl">
            <h1 className="text-lg font-bold text-white">Exile SSF Updated in the Background</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              A fresh version of Exile SSF was just deployed while this tab was open. Reloading will bring in the latest modules cleanly.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Reload Page Now
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
