import React, { useEffect } from 'react';
import { ShieldCheck, Lock, Database, FileText, Cookie, Mail } from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy Policy | Exile SSF';
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 font-sans text-slate-200">
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0e1320] via-indigo-950/30 to-[#0e1320] p-6 shadow-lg space-y-2">
        <div className="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          Data Transparency & Player Privacy
        </div>
        <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-white">
          Exile SSF Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          Last updated November 2026. Exile SSF is a community built Solo Self Found and Group Self Found companion for Path of Exile 1 and Path of Exile 2. We do not sell user data, run third party ad trackers, or store your Grinding Gear Games session cookies.
        </p>
      </header>

      <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
        <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/85 space-y-2.5">
          <h2 className="text-base font-cinzel font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>1. Information Stored in Our Cloud Database (Cloudflare D1)</span>
          </h2>
          <p className="text-slate-300">
            When you register an account or participate in a Private League on Exile SSF, we store only the information you explicitly submit:
          </p>
          <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
            <li>Account profile details (display handle, optional Path of Exile account name, optional email or Discord handle, avatar URL, and hashed password).</li>
            <li>Private League coordination entries (roster characters, wishlists, bounties, free stash listings, build guides, boss rotas, achievements, and activity feed posts).</li>
            <li>Saved Farming & Drop Tracker sessions and your cloud synced stash snapshot items (item names, quantities, tab labels, and session pace metrics) so your farming workspace syncs across your devices.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl border border-amber-500/35 bg-amber-950/15 space-y-2.5">
          <h2 className="text-base font-cinzel font-bold text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>2. Path of Exile Session Cookie (POESESSID) Policy</span>
          </h2>
          <p className="text-slate-200">
            Using your personal <code>POESESSID</code> in the Asset Tracker is <strong>100% optional</strong>. If you choose to enter your <code>POESESSID</code> to scan your Path of Exile 1 dump tabs:
          </p>
          <ul className="space-y-1.5 text-slate-200 pl-4 list-disc">
            <li>By default, your <code>POESESSID</code> stays strictly in active browser memory. If you explicitly check the opt in box to enable automated 15m, 30m, or 60m background syncs across reloads, it is saved only in your own browser's localStorage and can be erased anytime via <strong>Forget Saved POESESSID</strong>.</li>
            <li>When you acknowledge the POESESSID security disclaimer, a local timestamp is stored in your browser so the disclaimer stays hidden for <strong>30 days</strong> before prompting again (you can review or reset it anytime inside <strong>Setup &amp; Session ID</strong>).</li>
            <li>When you click Sync or Load Tabs, our Cloudflare Worker forwards the cookie directly to <code>pathofexile.com</code> over HTTPS to read your requested stash tab and immediately discards it from memory.</li>
            <li>We <strong>never</strong> store, cache, or log <code>POESESSID</code> in Cloudflare D1, Cloudflare KV, or server logs.</li>
            <li>You can invalidate your <code>POESESSID</code> at any time by signing out and back into <code>pathofexile.com</code>.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/85 space-y-2.5">
          <h2 className="text-base font-cinzel font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>3. Local Client.txt Log Parsing</span>
          </h2>
          <p className="text-slate-300">
            When you select or watch your local Path of Exile <code>Client.txt</code> file in the Farming & Drop Tracker, the file is read <strong>100% locally inside your browser</strong>. Your <code>Client.txt</code> file is never uploaded to Exile SSF servers; only the aggregate counts (maps run, duration, and deaths) are used in your session summary.
          </p>
        </section>

        <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/85 space-y-2.5">
          <h2 className="text-base font-cinzel font-bold text-white flex items-center gap-2">
            <Cookie className="w-4 h-4 text-sky-400" />
            <span>4. Cookies & Local Browser Storage</span>
          </h2>
          <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
            <li><strong>Authentication Cookie (<code>exile_session</code>):</strong> We set a single signed, <code>HttpOnly</code>, <code>Secure</code>, <code>SameSite=Lax</code> session cookie when you sign in to verify your identity on account and league updates.</li>
            <li><strong>Local Preferences:</strong> We use browser <code>localStorage</code> for non sensitive UI preferences (sidebar state, saved regex presets, custom SSF weights, and cached session state).</li>
            <li><strong>Zero Ad Tracking:</strong> Exile SSF does not include third party advertising pixels, cross site tracking cookies, or data brokers.</li>
          </ul>
        </section>

        <section className="p-5 rounded-2xl border border-slate-800 bg-slate-900/85 space-y-2.5">
          <h2 className="text-base font-cinzel font-bold text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-purple-400" />
            <span>5. Data Control, Deletion & Affiliation Notice</span>
          </h2>
          <p className="text-slate-300">
            You can clear your saved farming sessions and cloud stash state directly from the Asset Tracker toolbar at any time. To request full account or data removal, submit a request via the <strong>Changelog &amp; Feedback</strong> page while signed in.
          </p>
          <p className="text-xs text-slate-400 pt-1">
            Exile SSF is an independent fan project and is not affiliated with or endorsed by Grinding Gear Games. Path of Exile and all related assets are trademarks of Grinding Gear Games.
          </p>
        </section>
      </div>
    </div>
  );
};
