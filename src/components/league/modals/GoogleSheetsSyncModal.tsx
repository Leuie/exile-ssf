import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Link2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  FileDown
} from 'lucide-react';
import type { LeagueRosterMember, LookingForItem, LeagueFirstMilestone } from '../../../types';
import {
  exportLeagueToXlsx,
  downloadStarterSheetTemplate,
  parseCsvText,
  parseXlsxFile,
  mapRowsToRosterPreview,
  type IngestedRosterRow
} from '../../../utils/spreadsheetEngine';
import { fetchGoogleSheetCsvViaWorker } from '../../../services/cloudSync';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueId: string;
  leagueName: string;
  patchVersion: string;
  officialLeagueUrl?: string;
  globalChannel?: string;
  roster: LeagueRosterMember[];
  wishlist: LookingForItem[];
  leagueFirsts?: LeagueFirstMilestone[];
  onIngestRosterRows: (rows: IngestedRosterRow[]) => Promise<void>;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  leagueId,
  leagueName,
  patchVersion,
  officialLeagueUrl,
  globalChannel,
  roster,
  wishlist,
  leagueFirsts = [],
  onIngestRosterRows
}) => {
  const [activeMode, setActiveMode] = useState<'export' | 'import'>('export');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetTabName, setSheetTabName] = useState('');
  const [previewRows, setPreviewRows] = useState<IngestedRosterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFetchGoogleSheet = async () => {
    if (!sheetUrl.trim()) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    const res = await fetchGoogleSheetCsvViaWorker(sheetUrl.trim(), sheetTabName.trim() || undefined);
    setLoading(false);
    if (res.error || !res.csv) {
      setError(res.error || 'Could not parse Google Sheet.');
      setPreviewRows([]);
      return;
    }
    const rows = parseCsvText(res.csv);
    const mapped = mapRowsToRosterPreview(rows, roster);
    if (mapped.length === 0) {
      setError('No valid roster rows detected. Make sure row 1 has headers like Display Tag, PoE Account, Character, Build, or Planned Mechanics.');
      setPreviewRows([]);
      return;
    }
    setPreviewRows(mapped);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      let mapped: IngestedRosterRow[] = [];
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        const sheets = await parseXlsxFile(file);
        const targetSheet =
          sheets.find((sh) => sh.sheetName.toLowerCase().includes('roster')) ||
          sheets.find((sh) => sh.rows.length > 1 && sh.rows[0].length >= 3) ||
          sheets[0];
        if (targetSheet) {
          mapped = mapRowsToRosterPreview(targetSheet.rows, roster);
        }
      } else {
        const text = await file.text();
        mapped = mapRowsToRosterPreview(parseCsvText(text), roster);
      }

      if (mapped.length === 0) {
        setError('Could not detect any valid roster entries in that file. Try downloading the Exile SSF Private League Starter Sheet for exact column formatting.');
      } else {
        setPreviewRows(mapped);
      }
    } catch {
      setError('Failed to read spreadsheet file. Please upload a valid .xlsx or .csv file.');
    }
    setLoading(false);
  };

  const handleConfirmIngest = async () => {
    if (previewRows.length === 0) return;
    setIngesting(true);
    await onIngestRosterRows(previewRows);
    setIngesting(false);
    setSuccessMsg(`Successfully synced ${previewRows.length} exiles directly into Cloudflare D1!`);
    setPreviewRows([]);
    setSheetUrl('');
  };

  const newCount = previewRows.filter((r) => !r.isUpdate).length;
  const updateCount = previewRows.filter((r) => r.isUpdate).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0d1016] border border-slate-700/80 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#121620] border-b border-slate-800 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Google Sheets Export & Ingestion Hub
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export your entire league as a styled multi tab Google Sheets workbook, download the blank Starter Sheet, or ingest signups straight into Cloudflare D1.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveMode('export')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-colors ${
              activeMode === 'export'
                ? 'bg-emerald-600 text-white shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export & Starter Sheet</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('import')}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-colors ${
              activeMode === 'import'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import / Ingest Sheet</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeMode === 'export' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full League Export Card */}
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/15 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <Sparkles className="w-3 h-3" />
                    <span>5 Styled Tabs • Ready for Google Sheets</span>
                  </div>
                  <h4 className="text-sm font-black text-white">Export Live League Workbook</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Downloads a styled <strong>.xlsx</strong> workbook with dark/gold frozen headers and clickable links across 5 tabs: <strong>League Overview</strong>, <strong>Roster & Interest</strong> ({roster.length} exiles), <strong>Characters (Main + Alts)</strong>, <strong>Wishlists & Bounties</strong> ({wishlist.length} items), and <strong>League Firsts</strong>.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    In Google Sheets, click <strong>File &gt; Import &gt; Upload</strong> to open it with full formatting intact.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    exportLeagueToXlsx({
                      leagueId,
                      leagueName,
                      patchVersion,
                      officialLeagueUrl,
                      globalChannel,
                      roster,
                      wishlist,
                      leagueFirsts
                    })
                  }
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Export Live League (.xlsx)</span>
                </button>
              </div>

              {/* Blank Starter Sheet Card */}
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-950/15 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>Blank Starter Template</span>
                  </div>
                  <h4 className="text-sm font-black text-white">Exile SSF Private League Starter Sheet</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pre formatted blank Google Sheets workbook for collecting Private League Link, Roster, Launch Interest, Characters, Builds, PoB links, Planned Atlas Mechanics, and Wishlists before launch day.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Share it with your squad, then paste the Google Sheet URL in the <strong>Import / Ingest</strong> tab to populate Exile SSF automatically.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadStarterSheetTemplate}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Starter Sheet (.xlsx)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Mode A: Google Sheet URL */}
              <div className="p-4 rounded-2xl bg-[#090c11] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                  <Link2 className="w-4 h-4" />
                  <span>Option 1: Paste a Shared Google Sheets URL</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    className="sm:col-span-3 bg-[#0d1016] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={sheetTabName}
                    onChange={(e) => setSheetTabName(e.target.value)}
                    placeholder="Tab name (optional)"
                    className="bg-[#0d1016] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500">
                    Set Google Sheets sharing to "Anyone with the link can view" so Exile SSF can read it cleanly.
                  </span>
                  <button
                    type="button"
                    disabled={loading || !sheetUrl.trim()}
                    onClick={handleFetchGoogleSheet}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-black cursor-pointer"
                  >
                    {loading ? 'Fetching Sheet...' : 'Fetch & Preview'}
                  </button>
                </div>
              </div>

              {/* Mode B: File Upload */}
              <div className="p-4 rounded-2xl bg-[#090c11] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Option 2: Upload .xlsx or .csv File Directly</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Works offline or with private spreadsheets exported from Google Sheets or Excel.
                  </p>
                </div>
                <label className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white cursor-pointer text-center shrink-0">
                  <span>Choose .xlsx / .csv</span>
                  <input type="file" accept=".xlsx,.csv" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Live Diff Preview Table */}
              {previewRows.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-black text-white">
                      Preview Ready: <span className="text-emerald-400">{newCount} NEW</span> •{' '}
                      <span className="text-amber-300">{updateCount} UPDATE</span>
                    </div>
                    <button
                      type="button"
                      disabled={ingesting}
                      onClick={handleConfirmIngest}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-black cursor-pointer shadow"
                    >
                      {ingesting ? 'Syncing to Cloudflare D1...' : `Ingest ${previewRows.length} Exiles to D1`}
                    </button>
                  </div>

                  <div className="max-h-60 overflow-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead className="bg-slate-900 text-slate-400 font-mono uppercase sticky top-0">
                        <tr>
                          <th className="p-2">Action</th>
                          <th className="p-2">Tag</th>
                          <th className="p-2">PoE Account</th>
                          <th className="p-2">Interest</th>
                          <th className="p-2">Character / Build</th>
                          <th className="p-2">Mechanics</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70 bg-[#090c11]">
                        {previewRows.map((row, idx) => (
                          <tr key={idx}>
                            <td className="p-2">
                              <span
                                className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                                  row.isUpdate
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-emerald-500/20 text-emerald-300'
                                }`}
                              >
                                {row.isUpdate ? 'UPDATE' : 'NEW'}
                              </span>
                            </td>
                            <td className="p-2 font-bold text-white">@{row.displayName}</td>
                            <td className="p-2 font-mono text-slate-400">{row.poeAccountName || 'Not set'}</td>
                            <td className="p-2 text-slate-300">{row.availableAtLaunch}</td>
                            <td className="p-2 text-slate-200">
                              {row.characterName} <span className="text-slate-500">({row.buildName})</span>
                            </td>
                            <td className="p-2 text-emerald-300/90">{row.atlasContent.join(', ') || 'General'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
