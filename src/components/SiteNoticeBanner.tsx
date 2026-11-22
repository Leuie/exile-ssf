import React, { useEffect, useState } from 'react';
import { AlertTriangle, ExternalLink, Megaphone, Sparkles, X } from 'lucide-react';
import type { SiteBannerConfig } from '../types';

const DISMISS_KEY = 'exile_ssf_dismissed_banner_v1';

const TONE_STYLES: Record<
  SiteBannerConfig['tone'],
  { wrap: string; icon: string; badge: string; btn: string }
> = {
  indigo: {
    wrap: 'bg-gradient-to-r from-indigo-950/95 via-slate-900/95 to-indigo-950/95 border-indigo-500/40 text-indigo-100',
    icon: 'text-indigo-300',
    badge: 'bg-indigo-500/20 border-indigo-400/40 text-indigo-200',
    btn: 'bg-indigo-600 hover:bg-indigo-500 text-white'
  },
  amber: {
    wrap: 'bg-gradient-to-r from-amber-950/95 via-slate-900/95 to-amber-950/95 border-amber-500/45 text-amber-100',
    icon: 'text-amber-300',
    badge: 'bg-amber-500/20 border-amber-400/40 text-amber-200',
    btn: 'bg-amber-500 hover:bg-amber-400 text-slate-950'
  },
  emerald: {
    wrap: 'bg-gradient-to-r from-emerald-950/95 via-slate-900/95 to-emerald-950/95 border-emerald-500/45 text-emerald-100',
    icon: 'text-emerald-300',
    badge: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200',
    btn: 'bg-emerald-600 hover:bg-emerald-500 text-white'
  },
  rose: {
    wrap: 'bg-gradient-to-r from-rose-950/95 via-slate-900/95 to-rose-950/95 border-rose-500/45 text-rose-100',
    icon: 'text-rose-300',
    badge: 'bg-rose-500/20 border-rose-400/40 text-rose-200',
    btn: 'bg-rose-600 hover:bg-rose-500 text-white'
  },
  holiday: {
    wrap: 'bg-gradient-to-r from-amber-950/90 via-purple-950/90 to-emerald-950/90 border-amber-400/50 text-amber-100',
    icon: 'text-amber-300',
    badge: 'bg-amber-400/20 border-amber-300/50 text-amber-200',
    btn: 'bg-amber-400 hover:bg-amber-300 text-slate-950'
  }
};

export const SiteNoticeBanner: React.FC = () => {
  const [banner, setBanner] = useState<SiteBannerConfig | null>(null);
  const [dismissedSig, setDismissedSig] = useState<string>(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/site-banner')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: any) => {
        if (!cancelled && d?.banner && d.banner.enabled && d.banner.message) {
          setBanner(d.banner);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!banner || !banner.enabled || !banner.message) return null;
  const sig = `${banner.message}::${banner.updatedAtIso || ''}`;
  if (dismissedSig === sig) return null;

  const st = TONE_STYLES[banner.tone] || TONE_STYLES.indigo;
  const Icon = banner.tone === 'rose' || banner.tone === 'amber' ? AlertTriangle : banner.tone === 'holiday' ? Sparkles : Megaphone;

  return (
    <div className={`w-full border-b px-4 py-2.5 text-xs shadow-md ${st.wrap}`}>
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Icon className={`w-4 h-4 shrink-0 ${st.icon}`} />
          <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-bold text-white">{banner.message}</span>
            {banner.subtext && <span className="opacity-85 text-[11px]">{banner.subtext}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {banner.linkUrl && (
            <a
              href={banner.linkUrl}
              target={banner.linkUrl.startsWith('http') ? '_blank' : undefined}
              rel={banner.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${st.btn}`}
            >
              <span>{banner.linkLabel || 'Learn More'}</span>
              {banner.linkUrl.startsWith('http') && <ExternalLink className="w-3 h-3" />}
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              setDismissedSig(sig);
              try {
                localStorage.setItem(DISMISS_KEY, sig);
              } catch {}
            }}
            aria-label="Dismiss notice"
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
