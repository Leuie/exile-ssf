import React from 'react';
import { AlertTriangle, RefreshCw, RotateCcw } from 'lucide-react';

interface RouteErrorBoundaryProps {
  routeKey: string;
  children: React.ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class RouteErrorBoundary extends React.Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred in this module.'
    };
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (this.state.hasError && prevProps.routeKey !== this.props.routeKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  private handleReloadModule = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  private handleResetLocalUiCache = () => {
    try {
      const keysToClear: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (
          k.startsWith('exile_ssf_tool_grid_') ||
          k.startsWith('exile_ssf_last_char_') ||
          k === 'exile_ssf_synced_gear_vitals_v1'
        ) {
          keysToClear.push(k);
        }
      }
      keysToClear.forEach((k) => localStorage.removeItem(k));
    } catch {}
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 rounded-2xl border border-rose-500/40 bg-slate-950/95 shadow-2xl space-y-4 text-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Module Encountered an Error</h2>
              <p className="text-xs text-slate-400">
                This section crashed safely without taking down the rest of Exile SSF.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-rose-300 break-words">
            {this.state.errorMessage}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={this.handleReloadModule}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Module</span>
            </button>
            <button
              type="button"
              onClick={this.handleResetLocalUiCache}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              title="Clears layout and cached character UI state without touching Cloud data or POESESSID"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Local UI Cache</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
