import React, { useEffect, useState } from 'react';
import {
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Edit3,
  Plus,
  Trash2,
  Save,
  X,
  MessageSquare
} from 'lucide-react';
import type {
  CommunityGatheringPlace,
  LeagueCommunityHubConfig
} from '../../../services/cloudSync';

export const PLATFORMS: CommunityGatheringPlace['platform'][] = [
  'Root',
  'Discord',
  'YouTube',
  'Twitch',
  'Website',
  'Guild',
  'Other'
];

export function isRavenwatchLeague(leagueId: string, leagueName?: string): boolean {
  const idLow = String(leagueId || '').toLowerCase();
  const nameLow = String(leagueName || '').toLowerCase();
  return (
    idLow === 'poe1-330-umbra' ||
    idLow === 'poe2-05-ancients' ||
    idLow.includes('ravenwatch') ||
    idLow.includes('noir') ||
    nameLow.includes('ravenwatch') ||
    nameLow.includes('noir')
  );
}

export function getDefaultCommunityHub(
  leagueId: string,
  leagueName?: string,
  fallbackGlobalChannel?: string
): LeagueCommunityHubConfig {
  if (isRavenwatchLeague(leagueId, leagueName)) {
    return {
      hubTitle: 'Ravenwatch and NOIR Guild Community Hub',
      badgeLabel: 'Official Gather Place',
      aboutText:
        'Ravenwatch is the chill community of ARPG and MMO gamers run by the NOIR guild, founded and created by Leuie in January 2018. The Ravenwatch server was established in February 2026 during the "Discord Exit". It welcomes gamers from all over the world to connect, laugh, and grow your circle in a positive, meaningful way.',
      globalChannel: fallbackGlobalChannel || '/global 5712',
      places: [
        {
          id: 'ravenwatch-root',
          platform: 'Root',
          badge: 'Official GSF Community',
          title: 'Ravenwatch on Root',
          description:
            'Primary gathering place for GSF coordination, trade requests, voice hangouts, and starter builds.',
          url: 'https://rootapp.gg/AC1NPUuJiQqlyDvGbgH-8A',
          ctaLabel: 'Join Ravenwatch'
        },
        {
          id: 'noir-hq',
          platform: 'Guild',
          badge: 'Guild Headquarters',
          title: 'NOIR Guild HQ',
          description:
            'The home of NOIR Guild. Connect with guild runners, officers, and community veterans on Root.',
          url: 'https://rootapp.gg/AC01VYpHiAq1rM0An8FDzw',
          ctaLabel: 'Open NOIR HQ'
        }
      ]
    };
  }

  // Neutral, customizable default for all other private leagues (zero Ravenwatch / NOIR / 5712 defaults)
  const cleanChannel =
    fallbackGlobalChannel && !/5712/.test(fallbackGlobalChannel)
      ? fallbackGlobalChannel
      : '';

  return {
    hubTitle: leagueName ? `${leagueName} Community & Gathering Hub` : 'League Community & Gathering Hub',
    badgeLabel: 'Gathering Places',
    aboutText: '',
    globalChannel: cleanChannel,
    places: []
  };
}

const getPlatformCardTheme = (platform: CommunityGatheringPlace['platform']) => {
  switch (platform) {
    case 'Root':
      return {
        card: 'border-emerald-800/60 bg-emerald-950/35 hover:bg-emerald-900/45',
        badge: 'text-emerald-400',
        cta: 'text-emerald-300'
      };
    case 'Discord':
      return {
        card: 'border-indigo-700/60 bg-indigo-950/35 hover:bg-indigo-900/45',
        badge: 'text-indigo-400',
        cta: 'text-indigo-300'
      };
    case 'YouTube':
      return {
        card: 'border-rose-800/60 bg-rose-950/30 hover:bg-rose-900/40',
        badge: 'text-rose-400',
        cta: 'text-rose-300'
      };
    case 'Twitch':
      return {
        card: 'border-purple-800/60 bg-purple-950/35 hover:bg-purple-900/45',
        badge: 'text-purple-400',
        cta: 'text-purple-300'
      };
    case 'Guild':
      return {
        card: 'border-amber-800/50 bg-amber-950/25 hover:bg-amber-900/35',
        badge: 'text-amber-400',
        cta: 'text-amber-300'
      };
    default:
      return {
        card: 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80',
        badge: 'text-sky-400',
        cta: 'text-sky-300'
      };
  }
};

export interface CommunityHubSectionProps {
  hubConfig: LeagueCommunityHubConfig;
  collapsed: boolean;
  onToggleCollapse: () => void;
  canEdit: boolean;
  onSaveHub: (next: LeagueCommunityHubConfig) => Promise<boolean>;
  triggerCopy: (text: string, label: string) => void;
}

export const CommunityHubSection: React.FC<CommunityHubSectionProps> = ({
  hubConfig,
  collapsed,
  onToggleCollapse,
  canEdit,
  onSaveHub,
  triggerCopy
}) => {
  const [editing, setEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [draft, setDraft] = useState<LeagueCommunityHubConfig>(hubConfig);

  useEffect(() => {
    if (!editing) setDraft(hubConfig);
  }, [hubConfig, editing]);

  const handleAddPlace = () => {
    if (draft.places.length >= 4) return;
    setDraft((prev) => ({
      ...prev,
      places: [
        ...prev.places,
        {
          id: `place-${Date.now()}`,
          platform: 'Discord',
          badge: 'Community Server',
          title: '',
          description: '',
          url: '',
          ctaLabel: 'Open Link'
        }
      ]
    }));
  };

  const handleUpdatePlace = (
    idx: number,
    patch: Partial<CommunityGatheringPlace>
  ) => {
    setDraft((prev) => ({
      ...prev,
      places: prev.places.map((p, i) => (i === idx ? { ...p, ...patch } : p))
    }));
  };

  const handleRemovePlace = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      places: prev.places.filter((_, i) => i !== idx)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const cleaned: LeagueCommunityHubConfig = {
      hubTitle: draft.hubTitle.trim() || 'League Community & Gathering Hub',
      badgeLabel: draft.badgeLabel?.trim() || 'Official Gather Place',
      aboutText: draft.aboutText.trim(),
      globalChannel: draft.globalChannel.trim(),
      places: draft.places
        .map((p) => ({
          ...p,
          title: p.title.trim(),
          url: p.url.trim(),
          badge: p.badge.trim() || `${p.platform} Community`,
          description: p.description.trim(),
          ctaLabel: p.ctaLabel.trim() || `Open ${p.platform}`
        }))
        .filter((p) => p.title && p.url)
    };
    const ok = await onSaveHub(cleaned);
    setSaving(false);
    if (ok) {
      setEditing(false);
    }
  };

  const hasContent =
    Boolean(hubConfig.aboutText) ||
    hubConfig.places.length > 0 ||
    Boolean(hubConfig.globalChannel);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
            {hubConfig.hubTitle}
          </span>
          {hubConfig.badgeLabel && (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              {hubConfig.badgeLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                if (collapsed) onToggleCollapse();
                setEditing((v) => !v);
              }}
              className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
            >
              {editing ? <X className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              <span>{editing ? 'Cancel Edit' : 'Customize Hub & Chat'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-5 space-y-4">
          {editing ? (
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">
                    Community Hub Title
                  </label>
                  <input
                    type="text"
                    value={draft.hubTitle}
                    onChange={(e) => setDraft({ ...draft, hubTitle: e.target.value })}
                    placeholder="e.g. Squad Discord & Community Hub"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-amber-300 mb-1">
                    In Game Global Chat Channel (Optional)
                  </label>
                  <input
                    type="text"
                    value={draft.globalChannel}
                    onChange={(e) => setDraft({ ...draft, globalChannel: e.target.value })}
                    placeholder="e.g. /global 4040 or leave blank"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Community Description / Welcome Message (Optional)
                </label>
                <textarea
                  rows={2}
                  value={draft.aboutText}
                  onChange={(e) => setDraft({ ...draft, aboutText: e.target.value })}
                  placeholder="Tell players about your community, voice hangouts, or group rules..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:border-indigo-400"
                />
              </div>

              {/* Gathering Places List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold uppercase text-emerald-300">
                    Gathering Places (Root, Discord, YouTube, Twitch, Website, etc.)
                  </span>
                  {draft.places.length < 4 && (
                    <button
                      type="button"
                      onClick={handleAddPlace}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Gathering Place</span>
                    </button>
                  )}
                </div>

                {draft.places.length === 0 ? (
                  <div className="p-3 rounded-lg border border-dashed border-slate-700 text-slate-400 text-center">
                    No gathering places added yet. Click Add Gathering Place to link your Discord, Root, YouTube, or Twitch.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {draft.places.map((place, idx) => (
                      <div
                        key={place.id || idx}
                        className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <select
                            value={place.platform}
                            onChange={(e) =>
                              handleUpdatePlace(idx, {
                                platform: e.target.value as CommunityGatheringPlace['platform']
                              })
                            }
                            className="sm:col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                          >
                            {PLATFORMS.map((pl) => (
                              <option key={pl} value={pl}>
                                {pl}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={place.title}
                            onChange={(e) => handleUpdatePlace(idx, { title: e.target.value })}
                            placeholder="Title (e.g. Our Squad Discord)"
                            className="sm:col-span-4 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100"
                          />
                          <input
                            type="url"
                            value={place.url}
                            onChange={(e) => handleUpdatePlace(idx, { url: e.target.value })}
                            placeholder="https://discord.gg/... or https://youtube.com/..."
                            className="sm:col-span-4 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePlace(idx)}
                            className="sm:col-span-1 p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 flex items-center justify-center cursor-pointer"
                            title="Remove gathering place"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                          <input
                            type="text"
                            value={place.description}
                            onChange={(e) => handleUpdatePlace(idx, { description: e.target.value })}
                            placeholder="Short description shown on the card..."
                            className="sm:col-span-9 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                          />
                          <input
                            type="text"
                            value={place.ctaLabel}
                            onChange={(e) => handleUpdatePlace(idx, { ctaLabel: e.target.value })}
                            placeholder="Button text (e.g. Join Discord)"
                            className="sm:col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving to Cloud...' : 'Save Gathering Hub'}</span>
                </button>
              </div>
            </form>
          ) : !hasContent ? (
            <div className="p-5 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 text-center space-y-2">
              <div className="text-xs font-semibold text-slate-300">
                No community gathering places or in game global chat channel configured for this league yet.
              </div>
              {canEdit ? (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Configure Discord, Root, YouTube &amp; Global Chat</span>
                </button>
              ) : (
                <div className="text-[11px] font-mono text-slate-500">
                  The League Host can add their own Discord, Root, YouTube, Twitch, and in game chat channel here.
                </div>
              )}
            </div>
          ) : (
            <>
              {hubConfig.aboutText && (
                <div className="p-4 rounded-xl border border-emerald-950/80 bg-emerald-950/20 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {hubConfig.aboutText}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                {hubConfig.places.map((place) => {
                  const theme = getPlatformCardTheme(place.platform);
                  return (
                    <a
                      key={place.id}
                      href={place.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2 group ${theme.card}`}
                    >
                      <div>
                        <div className={`text-[10px] font-mono uppercase font-bold ${theme.badge}`}>
                          {place.badge || `${place.platform} Gathering Place`}
                        </div>
                        <div className="font-bold text-sm text-white mt-0.5 flex items-center gap-1.5">
                          <span>{place.title}</span>
                        </div>
                        {place.description && (
                          <p className="text-[11px] text-slate-300 mt-1">{place.description}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 text-[11px] font-mono ${theme.cta}`}>
                        <span>{place.ctaLabel || `Open ${place.platform}`}</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </a>
                  );
                })}

                {hubConfig.globalChannel && (
                  <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="text-[10px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>In Game Global Chat</span>
                      </div>
                      <div className="font-bold text-sm text-white mt-0.5 font-mono">
                        <span>{hubConfig.globalChannel}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Click below to copy the chat channel command to paste directly in Path of Exile.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => triggerCopy(hubConfig.globalChannel, 'In Game Channel')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy Channel Command</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
